/* 钢铁之门 —— 公共排行榜前端
   依赖：SL.UI.currentGame()、/api/leaderboard、/api/submit */
(function () {
  'use strict';
  var SL = window.SL;
  var L = (SL.Leaderboard = {});
  var API = window.SL_LEADERBOARD_API || '';
  var MODES = [
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
  var currentMode = 'melee';
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
      clientVersion: 'v0.12.31'
    };
  }

  function uploadCurrent(btn) {
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
        openLeaderboard(g.mode, g.difficulty);
      }).catch(function (err) {
        if (btn) { btn.disabled = false; btn.textContent = '上传战绩'; }
        toast(errorText(err.status, err.data), 'loss');
      });
    });
  }

  /* ---------------- 排行榜界面 ---------------- */
  function ensureOverlay() {
    if (lbOverlay) return;
    lbOverlay = document.createElement('div');
    lbOverlay.id = 'public-leaderboard';
    lbOverlay.className = 'overlay hidden';
    lbOverlay.innerHTML = '<div class="sheet lb-sheet">' +
      '<div class="sheet-head"><div><div class="sheet-kicker">PUBLIC RANKING</div>' +
      '<h2>公共排行榜</h2><p class="sheet-sub">按模式与难度分开统计，每人只显示最好的一局</p></div>' +
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
    var fields = isStand(currentMode)
      ? ['名次', '玩家', '波次', '坚守', '击杀', '难度']
      : ['名次', '玩家', '黄圈经验', '得分', '击杀', '难度'];
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
        row.className = 'lb-row' + (i < 3 ? ' top' : '');
        var vals = isStand(currentMode)
          ? [r.rank, r.nickname, r.wave + ' 波', clock(r.holdSec), r.kills, diffName(r.difficulty)]
          : [r.rank, r.nickname, r.yellowXp, r.score, r.kills, diffName(r.difficulty)];
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
    requestJSON('/api/leaderboard?mode=' + encodeURIComponent(currentMode) +
      '&difficulty=' + encodeURIComponent(currentDiff) +
      '&limit=50&playerId=' + encodeURIComponent(playerId()))
      .then(function (data) {
        lbStatus.textContent = modeName(currentMode) + ' · ' + diffName(currentDiff) + ' · TOP 50';
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
    currentMode = mode || (SL.UI.currentGame && SL.UI.currentGame() ? SL.UI.currentGame().mode : 'melee');
    currentDiff = diff || (SL.UI.currentGame && SL.UI.currentGame() ? SL.UI.currentGame().difficulty : 'normal');
    if (!modeName(currentMode)) currentMode = 'melee';
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
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else setTimeout(boot, 80);
})();
