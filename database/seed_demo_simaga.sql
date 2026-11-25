-- ==============================================================================
-- SIMAGA FILKOM UB - SEEDER DATA DEMO PRESENTASI (MySQL 8 / MariaDB 10.4+)
-- Versi seed: 2026-11-26-demo-v2  (identik dengan server/seed/seedData.js)
-- ==============================================================================
-- Cara pakai (database db_simaga yang SUDAH ada):
--   mysql -u root -p db_simaga < database/seed_demo_simaga.sql
-- Skrip ini: (1) menambah kolom baru bila belum ada, (2) MENGHAPUS seluruh data lama,
-- (3) mengisi ulang data uji yang saling berelasi untuk 4 peran.
--
-- Skenario uji:
--   Mahasiswa bambang@student.ub.ac.id / bambang123 -> sudah melamar LOW-001 (wawancara);
--             LOW-003..LOW-006 aktif & belum dilamar -> uji "Ajukan Lamaran"
--   Alumni    yaya@alumni.ub.ac.id / yaya123 -> draf TRC-010 -> uji lanjut isi & kirim final
--   Mitra     carmen@techindo.com / mitra123 -> REG-001..004 (4 status seleksi) + 3 PDF valid;
--             LOW-011 (menunggu) untuk uji Edit/Hapus; LOW-012 (ditolak) ada catatan revisi
--   Admin     dina@ub.ac.id / admin123 -> LOW-009 (Setujui), LOW-010 (Tolak + catatan);
--             TRC-008 (menunggu normal) & TRC-009 (menunggu, anomali masa tunggu 40 bln);
--             3 alumni "Belum Mengisi" -> Kirim Pengingat Massal (penerima > 0)
-- ==============================================================================

USE `db_simaga`;
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------------------------
-- A. Bersihkan data lama
-- ------------------------------------------------------------------------------
DELETE FROM `notifikasi`;
DELETE FROM `riwayat_pengingat`;
DELETE FROM `kuesioner`;
DELETE FROM `berkas_persyaratan`;
DELETE FROM `pendaftaran`;
DELETE FROM `lowongan`;
DELETE FROM `mitra_industri`;
DELETE FROM `admin`;
DELETE FROM `alumni`;
DELETE FROM `mahasiswa`;
DELETE FROM `pengguna`;

-- ------------------------------------------------------------------------------
-- B. Migrasi skema (aman dijalankan berulang)
-- ------------------------------------------------------------------------------
-- B1. lowongan.bidang_keahlian (filter "Semua Bidang Keahlian" di Katalog Magang)
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'lowongan' AND COLUMN_NAME = 'bidang_keahlian');
SET @q := IF(@c = 0, "ALTER TABLE `lowongan` ADD COLUMN `bidang_keahlian` ENUM('UI/UX Design','Web & Mobile Development','Data & AI','Quality Assurance & DevOps','Sistem & Jaringan') NOT NULL DEFAULT 'Web & Mobile Development' AFTER `jenis_kesempatan`", 'SELECT 1');
PREPARE st FROM @q; EXECUTE st; DEALLOCATE PREPARE st;

-- B2. berkas_persyaratan.drive_file_id & drive_url (tautan berkas absolut https://)
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'berkas_persyaratan' AND COLUMN_NAME = 'drive_file_id');
SET @q := IF(@c = 0, 'ALTER TABLE `berkas_persyaratan` ADD COLUMN `drive_file_id` VARCHAR(255) DEFAULT NULL AFTER `ukuran_kb`', 'SELECT 1');
PREPARE st FROM @q; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'berkas_persyaratan' AND COLUMN_NAME = 'drive_url');
SET @q := IF(@c = 0, 'ALTER TABLE `berkas_persyaratan` ADD COLUMN `drive_url` VARCHAR(500) NOT NULL AFTER `drive_file_id`', 'SELECT 1');
PREPARE st FROM @q; EXECUTE st; DEALLOCATE PREPARE st;

