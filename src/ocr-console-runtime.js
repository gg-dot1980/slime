(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const catalog = window.OCR_CONSOLE_CATALOG || {};
  const families = new Map((catalog.families || []).map(family => [family.id, family]));
  const history = catalog.history || [];
  const arrows = {
    N: '↑ 北', NE: '↗ 東北', E: '→ 東', SE: '↘ 東南',
    S: '↓ 南', SW: '↙ 西南', W: '← 西', NW: '↖ 西北'
  };
  const inputKeys = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ']);
  const historyLinks = [
    ['url', '版本說明'], ['sourceUrl', '原始碼'], ['archiveUrl', '封存'], ['evidenceUrl', '驗證紀錄']
  ];
  let current = null;
  const dateTime = new Intl.DateTimeFormat('zh-TW', {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  });

  function beginRecord(session) {
    const list = $('sessionHistory');
    if (!list) return;
    if (!list.querySelector('[data-operation]')) list.replaceChildren();
    const row = document.createElement(list.matches('ul,ol') ? 'li' : 'article');
    row.className = 'history-entry';
    row.dataset.operation = 'running';
    const now = new Date();
    const start = itemElement('time', dateTime.format(now));
    start.dateTime = now.toISOString();
    const heading = itemElement('div', '', 'history-name');
    heading.append(start, '　' + [session.family.label, session.gameVersion || session.gameLabel].join(' · '));
    row.append(heading);
    if (session.strategyLabel !== session.family.label) row.append(itemElement('p', session.strategyLabel, 'history-note'));
    row.append(itemElement('p', '執行中', 'operation-state'));
    list.prepend(row);
    session.operation = row;
  }

  function finishRecord(session, reason) {
    const row = session?.operation;
    if (!row || row.dataset.operation !== 'running') return;
    const now = new Date();
    const end = itemElement('time', dateTime.format(now));
    end.dateTime = now.toISOString();
    row.querySelector('.operation-state').replaceChildren(end, '　' + reason);
    row.dataset.operation = 'finished';
    session.operation = null;
  }

  function write(id, value) {
    const node = $(id);
    if (node && node.textContent !== value) node.textContent = value;
  }

  function content(doc, id) {
    return doc?.getElementById(id)?.textContent.trim() || '';
  }

  function status(state, label, hint) {
    $('status').dataset.state = state;
    write('status', label);
    write('statusHint', hint);
  }

  function options(select, choices, value) {
    select.replaceChildren(...choices.map(item => new Option(item.label, item.value)));
    if (choices.some(item => item.value === value)) select.value = value;
    select.disabled = choices.length === 0;
  }

  function nativeOptions(select) {
    return Array.from(select?.options || [], option => ({value: option.value, label: option.label}))
      .filter(option => option.value && option.value !== 'custom');
  }

  function direction(keys, neutral = '未送方向鍵') {
    const x = Number(keys.has('ArrowRight')) - Number(keys.has('ArrowLeft'));
    const y = Number(keys.has('ArrowDown')) - Number(keys.has('ArrowUp'));
    const code = (y < 0 ? 'N' : y > 0 ? 'S' : '') + (x < 0 ? 'W' : x > 0 ? 'E' : '');
    write('direction', arrows[code] || neutral);
    for (const node of document.querySelectorAll('#directionPad [data-dir]')) {
      const active = node.dataset.dir === code;
      node.classList.toggle('is-active', active);
      node.dataset.active = String(active);
    }
  }

  function clearReadings() {
    for (const id of ['hudSize', 'hudTime', 'decisionMs', 'attempt']) write(id, '—');
    direction(new Set(), '—');
    write('decision', '等待策略回報');
    write('decisionDetail', '');
    write('diagnosticText', '等待辨識資料');
    write('liveLog', '');
    if ($('diagnosticCanvas')) {
      $('diagnosticCanvas').hidden = true;
      $('diagnosticCanvas').width = 0;
    }
  }

  function itemElement(tag, text, cssClass) {
    const node = document.createElement(tag);
    node.textContent = text;
    if (cssClass) node.className = cssClass;
    return node;
  }

  function renderHistory() {
    const filter = $('historyFilter').value;
    const entries = history.filter(item => !filter || filter === 'all' || item.family === filter);
    const list = $('historyList');
    const fragment = document.createDocumentFragment();
    for (const item of entries) {
      const entry = document.createElement(list.matches('ul,ol') ? 'li' : 'article');
      entry.className = 'history-entry';
      entry.dataset.version = item.id;
      entry.append(itemElement('h3', item.label || item.version, 'history-name'));
      for (const line of [item.description, item.evidence].filter(Boolean)) {
        entry.append(itemElement('p', line, 'history-note'));
      }
      const actions = itemElement('div', '', 'history-actions');
      const seen = new Set();
      for (const [property, text] of historyLinks) {
        if (!item[property]) continue;
        let url;
        try { url = new URL(item[property], location.href); } catch { continue; }
        if (!['https:', 'http:'].includes(url.protocol) || seen.has(url.href)) continue;
        seen.add(url.href);
        const link = itemElement('a', text);
        link.href = url.href;
        link.target = '_blank';
        link.rel = 'noopener';
        link.setAttribute('aria-label', item.version + ' ' + text);
        actions.append(link);
      }
      if (item.strategyValue && families.has(item.family)) {
        const select = itemElement('button', '選用此策略');
        select.type = 'button';
        select.setAttribute('aria-label', '選用 ' + item.version);
        select.addEventListener('click', () => {
          mount(families.get(item.family), current?.gamePath, item.strategyValue);
          $('familyChoice').focus();
        });
        actions.append(select);
      }
      if (actions.childElementCount) entry.append(actions);
      fragment.append(entry);
    }
    if (!entries.length) fragment.append(itemElement('p', '此系列尚無公開修訂紀錄。'));
    list.replaceChildren(fragment);
    write('historyCount', entries.length + ' 筆');
  }

  // Apply presentation only to the intermediary controller document. The game
  // inside #game keeps its own document, CSS, input handlers and resolution.
  function presentController(doc) {
    const style = doc.createElement('style');
    style.textContent = `
      html,body { margin:0!important; padding:0!important; width:100%!important;
        height:100%!important; min-height:0!important; overflow:hidden!important; }
      body > :not(.layout), .layout > :not(.stage), .stage > :not(#game) { display:none!important; }
      body .layout, body .layout .stage { box-sizing:border-box!important; display:block!important;
        position:relative!important; inset:auto!important; margin:0!important; padding:0!important;
        width:100%!important; max-width:none!important; height:100%!important; max-height:none!important;
        min-height:0!important; border:0!important; border-radius:0!important; overflow:hidden!important; }
      .layout .stage #game { display:block!important; position:relative!important; inset:auto!important;
        margin:0!important; width:100%!important; height:100%!important; border:0!important;
        max-width:none!important; max-height:none!important; transform:none!important; }
      @media (min-width:851px) {
        html[data-native-view] .layout .stage #game { width:calc(100% * var(--view-scale,1))!important;
          height:calc(100% * var(--view-scale,1))!important;
          transform:scale(calc(1 / var(--view-scale,1)))!important; transform-origin:top left!important; }
      }`;
    doc.head.append(style);
    if (doc.getElementById('viewScale')) {
      doc.documentElement.dataset.nativeView = '';
      doc.defaultView.dispatchEvent(new doc.defaultView.Event('resize'));
    }
  }

  function bindGame(session, doc) {
    if (session.gameDoc === doc) return;
    session.gameDoc = doc;
    session.keys.clear();
    const win = doc.defaultView;
    const focus = win.focus.bind(win);
    // OCR1 requests focus on every direction change. Leave the operator's
    // console control focused while still delivering native keys to the game.
    win.focus = (...args) => {
      const control = document.activeElement;
      if (control !== $('run') && control?.matches('select, input, button, summary, a')) return;
      return focus(...args);
    };
    for (const type of ['keydown', 'keyup']) {
      win.addEventListener(type, event => {
        // Controller-generated key events are observable in every supported family.
        // Physical keyboard events are the user's controls, not strategy output.
        if (current !== session || session.gameDoc !== doc || event.isTrusted || !inputKeys.has(event.key)) return;
        if (type === 'keydown') session.keys.add(event.key);
        else session.keys.delete(event.key);
      }, true);
    }
  }

  function stopNative(session) {
    if (!session?.doc) return;
    const stop = session.doc.getElementById('autoStop') || session.doc.getElementById('stop');
    if (stop && !stop.disabled) stop.click();
    const gameDoc = session.gameDoc;
    if (gameDoc && session.doc.getElementById('game')?.contentDocument === gameDoc) {
      const win = gameDoc.defaultView;
      for (const key of [...session.keys]) win.dispatchEvent(new win.KeyboardEvent('keyup',
        {key, code: key === ' ' ? 'Space' : key, bubbles: true, cancelable: true}));
      // OCR1's stop control is disabled when the game was started manually.
      const pause = gameDoc.getElementById('pauseButton');
      if (pause && !pause.disabled && !gameDoc.querySelector('#pauseScreen.open') && pause.getClientRects().length) pause.click();
    }
    session.keys.clear();
  }

  function stopSession(reason = '手動停止') {
    const session = current;
    if (!session?.initialized || session.failed) return;
    stopNative(session);
    session.running = false;
    session.stopped = true;
    finishRecord(session, reason);
    session.blockStartUntil = performance.now() + (session.family.id === 'ocr1' ? 350 : 0);
    status('stopped', '已停止', reason + '，方向鍵已釋放。');
    refresh();
  }

  function loadError(session, message) {
    if (session !== current || session.failed) return;
    stopNative(session);
    session.failed = true;
    session.running = false;
    finishRecord(session, '控制器連線中斷');
    clearReadings();
    status('error', '載入失敗', message);
    $('run').disabled = true;
    $('stop').disabled = true;
    if ($('retryController')) $('retryController').hidden = false;
  }

  function mount(family, gamePath, strategyValue) {
    const old = current;
    stopNative(old);
    finishRecord(old, '切換遊戲或策略');
    const previous = $('controllerFrame');
    // A fresh browsing context cancels timers and in-flight initialization in
    // older controllers, including OCR1's asynchronous startup loop.
    const frame = previous.cloneNode(false);
    frame.removeAttribute('src');
    const session = {family, frame, keys: new Set(), wantedGame: gamePath, wantedStrategy: strategyValue,
      started: performance.now(), diagPaint: 0, running: false, stopped: false};
    current = session;
    $('familyChoice').value = family.id;
    $('gameChoice').replaceChildren(new Option('載入中', ''));
    $('variantChoice').replaceChildren(new Option('載入中', ''));
    for (const id of ['gameChoice', 'variantChoice', 'run', 'stop']) $(id).disabled = true;
    const variantField = $('variantChoice').closest('[data-variant-field]');
    if (variantField) variantField.hidden = true;
    if ($('retryController')) $('retryController').hidden = true;
    clearReadings();
    write('strategyDescription', family.description);
    status('loading', '載入中', '正在載入 ' + family.label + ' …');
    const url = new URL(family.route, location.href);
    $('controllerLink').href = url.href;
    frame.title = family.label + ' · 史萊姆遊戲';
    frame.addEventListener('load', () => { if (current === session) refresh(); });
    frame.src = url.href;
    previous.replaceWith(frame);
  }

  function applyChoices(session) {
    const doc = session.doc;
    const gamePicker = doc.getElementById('gameChoice');
    if (!gamePicker || gamePicker.disabled) return false;
    const games = nativeOptions(gamePicker);
    if (!games.length) return false;
    const nativeStrategy = doc.getElementById('strategy');
    const variants = nativeOptions(nativeStrategy);
    const wanted = session.wantedGame;
    session.gamePath = games.some(option => option.value === wanted) ? wanted : gamePicker.value;
    if (!games.some(option => option.value === session.gamePath)) session.gamePath = games[0].value;
    session.gameLabel = games.find(option => option.value === session.gamePath).label;
    options($('gameChoice'), games, session.gamePath);
    if (session.wantedStrategy && !variants.some(option => option.value === session.wantedStrategy)) {
      loadError(session, '此控制器未提供指定的策略版本，請重新選擇系列或策略。');
      return false;
    }
    const defaultChoice = variants.find(option => option.value === session.family.defaultStrategy);
    session.strategyValue = session.wantedStrategy || defaultChoice?.value || nativeStrategy?.value || '';
    if (nativeStrategy) nativeStrategy.value = session.strategyValue;
    options($('variantChoice'), variants, session.strategyValue);
    const variantField = $('variantChoice').closest('[data-variant-field]');
    if (variantField) variantField.hidden = !variants.length;
    const activeRecord = history.find(item => item.family === session.family.id && item.strategyValue === session.strategyValue);
    session.strategyLabel = variants.find(item => item.value === session.strategyValue)?.label || session.family.label;
    write('strategyDescription', [session.family.description, activeRecord?.description || session.strategyLabel,
      doc.querySelector('.side .how')?.textContent.trim()].filter(Boolean).join('\n\n'));
    session.configured = true;
    const load = doc.getElementById('loadGame');
    const game = doc.getElementById('game');
    const pathMismatch = load && new URL(game.src, location.href).pathname !== session.gamePath;
    if (gamePicker.value !== session.gamePath || pathMismatch) {
      gamePicker.value = session.gamePath;
      gamePicker.dispatchEvent(new doc.defaultView.Event('change', {bubbles: true}));
      if (load) load.click();
      return false;
    }
    return true;
  }

  function sourceVersion(doc) {
    return doc.querySelector('meta[name="ocr-grow-version"]')?.content ||
      doc.querySelector('.eyebrow')?.textContent.match(/v\d+\.\d+/)?.[0] || '';
  }

  function connect(session) {
    const doc = session.frame.contentDocument;
    if (!doc || doc.URL === 'about:blank') return;
    if (!session.doc) {
      if (!doc.getElementById('game')) {
        if (doc.readyState === 'complete') loadError(session, '此網址未提供可用的遊戲控制器。');
        return;
      }
      session.doc = doc;
      presentController(doc);
    }
    if (doc !== session.doc) { loadError(session, '控制器頁面已變更，請重新載入。'); return; }
    if (!session.configured && !applyChoices(session)) return;
    const game = doc.getElementById('game');
    const gameDoc = game.contentDocument;
    const start = doc.getElementById('autoStart') || doc.getElementById('go');
    if (!start || start.disabled || !gameDoc?.querySelector('canvas') || gameDoc.readyState !== 'complete') {
      const hint = content(doc, 'status');
      if (/失敗|禁止開始|無法讀取|未知版本/.test(hint)) loadError(session, hint);
      return;
    }
    const expected = (session.gamePath + ' ' + session.gameLabel).match(/v\d+\.\d+/)?.[0];
    const version = sourceVersion(gameDoc);
    if (expected && version !== expected) return;
    if (!game.hasAttribute('srcdoc') && new URL(gameDoc.URL).pathname !== session.gamePath) return;
    bindGame(session, gameDoc);
    session.initialized = true;
    session.gameVersion = version;
    session.readyHint = [version || session.gameLabel, session.strategyLabel].join(' · ');
    status('idle', '已就緒', session.readyHint);
  }

  function showDiagnostics(session) {
    const doc = session.doc;
    const panel = $('diagnosticPanel');
    const nativePanel = doc.getElementById('diagnostics');
    if (nativePanel && nativePanel.open !== Boolean(panel?.open)) nativePanel.open = Boolean(panel?.open);
    if (!panel?.open) return;
    const visionText = content(doc, 'visionText');
    const source = doc.getElementById('vision');
    const canvas = $('diagnosticCanvas');
    if (canvas && source?.width && source.height && visionText && performance.now() - session.diagPaint >= 900) {
      if (canvas.width !== source.width) canvas.width = source.width;
      if (canvas.height !== source.height) canvas.height = source.height;
      canvas.getContext('2d').drawImage(source, 0, 0);
      canvas.hidden = false;
      session.diagPaint = performance.now();
    }
    if (session.family.id === 'ocr1') {
      const ids = [
        ['playerRadius', '玩家估計半徑'], ['npcCount', '較大 NPC 候選'], ['minimapCount', '小地圖危險紅點群'],
        ['minimapStatus', '小地圖'], ['recognitionFps', '辨識 FPS'], ['recognitionTime', '平均辨識耗時'],
        ['frameQueueCount', '影格佇列'], ['frameStats', '辨識統計']
      ];
      write('diagnosticText', ids.map(([id, label]) => label + '　' + (content(doc, id) || '—')).join('\n'));
    } else {
      write('diagnosticText', [content(doc, 'detail'), visionText].filter(Boolean).join('\n') ||
        (nativePanel ? '等待控制器輸出辨識畫面。' : '此控制器提供文字決策，開始後可查看安全間距、收益與可見威脅。'));
    }
  }

  function updateActivity(session, hint) {
    if (!session.running) return;
    const id = session.family.id;
    const ended = /^(已達標|已確認：過關|本局150秒內過關)|[（(]5\/5[）)]/.test(hint) ||
      ((id === 'grow' || id === 'claude') && session.doc.getElementById('runs')?.childElementCount > session.priorRuns);
    const stopped = id === 'ocr1' ? session.doc.getElementById('autoStop').disabled :
      /已釋放控制並暫停|^已停止$/.test(hint);
    // A native catch handler stops before it publishes the error message.
    const nativeFailure = hint && !/^(正在|遊戲開始|自動控制|等待|已恢復|本局|未達|已達標|已確認|本次決策|已停止|維持|暫維持|沒有前一方向|計算逾時|連續或嚴重計算|偵測到|畫面擷取)/.test(hint);
    if (ended || stopped || (id !== 'ocr1' && nativeFailure)) {
      session.running = false;
      session.stopped = true;
      const failure = !ended && (nativeFailure || /逾時|失敗|未就緒/.test(hint));
      finishRecord(session, ended ? '控制器回報本輪結束' : failure ? '控制器回報中止' : '控制器已停止');
      status(failure ? 'error' : 'stopped', failure ? '控制中止' : ended ? '本輪結束' : '已停止', hint);
    } else {
      const waiting = /等待成績|準備下一局|本局已結束|[（(][1-4]\/5[）)]/.test(hint);
      status('running', waiting ? '等待下一局' : '執行中', hint);
    }
  }

  function readings(session) {
    const doc = session.doc;
    const gameDoc = session.gameDoc;
    if (session.frame.contentDocument !== doc || doc.getElementById('game')?.contentDocument !== gameDoc) {
      loadError(session, '遊戲畫面已重新導覽，請重新載入控制器以核對版本。');
      return;
    }
    const hint = content(doc, 'status');
    updateActivity(session, hint);
    direction(session.keys);
    write('hudSize', content(gameDoc, 'size') || content(doc, 'size') || '—');
    write('hudTime', content(gameDoc, 'time') || content(doc, 'time') || '—');
    write('decisionMs', content(doc, 'ms') || '—');
    write('attempt', content(doc, 'attempt') || '—');
    const title = session.stopped ? '控制已停止' : content(doc, 'decisionTitle') || content(doc, 'action') || '等待策略回報';
    const detail = session.stopped ? '' : content(doc, 'decisionDetail') || content(doc, 'detail');
    if ($('decisionDetail')) {
      write('decision', title);
      write('decisionDetail', detail);
    } else write('decision', [title, detail].filter(Boolean).join('\n'));
    if ($('liveLog')) {
      const entries = [...doc.querySelectorAll('#runs > li')].map(node => node.textContent.trim());
      const rank = content(doc, 'rank');
      write('liveLog', [...entries, rank].filter(Boolean).join('\n') ||
        (doc.getElementById('runs') || doc.getElementById('rank') ? '本次尚無結算紀錄。' : '此控制器未提供逐局紀錄。'));
    }
    showDiagnostics(session);
    const start = doc.getElementById('autoStart') || doc.getElementById('go');
    $('run').disabled = session.running || start.disabled || performance.now() < (session.blockStartUntil || 0);
    const pause = gameDoc.getElementById('pauseButton');
    const playing = pause && !pause.disabled && !gameDoc.querySelector('#pauseScreen.open');
    $('stop').disabled = !session.running && !playing;
  }

  function refresh() {
    const session = current;
    if (!session || session.failed) return;
    try {
      if (!session.initialized) {
        connect(session);
        if (!session.initialized && performance.now() - session.started > 20000) {
          loadError(session, '遊戲或版本未能完成核對。請重新載入或選擇其他策略系列。');
        }
      }
      if (session.initialized && !session.failed) readings(session);
    } catch (error) {
      loadError(session, '無法連接遊戲控制器。' + (error.message || ''));
    }
  }

  function run() {
    const session = current;
    if (!session?.initialized || session.failed || session.running || $('run').disabled) return;
    session.priorRuns = session.doc.getElementById('runs')?.childElementCount || 0;
    session.running = true;
    session.stopped = false;
    beginRecord(session);
    const start = session.doc.getElementById('autoStart') || session.doc.getElementById('go');
    start.click();
    refresh();
  }

  if (!families.size) {
    status('error', '無法載入', '策略目錄無法讀取，請重新整理頁面。');
    return;
  }
  const familyOptions = [...families.values()].map(family => ({label: family.label, value: family.id}));
  options($('familyChoice'), familyOptions);
  options($('historyFilter'), [{label: '全部系列', value: 'all'}, ...familyOptions], 'all');
  renderHistory();
  $('historyFilter').addEventListener('change', renderHistory);
  $('familyChoice').addEventListener('change', () => mount(families.get($('familyChoice').value), current?.gamePath));
  $('gameChoice').addEventListener('change', () => mount(current.family, $('gameChoice').value, current.strategyValue));
  $('variantChoice').addEventListener('change', () => mount(current.family, current.gamePath, $('variantChoice').value));
  $('run').addEventListener('click', run);
  $('stop').addEventListener('click', () => stopSession());
  $('retryController')?.addEventListener('click', () => mount(current.family, current.gamePath, current.strategyValue));
  $('diagnosticPanel')?.addEventListener('toggle', refresh);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && current?.initialized && (current.running || !$('stop').disabled)) stopSession('頁面切至背景');
  });
  window.addEventListener('pagehide', () => { if (current?.initialized) stopSession('離開頁面'); });
  write('sessionHistory', '這個頁面尚未啟動實驗。');
  mount(families.get('grow') || families.values().next().value, '/v2.13');
  window.setInterval(refresh, 220);
})();
