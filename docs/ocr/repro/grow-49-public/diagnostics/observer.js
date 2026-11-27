// The top page observes committed same-origin frames and owns queued pixels across navigation.
(() => {
  'use strict';
  if (self !== top || location.protocol !== 'http:' || location.hostname !== '127.0.0.1' || location.pathname !== '/') return;
  const candidatePath = /^\/candidate\/grow(?:49|50)$/;
  const gamePath = /^\/v2\.(13|22)$/;
  const maxPending = 3; // One decision, with room for an ending and its result.

  function counts() {
    return {decisions:0, started:0, saved:0, busy:0, failed:0, terminalDropped:0};
  }
  function text(doc, id, limit = 300) {
    return (doc.getElementById(id)?.textContent || '').trim().slice(0, limit);
  }
  function visible(elem) {
    if (!elem || !elem.getClientRects().length) return false;
    const css = elem.ownerDocument.defaultView.getComputedStyle(elem);
    return css.display !== 'none' && css.visibility !== 'hidden' && css.opacity !== '0';
  }
  function overlays(doc) {
    return {
      endingVisible:!!doc.querySelector('#gameEnding.visible'),
      resultVisible:visible(doc.getElementById('overlay')) && /^(再玩一次|play again)$/i.test(text(doc, 'start'))
    };
  }
  function encode(canvas) {
    return new Promise((resolve, reject) => canvas.toBlob(blob => {
      if (!blob) { reject(Error('PNG encoding returned no blob')); return; }
      const reader = new FileReader();
      reader.onerror = () => reject(Error('Unable to read PNG'));
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    }, 'image/png'));
  }
  function installTop() {
    const total = counts(), attempts = new Map(), pending = new Set(), reusable = [];
    const errors = [];
    function capture(kind, doc, record) {
      const status = window.growLocalStatus?.();
      const ctx = status?.current;
      if (!ctx || !status.active || typeof ctx.id !== 'string') return;
      const identity = /^((grow(?:49|50))-(?:diagnostic|explore|confirm)-\d+)\/(v2\.(?:13|22))\/([1-9]\d*)$/.exec(ctx.id);
      if (!identity || identity[1] !== status.batchId || identity[3] !== ctx.version) return;
      const candidate = document.getElementById('candidate')?.contentDocument;
      if (candidate?.location.pathname !== '/candidate/' + identity[2] || !doc ||
          candidate.getElementById('game')?.contentDocument !== doc || doc.location.pathname !== '/' + ctx.version) return;
      const terminal = kind === 'ending' || kind === 'result';
      if (!terminal && kind !== 'decision') return;
      let attempt = attempts.get(ctx.id);
      if (!attempt) {
        attempt = {...counts(), endingSeen:false, resultSeen:false};
        attempts.set(ctx.id, attempt);
      }
      function increment(key) { total[key]++; attempt[key]++; }
      if (terminal) {
        const key = kind + 'Seen';
        if (attempt[key]) return;
        attempt[key] = true;
        if (pending.size >= maxPending) { increment('terminalDropped'); return; }
      } else {
        increment('decisions');
        if (pending.size) { increment('busy'); return; }
      }
      increment('started');
      const index = total.started;
      let buffer;
      function fail(error) {
        increment('failed');
        if (errors.length < 32) errors.push({id:ctx.id, index, kind, message:String(error).slice(0, 240)});
      }
      try {
        const source = doc.querySelector('canvas');
        if (!source || source.width !== 2250 || source.height !== 1308)
          throw Error('Expected a 2250 × 1308 native canvas');
        // drawImage synchronously snapshots the decision/terminal into a top-owned
        // canvas. Encoding or file transfer can finish after the child is removed.
        buffer = reusable.pop() || document.createElement('canvas');
        if (buffer.width !== source.width) buffer.width = source.width;
        if (buffer.height !== source.height) buffer.height = source.height;
        const clock = candidate.defaultView.performance;
        const localTime = clock.now();
        const drawing = buffer.getContext('2d');
        drawing.globalCompositeOperation = 'copy';
        drawing.drawImage(source, 0, 0);
        const snapshot = record && status.latest?.recordAt === record.recordAt &&
          status.latest?.decisionStartedAt === record.ms ? status.latest : null;
        const flags = overlays(doc);
        const meta = {
          id:ctx.id, version:ctx.version, index, kind, localTime, epochMs:clock.timeOrigin + localTime,
          recordAt:record?.recordAt ?? null, decisionStart:record?.ms ?? null,
          controllerCapture:record?.capture ? {...record.capture} : null,
          width:source.width, height:source.height, hud:text(doc,'size'), countdown:text(doc,'time'),
          ...flags, title:flags.resultVisible ? text(doc,'title') : null,
          description:flags.resultVisible ? text(doc,'description',800) : null,
          endingTitle:flags.endingVisible ? text(doc,'endingTitle') : null,
          // r4 already made a new, bounded numeric copy in its normal callback.
          decisionSnapshot:snapshot
        };
        const job = encode(buffer).then(data => window.saveGrow49Frame(meta, data))
          .then(() => increment('saved'), fail);
        pending.add(job);
        job.finally(() => { pending.delete(job); reusable.push(buffer); });
      } catch (error) {
        fail(error);
        if (buffer) reusable.push(buffer);
      }
    }
    // No observer failure changes r4 controls, keys, outcomes, or eligibility.
    window.grow49Observer = {
      capture,
      drained:() => pending.size === 0,
      stats:() => ({...total, pending:pending.size,
        attempts:Object.fromEntries([...attempts].map(([id, a]) => [id, {...a}])), errors:errors.slice()})
    };
  }
  // Chromium may run a child init script while the candidate URL is still about:blank.
  // r4 waits for the committed iframe load before assigning its native record callback.
  // Capture that load from the parent document, including target game replacements.
  function watchFrame(parent, id, attach) {
    const seen = new WeakSet();
    function inspect(frame) {
      if (!frame || frame !== parent.getElementById(id)) return;
      const child = frame.contentDocument;
      if (!child || seen.has(child)) return;
      if (attach(child)) seen.add(child);
    }
    parent.addEventListener('load', event => inspect(event.target), true);
    inspect(parent.getElementById(id));
  }
  function watchGame(doc) {
    if (!gamePath.test(doc.location.pathname) || doc.readyState === 'loading') return false;
    function check() {
      try {
        const flags = overlays(doc);
        if (flags.endingVisible) window.grow49Observer.capture('ending', doc, null);
        if (flags.resultVisible) window.grow49Observer.capture('result', doc, null);
      } catch { /* Detached or superseded documents do not control gameplay. */ }
    }
    const observer = new MutationObserver(check);
    for (const id of ['gameEnding', 'overlay']) {
      const element = doc.getElementById(id);
      if (element) observer.observe(element, {attributes:true, attributeFilter:['class']});
    }
    check();
    return true;
  }
  function watchCandidate(doc) {
    if (!candidatePath.test(doc.location.pathname)) return false;
    const win = doc.defaultView;
    function wrap(fn) {
      if (typeof fn !== 'function') return fn;
      return function (...args) {
        const result = fn.apply(this, args);
        try { window.grow49Observer.capture('decision', doc.getElementById('game')?.contentDocument, args[0]); }
        catch { /* Observation must never stop an applied native decision. */ }
        return result;
      };
    }
    let receiver = wrap(win.ocrTestRecord);
    Object.defineProperty(win, 'ocrTestRecord', {
      configurable:true, enumerable:true, get:() => receiver, set:fn => { receiver = wrap(fn); }
    });
    watchFrame(doc, 'game', watchGame);
    return true;
  }
  installTop();
  watchFrame(document, 'candidate', watchCandidate);
})();
