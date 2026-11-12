// Solafi waitlist → Google Sheet.
// Lives in the Apps Script project attached to the "Solafi waitlist" sheet
// (Extensions → Apps Script), deployed as a Web app with access "Anyone".
// Each sign-up from the site becomes one row, and the sheet owner gets an email.

const HEADERS = ['When', 'Name', 'Phone', 'Email', 'City', 'For', 'System', 'Pays now / month', 'Solafi / month'];

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.website) return reply({ ok: true }); // hidden field only bots fill in

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.setFrozenRows(1);
    }
    sheet.appendRow([
      new Date(), text(d.name), text(d.phone), text(d.email), text(d.city), text(d.kind),
      text(d.system), Number(d.currentMonthly) || '', Number(d.solafiMonthly) || '',
    ]);

    MailApp.sendEmail(
      Session.getEffectiveUser().getEmail(),
      'New Solafi waitlist sign-up: ' + String(d.name || '').slice(0, 60),
      [
        'Name: ' + (d.name || ''),
        'Phone: ' + (d.phone || ''),
        'Email: ' + (d.email || ''),
        'City: ' + (d.city || ''),
        'For: ' + (d.kind || ''),
        'System: ' + (d.system || ''),
        'Pays now: ' + (d.currentMonthly || '') + ' / month',
        'With Solafi: ' + (d.solafiMonthly || '') + ' / month',
      ].join('\n')
    );
    return reply({ ok: true });
  } catch (err) {
    return reply({ ok: false, error: String(err) });
  }
}

// Keep phone numbers' leading zero and stop a cell being read as a formula.
function text(v) {
  const s = String(v == null ? '' : v).slice(0, 300);
  return /^[=+\-@0]/.test(s) ? "'" + s : s;
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
