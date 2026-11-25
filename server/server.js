const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
require('dotenv').config();

const { 
  findUser, 
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getAllVacancies, 
  addVacancy, 
  updateVacancy,
  deleteVacancy,
  getAllApplications, 
  getTracerSubmissions, 
  mockDB,
  saveMockDB,
  resetMockDB,
  appendTableRow,
  getTableData
} = require('./services/sheetsService');
const { uploadApplicationFile, LOCAL_UPLOAD_DIR } = require('./services/driveService');
const { generateTracerProofPDF } = require('./services/pdfService');

const app = express();
const PORT = process.env.PORT || 3000;

// Railway/Render berada di belakang reverse proxy: agar req.protocol bernilai 'https'
app.set('trust proxy', true);

/**
 * Bangun URL absolut (https://host/...) dari path relatif, agar tautan berkas
 * tidak pernah jatuh ke fallback SPA dan kembali ke halaman SIMAGA.
 */
function toAbsoluteUrl(req, url) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  const base = (process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/+$/, '');
  return base + (url.startsWith('/') ? url : '/' + url);
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files for Frontend UI (termasuk /sample-berkas/*.pdf untuk data demo)
app.use(express.static(path.join(__dirname, '../public')));

// Berkas PDF yang diunggah saat mode lokal/mock (tanpa Google Drive API)
app.use('/uploads', express.static(LOCAL_UPLOAD_DIR, {
  setHeaders: (res) => res.setHeader('Content-Disposition', 'inline')
}));

// Multer memory storage untuk upload 3 berkas lamaran
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB per file
});

/**
 * ==============================================================================
 * 1. AUTENTIKASI PENGGUNA (UC-16)
 * ==============================================================================
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ status: 'error', message: 'Surel/NIM dan kata sandi wajib diisi.' });
    }

    const result = await findUser(identifier);
    if (!result) {
      return res.status(401).json({ status: 'error', message: 'Kombinasi surel/NIM dan kata sandi salah.' });
    }

    const { user, profile } = result;

    if (user.password_hash !== password) {
      return res.status(401).json({ status: 'error', message: 'Kombinasi surel/NIM dan kata sandi salah.' });
    }

    if (user.status_akun !== 'aktif') {
      return res.status(403).json({ status: 'error', message: 'Akun Anda sedang dinonaktifkan, hubungi unit Career Center.' });
    }

    // Token simulasi session terenkripsi
    const token = 'simaga_token_' + Buffer.from(user.id_user + ':' + Date.now()).toString('base64');

    res.json({
      status: 'success',
      message: 'Login berhasil',
      data: {
        token,
        user: {
          id_user: user.id_user,
          email: user.email,
          nama_lengkap: user.nama_lengkap,
          role: user.role,
          status_akun: user.status_akun
        },
        profile
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * Health Check & Status
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '2.0.0', timestamp: new Date().toISOString() });
});

/**
 * Manajemen Pengguna (Admin UC / Point 13)
 */
app.get('/api/users', async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json({ status: 'success', data: users });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { email, password, nama_lengkap, role, nim, prodi, angkatan, tahun_lulus, nama_perusahaan, unit_kerja } = req.body;
    if (!email || !nama_lengkap || !role) {
      return res.status(400).json({ status: 'error', message: 'Email, Nama Lengkap, dan Role wajib diisi.' });
    }
    const result = await createUser(req.body);
    res.status(201).json({ status: 'success', message: 'Pengguna berhasil dibuat dan disinkronkan ke Google Sheets.', data: result });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const result = await updateUser(req.params.id, req.body);
    res.json({ status: 'success', message: 'Data pengguna berhasil diperbarui.', data: result });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const result = await deleteUser(req.params.id);
    res.json({ status: 'success', message: 'Pengguna berhasil dihapus.', data: result });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * ==============================================================================
 * 2. MODUL LOWONGAN KERJA & MAGANG (UC-01, UC-03, UC-10, UC-11)
 * ==============================================================================
 */

// Mendapatkan katalog lowongan (dengan filter dan pencarian)
app.get('/api/vacancies', async (req, res) => {
  try {
    const { keyword, jenis, bidang, lokasi, status } = req.query;
    let vacancies = await getAllVacancies();

    // Filter status (default hanya 'aktif' untuk publik)
    if (status) {
      if (status !== 'all') {
        vacancies = vacancies.filter(v => v.status_publikasi === status);
      }
    } else {
      vacancies = vacancies.filter(v => v.status_publikasi === 'aktif');
    }

    // Filter jenis kesempatan
    if (jenis && jenis !== 'all') {
      vacancies = vacancies.filter(v => v.jenis_kesempatan === jenis);
    }

    // Filter bidang keahlian (UI/UX Design, Web & Mobile Development, Data & AI, ...)
    if (bidang && bidang !== 'all') {
      vacancies = vacancies.filter(v => v.bidang_keahlian === bidang);
    }

    // Filter lokasi
    if (lokasi && lokasi !== 'all') {
      vacancies = vacancies.filter(v => v.lokasi.toLowerCase().includes(lokasi.toLowerCase()));
    }

    // Pencarian kata kunci posisi / keahlian
    if (keyword && keyword.trim() !== '') {
      const q = keyword.toLowerCase().trim();
      vacancies = vacancies.filter(v => 
        (v.judul_posisi && v.judul_posisi.toLowerCase().includes(q)) ||
        (v.deskripsi && v.deskripsi.toLowerCase().includes(q)) ||
        (v.kualifikasi && v.kualifikasi.toLowerCase().includes(q))
      );
    }

    res.json({ status: 'success', data: vacancies });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Mitra mengajukan lowongan baru (PC-01, UC-01)
app.post('/api/vacancies', async (req, res) => {
  try {
    const { 
      id_mitra, id_user, judul_posisi, jenis_kesempatan, bidang_keahlian,
      deskripsi, kualifikasi, lokasi, periode_mulai, 
      periode_selesai, kuota, batas_pendaftaran 
    } = req.body;

    // Validasi input wajib
    if (!judul_posisi || !deskripsi || !kualifikasi || !lokasi || !periode_mulai || !periode_selesai || !batas_pendaftaran) {
      return res.status(400).json({ status: 'error', message: 'Semua atribut formulir lowongan wajib dilengkapi.' });
    }

    // Validasi Tanggal
    const today = new Date();
    today.setHours(0,0,0,0);
    const deadline = new Date(batas_pendaftaran);
    const startDate = new Date(periode_mulai);
    const endDate = new Date(periode_selesai);

    if (deadline < today) {
      return res.status(400).json({ status: 'error', message: 'Tanggal tenggat pendaftaran harus lebih besar dari hari ini.' });
    }

    if (endDate < startDate) {
      return res.status(400).json({ status: 'error', message: 'Periode selesai harus lebih besar atau sama dengan periode mulai.' });
    }

    if (Number(kuota) <= 0) {
      return res.status(400).json({ status: 'error', message: 'Kuota penerimaan harus lebih dari 0.' });
    }

    const created = await addVacancy({
      id_mitra: id_mitra || 'MTR-101',
      judul_posisi,
      jenis_kesempatan: jenis_kesempatan || 'Magang Bersertifikat',
      bidang_keahlian,
      deskripsi,
      kualifikasi,
      lokasi,
      periode_mulai,
      periode_selesai,
      kuota: Number(kuota),
      batas_pendaftaran
    });

    // Kirim notifikasi ke Admin unit Career & Internship
    const id_notif = 'NTF-' + Date.now();
    await appendTableRow('notifikasi', {
      id_notifikasi: id_notif,
      id_user: 'USR-004', // Admin
      jenis: 'kurasi_lowongan',
      judul: 'Pengajuan Lowongan Baru',
      pesan: `Mitra industri mengajukan lowongan '${judul_posisi}'. Menunggu kurasi fakultas.`,
      is_dibaca: false,
      tanggal_kirim: new Date().toISOString().replace('T', ' ').substring(0, 19)
    });

    res.json({
      status: 'success',
      message: 'Lowongan berhasil diajukan dan sedang menunggu kurasi pihak Career & Internship.',
      data: created
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Edit Lowongan oleh Mitra Industri
app.put('/api/vacancies/:id', async (req, res) => {
  try {
    const vacancies = await getAllVacancies();
    const target = vacancies.find(v => v.id_lowongan === req.params.id);
    if (target && target.status_publikasi === 'ditolak') {
      return res.status(400).json({ status: 'error', message: 'Lowongan yang telah ditolak oleh admin tidak dapat diedit kembali.' });
    }
    const result = await updateVacancy(req.params.id, req.body);
    res.json({ status: 'success', message: 'Lowongan berhasil diperbarui.', data: result });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Hapus Lowongan oleh Mitra Industri
app.delete('/api/vacancies/:id', async (req, res) => {
  try {
    const result = await deleteVacancy(req.params.id);
    res.json({ status: 'success', message: 'Lowongan berhasil dihapus.', data: result });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Admin melakukan kurasi / persetujuan lowongan (PC-08, UC-11)
app.put('/api/vacancies/:id/curate', async (req, res) => {
  try {
    const { id } = req.params;
    const { keputusan, catatan_revisi, id_admin } = req.body; // keputusan: 'aktif' atau 'ditolak'

    if (!['aktif', 'ditolak'].includes(keputusan)) {
      return res.status(400).json({ status: 'error', message: 'Keputusan tidak dikenal. Pilih "aktif" atau "ditolak".' });
    }

    if (keputusan === 'ditolak' && (!catatan_revisi || catatan_revisi.trim() === '')) {
      return res.status(400).json({ status: 'error', message: 'Alasan penolakan wajib diisi pada kolom catatan revisi.' });
    }

    const vacancies = mockDB.lowongan;
    const v = vacancies.find(item => item.id_lowongan === id);
    if (!v) {
      return res.status(404).json({ status: 'error', message: 'Lowongan tidak ditemukan.' });
    }

    v.status_publikasi = keputusan;
    v.id_admin = id_admin || 'ADM-001';
    v.catatan_revisi = catatan_revisi || '';
    saveMockDB();

    // Kirim Notifikasi ke Mitra
    const mitraList = await getTableData('mitra_industri');
    const targetMitra = mitraList.find(m => m.id_mitra === v.id_mitra);
    if (targetMitra) {
      const notifMsg = keputusan === 'aktif'
        ? `Lowongan '${v.judul_posisi}' telah disetujui dan kini aktif dipublikasikan.`
        : `Lowongan '${v.judul_posisi}' ditolak dengan catatan: ${catatan_revisi}`;
      
      await appendTableRow('notifikasi', {
        id_notifikasi: 'NTF-' + Date.now(),
        id_user: targetMitra.id_user,
        jenis: 'kurasi_lowongan',
        judul: keputusan === 'aktif' ? 'Lowongan Disetujui' : 'Lowongan Ditolak',
        pesan: notifMsg,
        is_dibaca: false,
        tanggal_kirim: new Date().toISOString().replace('T', ' ').substring(0, 19)
      });
    }

    res.json({
      status: 'success',
      message: `Status lowongan berhasil diperbarui menjadi '${keputusan}'.`,
      data: v
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * ==============================================================================
 * 3. PENDAFTARAN MAGANG & UNGGAH GOOGLE DRIVE (PC-03, PC-09, UC-04, UC-05, UC-06)
 * ==============================================================================
 */

// Mengambil daftar pendaftaran
app.get('/api/applications', async (req, res) => {
  try {
    const { id_user, id_mitra } = req.query;
    const apps = await getAllApplications({ id_user, id_mitra });
    res.json({ status: 'success', data: apps });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Pendaftaran magang / pekerjaan dengan unggah berkas PDF ke Google Drive
app.post('/api/applications', upload.fields([
  { name: 'cv', maxCount: 1 },
  { name: 'transkrip', maxCount: 1 },
  { name: 'rekomendasi', maxCount: 1 },
  { name: 'portofolio', maxCount: 1 },
  { name: 'tambahan', maxCount: 1 }
]), async (req, res) => {
  try {
    const { id_lowongan, id_user, catatan_seleksi } = req.body;
    if (!id_lowongan || !id_user) {
      return res.status(400).json({ status: 'error', message: 'ID lowongan dan ID user wajib disertakan.' });
    }

    // Cek duplikasi pendaftaran
    const existingApps = await getAllApplications();
    const alreadyApplied = existingApps.some(a => a.id_lowongan === id_lowongan && a.id_user === id_user);
    if (alreadyApplied) {
      return res.status(400).json({ status: 'error', message: 'Anda sudah pernah mendaftar pada lowongan ini.' });
    }

    // Identifikasi jenis lowongan
    const allVacancies = await getAllVacancies();
    const targetVac = allVacancies.find(v => v.id_lowongan === id_lowongan);
    const isPekerjaan = targetVac && targetVac.jenis_kesempatan === 'Pekerjaan';

    const cvFile = req.files && req.files['cv'] && req.files['cv'][0];
    const transkripFile = req.files && req.files['transkrip'] && req.files['transkrip'][0];
    const rekomendasiFile = req.files && req.files['rekomendasi'] && req.files['rekomendasi'][0];
    const portofolioFile = req.files && req.files['portofolio'] && req.files['portofolio'][0];
    const tambahanFile = req.files && req.files['tambahan'] && req.files['tambahan'][0];

    // Validasi kelengkapan berkas wajib
    if (isPekerjaan) {
      if (!cvFile) {
        return res.status(400).json({
          status: 'error',
          message: 'Wajib mengunggah Curriculum Vitae (CV) terbaru (.pdf, maks 5 MB).'
        });
      }
    } else {
      if (!cvFile || !transkripFile || !rekomendasiFile) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Wajib mengunggah ketiga berkas persyaratan magang: CV, Transkrip Nilai, dan Surat Rekomendasi Fakultas (.pdf, maks 5 MB).' 
        });
      }
    }

    const filesToUpload = [];
    if (cvFile) filesToUpload.push({ jenis: 'CV', file: cvFile });
    if (transkripFile) filesToUpload.push({ jenis: 'Transkrip', file: transkripFile });
    if (rekomendasiFile) filesToUpload.push({ jenis: 'Surat Rekomendasi', file: rekomendasiFile });
    if (portofolioFile) filesToUpload.push({ jenis: 'Portofolio', file: portofolioFile });
    if (tambahanFile) filesToUpload.push({ jenis: 'Dokumen Tambahan', file: tambahanFile });

    // Validasi MIME & Ukuran
    for (const item of filesToUpload) {
      if (item.file.mimetype !== 'application/pdf' && !item.file.originalname.toLowerCase().endsWith('.pdf')) {
        return res.status(400).json({ status: 'error', message: `Berkas ${item.jenis} harus berformat .pdf.` });
      }
      if (item.file.size > 5 * 1024 * 1024) {
        return res.status(400).json({ status: 'error', message: `Ukuran berkas ${item.jenis} melebihi 5 MB.` });
      }
    }

    const id_pendaftaran = (isPekerjaan ? 'REG-ALM-' : 'REG-') + Date.now().toString().slice(-6);
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // Upload berkas ke Google Drive di folder SIMAGA_Storage/Pendaftaran_{id_pendaftaran}
    const uploadedRecords = [];
    for (let i = 0; i < filesToUpload.length; i++) {
      const { jenis, file } = filesToUpload[i];
      const driveResult = await uploadApplicationFile(id_pendaftaran, file.buffer, file.originalname, file.mimetype);

      const berkasRecord = {
        id_berkas: `BRK-${id_pendaftaran}-${i + 1}`,
        id_pendaftaran: id_pendaftaran,
        jenis_berkas: jenis,
        nama_file: file.originalname,
        ukuran_kb: Math.round(file.size / 1024),
        drive_file_id: driveResult.fileId,
        // Selalu simpan URL absolut https:// (Drive webViewLink, atau /uploads/... milik server ini)
        drive_url: toAbsoluteUrl(req, driveResult.webViewLink),
        tanggal_unggah: nowStr
      };

      await appendTableRow('berkas_persyaratan', berkasRecord);
      uploadedRecords.push(berkasRecord);
    }

    // Simpan data pendaftaran
    const pendaftaranRecord = {
      id_pendaftaran,
      id_lowongan,
      id_user,
      status_seleksi: 'berkas_terkirim',
      catatan_seleksi: catatan_seleksi || (isPekerjaan ? 'Lamaran pekerjaan Anda sedang dalam antrean seleksi HRD mitra.' : 'Lamaran terkirim dan sedang dalam antrean pemeriksaan berkas.'),
      tanggal_daftar: nowStr
    };

    await appendTableRow('pendaftaran', pendaftaranRecord);

    // Notifikasi ke Mahasiswa
    await appendTableRow('notifikasi', {
      id_notifikasi: 'NTF-' + Date.now(),
      id_user: id_user,
      jenis: 'pendaftaran',
      judul: 'Pendaftaran Magang Berhasil',
      pesan: `Lamaran Anda berhasil dikirim dengan ID ${id_pendaftaran}. Berkas PDF tersimpan rapi di Google Drive.`,
      is_dibaca: false,
      tanggal_kirim: nowStr
    });

    res.json({
      status: 'success',
      message: 'Pendaftaran magang berhasil dan 3 berkas PDF telah diunggah ke Google Drive.',
      data: {
        id_pendaftaran,
        status_seleksi: 'berkas_terkirim',
        berkas: uploadedRecords
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Mitra memperbarui tahapan seleksi pelamar (PC-09, UC-02)
app.put('/api/applications/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status_seleksi, catatan_seleksi } = req.body;

    const validStages = ['pemeriksaan_berkas', 'wawancara', 'diterima', 'ditolak'];
    if (!validStages.includes(status_seleksi)) {
      return res.status(400).json({ status: 'error', message: 'Status seleksi tidak valid.' });
    }

    const apps = mockDB.pendaftaran;
    const appItem = apps.find(a => a.id_pendaftaran === id);
    if (!appItem) {
      return res.status(404).json({ status: 'error', message: 'Data pendaftaran tidak ditemukan.' });
    }

    appItem.status_seleksi = status_seleksi;
    appItem.catatan_seleksi = catatan_seleksi || '';
    saveMockDB();

    // Kirim notifikasi ke mahasiswa
    const labelMap = {
      pemeriksaan_berkas: 'Pemeriksaan Berkas',
      wawancara: 'Tahap Wawancara',
      diterima: 'Diterima Magang',
      ditolak: 'Belum Berhasil'
    };

    await appendTableRow('notifikasi', {
      id_notifikasi: 'NTF-' + Date.now(),
      id_user: appItem.id_user,
      jenis: 'status_seleksi',
      judul: 'Pembaruan Tahap Seleksi Magang',
      pesan: `Status lamaran Anda diperbarui menjadi: ${labelMap[status_seleksi]}. Catatan: ${catatan_seleksi || '-'}`,
      is_dibaca: false,
      tanggal_kirim: new Date().toISOString().replace('T', ' ').substring(0, 19)
    });

    res.json({
      status: 'success',
      message: 'Status seleksi berhasil diperbarui.',
      data: appItem
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * ==============================================================================
 * 4. KUESIONER TRACER STUDY & BUKTI PDF + QR (PC-04, PC-05, PC-06, PC-07)
 * ==============================================================================
 */

// Mengambil seluruh kuesioner / milik alumni tertentu
app.get('/api/tracer', async (req, res) => {
  try {
    const { nim } = req.query;
    const list = await getTracerSubmissions();
    if (nim) {
      const found = list.find(q => q.nim === nim);
      return res.json({ status: 'success', data: found || null });
    }
    res.json({ status: 'success', data: list });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Simpan draf kuesioner sementara (PC-04, UC-08)
app.post('/api/tracer/draft', async (req, res) => {
  try {
    const { nim, status_karir, data_jawaban } = req.body;
    if (!nim) {
      return res.status(400).json({ status: 'error', message: 'NIM wajib disertakan.' });
    }

    const list = mockDB.kuesioner;
    let item = list.find(q => q.nim === nim);

    if (item) {
      item.status_karir = status_karir || item.status_karir;
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
      list.push(item);
    }
    saveMockDB();

    res.json({
      status: 'success',
      message: 'Draf isian berhasil disimpan secara aman.',
      data: item
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Kirim final kuesioner Tracer Study (PC-05, UC-07)
app.post('/api/tracer/submit', async (req, res) => {
  try {
    const { nim, status_karir, data_jawaban } = req.body;

    if (!nim || !status_karir) {
      return res.status(400).json({ status: 'error', message: 'Status kondisi karier saat ini wajib dipilih.' });
    }

    // Deteksi Anomali Otomatis sesuai spesifikasi: masa tunggu < 0 atau > 36 bulan,
    // relevansi kurikulum di luar skala 1-5, atau pendapatan di luar rentang wajar.
    let isAnomali = false;
    const nominalGaji = Number(data_jawaban.gaji_nominal) || 0;
    const hasMasaTunggu = data_jawaban.masa_tunggu !== undefined && data_jawaban.masa_tunggu !== '';
    const masaTunggu = Number(data_jawaban.masa_tunggu);
    const hasRelevansi = data_jawaban.keselarasan !== undefined && data_jawaban.keselarasan !== '';
    const relevansi = Number(data_jawaban.keselarasan);

    if (nominalGaji > 50000000 || nominalGaji < 0) {
      isAnomali = true;
    }
    if (hasMasaTunggu && (Number.isNaN(masaTunggu) || masaTunggu < 0 || masaTunggu > 36)) {
      isAnomali = true;
    }
    if (hasRelevansi && (Number.isNaN(relevansi) || relevansi < 1 || relevansi > 5)) {
      isAnomali = true;
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const refCount = mockDB.kuesioner.length + 1;
    const refNumber = `SIMAGA/TS/2026/${String(refCount).padStart(4, '0')}`;

    let item = mockDB.kuesioner.find(q => q.nim === nim);
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
      mockDB.kuesioner.push(item);
    }

    // Update status alumni menjadi 'Telah Mengisi'
    const targetAlumni = mockDB.alumni.find(a => a.nim === nim);
    if (targetAlumni) {
      targetAlumni.status_pengisian = 'Telah Mengisi';
    }
    saveMockDB();

    res.json({
      status: 'success',
      message: 'Kuesioner Tracer Study berhasil dikirim.',
      data: item
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Download Bukti PDF Tanda Terima Ber-QR Code (PC-06, UC-09)
app.get('/api/tracer/:id/pdf', async (req, res) => {
  try {
    const { id } = req.params;
    const kuesioner = mockDB.kuesioner.find(q => q.id_kuesioner === id || q.nim === id);
    if (!kuesioner) {
      return res.status(404).send('Data kuesioner tidak ditemukan.');
    }

    const alumni = mockDB.alumni.find(a => a.nim === kuesioner.nim) || {};
    const user = mockDB.pengguna.find(u => u.id_user === alumni.id_user) || {};

    const alumniInfo = {
      nim: kuesioner.nim,
      nama_lengkap: user.nama_lengkap || 'Alumni FILKOM UB',
      prodi: alumni.prodi || 'Sistem Informasi',
      tahun_lulus: alumni.tahun_lulus || 2025
    };

    const pdfBuffer = await generateTracerProofPDF(kuesioner, alumniInfo);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Bukti_Tracer_Study_${kuesioner.nomor_referensi.replace(/\//g, '_')}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).send('Gagal membuat bukti PDF: ' + error.message);
  }
});

// Admin validasi respon kuesioner (PC-07, UC-13)
app.put('/api/tracer/:id/validate', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, catatan, id_admin } = req.body; // status: 'tervalidasi' atau 'perlu_klarifikasi'

    if (!['tervalidasi', 'perlu_klarifikasi'].includes(status)) {
      return res.status(400).json({ status: 'error', message: 'Status validasi harus "tervalidasi" atau "perlu_klarifikasi".' });
    }

    if (status === 'perlu_klarifikasi' && (!catatan || catatan.trim() === '')) {
      return res.status(400).json({ status: 'error', message: 'Catatan wajib diisi bila status Perlu Klarifikasi.' });
    }

    const kuesioner = mockDB.kuesioner.find(q => q.id_kuesioner === id);
    if (!kuesioner) {
      return res.status(404).json({ status: 'error', message: 'Kuesioner tidak ditemukan.' });
    }

    kuesioner.status_validasi = status;
    kuesioner.id_admin = id_admin || 'ADM-001';
    if (status === 'tervalidasi') {
      kuesioner.is_anomali = false;
    }
    saveMockDB();

    // Jika perlu klarifikasi, kirim notifikasi ke alumni
    const alumni = mockDB.alumni.find(a => a.nim === kuesioner.nim);
    if (alumni) {
      const msg = status === 'tervalidasi'
        ? 'Data kuesioner Tracer Study Anda telah diverifikasi dan disahkan oleh Career Center.'
        : `Terdapat catatan klarifikasi pada kuesioner Anda: ${catatan}. Mohon periksa kembali isian Anda.`;

      await appendTableRow('notifikasi', {
        id_notifikasi: 'NTF-' + Date.now(),
        id_user: alumni.id_user,
        jenis: 'tracer_study',
        judul: status === 'tervalidasi' ? 'Tracer Study Sah' : 'Perlu Klarifikasi Tracer Study',
        pesan: msg,
        is_dibaca: false,
        tanggal_kirim: new Date().toISOString().replace('T', ' ').substring(0, 19)
      });
    }

    res.json({
      status: 'success',
      message: `Status kuesioner berhasil diperbarui menjadi '${status}'.`,
      data: kuesioner
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * ==============================================================================
 * 5. DASBOR ANALITIK IKU 1 & ADMINISTRASI (PC-07, UC-12, UC-14, UC-15)
 * ==============================================================================
 */

// Ringkasan metrik analitik IKU 1
app.get('/api/admin/dashboard', async (req, res) => {
  try {
    const { prodi, tahun_lulus } = req.query;
    let alumni = mockDB.alumni;

    if (prodi && prodi !== 'all') alumni = alumni.filter(a => a.prodi === prodi);
    if (tahun_lulus && tahun_lulus !== 'all') alumni = alumni.filter(a => String(a.tahun_lulus) === String(tahun_lulus));

    const totalTargetAlumni = alumni.length;
    const targetNims = new Set(alumni.map(a => a.nim));

    const submissions = mockDB.kuesioner.filter(q => targetNims.has(q.nim) && !q.is_draft);
    const totalResponden = submissions.length;
    const tervalidasiList = submissions.filter(q => q.status_validasi === 'tervalidasi');
    const totalTervalidasi = tervalidasiList.length;

    const responseRate = totalTargetAlumni > 0 ? Math.round((totalResponden / totalTargetAlumni) * 100) : 0;

    let sumMasaTunggu = 0;
    let countMasaTunggu = 0;
    let countBekerja = 0;
    let countWirausaha = 0;
    let countStudiLanjut = 0;
    let countMencariKerja = 0;

    tervalidasiList.forEach(r => {
      let j = {};
      try { j = JSON.parse(r.data_jawaban); } catch(e){}

      if (r.status_karir === 'Bekerja') {
        countBekerja++;
        if (j.masa_tunggu !== undefined && j.masa_tunggu !== null && j.masa_tunggu !== '') {
          sumMasaTunggu += Number(j.masa_tunggu);
          countMasaTunggu++;
        }
      } else if (r.status_karir === 'Wirausaha') {
        countWirausaha++;
      } else if (r.status_karir === 'Melanjutkan Studi') {
        countStudiLanjut++;
      } else {
        countMencariKerja++;
      }
    });

    const avgMasaTunggu = countMasaTunggu > 0 ? (sumMasaTunggu / countMasaTunggu).toFixed(1) : "0.0";
    const totalSukses = countBekerja + countWirausaha + countStudiLanjut;
    const capaianIKU1 = totalTervalidasi > 0 ? Math.round((totalSukses / totalTervalidasi) * 100) : 0;

    res.json({
      status: 'success',
      data: {
        metrics: {
          totalTargetAlumni,
          totalResponden,
          totalTervalidasi,
          responseRate,
          avgMasaTunggu,
          capaianIKU1
        },
        distribution: {
          bekerja: countBekerja,
          wirausaha: countWirausaha,
          studiLanjut: countStudiLanjut,
          mencariKerja: countMencariKerja
        }
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Kirim pengingat surel massal (UC-14)
// REVISI: HANYA ALUMNI YANG BELUM MENGISI KUESIONER, CEGAH DUPLIKAT NOTIFIKASI
app.post('/api/admin/reminders/send', async (req, res) => {
  try {
    const { filter_prodi, filter_tahun, id_admin } = req.body;
    const todayStr = new Date().toISOString().slice(0, 10);

    // Strictly target alumni who haven't filled survey and have role 'Alumni'
    const alumniList = await getTableData('alumni');
    const usersList = await getTableData('pengguna');
    const userRoleMap = {};
    usersList.forEach(u => { userRoleMap[u.id_user] = u.role; });

    let targets = alumniList.filter(a => {
      if (a.status_pengisian !== 'Belum Mengisi') return false;
      return userRoleMap[a.id_user] === 'Alumni';
    });

    if (filter_prodi && filter_prodi !== 'all') {
      targets = targets.filter(a => a.prodi === filter_prodi);
    }
    if (filter_tahun && filter_tahun !== 'all') {
      targets = targets.filter(a => String(a.tahun_lulus) === String(filter_tahun));
    }

    if (targets.length === 0) {
      return res.json({
        status: 'success',
        message: 'Seluruh alumni pada kelompok ini telah mengisi kuesioner.',
        count: 0
      });
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    let sentCount = 0;

    // Buat notifikasi ke setiap alumni (hanya jika belum dikirim hari ini)
    targets.forEach(t => {
      const alreadySent = mockDB.notifikasi.some(n => 
        n.id_user === t.id_user && 
        n.jenis === 'tracer_study' && 
        n.judul.includes('Pengingat') && 
        n.tanggal_kirim.startsWith(todayStr)
      );

      if (!alreadySent) {
        mockDB.notifikasi.push({
          id_notifikasi: 'NTF-' + Date.now() + '-' + Math.floor(Math.random() * 100),
          id_user: t.id_user,
          jenis: 'tracer_study',
          judul: 'Pengingat Pengisian Tracer Study FILKOM UB',
          pesan: 'Mohon luangkan waktu Anda untuk mengisi kuesioner pelacakan alumni SIMAGA.',
          is_dibaca: false,
          tanggal_kirim: nowStr
        });
        sentCount++;
      }
    });

    // Catat ke riwayat pengingat
    const id_pengingat = 'RMD-' + Date.now();
    const filterLabel = `${filter_prodi || 'Semua Prodi'} (${filter_tahun || 'Semua Angkatan'})`;
    mockDB.riwayat_pengingat.push({
      id_pengingat,
      id_admin: id_admin || 'ADM-001',
      filter_target: filterLabel,
      jumlah_penerima: targets.length,
      tanggal_kirim: nowStr
    });

    // Simpan perubahan notifikasi ke disk agar persisten
    saveMockDB();

    res.json({
      status: 'success',
      message: `Surel pengingat berhasil dikirimkan kepada ${targets.length} alumni.`,
      count: targets.length
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Ekspor Laporan IKU 1 ke Excel (.xlsx) (UC-15)
app.get('/api/admin/export/excel', async (req, res) => {
  try {
    const { prodi, tahun_lulus } = req.query;
    const submissions = await getTracerSubmissions();
    let filtered = submissions.filter(s => !s.is_draft);

    if (prodi && prodi !== 'all') filtered = filtered.filter(s => s.alumni.prodi === prodi);
    if (tahun_lulus && tahun_lulus !== 'all') filtered = filtered.filter(s => String(s.alumni.tahun_lulus) === String(tahun_lulus));

    const exportRows = filtered.map((item, index) => {
      const j = item.data_jawaban_parsed || {};
      return {
        'No': index + 1,
        'Nomor Referensi': item.nomor_referensi,
        'NIM': item.nim,
        'Nama Alumni': item.alumni.nama_lengkap,
        'Program Studi': item.alumni.prodi,
        'Tahun Lulus': item.alumni.tahun_lulus,
        'Status Karier': item.status_karir,
        'Instansi / Usaha': j.instansi || '-',
        'Posisi / Jabatan': j.posisi || '-',
        'Rentang Gaji': j.gaji || '-',
        'Nominal Gaji (Rp)': j.gaji_nominal || 0,
        'Masa Tunggu (Bulan)': j.masa_tunggu !== undefined ? j.masa_tunggu : '-',
        'Relevansi Kurikulum': j.relevansi_kurikulum || '-',
        'Status Validasi': item.status_validasi,
        'Terindikasi Anomali': item.is_anomali ? 'YA' : 'TIDAK',
        'Tanggal Submit': item.tanggal_submit
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan_IKU1_SIMAGA');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Laporan_IKU1_SIMAGA_${Date.now()}.xlsx`);
    res.send(buffer);
  } catch (error) {
    res.status(500).send('Gagal mengekspor laporan: ' + error.message);
  }
});

// Notifikasi
app.get('/api/notifications', (req, res) => {
  const { id_user } = req.query;
  let list = mockDB.notifikasi;
  if (id_user) list = list.filter(n => n.id_user === id_user);
  res.json({ status: 'success', data: list });
});

app.put('/api/notifications/:id/read', (req, res) => {
  const { id } = req.params;
  const notif = mockDB.notifikasi.find(n => n.id_notifikasi === id);
  if (notif) {
    notif.is_dibaca = true;
    saveMockDB();
  }
  res.json({ status: 'success', message: 'Notifikasi ditandai dibaca.' });
});

// Reset data demo ke seed awal (berguna antara gladi & presentasi).
// Hanya aktif bila env DEMO_RESET_KEY di-set; kirim header "x-demo-reset-key".
app.post('/api/admin/reset-demo', (req, res) => {
  const key = process.env.DEMO_RESET_KEY;
  if (!key) return res.status(404).json({ status: 'error', message: 'Fitur reset demo tidak diaktifkan.' });
  if (req.get('x-demo-reset-key') !== key) return res.status(403).json({ status: 'error', message: 'Kunci reset tidak valid.' });
  resetMockDB();
  res.json({ status: 'success', message: 'Data demo dikembalikan ke kondisi seed awal.' });
});

// Fallback routing untuk Single Page Application.
// PENTING: jangan kembalikan index.html untuk API, berkas unggahan, atau path ber-ekstensi
// (mis. .pdf) — sebelumnya inilah penyebab tautan berkas "kembali ke halaman SIMAGA".
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/') ||
      req.path.startsWith('/sample-berkas/') || path.extname(req.path)) {
    return res.status(404).send('Berkas atau sumber daya tidak ditemukan.');
  }
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`========================================================`);
  console.log(`  SIMAGA FILKOM UB Server Berjalan di Port ${PORT}`);
  console.log(`  URL Aplikasi: http://localhost:${PORT}`);
  console.log(`  Mode: ${process.env.GOOGLE_INTEGRATION_MODE || 'Mock / Dual-Engine'}`);
  console.log(`========================================================`);
});
