const path = require('path');
const fs = require('fs');
const { getSheets } = require('../config/google');
require('dotenv').config();

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const DB_FILE = path.join(__dirname, '../data/simaga_db.json');

// Mock database in-memory fallback (dipakai bila Service Account belum dipasang).
// Data awal diambil dari satu sumber seed terpusat: server/seed/seedData.js
const { buildSeed, SEED_VERSION, BIDANG_KEAHLIAN } = require('../seed/seedData');
const mockDB = buildSeed();

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
      // Abaikan snapshot lama bila versi seed berubah, agar data demo terbaru selalu terpakai
      if (data._seed_version !== SEED_VERSION) {
        console.log(`[MockDB] Versi seed berubah (${data._seed_version || 'tanpa versi'} -> ${SEED_VERSION}). Memakai seed baru.`);
        saveMockDB();
        return;
      }
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

/**
 * Kembalikan seluruh tabel mock ke kondisi seed awal (dipakai endpoint reset demo).
 * Mutasi dilakukan in-place agar referensi `mockDB` yang sudah diimpor modul lain tetap valid.
 */
function resetMockDB() {
  const fresh = buildSeed();
  Object.keys(mockDB).forEach(k => { delete mockDB[k]; });
  Object.assign(mockDB, fresh);
  saveMockDB();
  return mockDB;
}

/**
 * Tebak bidang keahlian dari judul/deskripsi untuk baris lama yang belum punya kolom bidang_keahlian.
 */
function inferBidangKeahlian(v) {
  if (v.bidang_keahlian && BIDANG_KEAHLIAN.includes(v.bidang_keahlian)) return v.bidang_keahlian;
  const text = `${v.judul_posisi || ''} ${v.deskripsi || ''}`.toLowerCase();
  if (/ui\/ux|ux|desain|design|figma/.test(text)) return 'UI/UX Design';
  if (/data|analyst|machine learning|\bai\b|scientist|intelligence/.test(text)) return 'Data & AI';
  if (/quality assurance|\bqa\b|tester|testing|devops|ci\/cd/.test(text)) return 'Quality Assurance & DevOps';
  if (/network|jaringan|security|keamanan|cyber|infrastru|cloud/.test(text)) return 'Sistem & Jaringan';
  return 'Web & Mobile Development';
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
    bidang_keahlian: inferBidangKeahlian(v),
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
    bidang_keahlian: inferBidangKeahlian(vacancyData),
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
  if (data.bidang_keahlian && BIDANG_KEAHLIAN.includes(data.bidang_keahlian)) v.bidang_keahlian = data.bidang_keahlian;
  if (data.deskripsi) v.deskripsi = data.deskripsi;
  if (data.kualifikasi) v.kualifikasi = data.kualifikasi;
  if (data.lokasi) v.lokasi = data.lokasi;
  if (data.periode_mulai) v.periode_mulai = data.periode_mulai;
  if (data.periode_selesai) v.periode_selesai = data.periode_selesai;
  if (data.kuota !== undefined) v.kuota = Number(data.kuota);
  if (data.batas_pendaftaran) v.batas_pendaftaran = data.batas_pendaftaran;
  if (data.status_publikasi) v.status_publikasi = data.status_publikasi;

  saveMockDB();
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
  resetMockDB,
  inferBidangKeahlian,
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
