"""Keep private first, 15-second, rolling terminal and overlay PNGs for each attempt."""
import base64
from collections import defaultdict
import hashlib
import json
import math
from pathlib import Path
import re
import shutil
import struct

ID = re.compile(r"grow(?:49|50)-(diagnostic|explore|confirm)-[0-9]+/(v2\.13|v2\.22)/([1-9][0-9]*)\Z")
MAX_PNG = 12_000_000
FREE_FLOOR = 128 * 1024 * 1024


class CaptureStore:
    def __init__(self, output, mib=96):
        if not 32 <= mib <= 256:
            raise ValueError("Frame allowance must be 32–256 MiB per attempt")
        self.limit = mib * 1024 * 1024
        self.root = Path(output)
        self.index = (self.root / "capture-index.jsonl").open("x", buffering=1)
        self.cases = {}
        self.drops = defaultdict(int)

    def log(self, row):
        self.index.write(json.dumps(row, separators=(",", ":")) + "\n")

    def accept(self, meta, url):
        match = ID.fullmatch(meta["id"])
        if not match or match[2] != meta["version"] or int(match[3]) > {"diagnostic":1,"explore":4,"confirm":12}[match[1]]:
            raise ValueError("Unexpected attempt identity")
        index, kind, clock = meta["index"], meta["kind"], float(meta["localTime"])
        if type(index) is not int or index <= 0 or not math.isfinite(clock):
            raise ValueError("Invalid capture index or clock")
        if kind not in ("decision", "ending", "result") or (meta["width"], meta["height"]) != (2250,1308):
            raise ValueError("Unexpected view or geometry")
        prefix = "data:image/png;base64,"
        if not url.startswith(prefix) or len(url) > len(prefix) + (MAX_PNG + 2) // 3 * 4:
            raise ValueError("Unexpected PNG encoding or size")
        png = base64.b64decode(url[len(prefix):], validate=True)
        if len(png) > MAX_PNG or png[:16] != b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR" or struct.unpack(">II", png[16:24]) != (2250,1308):
            raise ValueError("Unexpected PNG header")
        case = self.cases.setdefault(meta["id"], {"origin":None, "newest":None, "buckets":set(),
                                         "retained":{}, "seen":set(), "bytes":0, "decisions":0})
        if index in case["seen"]:
            raise ValueError("Duplicate capture index")
        case["seen"].add(index)
        if kind == "decision":
            case["newest"] = clock if case["newest"] is None else max(clock, case["newest"])
            case["decisions"] += 1
            if case["origin"] is None:
                case["origin"] = clock
        for old_index, old in tuple(case["retained"].items()):
            if kind == "decision" and old["role"] == "tail" and old["time"] < case["newest"] - 5000:
                old["png"].unlink()
                old["json"].unlink()
                case["bytes"] -= old["bytes"]
                del case["retained"][old_index]
                self.log({"id":meta["id"], "index":old_index, "event":"expired-tail"})
        role = kind
        bucket = None
        if kind == "decision":
            bucket = max(0, int((clock - case["origin"]) // 15000))
            role = ("first" if bucket == 0 else "15s") if bucket not in case["buckets"] else "tail"
        desc = (json.dumps(meta, ensure_ascii=False, separators=(",", ":"))+"\n").encode()
        size = len(png) + len(desc)
        reserved = 2 * (MAX_PNG + 65_536) if kind == "decision" else 0
        reason = None
        if role == "tail" and clock < case["newest"] - 5000:
            reason = "late-outside-tail"
        elif size + case["bytes"] > self.limit - reserved:
            reason = "per-attempt-byte-cap"
        elif shutil.disk_usage(self.root).free < FREE_FLOOR + size:
            reason = "disk-free-floor"
        row = {"id":meta["id"], "index":index, "kind":kind, "localTime":clock,
               "recordAt":meta.get("recordAt"), "sha256":hashlib.sha256(png).hexdigest(), "role":role}
        if reason:
            self.drops[reason] += 1
            self.log({**row,"event":"dropped","reason":reason})
            return
        folder = self.root / "frames" / meta["id"]
        folder.mkdir(parents=True, exist_ok=True)
        png_path, json_path = folder / f"{index:06}.png", folder / f"{index:06}.json"
        with png_path.open("xb") as stream:
            stream.write(png)
        try:
            with json_path.open("xb") as stream:
                stream.write(desc)
        except Exception:
            png_path.unlink()
            raise
        if bucket is not None:
            case["buckets"].add(bucket)
        case["bytes"] += size
        case["retained"][index] = {"role":role,"time":clock,"png":png_path,"json":json_path,"bytes":size}
        self.log({**row,"event":"retained","file":str(png_path.relative_to(self.root))})

    def close(self):
        self.index.close()
        return {"drops":dict(self.drops), "perAttemptByteLimit":self.limit, "diskFreeFloor":FREE_FLOOR,
                "attempts":{name:{"delivered":len(case["seen"]), "decisions":case["decisions"],
                            "retainedBytes":case["bytes"], "retained":sorted(case["retained"])}
                            for name,case in self.cases.items()}}
