const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'aurea-deco-uploads',
    allowed_formats: ['jpeg', 'jpg', 'png', 'gif', 'webp', 'pdf'],
    resource_type: 'auto',
    transformation: [{ width: 2000, height: 2000, crop: 'limit', fetch_format: 'auto', quality: 'auto:good' }]
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880 }, // 5MB default
});

module.exports = upload;