const path = require('path');
const fs = require('fs');
const { getSheets } = require('../config/google');
require('dotenv').config();

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const DB_FILE = path.join(__dirname, '../data/simaga_db.json');

// Mock database in-memory fallback yang tersinkronisasi jika Service Account belum dipasang
const mockDB = {
  pengguna: [
    { id_user: "USR-001", email: "bambang@student.ub.ac.id", password_hash: "bambang123", nama_lengkap: "Bambang Prakoso", role: "Mahasiswa", status_akun: "aktif" },
    { id_user: "USR-002", email: "carmen@techindo.com", password_hash: "mitra123", nama_lengkap: "Carmenita Wijaya, S.Kom.", role: "MitraIndustri", status_akun: "aktif" },
    { id_user: "USR-003", email: "yaya@alumni.ub.ac.id", password_hash: "yaya123", nama_lengkap: "Yaffa Anindya Oktaviani", role: "Alumni", status_akun: "aktif" },
    { id_user: "USR-004", email: "dina@ub.ac.id", password_hash: "admin123", nama_lengkap: "Dina Safitri, S.Kom., M.T.", role: "Admin", status_akun: "aktif" },
    { id_user: "USR-005", email: "kevin@student.ub.ac.id", password_hash: "kevin123", nama_lengkap: "Kevin Sanjaya", role: "Mahasiswa", status_akun: "aktif" },
    { id_user: "USR-006", email: "rian@alumni.ub.ac.id", password_hash: "rian123", nama_lengkap: "Rian Pratama, S.Kom.", role: "Alumni", status_akun: "aktif" },
    { id_user: "USR-007", email: "callum@alumni.ub.ac.id", password_hash: "callum123", nama_lengkap: "Callum Turner, S.Kom.", role: "Alumni", status_akun: "aktif" }
  ],
  mahasiswa: [
    { nim: "255150407111077", id_user: "USR-001", prodi: "Sistem Informasi", angkatan: 2025 },
    { nim: "255150400111068", id_user: "USR-005", prodi: "Teknik Informatika", angkatan: 2025 }
  ],
  alumni: [
    { nim: "215150400111001", id_user: "USR-003", prodi: "Sistem Informasi", tahun_lulus: 2025, status_pengisian: "Belum Mengisi" },
    { nim: "215150407111097", id_user: "USR-006", prodi: "Teknik Informatika", tahun_lulus: 2024, status_pengisian: "Telah Mengisi" },
    { nim: "2111111111111122", id_user: "USR-007", prodi: "Teknik Informatika", tahun_lulus: 2025, status_pengisian: "Belum Mengisi" }
  ],
  admin: [
    { id_admin: "ADM-001", id_user: "USR-004", unit_kerja: "Career & Internship" }
  ],
  mitra_industri: [
    { id_mitra: "MTR-101", id_user: "USR-002", nama_perusahaan: "PT Tech Indo Mandiri", alamat: "Jl. Jakarta No. 2, Lowokwaru, Malang", kontak_person: "Carmenita Wijaya", no_telepon: "081230261706", status_kemitraan: "aktif" }
  ],
  lowongan: [
    {
      id_lowongan: "LOW-001",
      id_mitra: "MTR-101",
      id_admin: "ADM-001",
      judul_posisi: "UI/UX Designer Intern",
      jenis_kesempatan: "Magang Bersertifikat",
      deskripsi: "Mengembangkan tampilan antarmuka web dan mobile application berbasis Design System FILKOM UB, melakukan user testing, wireframing, dan usability evaluation.",
      kualifikasi: "Mahasiswa aktif SI / TI semester 5-7. Mahir menggunakan Figma, Design System, Prototyping. Memiliki portofolio desain relevan.",
      lokasi: "Surabaya / Hybrid",
      periode_mulai: "2027-01-05",
      periode_selesai: "2027-06-30",
      kuota: 3,
      batas_pendaftaran: "2026-12-15",
      status_publikasi: "aktif",
      catatan_revisi: ""
    },
    {
      id_lowongan: "LOW-002",
      id_mitra: "MTR-101",
      id_admin: "ADM-001",
      judul_posisi: "Full-Stack Web Developer",
      jenis_kesempatan: "Pekerjaan",
      deskripsi: "Membangun sistem scalable web platform, REST API, integrasi front-end modern berbasis React & Node.js untuk aplikasi layanan akademik.",
      kualifikasi: "Lulusan S1 Ilmu Komputer / Sistem Informasi. Menguasai JavaScript/TypeScript, SQL, dan Docker.",
      lokasi: "Malang (On-site)",
      periode_mulai: "2027-01-01",
      periode_selesai: "2028-01-01",
      kuota: 2,
      batas_pendaftaran: "2026-12-20",
      status_publikasi: "aktif",
      catatan_revisi: ""
    },
    {
      id_lowongan: "LOW-003",
      id_mitra: "MTR-101",
      id_admin: "",
      judul_posisi: "Mobile Developer Intern (Flutter)",
      jenis_kesempatan: "Magang Bersertifikat",
      deskripsi: "Membantu perancangan modul transaksi mobile app, integrasi Google Workspace SDK, dan unit testing fungsionalitas.",
      kualifikasi: "Mahasiswa aktif FILKOM UB. Menguasai Flutter/Dart, state management BLoC, dan Git.",
      lokasi: "Jakarta (Remote)",
      periode_mulai: "2027-02-01",
      periode_selesai: "2027-07-31",
      kuota: 5,
      batas_pendaftaran: "2026-12-31",
      status_publikasi: "menunggu",
      catatan_revisi: ""
    },
    {
      id_lowongan: "LOW-004",
      id_mitra: "MTR-101",
      id_admin: "ADM-001",
      judul_posisi: "Data Analyst & Business Intelligence Intern",
      jenis_kesempatan: "Magang Bersertifikat",
      deskripsi: "Mengolah big data perbankan, menyusun dashboard Tableau & PowerBI, serta analisis tren transaksi digital untuk mendukung keputusan strategis.",
      kualifikasi: "Mahasiswa aktif Sistem Informasi / Teknik Informatika semester 5-7. Mahir SQL, Python Pandas, dan visualisasi data.",
      lokasi: "Remote (On-line)",
      periode_mulai: "2027-01-15",
      periode_selesai: "2027-07-15",
      kuota: 4,
      batas_pendaftaran: "2026-12-25",
      status_publikasi: "aktif",
      catatan_revisi: ""
    },
    {
      id_lowongan: "LOW-005",
      id_mitra: "MTR-101",
      id_admin: "ADM-001",
      judul_posisi: "IT Quality Assurance & Software Tester",
      jenis_kesempatan: "Pekerjaan",
      deskripsi: "Merancang test scenario, automated testing dengan Selenium/Cypress, dan memastikan keandalan performa sistem sebelum release produksi.",
      kualifikasi: "Alumni Fresh Graduate S1 FILKOM UB. Memahami SDLC Agile Scrum, API testing (Postman), dan testing otomatis.",
      lokasi: "Malang (On-site)",
      periode_mulai: "2027-01-10",
      periode_selesai: "2028-01-10",
      kuota: 2,
      batas_pendaftaran: "2026-12-30",
      status_publikasi: "aktif",
      catatan_revisi: ""
    },
    {
      id_lowongan: "LOW-006",
      id_mitra: "MTR-101",
      id_admin: "ADM-001",
      judul_posisi: "Cloud & DevOps Specialist",
      jenis_kesempatan: "Pekerjaan",
      deskripsi: "Membangun arsitektur cloud hybrid perbankan, automasi Terraform, microservices cluster management, dan observability sistem.",
      kualifikasi: "Alumni S1 FILKOM UB (Fresh Graduate / Pengalaman < 2 tahun). Memiliki pemahaman Kubernetes dan Docker.",
      lokasi: "Jakarta (Hybrid)",
      periode_mulai: "2027-01-15",
      periode_selesai: "2028-01-15",
      kuota: 2,
      batas_pendaftaran: "2026-12-31",
      status_publikasi: "aktif",
      catatan_revisi: ""
    },
    {
      id_lowongan: "LOW-007",
      id_mitra: "MTR-101",
      id_admin: "ADM-001",
      judul_posisi: "Data Scientist & AI Specialist",
      jenis_kesempatan: "Pekerjaan",
      deskripsi: "Mengembangkan model machine learning rekomendasi produk e-commerce, NLP chatbot, dan evaluasi performa model AI.",
      kualifikasi: "Alumni S1 rumpun Informatika. Menguasai Python, Scikit-learn, PyTorch, dan arsitektur LLM.",
      lokasi: "Jakarta (On-site)",
      periode_mulai: "2027-02-01",
      periode_selesai: "2028-02-01",
      kuota: 3,
      batas_pendaftaran: "2026-12-28",
      status_publikasi: "aktif",
      catatan_revisi: ""
    },
    {
      id_lowongan: "LOW-008",
      id_mitra: "MTR-101",
      id_admin: "ADM-001",
      judul_posisi: "Cybersecurity Analyst Intern",
      jenis_kesempatan: "Magang Bersertifikat",
      deskripsi: "Melakukan vulnerability assessment sistem web & API, analisis log keamanan SOC, dan penetration testing terpandu.",
      kualifikasi: "Mahasiswa aktif FILKOM UB semester 5-7. Memahami OWASP Top 10, network protocols, dan dasar ethical hacking.",
      lokasi: "Surabaya (On-site)",
      periode_mulai: "2027-02-01",
      periode_selesai: "2027-07-31",
      kuota: 2,
      batas_pendaftaran: "2026-12-31",
      status_publikasi: "aktif",
      catatan_revisi: ""
    }
  ],
  pendaftaran: [
    {
      id_pendaftaran: "REG-001",
      id_lowongan: "LOW-001",
      id_user: "USR-001",
      status_seleksi: "wawancara",
      catatan_seleksi: "Selamat! Berkas administrasi Anda lolos kurasi. Wawancara daring via Google Meet dijadwalkan pada 10 Des 2026 pk 10.00 WIB (Link: meet.google.com/fil-komu-bxb).",
      tanggal_daftar: "2026-11-02 09:15:00"
    }
  ],
  berkas_persyaratan: [
    {
      id_berkas: "BRK-001",
      id_pendaftaran: "REG-001",
      jenis_berkas: "CV",
      nama_file: "cv_bambang_prakoso.pdf",
      ukuran_kb: 842,
      drive_file_id: "drive_file_id_001",
      drive_url: "https://drive.google.com/file/d/1BambangCV_DummyDriveLink/view?usp=sharing",
      tanggal_unggah: "2026-11-02 09:12:00"
    },
    {
      id_berkas: "BRK-002",
      id_pendaftaran: "REG-001",
      jenis_berkas: "Transkrip",
      nama_file: "transkrip_nilai_bambang.pdf",
      ukuran_kb: 1250,
      drive_file_id: "drive_file_id_002",
      drive_url: "https://drive.google.com/file/d/1BambangTranskrip_DummyDriveLink/view?usp=sharing",
      tanggal_unggah: "2026-11-02 09:13:00"
    },
    {
      id_berkas: "BRK-003",
      id_pendaftaran: "REG-001",
      jenis_berkas: "Surat Rekomendasi",
      nama_file: "surat_rekomendasi_fakultas_bambang.pdf",
      ukuran_kb: 620,
      drive_file_id: "drive_file_id_003",
      drive_url: "https://drive.google.com/file/d/1BambangRekom_DummyDriveLink/view?usp=sharing",
      tanggal_unggah: "2026-11-02 09:14:00"
    }
  ],
  kuesioner: [
    {
      id_kuesioner: "TRC-001",
      nim: "215150407111097",
      id_admin: "ADM-001",
      periode_survei: 2026,
      status_karir: "Bekerja",
      data_jawaban: JSON.stringify({
        instansi: "PT GoTo Gojek Tokopedia Tbk",
        posisi: "Software Engineer",
        gaji: "8-12jt",
        gaji_nominal: 9500000,
        masa_tunggu: 2,
        keselarasan: 5,
        relevansi_kurikulum: "Sangat Relevan dengan kebutuhan industri software saat ini"
      }),
      is_draft: false,
      status_validasi: "tervalidasi",
      is_anomali: false,
      nomor_referensi: "SIMAGA/TS/2026/0001",
      tanggal_submit: "2026-10-30 14:20:00"
    },
    {
      id_kuesioner: "TRC-002",
      nim: "215150400111001",
      id_admin: "",
      periode_survei: 2026,
      status_karir: "Bekerja",
      data_jawaban: JSON.stringify({
        instansi: "PT Inovasi Sentosa",
        posisi: "Junior UI Designer",
        gaji: ">50jt",
        gaji_nominal: 85000000, // ANOMALI gaji fresh grad 85jt
        masa_tunggu: 1,
        keselarasan: 4,
        relevansi_kurikulum: "Cukup relevan"
      }),
      is_draft: false,
      status_validasi: "menunggu",
      is_anomali: true,
      nomor_referensi: "SIMAGA/TS/2026/0002",
      tanggal_submit: "2026-11-05 10:15:00"
    }
  ],
  riwayat_pengingat: [
    { id_pengingat: "RMD-001", id_admin: "ADM-001", filter_target: "Angkatan 2022 - Sistem Informasi", jumlah_penerima: 120, tanggal_kirim: "2026-11-01 08:00:00" }
  ],
  notifikasi: [
    { id_notifikasi: "NTF-001", id_user: "USR-001", jenis: "status_seleksi", judul: "Status Lamaran Diperbarui", pesan: "Anda dijadwalkan wawancara pada 10 Des 2026.", is_dibaca: false, tanggal_kirim: "2026-11-03 10:00:00" },
    { id_notifikasi: "NTF-002", id_user: "USR-002", jenis: "kurasi_lowongan", judul: "Lowongan Disetujui", pesan: "Lowongan UI/UX Designer Intern telah disetujui oleh unit Career & Internship.", is_dibaca: true, tanggal_kirim: "2026-11-01 11:30:00" },
    { id_notifikasi: "NTF-003", id_user: "USR-003", jenis: "tracer_study", judul: "Pengisian Tracer Study Aktif", pesan: "Halo Yaya, kuesioner pelacakan karier alumni periode 2026 telah dibuka.", is_dibaca: false, tanggal_kirim: "2026-11-01 08:30:00" }
  ]
};

