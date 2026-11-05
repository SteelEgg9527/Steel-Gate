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
    maxPlanes: 3,
    maxBombsPerPlane: 20,
    maxLoadLb: 6000,
    b17: {
      name: 'B-17 空中堡垒',
      hp: 1500,
      speed: 88,
      turnRate: 0.18,
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
        damage: 500, radius: 100, fortDamage: 200, interval: 0.72, color: '#e0b46e'
      },
      lb1000: {
        key: 'lb1000', lb: 1000, name: '1000lb 航弹', short: '1000lb', group: 2,
        damage: 900, radius: 125, fortDamage: 340, interval: 1.05, color: '#dca45c'
      },
      lb2000: {
        key: 'lb2000', lb: 2000, name: '2000lb 航弹', short: '2000lb', group: 1,
        damage: 1550, radius: 150, fortDamage: 500, interval: 1.55, color: '#d18b4f'
      },
      incendiary: {
        key: 'incendiary', lb: 300, name: '300lb 燃烧弹', short: '300lb', group: 4,
        damage: 220, radius: 50, fortDamage: 100, interval: 0.5,
        burn: 60, burnDps: 45, color: '#e08a4b'
      }
    },
    bombOrder: ['lb500', 'lb1000', 'lb2000', 'incendiary']
  });

  var ICON_PLANE = '<img src="assets/b17-dxf-filled.png" alt="">';
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
  var b17Image = null;

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
      hp: B.b17.hp, maxHp: B.b17.hp,
      bombs: [], loadout: [], x: 0, y: 0, heading: 0, bank: 0, mgCd: 0, t: 0,
      jitter: Math.random() * Math.PI * 2,
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
        formation: [null, null, null],
        hangarPlanes: [],
        hangarBombs: [],
        groupX: 0, groupY: 0, heading: -Math.PI / 2, bank: 0,
        orbitX: 0, orbitY: 0, fuel: 0, userOrbit: false,
        bombing: false, bombMode: 'single', nextPlane: 0,
        planeSeq: 0, bombSeq: 0, dropSeq: 0,
        leftMap: false,
        lastState: '',
        tab: 'ship'
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
      { forward: -56, lateral: -66 },
      { forward: -56, lateral: 66 }
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

  function planeBombsText(p) {
    if (!p.bombs.length) return '无航弹';
    var counts = {};
    for (var i = 0; i < p.bombs.length; i++) counts[p.bombs[i]] = (counts[p.bombs[i]] || 0) + 1;
    var arr = [];
    for (var k in counts) arr.push((B.bombs[k] ? B.bombs[k].short : k) + '×' + counts[k]);
    return arr.join(' · ');
  }

  function bombIconHTML(type) {
    var d = B.bombs[type] || {};
    return '<span class="air-bomb" title="' + d.name + '">' + ICON_BOMB + '<i>' + (d.short || type) + '</i></span>';
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
      if (b.formation[ti]) b.formation[ti].loadout = b.formation[ti].bombs.slice();
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
      b.formation[i].bombs = (b.formation[i].loadout || b.formation[i].bombs).slice();
    }
    toast('B-17 编队返回基地，可以重新配备或起飞', 'win');
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
      for (var k = 0; k < 3; k++) {
        var pi = (idx + k) % 3;
        var p = b.formation[pi];
        if (p && p.bombs.length) { b.nextPlane = pi; break; }
      }
    }
    for (var i = 0; i < b.formation.length; i++) {
      var pl = b.formation[i];
      if (pl) pl._dropCd = Math.max(0.1, pl._dropCd || 0);
    }
    toast(b.bombMode === 'single' ? '单机投弹开始' : '编队同时投弹开始', 'order');
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
    var long = (Math.random() - 0.5) * 100;
    var lat = (Math.random() - 0.5) * 300;
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
    g.effects.push({ kind: 'explosion', x: x, y: y, t: 0, dur: 1.0, size: Math.round(50 + radius * 0.55), side: 'blue' });
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
    }
    g.fxText(x, y - 16, d.short + ' 命中', '#ffd18a');
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
          pl._dropCd = iv;
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
    b.bank = U.clamp(step / Math.max(0.001, max) * 0.85, -0.85, 0.85);
  }

  function updateMovement(g, b, dt) {
    if (b.state === 'over') {
      var dx = b.orbitX - b.groupX, dy = b.orbitY - b.groupY;
      var d = Math.hypot(dx, dy) || 1;
      var desired;
      if (d > B.b17.orbitRadius + 80) {
        desired = Math.atan2(dy, dx);
      } else {
        var ang = Math.atan2(b.groupY - b.orbitY, b.groupX - b.orbitX);
        desired = ang + Math.PI / 2;
        if (d < B.b17.orbitRadius - 90) desired = Math.atan2(dy, dx);
      }
      turnToward(b, desired, dt);
    } else if (b.state === 'returning') {
      var re = b.returnEdge || nearestEdge(b.groupX, b.groupY);
      turnToward(b, re.heading, dt);
    } else {
      return;
    }
    b.groupX += Math.cos(b.heading) * B.b17.speed * dt;
    b.groupY += Math.sin(b.heading) * B.b17.speed * dt;
    applyFormation(g);
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

  function buyPlane(g) {
    var b = ensure(g);
    if (b.state !== 'base') { toast('轰炸机不在基地，无法购买', 'loss'); return; }
    if ((g.teams.blue.score || 0) < B.planeCost) { toast('积分不足，需要 ' + B.planeCost, 'loss'); return; }
    g.teams.blue.score -= B.planeCost;
    var p = newPlane(g, 'B-17 ' + (allPlanes(g).length + 1) + '号机');
    b.hangarPlanes.push(p);
    toast('已购买 B-17，拖入编组栏即可编队', 'win');
    renderConfig(g);
    refresh(g);
  }

  function buyBomb(g, type) {
    var b = ensure(g);
    if (b.state !== 'base') { toast('轰炸机不在基地，无法购买', 'loss'); return; }
    var d = B.bombs[type];
    if (!d) return;
    if ((g.teams.blue.score || 0) < B.bombGroupCost) { toast('积分不足，需要 ' + B.bombGroupCost, 'loss'); return; }
    g.teams.blue.score -= B.bombGroupCost;
    b.hangarBombs.push({ id: 'bomb_' + (++b.bombSeq || (b.bombSeq = 1)), type: type, count: d.group });
    toast('已购买 ' + d.name + '（' + d.group + '枚）', 'win');
    renderConfig(g);
    refresh(g);
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
    for (var k = 0; k < group.count; k++) plane.bombs.push(type);
    plane.loadout = plane.bombs.slice();
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
    if (refs.configScore) refs.configScore.textContent = '可用积分 ' + Math.floor((g.teams && g.teams.blue && g.teams.blue.score) || 0);
    if (refs.slots) {
      var html = '';
      for (var i = 0; i < 3; i++) {
        var p = b.formation[i];
        html += '<div class="bomber-slot" data-slot="' + i + '">' +
          '<div class="bomber-slot-no">' + (i + 1) + '</div>';
        if (p) {
          html += '<div class="bomber-slot-plane">' + ICON_PLANE +
            '<div><b>' + p.name + '</b><small>耐久 ' + Math.ceil(p.hp) + ' / ' + p.maxHp + ' · 挂载 ' + loadWeight(p) + '/6000lb</small>' +
            '<div class="bomber-hardpoints">' + (p.bombs.length ? p.bombs.map(function (t) { return bombIconHTML(t); }).join('') : '<i class="air-none">拖动航弹到此处</i>') + '</div>' +
            '<small class="drop-order">投弹顺序：从左到右</small></div></div>';
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
          ICON_BOMB + '<b>' + bd.name + '</b><small>' + bg.count + ' 枚一组 · 500 分</small></div>';
      }
      refs.hangar.innerHTML = h || '<div class="air-none">机库为空，先在左侧购买飞机或航弹</div>';
    }
  }

  function openConfig(g) {
    var b = ensure(g);
    if (b.state !== 'base') { toast('轰炸机不在基地，无法打开配备', 'loss'); return; }
    if (!refs || !refs.config) return;
    renderConfig(g);
    refs.config.classList.remove('hidden');
  }

  function closeConfig() {
    if (refs && refs.config) refs.config.classList.add('hidden');
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
    b.tab = tab;
    refresh(g);
  }

  /* ---------------- 绘制 ---------------- */

  function drawPlane(ctx, p, sx, sy, cam) {
    var zoom = cam.zoom;
    if (b17Image && b17Image.complete && b17Image.naturalWidth) {
      var span = 110 * zoom;
      var len = span * 0.716;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate((p.heading || 0) + Math.PI / 2);
      ctx.drawImage(b17Image, -span / 2, -len / 2, span, len);
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

  function drawWorld(ctx, g, proj, cam) {
    if (!g || !g.bombers) return;
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
      ctx.beginPath();
      ctx.arc(0, 0, blastR, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(218,145,74,0.10)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(244,205,133,0.86)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = 'rgba(40,26,14,0.82)';
      ctx.font = '700 10px ' + SL.FONT_UI;
      ctx.textAlign = 'center';
      ctx.fillText((B.bombs[d.type] ? B.bombs[d.type].short : '航弹') + ' · ' + left.toFixed(1) + 's', 0, -blastR - 8);
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
      dragging = { kind: card.getAttribute('data-drag-kind'), id: card.getAttribute('data-drag-id'), type: card.getAttribute('data-bomb-type') };
      try { ev.dataTransfer.setData('text/plain', JSON.stringify(dragging)); ev.dataTransfer.effectAllowed = 'move'; } catch (e) {}
    });
    document.addEventListener('dragend', function () { dragging = null; });
    document.addEventListener('dragover', function (ev) {
      var slot = ev.target && ev.target.closest ? ev.target.closest('.bomber-slot') : null;
      if (!slot) return;
      ev.preventDefault();
      if (ev.dataTransfer) ev.dataTransfer.dropEffect = 'move';
    });
    document.addEventListener('drop', function (ev) {
      var slot = ev.target && ev.target.closest ? ev.target.closest('.bomber-slot') : null;
      if (!slot) return;
      ev.preventDefault();
      var g = SL.UI && SL.UI.currentGame ? SL.UI.currentGame() : null;
      if (!g) return;
      var payload = dragging;
      if (!payload) {
        try { payload = JSON.parse(ev.dataTransfer.getData('text/plain')); } catch (e) {}
      }
      if (!payload) return;
      var b = ensure(g);
      var slotIndex = parseInt(slot.getAttribute('data-slot'), 10);
      if (payload.kind === 'plane') {
        if (movePlaneToSlot(g, payload.id, slotIndex)) { renderConfig(g); refresh(g); }
      } else if (payload.kind === 'bomb') {
        var p = b.formation[slotIndex];
        if (!p) { toast('请先把飞机拖入该编组槽', 'loss'); return; }
        if (addBombGroupToPlane(g, p, payload.type)) {
          renderConfig(g); refresh(g); toast('航弹已挂载到 ' + p.name, 'order');
        }
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
    b17Image = new Image();
    b17Image.src = 'assets/b17-dxf-filled.png';
    b17Image.onload = function () { refresh(SL.UI && SL.UI.currentGame ? SL.UI.currentGame() : null); };
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
    getImage: function () { return b17Image; },
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
