(function () {
  'use strict';

  /* ================================================================
     FIREBASE CONFIG
  ================================================================ */
  var firebaseConfig = {
    apiKey:            "AIzaSyBMDtdUL6V1hGmGvuRQi7Y2qWTyhmysl3M",
    authDomain:        "portofolio-pkl.firebaseapp.com",
    projectId:         "portofolio-pkl",
    storageBucket:     "portofolio-pkl.firebasestorage.app",
    messagingSenderId: "848906245386",
    appId:             "1:848906245386:web:ef24fb8a300d6f80a49e83"
  };

  firebase.initializeApp(firebaseConfig);
  var auth    = firebase.auth();
  var db      = firebase.firestore();
  var storage = firebase.storage();

  /* ================================================================
     HELPERS
  ================================================================ */
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

  /* ---- loading overlay ---- */
  function showLoading(msg) {
    ge('loadingText').textContent = msg || 'Memuat...';
    ge('loadingOverlay').style.display = 'flex';
  }
  function hideLoading() {
    ge('loadingOverlay').style.display = 'none';
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

  /* ================================================================
     ROLE — ditentukan berdasarkan email
  ================================================================ */
  var ADMIN_EMAIL = 'siswa@smkrpl.com';

  function getRoleFromEmail(email) {
    return email === ADMIN_EMAIL ? 'admin' : 'viewer';
  }

  var currentUser = null;   // Firebase user object
  var currentRole = null;

  function isAdmin() { return currentRole === 'admin'; }

  function applyRole() {
    document.body.classList.toggle('is-admin',  isAdmin());
    document.body.classList.toggle('is-viewer', !isAdmin());
  }

  /* ================================================================
     AUTH — Firebase Authentication
  ================================================================ */
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

    auth.signInWithEmailAndPassword(email, pwd)
      .catch(function (err) {
        ge('pwdErr').textContent = 'Email atau password salah';
        ge('loginBtn').disabled  = false;
        ge('loginBtn').textContent = 'Masuk';
      });
  });

  ge('viewerBtn').addEventListener('click', function () {
    ge('email').value    = 'tamu@smkrpl.com';
    ge('password').value = 'tamu123';
    ge('loginBtn').disabled = true;
    ge('loginBtn').textContent = 'Masuk...';
    auth.signInWithEmailAndPassword('tamu@smkrpl.com', 'tamu123')
      .catch(function () {
        ge('loginBtn').disabled   = false;
        ge('loginBtn').textContent = 'Masuk';
        toast('Gagal masuk sebagai pengunjung');
      });
  });

  ge('togglePwd').addEventListener('click', function () {
    var p = ge('password');
    p.type = p.type === 'password' ? 'text' : 'password';
  });

  ge('logoutBtn').addEventListener('click', function () {
    auth.signOut().then(function () {
      currentUser = null;
      currentRole = null;
      document.body.classList.remove('is-admin', 'is-viewer');
      ge('email').value        = '';
      ge('password').value     = '';
      ge('loginBtn').disabled  = false;
      ge('loginBtn').textContent = 'Masuk';
      showPage('loginPage');
      toast('Berhasil keluar');
    });
  });

  /* ================================================================
     AUTH STATE OBSERVER — titik masuk utama
  ================================================================ */
  showLoading('Memeriksa sesi...');

  auth.onAuthStateChanged(function (user) {
    if (user) {
      currentUser = user;
      currentRole = getRoleFromEmail(user.email);
      applyRole();
      initDash().then(function () {
        hideLoading();
        showPage('dashPage');
      });
    } else {
      hideLoading();
      showPage('loginPage');
    }
  });

  /* ================================================================
     NAVIGASI
  ================================================================ */
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

  /* ================================================================
     DARK MODE
  ================================================================ */
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
     DATA PROYEK — Firestore
  ================================================================ */
  var proyek     = [];
  var editingId  = null;
  var COLL_PROYEK = 'proyek';

  function loadProyekFromDB() {
    return db.collection(COLL_PROYEK)
      .orderBy('urutan', 'asc')
      .get()
      .then(function (snap) {
        proyek = [];
        snap.forEach(function (doc) {
          var d = doc.data();
          d.id = doc.id;
          proyek.push(d);
        });
        // Jika kosong, buat 2 slot default
        if (proyek.length === 0) {
          return Promise.all([
            db.collection(COLL_PROYEK).add({ judul:'', deskripsi:'', gambar:'', mapel:'', tahun:'', link:'', dokumen:null, dokumenNama:'', urutan:1 }),
            db.collection(COLL_PROYEK).add({ judul:'', deskripsi:'', gambar:'', mapel:'', tahun:'', link:'', dokumen:null, dokumenNama:'', urutan:2 })
          ]).then(function () { return loadProyekFromDB(); });
        }
      });
  }

  function saveProyekToDB(p) {
    var id = p.id;
    var data = {
      judul:       p.judul       || '',
      deskripsi:   p.deskripsi   || '',
      gambar:      p.gambar      || '',
      mapel:       p.mapel       || '',
      tahun:       p.tahun       || '',
      link:        p.link        || '',
      dokumen:     p.dokumen     || null,
      dokumenNama: p.dokumenNama || '',
      urutan:      p.urutan      || Date.now()
    };
    return db.collection(COLL_PROYEK).doc(id).set(data);
  }

  function deleteProyekFromDB(id) {
    return db.collection(COLL_PROYEK).doc(id).delete();
  }

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
    ge('welcomeName').textContent = 'Halo, ' + (currentUser ? currentUser.displayName || currentUser.email.split('@')[0] : 'Siswa') + '! 👋';
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
        var el2 = document.createElement('div');
        el2.className = 'proyek-card';

        var imgHtml = p.gambar
          ? '<img class="proyek-img" src="' + esc(p.gambar) + '" alt="' + esc(p.judul) + '" />'
          : '<div class="proyek-img-placeholder" onclick="APP.edit(\'' + p.id + '\')"><span>🖼️</span>Klik untuk tambah gambar</div>';

        var tagsHtml = '';
        if (p.mapel) tagsHtml += '<span class="proyek-tag">' + esc(p.mapel) + '</span>';
        if (p.tahun) tagsHtml += '<span class="proyek-tag">' + esc(p.tahun) + '</span>';

        el2.innerHTML =
          imgHtml +
          '<div class="proyek-body">' +
          (tagsHtml ? '<div class="proyek-tags">' + tagsHtml + '</div>' : '') +
          '<div class="proyek-judul">' + esc(p.judul || 'Tanpa Judul') + '</div>' +
          '<div class="proyek-desc">'  + esc(p.deskripsi || '') + '</div>' +
          '</div>' +
          '<div class="proyek-footer">' +
          (p.link    ? '<button class="btn-preview" onclick="APP.preview(\'' + p.id + '\')">👁 Preview</button>' : '') +
          (p.dokumen ? '<button class="btn-unduh"   onclick="APP.unduh(\''   + p.id + '\')">📥 Unduh Dokumen</button>' : '') +
          (isAdmin() ? '<button class="btn-primary" onclick="APP.edit(\''    + p.id + '\')">✏️ Edit</button>' : '') +
          (isAdmin() ? '<button class="btn-cancel"  onclick="APP.del(\''     + p.id + '\')">🗑️ Hapus</button>' : '') +
          '</div>';

        grid.appendChild(el2);
      }
    });
  }

  /* ================================================================
     MODAL PROYEK
  ================================================================ */
  function openModal(p) {
    if (!isAdmin()) { toast('Hanya admin yang dapat mengedit proyek'); return; }
    editingId = p ? p.id : null;
    ge('modalTitle').textContent = p && p.judul ? 'Edit Proyek' : 'Isi Proyek';
    ge('pJudul').value     = p ? (p.judul     || '') : '';
    ge('pDeskripsi').value = p ? (p.deskripsi || '') : '';
    ge('pMapel').value     = p ? (p.mapel     || 'Pemrograman Web') : 'Pemrograman Web';
    ge('pTahun').value     = p ? (p.tahun     || '') : '';
    ge('pLink').value      = p ? (p.link      || '') : '';

    ge('pGambarFile').value = '';
    if (p && p.gambar) {
      ge('previewImg').src = p.gambar;
      ge('previewWrap').style.display = 'block';
    } else {
      ge('previewWrap').style.display = 'none';
    }

    ge('pDokumenFile').value = '';
    ge('hapusDokumenBtn').dataset.cleared = '';
    if (p && p.dokumenNama) {
      ge('dokumenNama').textContent   = p.dokumenNama;
      ge('dokumenUkuran').textContent = '';
      ge('dokumenIcon').textContent   = getDokumenIcon(p.dokumenNama);
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

  ge('pDokumenFile').addEventListener('change', function () {
    var file = this.files[0];
    if (!file) { ge('dokumenInfo').style.display = 'none'; return; }
    var ukuranTeks = file.size >= 1024 * 1024
      ? (file.size / 1024 / 1024).toFixed(1) + ' MB'
      : (file.size / 1024).toFixed(1) + ' KB';
    ge('dokumenNama').textContent   = file.name;
    ge('dokumenUkuran').textContent = ukuranTeks;
    ge('dokumenIcon').textContent   = getDokumenIcon(file.name);
    ge('dokumenInfo').style.display = 'flex';
  });

  ge('hapusDokumenBtn').addEventListener('click', function () {
    ge('pDokumenFile').value = '';
    ge('dokumenInfo').style.display = 'none';
    ge('hapusDokumenBtn').dataset.cleared = 'true';
  });

  ge('addProyekBtn').addEventListener('click', function () {
    showLoading('Menambah slot proyek...');
    var newP = {
      judul:'', deskripsi:'', gambar:'', mapel:'', tahun:'',
      link:'', dokumen:null, dokumenNama:'',
      urutan: Date.now()
    };
    db.collection(COLL_PROYEK).add(newP).then(function (ref) {
      newP.id = ref.id;
      proyek.push(newP);
      hideLoading();
      openModal(newP);
    }).catch(function () { hideLoading(); toast('Gagal menambah proyek'); });
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

    var fileInput    = ge('pGambarFile');
    var dokumenInput = ge('pDokumenFile');
    var gambarLama       = proyek[idx].gambar      || '';
    var dokumenLama      = proyek[idx].dokumen      || null;
    var dokumenNamaLama  = proyek[idx].dokumenNama  || '';
    var cleared          = ge('hapusDokumenBtn').dataset.cleared === 'true';

    function simpan(gambarData, dokumenData, dokumenNamaData) {
      proyek[idx].judul       = judul;
      proyek[idx].deskripsi   = ge('pDeskripsi').value.trim();
      proyek[idx].gambar      = gambarData;
      proyek[idx].mapel       = ge('pMapel').value;
      proyek[idx].tahun       = ge('pTahun').value.trim();
      proyek[idx].link        = ge('pLink').value.trim();
      proyek[idx].dokumen     = dokumenData;
      proyek[idx].dokumenNama = dokumenNamaData;

      showLoading('Menyimpan proyek...');
      saveProyekToDB(proyek[idx]).then(function () {
        hideLoading();
        closeModal();
        renderBeranda();
        toast('Proyek disimpan ✅');
      }).catch(function () {
        hideLoading();
        toast('Gagal menyimpan ke database ❌');
      });
    }

    function simpanDenganGambar(gambarData) {
      if (dokumenInput.files && dokumenInput.files[0]) {
        // Upload dokumen ke Firebase Storage
        var file = dokumenInput.files[0];
        var storageRef = storage.ref('dokumen/' + editingId + '_' + file.name);
        showLoading('Mengupload dokumen...');
        storageRef.put(file).then(function (snap) {
          return snap.ref.getDownloadURL();
        }).then(function (url) {
          simpan(gambarData, url, file.name);
        }).catch(function () {
          hideLoading();
          toast('Gagal upload dokumen ❌');
        });
      } else if (cleared) {
        simpan(gambarData, null, '');
      } else {
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
     MODAL PREVIEW LINK
  ================================================================ */
  function openPreview(p) {
    if (!p || !p.link) return;
    var url = p.link.trim();
    var embedUrl = url;

    if (url.indexOf('datastudio.google.com') !== -1 || url.indexOf('lookerstudio.google.com') !== -1) {
      var match = url.match(/reporting\/([a-zA-Z0-9_-]+)/);
      if (match) {
        var pageMatch = url.match(/\/page\/([a-zA-Z0-9_-]+)/);
        var base = 'https://datastudio.google.com/embed/reporting/' + match[1];
        embedUrl = pageMatch ? base + '/page/' + pageMatch[1] : base;
      } else {
        embedUrl = url.replace('datastudio.google.com/reporting', 'datastudio.google.com/embed/reporting')
                      .replace('lookerstudio.google.com/reporting', 'lookerstudio.google.com/embed/reporting');
      }
    } else if (url.indexOf('figma.com') !== -1) {
      embedUrl = 'https://www.figma.com/embed?embed_host=share&url=' + encodeURIComponent(url);
    } else if (url.indexOf('youtube.com/watch') !== -1) {
      var vid = url.match(/[?&]v=([^&#]+)/);
      if (vid) embedUrl = 'https://www.youtube.com/embed/' + vid[1];
    } else if (url.indexOf('youtu.be/') !== -1) {
      var vid2 = url.split('youtu.be/')[1];
      if (vid2) embedUrl = 'https://www.youtube.com/embed/' + vid2.split('?')[0];
    }

    ge('previewModalTitle').textContent    = p.judul || 'Preview Proyek';
    ge('previewOpenLink').href             = url;
    ge('blockedOpenLink').href             = url;
    ge('previewLoading').style.display     = 'flex';
    ge('previewBlocked').style.display     = 'none';
    ge('previewIframe').style.display      = 'block';

    var iframe = ge('previewIframe');
    iframe.onload  = function () { ge('previewLoading').style.display = 'none'; };
    iframe.onerror = function () { showPreviewBlocked(); };
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

  /* ================================================================
     GLOBAL HANDLERS (onclick di HTML)
  ================================================================ */
  window.APP = {
    edit: function (id) {
      var p = proyek.find(function (x) { return x.id === id; });
      if (p) openModal(p);
    },
    del: function (id) {
      if (!confirm('Hapus proyek ini?')) return;
      showLoading('Menghapus proyek...');
      deleteProyekFromDB(id).then(function () {
        proyek = proyek.filter(function (x) { return x.id !== id; });
        hideLoading();
        renderBeranda();
        toast('Proyek dihapus 🗑️');
      }).catch(function () { hideLoading(); toast('Gagal menghapus ❌'); });
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
    }
  };

  /* ================================================================
     PROFIL — disimpan di Firestore doc "profil/admin"
  ================================================================ */
  var DOC_PROFIL = db.collection('profil').doc('admin');

  function loadProfil() {
    if (!currentUser) return Promise.resolve();
    return DOC_PROFIL.get().then(function (doc) {
      var data = doc.exists ? doc.data() : {};
      var nama  = data.nama  || currentUser.displayName || currentUser.email.split('@')[0];
      var kelas = data.kelas || 'XII RPL';
      var nisn  = data.nisn  || '';
      var email = currentUser.email;
      var roleLabel = isAdmin() ? 'Admin' : 'Pengunjung';
      var init  = nama.charAt(0).toUpperCase();

      ge('sbAvatar').textContent     = init;
      ge('topAvatar').textContent    = init;
      ge('profilAvatar').textContent = init;
      ge('sbName').textContent       = nama;
      ge('sbClass').textContent      = kelas;
      ge('profilName').textContent   = nama;
      ge('profilDetail').textContent = (kelas && kelas !== '-' ? kelas + ' • ' : '') + (nisn ? 'NISN: ' + nisn : '');
      ge('profilEmail').textContent  = email;
      ge('pNama').value  = nama;
      ge('pKelas').value = kelas;
      ge('pNISN').value  = nisn;
      ge('pEmail').value = email;

      var rb = ge('roleBadge');
      rb.textContent = roleLabel;
      rb.className   = 'role-badge ' + (isAdmin() ? 'admin' : 'viewer');

      // Update sapaan beranda
      ge('welcomeName').textContent = 'Halo, ' + nama.split(' ')[0] + '! 👋';
    });
  }

  ge('saveProfilBtn').addEventListener('click', function () {
    if (!isAdmin()) { toast('Hanya admin yang dapat mengubah profil'); return; }
    var nama = ge('pNama').value.trim();
    if (!nama) { toast('Nama tidak boleh kosong!'); return; }
    showLoading('Menyimpan profil...');
    DOC_PROFIL.set({
      nama:  nama,
      kelas: ge('pKelas').value,
      nisn:  ge('pNISN').value.trim()
    }).then(function () {
      hideLoading();
      loadProfil();
      toast('Profil disimpan ✅');
    }).catch(function () {
      hideLoading();
      toast('Gagal menyimpan profil ❌');
    });
  });

  /* ================================================================
     INIT DASHBOARD
  ================================================================ */
  function initDash() {
    showLoading('Memuat data...');
    return loadProyekFromDB()
      .then(function () { return loadProfil(); })
      .then(function () {
        hideLoading();
        renderBeranda();
      })
      .catch(function (err) {
        hideLoading();
        toast('Gagal memuat data: ' + err.message);
      });
  }

})();