-- B3. kuesioner.status_karir boleh NULL saat draf (UC-08)
ALTER TABLE `kuesioner` MODIFY `status_karir` ENUM('Bekerja','Wirausaha','Melanjutkan Studi','Mencari Kerja') DEFAULT NULL;

-- ------------------------------------------------------------------------------
-- C. Data uji
-- ------------------------------------------------------------------------------
-- 1. pengguna (22 baris)
INSERT INTO `pengguna` (`id_user`, `email`, `password_hash`, `nama_lengkap`, `role`, `status_akun`) VALUES
  ('USR-001', 'bambang@student.ub.ac.id', 'bambang123', 'Bambang Prakoso', 'Mahasiswa', 'aktif'),
  ('USR-002', 'carmen@techindo.com', 'mitra123', 'Carmenita Wijaya, S.Kom.', 'MitraIndustri', 'aktif'),
  ('USR-003', 'yaya@alumni.ub.ac.id', 'yaya123', 'Yaffa Anindya Oktaviani', 'Alumni', 'aktif'),
  ('USR-004', 'dina@ub.ac.id', 'admin123', 'Dina Safitri, S.Kom., M.T.', 'Admin', 'aktif'),
  ('USR-005', 'kevin@student.ub.ac.id', 'kevin123', 'Kevin Sanjaya', 'Mahasiswa', 'aktif'),
  ('USR-013', 'nadia@student.ub.ac.id', 'nadia123', 'Nadia Putri Ramadhani', 'Mahasiswa', 'aktif'),
  ('USR-014', 'fikri@student.ub.ac.id', 'fikri123', 'Fikri Maulana', 'Mahasiswa', 'aktif'),
  ('USR-015', 'salsa@student.ub.ac.id', 'salsa123', 'Salsabila Azzahra', 'Mahasiswa', 'aktif'),
  ('USR-010', 'nonaktif@student.ub.ac.id', 'pass123', 'Akun Ditangguhkan', 'Mahasiswa', 'nonaktif'),
  ('USR-009', 'recruitment@shopee.co.id', 'shopee123', 'Jessica Tan', 'MitraIndustri', 'aktif'),
  ('USR-012', 'hr.recruitment@bca.co.id', 'bca123', 'Budi Santoso', 'MitraIndustri', 'aktif'),
  ('USR-006', 'rian@alumni.ub.ac.id', 'rian123', 'Rian Pratama, S.Kom.', 'Alumni', 'aktif'),
  ('USR-007', 'sarah@alumni.ub.ac.id', 'sarah123', 'Sarah Amalia, S.Pd.', 'Alumni', 'aktif'),
  ('USR-008', 'dimas@alumni.ub.ac.id', 'dimas123', 'Dimas Aditya, S.Kom.', 'Alumni', 'aktif'),
  ('USR-016', 'putri@alumni.ub.ac.id', 'putri123', 'Putri Anggraini, S.Kom.', 'Alumni', 'aktif'),
  ('USR-017', 'andi@alumni.ub.ac.id', 'andi123', 'Andi Wijaya, S.T.', 'Alumni', 'aktif'),
  ('USR-018', 'laras@alumni.ub.ac.id', 'laras123', 'Larasati Dewi, S.Kom.', 'Alumni', 'aktif'),
  ('USR-019', 'hendra@alumni.ub.ac.id', 'hendra123', 'Hendra Kurniawan, S.Kom.', 'Alumni', 'aktif'),
  ('USR-020', 'gilang@alumni.ub.ac.id', 'gilang123', 'Gilang Ramadhan, S.Kom.', 'Alumni', 'aktif'),
  ('USR-021', 'citra@alumni.ub.ac.id', 'citra123', 'Citra Lestari, S.Kom.', 'Alumni', 'aktif'),
  ('USR-011', 'callum@alumni.ub.ac.id', 'callum123', 'Callum Turner, S.Kom.', 'Alumni', 'aktif'),
  ('USR-022', 'rizky@alumni.ub.ac.id', 'rizky123', 'Rizky Firmansyah, S.T.', 'Alumni', 'aktif');

