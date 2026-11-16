// Solafi agreements → Google Sheet + Drive.
// Lives in the Apps Script project attached to a private "Solafi agreements"
// sheet (Extensions → Apps Script), deployed as a Web app: execute as Me,
// access "Anyone". The site's signing page (/sign/#<token>) reads one row and
// sends the signature back. Client details live only in this sheet and your
// Drive, never in the website's code.
//
// Setup, once:
//   1. Paste this file in, run setup() and allow the permissions it asks for.
//   2. Deploy → New deployment → Web app → Execute as: Me, Access: Anyone.
//   3. Put the /exec URL in src/lib/config.js as agreementEndpoint.
// Each client:
//   1. Fill a row (Package is the id, e.g. 5kva-10kwh; money as plain numbers).
//   2. Select the row → menu Solafi → Make signing link. Send the link.
//   3. When they sign, the row turns "Signed", their files land in Drive under
//      "Solafi agreements", and you get an email.

// Change to the live address once the new site is on main.
const SIGN_PAGE = 'https://neonfila.github.io/solafi/preview/sign/#';
const FOLDER = 'Solafi agreements';
const MAX_FILE = 5 * 1024 * 1024;

// [key the site uses, column heading]
const COLUMNS = [
  ['token', 'Link token'], ['status', 'Status'],
  ['customerName', 'Customer name'], ['phone', 'Phone'], ['address', 'Installation address'],
  ['agreementDate', 'Agreement date'], ['package', 'Package'], ['months', 'Months'],
  ['cashPrice', 'Cash price'], ['deposit', 'Deposit'], ['monthly', 'Monthly'],
  ['bankName', 'Bank name'], ['accountNumber', 'Account number'], ['accountName', 'Account name'],
  ['handoverDate', 'Handover date'], ['inverterSerial', 'Inverter S/N'], ['batterySerial', 'Battery S/N'],
  // filled in when the client signs
  ['signedAt', 'Signed at'], ['signedName', 'Signed name'], ['signedPhone', 'Signed phone'],
  ['idType', 'ID type'], ['idNumber', 'ID number'], ['occupancy', 'Occupancy'], ['landlord', 'Landlord'],
  ['occupation', 'Occupation'], ['kinName', 'Next of kin'], ['kinPhone', 'Next of kin phone'],
  ['folder', 'Files'], ['textHash', 'Text SHA-256'], ['termsVersion', 'Terms version'],
];
// What the signing page is allowed to read back. KYC never leaves the sheet.
const PUBLIC = ['status', 'customerName', 'phone', 'address', 'agreementDate', 'package', 'months',
  'cashPrice', 'deposit', 'monthly', 'bankName', 'accountNumber', 'accountName',
  'handoverDate', 'inverterSerial', 'batterySerial', 'signedAt', 'signedName'];

function setup() {
  const sheet = agreements();
  sheet.getRange(1, 1, 1, COLUMNS.length).setValues([COLUMNS.map((c) => c[1])]).setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.getRange('A:A').setNumberFormat('@');
  sheet.getRange('D:D').setNumberFormat('@'); // keep phone numbers' leading zero
  sheet.getRange('M:M').setNumberFormat('@'); // and account numbers'
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Solafi').addItem('Make signing link', 'makeLink').addToUi();
}

function makeLink() {
  const sheet = agreements();
  const row = sheet.getActiveRange().getRow();
  const ui = SpreadsheetApp.getUi();
  if (row < 2) return ui.alert('Select a client row first.');
  const cell = sheet.getRange(row, col('token'));
  let token = String(cell.getValue());
  if (!token) {
    token = Utilities.getUuid().replace(/-/g, '');
    cell.setValue(token);
    sheet.getRange(row, col('status')).setValue('Ready');
  }
  ui.alert('Signing link', SIGN_PAGE + token, ui.ButtonSet.OK);
}

// GET ?action=agreement&token=… → the client's agreement details.
function doGet(e) {
  const found = findRow(e.parameter.token);
  if (!found) return reply({ ok: false, error: 'not found' });
  const out = {};
  PUBLIC.forEach((k) => (out[k] = show(found.values[col(k) - 1])));
  return reply({ ok: true, agreement: out });
}

