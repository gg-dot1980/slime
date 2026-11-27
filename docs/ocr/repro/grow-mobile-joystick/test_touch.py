"""Chromium transport regression using two empty controls and a synthetic planner."""

import argparse
import math

from playwright.sync_api import sync_playwright

from touch import TouchAdapter


PARENT = """<meta name=viewport content="width=device-width,initial-scale=1">
<style>body { margin:0 } iframe { margin:17px 0 0 13px; width:384px; height:467px; border:2px solid }</style>
<iframe id="game" src="/controls"></iframe>"""
CHILD = """<style>
body { margin:0 } #joy,#boost { position:absolute; touch-action:none; border-radius:50% }
#joy { right:14px; bottom:14px; width:130px; height:130px }
#boost { left:18px; bottom:24px; width:88px; height:88px }
</style><div id="joy"></div><button id="boost">Boost</button>
<script>
window.seenKeys = 0;
window.addEventListener('keydown', () => seenKeys++, true);
window.addEventListener('keyup', () => seenKeys++, true);
window.points = [];
for (const name of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']) {
  window.addEventListener(name, e => points.push(
    [e.type, e.target.id, e.pointerId, e.isTrusted, e.pointerType, e.clientX, e.clientY]
  ), {passive:true});
}
</script>"""
SEND = """keys => {
  const win = document.getElementById('game').contentWindow;
  for (const [type, key] of keys)
    win.dispatchEvent(new win.KeyboardEvent(type, {key, bubbles:true, cancelable:true}));
}"""


def run(chromium=None):
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(executable_path=chromium, args=["--disable-dev-shm-usage"])
        page = browser.new_page(viewport={"width": 420, "height": 540}, has_touch=True,
                                is_mobile=True, device_scale_factor=1)
        page.route("http://fixture.test/**", lambda route: route.fulfill(
            content_type="text/html", body=CHILD if route.request.url.endswith("/controls") else PARENT))
        touch = TouchAdapter(page)
        page.goto("http://fixture.test/parent")
        page.wait_for_function("document.querySelector('#game').contentWindow.points != null")

        def chord(*events):
            page.evaluate(SEND, events)
            touch.pump()
            return touch.summary()["receiver"]

        measured = touch.geometry()
        assert measured["coarse"] and measured["touchPoints"] == 2
        assert measured["iframe"] == [15, 19, 384, 467] and measured["dpr"] == 1
        assert measured["joy"]["hit"] and measured["boost"]["hit"]
        touch.release()
        assert touch.summary()["requiredPointers"] == {"joy": 0, "boost": 0, "simultaneous": 0}
        assert chord(("keydown", "ArrowRight"))["active"] == ["joy"]
        assert chord(("keyup", "ArrowRight"))["active"] == []
        assert touch.summary()["requiredPointers"] == {"joy": 1, "boost": 0, "simultaneous": 0}
        both = ["boost", "joy"]
        received = chord(("keydown", " "), ("keydown", "ArrowRight"), ("keydown", "ArrowUp"))
        assert received["active"] == both and received["maxSimultaneous"] == 2
        assert received["downs"] == {"joy": 2, "boost": 1}
        events = page.evaluate("game.contentWindow.points")
        assert all(ev[3:5] == [True, "touch"] for ev in events)
        joy = next(ev for ev in reversed(events) if ev[:2] == ["pointerdown", "joy"])
        boost = next(ev for ev in events if ev[:2] == ["pointerdown", "boost"])
        assert joy[2] != boost[2]
        desired = touch.geometry(1, -1)["joy"]
        assert math.isclose(joy[5] + 15, desired["x"], abs_tol=1)
        assert math.isclose(joy[6] + 19, desired["y"], abs_tol=1)
        received = chord(("keyup", "ArrowRight"), ("keydown", "ArrowLeft"))
        assert received["active"] == both
        page.wait_for_function("game.contentWindow.points.some(e => e[0] === 'pointermove' && e[1] === 'joy')")
        assert touch.summary()["receiver"]["downs"] == {"joy": 2, "boost": 1}
        received = chord(("keyup", " "))
        assert received["active"] == ["joy"] and received["ups"] == {"joy": 1, "boost": 1}
        received = chord(("keydown", " "))
        assert received["active"] == both and received["downs"] == {"joy": 2, "boost": 2}
        received = chord(("keyup", "ArrowLeft"), ("keyup", "ArrowUp"), ("keyup", " "))
        assert received["active"] == [] and received["ups"] == {"joy": 2, "boost": 2}

        chord(("keydown", " "), ("keydown", "ArrowDown"))
        touch.release(cancel=True)
        summary = touch.summary()
        assert summary["activeContacts"] == [] and summary["receiver"]["active"] == []
        assert summary["receiver"]["cancels"] == {"joy": 1, "boost": 1}
        assert page.evaluate("game.contentWindow.seenKeys") == 0
        assert summary["receiver"]["intercepted"] == 14
        assert summary["requiredPointers"] == {"joy": 6, "boost": 4, "simultaneous": 4}
        # A stray hardware key is blocked before the fixture's own capture handlers.
        page.evaluate("game.contentWindow.focus()")
        page.keyboard.press("ArrowRight")
        assert page.evaluate("game.contentWindow.seenKeys") == 0
        assert touch.summary()["receiver"]["blockedKeyboardEvents"] == 2
        try:
            touch.pump()
        except RuntimeError as error:
            assert "Unexpected input" in str(error)
        else:
            raise AssertionError("Hardware keyboard use should invalidate a touch-only attempt")
        browser.close()
        print("Passed synthetic multi-touch, independent release, cancellation and keyboard isolation.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--chromium", help="Path to the cohort Chromium executable")
    run(parser.parse_args().chromium)