-- 2. mahasiswa (6 baris)
INSERT INTO `mahasiswa` (`nim`, `id_user`, `prodi`, `angkatan`, `ipk`) VALUES
  ('255150407111077', 'USR-001', 'Sistem Informasi', 2025, 3.82),
  ('255150400111068', 'USR-005', 'Teknik Informatika', 2025, 3.75),
  ('235150401111012', 'USR-013', 'Teknologi Informasi', 2023, 3.68),
  ('235150300111045', 'USR-014', 'Teknik Komputer', 2023, 3.41),
  ('235150207111020', 'USR-015', 'Teknik Informatika', 2023, 3.9),
  ('245150400111099', 'USR-010', 'Teknik Informatika', 2024, 3.1);

-- 3. alumni (12 baris)
INSERT INTO `alumni` (`nim`, `id_user`, `prodi`, `tahun_lulus`, `status_pengisian`) VALUES
  ('215150400111001', 'USR-003', 'Sistem Informasi', 2025, 'Belum Mengisi'),
  ('215150407111097', 'USR-006', 'Teknik Informatika', 2024, 'Telah Mengisi'),
  ('215150401111033', 'USR-007', 'Pendidikan Teknologi Informasi', 2025, 'Telah Mengisi'),
  ('205150407111055', 'USR-008', 'Teknologi Informasi', 2024, 'Telah Mengisi'),
  ('195150401111021', 'USR-016', 'Sistem Informasi', 2023, 'Telah Mengisi'),
  ('195150300111008', 'USR-017', 'Teknik Komputer', 2023, 'Telah Mengisi'),
  ('205150400111019', 'USR-018', 'Sistem Informasi', 2024, 'Telah Mengisi'),
  ('215150201111044', 'USR-019', 'Teknik Informatika', 2025, 'Telah Mengisi'),
  ('195150201111030', 'USR-020', 'Teknik Informatika', 2023, 'Telah Mengisi'),
  ('215150400111066', 'USR-021', 'Sistem Informasi', 2025, 'Telah Mengisi'),
  ('215150207111122', 'USR-011', 'Teknik Informatika', 2025, 'Belum Mengisi'),
  ('205150300111077', 'USR-022', 'Teknik Komputer', 2024, 'Belum Mengisi');

-- 4. admin (1 baris)
INSERT INTO `admin` (`id_admin`, `id_user`, `unit_kerja`) VALUES
  ('ADM-001', 'USR-004', 'Career & Internship');

-- 5. mitra_industri (3 baris)
INSERT INTO `mitra_industri` (`id_mitra`, `id_user`, `nama_perusahaan`, `alamat`, `kontak_person`, `no_telepon`, `status_kemitraan`) VALUES
  ('MTR-101', 'USR-002', 'PT Tech Indo Mandiri', 'Jl. Jakarta No. 2, Lowokwaru, Malang', 'Carmenita Wijaya', '081230261706', 'aktif'),
  ('MTR-102', 'USR-009', 'PT Shopee International Indonesia', 'Pacific Century Place Lt. 25, SCBD, Jakarta Selatan', 'Jessica Tan', '081299887766', 'aktif'),
  ('MTR-103', 'USR-012', 'PT Bank Central Asia Tbk', 'Menara BCA, Grand Indonesia, Jakarta Pusat', 'Budi Santoso', '081333444555', 'aktif');

