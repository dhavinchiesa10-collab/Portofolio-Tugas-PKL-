(function () {
  'use strict';

  /* ---- helpers ---- */
  var ge  = function (id)  { return document.getElementById(id); };
  var qsa = function (sel) { return document.querySelectorAll(sel); };
  function esc(s) { var d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }

  /* ---- toast ---- */
  var toastEl = ge('toast'), toastT;
  function toast(msg) {
    clearTimeout(toastT);
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    toastT = setTimeout(function () { toastEl.classList.remove('show'); }, 2500);
  }

  /* ---- pages ---- */
  function showPage(id) {
    qsa('.page').forEach(function (p) {
      p.classList.remove('active');
      p.style.display = 'none';
    });
    var el = ge(id);
    if (!el) return;
    el.style.display = 'flex';
    el.classList.add('active');
  }

  /* ---- auth ---- */
  var ADMIN  = { email: 'siswa@smkrpl.com',  password: 'siswa123', nama: 'Dhavin Chiesa Saputra', kelas: 'XII RPL', nisn: '0012345678', role: 'admin' };
  var VIEWER = { email: 'tamu@smkrpl.com',   password: 'tamu123',  nama: 'Tamu',                  kelas: '-',       nisn: '',           role: 'viewer' };

  function getSess()   { try { return JSON.parse(localStorage.getItem('portf_sess')   || 'null'); } catch (e) { return null; } }
  function setSess(s)  { localStorage.setItem('portf_sess',   JSON.stringify(s)); }
  function delSess()   { localStorage.removeItem('portf_sess'); }
  function getProfil() { try { return JSON.parse(localStorage.getItem('portf_profil') || 'null'); } catch (e) { return null; } }
  function setProfil(p){ localStorage.setItem('portf_profil', JSON.stringify(p)); }

  function isAdmin() { var s = getSess(); return s && s.role === 'admin'; }

  function applyRole() {
    var admin = isAdmin();
    document.body.classList.toggle('is-admin',  admin);
    document.body.classList.toggle('is-viewer', !admin);
  }

  function doLogin(email, pwd) {
    var user = null;
    if (email === ADMIN.email  && pwd === ADMIN.password)  user = ADMIN;
    if (email === VIEWER.email && pwd === VIEWER.password) user = VIEWER;

    if (user) {
      var savedProfil = (user.role === 'admin') ? getProfil() : null;
      var profil = savedProfil || { nama: user.nama, kelas: user.kelas, nisn: user.nisn };
      setSess({ loggedIn: true, email: user.email, nama: profil.nama, kelas: profil.kelas, nisn: profil.nisn, role: user.role });
      applyRole();
      initDash();
      showPage('dashPage');
    } else {
      ge('pwdErr').textContent = 'Email atau password salah';
      ge('loginBtn').disabled = false;
      ge('loginBtn').textContent = 'Masuk';
    }
  }

  ge('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var email = ge('email').value.trim();
    var pwd   = ge('password').value;
    var ok = true;
    ge('emailErr').textContent = '';
    ge('pwdErr').textContent   = '';
    if (!email) { ge('emailErr').textContent = 'Email wajib diisi'; ok = false; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { ge('emailErr').textContent = 'Format email tidak valid'; ok = false; }
    if (!pwd) { ge('pwdErr').textContent = 'Password wajib diisi'; ok = false; }
    if (!ok) return;

    ge('loginBtn').disabled = true;
    ge('loginBtn').textContent = 'Masuk...';
    setTimeout(function () { doLogin(email, pwd); }, 400);
  });

  ge('viewerBtn').addEventListener('click', function () {
    ge('email').value    = VIEWER.email;
    ge('password').value = VIEWER.password;
    ge('loginBtn').disabled = true;
    ge('loginBtn').textContent = 'Masuk...';
    setTimeout(function () { doLogin(VIEWER.email, VIEWER.password); }, 400);
  });

  ge('togglePwd').addEventListener('click', function () {
    var p = ge('password');
    p.type = p.type === 'password' ? 'text' : 'password';
  });

  ge('logoutBtn').addEventListener('click', function () {
    delSess();
    document.body.classList.remove('is-admin', 'is-viewer');
    ge('email').value       = '';
    ge('password').value    = '';
    ge('loginBtn').disabled = false;
    ge('loginBtn').textContent = 'Masuk';
    showPage('loginPage');
    toast('Berhasil keluar');
  });

  /* ---- navigation ---- */
  var SEC_LABEL = { beranda: 'Beranda', profil: 'Profil' };

  function goSec(key) {
    qsa('.nav-link').forEach(function (n) { n.classList.remove('active'); });
    var nl = document.querySelector('.nav-link[data-sec="' + key + '"]');
    if (nl) nl.classList.add('active');
    qsa('.sec').forEach(function (s) { s.classList.remove('active'); });
    var sec = ge('sec-' + key);
    if (sec) sec.classList.add('active');
    ge('topTitle').textContent = SEC_LABEL[key] || key;
    closeSidebar();
  }

  qsa('.nav-link').forEach(function (item) {
    item.addEventListener('click', function () { goSec(item.dataset.sec); });
  });

  function openSidebar()  { ge('sidebar').classList.add('open');    ge('overlay').classList.add('show'); }
  function closeSidebar() { ge('sidebar').classList.remove('open'); ge('overlay').classList.remove('show'); }
  ge('menuBtn').addEventListener('click', openSidebar);
  ge('sbClose').addEventListener('click', closeSidebar);
  ge('overlay').addEventListener('click', closeSidebar);

  /* ---- dark mode ---- */
  var themeBtn = ge('themeBtn');
  if (localStorage.getItem('portf_theme') === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeBtn.textContent = '☀️';
  }
  themeBtn.addEventListener('click', function () {
    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('portf_theme', 'light');
      themeBtn.textContent = '🌙';
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('portf_theme', 'dark');
      themeBtn.textContent = '☀️';
    }
  });

  /* ================================================================
     DATA PROYEK
  ================================================================ */
  function loadProyek() {
    try {
      var s = localStorage.getItem('portf_proyek');
      if (s) return JSON.parse(s);
    } catch (e) {}
    // 2 panel kosong sebagai default
    return [
      { id: 1, judul: '', deskripsi: '', gambar: '', mapel: '', tahun: '', dokumen: null, dokumenNama: '' },
      { id: 2, judul: '', deskripsi: '', gambar: '', mapel: '', tahun: '', dokumen: null, dokumenNama: '' },
    ];
  }

  var proyek, editingId = null;

  function saveProyek() { localStorage.setItem('portf_proyek', JSON.stringify(proyek)); }

  /* ================================================================
     RENDER BERANDA
  ================================================================ */
  function getDokumenIcon(nama) {
    if (!nama) return '📄';
    var ext = nama.split('.').pop().toLowerCase();
    var icons = { pdf: '📕', doc: '📝', docx: '📝', ppt: '📊', pptx: '📊', xls: '📗', xlsx: '📗', txt: '📃' };
    return icons[ext] || '📄';
  }
  function renderBeranda() {
    var sess = getSess();
    ge('welcomeName').textContent = 'Halo, ' + (sess ? sess.nama.split(' ')[0] : 'Siswa') + '! 👋';
    ge('welcomeSub').textContent  = 'Ini adalah portofolio proyek tugas PKL mu.';

    var grid = ge('proyekGrid');
    grid.innerHTML = '';

    proyek.forEach(function (p) {
      if (!p.judul && !p.gambar) {
        var el = document.createElement('div');
        if (isAdmin()) {
          el.className = 'proyek-empty-card';
          el.innerHTML = '<span>➕</span><p>Klik untuk tambah proyek</p>';
          el.addEventListener('click', function () { openModal(p); });
        } else {
          el.className = 'proyek-empty-card';
          el.style.cursor = 'default';
          el.innerHTML = '<span>📂</span><p>Belum ada proyek</p>';
        }
        grid.appendChild(el);
      } else {
        // Panel terisi
        var el2 = document.createElement('div');
        el2.className = 'proyek-card';

        var imgHtml = '';
        if (p.gambar) {
          imgHtml = '<img class="proyek-img" src="' + esc(p.gambar) + '" alt="' + esc(p.judul) + '" />';
        } else {
          imgHtml = '<div class="proyek-img-placeholder" onclick="APP.edit(' + p.id + ')"><span>🖼️</span>Klik untuk tambah gambar</div>';
        }

        var tagsHtml = '';
        if (p.mapel)  tagsHtml += '<span class="proyek-tag">' + esc(p.mapel) + '</span>';
        if (p.tahun)  tagsHtml += '<span class="proyek-tag">' + esc(p.tahun) + '</span>';

        el2.innerHTML =
          imgHtml +
          '<div class="proyek-body">' +
          (tagsHtml ? '<div class="proyek-tags">' + tagsHtml + '</div>' : '') +
          '<div class="proyek-judul">' + esc(p.judul || 'Tanpa Judul') + '</div>' +
          '<div class="proyek-desc">'  + esc(p.deskripsi || '') + '</div>' +
          '</div>' +
          '<div class="proyek-footer">' +
          (p.link ? '<button class="btn-preview" onclick="APP.preview(' + p.id + ')">👁 Preview</button>' : '') +
          (p.dokumen ? '<button class="btn-unduh" onclick="APP.unduh(' + p.id + ')">📥 Unduh Dokumen</button>' : '') +
          (isAdmin() ? '<button class="btn-primary" onclick="APP.edit(' + p.id + ')">✏️ Edit</button>' : '') +
          (isAdmin() ? '<button class="btn-cancel"  onclick="APP.del('  + p.id + ')">🗑️ Hapus</button>' : '') +
          '</div>';

        grid.appendChild(el2);
      }
    });

    // Tombol "+ Tambah Proyek" menambah panel baru
  }

  /* ================================================================
     MODAL PROYEK
  ================================================================ */
  function openModal(p) {
    if (!isAdmin()) { toast('Hanya admin yang dapat mengedit proyek'); return; }
    editingId = p ? p.id : null;
    ge('modalTitle').textContent = p && p.judul ? 'Edit Proyek' : 'Isi Proyek';
    ge('pJudul').value     = p ? p.judul     : '';
    ge('pDeskripsi').value = p ? p.deskripsi : '';
    ge('pMapel').value     = p ? (p.mapel || 'Pemrograman Web') : 'Pemrograman Web';
    ge('pTahun').value     = p ? p.tahun     : '';
    ge('pLink').value      = p ? (p.link || '') : '';

    // Reset preview gambar
    ge('pGambarFile').value = '';
    if (p && p.gambar) {
      ge('previewImg').src    = p.gambar;
      ge('previewWrap').style.display = 'block';
    } else {
      ge('previewWrap').style.display = 'none';
    }

    // Reset & isi info dokumen
    ge('pDokumenFile').value = '';
    if (p && p.dokumenNama) {
      ge('dokumenNama').textContent  = p.dokumenNama;
      ge('dokumenUkuran').textContent = '';
      ge('dokumenIcon').textContent  = getDokumenIcon(p.dokumenNama);
      ge('dokumenInfo').style.display = 'flex';
    } else {
      ge('dokumenInfo').style.display = 'none';
    }

    ge('modal').classList.add('open');
    ge('pJudul').focus();
  }

  function closeModal() {
    ge('modal').classList.remove('open');
    editingId = null;
    ge('proyekForm').reset();
    ge('previewWrap').style.display = 'none';
    ge('dokumenInfo').style.display = 'none';
    ge('hapusDokumenBtn').dataset.cleared = '';
  }

  // Preview gambar saat dipilih
  ge('pGambarFile').addEventListener('change', function () {
    var file = this.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (e) {
      ge('previewImg').src = e.target.result;
      ge('previewWrap').style.display = 'block';
    };
    reader.readAsDataURL(file);
  });

  // Info dokumen saat dipilih
  ge('pDokumenFile').addEventListener('change', function () {
    var file = this.files[0];
    if (!file) { ge('dokumenInfo').style.display = 'none'; return; }
    var ukuranKB = (file.size / 1024).toFixed(1);
    var ukuranTeks = file.size >= 1024 * 1024
      ? (file.size / 1024 / 1024).toFixed(1) + ' MB'
      : ukuranKB + ' KB';
    ge('dokumenNama').textContent   = file.name;
    ge('dokumenUkuran').textContent = ukuranTeks;
    ge('dokumenIcon').textContent   = getDokumenIcon(file.name);
    ge('dokumenInfo').style.display = 'flex';
  });

  // Hapus dokumen yang dipilih
  ge('hapusDokumenBtn').addEventListener('click', function () {
    ge('pDokumenFile').value = '';
    ge('dokumenInfo').style.display = 'none';
    // Tandai bahwa dokumen dihapus (akan diproses saat simpan)
    ge('hapusDokumenBtn').dataset.cleared = 'true';
  });

  ge('addProyekBtn').addEventListener('click', function () {
    // Tambah panel baru
    var newP = { id: Date.now(), judul: '', deskripsi: '', gambar: '', mapel: '', tahun: '', dokumen: null, dokumenNama: '' };
    proyek.push(newP);
    saveProyek();
    openModal(newP);
  });

  ge('modalClose').addEventListener('click', closeModal);
  ge('modalCancel').addEventListener('click', closeModal);
  ge('modal').addEventListener('click', function (e) { if (e.target === ge('modal')) closeModal(); });

  ge('proyekForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var judul = ge('pJudul').value.trim();
    if (!judul) { toast('Judul proyek wajib diisi!'); return; }

    var idx = proyek.findIndex(function (p) { return p.id === editingId; });
    if (idx === -1) { closeModal(); return; }

    // Ambil gambar: pakai file baru jika ada, atau tetap gambar lama
    var fileInput = ge('pGambarFile');
    var gambarLama = proyek[idx].gambar;

    function simpan(gambarData, dokumenData, dokumenNamaData) {
      proyek[idx].judul       = judul;
      proyek[idx].deskripsi   = ge('pDeskripsi').value.trim();
      proyek[idx].gambar      = gambarData;
      proyek[idx].mapel       = ge('pMapel').value;
      proyek[idx].tahun       = ge('pTahun').value.trim();
      proyek[idx].link        = ge('pLink').value.trim();
      proyek[idx].dokumen     = dokumenData;
      proyek[idx].dokumenNama = dokumenNamaData;
      saveProyek();
      closeModal();
      renderBeranda();
      toast('Proyek disimpan ✅');
    }

    var dokumenInput  = ge('pDokumenFile');
    var dokumenLama   = proyek[idx].dokumen     || null;
    var dokumenNamaLama = proyek[idx].dokumenNama || '';
    var cleared       = ge('hapusDokumenBtn').dataset.cleared === 'true';

    function simpanDenganGambar(gambarData) {
      if (dokumenInput.files && dokumenInput.files[0]) {
        // Ada file dokumen baru
        var dReader = new FileReader();
        dReader.onload = function (ev) {
          simpan(gambarData, ev.target.result, dokumenInput.files[0].name);
        };
        dReader.readAsDataURL(dokumenInput.files[0]);
      } else if (cleared) {
        // Dokumen sengaja dihapus
        simpan(gambarData, null, '');
      } else {
        // Tetap pakai dokumen lama
        simpan(gambarData, dokumenLama, dokumenNamaLama);
      }
    }

    if (fileInput.files && fileInput.files[0]) {
      var reader = new FileReader();
      reader.onload = function (ev) { simpanDenganGambar(ev.target.result); };
      reader.readAsDataURL(fileInput.files[0]);
    } else {
      simpanDenganGambar(gambarLama);
    }
  });

  /* ================================================================
     MODAL PREVIEW
  ================================================================ */
  function openPreview(p) {
    if (!p || !p.link) return;

    var url = p.link.trim();
    var embedUrl = url;

    // Google Data Studio / Looker Studio
    if (url.indexOf('datastudio.google.com') !== -1 || url.indexOf('lookerstudio.google.com') !== -1) {
      // Format embed yang benar:
      // https://datastudio.google.com/embed/reporting/{ID}/page/...
      // Ambil ID laporan dari URL
      var match = url.match(/reporting\/([a-zA-Z0-9_-]+)/);
      if (match) {
        // Ambil bagian page jika ada
        var pageMatch = url.match(/\/page\/([a-zA-Z0-9_-]+)/);
        var base = 'https://datastudio.google.com/embed/reporting/' + match[1];
        embedUrl = pageMatch ? base + '/page/' + pageMatch[1] : base;
      } else {
        embedUrl = url.replace('datastudio.google.com/reporting', 'datastudio.google.com/embed/reporting')
                      .replace('lookerstudio.google.com/reporting', 'lookerstudio.google.com/embed/reporting');
      }
    }
    // Figma
    else if (url.indexOf('figma.com') !== -1) {
      embedUrl = 'https://www.figma.com/embed?embed_host=share&url=' + encodeURIComponent(url);
    }
    // YouTube
    else if (url.indexOf('youtube.com/watch') !== -1) {
      var vid = url.match(/[?&]v=([^&#]+)/);
      if (vid) embedUrl = 'https://www.youtube.com/embed/' + vid[1];
    }
    else if (url.indexOf('youtu.be/') !== -1) {
      var vid2 = url.split('youtu.be/')[1];
      if (vid2) embedUrl = 'https://www.youtube.com/embed/' + vid2.split('?')[0];
    }

    ge('previewModalTitle').textContent = p.judul || 'Preview Proyek';
    ge('previewOpenLink').href   = url;
    ge('blockedOpenLink').href   = url;
    ge('previewLoading').style.display  = 'flex';
    ge('previewBlocked').style.display  = 'none';
    ge('previewIframe').style.display   = 'block';

    // Pasang handler via JS, bukan inline HTML — lebih andal
    var iframe = ge('previewIframe');
    iframe.onload = function () {
      ge('previewLoading').style.display = 'none';
    };
    iframe.onerror = function () {
      showPreviewBlocked();
    };

    iframe.src = embedUrl;
    ge('previewModal').classList.add('open');
  }

  function showPreviewBlocked() {
    ge('previewLoading').style.display = 'none';
    ge('previewBlocked').style.display = 'flex';
    ge('previewIframe').style.display  = 'none';
  }

  function closePreview() {
    var iframe = ge('previewIframe');
    iframe.onload  = null;
    iframe.onerror = null;
    iframe.src = '';
    ge('previewModal').classList.remove('open');
  }

  ge('previewModalClose').addEventListener('click', closePreview);
  ge('previewModal').addEventListener('click', function (e) {
    if (e.target === ge('previewModal')) closePreview();
  });

  /* Global handlers */
  window.APP = {
    edit: function (id) {
      var p = proyek.find(function (x) { return x.id === id; });
      if (p) openModal(p);
    },
    del: function (id) {
      if (!confirm('Hapus proyek ini?')) return;
      proyek = proyek.filter(function (x) { return x.id !== id; });
      saveProyek();
      renderBeranda();
      toast('Proyek dihapus 🗑️');
    },
    preview: function (id) {
      var p = proyek.find(function (x) { return x.id === id; });
      if (p) openPreview(p);
    },
    unduh: function (id) {
      var p = proyek.find(function (x) { return x.id === id; });
      if (!p || !p.dokumen) return;
      var a = document.createElement('a');
      a.href     = p.dokumen;
      a.download = p.dokumenNama || 'dokumen';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast('Mengunduh ' + (p.dokumenNama || 'dokumen') + ' 📥');
    },
    onIframeLoad: function () {},  // tidak dipakai, handler pasang via JS
  };

  /* ================================================================
     PROFIL
  ================================================================ */
  function loadProfil() {
    var sess = getSess();
    if (!sess) return;
    var init = (sess.nama || 'S').charAt(0).toUpperCase();
    var roleLabel = sess.role === 'admin' ? 'Admin' : 'Pengunjung';
    ge('sbAvatar').textContent     = init;
    ge('topAvatar').textContent    = init;
    ge('profilAvatar').textContent = init;
    ge('sbName').textContent       = sess.nama  || 'Siswa';
    ge('sbClass').textContent      = sess.kelas || '';
    ge('profilName').textContent   = sess.nama  || 'Siswa';
    ge('profilDetail').textContent = (sess.kelas && sess.kelas !== '-' ? sess.kelas + ' • ' : '') + (sess.nisn ? 'NISN: ' + sess.nisn : '');
    ge('profilEmail').textContent  = sess.email || '';
    ge('pNama').value  = sess.nama  || '';
    ge('pKelas').value = sess.kelas || 'XI RPL';
    ge('pNISN').value  = sess.nisn  || '';
    ge('pEmail').value = sess.email || '';
    // Role badge
    var rb = ge('roleBadge');
    rb.textContent = roleLabel;
    rb.className   = 'role-badge ' + (sess.role === 'admin' ? 'admin' : 'viewer');
  }

  ge('saveProfilBtn').addEventListener('click', function () {
    if (!isAdmin()) { toast('Hanya admin yang dapat mengubah profil'); return; }
    var sess = getSess();
    if (!sess) return;
    var nama = ge('pNama').value.trim();
    if (!nama) { toast('Nama tidak boleh kosong!'); return; }
    sess.nama  = nama;
    sess.kelas = ge('pKelas').value;
    sess.nisn  = ge('pNISN').value.trim();
    setSess(sess);
    setProfil({ nama: sess.nama, kelas: sess.kelas, nisn: sess.nisn });
    loadProfil();
    toast('Profil disimpan ✅');
  });

  /* ================================================================
     INIT
  ================================================================ */
  function initDash() {
    proyek = loadProyek();
    loadProfil();
    renderBeranda();
  }

  var sess = getSess();
  if (sess && sess.loggedIn) {
    applyRole();
    initDash();
    showPage('dashPage');
  } else {
    showPage('loginPage');
  }

})();
