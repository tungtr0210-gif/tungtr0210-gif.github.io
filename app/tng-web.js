/* TNG Plus 2.0.1 · bản web. Tạo bởi build/build-web.js, đừng sửa tay. */
(function () {
const WEB_VERSION = "2.0.1";
/* TNG Plus bản web · lớp giả lập vài thứ của Node để mã phần nền (src/*.js) chạy trong trình duyệt.
   build/build-web.js ghép: shims.js + các module src (bọc __def) + google-web.js + hc-web.js → tng-web.js */
const WEB_NO = 'Bản web chưa làm được việc này. Dùng app TNG Plus trên máy tính.';
const __mods = {}, __cache = {};
function __def(name, fn) { __mods[name] = fn; }
function __req(name) {
  const n = String(name).replace(/^\.\//, '').replace(/\.js$/, '');
  if (Object.prototype.hasOwnProperty.call(SHIM, n)) return SHIM[n];
  if (__cache[n]) return __cache[n].exports;
  if (!__mods[n]) throw new Error('Bản web thiếu module ' + n);
  const m = { exports: {} };
  __cache[n] = m;
  __mods[n](m, m.exports, __req);
  return m.exports;
}

/* ---------- Buffer (đủ cho util, core, xlsx) ---------- */
const TE = new TextEncoder(), TD = new TextDecoder();
function b64enc(u8) { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); }
function b64dec(s) { s = String(s).replace(/-/g, '+').replace(/_/g, '/').replace(/[^A-Za-z0-9+/]/g, ''); while (s.length % 4) s += '='; const b = atob(s); const u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
class Buffer extends Uint8Array {
  static from(x, enc) {
    if (typeof x === 'string') {
      if (enc === 'base64' || enc === 'base64url') return new Buffer(b64dec(x));
      if (enc === 'hex') { const u = new Buffer(x.length >> 1); for (let i = 0; i < u.length; i++) u[i] = parseInt(x.substr(i * 2, 2), 16); return u; }
      return new Buffer(TE.encode(x));
    }
    if (x instanceof ArrayBuffer) return new Buffer(new Uint8Array(x));
    if (ArrayBuffer.isView(x)) return new Buffer(new Uint8Array(x.buffer, x.byteOffset, x.byteLength));
    return new Buffer(Array.from(x || []));
  }
  static alloc(n) { return new Buffer(n); }
  static isBuffer(x) { return x instanceof Buffer; }
  static byteLength(s) { return typeof s === 'string' ? TE.encode(s).length : s.byteLength; }
  static concat(list) { const n = list.reduce((a, b) => a + b.length, 0); const out = new Buffer(n); let o = 0; list.forEach((b) => { out.set(b, o); o += b.length; }); return out; }
  toString(enc) {
    if (enc === 'hex') return Array.from(this, (b) => b.toString(16).padStart(2, '0')).join('');
    if (enc === 'base64') return b64enc(this);
    if (enc === 'base64url') return b64enc(this).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return TD.decode(this);
  }
  writeUInt32LE(v, o) { new DataView(this.buffer, this.byteOffset).setUint32(o, v >>> 0, true); return o + 4; }
  writeUInt16LE(v, o) { new DataView(this.buffer, this.byteOffset).setUint16(o, v & 0xffff, true); return o + 2; }
}

/* ---------- crypto: số ngẫu nhiên + sha256 (mã hóa kho tài khoản không có trên web) ---------- */
function sha256(bytes) {
  const K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
  const H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  const l = bytes.length, n = ((l + 9 + 63) >> 6) << 6, m = new Uint8Array(n);
  m.set(bytes); m[l] = 0x80;
  const dv = new DataView(m.buffer); dv.setUint32(n - 4, l * 8); dv.setUint32(n - 8, Math.floor(l / 0x20000000));
  const w = new Uint32Array(64), r = (x, c) => (x >>> c) | (x << (32 - c));
  for (let o = 0; o < n; o += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(o + i * 4);
    for (let i = 16; i < 64; i++) { const s0 = r(w[i - 15], 7) ^ r(w[i - 15], 18) ^ (w[i - 15] >>> 3), s1 = r(w[i - 2], 17) ^ r(w[i - 2], 19) ^ (w[i - 2] >>> 10); w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0; }
    let [a, b, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const t1 = (h + (r(e, 6) ^ r(e, 11) ^ r(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) | 0, t2 = ((r(a, 2) ^ r(a, 13) ^ r(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0; H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
  }
  const out = new Buffer(32); const ov = new DataView(out.buffer); H.forEach((x, i) => ov.setUint32(i * 4, x >>> 0)); return out;
}
const cryptoShim = {
  randomBytes: (n) => { const b = new Buffer(n); crypto.getRandomValues(b); return b; },
  createHash: (alg) => { if (alg !== 'sha256') throw new Error(WEB_NO); const parts = []; const h = { update: (x) => { parts.push(typeof x === 'string' ? TE.encode(x) : x); return h; }, digest: (enc) => { const d = sha256(Buffer.concat(parts)); return enc ? d.toString(enc) : d; } }; return h; },
  createCipheriv: () => { throw new Error('Kho tài khoản (mã hóa) chỉ dùng được trên app máy tính.'); },
  createDecipheriv: () => { throw new Error('Kho tài khoản (mã hóa) chỉ dùng được trên app máy tính.'); }
};

/* ---------- fs: vài file nhỏ (bộ nhớ đệm ảnh, nhật ký đăng) lưu trong localStorage ---------- */
const FSK = 'tng-web-fs:';
function enoent(p) { const e = new Error('ENOENT: ' + p); e.code = 'ENOENT'; return e; }
const fsShim = {
  readFileSync: (p) => { let v = null; try { v = localStorage.getItem(FSK + p); } catch (e) { v = null; } if (v === null) throw enoent(p); return v; },
  writeFileSync: (p, d) => { try { localStorage.setItem(FSK + p, typeof d === 'string' ? d : TD.decode(d)); } catch (e) { /* đầy bộ nhớ: bỏ qua */ } },
  existsSync: (p) => { try { return localStorage.getItem(FSK + p) !== null; } catch (e) { return false; } },
  mkdirSync: () => {},
  rm: (p, o, cb) => { try { localStorage.removeItem(FSK + p); } catch (e) { /* bỏ qua */ } if (typeof (cb || o) === 'function') (cb || o)(); },
  rmSync: (p) => { try { localStorage.removeItem(FSK + p); } catch (e) { /* bỏ qua */ } },
  statSync: (p) => { throw enoent(p); },
  createReadStream: () => { throw new Error(WEB_NO); },
  createWriteStream: () => { throw new Error(WEB_NO); },
  openSync: () => { throw new Error(WEB_NO); }
};
const pathShim = {
  sep: '/',
  join: function () { return Array.prototype.filter.call(arguments, Boolean).join('/').replace(/\/+/g, '/'); },
  basename: (p, ext) => { const b = String(p).split(/[\\/]/).pop(); return ext && b.endsWith(ext) ? b.slice(0, -ext.length) : b; },
  dirname: (p) => String(p).split(/[\\/]/).slice(0, -1).join('/') || '/',
  extname: (p) => { const m = String(p).match(/(\.[^./\\]*)$/); return m ? m[1] : ''; },
  resolve: (p) => String(p), normalize: (p) => String(p)
};
const osShim = { tmpdir: () => '/tmp', hostname: () => 'web', userInfo: () => ({ username: 'web' }), platform: () => 'web' };
const undiciShim = { fetch: (u, o) => { o = Object.assign({}, o || {}); delete o.dispatcher; return fetch(u, o); }, Agent: function Agent() {}, FormData: FormData };
const SHIM = { fs: fsShim, os: osShim, path: pathShim, crypto: cryptoShim, undici: undiciShim, http: {}, stream: {}, 'stream/promises': {} };
const process = { env: {}, platform: 'web', versions: {} };
const setImmediate = (f) => setTimeout(f, 0);

__def("constants", function (module, exports, require) {
/** Hằng số dùng chung, giữ giống Code.gs để dữ liệu nhập từ Google Sheet khớp cột. */

const POST_COLS = ['id', 'authorEmail', 'authorName', 'pageId', 'pageName', 'date', 'time', 'goal', 'topic', 'format', 'angle',
  'slogan', 'contentVi', 'contentTh', 'hashtags', 'cta', 'media', 'note', 'status', 'review', 'reviewer', 'reviewedAt',
  'ads', 'adsResult', 'fbPostId', 'link', 'postedAt', 'scheduledAt', 'error', 'createdAt', 'updatedAt', 'adsData', 'adsSyncedAt',
  'fbPosts', 'comments', 'publishMode', 'thumb', 'spacing', 'channels', 'contentIg', 'contentThreads', 'adCopy', 'channelPosts',
  /* 2.0 */ 'frame', 'visual', 'adsName', 'reviewVideo', 'review2', 'score', 'source', 'checklist', 'audit', 'returns', 'reviewMedia', 'sync', 'conflict'];

const POST_HEADERS = ['ID', 'Email người viết', 'Người viết', 'Page ID', 'Fanpage', 'Ngày đăng', 'Giờ đăng (TH)', 'Mục tiêu', 'Chủ đề',
  'Format', 'Angles', 'Slogan', 'Content tiếng Việt', 'Content tiếng Thái', 'Hashtag', 'CTA', 'Link hình/video', 'Ghi chú / tối ưu',
  'Trạng thái', 'Nhận xét đánh giá', 'Người duyệt', 'Thời gian duyệt', 'Chạy Ads?', 'Kết quả sau Ads', 'FB Post ID', 'Link bài viết',
  'Thời gian đăng', 'Hẹn đăng lúc', 'Lỗi đăng', 'Ngày tạo', 'Cập nhật', 'Dữ liệu Ads (tự động)', 'Đồng bộ Ads lúc',
  'Bài trên từng Page (tự động)', 'Bình luận của Page', 'Sau khi duyệt', 'Ảnh thu nhỏ video', 'Giãn cách đăng (JSON)', 'Kênh khác (JSON)', 'Nội dung Instagram', 'Nội dung Threads', 'Nội dung quảng cáo (JSON)', 'Kết quả kênh khác (JSON)',
  /* 2.0 */ 'Khung nội dung (TH)', 'Visual (link media)', 'Tên/ID ads', 'Góp ý video', 'Góp ý 2', 'Điểm', 'Nguồn', 'Kiểm tra trước đăng (JSON)', 'Hậu kiểm', 'Số lần trả về', 'Ảnh góp ý', 'Đồng bộ sheet (JSON)', 'Xung đột (JSON)'];

const ST = {
  TODO: 'Chưa làm', DRAFT: 'Đang làm', PENDING: 'Chờ duyệt', REVISE: 'Cần sửa', APPROVED: 'Đã duyệt',
  SCHEDULED: 'Đã hẹn giờ', POSTED: 'Đã đăng', FAILED: 'Lỗi đăng'
};
/** 8 trạng thái của 2.0, theo thứ tự trong ô chọn của sheet */
const STATUSES = ['Chưa làm', 'Đang làm', 'Chờ duyệt', 'Cần sửa', 'Đã duyệt', 'Đã hẹn giờ', 'Đã đăng', 'Lỗi đăng'];
const ROLE = { LEADER: 'Leader', STAFF: 'Nhân viên' };

const OPTIONS = {
  goals: ['Traffic', 'Trust', 'Lead', 'Bán hàng'],
  formats: ['1 ảnh', 'Album ảnh', 'Carousel', 'Video', 'Reels', 'Story'],
  manualFormats: ['Reels', 'Story'],
  topics: ['Sản phẩm & sản xuất', 'Kỷ niệm & quà tặng', 'Cột mốc & thành tựu', 'Mẫu tranh & trang trí',
    'Khách hàng thực tế', 'Tư vấn & kiểm chứng', 'Ưu đãi & bán hàng']
};

const EDITABLE = ['pageId', 'date', 'time', 'goal', 'topic', 'format', 'angle', 'slogan', 'contentVi', 'contentTh',
  'hashtags', 'cta', 'media', 'note', 'comments', 'publishMode', 'thumb', 'spacing', 'channels', 'contentIg', 'contentThreads', 'adCopy',
  'frame', 'visual', 'ads', 'adsResult', 'adsName', 'checklist'];

module.exports = { POST_COLS, POST_HEADERS, ST, STATUSES, ROLE, OPTIONS, EDITABLE };

});
__def("util", function (module, exports, require) {
/** Tiện ích thời gian theo giờ Thái (UTC+7), giống Code.gs. */
const TZ_OFF = 7 * 3600e3;

function fmt(d) { return new Date(d.getTime() + TZ_OFF).toISOString().slice(0, 16).replace('T', ' '); }

function stampId() {
  const s = new Date(Date.now() + TZ_OFF).toISOString();
  return s.slice(2, 4) + s.slice(5, 7) + s.slice(8, 10) + s.slice(11, 13) + s.slice(14, 16) + s.slice(17, 19);
}

function parseThaiTime(date, time) {
  const d = String(date || '').trim(), t = String(time || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || !/^\d{1,2}:\d{2}$/.test(t)) throw new Error('Ngày/giờ đăng không đúng dạng.');
  const hhmm = t.length === 4 ? '0' + t : t;
  return new Date(d + 'T' + hhmm + ':00+07:00');
}

function parseStamp(s) {
  const m = String(s).match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})/);
  return m ? new Date(m[1] + 'T' + m[2] + ':00+07:00') : new Date(8640000000000000);
}

function parseJson(s, d) {
  try { return s ? JSON.parse(s) : (d === undefined ? {} : d); } catch (e) { return d === undefined ? {} : d; }
}

module.exports = { fmt, stampId, parseThaiTime, parseStamp, parseJson };

});
__def("store", function (module, exports, require) {
/**
 * Dữ liệu chung của team nằm trong file Google Sheet "đăng bài tự động", cùng cấu trúc tab APP_* như bản Apps Script.
 * Đọc gộp một lần (values:batchGet), giữ tạm trong bộ nhớ vài giây cho nhanh.
 */
const { POST_COLS, POST_HEADERS } = require('./constants');

const TABS = { POSTS: 'APP_BAI_VIET', USERS: 'APP_NHAN_SU', PAGES: 'APP_FANPAGE', LOG: 'APP_NHAT_KY', CFG: 'APP_CAI_DAT', TOPIC: 'HƯỚNG DẪN CHỦ ĐỀ', TAG: 'HASHTAG & CTA' };
const HEAD = {
  APP_BAI_VIET: POST_HEADERS,
  APP_NHAN_SU: ['Email', 'Tên', 'Vai trò', 'Đang hoạt động', 'Ngày thêm', 'Quyền (JSON)', 'Vai trò chi tiết', 'Chế độ đăng', 'Quyền duyệt', 'KPI/ngày', 'Tab trong sheet', 'Ngày rời dự án', 'Tạm khóa'],
  APP_FANPAGE: ['Page ID', 'Tên Page', 'Hiện cho nhân viên', 'Cập nhật token'],
  APP_NHAT_KY: ['Thời gian', 'Email', 'Hành động', 'ID bài', 'Chi tiết'],
  APP_CAI_DAT: ['Khóa', 'Giá trị'],
  /* 1.6 quảng cáo */
  APP_QC_SO_LIEU: ['Khóa (khoảng|TK)', 'ID TK', 'Dữ liệu (JSON)', 'Cập nhật'],
  APP_KHAC_PHUC: ['ID TK', 'Trạng thái', 'Bước đã làm (JSON)', 'Nhật ký (JSON)', 'Cập nhật', 'Ghi chú'],
  /* tài khoản + hộp thư */
  APP_TAI_KHOAN: ['ID', 'Loại', 'UID/Username', 'Tên gợi nhớ', 'PIC', 'Loại via', 'ID/Tên TKQC', 'Tình trạng', 'Thông tin đăng nhập (mã hóa)', 'Ngày thêm', 'Ghi chú', 'Người thêm', 'Cập nhật'],
  APP_NHAT_KY_XEM: ['Thời gian', 'Email', 'Hành động', 'ID', 'UID/Username', 'Mục'],
  APP_HOP_THU: ['ID mục', 'Loại', 'Page', 'Trạng thái', 'Người xử lý', 'Lúc']
};

function col(n) { let s = ''; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; }
const LAST = col(POST_COLS.length); // AK

module.exports = function createStore(google, getSheetId) {
  const sh = google.sheets;
  const R = (tab, a1) => sh.q(tab) + (a1 ? '!' + a1 : '');
  let tabsCache = null, tabsAt = 0;
  let cache = null, cacheAt = 0;

  async function tabs(force) {
    if (!tabsCache || force || Date.now() - tabsAt > 300e3) { tabsCache = await sh.tabs(getSheetId()); tabsAt = Date.now(); }
    return tabsCache;
  }
  async function tabId(name) { const t = (await tabs()).filter((x) => x.title === name)[0]; if (!t) throw new Error('Thiếu tab ' + name + ' trong file Sheet.'); return t.sheetId; }

  /** Tạo các tab còn thiếu (leader chạy lần đầu). */
  async function ensureTabs() {
    const have = (await tabs(true)).map((t) => t.title);
    const miss = Object.keys(HEAD).filter((n) => have.indexOf(n) < 0);
    if (miss.length) {
      await sh.batchUpdate(getSheetId(), miss.map((n) => ({ addSheet: { properties: { title: n, gridProperties: { frozenRowCount: 1 } } } })));
      await sh.batchUpdateValues(getSheetId(), miss.map((n) => ({ range: R(n, 'A1'), values: [HEAD[n]] })));
      await tabs(true);
    } else {
      // tab bài viết có từ bản cũ: bổ sung tiêu đề cột mới nếu thiếu
      const head = (await sh.get(getSheetId(), R(TABS.POSTS, 'A1:' + LAST + '1')))[0] || [];
      if (head.length < POST_HEADERS.length) await sh.update(getSheetId(), R(TABS.POSTS, 'A1:' + LAST + '1'), [POST_HEADERS]);
      const uh = (await sh.get(getSheetId(), R(TABS.USERS, 'A1:M1')))[0] || [];
      if (uh.length < HEAD.APP_NHAN_SU.length) await sh.update(getSheetId(), R(TABS.USERS, 'A1:M1'), [HEAD.APP_NHAN_SU]);
    }
    return miss;
  }

  async function load(force) {
    if (cache && !force && Date.now() - cacheAt < 8000) return cache;
    const have = (await tabs(force)).map((t) => t.title);
    const want = [[TABS.POSTS, 'A1:' + LAST], [TABS.USERS, 'A2:M'], [TABS.PAGES, 'A2:D'], [TABS.CFG, 'A2:B'], [TABS.TOPIC, 'A4:E30'], [TABS.TAG, 'A2:F']];
    const ask = want.filter((w) => have.indexOf(w[0]) >= 0);
    const got = ask.length ? await sh.batchGet(getSheetId(), ask.map((w) => R(w[0], w[1]))) : [];
    const by = {};
    ask.forEach((w, i) => { by[w[0]] = got[i]; });

    const prow = by[TABS.POSTS] || [];
    const head = (prow[0] || []).map((h) => String(h).trim());
    const idx = POST_COLS.map((c, i) => { const k = head.indexOf(POST_HEADERS[i]); return k >= 0 ? k : i; });
    const posts = [];
    prow.slice(1).forEach((r, i) => {
      const o = { _row: i + 2 };
      POST_COLS.forEach((c, j) => { const v = r[idx[j]]; o[c] = v == null ? '' : String(v); });
      o.pageId = o.pageId.replace(/^'/, '');
      if (o.goal === 'lead') o.goal = 'Lead';
      if (o.id) posts.push(o);
    });
    const users = (by[TABS.USERS] || []).map((r, i) => ({ _row: i + 2, email: String(r[0] || '').trim().toLowerCase(), name: r[1] || r[0], role: r[2] === 'Leader' ? 'Leader' : 'Nhân viên', active: r[3] !== 'FALSE', addedAt: r[4] || '', perms: (() => { try { return r[5] ? JSON.parse(r[5]) : null; } catch (e) { return null; } })(),
      /* 2.0 */ job: r[6] || (r[2] === 'Leader' ? 'Quản lý' : 'Content'), mode: r[7] === 'Tự đăng' ? 'Tự đăng' : 'Cần duyệt', canReview: r[8] === 'TRUE', kpi: r[9] === '' || r[9] == null ? 5 : Number(r[9]) || 0, tab: r[10] || '', leftAt: r[11] || '', locked: r[12] === 'TRUE' }))
      .filter((u) => u.email);
    const pages = (by[TABS.PAGES] || []).map((r, i) => ({ _row: i + 2, id: String(r[0] || '').replace(/^'/, '').trim(), name: r[1] || '', enabled: r[2] !== 'FALSE', updatedAt: r[3] || '' }))
      .filter((p) => p.id);
    const cfg = {};
    (by[TABS.CFG] || []).forEach((r, i) => { if (r[0]) cfg[r[0]] = { value: r[1] || '', row: i + 2 }; });
    const topics = (by[TABS.TOPIC] || []).map((r) => ({ name: r[0], when: r[1] || '', includes: r[2] || '', examples: r[3] || '', diff: r[4] || '' })).filter((t) => t.name);
    const tags = (by[TABS.TAG] || []).filter((r) => r[3] || r[4]).map((r) => ({ group: r[1] || '', tagVi: r[2] || '', tagTh: r[3] || '', ctaTh: r[4] || '', ctaVi: r[5] || '' }));
    cache = { posts, users, pages, cfg, topics, tags, hasTabs: have };
    cacheAt = Date.now();
    return cache;
  }
  function invalidate() { cache = null; }

  /** Tìm số dòng theo cột A (đọc mới mỗi lần để không ghi nhầm khi người khác vừa thêm/xóa dòng). */
  async function rowOf(tab, key, lower) {
    const ids = await sh.get(getSheetId(), R(tab, 'A:A'));
    for (let i = 1; i < ids.length; i++) {
      let v = String((ids[i] || [])[0] || '').replace(/^'/, '').trim();
      if (lower) v = v.toLowerCase();
      if (v === key) return i + 1;
    }
    return 0;
  }
  async function rowsOf(tab, keys) {
    const ids = await sh.get(getSheetId(), R(tab, 'A:A'));
    const out = [];
    for (let i = 1; i < ids.length; i++) if (keys.indexOf(String((ids[i] || [])[0] || '').replace(/^'/, '').trim()) >= 0) out.push(i + 1);
    return out;
  }
  async function deleteRows(tab, rows) {
    if (!rows.length) return;
    const id = await tabId(tab);
    rows = rows.slice().sort((a, b) => b - a);
    const reqs = [];
    let i = 0;
    while (i < rows.length) {
      const end = rows[i];
      let start = end;
      while (i + 1 < rows.length && rows[i + 1] === start - 1) { i++; start = rows[i]; }
      reqs.push({ deleteDimension: { range: { sheetId: id, dimension: 'ROWS', startIndex: start - 1, endIndex: end } } });
      i++;
    }
    await sh.batchUpdate(getSheetId(), reqs);
  }

  const postRow = (p) => POST_COLS.map((c) => (p[c] == null ? '' : String(p[c])));

  /* ---- tab phụ (quảng cáo, tài khoản…): mỗi dòng 1 bản ghi, khóa ở cột A ---- */
  async function needTab(tab) { if ((await tabs()).map((t) => t.title).indexOf(tab) < 0) await ensureTabs(); }
  const lastCol = (tab) => col((HEAD[tab] || []).length || 26);
  async function rows(tab) {
    await needTab(tab);
    return (await sh.get(getSheetId(), R(tab, 'A2:' + lastCol(tab)))).filter((r) => r && r[0]).map((r) => r.map((v) => (v == null ? '' : String(v))));
  }
  async function putRow(tab, row) {
    await needTab(tab);
    const r = await rowOf(tab, String(row[0]));
    const vals = row.map((v) => (v == null ? '' : String(v)));
    if (r) await sh.update(getSheetId(), R(tab, 'A' + r + ':' + lastCol(tab) + r), [vals]);
    else await sh.append(getSheetId(), R(tab, 'A1'), [vals]);
  }
  async function delRow(tab, key) { await needTab(tab); const r = await rowOf(tab, String(key)); if (r) await deleteRows(tab, [r]); }
  async function addRow(tab, row) { await needTab(tab); await sh.append(getSheetId(), R(tab, 'A1'), [row.map((v) => (v == null ? '' : String(v)))]); }

  return {
    TABS, ensureTabs, load, invalidate, rows, putRow, delRow, addRow,
    /* 2.0: tab APP_THIET_KE của bản 1.x (Thiết kế ảnh đã bỏ) — leader đồng ý thì xóa */
    async designTabRows() {
      const have = (await tabs(true)).map((t) => t.title);
      if (have.indexOf('APP_THIET_KE') < 0) return -1;
      return (await sh.get(getSheetId(), R('APP_THIET_KE', 'A2:A'))).filter((r) => r && r[0]).length;
    },
    async dropDesignTab() {
      const t = (await tabs(true)).filter((x) => x.title === 'APP_THIET_KE')[0];
      if (!t) return false;
      await sh.batchUpdate(getSheetId(), [{ deleteSheet: { sheetId: t.sheetId } }]);
      await tabs(true);
      return true;
    },
    async writePost(p) {
      const r = await rowOf(TABS.POSTS, p.id);
      if (r) await sh.update(getSheetId(), R(TABS.POSTS, 'A' + r + ':' + LAST + r), [postRow(p)]);
      else await sh.append(getSheetId(), R(TABS.POSTS, 'A1'), [postRow(p)]);
      if (cache) { const i = cache.posts.findIndex((x) => x.id === p.id); if (i >= 0) cache.posts[i] = p; else cache.posts.push(p); }
      return p;
    },
    async writePosts(list) {
      if (!list.length) return;
      const ids = await sh.get(getSheetId(), R(TABS.POSTS, 'A:A'));
      const map = {};
      ids.forEach((r, i) => { if (i) map[String((r || [])[0] || '')] = i + 1; });
      const data = list.filter((p) => map[p.id]).map((p) => ({ range: R(TABS.POSTS, 'A' + map[p.id] + ':' + LAST + map[p.id]), values: [postRow(p)] }));
      if (data.length) await sh.batchUpdateValues(getSheetId(), data);
    },
    /** 2.0: ghi nhiều bài một lần (sửa dòng có sẵn + thêm dòng mới), dùng cho đồng bộ/ghép sheet team */
    async upsertPosts(list) {
      if (!list.length) return;
      const ids = await sh.get(getSheetId(), R(TABS.POSTS, 'A:A'));
      const map = {};
      ids.forEach((r, i) => { if (i) map[String((r || [])[0] || '')] = i + 1; });
      const upd = list.filter((p) => map[p.id]).map((p) => ({ range: R(TABS.POSTS, 'A' + map[p.id] + ':' + LAST + map[p.id]), values: [postRow(p)] }));
      const add = list.filter((p) => !map[p.id]).map(postRow);
      for (let i = 0; i < upd.length; i += 300) await sh.batchUpdateValues(getSheetId(), upd.slice(i, i + 300));
      if (add.length) await sh.append(getSheetId(), R(TABS.POSTS, 'A1'), add);
      invalidate();
    },
    async deletePosts(ids) { await deleteRows(TABS.POSTS, await rowsOf(TABS.POSTS, ids)); invalidate(); },
    async saveUser(u) {
      const r = await rowOf(TABS.USERS, u.email, true);
      const row = [u.email, u.name, u.role, u.active ? 'TRUE' : 'FALSE', u.addedAt, u.perms ? JSON.stringify(u.perms) : '',
        u.job || '', u.mode || 'Cần duyệt', u.canReview ? 'TRUE' : 'FALSE', u.kpi == null ? '5' : String(u.kpi), u.tab || '', u.leftAt || '', u.locked ? 'TRUE' : 'FALSE'];
      if (r) await sh.update(getSheetId(), R(TABS.USERS, 'A' + r + ':M' + r), [row]);
      else await sh.append(getSheetId(), R(TABS.USERS, 'A1'), [row]);
      invalidate();
    },
    async upsertPages(list, now) {
      const ids = await sh.get(getSheetId(), R(TABS.PAGES, 'A:C'));
      const map = {};
      ids.forEach((r, i) => { if (i) map[String((r || [])[0] || '').replace(/^'/, '')] = { row: i + 1, enabled: (r || [])[2] }; });
      const data = [], add = [];
      list.forEach((p) => {
        const f = map[String(p.id)];
        const row = [String(p.id), p.name, f ? (f.enabled === 'FALSE' ? 'FALSE' : 'TRUE') : 'TRUE', now];
        if (f) data.push({ range: R(TABS.PAGES, 'A' + f.row + ':D' + f.row), values: [row] }); else add.push(row);
      });
      if (data.length) await sh.batchUpdateValues(getSheetId(), data);
      if (add.length) await sh.append(getSheetId(), R(TABS.PAGES, 'A1'), add);
      invalidate();
    },
    async setPagesEnabled(ids, on) {
      const data = (await load(true)).pages.filter((p) => ids.indexOf(p.id) >= 0).map((p) => ({ range: R(TABS.PAGES, 'C' + p._row), values: [[on ? 'TRUE' : 'FALSE']] }));
      if (data.length) await sh.batchUpdateValues(getSheetId(), data);
      invalidate();
    },
    async deletePages(ids) { await deleteRows(TABS.PAGES, await rowsOf(TABS.PAGES, ids)); invalidate(); },
    async clearPages() { await sh.clear(getSheetId(), R(TABS.PAGES, 'A2:D')); invalidate(); },
    async setCfg(key, value) {
      const c = (await load(true)).cfg[key];
      if (c) await sh.update(getSheetId(), R(TABS.CFG, 'A' + c.row + ':B' + c.row), [[key, String(value)]]);
      else await sh.append(getSheetId(), R(TABS.CFG, 'A1'), [[key, String(value)]]);
      invalidate();
    },
    log(at, email, action, postId, detail) {
      return sh.append(getSheetId(), R(TABS.LOG, 'A1'), [[at, email, action, postId || '', String(detail || '').slice(0, 300)]]).catch(() => {});
    },
    /** Nhật ký có nội dung dài (bản bị bỏ khi xử lý xung đột, để khôi phục) */
    logLong(at, email, action, postId, detail) {
      return sh.append(getSheetId(), R(TABS.LOG, 'A1'), [[at, email, action, postId || '', String(detail || '').slice(0, 45000)]]).catch(() => {});
    },
    async getLog(limit) {
      const rows = await sh.get(getSheetId(), R(TABS.LOG, 'A2:E'));
      return rows.slice(-(limit || 300)).reverse().map((r) => ({ at: r[0] || '', email: r[1] || '', action: r[2] || '', postId: r[3] || '', detail: r[4] || '' }));
    },
    async clearLog(cut) {
      const rows = await sh.get(getSheetId(), R(TABS.LOG, 'A2:E'));
      const keep = cut ? rows.filter((r) => (r[0] || '') >= cut) : [];
      await sh.clear(getSheetId(), R(TABS.LOG, 'A2:E'));
      if (keep.length) await sh.update(getSheetId(), R(TABS.LOG, 'A2'), keep);
      return rows.length - keep.length;
    }
  };
};

});
__def("core", function (module, exports, require) {
/**
 * Nghiệp vụ của app (giống bản web): viết → gửi duyệt → leader duyệt / trả lại → đăng ngay hoặc hẹn giờ lên Fanpage.
 * Token Facebook chỉ lưu trên máy leader (settings.secret('fb')), không bao giờ ghi ra Sheet.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { ST, STATUSES, ROLE, OPTIONS, EDITABLE, POST_COLS, POST_HEADERS } = require('./constants');
const { fmt, stampId, parseThaiTime, parseStamp, parseJson } = require('./util');

/* Dùng chung mọi core (dự án đang mở + core chạy nền mỗi 5 phút cho dự án khác): không đăng 1 bài 2 lần cùng lúc. */
const BUSY = new Set();   // "sheetId:mã bài" đang đăng
const QRUN = new Set();   // sheetId đang chạy hàng chờ
const MACHINE = require('crypto').randomBytes(6).toString('hex'); // nhận diện máy này trong khóa hàng chờ

module.exports = function createCore(deps) {
  const { google, store, settings, fb } = deps;
  const drive = google.drive;
  const tmpDir = path.join(os.tmpdir(), 'himen-content');
  fs.mkdirSync(tmpDir, { recursive: true });

  /* ---------------- token Facebook trên máy này ---------------- */
  const fbSecret = () => settings.secret('fb') || { pages: {} };
  const setFbSecret = (v) => settings.setSecret('fb', v);
  function pageToken(pageId) {
    const t = fbSecret().pages[String(pageId)];
    if (!t) throw new Error('Máy này chưa có token của Page ' + pageId + '. Leader vào Cài đặt → Kết nối Facebook trên máy này.');
    return t;
  }

  /* ---------------- người dùng ---------------- */
  async function me() {
    const email = settings.get('email');
    if (!email) { const e = new Error('Chưa đăng nhập Google.'); e.code = 'login'; throw e; }
    const data = await store.load();
    const u = data.users.filter((x) => x.email === email)[0];
    if (!u) return { email, name: settings.get('name') || email, role: '', isLeader: false, active: false, noUsers: !data.users.length };
    const pr = normPerms(u);
    return { email: u.email, name: u.name, role: u.role, isLeader: (u.role === ROLE.LEADER || pr.level === 'manager') && u.active, isOwner: u.role === ROLE.LEADER && u.active, active: u.active, level: pr.level, mods: pr.mods, pagePerms: pr.pages,
      /* 2.0 */ job: u.job, mode: u.role === ROLE.LEADER ? 'Tự đăng' : u.mode, canReview: u.active && (u.role === ROLE.LEADER || pr.level === 'manager' || !!u.canReview), kpi: u.kpi, tab: u.tab };
  }
  function requireActive(m) { if (!m.active) throw new Error('Email ' + m.email + ' chưa được leader thêm vào app.'); return m; }
  /** Phân quyền 2 lớp: level (basic|manager), mods (mục được vào), pages ({pageId: ['write','reply','stats']}, null = mọi Page bật cho nhân viên). */
  function normPerms(u) {
    const p = (u && u.perms) || {};
    const lead = u && u.role === ROLE.LEADER;
    const level = lead ? 'manager' : (p.level === 'manager' ? 'manager' : 'basic');
    const def = { post: true, lib: true, acc: false, ads: false, export: false };
    const mods0 = level === 'manager' ? { post: true, lib: true, acc: true, ads: true, export: true } : Object.assign({}, def, p.mods || {});
    const mods = {}; Object.keys(def).forEach((k) => { mods[k] = !!mods0[k]; }); mods.post = true;
    return { level: level, mods: mods, pages: level === 'manager' ? null : (p.pages && Object.keys(p.pages).length ? p.pages : null) };
  }
  function canWritePage(m, pid) { return m.isLeader || !m.pagePerms || (m.pagePerms[pid] || []).indexOf('write') >= 0; }
  function requireLeader(m) { requireActive(m); if (!m.isLeader) throw new Error('Chỉ leader làm được thao tác này.'); return m; }
  const log = (m, action, id, detail) => store.log(fmt(new Date()), m.email, action, id, detail);

  /* 2.0: người viết sửa bài của mình (trừ đã đăng / đã hẹn giờ); người có quyền duyệt sửa bài đang duyệt của người khác */
  function canEdit(m, p) {
    if ([ST.POSTED, ST.SCHEDULED].indexOf(p.status) >= 0) return false;
    if (m.isLeader || p.authorEmail === m.email) return true;
    return !!m.canReview && [ST.PENDING, ST.REVISE, ST.APPROVED, ST.FAILED].indexOf(p.status) >= 0;
  }
  /** Danh sách kiểm tra trước khi đăng (Cài đặt › Đăng bài & KPI), mặc định 6 mục */
  const CHECKS = ['Ưu đãi (giảm 40%) còn hiệu lực', 'Gọi đúng tên chất liệu (tráng gương, không nói kính thật)', 'Không nêu "bền 20 năm" khi chưa có bằng chứng', 'Ảnh khách có quyền dùng (trẻ em, ảnh cưới)', 'Không hứa giao nhanh / COD khi chưa xác nhận', 'Chữ Thái hiển thị đúng, không ngắt dòng giữa chữ'];
  function checksOf(cfg) { const c = parseJson(cfg && cfg.postCfg && cfg.postCfg.value, {}); return Array.isArray(c.checks) && c.checks.length ? c.checks : CHECKS; }
  /** Thiếu gì thì chưa gửi duyệt được (2.0: Page, ngày giờ, Mục tiêu, Chủ đề, Format, Angles, Content TH, đủ mục kiểm tra) */
  function missingFields(p, cfg) {
    const am = adMessage(p);
    const need = [['pageId', 'Fanpage'], ['date', 'Ngày đăng'], ['time', 'Giờ đăng'], ['goal', 'Mục tiêu'], ['topic', 'Chủ đề'], ['format', 'Format'], ['angle', 'Angles']].concat(am && am.text ? [] : [['contentTh', 'Content tiếng Thái']]);
    const miss = need.filter((n) => !String(p[n[0]] || '').trim()).map((n) => n[1]);
    if (am && !am.text) miss.push('Văn bản chính của nội dung quảng cáo');
    if (cfg !== false) {
      const ck = parseJson(p.checklist, []), n = checksOf(cfg).length;
      if (!(Array.isArray(ck) && ck.length >= n && ck.slice(0, n).every(Boolean))) miss.push('tick đủ ' + n + ' mục kiểm tra');
    }
    return miss;
  }
  /** Khi đăng: bài thường cần ảnh/video (Reels, Story đăng tay; bài có nút bấm không kèm file) */
  function missingMedia(p) { const am = adMessage(p); return OPTIONS.manualFormats.indexOf(p.format) < 0 && !(am && am.button) && !String(p.media || '').trim() ? ['Hình/video'] : []; }
  /** Bài đăng bằng nội dung quảng cáo (adCopy.post): Văn bản chính 1 + Tiêu đề 1 + Mô tả 1, có thể kèm nút bấm. */
  const CTA_TYPE = { 'Gửi tin nhắn': 'MESSAGE_PAGE', 'Mua ngay': 'SHOP_NOW', 'Tìm hiểu thêm': 'LEARN_MORE', 'Đặt hàng ngay': 'ORDER_NOW', 'Liên hệ chúng tôi': 'CONTACT_US', 'Gọi ngay': 'CALL_NOW', 'Đăng ký': 'SIGN_UP', 'Nhận ưu đãi': 'GET_OFFER', 'Xem thêm': 'SEE_MORE', 'Đặt lịch': 'BOOK_NOW', 'Tải xuống': 'DOWNLOAD' };
  function adMessage(p) {
    const ad = parseJson(p.adCopy);
    if (!ad || !ad.post || String(p.ads).toUpperCase() !== 'TRUE') return null; // bỏ tick "Chạy Ads?" thì đăng như bài thường
    const first = (k) => String((Array.isArray(ad[k]) ? ad[k][0] : '') || '').trim();
    return { text: first('texts'), head: first('heads'), desc: first('descs'), cta: ad.cta || 'Gửi tin nhắn', button: !!ad.button, link: String(ad.link || '').trim() };
  }
  const pageIds = (p) => String(p.pageId || '').split(',').map((x) => x.replace(/^'/, '').trim()).filter((x, i, a) => x && a.indexOf(x) === i);
  const blank = () => { const o = {}; POST_COLS.forEach((k) => { o[k] = ''; }); o.ads = 'FALSE'; return o; };
  async function find(id) {
    const p = (await store.load(true)).posts.filter((x) => x.id === String(id))[0];
    if (!p) throw new Error('Không tìm thấy bài ' + id + ' (có thể đã bị xóa).');
    return Object.assign({}, p);
  }
  const clean = (p) => { const o = {}; POST_COLS.forEach((k) => { o[k] = p[k] == null ? '' : String(p[k]); }); return o; };
  function stamp(p, m) { p.reviewer = m.name; p.reviewedAt = fmt(new Date()); p.updatedAt = p.reviewedAt; }

  /* ---------------- thông tin ảnh/video trên Drive ---------------- */
  const metaFile = path.join(settings.dir, 'media-meta.json');
  let metaCache = {};
  try { metaCache = JSON.parse(fs.readFileSync(metaFile, 'utf8')); } catch (e) { metaCache = {}; }
  const driveId = (line) => { const m = String(line).match(/[-\w]{25,}/); return m ? m[0] : ''; };
  async function metaOf(id) {
    if (metaCache[id] && metaCache[id].mimeType) return metaCache[id];
    const m = await drive.meta(id);
    metaCache[id] = { name: m.name, mimeType: m.mimeType, size: Number(m.size) || 0, thumb: m.thumbnailLink || '' };
    try { fs.writeFileSync(metaFile, JSON.stringify(metaCache)); } catch (e) { /* bỏ qua */ }
    return metaCache[id];
  }
  /** Thông tin file của các bài chưa đăng, để giao diện biết dòng nào là video. */
  async function mediaInfo(posts) {
    const lines = [];
    posts.filter((p) => p.status !== ST.POSTED).forEach((p) => {
      String(p.media || '').split(/\n+/).concat([p.thumb]).forEach((l) => { l = String(l || '').trim(); if (l && !/\/folders\//.test(l) && driveId(l)) lines.push(l); });
    });
    const out = {};
    const uniq = lines.filter((l, i) => lines.indexOf(l) === i);
    for (let i = 0; i < uniq.length; i += 8) {
      await Promise.all(uniq.slice(i, i + 8).map((l) => metaOf(driveId(l)).then((m) => { out[l] = { name: m.name, mimeType: m.mimeType, size: m.size }; }, () => {})));
    }
    return out;
  }

  /** Mỗi dòng 1 link Drive (file hoặc thư mục) → tải về thư mục tạm để gửi Facebook. */
  async function resolveMedia(text) {
    const out = [];
    try {
      for (const line of String(text || '').split(/\n+/).map((s) => s.trim()).filter(String)) {
        const id = driveId(line);
        if (!id) throw new Error('Link hình không đúng dạng Google Drive: ' + line);
        if (/\/folders\//.test(line)) {
          for (const f of await drive.list(id)) if (/^(image|video)\//.test(f.mimeType)) out.push(await drive.download(f.id, tmpDir));
        } else out.push(await drive.download(id, tmpDir));
      }
    } catch (e) { cleanup(out); throw e; }
    return out;
  }
  function cleanup(list) { (list || []).forEach((f) => { if (f && f.temp) fs.rm(f.path, { force: true }, () => {}); }); }

  /* ============================== API ============================== */
  const api = {};

  api.api_bootstrap = async function () {
    await store.load(true);
    let m = await me();
    if (m.noUsers || m.isLeader) {
      // lần đầu: tạo tab, người đầu tiên thành Leader, tạo thư mục Drive chung
      await store.ensureTabs();
      if (m.noUsers) { await store.saveUser({ email: m.email, name: m.name, role: ROLE.LEADER, active: true, addedAt: fmt(new Date()) }); m = await me(); }
      const cfg = (await store.load(true)).cfg;
      if (!cfg.folderId || !cfg.folderId.value) {
        const pj = (settings.all().projects || []).filter((x) => x.sheetId === settings.get('sheetId'))[0];
        const f = await drive.folder('TNG Plus' + (pj ? ' · ' + pj.name : '') + ' - Ảnh & Video');
        await store.setCfg('folderId', f.id);
      }
    }
    if (!m.active) return { me: m, denied: true };
    const data = await store.load(true);
    if (m.isLeader) await refreshScheduled(data.posts);
    const sec = fbSecret();
    const tmap = {};
    data.topics.forEach((t) => { tmap[t.name] = t; });
    const folderId = data.cfg.folderId ? data.cfg.folderId.value : '';
    const sheetId = settings.get('sheetId');
    return {
      me: m,
      users: data.users.map((u) => ({ email: u.email, name: u.name, role: u.role, active: u.active, addedAt: u.addedAt, perms: m.isLeader ? normPerms(u) : undefined, job: u.job, mode: u.mode, canReview: u.role === ROLE.LEADER || u.canReview, kpi: u.kpi, tab: u.tab, leftAt: u.leftAt, locked: u.locked })),
      pages: data.pages.filter((p) => m.isLeader || !m.pagePerms || m.pagePerms[p.id]).map((p) => ({ id: p.id, name: p.name, enabled: m.pagePerms && !m.isLeader ? canWritePage(m, p.id) : p.enabled, hasToken: !!sec.pages[p.id], updatedAt: p.updatedAt, myPerms: m.isLeader ? ['write', 'reply', 'stats'] : (m.pagePerms ? (m.pagePerms[p.id] || []) : ['write']) })),
      options: { goals: OPTIONS.goals, formats: OPTIONS.formats, manualFormats: OPTIONS.manualFormats, topics: OPTIONS.topics.map((t) => Object.assign({ name: t }, tmap[t] || {})), tags: data.tags, statuses: ST, statusList: STATUSES },
      posts: data.posts.map(clean),
      mediaInfo: await mediaInfo(data.posts),
      settings: {
        fbAppId: m.isLeader ? (sec.appId || '') : '',
        fbConnectedAt: sec.connectedAt || '',
        sheetUrl: google.local ? 'tng-local:data' : 'https://docs.google.com/spreadsheets/d/' + sheetId + '/edit',
        folderUrl: google.local ? 'tng-local:media' : (folderId ? 'https://drive.google.com/drive/folders/' + folderId : ''),
        local: google.local ? { dir: google.dir } : null,
        invite: m.isLeader ? inviteCode() : '',
        maxUploadMb: 20,
        maxBigUploadMb: 10240,
        thisMachineCanPost: Object.keys(sec.pages).length > 0,
        ads: null
      },
      now: fmt(new Date())
    };
  };

  api.api_listPosts = async function () {
    const m = requireActive(await me());
    const data = await store.load(true);
    if (m.isLeader) await refreshScheduled(data.posts);
    return data.posts.map(clean);
  };

  api.api_mediaInfo = async function () { requireActive(await me()); return mediaInfo((await store.load()).posts); };

  api.api_savePost = async function (input) {
    const m = requireActive(await me());
    input = input || {};
    let p;
    if (input.id) {
      p = await find(input.id);
      if (!canEdit(m, p)) throw new Error('Bạn không sửa được bài này ở trạng thái "' + p.status + '".');
    } else {
      p = blank();
      p.id = 'P' + stampId() + Math.floor(Math.random() * 900 + 100);
      p.authorEmail = m.email; p.authorName = m.name; p.status = ST.DRAFT; p.createdAt = fmt(new Date());
    }
    EDITABLE.forEach((k) => { if (input[k] !== undefined) p[k] = String(input[k] == null ? '' : input[k]).trim(); });
    if (input.comments !== undefined) p.comments = cleanComments(input.comments);
    if (input.pageId !== undefined) {
      const bad = pageIds(p).filter((pid) => !canWritePage(m, pid));
      if (bad.length) throw new Error('Bạn chưa được giao quyền viết bài cho ' + bad.length + ' Page đã chọn. Nhờ leader cấp quyền ở Cài đặt → Nhân sự.');
      const ids = pageIds(p), pages = (await store.load()).pages;
      p.pageId = ids.join(',');
      p.pageName = ids.map((id) => { const x = pages.filter((q) => q.id === id)[0]; return x ? x.name : id; }).join(', ');
    }
    // 2.0: người "Cần duyệt" sửa bài đã duyệt / lỗi đăng → bài phải duyệt lại; bài Chưa làm có nội dung → Đang làm
    const au = (await store.load()).users.filter((u) => u.email === p.authorEmail)[0];
    if (input.id && !m.isLeader && p.authorEmail === m.email && (!au || au.mode !== 'Tự đăng') && [ST.APPROVED, ST.FAILED].indexOf(p.status) >= 0) p.status = ST.PENDING;
    if (p.status === ST.TODO && (p.contentTh || p.angle || p.slogan)) p.status = ST.DRAFT;
    if (!p.source) p.source = 'App';
    p.updatedAt = fmt(new Date());
    await store.writePost(p);
    log(m, input.id ? 'Sửa bài' : 'Tạo bài', p.id, p.slogan || p.topic);
    return clean(p);
  };

  api.api_submit = async function (id) {
    const m = requireActive(await me());
    const p = await find(id);
    if (!(p.authorEmail === m.email || m.isLeader || (m.canReview && p.status === ST.REVISE))) throw new Error('Chỉ người viết hoặc leader được gửi duyệt.');
    if ([ST.TODO, ST.DRAFT, ST.REVISE, ST.PENDING].indexOf(p.status) < 0) throw new Error('Bài đang ở trạng thái "' + p.status + '".');
    const data = await store.load();
    const miss = missingFields(p, data.cfg);
    if (miss.length) throw new Error('Còn thiếu: ' + miss.join(', ') + '.');
    /* 2.0: người "Tự đăng" (và leader) → bài vào thẳng hàng chờ đăng, leader hậu kiểm sau; người "Cần duyệt" → Chờ duyệt */
    const au = data.users.filter((u) => u.email === p.authorEmail)[0] || {};
    const self = au.role === ROLE.LEADER || au.mode === 'Tự đăng';
    p.status = self ? ST.APPROVED : ST.PENDING;
    p.audit = self && au.role !== ROLE.LEADER ? 'chờ' : '';
    p.updatedAt = fmt(new Date());
    await store.writePost(p);
    log(m, self ? 'Đưa vào hàng chờ đăng' : 'Gửi duyệt', id, '');
    return clean(p);
  };

  /* ---------------- 2.0 · E. Duyệt & đăng: phiếu duyệt, hậu kiểm, hàng chờ ---------------- */
  function requireReviewer(m) { requireActive(m); if (!m.canReview) throw new Error('Bạn không có quyền duyệt. Bài đang chờ leader hoặc người soát tiếng Thái.'); return m; }
  /** Phiếu duyệt: opts = chữ (bản cũ) hoặc { review, score, reviewVideo:[{t,text}], reviewMedia:[url], confirm } */
  function applyReview(p, m, opts) {
    if (typeof opts === 'string') opts = { review: opts };
    opts = opts || {};
    if (opts.review !== undefined) p.review = String(opts.review || '').trim();
    if (opts.score !== undefined && opts.score !== '' && opts.score !== null) { const s = Math.round(Number(opts.score)); if (!(s >= 1 && s <= 10)) throw new Error('Điểm chất lượng từ 1 đến 10.'); p.score = String(s); }
    if (Array.isArray(opts.reviewVideo)) p.reviewVideo = JSON.stringify(opts.reviewVideo.map((x) => ({ t: String((x && x.t) || '').trim().slice(0, 12), text: String((x && x.text) || '').trim().slice(0, 1000) })).filter((x) => x.text).slice(0, 30));
    if (Array.isArray(opts.reviewMedia)) p.reviewMedia = opts.reviewMedia.map(String).filter(Boolean).slice(0, 10).join('\n');
    stamp(p, m);
    return opts;
  }
  /** Tự chuyển về "Cần duyệt" khi 3 bài liên tiếp < 6 điểm (bật/tắt trong Cài đặt) */
  async function maybeDowngrade(m, p) {
    const data = await store.load(true);
    const cfg = postCfg(data.cfg);
    const u = data.users.filter((x) => x.email === p.authorEmail)[0];
    if (!cfg.autoDown || !u || u.mode !== 'Tự đăng' || u.role === ROLE.LEADER) return '';
    const scored = data.posts.filter((x) => x.authorEmail === u.email && x.score).sort((a, b) => String(b.reviewedAt).localeCompare(String(a.reviewedAt))).slice(0, 3);
    if (scored.length < 3 || !scored.every((x) => Number(x.score) < 6)) return '';
    await store.saveUser(Object.assign({}, u, { mode: 'Cần duyệt' }));
    log(m, 'Tự chuyển về Cần duyệt', '', u.email + ' · 3 bài liên tiếp dưới 6 điểm');
    return u.name + ' có 3 bài liên tiếp dưới 6 điểm nên đã chuyển về "Cần duyệt".';
  }
  const canPostHere = (p) => pageIds(p).length > 0 && pageIds(p).every((pid) => fbSecret().pages[pid]);
  api.api_approve = async function (id, opts) {
    const m = requireReviewer(await me());
    const p = await find(id);
    if ([ST.PENDING, ST.REVISE].indexOf(p.status) < 0) throw new Error('Chỉ duyệt được bài đang "Chờ duyệt".');
    const o = applyReview(p, m, opts);
    if (o.score === undefined && typeof opts === 'object' && opts) throw new Error('Chọn điểm chất lượng trước khi duyệt.');
    p.status = ST.APPROVED; p.audit = '';
    await store.writePost(p);
    log(m, 'Duyệt', id, (p.score ? p.score + '/10 · ' : '') + (p.review || ''));
    const down = p.score ? await maybeDowngrade(m, p) : '';
    const mode = p.publishMode || 'schedule'; // giống khung soạn bài và hàng chờ
    if (mode === 'manual' || OPTIONS.manualFormats.indexOf(p.format) >= 0) return Object.assign(clean(p), { autoNote: down });
    if (!m.isLeader || !canPostHere(p)) return Object.assign(clean(p), { autoNote: ('Bài vào hàng chờ, app của leader tự đăng theo lịch. ' + down).trim() });
    let use = mode, note = '';
    if (mode === 'schedule') {
      try {
        const diff = (parseThaiTime(p.date, p.time).getTime() - Date.now()) / 60000;
        if (diff < 10) { use = 'now'; note = 'Giờ hẹn đã qua hoặc còn dưới 10 phút nên app đăng ngay.'; }
        if (diff > 30 * 24 * 60) return Object.assign(clean(p), { autoNote: 'Giờ hẹn quá 30 ngày nên chưa hẹn được, bài để ở trạng thái Đã duyệt.' });
      } catch (e) { return Object.assign(clean(p), { autoNote: String(e.message || e) }); }
    }
    try { const out = await publishCore(m, id, use); out.autoNote = (note + ' ' + down).trim(); return out; }
    catch (e) { return Object.assign(clean(await find(id)), { autoNote: 'Duyệt xong nhưng chưa tự đăng được: ' + (e.message || e) }); }
  };

  api.api_return = async function (id, opts) {
    const m = requireReviewer(await me());
    const o = typeof opts === 'string' ? { review: opts } : (opts || {});
    if (!String(o.review || '').trim() && !(Array.isArray(o.reviewVideo) && o.reviewVideo.some((x) => x && String(x.text || '').trim()))) throw new Error('Ghi góp ý để người viết biết cần sửa gì.');
    const p = await find(id);
    if ([ST.PENDING, ST.APPROVED, ST.FAILED].indexOf(p.status) < 0) throw new Error('Không trả lại được bài ở trạng thái "' + p.status + '".');
    applyReview(p, m, o);
    p.status = ST.REVISE; p.audit = '';
    p.returns = String((Number(p.returns) || 0) + 1);
    await store.writePost(p);
    log(m, 'Trả lại sửa', id, p.review);
    const down = p.score ? await maybeDowngrade(m, p) : '';
    return Object.assign(clean(p), { autoNote: down });
  };
  /** Hậu kiểm bài tự đăng: chấm điểm sau khi bài đã vào hàng chờ / đã đăng */
  api.api_audit = async function (id, opts) {
    const m = requireReviewer(await me());
    const p = await find(id);
    if (p.audit !== 'chờ') throw new Error('Bài này không chờ hậu kiểm.');
    const o = applyReview(p, m, opts || {});
    if (!p.score || o.score === undefined) throw new Error('Chọn điểm chất lượng.');
    p.audit = 'xong';
    await store.writePost(p);
    log(m, 'Hậu kiểm', id, p.score + '/10 · ' + (p.review || ''));
    return Object.assign(clean(p), { autoNote: await maybeDowngrade(m, p) });
  };
  /** Đổi ngày/giờ: bài Đã duyệt (đổi khung giờ) hoặc Đã hẹn giờ (hủy hẹn trên Facebook rồi hẹn lại) */
  api.api_reschedule = async function (id, date, time) {
    const m = requireLeader(await me());
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date)) || !/^\d{2}:\d{2}$/.test(String(time))) throw new Error('Chọn ngày và giờ.');
    let p = await find(id);
    if ([ST.APPROVED, ST.SCHEDULED, ST.FAILED].indexOf(p.status) < 0) throw new Error('Chỉ đổi giờ được bài đã duyệt hoặc đã hẹn giờ.');
    const wasSched = p.status === ST.SCHEDULED;
    if (wasSched) {
      const diff = (parseThaiTime(date, time).getTime() - Date.now()) / 60000;
      if (diff < 10) throw new Error('Facebook cần cách hiện tại ít nhất 10 phút.');
      if (livePages(p).length) throw new Error('Bài đã lên ' + livePages(p).length + ' Page nên không đổi giờ được (đổi sẽ làm các Page đó bị đăng lại). Muốn bỏ các Page chưa lên thì bấm "Hủy hẹn giờ".');
      p = await api.api_cancelSchedule(id);
    }
    p = await find(id);
    p.date = date; p.time = time; p.updatedAt = fmt(new Date());
    await store.writePost(p);
    log(m, 'Đổi giờ đăng', id, date + ' ' + time);
    if (wasSched) return publishCore(m, id, 'schedule');
    return clean(p);
  };

  /** Hàng chờ đăng (chạy trên máy leader có token, mỗi 5 phút): bài Đã duyệt, Sau khi duyệt = Tự đăng theo lịch / Đăng ngay */
  const bkey = (id) => (settings.get('sheetId') || '') + ':' + id;
  /** Khóa hàng chờ giữa các máy leader/quản lý (APP_CAI_DAT khóa queueLock = máy|giờ), hết hạn sau 15 phút. */
  async function takeQueueLock() {
    const QL = 15 * 60e3;
    const cur = (await store.load(true)).cfg.queueLock;
    const v = cur ? String(cur.value) : '', by = v.split('|')[0], at = Number(v.split('|')[1]) || 0;
    if (by && by !== MACHINE && Date.now() - at < QL) return false;
    await store.setCfg('queueLock', MACHINE + '|' + Date.now());
    await new Promise((r) => setTimeout(r, 1200));
    const again = (await store.load(true)).cfg.queueLock;
    return !!again && String(again.value).split('|')[0] === MACHINE;
  }
  async function dropQueueLock() { try { const cur = (await store.load(true)).cfg.queueLock; if (cur && String(cur.value).split('|')[0] === MACHINE) await store.setCfg('queueLock', ''); } catch (e) { /* hết hạn tự mở */ } }
  async function processQueue() {
    const qk = settings.get('sheetId') || '';
    if (QRUN.has(qk) || !Object.keys(fbSecret().pages).length || !settings.get('email')) return;
    QRUN.add(qk);
    let locked = false;
    try {
      const m = await me();
      if (!m.isLeader) return;
      const pre = await store.load(true);
      if (!pre.posts.some((p) => p.status === ST.APPROVED && canPostHere(p))) return; // không có gì để đăng: khỏi khóa
      if (!(locked = await takeQueueLock())) return; // máy khác đang chạy hàng chờ
      const data = await store.load(true);
      const cfg = postCfg(data.cfg);
      const now = Date.now();
      const count = {}; // Page|ngày → số bài đã đăng / hẹn
      data.posts.filter((p) => [ST.POSTED, ST.SCHEDULED].indexOf(p.status) >= 0).forEach((p) => pageIds(p).forEach((pid) => { const k = pid + '|' + p.date; count[k] = (count[k] || 0) + 1; }));
      const queue = data.posts.filter((p) => p.status === ST.APPROVED && ['schedule', 'now'].indexOf(p.publishMode || 'schedule') >= 0 && OPTIONS.manualFormats.indexOf(p.format) < 0 && canPostHere(p) && !BUSY.has(bkey(p.id)))
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
      for (const p of queue) {
        let when = 0;
        try { when = parseThaiTime(p.date, p.time).getTime(); } catch (e) { continue; }
        const diff = (when - now) / 60000;
        if (p.publishMode !== 'now' && diff > 30 * 24 * 60) continue;
        if (cfg.maxPerDay > 0 && pageIds(p).some((pid) => (count[pid + '|' + p.date] || 0) >= cfg.maxPerDay)) {
          if (!/tối đa/.test(p.error || '')) { const q = await find(p.id); q.error = 'Page đã đủ ' + cfg.maxPerDay + ' bài ngày ' + p.date + ' (tối đa ' + cfg.maxPerDay + ' bài/Page/ngày). Đổi khung giờ sang ngày khác.'; await store.writePost(q); }
          continue;
        }
        try { await publishCore(m, p.id, p.publishMode === 'now' || diff < 10 ? 'now' : 'schedule'); pageIds(p).forEach((pid) => { const k = pid + '|' + p.date; count[k] = (count[k] || 0) + 1; }); }
        catch (e) {
          const msg = String(e.message || e).slice(0, 300);
          const q = await find(p.id).catch(() => null);
          if (q && q.error !== msg && q.status === ST.APPROVED) { q.error = msg; await store.writePost(q).catch(() => {}); } // chỉ ghi khi lỗi đổi (đỡ tốn lượt Sheets)
        }
      }
    } catch (e) { /* mất mạng: lần sau */ } finally { if (locked) await dropQueueLock(); QRUN.delete(qk); }
  }
  api.api_setReview = async function (id, review) {
    const m = requireLeader(await me());
    const p = await find(id);
    p.review = String(review || '').trim(); stamp(p, m);
    await store.writePost(p);
    return clean(p);
  };

  api.api_setAds = async function (id, ads, res) {
    const m = requireLeader(await me());
    const p = await find(id);
    p.ads = ads ? 'TRUE' : 'FALSE'; p.adsResult = String(res || '').trim(); p.updatedAt = fmt(new Date());
    await store.writePost(p);
    log(m, 'Cập nhật Ads', id, (ads ? 'Có chạy' : 'Không chạy') + (res ? ' · ' + res : ''));
    return clean(p);
  };

  api.api_publish = async function (id, mode) { return publishCore(requireLeader(await me()), id, mode); };

  /** Giãn cách khi đăng nhiều Page: trả về số phút lệch của từng Page so với giờ đăng đầu tiên.
      2.0: mặc định (chưa chọn) = cách đều 10 phút, giống khung soạn bài. */
  function spacingOffsets(raw, n) {
    if (n < 2) return new Array(n).fill(0);
    const sp = parseJson(raw, null) || {};
    if (sp.mode === 'random' && Array.isArray(sp.offs) && sp.offs.length === n) return sp.offs.map((x) => Math.max(0, Math.round(Number(x) || 0)));
    const gap = Math.max(MIN_GAP, Number(sp.gap) || 10);
    return Array.from({ length: n }, (_, i) => i * gap);
  }
  /** Mỗi Page cách Page trước ít nhất 10 phút (2.0, giống khung soạn bài); khi đăng ngay, Page thứ 2 trở đi hẹn sau ≥10 phút (luật hẹn giờ của Facebook). */
  const MIN_GAP = 10;
  function effectiveOffsets(offs, now) {
    const out = offs.slice();
    for (let i = 1; i < out.length; i++) out[i] = Math.max(out[i], out[i - 1] + MIN_GAP, now ? 10 : 0);
    return out;
  }

  async function publishCore(m, id, mode) {
    const k = bkey(id);
    if (BUSY.has(k)) throw new Error('Bài này đang được đăng, chờ một chút rồi bấm Đồng bộ.');
    BUSY.add(k);
    try { return await publishInner(m, id, mode); } finally { BUSY.delete(k); }
  }
  /* Sổ ghi kết quả đăng trên máy: Facebook nhận bài xong mà ghi Sheet lỗi thì lần sau không đăng lại, chỉ ghi kết quả. */
  const journalFile = path.join(settings.dir, 'publish-journal.json');
  function journalAll() { try { return JSON.parse(fs.readFileSync(journalFile, 'utf8')); } catch (e) { return {}; } }
  function journalGet(id) { const j = journalAll()[bkey(id)]; return j && j.done ? j.done : null; }
  function journalPut(id, done) { const j = journalAll(); j[bkey(id)] = { at: Date.now(), done }; try { fs.writeFileSync(journalFile, JSON.stringify(j)); } catch (e) { /* bỏ qua */ } }
  function journalDrop(id) { const j = journalAll(); if (!j[bkey(id)]) return; delete j[bkey(id)]; try { fs.writeFileSync(journalFile, JSON.stringify(j)); } catch (e) { /* bỏ qua */ } }
  async function writeWithRetry(p) {
    for (let i = 0; ; i++) {
      try { return await store.writePost(p); }
      catch (e) { if (i >= 2) throw e; await new Promise((r) => setTimeout(r, 1500 * (i + 1))); store.invalidate(); }
    }
  }

  async function publishInner(m, id, mode) {
    let p = await find(id);
    if ([ST.APPROVED, ST.FAILED].indexOf(p.status) < 0) throw new Error('Chỉ đăng được bài "Đã duyệt" (hoặc đăng lỗi cần thử lại).');
    if (OPTIONS.manualFormats.indexOf(p.format) >= 0) throw new Error(p.format + ' chưa đăng tự động được. Đăng tay trên Facebook rồi bấm "Đánh dấu đã đăng".');
    const miss = missingFields(p, false).concat(missingMedia(p));
    if (miss.length) throw new Error('Còn thiếu: ' + miss.join(', ') + '.');
    let ts = 0;
    if (mode === 'schedule') {
      const when = parseThaiTime(p.date, p.time);
      const diff = (when.getTime() - Date.now()) / 60000;
      if (diff < 10) throw new Error('Giờ hẹn phải sau thời điểm hiện tại ít nhất 10 phút. Sửa ngày/giờ hoặc chọn "Đăng ngay".');
      if (diff > 30 * 24 * 60) throw new Error('Facebook chỉ cho hẹn giờ trong vòng 30 ngày.');
      ts = Math.floor(when.getTime() / 1000);
    }
    const ids = pageIds(p);
    const names = {};
    (await store.load()).pages.forEach((x) => { names[x.id] = x.name; });
    const done = parseJson(p.fbPosts);
    // Page đã lên Facebook ở lần trước nhưng chưa kịp ghi Sheet (sổ trên máy): không đăng lại
    const jr = journalGet(id) || {};
    Object.keys(jr).forEach((pid) => { if (jr[pid] && jr[pid].id && !(done[pid] && done[pid].id)) done[pid] = jr[pid]; });
    const todo = ids.filter((pid) => !(done[pid] && done[pid].id));
    let files = [], thumb = null, loadErr = '';
    const am0 = adMessage(p);
    if (todo.length) {
      try {
        files = await resolveMedia(p.media);
        if (p.thumb) thumb = (await resolveMedia(p.thumb))[0] || null;
        // có link mà không ra ảnh/video nào (PDF, thư mục rỗng…): báo lỗi thay vì đăng chỉ có chữ
        if (String(p.media || '').trim() && !(am0 && am0.button) && !files.some((f) => /^(image|video)\//.test(f.mime))) throw new Error('Link ảnh/video không có file ảnh hoặc video nào (kiểm tra lại link Drive / thư mục).');
      } catch (e) { loadErr = String(e.message || e); }
    }
    const offs = ids.length > 1 ? effectiveOffsets(spacingOffsets(p.spacing, ids.length), !ts) : [0];
    const baseSec = ts || Math.floor(Date.now() / 1000);
    let chRes = null, shift = 0;
    try {
      for (const pid of todo) {
        if (loadErr) { done[pid] = { error: loadErr }; continue; }
        try {
          const off = offs[ids.indexOf(pid)] || 0;
          let pts = off > 0 || ts ? baseSec + off * 60 : 0;
          // Facebook chỉ nhận giờ hẹn cách lúc gửi ≥ 10 phút: tính lại ngay lúc gửi (tải video Page trước có thể mất vài phút).
          // Lùi thì lùi cả các Page sau cùng một khoảng, để vẫn giữ giãn cách giữa các Page.
          if (pts) { const minSec = Math.floor(Date.now() / 1000) + 11 * 60; if (pts + shift < minSec) shift = minSec - pts; pts += shift; }
          const r = await publishToPage(p, pid, pts, files, thumb);
          done[pid] = { id: r.id, link: r.link, at: fmt(new Date()), scheduled: !!pts, when: pts ? fmt(new Date(pts * 1000)) : '' };
          journalPut(id, done);
          if (!pts) await postComments(p, pid, done[pid]);
        } catch (e) {
          let msg = String(e.message || e).slice(0, 300);
          if (/pages_manage_posts/.test(msg)) msg += ' → App Meta chưa bật quyền pages_manage_posts: thêm quyền, lấy lại token rồi Kết nối lại.';
          done[pid] = { error: msg };
        }
      }
      if (channels.wanted(p) && !loadErr) {
        if (ts) chRes = Object.assign(parseJson(p.channelPosts), { pending: ts });
        else chRes = await channels.publishAll(p, ids.filter((pid) => fbSecret().pages[pid]), files, fbMessage(p));
      }
    } finally { cleanup(files.concat(thumb ? [thumb] : [])); }
    const ok = ids.filter((pid) => done[pid] && done[pid].id);
    const bad = ids.filter((pid) => !(done[pid] && done[pid].id));
    p = await find(id);
    if (chRes) p.channelPosts = JSON.stringify(chRes);
    p.fbPosts = JSON.stringify(done);
    p.fbPostId = ok.map((pid) => done[pid].id).join(',');
    p.link = ok.length ? done[ok[0]].link : '';
    p.updatedAt = fmt(new Date());
    if (bad.length) {
      p.status = ST.FAILED;
      p.error = (ok.length ? 'Đã lên ' + ok.length + '/' + ids.length + ' Page. ' : '') + 'Lỗi: ' + bad.map((pid) => (names[pid] || pid) + ': ' + (done[pid] ? done[pid].error : 'chưa đăng')).join(' | ');
    } else if (ts || ok.some((pid) => done[pid].scheduled)) {
      const whens = ok.map((pid) => done[pid].when).filter(Boolean).sort();
      p.status = ST.SCHEDULED; p.scheduledAt = whens.length ? whens[whens.length - 1] : fmt(new Date((baseSec + Math.max.apply(null, offs.concat([0])) * 60) * 1000)); p.error = '';
    }
    else { p.status = ST.POSTED; p.postedAt = fmt(new Date()); p.error = ''; }
    try { await writeWithRetry(p); journalDrop(id); }
    catch (e) {
      if (ok.length) throw new Error('Đã lên Facebook ' + ok.length + '/' + ids.length + ' Page nhưng chưa ghi được vào Sheet (' + String(e.message || e).slice(0, 120) + '). App đã nhớ kết quả trên máy này, lần đồng bộ / thử lại sau sẽ ghi bù, KHÔNG đăng lại.');
      throw e;
    }
    log(m, bad.length ? 'Đăng lỗi' : (ts ? 'Hẹn giờ đăng' : 'Đăng lên FB'), id, ok.length + '/' + ids.length + ' Page' + (bad.length ? ' · ' + p.error : '') + (chRes && !chRes.pending ? ' · ' + chSummary(chRes) : ''));
    return clean(p);
  }

  const asFile = (f) => ({ __file: true, path: f.path, mime: f.mime, name: f.name });
  const channels = require('./channels')({ fb, settings, pageToken, asFile });
  const fbMessage = (p) => {
    const am = adMessage(p);
    const parts = am ? [am.text, [am.head, am.desc].filter(Boolean).join('\n'), p.hashtags] : [p.slogan, p.contentTh, p.cta, p.hashtags];
    return parts.map((s) => String(s || '').trim()).filter(String).join('\n\n');
  };
  async function publishToPage(p, pageId, ts, files, thumb) {
    const token = pageToken(pageId);
    const message = fbMessage(p);
    const am = adMessage(p);
    const images = files.filter((f) => /^image\//.test(f.mime));
    const videos = files.filter((f) => /^video\//.test(f.mime));
    const sched = ts ? { published: 'false', scheduled_publish_time: String(ts) } : {};
    let id, link = '';
    if (am && am.button) {
      // bài dạng link có nút bấm như quảng cáo (Facebook không cho gắn nút vào album ảnh/video)
      const type = CTA_TYPE[am.cta] || 'LEARN_MORE';
      const target = am.link || (type === 'MESSAGE_PAGE' ? 'https://m.me/' + pageId : '');
      if (!target) throw new Error('Nút "' + am.cta + '" cần link đích (https://… hoặc tel:…).');
      const value = type === 'MESSAGE_PAGE' ? { app_destination: 'MESSENGER' } : { link: target };
      const q = Object.assign({ message, link: /^tel:/i.test(target) ? 'https://www.facebook.com/' + pageId : target, call_to_action: JSON.stringify({ type, value }) }, sched);
      // Không gửi name/description/picture: Facebook chỉ cho chủ tên miền của link đổi các mục này (lỗi #100).
      // Tiêu đề + mô tả đã nằm trong nội dung bài (fbMessage); khung link lấy tiêu đề/ảnh từ chính trang đích.
      try { id = (await fb.call('post', '/' + pageId + '/feed', q, token)).id; }
      catch (e) { throw new Error('Facebook từ chối bài có nút "' + am.cta + '": ' + String(e.message || e) + ' → Bỏ tick "Gắn nút" để đăng như bài thường.'); }
    } else if (videos.length) {
      if (videos.length > 1 || images.length) throw new Error('Bài video chỉ được 1 video, không kèm ảnh.');
      const vp = Object.assign({ description: message, source: asFile(videos[0]) }, sched);
      if (thumb && /^image\//.test(thumb.mime)) vp.thumb = asFile(thumb);
      const r = await fb.call('post', '/' + pageId + '/videos', vp, token, fb.videoHost);
      id = r.id; link = 'https://www.facebook.com/' + pageId + '/videos/' + r.id;
    } else if (images.length) {
      const q = Object.assign({ message }, sched);
      for (let i = 0; i < images.length; i++) {
        const up = await fb.call('post', '/' + pageId + '/photos', { source: asFile(images[i]), published: 'false', temporary: ts ? 'true' : 'false' }, token);
        q['attached_media[' + i + ']'] = JSON.stringify({ media_fbid: up.id });
      }
      id = (await fb.call('post', '/' + pageId + '/feed', q, token)).id;
    } else {
      id = (await fb.call('post', '/' + pageId + '/feed', Object.assign({ message }, sched), token)).id;
    }
    if (!link) {
      try { link = (await fb.call('get', '/' + id, { fields: 'permalink_url' }, token)).permalink_url || ''; } catch (e) { link = ''; }
      if (!link) link = 'https://www.facebook.com/' + id;
    }
    return { id, link };
  }

  /** Page của bài hẹn giờ đã thật sự lên Facebook (đăng ngay, hoặc giờ hẹn đã qua) */
  function livePages(p) {
    const done = parseJson(p.fbPosts);
    return Object.keys(done).filter((pid) => {
      const d = done[pid]; if (!d || !d.id) return false;
      if (!d.scheduled) return true;
      try { return d.when && parseStamp(d.when).getTime() <= Date.now(); } catch (e) { return false; }
    });
  }
  api.api_cancelSchedule = async function (id) {
    const m = requireLeader(await me());
    const p = await find(id);
    if (p.status !== ST.SCHEDULED) throw new Error('Bài này không ở trạng thái hẹn giờ.');
    const done = parseJson(p.fbPosts);
    const live = [], fail = [];
    for (const pid of Object.keys(done)) {
      const d = done[pid];
      if (!d || !d.id) { delete done[pid]; continue; }
      // Page đã lên thật (đăng ngay, hoặc giờ hẹn đã qua): giữ nguyên, không xóa bài đang hiện trên Page
      let isLive = !d.scheduled;
      if (d.scheduled && d.when) { try { isLive = parseStamp(d.when).getTime() <= Date.now(); } catch (e) { /* giữ */ } }
      if (isLive) { live.push(pid); continue; }
      try { await fb.call('delete', '/' + d.id, {}, pageToken(pid)); delete done[pid]; }
      catch (e) {
        if (/does not exist|cannot be loaded|Unsupported delete|#100\b/i.test(String(e.message))) delete done[pid]; // đã bị xóa trên Facebook
        else fail.push((pid) + ': ' + String(e.message || e).slice(0, 120));
      }
    }
    if (fail.length) {
      p.fbPosts = JSON.stringify(done); p.updatedAt = fmt(new Date());
      await store.writePost(p);
      throw new Error('Chưa hủy được hẹn giờ trên Facebook (' + fail.join(' | ') + '). Bài vẫn để "Đã hẹn giờ" để không bị đăng 2 lần; kiểm tra token Page rồi thử lại.');
    }
    if (live.length) {
      // còn Page đã lên: bài coi như đã đăng ở các Page đó, các Page còn lại thì hủy
      p.fbPosts = JSON.stringify(done); p.fbPostId = live.map((pid) => done[pid].id).join(','); p.link = done[live[0]].link || p.link;
      p.status = ST.POSTED; p.postedAt = p.postedAt || fmt(new Date()); p.scheduledAt = '';
      p.error = 'Đã hủy hẹn giờ ở các Page chưa lên; ' + live.length + ' Page đã lên trước đó vẫn giữ.';
    } else { p.status = ST.APPROVED; p.fbPostId = ''; p.fbPosts = ''; p.link = ''; p.scheduledAt = ''; }
    p.updatedAt = fmt(new Date());
    await store.writePost(p);
    log(m, 'Hủy hẹn giờ', id, live.length ? live.length + ' Page đã lên giữ nguyên' : '');
    return clean(p);
  };

  api.api_markPosted = async function (id, link) {
    const m = requireLeader(await me());
    if (!link || !/^https?:\/\//.test(String(link).trim())) throw new Error('Dán link bài viết (bắt đầu bằng https://).');
    const p = await find(id);
    if ([ST.APPROVED, ST.FAILED, ST.SCHEDULED].indexOf(p.status) < 0) throw new Error('Bài phải được duyệt trước.');
    p.status = ST.POSTED; p.link = String(link).trim(); p.postedAt = fmt(new Date()); p.error = ''; p.updatedAt = fmt(new Date());
    await store.writePost(p);
    log(m, 'Đánh dấu đã đăng (đăng tay)', id, p.link);
    return clean(p);
  };

  api.api_deletePost = async function (id) {
    const r = await api.api_deletePosts([id]);
    if (!r.deleted) throw new Error('Bạn không xóa được bài này.');
    return true;
  };

  api.api_deletePosts = async function (ids) {
    const m = requireActive(await me());
    ids = (ids || []).map(String);
    const del = [], skipped = [];
    (await store.load(true)).posts.forEach((p) => {
      if (ids.indexOf(p.id) < 0) return;
      const ok = m.isLeader ? p.status !== ST.SCHEDULED : (p.authorEmail === m.email && [ST.DRAFT, ST.REVISE].indexOf(p.status) >= 0);
      if (ok) del.push(p.id); else skipped.push(p.slogan || p.topic || p.id);
    });
    // 2.0: xóa nội dung dòng tương ứng trong sheet team (giữ Ngày), để lần đồng bộ sau không nhập lại
    if (del.length) { try { await team.clearRows(del); } catch (e) { log(m, 'Xóa dòng sheet team lỗi', '', String(e.message || e).slice(0, 200)); } }
    await store.deletePosts(del);
    log(m, 'Xóa bài', del.length === 1 ? del[0] : '', del.length + ' bài');
    return { deleted: del.length, skipped, posts: (await store.load(true)).posts.map(clean) };
  };

  /* ---------------- Cài đặt (leader) ---------------- */
  api.api_saveUser = async function (u) {
    const m = requireLeader(await me());
    u = u || {};
    const email = String(u.email || '').trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error('Email không hợp lệ.');
    const data = await store.load(true);
    const f = data.users.filter((x) => x.email === email)[0];
    const role = u.role !== undefined ? (u.role === ROLE.LEADER ? ROLE.LEADER : ROLE.STAFF) : (f ? f.role : ROLE.STAFF);
    const name = String(u.name || (f && f.name) || email.split('@')[0]).trim();
    if (data.users.some((x) => x.email !== email && !x.leftAt && x.name.trim().toLowerCase() === name.toLowerCase())) throw new Error('Tên này đã có trong dự án. Đặt tên khác để báo cáo không lẫn.');
    /* 2.0: Tạm khóa / Xóa khỏi dự án (giữ bài cũ, vẫn tính báo cáo) / Khôi phục */
    const rec = Object.assign({ job: '', mode: 'Cần duyệt', canReview: false, kpi: 5, tab: '', leftAt: '', locked: false }, f || {}, { email, name, role });
    ['job', 'mode', 'tab'].forEach((k) => { if (u[k] !== undefined) rec[k] = String(u[k] || '').trim(); });
    if (u.canReview !== undefined) rec.canReview = !!u.canReview;
    if (u.kpi !== undefined) rec.kpi = Math.max(0, Math.round(Number(u.kpi) || 0));
    if (!f && u.canReview === undefined) rec.canReview = rec.job === 'Soát tiếng Thái' || rec.job === 'Quản lý';
    if (rec.mode !== 'Tự đăng') rec.mode = 'Cần duyệt';
    if (u.action === 'remove') { rec.leftAt = fmt(new Date()).slice(0, 10); rec.locked = false; }
    else if (u.action === 'restore') { rec.leftAt = ''; rec.locked = false; }
    else if (u.action === 'lock') rec.locked = true;
    else if (u.action === 'unlock') rec.locked = false;
    rec.active = u.active !== undefined && !u.action ? u.active !== false : !rec.leftAt && !rec.locked;
    if (f && f.email === m.email && (role !== ROLE.LEADER || !rec.active)) throw new Error('Không tự hạ quyền, khóa hay xóa chính mình.');
    if (f && f.role === ROLE.LEADER && u.action === 'remove') throw new Error('Không xóa được Leader.');
    if (!f) { rec.addedAt = fmt(new Date()); rec.perms = rec.job === 'Quản lý' ? { level: 'manager', mods: {}, pages: {} } : null; }
    await store.saveUser(rec);
    if (rec.active && !f) {
      // chia sẻ file Sheet, sheet team (nếu là file khác) và thư mục ảnh/video cho người mới
      const folder = data.cfg.folderId ? data.cfg.folderId.value : '';
      const teamId = (parseJson(data.cfg.team && data.cfg.team.value, {}) || {}).sheetId;
      for (const fid of [settings.get('sheetId'), teamId, folder].filter((x, i, a) => x && a.indexOf(x) === i)) {
        try { await drive.share(fid, email); } catch (e) { log(m, 'Chia sẻ lỗi', '', email + ': ' + e.message); }
      }
    }
    log(m, u.action === 'remove' ? 'Xóa nhân sự' : u.action === 'restore' ? 'Khôi phục nhân sự' : (f ? 'Cập nhật nhân sự' : 'Thêm nhân sự'), '', email + ' · ' + (rec.job || role) + ' · ' + rec.mode + (rec.locked ? ' · tạm khóa' : '') + (rec.leftAt ? ' · đã rời' : ''));
    return (await store.load(true)).users.map((x) => ({ email: x.email, name: x.name, role: x.role, active: x.active, addedAt: x.addedAt, perms: normPerms(x), job: x.job, mode: x.mode, canReview: x.role === ROLE.LEADER || x.canReview, kpi: x.kpi, tab: x.tab, leftAt: x.leftAt, locked: x.locked }));
  };

  api.api_connectFacebook = async function (appId, appSecret, userToken) {
    const m = requireLeader(await me());
    const sec = fbSecret();
    appId = String(appId || '').trim();
    appSecret = String(appSecret || '').trim() || sec.appSecret || '';
    userToken = String(userToken || '').trim();
    if (!appId || !appSecret || !userToken) throw new Error('Điền đủ App ID, App Secret và User Token.');
    const ex = await fb.call('get', '/oauth/access_token', { grant_type: 'fb_exchange_token', client_id: appId, client_secret: appSecret, fb_exchange_token: userToken }, null);
    const list = await fb.all('/me/accounts', { fields: 'id,name,access_token', limit: 100 }, ex.access_token);
    if (!list.length) throw new Error('Tài khoản này không quản lý Page nào, hoặc token thiếu quyền pages_show_list.');
    const pages = Object.assign({}, sec.pages);
    list.forEach((p) => { pages[String(p.id)] = p.access_token; });
    setFbSecret({ appId, appSecret, userToken: ex.access_token, connectedAt: fmt(new Date()), pages });
    await store.upsertPages(list.map((p) => ({ id: String(p.id), name: p.name })), fmt(new Date()));
    log(m, 'Kết nối Facebook', '', list.length + ' Page');
    return (await api.api_bootstrap()).pages;
  };

  api.api_testPages = async function () {
    requireLeader(await me());
    const pages = (await store.load(true)).pages, sec = fbSecret();
    const out = [];
    for (let i = 0; i < pages.length; i += 20) {
      const chunk = pages.slice(i, i + 20);
      const res = await Promise.all(chunk.map((p) => (sec.pages[p.id] ? fb.call('get', '/' + p.id, { fields: 'name' }, sec.pages[p.id]).then(() => ({ ok: true, message: 'Token còn dùng được' }), (e) => ({ ok: false, message: e.message })) : Promise.resolve({ ok: false, message: 'Máy này chưa có token' }))));
      res.forEach((r, j) => out.push({ id: chunk[j].id, name: chunk[j].name, ok: r.ok, message: r.message }));
    }
    return out;
  };

  api.api_setPageEnabled = async function (id, on) { const m = requireLeader(await me()); await store.setPagesEnabled([String(id)], on); log(m, on ? 'Bật Page' : 'Ẩn Page', '', id); return true; };
  api.api_setPagesEnabled = async function (ids, on) { const m = requireLeader(await me()); await store.setPagesEnabled((ids || []).map(String), on); log(m, on ? 'Bật Page' : 'Ẩn Page', '', (ids || []).length + ' Page'); return true; };
  api.api_fbDisconnect = async function () { const m = requireLeader(await me()); setFbSecret(null); await store.clearPages(); log(m, 'Xóa kết nối Facebook', '', ''); return true; };
  api.api_deletePages = async function (ids) {
    const m = requireLeader(await me());
    ids = (ids || []).map(String);
    const sec = fbSecret(); ids.forEach((id) => { delete sec.pages[id]; }); setFbSecret(sec);
    await store.deletePages(ids);
    log(m, 'Xóa Page', '', ids.length + ' Page');
    return true;
  };
  api.api_getLog = async function (limit) { requireLeader(await me()); return store.getLog(limit); };
  api.api_clearLog = async function (days) {
    const m = requireLeader(await me());
    days = Number(days) || 0;
    const n = await store.clearLog(days ? fmt(new Date(Date.now() - days * 864e5)) : '');
    log(m, 'Dọn nhật ký', '', n + ' dòng');
    return n;
  };

  /* ---------------- Bình luận của Page ---------------- */
  function cleanComments(raw) {
    let arr = [];
    try { arr = typeof raw === 'string' ? (raw ? JSON.parse(raw) : []) : (raw || []); } catch (e) { arr = []; }
    // 2.0: nhiều bình luận (tối đa 10), mỗi bình luận đăng sau N phút (0 = ngay khi bài lên)
    arr = (Array.isArray(arr) ? arr : []).map((c) => { const o = { text: String((c && c.text) || '').trim().slice(0, 8000), media: String((c && c.media) || '').trim().split(/\n+/)[0] || '' }; const a = Math.round(Number(c && c.after) || 0); if ([5, 15, 30, 60].indexOf(a) >= 0) o.after = a; return o; })
      .filter((c) => c.text || c.media).slice(0, 10);
    return arr.length ? JSON.stringify(arr) : '';
  }
  const commentsOf = (p) => { const a = parseJson(p.comments, []); return Array.isArray(a) ? a : []; };
  async function postComments(p, pid, rec) {
    const list = commentsOf(p);
    if (!list.length || !rec || !rec.id) return rec;
    const token = pageToken(pid);
    rec.cm = rec.cm || [];
    let tried = false;
    for (let i = 0; i < list.length; i++) {
      const c = list[i];
      if (rec.cm[i] && rec.cm[i].id) continue;
      if (c.after) { const base = parseStamp(rec.when || rec.at || '').getTime(); if (!(base < Date.now() - c.after * 60000)) continue; } // chưa tới giờ: lần quét 5 phút sau đăng
      let files = [];
      if (!tried) { tried = true; rec.cmTries = (rec.cmTries || 0) + 1; }
      try {
        const params = {};
        if (c.text) params.message = c.text;
        if (c.media) {
          files = await resolveMedia(c.media);
          if (!files[0] || !/^image\//.test(files[0].mime)) throw new Error('Bình luận chỉ kèm được ảnh.');
          params.source = asFile(files[0]);
        }
        const r = await fb.call('post', '/' + rec.id + '/comments', params, token);
        rec.cm[i] = { id: r.id, at: fmt(new Date()) };
      } catch (e) {
        let msg = String(e.message || e).slice(0, 300);
        if (/pages_manage_engagement|permission/i.test(msg)) msg += ' → Bật quyền pages_manage_engagement cho app Meta, lấy lại token rồi Kết nối lại.';
        rec.cm[i] = { error: msg };
      } finally { cleanup(files); }
    }
    return rec;
  }
  function commentsPending(p, rec) {
    const n = commentsOf(p).length;
    if (!n || !rec || !rec.id) return false;
    for (let i = 0; i < n; i++) if (!(rec.cm && rec.cm[i] && rec.cm[i].id)) return true;
    return false;
  }
  api.api_retryComments = async function (id) {
    const m = requireLeader(await me());
    const p = await find(id);
    const done = parseJson(p.fbPosts);
    for (const pid of Object.keys(done)) {
      const rec = done[pid];
      if (!rec || !rec.id) continue;
      if (rec.scheduled && p.scheduledAt && parseStamp(p.scheduledAt) > new Date()) continue;
      if (commentsPending(p, rec)) await postComments(p, pid, rec);
    }
    p.fbPosts = JSON.stringify(done); p.updatedAt = fmt(new Date());
    await store.writePost(p);
    log(m, 'Bình luận của Page', id, 'thử lại');
    return clean(p);
  };

  /** App leader đang mở: mỗi 5 phút bình luận cho bài hẹn giờ đã lên (thử tối đa 3 lần). */
  let running = false;
  async function processScheduledComments() {
    if (running || !Object.keys(fbSecret().pages).length || !settings.get('email')) return;
    running = true;
    try {
      const m = await me();
      if (!m.isLeader) return;
      const posts = (await store.load(true)).posts;
      await refreshScheduled(posts);
      const now = Date.now();
      for (const p0 of posts) {
        const t0 = p0.scheduledAt || p0.postedAt;
        if (!p0.comments || !t0 || parseStamp(t0).getTime() > now - 60000) continue;
        if ([ST.SCHEDULED, ST.POSTED].indexOf(p0.status) < 0) continue;
        const p = Object.assign({}, p0);
        const done = parseJson(p.fbPosts);
        const touched = {};
        for (const pid of Object.keys(done)) {
          const rec = done[pid];
          if (rec && rec.id && commentsPending(p, rec) && (rec.cmTries || 0) < 3 && fbSecret().pages[pid]) {
            const before = JSON.stringify(rec);
            await postComments(p, pid, rec);
            if (JSON.stringify(rec) !== before) touched[pid] = rec; // chỉ ghi khi thật sự có bình luận mới / lỗi mới
          }
        }
        if (Object.keys(touched).length) {
          // ghi lên bản mới nhất (không đè thay đổi người khác vừa làm trong lúc chờ)
          const q = await find(p.id);
          const qd = parseJson(q.fbPosts); Object.keys(touched).forEach((pid) => { qd[pid] = touched[pid]; });
          q.fbPosts = JSON.stringify(qd); await store.writePost(q);
        }
      }
      for (const p0 of posts) {
        const cp = parseJson(p0.channelPosts);
        if (!cp.pending || cp.pending * 1000 > now || [ST.SCHEDULED, ST.POSTED].indexOf(p0.status) < 0) continue;
        let files = [];
        try {
          files = await resolveMedia(p0.media);
          const res = await channels.publishAll(Object.assign({}, p0, { channelPosts: JSON.stringify(Object.assign({}, cp, { pending: undefined })) }), pageIds(p0).filter((pid) => fbSecret().pages[pid]), files, fbMessage(p0));
          delete res.pending;
          const p = await find(p0.id); p.channelPosts = JSON.stringify(res); await store.writePost(p);
          log(m, 'Đăng kênh khác', p.id, chSummary(res));
        } catch (e) { console.error('channels', e.message); } finally { cleanup(files); }
      }
    } catch (e) { console.error('comments', e.message); } finally { running = false; }
  }

  /** Bài đã hẹn giờ mà đã qua giờ hẹn → coi là đã đăng. */
  async function refreshScheduled(posts) {
    const now = new Date();
    const list = posts.filter((p) => p.status === ST.SCHEDULED && p.scheduledAt && parseStamp(p.scheduledAt) <= now);
    list.forEach((p) => { p.status = ST.POSTED; p.postedAt = p.scheduledAt; });
    if (list.length) await store.writePosts(list);
  }

  /* ---------------- dọn bộ nhớ Drive ---------------- */
  /**
   * File trong thư mục chung do CHÍNH người đang dùng tải lên (Drive chỉ cho chủ file xóa, và file tính vào dung lượng của chủ file).
   * Dọn được khi: chỉ thuộc bài "Đã đăng" từ days ngày trước trở lên, hoặc không còn bài nào dùng (tải lên quá 2 ngày).
   */
  async function storageScan(days) {
    days = Math.max(0, Number(days) || 0);
    const data = await store.load(true);
    const folderId = data.cfg.folderId ? data.cfg.folderId.value : '';
    if (!folderId) throw new Error('Chưa có thư mục Drive chung.');
    const refs = {};
    const add = (line, p) => { const id = driveId(line); if (id && !/\/folders\//.test(line)) (refs[id] = refs[id] || []).push(p); };
    data.posts.forEach((p) => {
      String(p.media || '').split(/\n+/).forEach((l) => add(l, p));
      if (p.thumb) add(p.thumb, p);
      commentsOf(p).forEach((c) => { if (c.media) add(c.media, p); });
    });
    const cut = fmt(new Date(Date.now() - days * 864e5));
    const orphanCut = Date.now() - 2 * 864e5;
    const mine = await drive.listMine(folderId);
    const items = [];
    mine.forEach((f) => {
      const used = refs[f.id] || [];
      const size = Number(f.size) || 0;
      if (!used.length) {
        if (new Date(f.createdTime || 0).getTime() < orphanCut) items.push({ id: f.id, name: f.name, size, mimeType: f.mimeType, reason: 'Không còn bài nào dùng' });
        return;
      }
      const ok = used.every((p) => p.status === ST.POSTED && (p.postedAt || (p.date + ' ' + p.time)) <= cut);
      if (ok) {
        const p = used[0];
        items.push({ id: f.id, name: f.name, size, mimeType: f.mimeType, postId: p.id, reason: 'Bài đã đăng ' + String(p.postedAt || p.date).slice(0, 10) + (p.slogan ? ' · ' + p.slogan.slice(0, 40) : '') });
      }
    });
    let quota = null;
    try { const q = (await drive.quota()).storageQuota || {}; quota = { usage: Number(q.usage) || 0, limit: Number(q.limit) || 0 }; } catch (e) { quota = null; }
    return {
      days, quota, items: items.sort((a, b) => b.size - a.size),
      mine: { count: mine.length, bytes: mine.reduce((a, f) => a + (Number(f.size) || 0), 0) },
      bytes: items.reduce((a, f) => a + f.size, 0)
    };
  }
  function chSummary(r) {
    return ['ig', 'threads', 'tiktok'].filter((k) => r[k]).map((k) => ({ ig: 'Instagram', threads: 'Threads', tiktok: 'TikTok' }[k]) + (r[k].ok ? ' ✓' : ' lỗi: ' + r[k].error)).join(' · ');
  }
  api.api_setPerms = async function (email, perms) {
    const m = requireLeader(await me());
    if (!m.isOwner) throw new Error('Chỉ Leader chính mới đổi được quyền của người khác.');
    const data = await store.load(true);
    const u = data.users.filter((x) => x.email === String(email || '').toLowerCase())[0];
    if (!u) throw new Error('Không thấy người này trong Nhân sự.');
    if (u.role === ROLE.LEADER) throw new Error('Leader luôn có toàn quyền.');
    perms = perms || {};
    const clean = { level: perms.level === 'manager' ? 'manager' : 'basic', mods: {}, pages: {} };
    ['post', 'lib', 'acc', 'ads', 'export'].forEach((k) => { clean.mods[k] = !!(perms.mods || {})[k]; });
    Object.keys(perms.pages || {}).forEach((pid) => { const a = (perms.pages[pid] || []).filter((x) => ['write', 'reply', 'stats'].indexOf(x) >= 0); if (a.length) clean.pages[String(pid)] = a; });
    await store.saveUser(Object.assign({}, u, { perms: clean }));
    log(m, 'Phân quyền', '', u.email + ' · ' + (clean.level === 'manager' ? 'Quản lý' : 'Cơ bản') + ' · ' + Object.keys(clean.pages).length + ' Page');
    return normPerms(Object.assign({}, u, { perms: clean }));
  };

  /* ---------------- kênh khác: Instagram, Threads, TikTok ---------------- */
  api.api_channelsInfo = async function () {
    requireLeader(await me());
    const th = channels.threadsCfg(), tt = channels.tiktokCfg();
    const pids = Object.keys(fbSecret().pages);
    return { ig: pids.length ? await channels.igAccounts(pids) : [], threads: th ? { connected: true, username: th.username || '' } : { connected: false }, tiktok: tt ? { connected: true, username: tt.username || '', privacy: tt.privacy || 'SELF_ONLY' } : { connected: false } };
  };
  api.api_threadsSave = async function (token) {
    const m = requireLeader(await me());
    token = String(token || '').trim();
    if (!token) { settings.setSecret('threads', null); log(m, 'Ngắt Threads', '', ''); return { connected: false }; }
    const r = await channels.threadsMe(token);
    settings.setSecret('threads', { token: token, username: r.username || '', id: r.id, connectedAt: fmt(new Date()) });
    log(m, 'Kết nối Threads', '', r.username || r.id);
    return { connected: true, username: r.username || '' };
  };
  api.api_tiktokSave = async function (o) {
    const m = requireLeader(await me());
    o = o || {};
    if (!o.clientKey) { settings.setSecret('tiktok', null); log(m, 'Ngắt TikTok', '', ''); return { connected: false }; }
    const old = channels.tiktokCfg() || {};
    settings.setSecret('tiktok', { clientKey: String(o.clientKey).trim(), clientSecret: String(o.clientSecret || old.clientSecret || '').trim(), refreshToken: String(o.refreshToken || old.refreshToken || '').trim(), privacy: o.privacy === 'PUBLIC_TO_EVERYONE' ? 'PUBLIC_TO_EVERYONE' : 'SELF_ONLY', username: old.username || '' });
    await channels.tiktokToken();
    log(m, 'Kết nối TikTok', '', o.privacy || 'SELF_ONLY');
    return { connected: true };
  };
  api.api_channelRetry = async function (id) {
    const m = requireLeader(await me());
    const p = await find(id);
    let files = [];
    try {
      files = await resolveMedia(p.media);
      const res = await channels.publishAll(p, pageIds(p).filter((pid) => fbSecret().pages[pid]), files, fbMessage(p));
      p.channelPosts = JSON.stringify(res); p.updatedAt = fmt(new Date()); await store.writePost(p);
      log(m, 'Đăng lại kênh khác', id, chSummary(res));
      return clean(p);
    } finally { cleanup(files); }
  };

  /* ---------------- 2.0: dọn dữ liệu nháp của bản 1.x (Thiết kế ảnh) ---------------- */
  api.api_v1Info = async function () { requireLeader(await me()); return { designRows: await store.designTabRows() }; };
  api.api_v1DropDesigns = async function () {
    const m = requireLeader(await me());
    const ok = await store.dropDesignTab();
    if (ok) log(m, 'Dọn dữ liệu 1.x', '', 'Xóa tab APP_THIET_KE');
    return ok;
  };
  api.api_storageScan = async function (days) { requireActive(await me()); return storageScan(days); };

  /** mode 'trash' = chuyển vào thùng rác (khôi phục được 30 ngày), 'delete' = xóa hẳn. Chỉ xóa file nằm trong danh sách dọn được. */
  api.api_storageClean = async function (days, ids, mode) {
    const m = requireActive(await me());
    const allowed = {};
    (await storageScan(days)).items.forEach((f) => { allowed[f.id] = f; });
    let done = 0, freed = 0;
    const errors = [];
    for (const id of (ids || []).map(String)) {
      const f = allowed[id];
      if (!f) continue;
      try {
        if (mode === 'delete') await drive.remove(id); else await drive.trash(id);
        done++; freed += f.size;
      } catch (e) { errors.push(f.name + ': ' + e.message); }
    }
    log(m, 'Dọn bộ nhớ Drive', '', done + ' file · ' + Math.round(freed / 1048576) + 'MB · ' + (mode === 'delete' ? 'xóa hẳn' : 'thùng rác'));
    return { done, freed, errors, mode: mode === 'delete' ? 'delete' : 'trash' };
  };

  /* ---------------- mã cài đặt cho nhân viên ---------------- */
  function inviteCode() {
    const c = settings.all();
    const pj = (c.projects || []).filter((p) => p.sheetId === c.sheetId)[0];
    return 'HC1-' + Buffer.from(JSON.stringify({ c: c.clientId, s: c.clientSecret, sh: c.sheetId, n: pj ? pj.name : '' })).toString('base64url');
  }

  function csv() {
    return store.load(true).then((d) => {
      const esc = (v) => { const s = String(v == null ? '' : v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
      return '﻿' + [POST_HEADERS].concat(d.posts.map((p) => POST_COLS.map((c) => p[c]))).map((r) => r.map(esc).join(',')).join('\r\n');
    });
  }

  /* ---------------- 1.6 quảng cáo ---------------- */
  Object.assign(api, require('./ads')({ fb, store, me, requireActive, requireLeader, fbSecret, log }));
  /* ---------------- tài khoản (mã hóa) + hộp thư hợp nhất ---------------- */
  Object.assign(api, require('./accounts')({ store, settings, me, requireActive, requireLeader, log }));
  Object.assign(api, require('./inbox')({ fb, store, me, requireActive, fbSecret, log }));
  /* ---------------- 2.0 · đồng bộ 2 chiều với sheet team (PLAN 30 NGÀY) ---------------- */
  const team = require('./teamsync')({ google, store, settings, me, requireActive, requireLeader, log });
  Object.assign(api, team.api);
  /* ---------------- 2.0 · H. Thư viện nội dung ---------------- */
  Object.assign(api, require('./contentlib')({ google, store, settings, me, requireActive, requireLeader, log, teamCfg: team.cfgOf }));

  /* ---------------- Cài đặt dùng chung: Nội dung, Bộ nhận diện, Tài khoản của tôi ---------------- */
  const cfgJ = (cfg, k, def) => parseJson(cfg[k] && cfg[k].value, def);
  const boot0 = api.api_bootstrap;
  api.api_bootstrap = async function () {
    const r = await boot0();
    if (r.denied) return r;
    const cfg = (await store.load()).cfg;
    const content = cfgJ(cfg, 'content', {});
    if (Array.isArray(content.topics) && content.topics.length) {
      const old = {}; r.options.topics.forEach((t) => { old[t.name] = t; });
      r.options.topics = content.topics.map((n) => old[n] || { name: n });
    }
    (Array.isArray(content.ctas) ? content.ctas : []).forEach((c) => { if (c && (c.th || c.vi)) r.options.tags.push({ group: 'CTA dự án', tagVi: '', tagTh: '', ctaTh: c.th || c.vi, ctaVi: c.vi || '' }); });
    const avatars = {};
    Object.keys(cfg).forEach((k) => { if (k.indexOf('avatar:') === 0) avatars[k.slice(7)] = cfg[k].value; });
    Object.assign(r.settings, { content: { topics: content.topics || [], ctas: content.ctas || [], time: content.time || '19:00' }, brand: cfgJ(cfg, 'brand', {}), avatars, post: postCfg(cfg) });
    return r;
  };
  /* ---------------- 2.0 · D. Thao tác hàng loạt (Bài viết) ---------------- */
  async function bulk(ids, fn, label) {
    const m = requireActive(await me());
    ids = (ids || []).map(String);
    const data = await store.load(true);
    const done = [], skipped = [];
    data.posts.filter((p) => ids.indexOf(p.id) >= 0).forEach((p0) => {
      const p = Object.assign({}, p0);
      const r = fn(m, p, data);
      if (r === true) { p.updatedAt = fmt(new Date()); done.push(p); } else skipped.push((p.slogan || p.angle || p.id) + (r ? ': ' + r : ''));
    });
    if (done.length) await store.upsertPosts(done);
    log(m, label, done.length === 1 ? done[0].id : '', done.length + ' bài' + (skipped.length ? ' · bỏ qua ' + skipped.length : ''));
    return { done: done.length, skipped, posts: (await store.load(true)).posts.map(clean) };
  }
  api.api_bulkStatus = async function (ids, status) {
    if (STATUSES.indexOf(status) < 0) throw new Error('Trạng thái không đúng.');
    return bulk(ids, (m, p) => {
      if (!m.isLeader) return 'chỉ leader đổi trạng thái hàng loạt';
      if ([ST.POSTED, ST.SCHEDULED].indexOf(p.status) >= 0 && status !== ST.POSTED) return 'bài đã đăng/hẹn giờ';
      p.status = status; return true;
    }, 'Đổi trạng thái hàng loạt → ' + status);
  };
  api.api_bulkAssign = async function (ids, email) {
    return bulk(ids, (m, p, data) => {
      if (!m.isLeader) return 'chỉ leader gán người viết';
      const u = data.users.filter((x) => x.email === String(email || '').toLowerCase())[0];
      if (!u) return 'không thấy nhân sự';
      p.authorEmail = u.email; p.authorName = u.name; return true;
    }, 'Gán người viết hàng loạt');
  };
  /** Duyệt nhanh: Chờ duyệt → Đã duyệt, chưa chấm điểm (đánh dấu chờ hậu kiểm) */
  api.api_quickApprove = async function (ids) {
    return bulk(ids, (m, p) => {
      if (!m.canReview) return 'không có quyền duyệt';
      if (p.status !== ST.PENDING) return 'không ở Chờ duyệt';
      p.status = ST.APPROVED; p.audit = 'chờ'; p.reviewer = m.name; p.reviewedAt = fmt(new Date()); return true;
    }, 'Duyệt nhanh');
  };

  /** Khôi phục bản đã bỏ khi xử lý xung đột (từ Nhật ký) */
  api.api_restoreDropped = async function (id, fields) {
    const m = requireLeader(await me());
    const p = await find(id);
    const ok = team.FIELDS.map((f) => f[0]);
    const keys = Object.keys(fields || {}).filter((k) => ok.indexOf(k) >= 0);
    if (!keys.length) throw new Error('Không có trường nào để khôi phục.');
    keys.forEach((k) => { const v = fields[k]; p[k] = String(v && typeof v === 'object' ? v.value : v || ''); });
    if (keys.indexOf('pageName') >= 0) { const pages = (await store.load()).pages; p.pageId = String(p.pageName).split(',').map((n) => { const x = pages.filter((q) => q.name === n.trim())[0]; return x ? x.id : ''; }).filter(Boolean).join(','); }
    p.updatedAt = fmt(new Date());
    await store.writePost(p);
    log(m, 'Khôi phục bản đã bỏ', id, keys.join(', '));
    return clean(p);
  };

  /* ---------------- 2.0 · Cài đặt › Đăng bài & KPI ---------------- */
  const POST_DEF = { checks: CHECKS, slots: ['08:00', '11:00', '18:00'], maxPerDay: 3, audit: true, autoDown: true, kpi: 5, pass: 7, kpiBy: 'count', weights: { Lead: 40, Trust: 25, 'Bán hàng': 20, Traffic: 15 } };
  function postCfg(cfg) { const c = Object.assign({}, POST_DEF, cfgJ(cfg, 'postCfg', {})); c.checks = checksOf(cfg); return c; }
  api.api_savePostCfg = async function (o) {
    const m = requireLeader(await me());
    o = o || {};
    const cur = postCfg((await store.load(true)).cfg);
    if (Array.isArray(o.checks)) cur.checks = o.checks.map((x) => String(x || '').trim().slice(0, 200)).filter(Boolean).slice(0, 12);
    if (Array.isArray(o.slots)) cur.slots = o.slots.filter((x) => /^\d{2}:\d{2}$/.test(x)).sort().slice(0, 8);
    ['maxPerDay', 'kpi', 'pass'].forEach((k) => { if (o[k] !== undefined) cur[k] = Math.max(0, Math.round(Number(o[k]) || 0)); });
    ['audit', 'autoDown'].forEach((k) => { if (o[k] !== undefined) cur[k] = !!o[k]; });
    if (['count', 'pass', 'both'].indexOf(o.kpiBy) >= 0) cur.kpiBy = o.kpiBy;
    if (o.weights && typeof o.weights === 'object') { const w = {}; OPTIONS.goals.forEach((g) => { w[g] = Math.max(0, Math.round(Number(o.weights[g]) || 0)); }); cur.weights = w; }
    await store.setCfg('postCfg', JSON.stringify(cur));
    log(m, 'Cài đặt Đăng bài & KPI', '', JSON.stringify(o).slice(0, 250));
    return cur;
  };
  api.api_saveContent = async function (c) {
    const m = requireLeader(await me());
    c = c || {};
    const clean = {
      topics: (Array.isArray(c.topics) ? c.topics : []).map((x) => String(x || '').trim().slice(0, 60)).filter(Boolean).slice(0, 30),
      ctas: (Array.isArray(c.ctas) ? c.ctas : []).map((x) => ({ th: String((x || {}).th || '').trim().slice(0, 300), vi: String((x || {}).vi || '').trim().slice(0, 300) })).filter((x) => x.th || x.vi).slice(0, 30),
      time: /^\d{1,2}:\d{2}$/.test(String(c.time || '')) ? String(c.time) : '19:00'
    };
    await store.setCfg('content', JSON.stringify(clean));
    log(m, 'Cài đặt nội dung', '', clean.topics.length + ' chủ đề · ' + clean.ctas.length + ' CTA · ' + clean.time);
    return clean;
  };
  api.api_saveBrand = async function (b) {
    const m = requireLeader(await me());
    b = b || {};
    const clean = { logo: /^data:image\/(png|jpeg|webp);base64,/.test(String(b.logo || '')) ? String(b.logo) : '', lw: Number(b.lw) || 0, lh: Number(b.lh) || 0,
      colors: (Array.isArray(b.colors) ? b.colors : []).filter((x) => /^#[0-9a-f]{6}$/i.test(x)).slice(0, 6), font: String(b.font || '').slice(0, 60) };
    const s = JSON.stringify(clean);
    if (s.length > 45000) throw new Error('Logo quá lớn. Chọn ảnh nhỏ hơn (app tự thu về 256px).');
    await store.setCfg('brand', s);
    log(m, 'Bộ nhận diện', '', clean.colors.join(' ') + ' · ' + clean.font);
    return clean;
  };
  api.api_saveMe = async function (o) {
    const m = requireActive(await me());
    o = o || {};
    const data = await store.load(true);
    const u = data.users.filter((x) => x.email === m.email)[0];
    if (!u) throw new Error('Không thấy bạn trong Nhân sự.');
    const name = String(o.name || '').trim().slice(0, 60);
    if (name && name !== u.name) await store.saveUser(Object.assign({}, u, { name }));
    if (o.avatar !== undefined) {
      const av = /^data:image\/(png|jpeg|webp);base64,/.test(String(o.avatar || '')) ? String(o.avatar) : '';
      if (av.length > 40000) throw new Error('Ảnh đại diện quá lớn.');
      await store.setCfg('avatar:' + m.email, av);
    }
    return { name: name || u.name };
  };

  const pscOnly = processScheduledComments;
  /** 5 phút/lần trên máy leader: bình luận hẹn giờ + hàng chờ đăng (2.0) */
  async function processAll() { await pscOnly(); await processQueue(); }
  api.api_processQueue = async function () { requireLeader(await me()); await processQueue(); return (await store.load(true)).posts.map(clean); };
  return { api, me, processScheduledComments: processAll, metaOf, csv, inviteCode };
};

});
__def("teamsync", function (module, exports, require) {
/**
 * TNG Plus 2.0 · B. Đồng bộ 2 chiều giữa app (tab APP_BAI_VIET) và sheet team ("… PLAN 30 NGÀY" của từng nhân sự Content).
 *
 * - Mỗi nhân sự có 1 tab (APP_NHAN_SU cột "Tab trong sheet"). Các tab khác (TỔNG TEAM, Tổng Quan, PHÂN CÔNG, HƯỚNG DẪN…) chỉ đọc.
 * - Cột trong tab nhận ra theo TÊN tiêu đề (không theo vị trí). Cuối tab có thêm cột ẩn: Mã bài, Cập nhật lúc (+ Điểm, Người duyệt nếu tab chưa có).
 * - Mỗi bài trong app giữ "bản đã đồng bộ lần trước" (cột Đồng bộ sheet JSON). Lần đồng bộ sau so 3 bản:
 *     chỉ sheet đổi → lấy sheet · chỉ app đổi → ghi ra sheet · cả 2 đổi khác nhau → XUNG ĐỘT (người dùng chọn từng ô).
 * - Chỉ ghi đúng những ô thay đổi, không ghi đè cả dòng (người dùng có thể có cột riêng trong sheet).
 * - Trước khi "Ghép dữ liệu lần đầu" thì không tự đồng bộ (tránh nhân đôi bài).
 */
const { POST_COLS, ST, STATUSES, OPTIONS } = require('./constants');
const { fmt, stampId, parseJson } = require('./util');

/* trường đồng bộ: khóa app → các tên cột có thể gặp trong sheet */
const FIELDS = [
  ['date', 'Ngày', ['ngay', 'ngay dang', 'ngay dang bai']],
  ['time', 'Giờ (TH)', ['gio', 'gio (th)', 'gio dang', 'gio dang (th)', 'gio th', 'khung gio']],
  ['pageName', 'Fanpage', ['fanpage', 'page', 'trang']],
  ['frame', 'Khung nội dung (TH)', ['khung noi dung', 'khung noi dung (th)', 'khung noi dung th']],
  ['goal', 'Mục tiêu', ['muc tieu']],
  ['topic', 'Chủ đề', ['chu de', 'chu de (tru cot)', 'tru cot']],
  ['format', 'Format', ['format', 'dinh dang']],
  ['angle', 'Angles', ['angles', 'angle', 'angles (goc khai thac)', 'goc khai thac']],
  ['slogan', 'Slogan', ['slogan', 'hook', 'tieu de']],
  ['contentVi', 'Content VI', ['content vi', 'content tieng viet', 'noi dung vi', 'content viet']],
  ['contentTh', 'Content TH', ['content th', 'content tieng thai', 'noi dung th', 'content thai', 'content tieng thai (dang fb)']],
  ['link', 'Link bài viết', ['link bai viet', 'link bai', 'link post']],
  ['ads', 'Chạy Ads?', ['chay ads?', 'chay ads', 'ads?']],
  ['adsResult', 'Kết quả sau Ads', ['ket qua sau ads', 'ket qua ads']],
  ['visual', 'Visual', ['visual', 'visual (link media)', 'link media']],
  ['note', 'Ghi chú/tối ưu', ['ghi chu/toi uu', 'ghi chu', 'toi uu', 'ghi chu - toi uu']],
  ['status', 'Trạng thái', ['trang thai']],
  ['adsName', 'Tên/ID ads', ['ten/id ads', 'id ads', 'ten ads', 'ten/id quang cao']],
  ['review', 'Góp ý', ['gop y', 'gop y 1']],
  ['reviewVideo', 'Góp ý video', ['gop y video']],
  ['review2', 'Góp ý 2', ['gop y 2']],
  ['score', 'Điểm', ['diem', 'diem cham']],
  ['reviewer', 'Người duyệt', ['nguoi duyet']]
];
const LABEL = {}; FIELDS.forEach((f) => { LABEL[f[0]] = f[1]; });
const SYNC_KEYS = FIELDS.map((f) => f[0]);
const HIDDEN = [['code', 'Mã bài'], ['stamp', 'Cập nhật lúc']];
const EXTRA_HIDDEN = [['score', 'Điểm'], ['reviewer', 'Người duyệt']]; // thêm vào vùng ẩn nếu tab chưa có cột này
const CONTENT_KEYS = ['angle', 'contentTh', 'contentVi', 'slogan'];

function norm(s) {
  return String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd')
    .replace(/\s+/g, ' ').replace(/\s*([/()?:])\s*/g, '$1').trim();
}
const ALIAS = {};
FIELDS.forEach((f) => f[2].forEach((a) => { ALIAS[norm(a)] = f[0]; }));
HIDDEN.forEach((h) => { ALIAS[norm(h[1])] = h[0]; });
const val = (v) => String(v == null ? '' : v).replace(/\r\n?/g, '\n').trim();
function colA1(n) { let s = ''; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; }
function todayTH() { return new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10); }

/* ---------- chuyển đổi giá trị sheet ⇄ app ---------- */
function parseDate(s, ref) {
  s = val(s);
  if (!s) return '';
  let m = s.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return m[1] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[3]).slice(-2);
  m = s.match(/(\d{1,2})[/\-.](\d{1,2})(?:[/\-.](\d{2,4}))?/);
  if (!m) return '';
  const d = Number(m[1]), mo = Number(m[2]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return '';
  let y = m[3] ? Number(m[3]) : 0;
  if (y && y < 100) y += 2000;
  if (!y) {
    const t = ref || todayTH(), ty = Number(t.slice(0, 4));
    y = ty;
    const cand = Date.UTC(y, mo - 1, d), now = Date.parse(t + 'T00:00:00Z');
    if (cand - now > 200 * 864e5) y = ty - 1; else if (now - cand > 200 * 864e5) y = ty + 1;
  }
  return y + '-' + ('0' + mo).slice(-2) + '-' + ('0' + d).slice(-2);
}
function fmtDate(iso, like) {
  if (!iso) return '';
  const p = iso.split('-');
  return /\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}/.test(like || 'x/x/2026') || !like ? p[2] + '/' + p[1] + '/' + p[0] : p[2] + '/' + p[1];
}
function parseTime(s) {
  s = val(s);
  const m = s.match(/(\d{1,2})\s*[:hH.]\s*(\d{2})?/);
  if (!m) return '';
  const h = Number(m[1]), mi = Number(m[2] || 0);
  if (h > 23 || mi > 59) return '';
  return ('0' + h).slice(-2) + ':' + ('0' + mi).slice(-2);
}
function parseBool(s) { const v = norm(s); return v === 'true' || v === 'co' || v === 'x' || v === 'yes' || v === '1' || v === '✓' ? 'TRUE' : 'FALSE'; }
function parseGoal(s) { const v = val(s); const hit = OPTIONS.goals.filter((g) => norm(g) === norm(v))[0]; return hit || v; }
function parseStatus(s) { const v = val(s); if (!v) return ST.TODO; const hit = STATUSES.filter((x) => norm(x) === norm(v))[0]; return hit || v; }

/** Giá trị trong ô sheet → giá trị app (để so sánh/nhập) */
function fromCell(k, raw, ref) {
  if (k === 'date') return parseDate(raw, ref);
  if (k === 'time') return parseTime(raw);
  if (k === 'ads') return parseBool(raw);
  if (k === 'goal') return parseGoal(raw);
  if (k === 'status') return parseStatus(raw);
  return val(raw);
}
/** Giá trị app → ô sheet */
function toCell(k, v, like) {
  if (k === 'date') return fmtDate(v, like);
  if (k === 'ads') return v === 'TRUE'; // ô tick: ghi boolean
  return v == null ? '' : String(v);
}
/** Giá trị đồng bộ của 1 bài trong app (đã chuẩn hóa như khi đọc từ sheet) */
function appVals(p) {
  const o = {};
  SYNC_KEYS.forEach((k) => {
    let v = val(p[k]);
    if (k === 'ads') v = v === 'TRUE' ? 'TRUE' : 'FALSE';
    if (k === 'status') v = v || ST.TODO;
    if (k === 'goal') v = parseGoal(v);
    if (k === 'pageName') v = val(p.pageName).split(',').map((x) => x.trim()).filter(String).join(', ');
    o[k] = v;
  });
  return o;
}
function hasContent(o) { return CONTENT_KEYS.some((k) => val(o[k])); }
const angleKey = (s) => norm(s).replace(/[^a-z0-9฀-๿]+/g, '');

module.exports = function createTeamSync(deps) {
  const { google, store, me, requireActive, requireLeader, log } = deps;
  const sh = google.sheets;
  const R = (tab, a1) => sh.q(tab) + (a1 ? '!' + a1 : '');
  const CFG_TAB = 'APP_CAI_DAT';
  let lastSync = null; // kết quả lần đồng bộ gần nhất (cho giao diện)

  async function cfgOf() {
    const data = await store.load();
    const c = parseJson(data.cfg.team && data.cfg.team.value, {});
    if (!c.sheetId) c.sheetId = deps.settings.get('sheetId');
    if (c.lockCols === undefined) c.lockCols = true;
    if (c.auto === undefined) c.auto = true;
    return c;
  }
  async function saveCfg(c) { await store.setCfg('team', JSON.stringify(c)); }

  /** Bản đồ tab ↔ nhân sự (chỉ người còn trong dự án hoặc đã rời nhưng vẫn có tab) */
  function tabMap(users) {
    const out = {};
    users.filter((u) => u.tab).forEach((u) => { out[u.tab] = { email: u.email, name: u.name }; });
    return out;
  }

  /** Đọc các tab PLAN: tìm dòng tiêu đề, vị trí cột, các dòng bài. */
  async function readTabs(c, users) {
    const map = tabMap(users);
    const all = await sh.tabs(c.sheetId);
    const titles = all.map((t) => t.title);
    const want = Object.keys(map).filter((t) => titles.indexOf(t) >= 0);
    const got = want.length ? await sh.batchGet(c.sheetId, want.map((t) => R(t, 'A1:BZ'))) : [];
    const out = [];
    want.forEach((tab, i) => {
      const rows = got[i] || [];
      let hr = -1, best = 0;
      for (let r = 0; r < Math.min(12, rows.length); r++) {
        const n = (rows[r] || []).filter((h) => ALIAS[norm(h)] && ALIAS[norm(h)] !== 'code' && ALIAS[norm(h)] !== 'stamp').length;
        if (n > best) { best = n; hr = r; }
      }
      if (hr < 0 || best < 3) { out.push({ tab, owner: map[tab], error: 'Không thấy dòng tiêu đề (cần các cột như Ngày, Mục tiêu, Chủ đề, Angles…)' }); return; }
      const head = rows[hr] || [];
      const col = {};
      head.forEach((h, j) => { const k = ALIAS[norm(h)]; if (k && col[k] === undefined) col[k] = j; });
      let width = head.length;
      while (width > 0 && !val(head[width - 1])) width--;
      const items = [];
      for (let r = hr + 1; r < rows.length; r++) {
        const row = rows[r] || [];
        const o = { _row: r + 1, _raw: {} };
        Object.keys(col).forEach((k) => { o._raw[k] = row[col[k]]; });
        SYNC_KEYS.forEach((k) => { if (col[k] !== undefined) o[k] = fromCell(k, row[col[k]]); });
        o.code = val(col.code !== undefined ? row[col.code] : '');
        o.stamp = val(col.stamp !== undefined ? row[col.stamp] : '');
        if (!o.status) o.status = ST.TODO;
        items.push(o);
      }
      out.push({ tab, owner: map[tab], hr: hr + 1, col, width, rows: items, sheetId: all.filter((t) => t.title === tab)[0].sheetId });
    });
    Object.keys(map).filter((t) => titles.indexOf(t) < 0).forEach((t) => out.push({ tab: t, owner: map[t], error: 'Không có tab này trong sheet team' }));
    return out;
  }

  /** Giá trị đồng bộ của 1 dòng sheet, chỉ các trường tab có cột */
  function rowVals(T, o) {
    const v = {};
    SYNC_KEYS.forEach((k) => { if (T.col[k] !== undefined) v[k] = val(o[k]); });
    if (v.status === '') v.status = ST.TODO;
    return v;
  }
  const keysOf = (T) => SYNC_KEYS.filter((k) => T.col[k] !== undefined);

  /** Đảm bảo tab có cột ẩn Mã bài, Cập nhật lúc (+ Điểm, Người duyệt) → trả lại T đã cập nhật col */
  async function ensureHidden(c, T) {
    const add = HIDDEN.filter((h) => T.col[h[0]] === undefined).concat(EXTRA_HIDDEN.filter((h) => T.col[h[0]] === undefined));
    if (!add.length) return [];
    let at = Math.max(T.width, ...Object.keys(T.col).map((k) => T.col[k] + 1));
    const cells = [];
    add.forEach((h) => { T.col[h[0]] = at; cells.push({ range: R(T.tab, colA1(at + 1) + T.hr), values: [[h[1]]] }); at++; });
    await sh.batchUpdateValues(c.sheetId, cells);
    const first = Math.min(...add.map((h) => T.col[h[0]]));
    return [{ updateDimensionProperties: { range: { sheetId: T.sheetId, dimension: 'COLUMNS', startIndex: first, endIndex: at }, properties: { hiddenByUser: true }, fields: 'hiddenByUser' } }];
  }

  /** Thêm trạng thái còn thiếu vào ô chọn Trạng thái của tab (giữ nguyên các giá trị cũ). */
  async function statusInfo(c, tabs) {
    const ok = tabs.filter((T) => !T.error && T.col.status !== undefined);
    if (!ok.length) return [];
    const meta = await sh.cellMeta(c.sheetId, ok.map((T) => R(T.tab, colA1(T.col.status + 1) + (T.hr + 1))));
    return ok.map((T, i) => {
      const dv = (meta[i] || {}).validation;
      const cur = dv && dv.condition && dv.condition.type === 'ONE_OF_LIST' ? (dv.condition.values || []).map((x) => x.userEnteredValue) : [];
      return { T, dv, cur, missing: STATUSES.filter((s) => cur.map(norm).indexOf(norm(s)) < 0), protectedRanges: (meta[i] || {}).protectedRanges || [] };
    });
  }
  function statusRequests(infos) {
    return infos.filter((x) => x.missing.length).map((x) => {
      const rule = x.dv ? JSON.parse(JSON.stringify(x.dv)) : { condition: { type: 'ONE_OF_LIST', values: [] }, showCustomUi: true, strict: false };
      if (!rule.condition || rule.condition.type !== 'ONE_OF_LIST') rule.condition = { type: 'ONE_OF_LIST', values: [] };
      rule.condition.values = (x.cur.length ? x.cur : []).concat(x.missing).map((s) => ({ userEnteredValue: s }));
      return { setDataValidation: { range: { sheetId: x.T.sheetId, startRowIndex: x.T.hr, endRowIndex: Math.max(x.T.hr + 400, x.T.hr + x.T.rows.length + 200), startColumnIndex: x.T.col.status, endColumnIndex: x.T.col.status + 1 }, rule } };
    });
  }
  function protectRequests(infos, leaderEmail) {
    return infos.filter((x) => !x.protectedRanges.some((p) => p.description === 'TNG Plus · dòng tiêu đề')).map((x) => ({
      addProtectedRange: { protectedRange: { range: { sheetId: x.T.sheetId, startRowIndex: x.T.hr - 1, endRowIndex: x.T.hr }, description: 'TNG Plus · dòng tiêu đề', warningOnly: false, editors: { users: [leaderEmail] } } }
    }));
  }

  /* ---------- ghi ô ---------- */
  function cellsFor(T, rowNo, v, keys, raw) {
    const out = [];
    keys.forEach((k) => {
      if (T.col[k] === undefined) return;
      out.push({ range: R(T.tab, colA1(T.col[k] + 1) + rowNo), values: [[toCell(k, v[k], raw && raw[k])]] });
    });
    return out;
  }
  function stampCells(T, rowNo, id) {
    return [{ range: R(T.tab, colA1(T.col.code + 1) + rowNo), values: [[id]] }, { range: R(T.tab, colA1(T.col.stamp + 1) + rowNo), values: [[fmt(new Date())]] }];
  }
  /** Dòng trống để ghi bài mới: dòng cùng ngày chưa có nội dung, chưa có mã; không có thì dòng sau dòng cuối. */
  function freeRow(T, date, used) {
    const hit = T.rows.filter((o) => !o.code && !hasContent(o) && o.date === date && !used[o._row])[0];
    if (hit) { used[hit._row] = 1; return hit._row; }
    let last = T.hr;
    T.rows.forEach((o) => { if (o.code || hasContent(o) || o.date) last = Math.max(last, o._row); });
    Object.keys(used).forEach((r) => { last = Math.max(last, Number(r)); });
    used[last + 1] = 1;
    return last + 1;
  }

  /* ---------- bài app ---------- */
  function newPostFromRow(T, o, pages) {
    const p = {};
    POST_COLS.forEach((k) => { p[k] = ''; });
    p.id = o.code || ('P' + stampId() + Math.floor(Math.random() * 900 + 100));
    p.authorEmail = T.owner.email; p.authorName = T.owner.name;
    keysOf(T).forEach((k) => { p[k] = o[k]; });
    if (!p.status) p.status = ST.TODO;
    if (!p.ads) p.ads = 'FALSE';
    p.pageId = pageIdsOf(p.pageName, pages);
    p.source = 'Sheet'; p.createdAt = fmt(new Date()); p.updatedAt = p.createdAt; p.publishMode = 'schedule';
    return p;
  }
  function pageIdsOf(names, pages) {
    return String(names || '').split(/[,\n;]+/).map((s) => s.trim()).filter(String).map((n) => { const pg = pages.filter((x) => norm(x.name) === norm(n) || x.id === n)[0]; return pg ? pg.id : ''; }).filter(String).join(',');
  }
  function applyToPost(p, v, keys, pages) {
    keys.forEach((k) => { p[k] = v[k]; });
    if (keys.indexOf('pageName') >= 0) { const ids = pageIdsOf(v.pageName, pages); if (ids || !v.pageName) p.pageId = ids; }
  }
  function setBase(p, T, v) { p.sync = JSON.stringify({ tab: T.tab, base: v, at: fmt(new Date()) }); }
  /** Trạng thái nhân viên gõ trong sheet: chỉ nhận các bước của người viết; duyệt / hẹn giờ / lỗi đăng phải qua app. */
  function sheetStatusOk(from, to, link) {
    if (!to || to === from) return true;
    if ([ST.TODO, ST.DRAFT, ST.PENDING, ST.REVISE].indexOf(to) >= 0) return [ST.APPROVED, ST.SCHEDULED, ST.POSTED].indexOf(from) < 0;
    if (to === ST.POSTED) return /^https?:\/\//.test(String(link || '').trim()) && from !== ST.SCHEDULED; // đăng tay, có link bài
    return false; // Đã duyệt, Đã hẹn giờ, Lỗi đăng
  }
  /** Trước khi ghi: lấy bản mới nhất; trường nào đồng bộ không đổi thì giữ theo bản mới nhất (app vừa duyệt / đăng trong lúc đồng bộ chạy). */
  async function freshen(list, snap) {
    const fresh = {};
    (await store.load(true)).posts.forEach((x) => { fresh[x.id] = x; });
    const PUB = [ST.SCHEDULED, ST.POSTED, ST.FAILED];
    return list.map((p) => {
      const f = fresh[p.id], s = snap[p.id];
      if (!f || !s) return p;
      const o = Object.assign({}, p);
      POST_COLS.forEach((k) => { if (k !== 'sync' && k !== 'conflict' && val(p[k]) === val(s[k]) && val(f[k]) !== val(s[k])) o[k] = f[k]; });
      if (PUB.indexOf(f.status) >= 0 && PUB.indexOf(o.status) < 0) o.status = f.status; // bài đã lên / hẹn trên Facebook: không lùi trạng thái
      ['fbPosts', 'fbPostId', 'scheduledAt', 'postedAt', 'channelPosts'].forEach((k) => { o[k] = f[k]; }); // kết quả đăng chỉ do app ghi
      return o;
    });
  }

  /* ============ GHÉP LẦN ĐẦU ============ */
  /** So khớp app ↔ sheet: theo Mã bài, rồi theo ngày + người viết + angle. */
  function matchAll(tabs, posts) {
    const byId = {}; posts.forEach((p) => { byId[p.id] = p; });
    const used = {};
    const pairs = [], sheetOnly = [];
    tabs.filter((T) => !T.error).forEach((T) => {
      T.rows.forEach((o) => {
        if (!hasContent(o) && !o.code) return;
        let p = o.code && byId[o.code];
        if (!p) {
          p = posts.filter((x) => !used[x.id] && x.authorEmail === T.owner.email && x.date === o.date && angleKey(x.angle) && angleKey(x.angle) === angleKey(o.angle))[0];
        }
        if (p && !used[p.id]) { used[p.id] = 1; pairs.push({ T, o, p }); } else if (hasContent(o)) sheetOnly.push({ T, o });
      });
    });
    const tabOwners = tabs.filter((T) => !T.error).map((T) => T.owner.email);
    const appOnly = posts.filter((p) => !used[p.id] && tabOwners.indexOf(p.authorEmail) >= 0);
    return { pairs, sheetOnly, appOnly };
  }
  function diffFields(T, o, p) {
    const a = appVals(p), s = rowVals(T, o);
    return keysOf(T).filter((k) => k !== 'score' && k !== 'reviewer' && val(a[k]) !== val(s[k]) && !(k === 'pageName' && !s[k] && !a[k]))
      .map((k) => ({ f: k, label: LABEL[k], app: a[k], sheet: s[k] }));
  }

  async function preview() {
    const m = requireLeader(await me());
    const data = await store.load(true);
    const c = await cfgOf();
    const tabs = await readTabs(c, data.users);
    const { pairs, sheetOnly, appOnly } = matchAll(tabs, data.posts);
    const differ = [], same = [];
    pairs.forEach((x) => { const d = diffFields(x.T, x.o, x.p); if (d.length) differ.push({ id: x.p.id, tab: x.T.tab, row: x.o._row, title: x.p.slogan || x.p.angle || x.o.angle, who: x.T.owner.name, date: x.p.date, fields: d }); else same.push(x.p.id); });
    const infos = await statusInfo(c, tabs).catch(() => []);
    const missing = []; infos.forEach((x) => x.missing.forEach((s) => { if (missing.indexOf(s) < 0) missing.push(s); }));
    void m;
    return {
      sheetTitle: c.title || '', merged: !!c.merged, mergedAt: c.mergedAt || '',
      tabs: tabs.map((T) => ({ tab: T.tab, owner: T.owner, error: T.error || '', rows: T.rows ? T.rows.filter((o) => hasContent(o)).length : 0, cols: T.col ? Object.keys(T.col).map((k) => LABEL[k] || k) : [] })),
      match: same.length, sheetOnly: sheetOnly.length, appOnly: appOnly.length, differ,
      appCount: data.posts.length, sheetCount: pairs.length + sheetOnly.length,
      sheetOnlyList: sheetOnly.slice(0, 50).map((x) => ({ who: x.T.owner.name, date: x.o.date, angle: x.o.angle })),
      appOnlyList: appOnly.slice(0, 50).map((p) => ({ who: p.authorName, date: p.date, angle: p.angle || p.slogan })),
      missingStatuses: missing
    };
  }

  /** choices: { postId: 'app' | 'sheet' } cho các bài khác nhau (mặc định app) */
  async function apply(choices) {
    const m = requireLeader(await me());
    choices = choices || {};
    const data = await store.load(true);
    const c = await cfgOf();
    const tabs = await readTabs(c, data.users);
    const good = tabs.filter((T) => !T.error);
    const reqs = [];
    for (const T of good) reqs.push(...await ensureHidden(c, T));
    const infos = await statusInfo(c, good).catch(() => []);
    reqs.push(...statusRequests(infos));
    if (c.lockCols) reqs.push(...protectRequests(infos, m.email));
    const { pairs, sheetOnly, appOnly } = matchAll(good, data.posts);
    const cells = [], save = [];
    let nSheet = 0, nApp = 0, nPick = 0;
    pairs.forEach((x) => {
      const keys = keysOf(x.T);
      const d = diffFields(x.T, x.o, x.p);
      const side = choices[x.p.id] === 'sheet' ? 'sheet' : 'app';
      if (d.length) nPick++;
      if (d.length && side === 'sheet') applyToPost(x.p, rowVals(x.T, x.o), d.map((f) => f.f), data.pages);
      const v = appVals(x.p);
      if (d.length && side === 'app') cells.push(...cellsFor(x.T, x.o._row, v, d.map((f) => f.f), x.o._raw));
      cells.push(...stampCells(x.T, x.o._row, x.p.id));
      const base = {}; keys.forEach((k) => { base[k] = v[k]; });
      setBase(x.p, x.T, base); if (!x.p.source) x.p.source = 'App';
      save.push(x.p);
    });
    sheetOnly.forEach((x) => {
      const p = newPostFromRow(x.T, x.o, data.pages);
      const base = {}; keysOf(x.T).forEach((k) => { base[k] = appVals(p)[k]; });
      setBase(p, x.T, base);
      cells.push(...stampCells(x.T, x.o._row, p.id));
      save.push(p); nSheet++;
    });
    const usedRows = {};
    appOnly.forEach((p) => {
      const T = good.filter((t) => t.owner.email === p.authorEmail)[0];
      if (!T) return;
      const row = freeRow(T, p.date, usedRows);
      const v = appVals(p);
      cells.push(...cellsFor(T, row, v, keysOf(T)));
      cells.push(...stampCells(T, row, p.id));
      const base = {}; keysOf(T).forEach((k) => { base[k] = v[k]; });
      setBase(p, T, base); if (!p.source) p.source = 'App';
      save.push(p); nApp++;
    });
    if (reqs.length) await sh.batchUpdate(c.sheetId, reqs);
    for (let i = 0; i < cells.length; i += 400) await sh.batchUpdateValues(c.sheetId, cells.slice(i, i + 400));
    await store.upsertPosts(save);
    c.merged = true; c.mergedAt = fmt(new Date()); c.mergedBy = m.email;
    c.mergeStat = { total: (await store.load(true)).posts.length, fromSheet: nSheet, toSheet: nApp, picked: nPick, statuses: infos.reduce((a, x) => a + x.missing.length, 0) ? STATUSES.length - Math.min(...infos.map((x) => x.cur.length || STATUSES.length)) : 0 };
    await saveCfg(c);
    log(m, 'Ghép dữ liệu lần đầu', '', nSheet + ' bài từ sheet · ' + nApp + ' bài ra sheet · ' + nPick + ' bài khác nhau');
    return Object.assign({ ok: true }, c.mergeStat, { added: infos.map((x) => x.missing.length).reduce((a, b) => Math.max(a, b), 0) });
  }

  /* ============ ĐỒNG BỘ ĐỊNH KỲ ============ */
  async function takeLock(m, data) {
    const cur = data.cfg.syncLock ? String(data.cfg.syncLock.value) : '';
    const [who, at] = cur.split('|');
    if (who && who !== m.email && Date.now() - Number(at || 0) < 90e3) return false;
    const v = m.email + '|' + Date.now();
    if (data.cfg.syncLock && data.cfg.syncLock.row) await sh.update(deps.settings.get('sheetId'), R(CFG_TAB, 'A' + data.cfg.syncLock.row + ':B' + data.cfg.syncLock.row), [['syncLock', v]]);
    else await sh.append(deps.settings.get('sheetId'), R(CFG_TAB, 'A1'), [['syncLock', v]]);
    return true;
  }

  async function sync(force) {
    const m = requireActive(await me());
    if (google.local) return { off: true, reason: 'offline' };
    const c = await cfgOf();
    if (!c.merged) return { off: true, reason: 'chưa ghép' };
    if (!c.auto && !force) return { off: true, reason: 'tắt' };
    const data = await store.load(true);
    if (!(await takeLock(m, data))) return { skipped: true, by: String(data.cfg.syncLock.value).split('|')[0] };
    const snap = {}; data.posts.forEach((p) => { snap[p.id] = Object.assign({}, p); }); // bản lúc đọc, để biết đồng bộ đã đổi trường nào
    const tabs = (await readTabs(c, data.users)).filter((T) => !T.error);
    const reqs = [];
    for (const T of tabs) reqs.push(...await ensureHidden(c, T));
    if (reqs.length) await sh.batchUpdate(c.sheetId, reqs);
    const byId = {}; data.posts.forEach((p) => { byId[p.id] = p; });
    const seen = {};
    const cells = [], save = [];
    let toApp = 0, toSheet = 0, imported = 0, conflicts = 0;
    const now = fmt(new Date());
    for (const T of tabs) {
      const keys = keysOf(T);
      for (const o of T.rows) {
        if (o.code && byId[o.code]) {
          const p = byId[o.code];
          seen[p.id] = 1;
          const sv = rowVals(T, o), av = appVals(p);
          const st = parseJson(p.sync, {});
          const base = st.base || {};
          const sCh = keys.filter((k) => val(sv[k]) !== val(base[k]));
          const aCh = keys.filter((k) => val(av[k]) !== val(base[k]));
          const clash = sCh.filter((k) => aCh.indexOf(k) >= 0 && val(sv[k]) !== val(av[k]));
          const old = parseJson(p.conflict, null);
          let toA = sCh.filter((k) => clash.indexOf(k) < 0 && val(sv[k]) !== val(av[k]));
          const toS = aCh.filter((k) => clash.indexOf(k) < 0 && val(sv[k]) !== val(av[k]));
          // trạng thái gõ ở sheet không được bỏ qua quy trình: không tự "Đã duyệt / Đã hẹn giờ / Lỗi đăng"; "Đã đăng" chỉ khi có link bài
          if (toA.indexOf('status') >= 0 && !sheetStatusOk(av.status, sv.status, sv.link || av.link)) { toA = toA.filter((k) => k !== 'status'); toS.push('status'); }
          let dirty = false;
          if (toA.length) { applyToPost(p, sv, toA, data.pages); toApp++; dirty = true; }
          if (toS.length) { cells.push(...cellsFor(T, o._row, av, toS, o._raw)); cells.push(...stampCells(T, o._row, p.id)); toSheet++; }
          const nb = Object.assign({}, base);
          keys.forEach((k) => { if (clash.indexOf(k) < 0) nb[k] = val(appVals(p)[k]); });
          // các trường cả 2 bên giống nhau sau khi đổi: coi như đã khớp
          keys.forEach((k) => { if (val(sv[k]) === val(appVals(p)[k])) nb[k] = val(sv[k]); });
          if (JSON.stringify(nb) !== JSON.stringify(base) || st.tab !== T.tab) { p.sync = JSON.stringify({ tab: T.tab, base: nb, at: now }); dirty = true; }
          if (clash.length) {
            const cf = { fields: {}, by: T.owner.name, byEmail: T.owner.email, at: (old && old.at) || now, tab: T.tab, row: o._row };
            clash.forEach((k) => { cf.fields[k] = { label: LABEL[k], app: av[k], sheet: sv[k] }; });
            const js = JSON.stringify(cf);
            if (js !== p.conflict) { if (!old) conflicts++; p.conflict = js; dirty = true; }
          } else if (old) { p.conflict = ''; dirty = true; }
          if (dirty) { p.updatedAt = p.updatedAt || now; save.push(p); }
        } else if (hasContent(o) && !(o.code && seen[o.code])) {
          // bài mới viết trong sheet (hoặc có mã của bài app đã xóa → nhập lại, không mất dữ liệu)
          const p = newPostFromRow(T, o, data.pages);
          const base = {}; keys.forEach((k) => { base[k] = appVals(p)[k]; });
          setBase(p, T, base);
          cells.push(...stampCells(T, o._row, p.id));
          seen[p.id] = 1; byId[p.id] = p; save.push(p); imported++;
        }
      }
    }
    // bài app của người có tab nhưng chưa có trong sheet → ghi ra sheet
    const usedRows = {};
    data.posts.filter((p) => !seen[p.id]).forEach((p) => {
      const T = tabs.filter((t) => t.owner.email === p.authorEmail)[0];
      if (!T) return;
      const row = freeRow(T, p.date, usedRows);
      const v = appVals(p), keys = keysOf(T);
      cells.push(...cellsFor(T, row, v, keys));
      cells.push(...stampCells(T, row, p.id));
      const base = {}; keys.forEach((k) => { base[k] = v[k]; });
      setBase(p, T, base); p.conflict = '';
      if (!p.source) p.source = 'App';
      save.push(p); toSheet++;
    });
    for (let i = 0; i < cells.length; i += 400) await sh.batchUpdateValues(c.sheetId, cells.slice(i, i + 400));
    if (save.length) await store.upsertPosts(await freshen(save, snap));
    if (conflicts) log(m, 'Xung đột đồng bộ', '', conflicts + ' bài bị sửa ở 2 nơi');
    lastSync = { at: now, by: m.email, toApp, toSheet, imported, conflicts };
    return Object.assign({ ok: true }, lastSync);
  }

  /** picks: { field: 'app' | 'sheet' }. Bản không chọn ghi vào Nhật ký để khôi phục. */
  async function resolve(id, picks) {
    const m = requireActive(await me());
    const data = await store.load(true);
    const p = data.posts.filter((x) => x.id === String(id))[0];
    if (!p) throw new Error('Không thấy bài ' + id + '.');
    if (!(m.isLeader || p.authorEmail === m.email)) throw new Error('Chỉ người viết hoặc leader chọn được bản cho bài này.');
    const cf = parseJson(p.conflict, null);
    if (!cf) return Object.assign({}, p);
    const c = await cfgOf();
    const tabs = (await readTabs(c, data.users)).filter((T) => !T.error);
    let T = null, o = null;
    tabs.forEach((t) => t.rows.forEach((r) => { if (r.code === p.id) { T = t; o = r; } }));
    picks = picks || {};
    const dropped = {};
    const toSheet = [];
    Object.keys(cf.fields).forEach((k) => {
      const f = cf.fields[k];
      if (picks[k] === 'sheet') { dropped[k] = { side: 'app', value: f.app }; applyToPost(p, { [k]: f.sheet, pageName: k === 'pageName' ? f.sheet : p.pageName }, [k], data.pages); }
      else { dropped[k] = { side: 'sheet', value: f.sheet }; toSheet.push(k); }
    });
    const v = appVals(p);
    if (T && o) {
      const cells = cellsFor(T, o._row, v, toSheet, o._raw).concat(stampCells(T, o._row, p.id));
      await sh.batchUpdateValues(c.sheetId, cells);
      const st = parseJson(p.sync, {});
      const base = Object.assign({}, st.base || {});
      keysOf(T).forEach((k) => { base[k] = v[k]; });
      setBase(p, T, base);
    }
    p.conflict = '';
    p.updatedAt = fmt(new Date());
    await store.upsertPosts([p]);
    await store.logLong(fmt(new Date()), m.email, 'Xung đột: bản bỏ', p.id, JSON.stringify({ title: p.slogan || p.angle, by: cf.by, at: cf.at, dropped }));
    return Object.assign({}, p);
  }

  async function info() {
    requireActive(await me());
    const c = await cfgOf();
    const data = await store.load();
    return {
      sheetId: c.sheetId, sameFile: c.sheetId === deps.settings.get('sheetId'), merged: !!c.merged, mergedAt: c.mergedAt || '', mergeStat: c.mergeStat || null,
      auto: c.auto !== false, lockCols: c.lockCols !== false, last: lastSync,
      url: 'https://docs.google.com/spreadsheets/d/' + c.sheetId + '/edit',
      tabs: data.users.filter((u) => u.tab).map((u) => ({ email: u.email, name: u.name, tab: u.tab }))
    };
  }
  async function setConfig(patch) {
    const m = requireLeader(await me());
    const c = await cfgOf();
    patch = patch || {};
    if (patch.sheet !== undefined) {
      const id = (String(patch.sheet).match(/\/d\/([-\w]{25,})/) || [])[1] || (String(patch.sheet).match(/^[-\w]{25,}$/) || [])[0];
      if (!id) throw new Error('Dán link Google Sheet của team (dạng https://docs.google.com/spreadsheets/d/…).');
      if (id !== c.sheetId) { c.sheetId = id; c.merged = false; c.mergedAt = ''; }
    }
    if (patch.auto !== undefined) c.auto = !!patch.auto;
    if (patch.lockCols !== undefined) c.lockCols = !!patch.lockCols;
    await saveCfg(c);
    log(m, 'Cài đặt đồng bộ sheet team', '', JSON.stringify(patch).slice(0, 200));
    return info();
  }
  /** Danh sách tab trong sheet team (để chọn tab cho nhân sự) */
  async function sheetTabs() {
    requireActive(await me());
    const c = await cfgOf();
    return (await sh.tabs(c.sheetId)).map((t) => t.title);
  }
  /** Thêm 3 trạng thái mới vào ô chọn Trạng thái (Cài đặt › Dữ liệu & Google) */
  async function addStatuses() {
    const m = requireLeader(await me());
    const data = await store.load(true);
    const c = await cfgOf();
    const tabs = (await readTabs(c, data.users)).filter((T) => !T.error);
    const infos = await statusInfo(c, tabs);
    const reqs = statusRequests(infos);
    if (reqs.length) await sh.batchUpdate(c.sheetId, reqs);
    log(m, 'Thêm trạng thái vào sheet', '', reqs.length + ' tab');
    return { tabs: reqs.length, added: infos.map((x) => x.missing).reduce((a, b) => a.concat(b.filter((s) => a.indexOf(s) < 0)), []) };
  }
  /** Tạo tab "<TÊN> PLAN 30 NGÀY" theo mẫu (chép tab PLAN đầu tiên, xóa trắng phần bài viết, giữ tiêu đề + ngày) */
  async function newTab(name) {
    const m = requireLeader(await me());
    const c = await cfgOf();
    const data = await store.load(true);
    const title = String(name || '').trim().toUpperCase() + ' PLAN 30 NGÀY';
    if (!String(name || '').trim()) throw new Error('Nhập tên để đặt tên tab.');
    const all = await sh.tabs(c.sheetId);
    if (all.some((t) => t.title === title)) return { tab: title, existed: true };
    const tabs = (await readTabs(c, data.users)).filter((T) => !T.error);
    if (!tabs.length) {
      await sh.batchUpdate(c.sheetId, [{ addSheet: { properties: { title, gridProperties: { frozenRowCount: 1 } } } }]);
      await sh.update(c.sheetId, R(title, 'A1'), [['Ngày', 'Khung nội dung (TH)', 'Mục tiêu', 'Chủ đề', 'Format', 'Angles', 'Content VI', 'Content TH', 'Link bài viết', 'Chạy Ads?', 'Kết quả sau Ads', 'Visual', 'Ghi chú/tối ưu', 'Trạng thái', 'Tên/ID ads', 'Góp ý', 'Góp ý video', 'Góp ý 2']]);
    } else {
      const T = tabs[0];
      await sh.batchUpdate(c.sheetId, [{ duplicateSheet: { sourceSheetId: T.sheetId, newSheetName: title } }]);
      const cells = [];
      T.rows.forEach((o) => Object.keys(T.col).filter((k) => k !== 'date').forEach((k) => { cells.push({ range: R(title, colA1(T.col[k] + 1) + o._row), values: [[k === 'ads' ? false : k === 'status' && o._raw.status !== undefined ? ST.TODO : '']] }); }));
      for (let i = 0; i < cells.length; i += 400) await sh.batchUpdateValues(c.sheetId, cells.slice(i, i + 400));
    }
    log(m, 'Tạo tab sheet team', '', title);
    return { tab: title };
  }
  /** Bài bị xóa trong app: xóa nội dung dòng sheet (trừ cột Ngày) + Mã bài. */
  async function clearRows(ids) {
    if (google.local) return 0;
    const c = await cfgOf();
    if (!c.merged) return 0;
    const data = await store.load();
    const tabs = (await readTabs(c, data.users)).filter((T) => !T.error);
    const cells = [];
    tabs.forEach((T) => T.rows.forEach((o) => {
      if (!o.code || ids.indexOf(o.code) < 0) return;
      Object.keys(T.col).filter((k) => k !== 'date').forEach((k) => { cells.push({ range: R(T.tab, colA1(T.col[k] + 1) + o._row), values: [[k === 'ads' ? false : '']] }); });
    }));
    if (cells.length) await sh.batchUpdateValues(c.sheetId, cells);
    return cells.length;
  }
  /** Ghi 1 bài ra sheet ngay (sau khi duyệt/đăng…) — không chờ chu kỳ 1 phút. Lỗi thì bỏ qua, chu kỳ sau ghi bù. */
  async function pushNow() { try { return await sync(true); } catch (e) { return { error: String(e.message || e) }; } }

  return {
    FIELDS, LABEL, norm, parseDate, readTabs, cfgOf, pushNow, clearRows,
    api: {
      api_teamInfo: info,
      api_teamConfig: setConfig,
      api_teamTabs: sheetTabs,
      api_teamNewTab: newTab,
      api_mergePreview: preview,
      api_mergeApply: apply,
      api_teamSync: async function (force) {
        const r = await sync(!!force);
        const data = await store.load();
        return Object.assign(r, { posts: data.posts.map((p) => { const o = {}; POST_COLS.forEach((k) => { o[k] = p[k] == null ? '' : String(p[k]); }); return o; }) });
      },
      api_conflictResolve: resolve,
      api_teamAddStatuses: addStatuses
    }
  };
};

});
__def("contentlib", function (module, exports, require) {
/**
 * TNG Plus 2.0 · H. Thư viện nội dung: Hook Việt–Thái · Hashtag & CTA · Hướng dẫn chủ đề · Chiến lược & KPI.
 * Đọc từ các tab cùng tên trong sheet team (nếu có), không có thì trong file Sheet của dự án. Leader thêm/sửa → ghi lại đúng tab đó.
 * Cột nhận theo tên tiêu đề. "Chiến lược & KPI" là nội dung tự do: lưu ở APP_CAI_DAT (khóa strategy), lấy mặc định từ tab nếu có.
 */
const { parseJson, fmt } = require('./util');
const TABS = {
  hook: { names: ['HOOK', 'HOOK VIỆT – THÁI', 'HOOK VIỆT - THÁI', 'HOOK VIET THAI', 'THƯ VIỆN HOOK'], cols: [['type', ['loai', 'loai hook', 'dang']], ['goal', ['muc tieu']], ['vi', ['hook tieng viet', 'hook vi', 'tieng viet', 'hook (vi)']], ['th', ['hook tieng thai', 'hook th', 'tieng thai', 'hook (th)']], ['when', ['khi dung', 'khi nao dung', 'ghi chu']]], head: ['Loại', 'Mục tiêu', 'Hook tiếng Việt', 'Hook tiếng Thái', 'Khi dùng'] },
  cta: { names: ['HASHTAG & CTA'], cols: [['group', ['nhom']], ['tagVi', ['hashtag vi', 'hashtag tieng viet']], ['tagTh', ['hashtag th', 'hashtag thai', 'hashtag tieng thai']], ['ctaTh', ['cta th', 'cta tieng thai', 'cta thai']], ['ctaVi', ['cta vi', 'cta tieng viet']]], head: ['STT', 'Nhóm', 'Hashtag VI', 'Hashtag TH', 'CTA TH', 'CTA VI'] },
  topic: { names: ['HƯỚNG DẪN CHỦ ĐỀ'], cols: [['name', ['chu de', 'tru cot', 'ten chu de']], ['when', ['khi nao', 'khi nao chon', 'khi nao dung']], ['includes', ['gom', 'bao gom']], ['examples', ['vi du']], ['diff', ['tranh nham', 'khac voi']]], head: ['Chủ đề', 'Khi nào', 'Gồm', 'Ví dụ', 'Tránh nhầm'] }
};
const STRATEGY = ['Định vị thương hiệu', 'Khách hàng & angle', 'KPI quảng cáo theo tuần', 'Media brief', 'Cấu trúc test quảng cáo', 'Kiểm tra trước khi đăng'];
const norm = (s) => String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/\s+/g, ' ').trim();
function colA1(n) { let s = ''; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; }

module.exports = function createLib(d) {
  const { google, store, settings, me, requireActive, requireLeader, log, teamCfg } = d;
  const sh = google.sheets;
  const R = (tab, a1) => sh.q(tab) + (a1 ? '!' + a1 : '');

  /** Tìm tab: sheet team trước, rồi sheet dự án */
  async function locate(kind) {
    const spec = TABS[kind];
    const ids = [];
    try { const c = await teamCfg(); if (c && c.sheetId) ids.push(c.sheetId); } catch (e) { /* chưa nối sheet team */ }
    const own = settings.get('sheetId'); if (ids.indexOf(own) < 0) ids.push(own);
    for (const id of ids) {
      let tabs = [];
      try { tabs = await sh.tabs(id); } catch (e) { continue; }
      const hit = tabs.filter((t) => spec.names.map(norm).indexOf(norm(t.title)) >= 0)[0];
      if (hit) return { sheetId: id, tab: hit.title, gid: hit.sheetId };
    }
    return { sheetId: own, tab: spec.names[0], gid: null, missing: true };
  }
  /** Đọc bảng theo tên cột (dòng tiêu đề = dòng đầu có ≥2 tên cột khớp) */
  async function readKind(kind) {
    const spec = TABS[kind], loc = await locate(kind);
    if (loc.missing) return { loc, items: [] };
    const rows = await sh.get(loc.sheetId, R(loc.tab, 'A1:J400'));
    let hr = -1, col = {};
    for (let r = 0; r < Math.min(10, rows.length) && hr < 0; r++) {
      const c = {};
      (rows[r] || []).forEach((h, j) => { spec.cols.forEach((s) => { if (c[s[0]] === undefined && s[1].indexOf(norm(h)) >= 0) c[s[0]] = j; }); });
      if (Object.keys(c).length >= 2) { hr = r; col = c; }
    }
    if (hr < 0) return { loc, items: [], badHead: true };
    const items = [];
    for (let r = hr + 1; r < rows.length; r++) {
      const row = rows[r] || [];
      const o = { row: r + 1 };
      spec.cols.forEach((s) => { o[s[0]] = col[s[0]] !== undefined ? String(row[col[s[0]]] || '').trim() : ''; });
      if (spec.cols.some((s) => o[s[0]])) items.push(o);
    }
    loc.col = col; loc.hr = hr + 1;
    return { loc, items };
  }
  async function strategy() {
    const data = await store.load();
    const saved = parseJson(data.cfg.strategy && data.cfg.strategy.value, null);
    if (Array.isArray(saved) && saved.length) return saved;
    return STRATEGY.map((t) => ({ title: t, body: '' }));
  }
  async function library() {
    requireActive(await me());
    const [h, c, t] = await Promise.all([readKind('hook'), readKind('cta'), readKind('topic')]);
    return { hooks: h.items, ctas: c.items, topics: t.items, strategy: await strategy(), src: { hook: h.loc, cta: c.loc, topic: t.loc } };
  }
  /** Leader thêm/sửa 1 mục. kind: hook | cta | topic | strategy */
  async function save(kind, item) {
    const m = requireLeader(await me());
    item = item || {};
    if (kind === 'strategy') {
      const list = (Array.isArray(item.list) ? item.list : []).map((x) => ({ title: String((x && x.title) || '').trim().slice(0, 80), body: String((x && x.body) || '').trim().slice(0, 4000) })).filter((x) => x.title);
      await store.setCfg('strategy', JSON.stringify(list));
      log(m, 'Thư viện: Chiến lược & KPI', '', list.length + ' mục');
      return library();
    }
    const spec = TABS[kind]; if (!spec) throw new Error('Không rõ loại mục.');
    let { loc } = await readKind(kind);
    if (loc.missing) {
      // chưa có tab: tạo trong file Sheet của dự án
      await sh.batchUpdate(loc.sheetId, [{ addSheet: { properties: { title: loc.tab, gridProperties: { frozenRowCount: 1 } } } }]);
      await sh.update(loc.sheetId, R(loc.tab, 'A1'), [spec.head]);
      loc = (await readKind(kind)).loc;
    }
    if (!loc.col) throw new Error('Tab ' + loc.tab + ' không có dòng tiêu đề đúng (cần các cột ' + spec.head.join(', ') + ').');
    const cells = [];
    let rowNo = Number(item.row) || 0;
    if (!rowNo) { const all = await sh.get(loc.sheetId, R(loc.tab, 'A1:J1000')); rowNo = Math.max(all.length, loc.hr) + 1; }
    spec.cols.forEach((s) => { if (loc.col[s[0]] !== undefined && item[s[0]] !== undefined) cells.push({ range: R(loc.tab, colA1(loc.col[s[0]] + 1) + rowNo), values: [[String(item[s[0]] || '').trim()]] }); });
    if (!cells.length) throw new Error('Không có nội dung để lưu.');
    await sh.batchUpdateValues(loc.sheetId, cells);
    log(m, 'Thư viện: ' + (item.row ? 'sửa ' : 'thêm ') + kind, '', String(item.th || item.ctaTh || item.name || '').slice(0, 80));
    return library();
  }
  async function remove(kind, row) {
    const m = requireLeader(await me());
    const { loc } = await readKind(kind);
    if (loc.missing || !Number(row) || Number(row) <= loc.hr) throw new Error('Không xóa được mục này.');
    await sh.batchUpdate(loc.sheetId, [{ deleteDimension: { range: { sheetId: loc.gid, dimension: 'ROWS', startIndex: Number(row) - 1, endIndex: Number(row) } } }]);
    log(m, 'Thư viện: xóa ' + kind, '', 'dòng ' + row + ' · ' + fmt(new Date()));
    return library();
  }
  return { api_library: library, api_libSave: save, api_libDelete: remove };
};

});
__def("accounts", function (module, exports, require) {
/**
 * Tài khoản (TNG Plus 1.8): kho via / TKQC / UID / TikTok / Instagram / Threads.
 * Thông tin đăng nhập mã hóa AES-256-GCM bằng khóa riêng của từng dự án. Khóa chỉ nằm trên máy (settings secret 'vault'),
 * leader gửi cho người được phép qua mã cài đặt riêng. Sheet chỉ chứa chuỗi đã mã hóa. Mỗi lần xem/sao chép ghi APP_NHAT_KY_XEM.
 */
const crypto = require('crypto');
const { fmt, parseJson } = require('./util');

const T_ACC = 'APP_TAI_KHOAN', T_VIEW = 'APP_NHAT_KY_XEM';
const TYPES = ['via', 'tkqc', 'fb', 'tiktok', 'instagram', 'threads'];
const STATUSES = ['Đang chạy', 'Live', 'Đang mồi', 'Sale Pancake', 'Checkpoint', 'Die', 'Không dùng'];
const SECRET_FIELDS = ['pass', 'twofa', 'remail', 'epass', 'cookie'];
const FIELD_NAMES = { pass: 'Mật khẩu', twofa: 'Mã 2FA', remail: 'Email khôi phục', epass: 'Pass email', cookie: 'Cookie' };

module.exports = function createAccounts(d) {
  const { store, settings, me, requireActive, requireLeader, log } = d;
  const sheetId = () => settings.get('sheetId');

  /* ---------------- khóa của dự án ---------------- */
  const kidOf = (key) => crypto.createHash('sha256').update(key).digest('hex').slice(0, 12);
  function localKey() { const v = (settings.secret('vault') || {})[sheetId()]; return v ? Buffer.from(v, 'base64') : null; }
  function saveKey(sid, b64) { const v = settings.secret('vault') || {}; v[sid] = b64; settings.setSecret('vault', v); }
  async function projectKid() { const c = (await store.load()).cfg.vaultKid; return c ? c.value : ''; }
  /** Khóa dùng được trên máy này. Leader chưa có khóa nào cho dự án thì tạo mới. */
  async function key(m, create) {
    const kid = await projectKid();
    const k = localKey();
    if (k && (!kid || kidOf(k) === kid)) { if (!kid && m.isLeader) await store.setCfg('vaultKid', kidOf(k)); return k; }
    if (!kid && create && m.isLeader) {
      const nk = crypto.randomBytes(32);
      saveKey(sheetId(), nk.toString('base64'));
      await store.setCfg('vaultKid', kidOf(nk));
      log(m, 'Tạo khóa bảo mật dự án', '', kidOf(nk));
      return nk;
    }
    const e = new Error(k ? 'Khóa bảo mật trên máy này không khớp với dự án. Nhờ leader gửi lại mã khóa.' : 'Máy này chưa có khóa bảo mật của dự án. Nhờ leader gửi mã khóa (Tài khoản → Cấp khóa) rồi dán vào ô "Nhập khóa".');
    e.code = 'nokey'; throw e;
  }
  function enc(k, obj) {
    const iv = crypto.randomBytes(12);
    const c = crypto.createCipheriv('aes-256-gcm', k, iv);
    const ct = Buffer.concat([c.update(JSON.stringify(obj), 'utf8'), c.final()]);
    return 'v1.' + kidOf(k) + '.' + Buffer.concat([iv, c.getAuthTag(), ct]).toString('base64');
  }
  function dec(k, s) {
    const p = String(s || '').split('.');
    if (p[0] !== 'v1' || !p[2]) return {};
    const b = Buffer.from(p[2], 'base64');
    const dc = crypto.createDecipheriv('aes-256-gcm', k, b.subarray(0, 12));
    dc.setAuthTag(b.subarray(12, 28));
    return JSON.parse(Buffer.concat([dc.update(b.subarray(28)), dc.final()]).toString('utf8'));
  }

  /* ---------------- dữ liệu ---------------- */
  const rowToItem = (r) => ({ id: r[0], type: r[1], uid: r[2], name: r[3], pic: String(r[4] || '').toLowerCase(), viaType: r[5], adAcc: r[6], status: r[7], secret: r[8], addedAt: r[9], note: r[10], addedBy: String(r[11] || '').toLowerCase(), updatedAt: r[12] });
  const itemToRow = (x) => [x.id, x.type, x.uid, x.name, x.pic, x.viaType, x.adAcc, x.status, x.secret, x.addedAt, x.note, x.addedBy, x.updatedAt];
  async function items() { return (await store.rows(T_ACC)).map(rowToItem); }
  function requireAcc(m) { requireActive(m); if (!m.isLeader && !(m.mods && m.mods.acc)) throw new Error('Bạn chưa được giao mục Tài khoản. Nhờ leader bật ở Cài đặt → Phân quyền.'); return m; }
  const canSecret = (m, x) => m.isLeader || (x.pic && x.pic === m.email);
  const pub = (m, x) => { const o = Object.assign({}, x, { hasSecret: !!x.secret, canReveal: canSecret(m, x), canEdit: m.isLeader || x.pic === m.email || x.addedBy === m.email }); delete o.secret; return o; };

  const api = {};
  api.api_accList = async function () {
    const data = await store.load(true);
    const m = requireAcc(await me());
    const list = await items();
    const kid = await projectKid();
    const k = localKey();
    const counts = { viaTk: 0, fb: 0, fanpage: data.pages.length, tiktok: 0, instagram: 0, threads: 0 };
    list.forEach((x) => { if (x.type === 'via' || x.type === 'tkqc') counts.viaTk++; else if (counts[x.type] !== undefined) counts[x.type]++; });
    return { items: list.map((x) => pub(m, x)), counts, statuses: STATUSES, types: TYPES,
      key: { has: !!(k && (!kid || kidOf(k) === kid)), projectHas: !!kid, mismatch: !!(k && kid && kidOf(k) !== kid) } };
  };
  api.api_accSave = async function (input) {
    const m = requireAcc(await me());
    input = input || {};
    const list = await items();
    const old = input.id ? list.filter((x) => x.id === String(input.id))[0] : null;
    if (input.id && !old) throw new Error('Không thấy tài khoản này (có thể đã bị xóa).');
    if (old && !(m.isLeader || old.pic === m.email || old.addedBy === m.email)) throw new Error('Chỉ PIC, người thêm hoặc leader sửa được tài khoản này.');
    const type = TYPES.indexOf(input.type) >= 0 ? input.type : 'via';
    const uid = String(input.uid || '').trim().slice(0, 120);
    if (!uid) throw new Error('Điền UID / Username.');
    if (list.some((x) => x.uid === uid && x.type === type && (!old || x.id !== old.id))) throw new Error('UID / Username này đã có trong kho.');
    const x = old ? Object.assign({}, old) : { id: 'TK' + Date.now().toString(36).toUpperCase() + crypto.randomBytes(2).toString('hex'), addedAt: fmt(new Date()), addedBy: m.email, secret: '' };
    Object.assign(x, { type, uid, name: String(input.name || '').trim().slice(0, 80), pic: String(input.pic || '').trim().toLowerCase(),
      viaType: String(input.viaType || '').trim().slice(0, 80), adAcc: String(input.adAcc || '').trim().slice(0, 120),
      status: STATUSES.indexOf(input.status) >= 0 ? input.status : STATUSES[1], note: String(input.note || '').trim().slice(0, 1000), updatedAt: fmt(new Date()) });
    const sec = input.secrets || {};
    const given = SECRET_FIELDS.filter((f) => String(sec[f] || '').trim());
    if (given.length) {
      if (old && !canSecret(m, old)) throw new Error('Chỉ PIC của tài khoản này hoặc leader được đổi thông tin đăng nhập.');
      const k = await key(m, true);
      const cur = x.secret ? dec(k, x.secret) : {};
      given.forEach((f) => { cur[f] = String(sec[f]).trim().slice(0, 20000); });
      x.secret = enc(k, cur);
    }
    if (x.secret.length > 45000) throw new Error('Thông tin đăng nhập quá dài (cookie quá lớn).');
    await store.putRow(T_ACC, itemToRow(x));
    log(m, old ? 'Sửa tài khoản' : 'Thêm tài khoản', '', type + ' · ' + uid + (given.length ? ' · có thông tin đăng nhập' : ''));
    return pub(m, x);
  };
  api.api_accDelete = async function (id) {
    const m = requireAcc(await me());
    const x = (await items()).filter((y) => y.id === String(id))[0];
    if (!x) return true;
    if (!(m.isLeader || x.addedBy === m.email)) throw new Error('Chỉ leader hoặc người thêm xóa được tài khoản này.');
    await store.delRow(T_ACC, x.id);
    log(m, 'Xóa tài khoản', '', x.type + ' · ' + x.uid);
    return true;
  };
  /** Xem hoặc sao chép 1 mục. Mỗi lần đều ghi nhật ký (ai, lúc nào, via nào, mục nào). */
  api.api_accReveal = async function (id, field, action) {
    const m = requireAcc(await me());
    const x = (await items()).filter((y) => y.id === String(id))[0];
    if (!x) throw new Error('Không thấy tài khoản này.');
    if (!canSecret(m, x)) throw new Error('Chỉ PIC của tài khoản này hoặc leader được xem thông tin đăng nhập.');
    if (SECRET_FIELDS.indexOf(field) < 0) throw new Error('Mục không đúng.');
    const k = await key(m, false);
    let val = '';
    try { val = (dec(k, x.secret) || {})[field] || ''; } catch (e) { throw new Error('Không giải mã được. Khóa trên máy này không đúng.'); }
    const act = action === 'copy' ? 'Sao chép' : 'Xem';
    await store.addRow(T_VIEW, [fmt(new Date()), m.email, act, x.id, x.uid, FIELD_NAMES[field]]);
    return { field, value: val };
  };
  api.api_accViewLog = async function (limit) {
    requireLeader(await me());
    return (await store.rows(T_VIEW)).slice(-(Number(limit) || 500)).reverse().map((r) => ({ at: r[0], email: r[1], action: r[2], id: r[3], uid: r[4], field: r[5] }));
  };
  /** Mã cài đặt riêng (HC1- có kèm khóa) cho người được phép xem thông tin đăng nhập. */
  api.api_vaultCode = async function (email) {
    const m = requireLeader(await me());
    email = String(email || '').toLowerCase();
    const u = (await store.load(true)).users.filter((x) => x.email === email && x.active)[0];
    if (!u) throw new Error('Chọn người đang có trong Nhân sự.');
    const k = await key(m, true);
    const c = settings.all();
    const pj = (c.projects || []).filter((p) => p.sheetId === c.sheetId)[0];
    log(m, 'Cấp khóa bảo mật', '', email);
    return 'HC1-' + Buffer.from(JSON.stringify({ c: c.clientId, s: c.clientSecret, sh: c.sheetId, n: pj ? pj.name : '', k: k.toString('base64'), e: email })).toString('base64url');
  };
  /** Nhân viên đã cài app: dán mã có khóa để nhận khóa của dự án đang mở. */
  api.api_vaultImport = async function (code) {
    const m = requireActive(await me());
    const mm = String(code || '').match(/HC1-([-\w]+)/);
    let j = null;
    try { j = mm ? JSON.parse(Buffer.from(mm[1], 'base64url').toString()) : null; } catch (e) { j = null; }
    if (!j || !j.k) throw new Error('Mã không có khóa bảo mật. Nhờ leader bấm "Cấp khóa" cho bạn.');
    if (j.sh !== sheetId()) throw new Error('Mã khóa này của dự án khác. Mở đúng dự án rồi dán lại.');
    if (j.e && j.e !== m.email) throw new Error('Mã khóa này cấp cho ' + j.e + ', không phải cho bạn.');
    const kid = await projectKid();
    if (kid && kidOf(Buffer.from(j.k, 'base64')) !== kid) throw new Error('Khóa trong mã đã cũ, không khớp dự án.');
    saveKey(sheetId(), j.k);
    log(m, 'Nhận khóa bảo mật', '', '');
    return true;
  };
  return api;
};
module.exports.TYPES = TYPES;
module.exports.STATUSES = STATUSES;

});
__def("ads", function (module, exports, require) {
/**
 * Quảng cáo (1.6): đọc Marketing API bằng user token Facebook trên máy leader.
 * Số liệu lấy được lưu vào tab APP_QC_SO_LIEU để nhân viên (máy không có token) xem lại được.
 * Quy trình "Cần khắc phục" lưu ở tab APP_KHAC_PHUC. Mốc chấm điểm: APP_CAI_DAT khóa adRules.
 */
const { fmt, parseJson } = require('./util');

const PRESETS = ['today', 'last_7d', 'last_30d', 'this_month'];
const FX = { NEW: 'Chưa đọc', SEEN: 'Đã xem', FIXING: 'Đang fix', FIXED: 'Đã fix', OK: 'Đã duyệt' };
// tiền tệ không có phần lẻ: Meta tính daily_budget theo đơn vị chính (offset 1)
const ZERO_DEC = ['CLP', 'COP', 'CRC', 'HUF', 'ISK', 'IDR', 'JPY', 'KRW', 'PYG', 'TWD', 'VND'];
const FIELDS = 'spend,impressions,reach,frequency,cpm,ctr,inline_link_click_ctr,actions,action_values,video_p25_watched_actions,video_p50_watched_actions,video_p75_watched_actions';
const T_DATA = 'APP_QC_SO_LIEU', T_FIX = 'APP_KHAC_PHUC';

module.exports = function createAds(d) {
  const { fb, store, me, requireActive, requireLeader, fbSecret, log } = d;

  function permMsg(e, perm) {
    const m = String((e && e.message) || e);
    if (/\(#(10|200|294|275)\)|permission|ads_read|ads_management|not authori[sz]ed|requires .*(permission|access)/i.test(m)) {
      return 'Chờ duyệt quyền ' + perm + ' cho app Meta. Khi Meta duyệt xong, lấy lại token rồi bấm Kết nối Facebook lại trong Cài đặt.';
    }
    return m.replace(/^Facebook báo lỗi: /, 'Facebook báo lỗi: ');
  }
  function userToken() {
    const t = fbSecret().userToken;
    if (!t) throw new Error('Máy này chưa kết nối Facebook. Leader vào Cài đặt → Kết nối Facebook trên máy này.');
    return t;
  }
  async function cfgJson(key, def) { const c = (await store.load()).cfg[key]; return parseJson(c && c.value, def); }
  const offset = (cur) => (ZERO_DEC.indexOf(String(cur || '').toUpperCase()) >= 0 ? 1 : 100);

  /* ---- chuẩn hóa 1 dòng insights ---- */
  const n = (v) => { const x = Number(v); return isFinite(x) ? x : 0; };
  function sumAct(list, types) {
    const a = Array.isArray(list) ? list : [];
    for (const t of types) { const f = a.filter((x) => x.action_type === t); if (f.length) return f.reduce((s, x) => s + n(x.value), 0); }
    return 0;
  }
  function norm(r) {
    r = r || {};
    return {
      spend: n(r.spend), impr: n(r.impressions), reach: n(r.reach), freq: n(r.frequency), cpm: n(r.cpm), ctr: n(r.ctr), ctrLink: n(r.inline_link_click_ctr),
      msg: sumAct(r.actions, ['onsite_conversion.messaging_conversation_started_7d']),
      buy: sumAct(r.actions, ['omni_purchase', 'purchase', 'offsite_conversion.fb_pixel_purchase']),
      value: sumAct(r.action_values, ['omni_purchase', 'purchase', 'offsite_conversion.fb_pixel_purchase']),
      cmt: sumAct(r.actions, ['comment']),
      v3s: sumAct(r.actions, ['video_view']),
      p25: sumAct(r.video_p25_watched_actions, ['video_view']), p50: sumAct(r.video_p50_watched_actions, ['video_view']), p75: sumAct(r.video_p75_watched_actions, ['video_view'])
    };
  }

  async function fetchAcc(acc, preset, tok) {
    const out = { id: acc.id, at: fmt(new Date()) };
    try {
      const a = await fb.call('get', '/' + acc.id + '/insights', { level: 'account', date_preset: preset, fields: FIELDS }, tok);
      out.m = norm((a.data || [])[0]);
      const rows = await fb.all('/' + acc.id + '/insights', { level: 'campaign', date_preset: preset, fields: 'campaign_id,campaign_name,' + FIELDS, limit: 200 }, tok);
      const camps = await fb.all('/' + acc.id + '/campaigns', { fields: 'id,name,effective_status,daily_budget', limit: 200 }, tok);
      const byId = {};
      rows.forEach((r) => { byId[String(r.campaign_id)] = r; });
      out.camps = camps.map((c) => ({ id: String(c.id), name: c.name, status: c.effective_status || '', budget: c.daily_budget ? n(c.daily_budget) / offset(acc.currency) : 0, m: norm(byId[String(c.id)]) }))
        .filter((c) => c.m.spend > 0 || c.status === 'ACTIVE')
        .sort((x, y) => y.m.spend - x.m.spend).slice(0, 120);
    } catch (e) { out.error = permMsg(e, 'ads_read'); }
    return out;
  }

  /* ---- ai thấy TK nào ---- */
  function canSee(m, acc) {
    if (m.isLeader) return true;
    if (!m.mods || !m.mods.ads) return false;
    if (acc.pic && acc.pic === m.email) return true;
    if (!m.pagePerms) return true;
    return !!(acc.pageId && (m.pagePerms[acc.pageId] || []).indexOf('stats') >= 0);
  }
  const isPic = (m, acc) => m.isLeader || (acc && acc.pic === m.email);

  async function fixes() {
    const out = {};
    (await store.rows(T_FIX)).forEach((r) => { out[r[0]] = { id: r[0], status: r[1] || FX.NEW, steps: parseJson(r[2], {}), log: parseJson(r[3], []), at: r[4] || '', note: r[5] || '' }; });
    return out;
  }

  const api = {};

  /** Leader: danh sách TKQC của tài khoản Facebook đã kết nối + TK đã chọn cho dự án. */
  api.api_adAccounts = async function () {
    requireLeader(await me());
    const saved = await cfgJson('adAccounts', []);
    let all = [], error = '';
    try {
      all = (await fb.all('/me/adaccounts', { fields: 'id,name,account_status,currency', limit: 200 }, userToken()))
        .map((a) => ({ id: String(a.id), name: a.name || a.id, status: Number(a.account_status) || 0, currency: a.currency || '' }));
    } catch (e) { error = permMsg(e, 'ads_read'); }
    return { all, saved, error };
  };
  api.api_adSaveAccounts = async function (list) {
    const m = requireLeader(await me());
    const clean = (Array.isArray(list) ? list : []).filter((a) => a && /^act_\d+$/.test(String(a.id))).slice(0, 100)
      .map((a) => ({ id: String(a.id), name: String(a.name || a.id).slice(0, 80), currency: String(a.currency || '').slice(0, 5), pic: String(a.pic || '').toLowerCase(), pageId: String(a.pageId || '') }));
    await store.setCfg('adAccounts', JSON.stringify(clean));
    log(m, 'Chọn TK quảng cáo', '', clean.length + ' TK');
    return clean;
  };
  api.api_adSaveRules = async function (rules) {
    const m = requireLeader(await me());
    const s = JSON.stringify(rules || {});
    if (s.length > 20000) throw new Error('Mốc chấm điểm quá lớn.');
    await store.setCfg('adRules', s);
    log(m, 'Sửa mốc chấm quảng cáo', '', '');
    return rules;
  };

  /** Báo cáo: leader có token thì lấy mới (refresh hoặc chưa có/cũ hơn 30 phút); còn lại đọc bản đã lưu trên Sheet. */
  api.api_adReport = async function (preset, refresh) {
    await store.load(true);
    const m = requireActive(await me());
    if (!m.isLeader && !(m.mods && m.mods.ads)) throw new Error('Bạn chưa được giao mục Quảng cáo. Nhờ leader bật ở Cài đặt → Phân quyền.');
    preset = PRESETS.indexOf(preset) >= 0 ? preset : 'last_7d';
    await store.load(true);
    const accs = (await cfgJson('adAccounts', [])).filter((a) => canSee(m, a));
    const cache = {};
    (await store.rows(T_DATA)).forEach((r) => { if (r[0].indexOf(preset + '|') === 0) cache[r[1]] = parseJson(r[2], null); });
    const hasTok = !!fbSecret().userToken;
    let live = false, note = '';
    if (m.isLeader && hasTok && accs.length) {
      const old = accs.some((a) => !cache[a.id] || !cache[a.id].at || (Date.now() - new Date(cache[a.id].at.replace(' ', 'T') + ':00+07:00').getTime()) > 30 * 60e3);
      if (refresh || old) {
        const tok = userToken();
        for (let i = 0; i < accs.length; i += 4) {
          const got = await Promise.all(accs.slice(i, i + 4).map((a) => fetchAcc(a, preset, tok)));
          for (const g of got) {
            cache[g.id] = g;
            if (!g.error) { let s = JSON.stringify(g); if (s.length > 45000) { g.camps = g.camps.slice(0, 40); s = JSON.stringify(g); } await store.putRow(T_DATA, [preset + '|' + g.id, g.id, s, g.at]); }
          }
        }
        live = true;
      }
    } else if (!hasTok) note = m.isLeader ? 'Máy này chưa kết nối Facebook nên chỉ xem số liệu đã lưu.' : 'Số liệu do app leader cập nhật.';
    const fx = await fixes();
    return {
      preset, live, note,
      accounts: accs.map((a) => Object.assign({}, a, { data: cache[a.id] || null })),
      rules: await cfgJson('adRules', null),
      fixes: accs.reduce((o, a) => { if (fx[a.id]) o[a.id] = fx[a.id]; return o; }, {}),
      canEdit: m.isLeader, canControl: m.isLeader && hasTok
    };
  };

  /** Quy trình khắc phục: Chưa đọc → Đã xem → Đang fix → Đã fix (chờ duyệt) → Đã duyệt / Chưa ổn, làm lại. */
  api.api_adFix = async function (accId, action, arg) {
    const m = requireActive(await me());
    accId = String(accId || '');
    const acc = (await cfgJson('adAccounts', [])).filter((a) => a.id === accId)[0];
    if (!acc) throw new Error('Không thấy tài khoản quảng cáo ' + accId + '.');
    if (!isPic(m, acc)) throw new Error('Chỉ PIC của tài khoản này hoặc leader được thao tác.');
    const f = (await fixes())[accId] || { id: accId, status: FX.NEW, steps: {}, log: [], note: '' };
    const flow = { seen: [[FX.NEW], FX.SEEN, 'Đã xem'], start: [[FX.NEW, FX.SEEN], FX.FIXING, 'Bắt đầu fix'], done: [[FX.FIXING], FX.FIXED, 'Đã fix, chờ duyệt'],
      approve: [[FX.FIXED], FX.OK, 'Leader duyệt'], reject: [[FX.FIXED], FX.FIXING, 'Chưa ổn, làm lại'], reopen: [[FX.OK, FX.FIXED, FX.FIXING, FX.SEEN], FX.NEW, 'Mở lại'] };
    let text = '';
    if (flow[action]) {
      if ((action === 'approve' || action === 'reject' || action === 'reopen') && !m.isLeader) throw new Error('Chỉ leader duyệt hoặc trả lại được.');
      if (flow[action][0].indexOf(f.status) < 0) throw new Error('Thẻ đang ở bước "' + f.status + '".');
      f.status = flow[action][1]; text = flow[action][2] + (arg ? ': ' + String(arg).slice(0, 300) : '');
      if (action === 'reopen') f.steps = {};
    } else if (action === 'step') {
      const k = String((arg || {}).key || '').slice(0, 40);
      if (!k) throw new Error('Thiếu việc cần tick.');
      if ((arg || {}).on) f.steps[k] = { by: m.name, at: fmt(new Date()) }; else delete f.steps[k];
      text = ((arg || {}).on ? 'Tick: ' : 'Bỏ tick: ') + String((arg || {}).label || k).slice(0, 120);
      if (f.status === FX.NEW || f.status === FX.SEEN) f.status = FX.FIXING;
    } else if (action === 'note') {
      f.note = String(arg || '').slice(0, 1000); text = 'Ghi chú: ' + f.note.slice(0, 200);
    } else throw new Error('Thao tác không đúng.');
    f.at = fmt(new Date());
    f.log = [{ at: f.at, by: m.name, a: text }].concat(f.log || []).slice(0, 60);
    await store.putRow(T_FIX, [accId, f.status, JSON.stringify(f.steps), JSON.stringify(f.log), f.at, f.note]);
    log(m, 'Khắc phục QC', '', acc.name + ' · ' + text);
    return f;
  };

  /** Bật/tắt camp, sửa ngân sách ngày (leader/quản lý, máy có token). */
  api.api_adCampaign = async function (accId, campId, change) {
    const m = requireLeader(await me());
    const acc = (await cfgJson('adAccounts', [])).filter((a) => a.id === String(accId))[0];
    if (!acc) throw new Error('Không thấy tài khoản quảng cáo này trong dự án.');
    change = change || {};
    const params = {};
    let text = '';
    if (change.status) { params.status = change.status === 'ACTIVE' ? 'ACTIVE' : 'PAUSED'; text = params.status === 'ACTIVE' ? 'Bật camp' : 'Tắt camp'; }
    if (change.budget !== undefined) {
      const b = Number(change.budget);
      if (!(b > 0)) throw new Error('Ngân sách ngày phải lớn hơn 0.');
      params.daily_budget = String(Math.round(b * offset(acc.currency)));
      text = 'Ngân sách ngày ' + b.toLocaleString('vi-VN') + ' ' + (acc.currency || '');
    }
    if (!Object.keys(params).length) throw new Error('Không có gì để đổi.');
    if (!/^\d+$/.test(String(campId))) throw new Error('ID camp không đúng.');
    try { await fb.call('post', '/' + campId, params, userToken()); }
    catch (e) { throw new Error(permMsg(e, 'ads_management')); }
    log(m, 'Quảng cáo', '', acc.name + ' · ' + campId + ' · ' + text);
    return { id: String(campId), status: params.status, budget: change.budget !== undefined ? Number(change.budget) : undefined };
  };

  return api;
};
module.exports.FX = FX;

});
__def("inbox", function (module, exports, require) {
/**
 * Hộp thư hợp nhất (TNG Plus 1.8): tin nhắn Messenger, Instagram và bình luận mới của mọi Page được giao quyền "Trả lời".
 * Cần token Page trên máy này (máy đã Kết nối Facebook). Thiếu quyền Meta thì báo "Chờ duyệt quyền …".
 * Trạng thái "Đã xử lý" dùng chung cả team ở tab APP_HOP_THU.
 */
const { fmt } = require('./util');
const T_BOX = 'APP_HOP_THU';

module.exports = function createInbox(d) {
  const { fb, store, me, requireActive, fbSecret, log } = d;
  function permMsg(e, perm) {
    const m = String((e && e.message) || e);
    if (/\(#(10|200|230|299|3)\)|permission|not authori[sz]ed|requires/i.test(m)) return 'Chờ duyệt quyền ' + perm + ' cho app Meta. Khi Meta duyệt xong, lấy lại token rồi Kết nối Facebook lại.';
    return m;
  }
  function canReply(m, pid) {
    if (m.isLeader) return true;
    if (!m.pagePerms) return !!(m.mods && m.mods.acc);
    return (m.pagePerms[pid] || []).indexOf('reply') >= 0;
  }
  async function myPages(m) {
    const pages = (await store.load()).pages;
    const sec = fbSecret().pages || {};
    const allowed = pages.filter((p) => canReply(m, p.id));
    return { pages: allowed.filter((p) => sec[p.id]), noToken: allowed.filter((p) => !sec[p.id]).length, sec };
  }
  async function handled() {
    const o = {};
    (await store.rows(T_BOX)).forEach((r) => { o[r[0]] = { status: r[3], by: r[4], at: r[5] }; });
    return o;
  }

  const api = {};
  api.api_inbox = async function () {
    await store.load(true);
    const m = requireActive(await me());
    const { pages, noToken, sec } = await myPages(m);
    const items = [], errors = [];
    const one = async (p) => {
      const tok = sec[p.id];
      for (const plat of ['messenger', 'instagram']) {
        try {
          const cs = await fb.call('get', '/' + p.id + '/conversations', { platform: plat, fields: 'id,updated_time,snippet,unread_count,participants,messages.limit(1){message,from,created_time}', limit: 20 }, tok);
          (cs.data || []).forEach((c) => {
            const last = ((c.messages || {}).data || [])[0] || {};
            const other = ((c.participants || {}).data || []).filter((x) => String(x.id) !== String(p.id))[0] || {};
            items.push({ id: c.id, kind: plat === 'messenger' ? 'msg' : 'ig', pageId: p.id, pageName: p.name, from: { id: other.id || '', name: other.name || other.username || 'Khách' },
              text: c.snippet || last.message || '', at: c.updated_time || last.created_time || '', unread: Number(c.unread_count) || 0 });
          });
        } catch (e) { errors.push({ pageId: p.id, pageName: p.name, what: plat === 'messenger' ? 'Tin nhắn Messenger' : 'Tin nhắn Instagram', error: permMsg(e, plat === 'messenger' ? 'pages_messaging' : 'instagram_manage_messages') }); }
      }
      try {
        const feed = await fb.call('get', '/' + p.id + '/feed', { fields: 'id,message,permalink_url,created_time,comments.limit(15).order(reverse_chronological){id,message,from,created_time}', limit: 10 }, tok);
        (feed.data || []).forEach((post) => {
          ((post.comments || {}).data || []).forEach((c) => {
            if (c.from && String(c.from.id) === String(p.id)) return;
            items.push({ id: c.id, kind: 'cmt', pageId: p.id, pageName: p.name, from: { id: (c.from || {}).id || '', name: (c.from || {}).name || 'Khách' }, text: c.message || '', at: c.created_time || '', postText: String(post.message || '').slice(0, 200), link: post.permalink_url || '' });
          });
        });
      } catch (e) { errors.push({ pageId: p.id, pageName: p.name, what: 'Bình luận', error: permMsg(e, 'pages_read_engagement') }); }
    };
    for (let i = 0; i < Math.min(pages.length, 40); i += 4) await Promise.all(pages.slice(i, i + 4).map(one));
    const h = await handled();
    items.forEach((x) => { const s = h[x.id]; x.done = !!(s && s.status === 'Đã xử lý'); x.doneBy = s ? s.by : ''; x.doneAt = s ? s.at : ''; });
    items.sort((a, b) => String(b.at).localeCompare(String(a.at)));
    return { items, errors, pages: pages.length, noToken, at: fmt(new Date()) };
  };
  api.api_inboxThread = async function (pageId, convId) {
    const m = requireActive(await me());
    if (!canReply(m, String(pageId))) throw new Error('Bạn chưa được giao quyền trả lời tin nhắn của Page này.');
    const tok = (fbSecret().pages || {})[String(pageId)];
    if (!tok) throw new Error('Máy này chưa có token của Page.');
    try {
      const r = await fb.call('get', '/' + convId + '/messages', { fields: 'id,message,from,created_time', limit: 30 }, tok);
      return (r.data || []).map((x) => ({ id: x.id, text: x.message || '', from: (x.from || {}).name || '', mine: String((x.from || {}).id) === String(pageId), at: x.created_time || '' })).reverse();
    } catch (e) { throw new Error(permMsg(e, 'pages_messaging')); }
  };
  api.api_inboxReply = async function (item, text) {
    const m = requireActive(await me());
    item = item || {}; text = String(text || '').trim();
    if (!text) throw new Error('Gõ nội dung trả lời.');
    const pid = String(item.pageId || '');
    if (!canReply(m, pid)) throw new Error('Bạn chưa được giao quyền "Trả lời bình luận & tin nhắn" cho Page này.');
    const tok = (fbSecret().pages || {})[pid];
    if (!tok) throw new Error('Máy này chưa có token của Page.');
    try {
      if (item.kind === 'cmt') await fb.call('post', '/' + item.id + '/comments', { message: text }, tok);
      else {
        if (!item.toId) throw new Error('Không thấy người nhận.');
        await fb.call('post', '/' + pid + '/messages', { recipient: JSON.stringify({ id: item.toId }), message: JSON.stringify({ text: text }), messaging_type: 'RESPONSE' }, tok);
      }
    } catch (e) { throw new Error(permMsg(e, item.kind === 'cmt' ? 'pages_manage_engagement' : item.kind === 'ig' ? 'instagram_manage_messages' : 'pages_messaging')); }
    await store.putRow(T_BOX, [item.id, item.kind, pid, 'Đã xử lý', m.name, fmt(new Date())]);
    log(m, 'Trả lời ' + (item.kind === 'cmt' ? 'bình luận' : 'tin nhắn'), '', (item.pageName || pid) + ' · ' + text.slice(0, 80));
    return { done: true, by: m.name, at: fmt(new Date()) };
  };
  api.api_inboxDone = async function (item, on) {
    const m = requireActive(await me());
    item = item || {};
    if (!canReply(m, String(item.pageId))) throw new Error('Bạn chưa được giao quyền cho Page này.');
    await store.putRow(T_BOX, [item.id, item.kind || '', item.pageId, on ? 'Đã xử lý' : 'Chưa xử lý', m.name, fmt(new Date())]);
    return { done: !!on, by: m.name, at: fmt(new Date()) };
  };
  return api;
};

});
__def("channels", function (module, exports, require) {
/**
 * Đăng thêm lên Instagram, Threads, TikTok (TNG Plus 1.5).
 * - Instagram: dùng tài khoản IG doanh nghiệp nối với Page, token Page sẵn có. Cần quyền instagram_basic + instagram_content_publish.
 *   Ảnh/video được gửi lên Page dạng "không đăng" để lấy đường dẫn công khai cho Instagram.
 * - Threads: token Threads dài hạn (dán trong Cài đặt). Cần quyền threads_basic + threads_content_publish.
 * - TikTok: Client key/secret + refresh token (Content Posting API, quyền video.publish). App chưa được TikTok duyệt chỉ đăng được "Chỉ mình tôi".
 */
const fs = require('fs');
const { fetch } = require('undici');

module.exports = function createChannels(o) {
  const { fb, settings, pageToken, asFile } = o;
  const E = process.env;
  const THREADS = E.HC_THREADS_GRAPH || 'https://graph.threads.net/v1.0';
  const TIKTOK = E.HC_TIKTOK_API || 'https://open.tiktokapis.com';
  const POLL = Number(E.HC_CH_POLL || 5000);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const permHint = (msg, perm) => (/permission|\(#10\)|\(#200\)|not authorized|OAuthException|scope/i.test(msg) ? 'Chờ duyệt quyền ' + perm + ': ' + msg : msg);

  /* ---------- đường dẫn công khai cho ảnh/video (qua Page, không đăng) ---------- */
  async function publicImage(pageId, file) {
    const tk = pageToken(pageId);
    const r = await fb.call('post', '/' + pageId + '/photos', { source: asFile(file), published: 'false', temporary: 'true' }, tk);
    const g = await fb.call('get', '/' + r.id, { fields: 'images' }, tk);
    const im = (g.images || []).sort((a, b) => (b.width || 0) - (a.width || 0))[0];
    if (!im) throw new Error('Không lấy được đường dẫn ảnh.');
    return im.source;
  }
  async function publicVideo(pageId, file) {
    const tk = pageToken(pageId);
    const r = await fb.call('post', '/' + pageId + '/videos', { source: asFile(file), published: 'false' }, tk, fb.videoHost);
    for (let i = 0; i < 60; i++) {
      const g = await fb.call('get', '/' + r.id, { fields: 'source' }, tk);
      if (g.source) return g.source;
      await sleep(POLL);
    }
    throw new Error('Facebook xử lý video quá lâu, chưa lấy được đường dẫn video.');
  }

  /* ---------- Instagram ---------- */
  async function igAccounts(pageIds) {
    const out = [];
    for (const pid of pageIds) {
      try {
        const r = await fb.call('get', '/' + pid, { fields: 'instagram_business_account{id,username}' }, pageToken(pid));
        out.push(r.instagram_business_account ? { pageId: pid, id: r.instagram_business_account.id, username: r.instagram_business_account.username || '' } : { pageId: pid });
      } catch (e) { out.push({ pageId: pid, error: permHint(String(e.message || e), 'instagram_basic') }); }
    }
    return out;
  }
  async function igWait(igId, cid, tk) {
    for (let i = 0; i < 72; i++) {
      const g = await fb.call('get', '/' + cid, { fields: 'status_code' }, tk);
      if (g.status_code === 'FINISHED') return;
      if (g.status_code === 'ERROR' || g.status_code === 'EXPIRED') throw new Error('Instagram không xử lý được file (' + g.status_code + ').');
      await sleep(POLL);
    }
    throw new Error('Instagram xử lý quá lâu.');
  }
  async function postInstagram(acct, caption, files) {
    const tk = pageToken(acct.pageId);
    const images = files.filter((f) => /^image\//.test(f.mime)), videos = files.filter((f) => /^video\//.test(f.mime));
    if (!images.length && !videos.length) throw new Error('Instagram cần ít nhất 1 ảnh hoặc video.');
    let cid;
    if (videos.length) {
      const url = await publicVideo(acct.pageId, videos[0]);
      cid = (await fb.call('post', '/' + acct.id + '/media', { media_type: 'REELS', video_url: url, caption: caption, share_to_feed: 'true' }, tk)).id;
    } else if (images.length === 1) {
      cid = (await fb.call('post', '/' + acct.id + '/media', { image_url: await publicImage(acct.pageId, images[0]), caption: caption }, tk)).id;
    } else {
      const kids = [];
      for (const im of images.slice(0, 10)) kids.push((await fb.call('post', '/' + acct.id + '/media', { image_url: await publicImage(acct.pageId, im), is_carousel_item: 'true' }, tk)).id);
      cid = (await fb.call('post', '/' + acct.id + '/media', { media_type: 'CAROUSEL', children: kids.join(','), caption: caption }, tk)).id;
    }
    await igWait(acct.id, cid, tk);
    const pub = await fb.call('post', '/' + acct.id + '/media_publish', { creation_id: cid }, tk);
    let link = '';
    try { link = (await fb.call('get', '/' + pub.id, { fields: 'permalink' }, tk)).permalink || ''; } catch (e) { /* bỏ qua */ }
    return { id: pub.id, link: link, account: acct.username };
  }

  /* ---------- Threads ---------- */
  function threadsCfg() { return settings.secret('threads') || null; }
  async function threadsMe(token) { return fb.call('get', '/me', { fields: 'id,username' }, token, THREADS); }
  async function postThreads(text, files, pageId) {
    const cfg = threadsCfg();
    if (!cfg || !cfg.token) throw new Error('Chưa kết nối Threads (Cài đặt → Kênh khác → Threads).');
    const images = files.filter((f) => /^image\//.test(f.mime)), videos = files.filter((f) => /^video\//.test(f.mime));
    const p = { text: text.slice(0, 500) };
    if (videos.length && pageId) { p.media_type = 'VIDEO'; p.video_url = await publicVideo(pageId, videos[0]); }
    else if (images.length && pageId) { p.media_type = 'IMAGE'; p.image_url = await publicImage(pageId, images[0]); }
    else p.media_type = 'TEXT';
    const c = await fb.call('post', '/me/threads', p, cfg.token, THREADS);
    if (p.media_type === 'VIDEO') {
      for (let i = 0; i < 60; i++) { const g = await fb.call('get', '/' + c.id, { fields: 'status' }, cfg.token, THREADS); if (g.status === 'FINISHED') break; if (g.status === 'ERROR') throw new Error('Threads không xử lý được video.'); await sleep(POLL); }
    }
    const pub = await fb.call('post', '/me/threads_publish', { creation_id: c.id }, cfg.token, THREADS);
    let link = '';
    try { link = (await fb.call('get', '/' + pub.id, { fields: 'permalink' }, cfg.token, THREADS)).permalink || ''; } catch (e) { /* bỏ qua */ }
    return { id: pub.id, link: link, account: cfg.username || '' };
  }

  /* ---------- TikTok ---------- */
  function tiktokCfg() { return settings.secret('tiktok') || null; }
  async function ttJson(url, body, token, form) {
    const headers = { Authorization: token ? 'Bearer ' + token : undefined, 'Content-Type': form ? 'application/x-www-form-urlencoded' : 'application/json; charset=UTF-8' };
    if (!token) delete headers.Authorization;
    let res;
    try { res = await fetch(url, { method: 'POST', headers: headers, body: form ? new URLSearchParams(body).toString() : JSON.stringify(body) }); }
    catch (e) { throw new Error('Không kết nối được TikTok: ' + e.message); }
    const j = await res.json().catch(() => ({}));
    const err = j.error && j.error.code && j.error.code !== 'ok' ? j.error : null;
    if (res.status >= 300 || err) throw new Error('TikTok báo lỗi: ' + ((err && (err.message || err.code)) || j.error_description || ('HTTP ' + res.status)));
    return j;
  }
  async function tiktokToken() {
    const cfg = tiktokCfg();
    if (!cfg || !cfg.clientKey || !cfg.refreshToken) throw new Error('Chưa kết nối TikTok (Cài đặt → Kênh khác → TikTok).');
    if (cfg.accessToken && cfg.exp > Date.now() + 60e3) return cfg;
    const j = await ttJson(TIKTOK + '/v2/oauth/token/', { client_key: cfg.clientKey, client_secret: cfg.clientSecret, grant_type: 'refresh_token', refresh_token: cfg.refreshToken }, null, true);
    const nc = Object.assign({}, cfg, { accessToken: j.access_token, exp: Date.now() + (Number(j.expires_in) || 86400) * 1000, refreshToken: j.refresh_token || cfg.refreshToken, openId: j.open_id || cfg.openId });
    settings.setSecret('tiktok', nc);
    return nc;
  }
  async function postTiktok(caption, files) {
    const videos = files.filter((f) => /^video\//.test(f.mime));
    if (!videos.length) throw new Error('TikTok chỉ đăng bài có video.');
    const cfg = await tiktokToken();
    const file = videos[0], size = fs.statSync(file.path).size;
    const CH = 10 * 1048576;
    const count = size <= 64 * 1048576 ? 1 : Math.floor(size / CH);
    const chunk = count === 1 ? size : CH;
    const init = await ttJson(TIKTOK + '/v2/post/publish/video/init/', {
      post_info: { title: caption.slice(0, 2200), privacy_level: cfg.privacy || 'SELF_ONLY', disable_comment: false, disable_duet: false, disable_stitch: false },
      source_info: { source: 'FILE_UPLOAD', video_size: size, chunk_size: chunk, total_chunk_count: count }
    }, cfg.accessToken);
    const up = init.data || {};
    for (let i = 0; i < count; i++) {
      const start = i * chunk, end = i === count - 1 ? size - 1 : start + chunk - 1;
      const buf = await new Promise((res, rej) => { const parts = []; fs.createReadStream(file.path, { start: start, end: end }).on('data', (d) => parts.push(d)).on('end', () => res(Buffer.concat(parts))).on('error', rej); });
      const r = await fetch(up.upload_url, { method: 'PUT', headers: { 'Content-Type': file.mime || 'video/mp4', 'Content-Length': String(buf.length), 'Content-Range': 'bytes ' + start + '-' + end + '/' + size }, body: buf });
      if (r.status >= 300) throw new Error('Tải video lên TikTok lỗi (HTTP ' + r.status + ').');
    }
    for (let i = 0; i < 60; i++) {
      const s = await ttJson(TIKTOK + '/v2/post/publish/status/fetch/', { publish_id: up.publish_id }, cfg.accessToken);
      const st = (s.data || {}).status;
      if (st === 'PUBLISH_COMPLETE' || st === 'SEND_TO_USER_INBOX') return { id: up.publish_id, link: '', account: cfg.username || '', privacy: cfg.privacy || 'SELF_ONLY' };
      if (st === 'FAILED') throw new Error('TikTok báo đăng lỗi: ' + ((s.data || {}).fail_reason || 'không rõ'));
      await sleep(POLL);
    }
    throw new Error('TikTok xử lý quá lâu, kiểm tra lại trên ứng dụng TikTok.');
  }

  /** Đăng các kênh đang bật. ch: {ig, threads, tiktok}; trả về {ig:{...}, threads:{...}, tiktok:{...}} */
  async function publishAll(p, pageIds, files, message) {
    const ch = (() => { try { return JSON.parse(p.channels || '{}'); } catch (e) { return {}; } })();
    const prev = (() => { try { return JSON.parse(p.channelPosts || '{}'); } catch (e) { return {}; } })();
    const out = Object.assign({}, prev);
    const now = new Date().toISOString();
    if (ch.ig && !(prev.ig && prev.ig.ok)) {
      try {
        const accts = (await igAccounts(pageIds)).filter((a) => a.id);
        if (!accts.length) throw new Error('Không Page nào đã chọn có nối tài khoản Instagram doanh nghiệp.');
        const seen = {}, res = [];
        for (const a of accts) { if (seen[a.id]) continue; seen[a.id] = 1; res.push(await postInstagram(a, p.contentIg || message, files)); }
        out.ig = { ok: true, at: now, posts: res };
      } catch (e) { out.ig = { ok: false, at: now, error: permHint(String(e.message || e), 'instagram_content_publish') }; }
    }
    if (ch.threads && !(prev.threads && prev.threads.ok)) {
      try { out.threads = Object.assign({ ok: true, at: now }, await postThreads(p.contentThreads || message, files, pageIds[0])); }
      catch (e) { out.threads = { ok: false, at: now, error: permHint(String(e.message || e), 'threads_content_publish') }; }
    }
    if (ch.tiktok && !(prev.tiktok && prev.tiktok.ok)) {
      try { out.tiktok = Object.assign({ ok: true, at: now }, await postTiktok(p.contentTiktok || p.contentIg || message, files)); }
      catch (e) { out.tiktok = { ok: false, at: now, error: permHint(String(e.message || e), 'video.publish') }; }
    }
    return out;
  }
  function wanted(p) { try { const c = JSON.parse(p.channels || '{}'); return !!(c.ig || c.threads || c.tiktok); } catch (e) { return false; } }

  return { publishAll, wanted, igAccounts, threadsMe, threadsCfg, tiktokCfg, tiktokToken, THREADS, TIKTOK };
};

});
__def("xlsx", function (module, exports, require) {
/**
 * TNG Plus 2.0 · tạo file Excel .xlsx (nhiều sheet) không cần thư viện ngoài.
 * sheets: [{ name, rows: [[ô, ô…]…], widths?: [số ký tự…], header?: số dòng tiêu đề in đậm (mặc định 1) }]
 * Ô là số → kiểu số; còn lại → chữ. Nén zip kiểu STORED (không nén) + CRC32.
 */
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(buf) { let c = 0xFFFFFFFF; for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function zip(files) {
  const parts = [], central = [];
  let off = 0;
  files.forEach((f) => {
    const name = Buffer.from(f.name, 'utf8'), data = Buffer.isBuffer(f.data) ? f.data : Buffer.from(f.data, 'utf8'), crc = crc32(data);
    const h = Buffer.alloc(30);
    h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(0x0800, 6); h.writeUInt16LE(0, 8); h.writeUInt32LE(0, 10);
    h.writeUInt32LE(crc, 14); h.writeUInt32LE(data.length, 18); h.writeUInt32LE(data.length, 22); h.writeUInt16LE(name.length, 26); h.writeUInt16LE(0, 28);
    parts.push(h, name, data);
    const c = Buffer.alloc(46);
    c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(0x0800, 8); c.writeUInt16LE(0, 10); c.writeUInt32LE(0, 12);
    c.writeUInt32LE(crc, 16); c.writeUInt32LE(data.length, 20); c.writeUInt32LE(data.length, 24); c.writeUInt16LE(name.length, 28);
    c.writeUInt32LE(off, 42);
    central.push(c, name);
    off += 30 + name.length + data.length;
  });
  const cd = Buffer.concat(central);
  const e = Buffer.alloc(22);
  e.writeUInt32LE(0x06054b50, 0); e.writeUInt16LE(files.length, 8); e.writeUInt16LE(files.length, 10); e.writeUInt32LE(cd.length, 12); e.writeUInt32LE(off, 16);
  return Buffer.concat(parts.concat([cd, e]));
}
const x = (s) => String(s == null ? '' : s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function col(n) { let s = ''; n++; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; }
function sheetXml(sh) {
  const hdr = sh.header === undefined ? 1 : sh.header;
  const rows = (sh.rows || []).map((r, i) => '<row r="' + (i + 1) + '">' + (r || []).map((v, j) => {
    const ref = col(j) + (i + 1), st = i < hdr ? ' s="1"' : '';
    if (v === null || v === undefined || v === '') return '';
    if (typeof v === 'number' && isFinite(v)) return '<c r="' + ref + '"' + st + '><v>' + v + '</v></c>';
    return '<c r="' + ref + '"' + st + ' t="inlineStr"><is><t xml:space="preserve">' + x(v) + '</t></is></c>';
  }).join('') + '</row>').join('');
  const widths = sh.widths || [];
  const cols = widths.length ? '<cols>' + widths.map((w, j) => '<col min="' + (j + 1) + '" max="' + (j + 1) + '" width="' + Math.max(6, Math.min(80, w)) + '" customWidth="1"/>').join('') + '</cols>' : '';
  const pane = hdr ? '<sheetViews><sheetView workbookViewId="0"><pane ySplit="' + hdr + '" topLeftCell="A' + (hdr + 1) + '" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' : '';
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' + pane + cols + '<sheetData>' + rows + '</sheetData></worksheet>';
}
function build(sheets) {
  const used = {};
  const names = sheets.map((s, i) => { let n = String(s.name || ('Sheet' + (i + 1))).replace(/[\\/?*[\]:]/g, ' ').slice(0, 31) || 'Sheet' + (i + 1); while (used[n]) n = n.slice(0, 28) + ' ' + (i + 1); used[n] = 1; return n; });
  const files = [
    { name: '[Content_Types].xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' + sheets.map((s, i) => '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('') + '</Types>' },
    { name: '_rels/.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
    { name: 'xl/workbook.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' + names.map((n, i) => '<sheet name="' + x(n) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>').join('') + '</sheets></workbook>' },
    { name: 'xl/_rels/workbook.xml.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + sheets.map((s, i) => '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>').join('') + '<Relationship Id="rId' + (sheets.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>' },
    { name: 'xl/styles.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFDEBE3"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs></styleSheet>' }
  ].concat(sheets.map((s, i) => ({ name: 'xl/worksheets/sheet' + (i + 1) + '.xml', data: sheetXml(s) })));
  return zip(files);
}
module.exports = { build, zip, crc32 };

});
__def("google-web", function (module, exports, require) {
/* TNG Plus bản web · Google Sheets + Drive gọi thẳng từ trình duyệt.
   Đăng nhập bằng Google Identity Services (mã đăng nhập loại "Web application", không cần Client secret).
   Mã truy cập sống 1 giờ, chỉ giữ trong sessionStorage của tab; hết hạn thì hiện nút "Tiếp tục với Google". */
module.exports = function createGoogleWeb(settings, opts) {
  const T = (window.TNG_WEB_CONFIG || {}).test || {}; // chỉ dùng khi chạy thử với Google giả lập
  const URLS = {
    userinfo: T.userinfo || 'https://openidconnect.googleapis.com/v1/userinfo',
    sheets: (T.sheets || 'https://sheets.googleapis.com') + '/v4/spreadsheets/',
    drive: (T.drive || 'https://www.googleapis.com') + '/drive/v3/files',
    upload: (T.drive || 'https://www.googleapis.com') + '/upload/drive/v3/files'
  };
  const SCOPES = ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive'];
  const TK = 'tng-web-token';
  let access = { token: '', exp: 0 };
  try { access = JSON.parse(sessionStorage.getItem(TK) || '{}'); if (!access.token) access = { token: '', exp: 0 }; } catch (e) { access = { token: '', exp: 0 }; }
  const onToken = (opts && opts.onToken) || function () {};

  /* ---------------- đăng nhập ---------------- */
  function clientId() {
    const c = (window.TNG_WEB_CONFIG || {}).clientId || '';
    if (!/\.apps\.googleusercontent\.com$/.test(c)) throw new Error('Bản web chưa có mã đăng nhập Google (Client ID loại Web). Nhờ leader cài vào config.js.');
    return c;
  }
  function gis() { return window.google && window.google.accounts && window.google.accounts.oauth2; }
  let tc = null, pending = null;
  function client() {
    if (tc) return tc;
    if (!gis()) throw new Error('Chưa tải xong phần đăng nhập Google. Đợi vài giây rồi bấm lại.');
    tc = gis().initTokenClient({
      client_id: clientId(), scope: SCOPES.join(' '),
      callback: (r) => {
        const p = pending; pending = null;
        if (!p) return;
        if (r.error) { p.reject(new Error(r.error === 'access_denied' ? 'Bạn đã từ chối cấp quyền cho TNG Plus.' : 'Google từ chối đăng nhập: ' + (r.error_description || r.error))); return; }
        if (!gis().hasGrantedAllScopes(r, SCOPES[3], SCOPES[4])) { p.reject(new Error('Cần tick chọn đủ quyền Google Sheets và Google Drive. Bấm đăng nhập lại và tick hết các ô.')); return; }
        setAccess(r.access_token, r.expires_in);
        p.resolve(access.token);
      },
      error_callback: (e) => { const p = pending; pending = null; if (p) p.reject(new Error(e && e.type === 'popup_closed' ? 'Cửa sổ đăng nhập Google đã đóng. Bấm lại để tiếp tục.' : e && e.type === 'popup_failed_to_open' ? 'Trình duyệt chặn cửa sổ đăng nhập. Cho phép cửa sổ bật lên (popup) cho trang này rồi bấm lại.' : 'Đăng nhập Google không thành công.')); }
    });
    return tc;
  }
  function setAccess(token, sec) {
    access = { token: token, exp: Date.now() + (Number(sec) || 3600) * 1000 - 60e3 };
    try { sessionStorage.setItem(TK, JSON.stringify(access)); } catch (e) { /* bỏ qua */ }
    onToken(access);
  }
  /** Phải gọi ngay trong lúc bấm nút (trình duyệt chỉ cho mở cửa sổ đăng nhập khi người dùng bấm). */
  function ask(prompt) {
    return new Promise((resolve, reject) => {
      if (pending) pending.reject(new Error('Đã mở lại cửa sổ đăng nhập.'));
      pending = { resolve, reject };
      try { client().requestAccessToken({ prompt: prompt, login_hint: settings.get('email') || undefined }); }
      catch (e) { pending = null; reject(e); }
    });
  }
  async function login() {
    await ask('select_account');
    const info = await (await fetch(URLS.userinfo, { headers: { Authorization: 'Bearer ' + access.token } })).json();
    if (!info.email) throw new Error('Không đọc được email tài khoản Google.');
    settings.set({ email: String(info.email).toLowerCase(), name: info.name || '' });
    return settings.get('email');
  }
  function loggedIn() { return !!settings.get('email'); }
  function logout() {
    const t = access.token;
    access = { token: '', exp: 0 };
    try { sessionStorage.removeItem(TK); } catch (e) { /* bỏ qua */ }
    if (t && gis()) { try { gis().revoke(t, () => {}); } catch (e) { /* bỏ qua */ } }
    settings.set({ email: '', name: '' });
    onToken(access);
  }

  /* Hết hạn 1 giờ: hiện hộp nhỏ "Tiếp tục với Google" (cần 1 cú bấm để mở cửa sổ Google). */
  let waiting = null;
  function reauth() {
    if (waiting) return waiting;
    waiting = new Promise((resolve, reject) => {
      const box = document.createElement('div');
      box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Tiếp tục phiên Google');
      box.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(20,20,19,.45);display:flex;align-items:center;justify-content:center;padding:16px;font-family:inherit';
      box.innerHTML = '<div style="background:var(--panel,#fff);color:var(--ink,#1C1C1A);border-radius:16px;padding:24px;max-width:400px;width:100%;display:flex;flex-direction:column;gap:12px;box-shadow:0 12px 40px rgba(0,0,0,.25)">' +
        '<b style="font-size:16px">Tiếp tục phiên Google</b><span style="color:var(--ink2,#55554F);font-size:14px">Vì an toàn, bản web hỏi lại Google mỗi giờ hoặc khi mở tab mới. Bấm nút dưới để làm tiếp, không mất gì đang làm.</span>' +
        '<span data-err style="color:#B42318;font-size:13px"></span>' +
        '<button type="button" data-go style="min-height:44px;border:0;border-radius:10px;background:var(--accent,#2F4FD6);color:#fff;font:inherit;font-weight:600;cursor:pointer">Tiếp tục với Google</button>' +
        '<button type="button" data-out style="all:unset;cursor:pointer;color:var(--ink3,#6E6E67);font-size:13px;text-decoration:underline;align-self:center">Đăng xuất</button></div>';
      document.body.appendChild(box);
      const go = box.querySelector('[data-go]');
      go.focus();
      go.onclick = () => {
        box.querySelector('[data-err]').textContent = '';
        ask('').then((t) => { box.remove(); waiting = null; resolve(t); })
          .catch((e) => { box.querySelector('[data-err]').textContent = e.message; });
      };
      box.querySelector('[data-out]').onclick = () => { box.remove(); waiting = null; logout(); const e = new Error('Đã đăng xuất.'); e.code = 'login'; reject(e); };
    });
    return waiting;
  }
  async function token() {
    if (access.token && Date.now() < access.exp) return access.token;
    if (!settings.get('email')) { const e = new Error('Chưa đăng nhập Google.'); e.code = 'login'; throw e; }
    return reauth();
  }
  function current() { return access.token && Date.now() < access.exp ? access : null; }

  /* ---------------- gọi API ---------------- */
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  async function call(url, opt) {
    opt = Object.assign({ method: 'GET' }, opt || {});
    for (let attempt = 0; attempt < 4; attempt++) {
      const headers = Object.assign({ Authorization: 'Bearer ' + (await token()) }, opt.headers || {});
      let body = opt.body;
      if (opt.json !== undefined) { body = JSON.stringify(opt.json); headers['Content-Type'] = 'application/json'; }
      let res;
      try { res = await fetch(url, { method: opt.method, headers: headers, body: body }); }
      catch (e) { if (attempt < 3) { await sleep(800 * (attempt + 1)); continue; } throw new Error('Không kết nối được Google. Kiểm tra mạng.'); }
      if (opt.raw) return res;
      const text = await res.text();
      let j = {};
      try { j = text ? JSON.parse(text) : {}; } catch (e) { j = {}; }
      if (res.status === 401 && attempt === 0) { access = { token: '', exp: 0 }; continue; }
      if ((res.status === 429 || res.status >= 500) && attempt < 3) { await sleep(1000 * Math.pow(2, attempt)); continue; }
      if (res.status >= 300) {
        const msg = (j.error && (j.error.message || j.error)) || ('HTTP ' + res.status);
        const err = new Error(res.status === 403 || res.status === 404
          ? 'Google từ chối truy cập (' + res.status + '): ' + msg + '. Kiểm tra tài khoản này đã được chia sẻ file Sheet và thư mục Drive chưa.'
          : 'Google báo lỗi: ' + msg);
        err.status = res.status;
        throw err;
      }
      return j;
    }
    throw new Error('Google đang quá tải, thử lại sau ít phút.');
  }
  const q = (tab) => "'" + String(tab).replace(/'/g, "''") + "'";

  /* ---------------- Sheets (giống bản máy tính) ---------------- */
  const S = (sheetId) => URLS.sheets + encodeURIComponent(sheetId);
  const sheets = {
    tabs: async (id) => ((await call(S(id) + '?fields=sheets.properties(sheetId,title)')).sheets || []).map((s) => s.properties),
    batchGet: async (id, ranges) => {
      const qs = ranges.map((r) => 'ranges=' + encodeURIComponent(r)).join('&');
      const j = await call(S(id) + '/values:batchGet?' + qs + '&valueRenderOption=FORMATTED_VALUE');
      return (j.valueRanges || []).map((v) => v.values || []);
    },
    get: async (id, range) => (await call(S(id) + '/values/' + encodeURIComponent(range) + '?valueRenderOption=FORMATTED_VALUE')).values || [],
    update: (id, range, rows) => call(S(id) + '/values/' + encodeURIComponent(range) + '?valueInputOption=RAW', { method: 'PUT', json: { values: rows } }),
    batchUpdateValues: (id, data) => call(S(id) + '/values:batchUpdate', { method: 'POST', json: { valueInputOption: 'RAW', data: data } }),
    append: (id, range, rows) => call(S(id) + '/values/' + encodeURIComponent(range) + ':append?valueInputOption=RAW&insertDataOption=INSERT_ROWS', { method: 'POST', json: { values: rows } }),
    clear: (id, range) => call(S(id) + '/values/' + encodeURIComponent(range) + ':clear', { method: 'POST', json: {} }),
    batchUpdate: (id, requests) => call(S(id) + ':batchUpdate', { method: 'POST', json: { requests: requests } }),
    cellMeta: async (id, ranges) => {
      const qs = ranges.map((r) => 'ranges=' + encodeURIComponent(r)).join('&');
      const j = await call(S(id) + '?' + qs + '&includeGridData=false&fields=' + encodeURIComponent('sheets(properties(sheetId,title),protectedRanges(protectedRangeId,description,range),data(rowData(values(dataValidation))))'));
      return (j.sheets || []).map((s) => ({ sheetId: s.properties.sheetId, title: s.properties.title, protectedRanges: s.protectedRanges || [], validation: ((((s.data || [])[0] || {}).rowData || [])[0] || { values: [] }).values.map((v) => (v || {}).dataValidation || null)[0] || null }));
    },
    create: (title) => call(URLS.sheets.replace(/\/$/, ''), { method: 'POST', json: { properties: { title: title } } }),
    q: q
  };

  /* ---------------- Drive ---------------- */
  const FIELDS = 'id,name,mimeType,size,thumbnailLink';
  const listQ = async (qq, fields, size) => {
    const out = [];
    let page = '';
    do {
      const j = await call(URLS.drive + '?supportsAllDrives=true&includeItemsFromAllDrives=true&pageSize=' + size + '&fields=nextPageToken,files(' + fields + ')&q=' + encodeURIComponent(qq) + (page ? '&pageToken=' + page : ''));
      Array.prototype.push.apply(out, j.files || []);
      page = j.nextPageToken || '';
    } while (page);
    return out;
  };
  const drive = {
    meta: (id) => call(URLS.drive + '/' + encodeURIComponent(id) + '?supportsAllDrives=true&fields=' + FIELDS),
    list: (folderId) => listQ("'" + folderId + "' in parents and trashed = false", FIELDS, 200),
    folder: (name, parent) => call(URLS.drive + '?supportsAllDrives=true&fields=id', { method: 'POST', json: { name: name, mimeType: 'application/vnd.google-apps.folder', parents: parent ? [parent] : undefined } }),
    listMine: (folderId) => listQ("'" + folderId + "' in parents and 'me' in owners and trashed = false", 'id,name,mimeType,size,createdTime', 500),
    trash: (id) => call(URLS.drive + '/' + encodeURIComponent(id) + '?supportsAllDrives=true&fields=id', { method: 'PATCH', json: { trashed: true } }),
    remove: (id) => call(URLS.drive + '/' + encodeURIComponent(id) + '?supportsAllDrives=true', { method: 'DELETE' }),
    quota: () => call(URLS.drive.replace(/\/files$/, '/about') + '?fields=storageQuota'),
    share: (id, email) => call(URLS.drive + '/' + encodeURIComponent(id) + '/permissions?supportsAllDrives=true&sendNotificationEmail=false', { method: 'POST', json: { type: 'user', role: 'writer', emailAddress: email } }),
    media: (id, range) => call(URLS.drive + '/' + encodeURIComponent(id) + '?alt=media&supportsAllDrives=true', { raw: true, headers: range ? { Range: range } : {} }),
    thumb: (link) => call(link, { raw: true }),
    /** blob: File/Blob của trình duyệt. Mở phiên tải lên của Drive rồi gửi cả file (theo dõi % bằng XHR). */
    upload: async (blob, name, mime, folderId, onProgress) => {
      if (!blob || !blob.size) throw new Error('File rỗng.');
      const start = await call(URLS.upload + '?uploadType=resumable&supportsAllDrives=true&fields=' + FIELDS, {
        method: 'POST', raw: true, json: { name: name, parents: folderId ? [folderId] : undefined },
        headers: { 'X-Upload-Content-Type': mime, 'X-Upload-Content-Length': String(blob.size) }
      });
      if (start.status >= 300) throw new Error('Google Drive từ chối tải lên (mã ' + start.status + '). Kiểm tra quyền vào thư mục Drive chung.');
      const loc = start.headers.get('location');
      if (!loc) throw new Error('Google Drive không trả địa chỉ tải lên.');
      for (let attempt = 0; ; attempt++) {
        try {
          return await new Promise((resolve, reject) => {
            const x = new XMLHttpRequest();
            x.open('PUT', loc);
            x.setRequestHeader('Content-Type', mime);
            x.upload.onprogress = (e) => { if (e.lengthComputable && onProgress) onProgress(Math.min(99, Math.floor(e.loaded / e.total * 100))); };
            x.onload = () => { if (x.status === 200 || x.status === 201) { if (onProgress) onProgress(100); try { resolve(JSON.parse(x.responseText)); } catch (e) { reject(new Error('Drive trả kết quả lạ.')); } } else reject(Object.assign(new Error('Google Drive báo lỗi khi tải lên (mã ' + x.status + ').'), { status: x.status })); };
            x.onerror = () => reject(new Error('Mạng chập chờn, tải lên Drive bị gián đoạn. Thử lại.'));
            x.send(blob);
          });
        } catch (e) {
          if (attempt >= 2 || (e.status && e.status < 500)) throw e;
          await sleep(1500 * (attempt + 1));
        }
      }
    },
    download: async () => { throw new Error('Bản web không tải file về máy để đăng Facebook. Máy leader đăng bài.'); }
  };

  return { login, logout, loggedIn, token, current, sheets, drive, SCOPES };
};

});
/* TNG Plus bản web · window.hc giống preload.js của app, nhưng chạy phần nền ngay trong trình duyệt.
   Làm được: viết bài, tải ảnh/video lên Drive, gửi duyệt, duyệt & chấm điểm, tổng quan.
   Không đăng Facebook: bài vào hàng chờ, máy leader (app máy tính) đăng như cũ. */
const COLORS = ['#2F4FD6', '#C2410C', '#1E8E4A', '#7C3AED', '#DB2777', '#0E7490', '#B45309', '#475569'];
const SK = 'tng-web-settings', SECK = 'tng-web-secret', PK = 'tng-web-prefs';
const rd = (k) => { try { return JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch (e) { return {}; } };
const wr = (k, o) => { try { localStorage.setItem(k, JSON.stringify(o)); } catch (e) { /* bỏ qua */ } };
const settings = {
  dir: '/web',
  get: (k) => rd(SK)[k],
  all: () => rd(SK),
  set: (patch) => { const o = rd(SK); Object.assign(o, patch); wr(SK, o); return o; },
  secret: (k) => rd(SECK)[k],
  setSecret: (k, v) => { const o = rd(SECK); if (v === undefined || v === null) delete o[k]; else o[k] = v; wr(SECK, o); },
  clear: () => { wr(SK, {}); wr(SECK, {}); }
};

/* ---------- service worker: gửi mã Google để hiện ảnh/video Drive ---------- */
function swSend(access) { try { const c = navigator.serviceWorker && navigator.serviceWorker.controller; if (c) c.postMessage({ type: 'token', access: access }); } catch (e) { /* bỏ qua */ } }
const google = __req('google-web')(settings, { onToken: swSend });
if ('serviceWorker' in navigator) {
  const tdrive = ((window.TNG_WEB_CONFIG || {}).test || {}).drive;
  navigator.serviceWorker.register('sw.js' + (tdrive ? '?drive=' + encodeURIComponent(new URL(tdrive, location.href).href) : '')).catch(() => {});
  navigator.serviceWorker.addEventListener('message', (e) => { if (e.data && e.data.type === 'need-token' && e.ports[0]) e.ports[0].postMessage(google.current()); });
  navigator.serviceWorker.addEventListener('controllerchange', () => swSend(google.current()));
  navigator.serviceWorker.ready.then(() => swSend(google.current())).catch(() => {});
}

/* ---------- Facebook: bản web không giữ token Page ---------- */
const FB_NO = 'Bản web không đăng lên Facebook. Bài đã duyệt vào hàng chờ, máy leader (app TNG Plus trên máy tính) tự đăng.';
const fb = new Proxy({}, { get: (t, k) => (k === 'then' ? undefined : k === 'videoHost' ? '' : function () { return Promise.reject(new Error(FB_NO)); }) });

/* ---------- dự án ---------- */
function projects() { return settings.get('projects') || []; }
function activeProject() { const ps = projects(); return ps.filter((p) => p.id === settings.get('activeProject'))[0] || ps[0] || null; }
let store = null, core = null;
function buildCore() {
  const p = activeProject();
  if (p && settings.get('sheetId') !== p.sheetId) settings.set({ sheetId: p.sheetId });
  store = __req('store')(google, () => settings.get('sheetId'));
  core = __req('core')({ google: google, store: store, settings: settings, fb: fb });
}
function addProject(c, name) {
  const ps = projects();
  const had = ps.filter((p) => p.sheetId === c.sheetId)[0];
  if (had) { settings.set({ activeProject: had.id }); return had; }
  const id = 'p' + Date.now().toString(36);
  const np = { id: id, name: String(name || c.name || ('Dự án ' + (ps.length + 1))).slice(0, 40), color: COLORS[ps.length % COLORS.length], sheetId: c.sheetId };
  settings.set({ projects: ps.concat([np]), activeProject: id });
  return np;
}
/** Mã HC1 của app hoặc link Sheet. Chỉ giữ mã file Sheet + tên dự án; Client secret trong mã KHÔNG lưu vào trình duyệt. */
function parseSheet(input) {
  input = input || {};
  const code = String(input.code || '').trim();
  const m = code.match(/HC1-([-\w]+)/);
  if (m) {
    let j;
    try { j = JSON.parse(Buffer.from(m[1], 'base64url').toString()); } catch (e) { throw new Error('Mã cài đặt bị thiếu hoặc sai. Copy lại toàn bộ mã.'); }
    if (!j.sh) throw new Error('Mã cài đặt thiếu file Sheet.');
    return { sheetId: j.sh, name: j.n || '' };
  }
  const sm = code.match(/\/d\/([-\w]{25,})/) || code.match(/^([-\w]{25,})$/);
  if (!sm) throw new Error('Dán mã cài đặt (HC1-…) leader gửi, hoặc link file Google Sheet của dự án.');
  return { sheetId: sm[1], name: String(input.name || '').trim() };
}
const ready = () => !!(activeProject() && google.loggedIn());
const go = (page) => { location.href = page; };

/* ---------- tải lên: File chọn từ máy → Drive ---------- */
const FILES = new Map();
let fileSeq = 0;
const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif', '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm' };
async function upload(o, onProgress) {
  try {
    const blob = o.path && FILES.get(o.path) ? FILES.get(o.path) : o.bytes ? new Blob([o.bytes], { type: o.mime || '' }) : null;
    if (!blob) throw new Error('Không đọc được file. Chọn lại file.');
    const ext = ((o.name || '').match(/\.[^.]+$/) || [''])[0].toLowerCase();
    const mime = o.mime || blob.type || MIME[ext] || '';
    if (!/^(image|video)\//.test(mime)) throw new Error('Chỉ nhận file ảnh hoặc video.');
    if (o.kind === 'image' && blob.size > 20 * 1024 * 1024) throw new Error('Ảnh lớn hơn 20MB.');
    const data = await store.load();
    const folderId = data.cfg.folderId ? data.cfg.folderId.value : '';
    if (!folderId) throw new Error('Leader chưa mở app lần nào nên chưa có thư mục Drive chung.');
    const f = await google.drive.upload(blob, o.name || 'file' + ext, mime, folderId, onProgress);
    if (o.path) FILES.delete(o.path);
    return { ok: true, result: { url: 'https://drive.google.com/file/d/' + f.id + '/view', name: f.name || o.name, mimeType: mime, size: blob.size } };
  } catch (e) { return { ok: false, error: e.message || String(e) }; }
}
function saveFile(name, data, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([data], { type: type }));
  a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 30e3);
  return name;
}

/* ---------- tùy chọn trên trình duyệt ---------- */
const PREF_DEF = { theme: 'light', palette: 'orange', lang: 'vi', browserShared: true, linksInApp: false, restoreTabs: false, notify: false, autoUpdate: true, v2Palette: true };
const prefsGet = () => Object.assign({}, PREF_DEF, rd(PK), { linksInApp: false, openAtLogin: false, version: WEB_VERSION + ' · web' });
const ok = (v) => Promise.resolve({ ok: true, result: v });
const noWeb = (msg) => () => Promise.resolve({ ok: false, error: msg || 'Bản web không có mục này. Dùng app TNG Plus trên máy tính.' });
const WEBTABS = { tabs: [], active: '', shared: true };
const UPD = { status: 'off', error: 'Bản web luôn là bản mới nhất: tải lại trang là có bản mới.', current: WEB_VERSION + ' · web', beta: false, packaged: true };

window.hc = {
  web: { state: () => Promise.resolve(WEBTABS), open: (u) => { window.open(u, '_blank', 'noopener'); return Promise.resolve(WEBTABS); }, activate: () => Promise.resolve(WEBTABS), close: () => Promise.resolve(WEBTABS), bounds: () => Promise.resolve(true), nav: () => Promise.resolve(WEBTABS), on: () => function () {} },
  isWeb: true,
  api: async (fn, args) => {
    if (!core) buildCore();
    const f = core.api[fn];
    if (!f) return { ok: false, error: 'Không có chức năng ' + fn };
    try { return { ok: true, result: await f.apply(null, Array.isArray(args) ? args : []) }; }
    catch (e) {
      if (e.code === 'login') setTimeout(() => go('setup.html'), 1500);
      return { ok: false, error: e.message || String(e) };
    }
  },
  pathFor: (file) => { if (!(file instanceof Blob)) return ''; const k = 'webfile:' + (++fileSeq); FILES.set(k, file); return k; },
  upload: upload,
  setup: {
    state: () => Promise.resolve({ hasConfig: !!activeProject(), email: settings.get('email') || '', loggedIn: google.loggedIn(), locals: [], web: true, clientReady: /\.apps\.googleusercontent\.com$/.test((window.TNG_WEB_CONFIG || {}).clientId || '') }),
    save: (input) => { try { const c = parseSheet(input); addProject(c, input.name || c.name); return ok(true); } catch (e) { return Promise.resolve({ ok: false, error: e.message }); } },
    login: () => google.login().then(() => { store = null; core = null; go('index.html'); return { ok: true }; }, (e) => ({ ok: false, error: e.message || String(e) })),
    reset: () => { settings.set({ projects: [], activeProject: '', sheetId: '' }); return ok(true); }
  },
  logout: () => { google.logout(); go('setup.html'); return Promise.resolve(true); },
  csv: async () => { if (!core) buildCore(); return { ok: true, path: saveFile('himen-bai-viet-' + new Date().toISOString().slice(0, 10) + '.csv', await core.csv(), 'text/csv;charset=utf-8') }; },
  xlsx: (name, sheets) => { try { const buf = __req('xlsx').build(sheets || []); const n = String(name || 'TNG Plus').replace(/[\\/:*?"<>|]/g, '-').slice(0, 100) + '.xlsx'; return Promise.resolve({ ok: true, path: saveFile(n, buf, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'), bytes: buf.length }); } catch (e) { return Promise.reject(e); } },
  copy: (text) => { try { return navigator.clipboard.writeText(String(text || '')).then(() => true, () => false); } catch (e) { return Promise.resolve(false); } },
  open: (url) => { if (/^https?:\/\//.test(String(url))) window.open(String(url), '_blank', 'noopener'); return Promise.resolve(true); },
  prefs: { get: () => Promise.resolve(prefsGet()), set: (patch) => { const cur = rd(PK); Object.keys(patch || {}).forEach((k) => { if (k !== 'version') cur[k] = patch[k]; }); wr(PK, cur); return Promise.resolve(prefsGet()); } },
  projects: {
    list: () => Promise.resolve({ projects: projects().map((p) => ({ id: p.id, name: p.name, color: p.color, sheetId: p.sheetId, mode: 'sheet', dir: '' })), active: (activeProject() || {}).id || '', source: { mode: 'sheet' }, googleReady: google.loggedIn() }),
    switchTo: (id) => { if (!projects().some((p) => p.id === id)) return Promise.resolve({ ok: false, error: 'Không thấy dự án này.' }); settings.set({ activeProject: String(id) }); go('index.html'); return ok(true); },
    add: (input) => { try { input = input || {}; const c = parseSheet({ code: input.code || input.sheet, name: input.name }); if (!String(input.name || c.name || '').trim()) throw new Error('Đặt tên cho dự án.'); const np = addProject(c, input.name || c.name); go('index.html'); return ok(np); } catch (e) { return Promise.resolve({ ok: false, error: e.message }); } },
    create: async (input) => { try { const name = String((input && input.name) || '').trim(); if (!name) throw new Error('Đặt tên cho dự án.'); const sh = await google.sheets.create('TNG Plus · ' + name); const np = addProject({ sheetId: sh.spreadsheetId }, name); go('index.html'); return { ok: true, result: np }; } catch (e) { return { ok: false, error: e.message }; } },
    update: (input) => { input = input || {}; const name = String(input.name || '').trim().slice(0, 40); settings.set({ projects: projects().map((p) => (p.id === input.id ? Object.assign({}, p, name ? { name: name } : {}, input.color ? { color: String(input.color) } : {}) : p)) }); return ok(true); },
    leave: (id) => { const rest = projects().filter((p) => p.id !== id); settings.set({ projects: rest, activeProject: rest.length ? rest[0].id : '', sheetId: rest.length ? rest[0].sheetId : '' }); go(rest.length ? 'index.html' : 'setup.html'); return ok(true); },
    remove: (id) => { const act = activeProject(); if (act && act.id === id) return Promise.resolve({ ok: false, error: 'Không gỡ được dự án đang mở. Chuyển sang dự án khác trước.' }); settings.set({ projects: projects().filter((p) => p.id !== id) }); return ok(true); }
  },
  local: { pickDir: noWeb('Bản web không có dự án offline.'), create: noWeb('Bản web không có dự án offline. Dùng app TNG Plus trên máy tính.'), info: () => ok({ local: false }), openDir: noWeb(), move: noWeb(), backup: noWeb(), importFrom: noWeb(), rename: noWeb() },
  update: { state: () => Promise.resolve(UPD), check: () => Promise.resolve(UPD), download: () => Promise.resolve(UPD), install: () => Promise.resolve(true), beta: () => Promise.resolve(UPD), on: () => function () {} },
  v1: { info: () => Promise.resolve({ files: 0, bytes: 0 }), clean: () => Promise.resolve(true) }
};

/* trang chính: chưa có dự án / chưa đăng nhập → trang cài đặt */
if (!/setup\.html$/.test(location.pathname) && !ready()) location.replace('setup.html');
else if (ready()) buildCore();

})();
