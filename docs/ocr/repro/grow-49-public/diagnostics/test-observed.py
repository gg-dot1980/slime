"""Offline checks of capture retention and resume gates. No native starts."""
import base64
from hashlib import sha256
import json
from pathlib import Path
import struct
import tempfile
from unittest import TestCase, main
import zlib

from capture_store import CaptureStore
from unittest.mock import Mock, patch

from observed import Observer, VERSIONS, existing, diagnostic_baseline, diagnostic_ok

def png_url():
    def chunk(name, payload):
        return struct.pack(">I",len(payload)) + name + payload + struct.pack(">I",zlib.crc32(name+payload))
    header = struct.pack(">IIBBBBB",2250,1308,8,0,0,0,0)
    img = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR",header) + chunk(b"IDAT",zlib.compress(bytes(2251*1308))) + chunk(b"IEND",b"")
    return "data:image/png;base64," + base64.b64encode(img).decode()

class PrivateEvidenceTest(TestCase):
    def test_retention(self):
        with tempfile.TemporaryDirectory() as name:
            root = Path(name)
            sink = CaptureStore(root)
            url = png_url()
            idx = 0
            for version in ("v2.13","v2.22"):
                game = f"grow49-explore-20261127000000000/{version}/1"
                for ms, kind in [(10,"decision"),(300,"decision"),(6000,"decision"),(15100,"decision"),
                                 (15400,"decision"),(15410,"ending"),(27000,"result")]:
                    idx += 1
                    sink.accept({"id":game,"version":version,"index":idx,"kind":kind,"localTime":ms,
                                "recordAt":ms,"width":2250,"height":1308},url)
            report = sink.close()
            self.assertEqual(report["drops"],{})
            for case in report["attempts"].values():
                self.assertEqual((case["delivered"],len(case["retained"])),(7,5))
            self.assertEqual(len(list(root.rglob("*.png"))),10)
            self.assertEqual(sum('"expired-tail"' in row for row in (root/"capture-index.jsonl").read_text().splitlines()),4)

