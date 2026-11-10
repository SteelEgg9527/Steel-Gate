#!/usr/bin/env node
/*
 * 地图规划器 JSON -> 游戏地图模块
 *
 * 用法：
 *   node tools/map-plan-to-map.js plan.json > js/maps-plan.js
 *
 * 然后把 index.html 中的脚本顺序：
 *   <script src="js/maps.js"></script>
 *   <script src="js/maps-plan.js"></script>
 *   <script src="js/main.js"></script>
 *
 * 支持陆战（2000m）和海战（5000m）规划文件。
 */
'use strict';

const fs = require('fs');
const path = require('path');

const input = process.argv[2];
if (!input) {
  console.error('用法: node tools/map-plan-to-map.js plan.json > js/maps-plan.js');
  process.exit(1);
}

let plan;
try {
  plan = JSON.parse(fs.readFileSync(input, 'utf8'));
} catch (e) {
  console.error('无法读取/解析 JSON:', e.message);
  process.exit(1);
}
if (!plan || plan.schema !== 'steel-map-plan/v1') {
  console.error('不是地图规划器格式 (steel-map-plan/v1)');
  process.exit(1);
}

function slug(text) {
  return String(text || 'plan')
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'plan';
}
function num(v, d) { return Number.isFinite(Number(v)) ? Number(v) : d; }
function pt(p) { return { x: num(p && p.x, 0), y: num(p && p.y, 0) }; }
function pathPoints(list) { return (list || []).map(pt).filter(p => p.x >= 0 && p.y >= 0); }
function shoreAtY(shore, y) {
  if (!shore || !shore.length) return 3000;
  if (y <= shore[0].y) return shore[0].x;
  for (let i = 1; i < shore.length; i++) {
    if (y <= shore[i].y) {
      const a = shore[i - 1], b = shore[i];
      return a.x + (b.x - a.x) * ((y - a.y) / Math.max(0.001, b.y - a.y));
    }
  }
  return shore[shore.length - 1].x;
}

const id = 'plan_' + slug(plan.name);
const mode = plan.mode === 'naval' ? 'naval' : 'land';
const size = mode === 'naval' ? 5000 : num(plan.size, 2000);
if (mode === 'naval' && size !== 5000) {
  console.error('海战规划文件必须是 5000m');
  process.exit(1);
}

