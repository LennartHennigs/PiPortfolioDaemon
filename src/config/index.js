///////////////////////////////////////////////////////////////////////////////

const path = require('path');

///////////////////////////////////////////////////////////////////////////////

const config = {
    appPort: 3000,
    wsPort: 40510,
    portfolioTimeout: 4000,
    portfolioPath: 'c:\\',
    webserverFolder: path.join(__dirname, '../..', 'public'),
    homepage: path.join(__dirname, '../..', 'public', 'rpf.html'),
    sharedFolder: path.join(__dirname, '../../..', 'upload'),
    tmpFolder: '/tmp',
    // !!! TODO: be better w/ *.*
    listCommand: 'rpfolio -l <drive>*.*',
    receiveCommand: 'rpfolio -r -f <drive><file> .',
    transferCommand: 'rpfolio -f -t <file> <drive>',
    ID: 'Portfolio Folder Daemon',
    VERSION: 'v1.0 - LH 05/2023',
    BEEP: '\u0007',
};

///////////////////////////////////////////////////////////////////////////////
module.exports = config;
///////////////////////////////////////////////////////////////////////////////
