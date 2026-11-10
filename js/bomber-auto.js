/* 钢铁之门 —— B-17 自动轰炸任务层
 * 保留配备面板，新增预设、轰炸线指示、自动进场/投弹/返场。
 */
(function () {
  'use strict';
  var SL = window.SL;
  if (!SL || !SL.Bomber) return;
  var B = SL.BOMBER;
  var PRESET_KEY = 'steel_bomber_custom_loadout_v1';
  var PRESETS = {
    incendiary: { name: '300lb 燃烧', type: 'incendiary', groups: 5, count: 4 },
    lb500: { name: '500lb', type: 'lb500', groups: 3, count: 4 },
    lb1000: { name: '1000lb', type: 'lb1000', groups: 3, count: 2 },
    lb2000: { name: '2000lb', type: 'lb2000', groups: 3, count: 1 }
  };
  var AUTO = {};

  function $id(id) { return document.getElementById(id); }
  function toast(msg, kind) { if (SL.UI && SL.UI.pushToast) SL.UI.pushToast(msg, kind || 'info'); }
  function ensure(g) { return SL.Bomber.ensure(g); }
  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function makePlane(g, index) {
    var b = ensure(g);
    b.planeSeq = (b.planeSeq || 0) + 1;
    return {
      id: 'auto_b17_' + b.planeSeq,
      name: 'B-17 ' + (index + 1) + '号机',
      hp: B.b17.hp, maxHp: B.b17.hp,
      evade: B.b17.highAltitudeEvade || 0.22, altitude: 'high',
      bombs: [], bombGroups: [], loadout: [], loadoutGroups: [],
      x: 0, y: 0, heading: 0, bank: 0, mgCd: 0, t: 0,
      jitter: Math.random() * Math.PI * 2,
      speedJitter: 0.97 + Math.random() * 0.06,
      playerBomber: true, kind: 'b17', side: 'blue',
      deployed: false, slot: index
    };
  }

  function presetGroups(key) {
    var p = PRESETS[key];
    if (!p) return null;
    var out = [];
    for (var i = 0; i < p.groups; i++) out.push({ type: p.type, count: p.count, paid: B.bombGroupCost });
    return out;
  }

  function currentPreset(g) {
    var b = ensure(g);
    var a = b.auto;
    if (!a) return null;
    if (a.preset === 'custom') {
      try {
        var raw = localStorage.getItem(PRESET_KEY);
        if (!raw) return null;
        var data = JSON.parse(raw);
        return data && Array.isArray(data.groups) ? data : null;
      } catch (e) { return null; }
    }
    var groups = presetGroups(a.preset || 'lb500');
    return groups ? { name: (PRESETS[a.preset] || {}).name || a.preset, groups: groups } : null;
  }

  function applyGroups(g, groups, label) {
    var b = ensure(g);
    if (!b.formation) b.formation = [null, null, null, null, null];
    if (!groups || !groups.length) return false;
    for (var i = 0; i < 5; i++) {
      var p = b.formation[i];
      if (!p) {
        p = makePlane(g, i);
        b.formation[i] = p;
      }
      p.hp = p.maxHp;
      p.bombGroups = groups.map(function (grp) { return { type: grp.type, count: grp.count, paid: grp.paid || B.bombGroupCost }; });
      p.bombs = [];
      for (var j = 0; j < p.bombGroups.length; j++) {
        for (var k = 0; k < p.bombGroups[j].count; k++) p.bombs.push(p.bombGroups[j].type);
      }
      p.loadout = p.bombs.slice();
      p.loadoutGroups = p.bombGroups.map(function (grp) { return { type: grp.type, count: grp.count, paid: grp.paid }; });
      p.deployed = false;
      p.slot = i;
    }
    b.state = 'base';
    b.auto = b.auto || {};
    b.auto.preset = label || 'lb500';
    b.auto.lastApply = Date.now();
    SL.Bomber.refresh(g);
    return true;
  }

  function customData() {
    try {
      var raw = localStorage.getItem(PRESET_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      return data && Array.isArray(data.groups) ? data : null;
    } catch (e) { return null; }
  }

  function saveCustomPreset(g) {
    var b = ensure(g);
    var p = b.formation.filter(Boolean)[0];
    if (!p || !p.bombGroups.length) { toast('编队没有可保存的挂载方案', 'loss'); return; }
    var data = { name: '我的方案', groups: p.bombGroups.map(function (grp) { return { type: grp.type, count: grp.count, paid: grp.paid || B.bombGroupCost }; }) };
    try { localStorage.setItem(PRESET_KEY, JSON.stringify(data)); } catch (e) {}
    b.auto = b.auto || {};
    b.auto.preset = 'custom';
    toast('已保存当前五机挂载方案', 'win');
    SL.Bomber.refresh(g);
  }

  function groupCost(groups) {
    var cost = 0;
    for (var i = 0; i < groups.length; i++) cost += (groups[i].paid || B.bombGroupCost);
    return cost;
  }

  function supplyCost(g) {
    var b = ensure(g);
    var data = currentPreset(g);
    if (!data) return 0;
    var groups = data.groups;
    var total = 0;
    for (var i = 0; i < 5; i++) {
      var p = b.formation[i];
      if (!p) { total += B.planeCost + groupCost(groups); continue; }
      var counts = {};
      // 以剩余航弹计算补给，不能看图上的历史挂载卡片
      for (var j = 0; j < (p.bombs || []).length; j++) {
        var btype = p.bombs[j];
        counts[btype] = (counts[btype] || 0) + 1;
      }
      for (var k = 0; k < groups.length; k++) {
        var need = groups[k].count;
        var have = Math.min(need, counts[groups[k].type] || 0);
        counts[groups[k].type] = (counts[groups[k].type] || 0) - have;
        if (have < need) total += (groups[k].paid || B.bombGroupCost);
      }
    }
    return total;
  }

  function targetWidth(g) {
    var b = ensure(g);
    var n = b.formation.filter(Boolean).length || 0;
    return clamp(120 + n * 55, 160, 520);
  }

  function defaultTarget(g) {
    var b = ensure(g);
    var center = { x: (SL.CONFIG.mapSize || 2000) * 0.5, y: (SL.CONFIG.mapSize || 2000) * 0.5 };
    for (var i = 0; i < g.units.length; i++) {
      var u = g.units[i];
      if (u.alive && u.side === 'blue') { center.x = u.x; center.y = u.y; break; }
    }
    var dx = (SL.CONFIG.mapSize || 2000) * 0.5 - center.x;
    var dy = (SL.CONFIG.mapSize || 2000) * 0.5 - center.y;
    var len = Math.hypot(dx, dy);
    if (len < 1) { dx = 1; dy = 0; len = 1; }
    dx /= len; dy /= len;
    var start = { x: clamp(center.x, 80, (SL.CONFIG.mapSize || 2000) - 80), y: clamp(center.y, 80, (SL.CONFIG.mapSize || 2000) - 80) };
    var end = { x: clamp(start.x + dx * 700, 40, (SL.CONFIG.mapSize || 2000) - 40), y: clamp(start.y + dy * 700, 40, (SL.CONFIG.mapSize || 2000) - 40) };
    return { start: start, end: end };
  }

  function startAim(g) {
    var b = ensure(g);
    if (b.state === 'autoAim' || b.state === 'autoMission') {
      toast('轰炸任务已经开始，倒计时内可调整轰炸线', 'info');
      return;
    }
    if (b.state !== 'base') { toast('轰炸机尚未返回基地', 'loss'); return; }
    if (!b.formation.some(Boolean)) {
      var data = currentPreset(g);
      if (data) applyGroups(g, data.groups, b.auto && b.auto.preset);
    }
    if (!b.formation.some(Boolean)) { toast('请先在轰炸机配备中组建编队', 'loss'); return; }
    var t = defaultTarget(g);
    b.auto = b.auto || {};
    b.auto.phase = 'aim';
    b.auto.start = t.start;
    b.auto.end = t.end;
    b.auto.timer = 10;
    b.auto.width = targetWidth(g);
    b.auto.drag = null;
    b.state = 'autoAim';
    toast('已进入轰炸瞄准：拖动 ① / ② 设定轰炸线，10 秒后锁定', 'order');
    SL.Bomber.refresh(g);
  }

  function cancelAim(g) {
    var b = ensure(g);
    if (!b.auto) return;
    if (b.state === 'autoAim') {
      b.state = 'base';
      b.auto.phase = null;
      toast('已取消轰炸瞄准', 'info');
    } else if (b.state === 'autoMission') {
      b.auto.phase = 'abort';
      b.auto.abortUntil = g.time + 2;
      toast('紧急返航：编队脱离战场', 'loss');
    }
    SL.Bomber.refresh(g);
  }

  function nearestEdge(x, y) {
    var ms = SL.CONFIG.mapSize || 2000;
    var m = Math.min(x, ms - x, y, ms - y);
    if (m === x) return { x: -120, y: y, heading: 0 };
    if (m === ms - x) return { x: ms + 120, y: y, heading: Math.PI };
    if (m === y) return { x: x, y: -120, heading: Math.PI / 2 };
    return { x: x, y: ms + 120, heading: -Math.PI / 2 };
  }

  function launch(g) {
    var b = ensure(g);
    var data = currentPreset(g);
    if (!data) { toast('没有可用的配备方案', 'loss'); b.state = 'base'; b.auto.phase = null; return; }
    var cost = supplyCost(g);
    if ((g.teams.blue.score || 0) < cost) {
      toast('补给预算不足：需要 ' + cost + ' 分', 'loss');
      b.state = 'base';
      b.auto.phase = null;
      return;
    }
    if (cost) g.teams.blue.score -= cost;
    applyGroups(g, data.groups, b.auto.preset);
    b.state = 'autoMission';
    b.auto.phase = 'attack';
    b.auto.supplyPaid = cost;
    b.auto.progress = 0;
    b.auto.entryDone = false;
    b.auto.stage = 'entry';
    var dir = { x: b.auto.end.x - b.auto.start.x, y: b.auto.end.y - b.auto.start.y };
    var len = Math.hypot(dir.x, dir.y) || 1;
    b.auto.dir = { x: dir.x / len, y: dir.y / len };
    b.auto.length = clamp(len, 260, 1400);
    var edge = nearestEdge(b.auto.start.x, b.auto.start.y);
    b.auto.group = { x: edge.x, y: edge.y, heading: Math.atan2(b.auto.dir.y, b.auto.dir.x) };
    b.auto.entryTarget = { x: b.auto.start.x - b.auto.dir.x * 240, y: b.auto.start.y - b.auto.dir.y * 240 };
    b.auto.bombs = [];
    for (var i = 0; i < b.formation.length; i++) {
      var p = b.formation[i];
      if (!p) continue;
      p.deployed = true;
      p.x = edge.x; p.y = edge.y; p.heading = b.auto.group.heading;
      p._autoDrop = 0;
      if (g.planes.indexOf(p) < 0) g.planes.push(p);
    }
    b.auto.bombs = [];
    toast('轰炸机进入战场；补给支出 ' + cost + ' 分', 'order');
    SL.Bomber.refresh(g);
  }

  function buildBombQueue(g) {
    var b = ensure(g);
    var queue = [];
    var planes = b.formation.filter(Boolean);
    var total = 0;
    for (var i = 0; i < planes.length; i++) total += planes[i].bombs.length;
    if (!total) return;
    var idx = 0;
    var runTime = Math.max(4, b.auto.length / Math.max(50, B.b17.speed));
    for (var p = 0; p < planes.length; p++) {
      var plane = planes[p];
      var side = (p - (planes.length - 1) / 2) * 65;
      for (var k = 0; k < plane.bombs.length; k++) {
        var frac = total <= 1 ? 0.5 : idx / (total - 1);
        queue.push({
          type: plane.bombs[k],
          at: g.time + 1.2 + frac * runTime,
          frac: frac,
          side: side
        });
        idx++;
      }
    }
    b.auto.bombs = queue;
  }

  function explodeBomb(g, type, x, y) {
    var d = B.bombs[type] || B.bombs.lb500;
    if (SL.Audio) SL.Audio.explosion(d.radius, x, y);
    g.effects.push({ kind: 'blast', x: x, y: y, t: 0, dur: 1.0, r: d.radius, side: 'blue' });
    g.effects.push({ kind: 'explosion', x: x, y: y, t: 0, dur: 0.9, size: d.radius, world: true, side: 'blue' });
    var credit = { side: 'blue', name: 'B-17 航弹', kills: 0, score: 0 };
    for (var i = 0; i < g.units.length; i++) {
      var u = g.units[i];
      if (!u.alive) continue;
      var dd = Math.hypot(u.x - x, u.y - y);
      if (dd > d.radius) continue;
      var fall = 1 - 0.68 * (dd / d.radius);
      g.damage(u, d.damage * fall * (u.side === 'blue' ? 0.25 : 1) * (u.def.armor ? 0.72 : 1), credit, 2);
    }
    for (var s = 0; s < g.battleships.length; s++) {
      var sh = g.battleships[s];
      if (!sh.alive) continue;
      var sd = Math.hypot(sh.x - x, sh.y - y);
      if (sd > d.radius + (sh.hitRadius || 60)) continue;
      g.damageShip(sh, d.damage * 1.15 * (1 - 0.65 * Math.min(1, sd / (d.radius + 60))), credit, 3.2);
    }
    if (d.fortDamage) g.damageFortifications(x, y, d.fortDamage, d.radius);
    if (d.burn && g.bomberFires) {
      g.bomberFires.push({ x: x, y: y, r: d.radius, until: g.time + d.burn, next: 0, dps: d.burnDps, side: 'blue' });
    }
  }

  function updateAuto(g, dt) {
    var b = ensure(g);
    if (!b.auto) return;
    var a = b.auto;
    if (b.state === 'autoAim') {
      a.timer -= dt;
      if (a.timer <= 0) {
        a.timer = 0;
        launch(g);
      }
      return;
    }
    if (b.state !== 'autoMission') return;
    if (a.phase === 'abort') {
      if (g.time >= (a.abortUntil || 0)) finishMission(g);
      return;
    }
    // 进场：从最近地图边缘飞到轰炸线起点
    if (a.stage === 'entry') {
      var eg = a.entryTarget;
      var dx = eg.x - a.group.x, dy = eg.y - a.group.y;
      var ed = Math.hypot(dx, dy);
      var sp = B.b17.speed * 1.35;
      if (ed <= sp * dt) { a.group.x = eg.x; a.group.y = eg.y; a.stage = 'run'; buildBombQueue(g); }
      else { a.group.x += dx / ed * sp * dt; a.group.y += dy / ed * sp * dt; }
      a.group.heading = Math.atan2(a.dir.y, a.dir.x);
    } else if (a.stage === 'run') {
      a.progress += B.b17.speed * dt;
      var f = clamp(a.progress / Math.max(1, a.length), 0, 1);
      a.group.x = a.start.x + a.dir.x * a.length * f;
      a.group.y = a.start.y + a.dir.y * a.length * f;
      a.group.heading = Math.atan2(a.dir.y, a.dir.x);
      if (a.progress >= a.length) { a.stage = 'exit'; a.exitAt = g.time + 10; }
    } else if (a.stage === 'exit') {
      var edge = nearestEdge(a.group.x, a.group.y);
      var dx2 = edge.x - a.group.x, dy2 = edge.y - a.group.y;
      var ed2 = Math.hypot(dx2, dy2) || 1;
      a.group.x += dx2 / ed2 * B.b17.speed * 1.2 * dt;
      a.group.y += dy2 / ed2 * B.b17.speed * 1.2 * dt;
      if (g.time >= (a.exitAt || 0)) { finishMission(g); return; }
    }
    // 编队位置
    var planes = b.formation.filter(Boolean);
    for (var i = 0; i < planes.length; i++) {
      var p = planes[i];
      var side = (i - (planes.length - 1) / 2) * 65;
      var fx = a.dir.x, fy = a.dir.y;
      var sx = -fy, sy = fx;
      p.x = a.group.x + sx * side;
      p.y = a.group.y + sy * side;
      p.heading = a.group.heading;
      p.deployed = true;
    }
    // 投放队列：到达时间后按轰炸线坐标落弹
    for (var q = 0; q < a.bombs.length; q++) {
      var bomb = a.bombs[q];
      if (bomb.done || g.time < bomb.at) continue;
      bomb.done = true;
      var px = a.start.x + a.dir.x * a.length * bomb.frac;
      var py = a.start.y + a.dir.y * a.length * bomb.frac;
      var nx = -a.dir.y, ny = a.dir.x;
      px += nx * bomb.side;
      py += ny * bomb.side;
      explodeBomb(g, bomb.type, px, py);
      // 从飞机数据中扣除对应航弹
      for (var pi = 0; pi < planes.length; pi++) {
        if (planes[pi].bombs[0] === bomb.type) { planes[pi].bombs.shift(); break; }
      }
    }
    a.allDropped = a.bombs.every(function (x) { return x.done; });
  }

  function syncBombGroups(p) {
    if (!p) return;
    var counts = {};
    for (var i = 0; i < (p.bombs || []).length; i++) {
      var t = p.bombs[i];
      counts[t] = (counts[t] || 0) + 1;
    }
    p.bombGroups = [];
    for (var k in counts) {
      var d = B.bombs[k];
      if (d) p.bombGroups.push({ type: k, count: counts[k], paid: B.bombGroupCost });
    }
  }

  function finishMission(g) {
    var b = ensure(g);
    for (var i = 0; i < b.formation.length; i++) {
      var p = b.formation[i];
      if (!p) continue;
      p.deployed = false;
      var idx = g.planes.indexOf(p);
      if (idx >= 0) g.planes.splice(idx, 1);
      // 返航后不立即补给，等下一次出击时统一结算
      p.hp = p.maxHp;
      syncBombGroups(p);
    }
    b.state = 'base';
    if (b.auto) { b.auto.phase = null; b.auto.bombs = []; b.auto.stage = null; }
    toast('B-17 编队已返回基地；下次出击时结算补给', 'info');
    SL.Bomber.refresh(g);
  }

  function drawAuto(ctx, g, proj, cam) {
    var b = ensure(g);
    if (!b.auto || (b.state !== 'autoAim' && b.state !== 'autoMission')) return;
    var a = b.auto;
    var sx = proj.x(a.start.x), sy = proj.y(a.start.y);
    var ex = proj.x(a.end.x), ey = proj.y(a.end.y);
    var nx = -(ey - sy), ny = ex - sx;
    var nl = Math.hypot(nx, ny) || 1;
    var half = a.width * 0.5 * cam.zoom;
    nx /= nl; ny /= nl;
    ctx.save();
    ctx.fillStyle = 'rgba(205,162,74,0.12)';
    ctx.strokeStyle = 'rgba(235,196,105,0.9)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(sx + nx * half, sy + ny * half);
    ctx.lineTo(ex + nx * half, ey + ny * half);
    ctx.lineTo(ex - nx * half, ey - ny * half);
    ctx.lineTo(sx - nx * half, sy - ny * half);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.setLineDash([8, 6]);
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
    ctx.setLineDash([]);
    function handle(x, y, label, color) {
      ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fillStyle = '#11160f'; ctx.fill();
      ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = color; ctx.font = '700 12px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(label, x, y);
    }
    handle(sx, sy, '1', '#e8c47a');
    handle(ex, ey, '2', '#e8c47a');
    ctx.fillStyle = 'rgba(20,25,16,0.86)';
    ctx.fillRect((sx + ex) / 2 - 28, (sy + ey) / 2 - 18, 56, 18);
    ctx.fillStyle = '#f0d58e';
    ctx.font = '700 10px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(b.state === 'autoAim' ? '锁定 ' + Math.ceil(a.timer) + 's' : '投弹中', (sx + ex) / 2, (sy + ey) / 2 - 5);
    ctx.restore();
  }

  function pointerWorld(ev) {
    var el = $id('world');
    if (!el || !SL.Render || !SL.Render.screenToWorld) return null;
    var r = el.getBoundingClientRect();
    return SL.Render.screenToWorld(ev.clientX - r.left, ev.clientY - r.top);
  }

  function bindCardDrag() {
    var card = $id('air-card-strike');
    var world = $id('world');
    if (!card || !world) return;
    card.addEventListener('dragstart', function (ev) {
      if (!SL.UI || !SL.UI.currentGame) return;
      var g = SL.UI.currentGame();
      if (!g) return;
      try { ev.dataTransfer.setData('text/plain', 'bomber-strike'); ev.dataTransfer.effectAllowed = 'copy'; } catch (e) {}
    });
    world.addEventListener('dragover', function (ev) {
      if (!SL.UI || !SL.UI.currentGame) return;
      var g = SL.UI.currentGame();
      if (!g) return;
      ev.preventDefault();
    });
    world.addEventListener('drop', function (ev) {
      if (!SL.UI || !SL.UI.currentGame) return;
      var g = SL.UI.currentGame();
      if (!g) return;
      var data = '';
      try { data = ev.dataTransfer.getData('text/plain'); } catch (e) {}
      if (data !== 'bomber-strike') return;
      ev.preventDefault();
      var w = pointerWorld(ev);
      if (!w) return;
      startAim(g);
      var b = ensure(g);
      if (!b.auto) return;
      b.auto.start = { x: w.x, y: w.y };
      b.auto.end = { x: w.x + 700, y: w.y };
      b.auto.length = 700;
    });
  }

  function bindInput() {
    window.addEventListener('pointerdown', function (ev) {
      if (!SL.UI || !SL.UI.currentGame) return;
      var g = SL.UI.currentGame();
      if (!g) return;
      var b = ensure(g);
      if (b.state !== 'autoAim' || !b.auto) return;
      if (ev.target && ev.target.id !== 'world') return;
      var w = pointerWorld(ev);
      if (!w) return;
      var a = b.auto;
      var hitR = 22 / Math.max(0.2, SL.Render.cam.zoom);
      var which = dist(w, a.start) <= hitR ? 'start' : (dist(w, a.end) <= hitR ? 'end' : null);
      if (!which) return;
      ev.preventDefault(); ev.stopPropagation();
      a.drag = which;
    }, true);
    window.addEventListener('pointermove', function (ev) {
      if (!SL.UI || !SL.UI.currentGame) return;
      var g = SL.UI.currentGame();
      if (!g) return;
      var b = ensure(g);
      if (!b.auto || !b.auto.drag || b.state !== 'autoAim') return;
      var w = pointerWorld(ev);
      if (!w) return;
      ev.preventDefault(); ev.stopPropagation();
      if (b.auto.drag === 'start') b.auto.start = { x: w.x, y: w.y };
      else b.auto.end = { x: w.x, y: w.y };
      // 长度限制：最短 260，最长 1400
      var dx = b.auto.end.x - b.auto.start.x, dy = b.auto.end.y - b.auto.start.y;
      var len = Math.hypot(dx, dy) || 1;
      if (len > 1400) { b.auto.end.x = b.auto.start.x + dx / len * 1400; b.auto.end.y = b.auto.start.y + dy / len * 1400; }
      if (len < 260) { b.auto.end.x = b.auto.start.x + dx / len * 260; b.auto.end.y = b.auto.start.y + dy / len * 260; }
    }, true);
    window.addEventListener('pointerup', function () {
      if (!SL.UI || !SL.UI.currentGame) return;
      var g = SL.UI.currentGame();
      if (!g) return;
      var b = ensure(g);
      if (b.auto) b.auto.drag = null;
    }, true);
  }

  function bindUI() {
    document.addEventListener('click', function (ev) {
      if (!SL.UI || !SL.UI.currentGame) return;
      var g = SL.UI.currentGame();
      if (!g) return;
      if (ev.target && ev.target.closest && ev.target.closest('[data-bomber-preset]')) {
        var key = ev.target.closest('[data-bomber-preset]').getAttribute('data-bomber-preset');
        var data = key === 'custom' ? customData() : { groups: presetGroups(key) };
        if (!data || !data.groups) { toast(key === 'custom' ? '还没有保存过方案' : '未知预设', 'loss'); return; }
        applyGroups(g, data.groups, key);
        toast('已套用配备方案：' + (key === 'custom' ? '上次保存' : (PRESETS[key] || {}).name), 'win');
        try { SL.Bomber.closeConfig(); SL.Bomber.openConfig(g); } catch (e) {}
        return;
      }
      if (ev.target && ev.target.id === 'bomber-save-preset') {
        saveCustomPreset(g);
        return;
      }
      if (ev.target && ev.target.closest && ev.target.closest('#air-card-strike')) {
        startAim(g);
        return;
      }
      if (ev.target && ev.target.closest && ev.target.closest('#air-card-return')) {
        var b = ensure(g);
        if (b.state === 'autoAim' || b.state === 'autoMission') cancelAim(g);
        return;
      }
    });
  }

  function refreshNewCards(g) {
    var b = ensure(g);
    if (!b.auto) b.auto = { preset: 'lb500', phase: null };
    var stateEl = $id('air-state');
    var stateSub = $id('air-state-sub');
    if (b.state === 'autoAim') {
      if (stateEl) stateEl.textContent = '轰炸瞄准 · ' + Math.ceil(b.auto.timer) + 's';
      if (stateSub) stateSub.textContent = '拖动①/②调整轰炸线';
    } else if (b.state === 'autoMission') {
      if (stateEl) stateEl.textContent = '轰炸任务执行中';
      if (stateSub) stateSub.textContent = '编队自动进场 / 投弹 / 返场';
    }
    var strike = $id('air-card-strike');
    var strikeSub = $id('air-card-strike-sub');
    var budget = $id('air-card-strike-budget');
    var ret = $id('air-card-return');
    var retSub = $id('air-card-return-sub');
    var cost = supplyCost(g);
    if (budget) budget.textContent = '补给预算 ' + cost;
    if (strikeSub) {
      if (b.state === 'autoAim') strikeSub.textContent = '调整轰炸线 · ' + Math.ceil(b.auto.timer) + 's';
      else if (b.state === 'autoMission') strikeSub.textContent = '任务执行中';
      else strikeSub.textContent = cost > (g.teams.blue.score || 0) ? '补给不足' : '点击在地图设定轰炸线';
    }
    if (strike) strike.classList.toggle('disabled', b.state === 'autoMission');
    if (ret) ret.classList.toggle('disabled', !(b.state === 'autoAim' || b.state === 'autoMission'));
    if (retSub) retSub.textContent = b.state === 'autoMission' ? '立即脱离战场' : (b.state === 'autoAim' ? '取消瞄准' : '无进行中的任务');
  }

  var originalUpdate = SL.Bomber.update;
  SL.Bomber.update = function (g, dt) {
    updateAuto(g, dt);
    if (originalUpdate) originalUpdate(g, dt);
    refreshNewCards(g);
  };
  var originalDraw = SL.Bomber.drawWorld;
  SL.Bomber.drawWorld = function (ctx, g, proj, cam) {
    if (originalDraw) originalDraw(ctx, g, proj, cam);
    drawAuto(ctx, g, proj, cam);
  };
  var originalRefresh = SL.Bomber.refresh;
  SL.Bomber.refresh = function (g) {
    if (originalRefresh) originalRefresh(g);
    if (g) refreshNewCards(g);
  };
  SL.Bomber.auto = { startAim: startAim, cancelAim: cancelAim, supplyCost: supplyCost, isAiming: function (g) { var b = ensure(g); return !!(b && b.state === 'autoAim'); } };

  bindInput();
  bindUI();
  bindCardDrag();
})();
