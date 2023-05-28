const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const config = require('../config');
const { sendToWebsite, sendToActivityLog, sendDirList } = require('../websockets');

/**
 * Sets up a daemon to watch for added files in the shared folder and
 * transfers them to the specified drive.
 */
function setupDaemon() {
    chokidar.watch(config.sharedFolder, {
        ignored: /(^|[\/\\])\../,
        persistent: true,
        awaitWriteFinish: true
    }).on('add', async (filePath) => {
        const fileName = path.basename(filePath);
        sendToActivityLog(`\u{2b06} ${fileName} `);
        process.stdout.write(`- uploading ${fileName} to Portfolio `);

        try {
            await transferFile(filePath);
            console.log(`\u{2705}`);
            sendToActivityLog(`\u{2705}\n`);
        } catch (error) {
            console.log(`\u{274c}`);
            sendToActivityLog(`\u{274c}\n`);
        }
        process.stdout.write(config.BEEP);
        sendDirList();
    });
}

/**
 * Transfers the specified file to the configured drive and removes the file
 * from the shared folder after transfer.
 *
 * @param {string} fn - The file path to transfer.
 * @returns {boolean} - True if the transfer was successful, false otherwise.
 */
const transferFile = (filePath) => {
    try {
        if (!fs.existsSync(filePath)) {
            throw new Error(`File does not exist: ${filePath}`);
        }
        const action = config.transferCommand.replace('<file>', filePath).replace('<drive>', config.portfolioPath);
        execSync(action, { stdio: ['ignore', 'pipe', 'ignore'] });
        fs.unlinkSync(filePath);
        return true;
    } catch (error) {
        console.error(error.message.includes('exist') ? `File does not exist: ${filePath}` : '');
        return false;
    }
}

///////////////////////////////////////////////////////////////////////////////
module.exports = { setupDaemon };
///////////////////////////////////////////////////////////////////////////////
