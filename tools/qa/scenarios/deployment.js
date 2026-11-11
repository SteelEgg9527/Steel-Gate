'use strict';

module.exports = {
  name: 'deployment',
  description: '部署界面：三种模式、训练地图过滤、小地图标签、敌方设定已移除',
  query: '/?autostart=0&map=a&mode=melee&difficulty=normal',
  run: async function (ctx) {
    await ctx.cdp.waitFor('document.getElementById("mm-start")', 10000);
    await ctx.cdp.evaluate('(function(){var b=document.getElementById("lb-entry-later");if(b)b.click();return true;})()');
    await ctx.cdp.evaluate('document.getElementById("mm-start").click()');
    await ctx.cdp.waitFor('document.querySelectorAll("#mode-buttons .map-btn").length >= 3', 8000);

    const base = await ctx.cdp.evaluate(`(function(){
      var modes = [].map.call(document.querySelectorAll('#mode-buttons .map-btn'), function(b){ return b.textContent.trim(); });
      return {
        modes: modes,
        enemyHeading: !!document.getElementById('enemy-heading'),
        enemyForce: !!document.getElementById('enemy-force'),
        battleRules: !!document.getElementById('battle-rules'),
        trainingSettings: !!document.getElementById('training-settings'),
        minimapLabel: (document.getElementById('deploy-minimap-label') || {}).textContent || ''
      };
    })()`);
    ctx.check('模式包含混战/背水一战/训练', base.modes.join('|') === '混战|背水一战|训练', base.modes);
    ctx.check('敌方设定已移除', !base.enemyHeading && !base.enemyForce && !base.battleRules);
    ctx.check('部署界面没有训练设置', !base.trainingSettings);
    ctx.check('小地图标签为战术简图', /战术简图/.test(base.minimapLabel), base.minimapLabel);

    await ctx.cdp.evaluate(`[].find.call(document.querySelectorAll('#mode-buttons .map-btn'), function(b){ return b.textContent.trim() === '训练'; }).click()`);
    await ctx.cdp.waitFor('document.querySelectorAll("#map-buttons .map-btn").length > 0', 5000);
    const training = await ctx.cdp.evaluate(`(function(){
      return {
        maps: [].map.call(document.querySelectorAll('#map-buttons .map-btn'), function(b){ return b.textContent.trim(); }),
        label: (document.getElementById('deploy-minimap-label') || {}).textContent || ''
      };
    })()`);
    ctx.check('训练模式仅显示两张训练图', training.maps.length === 2, training.maps);
    ctx.check('训练地图为圣洛/海岸训练场', training.maps.join('|').indexOf('圣洛训练场') >= 0 && training.maps.join('|').indexOf('海岸训练场') >= 0, training.maps);
    ctx.check('训练小地图标签正确', /战术简图/.test(training.label), training.label);

    await ctx.screenshot('deployment-training');
  }
};
