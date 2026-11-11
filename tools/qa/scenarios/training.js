'use strict';

module.exports = {
  name: 'training',
  description: '训练场：10万积分、AI 轰炸开关、默认关闭',
  query: '/?autostart=1&map=range&mode=melee&difficulty=normal',
  run: async function (ctx) {
    await ctx.cdp.waitFor('window.__STEEL && window.__STEEL.game && window.__STEEL.game()', 10000);
    const base = await ctx.cdp.evaluate(`(function(){
      var g = window.__STEEL.game();
      var btn = document.getElementById('range-ai-bomb-btn');
      return {
        test: !!g.testMode,
        score: g.teams.blue.score,
        ai: !!g.trainingAIBombing,
        button: btn ? btn.textContent : '',
        visible: btn ? !btn.closest('#range-tools').classList.contains('hidden') : false
      };
    })()`);
    ctx.check('进入训练场', base.test);
    ctx.check('训练积分 100000', base.score === 100000, base.score);
    ctx.check('AI 轰炸默认关闭', base.ai === false);
    ctx.check('局内存在 AI 轰炸按钮', base.button.indexOf('AI轰炸：关') >= 0, base.button);
    ctx.check('训练工具栏可见', base.visible);

    await ctx.cdp.evaluate('document.getElementById("range-ai-bomb-btn").click()');
    const on = await ctx.cdp.evaluate(`(function(){
      var g = window.__STEEL.game();
      var btn = document.getElementById('range-ai-bomb-btn');
      return { ai: !!g.trainingAIBombing, timer: g.teams.red.airTimer, text: btn.textContent, on: btn.classList.contains('on') };
    })()`);
    ctx.check('AI 轰炸可开启', on.ai === true && on.text.indexOf('AI轰炸：开') >= 0, on);
    ctx.check('开启后首轮空袭计时约 3 秒', Math.abs(on.timer - 3) < 0.001, on.timer);

    await ctx.cdp.evaluate('document.getElementById("range-ai-bomb-btn").click()');
    const off = await ctx.cdp.evaluate(`(function(){
      var g = window.__STEEL.game();
      var btn = document.getElementById('range-ai-bomb-btn');
      return { ai: !!g.trainingAIBombing, text: btn.textContent };
    })()`);
    ctx.check('AI 轰炸可关闭', off.ai === false && off.text.indexOf('AI轰炸：关') >= 0, off);

    await ctx.screenshot('training');
  }
};
