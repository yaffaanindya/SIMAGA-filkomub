/**
 * ==============================================================================
 * SIMAGA - MAHASISWA CONTROLLER (UC-03, UC-04, UC-05, UC-06)
 * ==============================================================================
 */

window.SIMAGA_MHS = (function() {
  let uploadedFiles = {
    cv: null,
    transkrip: null,
    rekomendasi: null
  };

  let selectedVacancy = null;

  // Load dan render katalog lowongan magang
  async function renderVacancies() {
    const container = document.getElementById('mhs-vacancies-container');
    if (!container) return;

    container.innerHTML = `
      <div class="col-span-full py-12 text-center text-gray-500">
        <i data-lucide="loader-2" class="w-8 h-8 mx-auto animate-spin mb-2 text-emerald-800"></i>
        <p>Memuat lowongan magang terverifikasi...</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();

    const keyword = document.getElementById('mhs-search-input')?.value || '';
    const jenis = document.getElementById('mhs-filter-jenis')?.value || 'all';
    const lokasi = document.getElementById('mhs-filter-lokasi')?.value || 'all';

    const res = await window.SIMAGA_API.getVacancies({ keyword, jenis, lokasi, status: 'aktif' });
    const list = res.data || [];

    if (list.length === 0) {
      container.innerHTML = `
        <div class="col-span-full py-16 text-center bg-white rounded-2xl border border-gray-200 p-8">
          <i data-lucide="search-x" class="w-12 h-12 mx-auto text-gray-400 mb-3"></i>
          <h4 class="text-lg font-bold text-gray-800">Lowongan tidak ditemukan</h4>
          <p class="text-sm text-gray-500 mt-1">Silakan sesuaikan kata kunci pencarian atau ubah filter Anda.</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    container.innerHTML = list.map(v => {
      const mitraName = v.mitra ? v.mitra.nama_perusahaan : 'Mitra Industri FILKOM';
      const isMagang = v.jenis_kesempatan === 'Magang Bersertifikat';
      const initials = (mitraName || 'UB').split(' ').map(w => w[0]).join('').substring(0, 3).toUpperCase();
      const logoColorClass = isMagang ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-blue-50 border-blue-200 text-blue-900';

      return `
        <div class="card-academic p-6 flex flex-col justify-between group">
          <div class="space-y-3">
            <div class="flex items-start justify-between gap-3">
              <div class="w-12 h-12 rounded-xl border flex items-center justify-center font-extrabold text-sm ${logoColorClass} flex-shrink-0">
                ${initials}
              </div>
              <div class="flex flex-col items-end gap-1">
                <span class="text-[10px] font-bold px-2.5 py-0.5 rounded-full ${isMagang ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-blue-100 text-blue-800 border border-blue-200'}">
                  ${v.jenis_kesempatan}
                </span>
                <span class="text-[11px] font-semibold text-gray-500 flex items-center gap-1">
                  <i data-lucide="map-pin" class="w-3 h-3 text-gray-400"></i> ${v.lokasi}
                </span>
              </div>
            </div>

            <div>
              <h3 class="text-base font-bold text-gray-900 group-hover:text-emerald-800 transition-colors leading-snug cursor-pointer"
                onclick="window.SIMAGA_MHS.openDetailModal('${v.id_lowongan}')">
                ${v.judul_posisi}
              </h3>
              <p class="text-xs font-semibold text-emerald-900 mt-0.5">${mitraName}</p>
            </div>

            <p class="text-xs text-gray-600 line-clamp-2 leading-relaxed">${v.deskripsi}</p>

            <div class="space-y-1 text-xs text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100">
              <div class="flex justify-between">
                <span>Kuota:</span>
                <span class="font-semibold text-gray-800">${v.kuota} mahasiswa</span>
              </div>
              <div class="flex justify-between">
                <span>Batas Akhir:</span>
                <span class="font-semibold text-amber-700 font-mono">${v.batas_pendaftaran}</span>
              </div>
            </div>
          </div>

          <div class="flex gap-2 pt-4 border-t border-gray-100 mt-4">
            <button onclick="window.SIMAGA_MHS.openDetailModal('${v.id_lowongan}')" 
              class="flex-1 py-2 px-3 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors text-center">
              Lihat Detail
            </button>
            <button onclick="window.SIMAGA_MHS.openApplyWireframe('${v.id_lowongan}')" 
              class="flex-1 py-2 px-3 text-xs font-bold text-white bg-brand-800 hover:bg-brand-900 rounded-xl transition-colors shadow-sm text-center">
              Daftar Magang
            </button>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  // Buka Modal Detail Lowongan
  async function openDetailModal(id_lowongan) {
    const res = await window.SIMAGA_API.getVacancies({ status: 'all' });
    const v = (res.data || []).find(item => item.id_lowongan === id_lowongan);
    if (!v) return;

    selectedVacancy = v;
    const modal = document.getElementById('modal-vacancy-detail');
    const content = document.getElementById('vacancy-detail-content');

    const mitraName = v.mitra ? v.mitra.nama_perusahaan : 'Mitra Industri FILKOM';
    content.innerHTML = `
      <div class="space-y-4">
        <div>
          <span class="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
            ${v.jenis_kesempatan}
          </span>
          <h2 class="text-2xl font-bold text-gray-900 mt-2">${v.judul_posisi}</h2>
          <p class="text-sm font-semibold text-emerald-800">${mitraName} • ${v.lokasi}</p>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200 text-xs">
          <div>
            <span class="text-gray-500 block">Periode Pelaksanaan:</span>
            <span class="font-semibold text-gray-800">${v.periode_mulai} s.d. ${v.periode_selesai}</span>
          </div>
          <div>
            <span class="text-gray-500 block">Kuota Diterima:</span>
            <span class="font-semibold text-gray-800">${v.kuota} Kandidat</span>
          </div>
          <div>
            <span class="text-gray-500 block">Batas Pendaftaran:</span>
            <span class="font-semibold text-amber-700">${v.batas_pendaftaran}</span>
          </div>
        </div>

        <div>
          <h4 class="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Deskripsi Tanggung Jawab:</h4>
          <p class="text-sm text-gray-700 leading-relaxed whitespace-pre-line">${v.deskripsi}</p>
        </div>

        <div>
          <h4 class="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Kualifikasi & Persyaratan:</h4>
          <p class="text-sm text-gray-700 leading-relaxed whitespace-pre-line">${v.kualifikasi}</p>
        </div>

        <div class="pt-4 border-t border-gray-200 flex justify-end gap-3">
          <button onclick="document.getElementById('modal-vacancy-detail').classList.add('hidden')" 
            class="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800">
            Tutup
          </button>
          <button onclick="window.SIMAGA_MHS.openApplyWireframe('${v.id_lowongan}')" 
            class="px-5 py-2 text-sm font-semibold text-white bg-emerald-900 hover:bg-emerald-800 rounded-xl shadow-sm">
            Melamar Posisi Ini
          </button>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  // Buka Modal Pendaftaran Magang dengan 3 Dropzone Berkas
  async function openApplyModal(id_lowongan) {
    // Tutup detail modal jika terbuka
    document.getElementById('modal-vacancy-detail')?.classList.add('hidden');

    const res = await window.SIMAGA_API.getVacancies({ status: 'all' });
    const v = (res.data || []).find(item => item.id_lowongan === id_lowongan);
    if (!v) return;

    selectedVacancy = v;
    uploadedFiles = { cv: null, transkrip: null, rekomendasi: null };

    const modal = document.getElementById('modal-apply-internship');
    document.getElementById('apply-vacancy-title').textContent = v.judul_posisi;
    document.getElementById('apply-vacancy-subtitle').textContent = `${v.mitra ? v.mitra.nama_perusahaan : 'Mitra FILKOM'} • Periode: ${v.periode_mulai} s.d ${v.periode_selesai}`;

    // Reset Dropzones
    ['cv', 'transkrip', 'rekomendasi'].forEach(type => {
      resetDropzoneUI(type);
    });

    const chk = document.getElementById('apply-confirm-checkbox');
    if (chk) chk.checked = false;

    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  function resetDropzoneUI(type) {
    const box = document.getElementById(`dropzone-${type}`);
    if (!box) return;
    box.className = 'dropzone-box p-4 text-center cursor-pointer border-2 border-dashed border-gray-300 rounded-xl hover:border-emerald-700 transition-colors';
    box.innerHTML = `
      <input type="file" id="file-${type}" accept=".pdf" class="hidden" onchange="window.SIMAGA_MHS.handleFileSelect(event, '${type}')">
      <div onclick="document.getElementById('file-${type}').click()">
        <i data-lucide="upload-cloud" class="w-6 h-6 mx-auto text-gray-400 mb-1"></i>
        <p class="text-xs font-semibold text-gray-700">Pilih Berkas PDF ${type.toUpperCase()}</p>
        <p class="text-[11px] text-gray-500 mt-0.5">Format .pdf, maks 5 MB</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  }

  // Validasi Berkas Client-Side (PC-03, UC-05)
  function handleFileSelect(event, type) {
    const file = event.target.files[0];
    if (!file) return;

    const box = document.getElementById(`dropzone-${type}`);

    // Cek format PDF
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      box.className = 'dropzone-box invalid p-4 text-center rounded-xl';
      box.innerHTML = `
        <i data-lucide="alert-circle" class="w-6 h-6 mx-auto text-red-500 mb-1"></i>
        <p class="text-xs font-bold text-red-600">Format berkas tidak didukung</p>
        <p class="text-[11px] text-red-500 mt-0.5">Wajib menggunakan dokumen berekstensi .pdf</p>
        <button type="button" onclick="window.SIMAGA_MHS.resetDropzone('${type}')" class="text-xs text-red-700 underline mt-2">Unggah Ulang</button>
      `;
      uploadedFiles[type] = null;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    // Cek ukuran <= 5 MB (5120 KB)
    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      box.className = 'dropzone-box invalid p-4 text-center rounded-xl';
      box.innerHTML = `
        <i data-lucide="alert-triangle" class="w-6 h-6 mx-auto text-red-500 mb-1"></i>
        <p class="text-xs font-bold text-red-600">Ukuran berkas melebihi batas</p>
        <p class="text-[11px] text-red-500 mt-0.5">Ukuran: ${(file.size / (1024 * 1024)).toFixed(1)} MB (Maksimal 5.0 MB)</p>
        <button type="button" onclick="window.SIMAGA_MHS.resetDropzone('${type}')" class="text-xs text-red-700 underline mt-2">Unggah Ulang</button>
      `;
      uploadedFiles[type] = null;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    // Berkas Valid! Centang Hijau (UI-03)
    const sizeKb = Math.round(file.size / 1024);
    uploadedFiles[type] = {
      fileObject: file,
      filename: file.name,
      size_kb: sizeKb
    };

    // Konversi ke base64 untuk direct Apps Script API
    const reader = new FileReader();
    reader.onload = function(e) {
      uploadedFiles[type].base64 = e.target.result;
    };
    reader.readAsDataURL(file);

    box.className = 'dropzone-box valid p-4 text-center rounded-xl';
    box.innerHTML = `
      <i data-lucide="check-circle-2" class="w-6 h-6 mx-auto text-emerald-600 mb-1"></i>
      <p class="text-xs font-bold text-emerald-800">${file.name}</p>
      <p class="text-[11px] text-emerald-600 mt-0.5">${sizeKb} KB • Siap diunggah ke Google Drive</p>
      <button type="button" onclick="window.SIMAGA_MHS.resetDropzone('${type}')" class="text-[11px] text-gray-500 underline mt-1">Ganti Berkas</button>
    `;
    if (window.lucide) window.lucide.createIcons();
  }

  function resetDropzone(type) {
    uploadedFiles[type] = null;
    resetDropzoneUI(type);
  }

  // Kirim Lamaran Magang & Simpan ke Google Drive (PC-03, UC-04)
  async function submitApplication() {
    const user = window.SIMAGA_AUTH.getUser();
    if (!user) {
      alert('Silakan masuk (login) terlebih dahulu.');
      return;
    }

    if (!selectedVacancy) return;

    // Validasi 3 file
    if (!uploadedFiles.cv || !uploadedFiles.transkrip || !uploadedFiles.rekomendasi) {
      alert('Wajib melengkapi ketiga berkas persyaratan: CV, Transkrip Nilai Akademik Terbaru, dan Surat Rekomendasi Fakultas (.pdf).');
      return;
    }

    // Validasi Checkbox
    const chk = document.getElementById('apply-confirm-checkbox');
    if (!chk || !chk.checked) {
      alert('Silakan centang konfirmasi bahwa rekapitulasi data dan berkas lamaran sudah diperiksa.');
      return;
    }

    const btn = document.getElementById('btn-submit-apply');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin mr-1.5 inline"></i> Mengunggah ke Google Drive...`;
    if (window.lucide) window.lucide.createIcons();

    try {
      const filesPayload = [
        { jenis: 'CV', filename: uploadedFiles.cv.filename, size_kb: uploadedFiles.cv.size_kb, base64: uploadedFiles.cv.base64, fileObject: uploadedFiles.cv.fileObject },
        { jenis: 'Transkrip', filename: uploadedFiles.transkrip.filename, size_kb: uploadedFiles.transkrip.size_kb, base64: uploadedFiles.transkrip.base64, fileObject: uploadedFiles.transkrip.fileObject },
        { jenis: 'Surat Rekomendasi', filename: uploadedFiles.rekomendasi.filename, size_kb: uploadedFiles.rekomendasi.size_kb, base64: uploadedFiles.rekomendasi.base64, fileObject: uploadedFiles.rekomendasi.fileObject }
      ];

      const res = await window.SIMAGA_API.submitApplication(selectedVacancy.id_lowongan, user.id_user, filesPayload);

      if (res.status === 'success') {
        document.getElementById('modal-apply-internship').classList.add('hidden');
        alert('🎉 Pendaftaran magang berhasil dikirim!\nBerkas tersimpan di folder Google Drive SIMAGA_Storage.');
        renderMyApplications();
      } else {
        alert(res.message || 'Gagal mengirim pendaftaran.');
      }
    } catch (err) {
      alert('Terjadi kesalahan saat pendaftaran: ' + err.message);
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  }

  // Riwayat Lamaran & Status Seleksi (UC-06)
  async function renderMyApplications() {
    const container = document.getElementById('mhs-applications-container');
    if (!container) return;

    const user = window.SIMAGA_AUTH.getUser();
    if (!user) return;

    container.innerHTML = `
      <div class="py-12 text-center text-gray-500">
        <i data-lucide="loader-2" class="w-6 h-6 mx-auto animate-spin mb-2 text-emerald-800"></i>
        <p>Memuat riwayat lamaran magang...</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();

    const res = await window.SIMAGA_API.getApplications({ id_user: user.id_user });
    const list = res.data || [];

    // Tampilkan notifikasi pembaruan sistem jika status telah berubah (Point 8)
    const alertBanner = document.getElementById('mhs-status-alert-banner');
    const alertText = document.getElementById('mhs-status-alert-text');
    if (alertBanner && alertText) {
      const activeUpdate = list.find(a => a.status_seleksi !== 'berkas_terkirim' || (a.catatan_seleksi && a.catatan_seleksi.trim().length > 0));
      if (activeUpdate) {
        const stageNames = {
          pemeriksaan_berkas: 'Pemeriksaan Berkas Administrasi Drive',
          wawancara: 'Tahap 2: Wawancara / Interview Penguji Mitra',
          diterima: 'Tahap Akhir: Selamat! Anda Diterima Magang Bersertifikat',
          ditolak: 'Tahap Akhir: Belum Berhasil Lolos Seleksi'
        };
        alertText.innerHTML = `
          Tahapan seleksi pendaftaran Anda pada lowongan <strong>${activeUpdate.lowongan?.judul_posisi || 'Magang'}</strong> telah diperbarui menjadi: 
          <span class="font-bold underline text-emerald-950">${stageNames[activeUpdate.status_seleksi] || activeUpdate.status_seleksi}</span>.
          <br><span class="text-xs text-emerald-800 mt-1 block">Catatan dari Mitra: "${activeUpdate.catatan_seleksi || 'Silakan persiapkan diri untuk tahapan berikutnya.'}"</span>
        `;
        alertBanner.classList.remove('hidden');
      } else {
        alertBanner.classList.add('hidden');
      }
    }

    if (list.length === 0) {
      container.innerHTML = `
        <div class="py-12 text-center bg-white rounded-2xl border border-gray-200 p-8">
          <i data-lucide="file-question" class="w-12 h-12 mx-auto text-gray-400 mb-2"></i>
          <h4 class="text-base font-bold text-gray-800">Belum Ada Lamaran yang Diajukan</h4>
          <p class="text-xs text-gray-500 mt-1 mb-4">Anda belum mengajukan lamaran magang pada lowongan mitra industri mana pun.</p>
          <button onclick="window.SIMAGA_ROUTER.navigateTo('mhs-lowongan')" 
            class="px-4 py-2 text-xs font-semibold text-white bg-emerald-900 rounded-xl hover:bg-emerald-800">
            Jelajahi Lowongan Magang
          </button>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    container.innerHTML = list.map(app => {
      const v = app.lowongan || {};
      const status = app.status_seleksi; // 'berkas_terkirim', 'wawancara', 'diterima', 'ditolak'

      // Stepper calculation
      const step1Active = true;
      const step2Active = status === 'wawancara' || status === 'diterima' || status === 'ditolak';
      const step3Active = status === 'diterima' || status === 'ditolak';
      const isAccepted = status === 'diterima';
      const isRejected = status === 'ditolak';

      return `
        <div class="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-4">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <div>
              <span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700">ID: ${app.id_pendaftaran}</span>
              <h3 class="text-lg font-bold text-gray-900 mt-1">${v.judul_posisi || 'Posisi Magang'}</h3>
              <p class="text-xs text-gray-500">${v.mitra ? v.mitra.nama_perusahaan : 'Mitra Industri'} • Dilamar pada: ${app.tanggal_daftar}</p>
            </div>
            <div>
              ${statusBadge(status)}
            </div>
          </div>

          <!-- Indikator Tahap Seleksi (Stepper UI-03 / UC-06) -->
          <div class="grid grid-cols-3 gap-2 my-5 text-center text-xs">
            <div class="p-2.5 rounded-xl border ${step1Active ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-gray-50 border-gray-200 text-gray-400'}">
              <span class="font-bold block mb-0.5">1. Seleksi Berkas</span>
              <span class="text-[10px] text-gray-500">Administrasi Drive</span>
            </div>
            <div class="p-2.5 rounded-xl border ${step2Active ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-gray-50 border-gray-200 text-gray-400'}">
              <span class="font-bold block mb-0.5">2. Wawancara</span>
              <span class="text-[10px] text-gray-500">Tes / Interview Mitra</span>
            </div>
            <div class="p-2.5 rounded-xl border ${isAccepted ? 'bg-emerald-100 border-emerald-500 text-emerald-900' : isRejected ? 'bg-red-50 border-red-300 text-red-900' : 'bg-gray-50 border-gray-200 text-gray-400'}">
              <span class="font-bold block mb-0.5">3. Keputusan Akhir</span>
              <span class="text-[10px] ${isAccepted ? 'text-emerald-700 font-bold' : isRejected ? 'text-red-700 font-bold' : 'text-gray-500'}">
                ${isAccepted ? 'Diterima' : isRejected ? 'Tidak Lolos' : 'Pengumuman'}
              </span>
            </div>
          </div>

          <!-- Catatan Seleksi dari Mitra -->
          <div class="bg-amber-50/70 border border-amber-200 p-3.5 rounded-xl text-xs mb-4">
            <span class="font-bold text-amber-900 block mb-1">Catatan dari Mitra Industri:</span>
            <p class="text-amber-800 leading-relaxed">${app.catatan_seleksi || 'Belum ada catatan tahapan seleksi lanjutan.'}</p>
          </div>

          <!-- Berkas Persyaratan Terlampir di Google Drive -->
          <div class="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-100 text-xs">
            <span class="text-gray-500 font-medium">Tautan Berkas Google Drive:</span>
            ${app.berkas.map(b => `
              <a href="${b.drive_url}" target="_blank" 
                class="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors">
                <i data-lucide="file-text" class="w-3.5 h-3.5 text-emerald-800"></i> ${b.jenis_berkas} (${b.nama_file})
              </a>
            `).join('')}
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  // Wireframe UI-03 Methods (Point 6)
  let wireframeFiles = { cv: null, transkrip: null, rekomendasi: null };
  let wireframeVacancy = null;

  async function openApplyWireframe(id_lowongan) {
    document.getElementById('modal-vacancy-detail')?.classList.add('hidden');
    document.getElementById('modal-apply-internship')?.classList.add('hidden');

    const res = await window.SIMAGA_API.getVacancies({ status: 'all' });
    const v = (res.data || []).find(item => item.id_lowongan === id_lowongan);
    if (!v) return;

    wireframeVacancy = v;
    selectedVacancy = v;
    wireframeFiles = { cv: null, transkrip: null, rekomendasi: null };

    const titleEl = document.getElementById('wireframe-apply-title');
    const subtitleEl = document.getElementById('wireframe-apply-subtitle');
    if (titleEl) titleEl.textContent = v.judul_posisi;
    if (subtitleEl) subtitleEl.textContent = `${v.mitra ? v.mitra.nama_perusahaan : 'Mitra Industri FILKOM'} • ${v.lokasi} • Periode: ${v.periode_mulai} s.d ${v.periode_selesai}`;

    ['cv', 'transkrip', 'rekomendasi'].forEach(t => {
      const nameEl = document.getElementById(`row-${t}-name`);
      const errEl = document.getElementById(`row-${t}-err`);
      const fileInput = document.getElementById(`wireframe-file-${t}`);
      if (nameEl) nameEl.innerHTML = 'Belum ada berkas dipilih';
      if (errEl) { errEl.classList.add('hidden'); errEl.textContent = ''; }
      if (fileInput) fileInput.value = '';
    });

    const chk = document.getElementById('wireframe-confirm-chk');
    if (chk) chk.checked = false;

    window.SIMAGA_ROUTER.navigateTo('mhs-daftar');
    if (window.lucide) window.lucide.createIcons();
  }

  function handleWireframeFile(event, type) {
    const file = event.target.files[0];
    if (!file) return;

    const nameEl = document.getElementById(`row-${type}-name`);
    const errEl = document.getElementById(`row-${type}-err`);

    // Validasi format file PDF
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      wireframeFiles[type] = null;
      if (nameEl) nameEl.innerHTML = `<span class="text-red-600 font-semibold">${file.name}</span>`;
      if (errEl) {
        errEl.textContent = 'Format berkas tidak didukung atau ukuran melebihi batas (maks 5 MB). Wajib PDF.';
        errEl.classList.remove('hidden');
      }
      return;
    }

    // Validasi ukuran <= 5 MB
    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      wireframeFiles[type] = null;
      if (nameEl) nameEl.innerHTML = `<span class="text-red-600 font-semibold">${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)</span>`;
      if (errEl) {
        errEl.textContent = 'Ukuran berkas melebihi batas maksimal 5 MB (5120 KB)!';
        errEl.classList.remove('hidden');
      }
      return;
    }

    // File Valid
    const sizeKb = Math.round(file.size / 1024);
    wireframeFiles[type] = {
      fileObject: file,
      filename: file.name,
      size_kb: sizeKb
    };

    const reader = new FileReader();
    reader.onload = function(e) {
      wireframeFiles[type].base64 = e.target.result;
    };
    reader.readAsDataURL(file);

    if (errEl) { errEl.classList.add('hidden'); errEl.textContent = ''; }
    if (nameEl) {
      nameEl.innerHTML = `
        <span class="inline-flex items-center gap-1.5 text-emerald-800 font-bold">
          <i data-lucide="check-circle" class="w-4 h-4 text-emerald-600 inline"></i> ${file.name} (${sizeKb} KB)
        </span>
      `;
    }
    if (window.lucide) window.lucide.createIcons();
  }

  async function submitWireframeApplication() {
    const user = window.SIMAGA_AUTH.getUser();
    if (!user) {
      alert('Silakan login terlebih dahulu untuk mengajukan pendaftaran magang.');
      window.SIMAGA_ROUTER.navigateTo('login');
      return;
    }

    if (!wireframeVacancy) {
      alert('Silakan pilih lowongan magang dari katalog.');
      window.SIMAGA_ROUTER.navigateTo('mhs-lowongan');
      return;
    }

    if (!wireframeFiles.cv || !wireframeFiles.transkrip || !wireframeFiles.rekomendasi) {
      alert('Mohon lengkapi ketiga berkas persyaratan: CV, Transkrip Nilai Akademik, dan Surat Rekomendasi Fakultas (.pdf maks 5 MB).');
      return;
    }

    const chk = document.getElementById('wireframe-confirm-chk');
    if (!chk || !chk.checked) {
      alert('Silakan centang persetujuan rekapitulasi data dan keabsahan berkas lamaran.');
      return;
    }

    const btn = document.getElementById('btn-wireframe-submit');
    const origText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin mr-1.5 inline"></i> Mengunggah ke Google Drive...`;
    if (window.lucide) window.lucide.createIcons();

    try {
      const filesPayload = [
        { jenis: 'CV', filename: wireframeFiles.cv.filename, size_kb: wireframeFiles.cv.size_kb, base64: wireframeFiles.cv.base64, fileObject: wireframeFiles.cv.fileObject },
        { jenis: 'Transkrip', filename: wireframeFiles.transkrip.filename, size_kb: wireframeFiles.transkrip.size_kb, base64: wireframeFiles.transkrip.base64, fileObject: wireframeFiles.transkrip.fileObject },
        { jenis: 'Surat Rekomendasi', filename: wireframeFiles.rekomendasi.filename, size_kb: wireframeFiles.rekomendasi.size_kb, base64: wireframeFiles.rekomendasi.base64, fileObject: wireframeFiles.rekomendasi.fileObject }
      ];

      const res = await window.SIMAGA_API.submitApplication(wireframeVacancy.id_lowongan, user.id_user, filesPayload);
      if (res.status === 'success') {
        alert('🎉 Lamaran berhasil dikirim. Status awal: Pemeriksaan Berkas.\nBerkas tersimpan aman di folder Google Drive SIMAGA_Storage.');
        window.SIMAGA_ROUTER.navigateTo('mhs-lamaran');
      } else {
        alert(res.message || 'Gagal mengirim pendaftaran.');
      }
    } catch (err) {
      alert('Terjadi kesalahan pendaftaran: ' + err.message);
    } finally {
      btn.disabled = false;
      btn.innerHTML = origText;
      if (window.lucide) window.lucide.createIcons();
    }
  }

  function statusBadge(status) {
    if (status === 'berkas_terkirim') {
      return `<span class="px-3 py-1 bg-blue-100 text-blue-800 border border-blue-200 rounded-full text-xs font-bold">Pemeriksaan Berkas</span>`;
    }
    if (status === 'wawancara') {
      return `<span class="px-3 py-1 bg-amber-100 text-amber-800 border border-amber-200 rounded-full text-xs font-bold">Tahap Wawancara</span>`;
    }
    if (status === 'diterima') {
      return `<span class="px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold">Diterima Magang</span>`;
    }
    return `<span class="px-3 py-1 bg-gray-100 text-gray-700 border border-gray-200 rounded-full text-xs font-bold">Tidak Lolos</span>`;
  }

  return {
    renderVacancies,
    openDetailModal,
    openApplyModal,
    openApplyWireframe,
    handleWireframeFile,
    submitWireframeApplication,
    handleFileSelect,
    resetDropzone,
    submitApplication,
    renderMyApplications
  };
})();