function saveMockDB() {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(mockDB, null, 2), 'utf8');
  } catch(e) {
    console.warn('[MockDB] Gagal menyimpan ke disk:', e.message);
  }
}

function loadMockDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      Object.keys(data).forEach(k => {
        if (Array.isArray(data[k]) && data[k].length > 0) {
          mockDB[k] = data[k];
        }
      });
      console.log('[MockDB] Memuat data persisten dari disk.');
    }
  } catch(e) {
    console.warn('[MockDB] Gagal memuat dari disk:', e.message);
  }
}

// Inisialisasi data dari disk saat modul dimulai
loadMockDB();

/**
 * Helper: Ambil seluruh data tabel
 */
async function getTableData(tableName) {
  const sheets = getSheets();
  if (!sheets || !SPREADSHEET_ID) {
    return mockDB[tableName] || [];
  }

  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${tableName}!A1:Z500`
    });

    const rows = res.data.values || [];
    if (rows.length <= 1) return [];

    const headers = rows[0];
    return rows.slice(1).map(r => {
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = r[idx] !== undefined ? r[idx] : "";
      });
      return obj;
    });
  } catch (err) {
    console.warn(`[Sheets Service] Gagal membaca tab ${tableName} dari Google Sheets, menggunakan data mock:`, err.message);
    return mockDB[tableName] || [];
  }
}

/**
 * Helper: Tambah baris baru ke tabel
 */
async function appendTableRow(tableName, rowObject) {
  const sheets = getSheets();

  // Simpan juga ke in-memory mockDB
  if (!mockDB[tableName]) mockDB[tableName] = [];
  mockDB[tableName].push(rowObject);
  saveMockDB();

  if (!sheets || !SPREADSHEET_ID) {
    return true;
  }

  try {
    // Ambil header untuk urutan kolom
    const metaRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${tableName}!A1:Z1`
    });
    const headers = (metaRes.data.values && metaRes.data.values[0]) || Object.keys(rowObject);
    const rowValues = headers.map(h => rowObject[h] !== undefined ? rowObject[h] : "");

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${tableName}!A1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [rowValues] }
    });
    return true;
  } catch (err) {
    console.warn(`[Sheets Service] Gagal menulis ke tab ${tableName} di Google Sheets:`, err.message);
    return false;
  }
}

