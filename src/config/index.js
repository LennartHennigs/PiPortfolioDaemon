///////////////////////////////////////////////////////////////////////////////
const path = require('path');
///////////////////////////////////////////////////////////////////////////////

const config = {
    appPort: 3000,
    wsPort: 40510,
    drive: null,
    webserverPath: path.join(process.cwd(), 'public'),
    homepage: path.join(process.cwd(), 'public', 'rpf.html'),
    sharedFolder: path.join(process.cwd(), 'upload'),
    tmpFolder: "/tmp",
    // !!! TODO: be better w/ *.*
    listCommand: 'pfolio -l <drive>*.*',
    receiveCommand: 'rpfolio -r -f <drive><file> .',
    transferCommand: 'rpfolio -f -t <file> <drive>',
    ID: 'Portfolio Folder Daemon',
    VERSION: 'v1.0 - LH 05/2023',
    BEEP: '\u0007',
};

///////////////////////////////////////////////////////////////////////////////
module.exports = config;
///////////////////////////////////////////////////////////////////////////////
