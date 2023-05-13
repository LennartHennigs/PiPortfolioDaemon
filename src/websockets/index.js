const WebSocket = require('ws');

const config = require('../config');
const { getDirListFromPortfolio } = require('../utils');

let clients = [];

/**
 * Sets up a WebSocket server and handles client connections.
 * @function setupWebSockets
 */
const setupWebSockets = () => {
    const wsServer = new WebSocket.Server({ port: config.wsPort });

    wsServer.on('connection', (ws) => {
        ws.binaryType = 'arraybuffer';
        clients.push(ws);
//        console.log(`- client connected: ${clients.length}`);

        ws.on('message', (event) => {
            const message = JSON.parse(event);
            let reply;
            switch (message.command) {
                case 'page_loaded':
                    console.log("- web page was loaded");
                    sendSetFolder(config.drive + '\\');
                    sendDirList();
                    break;
                case 'set_folder':
                    // Handle the 'set_folder' command here
                    console.log(`- setting Portfolio folder: ${message.folder}`)
                    config.drive = message.folder;
                    config.dirContent = getDirListFromPortfolio();
                    sendDirList();
                    break;
                default:
                    console.log('Unknown command:', message.command);
            }
        });

        ws.on('close', () => {
            clients = clients.filter(client => client !== ws);
//            console.log(`- client disconnected: ${clients.length}`);
        });
    });
};
  
/**
 * Sends the new folder name to the HTML page.
 * @param {string} folder - The folder name to send.
 */
function sendDirList() {
    const newMessage = {
        command: 'dir',
        files: config.dirContent
    };
    clients.forEach(client => client.send(JSON.stringify(newMessage)));
}

/**
 * Sends the new folder name to the HTML page.
 * @param {string} folder - The folder name to send.
 */

function sendSetFolder(folder) {
    const newMessage = {
        command: 'set_folder',
        folder: folder
    };
    clients.forEach(client => client.send(JSON.stringify(newMessage)));
}


/**
 * Sends a message to the connected clients.
 * @param {string} message - The message to send.
 */
const sendToWebsite = (message) => {
    const newMessage = {
        command: 'add_to_log',
        data: message
    };
    clients.forEach(item => item.send(JSON.stringify(newMessage)));
}

///////////////////////////////////////////////////////////////////////////////
module.exports = { setupWebSockets, sendToWebsite };
///////////////////////////////////////////////////////////////////////////////
  