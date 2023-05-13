const os = require('os');
const { execSync } = require('child_process');
const config = require('../config');
const ifaces = require('os').networkInterfaces();

/**
 * Retrieves the IP address of the wlan network interface.
 * @returns {string|null} IP address of the wlan interface, or null if not found.
 */

const getIP = () => {
  let address;
  for (const dev in ifaces) {
    if (dev.startsWith('wlan')) {
      const iface = ifaces[dev].find(
        (details) => details.family === 'IPv4' && !details.internal
      );
      if (iface) {
        address = iface.address;
        break;
      }
    }
  }
  return address;
};


/**
 * Gets the directory list from the Portfolio drive.
 * @returns {Array<string>} An array of strings representing the directory content.
 */

const getDirListFromPortfolio = () => {
  const action = config.listCommand.replace('<drive>', config.drive);
  try {
    const res = execSync(action, {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .split('\n')
      .filter(Boolean)
      .slice(2);
    return res;
  } catch (error) {
    console.error('Error getting dir list:', error.message);
  }
};

/**
 * Receives a file from the Portfolio drive and stores it locally.
 * @param {string} fn - The filename to be received.
 * @returns {boolean} True if the file transfer was successful, false otherwise.
 */

const receiveFile = (fn) => {
  try {
    const action = config.receiveCommand
      .replace('<file>', fn)
      .replace('<drive>', config.drive);
    execSync(action, { stdio: ['ignore', 'pipe', 'ignore'] });
  } catch (error) {
    console.error('Error during transfer:', error.message);
    return false;
  }
  return true;
};

///////////////////////////////////////////////////////////////////////////////
module.exports = { getIP, getDirListFromPortfolio, receiveFile };
///////////////////////////////////////////////////////////////////////////////