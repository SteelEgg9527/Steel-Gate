/* 钢铁之门 —— 公共排行榜前端
   依赖：SL.UI.currentGame()、/api/leaderboard、/api/submit */
(function () {
  'use strict';
  var SL = window.SL;
  var L = (SL.Leaderboard = {});
  var API = window.SL_LEADERBOARD_API || '';
  var MODES = [
    { id: 'overall', name: '总榜' },
    { id: 'melee', name: '三军混战' },
    { id: 'lastStand', name: '防御模式' },
    { id: 'naval', name: '舰炮轰鸣' },
    { id: 'navalLastStand', name: '背水一战' }
  ];
  var DIFFS = [
    { id: 'easy', name: '简单' },
    { id: 'normal', name: '普通' },
    { id: 'hard', name: '困难' },
    { id: 'endless', name: '无限' }
  ];
  var currentMode = 'overall';
  var currentDiff = 'normal';
  var lbOverlay = null;
  var lbBody = null;
  var lbStatus = null;
  var lbTabs = null;
  var lbDiffTabs = null;
  var lbMy = null;

  function $(id) { return document.getElementById(id); }
  function toast(text, kind) {
    if (SL.UI && SL.UI.pushToast) SL.UI.pushToast(text, kind || 'info');
  }
  function api(path) { return API + path; }
  function modeName(id) {
    for (var i = 0; i < MODES.length; i++) if (MODES[i].id === id) return MODES[i].name;
    return id;
  }
  function diffName(id) {
    for (var i = 0; i < DIFFS.length; i++) if (DIFFS[i].id === id) return DIFFS[i].name;
    return id;
  }
  function playerId() {
    var id = '';
    try { id = localStorage.getItem('steel_player_id') || ''; } catch (e) {}
    if (!id) {
      id = uuid();
      try { localStorage.setItem('steel_player_id', id); } catch (e) {}
    }
    return id;
  }
  function nickname() {
    try { return (localStorage.getItem('steel_nickname') || '').slice(0, 24); } catch (e) { return ''; }
  }
  function setNickname(v) {
    try { localStorage.setItem('steel_nickname', String(v || '').slice(0, 24)); } catch (e) {}
  }
  function autoUploadEnabled() {
    try { return localStorage.getItem('steel_auto_upload') === '1'; } catch (e) { return false; }
  }
  function setAutoUpload(v) {
    try { localStorage.setItem('steel_auto_upload', v ? '1' : '0'); } catch (e) {}
  }
  function promptDisabled() {
    try { return localStorage.getItem('steel_nickname_prompt_disabled') === '1'; } catch (e) { return false; }
  }

  function maybeAskOnEntry() {
    if (nickname() || promptDisabled()) return;
    var ov = document.createElement('div');
    ov.className = 'lb-modal';
    ov.innerHTML = '<div class="lb-modal-box lb-entry-box">' +
      '<h3>设置排行榜昵称</h3>' +
      '<p>用于公共排行榜显示。可在“游戏设置 → 排行榜”中随时修改。</p>' +
      '<input id="lb-entry-nick" maxlength="24" placeholder="输入昵称">' +
      '<label class="lb-check"><input id="lb-entry-auto" type="checkbox"> 自动上传战绩</label>' +
      '<label class="lb-check"><input id="lb-entry-hide" type="checkbox"> 不再弹出</label>' +
      '<p class="lb-entry-hint">自动上传会在对局结束后把战绩上传到公共排行榜。</p>' +
      '<div class="lb-modal-actions"><button type="button" id="lb-entry-later">稍后设置</button>' +
      '<button type="button" id="lb-entry-save" class="primary">保存</button></div>' +
      '</div>';
    document.body.appendChild(ov);
    var input = ov.querySelector('#lb-entry-nick');
    var auto = ov.querySelector('#lb-entry-auto');
    var hide = ov.querySelector('#lb-entry-hide');
    input.focus();
    function close() { if (ov.parentNode) ov.parentNode.removeChild(ov); }
    function save() {
      var v = String(input.value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 24);
      if (!v) { input.focus(); return; }
      setNickname(v);
      setAutoUpload(auto.checked);
      if (hide.checked) {
        try { localStorage.setItem('steel_nickname_prompt_disabled', '1'); } catch (e) {}
      }
      close();
      toast('排行榜昵称已保存', 'win');
    }
    ov.querySelector('#lb-entry-save').addEventListener('click', save);
    ov.querySelector('#lb-entry-later').addEventListener('click', function () {
      if (hide.checked) {
        try { localStorage.setItem('steel_nickname_prompt_disabled', '1'); } catch (e) {}
      }
      close();
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') save();
      if (e.key === 'Escape') close();
    });
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
  }

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  function clock(sec) {
    sec = Math.max(0, Math.floor(sec || 0));
    var m = Math.floor(sec / 60), s = sec % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }
  function isStand(mode) { return mode === 'lastStand' || mode === 'navalLastStand'; }
  function when(iso) {
    var d = new Date(iso);
    if (!d || isNaN(d.getTime())) return '—';
    function p2(n) { return (n < 10 ? '0' : '') + n; }
    return p2(d.getMonth() + 1) + '-' + p2(d.getDate()) + ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes());
  }
  function errorText(status, data) {
    if (status === 404) return '排行榜接口未部署';
    if (status === 503) return '排行榜后端未配置';
    if (status === 429) return '上传太频繁，请稍后再试';
    if (data && data.error === 'backend_not_configured') return '排行榜后端未配置';
    if (data && data.error === 'duplicate_run') return '这一局已经上传过';
    return (data && data.error) ? '请求失败：' + data.error : '网络请求失败';
  }

  function requestJSON(path, options) {
    return fetch(api(path), options).then(function (res) {
      return res.text().then(function (text) {
        var data = null;
        try { data = text ? JSON.parse(text) : null; } catch (e) { data = { raw: text }; }
        if (!res.ok) throw { status: res.status, data: data };
        return data;
      });
    });
  }

  /* ---------------- 昵称 ---------------- */
  function askNickname(cb) {
    if (nickname()) { cb(nickname()); return; }
    var ov = document.createElement('div');
    ov.className = 'lb-modal';
    ov.innerHTML = '<div class="lb-modal-box">' +
      '<h3>上传战绩</h3>' +
      '<p>首次上传需要一个排行榜昵称，之后可以在排行榜里修改。</p>' +
      '<input id="lb-nick-input" maxlength="24" placeholder="输入昵称">' +
      '<div class="lb-modal-actions"><button type="button" id="lb-nick-cancel">取消</button>' +
      '<button type="button" id="lb-nick-ok" class="primary">确定</button></div>' +
      '</div>';
    document.body.appendChild(ov);
    var input = ov.querySelector('#lb-nick-input');
    input.focus();
    function close() { if (ov.parentNode) ov.parentNode.removeChild(ov); }
    function ok() {
      var v = String(input.value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 24);
      if (!v) { input.focus(); return; }
      setNickname(v);
      close();
      cb(v);
    }
    ov.querySelector('#lb-nick-ok').addEventListener('click', ok);
    ov.querySelector('#lb-nick-cancel').addEventListener('click', close);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') ok();
      if (e.key === 'Escape') close();
    });
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
  }

  /* ---------------- 上传 ---------------- */
  function currentPayload(g) {
    var map = SL.Terrain && SL.Terrain.map ? SL.Terrain.map.id : '';
    var shipsSunk = 0;
    if (g.shipRecords) {
      for (var i = 0; i < g.shipRecords.length; i++) {
        if (g.shipRecords[i].side === 'red' && g.shipRecords[i].isShip) shipsSunk++;
      }
    }
    var result = g.state === 'won' ? 'win' : (g.state === 'lost' ? 'loss' : (g.ended ? 'settled' : 'loss'));
    return {
      runId: g._lbRunId || (g._lbRunId = uuid()),
      playerId: playerId(),
      nickname: nickname(),
      mode: g.mode,
      difficulty: g.difficulty,
      mapId: map,
      result: result,
      score: Math.floor((g.teams && g.teams.blue && g.teams.blue.scoreEarned) || 0),
      yellowXp: Math.floor((g.teams && g.teams.blue && g.teams.blue.yellowXp) || 0),
      kills: Math.floor((g.stats && g.stats.kills && g.stats.kills.blue) || 0),
      losses: Math.floor((g.stats && g.stats.losses && g.stats.losses.blue) || 0),
      durationSec: Math.floor(g.time || 0),
      wave: Math.floor((g.defense && g.defense.wave) || 0),
      holdSec: Math.floor((g.defense && g.defense.hold) || 0),
      shipsSunk: shipsSunk,
      bossKills: Math.floor(g.bossKillCount || 0),
      endedAt: g._endedAt ? new Date(g._endedAt).toISOString() : new Date().toISOString(),
      clientVersion: 'v0.12.31'
    };
  }

  function uploadCurrent(btn, options) {
    options = options || {};
    var g = SL.UI && SL.UI.currentGame ? SL.UI.currentGame() : null;
    if (!g || g.testMode || g.demo) { toast('当前对局不能上传', 'loss'); return; }
    if (g._lbUploaded) { toast('这一局已经上传过了', 'info'); return; }
    if (!g.ended) { toast('对局结束后才能上传战绩', 'info'); return; }
    askNickname(function (nick) {
      var payload = currentPayload(g);
      payload.nickname = nick;
      if (btn) { btn.disabled = true; btn.textContent = '上传中…'; }
      requestJSON('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function () {
        g._lbUploaded = true;
        if (btn) { btn.textContent = '已上传'; btn.disabled = true; }
        toast('战绩已上传到公共排行榜', 'win');
        if (options.openAfter !== false) openLeaderboard();
      }).catch(function (err) {
        if (btn) { btn.disabled = false; btn.textContent = '上传战绩'; }
        toast(errorText(err.status, err.data), 'loss');
      });
    });
  }

  function recentStore() {
    try {
      var raw = localStorage.getItem('steel1944_recent_results');
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) { return []; }
  }
  function saveRecentStore(list) {
    try { localStorage.setItem('steel1944_recent_results', JSON.stringify((list || []).slice(0, 12))); } catch (e) {}
  }
  function secondsOf(text) {
    var m = String(text || '').match(/^(\d+):(\d+)$/);
    return m ? (+m[1] * 60 + +m[2]) : 0;
  }

  function uploadRecent(rec, done) {
    if (!rec) return;
    if (rec.uploaded) { toast('这一局已经上传过', 'info'); return; }
    askNickname(function (nick) {
      var list = recentStore();
      if (!rec.runId) rec.runId = uuid();
      var mode = rec.modeId || ({ '三军混战': 'melee', '防御模式': 'lastStand', '舰炮轰鸣': 'naval', '背水一战': 'navalLastStand' }[rec.mode] || 'melee');
      var difficulty = rec.difficultyId || ({ '简单': 'easy', '普通': 'normal', '困难': 'hard', '无限': 'endless' }[rec.difficulty] || 'normal');
      var payload = {
        runId: rec.runId,
        playerId: playerId(),
        nickname: nick,
        mode: mode,
        difficulty: difficulty,
        mapId: rec.mapId || '',
        result: rec.result || (rec.win ? 'win' : 'loss'),
        score: Math.max(0, Math.floor(rec.score || 0)),
        yellowXp: Math.max(0, Math.floor(rec.yellowXp || 0)),
        kills: Math.max(0, Math.floor(rec.kills || 0)),
        losses: Math.max(0, Math.floor(rec.losses || 0)),
        durationSec: rec.durationSec != null ? rec.durationSec : secondsOf(rec.time),
        wave: Math.max(0, Math.floor(rec.wave || 0)),
        holdSec: Math.max(0, Math.floor(rec.holdSec || 0)),
        shipsSunk: Math.max(0, Math.floor(rec.shipsSunk || 0)),
        bossKills: Math.max(0, Math.floor(rec.bossKills || 0)),
        endedAt: rec.endedAt || new Date(rec.ts || Date.now()).toISOString(),
        clientVersion: 'v0.12.31'
      };
      requestJSON('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function () {
        rec.uploaded = true;
        rec.runId = payload.runId;
        var found = false;
        for (var i = 0; i < list.length; i++) {
          if ((list[i].runId && list[i].runId === rec.runId) || (!list[i].runId && list[i].ts === rec.ts)) {
            list[i].uploaded = true;
            list[i].runId = rec.runId;
            found = true;
            break;
          }
        }
        if (!found) list.unshift(rec);
        saveRecentStore(list);
        toast('近期战绩已上传', 'win');
        if (done) done();
      }).catch(function (err) {
        if (err && err.status === 409) {
          rec.uploaded = true;
          saveRecentStore(list);
          toast('这一局已经上传过', 'info');
          if (done) done();
          return;
        }
        toast(errorText(err.status, err.data), 'loss');
      });
    });
  }

  L.uploadRecent = uploadRecent;

  function onGameEnd(g) {
    if (!autoUploadEnabled() || !g || g.testMode || g.demo || g._lbAutoTried || g._lbUploaded) return;
    g._lbAutoTried = true;
    uploadCurrent(null, { openAfter: true });
  }

  L.onGameEnd = onGameEnd;

  /* ---------------- 排行榜界面 ---------------- */
  function ensureOverlay() {
    if (lbOverlay) return;
    lbOverlay = document.createElement('div');
    lbOverlay.id = 'public-leaderboard';
    lbOverlay.className = 'overlay hidden';
    lbOverlay.innerHTML = '<div class="sheet lb-sheet">' +
      '<div class="sheet-head"><div><div class="sheet-kicker">PUBLIC RANKING</div>' +
      '<h2>公共排行榜</h2><p class="sheet-sub">总榜综合全部模式与难度；可继续按模式、难度细分。每人只显示最好的一局</p></div>' +
      '<div class="lb-head-actions"><button id="lb-recent" class="lb-recent-btn" type="button">近期战绩</button>' +
      '<button id="lb-close" class="icon-btn" type="button">×</button></div></div>' +
      '<div class="sheet-body">' +
      '<div class="lb-tabs" id="lb-mode-tabs"></div>' +
      '<div class="lb-tabs lb-diff-tabs" id="lb-diff-tabs"></div>' +
      '<div class="lb-status" id="lb-status"></div>' +
      '<div class="lb-table"><div class="lb-row lb-head-row" id="lb-head"></div><div id="lb-rows"></div></div>' +
      '<div class="lb-my" id="lb-my"></div>' +
      '</div></div>';
    document.body.appendChild(lbOverlay);
    lbBody = lbOverlay.querySelector('#lb-rows');
    lbStatus = lbOverlay.querySelector('#lb-status');
    lbTabs = lbOverlay.querySelector('#lb-mode-tabs');
    lbDiffTabs = lbOverlay.querySelector('#lb-diff-tabs');
    lbMy = lbOverlay.querySelector('#lb-my');
    lbOverlay.querySelector('#lb-close').addEventListener('click', function () { lbOverlay.classList.add('hidden'); });
    lbOverlay.querySelector('#lb-recent').addEventListener('click', function () {
      lbOverlay.classList.add('hidden');
      if (SL.UI && SL.UI.openRecentResults) SL.UI.openRecentResults();
    });
    lbOverlay.addEventListener('click', function (e) { if (e.target === lbOverlay) lbOverlay.classList.add('hidden'); });
    renderTabs();
  }

  function makeTab(box, label, active, click) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'lb-tab' + (active ? ' active' : '');
    b.textContent = label;
    b.addEventListener('click', click);
    box.appendChild(b);
  }

  function renderTabs() {
    if (!lbTabs) return;
    lbTabs.innerHTML = '';
    for (var i = 0; i < MODES.length; i++) {
      (function (m) {
        makeTab(lbTabs, m.name, m.id === currentMode, function () {
          currentMode = m.id; renderTabs(); loadLeaderboard();
        });
      })(MODES[i]);
    }
    lbDiffTabs.style.display = currentMode === 'overall' ? 'none' : 'flex';
    lbDiffTabs.innerHTML = '';
    for (var j = 0; j < DIFFS.length; j++) {
      (function (d) {
        makeTab(lbDiffTabs, d.name, d.id === currentDiff, function () {
          currentDiff = d.id; renderTabs(); loadLeaderboard();
        });
      })(DIFFS[j]);
    }
  }

  function headRow() {
    var head = lbOverlay.querySelector('#lb-head');
    head.innerHTML = '';
    var fields = currentMode === 'overall'
      ? ['名次', '玩家', '综合分', '模式', '难度', '得分', '结算']
      : (isStand(currentMode)
        ? ['名次', '玩家', '波次', '坚守', '击杀', '难度', '结算']
        : ['名次', '玩家', '黄圈经验', '得分', '击杀', '难度', '结算']);
    head.className = 'lb-row lb-head-row' + (currentMode === 'overall' ? ' lb-overall-row' : '');
    for (var i = 0; i < fields.length; i++) {
      var s = document.createElement('span');
      s.textContent = fields[i];
      head.appendChild(s);
    }
  }

  function renderRows(data) {
    headRow();
    lbBody.innerHTML = '';
    if (!data.entries || !data.entries.length) {
      var empty = document.createElement('div');
      empty.className = 'lb-empty';
      empty.textContent = '这个榜单还没有记录';
      lbBody.appendChild(empty);
    } else {
      for (var i = 0; i < data.entries.length; i++) {
        var r = data.entries[i];
        var row = document.createElement('div');
        row.className = 'lb-row' + (i < 3 ? ' top' : '') + (currentMode === 'overall' ? ' lb-overall-row' : '');
        var vals = currentMode === 'overall'
          ? [r.rank, r.nickname, r.points, modeName(r.mode), diffName(r.difficulty), r.score, when(r.createdAt)]
          : (isStand(currentMode)
            ? [r.rank, r.nickname, r.wave + ' 波', clock(r.holdSec), r.kills, diffName(r.difficulty), when(r.createdAt)]
            : [r.rank, r.nickname, r.yellowXp, r.score, r.kills, diffName(r.difficulty), when(r.createdAt)]);
        for (var j = 0; j < vals.length; j++) {
          var s = document.createElement('span');
          s.textContent = String(vals[j]);
          row.appendChild(s);
        }
        lbBody.appendChild(row);
      }
    }
    lbMy.textContent = data.myRank ? '我的排名：第 ' + data.myRank + ' 名' : '我的排名：本榜前 ' + Math.max(1, (data.entries || []).length) + ' 名之外';
  }

  function loadLeaderboard() {
    if (!lbOverlay) return;
    lbStatus.textContent = '加载中…';
    lbBody.innerHTML = '';
    headRow();
    var url = currentMode === 'overall'
      ? '/api/leaderboard?scope=overall&limit=100&playerId=' + encodeURIComponent(playerId())
      : '/api/leaderboard?mode=' + encodeURIComponent(currentMode) +
        '&difficulty=' + encodeURIComponent(currentDiff) +
        '&limit=100&playerId=' + encodeURIComponent(playerId());
    requestJSON(url)
      .then(function (data) {
        lbStatus.textContent = currentMode === 'overall'
          ? '总榜 · 全部模式与难度 · 最近 100 局'
          : modeName(currentMode) + ' · ' + diffName(currentDiff) + ' · 最近 100 局';
        renderRows(data);
      })
      .catch(function (err) {
        lbStatus.textContent = errorText(err.status, err.data);
        lbBody.innerHTML = '';
        lbMy.textContent = '';
      });
  }

  function openLeaderboard(mode, diff) {
    ensureOverlay();
    currentMode = mode || 'overall';
    currentDiff = diff || (SL.UI.currentGame && SL.UI.currentGame() ? SL.UI.currentGame().difficulty : 'normal');
    if (!modeName(currentMode)) currentMode = 'overall';
    if (!diffName(currentDiff)) currentDiff = 'normal';
    renderTabs();
    lbOverlay.classList.remove('hidden');
    loadLeaderboard();
  }
  L.open = openLeaderboard;
  L.uploadCurrent = uploadCurrent;

  /* ---------------- 按钮注入 ---------------- */
  function injectButtons() {
    var foot = document.querySelector('#result .sheet-foot');
    if (foot && !$('lb-upload-btn')) {
      var upload = document.createElement('button');
      upload.id = 'lb-upload-btn';
      upload.type = 'button';
      upload.className = 'menu-return';
      upload.textContent = '上传战绩';
      upload.addEventListener('click', function () { uploadCurrent(upload); });
      foot.insertBefore(upload, $('btn-again'));

      var open = document.createElement('button');
      open.id = 'lb-open-result';
      open.type = 'button';
      open.className = 'menu-return';
      open.textContent = '公共排行榜';
      open.addEventListener('click', function () { openLeaderboard(); });
      foot.insertBefore(open, $('btn-again'));
    }
  }

  function boot() {
    injectButtons();
    if (!lbOverlay) ensureOverlay();
    lbOverlay.classList.add('hidden');
    setTimeout(maybeAskOnEntry, 650);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else setTimeout(boot, 80);
})();
