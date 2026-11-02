/* 钢线 1944 —— 舰炮轰鸣：4km 海陆地图、海岸线与战略目标 */
(function () {
  'use strict';
  var SL = window.SL, U = SL.U, T = SL.Terrain;

  var NAVAL = (SL.Naval = {});

  /* ---------------- 地图数据 ---------------- */

  function shore(xs) {
    return xs.map(function (p) { return { x: p[0], y: p[1] }; });
  }

  NAVAL.maps = [
    {
      id: 'n1', name: '大西洋壁垒', subtitle: '竖向海陆 · 滩头争夺',
      seed: 19440606, naval: true, size: 5000, sceneSize: 5000,
      shore: shore([[2600, 0], [2520, 800], [2560, 1600], [2480, 2400], [2550, 3200], [2500, 4000], [2520, 5000]]),
      spawns: { blue: { x: 620, y: 3900 }, red: { x: 540, y: 900 }, green: { x: 900, y: 2400 } },
      forts: [
        { name: '滩头工事', x: 1500, y: 3100, r: 72 },
        { name: '沙丘炮位', x: 1100, y: 1900, r: 64 },
        { name: '海防哨所', x: 1950, y: 1200, r: 58 },
        { name: '内陆堡垒', x: 850, y: 3500, r: 66 }
      ]
    },
    {
      id: 'n2', name: '圣米歇尔湾', subtitle: '竖向海陆 · 海湾切入',
      seed: 19440720, naval: true, size: 5000, sceneSize: 5000,
      shore: shore([[2500, 0], [2450, 700], [2250, 1200], [1800, 1600], [1600, 2000], [1750, 2400], [2100, 2800], [2350, 3300], [2450, 4000], [2500, 5000]]),
      spawns: { blue: { x: 580, y: 3700 }, red: { x: 520, y: 1000 }, green: { x: 820, y: 2450 } },
      forts: [
        { name: '湾口阵地', x: 1050, y: 2450, r: 70 },
        { name: '灯塔高地', x: 1000, y: 1450, r: 62 },
        { name: '盐沼哨位', x: 1500, y: 3500, r: 58 },
        { name: '北岸炮台', x: 1750, y: 900, r: 60 }
      ]
    },
    {
      id: 'n3', name: '瑟堡大海湾', subtitle: '斜向海陆 · 巨型海湾',
      seed: 19440811, naval: true, size: 5000, sceneSize: 5000,
      shore: shore([[3300, 0], [3100, 600], [2800, 1100], [2400, 1550], [1950, 1950], [1500, 2350], [1100, 2750], [850, 3150], [720, 3550], [650, 4000], [480, 4500], [420, 5000]]),
      spawns: { blue: { x: 300, y: 4000 }, red: { x: 450, y: 1000 }, green: { x: 620, y: 2500 } },
      forts: [
        { name: '崖顶炮位', x: 720, y: 1800, r: 68 },
        { name: '铁路终点', x: 480, y: 2900, r: 60 },
        { name: '北岸哨所', x: 1050, y: 900, r: 56 },
        { name: '海湾炮台', x: 380, y: 3500, r: 64 }
      ]
    },
    {
      id: 'n4', name: '维尔湾', subtitle: '内陆高地 · 海湾登陆',
      seed: 19450118, naval: true, size: 5000, sceneSize: 5000,
      shore: shore([[3300, 0], [3250, 500], [3100, 900], [2850, 1300], [2500, 1700], [2200, 2100], [2050, 2500], [2000, 2900], [2100, 3300], [1950, 3700], [1800, 4200], [1750, 4700], [1900, 5000]]),
      spawns: { blue: { x: 525, y: 4750 }, red: { x: 300, y: 300 }, green: { x: 1950, y: 2050 } },
      layout: {
        hills: [
          { x: 750, y: 650, r: 600, h: 70, name: '维尔山' },
          { x: 500, y: 2200, r: 900, h: 55, name: '西部高地' },
          { x: 1000, y: 3800, r: 850, h: 60, name: '南部山脊' },
          { x: 1800, y: 1000, r: 550, h: 40, name: '北岸丘陵' },
          { x: 1900, y: 2800, r: 500, h: 35, name: '中央缓坡' }
        ],
        towers: [
          { x: 350, y: 2000, name: '通讯塔 A' },
          { x: 975, y: 3000, name: '通讯塔 B' },
          { x: 1875, y: 1950, name: '通讯塔 C' }
        ],
        radar: { x: 1200, y: 2050 },
        coastBases: [500, 1100, 1700, 2300, 2900, 3500, 4100, 4700],
        villages: [
          { name: '贝桑村', x: 1175, y: 1475, r: 86 },
          { name: '卡昂村', x: 1825, y: 1500, r: 84 },
          { name: '圣洛村', x: 2300, y: 1750, r: 82 },
          { name: '南湾村', x: 1000, y: 3800, r: 82 },
          { name: '西岭村', x: 500, y: 900, r: 80 },
          { name: '河谷村', x: 1600, y: 3000, r: 80 }
        ],
        forests: [
          { x: 1250, y: 800, r: 90 },
          { x: 250, y: 1300, r: 80 },
          { x: 775, y: 1850, r: 72 },
          { x: 2250, y: 1400, r: 80 },
          { x: 1375, y: 3250, r: 90 },
          { x: 175, y: 4150, r: 85 },
          { x: 1275, y: 4300, r: 80 },
          { x: 2300, y: 4200, r: 72 }
        ],
        forts: [
          { name: '维尔山', x: 750, y: 650, r: 100 },
          { name: '北岭工事', x: 1250, y: 350, r: 62 },
          { name: '东岸工事', x: 1950, y: 850, r: 62 },
          { name: '西林工事', x: 800, y: 1400, r: 62 },
          { name: '中部工事', x: 2000, y: 2250, r: 60 },
          { name: '西岸工事', x: 550, y: 2400, r: 62 },
          { name: '河谷工事', x: 1475, y: 2500, r: 62 },
          { name: '南岭工事', x: 550, y: 3250, r: 62 },
          { name: '南岸工事', x: 1450, y: 3400, r: 60 }
        ],
        roads: [
          [{ x: 2000, y: 0 }, { x: 1950, y: 600 }, { x: 1900, y: 1200 }, { x: 1750, y: 1800 }, { x: 1500, y: 2400 }, { x: 1200, y: 3000 }, { x: 1000, y: 3600 }, { x: 650, y: 4300 }, { x: 550, y: 5000 }],
          [{ x: 0, y: 500 }, { x: 700, y: 750 }, { x: 1250, y: 1000 }, { x: 1800, y: 1300 }, { x: 2200, y: 1600 }],
          [{ x: 0, y: 2500 }, { x: 700, y: 2400 }, { x: 1400, y: 2400 }, { x: 1900, y: 2600 }, { x: 2100, y: 3200 }]
        ]
      }
    },
    {
      id: 'n5', name: '双岸湾', subtitle: '中央海湾 · 两侧登陆',
      seed: 19450327, naval: true, size: 5000, sceneSize: 5000,
      shore: shore([[2150, 1400], [1750, 1700], [1300, 2350], [1000, 3100], [750, 3750], [700, 4250], [600, 5000]]),
      landPoly: [
        [0, 0], [5000, 0], [5000, 5000], [3800, 5000],
        [3950, 4500], [4050, 4100], [4150, 3500], [4100, 3000], [3900, 2400],
        [3500, 1900], [3100, 1400], [2150, 1400],
        [1750, 1700], [1300, 2350], [1000, 3100], [750, 3750], [700, 4250], [600, 5000],
        [0, 5000]
      ],
      waterPoly: [
        [2150, 1400], [1750, 1700], [1300, 2350], [1000, 3100], [750, 3750], [700, 4250], [600, 5000],
        [3800, 5000], [3950, 4500], [4050, 4100], [4150, 3500], [4100, 3000], [3900, 2400],
        [3500, 1900], [3100, 1400]
      ],
      spawns: { blue: { x: 250, y: 4800 }, red: { x: 2200, y: 300 }, green: { x: 4600, y: 4800 } },
      layout: {
        hills: [
          { x: 700, y: 1500, r: 800, h: 50, name: '西岸高地' },
          { x: 4300, y: 1200, r: 700, h: 45, name: '东岸丘陵' },
          { x: 2600, y: 400, r: 700, h: 40, name: '北岸山脊' },
          { x: 700, y: 4000, r: 700, h: 45, name: '南岸高地' },
          { x: 4600, y: 4000, r: 600, h: 40, name: '东南丘陵' }
        ],
        towers: [
          { x: 2675, y: 275, name: '通讯塔 A' },
          { x: 1425, y: 1700, name: '通讯塔 B' },
          { x: 3650, y: 1700, name: '通讯塔 C' }
        ],
        radar: { x: 2650, y: 1050 },
        coastBases: [
          { x: 2175, y: 1275 }, { x: 3075, y: 1250 },
          { x: 4125, y: 2225 }, { x: 800, y: 2725 },
          { x: 475, y: 4000 }, { x: 4050, y: 3200 },
          { x: 4050, y: 3725 }, { x: 4050, y: 4275 }
        ],
        villages: [
          { name: '北岸村', x: 1700, y: 375, r: 82 },
          { name: '东岸村', x: 1800, y: 1000, r: 82 },
          { name: '西岸村', x: 600, y: 1925, r: 82 }
        ],
        forests: [
          { x: 1125, y: 250, r: 82 }, { x: 1100, y: 1075, r: 80 },
          { x: 450, y: 1425, r: 76 }, { x: 225, y: 2375, r: 82 },
          { x: 400, y: 3150, r: 80 }, { x: 4700, y: 1900, r: 78 },
          { x: 4725, y: 3000, r: 76 }, { x: 4350, y: 4350, r: 80 },
          { x: 4750, y: 4650, r: 74 }
        ],
        forts: [
          { name: '西岸工事', x: 650, y: 800, r: 62 },
          { name: '北岸工事', x: 2325, y: 650, r: 60 },
          { name: '中央工事', x: 2950, y: 1000, r: 62 },
          { name: '东岸工事', x: 3100, y: 575, r: 60 },
          { name: '东北工事', x: 3400, y: 775, r: 60 },
          { name: '远东工事', x: 4250, y: 800, r: 60 },
          { name: '东岭工事', x: 4475, y: 1375, r: 60 }
        ],
        roads: [
          [{ x: 0, y: 500 }, { x: 700, y: 700 }, { x: 1200, y: 1200 }, { x: 1200, y: 2200 }, { x: 900, y: 3000 }, { x: 500, y: 4000 }, { x: 400, y: 5000 }],
          [{ x: 5000, y: 500 }, { x: 4300, y: 700 }, { x: 4100, y: 1500 }, { x: 3900, y: 2400 }, { x: 4000, y: 3400 }, { x: 4200, y: 4300 }, { x: 4500, y: 5000 }],
          [{ x: 0, y: 300 }, { x: 1000, y: 350 }, { x: 2000, y: 400 }, { x: 3000, y: 500 }, { x: 4000, y: 600 }, { x: 5000, y: 500 }]
        ]
      }
    },
    {
      id: 'naval_range', name: '海岸训练场', subtitle: '带海域 · 舰炮与两栖测试',
      seed: 19440901, test: true, naval: true, size: 5000, sceneSize: 5000,
      shore: shore([[2550, 0], [2500, 1000], [2480, 2000], [2520, 3000], [2500, 4000], [2550, 5000]]),
      spawns: { blue: { x: 800, y: 2500 }, red: { x: 180, y: 220 }, green: { x: 180, y: 4800 } },
      forts: [
        { name: '训练 · 海岸工事', x: 1500, y: 2500, r: 76 },
        { name: '训练 · 内陆阵地', x: 900, y: 1700, r: 70 }
      ]
    }
  ];

  for (var mi = 0; mi < NAVAL.maps.length; mi++) {
    var nm = NAVAL.maps[mi];
    SL.MAPS.push(nm);
    SL.MAP_BY_ID[nm.id] = nm;
  }

  /* ---------------- 海岸几何 ---------------- */

  function shoreSceneAt(y) {
    var m = T.navalMap;
    if (!m || !m.shore) return 5000;
    var pts = m.shore;
    if (y <= pts[0].y) return pts[0].x;
    for (var i = 0; i < pts.length - 1; i++) {
      if (y <= pts[i + 1].y) {
        var t = (y - pts[i].y) / Math.max(1, pts[i + 1].y - pts[i].y);
        return U.lerp(pts[i].x, pts[i + 1].x, t);
      }
    }
    return pts[pts.length - 1].x;
  }

  function sceneOffset() {
    return T.sceneOffset || { x: 0, y: 0 };
  }

  function shoreAt(y) {
    var off = sceneOffset();
    return shoreSceneAt(y + off.y) - off.x;
  }

  NAVAL.shoreAt = function (y) {
    if (!T.naval) return 2000;
    return shoreAt(y);
  };

  function pointInPoly(x, y, poly) {
    var inside = false;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      var xi = poly[i][0], yi = poly[i][1];
      var xj = poly[j][0], yj = poly[j][1];
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
    }
    return inside;
  }

  NAVAL.isWater = function (x, y) {
    if (!T.naval) return false;
    var off = sceneOffset();
    var sx = x + off.x, sy = y + off.y;
    if (sx < 0 || sy < 0 || sx > T.sceneSize || sy > T.sceneSize) return true;
    if (T.navalMap && T.navalMap.waterPoly) return pointInPoly(sx, sy, T.navalMap.waterPoly);
    return sx > shoreSceneAt(sy);
  };

  NAVAL.isLand = function (x, y) {
    return !NAVAL.isWater(x, y);
  };

  NAVAL.landPoint = function (margin) {
    margin = margin || 120;
    var size = T.size || 4000;
    for (var i = 0; i < 80; i++) {
      var y = margin + Math.random() * (size - margin * 2);
      var edge = shoreAt(y) - margin;
      if (edge <= margin * 1.5) continue;
      var x = margin + Math.random() * (edge - margin);
      if (NAVAL.isLand(x, y) && x < edge - 80) return { x: x, y: y };
    }
    return { x: size * 0.3, y: size * 0.5 };
  };

  NAVAL.nearestLandPoint = function (x, y) {
    if (NAVAL.isLand(x, y)) return { x: x, y: y };
    for (var r = 40; r <= 1600; r += 40) {
      for (var a = 0; a < 16; a++) {
        var ang = a / 16 * Math.PI * 2;
        var nx = U.clamp(x + Math.cos(ang) * r, 40, T.size - 40);
        var ny = U.clamp(y + Math.sin(ang) * r, 40, T.size - 40);
        if (NAVAL.isLand(nx, ny)) return { x: nx, y: ny };
      }
    }
    return { x: T.size * 0.25, y: T.size * 0.5 };
  };

  NAVAL.randomLandPoint = function (margin) {
    return NAVAL.landPoint(margin);
  };

  /* ---------------- 地形适配层 ---------------- */

  var Base = {
    setMap: T.setMap,
    build: T.build,
    buildZone: T.buildZone,
    addZone: T.addZone,
    heightAt: T.heightAt,
    slopeAt: T.slopeAt,
    forestAt: T.forestAt,
    speedAt: T.speedAt,
    streamDistance: T.streamDistance,
    roadDistance: T.roadDistance,
    drawGround: T.drawGround,
    drawZones: T.drawZones,
    drawLabels: T.drawLabels,
    thumbnail: T.thumbnail,
    rebakeLayers: T.rebakeLayers
  };
  T._base = Base;

  function resetZone(z) {
    z.owner = null;
    z.cap = 0;
    z.capSide = null;
    z.flash = 0;
    z.fortified = false;
    z.fortifyProgress = 0;
    z.structure = null;
    z.structures = [];
    z.rubbles = [];
    z.rubble = null;
    z.rubbleProgress = 0;
    if (z.site) {
      z.hp = z.maxHp = z.siteHp || 2000;
      z.destroyed = false;
    } else {
      z.hp = 0;
      z.maxHp = SL.FORT.maxHp;
    }
  }

  function makeSite(kind, x, y, name, id, towerIndex) {
    return {
      id: id, name: name, kind: kind, x: x, y: y,
      r: kind === 'radar' ? 66 : (kind === 'coastbase' ? 74 : 58),
      owner: null, cap: 0, capSide: null,
      site: true, siteHp: 2000, siteKind: kind, towerIndex: towerIndex,
      hp: 2000, maxHp: 2000, destroyed: false,
      fortified: false, fortifyProgress: 0, structure: null, structures: [],
      rubbles: [], rubble: null, rubbleProgress: 0
    };
  }

  function buildSites(m) {
    // 三座通讯塔围绕陆地核心构成紧凑三角，雷达位于三角中心
    var size = T.size || 4000;
    var cy = size * (0.46 + Math.random() * 0.08);
    var edge = Math.min(shoreAt(cy - 520), shoreAt(cy), shoreAt(cy + 520));
    var cx = Math.max(430, Math.min(edge * 0.48, 980));
    var rad = U.clamp(edge * 0.30, 420, 460);
    var angles = [-Math.PI / 2, Math.PI / 6, Math.PI * 5 / 6];
    var names = ['通讯塔 A', '通讯塔 B', '通讯塔 C'];
    var towers = [];
    for (var ti = 0; ti < 3; ti++) {
      var a = angles[ti] + (Math.random() - 0.5) * 0.16;
      var tx = cx + Math.cos(a) * rad * (0.88 + Math.random() * 0.16);
      var ty = cy + Math.sin(a) * rad * (0.88 + Math.random() * 0.16);
      ty = U.clamp(ty, 300, size - 300);
      tx = U.clamp(tx, 300, shoreAt(ty) - 210);
      towers.push(makeSite('comm', tx, ty, names[ti], m.id + '_comm' + ti, ti));
    }
    var radar = makeSite('radar',
      (towers[0].x + towers[1].x + towers[2].x) / 3,
      (towers[0].y + towers[1].y + towers[2].y) / 3,
      '雷达站', m.id + '_radar', -1);
    // 雷达也保持在陆地上
    if (radar.x > shoreAt(radar.y) - 220) radar.x = shoreAt(radar.y) - 220;
    // 海岸基地：沿海南北分布，占领后提供406mm岸防炮
    var coastBases = [];
    var baseYs = [size * 0.10, size * 0.21, size * 0.32, size * 0.43, size * 0.54, size * 0.65, size * 0.76, size * 0.87];
    for (var bi = 0; bi < baseYs.length; bi++) {
      var by = baseYs[bi] + (Math.random() - 0.5) * 130;
      by = U.clamp(by, 300, size - 300);
      var bx = shoreAt(by) - 105 - Math.random() * 40;
      bx = Math.max(260, bx);
      if (NAVAL.isWater(bx, by)) bx = shoreAt(by) - 160;
      var cb = makeSite('coastbase', bx, by, '海岸炮台 ' + (bi + 1), m.id + '_coast' + bi, bi);
      coastBases.push(cb);
    }
    return { towers: towers, radar: radar, coastBases: coastBases };
  }

  function randomLandPoint(rnd, margin) {
    var size = T.size || 4000;
    for (var i = 0; i < 60; i++) {
      var y = margin + rnd() * (size - margin * 2);
      var edge = shoreAt(y) - margin;
      if (edge < margin * 1.5) continue;
      var x = margin + rnd() * (edge - margin);
      if (NAVAL.isLand(x, y) && x < shoreAt(y) - margin * 0.7) return { x: x, y: y };
    }
    return { x: size * 0.28, y: size * 0.5 };
  }

  function distToPolyline(x, y, pts) {
    if (!pts || pts.length < 2) return 9999;
    var best = 9999;
    for (var i = 0; i < pts.length - 1; i++) {
      var ax = pts[i].x, ay = pts[i].y, bx = pts[i + 1].x, by = pts[i + 1].y;
      var dx = bx - ax, dy = by - ay;
      var len2 = dx * dx + dy * dy || 1;
      var t = U.clamp(((x - ax) * dx + (y - ay) * dy) / len2, 0, 1);
      var px = ax + dx * t, py = ay + dy * t;
      best = Math.min(best, Math.hypot(x - px, y - py));
    }
    return best;
  }

  function randomSceneLandPoint(rnd, margin) {
    var size = T.sceneSize || 5000;
    for (var i = 0; i < 80; i++) {
      var y = margin + rnd() * (size - margin * 2);
      var edge = shoreSceneAt(y) - margin;
      if (edge < margin * 1.5) continue;
      var x = margin + rnd() * (edge - margin);
      if (x < shoreSceneAt(y) - margin * 0.7) return { x: x, y: y };
    }
    return { x: size * 0.28, y: size * 0.5 };
  }

  function segmentCross(a, b, c, d) {
    function cr(ax, ay, bx, by) { return ax * by - ay * bx; }
    var d1 = cr(d.x - c.x, d.y - c.y, a.x - c.x, a.y - c.y);
    var d2 = cr(d.x - c.x, d.y - c.y, b.x - c.x, b.y - c.y);
    var d3 = cr(b.x - a.x, b.y - a.y, c.x - a.x, c.y - a.y);
    var d4 = cr(b.x - a.x, b.y - a.y, d.x - a.x, d.y - a.y);
    if (!(((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0)))) return null;
    var den = (b.x - a.x) * (d.y - c.y) - (b.y - a.y) * (d.x - c.x);
    if (Math.abs(den) < 0.00001) return null;
    var ua = ((c.x - a.x) * (d.y - c.y) - (c.y - a.y) * (d.x - c.x)) / den;
    return { x: a.x + (b.x - a.x) * ua, y: a.y + (b.y - a.y) * ua };
  }

  function generateFeatureData(m, sites) {
    var size = T.sceneSize || T.size || 5000, off = T.sceneOffset || { x: 0, y: 0 };
    var rnd = U.mulberry32((m.seed || 1944) ^ 0x51ed);
    T.hills = [];
    T.forests = [];
    T.forestZones = [];
    T.trees = [];
    T.buildings = [];
    T.fortDecor = [];
    T.bridges = [];
    T.villages = [];

    // 高地
    for (var hi = 0; hi < 8; hi++) {
      var hp = randomSceneLandPoint(rnd, 340);
      T.hills.push({ x: hp.x, y: hp.y, r: 170 + rnd() * 260, h: 20 + rnd() * 36 });
    }

    // 森林与树
    for (var fi = 0; fi < 15; fi++) {
      var fp = randomSceneLandPoint(rnd, 300);
      var fr = 90 + rnd() * 130;
      T.forests.push({ x: fp.x, y: fp.y, r: fr });
      var tn = 14 + Math.floor(rnd() * 18);
      for (var ti = 0; ti < tn; ti++) {
        var ta = rnd() * Math.PI * 2, tr = Math.sqrt(rnd()) * fr * 0.92;
        T.trees.push({ x: fp.x + Math.cos(ta) * tr, y: fp.y + Math.sin(ta) * tr, s: 0.7 + rnd() * 0.7 });
      }
    }
    // 选取两片大森林作为可占领林地
    T.forests.slice().sort(function (a, b) { return b.r - a.r; }).slice(0, 2).forEach(function (f) {
      T.forestZones.push({ x: f.x, y: f.y, r: Math.max(70, f.r * 0.72) });
    });

    // 村庄：每张地图 7 个左右，沿内陆分布，避开彼此和出生点
    var names = m.villageNames || ['圣洛村', '贝桑港', '卡昂村', '维尔农', '奥马哈村', '瑟堡镇', '巴约村', '库唐斯'];
    var spawnList = [];
    for (var sk in m.spawns) spawnList.push(m.spawns[sk]);
    for (var vi = 0; vi < 8 && T.villages.length < 7; vi++) {
      for (var va = 0; va < 50; va++) {
        var vp = randomSceneLandPoint(rnd, 260);
        var vgx = vp.x - off.x, vgy = vp.y - off.y;
        var ok = true;
        if (vgx < 220 || vgy < 250 || vgy > T.size - 250) continue;
        for (var vv = 0; vv < T.villages.length; vv++) {
          if (U.dist(vgx, vgy, T.villages[vv].x, T.villages[vv].y) < 520) { ok = false; break; }
        }
        if (!ok) continue;
        for (var ss = 0; ss < spawnList.length; ss++) {
          if (U.dist(vgx, vgy, spawnList[ss].x, spawnList[ss].y) < 360) { ok = false; break; }
        }
        if (!ok) continue;
        T.villages.push({
          id: 'v' + T.villages.length, name: names[T.villages.length % names.length],
          x: vgx, y: vgy, r: 85 + rnd() * 25
        });
        break;
      }
    }

    // 堡垒点使用地图定义，并校正到陆地
    T.forts = [];
    var forts = m.forts || [];
    for (var q = 0; q < forts.length; q++) {
      var p0 = NAVAL.nearestLandPoint(forts[q].x, forts[q].y);
      T.forts.push({ name: forts[q].name, x: p0.x, y: p0.y, r: forts[q].r });
    }

    // 河流：从内陆流向海岸，并一直延伸到海中形成入海口
    var sy = size * 0.22 + rnd() * size * 0.12;
    var ey = size * 0.58 + rnd() * size * 0.16;
    var stream = [];
    for (var si = 0; si <= 9; si++) {
      var tt = si / 9;
      var yy = U.lerp(sy, ey, tt);
      var edge = shoreSceneAt(yy);
      if (si === 9) {
        stream.push({ x: edge + 70, y: yy });
      } else {
        var xx = U.lerp(0, edge - 90, tt) + Math.sin(tt * Math.PI * 2.6) * 95;
        stream.push({ x: U.clamp(xx, 0, edge - 45), y: yy });
      }
    }
    T.streams = [stream];
    T.stream = stream;
    T.streamName = m.streamName || '河流';

    // 道路：以雷达为中心连接村庄、堡垒和出生点，形成陆上道路网
    var nodes = [];
    nodes.push({ x: sites.radar.x + off.x, y: sites.radar.y + off.y, name: 'radar' });
    for (var ni = 0; ni < T.villages.length; ni++) nodes.push({ x: T.villages[ni].x + off.x, y: T.villages[ni].y + off.y, name: T.villages[ni].name });
    for (var nf = 0; nf < T.forts.length; nf++) nodes.push({ x: T.forts[nf].x + off.x, y: T.forts[nf].y + off.y, name: T.forts[nf].name });
    for (var ns in m.spawns) nodes.push({ x: m.spawns[ns].x + off.x, y: m.spawns[ns].y + off.y, name: ns });
    nodes = nodes.filter(function (n) { return !NAVAL.isWater(n.x - off.x, n.y - off.y); });

    var connected = [nodes[0]];
    var remaining = nodes.slice(1);
    var roads = [];
    while (remaining.length) {
      var bestI = -1, bestJ = -1, bestD = Infinity;
      for (var ci = 0; ci < connected.length; ci++) {
        for (var rj = 0; rj < remaining.length; rj++) {
          var d0 = U.dist(connected[ci].x, connected[ci].y, remaining[rj].x, remaining[rj].y);
          if (d0 < bestD) { bestD = d0; bestI = ci; bestJ = rj; }
        }
      }
      if (bestJ < 0) break;
      var a = connected[bestI], b = remaining[bestJ];
      var mx = (a.x + b.x) / 2 + (rnd() - 0.5) * bestD * 0.22;
      var my = (a.y + b.y) / 2 + (rnd() - 0.5) * bestD * 0.22;
      if (NAVAL.isWater(mx - off.x, my - off.y)) { mx = a.x; my = a.y; }
      roads.push([{ x: a.x, y: a.y }, { x: mx, y: my }, { x: b.x, y: b.y }]);
      connected.push(b);
      remaining.splice(bestJ, 1);
    }
    T.roads = roads;
    T.road = roads[0] || [];

    // 道路与河流交叉处放桥
    for (var rri = 0; rri < roads.length; rri++) {
      for (var rsi = 0; rsi < roads[rri].length - 1; rsi++) {
        for (var sti = 0; sti < stream.length - 1; sti++) {
          var hit = segmentCross(roads[rri][rsi], roads[rri][rsi + 1], stream[sti], stream[sti + 1]);
          if (hit) T.bridges.push({ x: hit.x, y: hit.y, ang: Math.atan2(stream[sti + 1].y - stream[sti].y, stream[sti + 1].x - stream[sti].x) });
        }
      }
    }

    // 村庄房屋
    for (var vbi = 0; vbi < T.villages.length; vbi++) {
      var v = T.villages[vbi], vc = 9 + Math.floor(rnd() * 7);
      for (var vh = 0; vh < vc; vh++) {
        var ha = rnd() * Math.PI * 2, hr = 20 + rnd() * (v.r * 0.9);
        var bx = v.x + Math.cos(ha) * hr, by = v.y + Math.sin(ha) * hr;
        if (NAVAL.isWater(bx, by)) continue;
        T.buildings.push({ x: bx, y: by, w: 12 + rnd() * 14, h: 9 + rnd() * 10, ang: rnd() * Math.PI, roof: rnd() < 0.65, villageId: v.id });
      }
    }
    // 堡垒房屋和农舍
    for (var fbi = 0; fbi < T.forts.length; fbi++) {
      for (var fh = 0; fh < 2; fh++) {
        var fa = rnd() * Math.PI * 2, fr2 = 30 + rnd() * 65;
        var fbx = T.forts[fbi].x + Math.cos(fa) * fr2, fby = T.forts[fbi].y + Math.sin(fa) * fr2;
        if (!NAVAL.isWater(fbx, fby)) T.buildings.push({ x: fbx, y: fby, w: 12 + rnd() * 10, h: 9 + rnd() * 7, ang: rnd() * Math.PI, roof: true });
      }
    }
    for (var fh2 = 0; fh2 < 10; fh2++) {
      var fp2 = randomSceneLandPoint(rnd, 340);
      T.buildings.push({ x: fp2.x, y: fp2.y, w: 13 + rnd() * 10, h: 9 + rnd() * 7, ang: rnd() * Math.PI, roof: true });
    }

    // 堡垒工事外观
    for (var fz = 0; fz < T.forts.length; fz++) {
      var zz = T.forts[fz];
      for (var sg = 0; sg < 9; sg++) {
        var aa = (sg / 9) * Math.PI * 2 + rnd() * 0.12;
        var rr = zz.r + 15 + rnd() * 15;
        T.fortDecor.push({
          x: zz.x + Math.cos(aa) * rr, y: zz.y + Math.sin(aa) * rr,
          ang: aa + rnd() * 0.2, kind: sg % 3 === 0 ? 'bunker' : 'sandbag'
        });
      }
    }
  }
  function relayoutCaptureZones(sites) {
    var allSites = [];
    if (sites) {
      for (var ti = 0; ti < sites.towers.length; ti++) allSites.push(sites.towers[ti]);
      if (sites.radar) allSites.push(sites.radar);
      if (sites.coastBases) for (var ci = 0; ci < sites.coastBases.length; ci++) allSites.push(sites.coastBases[ci]);
    }
    function circleLand(x, y, r) {
      if (!NAVAL.isLand(x, y)) return false;
      for (var a = 0; a < 8; a++) {
        var ang = a / 8 * Math.PI * 2;
        if (NAVAL.isWater(x + Math.cos(ang) * r * 0.95, y + Math.sin(ang) * r * 0.95)) return false;
      }
      if (x + r > NAVAL.shoreAt(y) - 35 || x - r < 25 || y - r < 25 || y + r > T.size - 25) return false;
      return true;
    }
    function siteClear(x, y, r, gap) {
      for (var i = 0; i < allSites.length; i++) {
        var s = allSites[i];
        if (U.dist(x, y, s.x, s.y) < r + s.r + (gap == null ? 100 : gap)) return false;
      }
      return true;
    }
    // 先筛选合法村庄，再分成 3 个城镇
    var valid = [];
    for (var vi = 0; vi < T.villages.length; vi++) {
      var v = T.villages[vi];
      if (circleLand(v.x, v.y, v.r) && siteClear(v.x, v.y, v.r, 90)) valid.push(v);
    }
    if (valid.length > 8) valid = valid.slice(0, 8);
    // 海岸地图陆地较窄时，补足至少 6 个村庄，保证 3 个城镇各有 2 个村
    var fallbackNames = ['新村', '南村', '北村', '西村', '东村', '港湾村'];
    for (var vf = 0; valid.length < 6 && vf < 120; vf++) {
      var vp = NAVAL.randomLandPoint(220);
      var vr = 80 + Math.random() * 25;
      if (!circleLand(vp.x, vp.y, vr) || !siteClear(vp.x, vp.y, vr, 55)) continue;
      var tooClose = false;
      for (var vc = 0; vc < valid.length; vc++) {
        if (U.dist(vp.x, vp.y, valid[vc].x, valid[vc].y) < vr + valid[vc].r + 300) { tooClose = true; break; }
      }
      if (tooClose) continue;
      var nv = {
        id: 'vf' + valid.length, name: fallbackNames[valid.length % fallbackNames.length],
        x: vp.x, y: vp.y, r: vr
      };
      valid.push(nv);
      var vbuild = 8 + Math.floor(Math.random() * 5);
      for (var vb = 0; vb < vbuild; vb++) {
        var vba = Math.random() * Math.PI * 2, vbr = 20 + Math.random() * (vr * 0.8);
        var vbx = vp.x + Math.cos(vba) * vbr, vby = vp.y + Math.sin(vba) * vbr;
        if (!NAVAL.isWater(vbx, vby)) {
          T.buildings.push({ x: vbx, y: vby, w: 12 + Math.random() * 12, h: 9 + Math.random() * 8, ang: Math.random() * Math.PI, roof: true, villageId: nv.id });
        }
      }
    }
    var centers = [];
    if (valid.length) {
      centers.push(valid[0]);
      while (centers.length < Math.min(3, valid.length)) {
        var best = null, bd = -1;
        for (var a0 = 0; a0 < valid.length; a0++) {
          var vv = valid[a0];
          if (centers.indexOf(vv) >= 0) continue;
          var md = Infinity;
          for (var c0 = 0; c0 < centers.length; c0++) md = Math.min(md, U.dist(vv.x, vv.y, centers[c0].x, centers[c0].y));
          if (md > bd) { bd = md; best = vv; }
        }
        if (!best) break;
        centers.push(best);
      }
    }
    var groups = [];
    for (var gi = 0; gi < centers.length; gi++) groups.push([]);
    for (var vi2 = 0; vi2 < valid.length; vi2++) {
      var vv2 = valid[vi2];
      var bi = 0, bdd = Infinity;
      for (var ci2 = 0; ci2 < centers.length; ci2++) {
        var dd0 = U.dist(vv2.x, vv2.y, centers[ci2].x, centers[ci2].y);
        if (dd0 < bdd) { bdd = dd0; bi = ci2; }
      }
      groups[bi].push(vv2);
    }
    // 防止某个城镇超过 3 个村，优先保留靠近镇中心的
    for (var gi2 = 0; gi2 < groups.length; gi2++) {
      groups[gi2].sort(function (a, b) {
        return U.dist(a.x, a.y, centers[gi2].x, centers[gi2].y) - U.dist(b.x, b.y, centers[gi2].x, centers[gi2].y);
      });
      if (groups[gi2].length > 3) groups[gi2] = groups[gi2].slice(0, 3);
    }
    // 把人数不足 2 的城镇从其他城镇补一个最近的村庄
    for (var gi3 = 0; gi3 < groups.length; gi3++) {
      if (groups[gi3].length >= 2) continue;
      var donor = -1, donorD = Infinity, donorIdx = -1;
      for (var gj = 0; gj < groups.length; gj++) {
        if (gj === gi3 || groups[gj].length <= 2) continue;
        for (var gk = 0; gk < groups[gj].length; gk++) {
          var dd2 = U.dist(groups[gj][gk].x, groups[gj][gk].y, centers[gi3].x, centers[gi3].y);
          if (dd2 < donorD) { donorD = dd2; donor = gj; donorIdx = gk; }
        }
      }
      if (donor >= 0) groups[gi3].push(groups[donor].splice(donorIdx, 1)[0]);
    }

    var chosenVillages = [];
    var chosen = [];
    var townNames = (T.navalMap && T.navalMap.townNames) || ['北镇', '中镇', '南镇'];
    for (var gi4 = 0; gi4 < groups.length; gi4++) {
      for (var gj2 = 0; gj2 < groups[gi4].length; gj2++) {
        var vv3 = groups[gi4][gj2];
        vv3.town = townNames[gi4] || ('镇' + (gi4 + 1));
        chosenVillages.push(vv3);
        chosen.push({ x: vv3.x, y: vv3.y, r: vv3.r });
      }
    }

    // 村庄/城镇外围：每个村庄 2~3 个小型工事圈
    var generatedForts = [];
    var fortR = 62;
    for (var fvi = 0; fvi < chosenVillages.length; fvi++) {
      var fv = chosenVillages[fvi];
      var targetForts = 2 + (Math.random() < 0.35 ? 1 : 0);
      var placed = 0;
      for (var fa = 0; fa < 48 && placed < targetForts; fa++) {
        var ang2 = Math.random() * Math.PI * 2;
        var dist2 = fv.r + fortR + 45 + Math.random() * 55;
        var fx = fv.x + Math.cos(ang2) * dist2;
        var fy = fv.y + Math.sin(ang2) * dist2;
        if (!circleLand(fx, fy, fortR)) continue;
        if (!siteClear(fx, fy, fortR, 80)) continue;
        var bad = false;
        for (var ck = 0; ck < chosen.length; ck++) {
          if (U.dist(fx, fy, chosen[ck].x, chosen[ck].y) < fortR + chosen[ck].r + 18) { bad = true; break; }
        }
        if (bad) continue;
        var fort = { name: fv.town + ' · 外围工事', x: fx, y: fy, r: fortR, generated: true };
        generatedForts.push(fort);
        chosen.push({ x: fx, y: fy, r: fortR });
        placed++;
      }
    }

    // 林地圈少量保留，且不得与城镇/工事重叠
    var generatedForests = [];
    for (var fi = 0; fi < T.forestZones.length && generatedForests.length < 2; fi++) {
      var fz = T.forestZones[fi];
      if (!circleLand(fz.x, fz.y, fz.r)) continue;
      var badF = false;
      for (var ck2 = 0; ck2 < chosen.length; ck2++) {
        if (U.dist(fz.x, fz.y, chosen[ck2].x, chosen[ck2].y) < fz.r + chosen[ck2].r + 160) { badF = true; break; }
      }
      if (badF || !siteClear(fz.x, fz.y, fz.r, 150)) continue;
      generatedForests.push(fz);
      chosen.push({ x: fz.x, y: fz.y, r: fz.r });
    }

    var keepV = {};
    for (var kv = 0; kv < chosenVillages.length; kv++) keepV[chosenVillages[kv].id] = true;
    T.villages = chosenVillages;
    T.forts = generatedForts;
    T.forestZones = generatedForests;
    T.buildings = T.buildings.filter(function (b) {
      return b.villageId == null || keepV[b.villageId];
    });
    // 重新生成外围工事外观
    T.fortDecor = [];
    for (var fd = 0; fd < generatedForts.length; fd++) {
      var tf = generatedForts[fd];
      for (var fs = 0; fs < 5; fs++) {
        var aa2 = (fs / 5) * Math.PI * 2;
        T.fortDecor.push({
          x: tf.x + Math.cos(aa2) * (tf.r + 10), y: tf.y + Math.sin(aa2) * (tf.r + 10),
          ang: aa2, kind: fs % 2 === 0 ? 'bunker' : 'sandbag'
        });
      }
    }
  }
  function buildCustomSites(m) {
    var L = m.layout;
    function place(kind, x, y, name, id, idx) {
      var p = NAVAL.nearestLandPoint(x, y);
      return makeSite(kind, p.x, p.y, name, id, idx);
    }
    function placeCoastal(x, y, name, id, idx) {
      var p = NAVAL.nearestLandPoint(x, y);
      var dir = p.x < T.size / 2 ? -1 : 1;
      // 海岸炮台圆必须完整落在陆地上，不能一半压进海里
      for (var guard = 0; guard < 120; guard++) {
        var clear = true;
        for (var a = 0; a < 16; a++) {
          var ang = a / 16 * Math.PI * 2;
          if (NAVAL.isWater(p.x + Math.cos(ang) * 78, p.y + Math.sin(ang) * 78)) {
            clear = false; break;
          }
        }
        if (clear) break;
        p.x = U.clamp(p.x + dir * 8, 40, T.size - 40);
      }
      return makeSite('coastbase', p.x, p.y, name, id, idx);
    }
    var towers = [];
    for (var i = 0; i < L.towers.length; i++) {
      var tw = L.towers[i];
      towers.push(place('comm', tw.x, tw.y, tw.name, m.id + '_comm' + i, i));
    }
    var radar = place('radar', L.radar.x, L.radar.y, '雷达站', m.id + '_radar', -1);
    var coastBases = [];
    for (var ci = 0; ci < L.coastBases.length; ci++) {
      var cb = L.coastBases[ci];
      var by, bx, cbName;
      if (typeof cb === 'number') {
        by = U.clamp(cb, 320, T.size - 320);
        bx = shoreAt(by) - 108;
        cbName = '海岸炮台 ' + (ci + 1);
      } else {
        by = cb.y;
        bx = cb.x;
        cbName = cb.name || ('海岸炮台 ' + (ci + 1));
      }
      coastBases.push(placeCoastal(bx, by, cbName, m.id + '_coast' + ci, ci));
    }
    return { towers: towers, radar: radar, coastBases: coastBases };
  }

  function buildCustomFeatures(m) {
    var L = m.layout;
    var rnd = U.mulberry32((m.seed || 1) + 17);
    T.hills = L.hills.map(function (h) { return { x: h.x, y: h.y, r: h.r, h: h.h, name: h.name || '' }; });
    T.forests = L.forests.map(function (f) { return { x: f.x, y: f.y, r: f.r }; });
    T.forestZones = L.forests.map(function (f) { return { x: f.x, y: f.y, r: Math.max(70, f.r * 0.9) }; });
    T.villages = L.villages.map(function (v, i) {
      return { id: 'v' + i, name: v.name, x: v.x, y: v.y, r: v.r, town: v.name };
    });
    T.forts = L.forts.map(function (f) { return { name: f.name, x: f.x, y: f.y, r: f.r, generated: false }; });
    T.roads = (L.roads || []).map(function (road) {
      return road.map(function (p) { return { x: p.x, y: p.y }; });
    });
    T.road = T.roads[0] || [];
    T.streams = [];
    T.stream = [];
    T.tracks = [];
    T.track = [];
    T.streamName = '';
    T.farms = [];
    T.bridges = [];
    T.buildings = [];
    T.trees = [];
    T.fortDecor = [];
    T.village = { x: T.villages[0].x, y: T.villages[0].y, name: T.villages[0].name };

    for (var vi = 0; vi < T.villages.length; vi++) {
      var v = T.villages[vi];
      for (var b = 0; b < 9; b++) {
        var ba = rnd() * Math.PI * 2, br = 22 + rnd() * (v.r * 0.75);
        var bx = v.x + Math.cos(ba) * br, by = v.y + Math.sin(ba) * br;
        if (NAVAL.isWater(bx, by)) continue;
        T.buildings.push({
          x: bx, y: by, w: 12 + rnd() * 12, h: 9 + rnd() * 8,
          ang: rnd() * Math.PI, roof: rnd() < 0.7, villageId: v.id
        });
      }
    }
    for (var fi = 0; fi < T.forts.length; fi++) {
      var ft = T.forts[fi];
      for (var fb = 0; fb < 2; fb++) {
        var fa = rnd() * Math.PI * 2, fr = 30 + rnd() * 58;
        var fx = ft.x + Math.cos(fa) * fr, fy = ft.y + Math.sin(fa) * fr;
        if (NAVAL.isWater(fx, fy)) continue;
        T.buildings.push({ x: fx, y: fy, w: 12 + rnd() * 10, h: 9 + rnd() * 7, ang: rnd() * Math.PI, roof: true });
      }
      for (var fd = 0; fd < 7; fd++) {
        var da = (fd / 7) * Math.PI * 2, dr = ft.r + 9 + rnd() * 12;
        T.fortDecor.push({
          x: ft.x + Math.cos(da) * dr, y: ft.y + Math.sin(da) * dr,
          ang: da + rnd() * 0.2, kind: fd % 2 === 0 ? 'bunker' : 'sandbag'
        });
      }
    }
    for (var ti = 0; ti < T.forests.length; ti++) {
      var fo = T.forests[ti];
      for (var tr = 0; tr < 22; tr++) {
        var ta = rnd() * Math.PI * 2, td = Math.sqrt(rnd()) * fo.r * 0.92;
        T.trees.push({ x: fo.x + Math.cos(ta) * td, y: fo.y + Math.sin(ta) * td, s: 0.7 + rnd() * 0.7 });
      }
    }
  }

  function buildNaval(seed) {
    var m = T.navalMap;
    T.map = m;
    T.size = m.size || 5000;
    T.sceneSize = m.sceneSize || 5000;
    T.sceneOffset = { x: 0, y: 0 };
    T.battle = { x: 0, y: 0, w: T.size, h: T.size };
    T.origin = 0;
    T.extent = T.size;
    T.end = T.size;
    T.step = 20;
    SL.CONFIG.mapSize = T.size;
    T.spawns = m.spawns;
    T.objective = m.objective || { x: T.size * 0.3, y: T.size * 0.5 };
    T.streams = [];
    T.roads = [];
    T.tracks = [];
    T.stream = [];
    T.road = [];
    T.track = [];
    T.hills = [];
    T.forests = [];
    T.farms = [];
    T.streamName = '';
    T.village = { x: T.size * 0.26, y: T.size * 0.5, name: '' };
    T.trees = [];
    T.buildings = [];
    T.levels = [];
    T.contourPaths = [];
    T.contourLabels = [];
    T.zoneError = null;
    T.treeError = null;

    var sites;
    if (m.layout) {
      sites = buildCustomSites(m);
      T.navalSites = sites;
      buildCustomFeatures(m);
    } else {
      sites = buildSites(m);
      T.navalSites = sites;
      generateFeatureData(m, sites);
      relayoutCaptureZones(sites);
    }

    function makeZone(id, name, kind, x, y, r) {
      return {
        id: id, name: name, kind: kind, x: x, y: y, r: r,
        owner: null, cap: 0, capSide: null,
        fortified: false, hp: 0, maxHp: SL.FORT.maxHp, fortifyProgress: 0,
        structure: null, structures: [], rubbles: [], rubble: null, rubbleProgress: 0
      };
    }
    T.zones = [];
    for (var vi = 0; vi < T.villages.length; vi++) {
      var v = T.villages[vi];
      T.zones.push(makeZone('vz' + vi, v.name, 'village', v.x, v.y, v.r));
    }
    for (var fzi = 0; fzi < T.forestZones.length; fzi++) {
      var fz = T.forestZones[fzi];
      T.zones.push(makeZone('fz' + fzi, '林地', 'forest', fz.x, fz.y, fz.r));
    }
    for (var fi = 0; fi < T.forts.length; fi++) {
      var ft = T.forts[fi];
      T.zones.push(makeZone('ft' + fi, ft.name, 'fort', ft.x, ft.y, ft.r));
    }
    T.zones.push(sites.towers[0], sites.towers[1], sites.towers[2], sites.radar);
    if (sites.coastBases) {
      for (var cbi = 0; cbi < sites.coastBases.length; cbi++) T.zones.push(sites.coastBases[cbi]);
    }
    if (T.villages[0]) T.village = { x: T.villages[0].x, y: T.villages[0].y, name: T.villages[0].name };
    T.objective = { x: sites.radar.x, y: sites.radar.y };
    T.bounds = { minX: 0, minY: 0, maxX: T.size, maxY: T.size };
    if (SL.Render) { SL.Render.minimapCache = null; SL.Render.needsRebake = true; }
    if (T.navalSites) T.navalSites.randomSeed = seed;
    return T;
  }
  T.regenerateNavalSites = function () {
    if (!T.naval || !T.navalMap) return;
    T.zones = T.zones.filter(function (z) { return !z.site; });
    var sites = T.navalMap.layout ? buildCustomSites(T.navalMap) : buildSites(T.navalMap);
    T.navalSites = sites;
    T.zones.push(sites.towers[0], sites.towers[1], sites.towers[2], sites.radar);
    if (sites.coastBases) {
      for (var cbi2 = 0; cbi2 < sites.coastBases.length; cbi2++) T.zones.push(sites.coastBases[cbi2]);
    }
    T.objective = { x: sites.radar.x, y: sites.radar.y };
    return sites;
  };

  T.buildNaval = buildNaval;

  T.setMap = function (id) {
    var m = SL.MAP_BY_ID[id] || SL.MAPS[0];
    if (m.naval) {
      T.naval = true;
      T.navalMap = m;
      T.map = m;
      T.spawns = m.spawns;
      T.objective = m.objective || { x: 1200, y: 2000 };
      T.size = m.size || 5000;
      T.sceneSize = m.sceneSize || 5000;
      T.sceneOffset = { x: 0, y: 0 };
      T.battle = { x: 0, y: 0, w: T.size, h: T.size };
      T.origin = 0;
      T.extent = T.size;
      T.end = T.size;
      SL.CONFIG.mapSize = T.size;
      if (SL.Render) { SL.Render.minimapCache = null; SL.Render.needsRebake = true; }
      return;
    }
    T.naval = false;
    T.navalMap = null;
    T.navalSites = null;
    SL.CONFIG.mapSize = 2000;
    Base.setMap.call(T, id);
    if (SL.Render) { SL.Render.minimapCache = null; SL.Render.needsRebake = true; }
  };

  T.build = function (seed) {
    if (T.naval) return buildNaval(seed);
    return Base.build.call(T, seed);
  };

  T.buildZone = function () {
    if (!T.naval) return Base.buildZone.call(T);
    for (var i = 0; i < T.zones.length; i++) resetZone(T.zones[i]);
  };

  T.addZone = function (zone) {
    return Base.addZone.call(T, zone);
  };

  T.heightAt = function (x, y) {
    if (!T.naval) return Base.heightAt.call(T, x, y);
    var off = sceneOffset();
    var sx = x + off.x, sy = y + off.y;
    var h = 0;
    for (var i = 0; i < T.hills.length; i++) {
      var hill = T.hills[i];
      var q = Math.hypot(sx - hill.x, sy - hill.y) / hill.r;
      if (q < 1) h += hill.h * (1 - q) * (1 - q);
    }
    return h;
  };
  T.slopeAt = function (x, y) {
    if (!T.naval) return Base.slopeAt.call(T, x, y);
    var d = 12;
    var hx = T.heightAt(x + d, y) - T.heightAt(x - d, y);
    var hy = T.heightAt(x, y + d) - T.heightAt(x, y - d);
    return Math.hypot(hx, hy) / (2 * d);
  };
  T.forestAt = function (x, y) {
    if (!T.naval) return Base.forestAt.call(T, x, y);
    var off = sceneOffset();
    var sx = x + off.x, sy = y + off.y;
    var best = 0;
    for (var i = 0; i < T.forests.length; i++) {
      var f = T.forests[i];
      var q = Math.hypot(sx - f.x, sy - f.y) / f.r;
      if (q < 1) best = Math.max(best, 0.42 + 0.58 * (1 - q));
    }
    return best;
  };
  T.speedAt = function (x, y) {
    if (!T.naval) return Base.speedAt.call(T, x, y);
    var m = 1;
    var f = T.forestAt(x, y);
    if (f > 0.6) m *= 0.72;
    else if (f > 0.2) m *= 0.86;
    if (T.streamDistance(x, y) < 16) m *= 0.55;
    if (T.roadDistance(x, y) < 13) m *= 1.16;
    m *= 1 - Math.min(0.22, T.slopeAt(x, y) * 0.8);
    return U.clamp(m, 0.45, 1.16);
  };
  T.streamDistance = function (x, y) {
    if (!T.naval) return Base.streamDistance.call(T, x, y);
    var off = sceneOffset();
    return distToPolyline(x + off.x, y + off.y, T.stream);
  };
  T.roadDistance = function (x, y) {
    if (!T.naval) return Base.roadDistance.call(T, x, y);
    var off = sceneOffset();
    return distToPolyline(x + off.x, y + off.y, T.road);
  };
  T.rebakeLayers = function () {
    if (T.naval) return;
    Base.rebakeLayers.call(T);
  };

  /* ---------------- 海陆绘制 ---------------- */

  function coastPath(m, close) {
    var p = new Path2D();
    if (m.landPoly) {
      p.moveTo(m.landPoly[0][0], m.landPoly[0][1]);
      for (var li = 1; li < m.landPoly.length; li++) p.lineTo(m.landPoly[li][0], m.landPoly[li][1]);
      if (close) p.closePath();
      return p;
    }
    p.moveTo(0, 0);
    for (var i = 0; i < m.shore.length; i++) p.lineTo(m.shore[i].x, m.shore[i].y);
    p.lineTo(0, T.sceneSize || 5000);
    if (close) p.closePath();
    return p;
  }

  T.drawGround = function (ctx, zoom, opts) {
    if (!T.naval) return Base.drawGround.call(T, ctx, zoom, opts);
    opts = opts || {};
    var m = T.navalMap, size = T.sceneSize || 5000, one = 1 / zoom;
    var off = T.sceneOffset || { x: 0, y: 0 };
    ctx.save();
    ctx.translate(-off.x, -off.y);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, size, size);
    ctx.clip();

    // 海
    var sea = ctx.createLinearGradient(0, 0, size, size);
    sea.addColorStop(0, '#233f46');
    sea.addColorStop(0.55, '#2b5260');
    sea.addColorStop(1, '#1d3540');
    ctx.fillStyle = sea;
    ctx.fillRect(0, 0, size, size);

    // 海面波纹
    ctx.strokeStyle = 'rgba(154,204,207,0.10)';
    ctx.lineWidth = 1.2 * one;
    for (var wy = 80; wy < size; wy += 140) {
      ctx.beginPath();
      for (var wx = 0; wx <= size; wx += 80) {
        var yy = wy + Math.sin(wx * 0.008 + wy * 0.01) * 9;
        if (wx === 0) ctx.moveTo(wx, yy); else ctx.lineTo(wx, yy);
      }
      ctx.stroke();
    }

    // 陆地
    var land = coastPath(m, true);
    ctx.fillStyle = '#bcb18e';
    ctx.fill(land);
    ctx.save();
    ctx.clip(land);
    // 高地：阴影、等高线
    for (var hi2 = 0; hi2 < T.hills.length; hi2++) {
      var hill = T.hills[hi2];
      var hg = ctx.createRadialGradient(hill.x, hill.y, hill.r * 0.08, hill.x, hill.y, hill.r);
      hg.addColorStop(0, 'rgba(116,108,68,0.20)');
      hg.addColorStop(0.55, 'rgba(108,104,68,0.10)');
      hg.addColorStop(1, 'rgba(108,104,68,0)');
      ctx.fillStyle = hg;
      ctx.beginPath(); ctx.arc(hill.x, hill.y, hill.r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(92,84,54,0.20)';
      ctx.lineWidth = 0.9 * one;
      for (var hc = 1; hc <= 3; hc++) {
        ctx.beginPath();
        ctx.ellipse(hill.x, hill.y, hill.r * (0.28 + hc * 0.17), hill.r * (0.2 + hc * 0.13), 0.2, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    // 森林与树木
    for (var fi2 = 0; fi2 < T.forests.length; fi2++) {
      var f = T.forests[fi2];
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(55,82,48,0.16)'; ctx.fill();
      ctx.strokeStyle = 'rgba(52,76,45,0.24)'; ctx.lineWidth = 1 * one; ctx.stroke();
    }
    for (var ti2 = 0; ti2 < T.trees.length; ti2++) {
      var tr = T.trees[ti2];
      if (NAVAL.isWater(tr.x, tr.y)) continue;
      ctx.fillStyle = ti2 % 3 === 0 ? 'rgba(51,77,44,0.75)' : 'rgba(62,87,48,0.7)';
      ctx.beginPath();
      ctx.arc(tr.x, tr.y, 4.2 * tr.s, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(42,64,38,0.45)';
      ctx.lineWidth = 0.7 * one;
      ctx.beginPath(); ctx.moveTo(tr.x, tr.y + 3 * tr.s); ctx.lineTo(tr.x, tr.y + 7 * tr.s); ctx.stroke();
    }
    // 河流
    ctx.strokeStyle = 'rgba(90,137,143,0.85)';
    ctx.lineWidth = 15 * one;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath();
    for (var si2 = 0; si2 < T.stream.length; si2++) {
      if (si2 === 0) ctx.moveTo(T.stream[si2].x, T.stream[si2].y);
      else ctx.lineTo(T.stream[si2].x, T.stream[si2].y);
    }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(174,214,207,0.65)';
    ctx.lineWidth = 3 * one;
    ctx.stroke();
    // 道路
    for (var ri2 = 0; ri2 < T.roads.length; ri2++) {
      var rd = T.roads[ri2];
      ctx.beginPath();
      for (var rj2 = 0; rj2 < rd.length; rj2++) {
        if (rj2 === 0) ctx.moveTo(rd[rj2].x, rd[rj2].y);
        else ctx.lineTo(rd[rj2].x, rd[rj2].y);
      }
      ctx.strokeStyle = 'rgba(112,94,63,0.45)'; ctx.lineWidth = 10 * one; ctx.stroke();
      ctx.strokeStyle = 'rgba(207,188,142,0.55)'; ctx.lineWidth = 5 * one; ctx.stroke();
      ctx.strokeStyle = 'rgba(151,130,89,0.5)'; ctx.lineWidth = 1 * one; ctx.stroke();
    }
    // 桥梁
    for (var bi = 0; bi < T.bridges.length; bi++) {
      var br = T.bridges[bi];
      ctx.save(); ctx.translate(br.x, br.y); ctx.rotate(br.ang || 0);
      ctx.fillStyle = 'rgba(120,103,74,0.95)';
      ctx.fillRect(-18 * one, -8 * one, 36 * one, 16 * one);
      ctx.strokeStyle = 'rgba(224,205,160,0.9)'; ctx.lineWidth = 1.5 * one;
      ctx.strokeRect(-18 * one, -8 * one, 36 * one, 16 * one);
      ctx.restore();
    }
    // 房屋
    for (var bd = 0; bd < T.buildings.length; bd++) {
      var b = T.buildings[bd];
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.ang || 0);
      ctx.fillStyle = 'rgba(126,111,82,0.9)';
      ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
      ctx.strokeStyle = 'rgba(67,58,42,0.85)'; ctx.lineWidth = 1 * one;
      ctx.strokeRect(-b.w / 2, -b.h / 2, b.w, b.h);
      if (b.roof) {
        ctx.fillStyle = 'rgba(112,65,49,0.8)';
        ctx.beginPath(); ctx.moveTo(-b.w / 2 - 2, -b.h / 2); ctx.lineTo(0, -b.h / 2 - 6); ctx.lineTo(b.w / 2 + 2, -b.h / 2); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
    // 工事外观
    for (var fd = 0; fd < T.fortDecor.length; fd++) {
      var fd0 = T.fortDecor[fd];
      ctx.save(); ctx.translate(fd0.x, fd0.y); ctx.rotate(fd0.ang || 0);
      if (fd0.kind === 'bunker') {
        ctx.fillStyle = 'rgba(75,70,54,0.9)'; ctx.fillRect(-9, -7, 18, 14);
        ctx.strokeStyle = 'rgba(190,173,132,0.7)'; ctx.lineWidth = 1 * one; ctx.strokeRect(-9, -7, 18, 14);
        ctx.fillStyle = 'rgba(28,30,24,0.9)'; ctx.fillRect(-3, -2, 10, 4);
      } else {
        ctx.strokeStyle = 'rgba(108,94,62,0.75)'; ctx.lineWidth = 4 * one;
        ctx.beginPath(); ctx.moveTo(-12, 0); ctx.quadraticCurveTo(0, -8, 12, 0); ctx.stroke();
        ctx.strokeStyle = 'rgba(188,170,128,0.45)'; ctx.lineWidth = 1 * one; ctx.stroke();
      }
      ctx.restore();
    }
    ctx.fillStyle = 'rgba(120,128,84,0.12)';
    for (var ly = 100; ly < size; ly += 220) {
      ctx.fillRect(0, ly, size, 4);
    }
    // 简单等高线/田块
    ctx.strokeStyle = 'rgba(104,96,64,0.22)';
    ctx.lineWidth = 0.8 * one;
    for (var gx = 0; gx <= size; gx += 250) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, size); ctx.stroke();
    }
    for (var gy = 0; gy <= size; gy += 250) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(size, gy); ctx.stroke();
    }
    // 简单田块 / 林地 / 道路，避免 4km 陆地过于空
    var rnd = U.mulberry32(m.seed || 1944);
    for (var fi = 0; fi < 22; fi++) {
      var fy = 240 + rnd() * (size - 480);
      var edge = shoreSceneAt(fy) - 160;
      if (edge < 300) continue;
      var fx = 250 + rnd() * (edge - 350);
      var fw = 100 + rnd() * 240, fh = 70 + rnd() * 170;
      ctx.fillStyle = fi % 3 === 0 ? 'rgba(135,137,86,0.16)' : 'rgba(160,148,96,0.13)';
      ctx.fillRect(fx, fy, fw, fh);
      ctx.strokeStyle = 'rgba(110,104,66,0.22)';
      ctx.lineWidth = 0.8 * one;
      ctx.strokeRect(fx, fy, fw, fh);
    }
    for (var wi = 0; wi < 9; wi++) {
      var wy = 300 + rnd() * (size - 600);
      var we = shoreSceneAt(wy) - 260;
      if (we < 420) continue;
      var wx = 280 + rnd() * (we - 420);
      var wr = 70 + rnd() * 90;
      ctx.beginPath(); ctx.arc(wx, wy, wr, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(62,88,54,0.22)'; ctx.fill();
      ctx.strokeStyle = 'rgba(66,90,58,0.28)'; ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(126,112,78,0.36)';
    ctx.lineWidth = 3 * one;
    ctx.beginPath();
    ctx.moveTo(260, 500); ctx.lineTo(900, 900); ctx.lineTo(1300, 1400); ctx.lineTo(1100, 2100);
    ctx.stroke();
    ctx.lineWidth = 1.6 * one;
    ctx.strokeStyle = 'rgba(214,200,158,0.28)';
    ctx.stroke();
    ctx.restore();
    ctx.beginPath();
    if (m.waterPoly) {
      ctx.moveTo(m.waterPoly[0][0], m.waterPoly[0][1]);
      for (var wi = 1; wi < m.waterPoly.length; wi++) ctx.lineTo(m.waterPoly[wi][0], m.waterPoly[wi][1]);
      ctx.closePath();
    } else {
      for (var ci = 0; ci < m.shore.length; ci++) {
        if (ci === 0) ctx.moveTo(m.shore[ci].x, m.shore[ci].y);
        else ctx.lineTo(m.shore[ci].x, m.shore[ci].y);
      }
    }
    ctx.strokeStyle = 'rgba(238,220,170,0.9)';
    ctx.lineWidth = 5 * one;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(73,105,101,0.85)';
    ctx.lineWidth = 1.2 * one;
    ctx.stroke();

    // 方里网
    ctx.strokeStyle = 'rgba(69,82,64,0.15)';
    ctx.lineWidth = 0.55 * one;
    for (var xg = 0; xg <= size; xg += 100) {
      ctx.beginPath(); ctx.moveTo(xg, 0); ctx.lineTo(xg, size); ctx.stroke();
    }
    for (var yg = 0; yg <= size; yg += 100) {
      ctx.beginPath(); ctx.moveTo(0, yg); ctx.lineTo(size, yg); ctx.stroke();
    }

    // 海岸名称
    ctx.save();
    ctx.font = '700 ' + Math.round(16 * Math.max(0.7, one)) + 'px ' + SL.FONT_UI;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(210,230,224,0.55)';
    ctx.fillText('海  域', size * 0.82, size * 0.5);
    ctx.fillStyle = 'rgba(80,72,48,0.48)';
    ctx.fillText('陆  地', size * 0.28, size * 0.18);
    ctx.restore();
    ctx.restore();
    ctx.restore();

    // 村庄、林地、堡垒占领圈
    T.drawZones(ctx, zoom);

    // 战场内边缘长度尺：只保留黑色细线和数字
    ctx.save();
    var bw = T.size, bh = T.size;
    var tick = 200, fs = Math.max(0.8, one);
    ctx.strokeStyle = 'rgba(24,26,20,0.92)';
    ctx.fillStyle = 'rgba(24,26,20,0.92)';
    ctx.lineWidth = 1 * Math.max(0.8, fs);
    ctx.font = '600 ' + Math.round(8 * fs) + 'px ' + SL.FONT_MONO;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.strokeRect(0.5, 0.5, bw - 1, bh - 1);
    for (var rx = 0; rx <= bw; rx += tick) {
      ctx.beginPath(); ctx.moveTo(rx, bh); ctx.lineTo(rx, bh - 12 * fs); ctx.stroke();
      ctx.fillText(String(rx), rx, bh - 15 * fs);
    }
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    for (var ry = 0; ry <= bh; ry += tick) {
      ctx.beginPath(); ctx.moveTo(0, ry); ctx.lineTo(12 * fs, ry); ctx.stroke();
      ctx.fillText(String(ry), 16 * fs, ry);
    }
    ctx.restore();
  };

  function drawSite(ctx, z, zoom) {
    var one = 1 / zoom;
    var isRadar = z.kind === 'radar';
    var col = isRadar ? '#8fc9d8' : '#d6b76c';
    ctx.save();
    ctx.beginPath();
    ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2);
    ctx.fillStyle = isRadar ? 'rgba(70,130,145,0.12)' : 'rgba(150,120,48,0.10)';
    ctx.fill();
    ctx.setLineDash([6, 5]);
    ctx.strokeStyle = z.destroyed ? 'rgba(90,70,60,0.7)' : col;
    ctx.lineWidth = 1.8 * one;
    ctx.stroke();
    ctx.setLineDash([]);
    if (z.capSide && z.cap > 0.02) {
      ctx.strokeStyle = z.capSide === 'blue' ? '#548bc0' : (z.capSide === 'red' ? '#c35b4c' : '#6e9b61');
      ctx.lineWidth = 3 * one;
      ctx.beginPath();
      ctx.arc(z.x, z.y, z.r - 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, z.cap / 3));
      ctx.stroke();
    }
    // 塔/雷达符号
    ctx.translate(z.x, z.y);
    ctx.strokeStyle = z.destroyed ? 'rgba(90,74,62,0.8)' : (z.owner ? (z.owner === 'blue' ? '#7fb6e2' : '#d58672') : col);
    ctx.fillStyle = 'rgba(28,32,26,0.72)';
    ctx.lineWidth = 2 * one;
    if (isRadar) {
      ctx.beginPath(); ctx.arc(0, 0, 15 * one, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 8 * one, -0.7, 0.7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(14 * one, -4 * one); ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(-12 * one, 12 * one); ctx.lineTo(0, -15 * one); ctx.lineTo(12 * one, 12 * one); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -15 * one); ctx.lineTo(0, 12 * one); ctx.stroke();
    }
    ctx.restore();

    // 名称和血量
    ctx.save();
    ctx.font = '700 ' + Math.round(11 * Math.max(0.8, one)) + 'px ' + SL.FONT_UI;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(18,20,16,0.75)';
    ctx.strokeText(z.name, z.x, z.y - z.r - 8);
    ctx.fillStyle = z.destroyed ? '#a68b78' : (z.owner === 'blue' ? '#a9d5f2' : (z.owner === 'red' ? '#efaa98' : '#eee0b4'));
    ctx.fillText(z.name, z.x, z.y - z.r - 8);
    var bw = z.r * 1.35, bh = 3.5 * Math.max(0.8, one);
    var bx = z.x - bw / 2, by = z.y + z.r + 5;
    ctx.fillStyle = 'rgba(12,16,13,0.8)'; ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = z.destroyed ? '#6d5144' : (z.hp / z.maxHp > 0.35 ? '#d6b76c' : '#c56c55');
    ctx.fillRect(bx, by, bw * U.clamp(z.hp / z.maxHp, 0, 1), bh);
    ctx.restore();
  }

  T.drawZones = function (ctx, zoom) {
    if (!T.naval) return Base.drawZones.call(T, ctx, zoom);
    for (var i = 0; i < T.zones.length; i++) {
      var z = T.zones[i];
      if (z.site) continue;
      // 普通陆地占领圈
      var one = 1 / zoom;
      ctx.save();
      ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(104,92,58,0.08)'; ctx.fill();
      ctx.setLineDash([5, 4]); ctx.strokeStyle = '#6b6244'; ctx.lineWidth = 1.4 * one; ctx.stroke();
      ctx.setLineDash([]);
      if (z.capSide && z.cap > 0.02) {
        ctx.strokeStyle = z.capSide === 'blue' ? '#2f5f92' : (z.capSide === 'red' ? '#a63f33' : '#4f7a45');
        ctx.lineWidth = 2.4 * one;
        ctx.beginPath(); ctx.arc(z.x, z.y, z.r - 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, z.cap / 3)); ctx.stroke();
      }
      ctx.font = '700 ' + Math.round(11 * Math.max(0.8, one)) + 'px ' + SL.FONT_UI;
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(22,24,18,0.7)';
      ctx.strokeText(z.name, z.x, z.y - z.r - 5);
      ctx.fillStyle = z.owner === 'blue' ? '#b5dcf1' : (z.owner === 'red' ? '#f0b3a4' : '#e8dcc0');
      ctx.fillText(z.name, z.x, z.y - z.r - 5);
      ctx.restore();
    }
  };

  T.drawLabels = function (ctx, proj, zoom, isSeen) {
    if (!T.naval) return Base.drawLabels.call(T, ctx, proj, zoom, isSeen);
    // 海域/海岸地名由 drawGround 绘制，战略点由 drawZones 绘制
  };

  T.thumbnail = function (ctx, size) {
    if (!T.naval) return Base.thumbnail.call(T, ctx, size);
    ctx.save();
    var m = T.navalMap, off = T.sceneOffset || { x: 0, y: 0 }, s = size / T.size;
    ctx.beginPath(); ctx.rect(0, 0, size, size); ctx.clip();
    ctx.fillStyle = '#2b5260'; ctx.fillRect(0, 0, size, size);
    ctx.save();
    ctx.translate(-off.x * s, -off.y * s);
    ctx.beginPath();
    if (m.landPoly) {
      ctx.moveTo(m.landPoly[0][0] * s, m.landPoly[0][1] * s);
      for (var li = 1; li < m.landPoly.length; li++) ctx.lineTo(m.landPoly[li][0] * s, m.landPoly[li][1] * s);
      ctx.closePath();
    } else {
      ctx.moveTo(0, 0);
      for (var i = 0; i < m.shore.length; i++) ctx.lineTo(m.shore[i].x * s, m.shore[i].y * s);
      ctx.lineTo(0, T.sceneSize * s); ctx.closePath();
    }
    ctx.fillStyle = '#bcb18e'; ctx.fill();
    ctx.strokeStyle = 'rgba(238,220,170,0.9)'; ctx.lineWidth = 1.4; ctx.stroke();
    // 高地
    for (var hi = 0; hi < T.hills.length; hi++) {
      var hill = T.hills[hi];
      ctx.beginPath(); ctx.arc(hill.x * s, hill.y * s, hill.r * s, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(108,102,66,0.18)'; ctx.fill();
    }
    // 森林
    for (var fi = 0; fi < T.forests.length; fi++) {
      var f = T.forests[fi];
      ctx.beginPath(); ctx.arc(f.x * s, f.y * s, f.r * s, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(59,88,50,0.65)'; ctx.fill();
    }
    // 河流
    ctx.beginPath();
    for (var si = 0; si < T.stream.length; si++) {
      if (si === 0) ctx.moveTo(T.stream[si].x * s, T.stream[si].y * s);
      else ctx.lineTo(T.stream[si].x * s, T.stream[si].y * s);
    }
    ctx.strokeStyle = 'rgba(90,151,160,0.95)'; ctx.lineWidth = 1.8; ctx.stroke();
    // 道路
    for (var ri = 0; ri < T.roads.length; ri++) {
      var rd = T.roads[ri];
      ctx.beginPath();
      for (var rj = 0; rj < rd.length; rj++) {
        if (rj === 0) ctx.moveTo(rd[rj].x * s, rd[rj].y * s);
        else ctx.lineTo(rd[rj].x * s, rd[rj].y * s);
      }
      ctx.strokeStyle = 'rgba(120,101,66,0.7)'; ctx.lineWidth = 1.2; ctx.stroke();
    }
    // 建筑/工事
    for (var bi = 0; bi < T.buildings.length; bi++) {
      var b = T.buildings[bi];
      ctx.fillStyle = 'rgba(90,72,52,0.85)';
      ctx.fillRect(b.x * s - 1, b.y * s - 1, 2, 2);
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(28,30,24,0.9)'; ctx.lineWidth = 1;
    ctx.strokeRect(1, 1, size - 2, size - 2);
    ctx.restore();
  };

  NAVAL.Base = Base;

  /* ---------------- 战列舰 ---------------- */

  function normAngle(a) {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
  }
  function angleDiff(a, b) { return normAngle(a - b); }
  NAVAL.normAngle = normAngle;
  NAVAL.angleDiff = angleDiff;

  NAVAL.shoreDistance = function (x, y) {
    if (!T.naval) return 9999;
    if (!NAVAL.isWater(x, y)) return 0;
    return Math.max(0, x - shoreAt(y));
  };

  var shipSeq = 0;
  function makeTurret(cls, spec, side) {
    var c = SL.NAVAL.turretClasses[cls];
    return {
      cls: cls, classDef: c, lx: spec.x, ly: spec.y,
      side: spec.side || 0,
      arcCenter: spec.arcCenter != null ? spec.arcCenter : (spec.side ? spec.side * Math.PI / 2 : 0),
      angle: spec.arcCenter != null ? spec.arcCenter : (spec.side ? spec.side * Math.PI / 2 : 0),
      targetAngle: 0,
      hp: c.hp, maxHp: c.hp, destroyed: false,
      ammo: c.shots || 100, maxAmmo: c.shots || 100,
      cd: Math.random() * c.interval
    };
  }

  NAVAL.createShip = function (game, side, x, y) {
    var h = SL.NAVAL.hull;
    var ship = {
      id: 'ship' + (++shipSeq), kind: 'ship', isShip: true,
      side: side, name: h.name, x: x, y: y,
      heading: Math.PI, speed: 0, maxSpeed: h.maxSpeed,
      hp: h.hp, maxHp: h.hp, armor: h.armor, vision: h.vision,
      alive: true, selected: false, nearShore: false,
      kills: 0, score: 0,
      exposedUntil: 0, fireMode: 'free', prewarn: null,
      entering: false, entryX: x, entryY: y,
      dest: null, bombard: null, suppress: null,
      turrets: [], planeReserve: 3, planeAmmo: 3,
      supply: 0, repairPause: 0,
      lastHit: -99, target: null,
      nameTag: '欧根亲王号'
    };
    for (var i = 0; i < SL.NAVAL.mainTurrets.length; i++) ship.turrets.push(makeTurret('main', SL.NAVAL.mainTurrets[i]));
    for (var j = 0; j < SL.NAVAL.secondaryTurrets.length; j++) ship.turrets.push(makeTurret('secondary', SL.NAVAL.secondaryTurrets[j]));
    for (var k = 0; k < SL.NAVAL.aa37Turrets.length; k++) ship.turrets.push(makeTurret('aa37', SL.NAVAL.aa37Turrets[k]));
    for (var m = 0; m < SL.NAVAL.aa20Turrets.length; m++) ship.turrets.push(makeTurret('aa20', SL.NAVAL.aa20Turrets[m]));
    game.battleships.push(ship);
    return ship;
  };

  function turretWorld(ship, t) {
    var c = Math.cos(ship.heading), s = Math.sin(ship.heading);
    return { x: ship.x + c * t.lx - s * t.ly, y: ship.y + s * t.lx + c * t.ly };
  }
  NAVAL.turretWorld = turretWorld;

  function findShipAutoTarget(game, ship, cls, seaOnly) {
    var best = null, bd = Infinity;
    var maxR = cls.rangeGround || cls.range || 500;
    if (!seaOnly) {
      for (var i = 0; i < game.units.length; i++) {
        var u = game.units[i];
        if (!u.alive || u.side === ship.side) continue;
        var d = U.dist(ship.x, ship.y, u.x, u.y);
        if (d > maxR || d >= bd) continue;
        if (!game.unitVisibleTo(ship.side, u)) continue;
        best = u; bd = d;
      }
    }
    // 敌舰也是目标（主炮只对海，副炮/防空炮可自动射击）
    for (var s = 0; s < game.battleships.length; s++) {
      var es = game.battleships[s];
      if (!es.alive || es.side === ship.side) continue;
      var sd = U.dist(ship.x, ship.y, es.x, es.y);
      if (seaOnly && sd > maxR) continue;
      if (sd > maxR || sd >= bd) continue;
      if (!game.unitVisibleTo(ship.side, es)) continue;
      best = es; bd = sd;
    }
    // 副炮/机关炮/防空炮也会自动压制岸边工事和海岸炮台
    if (!seaOnly) {
      for (var zi = 0; zi < SL.Terrain.zones.length; zi++) {
        var z = SL.Terrain.zones[zi];
        if (!z || !z.owner || z.owner === ship.side || z.tempBush) continue;
        var isCoast = z.siteKind === 'coastbase';
        if (z.site && !isCoast) continue;
        if (!z.site && !z.fortified && !(z.structures && z.structures.length)) continue;
        var zd = U.dist(ship.x, ship.y, z.x, z.y);
        if (zd > maxR || zd >= bd) continue;
        if (!game.canSee(ship.side, z.x, z.y)) continue;
        best = z; bd = zd;
      }
      for (var gi = 0; gi < game.coastalGuns.length; gi++) {
        var gun = game.coastalGuns[gi];
        if (!gun || gun.side === ship.side || gun.hp <= 0) continue;
        var gd = U.dist(ship.x, ship.y, gun.x, gun.y);
        if (gd > maxR || gd >= bd) continue;
        if (!game.canSee(ship.side, gun.x, gun.y)) continue;
        best = gun; bd = gd;
      }
    }
    return best;
  }

  function allowedArc(ship, t, bearing) {
    var rel = angleDiff(bearing, ship.heading);
    var center = t.arcCenter;
    return Math.abs(angleDiff(rel, center)) <= t.classDef.arc / 2;
  }

  // 炮塔在自身射界内转动；目标位于死角/另一侧时，从射界内绕行，不穿越死角
  function rotateTurretToward(ship, t, bearing, dt) {
    var center = t.arcCenter, half = t.classDef.arc / 2;
    var relCur = angleDiff(t.angle, center);
    if (Math.abs(relCur) > half) relCur = U.clamp(relCur, -half, half);
    var relTarget = angleDiff(angleDiff(bearing, ship.heading), center);
    var desiredRel;
    if (Math.abs(relTarget) > half) desiredRel = relTarget >= 0 ? half : -half;
    else desiredRel = relTarget;
    var move = U.clamp(desiredRel - relCur, -t.classDef.turnRate * dt, t.classDef.turnRate * dt);
    t.angle = normAngle(center + relCur + move);
    t.targetAngle = normAngle(center + desiredRel);
    return t;
  }

  function fireShipShell(game, ship, t, tx, ty, targetDist, target) {
    var c = t.classDef;
    if (t.ammo <= 0) return;
    var maxR = c.range || c.rangeGround || 500;
    var towers = game.navalTowerCount ? game.navalTowerCount(ship.side) : 0;
    var spread = c.maxSpread * U.clamp((targetDist || 0) / Math.max(1, maxR), 0.08, 1) * (1 - 0.12 * towers);
    if (ship.suppress) {
      var cal = ship.suppress.calibration || 0;
      spread *= 1 - (SL.NAVAL.calibrationSpreadCap || 0.65) * cal;
    }
    if (Math.abs(ship.speed || 0) > 0.5) spread *= 1.35;
    var ang = Math.random() * Math.PI * 2;
    var rad = spread * Math.sqrt(Math.random());
    var px = U.clamp(tx + Math.cos(ang) * rad, 20, SL.CONFIG.mapSize - 20);
    var py = U.clamp(ty + Math.sin(ang) * rad, 20, SL.CONFIG.mapSize - 20);
    var from = turretWorld(ship, t);
    // 机关炮 / 防空炮为直射弹道：命中即结算，只显示曳光，不生成抛物线炮弹
    if (t.cls === 'aa37' || t.cls === 'aa20') {
      var aaAng = Math.random() * Math.PI * 2;
      var aaRad = (c.maxSpread || 0) * 0.6 * Math.sqrt(Math.random());
      var ahx = tx + Math.cos(aaAng) * aaRad;
      var ahy = ty + Math.sin(aaAng) * aaRad;
      game.effects.push({ kind: 'tracer', x1: from.x, y1: from.y, x2: ahx, y2: ahy, t: 0, dur: 0.1, side: ship.side });
      var aaHit = Math.random() < U.clamp(1 - (c.maxSpread || 0) / 600, 0.28, 0.95);
      if (aaHit) {
        if (target && target.def && target.alive) {
          game.damage(target, c.dmg, ship, c.ap);
        } else if (target && target.base) {
          target.hp -= c.dmg;
          game.damageFortifications(tx, ty, c.dmg, c.splash);
        } else if (target && (target.siteKind || target.structures || target.kind === 'fort' || target.kind === 'village' || target.kind === 'forest')) {
          game.damageFortifications(tx, ty, c.dmg, c.splash);
        } else {
          // 压制点没有具体单位时，对落点附近的敌军造成一次直射溅射
          for (var du = 0; du < game.units.length; du++) {
            var tu = game.units[du];
            if (!tu.alive || tu.side === ship.side) continue;
            if (U.dist(tu.x, tu.y, tx, ty) <= c.splash) {
              game.damage(tu, c.dmg * 0.65, ship, c.ap);
            }
          }
          game.damageFortifications(tx, ty, c.dmg, c.splash);
        }
      }
    } else {
      var sv = { caliber: t.cls === 'main' ? 203 : 105, size: 1, trail: 8 };
      if (t.cls === 'main') { sv.size = 2.8; sv.trail = 16; }
      else if (t.cls === 'secondary') { sv.size = 1.6; sv.trail = 8; }
      game.shells.push({
        x0: from.x, y0: from.y, x1: px, y1: py,
        t: 0, dur: U.clamp(U.dist(from.x, from.y, px, py) / 360 + 1.0, 1.2, 3.4),
        dmg: c.dmg, radius: c.splash,
        fortDmg: t.cls === 'main' ? 1200 : (t.cls === 'secondary' ? 450 : 80),
        ap: c.ap, mortar: true, side: ship.side, source: ship,
        shipShell: true, caliber: sv.caliber, size: sv.size, trail: sv.trail
      });
    }
    if (game.effects) game.effects.push({ kind: 'muzzle', x: from.x, y: from.y, a: ship.heading, t: 0, dur: 0.2, size: t.cls === 'main' ? 24 : 13, side: ship.side, smoke: true, heavy: t.cls === 'main' || t.cls === 'secondary' });
    if (SL.Audio) SL.Audio.shot({ dmg: c.dmg, kind: 'shell', label: c.name }, ship, false, from.x, from.y);
    t.ammo = Math.max(0, t.ammo - 1);
    t.cd = c.interval * (1 - 0.08 * towers);
    t.reloadTotal = t.cd;
    if (ship.suppress) ship.suppress.shots = (ship.suppress.shots || 0) + 1;
    if (ship.nearShore && game.time >= (ship.nextExposeRoll || 0)) {
      ship.nextExposeRoll = game.time + 1;
      if (Math.random() < (SL.NAVAL.hull.nearShoreExposeChance || 0.08)) {
        var wasExposed = ship.exposedUntil > game.time;
        ship.exposedUntil = game.time + (SL.NAVAL.hull.exposeDuration || 5);
        if (!wasExposed) {
          game.fxText(ship.x, ship.y - 20, '近岸开火暴露！', '#ffb08a');
          if (game.log) game.log(ship.name + ' 近岸开火暴露了位置', 'loss');
        }
      }
    }
  }

  NAVAL.updateShip = function (game, ship, dt) {
    if (!ship.alive) return;
    var h = SL.NAVAL.hull;
    // 登场：从地图海域边缘缓慢驶入，抵达阵位后停船
    if (ship.entering) {
      var ex = ship.entryX != null ? ship.entryX : ship.x;
      var dx = ex - ship.x;
      ship.heading = Math.PI;
      ship.speed = h.maxSpeed;
      if (Math.abs(dx) <= 3) {
        ship.x = ex;
        ship.speed = 0;
        ship.entering = false;
        if (game.log) game.log(ship.name + ' 已进入海域阵位', ship.side === 'blue' ? 'order' : 'loss');
      } else {
        ship.x += Math.sign(dx) * Math.min(Math.abs(dx), ship.speed * dt);
      }
      ship.nearShore = NAVAL.shoreDistance(ship.x, ship.y) <= h.shoreRange;
    }
    if (ship.bombard && game.time > ship.bombard.until) ship.bombard = null;
    if (ship.suppress) {
      var calNeed = SL.NAVAL.calibrationShots || 10;
      ship.suppress.calibration = Math.min(1,
        (ship.suppress.shots || 0) / calNeed + (ship.suppress.prewarnBonus || 0));
      if (game.time > ship.suppress.until) ship.suppress = null;
    }
    if (ship.suppress && game.time > ship.suppress.until) ship.suppress = null;
    var shoreD = NAVAL.shoreDistance(ship.x, ship.y);
    ship.nearShore = shoreD <= h.shoreRange;
    // 航行：加速、转向、倒船；驶入阶段保持入场航线，但接受并保留后续命令
    if (!ship.entering) {
      if (ship.dest) {
        var dx = ship.dest.x - ship.x, dy = ship.dest.y - ship.y;
        var dist = Math.hypot(dx, dy);
        if (dist < 18) {
          ship.dest = null;
        } else {
          var desired = Math.atan2(dy, dx);
          var rel = angleDiff(desired, ship.heading);
          var reverse = Math.abs(rel) > 2.35;
          if (reverse) desired = normAngle(desired + Math.PI);
          var turn = h.turnRate * dt * (1.15 - 0.3 * Math.min(1, Math.abs(ship.speed) / ship.maxSpeed));
          ship.heading = normAngle(ship.heading + U.clamp(angleDiff(desired, ship.heading), -turn, turn));
          var targetSpeed = reverse ? -h.reverseSpeed : ship.maxSpeed * (ship.nearShore ? h.nearShoreSpeed : 1);
          if (dist < 140) targetSpeed *= Math.max(0.25, dist / 140);
          var accel = h.accel * dt;
          if (ship.speed < targetSpeed) ship.speed = Math.min(targetSpeed, ship.speed + accel);
          else ship.speed = Math.max(targetSpeed, ship.speed - accel * 1.5);
        }
      } else {
        ship.speed = Math.max(0, ship.speed - h.accel * dt * 0.8);
      }
      if (Math.abs(ship.speed) > 0.01) {
        var nx = ship.x + Math.cos(ship.heading) * ship.speed * dt;
        var ny = ship.y + Math.sin(ship.heading) * ship.speed * dt;
        if (NAVAL.isWater(nx, ny)) { ship.x = nx; ship.y = ny; }
        else ship.speed *= 0.35;
      }
    }
    ship.x = U.clamp(ship.x, 30, T.size - 30);
    ship.y = U.clamp(ship.y, 30, T.size - 30);

    // 脱离交火后自动维修炮塔：1 舰体 HP 换 5 炮塔 HP
    ship.planeRecharge = (ship.planeRecharge || 0) + dt;
    if (ship.planeReserve < 3 && ship.planeRecharge > 45) {
      ship.planeRecharge = 0;
      ship.planeReserve++;
    }
    if (game.time - (ship.lastHit || -99) > 5 && ship.hp > 1) {
      for (var ti = 0; ti < ship.turrets.length; ti++) {
        var rr = ship.turrets[ti];
        if (rr.cls !== 'main') continue;
        if (rr.hp >= rr.maxHp) continue;
        var addHp = Math.min(rr.maxHp - rr.hp, 18 * dt);
        var hullCost = addHp * 0.2;
        if (ship.hp - hullCost < 1) break;
        rr.hp += addHp;
        ship.hp -= hullCost;
        if (rr.hp >= rr.maxHp) { rr.hp = rr.maxHp; rr.destroyed = false; }
      }
    }

    // 炮塔目标
    var mission = ship.suppress || ship.bombard;
    for (var ci0 = 0; ci0 < ship.turrets.length; ci0++) {
      ship.turrets[ci0].cd = Math.max(0, ship.turrets[ci0].cd - dt);
    }
    // 舰炮轰击：必须等射界内全部主炮/副炮装填并瞄准完毕
    if (ship.bombard && !ship.bombardQueue) {
      var eligible = [], allReady = true;
      for (var ei = 0; ei < ship.turrets.length; ei++) {
        var et = ship.turrets[ei];
        if (et.cls !== 'main' && et.cls !== 'secondary') continue;
        if (et.destroyed || et.ammo <= 0) { allReady = false; continue; }
        var ed = U.dist(ship.x, ship.y, ship.bombard.x, ship.bombard.y);
        var er = Math.atan2(ship.bombard.y - ship.y, ship.bombard.x - ship.x);
        if (ed > et.classDef.range || !allowedArc(ship, et, er)) continue;
        rotateTurretToward(ship, et, er, dt);
        eligible.push(et);
        if (et.cd > 0 || Math.abs(angleDiff(angleDiff(er, ship.heading), et.angle)) > 0.035) allReady = false;
      }
      if (eligible.length && allReady) ship.bombardQueue = eligible;
    }
    for (var i = 0; i < ship.turrets.length; i++) {
      var t = ship.turrets[i];
      if (t.destroyed) continue;
      if (t.ammo <= 0) continue;
      var c = t.classDef;
      var target = null, tx = 0, ty = 0;
      var preAim = false;
      if (ship.suppress) {
        var supR = c.range || c.rangeGround || 500;
        var supD = U.dist(ship.x, ship.y, mission.x, mission.y);
        if (supD <= supR) {
          tx = mission.x; ty = mission.y;
          target = { x: tx, y: ty };
        } else {
          // 射程外的炮塔不参与压制，自动寻找射程/视野内目标
          var supAuto = findShipAutoTarget(game, ship, c, t.cls === 'main');
          if (supAuto) { target = supAuto; tx = supAuto.x; ty = supAuto.y; }
        }
      } else if (mission && (t.cls === 'main' || t.cls === 'secondary')) {
        if (ship.bombard && !(ship.bombardQueue && ship.bombardQueue.indexOf(t) >= 0)) continue;
        tx = mission.x; ty = mission.y;
        target = { x: tx, y: ty };
      } else if (!mission && ship.prewarn) {
        tx = ship.prewarn.x; ty = ship.prewarn.y;
        target = { x: tx, y: ty };
        preAim = true;
      } else {
        var auto = findShipAutoTarget(game, ship, c, t.cls === 'main');
        if (auto) { target = auto; tx = auto.x; ty = auto.y; }
      }
      // 防空炮优先对空：即使地面有目标，也先打进入射界的敌机
      if (t.cls === 'aa37' || t.cls === 'aa20') {
        var bestPlane = null, bestPd = c.rangeAir;
        for (var pi = 0; pi < game.planes.length; pi++) {
          var pl = game.planes[pi];
          if (!pl || pl.side === ship.side || pl.hp <= 0) continue;
          var pd = U.dist(ship.x, ship.y, pl.x, pl.y);
          if (pd < bestPd) { bestPd = pd; bestPlane = pl; }
        }
        if (bestPlane) {
          var pbr = Math.atan2(bestPlane.y - ship.y, bestPlane.x - ship.x);
          if (allowedArc(ship, t, pbr)) {
            var pRel = angleDiff(pbr, ship.heading);
            var pDesired = t.arcCenter + U.clamp(angleDiff(pRel, t.arcCenter), -t.classDef.arc / 2, t.classDef.arc / 2);
            t.angle += U.clamp(angleDiff(pDesired, t.angle), -c.turnRate * dt, c.turnRate * dt);
            t.targetAngle = pDesired;
            if (t.cd <= 0 && t.ammo > 0) {
              t.ammo--;
              t.cd = c.interval;
              game.effects.push({ kind: 'tracer', x1: turretWorld(ship, t).x, y1: turretWorld(ship, t).y, x2: bestPlane.x, y2: bestPlane.y, t: 0, dur: 0.1, side: ship.side });
              game.damagePlane(bestPlane, c.dmg, ship);
            }
          }
          continue;
        }
        // 敌方水上飞机也是防空目标
        var engagedSeaplane = false;
        for (var si = 0; si < game.seaplanes.length; si++) {
          var sp = game.seaplanes[si];
          if (!sp || sp.side === ship.side || (sp.hp || 100) <= 0) continue;
          var spd = U.dist(ship.x, ship.y, sp.x, sp.y);
          if (spd > c.rangeAir) continue;
          var sbr = Math.atan2(sp.y - ship.y, sp.x - ship.x);
          if (!allowedArc(ship, t, sbr)) continue;
          engagedSeaplane = true;
          var sRel = angleDiff(sbr, ship.heading);
          var sDesired = t.arcCenter + U.clamp(angleDiff(sRel, t.arcCenter), -t.classDef.arc / 2, t.classDef.arc / 2);
          t.angle += U.clamp(angleDiff(sDesired, t.angle), -c.turnRate * dt, c.turnRate * dt);
          t.targetAngle = sDesired;
          if (t.cd <= 0 && t.ammo > 0) {
            t.ammo--; t.cd = c.interval;
            game.effects.push({ kind: 'tracer', x1: turretWorld(ship, t).x, y1: turretWorld(ship, t).y, x2: sp.x, y2: sp.y, t: 0, dur: 0.1, side: ship.side });
            sp.hp = (sp.hp || 100) - c.dmg;
            if (sp.hp <= 0) game.seaplanes.splice(si, 1);
          }
          break;
        }
        if (engagedSeaplane) continue;
      }
      if (!target) continue;
      var br = Math.atan2(ty - ship.y, tx - ship.x);
      var arcOk = allowedArc(ship, t, br);
      var relToShip = angleDiff(br, ship.heading);
      rotateTurretToward(ship, t, br, dt);
      var d = U.dist(ship.x, ship.y, tx, ty);
      var maxR = c.range || c.rangeGround || 500;
      t.eligible = arcOk && d <= maxR;
      if (preAim || !arcOk) continue;
      if (ship.fireMode === 'hold') continue;
      var aimErr = Math.abs(angleDiff(relToShip, t.angle));
      if (aimErr < 0.035 && d <= maxR && t.cd <= 0 && game.time >= (ship.nextFireAt || 0)) {
        fireShipShell(game, ship, t, tx, ty, d, target);
        ship.nextFireAt = game.time + 0.12;
        if (ship.bombardQueue) {
          var qi = ship.bombardQueue.indexOf(t);
          if (qi >= 0) ship.bombardQueue.splice(qi, 1);
          if (!ship.bombardQueue.length) ship.bombardQueue = null;
        }
      }
    }
  };

  NAVAL.repairTurret = function (ship, turret) {
    var h = SL.NAVAL.hull;
    if (!turret || !turret.destroyed || ship.hp <= 1) return false;
    var cost = Math.min(ship.hp - 1, turret.maxHp * h.repairHullPerTurretHp);
    var add = cost / h.repairHullPerTurretHp;
    ship.hp -= cost;
    turret.hp = Math.min(turret.maxHp, turret.hp + add);
    if (turret.hp >= turret.maxHp) { turret.destroyed = false; turret.hp = turret.maxHp; }
    return true;
  };

  NAVAL.drawSiteMarkers = function (ctx, game, proj, zoom) {
    if (!game || !game.naval) return;
    var list = (game.towers || []).concat(game.radar ? [game.radar] : []);
    if (game.coastBases) list = list.concat(game.coastBases);
    for (var i = 0; i < list.length; i++) {
      var z = list[i];
      if (!z) continue;
      var x = proj.x(z.x), y = proj.y(z.y);
      if (x < -80 || x > proj.w + 80 || y < -80 || y > proj.h + 80) continue;
      ctx.save();
      // 占领圈：通讯塔/雷达站和普通战略点一样有可见的占领范围
      var rr = z.r * zoom;
      var ownCol = z.destroyed ? 'rgba(150,115,98,0.75)'
        : (z.owner === 'blue' ? '#7fb6e2' : (z.owner === 'red' ? '#d58672' : (z.owner === 'green' ? '#8fc47c' : '#e8d59f')));
      ctx.beginPath();
      ctx.arc(x, y, rr, 0, Math.PI * 2);
      ctx.fillStyle = z.destroyed ? 'rgba(90,70,58,0.06)' : 'rgba(232,213,159,0.07)';
      ctx.fill();
      ctx.setLineDash([6, 5]);
      ctx.strokeStyle = ownCol;
      ctx.globalAlpha = z.destroyed ? 0.55 : 0.9;
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.setLineDash([]);
      if (z.capSide && z.cap > 0.02) {
        ctx.globalAlpha = 1;
        ctx.strokeStyle = z.capSide === 'blue' ? '#6ea9df' : (z.capSide === 'red' ? '#df7461' : '#7fbd6c');
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, Math.max(1, rr - 4), -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, z.cap / 3));
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.translate(x, y);
      ctx.fillStyle = z.destroyed ? 'rgba(70,55,48,0.85)' : 'rgba(22,34,32,0.88)';
      ctx.strokeStyle = z.destroyed ? 'rgba(160,120,100,0.8)' : (z.owner === 'blue' ? '#a9d5f2' : z.owner === 'red' ? '#efaa98' : '#e8d59f');
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      if (z.kind === 'radar') { ctx.arc(0, 0, 7, 0, Math.PI * 2); }
      else if (z.kind === 'coastbase') {
        ctx.rect(-7, -5, 14, 10);
        ctx.moveTo(0, 0); ctx.lineTo(13, 0);
        ctx.moveTo(0, 0); ctx.lineTo(0, 11);
      } else { ctx.moveTo(0, -8); ctx.lineTo(7, 6); ctx.lineTo(-7, 6); ctx.closePath(); }
      ctx.fill(); ctx.stroke();
      ctx.font = '700 9px ' + SL.FONT_UI;
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(14,18,14,0.85)';
      ctx.strokeText(z.name, 0, -11);
      ctx.fillStyle = z.owner === 'blue' ? '#b9dcf0' : z.owner === 'red' ? '#efb4a4' : '#e7dbc1';
      ctx.fillText(z.name, 0, -11);
      ctx.restore();
    }
  };

  NAVAL.drawFortRanges = function (ctx, game, zoom) {
    var set = (SL.SETTINGS && SL.SETTINGS.shipRanges) || {};
    if (set.enabled === false || set.fort === false) return;
    var one = 1 / zoom;
    var defs = {
      bunker: { r: SL.FORT.bunkerRange, t: '机枪碉堡' },
      mortar: { r: SL.FORT.mortarRange, t: '迫击炮阵地' },
      at_nest: { r: SL.FORT.atNestRange, t: '反坦克炮阵地' },
      flak88: { r: SL.FORT.flakAirRange, t: '88防空炮阵地' }
    };
    function ring(x, y, r, label, color) {
      ctx.save();
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.setLineDash([8, 8]);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2 * one;
      ctx.stroke();
      ctx.setLineDash([]);
      var lx = x + r * 0.70, ly = y - r * 0.70;
      ctx.font = '600 ' + Math.round(8 * Math.max(0.8, one)) + 'px ' + SL.FONT_MONO;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(18,22,18,0.65)';
      ctx.strokeText(label, lx, ly);
      ctx.fillStyle = 'rgba(218,194,126,0.95)';
      ctx.fillText(label, lx, ly);
      ctx.restore();
    }
    for (var i = 0; i < SL.Terrain.zones.length; i++) {
      var z = SL.Terrain.zones[i];
      if (!z.owner || z.site) continue;
      var structs = game.zoneStructures(z);
      for (var j = 0; j < structs.length; j++) {
        var def = defs[structs[j].type];
        if (!def) continue;
        ring(z.x, z.y, def.r, def.t + ' ' + def.r + 'm', 'rgba(200,180,126,0.55)');
      }
    }
    for (var k = 0; k < game.coastalGuns.length; k++) {
      var gun = game.coastalGuns[k];
      ring(gun.x, gun.y, gun.range, '406岸防炮 ' + (gun.range / 1000).toFixed(1) + 'km', 'rgba(222,150,100,0.55)');
    }
  };

  NAVAL.drawRadarScan = function (ctx, game, proj, zoom) {
    var radar = game && game.radar;
    if (!radar || !radar.owner || radar.destroyed || !game.radarScanActive(radar.owner)) return;
    var x = proj.x(radar.x), y = proj.y(radar.y);
    if (x < -500 || x > proj.w + 500 || y < -500 || y > proj.h + 500) return;
    var left = Math.max(0, (game.radarScanUntil[radar.owner] || 0) - game.time);
    var scanR = Math.max(32, (radar.r || 80) * zoom);
    ctx.save();
    ctx.strokeStyle = 'rgba(113,220,224,0.58)';
    ctx.lineWidth = 1.4;
    for (var k = 0; k < 2; k++) {
      var rr = scanR * (0.28 + ((game.time * 0.55 + k * 0.5) % 1) * 0.68);
      ctx.globalAlpha = 0.48 * (1 - rr / Math.max(1, scanR * 1.05));
      ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalAlpha = 0.8;
    var a = game.time * 1.8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * scanR * 0.92, y + Math.sin(a) * scanR * 0.92);
    ctx.strokeStyle = 'rgba(143,236,230,0.75)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.font = '800 11px ' + SL.FONT_MONO;
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(16,24,22,0.8)';
    ctx.strokeText('雷达扫描中 · ' + left.toFixed(1) + 's', x, y - 18);
    ctx.fillStyle = '#9fe8e2';
    ctx.fillText('雷达扫描中 · ' + left.toFixed(1) + 's', x, y - 18);
    ctx.restore();
  };

  NAVAL.drawFortificationRings = function (ctx, game, proj, zoom) {
    if (!SL.Terrain || !SL.Terrain.naval) return;
    for (var i = 0; i < SL.Terrain.zones.length; i++) {
      var z = SL.Terrain.zones[i];
      if (!z || z.tempBush) continue;
      var isCoast = z.siteKind === 'coastbase';
      if (z.site && !isCoast) continue;
      var hasRubble = !!(z.rubble || (z.rubbles && z.rubbles.length));
      if (!z.fortified && !(z.fortifyProgress > 0) && !hasRubble && !z.destroyed) continue;
      var x = proj.x(z.x), y = proj.y(z.y), r = z.r * zoom;
      if (x < -r - 40 || x > proj.w + r + 40 || y < -r - 40 || y > proj.h + r + 40) continue;
      ctx.save();
      if (z.destroyed) {
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = 'rgba(186,92,76,0.9)';
        ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.arc(x, y, r + 3, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.font = '800 11px ' + SL.FONT_MONO;
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(18,22,18,0.8)';
        ctx.strokeText('已摧毁', x, y + r + 8);
        ctx.fillStyle = '#df8d78';
        ctx.fillText('已摧毁', x, y + r + 8);
      } else if (hasRubble) {
        // 工事残骸 / 正在修复
        ctx.fillStyle = 'rgba(168,92,60,0.09)';
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        ctx.setLineDash([6, 5]);
        ctx.strokeStyle = 'rgba(214,132,92,0.9)';
        ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.arc(x, y, r + 3, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        var rubbleCount = z.rubbles ? z.rubbles.length : 1;
        var rubbleRepairing = (z.rubbleProgress || 0) > 0;
        if (rubbleRepairing) {
          ctx.strokeStyle = 'rgba(244,196,104,0.98)';
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.arc(x, y, r - 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, z.rubbleProgress));
          ctx.stroke();
        }
        ctx.font = '800 11px ' + SL.FONT_MONO;
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(18,22,18,0.8)';
        var rubbleText = (rubbleRepairing ? '修复中 ' + Math.round(z.rubbleProgress * 100) + '%' : '工事残骸') +
          (rubbleCount > 1 ? ' ×' + rubbleCount : '');
        ctx.strokeText(rubbleText, x, y + r + 8);
        ctx.fillStyle = rubbleRepairing ? '#ffdda0' : '#e3a27c';
        ctx.fillText(rubbleText, x, y + r + 8);
      } else if (z.fortified) {
        ctx.fillStyle = 'rgba(238,198,76,0.07)';
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        ctx.setLineDash([10, 6]);
        ctx.strokeStyle = 'rgba(248,207,82,0.92)';
        ctx.lineWidth = 2.6;
        ctx.beginPath(); ctx.arc(x, y, r + 4, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.font = '800 11px ' + SL.FONT_MONO;
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(18,22,18,0.8)';
        ctx.strokeText('强化工事', x, y + r + 8);
        ctx.fillStyle = '#f4d477';
        ctx.fillText('强化工事', x, y + r + 8);
      } else {
        ctx.strokeStyle = 'rgba(250,207,70,0.98)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(x, y, r - 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, z.fortifyProgress));
        ctx.stroke();
        ctx.font = '800 11px ' + SL.FONT_MONO;
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillStyle = '#ffe28a';
        ctx.fillText('强化工事 ' + Math.round(z.fortifyProgress * 100) + '%', x, y + r + 8);
      }
      ctx.restore();
    }
  };

  NAVAL.drawShipRanges = function (ctx, game, zoom) {
    if (!game || !game.battleships) return;
    var set = (SL.SETTINGS && SL.SETTINGS.shipRanges) || {};
    if (set.enabled === false) return;
    var ships = [];
    if (game.selectedShip && game.selectedShip.alive) ships.push(game.selectedShip);
    else if (set.keep) {
      for (var i = 0; i < game.battleships.length; i++) {
        if (game.battleships[i].alive && game.battleships[i].side === 'blue') ships.push(game.battleships[i]);
      }
    }
    if (!ships.length) return;
    var one = 1 / zoom;
    var classes = SL.NAVAL.turretClasses;
    for (var si = 0; si < ships.length; si++) {
      var sh = ships[si];
      var rings = [];
      if (set.main !== false) rings.push({ r: classes.main.range, c: 'rgba(226,195,108,0.55)', t: '战舰主炮 ' + (classes.main.range / 1000).toFixed(1) + 'km' });
      if (set.secondary !== false) rings.push({ r: classes.secondary.range, c: 'rgba(214,150,92,0.52)', t: '战舰副炮 ' + (classes.secondary.range / 1000).toFixed(1) + 'km' });
      if (set.aa !== false) rings.push({ r: Math.max(classes.aa37.rangeAir, classes.aa20.rangeAir), c: 'rgba(116,178,182,0.5)', t: '战舰防空 ' + Math.max(classes.aa37.rangeAir, classes.aa20.rangeAir) + 'm' });
      for (var ri = 0; ri < rings.length; ri++) {
        var ring = rings[ri];
        ctx.save();
        ctx.beginPath(); ctx.arc(sh.x, sh.y, ring.r, 0, Math.PI * 2);
        ctx.setLineDash([10, 9]);
        ctx.strokeStyle = ring.c;
        ctx.lineWidth = 1.4 * one;
        ctx.stroke();
        ctx.setLineDash([]);
        var lx = sh.x + ring.r * 0.70, ly = sh.y - ring.r * 0.70;
        ctx.font = '600 ' + Math.round(8 * Math.max(0.8, one)) + 'px ' + SL.FONT_MONO;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(18,22,18,0.65)';
        ctx.strokeText(ring.t, lx, ly);
        ctx.fillStyle = ring.c.replace(/0\.5\d?\)/, '0.95)');
        ctx.fillText(ring.t, lx, ly);
        ctx.restore();
      }
    }
  };

  NAVAL.drawShipBadges = function (ctx, game, proj, zoom) {
    for (var i = 0; i < game.battleships.length; i++) {
      var sh = game.battleships[i];
      if (!sh || !sh.alive) continue;
      if (sh.side !== 'blue' && !game.unitVisibleTo('blue', sh)) continue;
      var labels = [];
      if (sh.nearShore) labels.push({ t: '近岸支援', f: 'rgba(38,42,28,0.94)', b: 'rgba(216,196,120,0.9)', c: '#f0d58e' });
      if (sh.prewarn) labels.push({ t: '预先瞄准', f: 'rgba(24,44,42,0.94)', b: 'rgba(126,214,210,0.9)', c: '#a8e4d4' });
      if (sh.suppress) {
        var cal = (sh.suppress.calibration || 0) >= 1;
        labels.push(cal
          ? { t: '效力射', f: 'rgba(52,40,20,0.95)', b: 'rgba(240,205,120,0.95)', c: '#ffe6a0' }
          : { t: '校射', f: 'rgba(42,36,24,0.94)', b: 'rgba(196,170,110,0.9)', c: '#e8d19a' });
      }
      if (!labels.length) continue;
      var sx = proj.x(sh.x), sy = proj.y(sh.y);
      if (sx < -100 || sx > proj.w + 100 || sy < -100 || sy > proj.h + 100) continue;
      var by = sy + Math.max(28, 108 * zoom + 10);
      var font = '800 9px ' + SL.FONT_MONO;
      ctx.save();
      ctx.font = font;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      var total = 0, gap = 4;
      for (var li = 0; li < labels.length; li++) {
        labels[li].w = ctx.measureText(labels[li].t).width + 12;
        total += labels[li].w + (li ? gap : 0);
      }
      var bx = sx - total / 2;
      for (var lj = 0; lj < labels.length; lj++) {
        var lb = labels[lj];
        ctx.fillStyle = lb.f;
        ctx.strokeStyle = lb.b;
        ctx.lineWidth = 1;
        ctx.beginPath();
        var r = 3;
        ctx.moveTo(bx + r, by);
        ctx.lineTo(bx + lb.w - r, by);
        ctx.quadraticCurveTo(bx + lb.w, by, bx + lb.w, by + r);
        ctx.lineTo(bx + lb.w, by + 14 - r);
        ctx.quadraticCurveTo(bx + lb.w, by + 14, bx + lb.w - r, by + 14);
        ctx.lineTo(bx + r, by + 14);
        ctx.quadraticCurveTo(bx, by + 14, bx, by + 14 - r);
        ctx.lineTo(bx, by + r);
        ctx.quadraticCurveTo(bx, by, bx + r, by);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = lb.c;
        ctx.fillText(lb.t, bx + lb.w / 2, by + 7.5);
        bx += lb.w + gap;
      }
      ctx.restore();
    }
  };

  NAVAL.drawSupport = function (ctx, game, zoom) {
    var one = 1 / zoom;
    for (var i = 0; i < game.seaplanes.length; i++) {
      var p = game.seaplanes[i];
      ctx.save();
      if (p.ready && !p.returning) {
        ctx.beginPath(); ctx.arc(p.cx || p.x, p.cy || p.y, SL.NAVAL.seaplaneRadius || 250, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(110,196,200,0.07)'; ctx.fill();
        ctx.setLineDash([5, 5]); ctx.strokeStyle = 'rgba(126,214,210,0.75)'; ctx.lineWidth = 1.4 * one; ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.translate(p.x, p.y);
      ctx.rotate(p.heading || 0.6);
      ctx.fillStyle = 'rgba(30,42,40,0.95)';
      ctx.strokeStyle = p.side === 'blue' ? '#a9dfe0' : '#e0a58d';
      ctx.lineWidth = 1.2 * one;
      ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(-6, -4); ctx.lineTo(-3, 0); ctx.lineTo(-6, 4); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.restore();
      // 水上飞机血条
      var spHpMax = SL.NAVAL.seaplaneHp || 120;
      var spHp = Math.max(0, Math.min(1, (p.hp == null ? spHpMax : p.hp) / spHpMax));
      var sbw = 24 * one, sbh = 3 * one;
      var sby = p.y - 13 * one;
      ctx.save();
      ctx.fillStyle = 'rgba(18,24,22,0.82)';
      ctx.fillRect(p.x - sbw / 2, sby, sbw, sbh);
      ctx.fillStyle = p.side === 'blue' ? '#8fd6c8' : '#e08d72';
      ctx.fillRect(p.x - sbw / 2, sby, sbw * spHp, sbh);
      ctx.strokeStyle = 'rgba(235,240,225,0.7)';
      ctx.lineWidth = 0.8 * one;
      ctx.strokeRect(p.x - sbw / 2, sby, sbw, sbh);
      ctx.restore();
    }
    for (var j = 0; j < game.supplyShips.length; j++) {
      var s = game.supplyShips[j];
      var supR = s.r || (SL.NAVAL && SL.NAVAL.supplyRadius) || (SL.SUPPLY && SL.SUPPLY.radius) || 170;
      ctx.save();
      // 与补给卡一致的绿色补给圈
      ctx.beginPath(); ctx.arc(s.x, s.y, supR, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(92,170,120,0.10)'; ctx.fill();
      ctx.setLineDash([6, 5]);
      ctx.strokeStyle = 'rgba(132,222,162,0.78)';
      ctx.lineWidth = 1.4 * one;
      ctx.stroke();
      ctx.setLineDash([]);
      // 简易补给舰矢量线图，+X 为船头
      ctx.translate(s.x, s.y);
      ctx.rotate(s.heading != null ? s.heading : Math.PI);
      var SLEN = 68, SB = 12;
      ctx.beginPath();
      ctx.moveTo(-SLEN / 2 + 5, -SB * 0.38);
      ctx.lineTo(-SLEN / 2, -SB * 0.28);
      ctx.lineTo(-SLEN / 2, SB * 0.28);
      ctx.lineTo(-SLEN / 2 + 5, SB * 0.38);
      ctx.lineTo(SLEN * 0.22, SB / 2);
      ctx.quadraticCurveTo(SLEN * 0.40, SB * 0.34, SLEN / 2, 0);
      ctx.quadraticCurveTo(SLEN * 0.40, -SB * 0.34, SLEN * 0.22, -SB / 2);
      ctx.closePath();
      ctx.fillStyle = 'rgba(54,82,68,0.92)';
      ctx.strokeStyle = '#a6d7b8';
      ctx.lineWidth = 1.4 * one;
      ctx.fill(); ctx.stroke();
      // 甲板货箱与吊机
      ctx.fillStyle = 'rgba(122,105,62,0.85)';
      ctx.fillRect(-18, -4.5, 15, 9);
      ctx.fillRect(0, -4.5, 12, 9);
      ctx.strokeStyle = 'rgba(218,230,194,0.65)';
      ctx.lineWidth = 0.8 * one;
      ctx.strokeRect(-18, -4.5, 15, 9);
      ctx.strokeRect(0, -4.5, 12, 9);
      ctx.strokeStyle = '#d8e8c0';
      ctx.beginPath();
      ctx.moveTo(-4, 0); ctx.lineTo(-4, -8); ctx.lineTo(3, -8);
      ctx.moveTo(-4, -2); ctx.lineTo(8, -2);
      ctx.stroke();
      // 上层建筑
      ctx.fillStyle = 'rgba(35,52,43,0.98)';
      ctx.fillRect(-27, -4, 7, 8);
      ctx.strokeStyle = '#9bc6ae'; ctx.strokeRect(-27, -4, 7, 8);
      // 船头方向小箭头
      ctx.beginPath();
      ctx.moveTo(SLEN / 2 + 8, 0);
      ctx.lineTo(SLEN / 2 + 1, -3.5);
      ctx.lineTo(SLEN / 2 + 1, 3.5);
      ctx.closePath();
      ctx.fillStyle = '#b9e8c6';
      ctx.fill();
      ctx.restore();
      // 名称与血条
      ctx.save();
      ctx.font = '700 ' + Math.round(8 * Math.max(0.8, one)) + 'px ' + SL.FONT_UI;
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillStyle = '#bfe5c8';
      ctx.fillText('补给舰', s.x, s.y - 20);
      var sw = 38;
      ctx.fillStyle = 'rgba(12,20,15,0.8)';
      ctx.fillRect(s.x - sw / 2, s.y + 18, sw, 2.5);
      ctx.fillStyle = '#78c792';
      ctx.fillRect(s.x - sw / 2, s.y + 18, sw * Math.max(0, s.hp / s.maxHp), 2.5);
      ctx.restore();
    }
    for (var k = 0; k < game.battleships.length; k++) {
      var sh = game.battleships[k];
      if (sh.prewarn) {
        ctx.save();
        ctx.beginPath(); ctx.arc(sh.prewarn.x, sh.prewarn.y, SL.NAVAL.prewarnRadius || 170, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(110,196,200,0.06)'; ctx.fill();
        ctx.setLineDash([7, 5]); ctx.strokeStyle = 'rgba(126,214,210,0.8)'; ctx.lineWidth = 1.5 * one; ctx.stroke();
        ctx.setLineDash([]);
        ctx.font = '700 ' + Math.round(10 * Math.max(0.8, one)) + 'px ' + SL.FONT_UI;
        ctx.textAlign = 'center'; ctx.fillStyle = '#a8e4d4';
        ctx.fillText('预先瞄准 · F 停止', sh.prewarn.x, sh.prewarn.y - (SL.NAVAL.prewarnRadius || 170) - 8);
        ctx.restore();
      }
      if (sh.suppress) {
        var sup = sh.suppress;
        var left = Math.max(0, sup.until - game.time);
        var cal = Math.max(0, Math.min(1, sup.calibration || 0));
        ctx.save();
        ctx.beginPath(); ctx.arc(sup.x, sup.y, SL.NAVAL.suppressRadius || 260, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(211,166,82,0.06)'; ctx.fill();
        ctx.setLineDash([8, 6]); ctx.strokeStyle = 'rgba(235,195,105,0.82)'; ctx.lineWidth = 1.6 * one; ctx.stroke();
        ctx.setLineDash([]);
        ctx.font = '700 ' + Math.round(10 * Math.max(0.8, one)) + 'px ' + SL.FONT_UI;
        ctx.textAlign = 'center'; ctx.fillStyle = '#f0d58e';
        ctx.fillText((cal >= 1 ? '效力射' : '校射') + ' · ' + U.clock(left) + ' · F 停止', sup.x, sup.y - (SL.NAVAL.suppressRadius || 260) - 8);
        ctx.restore();
      }
      if (sh.bombard) {
        var m = sh.bombard;
        ctx.save();
        ctx.beginPath(); ctx.arc(m.x, m.y, m.radius || 240, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(211,166,82,0.06)'; ctx.fill();
        ctx.setLineDash([8, 6]); ctx.strokeStyle = 'rgba(235,195,105,0.8)'; ctx.lineWidth = 1.6 * one; ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(m.x - 10, m.y); ctx.lineTo(m.x + 10, m.y);
        ctx.moveTo(m.x, m.y - 10); ctx.lineTo(m.x, m.y + 10); ctx.stroke();
        ctx.restore();
      }
    }
  };

  /* 简易矢量线图：欧根亲王号俯视轮廓 */
  NAVAL.drawShip = function (ctx, game, ship, zoom) {
    if (!ship || !ship.alive) return;
    var one = 1 / zoom;
    var L = 212.5, B = 21.8;
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.heading);
    // 舰体：+X 为尖船头，-X 为平钝船尾
    ctx.beginPath();
    ctx.moveTo(-L / 2 + 7, -B * 0.30);
    ctx.quadraticCurveTo(-L * 0.42, -B / 2, -L * 0.10, -B / 2);
    ctx.lineTo(L * 0.22, -B / 2);
    ctx.quadraticCurveTo(L * 0.42, -B * 0.30, L / 2, 0);
    ctx.quadraticCurveTo(L * 0.42, B * 0.30, L * 0.22, B / 2);
    ctx.lineTo(-L * 0.10, B / 2);
    ctx.quadraticCurveTo(-L * 0.42, B / 2, -L / 2 + 7, B * 0.30);
    ctx.quadraticCurveTo(-L / 2, 0, -L / 2 + 7, -B * 0.30);
    ctx.closePath();
    ctx.fillStyle = ship.side === 'blue' ? 'rgba(54,78,83,0.88)' : 'rgba(82,57,50,0.9)';
    ctx.strokeStyle = ship.nearShore ? '#e7c87d' : (ship.side === 'blue' ? '#8fbac0' : '#ce8c78');
    ctx.lineWidth = 2.2 * one;
    ctx.fill(); ctx.stroke();
    // 甲板
    ctx.beginPath();
    ctx.ellipse(-L * 0.02, 0, L * 0.36, B * 0.34, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(118,106,78,0.5)';
    ctx.fill();
    // 上层建筑/烟囱
    ctx.fillStyle = 'rgba(48,48,40,0.9)';
    ctx.fillRect(-18, -6, 34, 12);
    ctx.fillRect(-48, -4.5, 12, 9);
    ctx.fillRect(-62, -3, 8, 6);
    ctx.strokeStyle = 'rgba(225,207,156,0.65)';
    ctx.lineWidth = 0.8 * one;
    ctx.strokeRect(-18, -6, 34, 12);

    // 炮塔
    for (var i = 0; i < ship.turrets.length; i++) {
      var t = ship.turrets[i];
      if (t.destroyed) continue;
      var c = t.classDef;
      var rad = t.cls === 'main' ? 5.8 : (t.cls === 'secondary' ? 3.2 : 1.7);
      ctx.save();
      ctx.translate(t.lx, t.ly);
      ctx.rotate(t.angle);
      ctx.fillStyle = t.cls === 'main' ? 'rgba(52,52,42,0.98)' : 'rgba(46,50,43,0.92)';
      ctx.strokeStyle = c.color;
      ctx.lineWidth = 1.1 * one;
      ctx.beginPath();
      ctx.arc(0, 0, rad, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      // 炮管
      var barrels = t.cls === 'main' || t.cls === 'secondary' ? 2 : 1;
      ctx.beginPath();
      for (var b = 0; b < barrels; b++) {
        var off = barrels === 2 ? (b ? 1.2 : -1.2) : 0;
        ctx.moveTo(rad * 0.5, off);
        ctx.lineTo(rad + (t.cls === 'main' ? 13 : 7), off);
      }
      ctx.stroke();
      if (t.eligible && (ship.prewarn || ship.suppress)) {
        ctx.strokeStyle = '#ffe5a2';
        ctx.lineWidth = 1.2 * one;
        ctx.beginPath();
        ctx.arc(0, 0, rad + 2.2, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
      // 单炮装填进度：只显示正在装填的炮塔
      if (t.cd > 0.04 && t.ammo > 0) {
        var reloadMax = t.reloadTotal || c.interval || 1;
        var rp = U.clamp(1 - t.cd / reloadMax, 0, 1);
        var bw = (t.cls === 'main' ? 10 : 6) * one;
        var bh = 1.6 * one;
        var bx = t.lx - bw / 2;
        var by = t.ly - (t.cls === 'main' ? 9 : 6) * one;
        ctx.fillStyle = 'rgba(12,16,13,0.85)';
        ctx.fillRect(bx, by, bw, bh);
        ctx.fillStyle = c.color || '#d8c17a';
        ctx.fillRect(bx, by, bw * rp, bh);
      }
    }
    // 船头方向箭头
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(L / 2 + 15, 0);
    ctx.lineTo(L / 2 + 3, -5);
    ctx.lineTo(L / 2 + 3, 5);
    ctx.closePath();
    ctx.fillStyle = ship.side === 'blue' ? 'rgba(191,235,222,0.95)' : 'rgba(244,197,170,0.95)';
    ctx.strokeStyle = 'rgba(14,24,20,0.85)';
    ctx.lineWidth = 0.8 * one;
    ctx.fill(); ctx.stroke();
    ctx.restore();
    ctx.restore();

    // 舰名与舰体血条
    var barW = 116;
    var by = ship.y - 34;
    ctx.save();
    ctx.font = '700 ' + Math.round(12 * Math.max(0.8, one)) + 'px ' + SL.FONT_UI;
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(15,20,18,0.8)';
    ctx.strokeText(ship.nameTag, ship.x, by - 5);
    ctx.fillStyle = ship.side === 'blue' ? '#c8e6df' : '#f0c2aa';
    ctx.fillText(ship.nameTag, ship.x, by - 5);
    ctx.fillStyle = 'rgba(12,18,16,0.88)';
    ctx.fillRect(ship.x - barW / 2, by, barW, 4);
    ctx.fillStyle = ship.hp / ship.maxHp > 0.35 ? '#7dd0b1' : '#d27658';
    ctx.fillRect(ship.x - barW / 2, by, barW * Math.max(0, ship.hp / ship.maxHp), 4);
    ctx.restore();

    // 仅主炮塔显示炮塔血条
    for (var k = 0; k < ship.turrets.length; k++) {
      var tt = ship.turrets[k];
      if (tt.cls !== 'main') continue;
      var tp = turretWorld(ship, tt);
      ctx.save();
      ctx.fillStyle = 'rgba(12,18,16,0.85)';
      ctx.fillRect(tp.x - 12, tp.y - 12, 24, 2.5);
      ctx.fillStyle = tt.destroyed ? 'rgba(110,70,58,0.9)' : (tt.hp / tt.maxHp > 0.3 ? '#c7b06d' : '#c56552');
      ctx.fillRect(tp.x - 12, tp.y - 12, 24 * Math.max(0, tt.hp / tt.maxHp), 2.5);
      ctx.restore();
    }
    // 状态由屏幕坐标徽章绘制，避免在世界坐标中叠一排方括号文字
  };


})(window);
