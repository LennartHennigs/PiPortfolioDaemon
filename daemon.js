///////////////////////////////////////////////////////////////////////////////
/*
    watches a directory and upload its content to the Atari Portfolio
     ...and deletes them afterwards

     Node JS Script - LH 02/2023

    Install: npm install chokidar express ws
*/
///////////////////////////////////////////////////////////////////////////////

const { execSync } = require('child_process');

const 
    app_port = 3000,
    ws_port = 40510,

    home_page = '/home/pi/rpf.html',
    sharedFolder = '/home/pi/upload';

    // !!! TODO: be better w/ *.*
    listCommand = 'rpfolio -l <drive>*.*';
    transferCommand = 'rpfolio -f -t <file> <drive>';

    ID = 'Portfolio Folder Daemon',
    VERSION = 'v1.0 - LH 02/23',

    BEEP    = '\007';

// use drive parameter, or default to c:
var args = process.argv.slice(2);
var drive = (args[0] == undefined) ? 'c:' : args[0]

let clients = [];

///////////////////////////////////////////////////////////////////////////////
//  MAIN
///////////////////////////////////////////////////////////////////////////////

console.log();
console.log(`${ID} ${VERSION}`);
console.log(`-> ${drive}\n`);

setupWebserver();
setupWebsockets();
setupDaemon();

//  get the dir list
const dir = getDirList();

///////////////////////////////////////////////////////////////////////////////

function setupWebserver() {
    // set up webserver
    const express = require('express');
    const app = express();

    // set default route
    app.get('/', (req, res) => {
        try {
            res.sendFile(home_page);
        } catch (error) {
            console.error(error);
        }
    });
    // start server
    app.listen(app_port, () => {
        const address = getIP();
        console.log('Webserver running');
        console.log(`http://${address}:${app_port}`);
        console.log();
    });
}

///////////////////////////////////////////////////////////////////////////////
// set up websocket connection
function setupWebsockets() {
    var WebSocket = require('ws');
    const ws_server = new WebSocket.Server({ port: ws_port });

    ws_server.on('connection', (socket) => {
        socket.binaryType = "arraybuffer";
        // keep track of clients
        clients.push(socket);
        console.log('client connected: ' + clients.length);
        socket.on('open', () => {            
socket.send('ping');
        });
        socket.on('message', (event) => {
            console.log(event.toString() + ' from client');
        });
        socket.on('close', () => {
            // remove when disconnected
            clients = clients.filter(s => s !== socket);
            console.log('client disconnected: ' + clients.length);
        });
    });
}


///////////////////////////////////////////////////////////////////////////////

function setupDaemon() {
    var chokidar = require('chokidar');

    var watcher = chokidar.watch(sharedFolder, {
        // ignore dot files
        ignored: /(^|[\/\\])\../,           
        persistent: true,
        awaitWriteFinish: true
    });

    // start watching the folder
    watcher.on('add', (fn, stats) => {
        // display file name
        const fileName = fn.substring(fn.lastIndexOf('/') + 1);
        var str = `- ${fileName} `;
        // send name to web clients
        sendToWebsite(str);
        process.stdout.write(str);
        // try to transfer
        res = (transferFile(fn)) ? '\u{2705}' : '\u{274c}';
        // display result
        console.log(res);
        sendToWebsite(res + '\n');
        // done
        process.stdout.write(BEEP);
    });
}
///////////////////////////////////////////////////////////////////////////////
// https://gist.github.com/sviatco/9054346

function getIP() {
    var address,
     ifaces = require('os').networkInterfaces();
     for (var dev in ifaces) {
         ifaces[dev].filter((details) => (details.family === 'IPv4' && details.internal === false) ? address = details.address : undefined);
     }
     return address;
 }
 
///////////////////////////////////////////////////////////////////////////////

function sendToWebsite(data){
    clients.forEach((item) => { item.send(data)});
}

///////////////////////////////////////////////////////////////////////////////

 function getDirList() {
    // prepare command
    const action = listCommand.replace('<drive>', drive);
    var res = execSync(action, {stdio : ['ignore', 'pipe', 'ignore']}).toString().split('\n');
    // delete non-diles
    res.splice(0, 2);
    res.pop();
    return res;
}

///////////////////////////////////////////////////////////////////////////////

function transferFile(fn) {
    var fs = require('fs');
    try {
        // prepare command
        const action = transferCommand.replace('<file>', fn).replace('<drive>', drive);
        execSync(action, {stdio : ['ignore', 'pipe', 'ignore']});
        // delete file
        try {
            fs.unlinkSync(fn);
        } catch (error) {
            console.error('  Error deleting file!');
        }
    } catch (error) {
        return false;
    }
    return true;    
}

///////////////////////////////////////////////////////////////////////////////