-- 6. lowongan (12 baris)
INSERT INTO `lowongan` (`id_lowongan`, `id_mitra`, `id_admin`, `judul_posisi`, `jenis_kesempatan`, `bidang_keahlian`, `deskripsi`, `kualifikasi`, `lokasi`, `periode_mulai`, `periode_selesai`, `kuota`, `batas_pendaftaran`, `status_publikasi`, `catatan_revisi`) VALUES
  ('LOW-001', 'MTR-101', 'ADM-001', 'UI/UX Designer Intern', 'Magang Bersertifikat', 'UI/UX Design', 'Merancang antarmuka web dan mobile berbasis design system, menyusun wireframe & prototipe, serta melakukan usability testing bersama tim produk.', 'Mahasiswa aktif SI/TI semester 5-7. Mahir Figma dan prototyping. Memiliki portofolio desain UI/UX.', 'Surabaya (Hybrid)', '2027-01-05', '2027-06-30', 3, '2026-12-15', 'aktif', NULL),
  ('LOW-002', 'MTR-101', 'ADM-001', 'Full-Stack Web Developer', 'Pekerjaan', 'Web & Mobile Development', 'Membangun platform web dan REST API berbasis React & Node.js untuk layanan akademik klien perusahaan.', 'Lulusan S1 rumpun Ilmu Komputer. Menguasai JavaScript/TypeScript, SQL, dan Docker.', 'Malang (On-site)', '2027-01-04', '2028-01-04', 2, '2026-12-20', 'aktif', NULL),
  ('LOW-003', 'MTR-102', 'ADM-001', 'Mobile Developer Intern (Flutter)', 'Magang Bersertifikat', 'Web & Mobile Development', 'Mengembangkan fitur aplikasi mobile seller center, integrasi API, dan unit testing fungsionalitas.', 'Mahasiswa aktif FILKOM UB. Menguasai Flutter/Dart, state management, dan Git.', 'Jakarta (Remote)', '2027-02-01', '2027-07-31', 5, '2026-12-31', 'aktif', NULL),
  ('LOW-004', 'MTR-103', 'ADM-001', 'Data Analyst & Business Intelligence Intern', 'Magang Bersertifikat', 'Data & AI', 'Mengolah data transaksi perbankan, menyusun dashboard Power BI, dan menganalisis tren layanan digital.', 'Mahasiswa aktif SI/TIF semester 5-7. Mahir SQL, Python (Pandas), dan visualisasi data.', 'Jakarta (Hybrid)', '2027-01-15', '2027-07-15', 4, '2026-12-25', 'aktif', NULL),
  ('LOW-005', 'MTR-101', 'ADM-001', 'Software QA & DevOps Intern', 'Magang Bersertifikat', 'Quality Assurance & DevOps', 'Menyusun skenario uji, automated testing (Cypress/Postman), serta membantu pipeline CI/CD berbasis Docker.', 'Mahasiswa aktif FILKOM UB semester 5-7. Memahami SDLC Agile dan dasar Linux.', 'Malang (On-site)', '2027-01-10', '2027-06-30', 2, '2026-12-30', 'aktif', NULL),
  ('LOW-006', 'MTR-103', 'ADM-001', 'Network & Infrastructure Intern', 'Magang Bersertifikat', 'Sistem & Jaringan', 'Membantu pemantauan jaringan kantor cabang, konfigurasi perangkat, dan dokumentasi insiden infrastruktur TI.', 'Mahasiswa aktif Teknik Komputer/TIF. Memahami TCP/IP, routing dasar, dan Linux server.', 'Surabaya (On-site)', '2027-02-01', '2027-07-31', 2, '2027-01-10', 'aktif', NULL),
  ('LOW-007', 'MTR-102', 'ADM-001', 'Data Scientist (Fresh Graduate)', 'Pekerjaan', 'Data & AI', 'Mengembangkan model rekomendasi produk dan eksperimen A/B untuk marketplace.', 'Alumni S1 rumpun Informatika. Menguasai Python, Scikit-learn, dan statistik.', 'Jakarta (On-site)', '2027-02-01', '2028-02-01', 3, '2026-12-28', 'aktif', NULL),
  ('LOW-008', 'MTR-103', 'ADM-001', 'IT Security Analyst', 'Pekerjaan', 'Sistem & Jaringan', 'Melakukan vulnerability assessment, analisis log SOC, dan penguatan keamanan sistem perbankan.', 'Alumni S1 FILKOM UB. Memahami OWASP Top 10, network protocols, dan SIEM.', 'Jakarta (Hybrid)', '2027-01-15', '2028-01-15', 2, '2027-01-05', 'aktif', NULL),
  ('LOW-009', 'MTR-101', NULL, 'Machine Learning Engineer Intern', 'Magang Bersertifikat', 'Data & AI', 'Membangun pipeline data dan melatih model klasifikasi dokumen untuk produk internal.', 'Mahasiswa aktif TIF/SI semester 5-7. Menguasai Python dan dasar deep learning.', 'Remote', '2027-02-15', '2027-08-15', 2, '2027-01-20', 'menunggu', NULL),
  ('LOW-010', 'MTR-102', NULL, 'Product Designer (UI/UX)', 'Pekerjaan', 'UI/UX Design', 'Mendesain alur pengguna fitur pembayaran dan berkolaborasi dengan tim riset pengguna.', 'Alumni S1. Portofolio desain produk digital.', 'Jakarta (Hybrid)', '2027-02-01', '2028-02-01', 1, '2027-01-15', 'menunggu', NULL),
  ('LOW-011', 'MTR-101', NULL, 'DevOps Engineer (Junior)', 'Pekerjaan', 'Quality Assurance & DevOps', 'Mengelola deployment container, monitoring, dan otomasi infrastruktur cloud.', 'Alumni S1 FILKOM UB. Memahami Docker, Kubernetes, dan CI/CD.', 'Malang (Hybrid)', '2027-02-01', '2028-02-01', 1, '2027-01-25', 'menunggu', NULL),
  ('LOW-012', 'MTR-101', 'ADM-001', 'Backend Developer Intern (Go)', 'Magang Bersertifikat', 'Web & Mobile Development', 'Membantu pengembangan layanan backend.', 'Mahasiswa aktif.', 'Malang (On-site)', '2027-01-05', '2027-03-05', 1, '2026-12-10', 'ditolak', 'Durasi magang minimal 4 bulan dan deskripsi tugas belum rinci. Silakan ajukan ulang dengan rincian kegiatan mingguan.');

