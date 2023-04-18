
///////////////////////////////////////////////////////////////////////////////
/*
    watches a directory and upload its content to the Atari Portfolio
    ...and deletes them afterwards

    Node JS Script - LH 02/2023

    Install: npm install chokidar express ws
*/
///////////////////////////////////////////////////////////////////////////////

const os = require('os');
const fs = require('fs');
const path = require('path');
const express = require('express');
const chokidar = require('chokidar');
const WebSocket = require('ws');
const { execSync } = require('child_process');

///////////////////////////////////////////////////////////////////////////////

const config = {
    appPort: 3000,
    wsPort: 40510,
    homePage: path.join(__dirname, 'public', 'rpf.html'),
    sharedFolder: path.join(__dirname, 'upload'),
    // !!! TODO: be better w/ *.*
    listCommand: 'rpfolio -l <drive>*.*',
    transferCommand: 'rpfolio -f -t <file> <drive>',
    ID: 'Portfolio Folder Daemon',
    VERSION: 'v1.0 - LH 02/2023',
    BEEP: '\u0007',
  };
  
///////////////////////////////////////////////////////////////////////////////

// use drive parameter, or default to c:
const args = process.argv.slice(2);
const drive = (args[0] === undefined) ? 'c:' : args[0];

let clients = [];

console.log();
console.log(`${config.ID} ${config.VERSION}`);
console.log(`-> ${drive}\n`);

setupWebserver();
setupWebSockets();
setupDaemon();

const dir = getDirList();

///////////////////////////////////////////////////////////////////////////////

function setupWebserver() {
    const app = express();
    app.get('/', (req, res) => res.sendFile(config.homePage));
    app.listen(config.appPort, () => {
        const address = getIP();
        console.log('Webserver running');
        console.log(`http://${address}:${config.appPort}`);
        console.log();
    });
}

///////////////////////////////////////////////////////////////////////////////

function setupWebSockets() {
    const ws_server = new WebSocket.Server({ port: config.wsPort });
  
    ws_server.on('connection', ({ binaryType, send, on, close }) => {
      binaryType = 'arraybuffer';
      clients.push({ send, close });
      console.log(`client connected: ${clients.length}`);
      on('open', () => send('ping'));
      on('message', event => console.log(`${event} from client`));
      on('close', () => {
        clients = clients.filter(({ close: clientClose }) => clientClose !== close);
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

function getIP() {
    const ifaces = require('os').networkInterfaces();
    for (const dev in ifaces) {
      const address = ifaces[dev].find(details => details.family === 'IPv4' && !details.internal)?.address;
      if (address) {
        return address;
      }
    }
  }
  
///////////////////////////////////////////////////////////////////////////////

function sendToWebsite(data) {
    clients.forEach(item => item.send(data));
}

///////////////////////////////////////////////////////////////////////////////

function getDirList() {
    const action = config.listCommand.replace('<drive>', drive);
    try {
        const res = execSync(action, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().split('\n').filter(Boolean).slice(2);
        return res;
    } catch (error) {
        console.error('Error getting dir list:', error.message);
    }
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