let map;
if (mode === 'naval') {
  const shore = [];
  for (let sy = 0; sy <= size; sy += 50) {
    let coast = Infinity;
    for (const w of (plan.water || [])) {
      const dy = sy - num(w.y, 0);
      if (Math.abs(dy) > num(w.r, 0)) continue;
      const dx = Math.sqrt(Math.max(0, num(w.r, 0) ** 2 - dy * dy));
      coast = Math.min(coast, num(w.x, 0) - dx);
    }
    if (!Number.isFinite(coast)) coast = size * 0.62;
    coast = Math.max(120, Math.min(size - 120, coast));
    shore.push({ x: coast, y: sy });
  }
  const sites = plan.sites || [];
  const byKind = kind => sites.filter(s => (s.kind || '') === kind);
  const towers = byKind('comm').map((s, i) => ({
    x: num(s.x, size / 2), y: num(s.y, size / 2), name: s.name || ('通讯塔 ' + (i + 1))
  }));
  const towerYs = [1100, 2500, 3900];
  for (let ti = 0; towers.length < 3; ti++) {
    const ty = towerYs[ti % towerYs.length];
    towers.push({ x: Math.max(140, shoreAtY(shore, ty) - 180), y: ty, name: '通讯塔 ' + (towers.length + 1) });
  }
  towers.length = 3;
  const radarSite = byKind('radar')[0];
  const radar = radarSite
    ? { x: num(radarSite.x, size / 2), y: num(radarSite.y, size / 2), name: radarSite.name || '雷达站' }
    : { x: Math.max(180, shoreAtY(shore, 2500) - 420), y: 2500, name: '雷达站' };
  const coastBases = byKind('coastbase').map((s, i) => ({
    x: num(s.x, size / 2), y: num(s.y, size / 2), name: s.name || ('海岸炮台 ' + (i + 1))
  }));
  if (!coastBases.length) {
    for (let ci = 0; ci < 4; ci++) {
      const cy = 1000 + ci * 1000;
      coastBases.push({ x: Math.max(140, shoreAtY(shore, cy) - 120), y: cy, name: '海岸炮台 ' + (ci + 1) });
    }
  }
  const ports = byKind('port').map((s, i) => ({
    x: num(s.x, size / 2), y: num(s.y, size / 2), name: s.name || ('港湾 ' + (i + 1))
  }));
  const villages = [], forts = [], forests = [];
  for (const z of (plan.zones || [])) {
    if (z.kind === 'village' || z.kind === 'town') villages.push({ x: z.x, y: z.y, r: z.r || 80, name: z.name || '村落' });
    else if (z.kind === 'fort') forts.push({ x: z.x, y: z.y, r: z.r || 60, name: z.name || '工事' });
    else if (z.kind === 'forest' || z.kind === 'bush') forests.push({ x: z.x, y: z.y, r: z.r || 70 });
  }
  for (const f of (plan.forests || [])) forests.push({ x: f.x, y: f.y, r: f.r || 80 });
  const spawns = {
    blue: plan.spawns && plan.spawns.blue ? pt(plan.spawns.blue) : { x: size * 0.12, y: size * 0.82 },
    red: plan.spawns && plan.spawns.red ? pt(plan.spawns.red) : { x: size * 0.18, y: size * 0.18 },
    green: plan.spawns && plan.spawns.green ? pt(plan.spawns.green) : { x: size * 0.42, y: size * 0.88 }
  };
  const yellow = plan.yellow
    ? { x: num(plan.yellow.x, size / 2), y: num(plan.yellow.y, size / 2), r: num(plan.yellow.r, 300) }
    : { x: size * 0.3, y: size * 0.5, r: 300 };
  const roads = (plan.roads || []).map(r => pathPoints(r.points)).filter(p => p.length >= 2);
  map = {
    id, name: plan.name || '规划器海战地图', subtitle: '地图规划器导入 · 5km 海战',
    seed: 19440901, naval: true, size, sceneSize: size,
    shore, spawns, objective: { x: radar.x, y: radar.y }, yellow,
    layout: {
      island: false, hills: [], towers, radar, coastBases, ports,
      villages, forests, forts, roads
    }
  };
} else {
  const roads = (plan.roads || []).map(r => ({
    type: r.type === 'highway' ? 'highway' : 'dirt',
    width: num(r.width, 14),
    points: pathPoints(r.points)
  })).filter(r => r.points.length >= 2);
  const zones = (plan.zones || []).map((z, i) => ({
    id: z.id || ('plan_zone_' + i),
    name: z.name || ('占领区 ' + (i + 1)),
    kind: z.kind || 'fort',
    x: num(z.x, size / 2), y: num(z.y, size / 2), r: num(z.r, 72)
  }));
  const sites = (plan.sites || []).map((s, i) => ({
    id: s.id || ('plan_site_' + i), kind: s.kind || 'comm',
    name: s.name || '站点', x: num(s.x, size / 2), y: num(s.y, size / 2),
    r: num(s.r, 72), hp: 2600
  }));
  const spawns = {
    blue: plan.spawns && plan.spawns.blue ? pt(plan.spawns.blue) : { x: size * 0.12, y: size * 0.85 },
    red: plan.spawns && plan.spawns.red ? pt(plan.spawns.red) : { x: size * 0.85, y: size * 0.15 },
    green: plan.spawns && plan.spawns.green ? pt(plan.spawns.green) : { x: size * 0.85, y: size * 0.85 }
  };
  const yellow = plan.yellow
    ? { x: num(plan.yellow.x, size / 2), y: num(plan.yellow.y, size / 2), r: num(plan.yellow.r, 300) }
    : { x: size / 2, y: size / 2, r: 300 };
  map = {
    id, name: plan.name || '规划器地图', subtitle: '地图规划器导入',
    seed: 19440901, mode: 'land', naval: false, size,
    heightRes: num(plan.height && plan.height.res, 128),
    heightGrid: (plan.height && plan.height.values) || [],
    waterAreas: plan.water || [], bridges: plan.bridges || [],
    aiLanes: plan.aiLanes || [],
    roads: roads.map(r => r.points), roadMeta: roads,
    tracks: (plan.aiLanes || []).map(r => pathPoints(r.points)).filter(p => p.length >= 2),
    streams: [], hills: [], farms: [],
    village: { x: size / 2, y: size / 2, name: '规划村' }, streamName: '',
    forests: (plan.forests || []).map((f, i) => ({
      x: num(f.x, 0), y: num(f.y, 0), r: num(f.r, 80), w: 1, name: '林地 ' + (i + 1)
    })),
    zones, sites, spawns,
    objective: { x: yellow.x, y: yellow.y }, yellow
  };
}

const out = `/* 自动生成：${path.basename(input)} */
(function () {
  'use strict';
  var SL = window.SL;
  var map = ${JSON.stringify(map, null, 2)};
  SL.MAPS.push(map);
  SL.MAP_BY_ID = SL.MAP_BY_ID || {};
  SL.MAP_BY_ID[map.id] = map;
})();
`;
process.stdout.write(out);
