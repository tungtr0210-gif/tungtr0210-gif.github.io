/* TNG Plus bản web · chỉnh vài chỗ giao diện sau khi giao diện app đã nạp (chạy cuối trang). */
(function () {
  /* web: không có tab trình duyệt trong app, không có nút cập nhật (tải lại trang là bản mới) */
  const css = document.createElement('style');
  css.textContent = '[data-act="wbNew"],[data-act="openUpdate"]{display:none!important}';
  document.head.appendChild(css);

  /* ảnh/video Drive: service worker gắn mã đăng nhập (sw.js) */
  thumbUrl = function (line) { const id = driveId(line); return id && !isFolder(line) ? 'drive-thumb/' + id : ''; };
  playableSrc = function (v) { const id = driveId(v); return (S.localVideo || {})[v] || (id && !isFolder(v) ? 'drive-media/' + id : ''); };

  /* Dữ liệu & mã cài đặt: bản web không có Client secret → không tạo mã HC1; chỉ link Sheet/Drive + link bản web */
  sheetCard = function () {
    const st = S.data.settings;
    const here = location.origin + location.pathname.replace(/[^/]*$/, '');
    return '<div class="card"><div class="card-h"><h2>Dữ liệu & bản web</h2></div><div class="card-b" style="display:flex;flex-direction:column;gap:16px">' +
      '<div class="actions"><a class="btn" href="' + esc(st.sheetUrl) + '" target="_blank" rel="noopener">' + ic('ext', 16) + 'Mở Google Sheet</a>' +
      (st.folderUrl ? '<a class="btn" href="' + esc(st.folderUrl) + '" target="_blank" rel="noopener">' + ic('ext', 16) + 'Mở thư mục ảnh & video</a>' : '') +
      '<button type="button" class="btn" data-act="exportCsv">' + ic('download', 16) + 'Tải file CSV (Excel)</button></div>' +
      '<div style="border-top:1px solid var(--line);padding-top:14px"><b>Link bản web cho nhân viên</b><p class="hint" style="margin:2px 0 10px">Nhân viên mở link trên điện thoại hoặc máy tính, dán mã cài đặt (lấy trong app máy tính) rồi đăng nhập Google bằng email đã thêm ở mục Nhân sự.</p>' +
      '<div class="actions"><input class="input" readonly value="' + esc(here) + '" aria-label="Link bản web" style="flex:1 1 320px;width:auto;font-size:13px">' +
      '<button type="button" class="btn primary" data-act="webCopyLink">Copy link</button></div></div>' +
      '<div class="box info" style="margin:0">Bản web không đăng lên Facebook. Bài đã duyệt nằm trong hàng chờ, <b>máy leader mở app TNG Plus trên máy tính</b> sẽ tự đăng đúng giờ.</div></div></div>';
  };
  ACT.webCopyLink = function () { window.hc.copy(location.origin + location.pathname.replace(/[^/]*$/, '')).then(function () { toast('Đã copy link bản web.'); }); };
  ACT.exportCsv = function () { window.hc.csv().then(function (r) { if (r && r.ok) toast('Đã tải ' + r.path); }).catch(function (e) { toast(e.message, true); }); };

  /* mở link: tab mới của trình duyệt */
  document.addEventListener('click', function (e) {
    const a = e.target.closest && e.target.closest('a[href^="http"]');
    if (a && !a.target) { a.target = '_blank'; a.rel = 'noopener'; }
  }, true);
})();
