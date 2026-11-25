/**
 * ==============================================================================
 * SIMAGA - UI HELPERS BERSAMA
 * ==============================================================================
 * - BIDANG_KEAHLIAN : daftar kategori filter lowongan (Mahasiswa, Alumni, Mitra)
 * - docIconBadge()  : ikon dokumen SVG pengganti kotak inisial perusahaan ("PTI")
 * - resolveFileUrl(): normalisasi tautan berkas pelamar menjadi URL absolut
 * - fileLinkAttrs() : atribut <a> aman (target=_blank + rel=noopener noreferrer)
 * ==============================================================================
 */

window.SIMAGA_UI = (function() {
  const BIDANG_KEAHLIAN = [
    'UI/UX Design',
    'Web & Mobile Development',
    'Data & AI',
    'Quality Assurance & DevOps',
    'Sistem & Jaringan'
  ];

  /**
   * Kotak ikon dokumen (SVG inline, tidak bergantung pada CDN ikon).
   * variant 'magang' -> palet emerald FILKOM, 'kerja' -> palet biru.
   */
  function docIconBadge(variant = 'magang') {
    const palette = variant === 'kerja'
      ? 'bg-blue-50 border-blue-200 text-blue-900'
      : 'bg-emerald-50 border-emerald-200 text-emerald-900';
    return `
      <div class="w-12 h-12 rounded-xl border flex items-center justify-center flex-shrink-0 ${palette}" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-6 h-6" fill="none"
          stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <path d="M14 2v6h6"/>
          <path d="M8 13h8"/>
          <path d="M8 17h5"/>
        </svg>
      </div>
    `;
  }

  /**
   * Ubah nilai drive_url dari database menjadi URL yang aman dibuka di tab baru.
   * - https://... / http://...      -> dipakai apa adanya
   * - drive.google.com/... (tanpa skema) -> diberi https://
   * - /uploads/... atau /sample-berkas/... -> diberi origin server saat ini
   * - kosong, '#', atau tidak dikenal -> null (tautan dinonaktifkan)
   */
  function resolveFileUrl(url) {
    if (!url) return null;
    const u = String(url).trim();
    if (!u || u === '#' || u.toLowerCase().startsWith('javascript:')) return null;
    if (/^https?:\/\//i.test(u) || u.startsWith('blob:')) return u;
    if (/^(drive|docs)\.google\.com\//i.test(u)) return 'https://' + u;
    if (u.startsWith('/')) return window.location.origin + u;
    return null;
  }

  function escapeAttr(s) {
    return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  /** Atribut href untuk <a> berkas; bila URL tidak valid, tautan dinonaktifkan. */
  function fileLinkAttrs(url) {
    const resolved = resolveFileUrl(url);
    if (!resolved) {
      return 'href="javascript:void(0)" aria-disabled="true" title="Tautan berkas tidak tersedia" style="opacity:.5;cursor:not-allowed"';
    }
    return `href="${escapeAttr(resolved)}" target="_blank" rel="noopener noreferrer"`;
  }

  return { BIDANG_KEAHLIAN, docIconBadge, resolveFileUrl, fileLinkAttrs };
})();
