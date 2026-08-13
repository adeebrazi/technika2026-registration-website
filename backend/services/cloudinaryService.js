const cloudinary = require('cloudinary').v2;

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
const folder = process.env.CLOUDINARY_FOLDER || 'technika-payment-screenshots';

const isConfigured = !!(
  cloudName && 
  apiKey && 
  apiSecret &&
  !cloudName.includes('dummy') &&
  !apiKey.includes('dummy') &&
  !apiSecret.includes('dummy')
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true
  });
  console.log('Cloudinary service configured successfully.');
} else {
  console.warn('WARNING: Cloudinary is not configured. Upload tasks will fall back to local disk.');
}

/**
 * Upload compressed buffer to Cloudinary
 * @param {Buffer} buffer 
 * @param {string} fileName
 * @returns {Promise<string>} public URL of the uploaded image
 */
const uploadToCloudinary = (buffer, fileName) => {
  return new Promise((resolve, reject) => {
    if (!isConfigured) {
      return reject(new Error('Cloudinary is not configured.'));
    }

    const publicId = fileName.replace(/\.[^/.]+$/, ""); // strip extension

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        public_id: publicId,
        resource_type: 'image'
      },
      (error, result) => {
        if (error) {
          console.error('[CLOUDINARY ERROR] Upload failed:', error.message);
          return reject(error);
        }
        resolve(result.secure_url);
      }
    );

    uploadStream.end(buffer);
  });
};

module.exports = {
  uploadToCloudinary,
  isConfigured
};
