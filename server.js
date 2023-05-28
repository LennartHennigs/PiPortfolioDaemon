const app = require('./src/app');
const config = require('./src/config');

const { setupWebSockets } = require('./src/websockets');
const { setupDaemon } = require('./src/daemon');
const { doesPathExists, isCommandAvailable, getIP } = require('./src/utils');

const PORT = process.env.PORT || config.appPort;
const args = process.argv.slice(2);

if (!doesPathExists(config.webserverFolder)) {
    throw new Error(`webserverFolder does not exist: ${config.webserverFolder}`);
}
if (!doesPathExists(config.homepage)) {
    throw new Error(`homepage file does not exist: ${config.homepage}`);
}
if (!doesPathExists(config.sharedFolder)) {
    throw new Error(`sharedFolder does not exist: ${config.sharedFolder}`);
}
if (!doesPathExists(config.tmpFolder)) {
    throw new Error(`tmpFolder does not exist: ${config.tmpFolder}`);
}
if (!isCommandAvailable('rpfolio')) {
    throw new Error('rpfolio command not found!');
}   

// Set the drive variable based on command line parameters
if (args[0] !== undefined) {
    config.portfolioPath = args[0];
}

console.log();
console.log(`${config.ID} ${config.VERSION}`);
console.log(`-> ${config.portfolioPath}\n`);

// Start the app and set up websockets and the daemon

const server = app.listen(PORT, () => {
    const address = getIP();
    console.log(`Webserver running at http://${address}:${config.appPort}`);
    
    setupWebSockets();
    setupDaemon();
});

server.on('error', (error) => {
    console.error(`Error: ${error.message}`);
    process.exit(1);
});