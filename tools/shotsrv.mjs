// Dev only: receives canvas frames (data URLs) from the local site and saves them as JPEGs
// for review. Not part of the build or deploy.
//   node tools/shotsrv.mjs <out-folder>
// Then in the dev page console (the testbed exposes window.__tb only under `npm run dev`):
//   const c = __tb.shot(0.6, 0), o = document.createElement('canvas');
//   o.width = 900; o.height = Math.round(900 * c.height / c.width);
//   o.getContext('2d').drawImage(c, 0, 0, o.width, o.height);
//   await fetch('http://127.0.0.1:4399', { method: 'POST', body: JSON.stringify({ name: 's3', data: o.toDataURL('image/jpeg', .85) }) });
import http from 'node:http'; import fs from 'node:fs';
const dir = process.argv[2];
if (!dir) { console.error('usage: node tools/shotsrv.mjs <out-folder>'); process.exit(1); }
fs.mkdirSync(dir, { recursive: true });
http.createServer((q, s) => {
  s.setHeader('Access-Control-Allow-Origin', '*'); s.setHeader('Access-Control-Allow-Headers', '*');
  if (q.method === 'OPTIONS') return s.end();
  let b = ''; q.on('data', c => b += c); q.on('end', () => {
    try { const { name, data } = JSON.parse(b); fs.writeFileSync(`${dir}/${name.replace(/[^\w-]/g, '')}.jpg`, Buffer.from(data.split(',')[1], 'base64')); s.end('ok'); }
    catch (e) { s.statusCode = 400; s.end(String(e)); }
  });
}).listen(4399, '127.0.0.1', () => console.log('shot server on 4399'));