/**
 * ==============================================================================
 * METODE BISNIS SPESIFIK SIMAGA
 * ==============================================================================
 */

// Login & Auth
async function findUser(identifier) {
  const users = await getTableData('pengguna');
  const mahasiswa = await getTableData('mahasiswa');
  const alumni = await getTableData('alumni');

  const lower = identifier.toLowerCase().trim();
  let user = users.find(u => (u.email && u.email.toLowerCase() === lower) || (u.id_user && u.id_user.toLowerCase() === lower));

  if (!user) {
    const m = mahasiswa.find(mhs => mhs.nim === identifier.trim());
    if (m) user = users.find(u => u.id_user === m.id_user);
  }
  if (!user) {
    const al = alumni.find(a => a.nim === identifier.trim());
    if (al) user = users.find(u => u.id_user === al.id_user);
  }

  if (!user) return null;

  let profile = {};
  if (user.role === 'Mahasiswa') {
    profile = (await getTableData('mahasiswa')).find(m => m.id_user === user.id_user) || {};
  } else if (user.role === 'Alumni') {
    profile = (await getTableData('alumni')).find(a => a.id_user === user.id_user) || {};
  } else if (user.role === 'Admin') {
    profile = (await getTableData('admin')).find(ad => ad.id_user === user.id_user) || {};
  } else if (user.role === 'MitraIndustri') {
    profile = (await getTableData('mitra_industri')).find(mt => mt.id_user === user.id_user) || {};
  }

  return { user, profile };
}

