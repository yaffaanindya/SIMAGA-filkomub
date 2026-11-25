-- ==============================================================================
-- SISTEM INFORMASI MAGANG DAN ALUMNI (SIMAGA) FILKOM UB
-- Script Inisialisasi Database Relasional MySQL: db_simaga
-- Praktikum Rekayasa Sistem Informasi Kelas B - Kelompok 8 (2026)
-- Penyusun: Nicholas Ravael (NG), M. Ushaim (MK), Yaffa Anindya (YA)
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `db_simaga` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `db_simaga`;

SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------------------------
-- 1. TABEL PENGGUNA (Tabel Induk Akun Terdaftar)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `pengguna`;
CREATE TABLE `pengguna` (
  `id_user` VARCHAR(36) NOT NULL PRIMARY KEY,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `nama_lengkap` VARCHAR(150) NOT NULL,
  `role` ENUM('Mahasiswa', 'Alumni', 'MitraIndustri', 'Admin') NOT NULL,
  `status_akun` ENUM('aktif', 'nonaktif') NOT NULL DEFAULT 'aktif',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------------
-- 2. TABEL MAHASISWA (Spesialisasi Profil Mahasiswa Aktif)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `mahasiswa`;
CREATE TABLE `mahasiswa` (
  `nim` VARCHAR(20) NOT NULL PRIMARY KEY,
  `id_user` VARCHAR(36) NOT NULL UNIQUE,
  `prodi` VARCHAR(100) NOT NULL,
  `angkatan` SMALLINT NOT NULL,
  `ipk` DECIMAL(3,2) DEFAULT 3.50,
  FOREIGN KEY (`id_user`) REFERENCES `pengguna`(`id_user`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------------
-- 3. TABEL ALUMNI (Spesialisasi Profil Lulusan)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `alumni`;
CREATE TABLE `alumni` (
  `nim` VARCHAR(20) NOT NULL PRIMARY KEY,
  `id_user` VARCHAR(36) NOT NULL UNIQUE,
  `prodi` VARCHAR(100) NOT NULL,
  `tahun_lulus` INT(4) NOT NULL,
  `status_pengisian` ENUM('Belum Mengisi', 'Telah Mengisi') NOT NULL DEFAULT 'Belum Mengisi',
  FOREIGN KEY (`id_user`) REFERENCES `pengguna`(`id_user`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------------
-- 4. TABEL ADMIN (Profil Pengelola Unit Career & Internship)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `admin`;
CREATE TABLE `admin` (
  `id_admin` VARCHAR(36) NOT NULL PRIMARY KEY,
  `id_user` VARCHAR(36) NOT NULL UNIQUE,
  `unit_kerja` VARCHAR(100) NOT NULL DEFAULT 'Career & Internship FILKOM UB',
  FOREIGN KEY (`id_user`) REFERENCES `pengguna`(`id_user`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------------
-- 5. TABEL MITRA_INDUSTRI (Profil Perusahaan Rekanan Resmi)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `mitra_industri`;
CREATE TABLE `mitra_industri` (
  `id_mitra` VARCHAR(36) NOT NULL PRIMARY KEY,
  `id_user` VARCHAR(36) NOT NULL UNIQUE,
  `nama_perusahaan` VARCHAR(150) NOT NULL,
  `alamat` TEXT NOT NULL,
  `kontak_person` VARCHAR(100) NOT NULL,
  `no_telepon` VARCHAR(20) NOT NULL,
  `status_kemitraan` ENUM('aktif', 'nonaktif') NOT NULL DEFAULT 'aktif',
  FOREIGN KEY (`id_user`) REFERENCES `pengguna`(`id_user`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------------
-- 6. TABEL LOWONGAN (Katalog Lowongan Magang Bersertifikat & Pekerjaan)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `lowongan`;
CREATE TABLE `lowongan` (
  `id_lowongan` VARCHAR(36) NOT NULL PRIMARY KEY,
  `id_mitra` VARCHAR(36) NOT NULL,
  `id_admin` VARCHAR(36) DEFAULT NULL,
  `judul_posisi` VARCHAR(150) NOT NULL,
  `jenis_kesempatan` ENUM('Magang Bersertifikat', 'Pekerjaan') NOT NULL,
  `deskripsi` TEXT NOT NULL,
  `kualifikasi` TEXT NOT NULL,
  `lokasi` VARCHAR(100) NOT NULL,
  `periode_mulai` DATE NOT NULL,
  `periode_selesai` DATE NOT NULL,
  `kuota` INT NOT NULL DEFAULT 1,
  `batas_pendaftaran` DATE NOT NULL,
  `status_publikasi` ENUM('aktif', 'menunggu', 'ditolak', 'nonaktif') NOT NULL DEFAULT 'menunggu',
  `catatan_revisi` TEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`id_mitra`) REFERENCES `mitra_industri`(`id_mitra`) ON DELETE CASCADE,
  FOREIGN KEY (`id_admin`) REFERENCES `admin`(`id_admin`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------------
-- 7. TABEL PENDAFTARAN (Pengajuan Lamaran oleh Mahasiswa/Alumni)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `pendaftaran`;
CREATE TABLE `pendaftaran` (
  `id_pendaftaran` VARCHAR(36) NOT NULL PRIMARY KEY,
  `id_lowongan` VARCHAR(36) NOT NULL,
  `id_user` VARCHAR(36) NOT NULL,
  `status_seleksi` ENUM('berkas_terkirim', 'wawancara', 'diterima', 'ditolak') NOT NULL DEFAULT 'berkas_terkirim',
  `catatan_seleksi` TEXT DEFAULT NULL,
  `tanggal_daftar` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`id_lowongan`) REFERENCES `lowongan`(`id_lowongan`) ON DELETE CASCADE,
  FOREIGN KEY (`id_user`) REFERENCES `pengguna`(`id_user`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------------
-- 8. TABEL BERKAS_PERSYARATAN (Lampiran Dokumen PDF Pelamar)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `berkas_persyaratan`;
CREATE TABLE `berkas_persyaratan` (
  `id_berkas` VARCHAR(36) NOT NULL PRIMARY KEY,
  `id_pendaftaran` VARCHAR(36) NOT NULL,
  `jenis_berkas` VARCHAR(50) NOT NULL, -- 'CV', 'Transkrip', 'Surat Rekomendasi', 'Portofolio', 'Lainnya'
  `nama_file` VARCHAR(255) NOT NULL,
  `ukuran_kb` INT NOT NULL,
  `tanggal_unggah` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`id_pendaftaran`) REFERENCES `pendaftaran`(`id_pendaftaran`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------------
-- 9. TABEL KUESIONER (Instrumen Pelacakan Karier / Tracer Study Alumni)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `kuesioner`;
CREATE TABLE `kuesioner` (
  `id_kuesioner` VARCHAR(36) NOT NULL PRIMARY KEY,
  `nim` VARCHAR(20) NOT NULL,
  `id_admin` VARCHAR(36) DEFAULT NULL,
  `periode_survei` INT(4) NOT NULL,
  `status_karir` ENUM('Belum Dipilih', 'Bekerja', 'Wirausaha', 'Melanjutkan Studi', 'Mencari Kerja') NOT NULL DEFAULT 'Belum Dipilih',
  `data_jawaban` JSON NOT NULL,
  `is_draft` BOOLEAN NOT NULL DEFAULT TRUE,
  `status_validasi` ENUM('menunggu', 'tervalidasi', 'perlu_klarifikasi') NOT NULL DEFAULT 'menunggu',
  `is_anomali` BOOLEAN NOT NULL DEFAULT FALSE,
  `nomor_referensi` VARCHAR(50) DEFAULT NULL,
  `tanggal_submit` DATETIME DEFAULT NULL,
  FOREIGN KEY (`nim`) REFERENCES `alumni`(`nim`) ON DELETE CASCADE,
  FOREIGN KEY (`id_admin`) REFERENCES `admin`(`id_admin`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------------
-- 10. TABEL RIWAYAT_PENGINGAT (Catatan Broadcast Pengingat Massal oleh Admin)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `riwayat_pengingat`;
CREATE TABLE `riwayat_pengingat` (
  `id_pengingat` VARCHAR(36) NOT NULL PRIMARY KEY,
  `id_admin` VARCHAR(36) NOT NULL,
  `filter_target` VARCHAR(150) NOT NULL,
  `jumlah_penerima` INT NOT NULL DEFAULT 0,
  `tanggal_kirim` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`id_admin`) REFERENCES `admin`(`id_admin`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------------
-- 11. TABEL NOTIFIKASI (Notifikasi Terpadu Dalam Sistem)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `notifikasi`;
CREATE TABLE `notifikasi` (
  `id_notifikasi` VARCHAR(36) NOT NULL PRIMARY KEY,
  `id_user` VARCHAR(36) NOT NULL,
  `jenis` ENUM('pendaftaran', 'status_seleksi', 'kurasi_lowongan', 'tracer_study', 'pengingat', 'pengumuman', 'sistem') NOT NULL,
  `judul` VARCHAR(200) NOT NULL,
  `pesan` TEXT NOT NULL,
  `is_dibaca` BOOLEAN NOT NULL DEFAULT FALSE,
  `tanggal_kirim` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`id_user`) REFERENCES `pengguna`(`id_user`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

-- ==============================================================================
-- DATA AWAL (SEED DATA OTENTIK FILKOM UB)
-- ==============================================================================

-- 1. Pengguna
INSERT INTO `pengguna` (`id_user`, `email`, `password_hash`, `nama_lengkap`, `role`, `status_akun`) VALUES
('USR-001', 'bambang@student.ub.ac.id', '$2y$10$eO1vV5zFkQfV4dJ0rXfHgeR5sO/F8rK5f.Z7wP3h8K0jJ8r0e1u9G', 'Bambang Prakoso', 'Mahasiswa', 'aktif'),
('USR-002', 'carmen@techindo.com', '$2y$10$eO1vV5zFkQfV4dJ0rXfHgeR5sO/F8rK5f.Z7wP3h8K0jJ8r0e1u9G', 'Carmenita Wijaya, S.Kom.', 'MitraIndustri', 'aktif'),
('USR-003', 'yaya@alumni.ub.ac.id', '$2y$10$eO1vV5zFkQfV4dJ0rXfHgeR5sO/F8rK5f.Z7wP3h8K0jJ8r0e1u9G', 'Yaffa Anindya Oktaviani', 'Alumni', 'aktif'),
('USR-004', 'dina@ub.ac.id', '$2y$10$eO1vV5zFkQfV4dJ0rXfHgeR5sO/F8rK5f.Z7wP3h8K0jJ8r0e1u9G', 'Dina Safitri, S.Kom., M.T.', 'Admin', 'aktif'),
('USR-005', 'nicholas@student.ub.ac.id', '$2y$10$eO1vV5zFkQfV4dJ0rXfHgeR5sO/F8rK5f.Z7wP3h8K0jJ8r0e1u9G', 'Nicholas Ravael Ondihon Gultom', 'Mahasiswa', 'aktif'),
('USR-006', 'ushaim@alumni.ub.ac.id', '$2y$10$eO1vV5zFkQfV4dJ0rXfHgeR5sO/F8rK5f.Z7wP3h8K0jJ8r0e1u9G', 'Muhammad Ushaim Mukmin Kasim', 'Alumni', 'aktif');

-- 2. Mahasiswa
INSERT INTO `mahasiswa` (`nim`, `id_user`, `prodi`, `angkatan`, `ipk`) VALUES
('255150407111077', 'USR-001', 'Sistem Informasi', 2025, 3.82),
('255150400111068', 'USR-005', 'Teknik Informatika', 2025, 3.75);

-- 3. Alumni
INSERT INTO `alumni` (`nim`, `id_user`, `prodi`, `tahun_lulus`, `status_pengisian`) VALUES
('215150400111001', 'USR-003', 'Sistem Informasi', 2025, 'Belum Mengisi'),
('215150407111097', 'USR-006', 'Teknik Informatika', 2024, 'Telah Mengisi');

-- 4. Admin
INSERT INTO `admin` (`id_admin`, `id_user`, `unit_kerja`) VALUES
('ADM-001', 'USR-004', 'Career & Internship FILKOM UB');

-- 5. Mitra Industri
INSERT INTO `mitra_industri` (`id_mitra`, `id_user`, `nama_perusahaan`, `alamat`, `kontak_person`, `no_telepon`, `status_kemitraan`) VALUES
('MTR-101', 'USR-002', 'PT Tech Indo Mandiri', 'Jl. Jakarta No. 2, Lowokwaru, Malang', 'Carmenita Wijaya', '081230261706', 'aktif');

-- 6. Lowongan
INSERT INTO `lowongan` (`id_lowongan`, `id_mitra`, `id_admin`, `judul_posisi`, `jenis_kesempatan`, `deskripsi`, `kualifikasi`, `lokasi`, `periode_mulai`, `periode_selesai`, `kuota`, `batas_pendaftaran`, `status_publikasi`) VALUES
('LOW-001', 'MTR-101', 'ADM-001', 'UI/UX Designer Intern', 'Magang Bersertifikat', 'Mengembangkan rancangan antarmuka berbasis design system.', 'Menguasai Figma dan pemahaman User Journey.', 'Surabaya / Hybrid', '2027-01-05', '2027-06-30', 3, '2026-12-15', 'aktif'),
('LOW-002', 'MTR-101', 'ADM-001', 'Full-Stack Web Developer', 'Pekerjaan', 'Membangun platform cloud backend dan web modern.', 'Menguasai REST API, JavaScript, dan SQL.', 'Malang (On-site)', '2027-01-10', '2027-12-31', 2, '2026-12-20', 'aktif');

-- 7. Pendaftaran
INSERT INTO `pendaftaran` (`id_pendaftaran`, `id_lowongan`, `id_user`, `status_seleksi`, `catatan_seleksi`, `tanggal_daftar`) VALUES
('REG-001', 'LOW-001', 'USR-001', 'berkas_terkirim', 'Berkas lengkap dalam peninjauan', '2026-11-02 09:15:00');

-- 8. Berkas Persyaratan
INSERT INTO `berkas_persyaratan` (`id_berkas`, `id_pendaftaran`, `jenis_berkas`, `nama_file`, `ukuran_kb`, `tanggal_unggah`) VALUES
('BRK-001', 'REG-001', 'CV', 'cv_bambang_prakoso.pdf', 842, '2026-11-02 09:12:00'),
('BRK-002', 'REG-001', 'Transkrip', 'transkrip_nilai_terbaru.pdf', 1240, '2026-11-02 09:13:00'),
('BRK-003', 'REG-001', 'Surat Rekomendasi', 'surat_rekomendasi_filkom.pdf', 520, '2026-11-02 09:14:00');

-- 9. Kuesioner Tracer Study
INSERT INTO `kuesioner` (`id_kuesioner`, `nim`, `id_admin`, `periode_survei`, `status_karir`, `data_jawaban`, `is_draft`, `status_validasi`, `is_anomali`, `nomor_referensi`, `tanggal_submit`) VALUES
('TRC-001', '215150407111097', 'ADM-001', 2026, 'Bekerja', '{\"instansi\": \"PT Nusantara Digital\", \"pendapatan\": \"5 - 10 juta\", \"masa_tunggu\": 2, \"relevansi_kurikulum\": 5}', FALSE, 'tervalidasi', FALSE, 'SIMAGA/TS/2026/0001', '2026-10-30 14:20:00');

-- 10. Riwayat Pengingat
INSERT INTO `riwayat_pengingat` (`id_pengingat`, `id_admin`, `filter_target`, `jumlah_penerima`, `tanggal_kirim`) VALUES
('RMD-001', 'ADM-001', 'Angkatan 2022 - Sistem Informasi', 120, '2026-11-10 08:30:00');

-- 11. Notifikasi
INSERT INTO `notifikasi` (`id_notifikasi`, `id_user`, `jenis`, `judul`, `pesan`, `is_dibaca`, `tanggal_kirim`) VALUES
('NTF-001', 'USR-001', 'status_seleksi', 'Pendaftaran Berhasil', 'Berkas lamaran Anda pada posisi UI/UX Designer Intern berhasil diterima.', 1, '2026-11-02 09:15:30');
