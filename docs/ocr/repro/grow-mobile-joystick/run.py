"""Isolated Chromium touch exploration of one frozen Grow candidate. Linux/macOS."""

import argparse
from contextlib import contextmanager, nullcontext
import hashlib
from importlib.metadata import version as package_version
import json
from pathlib import Path
import re
import signal
import sys
import time
from urllib.parse import urlsplit
from uuid import uuid4

from mobile_ledger import (PLAN, VERSIONS, append, browser_lock, digest_argument, read_summary,
                           rows, slot_states, summarize, writer)


HERE = Path(__file__).resolve().parent
SEALED_GROW50 = "3f04d509d6bc0b8ad95865bf8f5a75f2282ad87cf2cd6737b6ed11e6e44ff8f6"
# Chromium receives these same-origin responses from Playwright, without a listening server.
ORIGIN = "http://127.0.0.1:19453"
VIEWPORT = {"width": 402, "height": 753}
CANVAS = [384, 467]
GAME_FILES = {"v2.13": "game-v2.13.html", "v2.22": "game.html"}
GAME_BLOBS = {"v2.13": "16d41cdf2997baf0b3af33567b201d2dfb835427",
              "v2.22": "30af12f7608da91514711ecdbc01b57654ab2eab"}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def load_sources(args):
    pin = digest_argument(args.sha256)
    candidate = args.candidate.read_bytes()
    if sha(candidate) != pin:
        raise ValueError("Candidate HTML differs from the explicitly supplied SHA-256")
    if args.command == "run":
        freeze = json.loads(args.candidate.with_name("freeze.json").read_text())
        name = re.fullmatch(r"grow([1-9][0-9]*)", freeze.get("candidate", ""))
        if (not name or int(name[1]) <= 50 or pin == SEALED_GROW50 or freeze.get("candidateSha256") != pin
                or freeze.get("gameBlobs") != GAME_BLOBS):
            raise ValueError("Natural starts require the post-Grow50 candidate's matching freeze.json")
    games = {}
    for edition, filename in GAME_FILES.items():
        data = (args.game_root / filename).read_bytes()
        actual = hashlib.sha1(b"blob " + str(len(data)).encode() + b"\0" + data).hexdigest()
        if actual != GAME_BLOBS[edition]:
            raise ValueError(f"Original game blob differs for {edition}")
        games[edition] = data
    return candidate, games


def install_routes(context, candidate_path, candidate, games):
    versions = {"versions": [{"version": v, "path": "/" + v, "current": v == VERSIONS[-1]} for v in VERSIONS],
                "currentPath": "/" + VERSIONS[-1], "currentVersion": VERSIONS[-1]}
    sources = {candidate_path: ("text/html", candidate),
               "/api/versions": ("application/json", json.dumps(versions).encode())}
    sources.update({"/" + k: ("text/html", v) for k, v in games.items()})

    def serve(route):
        req = route.request
        url = urlsplit(req.url)
        path = url.path
        if f"{url.scheme}://{url.netloc}" != ORIGIN or req.method != "GET" or path not in sources:
            route.abort("blockedbyclient")
            return
        mime, data = sources[path]
        # The candidate may only use resources supplied by this runner.
        csp = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-src 'self'; object-src 'none'; base-uri 'none'"
        route.fulfill(status=200, body=data, headers={"Content-Type": mime + "; charset=utf-8",
                      "Cache-Control": "no-store", "Content-Security-Policy": csp})

    context.route("**/*", serve)


# Arm exactly once after the slot is durable. The original Start/replay button
# is shared by both editions. Guard it inside the fresh document before loading.
START_GATE = """(() => {
  if (window === top || window.frameElement?.id !== 'game') return;
  let armed = false, accepted = 0, blocked = 0;
  addEventListener('click', e => {
    if (!e.target.closest?.('#start')) return;
    if (armed && !accepted) { armed = false; accepted++; return; }
    blocked++; e.preventDefault(); e.stopImmediatePropagation();
  }, true);
  window.__mobileStartGate = {
    arm() { if (armed || accepted || blocked) throw Error('Native start gate is spent'); armed = true; },
    state() { return {accepted, blocked}; }
  };
})()"""


