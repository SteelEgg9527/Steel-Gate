# 钢铁之门 · 浏览器 QA

无第三方依赖的 Canvas2D 游戏浏览器测试工具。

测试通过 Chrome DevTools Protocol 驱动本机 Edge：

- 启动本地静态服务器
- 启动无头 Edge
- 打开指定地图和模式
- 执行游戏内 JS 检查状态
- 收集 `Runtime.exceptionThrown` 和 `console.error`
- 保存截图和 JSON 报告

## 环境

- Node.js 22+（需要内置 WebSocket / fetch）
- Microsoft Edge
- Windows 默认自动查找 Edge；其他路径可设置 `EDGE_PATH`

## 使用

在游戏仓库根目录：

```powershell
node tools/qa/run.js
```

只跑一个场景：

```powershell
node tools/qa/run.js --scenario=bomber
```

列出场景：

```powershell
node tools/qa/run.js --list
```

指定已有服务器：

```powershell
node tools/qa/run.js --base=http://127.0.0.1:8790
```

不保存截图：

```powershell
node tools/qa/run.js --no-screenshots
```

## 当前场景

| 场景 | 内容 |
|---|---|
| `deployment` | 部署界面三模式、训练地图过滤、小地图标签、敌方设定移除 |
| `training` | 训练场 10 万积分、AI 轰炸开关默认关闭/开关状态 |
| `bomber` | 预设预览、五架满挂载、出击扣费、轰炸线手柄、自动任务 |
| `naval` | 海战地图、岸防/雷达、渲染无异常 |
| `audio` | 主输出、限制器、常用音效调用无异常 |

## 产物

每次运行生成：

```text
tools/qa/artifacts/YYYYMMDD-HHmmss/
  report.json
  deployment-training.png
  bomber-aim.png
  bomber-mission.png
  ...
```

`report.json` 包含：

- 每个场景通过/失败
- 断言列表
- 页面异常
- 截图路径
- 耗时

失败场景会额外保存 `*-failure.png`。

## 添加场景

在 `tools/qa/scenarios/` 新建 `.js`：

```js
module.exports = {
  name: 'my-scenario',
  description: '说明',
  query: '/?autostart=1&map=range&mode=melee&difficulty=normal',
  run: async function (ctx) {
    await ctx.cdp.waitFor('window.__STEEL && window.__STEEL.game()', 10000);
    const state = await ctx.cdp.evaluate(`(function () {
      return { score: window.__STEEL.game().teams.blue.score };
    })()`);
    ctx.check('分数正确', state.score === 100000, state);
    await ctx.screenshot('my-scenario');
  }
};
```

`ctx` 提供：

```text
ctx.cdp.waitFor(expression, timeout)
ctx.cdp.evaluate(expression)
ctx.cdp.screenshot(file)
ctx.sleep(ms)
ctx.check(name, condition, detail)
ctx.assert(name, condition, detail)
ctx.screenshot(label)
```

## 注意

- 截图检查用于人工复核布局；当前未做像素基线对比。
- 随机地图、动画和粒子会造成像素差异，逻辑检查仍应优先。
- 每个场景使用独立页面导航，单个场景失败不会阻止后续场景。
- 静态服务器启动在 `8790`；若已有同端口服务则直接复用。
