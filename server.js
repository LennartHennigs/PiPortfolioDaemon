const app = require('./src/app');
const config = require('./src/config');

const { setupWebSockets } = require('./src/websockets');
const { setupDaemon } = require('./src/daemon');
const { getDirListFromPortfolio, getIP } = require('./src/utils');

const PORT = process.env.PORT || config.appPort;
const args = process.argv.slice(2);

// Set the drive variable based on command line parameters
config.drive = (args[0] === undefined) ? 'c:' : args[0];

console.log();
console.log(`${config.ID} ${config.VERSION}`);
console.log(`-> ${config.drive}\n`);

// Get directory contents from the portfolio
console.log('Getting dir contents...');
config.dirContent = getDirListFromPortfolio();
console.log();

// Start the app and set up websockets and the daemon
app.listen(PORT, () => {
    const address = getIP();
    console.log(`Webserver running at http://${address}:${config.appPort}`);
 
    setupWebSockets();
    setupDaemon();
});
