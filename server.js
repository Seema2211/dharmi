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

function makeRes(res) {
  const fakeRes = {
    _status: 200,
    status(code)  { this._status = code; return this; },
    setHeader(k, v) { if (!res.headersSent) res.setHeader(k, v); },
    end()         { if (!res.headersSent) res.end(); },
    json(data)    {
      if (!res.headersSent) {
        res.writeHead(this._status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
      }
    },
  };
  return fakeRes;
}

const server = http.createServer(async (req, res) => {
  // Route all /api/* requests to the matching handler file
  if (req.url.startsWith('/api/')) {
    const apiName = req.url.replace('/api/', '').split('?')[0];
    const handlerPath = path.join(__dirname, 'api', `${apiName}.js`);

    if (!fs.existsSync(handlerPath)) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'API not found' }));
    }

    // Parse body for POST/PUT
    let body = {};
    if (req.method === 'POST' || req.method === 'PUT') {
      await new Promise(resolve => {
        let raw = '';
        req.on('data', c => { raw += c; });
        req.on('end', () => {
          try { body = JSON.parse(raw); } catch { body = {}; }
          resolve();
        });
      });
    }

    try {
      // Clear require cache so file changes reflect without restart
      delete require.cache[require.resolve(handlerPath)];
      const handler = require(handlerPath);
      const fakeReq = { method: req.method, body, url: req.url };
      await handler(fakeReq, makeRes(res));
    } catch (err) {
      console.error(`[${apiName}] Error:`, err.message);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    }
    return;
  }

  // Static files from public/
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
  console.log(`\n  🍦 Dharmi POS    → http://localhost:${PORT}`);
  console.log(`  📋 Orders page   → http://localhost:${PORT}/orders.html`);
  console.log(hasEnv
    ? '  ✅ Google Sheets connected.'
    : '  ⚠️  No .env — copy .env.example to .env and fill credentials.'
  );
  console.log('  Press Ctrl+C to stop.\n');
});
