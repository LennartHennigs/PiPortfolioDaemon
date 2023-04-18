
const port = 40510;
const ws_uri = `ws://${location.hostname}:${port}`;
var ws;

if (window.WebSocket == 'undefined') {
    alert("websockets are not supported");
} else {
    // establish websocket connection
    startWS(`ws://${location.hostname}:${port}`);  
};

function startWS(uri) {
    try {
        ws = new WebSocket(uri);
        // connect
        ws.onopen = () => {
            console.log("Connected to server!");
ws.send('hi');
        };
        // handle server messages
        ws.onmessage = (event) => {
            const msg = event.data;
console.log(event);
ws.send('pong');
            const element = document.getElementById('log');
            element.value = element.value + event.data; 
        };
        ws.onclose = () => {
            ws = null;
            console.log("Disonnected to server!");
            // https://stackoverflow.com/questions/3780511/reconnection-of-client-when-server-reboots-in-websocket
            setTimeout(() => { startWS(uri) }, 5000);
        };
    } catch (error) {
       // console.log('error: ' + error);
    }
}


///////////////////////////////////////////////////////////////////////////////

const port = 40510;
const wsUri = `ws://${location.hostname}:${port}`;
let ws;

///////////////////////////////////////////////////////////////////////////////

if (typeof window.WebSocket === 'undefined') {
    alert("Websockets are not supported");
} else {
    startWS(wsUri);
}

///////////////////////////////////////////////////////////////////////////////

function startWS(uri) {
    ws = new WebSocket(uri);
    ws.addEventListener('open', onOpen);
    ws.addEventListener('message', onMessage);
    ws.addEventListener('close', onClose);
}

///////////////////////////////////////////////////////////////////////////////

function onOpen() {
    console.log("Connected to server!");
    ws.send('hi');
}

///////////////////////////////////////////////////////////////////////////////

function onMessage({data}) {
    console.log(data);
    ws.send('pong');
    appendLog(data);
}

///////////////////////////////////////////////////////////////////////////////
function onClose() {
    ws = null;
    console.log("Disconnected from server!");
    // https://stackoverflow.com/questions/3780511/reconnection-of-client-when-server-reboots-in-websocket
    setTimeout(() => startWS(wsUri), 5000);
}

///////////////////////////////////////////////////////////////////////////////

function appendLog(data) {
    const logElement = document.getElementById('log');
    logElement.value += data;
}

///////////////////////////////////////////////////////////////////////////////
