"""Measure Grow38 in a loopback r4 runner and optionally run its fixed natural batches."""
import argparse
import json
from urllib.parse import urlencode
from playwright.sync_api import sync_playwright

GEOMETRIES = {
    "fhd": ((1920, 1080), (1631, 948)),
    "qhd": ((2560, 1440), (2250, 1308)),
}
PHASES = ("preflight", "diagnostic", "explore", "confirm")
SOURCE = "befaf6a2c6ac1ff14596628753e509e5c15eb5bffd0e6f62f81e91b884f239ec"

def run(mode, port, through, chromium):
    outer, expected = GEOMETRIES[mode]
    url = f"http://127.0.0.1:{port}"
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(executable_path=chromium)
        page = browser.new_page(viewport={"width": outer[0], "height": outer[1]}, device_scale_factor=1)
        page.goto(url)
        page.locator("#candidateChoice:enabled").wait_for()
        manifest = page.request.get(url + "/lab/manifest").json()
        if manifest["candidates"]["grow38"]["sha256"] != SOURCE:
            raise ValueError("Unexpected Grow38 source")
        page.select_option("#candidateChoice", "grow38")
        page.bring_to_front()
        for phase in PHASES:
            control = page.locator("#" + phase)
            if not control.is_enabled():
                print("Phase unavailable:", phase)
                break
            control.click()
            page.locator("#preflight:enabled").wait_for(timeout=3_600_000 if phase != "confirm" else 10_800_000)
            status = page.locator("#status").inner_text()
            if "批次停止" in status or "失敗" in status:
                raise RuntimeError(status)
            if phase == "preflight":
                proof = json.loads(page.locator("#report").text_content())
                dims = proof["contract"]["dimensions"]
                if not (proof["starts"] == proof["nativeStarts"] == 0 and
                        tuple(dims["outer"]) == outer and tuple(dims["canvas"]) == expected and
                        dims["canvasCss"] == dims["canvas"] and dims["deviceScaleFactor"] == dims["gameDpr"] == 1 and
                        dims["canvasTransform"] == dims["gameTransform"] == "none"):
                    raise ValueError("Measured geometry differs from this cohort")
                print(json.dumps({"geometry": mode, "viewport": outer, "canvas": expected, "DPR": 1, "nativeStarts": 0}))
            else:
                batch = page.evaluate("() => window.growLocalStatus().batchId")
                result = page.request.get(url + "/lab/status?" + urlencode({"batchId": batch})).json()
                print(json.dumps({"phase": phase, "complete": result["complete"], "integrityOk": result["integrityOk"],
                                  "counts": result["counts"], "meetsGoal": result["meetsGoal"]}))
                if not result["complete"] or not result["integrityOk"]:
                    break
                if phase == "explore" and not result["eligibleForConfirm"]:
                    break
            if phase == through:
                break
        browser.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("mode", choices=GEOMETRIES)
    parser.add_argument("--port", type=int, default=4173)
    parser.add_argument("--through", choices=PHASES, default="preflight")
    parser.add_argument("--chromium", help="Optional installed Chromium executable")
    args = parser.parse_args()
    run(args.mode, args.port, args.through, args.chromium)
