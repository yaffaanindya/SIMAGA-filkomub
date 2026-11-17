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

const tableSchemas = {
  pengguna: ["id_user", "email", "password_hash", "nama_lengkap", "role", "status_akun"],
  mahasiswa: ["nim", "id_user", "prodi", "angkatan"],
  alumni: ["nim", "id_user", "prodi", "tahun_lulus", "status_pengisian"],
  admin: ["id_admin", "id_user", "unit_kerja"],
  mitra_industri: ["id_mitra", "id_user", "nama_perusahaan", "alamat", "kontak_person", "no_telepon", "status_kemitraan"],
  lowongan: [
    "id_lowongan", "id_mitra", "id_admin", "judul_posisi", "jenis_kesempatan", 
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

const initialData = {
  pengguna: [
    ["USR-001", "bambang@student.ub.ac.id", "bambang123", "Bambang Prakoso", "Mahasiswa", "aktif"],
    ["USR-002", "carmen@techindo.com", "mitra123", "Carmenita Wijaya, S.Kom.", "MitraIndustri", "aktif"],
    ["USR-003", "yaya@alumni.ub.ac.id", "yaya123", "Yaffa Anindya Oktaviani", "Alumni", "aktif"],
    ["USR-004", "dina@ub.ac.id", "admin123", "Dina Safitri, S.Kom., M.T.", "Admin", "aktif"],
    ["USR-005", "kevin@student.ub.ac.id", "kevin123", "Kevin Sanjaya", "Mahasiswa", "aktif"],
    ["USR-006", "rian@alumni.ub.ac.id", "rian123", "Rian Pratama, S.Kom.", "Alumni", "aktif"]
  ],
  mahasiswa: [
    ["255150407111077", "USR-001", "Sistem Informasi", 2025],
    ["255150400111068", "USR-005", "Teknik Informatika", 2025]
  ],
  alumni: [
    ["215150400111001", "USR-003", "Sistem Informasi", 2025, "Belum Mengisi"],
    ["215150407111097", "USR-006", "Teknik Informatika", 2024, "Telah Mengisi"]
  ],
  admin: [
    ["ADM-001", "USR-004", "Career & Internship"]
  ],
  mitra_industri: [
    ["MTR-101", "USR-002", "PT Tech Indo Mandiri", "Jl. Jakarta No. 2, Malang", "Carmenita Wijaya", "081230261706", "aktif"],
    ["MTR-102", "USR-002", "PT Inovasi Digital Nusantara", "Jl. Soekarno Hatta No. 45, Malang", "Budi Santoso", "081333444555", "aktif"]
  ],
  lowongan: [
    [
      "LOW-001", "MTR-101", "ADM-001", "UI/UX Designer Intern", "Magang Bersertifikat",
      "Mengembangkan tampilan antarmuka web dan mobile berbasis Design System, merancang alur interaksi pengguna, dan melakukan evaluasi usability.",
      "Mahasiswa aktif Sistem Informasi / Teknik Informatika semester 5-7. Mahir menggunakan Figma, Prototyping, dan Design Thinking.",
      "Surabaya / Hybrid", "2027-01-05", "2027-06-30", 3, "2026-12-15", "aktif", ""
    ],
    [
      "LOW-002", "MTR-101", "ADM-001", "Full-Stack Web Developer", "Pekerjaan",
      "Membangun layanan backend API terukur dan integrasi antarmuka modern responsif.",
      "Lulusan S1 rumpun Informatika. Menguasai JavaScript/TypeScript, SQL, dan REST API.",
      "Malang (On-site)", "2027-01-01", "2028-01-01", 2, "2026-12-20", "aktif", ""
    ],
    [
      "LOW-003", "MTR-102", "", "Mobile Developer Intern (Flutter)", "Magang Bersertifikat",
      "Membantu perancangan modul transaksi mobile app dan pengujian fungsionalitas.",
      "Mahasiswa aktif FILKOM UB. Menguasai Flutter/Dart dan Git.",
      "Jakarta (Remote)", "2027-02-01", "2027-07-31", 5, "2026-12-31", "menunggu", ""
    ]
  ],
  pendaftaran: [
    [
      "REG-001", "LOW-001", "USR-001", "wawancara",
      "Wawancara via Zoom dijadwalkan pada 10 Des 2026 pk 10.00 WIB (Link: meet.google.com/abc-filkom).",
      "2026-11-02 09:15:00"
    ]
  ],
  berkas_persyaratan: [
    [
      "BRK-001", "REG-001", "CV", "cv_bambang.pdf", 842,
      "drive_file_id_001", "https://drive.google.com/file/d/sample_cv/view", "2026-11-02 09:12:00"
    ],
    [
      "BRK-002", "REG-001", "Transkrip", "transkrip_bambang.pdf", 1250,
      "drive_file_id_002", "https://drive.google.com/file/d/sample_transkrip/view", "2026-11-02 09:13:00"
    ],
    [
      "BRK-003", "REG-001", "Surat Rekomendasi", "rekomendasi_fakultas_bambang.pdf", 620,
      "drive_file_id_003", "https://drive.google.com/file/d/sample_rekomendasi/view", "2026-11-02 09:14:00"
    ]
  ],
  kuesioner: [
    [
      "TRC-001", "215150407111097", "ADM-001", 2026, "Bekerja",
      JSON.stringify({
        instansi: "PT GoTo Gojek Tokopedia Tbk",
        posisi: "Software Engineer",
        gaji: "8-12jt",
        gaji_nominal: 9500000,
        masa_tunggu: 2,
        keselarasan: 5,
        relevansi_kurikulum: "Sangat Relevan"
      }),
      false, "tervalidasi", false, "SIMAGA/TS/2026/0001", "2026-10-30 14:20:00"
    ],
    [
      "TRC-002", "215150400111001", "", 2026, "Bekerja",
      JSON.stringify({
        instansi: "PT Inovasi Sentosa",
        posisi: "Junior UI Designer",
        gaji: ">50jt",
        gaji_nominal: 85000000, // ANOMALI gaji fresh grad 85jt
        masa_tunggu: 1,
        keselarasan: 4,
        relevansi_kurikulum: "Cukup relevan"
      }),
      false, "menunggu", true, "SIMAGA/TS/2026/0002", "2026-11-05 10:15:00"
    ]
  ],
  riwayat_pengingat: [
    ["RMD-001", "ADM-001", "Angkatan 2022 - Sistem Informasi", 120, "2026-11-01 08:00:00"]
  ],
  notifikasi: [
    ["NTF-001", "USR-001", "status_seleksi", "Status Lamaran Diperbarui", "Anda dijadwalkan wawancara pada 10 Des 2026.", false, "2026-11-03 10:00:00"],
    ["NTF-002", "USR-002", "kurasi_lowongan", "Lowongan Disetujui", "Lowongan UI/UX Designer Intern telah disetujui oleh unit Career & Internship.", true, "2026-11-01 11:30:00"]
  ]
};

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
