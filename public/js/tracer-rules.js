/**
 * ==============================================================================
 * SIMAGA - ATURAN KUESIONER TRACER STUDY BERSAMA (UC-07, UC-08)
 * ==============================================================================
 * Dipakai di browser (window.SIMAGA_TRACER_RULES) dan server
 * (require('../public/js/tracer-rules.js')) agar validasi kirim final identik.
 *
 * - Simpan Draf  : TIDAK divalidasi (boleh kosong, status_karir boleh NULL).
 * - Kirim Final  : status_karir wajib + kolom wajib sesuai status karier.
 *   Kolom teks dicek dengan .trim() !== '' sehingga spasi kosong tidak lolos.
 *
 * Catatan pemetaan kolom:
 *   instansi       -> nama perusahaan / nama usaha / perguruan tinggi tujuan
 *   gaji           -> rentang pendapatan (Bekerja) / omset bulanan (Wirausaha)
 *   keselarasan    -> skala relevansi kurikulum 1-5 (pertanyaan wajib Tahap 3)
 * ==============================================================================
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SIMAGA_TRACER_RULES = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const STATUS_KARIR = ['Bekerja', 'Wirausaha', 'Melanjutkan Studi', 'Mencari Kerja'];

  // Kolom wajib per status karier: [key data_jawaban, label, tipe]
  const REQUIRED_FIELDS = {
    'Bekerja': [
      ['instansi', 'Nama Instansi / Perusahaan', 'text'],
      ['posisi', 'Posisi / Jabatan Pekerjaan', 'text'],
      ['gaji', 'Rentang Pendapatan Bulanan', 'text'],
      ['gaji_nominal', 'Nominal Gaji Pokok', 'number'],
      ['masa_tunggu', 'Masa Tunggu Mendapat Kerja Pertama', 'number'],
      ['tingkat_tempat_kerja', 'Tingkat Tempat Kerja', 'text'],
      ['keselarasan', 'Relevansi Kurikulum (Skala 1-5)', 'scale']
    ],
    'Wirausaha': [
      ['instansi', 'Nama Usaha / Startup', 'text'],
      ['posisi', 'Bidang Usaha', 'text'],
      ['gaji', 'Omset / Pendapatan Rata-rata Bulanan', 'text'],
      ['masa_tunggu', 'Masa Tunggu Memulai Usaha', 'number'],
      ['keselarasan', 'Relevansi Kurikulum (Skala 1-5)', 'scale']
    ],
    'Melanjutkan Studi': [
      ['instansi', 'Perguruan Tinggi Tujuan', 'text'],
      ['posisi', 'Program Studi & Jenjang', 'text'],
      ['sumber_biaya', 'Sumber Pendanaan Studi', 'text'],
      ['keselarasan', 'Relevansi Kurikulum (Skala 1-5)', 'scale']
    ],
    'Mencari Kerja': [
      ['keselarasan', 'Relevansi Kurikulum (Skala 1-5)', 'scale']
    ]
  };

  const isBlank = (v) => v === undefined || v === null || String(v).trim() === '';

  /**
   * Validasi kirim final.
   * @returns {{ valid: boolean, missing: Array<{field: string, label: string, message: string}> }}
   */
  function validateTracerFinal(status_karir, data_jawaban) {
    const missing = [];
    const status = String(status_karir || '').trim();
    const j = data_jawaban && typeof data_jawaban === 'object' ? data_jawaban : {};

    if (!STATUS_KARIR.includes(status)) {
      missing.push({ field: 'status_karir', label: 'Kondisi Karier Saat Ini', message: 'Status karier wajib dipilih.' });
      return { valid: false, missing };
    }

    REQUIRED_FIELDS[status].forEach(([field, label, type]) => {
      const v = j[field];
      if (isBlank(v)) {
        missing.push({ field, label, message: `${label} wajib diisi.` });
        return;
      }
      if (type === 'number' && !Number.isFinite(Number(String(v).trim()))) {
        missing.push({ field, label, message: `${label} harus berupa angka.` });
      }
      if (type === 'scale' && !Number.isFinite(Number(v))) {
        missing.push({ field, label, message: `${label} wajib dipilih.` });
      }
    });

    return { valid: missing.length === 0, missing };
  }

  return { STATUS_KARIR, REQUIRED_FIELDS, isBlank, validateTracerFinal };
});
