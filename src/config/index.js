///////////////////////////////////////////////////////////////////////////////
const path = require('path');
///////////////////////////////////////////////////////////////////////////////

const config = {
    appPort: 3000,
    wsPort: 40510,
    drive: null,
    dirContent: [],
    webserverPath: path.join(process.cwd(), 'public'),
    homepage: path.join(process.cwd(), 'public', 'rpf.html'),
    sharedFolder: path.join(process.cwd(), 'upload'),
    tmpFolder: "/tmp",
    // !!! TODO: be better w/ *.*
    listCommand: './rpfolio2 -l <drive>*.*',
    receiveCommand: './rpfolio2 -r -f <drive><file> .',
    transferCommand: './rpfolio2 -f -t <file> <drive>',
    ID: 'Portfolio Folder Daemon',
    VERSION: 'v0.9 - LH 05/2023',
    BEEP: '\u0007',
};

///////////////////////////////////////////////////////////////////////////////
module.exports = config;
///////////////////////////////////////////////////////////////////////////////
