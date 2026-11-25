const { getDrive } = require('../config/google');
const { Readable } = require('stream');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const ROOT_FOLDER_NAME = 'SIMAGA_Storage';

// Lokasi penyimpanan berkas saat Google Drive API belum dikonfigurasi (mode lokal/mock).
// Disajikan oleh server.js pada route /uploads. Catatan: disk Railway bersifat sementara
// (hilang saat redeploy), sehingga untuk produksi tetap disarankan memakai Google Drive.
const LOCAL_UPLOAD_DIR = path.join(__dirname, '../data/uploads');

function safeFileName(name) {
  const base = path.basename(String(name || 'berkas.pdf'));
  const cleaned = base.replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^_+/, '');
  return cleaned.toLowerCase().endsWith('.pdf') ? cleaned : `${cleaned || 'berkas'}.pdf`;
}

/**
 * Mencari atau membuat folder root SIMAGA_Storage
 */
async function getOrCreateRootFolder(drive) {
  if (process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID) {
    return process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  }

  // Cari folder bernama SIMAGA_Storage
  const res = await drive.files.list({
    q: `name = '${ROOT_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id, name)'
  });

  if (res.data.files && res.data.files.length > 0) {
    return res.data.files[0].id;
  }

  // Buat folder baru jika belum ada
  const folderMetadata = {
    name: ROOT_FOLDER_NAME,
    mimeType: 'application/vnd.google-apps.folder'
  };

  const folder = await drive.files.create({
    resource: folderMetadata,
    fields: 'id'
  });

  const folderId = folder.data.id;

  // Set sharing permission agar mitra & admin dapat mengakses
  try {
    await drive.permissions.create({
      fileId: folderId,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    });
  } catch (err) {
    console.warn('Gagal mengatur permission folder:', err.message);
  }

  return folderId;
}

/**
 * Mengunggah file PDF lamaran ke Google Drive di dalam subfolder Pendaftaran_{id_pendaftaran}
 */
async function uploadApplicationFile(id_pendaftaran, fileBuffer, originalName, mimeType = 'application/pdf') {
  const drive = getDrive();

  // Mode Fallback Lokal jika Drive API belum dikonfigurasi
  if (!drive) {
    // Sebelumnya hanya mengembalikan path relatif "/uploads/..." TANPA menyimpan berkas dan
    // tanpa route /uploads, sehingga klik tautan jatuh ke fallback SPA (kembali ke SIMAGA).
    // Sekarang berkas benar-benar ditulis ke disk dan disajikan oleh express.static('/uploads').
    console.log('[Drive Service] Mode Lokal Aktif. Menyimpan berkas ke disk server.');
    const folder = path.join(LOCAL_UPLOAD_DIR, safeFileName(id_pendaftaran).replace(/\.pdf$/, ''));
    fs.mkdirSync(folder, { recursive: true });
    const fileName = `${Date.now()}_${safeFileName(originalName)}`;
    fs.writeFileSync(path.join(folder, fileName), fileBuffer);
    const relUrl = `/uploads/${encodeURIComponent(path.basename(folder))}/${encodeURIComponent(fileName)}`;
    return {
      fileId: 'local_' + fileName,
      webViewLink: relUrl, // dijadikan URL absolut https:// oleh server.js (toAbsoluteUrl)
      webContentLink: relUrl
    };
  }

  try {
    const rootFolderId = await getOrCreateRootFolder(drive);

    // Cari atau buat subfolder: Pendaftaran_{id_pendaftaran}
    const subfolderName = `Pendaftaran_${id_pendaftaran}`;
    const subRes = await drive.files.list({
      q: `name = '${subfolderName}' and '${rootFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id, name)'
    });

    let subfolderId;
    if (subRes.data.files && subRes.data.files.length > 0) {
      subfolderId = subRes.data.files[0].id;
    } else {
      const subFolder = await drive.files.create({
        resource: {
          name: subfolderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [rootFolderId]
        },
        fields: 'id'
      });
      subfolderId = subFolder.data.id;
    }

    // Buat readable stream dari buffer
    const stream = new Readable();
    stream.push(fileBuffer);
    stream.push(null);

    // Upload file ke Google Drive
    const fileMetadata = {
      name: originalName,
      parents: [subfolderId]
    };

    const media = {
      mimeType: mimeType,
      body: stream
    };

    const uploaded = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink, webContentLink'
    });

    const fileId = uploaded.data.id;

    // Atur perizinan baca
    try {
      await drive.permissions.create({
        fileId: fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone'
        }
      });
    } catch (e) {}

    return {
      fileId: fileId,
      webViewLink: uploaded.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view?usp=sharing`,
      webContentLink: uploaded.data.webContentLink
    };
  } catch (error) {
    console.error('Drive Upload Error:', error);
    throw error;
  }
}

module.exports = {
  LOCAL_UPLOAD_DIR,
  getOrCreateRootFolder,
  uploadApplicationFile
};
