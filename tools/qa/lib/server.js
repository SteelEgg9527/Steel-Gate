'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

function createStaticServer() {
  return http.createServer(function (req, res) {
    let pathname;
    try {
      pathname = decodeURIComponent((req.url || '/').split('?')[0]);
    } catch (e) {
      res.writeHead(400); res.end('Bad request'); return;
    }
    if (pathname === '/') pathname = '/index.html';
    const file = path.resolve(ROOT, '.' + pathname);
    if (file !== ROOT && !file.startsWith(ROOT + path.sep)) {
      res.writeHead(403); res.end('Forbidden'); return;
    }
    fs.stat(file, function (err, st) {
      if (err || !st.isFile()) {
        res.writeHead(404); res.end('Not found'); return;
      }
      res.writeHead(200, {
        'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
        'Content-Length': st.size,
        'Cache-Control': 'no-store'
      });
      fs.createReadStream(file).pipe(res);
    });
  });
}

function startServer(options) {
  const opts = options || {};
  const port = opts.port == null ? 8790 : opts.port;
  return new Promise(function (resolve, reject) {
    const server = createStaticServer();
    server.once('error', reject);
    server.listen(port, '127.0.0.1', function () {
      server.removeListener('error', reject);
      resolve({
        server: server,
        port: server.address().port,
        root: ROOT,
        close: function () {
          return new Promise(function (done) { server.close(done); });
        }
      });
    });
  });
}

module.exports = { startServer: startServer, createStaticServer: createStaticServer, ROOT: ROOT };
