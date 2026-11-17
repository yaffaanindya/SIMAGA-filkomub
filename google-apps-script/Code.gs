/**
 * ==============================================================================
 * SIMAGA (Sistem Informasi Magang dan Alumni - FILKOM Universitas Brawijaya)
 * GOOGLE APPS SCRIPT WEB APP BACKEND API (doGet & doPost)
 * ==============================================================================
 * Backend Serverless Resmi yang terhubung langsung dengan Google Sheets (11 Tabs)
 * dan Google Drive Storage (Penyimpanan Berkas PDF Lamaran & Subfolder Otomatis).
 * ==============================================================================
 */

// Helper: Menghasilkan Response JSON dengan Header CORS
function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// Helper: Membaca sheet berdasarkan nama
function getSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(name);
  if (!sheet) {
    throw new Error("Sheet '" + name + "' tidak ditemukan. Jalankan setupDatabase() terlebih dahulu.");
  }
  return sheet;
}

// Helper: Mengubah data sheet menjadi array of objects
function sheetToObjects(sheetName) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const rowObj = {};
    for (let j = 0; j < headers.length; j++) {
      rowObj[headers[j]] = data[i][j];
    }
    rowObj._rowIndex = i + 1; // 1-based row index in sheet
    rows.push(rowObj);
  }
  return rows;
}

// Helper: Mencari folder SIMAGA_Storage
function getOrCreateRootFolder() {
  const FOLDER_NAME = "SIMAGA_Storage";
  const folders = DriveApp.getFoldersByName(FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }
  const root = DriveApp.createFolder(FOLDER_NAME);
  try {
    root.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) {}
  return root;
}

/**
 * ==============================================================================
 * HANDLER GET (doGet)
 * ==============================================================================
 */
