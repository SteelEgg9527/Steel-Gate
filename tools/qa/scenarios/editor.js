'use strict';

module.exports = {
  name: 'editor',
  description: '地图编辑器：200m 固定网格、自然区域绘制、自然区域不进入占领区',
  query: '/tools/map-planner.html',
  run: async function (ctx) {
    await ctx.cdp.waitFor('window.__MAP_EDITOR__', 10000);
    const base = await ctx.cdp.evaluate(`(function(){
      var ed = window.__MAP_EDITOR__;
      var size = document.getElementById('mapSize');
      size.value = '1500';
      size.dispatchEvent(new Event('change', { bubbles: true }));
      return {
        grid: (document.getElementById('gridInfo') || {}).textContent || '',
        zoneKinds: [].map.call(document.getElementById('objectKind').options, function(o){ return o.value; }),
        terrainKinds: [].map.call(document.getElementById('terrainKind').options, function(o){ return o.value; }),
        hasTerrainState: Array.isArray(ed.state.terrainAreas)
      };
    })()`);
    ctx.check('地图网格固定为 200m', /200m × 200m/.test(base.grid), base.grid);
    ctx.check('1500m 地图使用 8×8 网格并标注末列', /8×8/.test(base.grid) && /100m/.test(base.grid), base.grid);
    ctx.check('占领区不再提供灌木/森林', base.zoneKinds.indexOf('bush') < 0 && base.zoneKinds.indexOf('forest') < 0, base.zoneKinds);
    ctx.check('自然区域提供灌木/森林/山地', base.terrainKinds.join('|') === 'bush|forest|hill', base.terrainKinds);
    ctx.check('编辑器存在 terrainAreas 状态', base.hasTerrainState);

    const draw = await ctx.cdp.evaluate(`(async function(){
      var ed = window.__MAP_EDITOR__;
      var size = ed.state.size;
      document.getElementById('terrainKind').value = 'bush';
      document.querySelector('[data-tool="terrain"]').click();
      var canvas = document.getElementById('map');
      var rect = canvas.getBoundingClientRect();
      var pts = [[300,300],[700,330],[760,700],[280,760]];
      for (var i = 0; i < pts.length; i++) {
        var x = rect.left + pts[i][0] / size * rect.width;
        var y = rect.top + pts[i][1] / size * rect.height;
        canvas.dispatchEvent(new PointerEvent('pointerdown', { button: 0, clientX: x, clientY: y, bubbles: true, pointerId: 20 + i }));
        await new Promise(function(r){ setTimeout(r, 40); });
      }
      document.getElementById('finishRoad').click();
      await new Promise(function(r){ setTimeout(r, 100); });
      var ex = ed.exportData();
      return {
        areas: ed.state.terrainAreas.length,
        kind: ed.state.terrainAreas[0] && ed.state.terrainAreas[0].kind,
        points: ed.state.terrainAreas[0] && ed.state.terrainAreas[0].points.length,
        zones: ed.state.zones.length,
        exportAreas: ex.terrainAreas ? ex.terrainAreas.length : 0
      };
    })()`);
    ctx.check('可以绘制不规则自然区域', draw.areas === 1 && draw.points >= 3, draw);
    ctx.check('自然区域保持灌木类型', draw.kind === 'bush', draw.kind);
    ctx.check('自然区域不生成占领区', draw.zones === 0, draw.zones);
    ctx.check('自然区域写入导出数据', draw.exportAreas === 1, draw.exportAreas);

    await ctx.screenshot('editor-terrain');
  }
};
