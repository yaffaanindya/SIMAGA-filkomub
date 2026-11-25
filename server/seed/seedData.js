/**
 * ==============================================================================
 * SIMAGA - DATA SEED DEMO TERPUSAT (11 TABEL RELASIONAL)
 * ==============================================================================
 * Satu sumber kebenaran untuk data uji presentasi. Dipakai oleh:
 *   - server/services/sheetsService.js  (mock DB in-memory / Railway)
 *   - server/scripts/init_sheets.js     (seeding Google Sheets)
 * Versi SQL setara: database/seed_demo_simaga.sql
 *
 * Skenario uji yang disediakan (tanpa saling bentrok):
 *   MAHASISWA  bambang@student.ub.ac.id / bambang123
 *              - sudah melamar LOW-001 (status: wawancara)
 *              - LOW-003, LOW-004, LOW-005, LOW-006 aktif & BELUM dilamar -> uji "Ajukan Lamaran"
 *   ALUMNI     yaya@alumni.ub.ac.id / yaya123
 *              - punya DRAF kuesioner (TRC-010) -> uji "Lanjut isi draf" & "Kirim Final"
 *              - lowongan Pekerjaan aktif: LOW-002, LOW-007, LOW-008
 *   MITRA      carmen@techindo.com / mitra123 (MTR-101)
 *              - pelamar REG-001..REG-004 dgn status berkas_terkirim/wawancara/diterima/ditolak
 *              - LOW-011 (menunggu) khusus uji Edit/Hapus oleh Mitra
 *              - LOW-012 (ditolak) menampilkan catatan revisi Admin
 *   ADMIN      dina@ub.ac.id / admin123
 *              - LOW-009 (menunggu) -> uji "Setujui"
 *              - LOW-010 (menunggu) -> uji "Tolak + Catatan Revisi"
 *              - TRC-008 (menunggu, normal) & TRC-009 (menunggu, anomali) -> uji "Sahkan"/"Perlu Klarifikasi"
 *              - 3 alumni "Belum Mengisi" -> "Kirim Pengingat Massal" menghasilkan penerima > 0
 * ==============================================================================
 */

const SEED_VERSION = '2026-11-26-demo-v2';

// URL publik aplikasi; dipakai agar tautan berkas contoh berupa URL https:// absolut.
const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL || 'https://simaga-filkom-ub-production.up.railway.app').replace(/\/+$/, '');
const berkasUrl = (file) => `${PUBLIC_BASE_URL}/sample-berkas/${file}`;

const BIDANG_KEAHLIAN = [
  'UI/UX Design',
  'Web & Mobile Development',
  'Data & AI',
  'Quality Assurance & DevOps',
  'Sistem & Jaringan'
];

const j = (obj) => JSON.stringify(obj);