# Only public UI and controller lifecycle. Look at a result only while the native
# replay button and panel are visible. Ancestor display and opacity matter here.
SNAPSHOT = """() => {
  const frame = document.querySelector('#game'), d = frame.contentDocument, w = frame.contentWindow;
  const elem = id => d.getElementById(id);
  const visible = e => !!e?.checkVisibility({checkOpacity:true,checkVisibilityCSS:true}) && e.getClientRects().length > 0;
  const read = id => visible(elem(id)) ? elem(id).innerText.trim() : '';
  const overlay = visible(elem('overlay')), button = read('start');
  const result = overlay && /^(再玩一次|play again)$/i.test(button);
  const ending = elem('gameEnding').classList.contains('visible') && visible(elem('gameEnding'));
  const canvas = elem('world'), s = window.ocrLabStatus(), size = read('size');
  return {
    url: location.href, gameUrl: d.URL, foreground: !document.hidden && !d.hidden,
    outer: [innerWidth, innerHeight], dpr: devicePixelRatio, gameDpr: w.devicePixelRatio,
    canvas: [canvas.width,canvas.height], css: [canvas.clientWidth,canvas.clientHeight],
    coarse: w.matchMedia('(pointer:coarse)').matches, maxTouchPoints: w.navigator.maxTouchPoints,
    overlay, button, result, ending, fireworks: ending && elem('gameEnding').classList.contains('fireworks'),
    endingTitle: ending ? read('endingTitle') : '', paused: elem('pauseScreen').classList.contains('open'),
    title: result ? read('title') : '', description: result ? read('description') : '',
    edition: overlay ? d.querySelector('.eyebrow')?.innerText.match(/v[0-9]+[.][0-9]+/i)?.[0].toLowerCase() : null,
    remaining: read('time'), size: /^[0-9]+$/.test(size) ? Number(size) : null,
    strategy: document.getElementById('strategy').value, active:s.active, held:s.held,
    tilt: elem('tiltToggle').getAttribute('aria-pressed'), startGate: w.__mobileStartGate.state(),
    serial: w.__growTouchBridge.snapshot().serial
  };
}"""


def clock(value):
    match = re.fullmatch(r"([0-9]+):([0-5][0-9])", value)
    return 60 * int(match[1]) + int(match[2]) if match else None


def classify(snap):
    if snap["result"]:
        if snap["ending"]:
            return None
        title, description = snap["title"], snap["description"]
        match = re.search(r"(?:遊玩時間|play time)\s*([0-9]+:[0-5][0-9])\b", description, re.I)
        seconds = clock(match[1]) if match else None
        if seconds is None or seconds > 300:
            return "unknown", None
        if title in {"成功過關！", "You win!"}:
            goal = re.search(r"體型已達\s*200|reached size\s+200\b", description, re.I)
            if not goal and (snap["size"] is None or snap["size"] < 200):
                return "unknown", seconds
            return ("win" if seconds <= 150 else "late-win"), seconds
        if title in {"被大史萊姆吞掉了", "You were eaten!"}:
            return "death", seconds
        if title in {"時間到！未達成目標", "Time's up!"}:
            return "game-timeout", seconds
        return "unknown", seconds
    if snap["ending"] or snap["overlay"]:
        return None
    remaining = clock(snap["remaining"])
    if remaining is not None and 0 <= remaining < 150:
        return "deadline", 300 - remaining
    return None


def check_view(snap, url, edition):
    if snap["url"] != url or snap["gameUrl"] != ORIGIN + "/" + edition:
        raise ValueError("Document identity changed")
    if (snap["outer"] != list(VIEWPORT.values()) or snap["canvas"] != CANVAS or snap["css"] != CANVAS
            or snap["dpr"] != 1 or snap["gameDpr"] != 1 or not snap["coarse"] or snap["maxTouchPoints"] != 2):
        raise ValueError("Mobile viewport, original canvas, DPR or touch contract changed")
    if not snap["foreground"] or snap["strategy"] != "grow-23":
        raise ValueError("Background page or unexpected strategy")


@contextmanager
def prepared(browser, candidate, games, pin, edition):
    from touch import TouchAdapter

    context = browser.new_context(viewport=VIEWPORT, device_scale_factor=1, is_mobile=True,
                                  has_touch=True, locale="zh-TW", service_workers="block")
    try:
        path = "/lab/candidate/" + pin
        install_routes(context, path, candidate, games)
        page = context.new_page()
        page.set_default_timeout(5000)
        page.add_init_script(script=START_GATE)
        touch = TouchAdapter(page)
        url = ORIGIN + path + "?lab=mobile&load=" + uuid4().hex
        navigation = {}

        def response_seen(response):
            if response.request.is_navigation_request() and response.url in (url, ORIGIN + "/" + edition):
                navigation[response.url] = response

        page.on("response", response_seen)
        page.goto(url, wait_until="load", timeout=15000)
        page.wait_for_function("() => !document.querySelector('#go').disabled && !document.querySelector('#gameChoice').disabled",
                               timeout=15000)
        if page.locator("#gameChoice").input_value() != "/" + edition:
            page.locator("#gameChoice").select_option("/" + edition)
        page.wait_for_function("""url => !document.querySelector('#go').disabled
                              && document.querySelector('#game').contentDocument.URL === url""",
                               arg=ORIGIN + "/" + edition, timeout=15000)
        page.locator("#game").evaluate("frame => frame.scrollIntoView({block:'center'})")
        snap = page.evaluate(SNAPSHOT)
        snap["controls"] = touch.geometry()
        touch.pump()
        check_view(snap, url, edition)
        if (snap["active"] or snap["held"] != [] or snap["edition"] != edition or snap["result"] or
                not snap["overlay"] or not re.fullmatch(r"開始遊戲|play", snap["button"], re.I)
                or snap["remaining"] != "05:00" or snap["startGate"] != {"accepted": 0, "blocked": 0}):
            raise ValueError("Fresh original game, visible 05:00 clock or stopped controller unverified")
        for key, digest in ((url, pin), (ORIGIN + "/" + edition, sha(games[edition]))):
            response = navigation.get(key)
            if response is None or response.status != 200 or sha(response.body()) != digest:
                raise ValueError("Committed navigation bytes differ from the frozen source")
        yield page, touch, snap
    finally:
        context.close()


