'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

function edgeCandidates() {
  const out = [];
  if (process.env.EDGE_PATH) out.push(process.env.EDGE_PATH);
  const pf = process.env['ProgramFiles'] || 'C:\\Program Files';
  const pf86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
  const local = process.env['LOCALAPPDATA'] || path.join(os.homedir(), 'AppData', 'Local');
  out.push(path.join(pf86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'));
  out.push(path.join(pf, 'Microsoft', 'Edge', 'Application', 'msedge.exe'));
  out.push(path.join(local, 'Microsoft', 'Edge', 'Application', 'msedge.exe'));
  return out;
}

function findEdge() {
  const candidates = edgeCandidates();
  for (const p of candidates) {
    try { if (p && fs.existsSync(p)) return p; } catch (e) {}
  }
  return null;
}

const sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

class CDP {
  constructor(ws) {
    this.ws = ws;
    this.nextId = 0;
    this.pending = new Map();
    this.errors = [];
    this.consoleErrors = [];
    const self = this;
    ws.onmessage = function (event) {
      let msg;
      try { msg = JSON.parse(event.data); } catch (e) { return; }
      if (msg.method === 'Runtime.exceptionThrown') {
        const d = msg.params && msg.params.exceptionDetails;
        const text = d && d.exception && (d.exception.description || d.exception.value);
        self.errors.push(String(text || JSON.stringify(d || {})).slice(0, 800));
      } else if (msg.method === 'Runtime.consoleAPICalled' && msg.params && msg.params.type === 'error') {
        self.consoleErrors.push((msg.params.args || []).map(function (a) {
          return a.value != null ? String(a.value) : (a.description || '');
        }).join(' ').slice(0, 500));
      }
      if (msg.id && self.pending.has(msg.id)) {
        const p = self.pending.get(msg.id);
        self.pending.delete(msg.id);
        if (msg.error) p.reject(new Error(msg.error.message || JSON.stringify(msg.error)));
        else p.resolve(msg.result);
      }
    };
  }

  static connect(wsUrl) {
    return new Promise(function (resolve, reject) {
      const WS = globalThis.WebSocket;
      if (!WS) return reject(new Error('Node 当前版本没有 WebSocket，请使用 Node 22+'));
      const ws = new WS(wsUrl);
      ws.onopen = function () { resolve(new CDP(ws)); };
      ws.onerror = function (e) { reject(new Error('CDP WebSocket 连接失败')); };
    });
  }

  send(method, params, timeoutMs) {
    const self = this;
    const id = ++this.nextId;
    return new Promise(function (resolve, reject) {
      const timer = setTimeout(function () {
        if (self.pending.has(id)) {
          self.pending.delete(id);
          reject(new Error('CDP 超时: ' + method));
        }
      }, timeoutMs || 30000);
      self.pending.set(id, {
        resolve: function (v) { clearTimeout(timer); resolve(v); },
        reject: function (e) { clearTimeout(timer); reject(e); }
      });
      self.ws.send(JSON.stringify({ id: id, method: method, params: params || {} }));
    });
  }

  async evaluate(expression, timeoutMs) {
    const res = await this.send('Runtime.evaluate', {
      expression: expression,
      returnByValue: true,
      awaitPromise: true,
      userGesture: true
    }, timeoutMs);
    if (res && res.exceptionDetails) {
      const d = res.exceptionDetails;
      const text = d.exception && (d.exception.description || d.exception.value);
      throw new Error('页面脚本异常: ' + String(text || d.text || 'unknown'));
    }
    return res && res.result ? res.result.value : undefined;
  }

  async waitFor(expression, timeoutMs, intervalMs) {
    const deadline = Date.now() + (timeoutMs || 10000);
    let last;
    while (Date.now() < deadline) {
      try {
        if (await this.evaluate('!!(' + expression + ')')) return true;
      } catch (e) { last = e; }
      await sleep(intervalMs || 100);
    }
    throw new Error('等待条件超时: ' + expression + (last ? ' / ' + last.message : ''));
  }

  async navigate(url) {
    const res = await this.send('Page.navigate', { url: url });
    if (res && res.errorText) throw new Error('导航失败: ' + res.errorText);
    await this.waitFor('document.readyState === "complete"', 15000);
  }

  async screenshot(file) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' }, 30000);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, Buffer.from(res.data, 'base64'));
    return file;
  }

  takeErrors() {
    const all = this.errors.concat(this.consoleErrors);
    this.errors = [];
    this.consoleErrors = [];
    return all;
  }

  close() {
    try { this.ws.close(); } catch (e) {}
  }
}

async function waitForTarget(port, deadline) {
  while (Date.now() < deadline) {
    try {
      const res = await fetch('http://127.0.0.1:' + port + '/json/list');
      if (res.ok) {
        const list = await res.json();
        const page = list.find(function (x) { return x.type === 'page'; });
        if (page) return page;
      }
    } catch (e) {}
    await sleep(200);
  }
  return null;
}

async function launchBrowser(options) {
  const opts = options || {};
  const edge = opts.edgePath || findEdge();
  if (!edge) throw new Error('找不到 Edge，请设置 EDGE_PATH');
  const artifacts = opts.artifactsDir || path.join(process.cwd(), 'qa-artifacts');
  fs.mkdirSync(artifacts, { recursive: true });
  const profile = path.join(artifacts, 'edge-profile-' + Date.now() + '-' + Math.floor(Math.random() * 10000));

  let proc = null;
  let page = null;
  let port = 0;
  for (let attempt = 0; attempt < 8 && !page; attempt++) {
    port = 9400 + Math.floor(Math.random() * 500);
    const args = [
      '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
      '--disable-background-networking', '--disable-sync', '--no-sandbox',
      '--window-size=1510,900',
      '--remote-debugging-port=' + port,
      '--user-data-dir=' + profile,
      'about:blank'
    ];
    proc = spawn(edge, args, { stdio: 'ignore' });
    page = await waitForTarget(port, Date.now() + 8000);
    if (!page && proc) {
      try { proc.kill(); } catch (e) {}
    }
  }
  if (!page) throw new Error('无法启动 Edge 调试端口');
  const cdp = await CDP.connect(page.webSocketDebuggerUrl);
  await cdp.send('Runtime.enable');
  await cdp.send('Page.enable');
  await cdp.send('Log.enable').catch(function () {});

  let closed = false;
  return {
    cdp: cdp,
    port: port,
    profile: profile,
    process: proc,
    close: async function () {
      if (closed) return;
      closed = true;
      try { cdp.close(); } catch (e) {}
      if (proc && proc.pid) {
        try { proc.kill(); } catch (e) {}
        if (process.platform === 'win32') {
          try { spawnSync('taskkill', ['/PID', String(proc.pid), '/T', '/F'], { stdio: 'ignore' }); } catch (e) {}
        }
      }
      await sleep(200);
      try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) {}
    }
  };
}

module.exports = { launchBrowser: launchBrowser, findEdge: findEdge, CDP: CDP, sleep: sleep };
