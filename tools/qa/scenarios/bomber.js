'use strict';

module.exports = {
  name: 'bomber',
  description: '轰炸机：预设预览、出击结算、轰炸线手柄、自动任务',
  query: '/?autostart=1&map=range&mode=melee&difficulty=normal',
  run: async function (ctx) {
    await ctx.cdp.waitFor('window.__STEEL && window.__STEEL.game && window.__STEEL.game()', 10000);

    await ctx.cdp.evaluate('document.getElementById("air-card-config").click()');
    await ctx.cdp.waitFor('document.getElementById("bomber-config-close")', 5000);
    await ctx.sleep(200);
    await ctx.cdp.evaluate(`[].find.call(document.querySelectorAll('[data-bomber-preset]'), function(b){ return b.getAttribute('data-bomber-preset') === 'lb500'; }).click()`);
    await ctx.sleep(350);

    const preview = await ctx.cdp.evaluate(`(function(){
      var g = window.__STEEL.game();
      var b = g.bombers;
      var planes = b.formation.filter(Boolean);
      return {
        planes: planes.length,
        bombs: planes.reduce(function(n,p){ return n + p.bombs.length; }, 0),
        badges: document.querySelectorAll('#bomber-slots .bomber-plan-badge').length,
        score: g.teams.blue.score,
        cost: SL.Bomber.auto.supplyCost(g),
        unpaid: !!b.auto.unpaid,
        label: (document.getElementById('bomber-preset-current') || {}).textContent || ''
      };
    })()`);
    ctx.check('预设预览显示 5 架飞机', preview.planes === 5, preview.planes);
    ctx.check('500lb 预设共 60 枚航弹', preview.bombs === 60, preview.bombs);
    ctx.check('编组栏显示 5 个预设角标', preview.badges === 5, preview.badges);
    ctx.check('选择预设不扣分', preview.score === 100000, preview.score);
    ctx.check('出击预算为 15000', preview.cost === 15000, preview.cost);
    ctx.check('预设处于未付款状态', preview.unpaid === true);

    await ctx.cdp.evaluate('document.getElementById("bomber-config-close").click()');
    await ctx.sleep(200);
    const before = await ctx.cdp.evaluate(`(function(){
      var g = window.__STEEL.game();
      return { score: g.teams.blue.score, state: g.bombers.state };
    })()`);
    await ctx.cdp.evaluate('document.getElementById("air-card-strike").click()');
    await ctx.cdp.waitFor('window.__STEEL.game().bombers.state === "autoAim"', 3000);
    await ctx.sleep(300);

    const aim = await ctx.cdp.evaluate(`(function(){
      var g = window.__STEEL.game();
      var a = g.bombers.auto;
      return {
        state: g.bombers.state,
        timer: a.timer,
        h1: !!a._handle1,
        h2: !!a._handle2,
        start: { x: a.start.x, y: a.start.y },
        end: { x: a.end.x, y: a.end.y }
      };
    })()`);
    ctx.check('进入轰炸瞄准', aim.state === 'autoAim');
    ctx.check('倒计时约 10 秒', aim.timer > 8.5 && aim.timer <= 10, aim.timer);
    ctx.check('外置手柄已生成', aim.h1 && aim.h2);
    await ctx.screenshot('bomber-aim');

    const drag = await ctx.cdp.evaluate(`(function(){
      var g = window.__STEEL.game();
      var a = g.bombers.auto;
      var el = document.getElementById('world');
      var r = el.getBoundingClientRect();
      var h = a._handle2;
      var before = { x: a.end.x, y: a.end.y };
      el.dispatchEvent(new PointerEvent('pointerdown', { button: 0, clientX: r.left + h.x, clientY: r.top + h.y, bubbles: true, pointerId: 11 }));
      window.dispatchEvent(new PointerEvent('pointermove', { clientX: r.left + h.x + 60, clientY: r.top + h.y + 40, bubbles: true, pointerId: 11 }));
      window.dispatchEvent(new PointerEvent('pointerup', { clientX: r.left + h.x + 60, clientY: r.top + h.y + 40, bubbles: true, pointerId: 11 }));
      return { before: before, after: { x: a.end.x, y: a.end.y } };
    })()`);
    ctx.check('拖动②可改变终点', Math.abs(drag.after.x - drag.before.x) > 1 || Math.abs(drag.after.y - drag.before.y) > 1, drag);

    await ctx.sleep(10500);
    const mission = await ctx.cdp.evaluate(`(function(){
      var g = window.__STEEL.game();
      var b = g.bombers;
      var planes = b.formation.filter(Boolean);
      return {
        state: b.state,
        score: g.teams.blue.score,
        planes: planes.length,
        livePlanes: g.planes.filter(function(p){ return p.kind === 'b17'; }).length,
        bombs: planes.reduce(function(n,p){ return n + p.bombs.length; }, 0),
        unpaid: !!b.auto.unpaid,
        stage: b.auto.stage
      };
    })()`);
    ctx.check('任务进入自动执行', mission.state === 'autoMission', mission.state);
    ctx.check('出击扣除 15000', mission.score === before.score - 15000, { before: before.score, after: mission.score });
    ctx.check('任务编队为 5 架', mission.planes === 5 && mission.livePlanes === 5, mission);
    ctx.check('出击后航弹已补充', mission.bombs === 60, mission.bombs);
    ctx.check('出击后清除未付款状态', mission.unpaid === false);
    await ctx.screenshot('bomber-mission');
  }
};
