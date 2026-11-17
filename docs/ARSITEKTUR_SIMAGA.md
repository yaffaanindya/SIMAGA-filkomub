# DOKUMENTASI TEKNIS & ARSITEKTUR PERANGKAT LUNAK "SIMAGA"
## SISTEM INFORMASI MAGANG DAN ALUMNI (TRACER STUDY)
### FAKULTAS ILMU KOMPUTER UNIVERSITAS BRAWIJAYA (FILKOM UB)

---

## 1. PENDAHULUAN & LATAR BELAKANG SISTEM

Sistem Informasi Magang dan Alumni (**SIMAGA**) adalah platform web terpadu berbasis komputasi awan Google Workspace yang dirancang untuk mengatasi empat permasalahan operasional mendasar di lingkungan Fakultas Ilmu Komputer, Universitas Brawijaya:
1. **Akses dan Kurasi Lowongan yang Terfragmentasi:** 56% mahasiswa kesulitan memvalidasi keaslian informasi lowongan karena tersebar di kanal informal. SIMAGA menyediakan kanal resmi terstandarisasi dengan verifikasi staf fakultas.
2. **Proses Pendaftaran & Seleksi yang Tidak Terpusat:** 61% mahasiswa mengeluhkan lambatnya verifikasi berkas dan tidak adanya visibilitas status seleksi. SIMAGA menyediakan penyimpanan cloud Google Drive otomatis dan pelacakan linimasa status real-time.
3. **Rendahnya Partisipasi Tracer Study:** Tingkat pengembalian kuesioner alumni di bawah 38%. SIMAGA mengimplementasikan formulir dinamis bertahap, fitur simpan draf, penerbitan tanda terima digital ber-QR Code, serta email pengingat massal.
4. **Inefisiensi Rekapitulasi Laporan IKU 1 & Akreditasi:** Staf fakultas menghabiskan banyak waktu mengolah data mentah. SIMAGA menyediakan dasbor analitik real-time, auto-flagging anomali data, serta ekspor laporan otomatis ke Excel (.xlsx) dan PDF.

---

## 2. ARSITEKTUR SISTEM & INTEGRASI GOOGLE WORKSPACE

