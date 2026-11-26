// Installed only in the local diagnostic runner's top document. The game and
// controller receive no observer data. The server's numeric ledger stays separate.
(() => {
  'use strict';
  if (self !== top || location.hostname !== '127.0.0.1') throw Error('Expected loopback runner');
  const pending = new Set();
  const seen = new Set();
  const stats = {decisions:0, started:0, saved:0, busy:0, errors:[]};
  function capture(context, kind, doc, record) {
    if (context.version !== 'v2.22') return;
    if (kind === 'decision') {
      stats.decisions++;
      if (pending.size) { stats.busy++; return; }
    } else {
      const key = context.id + '/' + kind;
      if (seen.has(key)) return;
      seen.add(key);
    }
    const canvas = doc.querySelector('canvas');
    const clock = doc.defaultView.parent.performance;
    const metadata = {
      id:context.id, version:context.version, kind, index:++stats.started,
      localTime:clock.now(), epochMs:clock.timeOrigin + clock.now(),
      recordAt:record?.recordAt ?? null, decisionStart:record?.ms ?? null,
      controllerCapture:record?.capture ?? null,
      hud:doc.getElementById('size')?.textContent.trim(),
      countdown:doc.getElementById('time')?.textContent.trim(),
      width:canvas.width, height:canvas.height
    };
    // toBlob takes a copy at invocation. Encoding and disk writes run after the
    // decision; a busy encoder drops the next decision rather than delaying it.
    const job = new Promise((resolve,reject) => canvas.toBlob(blob => {
      if (!blob) { reject(Error('Canvas PNG unavailable')); return; }
      const reader = new FileReader();
      reader.onerror = () => reject(Error('PNG read failed'));
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    }, 'image/png')).then(url => window.saveGrowTerminalFrame(metadata, url))
      .then(() => { stats.saved++; })
      .catch(e => { if (stats.errors.length < 5) stats.errors.push(String(e)); });
    pending.add(job);
    job.finally(() => pending.delete(job));
  }
  window.growTerminalObserver = {capture, stats, drained:() => !pending.size};
})();