function doGet(e) {
  try {
    const params = e ? e.parameter : {};
    const action = params.action || "ping";

    // 1. Health check
    if (action === "ping") {
      return jsonResponse({
        status: "success",
        message: "SIMAGA Google Apps Script Backend Online",
        timestamp: new Date().toISOString()
      });
    }

    // 2. Mengambil Semua Lowongan
    if (action === "getVacancies") {
      const vacancies = sheetToObjects("lowongan");
      const partners = sheetToObjects("mitra_industri");
      const partnerMap = {};
      partners.forEach(p => { partnerMap[p.id_mitra] = p; });

      const enriched = vacancies.map(v => ({
        ...v,
        mitra: partnerMap[v.id_mitra] || null
      }));

      return jsonResponse({ status: "success", data: enriched });
    }

    // 3. Mengambil Data Pendaftaran (Berdasarkan id_user mahasiswa atau id_mitra)
    if (action === "getApplications") {
      const applications = sheetToObjects("pendaftaran");
      const vacancies = sheetToObjects("lowongan");
      const files = sheetToObjects("berkas_persyaratan");
      const users = sheetToObjects("pengguna");
      const mhsList = sheetToObjects("mahasiswa");

      const vacMap = {};
      vacancies.forEach(v => { vacMap[v.id_lowongan] = v; });
      const userMap = {};
      users.forEach(u => { userMap[u.id_user] = u; });
      const mhsMap = {};
      mhsList.forEach(m => { mhsMap[m.id_user] = m; });

      const filesByApp = {};
      files.forEach(f => {
        if (!filesByApp[f.id_pendaftaran]) filesByApp[f.id_pendaftaran] = [];
        filesByApp[f.id_pendaftaran].push(f);
      });

      let filtered = applications;
      if (params.id_user) {
        filtered = filtered.filter(a => a.id_user === params.id_user);
      }
      if (params.id_mitra) {
        filtered = filtered.filter(a => {
          const v = vacMap[a.id_lowongan];
          return v && v.id_mitra === params.id_mitra;
        });
      }

      const result = filtered.map(a => {
        const u = userMap[a.id_user] || {};
        const m = mhsMap[a.id_user] || {};
        return {
          ...a,
          lowongan: vacMap[a.id_lowongan] || null,
          mahasiswa: {
            nama_lengkap: u.nama_lengkap || "-",
            email: u.email || "-",
            nim: m.nim || "-",
            prodi: m.prodi || "-",
            angkatan: m.angkatan || "-"
          },
          berkas: filesByApp[a.id_pendaftaran] || []
        };
      });

      return jsonResponse({ status: "success", data: result });
    }

    // 4. Mengambil Kuesioner Tracer Study
    if (action === "getTracer") {
      const questionnaires = sheetToObjects("kuesioner");
      const alumni = sheetToObjects("alumni");
      const users = sheetToObjects("pengguna");

      const almMap = {};
      alumni.forEach(al => { almMap[al.nim] = al; });
      const userMap = {};
      users.forEach(u => { userMap[u.id_user] = u; });

      if (params.nim) {
        const found = questionnaires.find(q => q.nim === params.nim);
        return jsonResponse({ status: "success", data: found || null });
      }

      // Daftar untuk Admin Verifikasi
      const enriched = questionnaires.map(q => {
        const al = almMap[q.nim] || {};
        const u = userMap[al.id_user] || {};
        let parsedJawaban = {};
        try { parsedJawaban = JSON.parse(q.data_jawaban); } catch(err){}
        return {
          ...q,
          data_jawaban_parsed: parsedJawaban,
          alumni: {
            nim: q.nim,
            nama_lengkap: u.nama_lengkap || "-",
            prodi: al.prodi || "-",
            tahun_lulus: al.tahun_lulus || "-"
          }
        };
      });

      return jsonResponse({ status: "success", data: enriched });
    }

    // 5. Mengambil Statistik IKU 1 & Dasbor Analitik Admin
    if (action === "getAdminDashboard") {
      const questionnaires = sheetToObjects("kuesioner");
      const alumni = sheetToObjects("alumni");

      const prodiFilter = params.prodi || "all";
      const tahunFilter = params.tahun_lulus || "all";

      const almMap = {};
      alumni.forEach(al => { almMap[al.nim] = al; });

      let relevantAlumni = alumni;
      if (prodiFilter !== "all") {
        relevantAlumni = relevantAlumni.filter(a => a.prodi === prodiFilter);
      }
      if (tahunFilter !== "all") {
        relevantAlumni = relevantAlumni.filter(a => String(a.tahun_lulus) === String(tahunFilter));
      }

      const totalTargetAlumni = relevantAlumni.length;
      const targetNimSet = new Set(relevantAlumni.map(a => a.nim));

      // Responden yang mengisi
      const respondents = questionnaires.filter(q => targetNimSet.has(q.nim) && !q.is_draft);
      const totalResponden = respondents.length;
      const tervalidasiList = respondents.filter(q => q.status_validasi === "tervalidasi");
      const totalTervalidasi = tervalidasiList.length;

      const responseRate = totalTargetAlumni > 0 
        ? Math.round((totalResponden / totalTargetAlumni) * 100) 
        : 0;

      // Hitung Rata-rata Masa Tunggu Kerja & IKU 1 (dari data tervalidasi)
      let sumMasaTunggu = 0;
      let countMasaTunggu = 0;
      let countBekerjaLayak = 0;
      let countWirausaha = 0;
      let countStudiLanjut = 0;
      let countMencariKerja = 0;

      tervalidasiList.forEach(r => {
        let j = {};
        try { j = JSON.parse(r.data_jawaban); } catch(e){}

        if (r.status_karir === "Bekerja") {
          countBekerjaLayak++;
          if (j.masa_tunggu !== undefined && j.masa_tunggu !== null && j.masa_tunggu !== "") {
            sumMasaTunggu += Number(j.masa_tunggu);
            countMasaTunggu++;
          }
        } else if (r.status_karir === "Wirausaha") {
          countWirausaha++;
        } else if (r.status_karir === "Melanjutkan Studi") {
          countStudiLanjut++;
        } else {
          countMencariKerja++;
        }
      });

      const avgMasaTunggu = countMasaTunggu > 0 
        ? (sumMasaTunggu / countMasaTunggu).toFixed(1) 
        : "0.0";

      // Capaian IKU 1 = (Lulusan Bekerja Layak + Wirausaha + Lanjut Studi) / Total Responden Tervalidasi
      const totalBerhasil = countBekerjaLayak + countWirausaha + countStudiLanjut;
      const capaianIKU1 = totalTervalidasi > 0 
        ? Math.round((totalBerhasil / totalTervalidasi) * 100) 
        : 0;

      return jsonResponse({
        status: "success",
        data: {
          metrics: {
            totalTargetAlumni,
            totalResponden,
            totalTervalidasi,
            responseRate,
            avgMasaTunggu,
            capaianIKU1
          },
          distribution: {
            bekerja: countBekerjaLayak,
            wirausaha: countWirausaha,
            studiLanjut: countStudiLanjut,
            mencariKerja: countMencariKerja
          }
        }
      });
    }

    // 6. Mengambil Notifikasi Pengguna
    if (action === "getNotifications") {
      const notifs = sheetToObjects("notifikasi");
      const userNotifs = params.id_user 
        ? notifs.filter(n => n.id_user === params.id_user)
        : notifs;
      return jsonResponse({ status: "success", data: userNotifs });
    }

    // 7. Mengambil Seluruh Pengguna (Admin UC-16 / Manajemen Pengguna)
    if (action === "getUsers") {
      const users = sheetToObjects("pengguna");
      const mahasiswa = sheetToObjects("mahasiswa");
      const alumni = sheetToObjects("alumni");
      const admin = sheetToObjects("admin");
      const mitra = sheetToObjects("mitra_industri");

      const mhsMap = {}; mahasiswa.forEach(m => { mhsMap[m.id_user] = m; });
      const almMap = {}; alumni.forEach(a => { almMap[a.id_user] = a; });
      const admMap = {}; admin.forEach(ad => { admMap[ad.id_user] = ad; });
      const minMap = {}; mitra.forEach(mt => { minMap[mt.id_user] = mt; });

      const seen = new Set();
      const enrichedUsers = [];

      users.forEach(u => {
        if (!u.id_user || seen.has(u.id_user)) return;
        seen.add(u.id_user);

        let profile = {};
        if (u.role === "Mahasiswa") profile = mhsMap[u.id_user] || {};
        else if (u.role === "Alumni") profile = almMap[u.id_user] || {};
        else if (u.role === "MitraIndustri") profile = minMap[u.id_user] || {};
        else if (u.role === "Admin") profile = admMap[u.id_user] || {};

        enrichedUsers.push({ ...u, profile });
      });

      return jsonResponse({ status: "success", data: enrichedUsers });
    }

    return jsonResponse({ status: "error", message: "Action tidak dikenali." });

  } catch (error) {
    Logger.log("doGet Error: " + error.toString());
    return jsonResponse({ status: "error", message: error.toString() });
  }
}

/**
 * ==============================================================================
 * HANDLER POST (doPost)
 * ==============================================================================
 */
