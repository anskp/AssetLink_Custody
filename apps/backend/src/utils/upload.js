import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure storage directory exists
const storageDir = 'storage/assets';
if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const assetId = req.body.assetId || 'temp';
        const dir = path.join(storageDir, assetId);

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Sub-directories based on file types
        let subDir = 'others';
        if (file.fieldname === 'ownershipDocument') subDir = 'documents';
        else if (file.fieldname === 'assetImages') subDir = 'images';
        else if (file.fieldname === 'assetVideo') subDir = 'video';

        const finalDir = path.join(dir, subDir);
        if (!fs.existsSync(finalDir)) {
            fs.mkdirSync(finalDir, { recursive: true });
        }

        cb(null, finalDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

export const assetUpload = multer({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    }
});

/**
 * Conditional Upload Middleware
 * Only invokes multer if Content-Type is multipart/form-data.
 * This prevents "Unexpected end of form" errors for JSON requests.
 */
export const conditionalUpload = (fields) => {
    const uploadMiddleware = assetUpload.fields(fields);

    return (req, res, next) => {
        const contentType = req.headers['content-type'] || '';
        if (contentType.includes('multipart/form-data')) {
            return uploadMiddleware(req, res, (err) => {
                if (err) {
                    // Enhanced error logging for busboy/multer errors
                    console.error('Multipart upload error:', err);
                    return next(err);
                }
                next();
            });
        }
        // Skip multer for non-multipart requests (like application/json)
        next();
    };
};

export default {
    assetUpload,
    conditionalUpload
};