-- 7. pendaftaran (5 baris)
INSERT INTO `pendaftaran` (`id_pendaftaran`, `id_lowongan`, `id_user`, `status_seleksi`, `catatan_seleksi`, `tanggal_daftar`) VALUES
  ('REG-001', 'LOW-001', 'USR-001', 'wawancara', 'Berkas lolos kurasi. Wawancara daring via Google Meet pada 10 Des 2026 pukul 10.00 WIB.', '2026-11-02 09:15:00'),
  ('REG-002', 'LOW-001', 'USR-005', 'berkas_terkirim', 'Lamaran terkirim dan sedang dalam antrean pemeriksaan berkas.', '2026-11-10 13:40:00'),
  ('REG-003', 'LOW-005', 'USR-013', 'diterima', 'Selamat! Anda diterima. Onboarding 10 Januari 2027 di kantor Malang.', '2026-11-04 08:20:00'),
  ('REG-004', 'LOW-005', 'USR-014', 'ditolak', 'Terima kasih atas minat Anda. Kuota posisi telah terpenuhi.', '2026-11-05 15:05:00'),
  ('REG-005', 'LOW-004', 'USR-015', 'berkas_terkirim', 'Lamaran terkirim dan sedang dalam antrean pemeriksaan berkas.', '2026-11-12 10:30:00');

