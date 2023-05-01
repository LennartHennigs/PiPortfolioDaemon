let debug = false;

const port = 40510;
let ws = new WebSocket(`ws://${location.hostname}:${port}`);

if (typeof window.WebSocket === 'undefined') {
    alert('Websockets are not supported');
}

ws.addEventListener('open', () => {
    console.log('Connected to server!');
    ws.send(JSON.stringify({ command: 'page_loaded' }));
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

ws.addEventListener('close', () => {
    ws = null;
    console.log('Disconnected!!');
    setTimeout(() => {
        ws = new WebSocket(`ws://${location.hostname}:${port}`);
    }, 5000);
});

function getFolder(folder) {
    document.getElementById('current_folder').value = folder;
}

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

function updateLog(data) {
    document.getElementById('log').value += data;
}

function sendFolder() {
    const folder = document.getElementById('current_folder').value;
    console.log("SEND FOLDER");
    const message = {
        command: 'set_folder',
        folder: folder,
    };
    ws.send(JSON.stringify(message));
}
