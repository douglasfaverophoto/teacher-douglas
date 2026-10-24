// Paste this into the "Table Seven – Student Progress" sheet:
// Extensions → Apps Script → replace everything → Save → Deploy → New deployment →
// type: Web app · Execute as: Me · Who has access: Anyone → Deploy → copy the Web app URL.

function doPost(e) {
  var d = JSON.parse(e.postData.contents);
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Progress');
  sheet.appendRow([
    new Date(),
    String(d.name || '').slice(0, 40),
    Number(d.episode) || '',
    String(d.title || '').slice(0, 80),
    String(d.event || '').slice(0, 40)
  ]);
  return ContentService.createTextOutput('ok');
}
