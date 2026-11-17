/**
 * ==============================================================================
 * SIMAGA - SEED & LOCAL STATE STORE (FILKOM UNIVERSITAS BRAWIJAYA)
 * ==============================================================================
 * Menyimpan data inisial 11 tab Google Sheets untuk keperluan Demo Standalone
 * dan caching client-side dengan data otentik FILKOM UB.
 * ==============================================================================
 */

window.SIMAGA_DB = {
  pengguna: [
    { id_user: "USR-001", email: "bambang@student.ub.ac.id", password_hash: "bambang123", nama_lengkap: "Bambang Prakoso", role: "Mahasiswa", status_akun: "aktif" },
    { id_user: "USR-002", email: "carmen@techindo.com", password_hash: "mitra123", nama_lengkap: "Carmenita Wijaya, S.Kom.", role: "MitraIndustri", status_akun: "aktif" },
    { id_user: "USR-003", email: "yaya@alumni.ub.ac.id", password_hash: "yaya123", nama_lengkap: "Yaffa Anindya Oktaviani", role: "Alumni", status_akun: "aktif" },
    { id_user: "USR-004", email: "dina@ub.ac.id", password_hash: "admin123", nama_lengkap: "Dina Safitri, S.Kom., M.T.", role: "Admin", status_akun: "aktif" },
    { id_user: "USR-005", email: "kevin@student.ub.ac.id", password_hash: "kevin123", nama_lengkap: "Kevin Sanjaya", role: "Mahasiswa", status_akun: "aktif" },
    { id_user: "USR-006", email: "rian@alumni.ub.ac.id", password_hash: "rian123", nama_lengkap: "Rian Pratama, S.Kom.", role: "Alumni", status_akun: "aktif" },
    { id_user: "USR-007", email: "sarah@alumni.ub.ac.id", password_hash: "sarah123", nama_lengkap: "Sarah Amalia, S.Kom.", role: "Alumni", status_akun: "aktif" },
    { id_user: "USR-008", email: "dimas@alumni.ub.ac.id", password_hash: "dimas123", nama_lengkap: "Dimas Aditya, S.Kom.", role: "Alumni", status_akun: "aktif" },
    { id_user: "USR-009", email: "recruitment@shopee.com", password_hash: "shopee123", nama_lengkap: "Jessica Tan (Shopee Indonesia)", role: "MitraIndustri", status_akun: "aktif" },
    { id_user: "USR-010", email: "nonaktif@ub.ac.id", password_hash: "pass123", nama_lengkap: "Akun Ditangguhkan", role: "Mahasiswa", status_akun: "nonaktif" },
    { id_user: "USR-011", email: "callum@alumni.ub.ac.id", password_hash: "callum123", nama_lengkap: "Callum Turner, S.Kom.", role: "Alumni", status_akun: "aktif" }
  ],
  mahasiswa: [
    { nim: "255150407111077", id_user: "USR-001", prodi: "Sistem Informasi", angkatan: 2025, ipk: 3.82 },
    { nim: "255150400111068", id_user: "USR-005", prodi: "Teknik Informatika", angkatan: 2025, ipk: 3.75 }
  ],
  alumni: [
    { nim: "215150400111001", id_user: "USR-003", prodi: "Sistem Informasi", tahun_lulus: 2025, status_pengisian: "Belum Mengisi" },
    { nim: "215150407111097", id_user: "USR-006", prodi: "Teknik Informatika", tahun_lulus: 2024, status_pengisian: "Telah Mengisi" },
    { nim: "215150401111033", id_user: "USR-007", prodi: "Pendidikan Teknologi Informasi", tahun_lulus: 2025, status_pengisian: "Telah Mengisi" },
    { nim: "215150407111055", id_user: "USR-008", prodi: "Teknologi Informasi", tahun_lulus: 2024, status_pengisian: "Telah Mengisi" },
    { nim: "2111111111111122", id_user: "USR-011", prodi: "Teknik Informatika", tahun_lulus: 2025, status_pengisian: "Belum Mengisi" }
  ],
  admin: [
    { id_admin: "ADM-001", id_user: "USR-004", unit_kerja: "Career & Internship" }
  ],
  mitra_industri: [
    { id_mitra: "MTR-101", id_user: "USR-002", nama_perusahaan: "PT Tech Indo Mandiri", alamat: "Jl. Jakarta No. 2, Lowokwaru, Malang", kontak_person: "Carmenita Wijaya", no_telepon: "081230261706", status_kemitraan: "aktif" },
    { id_mitra: "MTR-102", id_user: "USR-009", nama_perusahaan: "PT Shopee International Indonesia", alamat: "Pacific Century Place Lt. 25, SCBD Jakarta Selatan", kontak_person: "Jessica Tan", no_telepon: "081299887766", status_kemitraan: "aktif" },
    { id_mitra: "MTR-103", id_user: "USR-002", nama_perusahaan: "PT Bank Central Asia Tbk (BCA)", alamat: "Menara BCA Lt. 30, Grand Indonesia, Jakarta", kontak_person: "Budi Santoso", no_telepon: "081333444555", status_kemitraan: "aktif" }
  ],
  lowongan: [
    {
      id_lowongan: "LOW-001",
      id_mitra: "MTR-101",
      id_admin: "ADM-001",
      judul_posisi: "UI/UX Designer Intern",
      jenis_kesempatan: "Magang Bersertifikat",
      deskripsi: "Mengembangkan tampilan antarmuka web dan mobile application berbasis Design System FILKOM UB, melakukan user testing, wireframing, dan riset interaksi pengguna bersama tim produk digital.",
      kualifikasi: "Mahasiswa aktif S1 Sistem Informasi / Teknik Informatika semester 5-7. Mahir menggunakan Figma, Design System, Prototyping. Memiliki portofolio desain UI/UX.",
      bidang: "UI/UX Design",
      lokasi: "Surabaya",
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
      deskripsi: "Membangun sistem scalable web platform, integrasi RESTful API, arsitektur microservices berbasis Node.js & React untuk portal enterprise.",
      kualifikasi: "Lulusan S1 rumpun Informatika/Ilmu Komputer (Fresh Graduate / Pengalaman < 2 tahun). Menguasai JavaScript/TypeScript, SQL, Docker, dan Git.",
      bidang: "Software Engineering",
      lokasi: "Malang",
      periode_mulai: "2027-01-01",
      periode_selesai: "2028-01-01",
      kuota: 2,
      batas_pendaftaran: "2026-12-20",
      status_publikasi: "aktif",
      catatan_revisi: ""
    },
    {
      id_lowongan: "LOW-003",
      id_mitra: "MTR-102",
      id_admin: "ADM-001",
      judul_posisi: "Mobile Application Developer Intern",
      jenis_kesempatan: "Magang Bersertifikat",
      deskripsi: "Mengembangkan fitur mobile app consumer-facing dengan Flutter, optimalisasi performa rendering UI, serta unit testing bersama engineering team Shopee.",
      kualifikasi: "Mahasiswa aktif FILKOM UB. Menguasai Flutter/Dart, state management BLoC/Riverpod, dan clean architecture.",
      bidang: "Software Engineering",
      lokasi: "Jakarta",
      periode_mulai: "2027-02-01",
      periode_selesai: "2027-07-31",
      kuota: 5,
      batas_pendaftaran: "2026-12-31",
      status_publikasi: "aktif",
      catatan_revisi: ""
    },
    {
      id_lowongan: "LOW-004",
      id_mitra: "MTR-103",
      id_admin: "ADM-001",
      judul_posisi: "Data Analyst & Business Intelligence Intern",
      jenis_kesempatan: "Magang Bersertifikat",
      deskripsi: "Mengolah big data perbankan, menyusun dashboard Tableau & PowerBI, serta analisis tren transaksi digital untuk mendukung keputusan strategis perbankan nasional.",
      kualifikasi: "Mahasiswa aktif Sistem Informasi / Teknik Informatika semester 5-7. Mahir SQL, Python Data Analysis (Pandas), dan visualisasi data.",
      bidang: "Data & AI",
      lokasi: "Remote",
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
      kualifikasi: "Alumni Fresh Graduate S1 FILKOM UB. Memahami SDLC Agile Scrum, API testing (Postman), dan manual/automated testing.",
      bidang: "Software Engineering",
      lokasi: "Malang",
      periode_mulai: "2027-01-10",
      periode_selesai: "2028-01-10",
      kuota: 2,
      batas_pendaftaran: "2026-12-30",
      status_publikasi: "aktif",
      catatan_revisi: ""
    },
    {
      id_lowongan: "LOW-006",
      id_mitra: "MTR-102",
      id_admin: "",
      judul_posisi: "Cloud Infrastructure Engineer Intern",
      jenis_kesempatan: "Magang Bersertifikat",
      deskripsi: "Mengelola container Kubernetes, monitoring CI/CD pipeline, dan deployment cloud Google Cloud Platform.",
      kualifikasi: "Mahasiswa FILKOM UB yang memiliki pemahaman Linux, Docker, dan dasar-dasar Cloud Computing.",
      bidang: "Jaringan & Keamanan",
      lokasi: "Jakarta",
      periode_mulai: "2027-02-15",
      periode_selesai: "2027-08-15",
      kuota: 3,
      batas_pendaftaran: "2026-12-31",
      status_publikasi: "menunggu",
      catatan_revisi: ""
    },
    {
      id_lowongan: "LOW-007",
      id_mitra: "MTR-103",
      id_admin: "ADM-001",
      judul_posisi: "Cloud & DevOps Specialist",
      jenis_kesempatan: "Pekerjaan",
      deskripsi: "Membangun arsitektur cloud hybrid perbankan, automasi Terraform, microservices cluster management, dan observability sistem.",
      kualifikasi: "Alumni S1 FILKOM UB (Fresh Graduate / Pengalaman < 2 tahun). Memiliki sertifikasi GCP/AWS atau pemahaman Kubernetes.",
      bidang: "Jaringan & Keamanan",
      lokasi: "Jakarta",
      periode_mulai: "2027-01-15",
      periode_selesai: "2028-01-15",
      kuota: 2,
      batas_pendaftaran: "2026-12-31",
      status_publikasi: "aktif",
      catatan_revisi: ""
    },
    {
      id_lowongan: "LOW-008",
      id_mitra: "MTR-102",
      id_admin: "ADM-001",
      judul_posisi: "Data Scientist & AI Specialist",
      jenis_kesempatan: "Pekerjaan",
      deskripsi: "Mengembangkan model machine learning rekomendasi produk e-commerce, NLP chatbot, dan evaluasi performa model AI skala jutaan pengguna.",
      kualifikasi: "Alumni S1 rumpun Informatika. Menguasai Python, Scikit-learn, PyTorch, dan arsitektur LLM.",
      bidang: "Data & AI",
      lokasi: "Jakarta",
      periode_mulai: "2027-02-01",
      periode_selesai: "2028-02-01",
      kuota: 3,
      batas_pendaftaran: "2026-12-28",
      status_publikasi: "aktif",
      catatan_revisi: ""
    },
    {
      id_lowongan: "LOW-009",
      id_mitra: "MTR-101",
      id_admin: "ADM-001",
      judul_posisi: "IT Business Analyst & Product Associate",
      jenis_kesempatan: "Pekerjaan",
      deskripsi: "Menjembatani kebutuhan bisnis klien dengan tim pengembang software, menyusun PRD, BPMN proses bisnis, dan sprint planning.",
      kualifikasi: "Alumni S1 Sistem Informasi / Teknologi Informasi FILKOM UB. Menguasai BPMN, Scrum, Jira, dan analisis kebutuhan sistem.",
      bidang: "UI/UX Design",
      lokasi: "Surabaya",
      periode_mulai: "2027-01-20",
      periode_selesai: "2028-01-20",
      kuota: 2,
      batas_pendaftaran: "2026-12-25",
      status_publikasi: "aktif",
      catatan_revisi: ""
    },
    {
      id_lowongan: "LOW-010",
      id_mitra: "MTR-103",
      id_admin: "ADM-001",
      judul_posisi: "Cybersecurity Analyst Intern",
      jenis_kesempatan: "Magang Bersertifikat",
      deskripsi: "Melakukan vulnerability assessment sistem web & API, analisis log keamanan SOC, dan penetration testing terpandu bersama tim IT Security.",
      kualifikasi: "Mahasiswa aktif FILKOM UB semester 5-7. Memahami OWASP Top 10, network protocols, dan dasar ethical hacking.",
      bidang: "Jaringan & Keamanan",
      lokasi: "Surabaya",
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
    },
    {
      id_pendaftaran: "REG-002",
      id_lowongan: "LOW-003",
      id_user: "USR-005",
      status_seleksi: "berkas_terkirim",
      catatan_seleksi: "Berkas lamaran diterima oleh HR Shopee Indonesia dan sedang dalam antrean pemeriksaan administrasi.",
      tanggal_daftar: "2026-11-04 14:20:00"
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
    },
    {
      id_berkas: "BRK-004",
      id_pendaftaran: "REG-002",
      jenis_berkas: "CV",
      nama_file: "cv_kevin_sanjaya.pdf",
      ukuran_kb: 915,
      drive_file_id: "drive_file_id_004",
      drive_url: "https://drive.google.com/file/d/1KevinCV_DummyDriveLink/view?usp=sharing",
      tanggal_unggah: "2026-11-04 14:18:00"
    },
    {
      id_berkas: "BRK-005",
      id_pendaftaran: "REG-002",
      jenis_berkas: "Transkrip",
      nama_file: "transkrip_nilai_kevin.pdf",
      ukuran_kb: 1100,
      drive_file_id: "drive_file_id_005",
      drive_url: "https://drive.google.com/file/d/1KevinTranskrip_DummyDriveLink/view?usp=sharing",
      tanggal_unggah: "2026-11-04 14:19:00"
    },
    {
      id_berkas: "BRK-006",
      id_pendaftaran: "REG-002",
      jenis_berkas: "Surat Rekomendasi",
      nama_file: "surat_rekomendasi_fakultas_kevin.pdf",
      ukuran_kb: 580,
      drive_file_id: "drive_file_id_006",
      drive_url: "https://drive.google.com/file/d/1KevinRekom_DummyDriveLink/view?usp=sharing",
      tanggal_unggah: "2026-11-04 14:19:30"
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
        gaji: "8-15jt",
        gaji_nominal: 11500000,
        masa_tunggu: 2,
        keselarasan: 5,
        tingkat_tempat_kerja: "Multinasional / Internasional",
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
      nim: "215150401111033",
      id_admin: "ADM-001",
      periode_survei: 2026,
      status_karir: "Wirausaha",
      data_jawaban: JSON.stringify({
        instansi: "Edutech Edukasi Nusantara",
        posisi: "Co-Founder & Lead Instructor",
        gaji: "5-15jt",
        gaji_nominal: 8000000,
        masa_tunggu: 1,
        keselarasan: 5,
        tingkat_tempat_kerja: "Nasional",
        relevansi_kurikulum: "Sangat relevan untuk bidang teknologi pendidikan"
      }),
      is_draft: false,
      status_validasi: "tervalidasi",
      is_anomali: false,
      nomor_referensi: "SIMAGA/TS/2026/0002",
      tanggal_submit: "2026-11-01 11:15:00"
    },
    {
      id_kuesioner: "TRC-003",
      nim: "215150407111055",
      id_admin: "",
      periode_survei: 2026,
      status_karir: "Bekerja",
      data_jawaban: JSON.stringify({
        instansi: "PT Inovasi Finansial Global",
        posisi: "Junior IT Support",
        gaji: ">50jt",
        gaji_nominal: 92000000, // ANOMALI: Fresh grad gaji 92jt
        masa_tunggu: 1,
        keselarasan: 4,
        tingkat_tempat_kerja: "Lokal",
        relevansi_kurikulum: "Cukup relevan"
      }),
      is_draft: false,
      status_validasi: "menunggu",
      is_anomali: true,
      nomor_referensi: "SIMAGA/TS/2026/0003",
      tanggal_submit: "2026-11-05 10:15:00"
    }
  ],
  riwayat_pengingat: [
    { id_pengingat: "RMD-001", id_admin: "ADM-001", filter_target: "Sistem Informasi (Angkatan 2025)", jumlah_penerima: 45, tanggal_kirim: "2026-11-01 08:00:00" }
  ],
  notifikasi: [
    { id_notifikasi: "NTF-001", id_user: "USR-001", jenis: "status_seleksi", judul: "Status Lamaran Diperbarui", pesan: "Anda dijadwalkan wawancara daring pada 10 Des 2026 via Google Meet.", is_dibaca: false, tanggal_kirim: "2026-11-03 10:00:00" },
    { id_notifikasi: "NTF-002", id_user: "USR-002", jenis: "kurasi_lowongan", judul: "Lowongan Disetujui", pesan: "Lowongan UI/UX Designer Intern telah disetujui oleh unit Career & Internship.", is_dibaca: true, tanggal_kirim: "2026-11-01 11:30:00" },
    { id_notifikasi: "NTF-003", id_user: "USR-003", jenis: "tracer_study", judul: "Pengisian Tracer Study Aktif", pesan: "Halo Yaffa, kuesioner pelacakan karier alumni periode 2026 telah dibuka.", is_dibaca: false, tanggal_kirim: "2026-11-01 08:30:00" }
  ]
};