// Lowongan
async function getAllVacancies() {
  const vacancies = await getTableData('lowongan');
  const partners = await getTableData('mitra_industri');
  const pMap = {};
  partners.forEach(p => { pMap[p.id_mitra] = p; });

  return vacancies.map(v => ({
    ...v,
    mitra: pMap[v.id_mitra] || null
  }));
}

async function addVacancy(vacancyData) {
  const id_lowongan = "LOW-" + Date.now();
  const row = {
    id_lowongan,
    id_mitra: vacancyData.id_mitra,
    id_admin: "",
    judul_posisi: vacancyData.judul_posisi,
    jenis_kesempatan: vacancyData.jenis_kesempatan || "Magang Bersertifikat",
    deskripsi: vacancyData.deskripsi,
    kualifikasi: vacancyData.kualifikasi,
    lokasi: vacancyData.lokasi,
    periode_mulai: vacancyData.periode_mulai,
    periode_selesai: vacancyData.periode_selesai,
    kuota: vacancyData.kuota,
    batas_pendaftaran: vacancyData.batas_pendaftaran,
    status_publikasi: "menunggu",
    catatan_revisi: ""
  };
  await appendTableRow('lowongan', row);
  return row;
}

// Pendaftaran
async function getAllApplications(filter = {}) {
  const apps = await getTableData('pendaftaran');
  const vacancies = await getTableData('lowongan');
  const files = await getTableData('berkas_persyaratan');
  const users = await getTableData('pengguna');
  const mhs = await getTableData('mahasiswa');

  const vMap = {}; vacancies.forEach(v => { vMap[v.id_lowongan] = v; });
  const uMap = {}; users.forEach(u => { uMap[u.id_user] = u; });
  const mMap = {}; mhs.forEach(m => { mMap[m.id_user] = m; });

  const filesByApp = {};
  files.forEach(f => {
    if (!filesByApp[f.id_pendaftaran]) filesByApp[f.id_pendaftaran] = [];
    filesByApp[f.id_pendaftaran].push(f);
  });

  let result = apps.map(a => {
    const u = uMap[a.id_user] || {};
    const m = mMap[a.id_user] || {};
    return {
      ...a,
      lowongan: vMap[a.id_lowongan] || null,
      mahasiswa: {
        nama_lengkap: u.nama_lengkap || "-",
        email: u.email || "-",
        nim: m.nim || "-",
        prodi: m.prodi || "-",
        angkatan: m.angkatan || "-"
      },
      berkas: filesByApp[a.id_pendaftaran] || []
    };
  });

  if (filter.id_user) result = result.filter(a => a.id_user === filter.id_user);
  if (filter.id_mitra) {
    result = result.filter(a => a.lowongan && a.lowongan.id_mitra === filter.id_mitra);
  }

  return result;
}

