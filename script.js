const $ = selector => document.querySelector(selector);

const requestIDB = indexedDB.open('Users');
const $dropZone = $(".drop_zone");

requestIDB.addEventListener('upgradeneeded', () => {
    const db = requestIDB.result;

    db.createObjectStore('names', {
        autoIncrement: true
    });
});

requestIDB.addEventListener('success', () => loadNames());

function getRequest() {
    const db = requestIDB.result;
    const transaction = db.transaction('names', 'readwrite');
    const nameStore = transaction.objectStore('names');

    return nameStore;
}

function createName(nameText, key) {
    const content = document.createElement('li');
    content.classList.add('item_name', `name-${key}`);
    content.setAttribute('draggable', true)

    const name = document.createElement('h3');
    name.textContent = nameText;
    name.contentEditable = true;

    const saveName = document.createElement('button');
    saveName.disabled = true;
    saveName.textContent = 'Guardar';

    content.appendChild(name);
    content.appendChild(saveName);

    content.addEventListener('dragstart', e => {
        e.dataTransfer.setData('item', JSON.stringify({
            className: content.classList[1],
            key
        }));
    });

    name.addEventListener('keypress', () => {
        saveName.style.cursor = 'pointer';
        saveName.disabled = false;
    });

    saveName.addEventListener('click', () => {
        const nameStore = getRequest();
        const value = name.textContent;

        if(value === '') return alert('No se permite texto vacio.');

        nameStore.put({name: value}, key);
        saveName.style.cursor = 'not-allowed';
        saveName.disabled = true;
    });

    $(".content_name").appendChild(content);
}   

$(".form_add").addEventListener('submit', e => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const nameText = formData.get('name_text');

    addName(nameText);
    e.target.reset();
});

function addName(name) {
    if(name === '') return alert('No se permite texto vacio.');

    const nameStore = getRequest();
    nameStore.add({name});

    createName(name);
    loadNames();
}

function loadNames(key = null) {
    const nameStore = getRequest();
    const cursor = nameStore.openCursor(key);
    
    $(".content_name").innerHTML = '';

    cursor.addEventListener('success', () => {
        const { result } = cursor;

        if(result) {
            createName(result.value['name'], result.key);
            result.continue();
        }
    });
}

$dropZone.addEventListener('dragover', e => e.preventDefault());
$dropZone.addEventListener('drop', deleteName);

function deleteName(e) {
    const value = JSON.parse(e.dataTransfer.getData('item'));
    const { className, key } = value;

    const nameStore = getRequest();
    const itemName = $(`.${className}`);
    
    $(".content_name").removeChild(itemName);
    nameStore.delete(key);
} 