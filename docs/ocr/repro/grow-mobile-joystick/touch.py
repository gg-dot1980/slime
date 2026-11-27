"""Translate frozen Grow keyboard output into Chromium's multi-touch input stream."""

from pathlib import Path


BRIDGE = Path(__file__).with_name("touch-bridge.js")
GEOMETRY = """([x, y]) => {
  const frame = document.querySelector('#game');
  const win = frame?.contentWindow, doc = frame?.contentDocument;
  if (!doc || !win.__growTouchBridge) throw Error('Touch bridge missing from #game');
  const r = frame.getBoundingClientRect();
  if (Math.abs(r.width - frame.offsetWidth) > 1 || Math.abs(r.height - frame.offsetHeight) > 1
      || devicePixelRatio !== 1 || win.devicePixelRatio !== 1 || visualViewport.scale !== 1)
    throw Error('Touch requires unscaled iframe coordinates at DPR 1');
  const left = r.left + frame.clientLeft, top = r.top + frame.clientTop;
  function point(id, dx, dy) {
    const element = doc.getElementById(id);
    if (!element) throw Error('Missing visible control #' + id);
    const b = element.getBoundingClientRect();
    const distance = Math.hypot(dx, dy) || 1;
    // Inside the circular hit region, outside the full-deflection radius.
    const radius = Math.min(b.width, b.height) * .36;
    const px = b.left + b.width / 2 + dx / distance * radius;
    const py = b.top + b.height / 2 + dy / distance * radius;
    return {left: left+b.left, top: top+b.top, width: b.width, height: b.height,
            x: left+px, y: top+py, hit: b.width > 0 && b.height > 0
                && document.elementFromPoint(left+px, top+py) === frame
                && element.contains(doc.elementFromPoint(px, py))};
  }
  const canvas = doc.querySelector('canvas');
  return {viewport: [innerWidth, innerHeight], iframe: [left, top, frame.clientWidth, frame.clientHeight],
          canvas: canvas ? [canvas.width, canvas.height] : null,
          dpr: devicePixelRatio, touchPoints: win.navigator.maxTouchPoints,
          coarse: win.matchMedia('(pointer:coarse)').matches,
          joy: point('joy', x, y), boost: point('boost', 0, 0)};
}"""
READ = "() => document.querySelector('#game')?.contentWindow?.__growTouchBridge?.read()"
SNAPSHOT = "() => document.querySelector('#game')?.contentWindow?.__growTouchBridge?.snapshot()"
CLEAR = "() => document.querySelector('#game')?.contentWindow?.__growTouchBridge?.clear()"


