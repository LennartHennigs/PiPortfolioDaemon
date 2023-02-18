///////////////////////////////////////////////////////////////////////////////
/*
    watches a directory and upload its content to the Atari Portfolio
     ...and deletes them afterwards

     Node JS Script - LH 02/2023

    Install: npm install chokidar
*/
///////////////////////////////////////////////////////////////////////////////

const { execSync } = require('child_process');

const 
    sharedFolder = '/home/pi/upload';
    transferCommand = 'rpfolio -f -t <file> <drive>';

    ID = 'Portfolio Folder Daemon',
    VERSION = 'v1.0 - LH 02/23',

    GREEN   = '\033[32m',
    RED     = '\033[31m',
    DEFAULT = '\033[0m',    
    BEEP    = '\007';

// use drive parameter, or default to c:
var args = process.argv.slice(2);
var drive = (args[0] == undefined) ? 'c:' : args[0]

///////////////////////////////////////////////////////////////////////////////
//  MAIN
///////////////////////////////////////////////////////////////////////////////

console.log();
console.log(`${ID} ${VERSION}`);
console.log(`-> ${drive}\n`);

setupDaemon();

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
        process.stdout.write(str);
        // try to transfer
//        res = (transferFile(fn)) ? '\u{2705}' : '\u{274c}';
        res = (transferFile(fn)) ? `${GREEN}✓${DEFAULT}` : `${RED}✗${DEFAULT}`;
        // display result
        console.log(res);
        // done
        process.stdout.write(BEEP);
    });
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
            console.error('\n   Error deleting file!');
        }
    } catch (error) {
        return false;
    }
    return true;    
}

///////////////////////////////////////////////////////////////////////////////