'use strict';

module.exports = {
  name: 'naval',
  description: '海战烟雾测试：地图、岸防、雷达与渲染无异常',
  query: '/?autostart=1&map=n5&mode=navalLastStand&difficulty=normal',
  run: async function (ctx) {
    await ctx.cdp.waitFor('window.__STEEL && window.__STEEL.game && window.__STEEL.game()', 10000);
    await ctx.sleep(2500);
    const state = await ctx.cdp.evaluate(`(function(){
      var g = window.__STEEL.game();
      return {
        map: SL.Terrain.map ? SL.Terrain.map.id : '',
        mode: g.mode,
        naval: !!g.naval,
        ships: g.battleships ? g.battleships.length : -1,
        aliveShips: g.battleships ? g.battleships.filter(function(s){ return s.alive; }).length : -1,
        towers: g.towers ? g.towers.length : -1,
        radar: !!g.radar,
        planes: g.planes.length,
        state: g.state
      };
    })()`);
    ctx.check('海战地图为 n5', state.map === 'n5', state.map);
    ctx.check('海战模式正确', state.mode === 'navalLastStand', state.mode);
    ctx.check('地图启用海军', state.naval === true);
    // 海战背水一战开局阶段可能还没有 AI 舰船，舰船出现由后续波次驱动
    ctx.check('存在通讯塔/雷达', state.towers > 0 && state.radar, state);
    await ctx.screenshot('naval');
  }
};