class ResumeTest(TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.root = Path(tmp.name)
        self.identity = {"source": {"observer.js": "hash"}, "environment": {"chromiumSha256": "test"}}
        self.png = png_url()
        self.out = self.root / "output"
        self.out.mkdir()
        self.sink = CaptureStore(self.out)
        self.addCleanup(self.sink.close)
        self.obs = Observer(self.out, self.sink, False, self.identity)
        self.page = Mock()
        self.page.evaluate.return_value = {"pending": 0}
        self.snap = {"recordAt": 51.2, "decisionStartedAt": 48.0, "planOutput": {"mode": "move"}}
        self.contract = {"candidate": "grow49", "candidateSha256": "hash", "runnerSha256": "runner",
                         "protocolId": "grow-native-local-20261126-v4", "candidateGeometry": "qhd"}

    def cohort(self, number=1, phase="diagnostic", verified=True):
        batch = f"grow49-{phase}-{number:017}"
        rows = [dict(type="batch", phase=phase, contract=self.contract, batchId=batch)]
        for version in VERSIONS:
            context = {"version": version, "id": f"{batch}/{version}/1"}
            rows.append(dict(type="start", **context))
            rows.append(dict(type="result", nativeStarted=True, stopVerified=verified, error=None,
                             outcome="manual-abort", diagnosticStop=True, wallMs=10005, traceTail=[self.snap], **context))
        path = self.root / (batch + ".jsonl")
        path.write_text("".join(json.dumps(r) + "\n" for r in rows))
        report = {"batchId": batch, "phase": phase, "complete": True, "integrityOk": True,
                  "rawSha256": sha256(path.read_bytes()).hexdigest()}
        path.with_name(batch + "-summary.json").write_text(json.dumps(report))
        return report

    def frame(self, report, version, **overrides):
        meta = {"id": f"{report['batchId']}/{version}/1", "version": version, "kind": "decision",
                "index": 1, "localTime": 52, "width": 2250, "height": 1308, "recordAt": 51.2,
                "decisionStart": 48.0, "decisionSnapshot": self.snap, **overrides}
        self.sink.accept(meta, self.png)

    def existing(self, identity=None):
        return existing(self.root, "hash", "runner", self.identity if identity is None else identity)

    def finish(self, report):
        with patch("observed.RESULTS", self.root):
            self.obs.after_phase(self.page, "diagnostic", report)
        return self.root / (report["batchId"] + "-capture-readiness")

    def test_legacy_and_positive_resume(self):
        legacy = self.cohort()
        self.assertEqual(self.existing(), {})
        report = self.cohort(2)
        for version in VERSIONS:
            self.frame(report, version)
        bundle = self.finish(report)
        self.assertEqual(self.existing(), {"diagnostic": report})
        self.assertEqual(self.existing({**self.identity, "source": {"observer.js": "changed"}}), {})
        self.assertTrue((self.root / (legacy["batchId"] + ".jsonl")).is_file())
        self.assertEqual(len(list(bundle.glob("*.png"))), 2)

    def test_interruption_between_native_seal_and_readiness(self):
        legacy = self.cohort()
        diagnostic_baseline(self.root, create=True)
        self.assertEqual(self.existing(), {})
        self.cohort(2)
        with self.assertRaisesRegex(RuntimeError, "sealed without capture readiness"):
            self.existing()
        self.assertTrue((self.root / (legacy["batchId"] + ".jsonl")).is_file())

    def test_missing_linked_decision(self):
        report = self.cohort()
        self.frame(report, VERSIONS[0], kind="ending")
        self.frame(report, VERSIONS[1], decisionSnapshot={**self.snap, "planOutput": {}})
        with self.assertRaisesRegex(RuntimeError, "capture readiness failed"):
            self.finish(report)
        with self.assertRaisesRegex(RuntimeError, "already failed"):
            self.existing()
        self.assertEqual(self.existing({**self.identity, "environment": {"chromiumSha256": "corrected"}}), {})

    def test_missing_version(self):
        report = self.cohort()
        self.frame(report, VERSIONS[0])
        with self.assertRaisesRegex(RuntimeError, "capture readiness failed"):
            self.finish(report)

    def test_corrupt_ready_receipt_or_files(self):
        report = self.cohort()
        for version in VERSIONS:
            self.frame(report, version)
        bundle = self.finish(report)
        for name in ("receipt.json", "v2.13.json", "v2.22.png"):
            with self.subTest(name=name):
                path = bundle / name
                original = path.read_bytes()
                path.write_bytes(original + b"x")
                with self.assertRaisesRegex(RuntimeError, "Invalid capture readiness"):
                    self.existing()
                path.write_bytes(original)
        (bundle / "v2.13.png").unlink()
        with self.assertRaisesRegex(RuntimeError, "Invalid capture readiness"):
            self.existing()

    def test_existing_explore_and_confirm(self):
        self.cohort()
        explore = self.cohort(2, "explore")
        confirm = self.cohort(3, "confirm")
        self.assertEqual(self.existing(), {"explore": explore, "confirm": confirm})
        self.cohort(4, "explore")
        with self.assertRaisesRegex(RuntimeError, "Multiple sealed explore"):
            self.existing()

    def test_unverified_release(self):
        self.cohort(verified=False)
        with self.assertRaisesRegex(RuntimeError, "unverified releases"):
            self.existing()

    def test_native_ledger_and_reservation_protections(self):
        report = self.cohort()
        path = self.root / (report["batchId"] + ".jsonl")
        rows = [json.loads(line) for line in path.read_text().splitlines() if '"result"' in line]
        self.assertTrue(diagnostic_ok(rows))
        self.assertFalse(diagnostic_ok([dict(rows[0], wallMs=4000), rows[1]]))
        self.assertRaisesRegex(RuntimeError, "incomplete or inconsistent", self.finish, dict(report, complete=False))
        path.write_text(path.read_text() + "\n")
        with self.assertRaisesRegex(RuntimeError, "incomplete or inconsistent"):
            self.existing()
        path.with_name(path.stem + "-summary.json").unlink()
        with self.assertRaisesRegex(RuntimeError, "open or interrupted"):
            self.existing()
        path.unlink()
        (self.root / "grow49-explore-00000000000000002-contract.json").write_text("{}")
        with self.assertRaisesRegex(RuntimeError, "reservation"):
            self.existing()


if __name__ == "__main__":
    main()
