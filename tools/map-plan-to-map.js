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
 * 注意：生成文件只包含一个地图；若要多个地图，分别运行并合并。
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

const id = 'plan_' + slug(plan.name);
const size = num(plan.size, 2000);
const roads = (plan.roads || []).map(r => ({
  type: r.type === 'highway' ? 'highway' : 'dirt',
  width: num(r.width, 14),
  points: pathPoints(r.points)
})).filter(r => r.points.length >= 2);

const tracks = (plan.aiLanes || []).map(r => pathPoints(r.points)).filter(p => p.length >= 2);
const zones = (plan.zones || []).map((z, i) => ({
  id: z.id || ('plan_zone_' + i),
  name: z.name || ('占领区 ' + (i + 1)),
  kind: z.kind || 'fort',
  x: num(z.x, size / 2),
  y: num(z.y, size / 2),
  r: num(z.r, 72)
}));
const sites = (plan.sites || []).map((s, i) => ({
  id: s.id || ('plan_site_' + i),
  kind: s.kind || 'comm',
  name: s.name || '站点',
  x: num(s.x, size / 2),
  y: num(s.y, size / 2),
  r: num(s.r, 72),
  hp: 2600
}));
const spawns = {
  blue: plan.spawns && plan.spawns.blue ? pt(plan.spawns.blue) : { x: size * 0.12, y: size * 0.85 },
  red: plan.spawns && plan.spawns.red ? pt(plan.spawns.red) : { x: size * 0.85, y: size * 0.15 },
  green: plan.spawns && plan.spawns.green ? pt(plan.spawns.green) : { x: size * 0.85, y: size * 0.85 }
};
const yellow = plan.yellow ? { x: num(plan.yellow.x, size / 2), y: num(plan.yellow.y, size / 2), r: num(plan.yellow.r, 300) } : { x: size / 2, y: size / 2, r: 300 };

const map = {
  id: id,
  name: plan.name || '规划器地图',
  subtitle: '地图规划器导入',
  seed: 19440901,
  size: size,
  heightRes: num(plan.height && plan.height.res, 128),
  heightGrid: (plan.height && plan.height.values) || [],
  waterAreas: plan.water || [],
  bridges: plan.bridges || [],
  aiLanes: plan.aiLanes || [],
  roads: roads.map(r => r.points),
  roadMeta: roads,
  tracks: tracks,
  streams: [],
  hills: [],
  farms: [],
  village: { x: size / 2, y: size / 2, name: '规划村' },
  streamName: '',
  forests: (plan.forests || []).map((f, i) => ({
    x: num(f.x, 0), y: num(f.y, 0), r: num(f.r, 80), w: 1,
    name: '林地 ' + (i + 1)
  })),
  zones: zones,
  sites: sites,
  spawns: spawns,
  objective: { x: yellow.x, y: yellow.y },
  yellow: yellow
};

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
