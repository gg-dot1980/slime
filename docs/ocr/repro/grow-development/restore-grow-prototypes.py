"""Restore and verify source variants against the canonical OCR candidate HTMLs."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import tempfile

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("canonical_root", type=Path, help="Directory containing grow-N-public/ocr-growN.html")
parser.add_argument("--output", type=Path, help="Create a new directory and keep restored variants there")
args = parser.parse_args()
materials = Path(__file__).resolve().parent
sha256 = lambda data: hashlib.sha256(data).hexdigest()

def verify(data, expected):
    blob = hashlib.sha1(b"blob " + str(len(data)).encode() + b"\0" + data).hexdigest()
    if sha256(data) != expected["sha256"] or blob != expected["gitBlobSha1"]:
        raise SystemExit("Source digest mismatch: " + expected["name"])

def restore(out):
    names = json.loads((materials / "sources-grow30-37-41-42.json").read_text())
    count = 0
    for item in names:
        number = item["candidate"]
        src = materials / f"grow-{number}"
        metadata = json.loads((src / "prototype-sources.json").read_text())
        directory = out / f"grow-{number}"
        directory.mkdir()
        canonical = metadata["canonical"]
        original = args.canonical_root / f"grow-{number}-public" / canonical["name"]
        verify(original.read_bytes(), canonical)
        ancestors = {canonical["name"]: original}
        for row in metadata["variants"]:
            dest = directory / row["name"]
            if "identicalTo" in row:
                dest.write_bytes(ancestors[row["identicalTo"]].read_bytes())
            else:
                patch = src / row["patch"]
                if sha256(patch.read_bytes()) != row["patchSha256"]:
                    raise SystemExit("Patch digest mismatch: " + patch.name)
                subprocess.run(["patch", "--batch", "--silent", "--fuzz=0", "-o", str(dest),
                                str(ancestors[row["base"]]), str(patch)], check=True)
            verify(dest.read_bytes(), row)
            ancestors[row["name"]] = dest
            count += 1
        for row in metadata["supportingCode"]:
            verify((src / row["name"]).read_bytes(), row)
    print(f"Verified {count} exact source variants across {len(names)} candidates.")

if args.output:
    args.output.mkdir(parents=True, exist_ok=False)
    restore(args.output)
else:
    with tempfile.TemporaryDirectory() as temp:
        restore(Path(temp))