// Tracer Study
async function getTracerSubmissions() {
  const questionnaires = await getTableData('kuesioner');
  const alumni = await getTableData('alumni');
  const users = await getTableData('pengguna');

  const almMap = {}; alumni.forEach(a => { almMap[a.nim] = a; });
  const uMap = {}; users.forEach(u => { uMap[u.id_user] = u; });

  return questionnaires.map(q => {
    const al = almMap[q.nim] || {};
    const u = uMap[al.id_user] || {};
    let parsed = {};
    try { parsed = JSON.parse(q.data_jawaban); } catch(e){}
    return {
      ...q,
      data_jawaban_parsed: parsed,
      alumni: {
        nim: q.nim,
        nama_lengkap: u.nama_lengkap || "-",
        prodi: al.prodi || "-",
        tahun_lulus: al.tahun_lulus || "-"
      }
    };
  });
}

// User Management (Admin)
async function getAllUsers() {
  const rawUsers = await getTableData('pengguna');
  // Deduplikasi by id_user untuk mencegah duplikasi tampilan
  const users = Array.from(new Map(rawUsers.map(u => [u.id_user, u])).values());

  const mhs = await getTableData('mahasiswa');
  const alm = await getTableData('alumni');
  const mit = await getTableData('mitra_industri');
  const adm = await getTableData('admin');

  const mMap = {}; mhs.forEach(m => { mMap[m.id_user] = m; });
  const aMap = {}; alm.forEach(a => { aMap[a.id_user] = a; });
  const pMap = {}; mit.forEach(p => { pMap[p.id_user] = p; });
  const adMap = {}; adm.forEach(d => { adMap[d.id_user] = d; });

  return users.map(u => {
    let profile = {};
    if (u.role === 'Mahasiswa') profile = mMap[u.id_user] || {};
    else if (u.role === 'Alumni') profile = aMap[u.id_user] || {};
    else if (u.role === 'MitraIndustri') profile = pMap[u.id_user] || {};
    else if (u.role === 'Admin') profile = adMap[u.id_user] || {};
    return { ...u, profile };
  });
}

