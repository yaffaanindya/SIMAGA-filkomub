/**
 * ==============================================================================
 * SIMAGA (Sistem Informasi Magang dan Alumni - FILKOM Universitas Brawijaya)
 * GOOGLE APPS SCRIPT DATABASE & STORAGE INITIALIZATION SCRIPT
 * ==============================================================================
 * Petunjuk Penggunaan:
 * 1. Buka Google Sheets baru: https://sheets.new
 * 2. Beri nama Spreadsheet: "SIMAGA_Database_FILKOM_UB"
 * 3. Buka menu Extensions (Ekstensi) > Apps Script
 * 4. Hapus kode default, paste file Setup.gs dan Code.gs ini.
 * 5. Pilih fungsi 'setupDatabase' di dropdown lalu klik tombol 'Run' (Jalankan).
 * 6. Berikan otorisasi izin akses akun Google Anda saat diminta.
 * 7. Seluruh 11 tab relasional, header terformat, dan seed data awal akan otomatis dibuat!
 * ==============================================================================
 */

function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Logger.log("Memulai Inisialisasi Database SIMAGA FILKOM UB...");

  // Definisi Skema 11 Tabel dan Header Kolom
  const tableSchemas = {
    pengguna: [
      "id_user", "email", "password_hash", "nama_lengkap", "role", "status_akun"
    ],
    mahasiswa: [
      "nim", "id_user", "prodi", "angkatan"
    ],
    alumni: [
      "nim", "id_user", "prodi", "tahun_lulus", "status_pengisian"
    ],
    admin: [
      "id_admin", "id_user", "unit_kerja"
    ],
    mitra_industri: [
      "id_mitra", "id_user", "nama_perusahaan", "alamat", "kontak_person", "no_telepon", "status_kemitraan"
    ],
    lowongan: [
      "id_lowongan", "id_mitra", "id_admin", "judul_posisi", "jenis_kesempatan", 
      "deskripsi", "kualifikasi", "lokasi", "periode_mulai", "periode_selesai", 
      "kuota", "batas_pendaftaran", "status_publikasi", "catatan_revisi"
    ],
    pendaftaran: [
      "id_pendaftaran", "id_lowongan", "id_user", "status_seleksi", "catatan_seleksi", "tanggal_daftar"
    ],
    berkas_persyaratan: [
      "id_berkas", "id_pendaftaran", "jenis_berkas", "nama_file", "ukuran_kb", "drive_file_id", "drive_url", "tanggal_unggah"
    ],
    kuesioner: [
      "id_kuesioner", "nim", "id_admin", "periode_survei", "status_karir", 
      "data_jawaban", "is_draft", "status_validasi", "is_anomali", "nomor_referensi", "tanggal_submit"
    ],
    riwayat_pengingat: [
      "id_pengingat", "id_admin", "filter_target", "jumlah_penerima", "tanggal_kirim"
    ],
    notifikasi: [
      "id_notifikasi", "id_user", "jenis", "judul", "pesan", "is_dibaca", "tanggal_kirim"
    ]
  };

  // Seed Data Awal untuk 4 Role (Mahasiswa, Alumni, Mitra Industri, Admin)
  const initialData = {
    pengguna: [
      ["USR-001", "bambang@student.ub.ac.id", "bambang123", "Bambang Prakoso", "Mahasiswa", "aktif"],
      ["USR-002", "carmen@techindo.com", "mitra123", "Carmenita Wijaya, S.Kom.", "MitraIndustri", "aktif"],
      ["USR-003", "yaya@alumni.ub.ac.id", "yaya123", "Yaffa Anindya Oktaviani", "Alumni", "aktif"],
      ["USR-004", "dina@ub.ac.id", "admin123", "Dina Safitri, S.Kom., M.T.", "Admin", "aktif"],
      ["USR-005", "kevin@student.ub.ac.id", "kevin123", "Kevin Sanjaya", "Mahasiswa", "aktif"],
      ["USR-006", "rian@alumni.ub.ac.id", "rian123", "Rian Pratama, S.Kom.", "Alumni", "aktif"],
      ["USR-007", "recruitment@shopee.com", "shopee123", "Jessica Tan", "MitraIndustri", "aktif"]
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
      ["MTR-101", "USR-002", "PT Tech Indo Mandiri", "Jl. Jakarta No. 2, Lowokwaru, Malang", "Carmenita Wijaya", "081230261706", "aktif"],
      ["MTR-102", "USR-007", "PT Shopee International Indonesia", "Pacific Century Place Lt. 25, SCBD Jakarta Selatan", "Jessica Tan", "081299887766", "aktif"]
    ],
    lowongan: [
      [
        "LOW-001", "MTR-101", "ADM-001", "UI/UX Designer Intern", "Magang Bersertifikat",
        "Mengembangkan tampilan antarmuka web dan mobile application berbasis Design System, melakukan user testing dan riset kegunaan bersama tim product design.",
        "Mahasiswa aktif S1 Sistem Informasi / Teknik Informatika semester 5-7. Menguasai Figma, Design System, dan Prototyping. Portofolio UI/UX diutamakan.",
        "Surabaya / Hybrid", "2027-01-05", "2027-06-30", 3, "2026-12-15", "aktif", ""
      ],
      [
        "LOW-002", "MTR-101", "ADM-001", "Full-Stack Web Developer", "Pekerjaan",
        "Membangun sistem microservices scalable, mengembangkan RESTful API & integrasi front-end modern berbasis React & Node.js untuk produk enterprise.",
        "Lulusan S1 rumpun Informatika/Ilmu Komputer (Fresh Graduate / Pengalaman < 2 tahun). Menguasai JavaScript/TypeScript, SQL, dan Docker.",
        "Malang (On-site)", "2027-01-01", "2028-01-01", 2, "2026-12-20", "aktif", ""
      ],
      [
        "LOW-003", "MTR-102", "", "Mobile Developer Intern (Flutter)", "Magang Bersertifikat",
        "Membantu perancangan modul transaksi e-commerce, optimalisasi performa rendering aplikasi mobile, dan pengujian unit testing.",
        "Mahasiswa aktif FILKOM UB. Menguasai Flutter/Dart, state management (BLoC/Riverpod), dan version control Git.",
        "Jakarta (Remote)", "2027-02-01", "2027-07-31", 5, "2026-12-31", "menunggu", ""
      ]
    ],
    pendaftaran: [
      [
        "REG-001", "LOW-001", "USR-001", "wawancara", 
        "Selamat! Berkas administrasi Anda lolos kurasi. Wawancara daring via Google Meet dijadwalkan pada 10 Des 2026 pk 10.00 WIB (Link: meet.google.com/fil-komu-bxb).", 
        "2026-11-02 09:15:00"
      ]
    ],
    berkas_persyaratan: [
      [
        "BRK-001", "REG-001", "CV", "cv_bambang_prakoso.pdf", 842, 
        "drive_file_id_001", "https://drive.google.com/file/d/1BambangCV_DummyDriveLink/view?usp=sharing", "2026-11-02 09:12:00"
      ],
      [
        "BRK-002", "REG-001", "Transkrip", "transkrip_nilai_bambang.pdf", 1250, 
        "drive_file_id_002", "https://drive.google.com/file/d/1BambangTranskrip_DummyDriveLink/view?usp=sharing", "2026-11-02 09:13:00"
      ],
      [
        "BRK-003", "REG-001", "Surat Rekomendasi", "surat_rekomendasi_fakultas_bambang.pdf", 620, 
        "drive_file_id_003", "https://drive.google.com/file/d/1BambangRekom_DummyDriveLink/view?usp=sharing", "2026-11-02 09:14:00"
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
          tingkat_tempat_kerja: "Nasional Terbuka / Multinasional",
          relevansi_kurikulum: "Sangat Relevan dengan kebutuhan industri software saat ini"
        }),
        false, "tervalidasi", false, "SIMAGA/TS/2026/0001", "2026-10-30 14:20:00"
      ],
      [
        "TRC-002", "215150400111001", "", 2026, "Bekerja",
        JSON.stringify({
          instansi: "PT Inovasi Sentosa",
          posisi: "Junior UI Designer",
          gaji: ">50jt",
          gaji_nominal: 85000000, // ANOMALI: Gaji fresh graduate Rp 85jt memicu auto-flagging sistem!
          masa_tunggu: 1,
          keselarasan: 4,
          tingkat_tempat_kerja: "Lokal",
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
      ["NTF-002", "USR-002", "kurasi_lowongan", "Lowongan Disetujui", "Lowongan UI/UX Designer Intern telah disetujui oleh unit Career & Internship.", true, "2026-11-01 11:30:00"],
      ["NTF-003", "USR-003", "tracer_study", "Pengisian Tracer Study Aktif", "Halo Yaya, kuesioner pelacakan karier alumni periode 2026 telah dibuka.", false, "2026-11-01 08:30:00"]
    ]
  };

  // Warna Palette Tema FILKOM UB (Deep Emerald Green & Warm Gold)
  const HEADER_BG_COLOR = "#143E35";
  const HEADER_TEXT_COLOR = "#FFFFFF";

  // Loop setiap tabel untuk dibuatkan sheet
  for (const tableName in tableSchemas) {
    let sheet = ss.getSheetByName(tableName);
    if (!sheet) {
      sheet = ss.insertSheet(tableName);
      Logger.log(`Sheet '${tableName}' berhasil dibuat.`);
    } else {
      sheet.clear();
      Logger.log(`Sheet '${tableName}' dibersihkan untuk inisialisasi ulang.`);
    }

    const headers = tableSchemas[tableName];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    // Format Baris Header
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground(HEADER_BG_COLOR);
    headerRange.setFontColor(HEADER_TEXT_COLOR);
    headerRange.setFontWeight("bold");
    headerRange.setFontSize(10);
    headerRange.setHorizontalAlignment("center");
    headerRange.setVerticalAlignment("middle");
    sheet.setRowHeight(1, 35);
    sheet.setFrozenRows(1);

    // Isi Data Awal / Dummy
    const rows = initialData[tableName];
    if (rows && rows.length > 0) {
      sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
      sheet.getRange(2, 1, rows.length, headers.length).setFontSize(9);
    }

    // Auto-fit kolom
    for (let c = 1; c <= headers.length; c++) {
      sheet.autoResizeColumn(c);
    }
  }

  // Hapus sheet bawaan "Sheet1" jika ada
  const defaultSheet = ss.getSheetByName("Sheet1") || ss.getSheetByName("Lembar1");
  if (defaultSheet && ss.getSheets().length > 1) {
    try {
      ss.deleteSheet(defaultSheet);
    } catch (e) {
      // Abaikan jika tidak dapat dihapus
    }
  }

  // Inisialisasi folder Google Drive
  setupDriveFolders();

  Logger.log("Inisialisasi 11 Sheet SIMAGA & Google Drive Selesai dengan Sukses!");
}

/**
 * Membuat folder root Google Drive 'SIMAGA_Storage' dan mengatur perizinan akses
 */
function setupDriveFolders() {
  const FOLDER_NAME = "SIMAGA_Storage";
  const folders = DriveApp.getFoldersByName(FOLDER_NAME);
  let rootFolder;

  if (folders.hasNext()) {
    rootFolder = folders.next();
    Logger.log(`Folder Google Drive '${FOLDER_NAME}' sudah ada (ID: ${rootFolder.getId()}).`);
  } else {
    rootFolder = DriveApp.createFolder(FOLDER_NAME);
    Logger.log(`Folder Google Drive '${FOLDER_NAME}' baru berhasil dibuat (ID: ${rootFolder.getId()}).`);
  }

  // Atur izin agar file dapat diakses/dilihat oleh mitra dan admin melalui link
  try {
    rootFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (err) {
    Logger.log("Pengaturan perizinan folder: " + err.message);
  }

  return rootFolder.getId();
}
