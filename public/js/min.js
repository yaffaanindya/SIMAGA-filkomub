/**
 * ==============================================================================
 * SIMAGA - MITRA INDUSTRI CONTROLLER (UC-01, UC-02, PC-01, PC-09)
 * ==============================================================================
 */

window.SIMAGA_MIN = (function() {
  let selectedApplicationForReview = null;

  // Inisialisasi Form Publikasi Lowongan (UI-01)
  function initCreateVacancyForm() {
    const today = new Date().toISOString().split('T')[0];
    const deadlineInput = document.getElementById('min-deadline');
    const startInput = document.getElementById('min-periode-mulai');
    const endInput = document.getElementById('min-periode-selesai');

    if (deadlineInput) deadlineInput.min = today;
    if (startInput) startInput.min = today;
  }

  // Validasi Real-time Tanggal Lowongan (PC-01, UI-01)
  function validateVacancyDates() {
    const deadline = document.getElementById('min-deadline')?.value;
    const start = document.getElementById('min-periode-mulai')?.value;
    const end = document.getElementById('min-periode-selesai')?.value;
    const alertBox = document.getElementById('min-date-alert');

    if (!alertBox) return true;
    alertBox.classList.add('hidden');

    const todayStr = new Date().toISOString().split('T')[0];

    if (deadline && deadline <= todayStr) {
      alertBox.textContent = 'Peringatan: Tanggal tenggat pendaftaran harus lebih besar dari hari ini.';
      alertBox.classList.remove('hidden');
      return false;
    }

    if (start && end && end < start) {
      alertBox.textContent = 'Peringatan: Periode selesai harus lebih besar atau sama dengan periode mulai pelaksanaan.';
      alertBox.classList.remove('hidden');
      return false;
    }

    return true;
  }

  // Ajukan Lowongan Baru (PC-01, UC-01)
  async function submitNewVacancy() {
    if (!validateVacancyDates()) {
      alert('Mohon perbaiki tanggal pendaftaran atau periode pelaksanaan sesuai ketentuan.');
      return;
    }

    const judul_posisi = document.getElementById('min-posisi')?.value;
    const jenis_kesempatan = document.getElementById('min-jenis')?.value;
    const deskripsi = document.getElementById('min-deskripsi')?.value;
    const kualifikasi = document.getElementById('min-kualifikasi')?.value;
    const mode_kerja = document.getElementById('min-mode-kerja')?.value;
    const kota = document.getElementById('min-kota')?.value;
    const lokasi = `${mode_kerja} (${kota || 'Seluruh Indonesia'})`;
    const periode_mulai = document.getElementById('min-periode-mulai')?.value;
    const periode_selesai = document.getElementById('min-periode-selesai')?.value;
    const kuota = document.getElementById('min-kuota')?.value;
    const batas_pendaftaran = document.getElementById('min-deadline')?.value;

    if (!judul_posisi || !deskripsi || !kualifikasi || !periode_mulai || !periode_selesai || !batas_pendaftaran) {
      alert('Semua bidang formulir wajib diisi.');
      return;
    }

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
        judul_posisi,
        jenis_kesempatan,
        deskripsi,
        kualifikasi,
        lokasi,
        periode_mulai,
        periode_selesai,
        kuota: Number(kuota) || 1,
        batas_pendaftaran
      });

      if (res.status === 'success') {
        alert('🎉 Pengajuan lowongan berhasil dikirim!\nStatus: Menunggu Kurasi & Persetujuan Admin Career & Internship FILKOM UB.');
        // Reset Form
        document.getElementById('form-create-vacancy')?.reset();
        renderPartnerVacancies();
        window.SIMAGA_ROUTER.navigateTo('min-lowongan-saya');
      } else {
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
            <p class="text-xs text-gray-500">${v.jenis_kesempatan} • ${v.lokasi} • Batas: ${v.batas_pendaftaran}</p>
            ${v.status_publikasi === 'ditolak' && v.catatan_revisi ? `
              <p class="text-xs text-red-600 bg-red-50 p-2 rounded-lg mt-2 font-medium">Catatan Revisi: ${v.catatan_revisi}</p>
            ` : ''}
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <span class="text-xs font-semibold text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 mr-1">
              Kuota: <strong>${v.kuota}</strong> orang
            </span>
            <button onclick="window.SIMAGA_MIN.openEditVacancyModal('${v.id_lowongan}')" 
              class="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors flex items-center gap-1.5" title="Edit Lowongan">
              <i data-lucide="edit-3" class="w-3.5 h-3.5"></i> Edit
            </button>
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
            Belum ada mahasiswa yang melamar pada lowongan instansi Anda.
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
                <a href="${b.drive_url}" target="_blank" 
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
      <a href="${b.drive_url}" target="_blank" 
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

    const modal = document.getElementById('modal-edit-vacancy');
    const form = document.getElementById('form-edit-vacancy');
    if (form) form.reset();

    document.getElementById('edit-vac-id').value = v.id_lowongan;
    document.getElementById('edit-vac-judul').value = v.judul_posisi || '';
    document.getElementById('edit-vac-jenis').value = v.jenis_kesempatan || 'Magang Bersertifikat';
    document.getElementById('edit-vac-deskripsi').value = v.deskripsi || '';
    document.getElementById('edit-vac-kualifikasi').value = v.kualifikasi || '';
    document.getElementById('edit-vac-lokasi').value = v.lokasi || '';
    document.getElementById('edit-vac-mulai').value = v.periode_mulai || '';
    document.getElementById('edit-vac-selesai').value = v.periode_selesai || '';
    document.getElementById('edit-vac-kuota').value = v.kuota || 1;
    document.getElementById('edit-vac-deadline').value = v.batas_pendaftaran || '';

    modal?.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  async function submitEditVacancy(e) {
    if (e) e.preventDefault();

    const id_lowongan = document.getElementById('edit-vac-id')?.value;
    const judul_posisi = document.getElementById('edit-vac-judul')?.value?.trim();
    const jenis_kesempatan = document.getElementById('edit-vac-jenis')?.value;
    const deskripsi = document.getElementById('edit-vac-deskripsi')?.value?.trim();
    const kualifikasi = document.getElementById('edit-vac-kualifikasi')?.value?.trim();
    const lokasi = document.getElementById('edit-vac-lokasi')?.value?.trim();
    const periode_mulai = document.getElementById('edit-vac-mulai')?.value;
    const periode_selesai = document.getElementById('edit-vac-selesai')?.value;
    const kuota = Number(document.getElementById('edit-vac-kuota')?.value) || 1;
    const batas_pendaftaran = document.getElementById('edit-vac-deadline')?.value;

    if (!judul_posisi || !deskripsi || !kualifikasi || !lokasi || !batas_pendaftaran) {
      alert('Mohon lengkapi seluruh kolom formulir.');
      return;
    }

    const payload = {
      judul_posisi,
      jenis_kesempatan,
      deskripsi,
      kualifikasi,
      lokasi,
      periode_mulai,
      periode_selesai,
      kuota,
      batas_pendaftaran
    };

    const btn = document.getElementById('btn-submit-edit-vac');
    const origText = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin inline mr-1"></i> Menyimpan...`;
    }
    if (window.lucide) window.lucide.createIcons();

    try {
      const res = await window.SIMAGA_API.updateVacancy(id_lowongan, payload);
      if (res.status === 'success') {
        alert('✅ Lowongan berhasil diperbarui!');
        document.getElementById('modal-edit-vacancy')?.classList.add('hidden');
        renderPartnerVacancies();
      } else {
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

  return {
    initCreateVacancyForm,
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