def stop(page, touch, cancel, serial):
    errors = []
    try:
        page.locator("#stop").evaluate("button => button.click()")
    except Exception as exc:
        errors.append(str(exc)[:300])
    try:
        touch.release(cancel=cancel)
    except Exception as exc:
        errors.append(str(exc)[:300])
    status = {}
    try:
        status = page.evaluate("() => window.ocrLabStatus()")
        if status.get("active") is not False or status.get("held") != []:
            errors.append("Controller did not stop and release")
        contacts = touch.summary()
        receiver = contacts.get("receiver") or {}
        if contacts.get("activeContacts") != [] or receiver.get("active") != [] or receiver.get("serial") != serial:
            errors.append("Active touch contacts unverified")
        if any(receiver.get(k) != 0 for k in ("unexpectedKeys", "blockedKeyboardEvents", "untrustedPointers")):
            errors.append("Touch-only input unverified")
        gate = page.evaluate("() => document.querySelector('#game').contentWindow.__mobileStartGate.state()")
        if gate != {"accepted": 1, "blocked": 0}:
            errors.append("Native one-start gate mismatch")
    except Exception as exc:
        errors.append(str(exc)[:300])
        contacts = {}
    return {"releaseVerified": not errors, "releaseErrors": errors, "controller": status, "touch": contacts}


def controls_verified(touch_summary):
    receiver = touch_summary.get("receiver") or {}
    demand = touch_summary.get("requiredPointers")
    if demand is None:
        return False
    for name in ("joy", "boost"):
        if demand[name] and not receiver.get("downs", {}).get(name):
            return False
    return not demand["simultaneous"] or receiver.get("maxSimultaneous") == 2


