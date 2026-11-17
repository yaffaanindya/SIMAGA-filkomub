const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

/**
 * Menghasilkan Dokumen PDF Bukti Pengisian Kuesioner Tracer Study resmi FILKOM UB
 * Lengkap dengan Identitas, Nomor Referensi, Cap Stempel Digital, dan Kode QR Verifikasi
 */
async function generateTracerProofPDF(kuesionerData, alumniData) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Bukti Tracer Study - ${alumniData.nama_lengkap || 'Alumni'}`,
          Author: 'Unit Career & Internship FILKOM UB',
          Subject: 'Tanda Terima Resmi Kuesioner Tracer Study'
        }
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Generate QR Code Buffer
      const qrDataText = JSON.stringify({
        ref: kuesionerData.nomor_referensi,
        nim: alumniData.nim,
        nama: alumniData.nama_lengkap,
        prodi: alumniData.prodi,
        date: kuesionerData.tanggal_submit,
        status: 'TERVERIFIKASI_RESMI_FILKOM_UB'
      });

      const qrImageBuffer = await QRCode.toBuffer(qrDataText, {
        width: 140,
        margin: 1,
        color: {
          dark: '#143E35',
          light: '#FFFFFF'
        }
      });

      // 1. KOP SURAT FAKULTAS ILMU KOMPUTER UNIVERSITAS BRAWIJAYA
      doc.rect(50, 45, 495, 3).fill('#143E35');

      doc.fillColor('#143E35')
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI', { align: 'center' });

      doc.fontSize(16)
         .font('Helvetica-Bold')
         .text('UNIVERSITAS BRAWIJAYA', { align: 'center' });

      doc.fontSize(13)
         .font('Helvetica-Bold')
         .text('FAKULTAS ILMU KOMPUTER', { align: 'center' });

      doc.fontSize(9)
         .font('Helvetica')
         .fillColor('#4B5563')
         .text('Gedung F FILKOM UB, Jl. Veteran No. 8, Malang 65145 | Surel: filkom@ub.ac.id | Laman: filkom.ub.ac.id', { align: 'center' });

      doc.moveDown(0.5);
      doc.strokeColor('#143E35').lineWidth(2).moveTo(50, 125).lineTo(545, 125).stroke();
      doc.strokeColor('#D4AF37').lineWidth(1).moveTo(50, 129).lineTo(545, 129).stroke();

      // 2. JUDUL DOKUMEN
      doc.moveDown(1.5);
      doc.fillColor('#143E35')
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('TANDA TERIMA BUKTI PENGISIAN TRACER STUDY', { align: 'center' });

      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#B45309')
         .text(`NOMOR REFERENSI: ${kuesionerData.nomor_referensi || 'SIMAGA/TS/2026/0001'}`, { align: 'center' });

      doc.moveDown(1.2);

      // Keterangan Pembuka
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#1F2937')
         .text('Unit Career & Internship Fakultas Ilmu Komputer Universitas Brawijaya menerangkan bahwa alumni di bawah ini telah melengkapi instrumen survei penelusuran lulusan (Tracer Study) secara daring pada sistem terintegrasi SIMAGA:', {
           align: 'justify',
           lineGap: 4
         });

      doc.moveDown(1);

      // 3. TABEL IDENTITAS ALUMNI
      const tableTop = doc.y;
      const leftColX = 65;
      const valColX = 220;

      const items = [
        ['Nama Lengkap', `: ${alumniData.nama_lengkap || '-'}`],
        ['Nomor Induk Mahasiswa (NIM)', `: ${alumniData.nim || '-'}`],
        ['Program Studi', `: ${alumniData.prodi || '-'}`],
        ['Tahun Kelulusan / Angkatan', `: ${alumniData.tahun_lulus || '2025'}`],
        ['Kondisi Karier Saat Ini', `: ${kuesionerData.status_karir || 'Bekerja'}`],
        ['Periode Survei', `: Tahun ${kuesionerData.periode_survei || '2026'}`],
        ['Tanggal & Waktu Pengisian', `: ${kuesionerData.tanggal_submit || new Date().toLocaleString('id-ID')}`],
        ['Status Validasi Data', `: ${kuesionerData.status_validasi === 'tervalidasi' ? 'Sah / Tervalidasi' : 'Telah Terkirim (Menunggu Verifikasi)'}`]
      ];

      doc.rect(50, tableTop - 5, 495, items.length * 22 + 10).fillAndStroke('#F9FAFB', '#E5E7EB');

      let currentY = tableTop + 5;
      items.forEach(([label, value]) => {
        doc.fillColor('#4B5563').font('Helvetica-Bold').fontSize(10).text(label, leftColX, currentY);
        doc.fillColor('#111827').font('Helvetica').fontSize(10).text(value, valColX, currentY);
        currentY += 22;
      });

      doc.y = currentY + 15;

      // 4. BAGIAN STEMPEL & QR CODE VERIFIKASI
      const footerY = doc.y + 10;

      // Kotak QR Code
      doc.rect(65, footerY, 150, 160).strokeColor('#E5E7EB').stroke();
      doc.image(qrImageBuffer, 70, footerY + 5, { width: 140 });
      doc.fontSize(8)
         .font('Helvetica-Bold')
         .fillColor('#143E35')
         .text('PINDAI KODE QR UNTUK VERIFIKASI KEASLIAN', 65, footerY + 148, { width: 150, align: 'center' });

      // Info Pengesahan di sisi kanan
      const signX = 300;
      doc.fillColor('#1F2937')
         .font('Helvetica')
         .fontSize(10)
         .text('Malang, ' + new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), signX, footerY + 5);

      doc.font('Helvetica-Bold')
         .text('Unit Career & Internship FILKOM UB', signX, footerY + 22);

      // Box Stempel Digital
      doc.rect(signX, footerY + 45, 180, 50).fillAndStroke('#ECFDF5', '#059669');
      doc.fillColor('#065F46')
         .font('Helvetica-Bold')
         .fontSize(9)
         .text('TERVERIFIKASI SECARA ELEKTRONIK', signX + 5, footerY + 55, { align: 'center', width: 170 })
         .fontSize(8)
         .font('Helvetica')
         .text('Sistem Informasi SIMAGA FILKOM UB', signX + 5, footerY + 70, { align: 'center', width: 170 });

      doc.fillColor('#1F2937')
         .font('Helvetica-Bold')
         .fontSize(10)
         .text('Dina Safitri, S.Kom., M.T.', signX, footerY + 115)
         .font('Helvetica')
         .fontSize(9)
         .text('Koordinator Layanan Karier & Alumni', signX, footerY + 130);

      // 5. FOOTER RESMI
      doc.fontSize(8)
         .font('Helvetica-Oblique')
         .fillColor('#9CA3AF')
         .text('Dokumen ini sah dan diterbitkan secara otomatis oleh SIMAGA (Sistem Informasi Magang dan Alumni) FILKOM Universitas Brawijaya. Tidak memerlukan tanda tangan basah.', 50, 780, { align: 'center', width: 495 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  generateTracerProofPDF
};
