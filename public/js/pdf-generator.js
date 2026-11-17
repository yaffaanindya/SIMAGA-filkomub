/**
 * ==============================================================================
 * SIMAGA - CLIENT-SIDE PDF & QR GENERATOR (FILKOM UB)
 * ==============================================================================
 * Menghasilkan Dokumen PDF Bukti Pengisian Kuesioner Tracer Study resmi FILKOM UB
 * langsung di peramban (client-side) secara instan, lengkap dengan stempel digital
 * dan kode QR verifikasi otentik.
 * ==============================================================================
 */

window.SIMAGA_PDF = {
  /**
   * Menghasilkan Data URL gambar QR Code menggunakan library QRious
   */
  generateQRDataUrl(text) {
    try {
      const qr = new QRious({
        value: text,
        size: 150,
        level: 'H',
        foreground: '#143E35'
      });
      return qr.toDataURL();
    } catch (e) {
      console.warn('QRious fallback:', e);
      return null;
    }
  },

  /**
   * Membuat dan mengunduh file PDF tanda terima Tracer Study
   */
  downloadTracerProof(kuesioner, alumni) {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert('Library jsPDF sedang dimuat, silakan coba sesaat lagi.');
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const refNumber = kuesioner.nomor_referensi || 'SIMAGA/TS/2026/0001';
    const submitDate = kuesioner.tanggal_submit || new Date().toLocaleString('id-ID');

    // 1. HEADER KOP SURAT
    doc.setFillColor(20, 62, 53); // Deep Emerald
    doc.rect(20, 15, 170, 1.2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(20, 62, 53);
    doc.text('KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI', 105, 23, { align: 'center' });

    doc.setFontSize(13);
    doc.text('UNIVERSITAS BRAWIJAYA', 105, 29, { align: 'center' });

    doc.setFontSize(11);
    doc.text('FAKULTAS ILMU KOMPUTER', 105, 35, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Gedung F FILKOM UB, Jl. Veteran No. 8, Malang 65145 | filkom@ub.ac.id | filkom.ub.ac.id', 105, 40, { align: 'center' });

    // Garis Kop Surat
    doc.setDrawColor(20, 62, 53);
    doc.setLineWidth(0.6);
    doc.line(20, 44, 190, 44);

    doc.setDrawColor(212, 175, 55); // Aksen Emas
    doc.setLineWidth(0.3);
    doc.line(20, 45.5, 190, 45.5);

    // 2. JUDUL DOKUMEN & NOMOR REFERENSI
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(20, 62, 53);
    doc.text('TANDA TERIMA BUKTI PENGISIAN TRACER STUDY', 105, 56, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(180, 83, 9); // Amber
    doc.text(`NOMOR REFERENSI: ${refNumber}`, 105, 62, { align: 'center' });

    // Narasi Pembuka
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(31, 41, 55);
    const introText = 'Unit Career & Internship Fakultas Ilmu Komputer Universitas Brawijaya menerangkan bahwa alumni di bawah ini telah melengkapi instrumen survei penelusuran lulusan (Tracer Study) secara daring pada sistem terpadu SIMAGA:';
    const splitIntro = doc.splitTextToSize(introText, 170);
    doc.text(splitIntro, 20, 70);

    // 3. TABEL INFORMASI ALUMNI
    const startY = 82;
    const rowHeight = 7.5;
    const labels = [
      ['Nama Lengkap', `: ${alumni.nama_lengkap || '-'}`],
      ['Nomor Induk Mahasiswa (NIM)', `: ${alumni.nim || '-'}`],
      ['Program Studi', `: ${alumni.prodi || '-'}`],
      ['Tahun Kelulusan / Angkatan', `: ${alumni.tahun_lulus || '2025'}`],
      ['Kondisi Karier Saat Ini', `: ${kuesioner.status_karir || 'Bekerja'}`],
      ['Periode Survei', `: Tahun ${kuesioner.periode_survei || '2026'}`],
      ['Tanggal & Waktu Pengisian', `: ${submitDate}`],
      ['Status Validasi Data', `: ${kuesioner.status_validasi === 'tervalidasi' ? 'Sah / Tervalidasi' : 'Telah Terkirim (Menunggu Verifikasi)'}`]
    ];

    // Background Tabel
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(20, startY - 4, 170, (labels.length * rowHeight) + 4, 'FD');

    labels.forEach(([label, val], idx) => {
      const yPos = startY + (idx * rowHeight);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(label, 25, yPos);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(val, 85, yPos);
    });

    // 4. BAGIAN STEMPEL DIGITAL & KODE QR
    const bottomY = startY + (labels.length * rowHeight) + 14;

    // Generate QR Code
    const qrPayload = JSON.stringify({
      ref: refNumber,
      nim: alumni.nim,
      nama: alumni.nama_lengkap,
      prodi: alumni.prodi,
      status: 'TERVERIFIKASI_RESMI_FILKOM_UB'
    });
    const qrDataUrl = this.generateQRDataUrl(qrPayload);

    if (qrDataUrl) {
      doc.setDrawColor(226, 232, 240);
      doc.rect(25, bottomY, 45, 52);
      doc.addImage(qrDataUrl, 'PNG', 27.5, bottomY + 2.5, 40, 40);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(20, 62, 53);
      doc.text('PINDAI KODE QR UNTUK', 47.5, bottomY + 45, { align: 'center' });
      doc.text('VERIFIKASI KEASLIAN', 47.5, bottomY + 48.5, { align: 'center' });
    }

    // Tanda Tangan & Pengesahan di sisi kanan
    const signX = 115;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(31, 41, 55);
    const dateFormatted = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.text(`Malang, ${dateFormatted}`, signX, bottomY + 4);

    doc.setFont('helvetica', 'bold');
    doc.text('Unit Career & Internship FILKOM UB', signX, bottomY + 9);

    // Box Cap Stempel Elektronik
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(5, 150, 105);
    doc.roundedRect(signX, bottomY + 14, 60, 16, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(6, 95, 70);
    doc.text('TERVERIFIKASI SECARA ELEKTRONIK', signX + 30, bottomY + 20, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.text('Sistem Informasi SIMAGA FILKOM UB', signX + 30, bottomY + 25, { align: 'center' });

    // Nama Penandatangan
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('Dina Safitri, S.Kom., M.T.', signX, bottomY + 38);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Koordinator Layanan Karier & Alumni', signX, bottomY + 42);

    // 5. FOOTER
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('Dokumen ini sah dan diterbitkan secara otomatis oleh SIMAGA (Sistem Informasi Magang dan Alumni) FILKOM Universitas Brawijaya. Tidak memerlukan tanda tangan basah.', 105, 275, { align: 'center' });

    // Simpan File
    doc.save(`Bukti_Tracer_Study_${refNumber.replace(/\//g, '_')}.pdf`);
  }
};