-- 8. berkas_persyaratan (15 baris)
INSERT INTO `berkas_persyaratan` (`id_berkas`, `id_pendaftaran`, `jenis_berkas`, `nama_file`, `ukuran_kb`, `drive_file_id`, `drive_url`, `tanggal_unggah`) VALUES
  ('BRK-001', 'REG-001', 'CV', 'cv_bambang_prakoso.pdf', 2, NULL, 'https://simaga-filkom-ub-production.up.railway.app/sample-berkas/cv_bambang_prakoso.pdf', '2026-11-02 09:10:00'),
  ('BRK-002', 'REG-001', 'Transkrip', 'transkrip_bambang_prakoso.pdf', 2, NULL, 'https://simaga-filkom-ub-production.up.railway.app/sample-berkas/transkrip_bambang_prakoso.pdf', '2026-11-02 09:11:00'),
  ('BRK-003', 'REG-001', 'Surat Rekomendasi', 'surat_rekomendasi_bambang_prakoso.pdf', 2, NULL, 'https://simaga-filkom-ub-production.up.railway.app/sample-berkas/surat_rekomendasi_bambang_prakoso.pdf', '2026-11-02 09:12:00'),
  ('BRK-004', 'REG-002', 'CV', 'cv_kevin_sanjaya.pdf', 2, NULL, 'https://simaga-filkom-ub-production.up.railway.app/sample-berkas/cv_kevin_sanjaya.pdf', '2026-11-10 09:10:00'),
  ('BRK-005', 'REG-002', 'Transkrip', 'transkrip_kevin_sanjaya.pdf', 2, NULL, 'https://simaga-filkom-ub-production.up.railway.app/sample-berkas/transkrip_kevin_sanjaya.pdf', '2026-11-10 09:11:00'),
  ('BRK-006', 'REG-002', 'Surat Rekomendasi', 'surat_rekomendasi_kevin_sanjaya.pdf', 2, NULL, 'https://simaga-filkom-ub-production.up.railway.app/sample-berkas/surat_rekomendasi_kevin_sanjaya.pdf', '2026-11-10 09:12:00'),
  ('BRK-007', 'REG-003', 'CV', 'cv_nadia_putri.pdf', 2, NULL, 'https://simaga-filkom-ub-production.up.railway.app/sample-berkas/cv_nadia_putri.pdf', '2026-11-04 09:10:00'),
  ('BRK-008', 'REG-003', 'Transkrip', 'transkrip_nadia_putri.pdf', 2, NULL, 'https://simaga-filkom-ub-production.up.railway.app/sample-berkas/transkrip_nadia_putri.pdf', '2026-11-04 09:11:00'),
  ('BRK-009', 'REG-003', 'Surat Rekomendasi', 'surat_rekomendasi_nadia_putri.pdf', 2, NULL, 'https://simaga-filkom-ub-production.up.railway.app/sample-berkas/surat_rekomendasi_nadia_putri.pdf', '2026-11-04 09:12:00'),
  ('BRK-010', 'REG-004', 'CV', 'cv_fikri_maulana.pdf', 2, NULL, 'https://simaga-filkom-ub-production.up.railway.app/sample-berkas/cv_fikri_maulana.pdf', '2026-11-05 09:10:00'),
  ('BRK-011', 'REG-004', 'Transkrip', 'transkrip_fikri_maulana.pdf', 2, NULL, 'https://simaga-filkom-ub-production.up.railway.app/sample-berkas/transkrip_fikri_maulana.pdf', '2026-11-05 09:11:00'),
  ('BRK-012', 'REG-004', 'Surat Rekomendasi', 'surat_rekomendasi_fikri_maulana.pdf', 2, NULL, 'https://simaga-filkom-ub-production.up.railway.app/sample-berkas/surat_rekomendasi_fikri_maulana.pdf', '2026-11-05 09:12:00'),
  ('BRK-013', 'REG-005', 'CV', 'cv_salsabila_azzahra.pdf', 2, NULL, 'https://simaga-filkom-ub-production.up.railway.app/sample-berkas/cv_salsabila_azzahra.pdf', '2026-11-12 09:10:00'),
  ('BRK-014', 'REG-005', 'Transkrip', 'transkrip_salsabila_azzahra.pdf', 2, NULL, 'https://simaga-filkom-ub-production.up.railway.app/sample-berkas/transkrip_salsabila_azzahra.pdf', '2026-11-12 09:11:00'),
  ('BRK-015', 'REG-005', 'Surat Rekomendasi', 'surat_rekomendasi_salsabila_azzahra.pdf', 2, NULL, 'https://simaga-filkom-ub-production.up.railway.app/sample-berkas/surat_rekomendasi_salsabila_azzahra.pdf', '2026-11-12 09:12:00');

