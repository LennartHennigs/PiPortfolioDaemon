
const express = require('express');
const { getHomePage, serveStaticFiles, downloadFile } = require('../controllers');

const router = express.Router();

router.get('/', getHomePage);
router.get('*.(html|css|js|png)', serveStaticFiles);
router.get('/download/:filename', downloadFile);

module.exports = router;
