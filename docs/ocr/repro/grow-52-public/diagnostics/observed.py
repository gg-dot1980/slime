"""Run canonical Grow52 QHD phases with a bounded visual observer."""
import argparse
from contextlib import contextmanager
import fcntl
import hashlib
import importlib.metadata
import importlib.util
import json
import os
from pathlib import Path
import shutil
import struct
import subprocess
import tempfile
import time
import urllib.request
import zlib

from capture_store import CaptureStore, FREE_FLOOR, MAX_PNG

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[4]
REPRO = ROOT / "docs/ocr/repro"
R4 = REPRO / "grow-local-r4-20261126"
NATIVE = REPRO / "grow-38-public/geometry/native.py"
RESULTS = R4 / "results-private"
VERSIONS = ("v2.13", "v2.22")
GAME_BLOBS = ("16d41cdf2997baf0b3af33567b201d2dfb835427", "30af12f7608da91514711ecdbc01b57654ab2eab")
PHASES = ("diagnostic", "explore", "confirm")
CANDIDATE = "grow52"
BASELINE = "grow52-observer-diagnostic-baseline.json"


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


def capture_identity(args, output):
    chromium = shutil.which(args.chromium) if args.chromium else None
    return {
        "source": {p.name: digest(p) for p in (HERE / "observer.js", HERE / "capture_store.py", Path(__file__), NATIVE)},
        "environment": {
            "chromiumExecutable": digest(Path(chromium)) if chromium else (args.chromium or "playwright-default"),
            "playwright": importlib.metadata.version("playwright"),
            "perAttemptMiB": args.mib_per_attempt,
            "captureSpaceAvailable": shutil.disk_usage(output).free >= FREE_FLOOR + MAX_PNG,
        },
    }


def sealed_rows(path, report, phase):
    if (report.get("batchId") != path.stem or report.get("phase") != phase or
            report.get("complete") is not True or report.get("integrityOk") is not True or
            report.get("rawSha256") != digest(path)):
        raise RuntimeError(f"Prior {phase} cohort is incomplete or inconsistent: {path.name}; no restart")
    with path.open() as stream:
        header = json.loads(stream.readline())
        rows = [json.loads(line) for line in stream] if phase == "diagnostic" else []
    if header.get("batchId") != path.stem or header.get("phase") != phase:
        raise RuntimeError(f"Prior {phase} ledger identity differs: {path.name}")
    if phase == "diagnostic":
        ids = [(v, f"{path.stem}/{v}/1") for v in VERSIONS]
        if (any([(row.get("version"), row.get("id")) for row in rows if row.get("type") == kind] != ids
                for kind in ("start", "result")) or not diagnostic_ok(rows)):
            raise RuntimeError(f"Prior diagnostic has failed starts or unverified releases: {path.name}; no restart")
    return header, rows


def native_snapshots(rows, attempt):
    snapshots = []
    for row in rows:
        if row.get("id") == attempt:
            if row["type"] == "sample":
                snapshots.append(row["snapshot"])
            elif row["type"] == "result":
                snapshots.extend(row.get("traceTail", []))
    return snapshots


def valid_qhd_png(path):
    if path.stat().st_size > MAX_PNG:
        return False
    with path.open("rb") as stream:
        if stream.read(8) != b"\x89PNG\r\n\x1a\n":
            return False
        pixels = False
        first = True
        while chunk := stream.read(8):
            if len(chunk) != 8:
                return False
            size, kind = struct.unpack(">I4s", chunk)
            if size > MAX_PNG:
                return False
            data = stream.read(size)
            if len(data) != size or stream.read(4) != struct.pack(">I", zlib.crc32(data, zlib.crc32(kind))):
                return False
            if first and (kind != b"IHDR" or size != 13 or struct.unpack(">II", data[:8]) != (2250, 1308)):
                return False
            first = False
            if kind == b"IDAT" and size:
                pixels = True
            if kind == b"IEND":
                return size == 0 and pixels and not stream.read(1)
    return False


def linked_decision(png, sidecar, attempt, snapshots):
    meta = json.loads(sidecar.read_bytes())
    snap = meta.get("decisionSnapshot")
    return (meta.get("id") == attempt and meta.get("version") == attempt.split("/")[1] and
            meta.get("kind") == "decision" and type(meta.get("index")) is int and meta["index"] > 0 and
            (meta.get("width"), meta.get("height")) == (2250, 1308) and isinstance(snap, dict) and
            isinstance(meta.get("recordAt"), (int, float)) and isinstance(meta.get("decisionStart"), (int, float)) and
            meta["recordAt"] == snap.get("recordAt") and meta["decisionStart"] == snap.get("decisionStartedAt") and
            snap in snapshots and valid_qhd_png(png))