async function createUser(userData) {
  const users = await getTableData('pengguna');
  const newId = 'USR-' + String(users.length + 1).padStart(3, '0') + '-' + Date.now().toString().slice(-4);
  const newUser = {
    id_user: newId,
    email: userData.email,
    password_hash: userData.password || 'ub123456',
    nama_lengkap: userData.nama_lengkap,
    role: userData.role,
    status_akun: userData.status_akun || 'aktif'
  };

  await appendTableRow('pengguna', newUser);

  let profile = {};
  if (userData.role === 'Mahasiswa') {
    profile = {
      nim: userData.nim || ('255150' + Date.now().toString().slice(-8)),
      id_user: newId,
      prodi: userData.prodi || 'Sistem Informasi',
      angkatan: Number(userData.angkatan) || 2025,
      ipk: Number(userData.ipk) || 3.75
    };
    await appendTableRow('mahasiswa', profile);
  } else if (userData.role === 'Alumni') {
    profile = {
      nim: userData.nim || ('215150' + Date.now().toString().slice(-8)),
      id_user: newId,
      prodi: userData.prodi || 'Sistem Informasi',
      tahun_lulus: Number(userData.tahun_lulus) || 2025,
      status_pengisian: 'Belum Mengisi'
    };
    await appendTableRow('alumni', profile);
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
    await appendTableRow('mitra_industri', profile);
  } else if (userData.role === 'Admin') {
    profile = {
      id_admin: 'ADM-' + Date.now().toString().slice(-4),
      id_user: newId,
      unit_kerja: userData.unit_kerja || 'Career & Internship'
    };
    await appendTableRow('admin', profile);
  }

  saveMockDB();
  return { user: newUser, profile };
}

