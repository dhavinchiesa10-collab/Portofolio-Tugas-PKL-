// Server statis sederhana untuk Portfolio Dashboard
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const ROOT = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
};

const server = http.createServer(function (req, res) {
  // Normalize URL — hapus query string
  let urlPath = req.url.split('?')[0];

  // Default ke index.html
  if (urlPath === '/') urlPath = '/index.html';

  const filePath = path.join(ROOT, urlPath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  // Security: pastikan path tidak keluar dari root folder
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, function (err, data) {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 - File tidak ditemukan</h1><p>' + urlPath + '</p>');
      } else {
        res.writeHead(500);
        res.end('Server Error: ' + err.message);
      }
      return;
    }

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, function () {
  console.log('');
  console.log('╔══════════════════════════════════════╗');
  console.log('║    Portfolio Dashboard - Server OK   ║');
  console.log('╠══════════════════════════════════════╣');
  console.log('║  http://localhost:' + PORT + '               ║');
  console.log('╚══════════════════════════════════════╝');
  console.log('');
  console.log('  Buka browser ke: http://localhost:' + PORT);
  console.log('  Tekan Ctrl+C untuk berhenti');
  console.log('');
});
