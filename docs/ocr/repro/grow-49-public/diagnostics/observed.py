"""Run canonical Grow49 QHD phases with a private, bounded visual observer."""
import argparse
from contextlib import contextmanager
import fcntl
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import time
import urllib.request

from capture_store import CaptureStore

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[4]
REPRO = ROOT / "docs/ocr/repro"
R4 = REPRO / "grow-local-r4-20261126"
NATIVE = REPRO / "grow-38-public/geometry/native.py"
RESULTS = R4 / "results-private"
VERSIONS = ("v2.13", "v2.22")
GAME_BLOBS = ("16d41cdf2997baf0b3af33567b201d2dfb835427", "30af12f7608da91514711ecdbc01b57654ab2eab")
PHASES = ("diagnostic", "explore", "confirm")


def digest(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def write(path, obj):
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + "\n")


def diagnostic_ok(rows):
    results = [r for r in rows if r.get("type") == "result"]
    if [r["version"] for r in results] != list(VERSIONS):
        return False
    return all(r.get("nativeStarted") and r.get("stopVerified") and r.get("error") is None
               and (r["outcome"] in ("win", "late-win", "death", "game-timeout", "deadline")
                    or (r["outcome"] == "manual-abort" and r.get("diagnosticStop") and (r.get("wallMs") or 0) >= 10_000)) for r in results)


def existing(results, candidate_sha, expected_runner):
    sealed = {}
    for phase in PHASES:
        ledgers = sorted(results.glob(f"grow49-{phase}-*.jsonl"))
        for receipt in results.glob(f"grow49-{phase}-*-contract.json"):
            expected_ledger = receipt.with_name(receipt.name.removesuffix("-contract.json") + ".jsonl")
            if not expected_ledger.exists():
                raise RuntimeError(f"Prior {phase} reservation lacks its ledger: {receipt.name}; no restart")
        for path in ledgers:
            summary_path = path.with_name(path.stem + "-summary.json")
            if not summary_path.exists():
                raise RuntimeError(f"Prior {phase} ledger is still open or interrupted: {path.name}; no restart")
            report = json.loads(summary_path.read_bytes())
            if not report["complete"] or not report["integrityOk"] or report["rawSha256"] != digest(path):
                raise RuntimeError(f"Prior {phase} cohort is incomplete or inconsistent: {path.name}; no restart")
            with path.open() as stream:
                header = json.loads(stream.readline())
                rows = [json.loads(s) for s in stream] if phase == "diagnostic" else []
            contract = header["contract"]
            if (header["phase"] != phase or contract["candidate"] != "grow49" or
                    contract["candidateSha256"] != candidate_sha or contract["runnerSha256"] != expected_runner or
                    contract["protocolId"] != "grow-native-local-20261126-v4" or contract["candidateGeometry"] != "qhd"):
                raise RuntimeError(f"Prior {phase} contract differs: {path.name}; inspect before proceeding")
            if phase in sealed:
                raise RuntimeError(f"Multiple sealed {phase} cohorts; inspect their identity before proceeding")
            if phase == "diagnostic" and not diagnostic_ok(rows):
                raise RuntimeError(f"Prior diagnostic has failed starts or unverified releases: {path.name}; no restart")
            sealed[phase] = report
    return sealed


class Observer:
    def __init__(self, output, sink, skip_diagnostic):
        self.output = output
        self.sink = sink
        self.skip_diagnostic = skip_diagnostic
        self.page = None

    def attach(self, page, manifest_url):
        self.page = page

        def deliver(source, meta, png):
            if source["frame"] != page.main_frame or page.url != manifest_url + "/":
                raise ValueError("Unexpected frame binding origin")
            self.sink.accept(meta, png)

        page.expose_binding("saveGrow49Frame", deliver)
        page.add_init_script(path=str(HERE / "observer.js"))

    def after_phase(self, page, phase, report):
        write(self.output / f"{phase}-native-summary.json", report)
        try:
            page.wait_for_function("() => window.grow49Observer.drained()", timeout=30_000)
            stats = page.evaluate("() => window.grow49Observer.stats()")
        except Exception as error:
            stats = {"coverageError": str(error)[:800]}
            try:
                stats["lastVisibleCounters"] = page.evaluate("() => window.grow49Observer.stats()")
            except Exception:
                pass
        write(self.output / f"{phase}-capture-stats.json", stats)
        if phase == "diagnostic":
            if "coverageError" in stats:
                raise RuntimeError("Diagnostic capture did not drain; both native attempts retained")
            raw = RESULTS / (report["batchId"] + ".jsonl")
            rows = [json.loads(line) for line in raw.read_bytes().splitlines()]
            expected = [r["id"] for r in rows if r.get("type") == "start"]
            if not diagnostic_ok(rows) or not all(self.sink.cases.get(key, {}).get("retained") for key in expected):
                raise RuntimeError("Diagnostic failed native start/release or image readiness; retained both attempts")


