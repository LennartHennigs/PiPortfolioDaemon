
///////////////////////////////////////////////////////////////////////////////
/*
    watches a directory and upload its content to the Atari Portfolio
    ...and deletes them afterwards

    Node JS Script - LH 04/2023
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
    homePage: path.join(process.cwd(), 'public', 'rpf.html'),
    sharedFolder: path.join(process.cwd(), 'upload'),
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

function  setupWebserver() {
    const app = express();
    // serve static files from the public directory
    app.use(express.static('public'));
    // set the default route to the home page
    app.get('/download/:filename', function(req, res) {
        const fileName = req.params.filename;
        console.log('download ${fileName}');
        res.status(404).send(`File not found: ${fileName}`);


//        const filePath = path.join(__dirname, 'public', fileName);
    //    res.download(filePath, fileName);
    });

    // set the MIME type for HTML, CSS, and JavaScript files
    app.get('*.(html|css|js)', function(req, res) {
        const filePath = path.join(__dirname, 'public', req.path);
        res.sendFile(filePath);
      });

      app.get('/', function(req, res) {
        res.sendFile(config.homePage);
      });
  
      // start the web server
    app.listen(config.appPort, () => {
      const address = getIP();
      console.log('Webserver running');
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
            console.log(`${event} from client`);
            const message = JSON.parse(event);
            switch (message.command) {
                case 'page_loaded':
                    sendSetFolder(drive + '\\');
                    //sendDirList();
const message = {
    command: 'dir',
    files: ["one.js","two.js"]
};
clients.forEach(client => client.send(JSON.stringify(message)));
                                    
                    break;
                case 'set_folder':
                    // Handle the 'set_folder' command here
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
    for (const dev in ifaces) {
      const address = ifaces[dev].find(details => details.family === 'IPv4' && !details.internal)?.address;
      if (address) {
        return address;
      }
    }
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