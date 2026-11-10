/* 钢铁之门 —— B-17 轰炸机系统 */
(function () {
  'use strict';
  var SL = (window.SL = window.SL || {});
  var U = SL.U;
  var B = (SL.BOMBER = {
    planeCost: 1500,
    bombGroupCost: 500,
    takeoffTime: 60,
    fuelTime: 480,
    baseReturnTime: 60,
    maxPlanes: 5,
    maxBombsPerPlane: 20,
    maxLoadLb: 6000,
    b17: {
      name: 'B-17 空中堡垒',
      hp: 1500,
      speed: 88,
      turnRate: 0.18,
      turnSmooth: 2.2,
      formationStability: 0.82,
      highAltitudeEvade: 0.22,
      orbitRadius: 340,
      aaRadius: 400,
      mgCount: 13,
      mgDamage: 8,
      mgInterval: 0.4,
      vision: 600
    },
    bombs: {
      lb500: {
        key: 'lb500', lb: 500, name: '500lb 航弹', short: '500lb', group: 4,
        damage: 500, radius: 100, fortDamage: 200, interval: 1.25, color: '#e0b46e'
      },
      lb1000: {
        key: 'lb1000', lb: 1000, name: '1000lb 航弹', short: '1000lb', group: 2,
        damage: 900, radius: 125, fortDamage: 340, interval: 1.65, color: '#dca45c'
      },
      lb2000: {
        key: 'lb2000', lb: 2000, name: '2000lb 航弹', short: '2000lb', group: 1,
        damage: 1550, radius: 150, fortDamage: 500, interval: 2.15, color: '#d18b4f'
      },
      incendiary: {
        key: 'incendiary', lb: 300, name: '300lb 燃烧弹', short: '300lb', group: 4,
        damage: 220, radius: 50, fortDamage: 100, interval: 1.0,
        burn: 60, burnDps: 45, color: '#e08a4b'
      }
    },
    bombOrder: ['lb500', 'lb1000', 'lb2000', 'incendiary']
  });

  // 普通空袭与 B-17 的 500lb 航弹保持同一份数据，避免双表漂移
  if (SL.AIRSTRIKE && B.bombs.lb500) {
    SL.AIRSTRIKE.damage = B.bombs.lb500.damage;
    SL.AIRSTRIKE.radius = B.bombs.lb500.radius;
    SL.AIRSTRIKE.fortDamage = B.bombs.lb500.fortDamage;
  }

  var ICON_PLANE = '<img src="assets/b17-dxf-blue.png" alt="">';
  var ICON_BOMB = [
    '<svg viewBox="0 0 24 38" aria-hidden="true">',
    '<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round">',
    '<path d="M12 4 C17 10 20 18 12 34 C4 18 7 10 12 4 Z"/>',
    '<path d="M12 9 V29"/><path d="M7 15 H17"/><path d="M8 23 H16"/>',
    '<path d="M9 4 H15"/><path d="M10 2 H14"/>',
    '</g></svg>'
  ].join('');

  var refs = null;
  var dragging = null;
  var b17Images = { blue: null, red: null, green: null };
  var b17SelectedImage = null;

  function $(id) { return document.getElementById(id); }
  function toast(msg, kind) {
    try { if (SL.UI && SL.UI.pushToast) SL.UI.pushToast(msg, kind || 'info'); } catch (e) {}
  }
  function clickTarget(ev, id) {
    return ev.target && ev.target.closest ? ev.target.closest('#' + id) : null;
  }
  function iconPlane() { return ICON_PLANE; }
  function iconBomb() { return ICON_BOMB; }

  function newPlane(g, name) {
    return {
      id: 'b17_' + (++g.bombers.planeSeq),
      name: name || ('B-17 ' + ((g.bombers.planeSeq || 1)) + '号机'),
      hp: B.b17.hp, maxHp: B.b17.hp, evade: B.b17.highAltitudeEvade || 0.22, altitude: 'high',
      bombs: [], bombGroups: [], loadout: [], loadoutGroups: [], x: 0, y: 0, heading: 0, bank: 0, mgCd: 0, t: 0,
      jitter: Math.random() * Math.PI * 2,
      speedJitter: 0.97 + Math.random() * 0.06,
      playerBomber: true, kind: 'b17', side: 'blue',
      deployed: false, slot: -1
    };
  }

  function ensure(g) {
    if (!g) return null;
    if (!g.bombers) {
      g.bombers = {
        state: 'base',
        stateStart: 0,
        arriveAt: 0,
        baseAt: 0,
        elapsed: 0,
        formation: [null, null, null, null, null],
        hangarPlanes: [],
        hangarBombs: [],
        groupX: 0, groupY: 0, heading: -Math.PI / 2, bank: 0,
        orbitX: 0, orbitY: 0, fuel: 0, userOrbit: false,
        bombing: false, bombMode: 'single', nextPlane: 0,
        planeSeq: 0, bombSeq: 0, dropSeq: 0,
        leftMap: false,
        lastState: '',
        tab: g.naval ? 'ship' : 'bomber'
      };
      g.bomberDrops = g.bomberDrops || [];
      g.bomberFires = g.bomberFires || [];
    }
    if (!g.bomberDrops) g.bomberDrops = [];
    if (!g.bomberFires) g.bomberFires = [];
    return g.bombers;
  }

  function deployedPlanes(g) {
    var b = ensure(g);
    return b.formation.filter(function (p) { return !!p; });
  }

  function allPlanes(g) {
    var b = ensure(g);
    return b.formation.filter(function (p) { return !!p; }).concat(b.hangarPlanes);
  }

  function planeSlots(g) {
    var b = ensure(g);
    var out = [];
    for (var i = 0; i < b.formation.length; i++) if (b.formation[i]) out.push({ plane: b.formation[i], index: i });
    return out;
  }

  function formationSlots() {
    return [
      { forward: 0, lateral: 0 },
      { forward: -75, lateral: -105 },
      { forward: -75, lateral: 105 },
      { forward: -150, lateral: -210 },
      { forward: -150, lateral: 210 }
    ];
  }

  function applyFormation(g) {
    var b = g.bombers;
    if (!b) return;
    var slots = formationSlots();
    var fx = Math.cos(b.heading), fy = Math.sin(b.heading);
    var sx = -fy, sy = fx;
    var idx = 0;
    for (var i = 0; i < b.formation.length; i++) {
      var p = b.formation[i];
      if (!p) continue;
      var s = slots[Math.min(idx, slots.length - 1)];
      var drift = Math.sin((g.time || 0) * 1.15 + (p.jitter || 0)) * 4;
      p.x = b.groupX + fx * s.forward + sx * (s.lateral + drift);
      p.y = b.groupY + fy * s.forward + sy * (s.lateral + drift);
      p.heading = b.heading;
      p.bank = b.bank;
      idx++;
    }
  }

  function firstBomber(b) {
    for (var i = 0; i < b.formation.length; i++) {
      if (b.formation[i] && b.formation[i].deployed) return b.formation[i];
    }
    return null;
  }

  function updateFormation(g, b, dt) {
    var slots = formationSlots();
    // 编队航向滞后于长机航向：转弯时 V 形自然拉伸/压缩
    if (b.formHeading == null) b.formHeading = b.heading;
    var hd = b.heading - b.formHeading;
    while (hd > Math.PI) hd -= Math.PI * 2;
    while (hd < -Math.PI) hd += Math.PI * 2;
    b.formHeading += hd * Math.min(1, dt * 4.2);
    var fx = Math.cos(b.formHeading), fy = Math.sin(b.formHeading);
    var sx = -fy, sy = fx;
    var active = 0;
    for (var i = 0; i < b.formation.length; i++) {
      var p = b.formation[i];
      if (!p || !p.deployed) continue;
      // 长机保持自己的轨迹，僚机围绕由长机形成的 V 形槽位
      if (active === 0) { active++; continue; }
      var s = slots[Math.min(active, slots.length - 1)];
      var bank = b.bank || 0;
      var inside = bank * s.lateral > 0;
      var lateral = s.lateral * (inside ? 0.90 : 1.035);
      var forward = s.forward - Math.abs(s.lateral) * Math.abs(bank) * 0.035;
      var drift = Math.sin((g.time || 0) * 0.7 + (p.jitter || 0)) * 0.8 * (1 - (B.b17.formationStability || 0.82));
      var tx = b.groupX + fx * forward + sx * (lateral + drift);
      var ty = b.groupY + fy * forward + sy * (lateral + drift);
      var dx = tx - p.x, dy = ty - p.y;
      var desired = Math.atan2(dy, dx);
      var diff = desired - (p.heading || 0);
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      var max = B.b17.turnRate * dt * (2.0 + (B.b17.formationStability || 0.82) * 0.8);
      var step = U.clamp(diff, -max, max);
      p.heading += step;
      p.bank = U.clamp(step / Math.max(0.001, max) * 0.6, -0.6, 0.6);
      var dist = Math.hypot(dx, dy);
      var speed = B.b17.speed * (p.speedJitter || 1);
      if (dist > 220) speed *= 1.45;
      else if (dist > 90) speed *= 1.22;
      else if (dist < 42) speed *= 0.9;
      p.x += Math.cos(p.heading) * speed * dt;
      p.y += Math.sin(p.heading) * speed * dt;
      // 位置弹簧：比纯转向更硬地拉回槽位，但仍允许转弯时短暂形变
      var ex = tx - p.x, ey = ty - p.y;
      var ed = Math.hypot(ex, ey);
      var pull = ed > 180 ? 0.42 : 0.26;
      p.x += ex * pull;
      p.y += ey * pull;
      // 极限脱离时直接收回，避免僚机越飞越散
      if (ed > 260) {
        p.x = tx - ex / Math.max(1, ed) * 260;
        p.y = ty - ey / Math.max(1, ed) * 260;
      }
      // 保持机间距离，避免选中圈重叠
      for (var j = 0; j < b.formation.length; j++) {
        var q = b.formation[j];
        if (!q || q === p || !q.deployed) continue;
        var qx = p.x - q.x, qy = p.y - q.y;
        var qd = Math.hypot(qx, qy);
        if (qd > 0.001 && qd < 60) {
          p.x += qx / qd * (60 - qd) * 0.4;
          p.y += qy / qd * (60 - qd) * 0.4;
        }
      }
      active++;
    }
  }

  function nearestEdge(x, y) {
    var ms = SL.CONFIG.mapSize;
    var m = Math.min(x, ms - x, y, ms - y);
    if (m === x) return { x: -80, y: U.clamp(y, 60, ms - 60), heading: 0 };
    if (m === ms - x) return { x: ms + 80, y: U.clamp(y, 60, ms - 60), heading: Math.PI };
    if (m === y) return { x: U.clamp(x, 60, ms - 60), y: -80, heading: Math.PI / 2 };
    return { x: U.clamp(x, 60, ms - 60), y: ms + 80, heading: -Math.PI / 2 };
  }

  function playerCenter(g) {
    var x = 0, y = 0, n = 0;
    for (var i = 0; i < g.units.length; i++) {
      var u = g.units[i];
      if (u.alive && u.side === 'blue') { x += u.x; y += u.y; n++; }
    }
    if (!n && SL.Terrain.spawns && SL.Terrain.spawns.blue) return { x: SL.Terrain.spawns.blue.x, y: SL.Terrain.spawns.blue.y };
    return n ? { x: x / n, y: y / n } : { x: SL.CONFIG.mapSize / 2, y: SL.CONFIG.mapSize / 2 };
  }

  function bombWeight(type) {
    var d = B.bombs[type];
    if (!d) return 0;
    return d.lb || parseInt(type === 'lb500' ? '500' : (type === 'lb1000' ? '1000' : (type === 'lb2000' ? '2000' : '300')), 10);
  }

  function loadWeight(p) {
    var w = 0;
    for (var i = 0; i < p.bombs.length; i++) w += bombWeight(p.bombs[i]);
    return w;
  }

  function rebuildBombs(p) {
    p.bombs = [];
    for (var i = 0; i < p.bombGroups.length; i++) {
      var grp = p.bombGroups[i];
      for (var k = 0; k < grp.count; k++) p.bombs.push(grp.type);
    }
  }

  function snapshotLoadout(p) {
    p.loadout = p.bombs.slice();
    p.loadoutGroups = p.bombGroups.map(function (g) {
      return { type: g.type, count: g.count, paid: g.paid };
    });
  }

  function restoreLoadout(p) {
    if (p.loadoutGroups && p.loadoutGroups.length) {
      p.bombGroups = p.loadoutGroups.map(function (g) {
        return { type: g.type, count: g.count, paid: g.paid };
      });
    }
    rebuildBombs(p);
  }

  function planeBombsText(p) {
    if (!p.bombs.length) return '无航弹';
    var counts = {};
    for (var i = 0; i < p.bombs.length; i++) counts[p.bombs[i]] = (counts[p.bombs[i]] || 0) + 1;
    var arr = [];
    for (var k in counts) arr.push((B.bombs[k] ? B.bombs[k].short : k) + '×' + counts[k]);
    return arr.join(' · ');
  }

  function bombIconHTML(type, planeId, index, count) {
    var d = B.bombs[type] || {};
    var attrs = '';
    if (planeId != null && index != null) {
      attrs = ' draggable="true" data-drag-kind="equippedbomb" data-plane-id="' + planeId + '" data-bomb-index="' + index + '" data-bomb-type="' + type + '"';
    }
    var label = (d.short || type) + (count > 1 ? ' ×' + count : '');
    return '<span class="air-bomb"' + attrs + ' title="' + d.name + '">' + ICON_BOMB + '<i>' + label + '</i></span>';
  }

  function planeHTML(p, extra) {
    return '<div class="air-roster-plane" data-plane="' + p.id + '">' +
      '<div class="air-roster-icon">' + ICON_PLANE + '</div>' +
      '<div class="air-roster-info"><b>' + p.name + '</b>' +
      '<small>耐久 ' + Math.ceil(p.hp) + ' / ' + p.maxHp + ' · 航弹 ' + p.bombs.length + ' 枚 · ' + loadWeight(p) + '/6000lb</small>' +
      '<span class="air-roster-bombs">' + (p.bombs.length ? p.bombs.map(bombIconHTML).join('') : '<i class="air-none">无挂载</i>') + '</span></div>' +
      (extra || '') + '</div>';
  }

  function statusText(g) {
    var b = ensure(g);
    if (b.state === 'takeoff') {
      var left = Math.max(0, b.arriveAt - g.time);
      return { text: '飞往战场 ' + clock(left), sub: '再次点击起飞卡可召回' };
    }
    if (b.state === 'over') return { text: '战场巡航 · 剩余 ' + clock(b.fuel), sub: '右键地图指挥编队' };
    if (b.state === 'returning') return { text: '脱离战场', sub: '飞离地图边缘后返航' };
    if (b.state === 'toBase') return { text: '返回基地 ' + clock(Math.max(0, b.baseAt - g.time)), sub: '返航中' };
    return { text: '基地待命', sub: b.formation.filter(function (p) { return !!p; }).length ? '编队已就绪' : '请先配备飞机' };
  }

  function clock(sec) {
    sec = Math.max(0, Math.ceil(sec || 0));
    var m = Math.floor(sec / 60), s = sec % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  function startTakeoff(g) {
    var b = ensure(g);
    if (b.state !== 'base') return;
    if (!b.formation.some(function (p) { return !!p; })) {
      toast('编队中没有轰炸机，请先点击配备卡', 'loss');
      return;
    }
    b.state = 'takeoff';
    b.stateStart = g.time;
    b.arriveAt = g.time + B.takeoffTime;
    b.elapsed = 0;
    b.bombing = false;
    for (var ti = 0; ti < b.formation.length; ti++) {
      if (b.formation[ti]) snapshotLoadout(b.formation[ti]);
    }
    toast('B-17 编队从基地起飞，1 分钟后抵达战场', 'order');
  }

  function cancelTakeoffToBase(g) {
    var b = ensure(g);
    var elapsed = Math.max(2, g.time - b.stateStart);
    b.state = 'toBase';
    b.baseAt = g.time + elapsed;
    b.elapsed = elapsed;
    b.bombing = false;
    toast('已召回起飞编队，返航时间 ' + Math.ceil(elapsed) + ' 秒', 'info');
  }

  function deployGroup(g) {
    var b = ensure(g);
    var center = playerCenter(g);
    var edge = nearestEdge(center.x, center.y);
    b.groupX = edge.x;
    b.groupY = edge.y;
    b.heading = edge.heading;
    b.bank = 0;
    b.orbitX = center.x;
    b.orbitY = center.y;
    b.userOrbit = false;
    b.fuel = B.fuelTime;
    b.state = 'over';
    b.stateStart = g.time;
    b.forcedReturn = false;
    b.bombing = false;
    b.nextPlane = 0;
    b.formHeading = b.heading;
    applyFormation(g);
    for (var i = 0; i < b.formation.length; i++) {
      var p = b.formation[i];
      if (!p) continue;
      p.hp = Math.max(1, p.hp);
      p.deployed = true;
      p.hitFlash = 0;
      p.mgCd = 0;
      if (g.planes.indexOf(p) < 0) g.planes.push(p);
    }
    toast('B-17 编队抵达战场，默认盘旋于己方部队上空', 'win');
  }

  function beginReturn(g, forced) {
    var b = ensure(g);
    if (b.state !== 'over') return;
    b.state = 'returning';
    b.stateStart = g.time;
    b.returnEdge = nearestEdge(b.groupX, b.groupY);
    b.returnEdge.heading += Math.PI;
    b.leftMap = false;
    b.forcedReturn = !!forced;
    b.bombing = false;
    toast(forced ? 'B-17 燃料耗尽，强制返航' : 'B-17 编队开始返航；飞离战场前可再次点击返航卡取消', forced ? 'loss' : 'info');
  }

  function cancelReturn(g) {
    var b = ensure(g);
    if (b.state !== 'returning' || b.leftMap || b.forcedReturn) return;
    b.state = 'over';
    b.bombing = false;
    toast('已取消返航，B-17 编队继续留在战场', 'info');
  }

  function finishReturn(g) {
    var b = ensure(g);
    b.state = 'toBase';
    b.baseAt = g.time + B.baseReturnTime;
    b.leftMap = false;
    b.bombing = false;
    for (var i = 0; i < b.formation.length; i++) {
      var p = b.formation[i];
      if (!p) continue;
      p.deployed = false;
      p.hp = p.maxHp;
      var idx = g.planes.indexOf(p);
      if (idx >= 0) g.planes.splice(idx, 1);
    }
    toast('B-17 编队已离开战场，返回基地需要 1 分钟', 'info');
  }

  var RESTOCK_KEY = 'steel_bomber_auto_restock';
  function restockEnabled() {
    try { return localStorage.getItem(RESTOCK_KEY) === '1'; } catch (e) { return false; }
  }
  function setRestock(v) {
    try { localStorage.setItem(RESTOCK_KEY, v ? '1' : '0'); } catch (e) {}
  }
  function syncRemainingBombGroups(p) {
    var counts = {}, paid = {};
    for (var i = 0; i < p.bombGroups.length; i++) paid[p.bombGroups[i].type] = p.bombGroups[i].paid || B.bombGroupCost;
    for (var j = 0; j < p.bombs.length; j++) counts[p.bombs[j]] = (counts[p.bombs[j]] || 0) + 1;
    p.bombGroups = [];
    for (var k in counts) p.bombGroups.push({ type: k, count: counts[k], paid: paid[k] || B.bombGroupCost });
    rebuildBombs(p);
  }

  function finishBase(g) {
    var b = ensure(g);
    b.state = 'base';
    b.bombing = false;
    b.leftMap = false;
    b.nextPlane = 0;
    for (var i = 0; i < b.formation.length; i++) {
      if (!b.formation[i]) continue;
      b.formation[i].hp = b.formation[i].maxHp;
      b.formation[i].deployed = false;
      if (restockEnabled()) restoreLoadout(b.formation[i]);
      else syncRemainingBombGroups(b.formation[i]);
    }
    toast(restockEnabled() ? 'B-17 编队返回基地，航弹已自动补充' : 'B-17 编队返回基地，剩余航弹保留', 'win');
  }

  function startBombing(g) {
    var b = ensure(g);
    if (b.state !== 'over') { toast('轰炸机尚未抵达战场', 'loss'); return; }
    if (b.bombing) { b.bombing = false; toast('已停止投弹', 'info'); return; }
    var has = b.formation.some(function (p) { return p && p.bombs.length; });
    if (!has) { toast('编队没有可用航弹，请先在配备界面挂载', 'loss'); return; }
    b.bombing = true;
    b.bombMode = b.bombMode || 'single';
    if (b.bombMode === 'single') {
      var idx = b.nextPlane || 0;
      for (var k = 0; k < b.formation.length; k++) {
        var pi = (idx + k) % b.formation.length;
        var p = b.formation[pi];
        if (p && p.bombs.length) { b.nextPlane = pi; break; }
      }
    }
    var leadSet = false;
    for (var i = 0; i < b.formation.length; i++) {
      var pl = b.formation[i];
      if (!pl || !pl.bombs.length) continue;
      if (!leadSet) {
        pl._dropCd = 0.05;
        leadSet = true;
      } else {
        pl._dropCd = 0.35 + Math.random() * 0.65;
      }
    }
    toast(b.bombMode === 'single' ? '单机投弹开始' : '编队依次投弹开始', 'order');
  }

  function bombTypeOf(g, p) {
    return p.bombs.length ? p.bombs[0] : null;
  }

  function dropBomb(g, p) {
    var type = p.bombs.shift();
    if (!type) return;
    var d = B.bombs[type];
    var f = { x: Math.cos(p.heading), y: Math.sin(p.heading) };
    var s = { x: -f.y, y: f.x };
    // 对海轰炸散布更大：落点附近有敌舰时放大横向/纵向误差
    var shipBias = 1;
    if (g.battleships && g.battleships.length) {
      for (var sb = 0; sb < g.battleships.length; sb++) {
        var bsh = g.battleships[sb];
        if (bsh && bsh.alive && bsh.side !== 'blue' && U.dist(p.x, p.y, bsh.x, bsh.y) <= 1200) { shipBias = 1.7; break; }
      }
    }
    var long = (Math.random() - 0.5) * 100 * shipBias;
    var lat = (Math.random() - 0.5) * 300 * shipBias;
    var tx = p.x + f.x * long + s.x * lat;
    var ty = p.y + f.y * long + s.y * lat;
    tx = U.clamp(tx, 5, SL.CONFIG.mapSize - 5);
    ty = U.clamp(ty, 5, SL.CONFIG.mapSize - 5);
    g.bomberDrops.push({
      id: 'bd_' + (++g.bombers.dropSeq),
      planeId: p.id, side: 'blue', type: type,
      x0: p.x, y0: p.y, x1: tx, y1: ty,
      heading: p.heading, t: 0, fall: 3.4,
      radius: d.radius, color: d.color,
      impactAt: g.time + 3.4
    });
    if (SL.Audio) SL.Audio.shot({ dmg: 10, kind: 'drop', label: '航弹' }, { side: 'blue' }, false, p.x, p.y);
  }

  function impactBomb(g, drop) {
    var d = B.bombs[drop.type] || B.bombs.lb500;
    var x = drop.x1, y = drop.y1;
    var radius = d.radius;
    var credit = { side: 'blue', name: 'B-17 航弹', kills: 0, score: 0 };
    g.effects.push({ kind: 'blast', x: x, y: y, t: 0, dur: 1.2, r: radius, side: 'blue' });
    g.effects.push({ kind: 'explosion', x: x, y: y, t: 0, dur: 1.0, size: radius, world: true, side: 'blue' });
    if (SL.Audio) SL.Audio.explosion(radius, x, y);
    for (var i = 0; i < g.units.length; i++) {
      var u = g.units[i];
      if (!u.alive) continue;
      var dist = U.dist(u.x, u.y, x, y);
      if (dist > radius) continue;
      var falloff = 1 - 0.68 * (dist / radius);
      var friendly = u.side === 'blue' ? 0.30 : 1;
      g.damage(u, d.damage * falloff * friendly * (u.def.armor ? 0.72 : 1), credit, 2);
    }
    for (var b = 0; b < g.battleships.length; b++) {
      var sh = g.battleships[b];
      if (!sh.alive) continue;
      var sd = U.dist(sh.x, sh.y, x, y);
      if (sd > radius + (sh.hitRadius || 60)) continue;
      var sf = 1 - 0.7 * Math.min(1, sd / (radius + (sh.hitRadius || 60)));
      var shipFriendly = sh.side === 'blue' ? 0.30 : 1;
      g.damageShip(sh, d.damage * 1.2 * sf * shipFriendly, credit, 3.2);
    }
    if (d.fortDamage) g.damageFortifications(x, y, d.fortDamage, radius);
    if (d.burn) {
      g.bomberFires.push({ x: x, y: y, r: d.radius, until: g.time + d.burn, next: 0, dps: d.burnDps, side: 'blue' });
      addBurnScars(g, x, y, d.radius);
    }
  }

  function updateFires(g, dt) {
    for (var i = g.bomberFires.length - 1; i >= 0; i--) {
      var f = g.bomberFires[i];
      if (g.time > f.until) { g.bomberFires.splice(i, 1); continue; }
      if (g.time < f.next) continue;
      f.next = g.time + 1;
      var credit = { side: f.side || 'blue', name: '燃烧弹', kills: 0, score: 0 };
      for (var k = 0; k < g.units.length; k++) {
        var u = g.units[k];
        if (!u.alive) continue;
        if (U.dist(u.x, u.y, f.x, f.y) <= f.r) {
          var fm = u.side === (f.side || 'blue') ? 0.30 : 1;
          g.damage(u, f.dps * fm, credit, 1);
        }
      }
      if (g.time % 0.5 < 0.3) {
        g.effects.push({ kind: 'fire', x: f.x + (Math.random() - 0.5) * f.r, y: f.y + (Math.random() - 0.5) * f.r, t: 0, dur: 0.5, r: 8 + Math.random() * 6, side: f.side });
      }
    }
  }

  function updateSelfDefense(g, b, dt) {
    for (var i = 0; i < b.formation.length; i++) {
      var p = b.formation[i];
      if (!p || !p.deployed || p.hp <= 0) continue;
      p.mgCd = Math.max(0, (p.mgCd || 0) - dt);
      if (p.mgCd > 0) continue;
      var best = null, bd = B.b17.aaRadius;
      for (var j = 0; j < g.planes.length; j++) {
        var e = g.planes[j];
        if (!e || e === p || e.side === 'blue' || e.hp <= 0) continue;
        var d = U.dist(p.x, p.y, e.x, e.y);
        if (d <= bd) { bd = d; best = e; }
      }
      if (!best) continue;
      p.mgCd = B.b17.mgInterval;
      g.damagePlane(best, B.b17.mgDamage, { side: 'blue', name: 'B-17 自卫机枪', kills: 0, score: 0 });
      if (Math.random() < 0.5) {
        g.effects.push({ kind: 'tracer', x1: p.x, y1: p.y, x2: best.x, y2: best.y, t: 0, dur: 0.08, side: 'blue' });
      }
    }
  }

  function updateBombing(g, b, dt) {
    if (!b.bombing || b.state !== 'over') return;
    var any = false;
    if (b.bombMode === 'single') {
      var p = b.formation[b.nextPlane || 0];
      if (!p || !p.bombs.length) { b.bombing = false; return; }
      any = true;
      p._dropCd = Math.max(0, (p._dropCd || 0) - dt);
      if (p._dropCd <= 0) {
        var type = bombTypeOf(g, p);
        var interval = type ? B.bombs[type].interval : 0.8;
        dropBomb(g, p);
        p._dropCd = interval;
        b.nextPlane = b.nextPlane || 0;
      }
      if (!p.bombs.length) b.bombing = false;
    } else {
      for (var i = 0; i < b.formation.length; i++) {
        var pl = b.formation[i];
        if (!pl || !pl.bombs.length) continue;
        any = true;
        pl._dropCd = Math.max(0, (pl._dropCd || 0) - dt);
        if (pl._dropCd <= 0) {
          var t = bombTypeOf(g, pl);
          var iv = t ? B.bombs[t].interval : 0.8;
          dropBomb(g, pl);
          pl._dropCd = iv * (0.9 + Math.random() * 0.2);
        }
      }
      if (!any) b.bombing = false;
    }
  }

  function updateDrops(g, dt) {
    for (var i = g.bomberDrops.length - 1; i >= 0; i--) {
      var d = g.bomberDrops[i];
      d.t += dt;
      if (g.time >= d.impactAt) {
        g.bomberDrops.splice(i, 1);
        impactBomb(g, d);
      }
    }
  }

  function turnToward(b, desired, dt) {
    var diff = desired - b.heading;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    var max = B.b17.turnRate * dt;
    var step = U.clamp(diff, -max, max);
    b.heading += step;
    var targetBank = U.clamp(step / Math.max(0.001, max) * (B.b17.bankGain || 0.55), -0.55, 0.55);
    var bankK = 1 - Math.exp(-dt * (B.b17.bankSmooth || 3.2));
    b.bank += (targetBank - b.bank) * bankK;
  }

  function updateMovement(g, b, dt) {
    var lead = firstBomber(b);
    if (!lead) return;
    if (b.state === 'over') {
      var dx = b.orbitX - lead.x, dy = b.orbitY - lead.y;
      var d = Math.hypot(dx, dy) || 1;
      var desired;
      if (d > B.b17.orbitRadius + 80) {
        desired = Math.atan2(dy, dx);
      } else {
        var ang = Math.atan2(lead.y - b.orbitY, lead.x - b.orbitX);
        desired = ang + Math.PI / 2;
        if (d < B.b17.orbitRadius - 90) desired = Math.atan2(dy, dx);
      }
      turnToward(lead, desired, dt);
    } else if (b.state === 'returning') {
      var re = b.returnEdge || nearestEdge(lead.x, lead.y);
      turnToward(lead, re.heading, dt);
    } else {
      return;
    }
    var speed = B.b17.speed * (lead.speedJitter || 1);
    lead.x += Math.cos(lead.heading) * speed * dt;
    lead.y += Math.sin(lead.heading) * speed * dt;
    b.groupX = lead.x;
    b.groupY = lead.y;
    b.heading = lead.heading;
    b.bank = lead.bank;
    updateFormation(g, b, dt);
  }

  function update(g, dt) {
    var b = ensure(g);
    if (!b) return;
    if (b.state === 'takeoff') {
      b.elapsed = g.time - b.stateStart;
      if (g.time >= b.arriveAt) deployGroup(g);
    } else if (b.state === 'over') {
      b.fuel -= dt;
      if (b.fuel <= 0) beginReturn(g, true);
      if (!b.userOrbit) {
        var pc = playerCenter(g);
        b.orbitX = pc.x;
        b.orbitY = pc.y;
      }
      updateMovement(g, b, dt);
      updateBombing(g, b, dt);
      updateSelfDefense(g, b, dt);
    } else if (b.state === 'returning') {
      updateMovement(g, b, dt);
      if (b.groupX < -70 || b.groupX > SL.CONFIG.mapSize + 70 ||
          b.groupY < -70 || b.groupY > SL.CONFIG.mapSize + 70) {
        b.leftMap = true;
        finishReturn(g);
      }
    } else if (b.state === 'toBase') {
      if (g.time >= b.baseAt) finishBase(g);
    }
    updateDrops(g, dt);
    updateFires(g, dt);
  }

  function onPlaneDown(g, p, source) {
    var b = ensure(g);
    if (!b) return;
    for (var i = 0; i < b.formation.length; i++) {
      if (b.formation[i] && b.formation[i].id === p.id) {
        b.formation[i] = null;
        break;
      }
    }
    if (b.state === 'over' && !b.formation.some(function (x) { return !!x; })) {
      b.state = 'base';
      b.bombing = false;
      b.nextPlane = 0;
      if (g.selectedBomber === b) g.selectedBomber = null;
      toast('B-17 编队全部坠毁，需要重新购买飞机', 'loss');
    }
  }

  function planeAt(g, x, y, radius) {
    var b = ensure(g);
    if (!b || b.state !== 'over') return null;
    var rr = radius || 46 / (SL.Render && SL.Render.cam ? SL.Render.cam.zoom : 1);
    for (var i = 0; i < b.formation.length; i++) {
      var p = b.formation[i];
      if (!p || !p.deployed) continue;
      if (U.dist(x, y, p.x, p.y) <= Math.max(24, rr)) return p;
    }
    return null;
  }

  function selectGroup(g) {
    var b = ensure(g);
    if (!b || b.state !== 'over') return false;
    g.selectedBomber = b;
    g.selectedShip = null;
    g.selected = [];
    for (var i = 0; i < g.units.length; i++) g.units[i].selected = false;
    b.tab = 'bomber';
    refresh(g);
    toast('已选中 B-17 轰炸机编队，右键地图指挥飞行', 'order');
    return true;
  }

  function clearSelection(g) {
    if (g && g.selectedBomber) {
      g.selectedBomber = null;
      return true;
    }
    return false;
  }

  function commandMove(g, x, y) {
    var b = ensure(g);
    if (b.state !== 'over') { toast('轰炸机未在战场上空', 'loss'); return false; }
    b.orbitX = x;
    b.orbitY = y;
    b.userOrbit = true;
    toast('轰炸机编队前往指定空域', 'order');
    return true;
  }

  /* ---------------- 配备界面 ---------------- */

  function planeInFormationOrHangar(g, id) {
    var b = ensure(g);
    for (var i = 0; i < b.formation.length; i++) if (b.formation[i] && b.formation[i].id === id) return { plane: b.formation[i], slot: i, inFormation: true };
    for (var h = 0; h < b.hangarPlanes.length; h++) if (b.hangarPlanes[h].id === id) return { plane: b.hangarPlanes[h], slot: -1, inFormation: false };
    return null;
  }

  function markBomberUnpaid(g) {
    if (SL.Bomber && SL.Bomber.auto && SL.Bomber.auto.markUnpaid) SL.Bomber.auto.markUnpaid(g);
  }

  function buyPlane(g) {
    var b = ensure(g);
    if (b.state !== 'base') { toast('轰炸机不在基地，无法购买', 'loss'); return; }
    markBomberUnpaid(g);
    var p = newPlane(g, 'B-17 ' + (allPlanes(g).length + 1) + '号机');
    b.hangarPlanes.push(p);
    toast('已预购 B-17，拖入编组栏；出击时结算', 'win');
    renderConfig(g);
    refresh(g);
  }

  function buyBomb(g, type) {
    var b = ensure(g);
    if (b.state !== 'base') { toast('轰炸机不在基地，无法购买', 'loss'); return; }
    var d = B.bombs[type];
    if (!d) return;
    markBomberUnpaid(g);
    b.hangarBombs.push({ id: 'bomb_' + (++b.bombSeq || (b.bombSeq = 1)), type: type, count: d.group, paid: B.bombGroupCost });
    toast('已预购 ' + d.name + '（' + d.group + '枚），出击时结算', 'win');
    renderConfig(g);
    refresh(g);
  }

  function buyBombToPlane(g, plane, type) {
    var b = ensure(g);
    var d = B.bombs[type];
    if (!d || !plane || b.state !== 'base') return false;
    if (loadWeight(plane) + d.group * bombWeight(type) > B.maxLoadLb) { toast('挂载超重：该机最多 ' + B.maxLoadLb + 'lb 航弹', 'loss'); return false; }
    markBomberUnpaid(g);
    plane.bombGroups.push({ type: type, count: d.group, paid: B.bombGroupCost });
    rebuildBombs(plane);
    snapshotLoadout(plane);
    toast('已预购并挂载 ' + d.name + ' ×' + d.group + '，出击时结算', 'win');
    renderConfig(g); refresh(g);
    return true;
  }

  function buyBombToFirstPlane(g, type) {
    var b = ensure(g);
    var d = B.bombs[type];
    if (!b || !d) return false;
    if (b.state !== 'base') { toast('轰炸机不在基地，无法装备', 'loss'); return false; }
    for (var i = 0; i < b.formation.length; i++) {
      var p = b.formation[i];
      if (!p) continue;
      if (loadWeight(p) + d.group * bombWeight(type) > B.maxLoadLb) continue;
      if (buyBombToPlane(g, p, type)) {
        toast('已购买并装备到 ' + (i + 1) + '号机：' + d.name, 'win');
        return true;
      }
      return false;
    }
    toast('没有可挂载的飞机，请先购买并编入 1 号机', 'loss');
    return false;
  }

  function buyPlaneToFirstSlot(g) {
    var b = ensure(g);
    if (!b) return false;
    for (var i = 0; i < b.formation.length; i++) {
      if (!b.formation[i]) return buyPlaneToSlot(g, i);
    }
    toast('编组栏已满', 'loss');
    return false;
  }

  function buyPlaneToSlot(g, slot) {
    var b = ensure(g);
    if (b.state !== 'base') { toast('轰炸机不在基地，无法购买', 'loss'); return false; }
    if (slot < 0 || slot >= b.formation.length || b.formation[slot]) { toast('该编组位置不可用', 'loss'); return false; }
    markBomberUnpaid(g);
    var p = newPlane(g, 'B-17 ' + (allPlanes(g).length + 1) + '号机');
    p.slot = slot;
    b.formation[slot] = p;
    toast('已预购 B-17 并编入 ' + (slot + 1) + ' 号位，出击时结算', 'win');
    renderConfig(g); refresh(g);
    return true;
  }

  function refundHangarBomb(g, id) {
    var b = ensure(g);
    if (!b || b.state !== 'base') { toast('轰炸机不在基地，无法退回', 'loss'); return false; }
    for (var i = 0; i < b.hangarBombs.length; i++) {
      if (b.hangarBombs[i].id === id) {
        var bg = b.hangarBombs.splice(i, 1)[0];
        markBomberUnpaid(g);
        toast('已退回 ' + (B.bombs[bg.type] ? B.bombs[bg.type].name : '航弹') + '，出击时按当前编队结算', 'win');
        renderConfig(g); refresh(g);
        return true;
      }
    }
    return false;
  }

  function equippedBombUnitValue(type) {
    var d = B.bombs[type];
    return d && d.group ? Math.round(B.bombGroupCost / d.group) : 0;
  }

  function sellEquippedBomb(g, planeId, index) {
    var b = ensure(g);
    if (!b || b.state !== 'base') return false;
    var p = null;
    for (var i = 0; i < b.formation.length; i++) if (b.formation[i] && b.formation[i].id === planeId) p = b.formation[i];
    if (!p || index < 0 || index >= p.bombGroups.length) return false;
    var grp = p.bombGroups[index];
    var value = grp.paid || B.bombGroupCost;
    p.bombGroups.splice(index, 1);
    rebuildBombs(p);
    snapshotLoadout(p);
    markBomberUnpaid(g);
    toast('已移除 ' + (B.bombs[grp.type] ? B.bombs[grp.type].short : '航弹') + ' ×' + grp.count + '，出击时按当前编队结算', 'win');
    renderConfig(g); refresh(g);
    return true;
  }

  function moveEquippedBombToHangar(g, planeId, index) {
    var b = ensure(g);
    if (!b || b.state !== 'base') return false;
    var p = null;
    for (var i = 0; i < b.formation.length; i++) if (b.formation[i] && b.formation[i].id === planeId) p = b.formation[i];
    if (!p || index < 0 || index >= p.bombGroups.length) return false;
    var grp = p.bombGroups.splice(index, 1)[0];
    b.hangarBombs.push({ id: 'bomb_' + (++b.bombSeq || (b.bombSeq = 1)), type: grp.type, count: grp.count, paid: grp.paid || B.bombGroupCost });
    rebuildBombs(p);
    snapshotLoadout(p);
    toast('航弹组已放回机库', 'order');
    renderConfig(g); refresh(g);
    return true;
  }

  function reorderEquippedBomb(g, planeId, from, to) {
    var b = ensure(g);
    if (!b || b.state !== 'base') return false;
    var p = null;
    for (var i = 0; i < b.formation.length; i++) if (b.formation[i] && b.formation[i].id === planeId) p = b.formation[i];
    if (!p || from < 0 || from >= p.bombGroups.length) return false;
    var grp = p.bombGroups.splice(from, 1)[0];
    if (to < 0 || to > p.bombGroups.length) to = p.bombGroups.length;
    p.bombGroups.splice(to, 0, grp);
    rebuildBombs(p);
    snapshotLoadout(p);
    renderConfig(g); refresh(g);
    return true;
  }

  function addBombGroupToPlane(g, plane, type) {
    var d = B.bombs[type];
    if (!d) return false;
    var idx = -1;
    for (var i = 0; i < g.bombers.hangarBombs.length; i++) {
      if (g.bombers.hangarBombs[i].type === type) { idx = i; break; }
    }
    if (idx < 0) return false;
    var group = g.bombers.hangarBombs[idx];
    var addWeight = group.count * bombWeight(type);
    if (loadWeight(plane) + addWeight > B.maxLoadLb) {
      toast('挂载超重：该机最多 ' + B.maxLoadLb + 'lb 航弹', 'loss');
      return false;
    }
    plane.bombGroups.push({ type: type, count: group.count, paid: group.paid || B.bombGroupCost });
    rebuildBombs(plane);
    snapshotLoadout(plane);
    g.bombers.hangarBombs.splice(idx, 1);
    return true;
  }

  function movePlaneToSlot(g, planeId, slot) {
    var b = ensure(g);
    var found = planeInFormationOrHangar(g, planeId);
    if (!found || b.formation[slot]) return false;
    if (found.inFormation) b.formation[found.slot] = null;
    else b.hangarPlanes.splice(b.hangarPlanes.indexOf(found.plane), 1);
    found.plane.slot = slot;
    b.formation[slot] = found.plane;
    return true;
  }

  function renderConfig(g) {
    if (!refs || !refs.config) return;
    var b = ensure(g);
    if (!b) return;
    if (refs.configScore) refs.configScore.textContent = '可用分数 ' + Math.floor((g.teams && g.teams.blue && g.teams.blue.score) || 0);
    if (refs.autoRestock) refs.autoRestock.checked = restockEnabled();
    if (refs.slots) {
      var html = '';
      for (var i = 0; i < b.formation.length; i++) {
        var p = b.formation[i];
        html += '<div class="bomber-slot" data-slot="' + i + '">' +
          '<div class="bomber-slot-no">' + (i + 1) + '</div>';
        if (p) {
          html += '<div class="bomber-slot-plane">' + ICON_PLANE +
            '<div><b>' + p.name + '</b><span class="bomber-plan-badge">预设</span><small>耐久 ' + Math.ceil(p.hp) + ' / ' + p.maxHp + ' · 挂载 ' + loadWeight(p) + '/6000lb</small>' +
            '<div class="bomber-hardpoints">' + (p.bombGroups.length ? p.bombGroups.map(function (g, bi) { return bombIconHTML(g.type, p.id, bi, g.count); }).join('') : '<i class="air-none">拖动航弹到此处</i>') + '</div>' +
            '<small class="drop-order">挂载卡片槽 · 投弹从左到右</small></div></div>';
        } else {
          html += '<div class="bomber-slot-empty">拖动飞机到此编组</div>';
        }
        html += '</div>';
      }
      refs.slots.innerHTML = html;
    }
    if (refs.hangar) {
      var h = '';
      for (var pi = 0; pi < b.hangarPlanes.length; pi++) {
        var pl = b.hangarPlanes[pi];
        h += '<div class="bomber-hangar-card plane" draggable="true" data-drag-kind="plane" data-drag-id="' + pl.id + '">' +
          ICON_PLANE + '<b>' + pl.name + '</b><small>耐久 ' + pl.maxHp + ' · 未编组</small></div>';
      }
      for (var bi = 0; bi < b.hangarBombs.length; bi++) {
        var bg = b.hangarBombs[bi];
        var bd = B.bombs[bg.type];
        h += '<div class="bomber-hangar-card bomb" draggable="true" data-drag-kind="bomb" data-drag-id="' + bg.id + '" data-bomb-type="' + bg.type + '">' +
          ICON_BOMB + '<b>' + bd.name + '</b><small>' + bg.count + ' 枚一组 · 500 分数</small></div>';
      }
      refs.hangar.innerHTML = h || '<div class="air-none">机库为空，先在左侧购买飞机或航弹</div>';
    }
  }

  var configWasPaused = false;
  function openConfig(g) {
    var b = ensure(g);
    if (b.state !== 'base') { toast('轰炸机不在基地，无法打开配备', 'loss'); return; }
    if (!refs || !refs.config) return;
    if (window.__STEEL && window.__STEEL.isPaused && window.__STEEL.pause) {
      configWasPaused = !!window.__STEEL.isPaused();
      window.__STEEL.pause(true);
    }
    renderConfig(g);
    refs.config.classList.remove('hidden');
  }

  function closeConfig() {
    if (refs && refs.config) refs.config.classList.add('hidden');
    if (window.__STEEL && window.__STEEL.pause && !configWasPaused) window.__STEEL.pause(false);
    configWasPaused = false;
  }

  function isConfigOpen() {
    return !!(refs && refs.config && !refs.config.classList.contains('hidden'));
  }

  /* ---------------- 面板刷新 ---------------- */

  function refresh(g) {
    if (!g) return;
    var b = ensure(g);
    if (!refs || !refs.dock) return;
    refs.dock.classList.remove('hidden');
    var st = statusText(g);
    if (refs.state) refs.state.textContent = st.text;
    if (refs.stateSub) refs.stateSub.textContent = st.sub;
    if (refs.roster) {
      var ps = b.formation.filter(function (p) { return !!p; });
      refs.roster.innerHTML = ps.length ? ps.map(function (p) { return planeHTML(p); }).join('') : '<div class="air-none">编队为空 · 点击配备卡组建编队</div>';
    }
    var base = b.state === 'base';
    var over = b.state === 'over';
    if (refs.cardConfig) refs.cardConfig.classList.toggle('disabled', !base);
    if (refs.configSub) refs.configSub.textContent = base ? '机库 / 编队' : '返航后可配备';
    if (refs.cardTakeoff) {
      refs.cardTakeoff.classList.toggle('disabled', !(base || b.state === 'takeoff'));
      var takeoffSub = b.state === 'takeoff' ? '飞往战场 ' + clock(b.arriveAt - g.time) : (over ? '返航倒计时 ' + clock(b.fuel) : (b.state === 'returning' || b.state === 'toBase' ? '返航中' : '点击起飞'));
      if (refs.takeoffSub) refs.takeoffSub.textContent = takeoffSub;
    }
    if (refs.cardDrop) {
      refs.cardDrop.classList.toggle('disabled', !over);
      refs.cardDrop.classList.toggle('bombing', !!b.bombing);
      if (refs.dropSub) refs.dropSub.textContent = b.bombing ? '投弹中 · 点击停止' : (over ? '点击开始投弹' : '尚未抵达战场');
    }
    if (refs.cardReturn) {
      refs.cardReturn.classList.toggle('disabled', !(over || (b.state === 'returning' && !b.leftMap && !b.forcedReturn)));
      if (refs.returnSub) refs.returnSub.textContent = b.state === 'returning' ? (b.leftMap ? '已离开战场' : (b.forcedReturn ? '燃料耗尽，强制返航' : '点击取消返航')) : (over ? '开始返航' : (b.state === 'toBase' ? '返回基地 ' + clock(b.baseAt - g.time) : '待命'));
    }
    if (refs.modeText) refs.modeText.textContent = b.bombMode === 'single' ? '单机投弹' : '编队投弹';
    if (refs.modeRange) refs.modeRange.value = b.bombMode === 'single' ? '0' : '1';
    if (!g.naval) b.tab = 'bomber';
    if (refs.dock) {
      var activeTab = b.tab || 'ship';
      var tabs = refs.dock.querySelectorAll('.system-tab');
      for (var i = 0; i < tabs.length; i++) tabs[i].classList.toggle('active', tabs[i].getAttribute('data-system') === activeTab);
    }
    if (refs.air) refs.air.classList.toggle('hidden', (b.tab || 'ship') !== 'bomber');
    if (refs.shipSystem) refs.shipSystem.classList.toggle('hidden', (b.tab || 'ship') === 'bomber');
    if (refs.navyCards) refs.navyCards.style.display = (b.tab || 'ship') === 'bomber' ? 'none' : '';
  }

  function setTab(g, tab) {
    var b = ensure(g);
    if (!g.naval) tab = 'bomber';
    b.tab = tab;
    // 切换到舰艇/轰炸机系统时，自动选中对应单位
    if (tab === 'ship' && !g.selectedShip && g.shipOf) {
      var ship = g.shipOf('blue');
      if (ship && g.setSelectedShip) g.setSelectedShip(ship);
    } else if (tab === 'bomber' && !g.selectedBomber && b.state === 'over') {
      selectGroup(g);
    }
    refresh(g);
  }

  /* ---------------- 绘制 ---------------- */

  function drawPlane(ctx, p, sx, sy, cam, selected) {
    var zoom = cam.zoom;
    var img = b17Images[p.side] || b17Images.blue;
    if (img && img.complete && img.naturalWidth) {
      var span = 110 * zoom;
      var len = span * 0.716;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate((p.heading || 0) + Math.PI / 2);
      ctx.drawImage(img, -span / 2, -len / 2, span, len);
      if (selected && b17SelectedImage && b17SelectedImage.complete) {
        ctx.drawImage(b17SelectedImage, -span / 2, -len / 2, span, len);
      }
      ctx.restore();
      return;
    }
    var len = 52 * zoom, wing = 34 * zoom;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(p.heading || 0);
    var bank = p.bank || 0;
    ctx.transform(1, 0, bank * 0.16, 1, 0, 0);
    ctx.strokeStyle = 'rgba(238,224,185,0.95)';
    ctx.fillStyle = 'rgba(52,61,50,0.92)';
    ctx.lineWidth = Math.max(1, 1.2 * zoom);
    // 机翼
    ctx.beginPath();
    ctx.moveTo(len * 0.05, 0);
    ctx.lineTo(-len * 0.12, -wing);
    ctx.lineTo(-len * 0.28, -wing);
    ctx.lineTo(-len * 0.25, 0);
    ctx.lineTo(-len * 0.28, wing);
    ctx.lineTo(-len * 0.12, wing);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    // 机身
    ctx.beginPath();
    ctx.ellipse(0, 0, len * 0.5, wing * 0.22, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    // 四台发动机
    for (var i = -1; i <= 1; i += 2) {
      for (var j = 0; j < 2; j++) {
        var ex = len * (0.02 - j * 0.16), ey = i * wing * (0.35 + j * 0.24);
        ctx.beginPath();
        ctx.ellipse(ex, ey, len * 0.075, wing * 0.075, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(38,45,38,0.95)';
        ctx.fill(); ctx.strokeStyle = 'rgba(220,204,166,0.9)'; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ex + len * 0.075, ey); ctx.lineTo(ex + len * 0.13, ey); ctx.stroke();
      }
    }
    // 尾翼
    ctx.beginPath();
    ctx.moveTo(-len * 0.42, 0);
    ctx.lineTo(-len * 0.55, -wing * 0.36);
    ctx.lineTo(-len * 0.55, wing * 0.36);
    ctx.closePath();
    ctx.fillStyle = 'rgba(52,61,50,0.92)';
    ctx.fill(); ctx.stroke();
    // 座舱与机背线
    ctx.strokeStyle = 'rgba(238,224,185,0.65)';
    ctx.beginPath(); ctx.moveTo(len * 0.32, 0); ctx.lineTo(-len * 0.4, 0); ctx.stroke();
    ctx.beginPath(); ctx.arc(len * 0.27, 0, wing * 0.08, 0, Math.PI * 2); ctx.stroke();
    // 螺旋桨
    ctx.strokeStyle = 'rgba(210,198,164,0.55)';
    for (var k = -1; k <= 1; k += 2) {
      for (var m = 0; m < 2; m++) {
        var px = len * (0.02 - m * 0.16), py = k * wing * (0.35 + m * 0.24);
        ctx.beginPath(); ctx.moveTo(px + len * 0.13, py - wing * 0.12); ctx.lineTo(px + len * 0.13, py + wing * 0.12); ctx.stroke();
      }
    }
    ctx.restore();
  }

  function addBurnScars(g, x, y, radius) {
    if (!g.burnScars) g.burnScars = [];
    g.burnScars.push({ x: x, y: y, r: Math.max(42, radius), seed: Math.random() * 1000 });
    var T = SL.Terrain;
    if (T && T.forests) {
      for (var i = 0; i < T.forests.length; i++) {
        var f = T.forests[i];
        if (U.dist(x, y, f.x, f.y) <= radius + f.r * 0.82) {
          g.burnScars.push({ x: f.x, y: f.y, r: f.r * 0.95, seed: Math.random() * 1000 });
        }
      }
    }
    if (g.zones) {
      for (var z = 0; z < g.zones.length; z++) {
        var zn = g.zones[z];
        if ((zn.kind === 'bush' || zn.kind === 'forest') && U.dist(x, y, zn.x, zn.y) <= radius + zn.r * 0.9) {
          g.burnScars.push({ x: zn.x, y: zn.y, r: zn.r, seed: Math.random() * 1000 });
        }
      }
    }
  }

  function drawBurnScars(ctx, g, proj, cam) {
    if (!g.burnScars || !g.burnScars.length) return;
    for (var i = 0; i < g.burnScars.length; i++) {
      var s = g.burnScars[i];
      var sx = proj.x(s.x), sy = proj.y(s.y), r = s.r * cam.zoom;
      if (r < 2) continue;
      ctx.save();
      var grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
      grad.addColorStop(0, 'rgba(38,36,31,0.64)');
      grad.addColorStop(0.65, 'rgba(52,48,40,0.48)');
      grad.addColorStop(1, 'rgba(60,56,47,0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
      // 焦黑碎块
      for (var k = 0; k < 18; k++) {
        var a = (s.seed + k * 2.399) % (Math.PI * 2);
        var rr = r * (0.12 + ((k * 37) % 70) / 100);
        ctx.fillStyle = k % 3 ? 'rgba(26,25,22,0.55)' : 'rgba(87,72,52,0.42)';
        ctx.beginPath();
        ctx.arc(sx + Math.cos(a) * rr, sy + Math.sin(a) * rr, Math.max(0.8, r * 0.035), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawWorld(ctx, g, proj, cam) {
    if (!g || !g.bombers) return;
    drawBurnScars(ctx, g, proj, cam);
    var b = g.bombers;
    for (var i = 0; i < g.bomberDrops.length; i++) {
      var d = g.bomberDrops[i];
      var sx = proj.x(d.x1), sy = proj.y(d.y1);
      var z = cam.zoom;
      var left = Math.max(0, d.impactAt - g.time);
      ctx.save();
      ctx.translate(sx, sy);
      // 显示该枚航弹实际落点的爆炸范围，不显示散布椭圆
      var blastR = Math.max(4, d.radius * z);
      var isAutoBomb = String(d.id).indexOf('auto_bd_') === 0;
      if (!isAutoBomb) {
        ctx.beginPath();
        ctx.arc(0, 0, blastR, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(218,145,74,0.10)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(244,205,133,0.86)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      if (String(d.id).indexOf('auto_bd_') !== 0) {
        ctx.fillStyle = 'rgba(40,26,14,0.82)';
        ctx.font = '700 10px ' + SL.FONT_UI;
        ctx.textAlign = 'center';
        ctx.fillText((B.bombs[d.type] ? B.bombs[d.type].short : '航弹') + ' · ' + left.toFixed(1) + 's', 0, -blastR - 8);
      }
      ctx.restore();
    }
    for (var f = 0; f < g.bomberFires.length; f++) {
      var fire = g.bomberFires[f];
      var fx = proj.x(fire.x), fy = proj.y(fire.y);
      ctx.save();
      ctx.beginPath(); ctx.arc(fx, fy, fire.r * cam.zoom, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(210,93,38,0.16)'; ctx.fill();
      ctx.strokeStyle = 'rgba(231,139,68,0.65)'; ctx.lineWidth = 1.2; ctx.stroke();
      for (var fl = 0; fl < 3; fl++) {
        var aa = g.time * 2 + fl * 2.1;
        ctx.beginPath(); ctx.arc(fx + Math.cos(aa) * fire.r * 0.4 * cam.zoom, fy + Math.sin(aa) * fire.r * 0.4 * cam.zoom, 3.5 * cam.zoom, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,170,80,0.7)'; ctx.fill();
      }
      ctx.restore();
    }
  }

  /* ---------------- 初始化 ---------------- */

  function bindDrag() {
    document.addEventListener('dragstart', function (ev) {
      var card = ev.target && ev.target.closest ? ev.target.closest('[data-drag-kind]') : null;
      if (!card) return;
      dragging = { kind: card.getAttribute('data-drag-kind'), id: card.getAttribute('data-drag-id'), type: card.getAttribute('data-bomb-type'), planeId: card.getAttribute('data-plane-id'), index: card.getAttribute('data-bomb-index') };
      try { ev.dataTransfer.setData('text/plain', JSON.stringify(dragging)); ev.dataTransfer.effectAllowed = 'move'; } catch (e) {}
    });
    document.addEventListener('dragend', function () { dragging = null; });
    document.addEventListener('dragover', function (ev) {
      var slot = ev.target && ev.target.closest ? ev.target.closest('.bomber-slot') : null;
      var shop = ev.target && ev.target.closest ? ev.target.closest('.bomber-buy') : null;
      var hangar = ev.target && ev.target.closest ? ev.target.closest('#bomber-hangar, .bomber-pane.hangar') : null;
      var hard = ev.target && ev.target.closest ? ev.target.closest('.bomber-hardpoints, .air-bomb[data-drag-kind="equippedbomb"]') : null;
      if (!slot && !shop && !hangar && !hard) return;
      ev.preventDefault();
      if (ev.dataTransfer) ev.dataTransfer.dropEffect = 'move';
    });
    document.addEventListener('drop', function (ev) {
      var g = SL.UI && SL.UI.currentGame ? SL.UI.currentGame() : null;
      if (!g) return;
      var payload = dragging;
      if (!payload) {
        try { payload = JSON.parse(ev.dataTransfer.getData('text/plain')); } catch (e) {}
      }
      if (!payload) return;
      var b = ensure(g);
      var shop = ev.target && ev.target.closest ? ev.target.closest('.bomber-buy') : null;
      if (shop && payload.kind === 'bomb') {
        ev.preventDefault();
        refundHangarBomb(g, payload.id);
        dragging = null;
        return;
      }
      if (shop && payload.kind === 'equippedbomb') {
        ev.preventDefault();
        sellEquippedBomb(g, payload.planeId, parseInt(payload.index, 10));
        dragging = null;
        return;
      }
      var hangar = ev.target && ev.target.closest ? ev.target.closest('#bomber-hangar, .bomber-pane.hangar') : null;
      if (hangar && payload.kind === 'equippedbomb') {
        ev.preventDefault();
        moveEquippedBombToHangar(g, payload.planeId, parseInt(payload.index, 10));
        dragging = null;
        return;
      }
      var hard = ev.target && ev.target.closest ? ev.target.closest('.bomber-hardpoints, .air-bomb[data-drag-kind="equippedbomb"]') : null;
      if (hard && payload.kind === 'equippedbomb') {
        ev.preventDefault();
        var icon = hard.closest ? hard.closest('.air-bomb[data-drag-kind="equippedbomb"]') : null;
        if (icon && icon.getAttribute('data-plane-id') !== payload.planeId) { toast('只能在本机挂载内调整顺序', 'loss'); dragging = null; return; }
        var targetIndex = icon ? parseInt(icon.getAttribute('data-bomb-index'), 10) : 999;
        reorderEquippedBomb(g, payload.planeId, parseInt(payload.index, 10), targetIndex);
        dragging = null;
        return;
      }
      var slot = ev.target && ev.target.closest ? ev.target.closest('.bomber-slot') : null;
      if (!slot) return;
      ev.preventDefault();
      var slotIndex = parseInt(slot.getAttribute('data-slot'), 10);
      if (payload.kind === 'plane') {
        if (movePlaneToSlot(g, payload.id, slotIndex)) { renderConfig(g); refresh(g); }
      } else if (payload.kind === 'bomb') {
        var p = b.formation[slotIndex];
        if (!p) { toast('请先把飞机拖入该编组槽', 'loss'); return; }
        if (addBombGroupToPlane(g, p, payload.type)) {
          renderConfig(g); refresh(g); toast('航弹已挂载到 ' + p.name, 'order');
        }
      } else if (payload.kind === 'shopbomb') {
        var sp = b.formation[slotIndex];
        if (!sp) { toast('请先把飞机拖入该编组槽', 'loss'); return; }
        buyBombToPlane(g, sp, payload.type);
      } else if (payload.kind === 'shopplane') {
        if (buyPlaneToSlot(g, slotIndex)) { renderConfig(g); refresh(g); }
      }
      dragging = null;
    });
  }

  function init() {
    refs = {
      dock: $('system-dock'),
      tabs: document.querySelectorAll('.system-tab'),
      air: $('air-system'),
      state: $('air-state'),
      stateSub: $('air-state-sub'),
      roster: $('air-roster'),
      cardConfig: $('air-card-config'),
      configSub: $('air-card-config-sub'),
      cardTakeoff: $('air-card-takeoff'),
      takeoffSub: $('air-card-takeoff-sub'),
      cardDrop: $('air-card-drop'),
      dropSub: $('air-card-drop-sub'),
      cardReturn: $('air-card-return'),
      returnSub: $('air-card-return-sub'),
      modeRange: $('air-drop-mode'),
      modeText: $('air-drop-mode-text'),
      navyCards: $('navy-cards'),
    shipSystem: $('ship-system'),
      config: $('bomber-config'),
      configScore: $('bomber-config-score'),
      slots: $('bomber-slots'),
      hangar: $('bomber-hangar')
    };
    if (!refs.dock) return;
    b17Images.blue = new Image(); b17Images.blue.src = 'assets/b17-dxf-blue.png';
    b17Images.red = new Image(); b17Images.red.src = 'assets/b17-dxf-red.png';
    b17Images.green = new Image(); b17Images.green.src = 'assets/b17-dxf-green.png';
    b17SelectedImage = new Image(); b17SelectedImage.src = 'assets/b17-dxf-selected.png';
    b17Images.blue.onload = function () { refresh(SL.UI && SL.UI.currentGame ? SL.UI.currentGame() : null); };
    document.addEventListener('contextmenu', function (ev) {
      var bombBtn = ev.target && ev.target.closest ? ev.target.closest('[data-buy-bomb]') : null;
      if (bombBtn) {
        ev.preventDefault();
        var gb = SL.UI.currentGame && SL.UI.currentGame();
        if (gb) buyBombToFirstPlane(gb, bombBtn.getAttribute('data-buy-bomb'));
        return;
      }
      var planeBtn = ev.target && ev.target.closest ? ev.target.closest('[data-buy-plane]') : null;
      if (planeBtn) {
        ev.preventDefault();
        var gp = SL.UI.currentGame && SL.UI.currentGame();
        if (gp) buyPlaneToFirstSlot(gp);
        return;
      }
    });
    document.addEventListener('click', function (ev) {
      if (ev.target && ev.target.closest && ev.target.closest('.air-drop-mode-row')) return;
      var tab = ev.target && ev.target.closest ? ev.target.closest('.system-tab') : null;
      if (tab) {
        var g = SL.UI && SL.UI.currentGame ? SL.UI.currentGame() : null;
        if (g) setTab(g, tab.getAttribute('data-system'));
        return;
      }
      if (clickTarget(ev, 'air-card-config')) {
        var g0 = SL.UI.currentGame && SL.UI.currentGame();
        if (g0) openConfig(g0);
        return;
      }
      if (clickTarget(ev, 'air-card-takeoff')) {
        var g1 = SL.UI.currentGame && SL.UI.currentGame();
        if (!g1) return;
        var b1 = ensure(g1);
        if (b1.state === 'takeoff') cancelTakeoffToBase(g1);
        else if (b1.state === 'base') startTakeoff(g1);
        refresh(g1);
        return;
      }
      if (clickTarget(ev, 'air-card-drop')) {
        var g2 = SL.UI.currentGame && SL.UI.currentGame();
        if (g2) startBombing(g2);
        return;
      }
      if (clickTarget(ev, 'air-card-return')) {
        var g3 = SL.UI.currentGame && SL.UI.currentGame();
        if (!g3) return;
        var b3 = ensure(g3);
        if (b3.state === 'returning' && !b3.leftMap) cancelReturn(g3);
        else if (b3.state === 'over') beginReturn(g3);
        return;
      }
      if (clickTarget(ev, 'bomber-config-close')) { closeConfig(); return; }
      var buyPlaneBtn = ev.target.closest ? ev.target.closest('[data-buy-plane]') : null;
      if (buyPlaneBtn) { var gp = SL.UI.currentGame && SL.UI.currentGame(); if (gp) buyPlane(gp); return; }
      var buyBombBtn = ev.target.closest ? ev.target.closest('[data-buy-bomb]') : null;
      if (buyBombBtn) { var gb = SL.UI.currentGame && SL.UI.currentGame(); if (gb) buyBomb(gb, buyBombBtn.getAttribute('data-buy-bomb')); return; }
    });
    if (refs.modeRange) {
      refs.modeRange.addEventListener('input', function () {
        var g = SL.UI.currentGame && SL.UI.currentGame();
        if (!g) return;
        ensure(g).bombMode = refs.modeRange.value === '0' ? 'single' : 'formation';
        refresh(g);
      });
    }
    if (refs.config) {
      refs.config.addEventListener('click', function (ev) {
        if (ev.target === refs.config) closeConfig();
      });
    }
    if (refs.autoRestock) refs.autoRestock.addEventListener('change', function () {
      setRestock(refs.autoRestock.checked);
    });
    bindDrag();
    // 初次隐藏，等 UI.update 在游戏中显示
    refs.dock.classList.add('hidden');
  }

  SL.Bomber = {
    config: B,
    ensure: ensure,
    init: init,
    update: update,
    drawWorld: drawWorld,
    drawPlane: drawPlane,
    onPlaneDown: onPlaneDown,
    commandMove: commandMove,
    getImage: function () { return b17Images.blue; },
    planeAt: planeAt,
    selectGroup: selectGroup,
    clearSelection: clearSelection,
    refresh: refresh,
    setTab: setTab,
    openConfig: openConfig,
    closeConfig: closeConfig,
    isConfigOpen: isConfigOpen
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
