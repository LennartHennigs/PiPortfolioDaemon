///////////////////////////////////////////////////////////////////////////////

let debug = false;

const port = 40510;

///////////////////////////////////////////////////////////////////////////////

if (typeof window.WebSocket === 'undefined') {
    alert('Web sockets are not supported');
} else {
    let ws;
    connectWebSocket();
}
enableDropZone();


///////////////////////////////////////////////////////////////////////////////
// adds event listeners to the web sockets

function connectWebSocket() {
    try {
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
                case 'add_to_log':
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
    } catch (error) {
        console.error(error);
        return;
    }
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

function clearFileList() {
    const fileList = document.getElementById('file_list');
    fileList.innerHTML = '';
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
    const message = {
        command: 'set_folder',
        folder,
    };
    ws.send(JSON.stringify(message));
    clearFileList();
}

///////////////////////////////////////////////////////////////////////////////

function enableDropZone() {
    let dropZone = document.getElementById('drop_zone');
    let fileInput = document.getElementById('filesToUpload');
    let maxSizeInMB = 2; // Maximum size allowed in MB
    let maxSize = maxSizeInMB * 1024 * 1024; // Convert size to bytes

    dropZone.ondragover = dropZone.ondragenter = function(evt) {
        evt.preventDefault();
        this.classList.add('over'); 
    };

    dropZone.ondrop = function(evt) {
        // Check file size
        for(let i = 0; i < evt.dataTransfer.files.length; i++) {
            if (evt.dataTransfer.files[i].size > maxSize) {
                alert('File size should not exceed ' + maxSizeInMB + ' MB');
                return;
            }
        }
        fileInput.files = evt.dataTransfer.files;
        evt.preventDefault();
        this.classList.remove('over'); 
        
    };

    dropZone.ondragleave = function(evt) {
        this.classList.remove('over'); 
    };

    fileInput.onchange = function() {
        // Check file size
        for(let i = 0; i < fileInput.files.length; i++) {
            if (fileInput.files[i].size > maxSize) {
                alert('File size should not exceed ' + maxSizeInMB + ' MB');
                return;
            }
        }
        let files = fileInput.files;
        for (let i = 0; i < files.length; i++) {
            console.log(files[i].name);
        }
    };
}

///////////////////////////////////////////////////////////////////////////////