-- 9. kuesioner (10 baris)
INSERT INTO `kuesioner` (`id_kuesioner`, `nim`, `id_admin`, `periode_survei`, `status_karir`, `data_jawaban`, `is_draft`, `status_validasi`, `is_anomali`, `nomor_referensi`, `tanggal_submit`) VALUES
  ('TRC-001', '215150407111097', 'ADM-001', 2026, 'Bekerja', '{"instansi":"PT GoTo Gojek Tokopedia Tbk","posisi":"Software Engineer","gaji":"8-15jt","gaji_nominal":9500000,"masa_tunggu":2,"tingkat_tempat_kerja":"Nasional","keselarasan":5,"relevansi_kurikulum":"Sangat relevan dengan kebutuhan industri software."}', 0, 'tervalidasi', 0, 'SIMAGA/TS/2026/0001', '2026-10-30 14:20:00'),
  ('TRC-002', '215150401111033', 'ADM-001', 2026, 'Wirausaha', '{"instansi":"EduKids Coding Malang","posisi":"Founder","gaji":"5-15jt","gaji_nominal":7000000,"masa_tunggu":3,"keselarasan":4,"relevansi_kurikulum":"Mata kuliah pedagogi dan pemrograman sangat membantu."}', 0, 'tervalidasi', 0, 'SIMAGA/TS/2026/0002', '2026-11-01 09:10:00'),
  ('TRC-003', '205150407111055', 'ADM-001', 2026, 'Melanjutkan Studi', '{"instansi":"Institut Teknologi Bandung","posisi":"Mahasiswa S2 Informatika","sumber_biaya":"Beasiswa LPDP","masa_tunggu":5,"keselarasan":5,"relevansi_kurikulum":"Bekal riset dari skripsi sangat berguna."}', 0, 'tervalidasi', 0, 'SIMAGA/TS/2026/0003', '2026-11-01 13:45:00'),
  ('TRC-004', '195150401111021', 'ADM-001', 2026, 'Bekerja', '{"instansi":"PT Telkom Indonesia (Persero) Tbk","posisi":"System Analyst","gaji":"8-15jt","gaji_nominal":11000000,"masa_tunggu":4,"tingkat_tempat_kerja":"Nasional","keselarasan":5,"relevansi_kurikulum":"Analisis proses bisnis sangat relevan."}', 0, 'tervalidasi', 0, 'SIMAGA/TS/2026/0004', '2026-11-02 10:00:00'),
  ('TRC-005', '195150300111008', 'ADM-001', 2026, 'Mencari Kerja', '{"instansi":"-","posisi":"-","masa_tunggu":9,"keselarasan":3,"relevansi_kurikulum":"Perlu lebih banyak praktik embedded system berbasis industri."}', 0, 'tervalidasi', 0, 'SIMAGA/TS/2026/0005', '2026-11-03 16:30:00'),
  ('TRC-006', '205150400111019', 'ADM-001', 2026, 'Bekerja', '{"instansi":"PT Bank Mandiri (Persero) Tbk","posisi":"IT Business Analyst","gaji":"8-15jt","gaji_nominal":10500000,"masa_tunggu":1,"tingkat_tempat_kerja":"Nasional","keselarasan":4,"relevansi_kurikulum":"Relevan, terutama mata kuliah manajemen proyek."}', 0, 'tervalidasi', 0, 'SIMAGA/TS/2026/0006', '2026-11-04 08:45:00'),
  ('TRC-007', '215150201111044', 'ADM-001', 2026, 'Wirausaha', '{"instansi":"Studio Aplikasi Nusantara","posisi":"Co-Founder & CTO","gaji":"15-50jt","gaji_nominal":18000000,"masa_tunggu":2,"keselarasan":5,"relevansi_kurikulum":"Kewirausahaan berbasis teknologi sangat membantu."}', 0, 'tervalidasi', 0, 'SIMAGA/TS/2026/0007', '2026-11-05 11:20:00'),
  ('TRC-008', '195150201111030', NULL, 2026, 'Bekerja', '{"instansi":"PT Traveloka Indonesia","posisi":"Backend Engineer","gaji":"15-30jt","gaji_nominal":16000000,"masa_tunggu":3,"tingkat_tempat_kerja":"Multinasional / Internasional","keselarasan":5,"relevansi_kurikulum":"Sangat relevan."}', 0, 'menunggu', 0, 'SIMAGA/TS/2026/0008', '2026-11-18 19:05:00'),
  ('TRC-009', '215150400111066', NULL, 2026, 'Bekerja', '{"instansi":"CV Maju Jaya Digital","posisi":"Staf IT Support","gaji":"4-8jt","gaji_nominal":4500000,"masa_tunggu":40,"tingkat_tempat_kerja":"Lokal / Wilayah","keselarasan":3,"relevansi_kurikulum":"Cukup relevan."}', 0, 'menunggu', 1, 'SIMAGA/TS/2026/0009', '2026-11-20 07:50:00'),
  ('TRC-010', '215150400111001', NULL, 2026, 'Bekerja', '{"instansi":"PT Tech Indo Mandiri","posisi":"","gaji":"","gaji_nominal":"","masa_tunggu":"","keselarasan":4,"relevansi_kurikulum":""}', 1, 'menunggu', 0, NULL, NULL);

