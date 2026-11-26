"""Collect one predeclared terminal diagnostic per game version with Grow48.

The original candidate, games and canonical r4 directory are read-only. The
private runtime uses r4's diagnostic phase and its original end classification.
"""
import argparse
import base64
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import struct
import subprocess
import tempfile
import time
import urllib.request

from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[4]
R4 = ROOT / "docs/ocr/repro/grow-local-r4-20261126"
FILES = ["server.cjs","harness.js","index.html","ledger.cjs","protocol.json",
         "navigation.js","load-journal.cjs","visible-intake.js","candidates.json"]
BASE_HASH = "31a50609e7e159d5d8e24742c20220f271eed4bbf83525925743c74930690a5c"
CANDIDATE = "c1127a2fef754be13639f5fe96821080d4707a69b27c4dd7763b2145624b5253"
GAMES = {"v2.13":"16d41cdf2997baf0b3af33567b201d2dfb835427",
         "v2.22":"30af12f7608da91514711ecdbc01b57654ab2eab"}


def digest(data):
    return hashlib.sha256(data).hexdigest()


def read(path):
    return json.loads(path.read_bytes())


def write(path, data):
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")


def identity(directory):
    entries = [{"name":name, "sha256":digest((directory/name).read_bytes())} for name in FILES]
    return digest(json.dumps(entries, separators=(",", ":")).encode())


def replace_once(source, anchor, new):
    if source.count(anchor) != 1:
        raise ValueError("Frozen runner anchor differs")
    return source.replace(anchor, new)


def stage_runtime(output):
    assert identity(R4) == BASE_HASH
    stage = Path(tempfile.mkdtemp(prefix=".grow48-observation-", dir=R4.parent))
    ledger = output / "ledger"
    ledger.mkdir()
    (stage / "results-private").symlink_to(ledger, target_is_directory=True)
    for name in FILES:
        shutil.copyfile(R4 / name, stage / name)
    # Diagnostic only, one game per edition. Keep the original wall-time abort,
    # native settlement and 150-game-second deadline. This pair has no win gate.
    protocol = read(stage / "protocol.json")
    assert protocol["diagnosticPerVersion"] == 1 and protocol["diagnosticStopWallSeconds"] == 10
    protocol["id"] += "-terminal-observation"
    protocol["diagnosticStopWallSeconds"] = protocol["wallTimeLimitSeconds"]
    protocol["evidence"] += " Separate private observer of v2.22 visible canvas at applied decisions and ending/result."
    write(stage / "protocol.json", protocol)
    harness = (stage / "harness.js").read_text()
    harness = replace_once(harness, "async function run(phase) {\n    if(active)return;",
                           "async function run(phase) {\n    if(active || phase!=='diagnostic')return;")
    anchor = "const now=performance.now();\n        if (now-current.lastSample"
    harness = replace_once(harness, anchor,
        "window.growTerminalObserver.capture(context,'decision',gameDocument(),record);\n        " + anchor)
    anchor = "lastEvidence=evidence();\n        if(!same("
    harness = replace_once(harness, anchor,
        "lastEvidence=evidence();\n        if(lastEvidence.endingVisible || lastEvidence.resultVisible) "
        "window.growTerminalObserver.capture(context,lastEvidence.resultVisible?'result':'ending',gameDocument(),null);\n        if(!same(")
    (stage / "harness.js").write_text(harness)
    return stage, ledger


