///////////////////////////////////////////////////////////////////////////////

const config = require('../config');

const { execFileSync } = require('child_process');

///////////////////////////////////////////////////////////////////////////////
/**
 * Runs an rpfolio command template from the config without a shell.
 * The template is split on spaces first and placeholders like <file> and
 * <drive> are filled in afterwards, so each value stays a single argument
 * and is never interpreted as shell syntax.
 * @param {string} template - e.g. 'rpfolio -f -t <file> <drive>'
 * @param {object} values - placeholder values, e.g. { file, drive }
 * @param {object} [options] - extra execFileSync options
 * @returns {Buffer} the command's stdout
 */
const runPortfolioCommand = (template, values, options = {}) => {
    const [cmd, ...args] = template
        .split(' ')
        .filter(Boolean)
        .map(part => part.replace(/<(\w+)>/g, (match, key) => (key in values ? String(values[key]) : match)));
    return execFileSync(cmd, args, { stdio: ['ignore', 'pipe', 'ignore'], ...options });
};

///////////////////////////////////////////////////////////////////////////////

/**
 * Gets the directory list from the Portfolio drive.
 * @returns {Array<string>} An array of strings representing the directory content.
 */

// FYI: rpfolio does not return an error if a folder does not exists...
const getDirListFromPortfolio = () => {
    try {
      const res = runPortfolioCommand(config.listCommand, { drive: config.portfolioPath }, {
        timeout: config.portfolioTimeout
      })
        .toString()
        .split('\n')
        .filter(Boolean)
        .slice(2)
        .sort();
      return res;
    } catch (error) {
      console.error('- Error getting dir list');
      return false;
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
      runPortfolioCommand(config.receiveCommand, { file: fn, drive: config.portfolioPath }, {
        timeout: config.portfolioTimeout
      });
    } catch (error) {
      console.error('- Error during file transfer');
      return false;
    }
    return true;
  };
  
///////////////////////////////////////////////////////////////////////////////
module.exports = { runPortfolioCommand, getDirListFromPortfolio, receiveFileFromPortfolio };
///////////////////////////////////////////////////////////////////////////////
  