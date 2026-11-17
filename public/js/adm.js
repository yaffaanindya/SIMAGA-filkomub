/**
 * ==============================================================================
 * SIMAGA - ADMIN CAREER & INTERNSHIP CONTROLLER (UC-11, UC-12, UC-13, UC-14, UC-15)
 * ==============================================================================
 */

window.SIMAGA_ADM = (function() {
  let careerChartInstance = null;
  let selectedCurateVacancy = null;
  let selectedRespondent = null;

  // 1. KURASI LOWONGAN MITRA (UC-11, PC-08)
  async function renderVacancyCuration() {
    const container = document.getElementById('adm-curation-container');
    if (!container) return;

    container.innerHTML = `
      <div class="py-10 text-center text-gray-500">
        <i data-lucide="loader-2" class="w-6 h-6 mx-auto animate-spin mb-2 text-emerald-800"></i>
        Memeriksa antrean pengajuan lowongan...
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();

    const res = await window.SIMAGA_API.getVacancies({ status: 'all' });
    const pendingList = (res.data || []).filter(v => v.status_publikasi === 'menunggu');

    if (pendingList.length === 0) {
      container.innerHTML = `
        <div class="py-12 text-center bg-white rounded-2xl border border-gray-200 p-8">
          <i data-lucide="check-check" class="w-12 h-12 mx-auto text-emerald-600 mb-2"></i>
          <h4 class="text-base font-bold text-gray-800">Semua Pengajuan Lowongan Telah Dikurasi</h4>
          <p class="text-xs text-gray-500 mt-1">Saat ini tidak ada draf lowongan baru yang menunggu verifikasi fakultas.</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    container.innerHTML = pendingList.map(v => {
      const mitraName = v.mitra ? v.mitra.nama_perusahaan : 'Mitra Industri';
      return `
        <div class="card-academic p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div class="space-y-1.5 flex-1">
            <div class="flex items-center gap-2">
              <span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">Menunggu Kurasi</span>
              <span class="text-xs font-semibold text-emerald-900">${mitraName}</span>
            </div>
            <h3 class="text-base font-bold text-gray-900">${v.judul_posisi}</h3>
            <p class="text-xs text-gray-600 line-clamp-2">${v.deskripsi}</p>
            <div class="flex flex-wrap gap-3 text-[11px] text-gray-500 pt-1">
              <span><strong>Jenis:</strong> ${v.jenis_kesempatan}</span>
              <span><strong>Lokasi:</strong> ${v.lokasi}</span>
              <span><strong>Kuota:</strong> ${v.kuota} mhs</span>
              <span><strong>Tenggat:</strong> ${v.batas_pendaftaran}</span>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button onclick="window.SIMAGA_ADM.openRejectModal('${v.id_lowongan}')" 
              class="px-3 py-2 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors">
              Tolak & Catatan
            </button>
            <button onclick="window.SIMAGA_ADM.approveVacancy('${v.id_lowongan}')" 
              class="px-4 py-2 text-xs font-bold text-white bg-emerald-900 hover:bg-emerald-800 rounded-xl transition-colors shadow-sm">
              Setujui & Publikasikan
            </button>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  async function approveVacancy(id_lowongan) {
    if (!confirm('Apakah Anda yakin ingin menyetujui dan mempublikasikan lowongan ini ke katalog SIMAGA?')) return;

    const res = await window.SIMAGA_API.curateVacancy(id_lowongan, 'aktif', '', 'ADM-001');
    if (res.status === 'success') {
      alert('✅ Lowongan berhasil disetujui dan kini aktif dipublikasikan ke mahasiswa & alumni.');
      renderVacancyCuration();
    } else {
      alert(res.message || 'Gagal memverifikasi lowongan.');
    }
  }

  function openRejectModal(id_lowongan) {
    selectedCurateVacancy = id_lowongan;
    const notes = prompt('Masukkan alasan penolakan / catatan revisi untuk mitra industri (Wajib diisi):');
    if (notes === null) return;
    if (!notes.trim()) {
      alert('Alasan penolakan wajib diisi.');
      return;
    }
    rejectVacancy(id_lowongan, notes);
  }

  async function rejectVacancy(id_lowongan, catatan_revisi) {
    const res = await window.SIMAGA_API.curateVacancy(id_lowongan, 'ditolak', catatan_revisi, 'ADM-001');
    if (res.status === 'success') {
      alert('⚠️ Lowongan ditolak dan catatan revisi telah diteruskan ke mitra industri terkait.');
      renderVacancyCuration();
    } else {
      alert(res.message || 'Gagal menolak lowongan.');
    }
  }

  // 2. DASBOR ANALITIK IKU 1 (UI-05, UC-12)
  async function renderAnalyticsDashboard() {
    const prodi = document.getElementById('adm-filter-prodi')?.value || 'all';
    const tahun_lulus = document.getElementById('adm-filter-tahun')?.value || 'all';

    const res = await window.SIMAGA_API.getAdminDashboard({ prodi, tahun_lulus });
    const data = res.data;
    if (!data) return;

    // 3 Tile Kartu Metrik
    document.getElementById('metric-response-rate').textContent = `${data.metrics.responseRate}%`;
    document.getElementById('metric-total-responden').textContent = `${data.metrics.totalResponden} dari ${data.metrics.totalTargetAlumni} alumni`;

    document.getElementById('metric-avg-masa-tunggu').textContent = `${data.metrics.avgMasaTunggu} Bulan`;
    document.getElementById('metric-capaian-iku1').textContent = `${data.metrics.capaianIKU1}%`;

    // Render Bar Chart Distribusi Karier
    renderCareerChart(data.distribution);
  }

  function renderCareerChart(distribution) {
    const ctx = document.getElementById('adm-career-chart')?.getContext('2d');
    if (!ctx) return;

    if (careerChartInstance) {
      careerChartInstance.destroy();
    }

    careerChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Bekerja Layak', 'Wirausaha', 'Melanjutkan Studi', 'Mencari Kerja'],
        datasets: [{
          label: 'Jumlah Responden Lulusan',
          data: [
            distribution.bekerja || 0,
            distribution.wirausaha || 0,
            distribution.studiLanjut || 0,
            distribution.mencariKerja || 0
          ],
          backgroundColor: [
            '#143E35', // Deep Emerald
            '#D4AF37', // Gold
            '#6366F1', // Indigo
            '#94A3B8'  // Slate Gray
          ],
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0 }
          }
        }
      }
    });
  }

  // 3. VERIFIKASI RESPONDEN & DETEKSI ANOMALI (UC-13, PC-07)
  async function renderRespondentValidation() {
    const tableBody = document.getElementById('adm-respondents-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="py-8 text-center text-gray-500">
          <i data-lucide="loader-2" class="w-6 h-6 mx-auto animate-spin mb-2 text-emerald-800"></i>
          Memuat data responden tracer study...
        </td>
      </tr>
    `;
    if (window.lucide) window.lucide.createIcons();

    const res = await window.SIMAGA_API.getTracer();
    const list = (res.data || []).filter(q => !q.is_draft);

    if (list.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" class="py-10 text-center text-gray-400">
            Belum ada respons kuesioner pada periode yang dipilih.
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = list.map((item, idx) => {
      const al = item.alumni || {};
      const j = item.data_jawaban_parsed || {};
      const isAnomali = item.is_anomali === true || item.is_anomali === 'TRUE';
      const isVerified = item.status_validasi === 'tervalidasi';

      let statusPill = '';
      if (item.status_validasi === 'tervalidasi') {
        statusPill = '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">Sah / Tervalidasi</span>';
      } else if (item.status_validasi === 'perlu_klarifikasi') {
        statusPill = '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">Perlu Klarifikasi</span>';
      } else {
        statusPill = '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">Menunggu</span>';
      }

      return `
        <tr class="border-b border-gray-100 hover:bg-gray-50 text-xs transition-colors ${isAnomali ? 'row-anomali' : ''}">
          <td class="p-3.5 font-medium text-gray-600">${idx + 1}</td>
          <td class="p-3.5 font-mono font-bold text-gray-900">${item.nomor_referensi || '-'}</td>
          <td class="p-3.5">
            <span class="font-bold text-gray-900 block">${al.nama_lengkap || '-'}</span>
            <span class="text-gray-500 font-mono text-[11px]">NIM: ${item.nim} • ${al.prodi || '-'}</span>
          </td>
          <td class="p-3.5">
            <span class="font-semibold text-gray-800 block">${item.status_karir}</span>
            <span class="text-[11px] text-gray-500">${j.instansi || '-'}</span>
          </td>
          <td class="p-3.5">
            <div class="space-y-0.5">
              <span class="block font-semibold ${isAnomali ? 'text-red-700 font-bold' : 'text-gray-800'}">
                ${j.gaji || '-'} ${j.gaji_nominal ? `(Rp ${(Number(j.gaji_nominal)).toLocaleString('id-ID')})` : ''}
              </span>
              <span class="text-[11px] text-gray-500">Masa Tunggu: ${j.masa_tunggu !== undefined ? j.masa_tunggu + ' bln' : '-'}</span>
              ${isAnomali ? `
                <span class="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full mt-1">
                  ⚠️ Anomali: Gaji di luar rentang wajar
                </span>
              ` : ''}
            </div>
          </td>
          <td class="p-3.5">${statusPill}</td>
          <td class="p-3.5 text-right space-x-1">
            <button onclick="window.SIMAGA_ADM.validateRespondent('${item.id_kuesioner}', 'tervalidasi')" 
              class="px-2.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-bold text-[11px] transition-colors ${isVerified ? 'opacity-60 cursor-not-allowed' : ''}" 
              ${isVerified ? 'disabled' : ''}>
              Sahkan
            </button>
            <button onclick="window.SIMAGA_ADM.openClarificationModal('${item.id_kuesioner}')" 
              class="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-[11px] transition-colors">
              Perlu Klarifikasi
            </button>
          </td>
        </tr>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  // Sahkan Responden
  async function validateRespondent(id_kuesioner, status) {
    const res = await window.SIMAGA_API.validateTracerRespondent(id_kuesioner, status, '', 'ADM-001');
    if (res.status === 'success') {
      alert('✅ Responden berhasil disahkan dan masuk ke dalam kalkulasi IKU 1 institusi.');
      renderRespondentValidation();
      renderAnalyticsDashboard();
    } else {
      alert(res.message || 'Gagal memvalidasi responden.');
    }
  }

  // Buka Modal Klarifikasi
  function openClarificationModal(id_kuesioner) {
    const notes = prompt('Masukkan catatan klarifikasi anomali data (misal: "Mohon konfirmasi slip pendapatan dan tanggal mulai bekerja"):');
    if (notes === null) return;
    if (!notes.trim()) {
      alert('Catatan klarifikasi wajib diisi.');
      return;
    }

    sendClarification(id_kuesioner, notes);
  }

  async function sendClarification(id_kuesioner, catatan) {
    const res = await window.SIMAGA_API.validateTracerRespondent(id_kuesioner, 'perlu_klarifikasi', catatan, 'ADM-001');
    if (res.status === 'success') {
      alert('⚠️ Status diperbarui menjadi "Perlu Klarifikasi". Surel pemberitahuan telah dikirimkan ke alumni bersangkutan.');
      renderRespondentValidation();
      renderAnalyticsDashboard();
    } else {
      alert(res.message || 'Gagal mengirim klarifikasi.');
    }
  }

  // 4. KIRIM PENGINGAT MASSAL (UC-14)
  async function triggerMassReminder() {
    const prodi = document.getElementById('adm-filter-prodi')?.value || 'all';
    const tahun = document.getElementById('adm-filter-tahun')?.value || 'all';

    const prodiLabel = prodi === 'all' ? 'Seluruh Program Studi' : prodi;
    const tahunLabel = tahun === 'all' ? 'Seluruh Angkatan' : `Angkatan ${tahun}`;

    if (!confirm(`Apakah Anda yakin ingin mengirimkan surel pengingat massal secara otomatis kepada seluruh alumni sasaran (${prodiLabel} - ${tahunLabel}) yang belum mengisi kuesioner?`)) {
      return;
    }

    const res = await window.SIMAGA_API.sendMassReminder(prodi, tahun, 'ADM-001');
    if (res.status === 'success') {
      alert(`📧 ${res.message}\nRiwayat pengiriman berhasil dicatat pada basis data.`);
    } else {
      alert(res.message || 'Gagal mengirim pengingat massal.');
    }
  }

  // 5. EKSPOR LAPORAN IKU 1 (UC-15)
  function exportReport() {
    const format = document.getElementById('adm-export-format')?.value || 'xlsx';
    const prodi = document.getElementById('adm-filter-prodi')?.value || 'all';
    const tahun = document.getElementById('adm-filter-tahun')?.value || 'all';

    if (format === 'xlsx') {
      // Unduh file Excel
      window.location.href = `/api/admin/export/excel?prodi=${prodi}&tahun_lulus=${tahun}`;
    } else {
      // Cetak / Simpan Ringkasan Eksekutif PDF
      window.print();
    }
  }

  // 6. MANAJEMEN PENGGUNA (Admin UC / Point 13)
  let allUsersList = [];

  async function renderUsersManagement() {
    const tbody = document.getElementById('adm-users-table-body');
    if (!tbody) return;

    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="p-8 text-center text-gray-500">
          <i data-lucide="loader-2" class="w-6 h-6 mx-auto animate-spin mb-2 text-emerald-800"></i>
          Memuat data pengguna dari basis data Google Sheets...
        </td>
      </tr>
    `;
    if (window.lucide) window.lucide.createIcons();

    const res = await window.SIMAGA_API.getUsers();
    allUsersList = res.data || [];

    const totalUsers = allUsersList.length;
    const mhsCount = allUsersList.filter(u => u.role === 'Mahasiswa').length;
    const almCount = allUsersList.filter(u => u.role === 'Alumni').length;
    const minCount = allUsersList.filter(u => u.role === 'MitraIndustri').length;

    const elTotal = document.getElementById('adm-stat-users-total');
    const elMhs = document.getElementById('adm-stat-users-mhs');
    const elAlm = document.getElementById('adm-stat-users-alm');
    const elMin = document.getElementById('adm-stat-users-min');

    if (elTotal) elTotal.textContent = totalUsers;
    if (elMhs) elMhs.textContent = mhsCount;
    if (elAlm) elAlm.textContent = almCount;
    if (elMin) elMin.textContent = minCount;

    filterUsersTable();
  }

  function filterUsersTable() {
    const tbody = document.getElementById('adm-users-table-body');
    if (!tbody) return;

    const roleFilter = document.getElementById('adm-users-filter-role')?.value || 'all';
    const keyword = (document.getElementById('adm-users-search')?.value || '').toLowerCase().trim();

    let list = allUsersList;
    if (roleFilter !== 'all') {
      list = list.filter(u => u.role === roleFilter);
    }
    if (keyword) {
      list = list.filter(u => 
        (u.nama_lengkap || '').toLowerCase().includes(keyword) ||
        (u.email || '').toLowerCase().includes(keyword) ||
        (u.id_user || '').toLowerCase().includes(keyword) ||
        (u.profile?.nim || '').toLowerCase().includes(keyword) ||
        (u.profile?.nama_perusahaan || '').toLowerCase().includes(keyword)
      );
    }

    if (list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="p-8 text-center text-gray-500">
            Tidak ada data pengguna yang sesuai dengan filter atau kata kunci pencarian.
          </td>
        </tr>
      `;
      return;
    }

    const roleBadges = {
      Mahasiswa: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      Alumni: 'bg-blue-100 text-blue-800 border-blue-200',
      MitraIndustri: 'bg-purple-100 text-purple-800 border-purple-200',
      Admin: 'bg-amber-100 text-amber-800 border-amber-200'
    };

    tbody.innerHTML = list.map((u, idx) => {
      const p = u.profile || {};
      let roleDetail = '-';
      if (u.role === 'Mahasiswa') {
        roleDetail = `NIM: <span class="font-mono font-bold text-gray-800">${p.nim || '-'}</span><br><span class="text-[11px] text-gray-500">${p.prodi || 'Sistem Informasi'} (${p.angkatan || '2025'})</span>`;
      } else if (u.role === 'Alumni') {
        roleDetail = `NIM: <span class="font-mono font-bold text-gray-800">${p.nim || '-'}</span><br><span class="text-[11px] text-gray-500">${p.prodi || 'Sistem Informasi'} (Lulus ${p.tahun_lulus || '2025'})</span>`;
      } else if (u.role === 'MitraIndustri') {
        roleDetail = `<span class="font-bold text-emerald-900">${p.nama_perusahaan || u.nama_lengkap}</span><br><span class="text-[11px] text-gray-500">${p.kontak_person || '-'} • ${p.no_telepon || '-'}</span>`;
      } else if (u.role === 'Admin') {
        roleDetail = `<span class="font-bold text-amber-900">${p.unit_kerja || 'Career & Internship'}</span><br><span class="text-[11px] text-gray-500">FILKOM Universitas Brawijaya</span>`;
      }

      const badgeClass = roleBadges[u.role] || 'bg-gray-100 text-gray-800 border-gray-200';

      return `
        <tr class="border-b border-gray-100 hover:bg-gray-50/80 transition-colors text-xs">
          <td class="p-3.5 font-bold text-gray-400">${idx + 1}</td>
          <td class="p-3.5">
            <span class="font-mono font-bold text-gray-800">${u.id_user}</span><br>
            <span class="text-[11px] text-gray-500">${u.email}</span>
          </td>
          <td class="p-3.5 font-bold text-gray-900">${u.nama_lengkap}</td>
          <td class="p-3.5">
            <span class="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeClass}">
              ${u.role}
            </span>
          </td>
          <td class="p-3.5 leading-snug">${roleDetail}</td>
          <td class="p-3.5">
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${u.status_akun === 'aktif' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}">
              <span class="w-1.5 h-1.5 rounded-full ${u.status_akun === 'aktif' ? 'bg-emerald-500' : 'bg-red-500'}"></span>
              ${u.status_akun === 'aktif' ? 'Aktif' : 'Nonaktif'}
            </span>
          </td>
          <td class="p-3.5 text-center">
            <div class="flex items-center justify-center gap-1.5">
              <button onclick="window.SIMAGA_ADM.openEditUserModal('${u.id_user}')" 
                class="p-1.5 text-blue-700 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors" title="Edit Pengguna">
                <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
              </button>
              <button onclick="window.SIMAGA_ADM.deleteUser('${u.id_user}', '${(u.nama_lengkap || '').replace(/'/g, "\\'")}')" 
                class="p-1.5 text-red-700 hover:bg-red-50 border border-red-200 rounded-lg transition-colors" title="Hapus Pengguna">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  function openAddUserModal() {
    const modal = document.getElementById('modal-add-user');
    const form = document.getElementById('form-add-user');
    if (form) form.reset();
    onUserRoleChange('Mahasiswa');
    modal?.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  function onUserRoleChange(role) {
    const mhsFields = document.getElementById('user-fields-mhs');
    const almFields = document.getElementById('user-fields-alm');
    const minFields = document.getElementById('user-fields-min');
    const admFields = document.getElementById('user-fields-adm');

    mhsFields?.classList.add('hidden');
    almFields?.classList.add('hidden');
    minFields?.classList.add('hidden');
    admFields?.classList.add('hidden');

    if (role === 'Mahasiswa') mhsFields?.classList.remove('hidden');
    else if (role === 'Alumni') almFields?.classList.remove('hidden');
    else if (role === 'MitraIndustri') minFields?.classList.remove('hidden');
    else if (role === 'Admin') admFields?.classList.remove('hidden');
  }

  async function submitNewUser(e) {
    if (e) e.preventDefault();

    const role = document.getElementById('new-user-role')?.value || 'Mahasiswa';
    const nama_lengkap = document.getElementById('new-user-name')?.value?.trim();
    const email = document.getElementById('new-user-email')?.value?.trim();
    const password = document.getElementById('new-user-password')?.value || 'ub123456';

    if (!nama_lengkap || !email) {
      alert('Nama Lengkap dan Surel (Email) wajib diisi.');
      return;
    }

    const payload = {
      role,
      nama_lengkap,
      email,
      password,
      status_akun: 'aktif'
    };

    if (role === 'Mahasiswa') {
      payload.nim = document.getElementById('new-user-mhs-nim')?.value?.trim() || ('255150' + Date.now().toString().slice(-8));
      payload.prodi = document.getElementById('new-user-mhs-prodi')?.value || 'Sistem Informasi';
      payload.angkatan = document.getElementById('new-user-mhs-angkatan')?.value || 2025;
      payload.ipk = document.getElementById('new-user-mhs-ipk')?.value || 3.75;
    } else if (role === 'Alumni') {
      payload.nim = document.getElementById('new-user-alm-nim')?.value?.trim() || ('215150' + Date.now().toString().slice(-8));
      payload.prodi = document.getElementById('new-user-alm-prodi')?.value || 'Sistem Informasi';
      payload.tahun_lulus = document.getElementById('new-user-alm-tahun')?.value || 2025;
    } else if (role === 'MitraIndustri') {
      payload.nama_perusahaan = document.getElementById('new-user-min-perusahaan')?.value?.trim() || nama_lengkap;
      payload.kontak_person = document.getElementById('new-user-min-kontak')?.value?.trim() || nama_lengkap;
      payload.no_telepon = document.getElementById('new-user-min-telp')?.value?.trim() || '08123456789';
      payload.alamat = document.getElementById('new-user-min-alamat')?.value?.trim() || 'Malang, Jawa Timur';
    } else if (role === 'Admin') {
      payload.unit_kerja = document.getElementById('new-user-adm-unit')?.value?.trim() || 'Career & Internship';
    }

    const btn = document.getElementById('btn-submit-add-user');
    const origText = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin inline mr-1"></i> Menyimpan ke Google Sheets...`;
    }
    if (window.lucide) window.lucide.createIcons();

    try {
      const res = await window.SIMAGA_API.createUser(payload);
      if (res.status === 'success') {
        alert('🎉 Pengguna baru berhasil didaftarkan dan disinkronkan ke Google Sheets!\nAkun dapat langsung digunakan untuk masuk.');
        document.getElementById('modal-add-user')?.classList.add('hidden');
        renderUsersManagement();
      } else {
        alert(res.message || 'Gagal menambahkan pengguna.');
      }
    } catch (err) {
      alert('Terjadi kesalahan saat menambahkan pengguna: ' + err.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = origText;
      }
      if (window.lucide) window.lucide.createIcons();
    }
  }

  function openEditUserModal(id_user) {
    const user = allUsersList.find(u => u.id_user === id_user);
    if (!user) {
      alert('Pengguna tidak ditemukan.');
      return;
    }

    const modal = document.getElementById('modal-edit-user');
    const form = document.getElementById('form-edit-user');
    if (form) form.reset();

    document.getElementById('edit-user-id').value = user.id_user;
    document.getElementById('edit-user-role-display').value = user.role;
    document.getElementById('edit-user-name').value = user.nama_lengkap || '';
    document.getElementById('edit-user-email').value = user.email || '';
    document.getElementById('edit-user-status').value = user.status_akun || 'aktif';
    document.getElementById('edit-user-password').value = '';

    const p = user.profile || {};
    const mhsFields = document.getElementById('edit-user-fields-mhs');
    const almFields = document.getElementById('edit-user-fields-alm');
    const minFields = document.getElementById('edit-user-fields-min');
    const admFields = document.getElementById('edit-user-fields-adm');

    mhsFields?.classList.add('hidden');
    almFields?.classList.add('hidden');
    minFields?.classList.add('hidden');
    admFields?.classList.add('hidden');

    if (user.role === 'Mahasiswa') {
      mhsFields?.classList.remove('hidden');
      document.getElementById('edit-user-mhs-nim').value = p.nim || '';
      document.getElementById('edit-user-mhs-prodi').value = p.prodi || 'Sistem Informasi';
      document.getElementById('edit-user-mhs-angkatan').value = p.angkatan || 2025;
    } else if (user.role === 'Alumni') {
      almFields?.classList.remove('hidden');
      document.getElementById('edit-user-alm-nim').value = p.nim || '';
      document.getElementById('edit-user-alm-prodi').value = p.prodi || 'Sistem Informasi';
      document.getElementById('edit-user-alm-tahun').value = p.tahun_lulus || 2025;
    } else if (user.role === 'MitraIndustri') {
      minFields?.classList.remove('hidden');
      document.getElementById('edit-user-min-perusahaan').value = p.nama_perusahaan || user.nama_lengkap || '';
      document.getElementById('edit-user-min-kontak').value = p.kontak_person || '';
      document.getElementById('edit-user-min-telp').value = p.no_telepon || '';
      document.getElementById('edit-user-min-alamat').value = p.alamat || '';
    } else if (user.role === 'Admin') {
      admFields?.classList.remove('hidden');
      document.getElementById('edit-user-adm-unit').value = p.unit_kerja || 'Career & Internship';
    }

    modal?.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  async function submitEditUser(e) {
    if (e) e.preventDefault();

    const id_user = document.getElementById('edit-user-id')?.value;
    const user = allUsersList.find(u => u.id_user === id_user);
    if (!user) return;

    const nama_lengkap = document.getElementById('edit-user-name')?.value?.trim();
    const email = document.getElementById('edit-user-email')?.value?.trim();
    const status_akun = document.getElementById('edit-user-status')?.value || 'aktif';
    const password = document.getElementById('edit-user-password')?.value;

    if (!nama_lengkap || !email) {
      alert('Nama Lengkap dan Surel wajib diisi.');
      return;
    }

    const payload = {
      nama_lengkap,
      email,
      status_akun
    };
    if (password && password.trim()) {
      payload.password = password.trim();
    }

    if (user.role === 'Mahasiswa') {
      payload.nim = document.getElementById('edit-user-mhs-nim')?.value?.trim();
      payload.prodi = document.getElementById('edit-user-mhs-prodi')?.value;
      payload.angkatan = document.getElementById('edit-user-mhs-angkatan')?.value;
    } else if (user.role === 'Alumni') {
      payload.nim = document.getElementById('edit-user-alm-nim')?.value?.trim();
      payload.prodi = document.getElementById('edit-user-alm-prodi')?.value;
      payload.tahun_lulus = document.getElementById('edit-user-alm-tahun')?.value;
    } else if (user.role === 'MitraIndustri') {
      payload.nama_perusahaan = document.getElementById('edit-user-min-perusahaan')?.value?.trim();
      payload.kontak_person = document.getElementById('edit-user-min-kontak')?.value?.trim();
      payload.no_telepon = document.getElementById('edit-user-min-telp')?.value?.trim();
      payload.alamat = document.getElementById('edit-user-min-alamat')?.value?.trim();
    } else if (user.role === 'Admin') {
      payload.unit_kerja = document.getElementById('edit-user-adm-unit')?.value?.trim();
    }

    const btn = document.getElementById('btn-submit-edit-user');
    const origText = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin inline mr-1"></i> Menyimpan perubahan...`;
    }
    if (window.lucide) window.lucide.createIcons();

    try {
      const res = await window.SIMAGA_API.updateUser(id_user, payload);
      if (res.status === 'success') {
        alert('✅ Perubahan pengguna berhasil disimpan ke basis data.');
        document.getElementById('modal-edit-user')?.classList.add('hidden');
        renderUsersManagement();
      } else {
        alert(res.message || 'Gagal menyimpan perubahan.');
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

  async function deleteUser(id_user, nama_lengkap) {
    if (!confirm(`Apakah Anda yakin ingin menghapus pengguna "${nama_lengkap}" (${id_user})?\n\nTindakan ini akan menghapus akun dan data relasionalnya secara permanen.`)) {
      return;
    }

    try {
      const res = await window.SIMAGA_API.deleteUser(id_user);
      if (res.status === 'success') {
        alert(`🗑️ Pengguna "${nama_lengkap}" berhasil dihapus.`);
        renderUsersManagement();
      } else {
        alert(res.message || 'Gagal menghapus pengguna.');
      }
    } catch (err) {
      alert('Terjadi kesalahan saat menghapus pengguna: ' + err.message);
    }
  }

  return {
    renderVacancyCuration,
    approveVacancy,
    openRejectModal,
    renderAnalyticsDashboard,
    renderRespondentValidation,
    validateRespondent,
    openClarificationModal,
    triggerMassReminder,
    exportReport,
    renderUsersManagement,
    filterUsersTable,
    openAddUserModal,
    onUserRoleChange,
    submitNewUser,
    openEditUserModal,
    submitEditUser,
    deleteUser
  };
})();
