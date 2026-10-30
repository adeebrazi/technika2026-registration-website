const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { google } = require('googleapis');

const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
const serviceEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
let privateKey = process.env.GOOGLE_PRIVATE_KEY;

if (privateKey && privateKey.startsWith('"') && privateKey.endsWith('"')) {
  privateKey = privateKey.substring(1, privateKey.length - 1);
}

const auth = new google.auth.JWT(
  serviceEmail,
  null,
  privateKey.replace(/\\n/g, '\n'),
  ['https://www.googleapis.com/auth/spreadsheets']
);
const sheets = google.sheets({ version: 'v4', auth });

(async () => {
  try {
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const regSheet = meta.data.sheets.find(s => s.properties.title === 'Registrations');
    if (!regSheet) {
      throw new Error('Registrations tab not found!');
    }
    const sheetId = regSheet.properties.sheetId;
    console.log(`Target Sheet: "${regSheet.properties.title}" (ID: ${sheetId})`);

    // 1. Fetch current rows
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Registrations!A1:L110'
    });

    const rows = res.data.values || [];
    console.log(`Total rows fetched: ${rows.length}`);
    const headers = rows[0];
    console.log(`Original Headers A to L:`, headers.slice(0, 12));

    const rowsToDeleteIndices = []; // 0-indexed row indices
    const rowsToKeep = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const name = row[1] || '';
      const colK = row[10] || '';
      const isCloudinary = colK.includes('cloudinary.com');

      if (!isCloudinary) {
        rowsToDeleteIndices.push({ index: i, rowNumber: i + 1, name, colK });
      } else {
        rowsToKeep.push({ index: i, rowNumber: i + 1, name, colK });
      }
    }

    console.log(`\nIdentified ${rowsToKeep.length} rows to KEEP (Cloudinary).`);
    console.log(`Identified ${rowsToDeleteIndices.length} rows to DELETE (Drive / Offline-Receipt).`);

    if (rowsToDeleteIndices.length !== 42) {
      console.warn(`Warning: Expected 42 rows to delete, found ${rowsToDeleteIndices.length}`);
    }

    // Group contiguous row deletions into ranges (0-indexed)
    // To delete safely from Google Sheets, delete contiguous blocks in descending order
    rowsToDeleteIndices.sort((a, b) => b.index - a.index); // descending

    const deleteRequests = [];

    // Group adjacent indices
    let currentBlock = null;
    for (const item of rowsToDeleteIndices) {
      if (!currentBlock) {
        currentBlock = { start: item.index, end: item.index + 1 };
      } else if (item.index === currentBlock.start - 1) {
        currentBlock.start = item.index;
      } else {
        deleteRequests.push({
          deleteDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: currentBlock.start,
              endIndex: currentBlock.end
            }
          }
        });
        currentBlock = { start: item.index, end: item.index + 1 };
      }
    }
    if (currentBlock) {
      deleteRequests.push({
        deleteDimension: {
          range: {
            sheetId,
            dimension: 'ROWS',
            startIndex: currentBlock.start,
            endIndex: currentBlock.end
          }
        }
      });
    }

    console.log(`\nCreated ${deleteRequests.length} row delete requests in descending order:`);
    deleteRequests.forEach((req, idx) => {
      const r = req.deleteDimension.range;
      console.log(`  Block ${idx + 1}: 0-indexed [${r.startIndex} to ${r.endIndex}) -> Rows ${r.startIndex + 1} to ${r.endIndex}`);
    });

    // Also add Column L deletion request!
    // Column L is index 11 (A=0, B=1, C=2, D=3, E=4, F=5, G=6, H=7, I=8, J=9, K=10, L=11)
    console.log(`\nAdding Column L deletion request (index 11: "Registered At")...`);
    deleteRequests.push({
      deleteDimension: {
        range: {
          sheetId,
          dimension: 'COLUMNS',
          startIndex: 11,
          endIndex: 12
        }
      }
    });

    // Execute batchUpdate
    console.log(`\nExecuting batchUpdate on Google Sheets API...`);
    const batchRes = await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      resource: {
        requests: deleteRequests
      }
    });

    console.log(`Successfully applied batchUpdate! Response replies count: ${batchRes.data.replies?.length}`);

    // Verify final state
    const verifyRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Registrations!A1:L70'
    });

    const finalRows = verifyRes.data.values || [];
    console.log(`\n=== POST-CLEANUP VERIFICATION ===`);
    console.log(`Total rows remaining: ${finalRows.length} (1 header + ${finalRows.length - 1} data rows)`);
    console.log(`New Header (Row 1):`, finalRows[0].slice(0, 12));
    
    // Check all data rows have Cloudinary in Col K (now index 10)
    let nonCloudinaryCount = 0;
    for (let i = 1; i < finalRows.length; i++) {
      const colK = finalRows[i][10] || '';
      if (!colK.includes('cloudinary.com')) {
        nonCloudinaryCount++;
        console.warn(`Row ${i + 1} does not have cloudinary:`, finalRows[i][1], colK);
      }
    }

    if (nonCloudinaryCount === 0) {
      console.log(`SUCCESS: 100% of remaining ${finalRows.length - 1} rows have Cloudinary screenshot links!`);
    } else {
      console.warn(`Warning: ${nonCloudinaryCount} rows still have non-cloudinary links!`);
    }

  } catch (e) {
    console.error('Error during cleanup:', e.message);
  }
})();

