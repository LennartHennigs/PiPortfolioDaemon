
///////////////////////////////////////////////////////////////////////////////

const path = require('path');
const fs = require('fs');

const config = require('../config');
const { receiveFile } = require('../utils');

/**
 * Sends the homepage as a response.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
const getHomePage = (req, res) => {
  res.sendFile(config.homepage);
};

/**
 * Serves static files (html, css, js) requested by the client.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
const serveStaticFiles = (req, res) => {
  const filePath = path.join(config.webserverPath, req.path);
  res.sendFile(filePath);
};

/**
 * Handles the download of a file from the server.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
const downloadFile = (req, res) => {
  const fileName = req.params.filename;
  console.log(`download ${fileName}`);
  // get the file from the portfolio and send it
  if(receiveFile(fileName)) {
    const filePath = path.join(__dirname, fileName);
    res.download(filePath, fileName, (err) => {
      if (err) {
        res.status(500).send(`Error downloading the file: ${fileName}`);
        console.log(err);
      } else {
        console.log('download ok');
        try {
          fs.unlinkSync(filePath);
        } catch (error) {
          console.error('Error during deletion:', error.message);
        }
      }
    });
  }
};

///////////////////////////////////////////////////////////////////////////////
module.exports = { getHomePage, serveStaticFiles, downloadFile };
///////////////////////////////////////////////////////////////////////////////
