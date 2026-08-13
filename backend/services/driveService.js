const { google } = require('googleapis');
const stream = require('stream');

const serviceEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const privateKey = process.env.GOOGLE_PRIVATE_KEY;
const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

const isConfigured = !!(
  serviceEmail && 
  privateKey && 
  folderId &&
  !serviceEmail.includes('dummy') &&
  !privateKey.includes('dummy') &&
  !folderId.includes('dummy')
);

let driveClient = null;

if (isConfigured) {
  try {
    let cleanKey = privateKey;
    if (cleanKey.startsWith('"') && cleanKey.endsWith('"')) {
      cleanKey = cleanKey.substring(1, cleanKey.length - 1);
    }
    const auth = new google.auth.JWT(
      serviceEmail,
      null,
      cleanKey.replace(/\\n/g, '\n'),
      ['https://www.googleapis.com/auth/drive']
    );
    driveClient = google.drive({ version: 'v3', auth });
    console.log('Google Drive service initialized successfully.');
  } catch (error) {
    console.error('Google Drive auth initialization failed:', error.message);
  }
} else {
  console.warn('WARNING: Google Drive API is not configured. Upload tasks will fall back to local disk.');
}

/**
 * Upload screenshot buffer to Google Drive folder
 * @param {string} fileName 
 * @param {Buffer} buffer 
 * @returns {Promise<string>} Direct display URL of the file
 */
const uploadToDrive = async (fileName, buffer) => {
  if (!isConfigured || !driveClient) {
    throw new Error('Google Drive API is not configured.');
  }

  const bufferStream = new stream.PassThrough();
  bufferStream.end(buffer);

  const fileMetadata = {
    name: fileName,
    parents: [folderId],
  };

  const media = {
    mimeType: 'image/jpeg',
    body: bufferStream,
  };

  const response = await driveClient.files.create({
    resource: fileMetadata,
    media: media,
    fields: 'id, webViewLink',
  });

  const fileId = response.data.id;

  // Make the file publicly viewable so the admin dashboard/sheets can load it
  try {
    await driveClient.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });
  } catch (permError) {
    console.warn('[DRIVE WARNING] Could not share file publicly:', permError.message);
  }

  // Return direct image render URL
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
};

module.exports = {
  uploadToDrive,
  isConfigured: !!(isConfigured && driveClient),
};
