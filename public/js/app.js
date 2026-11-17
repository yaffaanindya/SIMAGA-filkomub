/**
 * ==============================================================================
 * SIMAGA - CORE APPLICATION CONTROLLER & ROUTER
 * ==============================================================================
 */

window.SIMAGA_ROUTER = (function() {
  let activeTab = 'beranda';

  function init() {
    setupEventListeners();
    updateUIForAuth();
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    loadNotifications();

    // Inisialisasi ikon Lucide
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  function getRoleDefaultTab(role) {
    if (role === 'Mahasiswa') return 'mhs-lowongan';
    if (role === 'Alumni') return 'alm-lowongan';
    if (role === 'MitraIndustri') return 'min-lowongan-saya';
    if (role === 'Admin') return 'adm-analitik';
    return 'beranda';
  }

  function handleBrandClick(e) {
    if (e) e.preventDefault();
    if (window.SIMAGA_AUTH.isAuthenticated()) {
      const user = window.SIMAGA_AUTH.getUser();
      const targetTab = getRoleDefaultTab(user.role);
      window.location.hash = '#' + targetTab;
      navigateTo(targetTab);
    } else {
      window.location.hash = '#beranda';
      navigateTo('beranda');
    }
  }

  function handleHashChange() {
    const hash = window.location.hash.replace('#', '') || 'beranda';
    navigateTo(hash);
  }

  function navigateTo(tabId) {
    const isAuth = window.SIMAGA_AUTH.isAuthenticated();
    if (isAuth && (tabId === 'beranda' || !tabId)) {
      const user = window.SIMAGA_AUTH.getUser();
      tabId = getRoleDefaultTab(user.role);
      window.location.hash = '#' + tabId;
    }

    activeTab = tabId;

    // Sembunyikan semua tab content
    document.querySelectorAll('.tab-content').forEach(el => {
      el.classList.remove('active');
    });

    // Tampilkan tab aktif
    const target = document.getElementById(`view-${tabId}`);
    if (target) {
      target.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Perbarui styling link navigasi
    document.querySelectorAll('.nav-link').forEach(link => {
      if (link.getAttribute('href') === `#${tabId}`) {
        link.classList.add('text-brand-900', 'font-bold');
        link.classList.remove('text-gray-600');
      } else {
        link.classList.remove('text-brand-900', 'font-bold');
        link.classList.add('text-gray-600');
      }
    });

    // Panggil render controller sesuai tab
    if (tabId === 'mhs-lowongan') window.SIMAGA_MHS.renderVacancies();
    if (tabId === 'mhs-lamaran') window.SIMAGA_MHS.renderMyApplications();
    if (tabId === 'alm-lowongan') window.SIMAGA_ALM.renderJobs();
    if (tabId === 'alm-lamaran') window.SIMAGA_ALM.renderMyJobApplications();
    if (tabId === 'alm-tracer') window.SIMAGA_ALM.initTracerStudy();
    if (tabId === 'min-buat-lowongan') window.SIMAGA_MIN.initCreateVacancyForm();
    if (tabId === 'min-lowongan-saya') window.SIMAGA_MIN.renderPartnerVacancies();
    if (tabId === 'min-pelamar') window.SIMAGA_MIN.renderApplicantReviews();
    if (tabId === 'adm-kurasi') window.SIMAGA_ADM.renderVacancyCuration();
    if (tabId === 'adm-analitik') window.SIMAGA_ADM.renderAnalyticsDashboard();
    if (tabId === 'adm-verifikasi') window.SIMAGA_ADM.renderRespondentValidation();
    if (tabId === 'adm-pengguna') window.SIMAGA_ADM.renderUsersManagement();

    if (window.lucide) window.lucide.createIcons();
  }

  function updateUIForAuth() {
    const user = window.SIMAGA_AUTH.getUser();
    const profile = window.SIMAGA_AUTH.getProfile() || {};

    const authGuestElements = document.querySelectorAll('.auth-guest-only');
    const authUserElements = document.querySelectorAll('.auth-user-only');
    const navBeranda = document.getElementById('nav-link-beranda');

    if (user) {
      authGuestElements.forEach(el => el.classList.add('hidden'));
      authUserElements.forEach(el => el.classList.remove('hidden'));
      if (navBeranda) navBeranda.classList.add('hidden'); // Point 10: Hide dashboard hero when logged in

      // Update text nama & role badge (Point 5: Aligned right, w-fit badge fitting text width)
      const nameEl = document.getElementById('nav-user-name');
      const roleBadgeEl = document.getElementById('nav-user-role-badge');
      if (nameEl) nameEl.textContent = user.nama_lengkap;
      if (roleBadgeEl) {
        roleBadgeEl.textContent = user.role;
        roleBadgeEl.className = `mt-0.5 inline-block w-fit px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getRoleBadgeClass(user.role)}`;
      }

      // Tampilkan menu spesifik role
      document.querySelectorAll('.role-nav').forEach(el => el.classList.add('hidden'));
      const roleSection = document.getElementById(`nav-role-${user.role.toLowerCase()}`);
      if (roleSection) roleSection.classList.remove('hidden');

      updateTopRoleButtons(user.role);
    } else {
      authGuestElements.forEach(el => el.classList.remove('hidden'));
      authUserElements.forEach(el => el.classList.add('hidden'));
      if (navBeranda) navBeranda.classList.remove('hidden');
      document.querySelectorAll('.role-nav').forEach(el => el.classList.add('hidden'));
      updateTopRoleButtons(null);
    }
  }

  function getRoleBadgeClass(role) {
    if (role === 'Mahasiswa') return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
    if (role === 'Alumni') return 'bg-blue-100 text-blue-800 border border-blue-200';
    if (role === 'MitraIndustri') return 'bg-purple-100 text-purple-800 border border-purple-200';
    if (role === 'Admin') return 'bg-amber-100 text-amber-800 border border-amber-200';
    return 'bg-gray-100 text-gray-800 border border-gray-200';
  }

  async function loadNotifications() {
    const user = window.SIMAGA_AUTH.getUser();
    if (!user) return;

    const res = await window.SIMAGA_API.getNotifications(user.id_user);
    const rawNotifs = res.data || [];

    // Deduplikasi ketat berdasarkan ID dan kombinasi judul & tanggal
    const seen = new Set();
    const notifs = [];
    rawNotifs.forEach(n => {
      const key = n.id_notifikasi || `${n.id_user}-${n.judul}-${(n.tanggal_kirim || '').slice(0, 10)}`;
      if (!seen.has(key)) {
        seen.add(key);
        notifs.push(n);
      }
    });

    const unread = notifs.filter(n => !n.is_dibaca);

    const badge = document.getElementById('notif-unread-badge');
    if (badge) {
      if (unread.length > 0) {
        badge.textContent = unread.length;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }

    const container = document.getElementById('notif-dropdown-list');
    if (container) {
      if (notifs.length === 0) {
        container.innerHTML = '<p class="text-xs text-gray-400 p-4 text-center">Tidak ada notifikasi baru.</p>';
      } else {
        container.innerHTML = notifs.map(n => `
          <div onclick="window.SIMAGA_ROUTER.markNotifRead('${n.id_notifikasi}')" 
            class="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer text-xs ${n.is_dibaca ? 'opacity-70' : 'bg-emerald-50/40'}">
            <div class="flex items-center justify-between mb-1">
              <span class="font-bold text-gray-900">${n.judul}</span>
              <span class="text-[10px] text-gray-400">${n.tanggal_kirim.split(' ')[0]}</span>
            </div>
            <p class="text-gray-600">${n.pesan}</p>
          </div>
        `).join('');
      }
    }
  }

  async function markNotifRead(id_notifikasi) {
    await window.SIMAGA_API.markNotificationRead(id_notifikasi);
    loadNotifications();
  }

  function setupEventListeners() {
    // Tombol Login Cepat Demo Modal & Page
    document.querySelectorAll('.btn-demo-login').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const pass = e.currentTarget.getAttribute('data-pass');
        const mId = document.getElementById('login-identifier');
        const mPass = document.getElementById('login-password');
        if (mId) mId.value = id;
        if (mPass) mPass.value = pass;
        doLogin('modal');
      });
    });

    document.querySelectorAll('.btn-page-demo-login').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const pass = e.currentTarget.getAttribute('data-pass');
        const pId = document.getElementById('page-login-identifier');
        const pPass = document.getElementById('page-login-password');
        if (pId) pId.value = id;
        if (pPass) pPass.value = pass;
        doLogin('page');
      });
    });

    // Form Login Modal Submit
    const loginForm = document.getElementById('form-login');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        doLogin('modal');
      });
    }

    // Form Login Page Submit
    const pageLoginForm = document.getElementById('form-page-login');
    if (pageLoginForm) {
      pageLoginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        doLogin('page');
      });
    }

    // Toggle Notifikasi Dropdown
    const notifBtn = document.getElementById('btn-notif-bell');
    const notifDropdown = document.getElementById('notif-dropdown');
    if (notifBtn && notifDropdown) {
      notifBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        notifDropdown.classList.toggle('hidden');
      });
      document.addEventListener('click', () => {
        notifDropdown.classList.add('hidden');
      });
    }
  }

  async function doLogin(source = 'modal') {
    const isPage = source === 'page';
    const id = isPage 
      ? document.getElementById('page-login-identifier')?.value 
      : document.getElementById('login-identifier')?.value;
    const pass = isPage 
      ? document.getElementById('page-login-password')?.value 
      : document.getElementById('login-password')?.value;
    const alertBox = isPage 
      ? document.getElementById('page-login-error-alert') 
      : document.getElementById('login-error-alert');

    if (alertBox) alertBox.classList.add('hidden');

    if (!id || !pass) {
      if (alertBox) {
        alertBox.textContent = 'Harap isi surel/NIM dan kata sandi.';
        alertBox.classList.remove('hidden');
      }
      return;
    }

    const btn = isPage 
      ? document.getElementById('btn-page-submit-login') 
      : document.getElementById('btn-submit-login');
    const origText = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin inline mr-1"></i> Memeriksa kredensial...`;
    }
    if (window.lucide) window.lucide.createIcons();

    try {
      const res = await window.SIMAGA_AUTH.login(id, pass);
      if (res.status === 'success') {
        document.getElementById('modal-login')?.classList.add('hidden');
        updateUIForAuth();

        // Redirect ke dasbor peran pengguna (UC-16 / Point 10)
        const user = res.data.user;
        const targetTab = getRoleDefaultTab(user.role);
        window.location.hash = `#${targetTab}`;
        navigateTo(targetTab);
      } else {
        if (alertBox) {
          alertBox.textContent = res.message || 'Kredensial tidak valid.';
          alertBox.classList.remove('hidden');
        } else {
          alert(res.message);
        }
      }
    } catch (err) {
      if (alertBox) {
        alertBox.textContent = 'Terjadi kendala koneksi: ' + err.message;
        alertBox.classList.remove('hidden');
      }
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = origText;
      }
      if (window.lucide) window.lucide.createIcons();
    }
  }

  // Pengaturan Koneksi Google Workspace Modal
  function openConfigModal() {
    const config = window.SIMAGA_API.getConfig();
    document.getElementById('cfg-mode').value = config.mode;
    document.getElementById('cfg-apps-script-url').value = config.appsScriptUrl;
    document.getElementById('cfg-spreadsheet-id').value = config.spreadsheetId;
    document.getElementById('modal-config').classList.remove('hidden');
  }

  function saveConfig() {
    const mode = document.getElementById('cfg-mode').value;
    const appsScriptUrl = document.getElementById('cfg-apps-script-url').value.trim();
    const spreadsheetId = document.getElementById('cfg-spreadsheet-id').value.trim();

    window.SIMAGA_API.setConfig({ mode, appsScriptUrl, spreadsheetId });
    alert('✅ Konfigurasi Google Workspace berhasil disimpan!');
    document.getElementById('modal-config').classList.add('hidden');
  }

  async function switchRoleQuick(roleName) {
    const defaultAccounts = {
      Mahasiswa: { id: 'bambang@student.ub.ac.id', pass: 'bambang123', defaultTab: 'mhs-lowongan' },
      Alumni: { id: 'yaya@alumni.ub.ac.id', pass: 'yaya123', defaultTab: 'alm-lowongan' },
      MitraIndustri: { id: 'carmen@techindo.com', pass: 'mitra123', defaultTab: 'min-lowongan-saya' },
      Admin: { id: 'dina@ub.ac.id', pass: 'admin123', defaultTab: 'adm-analitik' }
    };

    const target = defaultAccounts[roleName];
    if (!target) return;

    try {
      const res = await window.SIMAGA_AUTH.login(target.id, target.pass);
      if (res.status === 'success') {
        updateUIForAuth();
        updateTopRoleButtons(roleName);
        window.location.hash = `#${target.defaultTab}`;
        navigateTo(target.defaultTab);
      }
    } catch (e) {
      console.warn('Switch role error:', e);
    }
  }

  function updateTopRoleButtons(activeRole) {
    const mapping = { Mahasiswa: 'mhs', Alumni: 'alm', MitraIndustri: 'min', Admin: 'adm' };
    ['mhs', 'alm', 'min', 'adm'].forEach(k => {
      const btn = document.getElementById(`btn-quick-${k}`);
      if (btn) {
        if (k === mapping[activeRole]) {
          btn.className = 'px-2 py-0.5 rounded font-bold bg-emerald-700 text-white shadow-xs';
        } else {
          btn.className = 'px-2 py-0.5 rounded font-bold text-gray-300 hover:text-white transition-colors';
        }
      }
    });
  }

  return {
    init,
    navigateTo,
    handleBrandClick,
    updateUIForAuth,
    doLogin,
    switchRoleQuick,
    openConfigModal,
    saveConfig,
    markNotifRead
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  window.SIMAGA_ROUTER.init();
});