```
+---------------------------------------------------------------------------------+
|                        LAPISAN ANTARMUKA PENGGUNA (UI/UX)                       |
|   - Landing Page (Nuova Edile Costanza / Academic Prestige Aesthetic)           |
|   - Dasbor Mahasiswa (MHS), Alumni (ALM), Mitra (MIN), Admin (ADM)              |
|   - Komponen: Dropzone PDF 5MB, QRious Canvas Generator, Chart.js Analitik      |
+---------------------------------------------------------------------------------+
                                       |
                   RESTful JSON / Form Data / Base64 API
                                       |
+---------------------------------------------------------------------------------+
|                    LAPISAN LOGIKA BISNIS & CONTROLLER (SIMAGA)                  |
|   - Autentikasi & RBAC Sesi (UC-16)                                             |
|   - Validasi Tanggal Lowongan & Kurasi Admin (PC-01, PC-08)                     |
|   - Validasi 3 Berkas PDF & Penjadwalan Wawancara (PC-03, PC-09)                 |
|   - Instrumen Tracer Study Dinamis & Deteksi Anomali Gaji (PC-04, PC-05)        |
|   - Kalkulasi Metrik IKU 1 & Generator Dokumen Sah QR Code (PC-06, PC-07)       |
+---------------------------------------------------------------------------------+
                         |                                 |
        Spreadsheets API v4 / Apps Script        Drive API v3 / DriveApp
                         |                                 |
+--------------------------------+       +----------------------------------------+
|   DATABASE (GOOGLE SHEETS)     |       |       FILE STORAGE (GOOGLE DRIVE)      |
|   1. pengguna                  |       | Root: `SIMAGA_Storage/`                |
|   2. mahasiswa                 |       | Subfolder per ID Pendaftaran:          |
|   3. alumni                    |       |   `Pendaftaran_REG-20261102-091500/`   |
|   4. admin                     |       |      |-- cv_pelamar.pdf                |
|   5. mitra_industri            |       |      |-- transkrip_nilai.pdf           |
|   6. lowongan                  |       |      `-- rekomendasi_fakultas.pdf      |
|   7. pendaftaran               |       | Hak Akses: Link sharing view permission|
|   8. berkas_persyaratan        |       +----------------------------------------+
|   9. kuesioner                 |
|   10. riwayat_pengingat        |
|   11. notifikasi               |
+--------------------------------+
```

---

## 3. MATRIKS USE CASE & KELAYAKAN SPESIFIKASI

| Kode UC | Judul Use Case | Aktor Terlibat | Relasi Include / Extend | Ringkasan Fungsi Utama |
| :--- | :--- | :--- | :--- | :--- |
| **UC-01** | Mengajukan Lowongan Kerja/Magang | Mitra Industri | `<<include>>` UC-16 | Mitra mengisi form lowongan dengan validasi tanggal tenggat > hari ini. Status awal: `'menunggu'`. |
| **UC-02** | Meninjau Berkas Lamaran Pelamar | Mitra Industri | `<<include>>` UC-16 | Mitra meninjau profil pelamar, mengunduh 3 berkas PDF dari Google Drive, dan memperbarui tahap seleksi. |
| **UC-03** | Mencari & Meninjau Lowongan Magang | Mahasiswa | `<<include>>` UC-16 | Menampilkan katalog lowongan aktif terkurasi dengan pencarian kata kunci dan filter lokasi/keahlian. |
| **UC-04** | Mendaftar Magang Bersertifikat | Mahasiswa | `<<include>>` UC-05, UC-16 | Mengajukan lamaran magang resmi, mencegah pendaftaran ganda pada lowongan yang sama. |
| **UC-05** | Mengunggah Berkas Persyaratan | Mahasiswa | - | Mengunggah 3 berkas: CV, Transkrip, Surat Rekomendasi (wajib format `.pdf` & $\le 5$ MB) ke Google Drive. |
| **UC-06** | Memantau Status Seleksi Magang | Mahasiswa | `<<include>>` UC-16 | Linimasa 3 tahap seleksi (Pemeriksaan Berkas &rarr; Wawancara &rarr; Keputusan Akhir) beserta catatan jadwal dari mitra. |
| **UC-07** | Mengisi Kuesioner Tracer Study | Alumni | `<<include>>` UC-16, `<<extend>>` UC-08, UC-09 | Formulir dinamis 3 tahap berdasarkan kondisi karier (*Bekerja*, *Wirausaha*, *Studi Lanjut*, *Mencari Kerja*). |
| **UC-08** | Menyimpan Draf Kuesioner | Alumni | `<<extend>>` UC-07 | Menyimpan progres isian sementara ke sheet `kuesioner` (`is_draft = true`) tanpa validasi kolom wajib. |
| **UC-09** | Mengunduh Bukti Pengisian Kuesioner | Alumni | `<<extend>>` UC-07 | Menerbitkan dokumen tanda terima PDF resmi dengan stempel digital, nomor referensi unik, dan kode QR. |
| **UC-10** | Mencari Lowongan Pekerjaan | Alumni | `<<include>>` UC-16 | Katalog kesempatan kerja penuh waktu yang disesuaikan untuk lulusan fresh graduate. |
| **UC-11** | Memverifikasi & Menyetujui Lowongan | Admin | `<<include>>` UC-16 | Kurasi pengajuan mitra. Setujui (`'aktif'`) atau Tolak (`'ditolak'` + wajib mengisi catatan revisi). |
| **UC-12** | Memantau Dasbor Analitik Tracer Study | Admin | `<<include>>` UC-16 | Dasbor metrik real-time: Response Rate, Masa Tunggu Kerja, Capaian IKU 1, dan grafik batang sebaran karier. |
| **UC-13** | Memvalidasi Data Responden Kuesioner | Admin | `<<include>>` UC-16 | Memeriksa isian alumni, mendeteksi baris anomali (*auto-flagging*), mengesahkan (*Sahkan*) atau meminta klarifikasi. |
| **UC-14** | Mengirimkan Surel Pengingat Massal | Admin | `<<include>>` UC-16 | Pengiriman blast email otomatis kepada alumni belum mengisi berdasarkan filter prodi dan tahun kelulusan. |
| **UC-15** | Mengekspor Laporan Capaian IKU 1 | Admin | `<<include>>` UC-16 | Mengompilasi dan mengunduh rekapitulasi data responden tervalidasi ke format Excel (`.xlsx`) dan PDF. |
| **UC-16** | Melakukan Autentikasi atau Login | Seluruh Pengguna | - | Memvalidasi surel/NIM/username dan kata sandi, memeriksa `status_akun = 'aktif'`, dan mengarahkan ke dasbor peran. |

---

## 4. STRUKTUR DETAIL 11 TABEL GOOGLE SHEETS

1. **`pengguna`**
   * Primary Key: `id_user`
   * Kolom: `id_user`, `email`, `password_hash`, `nama_lengkap`, `role`, `status_akun`
   * Constraint: `email` UNIQUE, `role` in (`Mahasiswa`, `Alumni`, `MitraIndustri`, `Admin`), `status_akun` default `'aktif'`.
2. **`mahasiswa`**
   * Primary Key: `nim`, Foreign Key: `id_user` &rarr; `pengguna(id_user)`
   * Kolom: `nim`, `id_user`, `prodi`, `angkatan`
3. **`alumni`**
   * Primary Key: `nim`, Foreign Key: `id_user` &rarr; `pengguna(id_user)`
   * Kolom: `nim`, `id_user`, `prodi`, `tahun_lulus`, `status_pengisian`
4. **`admin`**
   * Primary Key: `id_admin`, Foreign Key: `id_user` &rarr; `pengguna(id_user)`
   * Kolom: `id_admin`, `id_user`, `unit_kerja` (`Career & Internship`)
5. **`mitra_industri`**
   * Primary Key: `id_mitra`, Foreign Key: `id_user` &rarr; `pengguna(id_user)`
   * Kolom: `id_mitra`, `id_user`, `nama_perusahaan`, `alamat`, `kontak_person`, `no_telepon`, `status_kemitraan`
6. **`lowongan`**
   * Primary Key: `id_lowongan`, Foreign Keys: `id_mitra`, `id_admin`
   * Kolom: `id_lowongan`, `id_mitra`, `id_admin`, `judul_posisi`, `jenis_kesempatan`, `deskripsi`, `kualifikasi`, `lokasi`, `periode_mulai`, `periode_selesai`, `kuota`, `batas_pendaftaran`, `status_publikasi`, `catatan_revisi`
7. **`pendaftaran`**
   * Primary Key: `id_pendaftaran`, Foreign Keys: `id_lowongan`, `id_user`
   * Kolom: `id_pendaftaran`, `id_lowongan`, `id_user`, `status_seleksi`, `catatan_seleksi`, `tanggal_daftar`
8. **`berkas_persyaratan`**
   * Primary Key: `id_berkas`, Foreign Key: `id_pendaftaran`
   * Kolom: `id_berkas`, `id_pendaftaran`, `jenis_berkas`, `nama_file`, `ukuran_kb`, `drive_file_id`, `drive_url`, `tanggal_unggah`
9. **`kuesioner`**
   * Primary Key: `id_kuesioner`, Foreign Keys: `nim`, `id_admin`
   * Kolom: `id_kuesioner`, `nim`, `id_admin`, `periode_survei`, `status_karir`, `data_jawaban` (JSON), `is_draft`, `status_validasi`, `is_anomali`, `nomor_referensi`, `tanggal_submit`
10. **`riwayat_pengingat`**
    * Primary Key: `id_pengingat`, Foreign Key: `id_admin`
    * Kolom: `id_pengingat`, `id_admin`, `filter_target`, `jumlah_penerima`, `tanggal_kirim`
11. **`notifikasi`**
    * Primary Key: `id_notifikasi`, Foreign Key: `id_user`
    * Kolom: `id_notifikasi`, `id_user`, `jenis`, `judul`, `pesan`, `is_dibaca`, `tanggal_kirim`

---

## 5. LOGIKA DETEKSI ANOMALI DATA & KALKULASI IKU 1

### A. Pendeteksian Anomali Otomatis (`is_anomali = TRUE`)
Ketika alumni mengirim kuesioner final, sistem mengevaluasi integritas isian data:
* Jika responden memilih karier **Bekerja**:
  * Nominal Gaji Pokok $> \text{Rp } 50.000.000$ per bulan (untuk alumni fresh graduate), ATAU $< \text{Rp } 0$.
  * Masa tunggu kerja pertama $< 0$ bulan ATAU $> 60$ bulan.
* Jika terdeteksi, atribut `is_anomali` otomatis diatur menjadi `TRUE` dan baris data disorot dengan warna merah pada tabel Admin (`row-anomali`). Data ini ditangguhkan dari perhitungan IKU 1 hingga Admin melakukan klarifikasi resmi.

### B. Rumus Kalkulasi Indikator Kinerja Utama 1 (IKU 1)
Capaian IKU 1 perguruan tinggi mengukur persentase lulusan yang berhasil mendapat pekerjaan yang layak, melanjutkan studi, atau menjadi wirausahawan:
$$\text{Capaian IKU 1 (\%)} = \left( \frac{N_{\text{Bekerja Layak}} + N_{\text{Wirausaha}} + N_{\text{Studi Lanjut}}}{N_{\text{Total Responden Tervalidasi}}} \right) \times 100\%$$
* Data yang dihitung secara ketat hanya mencakup kuesioner dengan `status_validasi = 'tervalidasi'`.
