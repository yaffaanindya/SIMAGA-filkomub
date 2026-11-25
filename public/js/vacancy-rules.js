/**
 * ==============================================================================
 * SIMAGA - ATURAN LOWONGAN BERSAMA (UC-01, PC-01)
 * ==============================================================================
 * Satu sumber aturan untuk form "Publikasi Lowongan" DAN modal "Edit Lowongan"
 * (Lowongan Saya), dipakai di browser (window.SIMAGA_VACANCY_RULES) maupun di
 * server (require('../public/js/vacancy-rules.js')), sehingga field, pilihan,
 * dan validasi keduanya selalu identik.
 * ==============================================================================
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SIMAGA_VACANCY_RULES = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const JENIS_KESEMPATAN = [
    { value: 'Magang Bersertifikat', label: 'Magang Bersertifikat' },
    { value: 'Pekerjaan', label: 'Lowongan Pekerjaan Penuh Waktu' }
  ];

  const BIDANG_KEAHLIAN = [
    'UI/UX Design',
    'Web & Mobile Development',
    'Data & AI',
    'Quality Assurance & DevOps',
    'Sistem & Jaringan'
  ];

  const MODE_KERJA = [
    { value: 'On-site', label: 'On-site (Di Kantor)' },
    { value: 'Hybrid', label: 'Hybrid (Kombinasi)' },
    { value: 'Remote', label: 'Remote (Kerja Jarak Jauh)' }
  ];

  const isBlank = (v) => v === undefined || v === null || String(v).trim() === '';

  /** Tanggal hari ini (YYYY-MM-DD) menurut zona waktu kampus (WIB), sama di browser & server. */
  function todayWIB() {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
  }

  /**
   * Pecah kolom `lokasi` tersimpan menjadi { mode_kerja, kota }.
   * Mendukung format lama & baru: "Malang (Hybrid)", "Hybrid (Malang)", "Remote", "Jakarta".
   */
  function parseLokasi(lokasi) {
    const text = String(lokasi || '').trim();
    let mode_kerja = '';
    const found = text.match(/\b(on[\s-]?site|hybrid|remote)\b/i);
    if (found) {
      const t = found[1].toLowerCase().replace(/[\s-]/g, '');
      mode_kerja = t === 'onsite' ? 'On-site' : t === 'hybrid' ? 'Hybrid' : 'Remote';
    }
    let kota = found ? text.replace(found[0], '') : text;
    kota = kota.replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim();
    if (/^seluruh indonesia$/i.test(kota)) kota = '';
    return { mode_kerja: mode_kerja || 'On-site', kota };
  }

  /** Susun kolom `lokasi` dengan format baku: "Kota (Mode)" atau "Remote" bila kota kosong. */
  function composeLokasi(mode_kerja, kota) {
    const k = String(kota || '').trim();
    return k ? `${k} (${mode_kerja})` : mode_kerja;
  }

  /** Kota wajib kecuali mode kerja Remote. */
  function isKotaRequired(mode_kerja) {
    return mode_kerja !== 'Remote';
  }

  /**
   * Validasi lengkap data lowongan (dipakai untuk BUAT maupun EDIT).
   * @param {object} input  field mentah dari form / body request
   * @param {object} opts   { today: 'YYYY-MM-DD' }
   * @returns {{ valid: boolean, errors: Object<string,string>, data: object }}
   */
  function validateVacancy(input, opts = {}) {
    const today = opts.today || todayWIB();
    const errors = {};

    // Klien lama yang hanya mengirim `lokasi` tetap didukung
    let mode_kerja = input.mode_kerja;
    let kota = input.kota;
    if (isBlank(mode_kerja) && !isBlank(input.lokasi)) {
      const parsed = parseLokasi(input.lokasi);
      mode_kerja = parsed.mode_kerja;
      kota = parsed.kota;
    }

    const data = {
      judul_posisi: String(input.judul_posisi || '').trim(),
      jenis_kesempatan: String(input.jenis_kesempatan || '').trim(),
      bidang_keahlian: String(input.bidang_keahlian || '').trim(),
      deskripsi: String(input.deskripsi || '').trim(),
      kualifikasi: String(input.kualifikasi || '').trim(),
      mode_kerja: String(mode_kerja || '').trim(),
      kota: String(kota || '').trim(),
      periode_mulai: String(input.periode_mulai || '').trim(),
      periode_selesai: String(input.periode_selesai || '').trim(),
      kuota: input.kuota,
      batas_pendaftaran: String(input.batas_pendaftaran || '').trim()
    };

    if (!data.judul_posisi) errors.judul_posisi = 'Judul posisi wajib diisi.';
    if (!JENIS_KESEMPATAN.some(j => j.value === data.jenis_kesempatan)) errors.jenis_kesempatan = 'Pilih jenis kesempatan yang valid.';
    if (!BIDANG_KEAHLIAN.includes(data.bidang_keahlian)) errors.bidang_keahlian = 'Pilih bidang keahlian yang valid.';
    if (!data.deskripsi) errors.deskripsi = 'Deskripsi tugas wajib diisi.';
    if (!data.kualifikasi) errors.kualifikasi = 'Kualifikasi wajib diisi.';
    if (!MODE_KERJA.some(m => m.value === data.mode_kerja)) errors.mode_kerja = 'Pilih mode kerja (On-site, Hybrid, atau Remote).';
    if (isKotaRequired(data.mode_kerja) && !data.kota) errors.kota = 'Kota / lokasi kantor wajib diisi untuk mode On-site atau Hybrid.';

    const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s);
    if (!isDate(data.periode_mulai)) errors.periode_mulai = 'Periode mulai wajib diisi.';
    if (!isDate(data.periode_selesai)) errors.periode_selesai = 'Periode selesai wajib diisi.';
    else if (isDate(data.periode_mulai) && data.periode_selesai < data.periode_mulai) {
      errors.periode_selesai = 'Periode selesai harus lebih besar atau sama dengan periode mulai.';
    }

    const kuotaNum = Number(data.kuota);
    if (isBlank(data.kuota) || !Number.isInteger(kuotaNum) || kuotaNum < 1) errors.kuota = 'Kuota penerimaan minimal 1 orang (bilangan bulat).';
    else data.kuota = kuotaNum;

    if (!isDate(data.batas_pendaftaran)) errors.batas_pendaftaran = 'Batas akhir pendaftaran wajib diisi.';
    else if (data.batas_pendaftaran <= today) errors.batas_pendaftaran = 'Batas akhir pendaftaran harus lebih besar dari hari ini.';

    data.lokasi = composeLokasi(data.mode_kerja, data.kota);

    return { valid: Object.keys(errors).length === 0, errors, data };
  }

  return {
    JENIS_KESEMPATAN,
    BIDANG_KEAHLIAN,
    MODE_KERJA,
    todayWIB,
    parseLokasi,
    composeLokasi,
    isKotaRequired,
    validateVacancy
  };
});