// POST {action:'sign', …} → save the signature, files and the text that was signed.
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.action !== 'sign') return reply({ ok: false, error: 'unknown action' });
    const found = findRow(d.token);
    if (!found) return reply({ ok: false, error: 'not found' });
    const sheet = agreements();
    const get = (k) => found.values[col(k) - 1];
    if (get('status') === 'Signed') return reply({ ok: false, error: 'already signed' });
    for (const k of ['fullName', 'phone', 'idNumber', 'occupancy', 'occupation', 'kinName', 'kinPhone']) {
      if (!String(d[k] || '').trim()) return reply({ ok: false, error: 'missing ' + k });
    }

    // the page sends the text it showed and its hash; check they match
    const hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(d.text), Utilities.Charset.UTF_8)
      .map((b) => ('0' + (b & 255).toString(16)).slice(-2)).join('');
    if (hash !== d.textHash) return reply({ ok: false, error: 'text mismatch' });

    const tz = Session.getScriptTimeZone();
    const now = new Date();
    const signedAt = Utilities.formatDate(now, tz, 'd MMMM yyyy, HH:mm');
    const name = clean(d.fullName, 80);

    const folder = rootFolder().createFolder(Utilities.formatDate(now, tz, 'yyyy-MM-dd') + ' ' + name);
    folder.createFile(blobFrom(d.signature.split(',')[1], 'image/png', 'signature.png'));
    [['id', 'id'], ['proof', 'utility-or-tenancy']].forEach(([key, label]) => {
      const f = d.files && d.files[key];
      if (!f) throw new Error('missing ' + key + ' file');
      const ext = (String(f.name).match(/\.[a-z0-9]{2,5}$/i) || [''])[0];
      folder.createFile(blobFrom(f.data, f.type, label + ext));
    });
    folder.createFile('agreement.txt', [
      'Signed by: ' + name,
      'Phone: ' + clean(d.phone, 40),
      'Signed at: ' + signedAt + ' (' + tz + ')',
      'Terms version: ' + clean(d.termsVersion, 20),
      'Text SHA-256: ' + hash,
      'Device: ' + clean(d.userAgent, 300),
      '',
      String(d.text),
    ].join('\n'), MimeType.PLAIN_TEXT);

    const set = (k, v) => sheet.getRange(found.row, col(k)).setValue(v);
    set('status', 'Signed');
    set('signedAt', signedAt);
    set('signedName', name);
    set('signedPhone', text(d.phone));
    ['idType', 'idNumber', 'occupancy', 'landlord', 'occupation', 'kinName', 'kinPhone'].forEach((k) => set(k, text(d[k])));
    set('folder', folder.getUrl());
    set('textHash', hash);
    set('termsVersion', clean(d.termsVersion, 20));

    MailApp.sendEmail(Session.getEffectiveUser().getEmail(), 'Solafi agreement signed: ' + name,
      name + ' signed their agreement on ' + signedAt + '.\n\nFiles: ' + folder.getUrl());
    return reply({ ok: true, signedAt: Utilities.formatDate(now, tz, 'd MMMM yyyy') });
  } catch (err) {
    return reply({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function agreements() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
}

function col(key) {
  return COLUMNS.findIndex((c) => c[0] === key) + 1;
}

function findRow(token) {
  token = String(token || '');
  if (!/^[a-f0-9]{32}$/.test(token)) return null;
  const sheet = agreements();
  const last = sheet.getLastRow();
  if (last < 2) return null;
  const rows = sheet.getRange(2, 1, last - 1, COLUMNS.length).getValues();
  const i = rows.findIndex((r) => String(r[0]) === token);
  return i < 0 ? null : { row: i + 2, values: rows[i] };
}

function rootFolder() {
  const it = DriveApp.getFoldersByName(FOLDER);
  return it.hasNext() ? it.next() : DriveApp.createFolder(FOLDER);
}

function blobFrom(base64, type, name) {
  const bytes = Utilities.base64Decode(String(base64 || ''));
  if (!bytes.length || bytes.length > MAX_FILE) throw new Error('bad file ' + name);
  if (!/^(image\/[a-z+.-]+|application\/pdf)$/.test(type)) throw new Error('file type ' + type);
  return Utilities.newBlob(bytes, type, name);
}

// Dates in the sheet come back as "17 November, 2026", as the agreement writes them.
function show(v) {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'd MMMM, yyyy');
  return v;
}

function clean(v, max) {
  return String(v == null ? '' : v).replace(/[\r\n]+/g, ' ').trim().slice(0, max);
}

// Keep leading zeros and stop a cell being read as a formula.
function text(v) {
  const s = clean(v, 200);
  return /^[=+\-@0]/.test(s) ? "'" + s : s;
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