function buildSeed() {
  return {
    _seed_version: SEED_VERSION,

    pengguna: [
      // --- Akun demo utama (4 peran) ---
      { id_user: 'USR-001', email: 'bambang@student.ub.ac.id', password_hash: 'bambang123', nama_lengkap: 'Bambang Prakoso', role: 'Mahasiswa', status_akun: 'aktif' },
      { id_user: 'USR-002', email: 'carmen@techindo.com', password_hash: 'mitra123', nama_lengkap: 'Carmenita Wijaya, S.Kom.', role: 'MitraIndustri', status_akun: 'aktif' },
      { id_user: 'USR-003', email: 'yaya@alumni.ub.ac.id', password_hash: 'yaya123', nama_lengkap: 'Yaffa Anindya Oktaviani', role: 'Alumni', status_akun: 'aktif' },
      { id_user: 'USR-004', email: 'dina@ub.ac.id', password_hash: 'admin123', nama_lengkap: 'Dina Safitri, S.Kom., M.T.', role: 'Admin', status_akun: 'aktif' },
      // --- Mahasiswa pelamar lain ---
      { id_user: 'USR-005', email: 'kevin@student.ub.ac.id', password_hash: 'kevin123', nama_lengkap: 'Kevin Sanjaya', role: 'Mahasiswa', status_akun: 'aktif' },
      { id_user: 'USR-013', email: 'nadia@student.ub.ac.id', password_hash: 'nadia123', nama_lengkap: 'Nadia Putri Ramadhani', role: 'Mahasiswa', status_akun: 'aktif' },
      { id_user: 'USR-014', email: 'fikri@student.ub.ac.id', password_hash: 'fikri123', nama_lengkap: 'Fikri Maulana', role: 'Mahasiswa', status_akun: 'aktif' },
      { id_user: 'USR-015', email: 'salsa@student.ub.ac.id', password_hash: 'salsa123', nama_lengkap: 'Salsabila Azzahra', role: 'Mahasiswa', status_akun: 'aktif' },
      { id_user: 'USR-010', email: 'nonaktif@student.ub.ac.id', password_hash: 'pass123', nama_lengkap: 'Akun Ditangguhkan', role: 'Mahasiswa', status_akun: 'nonaktif' },
      // --- Mitra industri lain ---
      { id_user: 'USR-009', email: 'recruitment@shopee.co.id', password_hash: 'shopee123', nama_lengkap: 'Jessica Tan', role: 'MitraIndustri', status_akun: 'aktif' },
      { id_user: 'USR-012', email: 'hr.recruitment@bca.co.id', password_hash: 'bca123', nama_lengkap: 'Budi Santoso', role: 'MitraIndustri', status_akun: 'aktif' },
      // --- Alumni ---
      { id_user: 'USR-006', email: 'rian@alumni.ub.ac.id', password_hash: 'rian123', nama_lengkap: 'Rian Pratama, S.Kom.', role: 'Alumni', status_akun: 'aktif' },
      { id_user: 'USR-007', email: 'sarah@alumni.ub.ac.id', password_hash: 'sarah123', nama_lengkap: 'Sarah Amalia, S.Pd.', role: 'Alumni', status_akun: 'aktif' },
      { id_user: 'USR-008', email: 'dimas@alumni.ub.ac.id', password_hash: 'dimas123', nama_lengkap: 'Dimas Aditya, S.Kom.', role: 'Alumni', status_akun: 'aktif' },
      { id_user: 'USR-016', email: 'putri@alumni.ub.ac.id', password_hash: 'putri123', nama_lengkap: 'Putri Anggraini, S.Kom.', role: 'Alumni', status_akun: 'aktif' },
      { id_user: 'USR-017', email: 'andi@alumni.ub.ac.id', password_hash: 'andi123', nama_lengkap: 'Andi Wijaya, S.T.', role: 'Alumni', status_akun: 'aktif' },
      { id_user: 'USR-018', email: 'laras@alumni.ub.ac.id', password_hash: 'laras123', nama_lengkap: 'Larasati Dewi, S.Kom.', role: 'Alumni', status_akun: 'aktif' },
      { id_user: 'USR-019', email: 'hendra@alumni.ub.ac.id', password_hash: 'hendra123', nama_lengkap: 'Hendra Kurniawan, S.Kom.', role: 'Alumni', status_akun: 'aktif' },
      { id_user: 'USR-020', email: 'gilang@alumni.ub.ac.id', password_hash: 'gilang123', nama_lengkap: 'Gilang Ramadhan, S.Kom.', role: 'Alumni', status_akun: 'aktif' },
      { id_user: 'USR-021', email: 'citra@alumni.ub.ac.id', password_hash: 'citra123', nama_lengkap: 'Citra Lestari, S.Kom.', role: 'Alumni', status_akun: 'aktif' },
      { id_user: 'USR-011', email: 'callum@alumni.ub.ac.id', password_hash: 'callum123', nama_lengkap: 'Callum Turner, S.Kom.', role: 'Alumni', status_akun: 'aktif' },
      { id_user: 'USR-022', email: 'rizky@alumni.ub.ac.id', password_hash: 'rizky123', nama_lengkap: 'Rizky Firmansyah, S.T.', role: 'Alumni', status_akun: 'aktif' }
    ],

    mahasiswa: [
      { nim: '255150407111077', id_user: 'USR-001', prodi: 'Sistem Informasi', angkatan: 2025, ipk: 3.82 },
      { nim: '255150400111068', id_user: 'USR-005', prodi: 'Teknik Informatika', angkatan: 2025, ipk: 3.75 },
      { nim: '235150401111012', id_user: 'USR-013', prodi: 'Teknologi Informasi', angkatan: 2023, ipk: 3.68 },
      { nim: '235150300111045', id_user: 'USR-014', prodi: 'Teknik Komputer', angkatan: 2023, ipk: 3.41 },
      { nim: '235150207111020', id_user: 'USR-015', prodi: 'Teknik Informatika', angkatan: 2023, ipk: 3.90 },
      { nim: '245150400111099', id_user: 'USR-010', prodi: 'Teknik Informatika', angkatan: 2024, ipk: 3.10 }
    ],

    alumni: [
      // Draf (akun demo Alumni) -> masih dihitung "Belum Mengisi" karena belum kirim final
      { nim: '215150400111001', id_user: 'USR-003', prodi: 'Sistem Informasi', tahun_lulus: 2025, status_pengisian: 'Belum Mengisi' },
      // 7 kuesioner tervalidasi
      { nim: '215150407111097', id_user: 'USR-006', prodi: 'Teknik Informatika', tahun_lulus: 2024, status_pengisian: 'Telah Mengisi' },
      { nim: '215150401111033', id_user: 'USR-007', prodi: 'Pendidikan Teknologi Informasi', tahun_lulus: 2025, status_pengisian: 'Telah Mengisi' },
      { nim: '205150407111055', id_user: 'USR-008', prodi: 'Teknologi Informasi', tahun_lulus: 2024, status_pengisian: 'Telah Mengisi' },
      { nim: '195150401111021', id_user: 'USR-016', prodi: 'Sistem Informasi', tahun_lulus: 2023, status_pengisian: 'Telah Mengisi' },
      { nim: '195150300111008', id_user: 'USR-017', prodi: 'Teknik Komputer', tahun_lulus: 2023, status_pengisian: 'Telah Mengisi' },
      { nim: '205150400111019', id_user: 'USR-018', prodi: 'Sistem Informasi', tahun_lulus: 2024, status_pengisian: 'Telah Mengisi' },
      { nim: '215150201111044', id_user: 'USR-019', prodi: 'Teknik Informatika', tahun_lulus: 2025, status_pengisian: 'Telah Mengisi' },
      // 2 kuesioner menunggu validasi
      { nim: '195150201111030', id_user: 'USR-020', prodi: 'Teknik Informatika', tahun_lulus: 2023, status_pengisian: 'Telah Mengisi' },
      { nim: '215150400111066', id_user: 'USR-021', prodi: 'Sistem Informasi', tahun_lulus: 2025, status_pengisian: 'Telah Mengisi' },
      // Belum mengisi sama sekali -> target pengingat massal
      { nim: '215150207111122', id_user: 'USR-011', prodi: 'Teknik Informatika', tahun_lulus: 2025, status_pengisian: 'Belum Mengisi' },
      { nim: '205150300111077', id_user: 'USR-022', prodi: 'Teknik Komputer', tahun_lulus: 2024, status_pengisian: 'Belum Mengisi' }
    ],

    admin: [
      { id_admin: 'ADM-001', id_user: 'USR-004', unit_kerja: 'Career & Internship' }
    ],

    mitra_industri: [
      { id_mitra: 'MTR-101', id_user: 'USR-002', nama_perusahaan: 'PT Tech Indo Mandiri', alamat: 'Jl. Jakarta No. 2, Lowokwaru, Malang', kontak_person: 'Carmenita Wijaya', no_telepon: '081230261706', status_kemitraan: 'aktif' },
      { id_mitra: 'MTR-102', id_user: 'USR-009', nama_perusahaan: 'PT Shopee International Indonesia', alamat: 'Pacific Century Place Lt. 25, SCBD, Jakarta Selatan', kontak_person: 'Jessica Tan', no_telepon: '081299887766', status_kemitraan: 'aktif' },
      { id_mitra: 'MTR-103', id_user: 'USR-012', nama_perusahaan: 'PT Bank Central Asia Tbk', alamat: 'Menara BCA, Grand Indonesia, Jakarta Pusat', kontak_person: 'Budi Santoso', no_telepon: '081333444555', status_kemitraan: 'aktif' }
    ],

    lowongan: [
      // ---------------- AKTIF ----------------
      {
        id_lowongan: 'LOW-001', id_mitra: 'MTR-101', id_admin: 'ADM-001',
        judul_posisi: 'UI/UX Designer Intern', jenis_kesempatan: 'Magang Bersertifikat', bidang_keahlian: 'UI/UX Design',
        deskripsi: 'Merancang antarmuka web dan mobile berbasis design system, menyusun wireframe & prototipe, serta melakukan usability testing bersama tim produk.',
        kualifikasi: 'Mahasiswa aktif SI/TI semester 5-7. Mahir Figma dan prototyping. Memiliki portofolio desain UI/UX.',
        lokasi: 'Surabaya (Hybrid)', periode_mulai: '2027-01-05', periode_selesai: '2027-06-30', kuota: 3,
        batas_pendaftaran: '2026-12-15', status_publikasi: 'aktif', catatan_revisi: ''
      },
      {
        id_lowongan: 'LOW-002', id_mitra: 'MTR-101', id_admin: 'ADM-001',
        judul_posisi: 'Full-Stack Web Developer', jenis_kesempatan: 'Pekerjaan', bidang_keahlian: 'Web & Mobile Development',
        deskripsi: 'Membangun platform web dan REST API berbasis React & Node.js untuk layanan akademik klien perusahaan.',
        kualifikasi: 'Lulusan S1 rumpun Ilmu Komputer. Menguasai JavaScript/TypeScript, SQL, dan Docker.',
        lokasi: 'Malang (On-site)', periode_mulai: '2027-01-04', periode_selesai: '2028-01-04', kuota: 2,
        batas_pendaftaran: '2026-12-20', status_publikasi: 'aktif', catatan_revisi: ''
      },
      {
        id_lowongan: 'LOW-003', id_mitra: 'MTR-102', id_admin: 'ADM-001',
        judul_posisi: 'Mobile Developer Intern (Flutter)', jenis_kesempatan: 'Magang Bersertifikat', bidang_keahlian: 'Web & Mobile Development',
        deskripsi: 'Mengembangkan fitur aplikasi mobile seller center, integrasi API, dan unit testing fungsionalitas.',
        kualifikasi: 'Mahasiswa aktif FILKOM UB. Menguasai Flutter/Dart, state management, dan Git.',
        lokasi: 'Jakarta (Remote)', periode_mulai: '2027-02-01', periode_selesai: '2027-07-31', kuota: 5,
        batas_pendaftaran: '2026-12-31', status_publikasi: 'aktif', catatan_revisi: ''
      },
      {
        id_lowongan: 'LOW-004', id_mitra: 'MTR-103', id_admin: 'ADM-001',
        judul_posisi: 'Data Analyst & Business Intelligence Intern', jenis_kesempatan: 'Magang Bersertifikat', bidang_keahlian: 'Data & AI',
        deskripsi: 'Mengolah data transaksi perbankan, menyusun dashboard Power BI, dan menganalisis tren layanan digital.',
        kualifikasi: 'Mahasiswa aktif SI/TIF semester 5-7. Mahir SQL, Python (Pandas), dan visualisasi data.',
        lokasi: 'Jakarta (Hybrid)', periode_mulai: '2027-01-15', periode_selesai: '2027-07-15', kuota: 4,
        batas_pendaftaran: '2026-12-25', status_publikasi: 'aktif', catatan_revisi: ''
      },
      {
        id_lowongan: 'LOW-005', id_mitra: 'MTR-101', id_admin: 'ADM-001',
        judul_posisi: 'Software QA & DevOps Intern', jenis_kesempatan: 'Magang Bersertifikat', bidang_keahlian: 'Quality Assurance & DevOps',
        deskripsi: 'Menyusun skenario uji, automated testing (Cypress/Postman), serta membantu pipeline CI/CD berbasis Docker.',
        kualifikasi: 'Mahasiswa aktif FILKOM UB semester 5-7. Memahami SDLC Agile dan dasar Linux.',
        lokasi: 'Malang (On-site)', periode_mulai: '2027-01-10', periode_selesai: '2027-06-30', kuota: 2,
        batas_pendaftaran: '2026-12-30', status_publikasi: 'aktif', catatan_revisi: ''
      },
      {
        id_lowongan: 'LOW-006', id_mitra: 'MTR-103', id_admin: 'ADM-001',
        judul_posisi: 'Network & Infrastructure Intern', jenis_kesempatan: 'Magang Bersertifikat', bidang_keahlian: 'Sistem & Jaringan',
        deskripsi: 'Membantu pemantauan jaringan kantor cabang, konfigurasi perangkat, dan dokumentasi insiden infrastruktur TI.',
        kualifikasi: 'Mahasiswa aktif Teknik Komputer/TIF. Memahami TCP/IP, routing dasar, dan Linux server.',
        lokasi: 'Surabaya (On-site)', periode_mulai: '2027-02-01', periode_selesai: '2027-07-31', kuota: 2,
        batas_pendaftaran: '2027-01-10', status_publikasi: 'aktif', catatan_revisi: ''
      },
      {
        id_lowongan: 'LOW-007', id_mitra: 'MTR-102', id_admin: 'ADM-001',
        judul_posisi: 'Data Scientist (Fresh Graduate)', jenis_kesempatan: 'Pekerjaan', bidang_keahlian: 'Data & AI',
        deskripsi: 'Mengembangkan model rekomendasi produk dan eksperimen A/B untuk marketplace.',
        kualifikasi: 'Alumni S1 rumpun Informatika. Menguasai Python, Scikit-learn, dan statistik.',
        lokasi: 'Jakarta (On-site)', periode_mulai: '2027-02-01', periode_selesai: '2028-02-01', kuota: 3,
        batas_pendaftaran: '2026-12-28', status_publikasi: 'aktif', catatan_revisi: ''
      },
      {
        id_lowongan: 'LOW-008', id_mitra: 'MTR-103', id_admin: 'ADM-001',
        judul_posisi: 'IT Security Analyst', jenis_kesempatan: 'Pekerjaan', bidang_keahlian: 'Sistem & Jaringan',
        deskripsi: 'Melakukan vulnerability assessment, analisis log SOC, dan penguatan keamanan sistem perbankan.',
        kualifikasi: 'Alumni S1 FILKOM UB. Memahami OWASP Top 10, network protocols, dan SIEM.',
        lokasi: 'Jakarta (Hybrid)', periode_mulai: '2027-01-15', periode_selesai: '2028-01-15', kuota: 2,
        batas_pendaftaran: '2027-01-05', status_publikasi: 'aktif', catatan_revisi: ''
      },
      // ---------------- MENUNGGU KURASI ----------------
      {
        id_lowongan: 'LOW-009', id_mitra: 'MTR-101', id_admin: '',
        judul_posisi: 'Machine Learning Engineer Intern', jenis_kesempatan: 'Magang Bersertifikat', bidang_keahlian: 'Data & AI',
        deskripsi: 'Membangun pipeline data dan melatih model klasifikasi dokumen untuk produk internal.',
        kualifikasi: 'Mahasiswa aktif TIF/SI semester 5-7. Menguasai Python dan dasar deep learning.',
        lokasi: 'Remote', periode_mulai: '2027-02-15', periode_selesai: '2027-08-15', kuota: 2,
        batas_pendaftaran: '2027-01-20', status_publikasi: 'menunggu', catatan_revisi: ''
      },
      {
        id_lowongan: 'LOW-010', id_mitra: 'MTR-102', id_admin: '',
        judul_posisi: 'Product Designer (UI/UX)', jenis_kesempatan: 'Pekerjaan', bidang_keahlian: 'UI/UX Design',
        deskripsi: 'Mendesain alur pengguna fitur pembayaran dan berkolaborasi dengan tim riset pengguna.',
        kualifikasi: 'Alumni S1. Portofolio desain produk digital.',
        lokasi: 'Jakarta (Hybrid)', periode_mulai: '2027-02-01', periode_selesai: '2028-02-01', kuota: 1,
        batas_pendaftaran: '2027-01-15', status_publikasi: 'menunggu', catatan_revisi: ''
      },
      {
        id_lowongan: 'LOW-011', id_mitra: 'MTR-101', id_admin: '',
        judul_posisi: 'DevOps Engineer (Junior)', jenis_kesempatan: 'Pekerjaan', bidang_keahlian: 'Quality Assurance & DevOps',
        deskripsi: 'Mengelola deployment container, monitoring, dan otomasi infrastruktur cloud.',
        kualifikasi: 'Alumni S1 FILKOM UB. Memahami Docker, Kubernetes, dan CI/CD.',
        lokasi: 'Malang (Hybrid)', periode_mulai: '2027-02-01', periode_selesai: '2028-02-01', kuota: 1,
        batas_pendaftaran: '2027-01-25', status_publikasi: 'menunggu', catatan_revisi: ''
      },
      // ---------------- DITOLAK ----------------
      {
        id_lowongan: 'LOW-012', id_mitra: 'MTR-101', id_admin: 'ADM-001',
        judul_posisi: 'Backend Developer Intern (Go)', jenis_kesempatan: 'Magang Bersertifikat', bidang_keahlian: 'Web & Mobile Development',
        deskripsi: 'Membantu pengembangan layanan backend.',
        kualifikasi: 'Mahasiswa aktif.',
        lokasi: 'Malang (On-site)', periode_mulai: '2027-01-05', periode_selesai: '2027-03-05', kuota: 1,
        batas_pendaftaran: '2026-12-10', status_publikasi: 'ditolak',
        catatan_revisi: 'Durasi magang minimal 4 bulan dan deskripsi tugas belum rinci. Silakan ajukan ulang dengan rincian kegiatan mingguan.'
      }
    ],

    pendaftaran: [
      { id_pendaftaran: 'REG-001', id_lowongan: 'LOW-001', id_user: 'USR-001', status_seleksi: 'wawancara', catatan_seleksi: 'Berkas lolos kurasi. Wawancara daring via Google Meet pada 10 Des 2026 pukul 10.00 WIB.', tanggal_daftar: '2026-11-02 09:15:00' },
      { id_pendaftaran: 'REG-002', id_lowongan: 'LOW-001', id_user: 'USR-005', status_seleksi: 'berkas_terkirim', catatan_seleksi: 'Lamaran terkirim dan sedang dalam antrean pemeriksaan berkas.', tanggal_daftar: '2026-11-10 13:40:00' },
      { id_pendaftaran: 'REG-003', id_lowongan: 'LOW-005', id_user: 'USR-013', status_seleksi: 'diterima', catatan_seleksi: 'Selamat! Anda diterima. Onboarding 10 Januari 2027 di kantor Malang.', tanggal_daftar: '2026-11-04 08:20:00' },
      { id_pendaftaran: 'REG-004', id_lowongan: 'LOW-005', id_user: 'USR-014', status_seleksi: 'ditolak', catatan_seleksi: 'Terima kasih atas minat Anda. Kuota posisi telah terpenuhi.', tanggal_daftar: '2026-11-05 15:05:00' },
      { id_pendaftaran: 'REG-005', id_lowongan: 'LOW-004', id_user: 'USR-015', status_seleksi: 'berkas_terkirim', catatan_seleksi: 'Lamaran terkirim dan sedang dalam antrean pemeriksaan berkas.', tanggal_daftar: '2026-11-12 10:30:00' }
    ],

    berkas_persyaratan: [
      ...[
        ['REG-001', 'bambang_prakoso', '2026-11-02'],
        ['REG-002', 'kevin_sanjaya', '2026-11-10'],
        ['REG-003', 'nadia_putri', '2026-11-04'],
        ['REG-004', 'fikri_maulana', '2026-11-05'],
        ['REG-005', 'salsabila_azzahra', '2026-11-12']
      ].flatMap(([reg, slug, tgl], i) => ([
        ['CV', `cv_${slug}.pdf`],
        ['Transkrip', `transkrip_${slug}.pdf`],
        ['Surat Rekomendasi', `surat_rekomendasi_${slug}.pdf`]
      ].map(([jenis, file], k) => ({
        id_berkas: `BRK-${String(i * 3 + k + 1).padStart(3, '0')}`,
        id_pendaftaran: reg,
        jenis_berkas: jenis,
        nama_file: file,
        ukuran_kb: 2,
        drive_file_id: '',
        drive_url: berkasUrl(file),
        tanggal_unggah: `${tgl} 09:1${k}:00`
      }))))
    ],

    kuesioner: [
      // ---------- 7 TERVALIDASI (4 kategori karier, 5 prodi, 3 tahun lulus) ----------
      { id_kuesioner: 'TRC-001', nim: '215150407111097', id_admin: 'ADM-001', periode_survei: 2026, status_karir: 'Bekerja',
        data_jawaban: j({ instansi: 'PT GoTo Gojek Tokopedia Tbk', posisi: 'Software Engineer', gaji: '8-15jt', gaji_nominal: 9500000, masa_tunggu: 2, tingkat_tempat_kerja: 'Nasional', keselarasan: 5, relevansi_kurikulum: 'Sangat relevan dengan kebutuhan industri software.' }),
        is_draft: false, status_validasi: 'tervalidasi', is_anomali: false, nomor_referensi: 'SIMAGA/TS/2026/0001', tanggal_submit: '2026-10-30 14:20:00' },
      { id_kuesioner: 'TRC-002', nim: '215150401111033', id_admin: 'ADM-001', periode_survei: 2026, status_karir: 'Wirausaha',
        data_jawaban: j({ instansi: 'EduKids Coding Malang', posisi: 'Founder', gaji: '5-15jt', gaji_nominal: 7000000, masa_tunggu: 3, keselarasan: 4, relevansi_kurikulum: 'Mata kuliah pedagogi dan pemrograman sangat membantu.' }),
        is_draft: false, status_validasi: 'tervalidasi', is_anomali: false, nomor_referensi: 'SIMAGA/TS/2026/0002', tanggal_submit: '2026-11-01 09:10:00' },
      { id_kuesioner: 'TRC-003', nim: '205150407111055', id_admin: 'ADM-001', periode_survei: 2026, status_karir: 'Melanjutkan Studi',
        data_jawaban: j({ instansi: 'Institut Teknologi Bandung', posisi: 'Mahasiswa S2 Informatika', sumber_biaya: 'Beasiswa LPDP', masa_tunggu: 5, keselarasan: 5, relevansi_kurikulum: 'Bekal riset dari skripsi sangat berguna.' }),
        is_draft: false, status_validasi: 'tervalidasi', is_anomali: false, nomor_referensi: 'SIMAGA/TS/2026/0003', tanggal_submit: '2026-11-01 13:45:00' },
      { id_kuesioner: 'TRC-004', nim: '195150401111021', id_admin: 'ADM-001', periode_survei: 2026, status_karir: 'Bekerja',
        data_jawaban: j({ instansi: 'PT Telkom Indonesia (Persero) Tbk', posisi: 'System Analyst', gaji: '8-15jt', gaji_nominal: 11000000, masa_tunggu: 4, tingkat_tempat_kerja: 'Nasional', keselarasan: 5, relevansi_kurikulum: 'Analisis proses bisnis sangat relevan.' }),
        is_draft: false, status_validasi: 'tervalidasi', is_anomali: false, nomor_referensi: 'SIMAGA/TS/2026/0004', tanggal_submit: '2026-11-02 10:00:00' },
      { id_kuesioner: 'TRC-005', nim: '195150300111008', id_admin: 'ADM-001', periode_survei: 2026, status_karir: 'Mencari Kerja',
        data_jawaban: j({ instansi: '-', posisi: '-', masa_tunggu: 9, keselarasan: 3, relevansi_kurikulum: 'Perlu lebih banyak praktik embedded system berbasis industri.' }),
        is_draft: false, status_validasi: 'tervalidasi', is_anomali: false, nomor_referensi: 'SIMAGA/TS/2026/0005', tanggal_submit: '2026-11-03 16:30:00' },
      { id_kuesioner: 'TRC-006', nim: '205150400111019', id_admin: 'ADM-001', periode_survei: 2026, status_karir: 'Bekerja',
        data_jawaban: j({ instansi: 'PT Bank Mandiri (Persero) Tbk', posisi: 'IT Business Analyst', gaji: '8-15jt', gaji_nominal: 10500000, masa_tunggu: 1, tingkat_tempat_kerja: 'Nasional', keselarasan: 4, relevansi_kurikulum: 'Relevan, terutama mata kuliah manajemen proyek.' }),
        is_draft: false, status_validasi: 'tervalidasi', is_anomali: false, nomor_referensi: 'SIMAGA/TS/2026/0006', tanggal_submit: '2026-11-04 08:45:00' },
      { id_kuesioner: 'TRC-007', nim: '215150201111044', id_admin: 'ADM-001', periode_survei: 2026, status_karir: 'Wirausaha',
        data_jawaban: j({ instansi: 'Studio Aplikasi Nusantara', posisi: 'Co-Founder & CTO', gaji: '15-50jt', gaji_nominal: 18000000, masa_tunggu: 2, keselarasan: 5, relevansi_kurikulum: 'Kewirausahaan berbasis teknologi sangat membantu.' }),
        is_draft: false, status_validasi: 'tervalidasi', is_anomali: false, nomor_referensi: 'SIMAGA/TS/2026/0007', tanggal_submit: '2026-11-05 11:20:00' },

      // ---------- 2 MENUNGGU VALIDASI ----------
      { id_kuesioner: 'TRC-008', nim: '195150201111030', id_admin: '', periode_survei: 2026, status_karir: 'Bekerja',
        data_jawaban: j({ instansi: 'PT Traveloka Indonesia', posisi: 'Backend Engineer', gaji: '15-30jt', gaji_nominal: 16000000, masa_tunggu: 3, tingkat_tempat_kerja: 'Multinasional / Internasional', keselarasan: 5, relevansi_kurikulum: 'Sangat relevan.' }),
        is_draft: false, status_validasi: 'menunggu', is_anomali: false, nomor_referensi: 'SIMAGA/TS/2026/0008', tanggal_submit: '2026-11-18 19:05:00' },
      { id_kuesioner: 'TRC-009', nim: '215150400111066', id_admin: '', periode_survei: 2026, status_karir: 'Bekerja',
        data_jawaban: j({ instansi: 'CV Maju Jaya Digital', posisi: 'Staf IT Support', gaji: '4-8jt', gaji_nominal: 4500000, masa_tunggu: 40, tingkat_tempat_kerja: 'Lokal / Wilayah', keselarasan: 3, relevansi_kurikulum: 'Cukup relevan.' }),
        is_draft: false, status_validasi: 'menunggu', is_anomali: true, nomor_referensi: 'SIMAGA/TS/2026/0009', tanggal_submit: '2026-11-20 07:50:00' },

      // ---------- 1 DRAF (akun demo Alumni) ----------
      { id_kuesioner: 'TRC-010', nim: '215150400111001', id_admin: '', periode_survei: 2026, status_karir: 'Bekerja',
        data_jawaban: j({ instansi: 'PT Tech Indo Mandiri', posisi: '', gaji: '', gaji_nominal: '', masa_tunggu: '', keselarasan: 4, relevansi_kurikulum: '' }),
        is_draft: true, status_validasi: 'menunggu', is_anomali: false, nomor_referensi: '', tanggal_submit: '' }
    ],

    riwayat_pengingat: [
      { id_pengingat: 'RMD-001', id_admin: 'ADM-001', filter_target: 'Semua Prodi (Semua Angkatan)', jumlah_penerima: 5, tanggal_kirim: '2026-11-01 08:00:00' }
    ],

    notifikasi: [
      { id_notifikasi: 'NTF-001', id_user: 'USR-001', jenis: 'status_seleksi', judul: 'Status Lamaran Diperbarui', pesan: 'Anda dijadwalkan wawancara daring pada 10 Des 2026 untuk posisi UI/UX Designer Intern.', is_dibaca: false, tanggal_kirim: '2026-11-03 10:00:00' },
      { id_notifikasi: 'NTF-002', id_user: 'USR-002', jenis: 'kurasi_lowongan', judul: 'Lowongan Disetujui', pesan: "Lowongan 'UI/UX Designer Intern' telah disetujui dan kini aktif dipublikasikan.", is_dibaca: true, tanggal_kirim: '2026-11-01 11:30:00' },
      { id_notifikasi: 'NTF-003', id_user: 'USR-002', jenis: 'kurasi_lowongan', judul: 'Lowongan Ditolak', pesan: "Lowongan 'Backend Developer Intern (Go)' ditolak. Periksa catatan revisi pada menu Lowongan Saya.", is_dibaca: false, tanggal_kirim: '2026-11-08 14:00:00' },
      { id_notifikasi: 'NTF-004', id_user: 'USR-003', jenis: 'tracer_study', judul: 'Pengisian Tracer Study Aktif', pesan: 'Halo Yaffa, kuesioner pelacakan karier alumni periode 2026 telah dibuka. Draf Anda tersimpan.', is_dibaca: false, tanggal_kirim: '2026-11-01 08:30:00' },
      { id_notifikasi: 'NTF-005', id_user: 'USR-004', jenis: 'kurasi_lowongan', judul: 'Pengajuan Lowongan Baru', pesan: '3 lowongan menunggu kurasi Career & Internship.', is_dibaca: false, tanggal_kirim: '2026-11-21 09:00:00' }
    ]
  };
}

module.exports = { SEED_VERSION, PUBLIC_BASE_URL, BIDANG_KEAHLIAN, buildSeed };
