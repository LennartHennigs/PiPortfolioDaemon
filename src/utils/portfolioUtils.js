///////////////////////////////////////////////////////////////////////////////

const config = require('../config');
const { execSync } = require('child_process');

///////////////////////////////////////////////////////////////////////////////

/**
 * Gets the directory list from the Portfolio drive.
 * @returns {Array<string>} An array of strings representing the directory content.
 */

// FYI: rpfolio does not return an error if a folder does not exists...
const getDirListFromPortfolio = () => {
    const action = config.listCommand.replace('<drive>', config.portfolioPath);
    try {
      const res = execSync(action, {
        stdio: ['ignore', 'pipe', 'ignore'],
      })
        .toString()
        .split('\n')
        .filter(Boolean)
        .slice(2)
        .sort();
      return res;
    } catch (error) {
      console.error('Error getting dir list:', error.message);
    }
  };
  
  ///////////////////////////////////////////////////////////////////////////////
  /**
   * Receives a file from the Portfolio drive and stores it locally.
   * @param {string} fn - The filename to be received.
   * @returns {boolean} True if the file transfer was successful, false otherwise.
   */
  
  const receiveFileFromPortfolio = (fn) => {
    try {
      const action = config.receiveCommand
        .replace('<file>', fn)
        .replace('<drive>', config.portfolioPath);
      execSync(action, { stdio: ['ignore', 'pipe', 'ignore'] });
    } catch (error) {
      console.error('Error during transfer:', error.message);
      return false;
    }
    return true;
  };
  
///////////////////////////////////////////////////////////////////////////////
module.exports = { getDirListFromPortfolio, receiveFileFromPortfolio };
///////////////////////////////////////////////////////////////////////////////
  