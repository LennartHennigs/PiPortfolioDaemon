///////////////////////////////////////////////////////////////////////////////

const config = require('../config');

const os = require('os');
const fs = require('fs');
const ifaces = require('os').networkInterfaces();
const { execSync } = require('child_process');

const portfolioUtils = require('./portfolioUtils');

///////////////////////////////////////////////////////////////////////////////
/**
 * Retrieves the IP address of the wlan, usb  network interface.
 * @returns {string|null} IP address of the wlan interface, or null if not found.
 */

const getIP = () => {
  const ifaces = os.networkInterfaces();
  const types = ['wlan', 'usb'];

  for (let type of types) {
    for (let dev of Object.keys(ifaces)) {
      if (dev.startsWith(type)) {
        const iface = ifaces[dev].find(
          details => details.family === 'IPv4' && !details.internal
        );

        if (iface) return iface.address;
      }
    }
  }
};

///////////////////////////////////////////////////////////////////////////////
/**
 * Checks if a given path exists.
 *
 * @param {string} path - The path to be checked.
 * @returns {boolean} True if the path exists, false otherwise.
 */

function doesPathExists(path) {
  try {
      fs.accessSync(path, fs.constants.F_OK);
      return true;
  } catch (err) {
      return false;
  }
}

///////////////////////////////////////////////////////////////////////////////
/**
 * Checks if a command is available in the system.
 *
 * @param {string} command - The command to be checked.
 * @returns {boolean} True if the command is available, false otherwise.
 */

function isCommandAvailable(command) {
  try {
      execSync(`which ${command}`);
      return true;
  } catch (err) {
      return false;
  }
}

///////////////////////////////////////////////////////////////////////////////
module.exports = { getIP, doesPathExists, isCommandAvailable, ...portfolioUtils };
///////////////////////////////////////////////////////////////////////////////
