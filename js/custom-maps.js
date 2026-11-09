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
  function validate(plan) {
    if (!plan || plan.schema !== 'steel-map-plan/v1') return '不是地图编辑器格式（steel-map-plan/v1）';
    if (num(plan.size, 2000) !== MAX_SIZE) return '自定义地图目前只支持 2000m 陆战地图';
    if (!plan.height || !Array.isArray(plan.height.values)) return '地图缺少高度数据';
    return '';
  }
  function toMap(plan, id) {
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
      custom: true, naval: false, test: false, size: size,
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
