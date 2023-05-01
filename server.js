
///////////////////////////////////////////////////////////////////////////////
/*
    watches a directory and upload its content to the Atari Portfolio
    ...and deletes them afterwards

    Node JS Script - LH 05/2023

    Prerequisites
    - need a Portfolio running in server mode (for now, to get the initial dir list)

    Features
    - watches on upload folder reports uploads
    - communicates successful transfer/error on web 
    - moves the files to target folder (to check)
    - can list the folder content (to make more robust, check if Portfolio is not there)
    
    Todo; 
    - make the drive & folder handling better
    - where do I move the files? selected folder?
    - do i need to refresh the list after upload?
    - ? can i get all the folders on the Portfolio somehow?
    - when the user clicks on a file, get it from the Portfolio and trigger download 
    - make the execs more robust...
    - layout HTML with CSS
    - notify when websocket connection is lost
*/
///////////////////////////////////////////////////////////////////////////////

const path = require('path');
const os = require('os');
const fs = require('fs');
const express = require('express');
const WebSocket = require('ws');
const chokidar = require('chokidar');
const { execSync } = require('child_process');
///////////////////////////////////////////////////////////////////////////////

const config = {
    appPort: 3000,
    wsPort: 40510,
    webserverPath: path.join(process.cwd(), 'public'),
    homepage: path.join(process.cwd(), 'public', 'rpf.html'),
    sharedFolder: path.join(process.cwd(), 'upload'),
    // !!! TODO: be better w/ *.*
    listCommand: './rpfolio2 -l <drive>*.*',
    transferCommand: './rpfolio2 -f -t <file> <drive>',
    ID: 'Portfolio Folder Daemon',
    VERSION: 'v0.9 - LH 05/2023',
    BEEP: '\u0007',
};


///////////////////////////////////////////////////////////////////////////////

// use drive parameter, or default to c:
const args = process.argv.slice(2);
let drive = (args[0] === undefined) ? 'c:' : args[0];
const app = express();

let clients = [];

console.log();
console.log(`${config.ID} ${config.VERSION}`);
console.log(`-> ${drive}\n`);

// needs a portfolio connection
let dirContent = getDirListFromPortfolio();
console.log(dirContent);

setupWebserver();
setupWebSockets();
setupDaemon();

///////////////////////////////////////////////////////////////////////////////

function setupWebserver() {
    // set the default route to the home page

    app.get('/download/:filename', function (req, res) {
        const fileName = req.params.filename;
        console.log(`download ${fileName}`);

// get the file from  the portfolio and send it

        const filePath = path.join(__dirname, 'public', fileName);
        
        fs.stat(filePath, (err, stats) => {
            if (err && err.code === 'ENOENT') {
                res.status(404).send(`File not found: ${fileName}`);
                console.log('404');
            } else if (err) {
                res.status(500).send(`Error checking file: ${fileName}`);
                console.log('500');
            } else if (stats.isFile()) {
                res.download(filePath, fileName);
            } else {
                res.status(404).send(`Not a file: ${fileName}`);
                console.log('404');
            }
        });    
    });

    // set the MIME type for HTML, CSS, and JavaScript files
    app.get('*.(html|css|js)', function (req, res) {
        const filePath = path.join(config.webserverPath, req.path);
        res.sendFile(filePath);
    });

    app.get('/', (req, res) => {
        res.sendFile(path.join(config.webserverPath, 'rpf.html'));
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

function setupWebSockets() {
    const wsServer = new WebSocket.Server({ port: config.wsPort });

    wsServer.on('connection', (ws) => {
        ws.binaryType = 'arraybuffer';
        clients.push(ws);
        console.log(`client connected: ${clients.length}`);

        ws.on('message', (event) => {
            const message = JSON.parse(event);
            let  reply;
            switch (message.command) {
                case 'page_loaded':
                    console.log("- Page was loaded");
                    sendSetFolder(drive + '\\');
                    //sendDirList();
                    reply = {
                        command: 'dir',
                        files: dirContent
                    };
                    clients.forEach(client => client.send(JSON.stringify(reply)));
                    break;
                case 'set_folder':
                    // Handle the 'set_folder' command here
                    console.log(`set folder ${message.folder}`)
                    drive = message.folder;
                    dirContent = getDirListFromPortfolio();
console.log(dirContent);
                    reply = {
                        command: 'dir',
                        files: dirContent
                    };
                    clients.forEach(client => client.send(JSON.stringify(reply)));

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

function sendToWebsite(data) {
    const message = {
        command: 'log',
        data: data
    };
    clients.forEach(item => item.send(JSON.stringify(message)));
}

///////////////////////////////////////////////////////////////////////////////

function getIP() {
    const ifaces = require('os').networkInterfaces();
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

function sendDirList() {
    const dirList = getDirList();
    const message = {
        command: 'dir',
        files: dirList
    };
    clients.forEach(client => client.send(JSON.stringify(message)));
}

///////////////////////////////////////////////////////////////////////////////

function sendSetFolder(folder) {
    const message = {
        command: 'set_folder',
        folder: folder
    };
    clients.forEach(client => client.send(JSON.stringify(message)));
}

///////////////////////////////////////////////////////////////////////////////

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