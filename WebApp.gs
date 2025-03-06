function doGet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sitesSheet = ss.getSheetByName('Sites');
  var headers = sitesSheet.getRange(1, 1, 1, sitesSheet.getLastColumn()).getValues()[0];
  
  // Debug line to see what headers are present
  Logger.log('Headers found: ' + JSON.stringify(headers));
  
  // More robust way to find the site name column
  var siteNameCol = headers.findIndex(header => 
    header.toString().toLowerCase().replace(/\s+/g, '') === 'sitename'
  ) + 1;
  
  // Debug line to verify column was found
  Logger.log('Site Name Column Index: ' + siteNameCol);
  
  if (siteNameCol === 0) {
    throw new Error('Site Name column not found in headers');
  }
  
  var lastRow = sitesSheet.getLastRow();
  var siteNames = sitesSheet.getRange(2, siteNameCol, lastRow - 1, 1)
    .getValues()
    .flat()
    .filter(String)
    .sort();
    
  var template = HtmlService.createTemplateFromFile('Index');
  template.siteNames = siteNames;
  
  var htmlOutput = template.evaluate();
  htmlOutput.setTitle('Stipend Check Tracker')
    .setFaviconUrl('https://drive.google.com/uc?export=view&id=1dZmyY3TcYDa8GFRL7BkDhwoTJXZ_aQZG&format=png')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  
  return htmlOutput;
}

function submitCheck(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var allChecksSheet = ss.getSheetByName('All Checks');
  var sitesSheet = ss.getSheetByName('Sites');
  
  // Get all sites data to do the lookup
  var sitesData = sitesSheet.getDataRange().getValues();
  var headers = sitesData[0];
  
  // Find column indexes for Sites sheet
  var siteNameCol = headers.indexOf('Site Name');
  var bankAccountCol = headers.indexOf('Bank Account');
  
  // Find the bank account for the selected site
  var bankAccount = '';
  for (var i = 1; i < sitesData.length; i++) {
    if (sitesData[i][siteNameCol] === data.siteName) {
      bankAccount = sitesData[i][bankAccountCol];
      break;
    }
  }
  
  var rowData = [
    data.checkNumber,
    data.firstName,
    data.lastName,
    data.checkDate,
    data.amount,
    data.subjectId,
    data.studyName,
    data.siteName,
    data.isSubI ? 'Yes' : 'No',
    data.isReferral ? 'Yes' : 'No',
    Session.getActiveUser().getEmail(),
    bankAccount
  ];
  
  allChecksSheet.appendRow(rowData);
   if (data.action === 'continue') {
    return (parseInt(data.checkNumber) + 1).toString().padStart(data.checkNumber.length, '0');
  }
  return null;
}

function verifyCheck(checkNumber) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('All Checks');
  var range = sheet.getDataRange();
  var data = range.getDisplayValues();
  
  // Get column indices from headers
  var headers = data[0];
  var cols = {
    checkNumber: headers.indexOf('Check Number'),
    firstName: headers.indexOf('First Name'),
    lastName: headers.indexOf('Last Name'),
    date: headers.indexOf('Date on Check'),
    amount: headers.indexOf('Amount'),
    subjectId: headers.indexOf('Subject ID'),
    studyName: headers.indexOf('Study Name'),
    siteName: headers.indexOf('Site'),
    isSubI: headers.indexOf('Is Sub-I'),
    isReferral: headers.indexOf('Is Referral'),
    signer: headers.indexOf('Signer'),
    bankAccount: headers.indexOf('Bank Account')
  };

  // Search for all matching checks
  var matches = [];
  for (var i = 1; i < data.length; i++) {
    if (data[i][cols.checkNumber].toString() === checkNumber.toString()) {
      matches.push({
        checkNumber: data[i][cols.checkNumber],
        name: data[i][cols.firstName] + ' ' + data[i][cols.lastName],
        date: data[i][cols.date],
        amount: data[i][cols.amount],
        subjectId: data[i][cols.subjectId],
        studyName: data[i][cols.studyName],
        siteName: data[i][cols.siteName],
        isSubI: data[i][cols.isSubI],
        isReferral: data[i][cols.isReferral],
        bankAccount: data[i][cols.bankAccount]
      });
    }
  }
  
  return matches.length > 0 ? matches : null;
}

// Helper function to get Spreadsheet URL - useful for debugging
function getSpreadsheetUrl() {
  return SpreadsheetApp.getActiveSpreadsheet().getUrl();
}

// Helper function to log headers for debugging
function logHeaders() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sitesSheet = ss.getSheetByName('Sites');
  var headers = sitesSheet.getRange(1, 1, 1, sitesSheet.getLastColumn()).getValues()[0];
  Logger.log('Headers in sheet: ' + JSON.stringify(headers));
  return headers;
}

function sendCheckRequest(site, remaining) {
  const emailAddress = 'mgonczi@delricht.com';
  const subject = 'Stipend Check Request';
  const body = `${site} has requested stipend checks. There are currently ${remaining} checks remaining.`;
  
  MailApp.sendEmail(emailAddress, subject, body);
  return true;
}

function sendHelpRequest(data) {
  const emailAddress = 'mgonczi@delricht.com';
  const subject = 'Stipend Check Tracker Help!';
  const body = `
Site: ${data.site}
Sender: ${data.sender}
Question: ${data.question}
`;
  
  MailApp.sendEmail(emailAddress, subject, body);
  return true;
}
