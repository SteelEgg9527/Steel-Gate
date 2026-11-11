'use strict';

const fs = require('fs');
const path = require('path');
const { startServer } = require('./lib/server');
const { launchBrowser, sleep } = require('./lib/browser');

const QA_DIR = __dirname;
const SCENARIO_DIR = path.join(QA_DIR, 'scenarios');
const ARTIFACT_ROOT = path.join(QA_DIR, 'artifacts');

function parseArgs(argv) {
  const out = { scenarios: [], list: false, keepOpen: false, screenshots: true };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--list') out.list = true;
    else if (a === '--scenario' || a === '--scenarios') out.scenarios.push(...String(argv[++i] || '').split(','));
    else if (a.startsWith('--scenario=')) out.scenarios.push(...a.slice('--scenario='.length).split(','));
    else if (a === '--base') out.base = argv[++i];
    else if (a.startsWith('--base=')) out.base = a.slice('--base='.length);
    else if (a === '--no-screenshots') out.screenshots = false;
    else if (a === '--keep-open') out.keepOpen = true;
    else if (a === '--help' || a === '-h') out.help = true;
  }
  out.scenarios = out.scenarios.map(function (s) { return s.trim(); }).filter(Boolean);
  return out;
}

function loadScenarios() {
  return fs.readdirSync(SCENARIO_DIR)
    .filter(function (f) { return f.endsWith('.js'); })
    .sort()
    .map(function (f) {
      const s = require(path.join(SCENARIO_DIR, f));
      if (!s || !s.name || typeof s.run !== 'function') throw new Error('无效场景: ' + f);
      return s;
    });
}

async function serverIsUp(base) {
  try {
    const res = await fetch(base + '/index.html', { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch (e) { return false; }
}

function timestamp() {
  const d = new Date();
  const p = function (n) { return String(n).padStart(2, '0'); };
  return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const scenarios = loadScenarios();
  if (args.help) {
    console.log('用法: node tools/qa/run.js [--list] [--scenario=name] [--base=http://127.0.0.1:8790] [--no-screenshots]');
    return;
  }
  if (args.list) {
    scenarios.forEach(function (s) { console.log(s.name + '\t' + (s.description || '')); });
    return;
  }
  const selected = args.scenarios.length ? scenarios.filter(function (s) { return args.scenarios.indexOf(s.name) >= 0; }) : scenarios;
  if (!selected.length) throw new Error('没有匹配的测试场景');

  let ownedServer = null;
  let base = args.base || process.env.QA_BASE_URL || 'http://127.0.0.1:8790';
  if (!args.base && !(await serverIsUp(base))) {
    try {
      ownedServer = await startServer({ port: 8790 });
      base = 'http://127.0.0.1:' + ownedServer.port;
      console.log('已启动静态服务器: ' + base);
    } catch (e) {
      throw new Error('无法启动静态服务器（8790 被占用？）: ' + e.message);
    }
  }
  if (!(await serverIsUp(base))) throw new Error('测试服务器不可用: ' + base);

  const runDir = path.join(ARTIFACT_ROOT, timestamp());
  fs.mkdirSync(runDir, { recursive: true });
  console.log('测试服务器: ' + base);
  console.log('截图目录: ' + runDir);
  console.log('');

  let browser = null;
  const report = { base: base, startedAt: new Date().toISOString(), scenarios: [] };
  let failed = 0;

  try {
    browser = await launchBrowser({ artifactsDir: runDir });
    for (const scenario of selected) {
      console.log('▶ ' + scenario.name + (scenario.description ? ' — ' + scenario.description : ''));
      const checks = [];
      const failures = [];
      const screenshots = [];
      const started = Date.now();
      let runtimeError = null;
      const ctx = {
        cdp: browser.cdp,
        base: base,
        artifactsDir: runDir,
        sleep: sleep,
        check: function (name, ok, detail) {
          const item = { name: name, ok: !!ok };
          if (detail !== undefined) item.detail = detail;
          checks.push(item);
          if (!ok) failures.push(name + (detail === undefined ? '' : ' :: ' + JSON.stringify(detail)));
          return !!ok;
        },
        assert: function (name, ok, detail) {
          if (!ctx.check(name, ok, detail)) throw new Error(name);
        },
        screenshot: async function (label) {
          if (!args.screenshots) return null;
          const file = path.join(runDir, scenario.name + '-' + (label || 'final') + '.png');
          await browser.cdp.screenshot(file);
          screenshots.push(file);
          return file;
        }
      };

      try {
        browser.cdp.takeErrors();
        await browser.cdp.navigate(base + (scenario.query || '/'));
        await scenario.run(ctx);
      } catch (e) {
        runtimeError = e && e.stack ? e.stack : String(e);
        try { await ctx.screenshot('failure'); } catch (e2) {}
      }

      const pageErrors = browser.cdp.takeErrors();
      if (pageErrors.length) {
        pageErrors.forEach(function (e) { failures.push('页面异常: ' + e); });
      }
      if (runtimeError) failures.push(runtimeError);
      if (!failures.length) {
        try { await ctx.screenshot('final'); } catch (e) {}
      }

      const status = failures.length ? 'FAIL' : 'PASS';
      if (failures.length) failed++;
      console.log('  [' + status + '] ' + checks.filter(function (c) { return c.ok; }).length + '/' + checks.length + ' 项断言 · ' + (Date.now() - started) + 'ms');
      failures.forEach(function (f) { console.log('    - ' + String(f).split('\n')[0]); });
      report.scenarios.push({
        name: scenario.name,
        description: scenario.description || '',
        status: status,
        durationMs: Date.now() - started,
        checks: checks,
        failures: failures,
        screenshots: screenshots,
        pageErrors: pageErrors
      });
      console.log('');
    }
  } finally {
    if (browser && !args.keepOpen) await browser.close();
    if (ownedServer) await ownedServer.close();
  }

  report.finishedAt = new Date().toISOString();
  report.passed = report.scenarios.length - failed;
  report.failed = failed;
  fs.writeFileSync(path.join(runDir, 'report.json'), JSON.stringify(report, null, 2));
  console.log('结果: ' + report.passed + ' 通过 / ' + failed + ' 失败');
  console.log('报告: ' + path.join(runDir, 'report.json'));
  process.exitCode = failed ? 1 : 0;
}

main().catch(function (e) {
  console.error(e && e.stack ? e.stack : e);
  process.exitCode = 1;
});