def run(args, output):
    assert digest((HERE.parent / "ocr-grow48.html").read_bytes()) == CANDIDATE
    stage, ledger = stage_runtime(output)
    frames = output / "frames"
    frames.mkdir()
    expected_commit = subprocess.check_output(["git","rev-parse","HEAD"], cwd=ROOT, text=True).strip()
    freeze = {"candidate":"grow48", "candidateSha256":CANDIDATE, "head":expected_commit,
              "gameBlobs":GAMES, "runner":identity(stage), "baseRunner":BASE_HASH,
              "observer":digest((HERE/"terminal-observer.js").read_bytes()),
              "driver":digest(Path(__file__).read_bytes()), "phase":"terminal diagnostic only",
              "order":["v2.13","v2.22"],"gamesPerVersion":1,"geometry":[2560,1440,2250,1308,1],
              "heldFrames":"v2.22 first, 15s representatives, last 5s of decisions, ending and result",
              "priorPerformanceCohort":"grow48-explore-20261126110841609"}
    write(output / "freeze.json", freeze)
    url = f"http://127.0.0.1:{args.port}"
    with (output/"server.log").open("x") as server_log:
        server = subprocess.Popen(["node","server.cjs","--geometry-mode","qhd","--port",str(args.port)],
                                  cwd=stage, env={**os.environ, "OCR_LOOPBACK_ONLY":"1"},
                                  stdout=server_log, stderr=subprocess.STDOUT)
        try:
            for _ in range(50):
                if server.poll() is not None:
                    raise RuntimeError("Local runner exited before manifest")
                try:
                    with urllib.request.urlopen(url+"/lab/manifest", timeout=1) as response:
                        manifest = json.load(response)
                    break
                except OSError:
                    time.sleep(.2)
            else:
                raise RuntimeError("Loopback runner unavailable")
            assert manifest["sourceCommit"] == expected_commit and manifest["runnerSha256"] == freeze["runner"]
            assert manifest["candidates"]["grow48"]["sha256"] == CANDIDATE
            assert {v["version"]:v["blob"] for v in manifest["versions"]} == GAMES
            with sync_playwright() as pw, (output/"frames.jsonl").open("x", buffering=1) as journal:
                browser = pw.chromium.launch(executable_path=str(args.browser), args=["--disable-dev-shm-usage"])
                page = browser.new_page(viewport={"width":2560,"height":1440},device_scale_factor=1,locale="zh-TW")
                def save(source, meta, data):
                    assert source["frame"] == page.main_frame and page.url == url+"/"
                    assert re.fullmatch(r"grow48-diagnostic-[0-9]+/v2\.22/1",meta["id"])
                    assert meta["version"]=="v2.22" and meta["kind"] in {"decision","ending","result"}
                    assert data.startswith("data:image/png;base64,")
                    content = base64.b64decode(data.split(",",1)[1], validate=True)
                    assert content.startswith(b"\x89PNG\r\n\x1a\n") and len(content) < 12_000_000
                    assert struct.unpack(">II", content[16:24]) == (meta["width"],meta["height"]) == (2250,1308)
                    file = frames / f"{int(meta['index']):06d}.png"
                    with file.open("xb") as stream:
                        stream.write(content)
                    journal.write(json.dumps({**meta,"file":file.name,"sha256":digest(content)})+"\n")
                page.expose_binding("saveGrowTerminalFrame",save)
                page.goto(url)
                page.locator("#candidateChoice:enabled").wait_for()
                page.select_option("#candidateChoice","grow48")
                page.evaluate((HERE/"terminal-observer.js").read_text())
                page.bring_to_front()
                page.click("#diagnostic")
                deadline=time.monotonic()+2*manifest["protocol"]["wallTimeLimitSeconds"]+100
                geometry_verified=False
                while not list(ledger.glob("grow48-diagnostic-*-summary.json")):
                    if not geometry_verified and list(ledger.glob("preflight-grow48-diagnostic*.json")):
                        proof=read(next(ledger.glob("preflight-grow48-diagnostic*.json")))
                        if proof["type"]=="preflight-abort":
                            raise RuntimeError("Preflight aborted; retained evidence")
                        dims=proof["contract"]["dimensions"]
                        assert dims["outer"]==[2560,1440] and dims["canvas"]==dims["canvasCss"]==[2250,1308]
                        assert dims["gameDpr"]==dims["deviceScaleFactor"]==1
                        geometry_verified=True
                    if time.monotonic()>deadline or page.is_closed():
                        raise RuntimeError("Terminal pair did not complete; preserve started records")
                    page.wait_for_timeout(1000)
                page.wait_for_function("window.growTerminalObserver.drained()", timeout=30000)
                stats=page.evaluate("window.growTerminalObserver.stats")
                write(output/"capture-stats.json",stats)
                browser.close()
            report_path,=ledger.glob("grow48-diagnostic-*-summary.json")
            report=read(report_path)
            assert report["complete"] and report["integrityOk"] and not report["eligibleForConfirm"] and not report["meetsGoal"]
            source=report_path.with_name(report_path.name.replace("-summary.json",".jsonl"))
            assert digest(source.read_bytes())==report["rawSha256"]
            print(json.dumps({"counts":report["counts"],"observer":stats,"hash":report["rawSha256"]}),flush=True)
            if stats["errors"] or stats["saved"]!=stats["started"]:
                raise RuntimeError("Incomplete observer delivery; preserve results and identify coverage gaps")
        finally:
            if server.poll() is None:
                server.terminate()
                server.wait(timeout=10)
            # Only generated copies of the frozen sources are temporary.
            # The private ledger and all started attempts live outside this stage.
            shutil.rmtree(stage)


if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--browser",required=True,type=Path)
    parser.add_argument("--out",required=True,type=Path)
    parser.add_argument("--lock",required=True,type=Path)
    parser.add_argument("--port",type=int,default=4368)
    args=parser.parse_args()
    os.umask(0o077)
    output=args.out.resolve()
    with args.lock.open("a") as lock:
        fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        output.mkdir(exist_ok=False,parents=True)
        run(args,output)