-- 10. riwayat_pengingat (1 baris)
INSERT INTO `riwayat_pengingat` (`id_pengingat`, `id_admin`, `filter_target`, `jumlah_penerima`, `tanggal_kirim`) VALUES
  ('RMD-001', 'ADM-001', 'Semua Prodi (Semua Angkatan)', 5, '2026-11-01 08:00:00');

-- 11. notifikasi (5 baris)
INSERT INTO `notifikasi` (`id_notifikasi`, `id_user`, `jenis`, `judul`, `pesan`, `is_dibaca`, `tanggal_kirim`) VALUES
  ('NTF-001', 'USR-001', 'status_seleksi', 'Status Lamaran Diperbarui', 'Anda dijadwalkan wawancara daring pada 10 Des 2026 untuk posisi UI/UX Designer Intern.', 0, '2026-11-03 10:00:00'),
  ('NTF-002', 'USR-002', 'kurasi_lowongan', 'Lowongan Disetujui', 'Lowongan ''UI/UX Designer Intern'' telah disetujui dan kini aktif dipublikasikan.', 1, '2026-11-01 11:30:00'),
  ('NTF-003', 'USR-002', 'kurasi_lowongan', 'Lowongan Ditolak', 'Lowongan ''Backend Developer Intern (Go)'' ditolak. Periksa catatan revisi pada menu Lowongan Saya.', 0, '2026-11-08 14:00:00'),
  ('NTF-004', 'USR-003', 'tracer_study', 'Pengisian Tracer Study Aktif', 'Halo Yaffa, kuesioner pelacakan karier alumni periode 2026 telah dibuka. Draf Anda tersimpan.', 0, '2026-11-01 08:30:00'),
  ('NTF-005', 'USR-004', 'kurasi_lowongan', 'Pengajuan Lowongan Baru', '3 lowongan menunggu kurasi Career & Internship.', 0, '2026-11-21 09:00:00');

SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------------------------
-- D. Cek cepat sebaran grafik Admin (hanya kuesioner tervalidasi)
-- ------------------------------------------------------------------------------
-- SELECT a.prodi, a.tahun_lulus, k.status_karir, COUNT(*) AS jumlah
-- FROM kuesioner k JOIN alumni a ON a.nim = k.nim
-- WHERE k.is_draft = 0 AND k.status_validasi = 'tervalidasi'
-- GROUP BY a.prodi, a.tahun_lulus, k.status_karir;
