const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive'
];

let sheetsClient = null;
let driveClient = null;
let authClient = null;

function getAuth() {
  if (authClient) return authClient;

  const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY || path.join(__dirname, '../credentials.json');
  
  if (fs.existsSync(keyPath)) {
    authClient = new google.auth.GoogleAuth({
      keyFile: keyPath,
      scopes: SCOPES
    });
    return authClient;
  }

  // Cek environment variable berisi JSON string credentials
  if (process.env.GOOGLE_CREDENTIALS_JSON) {
    try {
      const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
      authClient = new google.auth.GoogleAuth({
        credentials,
        scopes: SCOPES
      });
      return authClient;
    } catch (e) {
      console.warn('Gagal mem-parsing GOOGLE_CREDENTIALS_JSON:', e.message);
    }
  }

  return null;
}

function getSheets() {
  if (sheetsClient) return sheetsClient;
  const auth = getAuth();
  if (!auth) return null;
  sheetsClient = google.sheets({ version: 'v4', auth });
  return sheetsClient;
}

function getDrive() {
  if (driveClient) return driveClient;
  const auth = getAuth();
  if (!auth) return null;
  driveClient = google.drive({ version: 'v3', auth });
  return driveClient;
}

module.exports = {
  getAuth,
  getSheets,
  getDrive
};
