"""Verify committed-frame observation in Chromium using the real zero-start preflight."""
import argparse
from hashlib import sha256
import json
from pathlib import Path
import shutil
import socket
from tempfile import TemporaryDirectory
from unittest.mock import patch

from playwright.sync_api import sync_playwright

from capture_store import CaptureStore
import observed


def test(chromium, root):
    # Keep the canonical server's transport and preflight files in the fixture.
    repro = root / "checkout/docs/ocr/repro"
    r4 = repro / observed.R4.name
    shutil.copytree(observed.R4, r4, ignore=shutil.ignore_patterns("results-private", "node_modules"))
    (root / "checkout/src").symlink_to(observed.ROOT / "src", target_is_directory=True)
    for candidate in json.loads((r4 / "candidates.json").read_text()):
        folder = "grow-" + candidate.removeprefix("grow") + "-public"
        (repro / folder).symlink_to(observed.REPRO / folder, target_is_directory=True)
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        port = sock.getsockname()[1]
    url = f"http://127.0.0.1:{port}"
    sink = CaptureStore(root)
    with patch.object(observed, "R4", r4), observed.server(port, root), sync_playwright() as playwright:
        browser = playwright.chromium.launch(executable_path=chromium, args=["--disable-dev-shm-usage"])
        page = browser.new_page(viewport={"width":2560, "height":1440}, device_scale_factor=1, locale="zh-TW")
        identity = observed.capture_identity(argparse.Namespace(chromium=chromium, mib_per_attempt=96), root)
        observed.Observer(root, sink, False, identity).attach(page, url)
        page.goto(url)
        page.locator("#candidateChoice:enabled").wait_for()
        page.select_option("#candidateChoice", "grow49")
        page.click("#preflight")
        page.locator("#preflight:enabled").wait_for(timeout=120000)
        proof = json.loads(page.locator("#report").text_content())
        assert proof["starts"] == proof["nativeStarts"] == 0 and proof["setupLoadCount"] == 12
        assert proof["contract"]["dimensions"]["canvas"] == [2250, 1308]

        test_batch = "grow49-diagnostic-10000000000000000"
        for version in observed.VERSIONS:
            page.evaluate("""version => {
              const select = document.getElementById('candidate').contentDocument.getElementById('gameChoice');
              if (select.value !== '/' + version) {
                select.value = '/' + version;
                select.dispatchEvent(new Event('change', {bubbles:true}));
              }
            }""", version)
            page.wait_for_function("""v => {
              const w = document.getElementById('candidate').contentWindow;
              return w.document.getElementById('game').contentDocument?.location.pathname === '/' + v
                && !w.document.getElementById('go').disabled;
            }""", arg=version)
            # The real candidate/game stay idle. Only the public observer receives
            # a test identity and test record. No harness/native record is written.
            check = page.evaluate("""([batchId, version]) => {
              const w = document.getElementById('candidate').contentWindow;
              const game = w.document.getElementById('game').contentDocument;
              const state = w.ocrLabStatus();
              if (state.active || state.held.length || game.querySelector('#overlay.hidden'))
                throw Error('Expected idle game and released controller');
              if (typeof Object.getOwnPropertyDescriptor(w,'ocrTestRecord')?.get !== 'function')
                throw Error('No record accessor on committed candidate');
              const status = window.growLocalStatus;
              const previous = w.ocrTestRecord;
              let latest = null;
              window.growLocalStatus = () => ({active:true, batchId,
                current:{id:batchId + '/' + version + '/1', version}, latest});
              try {
                const fn = r => { latest = {recordAt:r.recordAt, decisionStartedAt:r.ms}; return 17; };
                w.ocrTestRecord = fn;
                return w.ocrTestRecord !== fn && w.ocrTestRecord({recordAt:20, ms:10}) === 17;
              } finally {
                w.ocrTestRecord = previous;
                window.growLocalStatus = status;
              }
            }""", [test_batch,version])
            assert check
            page.wait_for_function("() => grow49Observer.drained()")
        stats = page.evaluate("() => grow49Observer.stats()")
        assert (stats["decisions"], stats["saved"], stats["failed"], stats["pending"]) == (2, 2, 0, 0)
        assert page.request.get(url + "/lab/status").json()["batches"] == []
        browser.close()
    retention = sink.close()
    index = [json.loads(line) for line in (root / "capture-index.jsonl").read_text().splitlines()]
    assert len(index) == 2 and not retention["drops"]
    for version, row in zip(observed.VERSIONS, index, strict=True):
        assert row["event"] == "retained" and row["id"] == test_batch + "/" + version + "/1"
        png = root / row["file"]
        assert sha256(png.read_bytes()).hexdigest() == row["sha256"]
        sidecar = json.loads(png.with_suffix(".json").read_bytes())
        assert (sidecar["kind"], sidecar["version"], sidecar["recordAt"]) == ("decision", version, 20)
        expected = {"recordAt":20, "decisionStartedAt":10}
        assert sidecar["decisionSnapshot"] == expected
        assert observed.linked_decision(png, png.with_suffix(".json"), row["id"], [expected])
    return {"canonicalPreflightStarts":0, "naturalBatches":0, "fixtureSaved":stats["saved"],
            "fixtureFailures":stats["failed"], "verifiedVersions":list(observed.VERSIONS)}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--chromium", help="Installed Chromium executable")
    args = parser.parse_args()
    with TemporaryDirectory() as temp:
        print(json.dumps(test(args.chromium, Path(temp))))