@contextmanager
def server(port, output):
    log = (output / "server.log").open("x")
    proc = subprocess.Popen(["node", "server.cjs", "--geometry-mode", "qhd", "--port", str(port)],
                            cwd=R4, env={**os.environ, "OCR_LOOPBACK_ONLY":"1"}, stdout=log, stderr=subprocess.STDOUT)
    try:
        url = f"http://127.0.0.1:{port}"
        for _ in range(50):
            if proc.poll() is not None:
                raise RuntimeError("Canonical server failed to start; see server.log")
            try:
                with urllib.request.urlopen(url + "/lab/manifest", timeout=1) as response:
                    manifest = json.load(response)
                break
            except OSError:
                time.sleep(.2)
        else:
            raise RuntimeError("Canonical server did not return a manifest")
        # Confirm that this process owns the listening socket, even if the chosen port was occupied.
        if f"Open {url} in a desktop browser." not in (output / "server.log").read_text():
            raise RuntimeError("Manifest did not come from the newly launched server")
        yield manifest
    finally:
        if proc.poll() is None:
            proc.terminate()
            proc.wait(timeout=10)
        log.close()


def run(args, output):
    html = HERE.parent / "ocr-grow49.html"
    cand_hash = digest(html)
    checked = json.loads(subprocess.check_output(["node", "server.cjs", "--geometry-mode", "qhd", "--check"], cwd=R4))
    if (checked["candidates"]["grow49"]["sha256"] != cand_hash or
            tuple(v["blob"] for v in checked["versions"]) != GAME_BLOBS):
        raise RuntimeError("Frozen candidate or original game blob differs")
    # Tie runtime bytes to the actual repository snapshot, including original r4
    # source and both scripts whose optional callbacks perform private observation.
    pinned = [NATIVE, html, HERE / "observer.js", HERE / "capture_store.py", Path(__file__).resolve()]
    pinned += [R4 / name for name in ("server.cjs", "harness.js", "index.html", "ledger.cjs", "protocol.json",
                    "navigation.js", "load-journal.cjs", "visible-intake.js", "candidates.json")]
    head = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
    for path in pinned:
        rel = path.relative_to(ROOT).as_posix()
        committed = subprocess.check_output(["git", "rev-parse", head + ":" + rel], cwd=ROOT, text=True).strip()
        actual = subprocess.check_output(["git", "hash-object", str(path)], cwd=ROOT, text=True).strip()
        if actual != committed:
            raise RuntimeError(f"Working and committed source differ: {rel}")
    found = existing(RESULTS, cand_hash, checked["runnerSha256"])
    write(output / "prior-phases.json", {p:r["batchId"] for p,r in found.items()})
    if "confirm" in found or "explore" in found:
        if "confirm" in found:
            msg = "Confirmation already sealed; see its independent counts and meetsGoal."
        elif found["explore"]["eligibleForConfirm"]:
            msg = "Eligible exploration belongs to its original live page/server; resume there. A fresh process cannot reuse its full contract."
        else:
            msg = "Exploration already sealed and ineligible for confirmation."
        write(output / "existing-outcome.json", {"message":msg,"sealed":found})
        print(msg, flush=True)
        return
    if args.through == "diagnostic" and "diagnostic" in found:
        print("Diagnostic already sealed; no new native starts.", flush=True)
        return
    RESULTS.mkdir(exist_ok=True)
    before = set(RESULTS.iterdir())
    spec = importlib.util.spec_from_file_location("grow49_native", NATIVE)
    native = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(native)
    sink = CaptureStore(output, args.mib_per_attempt)
    observer = Observer(output, sink, "diagnostic" in found)
    try:
        with server(args.port, output) as manifest:
            if manifest["runnerSha256"] != checked["runnerSha256"] or manifest["candidates"] != checked["candidates"]:
                raise RuntimeError("Served local manifest differs from source checks")
            if manifest.get("sourceCommit") != head:
                raise RuntimeError("Run from the committed Grow49 checkout")
            write(output / "freeze.json", {"phaseLimit":args.through, "candidateSha256":cand_hash,
                    "manifest":manifest, "driverSha256":digest(NATIVE), "observerSha256":digest(HERE/"observer.js"),
                    "captureStoreSha256":digest(HERE/"capture_store.py"), "observedDriverSha256":digest(Path(__file__)),
                    "perAttemptMiB":args.mib_per_attempt})
            native.run("qhd", args.port, args.through, args.chromium, "grow49", "zh-TW", observer)
    finally:
        write(output / "retention.json", sink.close())
        # Include open, completed and zero-start artifacts even when startup or a phase failed.
        saved = output / "ledger"
        saved.mkdir()
        for path in sorted(set(RESULTS.iterdir()) - before):
            if path.is_file():
                shutil.copy2(path, saved / path.name)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", required=True, type=Path, help="Fresh private output directory")
    parser.add_argument("--lock", required=True, type=Path, help="The shared natural runner lock")
    parser.add_argument("--chromium", help="Installed Chromium executable")
    parser.add_argument("--port", type=int, default=4173)
    parser.add_argument("--mib-per-attempt", type=int, default=96)
    parser.add_argument("--through", choices=("preflight","diagnostic","confirm"), default="preflight",
                        help="confirm keeps eligible exploration and confirmation in one page")
    args = parser.parse_args()
    os.umask(0o077)
    with args.lock.open("a") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        output = args.out.resolve()
        output.mkdir(parents=True, exist_ok=False)
        try:
            run(args, output)
        except BaseException as exc:
            write(output / "interruption.json", {"exception":type(exc).__name__, "message":str(exc)[:1200]})
            raise
