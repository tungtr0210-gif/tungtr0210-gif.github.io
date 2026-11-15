/* TNG Plus bản web · service worker: ảnh thu nhỏ và video trên Google Drive cần mã đăng nhập,
   thẻ <img>/<video> không gửi được mã → trang gửi mã cho worker, worker gắn mã khi tải drive-thumb/<id>, drive-media/<id>. */
const DRIVE = (new URL(self.location.href).searchParams.get('drive') || 'https://www.googleapis.com') + '/drive/v3/files/'; // ?drive= chỉ dùng khi test
const THUMBS = 'tng-thumbs-v1';
let tok = { token: '', exp: 0 };

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('message', (e) => { if (e.data && e.data.type === 'token') tok = e.data.access || { token: '', exp: 0 }; });

/* worker có thể bị trình duyệt tắt khi rảnh → hỏi lại trang đang mở */
async function token(clientId) {
  if (tok.token && Date.now() < tok.exp) return tok.token;
  const list = clientId ? [await self.clients.get(clientId)] : await self.clients.matchAll({ type: 'window' });
  for (const c of list) {
    if (!c) continue;
    const t = await new Promise((resolve) => {
      const ch = new MessageChannel();
      const timer = setTimeout(() => resolve(null), 3000);
      ch.port1.onmessage = (m) => { clearTimeout(timer); resolve(m.data); };
      c.postMessage({ type: 'need-token' }, [ch.port2]);
    });
    if (t && t.token) { tok = t; return t.token; }
  }
  return '';
}
const clean = (s) => String(s || '').replace(/[^-\w]/g, '');

async function media(req, id, clientId) {
  const t = await token(clientId);
  if (!t) return new Response('', { status: 401 });
  const h = { Authorization: 'Bearer ' + t };
  const range = req.headers.get('range');
  if (range) h.Range = range;
  const res = await fetch(DRIVE + id + '?alt=media&supportsAllDrives=true', { headers: h });
  const out = new Headers();
  ['content-type', 'content-length', 'content-range', 'accept-ranges'].forEach((k) => { const v = res.headers.get(k); if (v) out.set(k, v); });
  if (!out.get('accept-ranges')) out.set('accept-ranges', 'bytes');
  return new Response(res.body, { status: res.status, headers: out });
}

async function thumb(req, id, clientId) {
  const cache = await caches.open(THUMBS);
  const key = new Request(new URL('drive-thumb/' + id, self.registration.scope).href);
  const hit = await cache.match(key);
  if (hit) return hit;
  const t = await token(clientId);
  if (!t) return new Response('', { status: 401 });
  const h = { Authorization: 'Bearer ' + t };
  const m = await (await fetch(DRIVE + id + '?supportsAllDrives=true&fields=thumbnailLink,mimeType', { headers: h })).json().catch(() => ({}));
  const link = m.thumbnailLink ? m.thumbnailLink.replace(/=s\d+$/, '=s800') : '';
  const good = (r) => r && (r.type === 'opaque' || r.ok);
  let res = null;
  // 1) ảnh thu nhỏ của Drive (nhẹ) · 2) ảnh: tải file gốc · 3) video: ảnh thu nhỏ kiểu no-cors (chỉ thẻ <img> xem được)
  if (link) { try { res = await fetch(link, { headers: h }); if (!res.ok) res = null; } catch (e) { res = null; } }
  if (!good(res) && /^image\//.test(m.mimeType || '')) { try { res = await fetch(DRIVE + id + '?alt=media&supportsAllDrives=true', { headers: h }); } catch (e) { res = null; } }
  if (!good(res) && link && req.mode === 'no-cors') { try { res = await fetch(link, { mode: 'no-cors', credentials: 'include' }); } catch (e) { res = null; } }
  if (!good(res)) return new Response('', { status: 404 });
  if (res.type !== 'opaque') {
    const buf = await res.arrayBuffer();
    const out = new Response(buf, { headers: { 'content-type': res.headers.get('content-type') || 'image/jpeg', 'cache-control': 'max-age=86400' } });
    try { await cache.put(key, out.clone()); } catch (e) { /* đầy bộ nhớ: bỏ qua */ }
    return out;
  }
  return res;
}

self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (u.origin !== self.location.origin) return;
  const m = u.pathname.match(/\/drive-(thumb|media)\/([-\w]+)$/);
  if (!m) return;
  const id = clean(m[2]);
  e.respondWith((m[1] === 'thumb' ? thumb(e.request, id, e.clientId) : media(e.request, id, e.clientId)).catch((err) => new Response(String(err && err.message || err), { status: 502 })));
});
