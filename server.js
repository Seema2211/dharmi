require('dotenv').config();

const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT       = 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
};

function shim(req, res, body, method) {
  return {
    method,
    body,
    _status: 200,
    status(code) { this._status = code; return this; },
    setHeader(k, v) { res.setHeader(k, v); },
    end() { res.end(); },
    json(data) {
      res.writeHead(this._status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    },
  };
}

const server = http.createServer(async (req, res) => {
  // POST /api/order
  if (req.method === 'POST' && req.url === '/api/order') {
    let body = '';
    req.on('data', c => { body += c; });
    req.on('end', async () => {
      try {
        const handler = require('./api/order');
        await handler(shim(req, res, JSON.parse(body), 'POST'), shim(req, res, null, 'POST'));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // GET /api/orders
  if (req.method === 'GET' && req.url === '/api/orders') {
    try {
      const handler = require('./api/orders');
      await handler(shim(req, res, null, 'GET'), shim(req, res, null, 'GET'));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // Static files
  const filePath = path.join(PUBLIC_DIR, req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath);

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  const hasEnv = process.env.GOOGLE_CLIENT_EMAIL;
  console.log(`\n  🍦 Dharmi POS → http://localhost:${PORT}`);
  console.log(`  📋 Orders page → http://localhost:${PORT}/orders.html`);
  console.log(hasEnv
    ? '  ✅ Google Sheets env vars detected — order saving is active.'
    : '  ⚠️  No .env found — copy .env.example to .env and fill in your credentials.'
  );
  console.log('  Press Ctrl+C to stop.\n');
});
