
///////////////////////////////////////////////////////////////////////////////
/*
    watches a directory and upload its content to the Atari Portfolio
    ...and deletes them afterwards

    Node JS Script - LH 05/2023

    Prerequisites
    - need a Portfolio running in server mode (for now, to get the initial dir list)

    Features
    - watches on SAMBA upload folder & reports uploads
    - moves the files to target folder
    - communicates successful transfer/error on HTML 
    - select the folder on the Portfolio
    - lists the current folder content (to make more robust, check if Portfolio is not there)
    - click on file will download it
    
    Todo; 
    - make the drive & folder handling better
    - i need to refresh the list after upload?
    - ? can i get all the folders on the Portfolio somehow?
*/
///////////////////////////////////////////////////////////////////////////////

const path = require('path');
const os = require('os');
const fs = require('fs');
const express = require('express');
const WebSocket = require('ws');
const chokidar = require('chokidar');
const { execSync } = require('child_process');
const ifaces = require('os').networkInterfaces();


///////////////////////////////////////////////////////////////////////////////

const config = {
    appPort: 3000,
    wsPort: 40510,
    webserverPath: path.join(process.cwd(), 'public'),
    homepage: path.join(process.cwd(), 'public', 'rpf.html'),
    sharedFolder: path.join(process.cwd(), 'upload'),
    // !!! TODO: be better w/ *.*
    listCommand: './rpfolio2 -l <drive>*.*',
    receiveCommand: './rpfolio2 -r -f <drive><file> .',
    transferCommand: './rpfolio2 -f -t <file> <drive>',
    ID: 'Portfolio Folder Daemon',
    VERSION: 'v0.9 - LH 05/2023',
    BEEP: '\u0007',
};


///////////////////////////////////////////////////////////////////////////////

const app = express();
// use drive parameter, or default to c:
const args = process.argv.slice(2);
let drive = (args[0] === undefined) ? 'c:' : args[0];
let clients = [];

console.log();
console.log(`${config.ID} ${config.VERSION}`);
console.log(`-> ${drive}\n`);

// !!! console.log(config);
console.log('Getting dir contents...');
let dirContent = getDirListFromPortfolio();
console.log();

setupWebserver();
setupWebSockets();
setupDaemon();

///////////////////////////////////////////////////////////////////////////////
// defines routes for home page, JS, CSS, and for downloading files
function setupWebserver() {
    // set the default route to the home page
    app.get('/', (req, res) => {
        res.sendFile(config.homepage);
    });

    // set the MIME type for HTML, CSS, and JavaScript files
    app.get('*.(html|css|js)', function (req, res) {
        const filePath = path.join(config.webserverPath, req.path);
        res.sendFile(filePath);
    });

    // download file from Portfolio locally, trigger download on HTML page, delete the file locally
    app.get('/download/:filename', function (req, res) {
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
    });

    // start the web server
    app.listen(3000, () => {
       const address = getIP();
        console.log("Webserver running");
       console.log(`http://${address}:${config.appPort}`);
       console.log();
    });
}

///////////////////////////////////////////////////////////////////////////////
// connects to websocket

function setupWebSockets() {
    const wsServer = new WebSocket.Server({ port: config.wsPort });

    wsServer.on('connection', (ws) => {
        ws.binaryType = 'arraybuffer';
        clients.push(ws);
        console.log(`client connected: ${clients.length}`);

        ws.on('message', (event) => {
            const message = JSON.parse(event);
            let reply;
            switch (message.command) {
                case 'page_loaded':
                    console.log("- Page was loaded");
                    sendSetFolder(drive + '\\');
                    sendDirList();
                    break;
                case 'set_folder':
                    // Handle the 'set_folder' command here
                    console.log(`set folder ${message.folder}`)
                    drive = message.folder;
                    dirContent = getDirListFromPortfolio();
                    sendDirList();
                    break;
                default:
                    console.log('Unknown command:', message.command);
            }
        });

        ws.on('close', () => {
            clients = clients.filter(client => client !== ws);
            console.log(`client disconnected: ${clients.length}`);
        });
    });
}

///////////////////////////////////////////////////////////////////////////////
// sets up daemon to watch folder and triggers upload
function setupDaemon() {
    const watcher = chokidar.watch(config.sharedFolder, {
        ignored: /(^|[\/\\])\../,
        persistent: true,
        awaitWriteFinish: true
    });
    watcher.on('add', (fn, stats) => {
        const fileName = path.basename(fn);
        const str = `- ${fileName} `;
        sendToWebsite(str);
        process.stdout.write(str);
        const res = transferFile(fn) ? '\u{2705}' : '\u{274c}';
        console.log(res);
        sendToWebsite(res + '\n');
        process.stdout.write(config.BEEP);
    });
}

///////////////////////////////////////////////////////////////////////////////
// sends the current file name to the HTML page
function sendToWebsite(data) {
    const message = {
        command: 'log',
        data: data
    };
    clients.forEach(item => item.send(JSON.stringify(message)));
}

///////////////////////////////////////////////////////////////////////////////
// gets the (WIFI) IP address from the Pi Zero
function getIP() {
    let address;
    for (const dev in ifaces) {
        if (dev.startsWith('wlan')) {
                const iface = ifaces[dev].find(details => details.family === 'IPv4' && !details.internal);
            if (iface) {
                address = iface.address;
                break;
            }
        }
    }
    return address;
}

///////////////////////////////////////////////////////////////////////////////
// runs 
function getDirListFromPortfolio() {
    const action = config.listCommand.replace('<drive>', drive);
    try {
        const res = execSync(action, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().split('\n').filter(Boolean).slice(2);
        return res;
    } catch (error) {
        console.error('Error getting dir list:', error.message);
    }
}

///////////////////////////////////////////////////////////////////////////////
// sends the folder content to the HTML page
function sendDirList() {
    const message = {
        command: 'dir',
        files: dirContent
    };
    clients.forEach(client => client.send(JSON.stringify(message)));
}

///////////////////////////////////////////////////////////////////////////////
// send the new folder name to the HTML page
function sendSetFolder(folder) {
    const message = {
        command: 'set_folder',
        folder: folder
    };
    clients.forEach(client => client.send(JSON.stringify(message)));
}

///////////////////////////////////////////////////////////////////////////////
// gets file from shared folder and tries to send it the 
function transferFile(fn) {
    if (!fs.existsSync(fn)) {
        console.error('File does not exist:', fn);
        return false;
    }
    try {
        const action = config.transferCommand.replace('<file>', fn).replace('<drive>', drive);
        execSync(action, { stdio: ['ignore', 'pipe', 'ignore'] });
    } catch (error) {
        console.error('Error during transfer:', error.message);
        return false;
    }
    try {
        fs.unlinkSync(fn);
    } catch (error) {
        console.error('Error during deletion:', error.message);
        return false;
    }
    return true;
}

///////////////////////////////////////////////////////////////////////////////
// gets from from Portfolio and stores it locally

function receiveFile(fn) {
    try {
        const action = config.receiveCommand.replace('<file>', fn).replace('<drive>', drive);
        execSync(action, { stdio: ['ignore', 'pipe', 'ignore'] });
    } catch (error) {
        console.error('Error during transfer:', error.message);
        return false;
    }
    return true;
}


///////////////////////////////////////////////////////////////////////////////