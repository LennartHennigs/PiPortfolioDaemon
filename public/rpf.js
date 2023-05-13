///////////////////////////////////////////////////////////////////////////////

let debug = false;

const port = 40510;

///////////////////////////////////////////////////////////////////////////////

if (typeof window.WebSocket === 'undefined') {
    alert('Websockets are not supported');
} else {
    let ws;
    connectWebSocket();
}

///////////////////////////////////////////////////////////////////////////////
// adds event listeners to the websockets

/*
function connectWebSocket() {
  const ws = new WebSocket(`ws://${location.hostname}:${port}`);

  ws.onopen = () => {
    console.log('Connected to server!');
    ws.send(JSON.stringify({ command: 'page_loaded' }));
    initializeInputEvents();
  };

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (debug) console.log(msg);

    const commands = {
      log: updateLog,
      set_folder: getFolder,
      dir: populateFileList
    };

    const handler = commands[msg.command] || (() => console.log('error'));
    handler(msg.data);
  };

  ws.onerror = () => {
    console.log('WebSocket error');
    alert('Error connecting to WebSocket. The page will now reload.');
    location.reload();
  };

  ws.onclose = () => {
    console.log('Disconnected!!');
    alert('WebSocket connection lost. The page will now reload.');
    setTimeout(() => {
      location.reload();
    }, 5000);
  };
}

*/

function connectWebSocket() {
    ws = new WebSocket(`ws://${location.hostname}:${port}`);
    ws.addEventListener('open', () => {
        console.log('Connected to server!');
        ws.send(JSON.stringify({ command: 'page_loaded' }));
        initializeInputEvents(); 
    });

    ws.addEventListener('message', (event) => {
        const msg = JSON.parse(event.data);
        if (debug) console.log(msg);

        switch (msg.command) {
            case 'log':
                updateLog(msg.data);
                break;
            case 'set_folder':
                getFolder(msg.folder);
                break;
            case 'dir':
                populateFileList(msg);
                break;
            default:
                console.log('error');
                break;
        }
    });

    ws.addEventListener('error', () => {
        console.log('WebSocket error');
        alert('Error connecting to WebSocket. The page will now reload.');
        location.reload();
    });

    ws.addEventListener('close', () => {
        ws = null;
        console.log('Disconnected!!');
        alert('WebSocket connection lost. The page will now reload.');
        location.reload();
        setTimeout(() => {
            ws = new WebSocket(`ws://${location.hostname}:${port}`);
        }, 5000);
    });
}

///////////////////////////////////////////////////////////////////////////////

function initializeInputEvents() {
    document.getElementById('current_folder').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            sendFolder();
        }
    });
}

///////////////////////////////////////////////////////////////////////////////
// reads the folder name from the text field
function getFolder(folder) {
    document.getElementById('current_folder').value = folder;
}

///////////////////////////////////////////////////////////////////////////////
// lists all the files for the folder
function populateFileList({ files = [] } = {}) {
    const fileList = document.getElementById('file_list');
    fileList.innerHTML = '';

    files.forEach(file => {
        const listItem = document.createElement('li');
        const link = document.createElement('a');
        link.href = `/download/${file}`;
        link.textContent = file;
        listItem.appendChild(link);
        fileList.appendChild(listItem);
    });
}

///////////////////////////////////////////////////////////////////////////////
// adds an entry to the upload log
function updateLog(data) {
    document.getElementById('log').value += data;
}

///////////////////////////////////////////////////////////////////////////////
// send a new folder string to the server
function sendFolder() {
    const folder = document.getElementById('current_folder').value;
    console.log("SEND FOLDER");
    const message = {
        command: 'set_folder',
        folder,
    };
    ws.send(JSON.stringify(message));
}

///////////////////////////////////////////////////////////////////////////////
