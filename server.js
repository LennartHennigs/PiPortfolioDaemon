
///////////////////////////////////////////////////////////////////////////////
/*
    watches a directory and upload its content to the Atari Portfolio
    ...and deletes them afterwards

    Node JS Script - LH 02/2023

    Install: npm install chokidar express ws
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

const appPort = 3000;
const wsPort = 40510;

const homePage = path.join(__dirname, 'public', 'rpf.html');
const sharedFolder = path.join(__dirname, 'upload');

///////////////////////////////////////////////////////////////////////////////

// !!! TODO: be better w/ *.*
const listCommand = 'rpfolio -l <drive>*.*';
const transferCommand = 'rpfolio -f -t <file> <drive>';

const ID = 'Portfolio Folder Daemon';
const VERSION = 'v1.0 - LH 02/20    23';
const BEEP = '\007';

///////////////////////////////////////////////////////////////////////////////

// use drive parameter, or default to c:
const args = process.argv.slice(2);
const drive = (args[0] === undefined) ? 'c:' : args[0];

let clients = [];


console.log();
console.log(`${ID} ${VERSION}`);
console.log(`-> ${drive}\n`);

setupWebserver();
setupWebSockets();
setupDaemon();

const dir = getDirList();

///////////////////////////////////////////////////////////////////////////////

function setupWebserver() {
    const app = express();
    app.get('/', (req, res) => res.sendFile(homePage));
    app.listen(appPort, () => {
        const address = getIP();
        console.log('Webserver running');
        console.log(`http://${address}:${appPort}`);
        console.log();
    });
}

///////////////////////////////////////////////////////////////////////////////

function setupWebSockets() {
    const ws_server = new WebSocket.Server({ port: wsPort });
  
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
    const watcher = chokidar.watch(sharedFolder, {
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
        process.stdout.write(BEEP);
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
    const action = listCommand.replace('<drive>', drive);
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
        const action = transferCommand.replace('<file>', fn).replace('<drive>', drive);
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
