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
from observed import existing, diagnostic_ok

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

    def test_sealed_or_partial(self):
        with tempfile.TemporaryDirectory() as name:
            root = Path(name); path = root/"grow49-diagnostic-20261127000000000.jsonl"
            contract = {"candidate":"grow49","candidateSha256":"hash","runnerSha256":"runner",
                        "protocolId":"grow-native-local-20261126-v4","candidateGeometry":"qhd"}
            header = dict(phase="diagnostic",contract=contract,type="batch")
            rows = [dict(type="result",version=v,nativeStarted=True,stopVerified=True,error=None,
                         outcome="manual-abort",diagnosticStop=True,wallMs=10005) for v in ("v2.13","v2.22")]
            self.assertTrue(diagnostic_ok(rows))
            self.assertFalse(diagnostic_ok([dict(rows[0],wallMs=4000),rows[1]]))
            path.write_text("".join(json.dumps(r)+"\n" for r in [header,*rows]))
            with self.assertRaisesRegex(RuntimeError,"open or interrupted"):
                existing(root,"hash","runner")
            summary = {"complete":True,"integrityOk":True,"rawSha256":sha256(path.read_bytes()).hexdigest()}
            path.with_name(path.stem+"-summary.json").write_text(json.dumps(summary))
            self.assertEqual(set(existing(root,"hash","runner")),{"diagnostic"})
            (root/"grow49-explore-20261127000000001-contract.json").write_text("{}")
            with self.assertRaisesRegex(RuntimeError,"reservation"):
                existing(root,"hash","runner")

if __name__ == "__main__":
    main()
