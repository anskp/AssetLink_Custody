/**
 * Helper to extract files from request files object (multer)
 */
export const extractFiles = (reqFiles) => {
    const files = [];
    if (!reqFiles) return files;

    if (reqFiles.ownershipDocument) {
        files.push({
            fileType: 'OWNERSHIP',
            filePath: reqFiles.ownershipDocument[0].path,
            mimeType: reqFiles.ownershipDocument[0].mimetype
        });
    }
    if (reqFiles.assetImages) {
        reqFiles.assetImages.forEach(img => {
            files.push({
                fileType: 'IMAGE',
                filePath: img.path,
                mimeType: img.mimetype
            });
        });
    }
    if (reqFiles.assetVideo) {
        files.push({
            fileType: 'VIDEO',
            filePath: reqFiles.assetVideo[0].path,
            mimeType: reqFiles.assetVideo[0].mimetype
        });
    }
    return files;
};

export default extractFiles;