async function updateUser(id_user, userData) {
  const users = await getTableData('pengguna');
  const user = users.find(u => u.id_user === id_user);
  if (!user) throw new Error('Pengguna tidak ditemukan.');

  if (userData.nama_lengkap) user.nama_lengkap = userData.nama_lengkap;
  if (userData.email) user.email = userData.email;
  if (userData.status_akun) user.status_akun = userData.status_akun;
  if (userData.password) user.password_hash = userData.password;

  let profile = {};
  if (user.role === 'Mahasiswa') {
    const list = await getTableData('mahasiswa');
    let m = list.find(item => item.id_user === id_user);
    if (!m) {
      m = { nim: userData.nim || ('255150' + Date.now().toString().slice(-8)), id_user };
      list.push(m);
    }
    if (userData.nim) m.nim = userData.nim;
    if (userData.prodi) m.prodi = userData.prodi;
    if (userData.angkatan) m.angkatan = Number(userData.angkatan);
    if (userData.ipk) m.ipk = Number(userData.ipk);
    profile = m;
  } else if (user.role === 'Alumni') {
    const list = await getTableData('alumni');
    let a = list.find(item => item.id_user === id_user);
    if (!a) {
      a = { nim: userData.nim || ('215150' + Date.now().toString().slice(-8)), id_user };
      list.push(a);
    }
    if (userData.nim) a.nim = userData.nim;
    if (userData.prodi) a.prodi = userData.prodi;
    if (userData.tahun_lulus) a.tahun_lulus = Number(userData.tahun_lulus);
    profile = a;
  } else if (user.role === 'MitraIndustri') {
    const list = await getTableData('mitra_industri');
    let p = list.find(item => item.id_user === id_user);
    if (!p) {
      p = { id_mitra: 'MTR-' + Date.now().toString().slice(-4), id_user };
      list.push(p);
    }
    if (userData.nama_perusahaan) p.nama_perusahaan = userData.nama_perusahaan;
    if (userData.alamat) p.alamat = userData.alamat;
    if (userData.kontak_person) p.kontak_person = userData.kontak_person;
    if (userData.no_telepon) p.no_telepon = userData.no_telepon;
    profile = p;
  } else if (user.role === 'Admin') {
    const list = await getTableData('admin');
    let ad = list.find(item => item.id_user === id_user);
    if (!ad) {
      ad = { id_admin: 'ADM-' + Date.now().toString().slice(-4), id_user };
      list.push(ad);
    }
    if (userData.unit_kerja) ad.unit_kerja = userData.unit_kerja;
    profile = ad;
  }

  saveMockDB();
  return { user, profile };
}

async function deleteUser(id_user) {
  const users = await getTableData('pengguna');
  const idx = users.findIndex(u => u.id_user === id_user);
  if (idx === -1) throw new Error('Pengguna tidak ditemukan.');
  const removedUser = users.splice(idx, 1)[0];

  // Hapus juga dari relasi tabel peran
  if (mockDB.mahasiswa) mockDB.mahasiswa = mockDB.mahasiswa.filter(m => m.id_user !== id_user);
  if (mockDB.alumni) mockDB.alumni = mockDB.alumni.filter(a => a.id_user !== id_user);
  if (mockDB.mitra_industri) mockDB.mitra_industri = mockDB.mitra_industri.filter(p => p.id_user !== id_user);
  if (mockDB.admin) mockDB.admin = mockDB.admin.filter(ad => ad.id_user !== id_user);

  saveMockDB();
  return { status: 'success', message: 'Pengguna berhasil dihapus.', id_user };
}

async function updateVacancy(id_lowongan, data) {
  const vacancies = await getTableData('lowongan');
  const v = vacancies.find(item => item.id_lowongan === id_lowongan);
  if (!v) throw new Error('Lowongan tidak ditemukan.');

  if (data.judul_posisi) v.judul_posisi = data.judul_posisi;
  if (data.jenis_kesempatan) v.jenis_kesempatan = data.jenis_kesempatan;
  if (data.deskripsi) v.deskripsi = data.deskripsi;
  if (data.kualifikasi) v.kualifikasi = data.kualifikasi;
  if (data.lokasi) v.lokasi = data.lokasi;
  if (data.periode_mulai) v.periode_mulai = data.periode_mulai;
  if (data.periode_selesai) v.periode_selesai = data.periode_selesai;
  if (data.kuota !== undefined) v.kuota = Number(data.kuota);
  if (data.batas_pendaftaran) v.batas_pendaftaran = data.batas_pendaftaran;
  if (data.status_publikasi) v.status_publikasi = data.status_publikasi;

  return v;
}

async function deleteVacancy(id_lowongan) {
  const vacancies = await getTableData('lowongan');
  const idx = vacancies.findIndex(item => item.id_lowongan === id_lowongan);
  if (idx === -1) throw new Error('Lowongan tidak ditemukan.');
  const removed = vacancies.splice(idx, 1)[0];
  saveMockDB();
  return { status: 'success', message: 'Lowongan berhasil dihapus.', id_lowongan };
}

module.exports = {
  mockDB,
  saveMockDB,
  getTableData,
  appendTableRow,
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
  getTracerSubmissions
};