def save_readiness(root, report, rows, sink, identity, drained):
    batch = report["batchId"]
    target = root / (batch + "-capture-readiness")
    with tempfile.TemporaryDirectory(dir=root) as scratch:
        bundle = Path(scratch) / "bundle"
        bundle.mkdir()
        receipt = {"schema": 1, "batchId": batch, "ledgerSha256": report["rawSha256"],
                   "identity": identity, "ready": False, "evidence": {}}
        for version in VERSIONS:
            attempt = f"{batch}/{version}/1"
            snapshots = native_snapshots(rows, attempt)
            for frame in sink.cases.get(attempt, {}).get("retained", {}).values():
                png, sidecar = frame["png"], frame["json"]
                if not linked_decision(png, sidecar, attempt, snapshots):
                    continue
                for source, ext in ((png, ".png"), (sidecar, ".json")):
                    shutil.copyfile(source, bundle / (version + ext))
                receipt["evidence"][version] = {"png": digest(png), "json": digest(sidecar)}
                break
        receipt["ready"] = drained and list(receipt["evidence"]) == list(VERSIONS)
        write(bundle / "receipt.json", receipt)
        (bundle / "receipt.sha256").write_text(digest(bundle / "receipt.json") + "\n")
        bundle.rename(target)
    if not receipt["ready"]:
        raise RuntimeError(f"Diagnostic capture readiness failed for {batch}; native attempts and captured evidence retained")


def read_readiness(bundle, report, rows, identity):
    try:
        path = bundle / "receipt.json"
        if digest(path) != (bundle / "receipt.sha256").read_text().strip():
            raise ValueError("receipt checksum mismatch")
        receipt = json.loads(path.read_bytes())
        evidence = receipt["evidence"]
        if (receipt["schema"] != 1 or receipt["batchId"] != report["batchId"] or
                receipt["ledgerSha256"] != report["rawSha256"] or type(receipt["ready"]) is not bool or
                not isinstance(receipt["identity"], dict) or set(evidence) - set(VERSIONS) or
                (receipt["ready"] and set(evidence) != set(VERSIONS))):
            raise ValueError("receipt identity, status or evidence list mismatch")
        for version, hashes in evidence.items():
            png, sidecar = bundle / (version + ".png"), bundle / (version + ".json")
            attempt = f"{report['batchId']}/{version}/1"
            if (hashes != {"png": digest(png), "json": digest(sidecar)} or
                    not linked_decision(png, sidecar, attempt, native_snapshots(rows, attempt))):
                raise ValueError(f"evidence mismatch for {version}")
    except (OSError, KeyError, TypeError, ValueError) as error:
        raise RuntimeError(f"Invalid capture readiness evidence for {report['batchId']}: {error}") from error
    return receipt["ready"] if receipt["identity"] == identity else None


def diagnostic_baseline(results, create=False):
    path = results / BASELINE
    if not path.exists() and create:
        legacy = {ledger.name: digest(ledger) for ledger in results.glob(f"{CANDIDATE}-diagnostic-*.jsonl")
                  if not ledger.with_name(ledger.stem + "-capture-readiness").exists()}
        with tempfile.TemporaryDirectory(dir=results) as scratch:
            staged = Path(scratch) / BASELINE
            write(staged, legacy)
            os.link(staged, path)  # Publish once, before a repaired diagnostic can start.
    if not path.exists():
        return None
    legacy = json.loads(path.read_bytes())
    if not isinstance(legacy, dict):
        raise RuntimeError("Invalid native-only diagnostic baseline")
    for name, sha in legacy.items():
        ledger = results / name
        if (ledger.parent != results or not ledger.match(f"{CANDIDATE}-diagnostic-*.jsonl") or
                not ledger.is_file() or digest(ledger) != sha):
            raise RuntimeError(f"Missing or changed baseline diagnostic: {name}")
    return legacy


def existing(results, candidate_sha, expected_runner, identity):
    sealed = {}
    failed = []
    legacy = diagnostic_baseline(results)
    for bundle in results.glob(f"{CANDIDATE}-diagnostic-*-capture-readiness"):
        if not bundle.with_name(bundle.name.removesuffix("-capture-readiness") + ".jsonl").is_file():
            raise RuntimeError(f"Capture readiness evidence lacks its native ledger: {bundle.name}")
    for phase in PHASES:
        ledgers = sorted(results.glob(f"{CANDIDATE}-{phase}-*.jsonl"))
        for receipt in results.glob(f"{CANDIDATE}-{phase}-*-contract.json"):
            expected_ledger = receipt.with_name(receipt.name.removesuffix("-contract.json") + ".jsonl")
            if not expected_ledger.exists():
                raise RuntimeError(f"Prior {phase} reservation lacks its ledger: {receipt.name}; no restart")
        for path in ledgers:
            summary_path = path.with_name(path.stem + "-summary.json")
            if not summary_path.exists():
                raise RuntimeError(f"Prior {phase} ledger is still open or interrupted: {path.name}; no restart")
            report = json.loads(summary_path.read_bytes())
            header, rows = sealed_rows(path, report, phase)
            contract = header["contract"]
            if (header["phase"] != phase or contract["candidate"] != CANDIDATE or
                    contract["candidateSha256"] != candidate_sha or contract["runnerSha256"] != expected_runner or
                    contract["protocolId"] != "grow-native-local-20261126-v4" or contract["candidateGeometry"] != "qhd"):
                raise RuntimeError(f"Prior {phase} contract differs: {path.name}; inspect before proceeding")
            if phase == "diagnostic":
                bundle = results / (path.stem + "-capture-readiness")
                if not bundle.exists():
                    if legacy is not None and path.name not in legacy:
                        raise RuntimeError(f"Diagnostic sealed without capture readiness evidence: {path.name}; inspect before proceeding")
                    continue  # A pre-repair native-only diagnostic remains in the ledger.
                ready = read_readiness(bundle, report, rows, identity)
                if ready is not True:
                    if ready is False:
                        failed.append(path.stem)
                    continue
            if phase in sealed:
                raise RuntimeError(f"Multiple sealed {phase} cohorts; inspect their identity before proceeding")
            sealed[phase] = report
    if failed and not ({"explore", "confirm"} & sealed.keys()):
        raise RuntimeError(f"A diagnostic already failed capture readiness under these conditions: {', '.join(failed)}")
    return sealed