def attempt(db, slot, page, touch, ready):
    edition = PLAN[slot - 1]
    append(db, slot, "start-intent", {"version": edition, "visible": ready})
    native, interruption = False, None
    outcome, seconds, error = "unknown", None, None
    last = ready
    first_ending = None
    try:
        # Avoid scrolling the controls away from the viewport while starting.
        native_transition = page.evaluate("""() => {
          const w = document.querySelector('#game').contentWindow;
          w.__mobileStartGate.arm();
          document.getElementById('go').click();
          return {active: window.ocrLabStatus().active,
                  hidden: w.document.querySelector('#overlay').classList.contains('hidden'),
                  gate: w.__mobileStartGate.state(), serial: w.__growTouchBridge.snapshot().serial};
        }""")
        if native_transition != {"active": True, "hidden": True, "gate": {"accepted": 1, "blocked": 0},
                                 "serial": ready["serial"]}:
            raise ValueError("Native start identity or visible transition unverified")
        started = time.monotonic()
        append(db, slot, "native-start", {"transition": native_transition})
        native = True
        last_saved = started
        ending_since = None
        while True:
            now = time.monotonic()
            last = page.evaluate(SNAPSHOT)
            check_view(last, ready["url"], edition)
            if last["serial"] != ready["serial"] or last["startGate"] != {"accepted": 1, "blocked": 0}:
                raise ValueError("Original document changed or an unexpected native start was requested")
            if last["paused"]:
                raise RuntimeError("Original game paused")
            if last["ending"] and first_ending is None:
                first_ending = last
                ending_since = now
                append(db, slot, "observation", {"firstEnding": last})
                touch.release()
            result = classify(last) if first_ending is None or last["result"] else None
            if result:
                outcome, seconds = result
                break
            if last["ending"] or first_ending is not None:
                if now - ending_since > 5:
                    raise ValueError("Visible settlement panel unverified")
            else:
                if now - started > 240:
                    raise RuntimeError("Wall watchdog expired")
                if not last["active"]:
                    raise RuntimeError("Controller stopped before a visible result")
                if last["overlay"] or clock(last["remaining"]) not in range(301):
                    raise ValueError("Live game HUD clock unverified")
                touch.pump()
            if now - last_saved >= 5:
                append(db, slot, "observation", {"visible": last})
                last_saved = now
            page.wait_for_timeout(12)
    except (Exception, KeyboardInterrupt) as exc:
        error = f"{type(exc).__name__}: {exc}"[:500]
        outcome = "abort" if native and isinstance(exc, (RuntimeError, KeyboardInterrupt)) else "unknown"
        if isinstance(exc, KeyboardInterrupt):
            interruption = exc
    finally:
        release = stop(page, touch, cancel=outcome in ("abort", "unknown"), serial=ready["serial"])
        touch_control = controls_verified(release["touch"])
        visible_outcome = outcome if outcome not in ("unknown", "abort") else None
        if not release["releaseVerified"] or not touch_control:
            if not error:
                error = "Touch control or release unverified"
            outcome = "unknown"
        append(db, slot, "result", dict(outcome=outcome, gameSeconds=seconds, lastVisible=last,
                                        visibleOutcome=visible_outcome, controlVerified=touch_control,
                                        firstVisibleEnding=first_ending, error=error, **release))
    if interruption is not None:
        raise interruption
    if not native or not release["releaseVerified"] or not touch_control or error:
        raise RuntimeError("Attempt retained; batch stopped after a control, evidence or runner failure")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    for command in ("preflight", "run", "summary"):
        command_parser = commands.add_parser(command)
        command_parser.add_argument("--sha256", required=True, type=digest_argument)
        if command != "preflight":
            command_parser.add_argument("--state-dir", required=True, type=Path, help="Stable private cohort directory")
        if command != "summary":
            command_parser.add_argument("--candidate", required=True, type=Path)
            command_parser.add_argument("--game-root", required=True, type=Path, help="Original checkout's src directory")
            command_parser.add_argument("--chromium", type=Path, help="Chromium executable; defaults to Playwright")
    args = parser.parse_args()
    if args.command == "summary":
        print(json.dumps(read_summary(args.state_dir, args.sha256), indent=2))
        return
    candidate, games = load_sources(args)
    from playwright.sync_api import sync_playwright

    lock = browser_lock(args.state_dir) if args.command == "run" else nullcontext()
    with lock, sync_playwright() as playwright:
        executable = args.chromium or Path(playwright.chromium.executable_path)
        browser = playwright.chromium.launch(executable_path=str(executable), headless=True)
        try:
            with executable.open("rb") as binary:
                browser_hash = hashlib.file_digest(binary, "sha256").hexdigest()
            contract = {"schema": 1, "browser": browser.version,
                        "browserSha256": browser_hash, "playwright": package_version("playwright"),
                        "viewport": VIEWPORT, "canvas": CANVAS, "dpr": 1, "touchPoints": 2,
                        "strategy": "grow-23", "sizeTarget": 200, "deadlineGameSeconds": 150,
                        "sourceBlobs": GAME_BLOBS, "sourceSha256": {k: sha(v) for k, v in games.items()},
                        "runnerSha256": {p: sha((HERE / p).read_bytes()) for p in
                                         ("run.py", "mobile_ledger.py", "touch.py", "touch-bridge.js")}}
            if args.command == "preflight":
                ready = {}
                for edition in VERSIONS:
                    with prepared(browser, candidate, games, args.sha256, edition) as (_, _, snap):
                        ready[edition] = snap
                print(json.dumps({"phase": "preflight", "starts": 0, "candidateSha256": args.sha256,
                                  "contract": contract, "ready": ready}, ensure_ascii=False, indent=2))
                return
            with writer(args.state_dir, args.sha256, contract) as db:
                states = slot_states(rows(db))
                for slot, state in states.items():
                    if state["result"] is None:
                        append(db, slot, "result", {"outcome": "unknown", "releaseVerified": False,
                                                   "error": "Previous process stopped before recording a result"})
                for slot in range(len(states) + 1, len(PLAN) + 1):
                    edition = PLAN[slot - 1]
                    with prepared(browser, candidate, games, args.sha256, edition) as (page, touch, ready):
                        attempt(db, slot, page, touch, ready)
                    print(json.dumps(summarize(db)), flush=True)
                print(json.dumps(summarize(db), indent=2))
        finally:
            browser.close()


if __name__ == "__main__":
    def interrupted(_signum, _frame):
        raise KeyboardInterrupt()

    signal.signal(signal.SIGTERM, interrupted)
    try:
        main()
    except (OSError, ValueError, RuntimeError) as exc:
        sys.exit(str(exc))
