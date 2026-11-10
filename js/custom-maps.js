/* 钢铁之门 —— 玩家自定义地图（本机保存，不进入正式地图池） */
(function () {
  'use strict';
  var SL = window.SL;
  if (!SL) return;
  var KEY = 'steel_gate_custom_maps_v1';
  var MAX_MAPS = 12;
  var MAX_SIZE = 2000;

  function num(v, d) { return Number.isFinite(Number(v)) ? Number(v) : d; }
  function pt(p) { return { x: num(p && p.x, 0), y: num(p && p.y, 0) }; }
  function points(list) {
    return (list || []).map(pt).filter(function (p) { return p.x >= 0 && p.y >= 0; });
  }
  function slug(text) {
    return String(text || 'custom-map').toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').replace(/^-+|-+$/g, '') || 'custom-map';
  }
  function clone(v) { return JSON.parse(JSON.stringify(v)); }
  function planMode(plan) {
    return (plan && plan.mode === 'naval') ? 'naval' : 'land';
  }
  function validate(plan) {
    if (!plan || plan.schema !== 'steel-map-plan/v1') return '不是地图编辑器格式（steel-map-plan/v1）';
    var mode = planMode(plan);
    if (mode === 'naval' && num(plan.size, 5000) !== 5000) return '海战地图必须是 5000m';
    if (mode === 'land' && num(plan.size, 2000) !== MAX_SIZE) return '陆战地图目前只支持 2000m';
    if (mode === 'land' && (!plan.height || !Array.isArray(plan.height.values))) return '陆战地图缺少高度数据';
    return '';
  }
  function toMap(plan, id) {
    if (planMode(plan) === 'naval') return toNavalMap(plan, id);
    var size = MAX_SIZE;
    var roads = (plan.roads || []).map(function (r) {
      return {
        type: r.type === 'highway' ? 'highway' : 'dirt',
        width: num(r.width, 14),
        points: points(r.points)
      };
    }).filter(function (r) { return r.points.length >= 2; });
    var aiLanes = (plan.aiLanes || []).map(function (r) {
      return { type: 'ai', points: points(r.points) };
    }).filter(function (r) { return r.points.length >= 2; });
    var zones = (plan.zones || []).map(function (z, i) {
      var kind = z.kind || 'fort';
      if (['fort', 'village', 'town', 'bush', 'forest'].indexOf(kind) < 0) kind = 'fort';
      return {
        id: z.id || ('custom_zone_' + i), name: z.name || ('占领区 ' + (i + 1)),
        kind: kind, x: num(z.x, size / 2), y: num(z.y, size / 2), r: num(z.r, 72)
      };
    });
    var sites = (plan.sites || []).map(function (s, i) {
      return {
        id: s.id || ('custom_site_' + i), kind: s.kind || 'comm',
        name: s.name || '站点', x: num(s.x, size / 2), y: num(s.y, size / 2),
        r: num(s.r, 72), hp: 2600
      };
    });
    var spawns = {
      blue: plan.spawns && plan.spawns.blue ? pt(plan.spawns.blue) : { x: size * 0.12, y: size * 0.85 },
      red: plan.spawns && plan.spawns.red ? pt(plan.spawns.red) : { x: size * 0.85, y: size * 0.15 },
      green: plan.spawns && plan.spawns.green ? pt(plan.spawns.green) : { x: size * 0.85, y: size * 0.85 }
    };
    var yellow = plan.yellow ? { x: num(plan.yellow.x, size / 2), y: num(plan.yellow.y, size / 2), r: num(plan.yellow.r, 300) }
      : { x: size / 2, y: size / 2, r: 300 };
    return {
      id: id, name: plan.name || '自定义地图', subtitle: '玩家自定义 · 2km',
      custom: true, mode: 'land', naval: false, test: false, size: size,
      seed: 19440901, heightRes: num(plan.height && plan.height.res, 128),
      heightGrid: plan.height && plan.height.values ? plan.height.values.slice() : [],
      waterAreas: plan.water || [], bridges: plan.bridges || [],
      aiLanes: aiLanes.length ? aiLanes : (plan.aiLanes || []),
      roads: roads.map(function (r) { return r.points; }), roadMeta: roads,
      tracks: aiLanes.map(function (r) { return r.points; }),
      streams: [], hills: [], farms: [],
      village: { x: size / 2, y: size / 2, name: '自定义村落' },
      streamName: '',
      forests: (plan.forests || []).map(function (f, i) {
        return { x: num(f.x, 0), y: num(f.y, 0), r: num(f.r, 80), w: 1, name: '林地 ' + (i + 1) };
      }),
      zones: zones, sites: sites, spawns: spawns,
      objective: { x: yellow.x, y: yellow.y }, yellow: yellow
    };
  }
  function shoreAtY(shore, y) {
    if (!shore || !shore.length) return 3000;
    if (y <= shore[0].y) return shore[0].x;
    for (var i = 1; i < shore.length; i++) {
      if (y <= shore[i].y) {
        var a = shore[i - 1], b = shore[i];
        var t = (y - a.y) / Math.max(0.001, b.y - a.y);
        return a.x + (b.x - a.x) * t;
      }
    }
    return shore[shore.length - 1].x;
  }

  function toNavalMap(plan, id) {
    var size = 5000;
    var shore = [];
    var step = 50;
    for (var sy = 0; sy <= size; sy += step) {
      var coast = Infinity;
      for (var wi = 0; wi < (plan.water || []).length; wi++) {
        var w = plan.water[wi];
        var dy = sy - num(w.y, 0);
        if (Math.abs(dy) > num(w.r, 0)) continue;
        var dx = Math.sqrt(Math.max(0, num(w.r, 0) * num(w.r, 0) - dy * dy));
        coast = Math.min(coast, num(w.x, 0) - dx);
      }
      if (!isFinite(coast)) coast = size * 0.62;
      coast = Math.max(120, Math.min(size - 120, coast));
      shore.push({ x: coast, y: sy });
    }
    var sites = plan.sites || [];
    function siteKind(k) { return sites.filter(function (s) { return (s.kind || '') === k; }); }
    function siteObj(s, fallbackName, fallbackKind) {
      return {
        x: num(s && s.x, size / 2), y: num(s && s.y, size / 2),
        name: (s && s.name) || fallbackName, kind: fallbackKind || (s && s.kind) || 'comm'
      };
    }
    var towers = siteKind('comm').map(function (s, i) { return siteObj(s, '通讯塔 ' + (i + 1), 'comm'); });
    var towerYs = [1100, 2500, 3900];
    for (var ti = 0; towers.length < 3; ti++) {
      var ty = towerYs[ti % towerYs.length];
      towers.push({ x: Math.max(140, shoreAtY(shore, ty) - 180), y: ty, name: '通讯塔 ' + (towers.length + 1), kind: 'comm' });
    }
    towers = towers.slice(0, 3);
    var radarSite = siteKind('radar')[0];
    var radar = radarSite ? siteObj(radarSite, '雷达站', 'radar') :
      { x: Math.max(180, shoreAtY(shore, 2500) - 420), y: 2500, name: '雷达站', kind: 'radar' };
    var coastBases = siteKind('coastbase').map(function (s, i) { return siteObj(s, '海岸炮台 ' + (i + 1), 'coastbase'); });
    if (!coastBases.length) {
      for (var ci = 0; ci < 4; ci++) {
        var cy = 1000 + ci * 1000;
        coastBases.push({ x: Math.max(140, shoreAtY(shore, cy) - 120), y: cy, name: '海岸炮台 ' + (ci + 1), kind: 'coastbase' });
      }
    }
    var ports = siteKind('port').map(function (s, i) { return siteObj(s, '港湾 ' + (i + 1), 'port'); });
    var villages = [];
    var forts = [];
    var layoutForests = [];
    for (var zi = 0; zi < (plan.zones || []).length; zi++) {
      var z = plan.zones[zi];
      var zk = z.kind || 'fort';
      if (zk === 'village' || zk === 'town') villages.push({ x: z.x, y: z.y, r: z.r || 80, name: z.name || '村落' });
      else if (zk === 'fort') forts.push({ x: z.x, y: z.y, r: z.r || 60, name: z.name || '工事' });
      else if (zk === 'forest' || zk === 'bush') layoutForests.push({ x: z.x, y: z.y, r: z.r || 70 });
    }
    for (var fi = 0; fi < (plan.forests || []).length; fi++) {
      var f = plan.forests[fi];
      layoutForests.push({ x: f.x, y: f.y, r: f.r || 80 });
    }
    var spawns = {
      blue: plan.spawns && plan.spawns.blue ? pt(plan.spawns.blue) : { x: size * 0.12, y: size * 0.82 },
      red: plan.spawns && plan.spawns.red ? pt(plan.spawns.red) : { x: size * 0.18, y: size * 0.18 },
      green: plan.spawns && plan.spawns.green ? pt(plan.spawns.green) : { x: size * 0.42, y: size * 0.88 }
    };
    var yellow = plan.yellow ? { x: num(plan.yellow.x, size / 2), y: num(plan.yellow.y, size / 2), r: num(plan.yellow.r, 300) }
      : { x: size * 0.3, y: size * 0.5, r: 300 };
    return {
      id: id, name: plan.name || '自定义海战', subtitle: '玩家自定义 · 5km 海战',
      custom: true, mode: 'naval', naval: true, test: false,
      size: size, sceneSize: size, seed: 19440901,
      shore: shore,
      spawns: spawns,
      objective: { x: radar.x, y: radar.y },
      yellow: yellow,
      layout: {
        island: false,
        hills: [],
        towers: towers,
        radar: radar,
        coastBases: coastBases,
        ports: ports,
        villages: villages,
        forests: layoutForests,
        forts: forts,
        roads: (plan.roads || []).map(function (r) { return points(r.points); }).filter(function (r) { return r.length >= 2; })
      }
    };
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      var list = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list)) return [];
      return list.filter(function (e) { return e && e.id && !validate(e.plan); });
    } catch (e) { return []; }
  }
  var entries = load();

  function rebuildMaps() {
    SL.MAPS = SL.MAPS.filter(function (m) { return !m.custom; });
    SL.MAP_BY_ID = {};
    for (var i = 0; i < SL.MAPS.length; i++) SL.MAP_BY_ID[SL.MAPS[i].id] = SL.MAPS[i];
    for (var j = 0; j < entries.length; j++) {
      try {
        var m = toMap(entries[j].plan, entries[j].id);
        SL.MAPS.push(m);
        SL.MAP_BY_ID[m.id] = m;
      } catch (e) {}
    }
  }
  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(entries));
      return '';
    } catch (e) { return '本地存储空间不足，无法保存地图'; }
  }
  function newId() {
    return 'custom_' + Date.now().toString(36) + '_' + Math.floor(Math.random() * 1e5).toString(36);
  }

  var api = {
    KEY: KEY,
    list: function () { return entries.slice(); },
    get: function (id) {
      for (var i = 0; i < entries.length; i++) if (entries[i].id === id) return entries[i];
      return null;
    },
    save: function (plan, id) {
      var err = validate(plan);
      if (err) return { ok: false, error: err };
      var entry = id ? api.get(id) : null;
      if (!entry && entries.length >= MAX_MAPS) return { ok: false, error: '最多保存 ' + MAX_MAPS + ' 张自定义地图' };
      if (!entry) entry = { id: newId(), plan: null, name: '', updated: 0 };
      entry.plan = clone(plan);
      entry.name = String(plan.name || '自定义地图').slice(0, 40);
      entry.mode = planMode(plan);
      entry.updated = Date.now();
      if (!id) entries.push(entry);
      var perr = persist();
      if (perr) return { ok: false, error: perr };
      rebuildMaps();
      return { ok: true, entry: entry };
    },
    remove: function (id) {
      entries = entries.filter(function (e) { return e.id !== id; });
      persist();
      rebuildMaps();
    },
    plan: function (id) {
      var e = api.get(id);
      return e ? clone(e.plan) : null;
    },
    rebuild: rebuildMaps,
    exportPlan: function (id) {
      var e = api.get(id);
      if (!e) return false;
      var blob = new Blob([JSON.stringify(e.plan, null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = slug(e.name) + '.steelmap.json';
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
      return true;
    }
  };
  rebuildMaps();
  SL.CustomMaps = api;
})();
