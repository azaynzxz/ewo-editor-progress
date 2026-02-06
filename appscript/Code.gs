// Apps Script Backend for Progress Editor Form
// This script receives form data, uploads screenshots to Google Drive, and saves data to Google Sheets

// CONFIGURATION - UPDATE THESE VALUES
const SPREADSHEET_ID = '1Oyh-Xa1SqzxAGzO0fu5zeDII6o1qtA6BkT-RVZtDxCU'; // From requirements.txt
const DRIVE_FOLDER_ID = '1dt75abUTnLrfOA-__0ssvvxqpcvgKvM1'; // Google Drive folder for screenshots

/**
 * Handle POST requests from the frontend form
 */
function doPost(e) {
  try {
    // Parse the incoming JSON data
    const data = JSON.parse(e.postData.contents);
    
    // Upload screenshot to Google Drive if provided
    let screenshotUrl = '';
    if (data.screenshot && data.screenshot.base64) {
      screenshotUrl = uploadScreenshotToDrive(
        data.screenshot.base64,
        data.screenshot.filename || 'screenshot.png',
        data.screenshot.mimeType || 'image/png'
      );
    }
    
    // Save data to spreadsheet
    const rowNumber = saveToSpreadsheet({
      tanggal: data.tanggal,
      editor: data.editor,
      judul: data.judul,
      project: data.project,
      klien: data.klien,
      jumlah_scene: data.jumlah_scene,
      comment: data.comment,
      screenshoot: screenshotUrl
    });
    
    // Return success response
    const response = {
      success: true,
      data: {
        message: 'Data saved successfully',
        rowNumber: rowNumber,
        screenshotUrl: screenshotUrl
      },
      timestamp: new Date().toISOString()
    };
    
    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString());
    Logger.log('Error stack: ' + error.stack);
    
    const errorResponse = {
      success: false,
      data: {
        message: 'Error saving data: ' + error.toString()
      },
      timestamp: new Date().toISOString()
    };
    
    return ContentService
      .createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle GET requests (for testing)
 */
function doGet(e) {
  const response = {
    success: true,
    data: {
      message: 'Progress Editor API is running',
      timestamp: new Date().toISOString()
    }
  };
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Upload screenshot to Google Drive
 */
function uploadScreenshotToDrive(base64Data, filename, mimeType) {
  try {
    // Remove data URL prefix if present (e.g., "data:image/png;base64,")
    const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, '');
    
    // Decode base64 to blob
    const decodedFile = Utilities.base64Decode(base64Content);
    const blob = Utilities.newBlob(decodedFile, mimeType, filename);
    
    // Get the folder
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    
    // Create unique filename with timestamp
    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd_HHmmss');
    const uniqueFilename = `${timestamp}_${filename}`;
    
    // Upload file to Drive
    const file = folder.createFile(blob.setName(uniqueFilename));
    
    // Set file to be viewable by anyone with the link
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // Return the shareable link
    return file.getUrl();
    
  } catch (error) {
    Logger.log('Error uploading to Drive: ' + error.toString());
    throw new Error('Failed to upload screenshot: ' + error.toString());
  }
}

/**
 * Save data to Google Spreadsheet
 */
function saveToSpreadsheet(data) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheets()[0]; // Get first sheet
    
    // Get the next row number (auto-increment)
    const lastRow = sheet.getLastRow();
    const nextRowNumber = lastRow; // Since row 1 is header, lastRow gives us the count
    
    // Prepare row data according to schema: no, tanggal, editor, judul_project, klien, jumlah_scene, comment, screenshoot
    const rowData = [
      nextRowNumber,                           // A: no (auto-increment)
      data.tanggal,                            // B: tanggal
      data.editor,                             // C: editor
      data.judul + ' - ' + data.project,       // D: judul project (combined)
      data.klien,                              // E: klien
      data.jumlah_scene,                       // F: jumlah_scene
      data.comment,                            // G: comment
      data.screenshoot                         // H: screenshoot (Drive URL)
    ];
    
    // Append the row
    sheet.appendRow(rowData);
    
    return nextRowNumber;
    
  } catch (error) {
    Logger.log('Error saving to spreadsheet: ' + error.toString());
    throw new Error('Failed to save to spreadsheet: ' + error.toString());
  }
}
