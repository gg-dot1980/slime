"""Exercise two real touch contacts in the archived games. Diagnostic starts only."""

import argparse
import hashlib
import json
import os
from pathlib import Path
from statistics import linear_regression
from urllib.parse import urlsplit

from playwright.sync_api import sync_playwright

from touch import TouchAdapter


GAMES = {
    "v2.13": ("game-v2.13.html", "16d41cdf2997baf0b3af33567b201d2dfb835427"),
    "v2.22": ("game.html", "30af12f7608da91514711ecdbc01b57654ab2eab"),
}
ORIGIN = "http://mobile-diagnostic.invalid"
PARENT = """<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{margin:0}iframe{position:absolute;left:8px;top:34px;border:1px solid;
width:384px;height:467px}</style><iframe id="game" src="/original"></iframe>"""

OBSERVE = """() => {
  const events = [];
  const held = new Map();
  const root = e => e.target.closest?.('#joy,#boost')?.id || e.target.id || '';
  for (const type of ['pointerdown','pointerup','pointercancel','touchstart','touchend',
                      'touchcancel','keydown','keyup']) {
    addEventListener(type, e => {
      const el = root(e);
      if (type === 'pointerdown') held.set(e.pointerId, el);
      if (type === 'pointerup' || type === 'pointercancel') held.delete(e.pointerId);
      events.push({type, el, trusted:e.isTrusted, kind:e.pointerType,
                   id:e.pointerId, count:e.touches?.length, key:e.key});
    }, {capture:true, passive:true});
  }
  window.readMobileSmoke = () => {
    const m = new DOMMatrixReadOnly(getComputedStyle(document.querySelector('#nub')).transform);
    return {events:[...events], held:[...held.values()].sort(), nub:[m.e,m.f],
            ended:document.querySelector('#gameEnding')?.classList.contains('visible') ||
                  !document.querySelector('#overlay').classList.contains('hidden')};
  };
}"""

# Both games draw the mint marker and its centered viewport outline last. Sample
# those visible pixels inside the minimap, excluding the border, labels and HUD.
MINIMAP = """() => {
  const canvas = document.querySelector('#world'), w = canvas.width;
  const mw = Math.min(144,w*.26), left = Math.ceil(w-mw-15)+1, top = 71;
  const width = Math.floor(mw)-2, height = Math.floor(mw*7200/10400)-2;
  const pixels = canvas.getContext('2d').getImageData(left,top,width,height).data;
  let x=0, y=0, n=0;
  for(let i=0;i<pixels.length;i+=4) {
    if(pixels[i]!==163 || pixels[i+1]!==243 || pixels[i+2]!==209) continue;
    x+=(i/4)%width+left+.5; y+=Math.floor(i/4/width)+top+.5; n++;
  }
  if(n<8) throw Error('No readable player marker');
  return {t:performance.now()/1000,x:x/n,y:y/n,pixels:n};
}"""


def require(ok, message):
    if not ok:
        raise ValueError(message)


def input_change(page, touch, *changes):
    page.evaluate("""changes => {
      const win = document.querySelector('#game').contentWindow;
      for (const [type,key] of changes) {
        win.dispatchEvent(new win.KeyboardEvent(type,{key,bubbles:true,cancelable:true}));
      }
    }""", changes)
    touch.pump()


def sample_motion(frame):
    frame.wait_for_timeout(600)  # Let the on-screen movement settle.
    samples = []
    for _ in range(15):
        samples.append(frame.evaluate(MINIMAP))
        frame.wait_for_timeout(100)
    slope = linear_regression([s["t"] for s in samples], [s["x"] for s in samples]).slope
    return {"samples": samples, "xPixelsPerSecond": round(slope, 3)}


