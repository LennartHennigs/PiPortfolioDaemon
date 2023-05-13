const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const config = require('../config');
const { sendToWebsite } = require('../websockets');

/**
 * Sets up a daemon to watch for added files in the shared folder and
 * transfers them to the specified drive.
 */
function setupDaemon() {
    const watcher = chokidar.watch(config.sharedFolder, {
        ignored: /(^|[\/\\])\../,
        persistent: true,
        awaitWriteFinish: true
    });
    watcher.on('add', async (fn, stats) => {
        const fileName = path.basename(fn);
        const str = `- ${fileName} `;
        sendToWebsite(str);
        process.stdout.write(str);
        try {
            const res = await transferFile(fn) ? '\u{2705}' : '\u{274c}';
            console.log(res);
            sendToWebsite(res + '\n');
            process.stdout.write(config.BEEP);
        } catch (error) {
            console.error(`Error during transfer or deletion: ${error.message}`);
        }
    });
}

/**
 * Transfers the specified file to the configured drive and removes the file
 * from the shared folder after transfer.
 *
 * @param {string} fn - The file path to transfer.
 * @returns {boolean} - True if the transfer was successful, false otherwise.
 */
const transferFile = (fn) => {
    let success = false;
    try {
        if (!fs.existsSync(fn)) {
            console.error(`File does not exist: ${fn}`);
            return false;
        }
        const action = config.transferCommand.replace('<file>', fn).replace('<drive>', config.drive);
        execSync(action, { stdio: ['ignore', 'pipe', 'ignore'] });
        fs.unlinkSync(fn);
        success = true;
    } catch (error) {
        console.error(error.message.includes('exist') ? `File does not exist: ${fn}` : error.message);
    }
    return success;
}

///////////////////////////////////////////////////////////////////////////////
module.exports = { setupDaemon };
///////////////////////////////////////////////////////////////////////////////
