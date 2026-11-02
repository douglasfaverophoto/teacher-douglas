// Paste this into the "Table Seven – Student Progress" sheet:
// Extensions → Apps Script → replace everything → Save.
// First time: Deploy → New deployment → type: Web app · Execute as: Me · Who has access: Anyone → Deploy → copy the URL.
// Updating (keeps the same URL): Deploy → Manage deployments → pencil icon → Version: New version → Deploy.
//
// Columns in the "Progress" tab: Date · Name · Episode · Title · Event · Story

function doPost(e) {
  var d = JSON.parse(e.postData.contents);
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Progress');
  sheet.appendRow([
    new Date(),
    String(d.name || '').slice(0, 40),
    Number(d.episode) || '',
    String(d.title || '').slice(0, 80),
    String(d.event || '').slice(0, 40),
    String(d.story || '').slice(0, 60)
  ]);
  return ContentService.createTextOutput('ok');
}

// GET ?name=Ana&story=La%20Chiave%20di%20Roma → {"done":[1,2],"bonus":[1]}
// Lets a student get their progress back when their phone/browser forgot it.
function doGet(e) {
  var p = (e && e.parameter) || {};
  var name = norm(p.name), story = norm(p.story);
  var out = { done: [], bonus: [] };
  if (name && story) {
    var rows = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Progress').getDataRange().getValues();
    for (var r = 0; r < rows.length; r++) {
      var row = rows[r];
      if (norm(row[1]) !== name) continue;
      // Older rows have no Story column: the reader stories put "Story · Episode title" in Title,
      // Table Seven rows have a plain title.
      var title = String(row[3] || ''), rowStory = norm(row[5]);
      if (!rowStory) rowStory = title.indexOf(' · ') > -1 ? norm(title.split(' · ')[0]) : 'table seven';
      if (rowStory !== story) continue;
      var ep = Number(row[2]);
      if (!ep) continue;
      var ev = String(row[4]);
      if (ev === 'Finished' && out.done.indexOf(ep) < 0) out.done.push(ep);
      if (ev === 'Bonus correct' && out.bonus.indexOf(ep) < 0) out.bonus.push(ep);
    }
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

function norm(s) { return String(s || '').trim().toLowerCase().replace(/\s+/g, ' '); }