class Observer:
    def __init__(self, output, sink, skip_diagnostic, identity):
        self.output = output
        self.sink = sink
        self.skip_diagnostic = skip_diagnostic
        self.identity = identity
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
            raw = RESULTS / (report["batchId"] + ".jsonl")
            _, rows = sealed_rows(raw, report, phase)
            drained = "coverageError" not in stats and stats.get("pending") == 0
            save_readiness(RESULTS, report, rows, self.sink, self.identity, drained)


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
    number = CANDIDATE.removeprefix("grow")
    html = REPRO / f"grow-{number}-public" / f"ocr-grow{number}.html"
    cand_hash = digest(html)
    checked = json.loads(subprocess.check_output(["node", "server.cjs", "--geometry-mode", "qhd", "--check"], cwd=R4))
    if (checked["candidates"][CANDIDATE]["sha256"] != cand_hash or
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
    identity = capture_identity(args, output)
    found = existing(RESULTS, cand_hash, checked["runnerSha256"], identity)
    write(output / "prior-diagnostics.json", [p.stem for p in sorted(RESULTS.glob(f"{CANDIDATE}-diagnostic-*.jsonl"))])
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
    if args.through != "preflight" and "diagnostic" not in found:
        diagnostic_baseline(RESULTS, create=True)
    spec = importlib.util.spec_from_file_location("grow52_native", NATIVE)
    native = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(native)
    sink = CaptureStore(output, args.mib_per_attempt)
    observer = Observer(output, sink, "diagnostic" in found, identity)
    try:
        with server(args.port, output) as manifest:
            if manifest["runnerSha256"] != checked["runnerSha256"] or manifest["candidates"] != checked["candidates"]:
                raise RuntimeError("Served local manifest differs from source checks")
            if manifest.get("sourceCommit") != head:
                raise RuntimeError(f"Run from the committed {CANDIDATE} checkout")
            write(output / "freeze.json", {"phaseLimit":args.through, "candidateSha256":cand_hash,
                    "manifest":manifest, "driverSha256":digest(NATIVE), "observerSha256":digest(HERE/"observer.js"),
                    "captureStoreSha256":digest(HERE/"capture_store.py"), "observedDriverSha256":digest(Path(__file__)),
                    "perAttemptMiB":args.mib_per_attempt})
            native.run("qhd", args.port, args.through, args.chromium, CANDIDATE, "zh-TW", observer)
    finally:
        write(output / "retention.json", sink.close())
        # Include open, completed and zero-start artifacts even when startup or a phase failed.
        saved = output / "ledger"
        saved.mkdir()
        changed = set(RESULTS.iterdir()) - before
        if (RESULTS / BASELINE).is_file():
            changed.add(RESULTS / BASELINE)
        for path in sorted(changed):
            if path.is_file():
                shutil.copy2(path, saved / path.name)
            elif path.name.endswith("-capture-readiness") and path.is_dir():
                shutil.copytree(path, saved / path.name)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", required=True, type=Path, help="Fresh private output directory")
    parser.add_argument("--lock", required=True, type=Path, help="The shared natural runner lock")
    parser.add_argument("--chromium", help="Installed Chromium executable")
    parser.add_argument("--port", type=int, default=4173)
    parser.add_argument("--mib-per-attempt", type=int, default=96)
    parser.add_argument("--candidate", choices=("grow52",), default="grow52")
    parser.add_argument("--through", choices=("preflight","diagnostic","confirm"), default="preflight",
                        help="confirm keeps eligible exploration and confirmation in one page")
    args = parser.parse_args()
    CANDIDATE = args.candidate
    BASELINE = f"{CANDIDATE}-observer-diagnostic-baseline.json"
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
