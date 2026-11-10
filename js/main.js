/* 钢铁之门 —— 入口、镜头、输入、主循环 */
(function () {
  'use strict';
  var SL = window.SL, U = SL.U, R = SL.Render, UI = SL.UI;
  var STEP = 1 / 20;
  var params = new URLSearchParams(location.search);

  var game = null;
  var started = false;
  var paused = false;
  var demo = params.get('demo') === '1';
  var follow = params.get('follow') === '1';
  var gameMode = 'melee';
  var battleFamily = 'melee';
  var difficulty = 'normal';
  function isNavalMode(id) { return id === 'naval' || id === 'navalLastStand'; }
  function isStandMode(id) { return id === 'lastStand' || id === 'navalLastStand'; }
  function deployFamily(id) { return isStandMode(id) ? 'lastStand' : 'melee'; }
  function currentFamily() { return (SL.Terrain.map && SL.Terrain.map.test) ? 'training' : battleFamily; }
  function familyName(family) { return family === 'training' ? '训练' : (family === 'lastStand' ? '背水一战' : '混战'); }
  function modeForFamily(family, map) {
    if (map && map.test) return map.naval ? 'naval' : 'melee';
    if (family === 'training') return map && map.naval ? 'naval' : 'melee';
    if (family === 'lastStand') return map && map.naval ? 'navalLastStand' : 'lastStand';
    return map && map.naval ? 'naval' : 'melee';
  }
  if (params.get('mode') === 'lastStand') { gameMode = 'lastStand'; battleFamily = 'lastStand'; }
  if (params.get('mode') === 'naval') gameMode = 'naval';
  if (params.get('mode') === 'navalLastStand') { gameMode = 'navalLastStand'; battleFamily = 'lastStand'; }
  if (params.get('difficulty') && (SL.LAST_STAND.difficulties[params.get('difficulty')] || SL.MELEE_DIFFICULTIES[params.get('difficulty')])) {
    difficulty = params.get('difficulty');
  }
  var last = 0, acc = 0;
  var keys = {};
  var drag = null;
  var world = null;
  var lastRight = 0, lastRightX = 0, lastRightY = 0;

  function boot() {
    var seed = parseInt(params.get('seed') || '19440606', 10) || 19440606;
    var bootEl = document.getElementById('boot');
    var paramMap = params.get('map');
    // 先让加载层画出来，再做地图测绘
    setTimeout(function () {
      var playable = SL.MAPS.filter(function (m) {
        return !m.test && !m.custom;
      });
      if (!playable.length) playable = SL.MAPS.filter(function (m) { return !m.test && !m.custom; });
      var chosen = (paramMap && SL.MAP_BY_ID[paramMap])
        ? paramMap
        : playable[Math.floor(Math.random() * playable.length)].id;
      if (SL.MAP_BY_ID[chosen].test) battleFamily = 'training';
      gameMode = modeForFamily(battleFamily, SL.MAP_BY_ID[chosen]);
      SL.Terrain.setMap(chosen);
      SL.Terrain.build(seed);
      world = document.getElementById('world');
      R.init(world, document.getElementById('overlay'));
      wrapHudForScale();
      UI.init({
        onStart: begin,
        onRestart: restart,
        onMenu: openGameMenu,
        onReturnMenu: returnToMenu,
        onCloseMenu: closeGameMenu,
        onTogglePause: togglePause,
        onChooseMap: chooseMap,
        onCamera: function (x, y) { R.centerOn(x, y); },
        onMinimapOrder: function (x, y) {
          if (!started || game.state !== 'playing') return;
          if (!game.selected.length) { R.centerOn(x, y); return; }
          game.commandMove(game.selected, x, y);
          R.addMarker(x, y, 'move');
        }
      });
      newGame(params.get('autostart') === '1');
      bindMainMenu();
      bindCustomMaps();
      if (!started) showMainMenu(); else hideMainMenu();
      UI.setMapButtons(SL.Terrain.map.id, gameMode, battleFamily);
      renderModeButtons();
      updateObjective();
      drawDeploymentPreview();
      bindInput();
      bindTrainingAIBombing();
      if (params.get('help') === '1') UI.toggleHelp(true);
      R.draw(game, 0);
      requestAnimationFrame(frame);
      if (bootEl) {
        bootEl.classList.add('done');
        setTimeout(function () { bootEl.parentNode && bootEl.parentNode.removeChild(bootEl); }, 500);
      }
      window.__STEEL = {
        game: function () { return game; },
        render: R,
        ui: UI,
        begin: begin,
        restart: restart,
        pause: function (v) {
          if (!started) return;
          paused = !!v;
          UI.setPaused(paused);
        },
        isPaused: function () { return paused; }
      };
    }, 40);
  }

  function updateObjective() {
    var el = document.getElementById('objective');
    var m = SL.Terrain.map;
    var actualMode = game ? game.mode : gameMode;
    var diffTable = isStandMode(actualMode) ? SL.LAST_STAND.difficulties : SL.MELEE_DIFFICULTIES;
    var diff = diffTable[difficulty] || diffTable.normal;
    if (el && m) {
      el.textContent = m.test ? '训练场 · 无敌人'
        : familyName(currentFamily()) + ' · ' + diff.name + ' · ' + m.name;
    }
    var cur = document.getElementById('map-current');
    if (cur && m) cur.textContent = m.name + ' · ' + m.subtitle;
    var title = document.getElementById('brief-title');
    if (title && m) title.textContent = '作战部署 · ' + m.name;
    var stamp = document.getElementById('brief-stamp');
    if (stamp) stamp.textContent = m.test ? '训练' : familyName(currentFamily());
    var missionTag = document.getElementById('mission-tag');
    if (missionTag) missionTag.textContent = m.test ? '训练' : familyName(currentFamily());
    var sub = document.getElementById('brief-sub');
    if (sub) {
      sub.textContent = '1944 年 6 月 10 日 · ' +
        (m.test ? '训练场 · 无敌人'
          : (m.naval ? '海战' : '陆战') + ' · ' + familyName(currentFamily()) + ' · ' + diff.name +
            (diff.endless ? ' · 无胜利条件' : '难度'));
    }
    var copy = document.getElementById('brief-copy');
    if (copy) {
      var winText;
      if (actualMode === 'lastStand' || actualMode === 'navalLastStand') {
        winText = '守住黄圈至目标时间即获胜；黄圈被红队占领则失败。' +
          (diff.holdTime === Infinity ? '无限难度无自动胜利时间，需持续防守。' : '本难度目标坚守时间：' + U.clock(diff.holdTime) + '。');
      } else if (diff.endless) {
        winText = '本难度没有自动胜利条件，持续作战并积累黄圈经验。';
      } else {
        winText = '黄圈经验达到 100,000 即获胜。';
      }
      var strongholds = [];
      if (actualMode === 'naval' || actualMode === 'navalLastStand') {
        strongholds.push('<li><b>黄圈</b>：主要争夺与防守目标，持续提供经验。</li>');
        strongholds.push('<li><b>通讯塔</b>：提供舰炮校射与装填加成，是舰炮支援的重要节点。</li>');
        strongholds.push('<li><b>雷达站</b>：定期搜索海面与空中目标。</li>');
        strongholds.push('<li><b>海岸基地</b>：占领后可获得 406mm 岸防炮。</li>');
        strongholds.push('<li><b>港口</b>：双岸湾地图的港湾，占领方可在港口附近生成舰艇。</li>');
        strongholds.push('<li><b>村庄 / 林地 / 工事</b>：提供占领区、掩护、连队经验与花费分数。</li>');
      } else {
        strongholds.push('<li><b>黄圈</b>：主要争夺目标，圈内优势单位持续获得黄圈经验与花费分数。</li>');
        strongholds.push('<li><b>村庄 / 林地 / 工事</b>：可占领区域，提供掩护、连队经验与花费分数。</li>');
      }
      var formation = [
        '<li><b>编队系统</b>：选中部队后点击“+”；点击编队可选中全部成员，“←”把当前选择存入编组，“×”删除编组。</li>',
        '<li><b>自动编队</b>：点击部队清单下方的“自动编队”，按单位类型自动重建编组。</li>',
        '<li><b>自动部署</b>：点击“快速部署”，使用一张单位卡在友军附近自动放置单位。</li>'
      ];
      var systems = [];
      if (actualMode === 'naval' || actualMode === 'navalLastStand') {
        systems.push('<li><b>舰船系统</b>：点击“舰船系统”购买舰船或支援卡；选择卡片后在海面使用。战舰可执行舰炮压制、岸轰、水上飞机侦察和补给。</li>');
      }
      systems.push('<li><b>轰炸机系统</b>：打开空中系统购买 B-17 与航弹，拖入编组栏后起飞；返航后可重新配备，或在配备面板选择是否自动补充弹药。</li>');
      var purchases = [
        '<li><b>购买抽卡</b>：点击“卡片增援”消耗分数增加一次抽卡机会；抽卡可获得单位、装备、工事或舰船卡。</li>',
        '<li><b>购买单位</b>：点击“单位增援”消耗分数，在友军附近召唤一个随机单位。</li>'
      ];
      copy.innerHTML =
        '<h3>胜利条件</h3><p>' + winText + '</p>' +
        '<h3>基本操作</h3><p>左键选择或框选，右键移动、攻击或占领；双击右键急行军；空格暂停；H 打开帮助；Esc 打开菜单。</p>' +
        '<h3>编队与部署</h3><ul>' + formation.join('') + '</ul>' +
        '<h3>据点作用</h3><ul>' + strongholds.join('') + '</ul>' +
        '<h3>舰船与轰炸机</h3><ul>' + systems.join('') + '</ul>' +
        '<h3>购买与补充</h3><ul>' + purchases.join('') + '</ul>';
    }
    var md = document.getElementById('mode-desc');
    if (md) md.textContent = m.test ? '训练场固定为单阵营测试模式。' : (currentFamily() === 'lastStand' ? '防守规则 · 守住黄圈，抵挡分波进攻。' : '混战规则 · 黄圈与据点争夺，击败其他阵营。');
    var mc = document.getElementById('mode-current');
    if (mc) mc.textContent = m.test ? '训练场' : familyName(currentFamily());
    var dc = document.getElementById('difficulty-current');
    if (dc) dc.textContent = isStandMode(actualMode)
      ? diff.name + ' · ' + (diff.holdTime === Infinity ? '无限' : U.clock(diff.holdTime))
      : diff.name + ' · ' + (diff.endless ? '无胜利条件' : '100,000 经验胜利');
  }

  function renderModeButtons() {
    var modeBox = document.getElementById('mode-buttons');
    var diffBox = document.getElementById('difficulty-buttons');
    var diffPick = document.getElementById('difficulty-pick');
    var isTest = !!(SL.Terrain.map && SL.Terrain.map.test);
    var selectedFamily = currentFamily();
    var families = [
      { id: 'melee', name: '混战' },
      { id: 'lastStand', name: '背水一战' },
      { id: 'training', name: '训练' }
    ];
    if (modeBox) {
      modeBox.innerHTML = '';
      families.forEach(function (family) {
        var b = document.createElement('button');
        b.className = 'map-btn' + (selectedFamily === family.id ? ' on' : '');
        b.textContent = family.name;
        b.disabled = isTest && family.id === 'lastStand';
        if (b.disabled) b.title = '训练场不支持背水一战';
        b.addEventListener('click', function () { selectMode(family.id); });
        modeBox.appendChild(b);
      });
    }
    if (diffBox) {
      diffBox.innerHTML = '';
      var diffTable = isStandMode(gameMode) ? SL.LAST_STAND.difficulties : SL.MELEE_DIFFICULTIES;
      Object.keys(diffTable).forEach(function (id) {
        var d = diffTable[id];
        var b = document.createElement('button');
        b.className = 'map-btn' + (difficulty === id ? ' on' : '');
        b.textContent = d.name;
        b.addEventListener('click', function () { selectDifficulty(id); });
        diffBox.appendChild(b);
      });
    }
    if (diffPick) diffPick.classList.toggle('hidden', isTest);

  }

  function selectMode(family) {
    if (family !== 'melee' && family !== 'lastStand' && family !== 'training') return;
    var map = SL.Terrain.map;
    var mapIsTest = !!(map && map.test);
    var wantsTest = family === 'training';
    if (wantsTest !== mapIsTest) {
      var pool = SL.MAPS.filter(function (m) {
        if (wantsTest) return !!m.test;
        return !m.test && !m.custom;
      });
      if (!pool.length) return;
      battleFamily = family;
      chooseMap(pool[0].id, true);
      return;
    }
    battleFamily = family;
    var next = modeForFamily(family, map);
    if (next === gameMode) {
      renderModeButtons();
      if (UI.setMapButtons) UI.setMapButtons(map.id, gameMode, battleFamily);
      return;
    }
    gameMode = next;
    newGame(false);
    renderModeButtons();
    if (UI.setMapButtons) UI.setMapButtons(map.id, gameMode, battleFamily);
    updateObjective();
    drawDeploymentPreview();
  }

  function selectDifficulty(id) {
    var valid = isStandMode(gameMode) ? SL.LAST_STAND.difficulties[id] : SL.MELEE_DIFFICULTIES[id];
    if (!valid || id === difficulty) return;
    difficulty = id;
    if (!SL.Terrain.map.test) newGame(false);
    renderModeButtons();
  }

  function gameOptions() {
    return { demo: demo, mode: gameMode, difficulty: difficulty };
  }

  // 在简报里换战场：重生成地形并开一局新的（仅开局前可见）
  function chooseMap(id, force) {
    if (id === 'random') {
      var playable = SL.MAPS.filter(function (m) {
        if (battleFamily === 'training') return !!m.test;
        return !m.test && !m.custom;
      });
      if (!playable.length) playable = SL.MAPS.filter(function (m) { return !m.test && !m.custom; });
      id = playable[Math.floor(Math.random() * playable.length)].id;
    }
    if (!SL.MAP_BY_ID[id] || (!force && SL.Terrain.map && id === SL.Terrain.map.id)) return;
    if (SL.MAP_BY_ID[id].test) battleFamily = 'training';
    gameMode = modeForFamily(battleFamily, SL.MAP_BY_ID[id]);
    SL.Terrain.setMap(id);
    SL.Terrain.build();
    game = SL.Game.create(gameOptions());
    UI.bind(game);
    started = false;
    paused = false;
    UI.showBriefing(true);
    centerOnArmy();
    UI.setMapButtons(id, gameMode, battleFamily);
    renderModeButtons();
    updateObjective();
    drawDeploymentPreview();
    R.draw(game, 0);
  }

  function newGame(autostart) {
    game = SL.Game.create(gameOptions());
    // 本地试玩入口：?trial=1 提供轰炸机测试积分，不影响正常对局
    if (params.get('trial') === '1' && game.teams && game.teams.blue && !game.testMode) game.teams.blue.score += 20000;
    UI.bind(game);
    UI.hideGameMenu();
    paused = false;
    UI.setPaused(false);
    started = !!autostart;
    UI.showBriefing(!started);
    centerOnArmy();
    if (params.get('sel') === '1') game.setSelection(game.aliveOf('blue'));
    if (params.get('sel') === 'one') {
      var pick = game.units.filter(function (u) { return u.side === 'blue' && u.type === 'tank'; })[0];
      if (pick) game.setSelection([pick]);
    }
    if (params.get('sel') === 'inf') {
      var pickInf = game.units.filter(function (u) { return u.side === 'blue' && u.type === 'infantry'; })[0];
      if (pickInf) game.setSelection([pickInf]);
    }
    updateObjective();
    renderModeButtons();
    if (started) fastForward();
  }

  function centerOnArmy() {
    var cx = 0, cy = 0, n = 0, i;
    for (i = 0; i < game.units.length; i++) {
      var u = game.units[i];
      if (u.side === 'blue') { cx += u.x; cy += u.y; n++; }
    }
    // 默认缩放：2km 地图不铺满整宽，取一个更适合指挥的中景
    var zParam = parseFloat(params.get('zoom') || '0');
    var z = zParam > 0 ? zParam
      : Math.max(1.15, Math.max(R.proj.w, R.proj.h) / SL.CONFIG.mapSize * 1.55);
    R.cam.zoom = U.clamp(z, R.cam.min, R.cam.max);
    if (game.mode === 'lastStand' && game.defense && n) {
      // 防守模式开局同时看到边缘出生点与黄圈，便于立即布防
      R.cam.zoom = U.clamp(Math.min(z, 0.82), R.cam.min, R.cam.max);
      R.centerOn((cx / n + game.yellow.x) / 2, (cy / n + game.yellow.y) / 2);
      R.clampCamStrict();
      return;
    }
    if (game.mode === 'naval' && game.radar) {
      R.cam.zoom = U.clamp(0.62, R.cam.min, R.cam.max);
      if (n) R.centerOn(cx / n, cy / n);
      else R.centerOn(game.radar.x, game.radar.y);
      R.clampCamStrict();
      return;
    }
    if (game.testMode) {
      R.cam.zoom = U.clamp(0.65, R.cam.min, R.cam.max);
      R.centerOn(SL.CONFIG.mapSize / 2, 1100);
    } else if (n) {
      R.centerOn(cx / n, cy / n);
    }
    R.clampCamStrict();
  }

  function wrapHudForScale() {
    var app = document.getElementById('app');
    if (!app || document.getElementById('hud-scale')) return;
    var hud = document.createElement('div');
    hud.id = 'hud-scale';
    var ids = [
      'topbar', 'yellow-hud', 'naval-hud', 'defense-hud', 'boss-hud',
      'boss-kill-banner', 'perf-hud', 'draft-alert', 'range-tools',
      'roster-panel', 'selpanel', 'minimap-panel', 'rightpanels',
      'draft-queue-wrap', 'cardbar', 'toasts', 'hint', 'pause-badge', 'system-dock'
    ];
    for (var i = 0; i < ids.length; i++) {
      var node = document.getElementById(ids[i]);
      if (node) hud.appendChild(node);
    }
    app.appendChild(hud);
  }

  function showMainMenu() {
    var mm = document.getElementById('main-menu');
    if (!mm) return;
    var cm = document.getElementById('custom-maps');
    if (cm) cm.classList.add('hidden');
    var me = document.getElementById('map-editor');
    if (me) me.classList.add('hidden');
    UI.showBriefing(false);
    UI.hideResult();
    mm.classList.remove('hidden');
    var cont = document.getElementById('mm-continue');
    if (cont) {
      var hasSave = false;
      try { hasSave = !!localStorage.getItem('steel1944_endless_save'); } catch (e) {}
      cont.disabled = !hasSave;
      cont.title = hasSave ? '读取最近的无尽模式存档' : '暂无存档';
    }
  }

  function hideMainMenu() {
    var mm = document.getElementById('main-menu');
    if (mm) mm.classList.add('hidden');
  }

  function continueSavedGame() {
    var data = null;
    try {
      var raw = localStorage.getItem('steel1944_endless_save');
      if (raw) data = JSON.parse(raw);
    } catch (e) {}
    if (!data) { UI.pushToast('没有可读取的存档', 'loss'); return; }
    battleFamily = data.mode === 'lastStand' ? 'lastStand' : 'melee';
    gameMode = data.mode === 'naval' ? 'naval' : (data.mode === 'lastStand' ? 'lastStand' : 'melee');
    difficulty = 'endless';
    if (!SL.Terrain.map || SL.Terrain.map.id !== data.map) {
      SL.Terrain.setMap(data.map);
      SL.Terrain.build();
    }
    newGame(false);
    if (UI.loadGame()) {
      started = true;
      paused = false;
      UI.setPaused(false);
      UI.showBriefing(false);
      UI.hideResult();
      hideMainMenu();
      UI.update(game, 0.016);
      R.draw(game, 0);
    } else {
      showMainMenu();
    }
  }

  var customEditingId = null;

  function customEl(id) { return document.getElementById(id); }

  function openCustomMaps() {
    hideMainMenu();
    renderCustomMapList();
    var el = customEl('custom-maps');
    if (el) el.classList.remove('hidden');
  }

  function closeCustomMaps() {
    var el = customEl('custom-maps');
    if (el) el.classList.add('hidden');
    showMainMenu();
  }

  function customMapDate(ts) {
    try { return new Date(ts || Date.now()).toLocaleDateString(); } catch (e) { return ''; }
  }

  function renderCustomMapList() {
    var box = customEl('custom-map-list');
    if (!box) return;
    box.innerHTML = '';
    var list = (SL.CustomMaps && SL.CustomMaps.list()) || [];
    if (!list.length) {
      var empty = document.createElement('div');
      empty.className = 'custom-map-empty';
      empty.textContent = '还没有自定义地图。点击“新建地图”开始设计。';
      box.appendChild(empty);
      return;
    }
    list.sort(function (a, b) { return (b.updated || 0) - (a.updated || 0); });
    for (var i = 0; i < list.length; i++) {
      (function (entry) {
        var row = document.createElement('div');
        row.className = 'custom-map-row';
        var main = document.createElement('div');
        main.className = 'custom-map-main';
        var name = document.createElement('div');
        name.className = 'custom-map-name';
        name.textContent = entry.name || '自定义地图';
        var meta = document.createElement('div');
        meta.className = 'custom-map-meta';
        var isNaval = !!(entry.plan && (entry.plan.mode === 'naval' || Number(entry.plan.size) === 5000));
        var mapKm = Number(entry.plan && entry.plan.size ? entry.plan.size : 2000) / 1000;
        meta.textContent = mapKm + 'km ' + (isNaval ? '海战' : '陆战') + ' · 更新 ' + customMapDate(entry.updated);
        main.appendChild(name);
        main.appendChild(meta);
        var buttons = document.createElement('div');
        buttons.className = 'custom-map-buttons';
        function addBtn(label, fn, primary) {
          var b = document.createElement('button');
          b.type = 'button';
          if (primary) b.className = 'primary';
          b.textContent = label;
          b.addEventListener('click', fn);
          buttons.appendChild(b);
        }
        if (isNaval) {
          addBtn('混战', function () { playCustomMap(entry.id, 'naval'); }, true);
          addBtn('背水一战', function () { playCustomMap(entry.id, 'navalLastStand'); });
        } else {
          addBtn('混战', function () { playCustomMap(entry.id, 'melee'); }, true);
          addBtn('背水一战', function () { playCustomMap(entry.id, 'lastStand'); });
        }
        addBtn('编辑', function () { openMapEditor(entry); });
        addBtn('导出', function () { SL.CustomMaps.exportPlan(entry.id); });
        addBtn('删除', function () {
          if (!confirm('删除自定义地图“' + (entry.name || '未命名') + '”？')) return;
          SL.CustomMaps.remove(entry.id);
          renderCustomMapList();
        });
        row.appendChild(main);
        row.appendChild(buttons);
        box.appendChild(row);
      })(list[i]);
    }
  }

  function openMapEditor(entry) {
    customEditingId = entry ? entry.id : null;
    var list = customEl('custom-maps');
    if (list) list.classList.add('hidden');
    var editor = customEl('map-editor');
    var frame = customEl('custom-editor-frame');
    var status = customEl('editor-status');
    if (!editor || !frame) return;
    if (status) status.textContent = entry ? '正在载入地图…' : '参考图不会写入地图文件';
    editor.classList.remove('hidden');
    frame.onload = function () {
      if (entry && frame.contentWindow && frame.contentWindow.__MAP_EDITOR__ &&
          frame.contentWindow.__MAP_EDITOR__.importData) {
        try {
          frame.contentWindow.__MAP_EDITOR__.importData(SL.CustomMaps.plan(entry.id));
          if (status) status.textContent = '已载入：' + (entry.name || '自定义地图');
        } catch (e) { if (status) status.textContent = '载入失败：' + e.message; }
      } else if (status) {
        status.textContent = '参考图不会写入地图文件';
      }
    };
    frame.src = 'tools/map-planner.html?editor=' + Date.now();
  }

  function closeMapEditor() {
    var editor = customEl('map-editor');
    if (editor) editor.classList.add('hidden');
    customEditingId = null;
    openCustomMaps();
  }

  function editorPlan() {
    var frame = customEl('custom-editor-frame');
    if (!frame || !frame.contentWindow || !frame.contentWindow.__MAP_EDITOR__) return null;
    try { return frame.contentWindow.__MAP_EDITOR__.exportData(); } catch (e) { return null; }
  }

  function saveEditor(playMode) {
    var status = customEl('editor-status');
    var plan = editorPlan();
    if (!plan) { if (status) status.textContent = '编辑器尚未准备好'; return; }
    var res = SL.CustomMaps.save(plan, customEditingId);
    if (!res.ok) { if (status) status.textContent = res.error; return; }
    customEditingId = res.entry.id;
    if (status) status.textContent = '已保存：' + res.entry.name;
    if (playMode) {
      var editor = customEl('map-editor');
      if (editor) editor.classList.add('hidden');
      playCustomMap(res.entry.id, plan.mode === 'naval' ? 'naval' : 'melee');
    } else {
      closeMapEditor();
    }
  }

  function exportEditorPlan() {
    var plan = editorPlan();
    if (!plan) return;
    var blob = new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = String(plan.name || 'custom-map').replace(/[^\w\u4e00-\u9fa5-]+/g, '-') + '.steelmap.json';
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  function playCustomMap(id, mode) {
    var entry = SL.CustomMaps && SL.CustomMaps.get(id);
    if (!entry) { UI.pushToast('自定义地图不存在', 'loss'); return; }
    battleFamily = (mode === 'navalLastStand' || mode === 'lastStand') ? 'lastStand' : 'melee';
    gameMode = (mode === 'naval' || mode === 'navalLastStand' || mode === 'lastStand') ? mode : 'melee';
    difficulty = difficulty || 'normal';
    var cm = customEl('custom-maps');
    if (cm) cm.classList.add('hidden');
    hideMainMenu();
    chooseMap(id, true);
    started = false;
    paused = false;
    UI.setPaused(false);
    UI.showBriefing(true);
  }

  function importCustomMapFile(file) {
    if (!file) return;
    var rd = new FileReader();
    rd.onload = function () {
      var plan;
      try { plan = JSON.parse(rd.result); } catch (e) { UI.pushToast('地图文件不是有效 JSON', 'loss'); return; }
      var res = SL.CustomMaps.save(plan);
      if (!res.ok) { UI.pushToast(res.error, 'loss'); return; }
      renderCustomMapList();
      UI.pushToast('已导入自定义地图：' + res.entry.name, 'win');
    };
    rd.readAsText(file);
  }

  function bindTrainingAIBombing() {
    var btn = document.getElementById('range-ai-bomb-btn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      if (!game || !game.testMode) return;
      game.trainingAIBombing = !game.trainingAIBombing;
      if (game.trainingAIBombing) {
        if (game.teams && game.teams.red) game.teams.red.airTimer = 3;
        UI.pushToast('训练模式：AI 轰炸流程已启动', 'info');
      } else {
        UI.pushToast('训练模式：AI 轰炸流程已关闭', 'info');
      }
      btn.textContent = 'AI轰炸：' + (game.trainingAIBombing ? '开' : '关');
      btn.classList.toggle('on', !!game.trainingAIBombing);
    });
  }

  function bindCustomMaps() {
    var btn = customEl('mm-custom');
    if (btn) btn.addEventListener('click', openCustomMaps);
    var close = customEl('custom-close');
    if (close) close.addEventListener('click', closeCustomMaps);
    var newBtn = customEl('custom-new');
    if (newBtn) newBtn.addEventListener('click', function () { openMapEditor(null); });
    var importBtn = customEl('custom-import');
    var file = customEl('custom-file');
    if (importBtn && file) importBtn.addEventListener('click', function () { file.click(); });
    if (file) file.addEventListener('change', function () {
      importCustomMapFile(file.files && file.files[0]);
      file.value = '';
    });
    var editorClose = customEl('editor-close');
    if (editorClose) editorClose.addEventListener('click', closeMapEditor);
    var save = customEl('editor-save');
    if (save) save.addEventListener('click', function () { saveEditor(false); });
    var play = customEl('editor-play');
    if (play) play.addEventListener('click', function () { saveEditor(true); });
    var exp = customEl('editor-export');
    if (exp) exp.addEventListener('click', exportEditorPlan);
  }

  function drawDeploymentPreview() {
    var canvas = document.getElementById('deploy-minimap');
    if (!canvas || !R || !R.drawMinimap) return;
    var g = (window.__STEEL && window.__STEEL.game) ? window.__STEEL.game() : game;
    if (!g || !g.fog) return;
    var size = Math.min(canvas.width, canvas.height) || 220;
    // 直接复用游戏内的战术小地图缓存与绘制
    R.minimapCache = null;
    try { R.buildMinimapCache(); } catch (e) {}
    R.drawMinimap(canvas.getContext('2d'), g, size);
    var label = document.getElementById('deploy-minimap-label');
    if (label && SL.Terrain.map) label.textContent = SL.Terrain.map.name + ' · 战术简图';
  }

  function bindMainMenu() {
    var start = document.getElementById('mm-start');
    var cont = document.getElementById('mm-continue');
    var settings = document.getElementById('mm-settings');
    if (start) start.addEventListener('click', function () {
      hideMainMenu();
      if (!game || game.ended) newGame(false);
      started = false;
      paused = false;
      UI.setPaused(false);
      UI.showBriefing(true);
    });
    if (cont) cont.addEventListener('click', continueSavedGame);
    if (settings) settings.addEventListener('click', function () { UI.openSettings(); });
    var deployBack = document.getElementById('deploy-back');
    if (deployBack) deployBack.addEventListener('click', function () { showMainMenu(); });
  }

  function begin() {
    if (started) return;
    started = true;
    paused = false;
    hideMainMenu();
    UI.setPaused(false);
    UI.showBriefing(false);
    fastForward();
  }

  function fastForward() {
    var ff = parseFloat(params.get('ff') || '0');
    if (!ff || !isFinite(ff)) return;
    var n = Math.min(20 * 300, Math.round(ff * 20));
    for (var i = 0; i < n; i++) game.update(STEP);
  }

  function restart() {
    hideMainMenu();
    newGame(true);
    UI.hideResult();
  }

  function returnToMenu() {
    UI.hideGameMenu();
    UI.toggleHelp(false);
    newGame(false);
    showMainMenu();
  }

  function openGameMenu() {
    if (!started || game.state !== 'playing') return;
    if (UI.isGameMenuOpen()) { closeGameMenu(); return; }
    paused = true;
    UI.setPaused(true);
    UI.openGameMenu();
  }

  function closeGameMenu() {
    UI.hideGameMenu();
    paused = false;
    UI.setPaused(false);
  }

  function togglePause() {
    if (!started) return;
    if (UI.isGameMenuOpen()) { closeGameMenu(); return; }
    paused = !paused;
    UI.setPaused(paused);
  }

  /* ---------------- 主循环 ---------------- */

  function frame(ts) {
    requestAnimationFrame(frame);
    if (!last) last = ts;
    var dt = Math.min(0.08, Math.max(0, (ts - last) / 1000));
    last = ts;

    updateCamera(dt);
    if (follow) followArmy(dt);

    var updateStart = performance.now();
    if (started && !paused && !R.dead && !UI.isDraftOpen() && !UI.isFortReplaceOpen()) {
      acc += dt;
      var steps = 0;
      while (acc >= STEP && steps < 6) {
        game.update(STEP);
        acc -= STEP;
        steps++;
      }
      if (steps >= 6) acc = 0;
    }
    if (R.perf) R.perf.updateMs = performance.now() - updateStart;

    R.draw(game, dt);
    UI.update(game, dt);
  }

  function updateCamera(dt) {
    var kx = (keys['d'] || keys['arrowright'] ? 1 : 0) - (keys['a'] || keys['arrowleft'] ? 1 : 0);
    var ky = (keys['s'] || keys['arrowdown'] ? 1 : 0) - (keys['w'] || keys['arrowup'] ? 1 : 0);
    if (!kx && !ky) return;
    var L = Math.hypot(kx, ky);
    var sp = 720 / R.cam.zoom;
    R.cam.x += kx / L * sp * dt;
    R.cam.y += ky / L * sp * dt;
    R.clampCam();
  }

  function followArmy(dt) {
    var cx = 0, cy = 0, n = 0;
    for (var i = 0; i < game.units.length; i++) {
      var u = game.units[i];
      if (!u.alive) continue;
      cx += u.x; cy += u.y; n++;
    }
    if (!n) return;
    var k = Math.min(1, dt * 1.6);
    R.cam.x += (cx / n - R.cam.x) * k;
    R.cam.y += (cy / n - R.cam.y) * k;
    R.clampCam();
  }

  /* ---------------- 输入 ---------------- */

  function pointerPos(ev) {
    var el = document.getElementById('world');
    var r = el.getBoundingClientRect();
    return { x: ev.clientX - r.left, y: ev.clientY - r.top };
  }

  function bindInput() {
    // 事件挂在 window 上，画布被重建后输入不会失效
    window.addEventListener('contextmenu', function (ev) {
      if (ev.target && ev.target.id === 'world') ev.preventDefault();
    });

    window.addEventListener('pointerdown', function (ev) {
      if (!ev.target || ev.target.id !== 'world') return;
      var p = pointerPos(ev);
      if (ev.button === 1) {
        ev.preventDefault();
        drag = { kind: 'pan', sx: ev.clientX, sy: ev.clientY, cx: R.cam.x, cy: R.cam.y };
        ev.target.classList.add('panning');
        return;
      }
      if (ev.button === 2) {
        ev.preventDefault();
        if (!started) return;
        orderAt(p.x, p.y, ev.shiftKey);
        return;
      }
      if (ev.button !== 0) return;
      if (!started) return;

      var w = R.screenToWorld(p.x, p.y);
      if (game.pendingCommand) {
        var pc = game.pendingCommand.kind;
        game.pendingCommand = null;
        if (pc === 'engineer') {
          var fzBtn = game.buildFieldZone(game.selected, w.x, w.y);
          if (fzBtn) R.addMarker(w.x, w.y, 'move');
        } else if (pc === 'recon') {
          var reconN = game.commandRecon(game.selected, w.x, w.y);
          if (reconN > 0) R.addMarker(w.x, w.y, 'move');
        } else if (pc === 'grenade') {
          var grenadeTarget = game.enemyAt(w.x, w.y, 26 / R.cam.zoom);
          if (grenadeTarget && game.commandGrenade(game.selected, w.x, w.y) > 0) {
            R.addMarker(w.x, w.y, 'attack');
          } else {
            UI.pushToast('该位置没有可攻击的目标，或不在手雷/火箭筒射程内', 'info');
          }
        } else if (pc === 'sniperHide') {
          if (game.commandSniperHide(game.selected, w.x, w.y) > 0) {
            R.addMarker(w.x, w.y, 'move');
          } else {
            UI.pushToast('无法在此建立狙击隐蔽', 'info');
          }
        } else if (pc === 'shipPrewarn') {
          if (game.selectedShip && game.setShipPrewarn(game.selectedShip, w.x, w.y)) {
            R.addMarker(w.x, w.y, 'move');
            UI.pushToast('全舰炮塔开始预先瞄准', 'order');
          }
        } else if (pc === 'shipSuppress') {
          var ssr = game.navalSuppress('blue', w.x, w.y);
          UI.pushToast(ssr.msg, ssr.ok ? 'order' : 'loss');
          if (ssr.ok) R.addMarker(w.x, w.y, 'attack');
        } else {
          var hasRocket = game.selected.some(function (u) { return u.type === 'rocket_arty'; });
          var hasArty = game.selected.some(function (u) { return u.type === 'artillery' || u.type === 'heavy_arty'; });
          var nBtn = 0;
          if (hasRocket) nBtn += game.commandRocketStrike(game.selected, w.x, w.y);
          if (hasArty) nBtn += game.commandSuppress(game.selected, w.x, w.y);
          if (nBtn > 0) R.addMarker(w.x, w.y, 'attack');
        }
        return;
      }
      var ship = game.shipAt ? game.shipAt(w.x, w.y, 115 / R.cam.zoom) : null;
      if (ship) { game.setSelectedShip(ship); return; }
      if (SL.Bomber && SL.Bomber.planeAt(game, w.x, w.y, 42 / R.cam.zoom)) {
        SL.Bomber.selectGroup(game);
        return;
      }
      var own = game.unitAt(w.x, w.y, 20 / R.cam.zoom);
      if (own) {
        if (ev.shiftKey) {
          var arr = game.selected.slice();
          var idx = arr.indexOf(own);
          if (idx >= 0) arr.splice(idx, 1); else arr.push(own);
          game.setSelection(arr);
        } else {
          game.setSelection([own]);
        }
        return;
      }
      drag = { kind: 'box', sx: p.x, sy: p.y, ex: p.x, ey: p.y, shift: ev.shiftKey };
      if (!ev.shiftKey) { if (SL.Bomber) SL.Bomber.clearSelection(game); game.setSelection([]); }
      R.setSelectionBox({ x0: p.x, y0: p.y, x1: p.x, y1: p.y });
    });

    window.addEventListener('pointermove', function (ev) {
      if (!drag) return;
      if (drag.kind === 'pan') {
        R.cam.x = drag.cx - (ev.clientX - drag.sx) / R.cam.zoom;
        R.cam.y = drag.cy - (ev.clientY - drag.sy) / R.cam.zoom;
        R.clampCam();
        return;
      }
      var p = pointerPos(ev);
      drag.ex = p.x; drag.ey = p.y;
      R.setSelectionBox({ x0: drag.sx, y0: drag.sy, x1: drag.ex, y1: drag.ey });
    });

    window.addEventListener('pointerup', function (ev) {
      if (!drag) return;
      if (drag.kind === 'pan') {
        var el = document.getElementById('world');
        if (el) el.classList.remove('panning');
        drag = null;
        return;
      }
      if (drag.kind === 'box') {
        var moved = Math.hypot(drag.ex - drag.sx, drag.ey - drag.sy);
        if (moved > 6) {
          var a = R.screenToWorld(drag.sx, drag.sy);
          var b = R.screenToWorld(drag.ex, drag.ey);
          var picked = game.unitsInRect(a.x, a.y, b.x, b.y);
          if (drag.shift) {
            var merged = game.selected.slice();
            for (var i = 0; i < picked.length; i++) {
              if (merged.indexOf(picked[i]) < 0) merged.push(picked[i]);
            }
            picked = merged;
          }
          game.setSelection(picked);
        }
        if (SL.Bomber) SL.Bomber.clearSelection(game);
        R.setSelectionBox(null);
        drag = null;
      }
      void ev;
    });

    window.addEventListener('wheel', function (ev) {
      if (!ev.target || ev.target.id !== 'world') return;
      ev.preventDefault();
      var p = pointerPos(ev);
      var f = ev.deltaY < 0 ? 1.12 : 1 / 1.12;
      R.zoomAt(p.x, p.y, f);
    }, { passive: false });

    window.addEventListener('keydown', function (ev) {
      var k = (ev.key || '').toLowerCase();
      if (k === ' ') {
        ev.preventDefault();
        togglePause();
        return;
      }
      if (k === 'h') { UI.toggleHelp(); return; }
      if (k === 'f3') { ev.preventDefault(); UI.togglePerf(); return; }
      if (k === 'g') {
        ev.preventDefault();
        if (game && game.selected && game.selected.length) {
          var thrown = game.commandGrenadeNearest(game.selected);
          if (thrown > 0) UI.pushToast('手雷/火箭筒攻击', 'info');
          else UI.pushToast('手雷/火箭筒射程内没有目标', 'info');
        }
        return;
      }
      if (k === 'escape') {
        if (game && game.pendingCommand) { game.pendingCommand = null; UI.pushToast('已取消指令', 'info'); return; }
        if (UI.isSettingsOpen && UI.isSettingsOpen()) { UI.closeSettings(); return; }
        if (UI.isGameMenuOpen()) { closeGameMenu(); return; }
        if (UI.isHelpOpen()) { UI.toggleHelp(false); return; }
        openGameMenu();
        return;
      }
      if (k === 'enter') { if (!started) begin(); return; }
      if (k === 'r') {
        restart();
        return;
      }
      if (k === 'x' || k === 'f') {
        if (game.selectedShip) {
          game.stopShip(game.selectedShip);
          UI.pushToast('已停止舰船当前指令', 'info');
        }
        if (game.selected.length) {
          game.clearOrders(game.selected);
        }
        return;
      }
      if ((ev.ctrlKey || ev.metaKey) && k === 'a') {
        ev.preventDefault();
        game.setSelection(game.aliveOf('blue'));
        return;
      }
      if (k === '+' || k === '=') { R.zoomAt(R.proj.w / 2, R.proj.h / 2, 1.15); return; }
      if (k === '-') { R.zoomAt(R.proj.w / 2, R.proj.h / 2, 1 / 1.15); return; }
      keys[k] = true;
    });

    window.addEventListener('keyup', function (ev) {
      keys[(ev.key || '').toLowerCase()] = false;
    });

    window.addEventListener('blur', function () { keys = {}; });
  }

  function orderAt(sx, sy, shift) {
    if (game.state !== 'playing') return;
    var w = R.screenToWorld(sx, sy);
    var hitR = 22 / R.cam.zoom;
    if (game.selectedShip && game.selectedShip.alive) {
      if (shift) {
        var sr = game.navalSuppress('blue', w.x, w.y);
        if (sr.ok) { R.addMarker(w.x, w.y, 'attack'); return; }
      }
      if (!SL.Naval.isWater(w.x, w.y)) {
        UI.pushToast('战舰只能在海域内移动', 'info');
        return;
      }
      game.selectedShip.dest = { x: w.x, y: w.y };
      R.addMarker(w.x, w.y, 'move');
      return;
    }
    if (game.selectedBomber && SL.Bomber) {
      if (SL.Bomber.commandMove(game, w.x, w.y)) {
        R.addMarker(w.x, w.y, 'move');
        return;
      }
    }
    var enemy = game.enemyAt(w.x, w.y, hitR);
    if (!enemy && game.selected.length) {
      var siteTarget = game.siteAt ? game.siteAt(w.x, w.y, hitR) : null;
      if (siteTarget && siteTarget.owner && siteTarget.owner !== 'blue') {
        var siteN = game.commandSuppress(game.selected, w.x, w.y);
        if (siteN > 0) {
          UI.pushToast('炮兵开始压制 ' + siteTarget.name, 'order');
          R.addMarker(w.x, w.y, 'attack');
          return;
        }
      }
    }
    if (!game.selected.length) {
      var own = game.unitAt(w.x, w.y, hitR);
      if (own) game.setSelection([own]);
      return;
    }
    // Shift + 右键：指挥车侦察 / 工兵 / 狙击小组 / 火箭炮点射
    if (shift) {
      var rc = game.commandRecon(game.selected, w.x, w.y);
      if (rc > 0) {
        R.addMarker(w.x, w.y, 'move');
        return;
      }
      if (game.commandSniperHide(game.selected, w.x, w.y) > 0) {
        R.addMarker(w.x, w.y, 'move');
        return;
      }
      var rocketStrike = game.commandRocketStrike(game.selected, w.x, w.y);
      if (rocketStrike > 0) {
        R.addMarker(w.x, w.y, 'attack');
        return;
      }
      if (!enemy) {
        var fz = game.buildFieldZone(game.selected, w.x, w.y);
        if (fz) {
          R.addMarker(w.x, w.y, 'move');
          return;
        }
      }
    }
    if (enemy) {
      game.commandAttack(game.selected, enemy);
      R.addMarker(w.x, w.y, 'attack');
      lastRight = 0;
      return;
    }
    var obstacle = game.barrierAt(w.x, w.y, hitR);
    if (obstacle) {
      game.commandAttackBarrier(game.selected, obstacle);
      R.addMarker(w.x, w.y, 'attack');
      lastRight = 0;
      return;
    }
    // Shift + 右键：选中火炮时对该点进行 60 秒火力压制
    if (shift) {
      var n = game.commandSuppress(game.selected, w.x, w.y);
      if (n > 0) {
        R.addMarker(w.x, w.y, 'attack');
        return;
      }
    }
    var now = performance.now();
    var dbl = now - lastRight < 330 &&
      Math.hypot(sx - lastRightX, sy - lastRightY) < 80;
    lastRight = now;
    lastRightX = sx;
    lastRightY = sy;

    if (dbl) {
      game.commandSprint(game.selected, w.x, w.y);
      R.addMarker(w.x, w.y, 'sprint');
    } else {
      game.commandMove(game.selected, w.x, w.y);
      R.addMarker(w.x, w.y, 'move');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
