'use strict';

module.exports = {
  name: 'audio',
  description: '音频合成链：主输出、限制器与常用音效调用无异常',
  query: '/?autostart=1&map=range&mode=melee&difficulty=normal',
  run: async function (ctx) {
    await ctx.cdp.waitFor('window.__STEEL && window.__STEEL.game && window.__STEEL.game()', 10000);
    const result = await ctx.cdp.evaluate(`(function(){
      if (!window.SL || !SL.Audio) return { ok: false, reason: 'no-audio' };
      SL.Audio.click();
      SL.Audio.shot({ dmg: 100, label: 'KwK' }, { x: 100, y: 100, side: 'blue' });
      SL.Audio.explosion(300, 100, 100);
      SL.Audio.card();
      SL.Audio.level();
      return { ok: true, muted: SL.Audio.muted, volumes: SL.Audio.volumes };
    })()`);
    ctx.check('音频模块存在', result.ok === true, result);
    ctx.check('音量在 0-1 范围', result.volumes && result.volumes.master >= 0 && result.volumes.master <= 1, result.volumes);
    await ctx.screenshot('audio');
  }
};
