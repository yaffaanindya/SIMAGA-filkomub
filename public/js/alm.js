/**
 * ==============================================================================
 * SIMAGA - ALUMNI CONTROLLER (UC-07, UC-08, UC-09, UC-10)
 * ==============================================================================
 */

window.SIMAGA_ALM = (function() {
  let currentStep = 1;
  let activeTracerRecord = null;

  // Render Lowongan Pekerjaan Khusus Alumni (UC-10)
  async function renderJobs() {
    const container = document.getElementById('alm-jobs-container');
    if (!container) return;

    container.innerHTML = `
      <div class="col-span-full py-12 text-center text-gray-500">
        <i data-lucide="loader-2" class="w-8 h-8 mx-auto animate-spin mb-2 text-emerald-800"></i>
        <p>Memuat lowongan pekerjaan terkurasi...</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();

    const keyword = (document.getElementById('alm-search-input')?.value || '').toLowerCase();
    const bidang = document.getElementById('alm-filter-bidang')?.value || 'all';
    const lokasi = document.getElementById('alm-filter-lokasi')?.value || 'all';

    const res = await window.SIMAGA_API.getVacancies({ jenis: 'Pekerjaan', status: 'aktif' });
    let list = res.data || [];

    if (bidang !== 'all') {
      list = list.filter(v => v.bidang === bidang);
    }
    if (lokasi !== 'all') {
      list = list.filter(v => v.lokasi.toLowerCase().includes(lokasi.toLowerCase()));
    }
    if (keyword.trim()) {
      list = list.filter(v => 
        v.judul_posisi.toLowerCase().includes(keyword) ||
        v.deskripsi.toLowerCase().includes(keyword) ||
        v.kualifikasi.toLowerCase().includes(keyword) ||
        (v.mitra && v.mitra.nama_perusahaan.toLowerCase().includes(keyword))
      );
    }

    if (list.length === 0) {
      container.innerHTML = `
        <div class="col-span-full py-16 text-center bg-white rounded-2xl border border-gray-200 p-8 shadow-xs">
          <i data-lucide="briefcase" class="w-12 h-12 mx-auto text-gray-400 mb-3"></i>
          <h4 class="text-base font-bold text-gray-800">Tidak ada lowongan pekerjaan ditemukan</h4>
          <p class="text-xs text-gray-500 mt-1">Silakan sesuaikan kata kunci atau filter pencarian Anda.</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    container.innerHTML = list.map(v => {
      const mitraName = v.mitra ? v.mitra.nama_perusahaan : 'Mitra Industri FILKOM';
      const initials = (mitraName || 'UB').split(' ').map(w => w[0]).join('').substring(0, 3).toUpperCase();

      return `
        <div class="card-academic p-6 flex flex-col justify-between group">
          <div class="space-y-3">
            <div class="flex items-start justify-between gap-3">
              <div class="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center font-extrabold text-sm text-blue-900 flex-shrink-0">
                ${initials}
              </div>
              <div class="flex flex-col items-end gap-1">
                <span class="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  Pekerjaan Penuh Waktu
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
                <span>Bidang:</span>
                <span class="font-semibold text-gray-800">${v.bidang || 'Teknologi Informasi'}</span>
              </div>
              <div class="flex justify-between">
                <span>Kuota Diterima:</span>
                <span class="font-semibold text-gray-800">${v.kuota} Kandidat</span>
              </div>
              <div class="flex justify-between">
                <span>Batas Lamaran:</span>
                <span class="font-semibold text-amber-700 font-mono">${v.batas_pendaftaran}</span>
              </div>
            </div>
          </div>

          <div class="flex gap-2 pt-4 border-t border-gray-100 mt-4">
            <button onclick="window.SIMAGA_MHS.openDetailModal('${v.id_lowongan}')" 
              class="flex-1 py-2 px-3 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors text-center">
              Lihat Detail
            </button>
            <button onclick="window.SIMAGA_ALM.openApplyJobModal('${v.id_lowongan}')" 
              class="flex-1 py-2 px-3 text-xs font-bold text-white bg-brand-800 hover:bg-brand-900 rounded-xl transition-colors shadow-sm text-center">
              Lamar Posisi
            </button>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  // Inisialisasi Modul Tracer Study (UI-04)
  async function initTracerStudy() {
    const user = window.SIMAGA_AUTH.getUser();
    const profile = window.SIMAGA_AUTH.getProfile() || {};
    if (!user) return;

    // Sinkronisasi data identitas alumni (read-only)
    const nim = profile.nim || '215150400111001';
    document.getElementById('ts-readonly-nama').value = user.nama_lengkap || 'Alumni FILKOM UB';
    document.getElementById('ts-readonly-nim').value = nim;
    document.getElementById('ts-readonly-prodi').value = profile.prodi || 'Sistem Informasi';
    document.getElementById('ts-readonly-tahun').value = profile.tahun_lulus || '2025';

    // Cek apakah sudah pernah mengisi / ada draf tersimpan
    const res = await window.SIMAGA_API.getTracer(nim);
    activeTracerRecord = res.data;

    if (activeTracerRecord && !activeTracerRecord.is_draft) {
      // Alumni sudah selesai mengisi! Tampilkan Panel Bukti Pengisian (UC-09)
      showProofPanel(activeTracerRecord);
    } else {
      document.getElementById('tracer-form-container').classList.remove('hidden');
      document.getElementById('tracer-proof-panel').classList.add('hidden');

      // Jika ada draf tersimpan, isi form otomatis
      if (activeTracerRecord && activeTracerRecord.is_draft) {
        populateDraftData(activeTracerRecord);
      }
    }
  }

  function setStep(step) {
    currentStep = step;
    [1, 2, 3].forEach(s => {
      const stepElem = document.getElementById(`tracer-step-${s}`);
      const navItem = document.getElementById(`nav-step-${s}`);
      if (s === step) {
        stepElem?.classList.remove('hidden');
        navItem?.classList.add('active');
      } else {
        stepElem?.classList.add('hidden');
        navItem?.classList.remove('active');
        if (s < step) navItem?.classList.add('completed');
      }
    });
  }

  // Menyesuaikan pertanyaan lanjutan berdasarkan radio status karier
  function onCareerStatusChange() {
    const status = document.querySelector('input[name="ts-status-karir"]:checked')?.value;
    const dynamicContainer = document.getElementById('ts-dynamic-questions');
    if (!dynamicContainer || !status) return;

    dynamicContainer.classList.remove('hidden');

    if (status === 'Bekerja') {
      dynamicContainer.innerHTML = `
        <div class="space-y-4 bg-emerald-50/50 p-5 rounded-2xl border border-emerald-200">
          <h4 class="text-sm font-bold text-emerald-950 flex items-center gap-2">
            <i data-lucide="briefcase" class="w-4 h-4 text-emerald-700"></i> Pertanyaan Lanjutan: Profil Pekerjaan
          </h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Nama Instansi / Perusahaan *</label>
              <input type="text" id="ts-instansi" class="w-full text-xs p-2.5 border border-gray-300 rounded-xl bg-white" placeholder="Contoh: PT GoTo Gojek Tokopedia Tbk">
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Posisi / Jabatan Pekerjaan *</label>
              <input type="text" id="ts-posisi" class="w-full text-xs p-2.5 border border-gray-300 rounded-xl bg-white" placeholder="Contoh: Software Engineer / UI Designer">
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Rentang Pendapatan Bulanan *</label>
              <select id="ts-gaji" class="w-full text-xs p-2.5 border border-gray-300 rounded-xl bg-white">
                <option value="">-- Pilih Rentang Pendapatan --</option>
                <option value="<4jt">&lt; Rp 4.000.000 (Dibawah UMR)</option>
                <option value="4-8jt">Rp 4.000.000 - Rp 8.000.000 (Standar Industri)</option>
                <option value="8-15jt">Rp 8.000.000 - Rp 15.000.000 (Sangat Layak)</option>
                <option value="15-30jt">Rp 15.000.000 - Rp 30.000.000 (Kompetitif)</option>
                <option value=">50jt">&gt; Rp 50.000.000 (Perlu Verifikasi Validitas)</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Nominal Gaji Pokok (Rupiah) *</label>
              <input type="number" id="ts-gaji-nominal" class="w-full text-xs p-2.5 border border-gray-300 rounded-xl bg-white" placeholder="Contoh: 9500000">
              <span class="text-[10px] text-gray-500">*Digunakan untuk pendeteksian anomali data otomatis</span>
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Masa Tunggu Mendapat Kerja Pertama (Bulan) *</label>
              <input type="number" id="ts-masa-tunggu" min="0" max="60" class="w-full text-xs p-2.5 border border-gray-300 rounded-xl bg-white" placeholder="Contoh: 2">
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Tingkat Tempat Kerja *</label>
              <select id="ts-tingkat-kerja" class="w-full text-xs p-2.5 border border-gray-300 rounded-xl bg-white">
                <option value="Lokal / Wilayah">Lokal / Wilayah</option>
                <option value="Nasional">Nasional</option>
                <option value="Multinasional / Internasional">Multinasional / Internasional</option>
              </select>
            </div>
          </div>
        </div>
      `;
    } else if (status === 'Wirausaha') {
      dynamicContainer.innerHTML = `
        <div class="space-y-4 bg-amber-50/50 p-5 rounded-2xl border border-amber-200">
          <h4 class="text-sm font-bold text-amber-950 flex items-center gap-2">
            <i data-lucide="store" class="w-4 h-4 text-amber-700"></i> Pertanyaan Lanjutan: Profil Wirausaha / Startup
          </h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Nama Usaha / Startup *</label>
              <input type="text" id="ts-instansi" class="w-full text-xs p-2.5 border border-gray-300 rounded-xl bg-white" placeholder="Contoh: Brawijaya Tech Solution">
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Bidang Usaha *</label>
              <input type="text" id="ts-posisi" class="w-full text-xs p-2.5 border border-gray-300 rounded-xl bg-white" placeholder="Contoh: Software House & IT Consultant">
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Omset Rata-rata Bulanan *</label>
              <select id="ts-gaji" class="w-full text-xs p-2.5 border border-gray-300 rounded-xl bg-white">
                <option value="<5jt">&lt; Rp 5.000.000</option>
                <option value="5-15jt">Rp 5.000.000 - Rp 15.000.000</option>
                <option value="15-50jt">Rp 15.000.000 - Rp 50.000.000</option>
                <option value=">50jt">&gt; Rp 50.000.000</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Jumlah Karyawan / Rekan Kerja</label>
              <input type="number" id="ts-masa-tunggu" min="0" class="w-full text-xs p-2.5 border border-gray-300 rounded-xl bg-white" placeholder="Contoh: 3">
            </div>
          </div>
        </div>
      `;
    } else if (status === 'Melanjutkan Studi') {
      dynamicContainer.innerHTML = `
        <div class="space-y-4 bg-purple-50/50 p-5 rounded-2xl border border-purple-200">
          <h4 class="text-sm font-bold text-purple-950 flex items-center gap-2">
            <i data-lucide="graduation-cap" class="w-4 h-4 text-purple-700"></i> Pertanyaan Lanjutan: Studi Lanjut (Pascasarjana)
          </h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Perguruan Tinggi Tujuan *</label>
              <input type="text" id="ts-instansi" class="w-full text-xs p-2.5 border border-gray-300 rounded-xl bg-white" placeholder="Contoh: Universitas Brawijaya / ITB / NUS">
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Program Studi & Jenjang *</label>
              <input type="text" id="ts-posisi" class="w-full text-xs p-2.5 border border-gray-300 rounded-xl bg-white" placeholder="Contoh: Magister Ilmu Komputer (S2)">
            </div>
            <div class="sm:col-span-2">
              <label class="block text-xs font-semibold text-gray-700 mb-1">Sumber Pendanaan Studi *</label>
              <select id="ts-gaji" class="w-full text-xs p-2.5 border border-gray-300 rounded-xl bg-white">
                <option value="Beasiswa LPDP">Beasiswa LPDP Republik Indonesia</option>
                <option value="Beasiswa Dikti / Kampus">Beasiswa Kementerian / Institusi Kampus</option>
                <option value="Biaya Mandiri">Biaya Mandiri / Keluarga</option>
              </select>
            </div>
          </div>
        </div>
      `;
    } else {
      dynamicContainer.innerHTML = `
        <div class="space-y-4 bg-gray-50 p-5 rounded-2xl border border-gray-200">
          <h4 class="text-sm font-bold text-gray-800 flex items-center gap-2">
            <i data-lucide="compass" class="w-4 h-4 text-gray-600"></i> Pertanyaan Lanjutan: Transisi Pencarian Karier
          </h4>
          <div class="space-y-3">
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Berapa bulan Anda telah aktif melamar pekerjaan?</label>
              <input type="number" id="ts-masa-tunggu" min="0" class="w-full text-xs p-2.5 border border-gray-300 rounded-xl bg-white" placeholder="Contoh: 1">
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Kendala utama yang dihadapi:</label>
              <textarea id="ts-instansi" rows="2" class="w-full text-xs p-2.5 border border-gray-300 rounded-xl bg-white" placeholder="Tuliskan kendala dalam mencari peluang yang relevan..."></textarea>
            </div>
          </div>
        </div>
      `;
    }

    if (window.lucide) window.lucide.createIcons();
  }

  // Mengisi draf isian yang tersimpan
  function populateDraftData(record) {
    if (!record) return;
    if (record.status_karir) {
      const radio = document.querySelector(`input[name="ts-status-karir"][value="${record.status_karir}"]`);
      if (radio) {
        radio.checked = true;
        onCareerStatusChange();
      }
    }

    let j = {};
    try { j = JSON.parse(record.data_jawaban); } catch(e){}

    setTimeout(() => {
      if (document.getElementById('ts-instansi')) document.getElementById('ts-instansi').value = j.instansi || '';
      if (document.getElementById('ts-posisi')) document.getElementById('ts-posisi').value = j.posisi || '';
      if (document.getElementById('ts-gaji')) document.getElementById('ts-gaji').value = j.gaji || '';
      if (document.getElementById('ts-gaji-nominal')) document.getElementById('ts-gaji-nominal').value = j.gaji_nominal || '';
      if (document.getElementById('ts-masa-tunggu')) document.getElementById('ts-masa-tunggu').value = j.masa_tunggu !== undefined ? j.masa_tunggu : '';
      if (document.getElementById('ts-saran')) document.getElementById('ts-saran').value = j.relevansi_kurikulum || '';
    }, 100);
  }

  // Kumpulkan Data Form
  function gatherFormData() {
    const status_karir = document.querySelector('input[name="ts-status-karir"]:checked')?.value || '';
    const instansi = document.getElementById('ts-instansi')?.value || '';
    const posisi = document.getElementById('ts-posisi')?.value || '';
    const gaji = document.getElementById('ts-gaji')?.value || '';
    const gaji_nominal = document.getElementById('ts-gaji-nominal')?.value || '';
    const masa_tunggu = document.getElementById('ts-masa-tunggu')?.value || '';
    const tingkat_tempat_kerja = document.getElementById('ts-tingkat-kerja')?.value || '';
    const relevansiRadio = document.querySelector('input[name="ts-relevansi"]:checked')?.value || '5';
    const saran = document.getElementById('ts-saran')?.value || '';

    return {
      status_karir,
      data_jawaban: {
        instansi,
        posisi,
        gaji,
        gaji_nominal,
        masa_tunggu,
        tingkat_tempat_kerja,
        keselarasan: Number(relevansiRadio),
        relevansi_kurikulum: saran
      }
    };
  }

  // Simpan Draf Kuesioner (PC-04, UC-08)
  async function saveDraft() {
    const profile = window.SIMAGA_AUTH.getProfile() || {};
    const nim = profile.nim || '215150400111001';
    const form = gatherFormData();

    const res = await window.SIMAGA_API.saveTracerDraft(nim, form.status_karir, form.data_jawaban);
    if (res.status === 'success') {
      alert('💾 Draf isian berhasil disimpan secara aman.\nAnda dapat melanjutkan pengisian kuesioner kapan saja.');
    } else {
      alert(res.message || 'Gagal menyimpan draf.');
    }
  }

  // Kirim Kuesioner Final (PC-05, UC-07)
  async function submitSurvey() {
    const profile = window.SIMAGA_AUTH.getProfile() || {};
    const nim = profile.nim || '215150400111001';
    const form = gatherFormData();

    // Validasi Kolom Wajib
    if (!form.status_karir) {
      alert('Silakan pilih salah satu opsi pada pertanyaan status karier saat ini.');
      setStep(2);
      return;
    }

    if (form.status_karir === 'Bekerja') {
      if (!form.data_jawaban.instansi || !form.data_jawaban.posisi || !form.data_jawaban.gaji) {
        alert('Mohon lengkapi seluruh pertanyaan wajib profil pekerjaan Anda.');
        setStep(2);
        return;
      }
    }

    const btn = document.getElementById('btn-submit-tracer');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin mr-1.5 inline"></i> Memvalidasi & Mengirim Data...`;
    if (window.lucide) window.lucide.createIcons();

    try {
      const res = await window.SIMAGA_API.submitTracer(nim, form.status_karir, form.data_jawaban);

      if (res.status === 'success') {
        alert('🎉 Selamat! Kuesioner Tracer Study Anda berhasil diserahkan secara permanen.\nNomor Referensi Anda: ' + res.data.nomor_referensi);
        activeTracerRecord = res.data;
        showProofPanel(res.data);
      } else {
        alert(res.message || 'Gagal mengirim kuesioner.');
      }
    } catch (err) {
      alert('Terjadi kendala saat mengirim: ' + err.message);
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  }

  // Menampilkan Panel Bukti Pengisian Ber-QR Code (UI-04 / UC-09)
  function showProofPanel(record) {
    document.getElementById('tracer-form-container').classList.add('hidden');
    const panel = document.getElementById('tracer-proof-panel');
    panel.classList.remove('hidden');

    const user = window.SIMAGA_AUTH.getUser();
    const profile = window.SIMAGA_AUTH.getProfile() || {};

    const refNumber = record.nomor_referensi || 'SIMAGA/TS/2026/0001';
    document.getElementById('proof-ref-number').textContent = refNumber;
    document.getElementById('proof-nama').textContent = user.nama_lengkap || '-';
    document.getElementById('proof-nim').textContent = profile.nim || '-';
    document.getElementById('proof-prodi').textContent = profile.prodi || 'Sistem Informasi';
    document.getElementById('proof-tanggal').textContent = record.tanggal_submit || new Date().toLocaleString('id-ID');
    document.getElementById('proof-status-karir').textContent = record.status_karir || 'Bekerja';

    // Render Canvas QR Code
    const qrContainer = document.getElementById('proof-qr-canvas');
    if (qrContainer && window.QRious) {
      new QRious({
        element: qrContainer,
        value: JSON.stringify({
          ref: refNumber,
          nim: profile.nim,
          nama: user.nama_lengkap,
          status: 'TERVERIFIKASI_FILKOM_UB'
        }),
        size: 160,
        level: 'H',
        foreground: '#143E35'
      });
    }

    if (window.lucide) window.lucide.createIcons();
  }

  // Download PDF Tanda Terima (UC-09, PC-06)
  function downloadProofPDF() {
    const user = window.SIMAGA_AUTH.getUser() || {};
    const profile = window.SIMAGA_AUTH.getProfile() || {};
    const record = activeTracerRecord || {
      nomor_referensi: document.getElementById('proof-ref-number')?.textContent || 'SIMAGA/TS/2026/0001',
      tanggal_submit: document.getElementById('proof-tanggal')?.textContent || new Date().toLocaleString('id-ID'),
      status_karir: document.getElementById('proof-status-karir')?.textContent || 'Bekerja',
      status_validasi: 'tervalidasi',
      periode_survei: 2026
    };

    const alumniData = {
      nim: profile.nim || '215150400111001',
      nama_lengkap: user.nama_lengkap || 'Yaffa Anindya Oktaviani',
      prodi: profile.prodi || 'Sistem Informasi',
      tahun_lulus: profile.tahun_lulus || 2025
    };

    window.SIMAGA_PDF.downloadTracerProof(record, alumniData);
  }

  // Modul Lamaran Kerja Alumni (Point 7 & Berkas Mandiri)
  let selectedJob = null;
  let almJobFiles = { cv: null, transkrip: null, portofolio: null, tambahan: null };

  function handleAlmJobFile(event, type) {
    const file = event.target.files[0];
    if (!file) return;

    const nameEl = document.getElementById(`alm-row-${type}-name`);
    const errEl = document.getElementById(`alm-row-${type}-err`);

    // Validasi format file PDF
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      almJobFiles[type] = null;
      if (nameEl) nameEl.innerHTML = `<span class="text-red-600 font-semibold">${file.name}</span>`;
      if (errEl) {
        errEl.textContent = 'Format berkas tidak didukung. Wajib format PDF (.pdf).';
        errEl.classList.remove('hidden');
      }
      return;
    }

    // Validasi ukuran <= 5 MB
    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      almJobFiles[type] = null;
      if (nameEl) nameEl.innerHTML = `<span class="text-red-600 font-semibold">${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)</span>`;
      if (errEl) {
        errEl.textContent = 'Ukuran berkas melebihi batas maksimal 5 MB (5120 KB)!';
        errEl.classList.remove('hidden');
      }
      return;
    }

    // File valid
    const sizeKb = Math.round(file.size / 1024);
    almJobFiles[type] = {
      fileObject: file,
      filename: file.name,
      size_kb: sizeKb
    };

    if (errEl) {
      errEl.classList.add('hidden');
      errEl.textContent = '';
    }
    if (nameEl) {
      nameEl.innerHTML = `
        <span class="text-emerald-700 font-bold flex items-center gap-1.5">
          <i data-lucide="check-circle-2" class="w-3.5 h-3.5 text-emerald-600"></i> ${file.name} (${sizeKb} KB)
        </span>
      `;
    }
    if (window.lucide) window.lucide.createIcons();
  }

  async function openApplyJobModal(id_lowongan) {
    const res = await window.SIMAGA_API.getVacancies({ status: 'all' });
    const v = (res.data || []).find(item => item.id_lowongan === id_lowongan);
    if (!v) return;

    selectedJob = v;
    almJobFiles = { cv: null, transkrip: null, portofolio: null, tambahan: null };

    const modal = document.getElementById('modal-apply-job');
    const titleEl = document.getElementById('apply-job-title');
    const subtitleEl = document.getElementById('apply-job-subtitle');
    const notesEl = document.getElementById('apply-job-notes');

    if (titleEl) titleEl.textContent = v.judul_posisi;
    if (subtitleEl) subtitleEl.textContent = `${v.mitra ? v.mitra.nama_perusahaan : 'Mitra Industri FILKOM'} • ${v.lokasi} • Batas: ${v.batas_pendaftaran}`;
    if (notesEl) notesEl.value = '';

    // Reset status tampilan baris berkas
    ['cv', 'transkrip'].forEach(t => {
      const nameEl = document.getElementById(`alm-row-${t}-name`);
      const errEl = document.getElementById(`alm-row-${t}-err`);
      const inputEl = document.getElementById(`alm-file-${t}`);
      if (nameEl) nameEl.innerHTML = 'Belum ada berkas dipilih';
      if (errEl) { errEl.classList.add('hidden'); errEl.textContent = ''; }
      if (inputEl) inputEl.value = '';
    });
    ['portofolio', 'tambahan'].forEach(t => {
      const nameEl = document.getElementById(`alm-row-${t}-name`);
      const errEl = document.getElementById(`alm-row-${t}-err`);
      const inputEl = document.getElementById(`alm-file-${t}`);
      if (nameEl) nameEl.innerHTML = 'Belum ada berkas dipilih (Opsional)';
      if (errEl) { errEl.classList.add('hidden'); errEl.textContent = ''; }
      if (inputEl) inputEl.value = '';
    });

    const chk = document.getElementById('alm-confirm-chk');
    if (chk) chk.checked = false;

    modal?.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  async function submitJobApplication() {
    const user = window.SIMAGA_AUTH.getUser();
    if (!user) {
      alert('Silakan masuk (login) terlebih dahulu.');
      window.SIMAGA_ROUTER.navigateTo('login');
      return;
    }

    if (!selectedJob) return;

    // Validasi berkas wajib alumni (CV dan Transkrip/Ijazah)
    if (!almJobFiles.cv) {
      alert('Mohon unggah berkas wajib: Curriculum Vitae (CV) / Resume Terbaru (.pdf maks 5 MB).');
      return;
    }
    if (!almJobFiles.transkrip) {
      alert('Mohon unggah berkas wajib: Ijazah / Transkrip Nilai Akademik Terakhir (.pdf maks 5 MB).');
      return;
    }

    const chk = document.getElementById('alm-confirm-chk');
    if (!chk || !chk.checked) {
      alert('Silakan centang persetujuan keabsahan data profil dan berkas lamaran Anda.');
      return;
    }

    const notes = document.getElementById('apply-job-notes')?.value || '';
    const btn = document.getElementById('btn-submit-apply-job');
    const origText = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin inline mr-1"></i> Mengirim lamaran...`;
    }
    if (window.lucide) window.lucide.createIcons();

    try {
      const filesPayload = [
        { jenis: 'CV', filename: almJobFiles.cv.filename, size_kb: almJobFiles.cv.size_kb, fileObject: almJobFiles.cv.fileObject },
        { jenis: 'Transkrip', filename: almJobFiles.transkrip.filename, size_kb: almJobFiles.transkrip.size_kb, fileObject: almJobFiles.transkrip.fileObject }
      ];

      // Berkas tambahan portofolio & pendukung jika ada
      if (almJobFiles.portofolio) {
        filesPayload.push({
          jenis: 'Portofolio',
          filename: almJobFiles.portofolio.filename,
          size_kb: almJobFiles.portofolio.size_kb,
          fileObject: almJobFiles.portofolio.fileObject
        });
      }
      if (almJobFiles.tambahan) {
        filesPayload.push({
          jenis: 'Dokumen Tambahan',
          filename: almJobFiles.tambahan.filename,
          size_kb: almJobFiles.tambahan.size_kb,
          fileObject: almJobFiles.tambahan.fileObject
        });
      }

      const res = await window.SIMAGA_API.submitJobApplication(selectedJob.id_lowongan, user.id_user, {
        catatan: notes,
        files: filesPayload
      });

      if (res.status === 'success') {
        document.getElementById('modal-apply-job')?.classList.add('hidden');
        alert('🎉 Lamaran pekerjaan berhasil dikirim ke mitra industri!\nBerkas CV, Transkrip/Ijazah, dan Portofolio telah diunggah.');
        window.SIMAGA_ROUTER.navigateTo('alm-lamaran');
      } else {
        alert(res.message || 'Gagal mengirim lamaran.');
      }
    } catch (e) {
      alert('Terjadi kesalahan: ' + e.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = origText;
      }
      if (window.lucide) window.lucide.createIcons();
    }
  }

  async function renderMyJobApplications() {
    const container = document.getElementById('alm-applications-container');
    if (!container) return;

    const user = window.SIMAGA_AUTH.getUser();
    if (!user) return;

    container.innerHTML = `
      <div class="py-12 text-center text-gray-500">
        <i data-lucide="loader-2" class="w-8 h-8 mx-auto animate-spin mb-2 text-emerald-800"></i>
        <p>Memuat riwayat lamaran pekerjaan Anda...</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();

    const res = await window.SIMAGA_API.getApplications({ id_user: user.id_user });
    let list = res.data || [];

    if (list.length === 0) {
      container.innerHTML = `
        <div class="py-16 text-center bg-white rounded-2xl border border-gray-200 p-8 shadow-xs">
          <i data-lucide="briefcase" class="w-12 h-12 mx-auto text-gray-400 mb-3"></i>
          <h4 class="text-base font-bold text-gray-800">Belum Ada Lamaran Pekerjaan</h4>
          <p class="text-xs text-gray-500 mt-1 mb-4">Anda belum mengajukan lamaran ke lowongan pekerjaan mitra industri mana pun.</p>
          <button onclick="window.SIMAGA_ROUTER.navigateTo('alm-lowongan')" 
            class="px-5 py-2.5 text-xs font-bold text-white bg-brand-800 hover:bg-brand-900 rounded-xl transition-colors">
            Jelajahi Lowongan Kerja Alumni
          </button>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    container.innerHTML = list.map(app => {
      const v = app.lowongan || {};
      const status = app.status_seleksi || 'berkas_terkirim';
      const statusLabels = {
        berkas_terkirim: { label: 'Berkas Terkirim', color: 'bg-blue-100 text-blue-800 border-blue-200' },
        wawancara: { label: 'Wawancara HR / User', color: 'bg-amber-100 text-amber-800 border-amber-200' },
        diterima: { label: 'Offering / Diterima', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
        ditolak: { label: 'Belum Lolos', color: 'bg-red-100 text-red-800 border-red-200' }
      };
      const badge = statusLabels[status] || { label: status, color: 'bg-gray-100 text-gray-800 border-gray-200' };

      return `
        <div class="card-academic p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div class="space-y-2 flex-1">
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-bold px-2.5 py-0.5 rounded-full ${badge.color} border">
                ${badge.label}
              </span>
              <span class="text-xs text-gray-400">• ID: ${app.id_pendaftaran}</span>
            </div>
            <h3 class="text-base font-bold text-gray-900">${v.judul_posisi || 'Lowongan Pekerjaan Alumni'}</h3>
            <p class="text-xs font-semibold text-emerald-900">${v.mitra ? v.mitra.nama_perusahaan : 'Mitra Industri FILKOM'} • Lokasi: ${v.lokasi || 'Malang'}</p>
            <p class="text-xs text-gray-500">Dilamar pada: <span class="font-mono text-gray-700">${app.tanggal_daftar}</span></p>
            
            <div class="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-700 mt-2">
              <strong class="text-brand-900 block mb-0.5">Catatan Tim Rekrutmen:</strong>
              ${app.catatan_seleksi || 'Lamaran Anda sedang dalam peninjauan oleh tim Human Resource mitra.'}
            </div>
          </div>

          <div class="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
            <button onclick="window.SIMAGA_MHS.openDetailModal('${app.id_lowongan}')" 
              class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-colors text-center">
              Detail Lowongan
            </button>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  return {
    renderJobs,
    openApplyJobModal,
    handleAlmJobFile,
    submitJobApplication,
    renderMyJobApplications,
    initTracerStudy,
    setStep,
    onCareerStatusChange,
    saveDraft,
    submitSurvey,
    downloadProofPDF
  };
})();
