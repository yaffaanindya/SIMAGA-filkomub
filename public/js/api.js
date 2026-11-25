/**
 * ==============================================================================
 * SIMAGA - UNIFIED API CLIENT (FILKOM UB)
 * ==============================================================================
 * Mendukung 3 mode koneksi transparan:
 * 1. Node.js Express Server Backend (/api/...)
 * 2. Direct Google Apps Script Web App Endpoint (CORS Serverless)
 * 3. Offline / Instant Demo Local Storage Mode
 * ==============================================================================
 */

window.SIMAGA_API = (function() {
  // Pengaturan koneksi yang dapat diubah melalui UI
  let config = {
    mode: localStorage.getItem('simaga_api_mode') || 'auto', // 'auto', 'apps_script', 'node', 'mock'
    appsScriptUrl: localStorage.getItem('simaga_apps_script_url') || '',
    spreadsheetId: localStorage.getItem('simaga_spreadsheet_id') || ''
  };

  function setConfig(newConfig) {
    config = { ...config, ...newConfig };
    localStorage.setItem('simaga_api_mode', config.mode);
    localStorage.setItem('simaga_apps_script_url', config.appsScriptUrl);
    localStorage.setItem('simaga_spreadsheet_id', config.spreadsheetId);
  }

  function getConfig() {
    return { ...config };
  }

  // Helper request ke Node backend
  async function requestNode(endpoint, options = {}) {
    try {
      const res = await fetch(endpoint, options);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(errData.message || 'Terjadi kesalahan pada server');
      }
      return await res.json();
    } catch (err) {
      console.warn('[API Client] Node endpoint gagal:', err.message);
      throw err;
    }
  }

  // Helper request ke Google Apps Script Web App
  async function requestAppsScript(action, payload = {}, method = 'POST') {
    if (!config.appsScriptUrl) throw new Error('URL Google Apps Script belum dikonfigurasi.');
    
    if (method === 'GET') {
      const queryParams = new URLSearchParams({ action, ...payload }).toString();
      const res = await fetch(`${config.appsScriptUrl}?${queryParams}`);
      return await res.json();
    } else {
      const res = await fetch(config.appsScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, ...payload })
      });
      return await res.json();
    }
  }

  return {
    setConfig,
    getConfig,

    // 1. LOGIN (UC-16)
    async login(identifier, password) {
      if (config.mode === 'apps_script' && config.appsScriptUrl) {
        return await requestAppsScript('login', { identifier, password });
      }

      try {
        return await requestNode('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, password })
        });
      } catch (err) {
        // Fallback ke Local Mock DB
        console.log('[API Client] Menggunakan fallback autentikasi lokal...');
        const users = window.SIMAGA_DB.pengguna;
        const lower = identifier.toLowerCase().trim();

        let matched = users.find(u => u.email.toLowerCase() === lower || u.id_user.toLowerCase() === lower);
        if (!matched) {
          const m = window.SIMAGA_DB.mahasiswa.find(mhs => mhs.nim === identifier.trim());
          if (m) matched = users.find(u => u.id_user === m.id_user);
        }
        if (!matched) {
          const al = window.SIMAGA_DB.alumni.find(a => a.nim === identifier.trim());
          if (al) matched = users.find(u => u.id_user === al.id_user);
        }

        if (!matched || matched.password_hash !== password) {
          return { status: 'error', message: 'Kombinasi surel/NIM dan kata sandi salah.' };
        }

        if (matched.status_akun !== 'aktif') {
          return { status: 'error', message: 'Akun Anda sedang dinonaktifkan, hubungi unit Career Center.' };
        }

        let profile = {};
        if (matched.role === 'Mahasiswa') {
          profile = window.SIMAGA_DB.mahasiswa.find(m => m.id_user === matched.id_user) || {};
        } else if (matched.role === 'Alumni') {
          profile = window.SIMAGA_DB.alumni.find(a => a.id_user === matched.id_user) || {};
        } else if (matched.role === 'Admin') {
          profile = window.SIMAGA_DB.admin.find(ad => ad.id_user === matched.id_user) || {};
        } else if (matched.role === 'MitraIndustri') {
          profile = window.SIMAGA_DB.mitra_industri.find(mt => mt.id_user === matched.id_user) || {};
        }

        return {
          status: 'success',
          message: 'Login berhasil',
          data: {
            token: 'mock_token_' + Date.now(),
            user: { ...matched },
            profile
          }
        };
      }
    },

    // 2. LOWONGAN (UC-01, UC-03, UC-10, UC-11)
    async getVacancies(filter = {}) {
      if (config.mode === 'apps_script' && config.appsScriptUrl) {
        return await requestAppsScript('getVacancies', filter, 'GET');
      }

      try {
        const q = new URLSearchParams(filter).toString();
        return await requestNode(`/api/vacancies?${q}`);
      } catch (err) {
        let list = [...window.SIMAGA_DB.lowongan];
        const pMap = {};
        window.SIMAGA_DB.mitra_industri.forEach(p => { pMap[p.id_mitra] = p; });

        list = list.map(v => ({ ...v, mitra: pMap[v.id_mitra] || null }));

        if (filter.status && filter.status !== 'all') {
          list = list.filter(v => v.status_publikasi === filter.status);
        } else if (!filter.status) {
          list = list.filter(v => v.status_publikasi === 'aktif');
        }

        if (filter.jenis && filter.jenis !== 'all') {
          list = list.filter(v => v.jenis_kesempatan === filter.jenis);
        }

        if (filter.bidang && filter.bidang !== 'all') {
          list = list.filter(v => v.bidang_keahlian === filter.bidang);
        }

        if (filter.lokasi && filter.lokasi !== 'all') {
          list = list.filter(v => (v.lokasi || '').toLowerCase().includes(filter.lokasi.toLowerCase()));
        }

        if (filter.keyword && filter.keyword.trim()) {
          const kw = filter.keyword.toLowerCase();
          list = list.filter(v => 
            v.judul_posisi.toLowerCase().includes(kw) ||
            v.deskripsi.toLowerCase().includes(kw) ||
            v.kualifikasi.toLowerCase().includes(kw)
          );
        }

        return { status: 'success', data: list };
      }
    },

    async createVacancy(vacancyData) {
      if (config.mode === 'apps_script' && config.appsScriptUrl) {
        return await requestAppsScript('createVacancy', vacancyData);
      }

      try {
        return await requestNode('/api/vacancies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(vacancyData)
        });
      } catch (err) {
        const id_lowongan = 'LOW-' + Date.now();
        const newV = {
          id_lowongan,
          id_mitra: vacancyData.id_mitra || 'MTR-101',
          id_admin: '',
          judul_posisi: vacancyData.judul_posisi,
          jenis_kesempatan: vacancyData.jenis_kesempatan || 'Magang Bersertifikat',
          deskripsi: vacancyData.deskripsi,
          kualifikasi: vacancyData.kualifikasi,
          lokasi: vacancyData.lokasi,
          periode_mulai: vacancyData.periode_mulai,
          periode_selesai: vacancyData.periode_selesai,
          kuota: Number(vacancyData.kuota) || 1,
          batas_pendaftaran: vacancyData.batas_pendaftaran,
          status_publikasi: 'menunggu',
          catatan_revisi: ''
        };
        window.SIMAGA_DB.lowongan.push(newV);

        // Notifikasi ke Admin
        window.SIMAGA_DB.notifikasi.push({
          id_notifikasi: 'NTF-' + Date.now(),
          id_user: 'USR-004',
          jenis: 'kurasi_lowongan',
          judul: 'Pengajuan Lowongan Baru',
          pesan: `Mitra mengajukan lowongan baru: ${newV.judul_posisi}. Menunggu kurasi admin.`,
          is_dibaca: false,
          tanggal_kirim: new Date().toISOString().replace('T', ' ').substring(0, 19)
        });

        window.syncLocalDB();
        return { status: 'success', message: 'Lowongan berhasil diajukan.', data: newV };
      }
    },

    async curateVacancy(id_lowongan, status, catatan_revisi, id_admin) {
      if (config.mode === 'apps_script' && config.appsScriptUrl) {
        return await requestAppsScript('curateVacancy', { id_lowongan, status, catatan_revisi, id_admin });
      }

      try {
        return await requestNode(`/api/vacancies/${id_lowongan}/curate`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keputusan: status, catatan_revisi, id_admin })
        });
      } catch (err) {
        const v = window.SIMAGA_DB.lowongan.find(item => item.id_lowongan === id_lowongan);
        if (v) {
          v.status_publikasi = status;
          v.catatan_revisi = catatan_revisi || '';
          v.id_admin = id_admin || 'ADM-001';

          // Notifikasi ke mitra
          const mitra = window.SIMAGA_DB.mitra_industri.find(m => m.id_mitra === v.id_mitra);
          if (mitra) {
            window.SIMAGA_DB.notifikasi.push({
              id_notifikasi: 'NTF-' + Date.now(),
              id_user: mitra.id_user,
              jenis: 'kurasi_lowongan',
              judul: status === 'aktif' ? 'Lowongan Disetujui' : 'Lowongan Ditolak',
              pesan: status === 'aktif' 
                ? `Lowongan '${v.judul_posisi}' disetujui dan kini dipublikasikan.`
                : `Lowongan '${v.judul_posisi}' ditolak. Catatan: ${catatan_revisi}`,
              is_dibaca: false,
              tanggal_kirim: new Date().toISOString().replace('T', ' ').substring(0, 19)
            });
          }

          window.syncLocalDB();
          return { status: 'success', message: `Status diperbarui menjadi ${status}`, data: v };
        }
        return { status: 'error', message: 'Lowongan tidak ditemukan' };
      }
    },

    // 3. PENDAFTARAN & UNGGAH BERKAS (UC-04, UC-05, UC-06, PC-03, PC-09)
    async getApplications(filter = {}) {
      if (config.mode === 'apps_script' && config.appsScriptUrl) {
        return await requestAppsScript('getApplications', filter, 'GET');
      }

      try {
        const q = new URLSearchParams(filter).toString();
        return await requestNode(`/api/applications?${q}`);
      } catch (err) {
        const apps = window.SIMAGA_DB.pendaftaran;
        const vMap = {}; window.SIMAGA_DB.lowongan.forEach(v => { vMap[v.id_lowongan] = v; });
        const uMap = {}; window.SIMAGA_DB.pengguna.forEach(u => { uMap[u.id_user] = u; });
        const mMap = {}; window.SIMAGA_DB.mahasiswa.forEach(m => { mMap[m.id_user] = m; });

        const filesByApp = {};
        window.SIMAGA_DB.berkas_persyaratan.forEach(f => {
          if (!filesByApp[f.id_pendaftaran]) filesByApp[f.id_pendaftaran] = [];
          filesByApp[f.id_pendaftaran].push(f);
        });

        let list = apps.map(a => {
          const u = uMap[a.id_user] || {};
          const m = mMap[a.id_user] || {};
          return {
            ...a,
            lowongan: vMap[a.id_lowongan] || null,
            mahasiswa: {
              nama_lengkap: u.nama_lengkap || '-',
              email: u.email || '-',
              nim: m.nim || '-',
              prodi: m.prodi || '-',
              angkatan: m.angkatan || '-'
            },
            berkas: filesByApp[a.id_pendaftaran] || []
          };
        });

        if (filter.id_user) list = list.filter(a => a.id_user === filter.id_user);
        if (filter.id_mitra) list = list.filter(a => a.lowongan && a.lowongan.id_mitra === filter.id_mitra);

        return { status: 'success', data: list };
      }
    },

    async submitApplication(id_lowongan, id_user, files) {
      // files: array [{ jenis, filename, base64, size_kb }]
      if (config.mode === 'apps_script' && config.appsScriptUrl) {
        return await requestAppsScript('submitApplication', { id_lowongan, id_user, files });
      }

      // Coba kirim multipart ke Node backend
      try {
        const formData = new FormData();
        formData.append('id_lowongan', id_lowongan);
        formData.append('id_user', id_user);

        // Cari file buffer atau blob
        files.forEach(f => {
          const fieldName = f.jenis === 'CV' ? 'cv' : f.jenis === 'Transkrip' ? 'transkrip' : 'rekomendasi';
          if (f.fileObject) {
            formData.append(fieldName, f.fileObject, f.filename);
          } else {
            // Buat dummy blob jika dari base64
            const blob = new Blob(['%PDF-1.4 Mock Content'], { type: 'application/pdf' });
            formData.append(fieldName, blob, f.filename);
          }
        });

        const res = await fetch('/api/applications', {
          method: 'POST',
          body: formData
        });
        return await res.json();
      } catch (err) {
        // Mock fallback
        const id_pendaftaran = 'REG-' + Date.now();
        const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

        // Simpan 3 berkas
        const uploaded = files.map((f, i) => {
          const rec = {
            id_berkas: `BRK-${id_pendaftaran}-${i + 1}`,
            id_pendaftaran,
            jenis_berkas: f.jenis,
            nama_file: f.filename,
            ukuran_kb: f.size_kb || 512,
            drive_file_id: `drive_${Date.now()}_${i}`,
            // Mode offline: pakai blob URL dari berkas asli (bukan ID Drive palsu yang tidak bisa dibuka)
            drive_url: f.fileObject ? URL.createObjectURL(f.fileObject) : '',
            tanggal_unggah: nowStr
          };
          window.SIMAGA_DB.berkas_persyaratan.push(rec);
          return rec;
        });

        const appRec = {
          id_pendaftaran,
          id_lowongan,
          id_user,
          status_seleksi: 'berkas_terkirim',
          catatan_seleksi: 'Lamaran Anda sedang dalam antrean pemeriksaan berkas.',
          tanggal_daftar: nowStr
        };
        window.SIMAGA_DB.pendaftaran.push(appRec);

        window.SIMAGA_DB.notifikasi.push({
          id_notifikasi: 'NTF-' + Date.now(),
          id_user,
          jenis: 'pendaftaran',
          judul: 'Pendaftaran Magang Berhasil',
          pesan: `Pendaftaran posisi magang terkirim dengan ID ${id_pendaftaran}. Berkas tersimpan di Google Drive.`,
          is_dibaca: false,
          tanggal_kirim: nowStr
        });

        window.syncLocalDB();
        return {
          status: 'success',
          message: 'Pendaftaran berhasil dikirim ke Google Drive.',
          data: { id_pendaftaran, status_seleksi: 'berkas_terkirim', berkas: uploaded }
        };
      }
    },

    async updateSelectionStatus(id_pendaftaran, status_seleksi, catatan_seleksi) {
      if (config.mode === 'apps_script' && config.appsScriptUrl) {
        return await requestAppsScript('updateSelectionStatus', { id_pendaftaran, status_seleksi, catatan_seleksi });
      }

      try {
        return await requestNode(`/api/applications/${id_pendaftaran}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status_seleksi, catatan_seleksi })
        });
      } catch (err) {
        const appItem = window.SIMAGA_DB.pendaftaran.find(a => a.id_pendaftaran === id_pendaftaran);
        if (appItem) {
          appItem.status_seleksi = status_seleksi;
          appItem.catatan_seleksi = catatan_seleksi || '';

          const labelMap = {
            pemeriksaan_berkas: 'Pemeriksaan Berkas',
            wawancara: 'Tahap Wawancara',
            diterima: 'Diterima Magang',
            ditolak: 'Belum Berhasil'
          };

          window.SIMAGA_DB.notifikasi.push({
            id_notifikasi: 'NTF-' + Date.now(),
            id_user: appItem.id_user,
            jenis: 'status_seleksi',
            judul: 'Tahap Seleksi Diperbarui',
            pesan: `Status lamaran Anda diperbarui menjadi: ${labelMap[status_seleksi] || status_seleksi}. Catatan: ${catatan_seleksi}`,
            is_dibaca: false,
            tanggal_kirim: new Date().toISOString().replace('T', ' ').substring(0, 19)
          });

          window.syncLocalDB();
          return { status: 'success', message: 'Status seleksi diperbarui.', data: appItem };
        }
        return { status: 'error', message: 'Pendaftaran tidak ditemukan.' };
      }
    },

    // 4. TRACER STUDY (UC-07, UC-08, UC-09, PC-04, PC-05, PC-06)
    async getTracer(nim) {
      if (config.mode === 'apps_script' && config.appsScriptUrl) {
        return await requestAppsScript('getTracer', { nim }, 'GET');
      }

      try {
        const q = nim ? `?nim=${nim}` : '';
        return await requestNode(`/api/tracer${q}`);
      } catch (err) {
        const list = window.SIMAGA_DB.kuesioner;
        const almMap = {}; window.SIMAGA_DB.alumni.forEach(a => { almMap[a.nim] = a; });
        const uMap = {}; window.SIMAGA_DB.pengguna.forEach(u => { uMap[u.id_user] = u; });

        const enriched = list.map(item => {
          const al = almMap[item.nim] || {};
          const u = uMap[al.id_user] || {};
          let parsed = {};
          try { parsed = JSON.parse(item.data_jawaban); } catch(e){}
          return {
            ...item,
            data_jawaban_parsed: parsed,
            alumni: {
              nim: item.nim,
              nama_lengkap: u.nama_lengkap || '-',
              prodi: al.prodi || '-',
              tahun_lulus: al.tahun_lulus || '-'
            }
          };
        });

        if (nim) {
          const f = enriched.find(item => item.nim === nim);
          return { status: 'success', data: f || null };
        }
        return { status: 'success', data: enriched };
      }
    },

    async saveTracerDraft(nim, status_karir, data_jawaban) {
      if (config.mode === 'apps_script' && config.appsScriptUrl) {
        return await requestAppsScript('saveTracerDraft', { nim, status_karir, data_jawaban });
      }

      try {
        return await requestNode('/api/tracer/draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nim, status_karir, data_jawaban })
        });
      } catch (err) {
        let item = window.SIMAGA_DB.kuesioner.find(q => q.nim === nim);
        if (item) {
          item.status_karir = status_karir;
          item.data_jawaban = JSON.stringify(data_jawaban || {});
          item.is_draft = true;
        } else {
          item = {
            id_kuesioner: 'TRC-' + Date.now(),
            nim,
            id_admin: '',
            periode_survei: 2026,
            status_karir: status_karir || '',
            data_jawaban: JSON.stringify(data_jawaban || {}),
            is_draft: true,
            status_validasi: 'menunggu',
            is_anomali: false,
            nomor_referensi: '',
            tanggal_submit: ''
          };
          window.SIMAGA_DB.kuesioner.push(item);
        }
        window.syncLocalDB();
        return { status: 'success', message: 'Draf kuesioner berhasil disimpan.', data: item };
      }
    },

    async submitTracer(nim, status_karir, data_jawaban) {
      if (config.mode === 'apps_script' && config.appsScriptUrl) {
        return await requestAppsScript('submitTracerSurvey', { nim, status_karir, data_jawaban });
      }

      try {
        return await requestNode('/api/tracer/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nim, status_karir, data_jawaban })
        });
      } catch (err) {
        // Auto Deteksi Anomali
        let isAnomali = false;
        const nominalGaji = Number(data_jawaban.gaji_nominal) || 0;
        const masaTunggu = Number(data_jawaban.masa_tunggu);

        if (nominalGaji > 50000000 || nominalGaji < 0) isAnomali = true;
        if (masaTunggu < 0 || masaTunggu > 60) isAnomali = true;

        const refCount = window.SIMAGA_DB.kuesioner.length + 1;
        const refNumber = `SIMAGA/TS/2026/${String(refCount).padStart(4, '0')}`;
        const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

        let item = window.SIMAGA_DB.kuesioner.find(q => q.nim === nim);
        if (item) {
          item.status_karir = status_karir;
          item.data_jawaban = JSON.stringify(data_jawaban);
          item.is_draft = false;
          item.status_validasi = 'menunggu';
          item.is_anomali = isAnomali;
          item.nomor_referensi = refNumber;
          item.tanggal_submit = nowStr;
        } else {
          item = {
            id_kuesioner: 'TRC-' + Date.now(),
            nim,
            id_admin: '',
            periode_survei: 2026,
            status_karir,
            data_jawaban: JSON.stringify(data_jawaban),
            is_draft: false,
            status_validasi: 'menunggu',
            is_anomali: isAnomali,
            nomor_referensi: refNumber,
            tanggal_submit: nowStr
          };
          window.SIMAGA_DB.kuesioner.push(item);
        }

        const alm = window.SIMAGA_DB.alumni.find(a => a.nim === nim);
        if (alm) alm.status_pengisian = 'Telah Mengisi';

        window.syncLocalDB();
        return { status: 'success', message: 'Kuesioner Tracer Study berhasil dikirim.', data: item };
      }
    },

    async validateTracerRespondent(id_kuesioner, status, catatan, id_admin) {
      if (config.mode === 'apps_script' && config.appsScriptUrl) {
        return await requestAppsScript('validateRespondent', { id_kuesioner, status, catatan, id_admin });
      }

      try {
        return await requestNode(`/api/tracer/${id_kuesioner}/validate`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, catatan, id_admin })
        });
      } catch (err) {
        const item = window.SIMAGA_DB.kuesioner.find(q => q.id_kuesioner === id_kuesioner);
        if (item) {
          item.status_validasi = status;
          item.id_admin = id_admin || 'ADM-001';

          const al = window.SIMAGA_DB.alumni.find(a => a.nim === item.nim);
          if (al) {
            window.SIMAGA_DB.notifikasi.push({
              id_notifikasi: 'NTF-' + Date.now(),
              id_user: al.id_user,
              jenis: 'tracer_study',
              judul: status === 'tervalidasi' ? 'Tracer Study Sah' : 'Klarifikasi Kuesioner',
              pesan: status === 'tervalidasi' 
                ? 'Data kuesioner Anda telah disahkan oleh Career Center.'
                : `Mohon klarifikasi kuesioner Anda: ${catatan}`,
              is_dibaca: false,
              tanggal_kirim: new Date().toISOString().replace('T', ' ').substring(0, 19)
            });
          }

          window.syncLocalDB();
          return { status: 'success', message: `Responden berhasil diperbarui menjadi ${status}.`, data: item };
        }
        return { status: 'error', message: 'Data tidak ditemukan' };
      }
    },

    // 5. DASBOR ANALITIK ADMIN (UC-12, UC-14, UC-15)
    async getAdminDashboard(filter = {}) {
      if (config.mode === 'apps_script' && config.appsScriptUrl) {
        return await requestAppsScript('getAdminDashboard', filter, 'GET');
      }

      try {
        const q = new URLSearchParams(filter).toString();
        return await requestNode(`/api/admin/dashboard?${q}`);
      } catch (err) {
        let alumni = window.SIMAGA_DB.alumni;
        if (filter.prodi && filter.prodi !== 'all') alumni = alumni.filter(a => a.prodi === filter.prodi);
        if (filter.tahun_lulus && filter.tahun_lulus !== 'all') alumni = alumni.filter(a => String(a.tahun_lulus) === String(filter.tahun_lulus));

        const totalTargetAlumni = alumni.length;
        const nims = new Set(alumni.map(a => a.nim));

        const respondents = window.SIMAGA_DB.kuesioner.filter(q => nims.has(q.nim) && !q.is_draft);
        const tervalidasi = respondents.filter(q => q.status_validasi === 'tervalidasi');

        let sumMasa = 0, countMasa = 0;
        let b = 0, w = 0, s = 0, m = 0;

        tervalidasi.forEach(r => {
          let j = {};
          try { j = JSON.parse(r.data_jawaban); } catch(e){}
          if (r.status_karir === 'Bekerja') {
            b++;
            if (j.masa_tunggu !== undefined && j.masa_tunggu !== '') {
              sumMasa += Number(j.masa_tunggu);
              countMasa++;
            }
          } else if (r.status_karir === 'Wirausaha') {
            w++;
          } else if (r.status_karir === 'Melanjutkan Studi') {
            s++;
          } else {
            m++;
          }
        });

        const responseRate = totalTargetAlumni > 0 ? Math.round((respondents.length / totalTargetAlumni) * 100) : 0;
        const avgMasaTunggu = countMasa > 0 ? (sumMasa / countMasa).toFixed(1) : '0.0';
        const capaianIKU1 = tervalidasi.length > 0 ? Math.round(((b + w + s) / tervalidasi.length) * 100) : 0;

        return {
          status: 'success',
          data: {
            metrics: {
              totalTargetAlumni,
              totalResponden: respondents.length,
              totalTervalidasi: tervalidasi.length,
              responseRate,
              avgMasaTunggu,
              capaianIKU1
            },
            distribution: {
              bekerja: b,
              wirausaha: w,
              studiLanjut: s,
              mencariKerja: m
            }
          }
        };
      }
    },

    async sendMassReminder(filter_prodi, filter_tahun, id_admin) {
      if ((config.mode === 'apps_script' || config.mode === 'auto') && config.appsScriptUrl) {
        try {
          return await requestAppsScript('sendMassReminder', { filter_prodi, filter_tahun, id_admin });
        } catch (e) {
          console.warn('[API Client] Apps Script sendMassReminder gagal, mencoba fallback:', e.message);
        }
      }

      try {
        return await requestNode('/api/admin/reminders/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filter_prodi, filter_tahun, id_admin })
        });
      } catch (err) {
        // Strictly filter only Alumni who haven't filled
        let targets = window.SIMAGA_DB.alumni.filter(a => a.status_pengisian === 'Belum Mengisi');
        if (filter_prodi && filter_prodi !== 'all') targets = targets.filter(a => a.prodi === filter_prodi);
        if (filter_tahun && filter_tahun !== 'all') targets = targets.filter(a => String(a.tahun_lulus) === String(filter_tahun));

        const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const todayDate = nowStr.slice(0, 10);

        targets.forEach(t => {
          // Cegah double notifikasi di local store
          const alreadySent = window.SIMAGA_DB.notifikasi.some(n => 
            n.id_user === t.id_user && 
            n.jenis === 'tracer_study' && 
            n.judul.includes('Pengingat') && 
            n.tanggal_kirim.startsWith(todayDate)
          );

          if (!alreadySent) {
            window.SIMAGA_DB.notifikasi.push({
              id_notifikasi: 'NTF-' + Date.now() + '-' + Math.floor(Math.random() * 100),
              id_user: t.id_user,
              jenis: 'tracer_study',
              judul: 'Pengingat Pengisian Tracer Study FILKOM UB',
              pesan: 'Mohon luangkan waktu Anda untuk mengisi kuesioner pelacakan alumni SIMAGA FILKOM UB.',
              is_dibaca: false,
              tanggal_kirim: nowStr
            });
          }
        });

        window.SIMAGA_DB.riwayat_pengingat.push({
          id_pengingat: 'RMD-' + Date.now(),
          id_admin: id_admin || 'ADM-001',
          filter_target: `${filter_prodi || 'Semua Prodi'} (${filter_tahun || 'Semua Angkatan'})`,
          jumlah_penerima: targets.length,
          tanggal_kirim: nowStr
        });

        window.syncLocalDB();
        return {
          status: 'success',
          message: `Surel pengingat berhasil dikirim ke ${targets.length} alumni.`,
          count: targets.length
        };
      }
    },

    // 5B. MANAJEMEN PENGGUNA (Admin UC / Point 13)
    async getUsers() {
      if ((config.mode === 'apps_script' || config.mode === 'auto') && config.appsScriptUrl) {
        try {
          const res = await requestAppsScript('getUsers', {}, 'GET');
          if (res && res.data) {
            // Deduplicate list by id_user
            const userMap = new Map();
            res.data.forEach(u => {
              if (u && u.id_user && !userMap.has(u.id_user)) {
                userMap.set(u.id_user, u);
              }
            });
            return { status: 'success', data: Array.from(userMap.values()) };
          }
        } catch (e) {
          console.warn('[API Client] Apps Script getUsers fallback:', e.message);
        }
      }

      try {
        const res = await requestNode('/api/users');
        if (res && res.data) {
          const userMap = new Map();
          res.data.forEach(u => {
            if (u && u.id_user && !userMap.has(u.id_user)) {
              userMap.set(u.id_user, u);
            }
          });
          return { status: 'success', data: Array.from(userMap.values()) };
        }
        return res;
      } catch (err) {
        // Fallback local mock store
        const userMap = new Map();
        window.SIMAGA_DB.pengguna.forEach(u => {
          if (!userMap.has(u.id_user)) {
            let profile = {};
            if (u.role === 'Mahasiswa') profile = window.SIMAGA_DB.mahasiswa.find(m => m.id_user === u.id_user) || {};
            else if (u.role === 'Alumni') profile = window.SIMAGA_DB.alumni.find(a => a.id_user === u.id_user) || {};
            else if (u.role === 'MitraIndustri') profile = window.SIMAGA_DB.mitra_industri.find(p => p.id_user === u.id_user) || {};
            else if (u.role === 'Admin') profile = window.SIMAGA_DB.admin.find(ad => ad.id_user === u.id_user) || {};
            userMap.set(u.id_user, { ...u, profile });
          }
        });
        return { status: 'success', data: Array.from(userMap.values()) };
      }
    },

    async createUser(userData) {
      if ((config.mode === 'apps_script' || config.mode === 'auto') && config.appsScriptUrl) {
        try {
          const res = await requestAppsScript('createUser', userData);
          if (res && res.status === 'success') {
            // Also sync in local store to keep instant UI response
            if (res.data?.user) {
              const u = res.data.user;
              if (!window.SIMAGA_DB.pengguna.some(x => x.id_user === u.id_user)) {
                window.SIMAGA_DB.pengguna.push(u);
                if (res.data.profile) {
                  if (u.role === 'Mahasiswa') window.SIMAGA_DB.mahasiswa.push(res.data.profile);
                  else if (u.role === 'Alumni') window.SIMAGA_DB.alumni.push(res.data.profile);
                  else if (u.role === 'MitraIndustri') window.SIMAGA_DB.mitra_industri.push(res.data.profile);
                  else if (u.role === 'Admin') window.SIMAGA_DB.admin.push(res.data.profile);
                }
                window.syncLocalDB();
              }
            }
            return res;
          }
        } catch (e) {
          console.warn('[API Client] Apps Script createUser fallback:', e.message);
        }
      }

      try {
        const res = await requestNode('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData)
        });
        return res;
      } catch (err) {
        const newId = 'USR-' + String(window.SIMAGA_DB.pengguna.length + 1).padStart(3, '0') + '-' + Date.now().toString().slice(-4);
        const newUser = {
          id_user: newId,
          email: userData.email,
          password_hash: userData.password || 'ub123456',
          nama_lengkap: userData.nama_lengkap,
          role: userData.role,
          status_akun: userData.status_akun || 'aktif'
        };
        window.SIMAGA_DB.pengguna.push(newUser);

        let profile = {};
        if (userData.role === 'Mahasiswa') {
          profile = {
            nim: userData.nim || ('255150' + Date.now().toString().slice(-8)),
            id_user: newId,
            prodi: userData.prodi || 'Sistem Informasi',
            angkatan: Number(userData.angkatan) || 2025,
            ipk: Number(userData.ipk) || 3.75
          };
          window.SIMAGA_DB.mahasiswa.push(profile);
        } else if (userData.role === 'Alumni') {
          profile = {
            nim: userData.nim || ('215150' + Date.now().toString().slice(-8)),
            id_user: newId,
            prodi: userData.prodi || 'Sistem Informasi',
            tahun_lulus: Number(userData.tahun_lulus) || 2025,
            status_pengisian: 'Belum Mengisi'
          };
          window.SIMAGA_DB.alumni.push(profile);
        } else if (userData.role === 'MitraIndustri') {
          profile = {
            id_mitra: 'MTR-' + Date.now().toString().slice(-4),
            id_user: newId,
            nama_perusahaan: userData.nama_perusahaan || userData.nama_lengkap,
            alamat: userData.alamat || 'Malang, Jawa Timur',
            kontak_person: userData.kontak_person || userData.nama_lengkap,
            no_telepon: userData.no_telepon || '08123456789',
            status_kemitraan: 'aktif'
          };
          window.SIMAGA_DB.mitra_industri.push(profile);
        } else if (userData.role === 'Admin') {
          profile = {
            id_admin: 'ADM-' + Date.now().toString().slice(-4),
            id_user: newId,
            unit_kerja: userData.unit_kerja || 'Career & Internship'
          };
          window.SIMAGA_DB.admin.push(profile);
        }

        window.syncLocalDB();
        return {
          status: 'success',
          message: 'Pengguna berhasil dibuat dan disinkronkan ke basis data.',
          data: { user: newUser, profile }
        };
      }
    },

    async updateUser(id_user, userData) {
      if ((config.mode === 'apps_script' || config.mode === 'auto') && config.appsScriptUrl) {
        try {
          const res = await requestAppsScript('updateUser', { id_user, ...userData });
          if (res && res.status === 'success') {
            return res;
          }
        } catch (e) {
          console.warn('[API Client] Apps Script updateUser fallback:', e.message);
        }
      }

      try {
        const res = await requestNode(`/api/users/${id_user}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData)
        });
        return res;
      } catch (err) {
        const u = window.SIMAGA_DB.pengguna.find(item => item.id_user === id_user);
        if (u) {
          if (userData.nama_lengkap) u.nama_lengkap = userData.nama_lengkap;
          if (userData.email) u.email = userData.email;
          if (userData.status_akun) u.status_akun = userData.status_akun;
          if (userData.password) u.password_hash = userData.password;

          if (u.role === 'Mahasiswa') {
            let m = window.SIMAGA_DB.mahasiswa.find(item => item.id_user === id_user);
            if (m) {
              if (userData.nim) m.nim = userData.nim;
              if (userData.prodi) m.prodi = userData.prodi;
              if (userData.angkatan) m.angkatan = Number(userData.angkatan);
            }
          } else if (u.role === 'Alumni') {
            let a = window.SIMAGA_DB.alumni.find(item => item.id_user === id_user);
            if (a) {
              if (userData.nim) a.nim = userData.nim;
              if (userData.prodi) a.prodi = userData.prodi;
              if (userData.tahun_lulus) a.tahun_lulus = Number(userData.tahun_lulus);
            }
          } else if (u.role === 'MitraIndustri') {
            let p = window.SIMAGA_DB.mitra_industri.find(item => item.id_user === id_user);
            if (p) {
              if (userData.nama_perusahaan) p.nama_perusahaan = userData.nama_perusahaan;
              if (userData.alamat) p.alamat = userData.alamat;
              if (userData.kontak_person) p.kontak_person = userData.kontak_person;
              if (userData.no_telepon) p.no_telepon = userData.no_telepon;
            }
          } else if (u.role === 'Admin') {
            let ad = window.SIMAGA_DB.admin.find(item => item.id_user === id_user);
            if (ad) {
              if (userData.unit_kerja) ad.unit_kerja = userData.unit_kerja;
            }
          }
          window.syncLocalDB();
          return { status: 'success', message: 'Data pengguna berhasil diperbarui.', data: u };
        }
        throw err;
      }
    },

    async deleteUser(id_user) {
      if ((config.mode === 'apps_script' || config.mode === 'auto') && config.appsScriptUrl) {
        try {
          const res = await requestAppsScript('deleteUser', { id_user });
          if (res && res.status === 'success') {
            return res;
          }
        } catch (e) {
          console.warn('[API Client] Apps Script deleteUser fallback:', e.message);
        }
      }

      try {
        const res = await requestNode(`/api/users/${id_user}`, { method: 'DELETE' });
        return res;
      } catch (err) {
        window.SIMAGA_DB.pengguna = window.SIMAGA_DB.pengguna.filter(u => u.id_user !== id_user);
        window.SIMAGA_DB.mahasiswa = window.SIMAGA_DB.mahasiswa.filter(m => m.id_user !== id_user);
        window.SIMAGA_DB.alumni = window.SIMAGA_DB.alumni.filter(a => a.id_user !== id_user);
        window.SIMAGA_DB.mitra_industri = window.SIMAGA_DB.mitra_industri.filter(p => p.id_user !== id_user);
        window.SIMAGA_DB.admin = window.SIMAGA_DB.admin.filter(ad => ad.id_user !== id_user);
        window.syncLocalDB();
        return { status: 'success', message: 'Pengguna berhasil dihapus.' };
      }
    },

    // 5C. MANAJEMEN LOWONGAN MITRA (UPDATE & DELETE)
    async updateVacancy(id_lowongan, data) {
      if ((config.mode === 'apps_script' || config.mode === 'auto') && config.appsScriptUrl) {
        try {
          const res = await requestAppsScript('updateVacancy', { id_lowongan, ...data });
          if (res && res.status === 'success') return res;
        } catch (e) {
          console.warn('[API Client] Apps Script updateVacancy fallback:', e.message);
        }
      }

      try {
        const res = await requestNode(`/api/vacancies/${id_lowongan}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        return res;
      } catch (err) {
        const v = window.SIMAGA_DB.lowongan.find(item => item.id_lowongan === id_lowongan);
        if (v) {
          Object.assign(v, data);
          window.syncLocalDB();
          return { status: 'success', message: 'Lowongan berhasil diperbarui.', data: v };
        }
        throw err;
      }
    },

    async deleteVacancy(id_lowongan) {
      if ((config.mode === 'apps_script' || config.mode === 'auto') && config.appsScriptUrl) {
        try {
          const res = await requestAppsScript('deleteVacancy', { id_lowongan });
          if (res && res.status === 'success') return res;
        } catch (e) {
          console.warn('[API Client] Apps Script deleteVacancy fallback:', e.message);
        }
      }

      try {
        const res = await requestNode(`/api/vacancies/${id_lowongan}`, { method: 'DELETE' });
        return res;
      } catch (err) {
        window.SIMAGA_DB.lowongan = window.SIMAGA_DB.lowongan.filter(item => item.id_lowongan !== id_lowongan);
        window.syncLocalDB();
        return { status: 'success', message: 'Lowongan berhasil dihapus.' };
      }
    },

    // 5D. ALUMNI JOB APPLICATION (Point 7)
    async submitJobApplication(id_lowongan, id_user, payload = {}) {
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const id_pendaftaran = 'REG-ALM-' + Date.now().toString().slice(-6);

      const appRec = {
        id_pendaftaran,
        id_lowongan,
        id_user,
        status_seleksi: 'berkas_terkirim',
        catatan_seleksi: payload.catatan || 'Lamaran pekerjaan Anda sedang dalam antrean seleksi HRD.',
        tanggal_daftar: nowStr
      };

      try {
        const formData = new FormData();
        formData.append('id_lowongan', id_lowongan);
        formData.append('id_user', id_user);
        formData.append('catatan_seleksi', appRec.catatan_seleksi);

        const files = payload.files || [];
        files.forEach(f => {
          const fieldName = f.jenis === 'CV' ? 'cv' :
                            f.jenis === 'Transkrip' ? 'transkrip' :
                            f.jenis === 'Portofolio' ? 'portofolio' : 'tambahan';
          if (f.fileObject) {
            formData.append(fieldName, f.fileObject, f.filename);
          } else {
            const blob = new Blob(['%PDF-1.4 Mock Alumni Document Content'], { type: 'application/pdf' });
            formData.append(fieldName, blob, f.filename);
          }
        });

        const res = await fetch('/api/applications', {
          method: 'POST',
          body: formData
        });
        return await res.json();
      } catch (e) {
        window.SIMAGA_DB.pendaftaran.push(appRec);
        (payload.files || []).forEach((f, idx) => {
          window.SIMAGA_DB.berkas_persyaratan.push({
            id_berkas: `BRK-${id_pendaftaran}-${idx + 1}`,
            id_pendaftaran,
            jenis_berkas: f.jenis,
            nama_file: f.filename,
            ukuran_kb: f.size_kb || 500,
            drive_file_id: 'mock_drive_' + Date.now(),
            drive_url: f.fileObject ? URL.createObjectURL(f.fileObject) : '',
            tanggal_unggah: nowStr
          });
        });
        window.SIMAGA_DB.notifikasi.push({
          id_notifikasi: 'NTF-' + Date.now(),
          id_user,
          jenis: 'lamaran_kerja',
          judul: 'Lamaran Pekerjaan Terkirim',
          pesan: `Lamaran pekerjaan Anda berhasil dikirim dengan ID ${id_pendaftaran}. Mitra industri akan meninjau kualifikasi Anda.`,
          is_dibaca: false,
          tanggal_kirim: nowStr
        });
        window.syncLocalDB();
        return {
          status: 'success',
          message: 'Lamaran pekerjaan berhasil dikirim ke mitra industri.',
          data: appRec
        };
      }
    },

    // 6. NOTIFIKASI
    async getNotifications(id_user) {
      let rawList = [];
      if ((config.mode === 'apps_script' || config.mode === 'auto') && config.appsScriptUrl) {
        try {
          const res = await requestAppsScript('getNotifications', { id_user }, 'GET');
          if (res && res.data) rawList = res.data;
        } catch (e) {
          console.warn('[API Client] Apps Script getNotifications fallback:', e.message);
        }
      }

      if (rawList.length === 0) {
        try {
          const res = await requestNode(`/api/notifications?id_user=${id_user}`);
          if (res && res.data) rawList = res.data;
        } catch (err) {
          rawList = window.SIMAGA_DB.notifikasi || [];
          if (id_user) rawList = rawList.filter(n => n.id_user === id_user);
        }
      }

      // Deduplikasi notifikasi agar tidak muncul ganda di UI
      const seenNotif = new Set();
      const deduped = [];
      rawList.forEach(n => {
        const key = n.id_notifikasi || `${n.id_user}-${n.judul}-${(n.tanggal_kirim || '').slice(0, 10)}`;
        if (!seenNotif.has(key)) {
          seenNotif.add(key);
          deduped.push(n);
        }
      });

      return { status: 'success', data: deduped };
    },

    async markNotificationRead(id_notifikasi) {
      try {
        await requestNode(`/api/notifications/${id_notifikasi}/read`, { method: 'PUT' });
      } catch (err) {
        const notif = window.SIMAGA_DB.notifikasi.find(n => n.id_notifikasi === id_notifikasi);
        if (notif) notif.is_dibaca = true;
        window.syncLocalDB();
      }
    }
  };
})();