// Persistensi Cerdas ke LocalStorage: Muat data tersimpan jika ada agar penambahan pengguna & notifikasi tidak hilang
try {
  const savedDB = localStorage.getItem('SIMAGA_LOCAL_DB');
  if (savedDB) {
    const parsed = JSON.parse(savedDB);
    const tables = ['pengguna', 'mahasiswa', 'alumni', 'admin', 'mitra_industri', 'lowongan', 'pendaftaran', 'berkas_persyaratan', 'kuesioner', 'riwayat_pengingat', 'notifikasi'];
    tables.forEach(t => {
      if (Array.isArray(parsed[t]) && parsed[t].length > 0) {
        // Merge unik untuk pengguna dan alumni
        if (t === 'pengguna') {
          const map = new Map();
          window.SIMAGA_DB.pengguna.forEach(u => map.set(u.id_user, u));
          parsed.pengguna.forEach(u => map.set(u.id_user, u));
          window.SIMAGA_DB.pengguna = Array.from(map.values());
        } else if (t === 'alumni') {
          const map = new Map();
          window.SIMAGA_DB.alumni.forEach(a => map.set(a.id_user || a.nim, a));
          parsed.alumni.forEach(a => map.set(a.id_user || a.nim, a));
          window.SIMAGA_DB.alumni = Array.from(map.values());
        } else if (t === 'notifikasi') {
          const map = new Map();
          window.SIMAGA_DB.notifikasi.forEach(n => map.set(n.id_notifikasi, n));
          parsed.notifikasi.forEach(n => map.set(n.id_notifikasi, n));
          window.SIMAGA_DB.notifikasi = Array.from(map.values());
        } else {
          window.SIMAGA_DB[t] = parsed[t];
        }
      }
    });
  }
} catch(e) {
  console.warn('[Data Mock] Gagal memuat LocalStorage:', e.message);
}

localStorage.setItem('SIMAGA_LOCAL_DB', JSON.stringify(window.SIMAGA_DB));

window.syncLocalDB = function() {
  localStorage.setItem('SIMAGA_LOCAL_DB', JSON.stringify(window.SIMAGA_DB));
};
