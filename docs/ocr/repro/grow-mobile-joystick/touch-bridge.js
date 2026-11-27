// Installed before the original document registers any input handlers.
(() => {
  if (window === top || window.frameElement?.id !== 'game') return;
  const serial = (parent.__growTouchDocumentSerial || 0) + 1;
  parent.__growTouchDocumentSerial = serial;
  const directions = new Set(['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', ' ']);
  const held = new Set();
  const changes = [];
  let scheduled = false;
  let previous = {x: 0, y: 0, boost: false};
  const audit = {
    intercepted: 0, unexpectedKeys: 0, blockedKeyboardEvents: 0, untrustedPointers: 0,
    downs: {joy: 0, boost: 0}, moves: {joy: 0, boost: 0},
    ups: {joy: 0, boost: 0}, cancels: {joy: 0, boost: 0}, maxSimultaneous: 0
  };
  const pointers = new Map();
  function flush() {
    scheduled = false;
    const x = Number(held.has('ArrowRight')) - Number(held.has('ArrowLeft'));
    const y = Number(held.has('ArrowDown')) - Number(held.has('ArrowUp'));
    const boost = held.has(' ');
    if (x === previous.x && y === previous.y && boost === previous.boost) return;
    previous = {x, y, boost};
    changes.push({...previous, at: performance.now()});
  }
  function clear() {
    held.clear();
    flush();
  }

  // The frozen parent's key() calls its child Window's dispatchEvent(). Consume
  // only that transport before any KeyboardEvent enters DOM event propagation.
  const dispatch = window.dispatchEvent;
  window.dispatchEvent = function(event) {
    if (!(event instanceof KeyboardEvent)) return dispatch.call(this, event);
    if (!directions.has(event.key) || !['keydown', 'keyup'].includes(event.type)) {
      audit.unexpectedKeys++;
      return false;
    }
    audit.intercepted++;
    if (event.type === 'keydown') held.add(event.key);
    else held.delete(event.key);
    // Freeze one complete chord per synchronous move()/release(), including
    // transitions such as up-right -> down-left which contain several key calls.
    if (!scheduled) {
      scheduled = true;
      queueMicrotask(flush);
    }
    return true;
  };
  for (const type of ['keydown', 'keypress', 'keyup']) {
    window.addEventListener(type, event => {
      audit.blockedKeyboardEvents++;
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);
  }
  const fields = {
    pointerdown: 'downs', pointermove: 'moves', pointerup: 'ups', pointercancel: 'cancels'
  };
  for (const [type, field] of Object.entries(fields)) {
    window.addEventListener(type, event => {
      const target = pointers.get(event.pointerId) ?? event.target.closest?.('#joy,#boost')?.id;
      if (!target) return;
      if (!event.isTrusted || event.pointerType !== 'touch') {
        audit.untrustedPointers++;
        return;
      }
      audit[field][target]++;
      if (type === 'pointerdown') pointers.set(event.pointerId, target);
      if (type === 'pointerup' || type === 'pointercancel') pointers.delete(event.pointerId);
      audit.maxSimultaneous = Math.max(audit.maxSimultaneous, pointers.size);
    }, {capture: true, passive: true});
  }
  window.addEventListener('blur', clear);
  window.addEventListener('pagehide', clear);
  document.addEventListener('visibilitychange', () => { if (document.hidden) clear(); });
  const snapshot = () => ({
    ...audit, serial, active: [...pointers.values()].sort()
  });
  window.__growTouchBridge = {
    read() {
      return {audit: snapshot(), now: performance.now(), changes: changes.splice(0)};
    },
    snapshot,
    clear() { clear(); changes.length = 0; }
  };
})();
