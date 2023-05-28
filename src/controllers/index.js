
///////////////////////////////////////////////////////////////////////////////

const path = require('path');
const fs = require('fs');

const config = require('../config');
const { receiveFileFromPortfolio } = require('../utils');
const { sendToActivityLog, sendDirList, sendPortfolioError } = require('../websockets');

const multer  = require('multer');
const upload = multer({ dest: config.sharedFolder });

///////////////////////////////////////////////////////////////////////////////
/**
 * Sends the homepage as a response.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
const getHomePage = (req, res) => {
  res.sendFile(config.homepage);
};

///////////////////////////////////////////////////////////////////////////////
/**
 * Serves static files (html, css, js) requested by the client.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
const serveStaticFiles = (req, res) => {
  const filePath = path.join(config.webserverFolder, req.path);
  res.sendFile(filePath);
};

///////////////////////////////////////////////////////////////////////////////
/**
 * Handles the download of a file from the server.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
const downloadFile = (req, res) => {
  const fileName = req.params.filename;
  process.stdout.write(`- downloading ${fileName} from Portfolio `);
  
  if (receiveFileFromPortfolio(fileName)) {
    const filePath = path.join('./', fileName);
    sendToActivityLog(`\u{2b07} ${fileName} `);
    
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send(`Error downloading the file: ${fileName}`);
      }
      
      try {
        fs.unlinkSync(filePath);
        sendToActivityLog('\u{2705}\n');
        console.log('\u{2705}');
      } catch (error) {
        console.error('Error during deletion:', error.message);
        sendToActivityLog('\u{274c}\n');
        console.log('\u{274c}');
      }
    });
  } else {
    sendPortfolioError();
  }
};

///////////////////////////////////////////////////////////////////////////////

const uploadFile = (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).send('No file uploaded.');
  }
  res.redirect('/');
};

///////////////////////////////////////////////////////////////////////////////
module.exports = { getHomePage, serveStaticFiles, downloadFile, uploadFile };
///////////////////////////////////////////////////////////////////////////////
