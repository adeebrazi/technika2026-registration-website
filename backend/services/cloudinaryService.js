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
 * @param {string} [customFolder] Optional folder override
 * @returns {Promise<string>} public URL of the uploaded image
 */
const uploadToCloudinary = (buffer, fileName, customFolder = null) => {
  return new Promise((resolve, reject) => {
    if (!isConfigured) {
      return reject(new Error('Cloudinary is not configured.'));
    }

    const publicId = fileName.replace(/\.[^/.]+$/, ""); // strip extension

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: customFolder || folder,
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

let cachedUsage = null;
let lastUsageFetch = 0;
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes cache

/**
 * Fetch live Cloudinary account usage, storage, bandwidth, and remaining credits
 */
const getUsage = async (forceRefresh = false) => {
  if (!isConfigured) {
    return {
      configured: false,
      message: 'Cloudinary credentials not configured'
    };
  }

  const now = Date.now();
  if (!forceRefresh && cachedUsage && (now - lastUsageFetch < CACHE_TTL_MS)) {
    return cachedUsage;
  }

  try {
    const raw = await cloudinary.api.usage();
    const storageBytes = raw.storage?.usage || 0;
    const storageMB = +(storageBytes / (1024 * 1024)).toFixed(2);
    const storageGB = +(storageBytes / (1024 * 1024 * 1024)).toFixed(3);
    const creditsLimit = raw.credits?.limit || 25;
    const creditsUsed = raw.credits?.usage || 0;
    const creditsRemaining = Math.max(0, +(creditsLimit - creditsUsed).toFixed(2));
    const creditsPercent = raw.credits?.used_percent != null ? raw.credits.used_percent : +((creditsUsed / creditsLimit) * 100).toFixed(1);

    // In Cloudinary free plan: 1 credit = 1 GB managed storage or 1 GB net bandwidth or 1000 transformations.
    const storageLimitBytes = creditsLimit * 1024 * 1024 * 1024;
    const storageRemainingBytes = Math.max(0, storageLimitBytes - storageBytes);
    const storageRemainingGB = +(storageRemainingBytes / (1024 * 1024 * 1024)).toFixed(2);

    const bandwidthBytes = raw.bandwidth?.usage || 0;
    const bandwidthMB = +(bandwidthBytes / (1024 * 1024)).toFixed(2);
    const bandwidthGB = +(bandwidthBytes / (1024 * 1024 * 1024)).toFixed(3);

    cachedUsage = {
      configured: true,
      cloudName: cloudName,
      folder: folder,
      plan: raw.plan || 'Free',
      lastUpdated: raw.last_updated || new Date().toISOString(),
      storage: {
        usedBytes: storageBytes,
        usedMB: storageMB,
        usedGB: storageGB,
        limitGB: creditsLimit,
        remainingBytes: storageRemainingBytes,
        remainingGB: storageRemainingGB,
        usedPercent: +((storageBytes / storageLimitBytes) * 100).toFixed(2)
      },
      credits: {
        limit: creditsLimit,
        used: creditsUsed,
        remaining: creditsRemaining,
        usedPercent: creditsPercent
      },
      bandwidth: {
        usedBytes: bandwidthBytes,
        usedMB: bandwidthMB,
        usedGB: bandwidthGB,
        limitGB: creditsLimit
      },
      transformations: {
        used: raw.transformations?.usage || 0,
        creditsUsage: raw.transformations?.credits_usage || 0
      },
      resourcesCount: raw.resources || raw.objects?.usage || 0,
      apiRateLimit: {
        allowed: raw.rate_limit_allowed,
        remaining: raw.rate_limit_remaining
      }
    };
    lastUsageFetch = now;
    return cachedUsage;
  } catch (err) {
    console.error('[CLOUDINARY USAGE ERROR]:', err.message);
    if (cachedUsage) return cachedUsage;
    return {
      configured: true,
      cloudName: cloudName,
      error: err.message
    };
  }
};

module.exports = {
  uploadToCloudinary,
  isConfigured,
  getUsage
};