def run_one(browser, version, source, emit):
    name, expected = GAMES[version]
    body = (source / name).read_bytes()
    actual = hashlib.sha1(f"blob {len(body)}\0".encode() + body).hexdigest()
    require(actual == expected, f"{name} differs from the archived game")
    context = browser.new_context(viewport={"width": 402, "height": 753}, is_mobile=True,
                                  has_touch=True, device_scale_factor=1, locale="zh-TW",
                                  service_workers="block")

    def route(request):
        url = urlsplit(request.request.url)
        if f"{url.scheme}://{url.netloc}" == ORIGIN and url.path in ("/", "/original"):
            request.fulfill(content_type="text/html; charset=utf-8",
                            body=body if url.path == "/original" else PARENT)
        else:
            request.abort()

    context.route("**/*", route)
    page = context.new_page()
    touch = TouchAdapter(page)
    started = False
    measurements = {}
    try:
        page.goto(ORIGIN)
        frame = page.frame(url=ORIGIN + "/original")
        require(frame and version in frame.locator(".eyebrow").text_content(), "Wrong game frame")
        dims = frame.evaluate("""() => [world.width,world.height,devicePixelRatio,
                                      matchMedia('(pointer:coarse)').matches]""")
        require(dims == [384, 467, 1, True], f"Unexpected game geometry {dims}")
        frame.evaluate(OBSERVE)
        emit({"event": "start-requested", "version": version, "blob": expected})
        frame.locator("#start").tap()
        frame.locator("#overlay.hidden").wait_for(state="attached")
        started = True
        emit({"event": "start-observed", "version": version, "geometry": dims})

        input_change(page, touch, ("keydown", "ArrowRight"))
        base = sample_motion(frame)
        measurements["unboosted"] = base
        first = frame.evaluate("readMobileSmoke()")
        require(first["held"] == ["joy"] and first["nub"][0] > 15, "Joystick did not move right")
        require(base["xPixelsPerSecond"] > 1.2, "Rendered minimap did not move right")

        input_change(page, touch, ("keydown", " "))
        boosted = sample_motion(frame)
        measurements["boosted"] = boosted
        both = frame.evaluate("readMobileSmoke()")
        require(both["held"] == ["boost", "joy"], "Expected two simultaneous touch contacts")
        require(any(e["type"] == "touchstart" and e["el"] == "boost" and e["count"] == 2
                    for e in both["events"]), "Boost failed to join the existing joystick contact")
        ratio = boosted["xPixelsPerSecond"] / base["xPixelsPerSecond"]
        require(not both["ended"], "Game ended before both control intervals finished")
        measurements["speedRatio"] = round(ratio, 3)
        require(ratio > 1.1, "Boost did not measurably increase rightward minimap speed")

        input_change(page, touch, ("keyup", " "))
        still_right = frame.evaluate("readMobileSmoke()")
        require(still_right["held"] == ["joy"] and still_right["nub"][0] > 15,
                "Boost release failed to leave the joystick active")
        input_change(page, touch, ("keyup", "ArrowRight"))
        released = frame.evaluate("readMobileSmoke()")
        require(released["held"] == [] and released["nub"] == [0, 0], "Joystick failed to release")

        input_change(page, touch, ("keydown", "ArrowRight"), ("keydown", " "))
        require(frame.evaluate("readMobileSmoke().held") == ["boost", "joy"],
                "Repeated two-contact action failed")
        input_change(page, touch, ("keyup", "ArrowRight"), ("keydown", "ArrowDown"))
        turned = frame.evaluate("readMobileSmoke()")
        require(turned["held"] == ["boost", "joy"] and turned["nub"][1] > 15 and
                abs(turned["nub"][0]) < 2, "The held joystick failed to turn down")
        input_change(page, touch, ("keyup", "ArrowDown"))
        boost_only = frame.evaluate("readMobileSmoke()")
        require(boost_only["held"] == ["boost"] and boost_only["nub"] == [0, 0],
                "Joystick release failed to leave boost active")
        input_change(page, touch, ("keydown", "ArrowRight"))
        touch.release(cancel=True)
        final = frame.evaluate("readMobileSmoke()")
        require(final["held"] == [] and final["nub"] == [0, 0], "Emergency release left a contact")
        controls = [e for e in final["events"] if e["el"] in ("joy", "boost")]
        require(controls and all(e["trusted"] for e in controls), "Found untrusted control events")
        require(all(e.get("kind") == "touch" for e in controls if e["type"].startswith("pointer")),
                "Found a non-touch pointer")
        require(not any(e["type"] in ("keydown","keyup") for e in final["events"]),
                "A synthetic input reached the game's keyboard event listeners")
        emit({"event": "end", "version": version, "outcome": "stopped-after-probe", "pass": True,
              **measurements,
              "nubRight": first["nub"], "nubReleased": released["nub"], "controlEvents": controls,
              "adapter": touch.summary()})
    except Exception as exc:
        emit({"event": "end" if started else "diagnostic-error", "version": version,
              "outcome": "probe-failed", "pass": False, "observedStart": started,
              "error": str(exc), **measurements})
        raise
    finally:
        try:
            touch.release(cancel=True)
        finally:
            context.close()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--src", type=Path, required=True, help="Directory containing both original HTML files")
    parser.add_argument("--chromium", required=True)
    parser.add_argument("--private-log", type=Path, required=True, help="New JSONL file outside the checkout")
    parser.add_argument("--version", choices=GAMES, action="append")
    args = parser.parse_args()
    checkout = Path(__file__).resolve().parents[4]
    require(not args.private_log.resolve().is_relative_to(checkout), "Use a private log outside the checkout")
    fd = os.open(args.private_log, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "w", buffering=1) as log, sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path=args.chromium, args=["--disable-dev-shm-usage"])
        try:
            for version in args.version or GAMES:
                run_one(browser, version, args.src,
                        lambda row: print(json.dumps({"class": "control-diagnostic", **row}), file=log))
        finally:
            browser.close()


if __name__ == "__main__":
    main()
