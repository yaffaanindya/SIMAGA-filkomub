/**
 * ==============================================================================
 * SIMAGA (Sistem Informasi Magang dan Alumni - FILKOM UB)
 * NODE.JS GOOGLE SHEETS SETUP & SEEDING SCRIPT
 * ==============================================================================
 * Menyiapkan 11 Tab Relasional, Header Berwarna FILKOM UB, dan Data Dummy Awal.
 * Cara Penggunaan:
 * 1. Simpan file Service Account di `server/credentials.json`
 * 2. Set SPREADSHEET_ID di `.env`
 * 3. Jalankan: `npm run init-sheets`
 * ==============================================================================
 */

const { getSheets } = require('../config/google');
require('dotenv').config();

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

if (!SPREADSHEET_ID) {
  console.error("GALAT: SPREADSHEET_ID belum diisi di file .env!");
  console.log("Panduan:");
  console.log("1. Buat Spreadsheet baru di https://sheets.new");
  console.log("2. Bagikan (Share) Spreadsheet dengan email Service Account Anda sebagai 'Editor'.");
  console.log("3. Salin Spreadsheet ID dari URL dan tempelkan ke .env");
  process.exit(1);
}

const { buildSeed } = require('../seed/seedData');

const tableSchemas = {
  pengguna: ["id_user", "email", "password_hash", "nama_lengkap", "role", "status_akun"],
  mahasiswa: ["nim", "id_user", "prodi", "angkatan", "ipk"],
  alumni: ["nim", "id_user", "prodi", "tahun_lulus", "status_pengisian"],
  admin: ["id_admin", "id_user", "unit_kerja"],
  mitra_industri: ["id_mitra", "id_user", "nama_perusahaan", "alamat", "kontak_person", "no_telepon", "status_kemitraan"],
  lowongan: [
    "id_lowongan", "id_mitra", "id_admin", "judul_posisi", "jenis_kesempatan", "bidang_keahlian",
    "deskripsi", "kualifikasi", "lokasi", "periode_mulai", "periode_selesai",
    "kuota", "batas_pendaftaran", "status_publikasi", "catatan_revisi"
  ],
  pendaftaran: ["id_pendaftaran", "id_lowongan", "id_user", "status_seleksi", "catatan_seleksi", "tanggal_daftar"],
  berkas_persyaratan: ["id_berkas", "id_pendaftaran", "jenis_berkas", "nama_file", "ukuran_kb", "drive_file_id", "drive_url", "tanggal_unggah"],
  kuesioner: [
    "id_kuesioner", "nim", "id_admin", "periode_survei", "status_karir",
    "data_jawaban", "is_draft", "status_validasi", "is_anomali", "nomor_referensi", "tanggal_submit"
  ],
  riwayat_pengingat: ["id_pengingat", "id_admin", "filter_target", "jumlah_penerima", "tanggal_kirim"],
  notifikasi: ["id_notifikasi", "id_user", "jenis", "judul", "pesan", "is_dibaca", "tanggal_kirim"]
};

// Data seed diambil dari sumber terpusat (server/seed/seedData.js) lalu diubah ke baris sesuai urutan header
const seed = buildSeed();
const initialData = {};
for (const [tableName, headers] of Object.entries(tableSchemas)) {
  initialData[tableName] = (seed[tableName] || []).map(row => headers.map(h => (row[h] !== undefined ? row[h] : "")));
}

async function runSetup() {
  const sheets = getSheets();
  if (!sheets) {
    console.error("GALAT: Google Sheets Client gagal diinisialisasi. Periksa kredensial Service Account.");
    process.exit(1);
  }

  console.log(`Mengakses Spreadsheet ID: ${SPREADSHEET_ID}...`);
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const existingSheets = meta.data.sheets.map(s => s.properties.title);

  // Buat sheet baru jika belum ada
  const requests = [];
  for (const tableName of Object.keys(tableSchemas)) {
    if (!existingSheets.includes(tableName)) {
      requests.push({
        addSheet: {
          properties: {
            title: tableName,
            gridProperties: { rowCount: 100, columnCount: tableSchemas[tableName].length + 5 }
          }
        }
      });
    }
  }

  if (requests.length > 0) {
    console.log(`Membuat ${requests.length} sheet baru di Google Spreadsheet...`);
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { requests }
    });
  }

  // Tulis Header & Data Dummy
  for (const [tableName, headers] of Object.entries(tableSchemas)) {
    console.log(`Mengisi header & data untuk tab: ${tableName}...`);
    const rows = [headers, ...(initialData[tableName] || [])];

    // Bersihkan isi lama agar tidak ada baris sisa dari seed sebelumnya
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: `${tableName}!A:Z`
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${tableName}!A1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: rows }
    });
  }

  console.log("SELESAI! Seluruh 11 sheet berhasil diinisialisasi dan diisi data seed awal.");
}

runSetup().catch(err => {
  console.error("Gagal menjalankan setup:", err.message);
  process.exit(1);
});
