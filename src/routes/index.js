
const express = require('express');
const multer  = require('multer');
const config = require('../config');
const { getHomePage, serveStaticFiles, downloadFile, uploadFile } = require('../controllers');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, config.sharedFolder)
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
});

const upload = multer({ storage: storage });
const router = express.Router();

router.get('/', getHomePage);
router.get('*.(html|css|js|png)', serveStaticFiles);
router.get('/download/:filename', downloadFile);
router.post('/upload', upload.single('filesToUpload'), uploadFile);

module.exports = router;
