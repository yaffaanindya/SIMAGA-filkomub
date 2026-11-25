/**
 * ==============================================================================
 * SIMAGA - MITRA INDUSTRI CONTROLLER (UC-01, UC-02, PC-01, PC-09)
 * ==============================================================================
 */

window.SIMAGA_MIN = (function() {
  let selectedApplicationForReview = null;

  // ============================================================================
  // FORM LOWONGAN BERSAMA (Publikasi Lowongan & Edit Lowongan di "Lowongan Saya")
  // Kedua form dirender dari SATU template dan divalidasi oleh SATU aturan
  // (public/js/vacancy-rules.js, juga dipakai server), sehingga field, label,
  // tipe input, tanda wajib, dan validasinya dijamin identik 100%.
  // ============================================================================
  const RULES = window.SIMAGA_VACANCY_RULES;
  const PREFIX_CREATE = 'vac-create';
  const PREFIX_EDIT = 'vac-edit';
  const FIELD_IDS = {
    judul_posisi: 'judul',
    jenis_kesempatan: 'jenis',
    bidang_keahlian: 'bidang',
    deskripsi: 'deskripsi',
    kualifikasi: 'kualifikasi',
    mode_kerja: 'mode-kerja',
    kota: 'kota',
    periode_mulai: 'mulai',
    periode_selesai: 'selesai',
    kuota: 'kuota',
    batas_pendaftaran: 'deadline'
  };
  const fieldEl = (p, field) => document.getElementById(`${p}-${FIELD_IDS[field]}`);
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const inputCls = 'w-full text-xs p-2.5 border border-gray-300 rounded-xl bg-white';
  const labelCls = 'block text-xs font-bold text-gray-700 mb-1';

  function renderVacancyFields(p) {
    const opts = (list) => list.map(o => `<option value="${esc(o.value)}">${esc(o.label)}</option>`).join('');
    const bidangOpts = RULES.BIDANG_KEAHLIAN.map(b => ({ value: b, label: b }));
    const dateChange = `onchange="window.SIMAGA_MIN.validateVacancyDates('${p}')"`;
    return `
      <div id="${p}-alert" class="hidden p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium mb-4" role="alert"></div>
      <div class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label for="${p}-judul" class="${labelCls}">Judul Posisi Lowongan *</label>
            <input type="text" id="${p}-judul" required class="${inputCls}" placeholder="Contoh: UI/UX Designer Intern">
          </div>
          <div>
            <label for="${p}-jenis" class="${labelCls}">Jenis Kesempatan *</label>
            <select id="${p}-jenis" required class="${inputCls}">${opts(RULES.JENIS_KESEMPATAN)}</select>
          </div>
        </div>

        <div>
          <label for="${p}-bidang" class="${labelCls}">Bidang Keahlian *</label>
          <select id="${p}-bidang" required class="${inputCls}">${opts(bidangOpts)}</select>
        </div>

        <div>
          <label for="${p}-deskripsi" class="${labelCls}">Deskripsi Tugas & Tanggung Jawab *</label>
          <textarea id="${p}-deskripsi" rows="3" required class="${inputCls}" placeholder="Jelaskan ruang lingkup tugas, proyek yang dikerjakan, dan lingkungan kerja..."></textarea>
        </div>

        <div>
          <label for="${p}-kualifikasi" class="${labelCls}">Kualifikasi & Keahlian yang Dibutuhkan *</label>
          <textarea id="${p}-kualifikasi" rows="2" required class="${inputCls}" placeholder="Contoh: Mahasiswa semester 5-7, menguasai Figma, pemahaman dasar User Journey..."></textarea>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label for="${p}-mode-kerja" class="${labelCls}">Mode Kerja *</label>
            <select id="${p}-mode-kerja" required class="${inputCls}" onchange="window.SIMAGA_MIN.onModeKerjaChange('${p}')">${opts(RULES.MODE_KERJA)}</select>
          </div>
          <div>
            <label for="${p}-kota" class="${labelCls}">Kota / Lokasi Kantor <span id="${p}-kota-mark">*</span></label>
            <input type="text" id="${p}-kota" required class="${inputCls}" placeholder="Contoh: Malang / Surabaya / Jakarta">
            <span id="${p}-kota-hint" class="hidden text-[10px] text-gray-500">Opsional untuk mode Remote.</span>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label for="${p}-mulai" class="${labelCls}">Periode Mulai Pelaksanaan *</label>
            <input type="date" id="${p}-mulai" required class="${inputCls}" ${dateChange}>
          </div>
          <div>
            <label for="${p}-selesai" class="${labelCls}">Periode Selesai Pelaksanaan *</label>
            <input type="date" id="${p}-selesai" required class="${inputCls}" ${dateChange}>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label for="${p}-kuota" class="${labelCls}">Kuota Penerimaan (Orang) *</label>
            <input type="number" id="${p}-kuota" min="1" step="1" required class="${inputCls}">
          </div>
          <div>
            <label for="${p}-deadline" class="${labelCls}">Batas Akhir Pendaftaran *</label>
            <input type="date" id="${p}-deadline" required class="${inputCls}" ${dateChange}>
          </div>
        </div>
      </div>
    `;
  }

  function mountVacancyForms() {
    document.querySelectorAll('[data-vacancy-form]').forEach(container => {
      if (container.dataset.mounted) return;
      const p = container.dataset.vacancyForm;
      container.innerHTML = renderVacancyFields(p);
      container.dataset.mounted = '1';
      // Hapus sorotan error saat pengguna mulai memperbaiki isian
      container.addEventListener('input', (e) => clearFieldError(e.target));
      container.addEventListener('change', (e) => clearFieldError(e.target));
    });
  }

  function clearFieldError(el) {
    if (!el || !el.classList) return;
    el.classList.remove('border-red-500', 'ring-2', 'ring-red-200');
    el.removeAttribute('aria-invalid');
  }

  function clearVacancyErrors(p) {
    Object.keys(FIELD_IDS).forEach(f => clearFieldError(fieldEl(p, f)));
    document.getElementById(`${p}-alert`)?.classList.add('hidden');
  }

  function showVacancyErrors(p, errors) {
    clearVacancyErrors(p);
    const fields = Object.keys(errors);
    fields.forEach(f => {
      const el = fieldEl(p, f);
      if (el) {
        el.classList.add('border-red-500', 'ring-2', 'ring-red-200');
        el.setAttribute('aria-invalid', 'true');
      }
    });
    const alertBox = document.getElementById(`${p}-alert`);
    if (alertBox && fields.length) {
      alertBox.innerHTML = '<strong>Mohon perbaiki isian berikut:</strong><ul class="list-disc ml-5 mt-1">' +
        fields.map(f => `<li>${esc(errors[f])}</li>`).join('') + '</ul>';
      alertBox.classList.remove('hidden');
      alertBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    fieldEl(p, fields[0])?.focus({ preventScroll: true });
  }

  function onModeKerjaChange(p) {
    const mode = fieldEl(p, 'mode_kerja')?.value;
    const required = RULES.isKotaRequired(mode);
    const kota = fieldEl(p, 'kota');
    if (kota) kota.required = required;
    document.getElementById(`${p}-kota-mark`)?.classList.toggle('hidden', !required);
    document.getElementById(`${p}-kota-hint`)?.classList.toggle('hidden', required);
    if (!required) clearFieldError(kota);
  }

  function setDeadlineMin(p) {
    // Tenggat minimal besok (aturan: harus lebih besar dari hari ini, zona WIB)
    const today = RULES.todayWIB();
    const d = new Date(today + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    const tomorrow = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const deadline = fieldEl(p, 'batas_pendaftaran');
    if (deadline) deadline.min = tomorrow;
  }

  function readVacancyForm(p) {
    const val = (f) => fieldEl(p, f)?.value ?? '';
    return {
      judul_posisi: val('judul_posisi'),
      jenis_kesempatan: val('jenis_kesempatan'),
      bidang_keahlian: val('bidang_keahlian'),
      deskripsi: val('deskripsi'),
      kualifikasi: val('kualifikasi'),
      mode_kerja: val('mode_kerja'),
      kota: val('kota'),
      periode_mulai: val('periode_mulai'),
      periode_selesai: val('periode_selesai'),
      kuota: val('kuota'),
      batas_pendaftaran: val('batas_pendaftaran')
    };
  }

  function fillVacancyForm(p, v) {
    const { mode_kerja, kota } = RULES.parseLokasi(v.lokasi);
    const set = (f, value) => { const el = fieldEl(p, f); if (el) el.value = value ?? ''; };
    set('judul_posisi', v.judul_posisi);
    set('jenis_kesempatan', v.jenis_kesempatan || 'Magang Bersertifikat');
    set('bidang_keahlian', v.bidang_keahlian || 'Web & Mobile Development');
    set('deskripsi', v.deskripsi);
    set('kualifikasi', v.kualifikasi);
    set('mode_kerja', mode_kerja);          // pre-selected sesuai data lowongan
    set('kota', kota);
    set('periode_mulai', v.periode_mulai);
    set('periode_selesai', v.periode_selesai);
    set('kuota', v.kuota || 1);
    set('batas_pendaftaran', v.batas_pendaftaran);
    onModeKerjaChange(p);
  }

  /** Payload ke server: field form + lokasi tersusun (format "Kota (Mode)"). */
  function toPayload(data) {
    return {
      judul_posisi: data.judul_posisi,
      jenis_kesempatan: data.jenis_kesempatan,
      bidang_keahlian: data.bidang_keahlian,
      deskripsi: data.deskripsi,
      kualifikasi: data.kualifikasi,
      mode_kerja: data.mode_kerja,
      kota: data.kota,
      lokasi: data.lokasi,
      periode_mulai: data.periode_mulai,
      periode_selesai: data.periode_selesai,
      kuota: data.kuota,
      batas_pendaftaran: data.batas_pendaftaran
    };
  }

  // Inisialisasi Form Publikasi Lowongan (UI-01)
  function initCreateVacancyForm() {
    mountVacancyForms();
    const kuota = fieldEl(PREFIX_CREATE, 'kuota');
    if (kuota && !kuota.value) kuota.value = 3;
    onModeKerjaChange(PREFIX_CREATE);
    setDeadlineMin(PREFIX_CREATE);
  }

  function resetCreateVacancyForm() {
    document.getElementById('form-create-vacancy')?.reset();
    clearVacancyErrors(PREFIX_CREATE);
    initCreateVacancyForm();
  }

  // Validasi real-time tanggal (PC-01) — sama untuk form buat & edit
  function validateVacancyDates(p = PREFIX_CREATE) {
    const { errors } = RULES.validateVacancy(readVacancyForm(p));
    const dateErrors = {};
    ['periode_mulai', 'periode_selesai', 'batas_pendaftaran'].forEach(f => {
      const el = fieldEl(p, f);
      if (errors[f] && el && el.value) dateErrors[f] = errors[f]; // hanya tanggal yang sudah diisi
    });
    if (Object.keys(dateErrors).length) {
      showVacancyErrors(p, dateErrors);
      return false;
    }
    clearVacancyErrors(p);
    return true;
  }

  // Ajukan Lowongan Baru (PC-01, UC-01)
  async function submitNewVacancy() {
    mountVacancyForms();
    const check = RULES.validateVacancy(readVacancyForm(PREFIX_CREATE));
    if (!check.valid) {
      showVacancyErrors(PREFIX_CREATE, check.errors);
      return;
    }
    clearVacancyErrors(PREFIX_CREATE);

    const user = window.SIMAGA_AUTH.getUser();
    const profile = window.SIMAGA_AUTH.getProfile() || {};

    const btn = document.getElementById('btn-submit-vacancy');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin mr-1.5 inline"></i> Mengirimkan...`;

    try {
      const res = await window.SIMAGA_API.createVacancy({
        id_mitra: profile.id_mitra || 'MTR-101',
        id_user: user ? user.id_user : 'USR-002',
        ...toPayload(check.data)
      });

      if (res.status === 'success') {
        alert('🎉 Pengajuan lowongan berhasil dikirim!\nStatus: Menunggu Kurasi & Persetujuan Admin Career & Internship FILKOM UB.');
        resetCreateVacancyForm();
        renderPartnerVacancies();
        window.SIMAGA_ROUTER.navigateTo('min-lowongan-saya');
      } else {
        if (res.errors) showVacancyErrors(PREFIX_CREATE, res.errors);
        alert(res.message || 'Gagal mengajukan lowongan.');
      }
    } catch (err) {
      alert('Terjadi kesalahan: ' + err.message);
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  }

  // Render Daftar Lowongan Saya (Mitra)
  let myVacanciesList = [];

  async function renderPartnerVacancies() {
    const container = document.getElementById('min-my-vacancies-container');
    if (!container) return;

    const profile = window.SIMAGA_AUTH.getProfile() || {};
    const id_mitra = profile.id_mitra || 'MTR-101';

    const res = await window.SIMAGA_API.getVacancies({ status: 'all' });
    const list = (res.data || []).filter(v => v.id_mitra === id_mitra);
    myVacanciesList = list;

    if (list.length === 0) {
      container.innerHTML = `
        <div class="py-12 text-center bg-white rounded-2xl border border-gray-200 p-8">
          <p class="text-xs text-gray-500">Belum ada lowongan yang diajukan oleh instansi Anda.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = list.map(v => {
      let badge = '';
      if (v.status_publikasi === 'aktif') {
        badge = '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Aktif Terpublikasi</span>';
      } else if (v.status_publikasi === 'menunggu') {
        badge = '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">Menunggu Verifikasi Admin</span>';
      } else {
        badge = '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">Ditolak</span>';
      }

      return `
        <div class="p-4 bg-white rounded-xl border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div class="space-y-1 flex-1">
            <div class="flex items-center gap-2 mb-1">
              <h4 class="text-sm font-bold text-gray-900">${v.judul_posisi}</h4>
              ${badge}
            </div>
            <p class="text-xs text-gray-500">${v.jenis_kesempatan} • ${v.bidang_keahlian || '-'} • ${v.lokasi} • Batas: ${v.batas_pendaftaran}</p>
            <p class="text-[11px] text-gray-400">Periode: ${v.periode_mulai || '-'} s.d. ${v.periode_selesai || '-'}</p>
            ${v.status_publikasi === 'ditolak' && v.catatan_revisi ? `
              <p class="text-xs text-red-600 bg-red-50 p-2 rounded-lg mt-2 font-medium">Catatan Revisi: ${v.catatan_revisi}</p>
            ` : ''}
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <span class="text-xs font-semibold text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 mr-1">
              Kuota: <strong>${v.kuota}</strong> orang
            </span>
            ${v.status_publikasi !== 'ditolak' ? `
              <button onclick="window.SIMAGA_MIN.openEditVacancyModal('${v.id_lowongan}')" 
                class="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors flex items-center gap-1.5" title="Edit Lowongan">
                <i data-lucide="edit-3" class="w-3.5 h-3.5"></i> Edit
              </button>
            ` : ''}
            <button onclick="window.SIMAGA_MIN.deleteVacancy('${v.id_lowongan}', '${(v.judul_posisi || '').replace(/'/g, "\\'")}')" 
              class="px-3 py-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors flex items-center gap-1.5" title="Hapus Lowongan">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i> Hapus
            </button>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  // Peninjauan Berkas Lamaran Pelamar Masuk (UC-02, PC-09)
  async function renderApplicantReviews() {
    const tableBody = document.getElementById('min-applicants-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="py-10 text-center text-gray-500">
          <i data-lucide="loader-2" class="w-6 h-6 mx-auto animate-spin mb-2 text-emerald-800"></i>
          Memuat berkas pelamar masuk...
        </td>
      </tr>
    `;
    if (window.lucide) window.lucide.createIcons();

    const profile = window.SIMAGA_AUTH.getProfile() || {};
    const id_mitra = profile.id_mitra || 'MTR-101';

    const res = await window.SIMAGA_API.getApplications({ id_mitra });
    const list = res.data || [];

    if (list.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" class="py-12 text-center text-gray-400">
            Belum ada pelamar pada lowongan instansi Anda.
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = list.map((app, index) => {
      const m = app.mahasiswa || {};
      const v = app.lowongan || {};

      let badge = '';
      if (app.status_seleksi === 'berkas_terkirim') {
        badge = '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">Pemeriksaan Berkas</span>';
      } else if (app.status_seleksi === 'wawancara') {
        badge = '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">Wawancara</span>';
      } else if (app.status_seleksi === 'diterima') {
        badge = '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">Diterima</span>';
      } else {
        badge = '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-700">Ditolak</span>';
      }

      return `
        <tr class="border-b border-gray-100 hover:bg-gray-50/50 text-xs transition-colors">
          <td class="p-3.5 font-medium text-gray-600">${index + 1}</td>
          <td class="p-3.5">
            <span class="font-bold text-gray-900 block">${m.nama_lengkap || '-'}</span>
            <span class="text-gray-500 font-mono text-[11px]">NIM: ${m.nim || '-'} • ${m.prodi || '-'}</span>
          </td>
          <td class="p-3.5">
            <span class="font-semibold text-gray-800">${v.judul_posisi || '-'}</span>
          </td>
          <td class="p-3.5">
            <div class="flex flex-col gap-1">
              ${app.berkas.map(b => `
                <a ${window.SIMAGA_UI.fileLinkAttrs(b.drive_url)} 
                  class="inline-flex items-center gap-1 text-[11px] text-emerald-800 hover:text-emerald-950 font-medium hover:underline">
                  <i data-lucide="external-link" class="w-3 h-3"></i> ${b.jenis_berkas}
                </a>
              `).join('')}
            </div>
          </td>
          <td class="p-3.5">${badge}</td>
          <td class="p-3.5 text-right">
            <button onclick="window.SIMAGA_MIN.openReviewModal('${app.id_pendaftaran}')" 
              class="px-3 py-1.5 bg-emerald-900 hover:bg-emerald-800 text-white rounded-lg font-semibold text-xs transition-colors">
              Ubah Status & Catatan
            </button>
          </td>
        </tr>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  // Buka Modal Seleksi Pelamar
  async function openReviewModal(id_pendaftaran) {
    const res = await window.SIMAGA_API.getApplications();
    const app = (res.data || []).find(a => a.id_pendaftaran === id_pendaftaran);
    if (!app) return;

    selectedApplicationForReview = app;
    const modal = document.getElementById('modal-review-applicant');
    const m = app.mahasiswa || {};
    const v = app.lowongan || {};

    document.getElementById('review-app-id').textContent = app.id_pendaftaran;
    document.getElementById('review-candidate-name').textContent = `${m.nama_lengkap} (NIM: ${m.nim})`;
    document.getElementById('review-position-name').textContent = v.judul_posisi || '-';
    document.getElementById('review-status-select').value = app.status_seleksi || 'pemeriksaan_berkas';
    document.getElementById('review-catatan').value = app.catatan_seleksi || '';

    // Render list berkas Drive
    const berkasContainer = document.getElementById('review-berkas-list');
    berkasContainer.innerHTML = app.berkas.map(b => `
      <a ${window.SIMAGA_UI.fileLinkAttrs(b.drive_url)} 
        class="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-200 rounded-xl hover:bg-emerald-50 hover:border-emerald-300 transition-colors">
        <div class="flex items-center gap-2">
          <i data-lucide="file-check" class="w-4 h-4 text-emerald-700"></i>
          <div>
            <p class="text-xs font-bold text-gray-800">${b.jenis_berkas} (${b.nama_file})</p>
            <p class="text-[10px] text-gray-500">${b.ukuran_kb} KB • Tersimpan di Google Drive</p>
          </div>
        </div>
        <span class="text-xs font-semibold text-emerald-800 flex items-center gap-1">
          Buka File <i data-lucide="arrow-up-right" class="w-3 h-3"></i>
        </span>
      </a>
    `).join('');

    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  // Simpan Pembaruan Tahap Seleksi (PC-09)
  async function saveSelectionUpdate() {
    if (!selectedApplicationForReview) return;

    const newStatus = document.getElementById('review-status-select')?.value;
    const catatan = document.getElementById('review-catatan')?.value;

    const res = await window.SIMAGA_API.updateSelectionStatus(
      selectedApplicationForReview.id_pendaftaran,
      newStatus,
      catatan
    );

    if (res.status === 'success') {
      alert('✅ Status seleksi pelamar berhasil diperbarui!\nNotifikasi otomatis telah dikirim ke pelamar.');
      document.getElementById('modal-review-applicant').classList.add('hidden');
      renderApplicantReviews();
    } else {
      alert(res.message || 'Gagal memperbarui status seleksi.');
    }
  }

  function openEditVacancyModal(id_lowongan) {
    const v = myVacanciesList.find(item => item.id_lowongan === id_lowongan);
    if (!v) {
      alert('Lowongan tidak ditemukan.');
      return;
    }

    if (v.status_publikasi === 'ditolak') {
      alert('Lowongan yang telah ditolak oleh admin tidak dapat diedit kembali.');
      return;
    }

    mountVacancyForms();
    const modal = document.getElementById('modal-edit-vacancy');
    document.getElementById('form-edit-vacancy')?.reset();
    clearVacancyErrors(PREFIX_EDIT);

    document.getElementById('edit-vac-id').value = v.id_lowongan;
    fillVacancyForm(PREFIX_EDIT, v);
    setDeadlineMin(PREFIX_EDIT);

    modal?.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  async function submitEditVacancy(e) {
    if (e) e.preventDefault();

    const id_lowongan = document.getElementById('edit-vac-id')?.value;
    // Validasi IDENTIK dengan form Publikasi Lowongan
    const check = RULES.validateVacancy(readVacancyForm(PREFIX_EDIT));
    if (!check.valid) {
      showVacancyErrors(PREFIX_EDIT, check.errors);
      return;
    }
    clearVacancyErrors(PREFIX_EDIT);

    const btn = document.getElementById('btn-submit-edit-vac');
    const origText = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin inline mr-1"></i> Menyimpan...`;
    }
    if (window.lucide) window.lucide.createIcons();

    try {
      const res = await window.SIMAGA_API.updateVacancy(id_lowongan, toPayload(check.data));
      if (res.status === 'success') {
        alert('✅ Lowongan berhasil diperbarui!');
        document.getElementById('modal-edit-vacancy')?.classList.add('hidden');
        renderPartnerVacancies();
      } else {
        if (res.errors) showVacancyErrors(PREFIX_EDIT, res.errors);
        alert(res.message || 'Gagal memperbarui lowongan.');
      }
    } catch (err) {
      alert('Terjadi kesalahan: ' + err.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = origText;
      }
      if (window.lucide) window.lucide.createIcons();
    }
  }

  async function deleteVacancy(id_lowongan, judul) {
    if (!confirm(`Apakah Anda yakin ingin menghapus lowongan "${judul}"?\n\nTindakan ini permanen dan lowongan akan dihapus dari sistem.`)) {
      return;
    }

    try {
      const res = await window.SIMAGA_API.deleteVacancy(id_lowongan);
      if (res.status === 'success') {
        alert(`🗑️ Lowongan "${judul}" berhasil dihapus.`);
        renderPartnerVacancies();
      } else {
        alert(res.message || 'Gagal menghapus lowongan.');
      }
    } catch (err) {
      alert('Terjadi kesalahan saat menghapus lowongan: ' + err.message);
    }
  }

  // Render kedua form segera (script dimuat di akhir <body>, DOM sudah tersedia)
  mountVacancyForms();
  initCreateVacancyForm();

  return {
    initCreateVacancyForm,
    resetCreateVacancyForm,
    onModeKerjaChange,
    validateVacancyDates,
    submitNewVacancy,
    renderPartnerVacancies,
    renderApplicantReviews,
    openReviewModal,
    saveSelectionUpdate,
    openEditVacancyModal,
    submitEditVacancy,
    deleteVacancy
  };
})();
