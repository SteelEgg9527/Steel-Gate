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
      _planBadge: true,
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
      p._planBadge = true;
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
    b.auto.needsReplenish = false;
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
    if (b.auto && b.auto.unpaid) return formationValue(g);
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

  function formationLateral(i, n) { return (i - (n - 1) / 2) * 150; }
  function formationForward(i, n) { return -Math.abs(i - (n - 1) / 2) * 150; }

  function markUnpaid(g) {
    var b = ensure(g);
    b.auto = b.auto || { preset: 'lb500' };
    b.auto.unpaid = true;
    SL.Bomber.refresh(g);
    refreshNewCards(g);
  }

  function formationValue(g) {
    var b = ensure(g);
    var total = 0;
    for (var i = 0; i < b.formation.length; i++) {
      var p = b.formation[i];
      if (!p) continue;
      total += B.planeCost;
      for (var j = 0; j < (p.bombGroups || []).length; j++) total += (p.bombGroups[j].paid || B.bombGroupCost);
    }
    return total;
  }

  function targetWidth(g) {
    var b = ensure(g);
    var n = b.formation.filter(Boolean).length;
    if (!n && currentPreset(g)) n = 5;
    return clamp(300 + Math.max(0, n - 1) * 150, 420, 1000);
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
    if (!currentPreset(g)) { toast('请先在轰炸机配备中选择预设方案', 'loss'); return; }
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

  function edgeAlong(x, y, dx, dy) {
    var ms = SL.CONFIG.mapSize || 2000;
    var margin = 160;
    var tx = dx > 0 ? (ms + margin - x) / dx : (dx < 0 ? (-margin - x) / dx : 1e9);
    var ty = dy > 0 ? (ms + margin - y) / dy : (dy < 0 ? (-margin - y) / dy : 1e9);
    var t = Math.min(tx, ty);
    return { x: x + dx * t, y: y + dy * t };
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
    b.auto.unpaid = false;
    var hasPlanes = b.formation.some(Boolean);
    if (!hasPlanes || b.auto.needsReplenish) applyGroups(g, data.groups, b.auto.preset);
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
    // 进场点必须位于轰炸线反向延长线与地图边缘的交点，
    // 保证整条进场航线与最终轰炸方向完全重合
    var edge = edgeAlong(b.auto.start.x, b.auto.start.y, -b.auto.dir.x, -b.auto.dir.y);
    b.auto.group = { x: edge.x, y: edge.y, heading: Math.atan2(b.auto.dir.y, b.auto.dir.x) };
    b.auto.entryRemain = Math.hypot(b.auto.start.x - edge.x, b.auto.start.y - edge.y);
    b.auto.exitEdge = edgeAlong(b.auto.end.x, b.auto.end.y, b.auto.dir.x, b.auto.dir.y);
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
    if (!planes.length) return;
    var lead = Math.floor((planes.length - 1) / 2);
    var maxBombs = 0;
    for (var i = 0; i < planes.length; i++) maxBombs = Math.max(maxBombs, planes[i].bombs.length);
    if (!maxBombs) return;
    var runTime = Math.max(4, b.auto.length / Math.max(50, B.b17.speed));
    // 每架飞机独立投弹：长机先投，僚机有轻微的随机延迟。
    for (var p = 0; p < planes.length; p++) {
      var plane = planes[p];
      var rank = Math.abs(p - lead);
      var delay = p === lead ? 0 : 0.10 + rank * 0.05 + Math.random() * 0.16;
      for (var k = 0; k < plane.bombs.length; k++) {
        if (!plane.bombs[k]) continue;
        var frac = maxBombs <= 1 ? 0.5 : k / (maxBombs - 1);
        queue.push({
          type: plane.bombs[k],
          at: g.time + 0.8 + frac * runTime + delay,
          frac: frac,
          planeIndex: p,
          bombIndex: k
        });
      }
    }
    queue.sort(function (a, b) { return a.at - b.at; });
    b.auto.bombs = queue;
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
    // 进场 / 投弹 / 退场全部沿最终轰炸方向直线飞行
    if (a.stage === 'entry') {
      var sp = B.b17.speed * 1.35;
      var step = sp * dt;
      if (a.entryRemain <= step) {
        a.group.x = a.start.x;
        a.group.y = a.start.y;
        a.entryRemain = 0;
        a.stage = 'run';
        buildBombQueue(g);
      } else {
        a.group.x += a.dir.x * step;
        a.group.y += a.dir.y * step;
        a.entryRemain -= step;
      }
      a.group.heading = Math.atan2(a.dir.y, a.dir.x);
    } else if (a.stage === 'run') {
      a.progress += B.b17.speed * dt;
      var f = clamp(a.progress / Math.max(1, a.length), 0, 1);
      a.group.x = a.start.x + a.dir.x * a.length * f;
      a.group.y = a.start.y + a.dir.y * a.length * f;
      a.group.heading = Math.atan2(a.dir.y, a.dir.x);
      if (a.progress >= a.length) {
        a.stage = 'exit';
        a.exitAt = g.time + 10;
      }
    } else if (a.stage === 'exit') {
      // 继续沿轰炸方向飞出地图，不做横向修正
      a.group.x += a.dir.x * B.b17.speed * 1.2 * dt;
      a.group.y += a.dir.y * B.b17.speed * 1.2 * dt;
      a.group.heading = Math.atan2(a.dir.y, a.dir.x);
      if (g.time >= (a.exitAt || 0)) { finishMission(g); return; }
    }
    // V 字编队：横向轨道间距 150m，僚机依次后掠
    var planes = b.formation.filter(Boolean);
    var sx = -a.dir.y, sy = a.dir.x;
    for (var i = 0; i < planes.length; i++) {
      var p = planes[i];
      var lat = formationLateral(i, planes.length);
      var fwd = formationForward(i, planes.length);
      var wobbleX = 0, wobbleY = 0;
      var leadIndex = Math.floor((planes.length - 1) / 2);
      if (i !== leadIndex) {
        // 僚机轻微随机浮动，长机保持稳定
        var ph = (p.jitter || 0) + g.time * 1.35;
        wobbleX = sx * Math.sin(ph) * 8 + a.dir.x * Math.cos(ph * 0.8) * 4;
        wobbleY = sy * Math.sin(ph) * 8 + a.dir.y * Math.cos(ph * 0.8) * 4;
      }
      p.x = a.group.x + sx * lat + a.dir.x * fwd + wobbleX;
      p.y = a.group.y + sy * lat + a.dir.y * fwd + wobbleY;
      p.heading = a.group.heading;
      p.deployed = true;
    }
    // 投放队列：到达时间后按轰炸线坐标落弹
    for (var q = 0; q < a.bombs.length; q++) {
      var bomb = a.bombs[q];
      if (bomb.done || g.time < bomb.at) continue;
      bomb.done = true;
      var dropPlane = planes[bomb.planeIndex];
      if (!dropPlane) continue;
      // 炸弹从飞机当前实际位置投出，而不是直接在轰炸区生成爆炸
      var lat = formationLateral(bomb.planeIndex, planes.length);
      var nx = -a.dir.y, ny = a.dir.x;
      var bd = B.bombs[bomb.type] || B.bombs.lb500;
      var tx = a.start.x + a.dir.x * a.length * bomb.frac + nx * lat;
      var ty = a.start.y + a.dir.y * a.length * bomb.frac + ny * lat;
      // 落点随机散布：沿航向只向前偏，横向左右随机，避免出现向后飞的航弹
      var spread = Math.min(90, Math.max(24, bd.radius * 0.55));
      var alongJitter = spread * (0.15 + Math.random() * 0.85);
      var crossJitter = (Math.random() - 0.5) * spread * 1.8;
      tx += a.dir.x * alongJitter + nx * crossJitter;
      ty += a.dir.y * alongJitter + ny * crossJitter;
      // 强制落点位于投弹点前方，保证航弹始终朝轰炸方向飞行
      var ahead = (tx - dropPlane.x) * a.dir.x + (ty - dropPlane.y) * a.dir.y;
      var minAhead = Math.max(80, bd.radius * 0.8);
      if (ahead < minAhead) {
        tx += a.dir.x * (minAhead - ahead);
        ty += a.dir.y * (minAhead - ahead);
      }
      tx = clamp(tx, 4, (SL.CONFIG.mapSize || 2000) - 4);
      ty = clamp(ty, 4, (SL.CONFIG.mapSize || 2000) - 4);
      g.bomberDrops.push({
        id: 'auto_bd_' + (++g.bombers.dropSeq),
        planeId: dropPlane.id, side: 'blue', type: bomb.type,
        x0: dropPlane.x, y0: dropPlane.y, x1: tx, y1: ty,
        heading: dropPlane.heading, t: 0, fall: 3.2,
        radius: bd.radius, color: bd.color,
        impactAt: g.time + 3.2
      });
      if (dropPlane.bombs[bomb.bombIndex] != null) dropPlane.bombs[bomb.bombIndex] = null;
    }
    a.allDropped = a.bombs.every(function (x) { return x.done; });
  }

  function syncBombGroups(p) {
    if (!p) return;
    var counts = {};
    for (var i = 0; i < (p.bombs || []).length; i++) {
      var t = p.bombs[i];
      if (!t) continue;
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
      p.bombs = (p.bombs || []).filter(Boolean);
      syncBombGroups(p);
    }
    b.state = 'base';
    if (b.auto) { b.auto.phase = null; b.auto.bombs = []; b.auto.stage = null; b.auto.needsReplenish = true; }
    toast('B-17 编队已返回基地；下次出击时结算补给', 'info');
    SL.Bomber.refresh(g);
  }

  function drawFallingBomb(ctx, x, y, angle, type, zoom) {
    var d = B.bombs[type] || B.bombs.lb500;
    var lb = d.lb || 500;
    var size = (3 + Math.sqrt(lb) * 0.22) * clamp(zoom || 1, 0.75, 1.5);
    var len = size * 2.2;
    var rad = size * 0.55;
    var incendiary = type === 'incendiary';
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    // 弹体：接近现实航弹的钝头 + 收尾
    ctx.beginPath();
    ctx.ellipse(0, 0, len * 0.5, rad, 0, 0, Math.PI * 2);
    ctx.fillStyle = incendiary ? '#e3c34d' : '#15171a';
    ctx.fill();
    ctx.strokeStyle = incendiary ? '#8f701b' : '#555a60';
    ctx.lineWidth = 1;
    ctx.stroke();
    // 弹头高光
    ctx.beginPath();
    ctx.ellipse(len * 0.22, -rad * 0.2, len * 0.18, rad * 0.28, 0, 0, Math.PI * 2);
    ctx.fillStyle = incendiary ? 'rgba(255,245,174,0.72)' : 'rgba(150,156,162,0.55)';
    ctx.fill();
    // 尾翼
    var tail = -len * 0.32;
    ctx.strokeStyle = incendiary ? '#a98622' : '#34383d';
    ctx.fillStyle = incendiary ? '#b9962b' : '#2a2d31';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(tail, 0); ctx.lineTo(-len * 0.58, -rad * 1.45); ctx.lineTo(-len * 0.42, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(tail, 0); ctx.lineTo(-len * 0.58, rad * 1.45); ctx.lineTo(-len * 0.42, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
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
    ctx.fillStyle = 'rgba(66,145,238,0.14)';
    ctx.strokeStyle = 'rgba(96,181,255,0.96)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(sx + nx * half, sy + ny * half);
    ctx.lineTo(ex + nx * half, ey + ny * half);
    ctx.lineTo(ex - nx * half, ey - ny * half);
    ctx.lineTo(sx - nx * half, sy - ny * half);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.setLineDash([9, 7]);
    ctx.strokeStyle = 'rgba(139,211,255,0.98)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
    ctx.setLineDash([]);
    // 方向标为双排，分别位于中心轴两侧空区的中线上，不在整个指示器中轴
    var ul = Math.hypot(ex - sx, ey - sy) || 1;
    var ux = (ex - sx) / ul, uy = (ey - sy) / ul;
    var hx = -uy, hy = ux;
    var arrowN = 3;
    var rowOffset = half * 0.5; // 两侧空区中线：各距中心轴 1/4 全宽
    for (var row = -1; row <= 1; row += 2) {
      for (var ai = 0; ai < arrowN; ai++) {
        var tAt = 0.22 + ai * 0.28;
        var cx = sx + ux * ul * tAt + hx * rowOffset * row;
        var cy = sy + uy * ul * tAt + hy * rowOffset * row;
        var L = 34, W = 28, H = 22, I = 14;
        // 参考图：外尖 + 左右肩 + 垂直边 + 底角 + 内部 V 形凹口
        // 所有点都在方向坐标系中计算，旋转时不会被拉伸变形
        function bx(px, py) { return cx + ux * px + hx * py; }
        function by(px, py) { return cy + uy * px + hy * py; }
        ctx.beginPath();
        ctx.moveTo(bx(L, 0), by(L, 0));
        ctx.lineTo(bx(0, W), by(0, W));
        ctx.lineTo(bx(-H, W), by(-H, W));
        ctx.lineTo(bx(-H + I, 0), by(-H + I, 0));
        ctx.lineTo(bx(-H, -W), by(-H, -W));
        ctx.lineTo(bx(0, -W), by(0, -W));
        ctx.closePath();
        ctx.fillStyle = 'rgba(96,176,255,0.03)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(151,216,255,0.98)';
        ctx.lineWidth = 4.5;
        ctx.lineJoin = 'miter';
        ctx.stroke();
      }
    }
    // ①/② 是伸出轰炸区外的手柄，用短杆连接
    var off = 48;
    var h1x = sx - ux * off, h1y = sy - uy * off;
    var h2x = ex + ux * off, h2y = ey + uy * off;
    ctx.strokeStyle = 'rgba(120,200,255,0.95)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(h1x, h1y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(h2x, h2y); ctx.stroke();
    function handle(x, y, label, color) {
      ctx.beginPath(); ctx.arc(x, y, 13, 0, Math.PI * 2);
      ctx.fillStyle = '#0b1e31'; ctx.fill();
      ctx.strokeStyle = color; ctx.lineWidth = 2.4; ctx.stroke();
      ctx.fillStyle = color; ctx.font = '700 13px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(label, x, y);
    }
    handle(h1x, h1y, '1', '#72c7ff');
    handle(h2x, h2y, '2', '#72c7ff');
    a._handle1 = { x: h1x, y: h1y };
    a._handle2 = { x: h2x, y: h2y };
    ctx.fillStyle = 'rgba(8,28,48,0.9)';
    ctx.fillRect((sx + ex) / 2 - 28, (sy + ey) / 2 - 18, 56, 18);
    ctx.fillStyle = '#b5e2ff';
    ctx.font = '700 10px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(b.state === 'autoAim' ? '锁定 ' + Math.ceil(a.timer) + 's' : '投弹中', (sx + ex) / 2, (sy + ey) / 2 - 5);
    // 航弹飞行轨迹：从投弹瞬间的飞机位置连到预测落点
    for (var di = 0; di < g.bomberDrops.length; di++) {
      var drop = g.bomberDrops[di];
      if (!drop || String(drop.id).indexOf('auto_bd_') !== 0) continue;
      var p0x = proj.x(drop.x0), p0y = proj.y(drop.y0);
      var p1x = proj.x(drop.x1), p1y = proj.y(drop.y1);
      var fp = clamp((drop.t || 0) / Math.max(0.1, drop.fall || 3.2), 0, 1);
      var bx = p0x + (p1x - p0x) * fp;
      var by = p0y + (p1y - p0y) * fp;
      drawFallingBomb(ctx, bx, by, Math.atan2(p1y - p0y, p1x - p0x), drop.type, cam.zoom);
    }
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
      // 命中检测按屏幕上的外置手柄，而不是轰炸线端点
      var el = $id('world');
      var rect = el.getBoundingClientRect();
      var sx = ev.clientX - rect.left, sy = ev.clientY - rect.top;
      var h1 = a._handle1, h2 = a._handle2;
      var which = h1 && Math.hypot(sx - h1.x, sy - h1.y) <= 24 ? 'start'
        : (h2 && Math.hypot(sx - h2.x, sy - h2.y) <= 24 ? 'end' : null);
      if (!which) return;
      ev.preventDefault(); ev.stopPropagation();
      a.drag = which;
      var knobWorld = SL.Render.screenToWorld(which === 'start' ? h1.x : h2.x, which === 'start' ? h1.y : h2.y);
      a.dragOffset = { x: (which === 'start' ? a.start.x : a.end.x) - knobWorld.x, y: (which === 'start' ? a.start.y : a.end.y) - knobWorld.y };
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
      var off = b.auto.dragOffset || { x: 0, y: 0 };
      if (b.auto.drag === 'start') b.auto.start = { x: w.x + off.x, y: w.y + off.y };
      else b.auto.end = { x: w.x + off.x, y: w.y + off.y };
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
      if (b.auto) { b.auto.drag = null; b.auto.dragOffset = null; }
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
        var b = ensure(g);
        b.auto = b.auto || {};
        b.auto.preset = key;
        // 直接展示预购买的编队，但不扣分；出击时统一结算
        applyGroups(g, data.groups, key);
        b.auto.unpaid = true;
        try { SL.Bomber.closeConfig(); SL.Bomber.openConfig(g); } catch (e) {}
        var label = key === 'custom' ? '上次保存' : ((PRESETS[key] || {}).name || key);
        var presetLabel = $id('bomber-preset-current');
        if (presetLabel) presetLabel.textContent = '已选择：' + label + ' · 出击时结算';
        var presetButtons = document.querySelectorAll('[data-bomber-preset]');
        for (var bi = 0; bi < presetButtons.length; bi++) {
          presetButtons[bi].classList.toggle('on', presetButtons[bi].getAttribute('data-bomber-preset') === key);
        }
        toast('已选择配备方案：' + label + '；出击时结算', 'info');
        refreshNewCards(g);
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
  SL.Bomber.auto = { startAim: startAim, cancelAim: cancelAim, supplyCost: supplyCost, formationValue: formationValue, markUnpaid: markUnpaid, isAiming: function (g) { var b = ensure(g); return !!(b && b.state === 'autoAim'); } };

  bindInput();
  bindUI();
  bindCardDrag();
})();