class TouchAdapter:
    """Install before navigation. Pump on the Playwright thread throughout an attempt."""

    def __init__(self, page):
        self.page = page
        self.session = page.context.new_cdp_session(page)
        self.session.send("Emulation.setTouchEmulationEnabled", {"enabled": True, "maxTouchPoints": 2})
        page.add_init_script(path=BRIDGE)
        self._contacts = {}
        self._uncertain = False
        self._serial = None
        self._sends = {"touchStart": 0, "touchMove": 0, "touchEnd": 0, "touchCancel": 0}
        self._required = {"joy": 0, "boost": 0, "simultaneous": 0}
        self._max_poll_age = 0
        self._superseded = 0

    def geometry(self, x=0, y=0):
        """Return measured controls and actual cross-frame hit tests in main viewport CSS pixels."""
        return self.page.evaluate(GEOMETRY, [x, y])

    def _send(self, event, points):
        # If the transport fails after browser delivery, finally/release still cancels all.
        self._uncertain = True
        self.session.send("Input.dispatchTouchEvent", {"type": event, "touchPoints": points})
        self._sends[event] += 1
        self._uncertain = False

    def _end(self, cancel=False):
        if self._contacts or self._uncertain:
            self._send("touchCancel" if cancel or self._uncertain else "touchEnd", [])
            self._contacts.clear()

    def release(self, cancel=False):
        """End all active contacts; cancel if stopping after an error. Verify receiver release."""
        self._end(cancel)
        self.page.evaluate(CLEAR)
        receiver = self.page.evaluate(SNAPSHOT)
        if not receiver:
            raise RuntimeError("Cannot verify release: touch bridge missing from #game")
        self._check_keyboard(receiver)
        if receiver["active"]:
            raise RuntimeError(f"Touch contacts still held by receiver: {receiver['active']}")

    @staticmethod
    def _check_keyboard(receiver):
        if any(receiver[key] for key in ("unexpectedKeys", "blockedKeyboardEvents", "untrustedPointers")):
            raise RuntimeError(f"Unexpected input in touch-only lane: {receiver}")

    def _apply(self, state):
        x, y, boost = state["x"], state["y"], state["boost"]
        if not (x or y or boost):
            self._end()
            return
        # Count demanded contacts on each applied chord before checking delivery.
        # Repeated identical chords and superseded directions never reach _apply.
        steering = bool(x or y)
        self._required["joy"] += int(steering)
        self._required["boost"] += int(boost)
        self._required["simultaneous"] += int(steering and boost)
        measured = self.geometry(x, y)
        desired = {}
        for name, ident, wanted in (("joy", 1, x or y), ("boost", 2, boost)):
            if not wanted:
                continue
            point = measured[name]
            if not point["hit"]:
                raise RuntimeError(f"Requested touch misses visible #{name} control: {point}")
            desired[name] = {"x": point["x"], "y": point["y"], "id": ident}

        # With nonempty touchEnd, Chromium releases the listed identifiers.
        removed = [name for name in self._contacts if name not in desired]
        if removed:
            self._send("touchEnd", [self._contacts[name] for name in removed])
            for name in removed:
                del self._contacts[name]
        remaining = {name: desired[name] for name in self._contacts}
        if remaining != self._contacts:
            self._send("touchMove", list(remaining.values()))
            self._contacts = remaining
        if desired.keys() != self._contacts.keys():
            self._send("touchStart", list(desired.values()))
            self._contacts = desired

    def pump(self):
        """Apply completed command chords. Superseded turns never replay stale directions."""
        batch = self.page.evaluate(READ)
        if batch is None:
            if self._contacts or self._uncertain:
                self._end(cancel=True)
            raise RuntimeError("Cannot verify touch-only input: game frame or bridge missing")
        receiver = batch["audit"]
        if self._serial is not None and receiver["serial"] != self._serial and self._contacts:
            self._end(cancel=True)
            raise RuntimeError("Game document changed while holding touch input")
        self._serial = receiver["serial"]
        self._check_keyboard(receiver)
        changes = batch["changes"]
        if not changes:
            if sorted(self._contacts) != receiver["active"]:
                raise RuntimeError(f"Trusted contact state diverged: {receiver['active']}")
            return
        self._max_poll_age = max(self._max_poll_age, batch["now"] - changes[0]["at"])
        self._superseded += len(changes) - 1
        # Preserve an explicit release barrier even when several turns arrived before polling.
        if any(not (s["x"] or s["y"] or s["boost"]) for s in changes[:-1]):
            self._end()
        self._apply(changes[-1])
        receiver = self.page.evaluate(SNAPSHOT)
        if not receiver or receiver["serial"] != self._serial or receiver["active"] != sorted(self._contacts):
            raise RuntimeError(f"Trusted touch receiver did not acknowledge the requested contacts: {receiver}")
        self._check_keyboard(receiver)

    def summary(self):
        return {"activeContacts": sorted(self._contacts), "receiver": self.page.evaluate(SNAPSHOT),
                "requiredPointers": dict(self._required),
                "dispatched": dict(self._sends), "maxPollAgeMs": round(self._max_poll_age, 2),
                "supersededChanges": self._superseded}