function doPost(e) {
  try {
    let payload = {};
    if (e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      payload = e.parameter;
    }

    const action = payload.action;

    // 1. AUTENTIKASI PENGGUNA (UC-16)
    if (action === "login") {
      const identifier = (payload.identifier || "").trim().toLowerCase();
      const password = (payload.password || "").trim();

      const users = sheetToObjects("pengguna");
      const mahasiswa = sheetToObjects("mahasiswa");
      const alumni = sheetToObjects("alumni");
      const admin = sheetToObjects("admin");
      const mitra = sheetToObjects("mitra_industri");

      // Cari user berdasarkan email, username, atau NIM
      let matchedUser = users.find(u => {
        if (u.email && u.email.toLowerCase() === identifier) return true;
        if (u.id_user && u.id_user.toLowerCase() === identifier) return true;
        return false;
      });

      // Cek apakah identifier adalah NIM
      if (!matchedUser) {
        const m = mahasiswa.find(mhs => mhs.nim === identifier);
        if (m) matchedUser = users.find(u => u.id_user === m.id_user);
      }
      if (!matchedUser) {
        const al = alumni.find(a => a.nim === identifier);
        if (al) matchedUser = users.find(u => u.id_user === al.id_user);
      }

      if (!matchedUser) {
        return jsonResponse({ status: "error", message: "Kombinasi surel/NIM dan kata sandi salah." });
      }

      if (matchedUser.password_hash !== password) {
        return jsonResponse({ status: "error", message: "Kombinasi surel/NIM dan kata sandi salah." });
      }

      if (matchedUser.status_akun !== "aktif") {
        return jsonResponse({ status: "error", message: "Akun Anda sedang dinonaktifkan, hubungi unit Career Center." });
      }

      // Ambil detail profil berdasarkan role
      let profile = {};
      if (matchedUser.role === "Mahasiswa") {
        profile = mahasiswa.find(m => m.id_user === matchedUser.id_user) || {};
      } else if (matchedUser.role === "Alumni") {
        profile = alumni.find(a => a.id_user === matchedUser.id_user) || {};
      } else if (matchedUser.role === "Admin") {
        profile = admin.find(ad => ad.id_user === matchedUser.id_user) || {};
      } else if (matchedUser.role === "MitraIndustri") {
        profile = mitra.find(mt => mt.id_user === matchedUser.id_user) || {};
      }

      return jsonResponse({
        status: "success",
        message: "Login berhasil",
        data: {
          user: {
            id_user: matchedUser.id_user,
            email: matchedUser.email,
            nama_lengkap: matchedUser.nama_lengkap,
            role: matchedUser.role,
            status_akun: matchedUser.status_akun
          },
          profile: profile
        }
      });
    }

    // 2. PENGAJUAN LOWONGAN MITRA (PC-01, UC-01)
    if (action === "createVacancy") {
      const sheet = getSheet("lowongan");
      const mitraSheet = sheetToObjects("mitra_industri");
      const mitra = mitraSheet.find(m => m.id_user === payload.id_user || m.id_mitra === payload.id_mitra);

      if (!mitra || mitra.status_kemitraan !== "aktif") {
        return jsonResponse({ status: "error", message: "Kemitraan tidak aktif atau tidak ditemukan." });
      }

      // Validasi Tanggal
      const today = new Date();
      today.setHours(0,0,0,0);
      const deadline = new Date(payload.batas_pendaftaran);
      const startDate = new Date(payload.periode_mulai);
      const endDate = new Date(payload.periode_selesai);

      if (deadline < today) {
        return jsonResponse({ status: "error", message: "Tanggal tenggat pendaftaran harus lebih besar dari hari ini." });
      }
      if (endDate < startDate) {
        return jsonResponse({ status: "error", message: "Periode selesai harus lebih besar atau sama dengan periode mulai." });
      }

      const id_lowongan = "LOW-" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd-HHmmss");
      const newRow = [
        id_lowongan,
        mitra.id_mitra,
        "", // id_admin kosong sampai dikurasi
        payload.judul_posisi,
        payload.jenis_kesempatan || "Magang Bersertifikat",
        payload.deskripsi,
        payload.kualifikasi,
        payload.lokasi,
        payload.periode_mulai,
        payload.periode_selesai,
        Number(payload.kuota) || 1,
        payload.batas_pendaftaran,
        "menunggu",
        ""
      ];

      sheet.appendRow(newRow);

      // Notifikasi ke Admin
      pushNotification("USR-004", "kurasi_lowongan", "Pengajuan Lowongan Baru", 
        `Mitra ${mitra.nama_perusahaan} mengajukan lowongan baru: ${payload.judul_posisi}. Silakan lakukan kurasi.`);

      return jsonResponse({
        status: "success",
        message: "Pengajuan lowongan berhasil dikirim dan menunggu verifikasi Admin.",
        data: { id_lowongan: id_lowongan, status_publikasi: "menunggu" }
      });
    }

    // 3. KURASI LOWONGAN OLEH ADMIN (PC-08, UC-11)
    if (action === "curateVacancy") {
      const sheet = getSheet("lowongan");
      const rows = sheet.getDataRange().getValues();
      const id_lowongan = payload.id_lowongan;
      const status = payload.status; // 'aktif' atau 'ditolak'
      const catatan = payload.catatan_revisi || "";
      const id_admin = payload.id_admin || "ADM-001";

      if (status === "ditolak" && !catatan.trim()) {
        return jsonResponse({ status: "error", message: "Alasan penolakan wajib diisi pada kolom catatan revisi." });
      }

      let foundIndex = -1;
      let targetRow = null;
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === id_lowongan) {
          foundIndex = i + 1;
          targetRow = rows[i];
          break;
        }
      }

      if (foundIndex === -1) {
        return jsonResponse({ status: "error", message: "Lowongan tidak ditemukan." });
      }

      // Update kolom id_admin (col 3), status_publikasi (col 13), catatan_revisi (col 14)
      sheet.getRange(foundIndex, 3).setValue(id_admin);
      sheet.getRange(foundIndex, 13).setValue(status);
      sheet.getRange(foundIndex, 14).setValue(catatan);

      // Kirim Notifikasi ke Mitra
      const mitraList = sheetToObjects("mitra_industri");
      const mitra = mitraList.find(m => m.id_mitra === targetRow[1]);
      if (mitra) {
        const notifTitle = status === "aktif" ? "Lowongan Disetujui" : "Lowongan Perlu Revisi";
        const notifMsg = status === "aktif"
          ? `Lowongan '${targetRow[3]}' telah diverifikasi dan resmi dipublikasikan di katalog SIMAGA.`
          : `Pengajuan lowongan '${targetRow[3]}' ditolak dengan catatan: ${catatan}`;
        pushNotification(mitra.id_user, "kurasi_lowongan", notifTitle, notifMsg);
      }

      return jsonResponse({
        status: "success",
        message: `Status lowongan berhasil diperbarui menjadi ${status}.`,
        data: { id_lowongan, status_publikasi: status }
      });
    }

    // 4. PENDAFTARAN MAGANG & UNGGAH BERKAS KE GOOGLE DRIVE (PC-03, PC-09, UC-04, UC-05)
    if (action === "submitApplication") {
      const pendaftaranSheet = getSheet("pendaftaran");
      const berkasSheet = getSheet("berkas_persyaratan");
      const existingApps = sheetToObjects("pendaftaran");

      const id_lowongan = payload.id_lowongan;
      const id_user = payload.id_user;

      // Cek apakah mahasiswa sudah mendaftar pada lowongan ini
      const alreadyApplied = existingApps.some(a => a.id_lowongan === id_lowongan && a.id_user === id_user);
      if (alreadyApplied) {
        return jsonResponse({ status: "error", message: "Anda sudah pernah mendaftar pada lowongan ini." });
      }

      // Validasi kelengkapan 3 berkas (CV, Transkrip, Surat Rekomendasi)
      const files = payload.files || []; // Array: [{ jenis: 'CV', filename: 'cv.pdf', base64: '...', size_kb: 400 }]
      const requiredTypes = ["CV", "Transkrip", "Surat Rekomendasi"];
      const uploadedTypes = files.map(f => f.jenis);
      const isComplete = requiredTypes.every(t => uploadedTypes.includes(t));

      if (!isComplete) {
        return jsonResponse({ status: "error", message: "Wajib mengunggah 3 berkas: CV, Transkrip Nilai, dan Surat Rekomendasi Fakultas." });
      }

      // Validasi ekstensi & ukuran berkas (<= 5MB = 5120 KB)
      for (let f of files) {
        if (!f.filename.toLowerCase().endsWith(".pdf")) {
          return jsonResponse({ status: "error", message: `Berkas ${f.jenis} (${f.filename}) harus berformat .pdf.` });
        }
        if (f.size_kb > 5120) {
          return jsonResponse({ status: "error", message: `Ukuran berkas ${f.jenis} melebihi batas maksimal 5 MB.` });
        }
      }

      const id_pendaftaran = "REG-" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd-HHmmss");

      // Buat Subfolder Khusus di Google Drive: SIMAGA_Storage/Pendaftaran_{id_pendaftaran}/
      const rootFolder = getOrCreateRootFolder();
      const subFolderName = "Pendaftaran_" + id_pendaftaran;
      const appFolder = rootFolder.createFolder(subFolderName);
      try {
        appFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch(e){}

      // Simpan Tiap Berkas ke Google Drive
      const uploadedResults = [];
      const nowStr = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd HH:mm:ss");

      for (let i = 0; i < files.length; i++) {
        const fileData = files[i];
        let bytes;
        if (fileData.base64) {
          const cleanBase64 = fileData.base64.replace(/^data:application\/pdf;base64,/, "");
          bytes = Utilities.base64Decode(cleanBase64);
        } else {
          bytes = Utilities.newBlob("Dummy PDF Content for " + fileData.jenis, "application/pdf").getBytes();
        }

        const blob = Utilities.newBlob(bytes, "application/pdf", fileData.filename);
        const driveFile = appFolder.createFile(blob);
        try {
          driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        } catch(e){}

        const driveUrl = driveFile.getUrl();
        const driveId = driveFile.getId();
        const id_berkas = "BRK-" + id_pendaftaran + "-" + (i + 1);

        berkasSheet.appendRow([
          id_berkas,
          id_pendaftaran,
          fileData.jenis,
          fileData.filename,
          fileData.size_kb || 500,
          driveId,
          driveUrl,
          nowStr
        ]);

        uploadedResults.push({
          id_berkas,
          jenis: fileData.jenis,
          drive_url: driveUrl,
          drive_file_id: driveId
        });
      }

      // Tulis Baris Baru ke Sheet Pendaftaran
      pendaftaranSheet.appendRow([
        id_pendaftaran,
        id_lowongan,
        id_user,
        "berkas_terkirim",
        "Lamaran telah diterima oleh sistem dan sedang dalam antrean pemeriksaan berkas oleh mitra industri.",
        nowStr
      ]);

      // Notifikasi ke Mahasiswa
      pushNotification(id_user, "pendaftaran", "Pendaftaran Berhasil Dikirim", 
        `Pendaftaran Anda untuk posisi magang telah berhasil dikirim dengan ID ${id_pendaftaran}. Berkas tersimpan di Google Drive.`);

      return jsonResponse({
        status: "success",
        message: "Pendaftaran dan 3 berkas PDF berhasil diunggah ke Google Drive.",
        data: {
          id_pendaftaran: id_pendaftaran,
          status_seleksi: "berkas_terkirim",
          uploaded_files: uploadedResults
        }
      });
    }

    // 5. UPDATE TAHAPAN SELEKSI OLEH MITRA (PC-09, UC-02)
    if (action === "updateSelectionStatus") {
      const sheet = getSheet("pendaftaran");
      const rows = sheet.getDataRange().getValues();
      const id_pendaftaran = payload.id_pendaftaran;
      const newStatus = payload.status_seleksi; // 'pemeriksaan_berkas', 'wawancara', 'diterima', 'ditolak'
      const catatan = payload.catatan_seleksi || "";

      let targetRowIndex = -1;
      let appRow = null;
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === id_pendaftaran) {
          targetRowIndex = i + 1;
          appRow = rows[i];
          break;
        }
      }

      if (targetRowIndex === -1) {
        return jsonResponse({ status: "error", message: "Data pendaftaran tidak ditemukan." });
      }

      sheet.getRange(targetRowIndex, 4).setValue(newStatus);
      sheet.getRange(targetRowIndex, 5).setValue(catatan);

      // Kirim Notifikasi ke Mahasiswa
      const id_user_pelamar = appRow[2];
      const statusLabels = {
        pemeriksaan_berkas: "Pemeriksaan Berkas",
        wawancara: "Tahap Wawancara",
        diterima: "Diterima Magang",
        ditolak: "Belum Berhasil"
      };
      pushNotification(id_user_pelamar, "status_seleksi", "Pembaruan Status Seleksi Magang", 
        `Status lamaran Anda diperbarui menjadi: ${statusLabels[newStatus] || newStatus}. Catatan mitra: ${catatan}`);

      return jsonResponse({
        status: "success",
        message: "Status seleksi berhasil diperbarui.",
        data: { id_pendaftaran, status_seleksi: newStatus }
      });
    }

    // 6. SIMPAN DRAF TRACER STUDY (PC-04, UC-08)
    if (action === "saveTracerDraft") {
      const sheet = getSheet("kuesioner");
      const rows = sheet.getDataRange().getValues();
      const nim = payload.nim;
      const dataJawaban = JSON.stringify(payload.data_jawaban || {});
      const statusKarir = payload.status_karir || "";
      const nowStr = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd HH:mm:ss");

      let existingIndex = -1;
      let existingRef = "";
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][1] === nim) {
          existingIndex = i + 1;
          existingRef = rows[i][9];
          break;
        }
      }

      if (existingIndex !== -1) {
        // Update Draf yang sudah ada
        sheet.getRange(existingIndex, 5).setValue(statusKarir);
        sheet.getRange(existingIndex, 6).setValue(dataJawaban);
        sheet.getRange(existingIndex, 7).setValue(true); // is_draft = true
      } else {
        // Buat Baris Baru
        const id_kuesioner = "TRC-" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd-HHmmss");
        sheet.appendRow([
          id_kuesioner,
          nim,
          "",
          2026,
          statusKarir,
          dataJawaban,
          true, // is_draft
          "menunggu",
          false,
          "", // nomor_referensi kosong saat draf
          nowStr
        ]);
      }

      return jsonResponse({
        status: "success",
        message: "Draf isian berhasil disimpan secara aman."
      });
    }

    // 7. KIRIM FINAL TRACER STUDY (PC-05, UC-07)
    if (action === "submitTracerSurvey") {
      const sheet = getSheet("kuesioner");
      const alumniSheet = getSheet("alumni");
      const rows = sheet.getDataRange().getValues();
      const nim = payload.nim;
      const statusKarir = payload.status_karir;
      const dataJawaban = payload.data_jawaban || {};

      // Validasi Kolom Wajib
      if (!statusKarir) {
        return jsonResponse({ status: "error", message: "Status kondisi karier saat ini wajib dipilih." });
      }

      // Deteksi Anomali Otomatis
      let isAnomali = false;
      const nominalGaji = Number(dataJawaban.gaji_nominal) || 0;
      const masaTunggu = Number(dataJawaban.masa_tunggu);

      if (nominalGaji > 50000000 || nominalGaji < 0) {
        isAnomali = true;
      }
      if (masaTunggu < 0 || masaTunggu > 60) {
        isAnomali = true;
      }

      const nowStr = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd HH:mm:ss");

      // Generate Nomor Referensi Unik: SIMAGA/TS/2026/XXXX
      const refCount = rows.length;
      const refNumber = "SIMAGA/TS/2026/" + ("0000" + refCount).slice(-4);

      let existingIndex = -1;
      let id_kuesioner = "TRC-" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd-HHmmss");

      for (let i = 1; i < rows.length; i++) {
        if (rows[i][1] === nim) {
          existingIndex = i + 1;
          id_kuesioner = rows[i][0];
          break;
        }
      }

      if (existingIndex !== -1) {
        sheet.getRange(existingIndex, 5).setValue(statusKarir);
        sheet.getRange(existingIndex, 6).setValue(JSON.stringify(dataJawaban));
        sheet.getRange(existingIndex, 7).setValue(false); // is_draft = false
        sheet.getRange(existingIndex, 8).setValue("menunggu"); // status_validasi
        sheet.getRange(existingIndex, 9).setValue(isAnomali);
        sheet.getRange(existingIndex, 10).setValue(refNumber);
        sheet.getRange(existingIndex, 11).setValue(nowStr);
      } else {
        sheet.appendRow([
          id_kuesioner,
          nim,
          "",
          2026,
          statusKarir,
          JSON.stringify(dataJawaban),
          false,
          "menunggu",
          isAnomali,
          refNumber,
          nowStr
        ]);
      }

      // Update status_pengisian di sheet alumni menjadi 'Telah Mengisi'
      const almRows = alumniSheet.getDataRange().getValues();
      for (let j = 1; j < almRows.length; j++) {
        if (almRows[j][0] === nim) {
          alumniSheet.getRange(j + 1, 5).setValue("Telah Mengisi");
          break;
        }
      }

      return jsonResponse({
        status: "success",
        message: "Kuesioner Tracer Study berhasil dikirim.",
        data: {
          id_kuesioner,
          nomor_referensi: refNumber,
          is_anomali: isAnomali,
          status_pengisian: "Telah Mengisi"
        }
      });
    }

    // 8. VALIDASI RESPONDEN TRACER STUDY OLEH ADMIN (PC-07, UC-13)
    if (action === "validateRespondent") {
      const sheet = getSheet("kuesioner");
      const rows = sheet.getDataRange().getValues();
      const id_kuesioner = payload.id_kuesioner;
      const status = payload.status; // 'tervalidasi' atau 'perlu_klarifikasi'
      const catatan = payload.catatan || "";
      const id_admin = payload.id_admin || "ADM-001";

      if (status === "perlu_klarifikasi" && !catatan.trim()) {
        return jsonResponse({ status: "error", message: "Catatan wajib diisi saat memilih status Perlu Klarifikasi." });
      }

      let targetIndex = -1;
      let targetRow = null;
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === id_kuesioner) {
          targetIndex = i + 1;
          targetRow = rows[i];
          break;
        }
      }

      if (targetIndex === -1) {
        return jsonResponse({ status: "error", message: "Data kuesioner tidak ditemukan." });
      }

      sheet.getRange(targetIndex, 3).setValue(id_admin);
      sheet.getRange(targetIndex, 8).setValue(status);

      // Jika perlu klarifikasi, kirim notifikasi/email ke alumni
      const nim = targetRow[1];
      const almList = sheetToObjects("alumni");
      const al = almList.find(a => a.nim === nim);
      if (al) {
        const notifTitle = status === "tervalidasi" ? "Tracer Study Disahkan" : "Klarifikasi Kuesioner Tracer Study";
        const notifMsg = status === "tervalidasi"
          ? "Pengisian kuesioner Anda telah tervalidasi oleh Admin Career Center."
          : `Mohon klarifikasi pengisian data tracer study Anda. Catatan admin: ${catatan}`;
        pushNotification(al.id_user, "tracer_study", notifTitle, notifMsg);
      }

      return jsonResponse({
        status: "success",
        message: `Status responden berhasil diperbarui menjadi '${status}'.`,
        data: { id_kuesioner, status_validasi: status }
      });
    }

    // 9. PENGIRIMAN SUREL PENGINGAT MASSAL (UC-14)
    // REVISI: HANYA ALUMNI YANG BELUM MENGISI KUESIONER, CEGAH DUPLIKAT NOTIFIKASI
    if (action === "sendMassReminder") {
      const alumni = sheetToObjects("alumni");
      const users = sheetToObjects("pengguna");
      const existingNotifs = sheetToObjects("notifikasi");
      const userMap = {};
      users.forEach(u => { userMap[u.id_user] = u; });

      const prodiFilter = payload.filter_prodi || "all";
      const tahunFilter = payload.filter_tahun || "all";
      const todayDate = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");

      // Strictly target only alumni with status_pengisian === 'Belum Mengisi'
      let targets = alumni.filter(a => {
        if (a.status_pengisian !== "Belum Mengisi") return false;
        const u = userMap[a.id_user];
        return u && u.role === "Alumni";
      });

      if (prodiFilter !== "all") {
        targets = targets.filter(a => a.prodi === prodiFilter);
      }
      if (tahunFilter !== "all") {
        targets = targets.filter(a => String(a.tahun_lulus) === String(tahunFilter));
      }

      if (targets.length === 0) {
        return jsonResponse({
          status: "success",
          message: "Seluruh alumni pada kelompok ini telah mengisi kuesioner.",
          count: 0
        });
      }

      let sentCount = 0;
      targets.forEach(t => {
        const u = userMap[t.id_user];
        if (u && u.role === "Alumni") {
          // Cegah double notifikasi: cek apakah notifikasi pengingat sudah dikirim hari ini
          const alreadySent = existingNotifs.some(n => 
            n.id_user === u.id_user && 
            n.jenis === "tracer_study" && 
            String(n.judul).indexOf("Pengingat") !== -1 &&
            String(n.tanggal_kirim).indexOf(todayDate) !== -1
          );

          if (!alreadySent) {
            pushNotification(u.id_user, "tracer_study", "Pengingat Pengisian Tracer Study FILKOM UB",
              `Halo ${u.nama_lengkap}, mohon luangkan waktu 5 menit untuk melengkapi Kuesioner Tracer Study demi akreditasi dan evaluasi IKU 1 FILKOM UB.`);
            sentCount++;
          }

          // Kirim email via MailApp jika email valid
          try {
            MailApp.sendEmail({
              to: u.email,
              subject: "[SIMAGA FILKOM UB] Pengingat Pengisian Tracer Study",
              body: `Yth. ${u.nama_lengkap},\n\nKami mengingatkan Anda untuk mengisi kuesioner Tracer Study FILKOM UB melalui portal SIMAGA.\n\nSalam,\nUnit Career & Internship FILKOM UB`
            });
          } catch(err) {
            Logger.log("Email dispatch skipped/failed: " + err.message);
          }
        }
      });

      // Catat di sheet riwayat_pengingat
      const reminderSheet = getSheet("riwayat_pengingat");
      const id_pengingat = "RMD-" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd-HHmmss");
      const nowStr = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd HH:mm:ss");
      const filterLabel = `${prodiFilter === 'all' ? 'Semua Prodi' : prodiFilter} (${tahunFilter === 'all' ? 'Semua Angkatan' : tahunFilter})`;

      reminderSheet.appendRow([
        id_pengingat,
        payload.id_admin || "ADM-001",
        filterLabel,
        targets.length,
        nowStr
      ]);

      return jsonResponse({
        status: "success",
        message: `Surel pengingat berhasil dikirimkan kepada ${targets.length} alumni.`,
        data: { id_pengingat, jumlah_penerima: targets.length }
      });
    }

    // 10. TAMBAH PENGGUNA BARU (MANAJEMEN PENGGUNA OLEH ADMIN)
    if (action === "createUser") {
      const penggunaSheet = getSheet("pengguna");
      const users = sheetToObjects("pengguna");
      
      const newId = "USR-" + ("000" + (users.length + 1)).slice(-3) + "-" + Utilities.formatDate(new Date(), "GMT+7", "mmss");
      const newUser = {
        id_user: newId,
        email: payload.email,
        password_hash: payload.password || "ub123456",
        nama_lengkap: payload.nama_lengkap,
        role: payload.role,
        status_akun: payload.status_akun || "aktif"
      };

      penggunaSheet.appendRow([
        newUser.id_user,
        newUser.email,
        newUser.password_hash,
        newUser.nama_lengkap,
        newUser.role,
        newUser.status_akun
      ]);

      let profile = {};
      if (payload.role === "Mahasiswa") {
        const mhsSheet = getSheet("mahasiswa");
        profile = {
          nim: payload.nim || ("255150" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMddHHmmss").slice(-8)),
          id_user: newId,
          prodi: payload.prodi || "Sistem Informasi",
          angkatan: Number(payload.angkatan) || 2025
        };
        mhsSheet.appendRow([profile.nim, profile.id_user, profile.prodi, profile.angkatan]);
      } else if (payload.role === "Alumni") {
        const almSheet = getSheet("alumni");
        profile = {
          nim: payload.nim || ("215150" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMddHHmmss").slice(-8)),
          id_user: newId,
          prodi: payload.prodi || "Sistem Informasi",
          tahun_lulus: Number(payload.tahun_lulus) || 2025,
          status_pengisian: "Belum Mengisi"
        };
        almSheet.appendRow([profile.nim, profile.id_user, profile.prodi, profile.tahun_lulus, profile.status_pengisian]);
      } else if (payload.role === "MitraIndustri") {
        const minSheet = getSheet("mitra_industri");
        profile = {
          id_mitra: "MTR-" + Utilities.formatDate(new Date(), "GMT+7", "mmss"),
          id_user: newId,
          nama_perusahaan: payload.nama_perusahaan || payload.nama_lengkap,
          alamat: payload.alamat || "Malang, Jawa Timur",
          kontak_person: payload.kontak_person || payload.nama_lengkap,
          no_telepon: payload.no_telepon || "08123456789",
          status_kemitraan: "aktif"
        };
        minSheet.appendRow([profile.id_mitra, profile.id_user, profile.nama_perusahaan, profile.alamat, profile.kontak_person, profile.no_telepon, profile.status_kemitraan]);
      } else if (payload.role === "Admin") {
        const admSheet = getSheet("admin");
        profile = {
          id_admin: "ADM-" + Utilities.formatDate(new Date(), "GMT+7", "mmss"),
          id_user: newId,
          unit_kerja: payload.unit_kerja || "Career & Internship"
        };
        admSheet.appendRow([profile.id_admin, profile.id_user, profile.unit_kerja]);
      }

      return jsonResponse({
        status: "success",
        message: "Pengguna baru berhasil ditambahkan dan disimpan ke Google Sheets.",
        data: { user: newUser, profile }
      });
    }

    // 11. EDIT PENGGUNA (UPDATE USER)
    if (action === "updateUser") {
      const penggunaSheet = getSheet("pengguna");
      const rows = penggunaSheet.getDataRange().getValues();
      const id_user = payload.id_user;

      let foundIndex = -1;
      let userRole = "";
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === id_user) {
          foundIndex = i + 1;
          userRole = rows[i][4];
          break;
        }
      }

      if (foundIndex === -1) {
        return jsonResponse({ status: "error", message: "Pengguna tidak ditemukan di Google Sheets." });
      }

      if (payload.nama_lengkap) penggunaSheet.getRange(foundIndex, 4).setValue(payload.nama_lengkap);
      if (payload.email) penggunaSheet.getRange(foundIndex, 2).setValue(payload.email);
      if (payload.password) penggunaSheet.getRange(foundIndex, 3).setValue(payload.password);
      if (payload.status_akun) penggunaSheet.getRange(foundIndex, 6).setValue(payload.status_akun);

      // Update role specific table
      if (userRole === "Mahasiswa") {
        const mSheet = getSheet("mahasiswa");
        const mRows = mSheet.getDataRange().getValues();
        for (let j = 1; j < mRows.length; j++) {
          if (mRows[j][1] === id_user) {
            if (payload.nim) mSheet.getRange(j + 1, 1).setValue(payload.nim);
            if (payload.prodi) mSheet.getRange(j + 1, 3).setValue(payload.prodi);
            if (payload.angkatan) mSheet.getRange(j + 1, 4).setValue(Number(payload.angkatan));
            break;
          }
        }
      } else if (userRole === "Alumni") {
        const aSheet = getSheet("alumni");
        const aRows = aSheet.getDataRange().getValues();
        for (let j = 1; j < aRows.length; j++) {
          if (aRows[j][1] === id_user) {
            if (payload.nim) aSheet.getRange(j + 1, 1).setValue(payload.nim);
            if (payload.prodi) aSheet.getRange(j + 1, 3).setValue(payload.prodi);
            if (payload.tahun_lulus) aSheet.getRange(j + 1, 4).setValue(Number(payload.tahun_lulus));
            break;
          }
        }
      } else if (userRole === "MitraIndustri") {
        const minSheet = getSheet("mitra_industri");
        const minRows = minSheet.getDataRange().getValues();
        for (let j = 1; j < minRows.length; j++) {
          if (minRows[j][1] === id_user) {
            if (payload.nama_perusahaan) minSheet.getRange(j + 1, 3).setValue(payload.nama_perusahaan);
            if (payload.alamat) minSheet.getRange(j + 1, 4).setValue(payload.alamat);
            if (payload.kontak_person) minSheet.getRange(j + 1, 5).setValue(payload.kontak_person);
            if (payload.no_telepon) minSheet.getRange(j + 1, 6).setValue(payload.no_telepon);
            break;
          }
        }
      } else if (userRole === "Admin") {
        const admSheet = getSheet("admin");
        const admRows = admSheet.getDataRange().getValues();
        for (let j = 1; j < admRows.length; j++) {
          if (admRows[j][1] === id_user) {
            if (payload.unit_kerja) admSheet.getRange(j + 1, 3).setValue(payload.unit_kerja);
            break;
          }
        }
      }

      return jsonResponse({ status: "success", message: "Data pengguna berhasil diperbarui di Google Sheets." });
    }

    // 12. HAPUS PENGGUNA (DELETE USER)
    if (action === "deleteUser") {
      const penggunaSheet = getSheet("pengguna");
      const rows = penggunaSheet.getDataRange().getValues();
      const id_user = payload.id_user;

      let foundIndex = -1;
      let userRole = "";
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === id_user) {
          foundIndex = i + 1;
          userRole = rows[i][4];
          break;
        }
      }

      if (foundIndex === -1) {
        return jsonResponse({ status: "error", message: "Pengguna tidak ditemukan." });
      }

      penggunaSheet.deleteRow(foundIndex);

      // Hapus dari tabel role
      if (userRole === "Mahasiswa") {
        const mSheet = getSheet("mahasiswa");
        const mRows = mSheet.getDataRange().getValues();
        for (let j = 1; j < mRows.length; j++) {
          if (mRows[j][1] === id_user) { mSheet.deleteRow(j + 1); break; }
        }
      } else if (userRole === "Alumni") {
        const aSheet = getSheet("alumni");
        const aRows = aSheet.getDataRange().getValues();
        for (let j = 1; j < aRows.length; j++) {
          if (aRows[j][1] === id_user) { aSheet.deleteRow(j + 1); break; }
        }
      } else if (userRole === "MitraIndustri") {
        const minSheet = getSheet("mitra_industri");
        const minRows = minSheet.getDataRange().getValues();
        for (let j = 1; j < minRows.length; j++) {
          if (minRows[j][1] === id_user) { minSheet.deleteRow(j + 1); break; }
        }
      } else if (userRole === "Admin") {
        const admSheet = getSheet("admin");
        const admRows = admSheet.getDataRange().getValues();
        for (let j = 1; j < admRows.length; j++) {
          if (admRows[j][1] === id_user) { admSheet.deleteRow(j + 1); break; }
        }
      }

      return jsonResponse({ status: "success", message: "Pengguna berhasil dihapus dari Google Sheets." });
    }

    // 13. EDIT LOWONGAN MITRA (UPDATE VACANCY)
    if (action === "updateVacancy") {
      const sheet = getSheet("lowongan");
      const rows = sheet.getDataRange().getValues();
      const id_lowongan = payload.id_lowongan;

      let targetIndex = -1;
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === id_lowongan) {
          targetIndex = i + 1;
          break;
        }
      }

      if (targetIndex === -1) {
        return jsonResponse({ status: "error", message: "Lowongan tidak ditemukan di Google Sheets." });
      }

      if (payload.judul_posisi) sheet.getRange(targetIndex, 4).setValue(payload.judul_posisi);
      if (payload.jenis_kesempatan) sheet.getRange(targetIndex, 5).setValue(payload.jenis_kesempatan);
      if (payload.deskripsi) sheet.getRange(targetIndex, 6).setValue(payload.deskripsi);
      if (payload.kualifikasi) sheet.getRange(targetIndex, 7).setValue(payload.kualifikasi);
      if (payload.lokasi) sheet.getRange(targetIndex, 8).setValue(payload.lokasi);
      if (payload.periode_mulai) sheet.getRange(targetIndex, 9).setValue(payload.periode_mulai);
      if (payload.periode_selesai) sheet.getRange(targetIndex, 10).setValue(payload.periode_selesai);
      if (payload.kuota !== undefined) sheet.getRange(targetIndex, 11).setValue(Number(payload.kuota));
      if (payload.batas_pendaftaran) sheet.getRange(targetIndex, 12).setValue(payload.batas_pendaftaran);

      return jsonResponse({ status: "success", message: "Lowongan berhasil diperbarui di Google Sheets." });
    }

    // 14. HAPUS LOWONGAN MITRA (DELETE VACANCY)
    if (action === "deleteVacancy") {
      const sheet = getSheet("lowongan");
      const rows = sheet.getDataRange().getValues();
      const id_lowongan = payload.id_lowongan;

      let targetIndex = -1;
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === id_lowongan) {
          targetIndex = i + 1;
          break;
        }
      }

      if (targetIndex === -1) {
        return jsonResponse({ status: "error", message: "Lowongan tidak ditemukan." });
      }

      sheet.deleteRow(targetIndex);
      return jsonResponse({ status: "success", message: "Lowongan berhasil dihapus dari Google Sheets." });
    }

    return jsonResponse({ status: "error", message: "Action tidak dikenali." });

  } catch (error) {
    Logger.log("doPost Error: " + error.toString());
    return jsonResponse({ status: "error", message: error.toString() });
  }
}

/**
 * Helper: Menambahkan Notifikasi ke Sheet 'notifikasi'
 */
function pushNotification(id_user, jenis, judul, pesan) {
  try {
    const sheet = getSheet("notifikasi");
    const id_notifikasi = "NTF-" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd-HHmmss") + "-" + Math.floor(Math.random() * 1000);
    const nowStr = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd HH:mm:ss");
    sheet.appendRow([
      id_notifikasi,
      id_user,
      jenis,
      judul,
      pesan,
      false, // is_dibaca
      nowStr
    ]);
  } catch(e) {
    Logger.log("Error pushNotification: " + e.message);
  }
}
