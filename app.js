// Инициализация карты
const map = L.map('map').setView([53.2521, 34.3717], 10); // Брянск по умолчанию

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Хранение заметок
let notes = JSON.parse(localStorage.getItem('geo-notes')) || [];
let markers = [];

// DOM элементы
const notesContainer = document.getElementById('notes-container');
const addNoteBtn = document.getElementById('add-note-btn');
const noteForm = document.getElementById('note-form');
const saveNoteBtn = document.getElementById('save-note');
const cancelNoteBtn = document.getElementById('cancel-note');
const noteTitleInput = document.getElementById('note-title');
const noteTextInput = document.getElementById('note-text');

// Текущая позиция для новой заметки
let currentPosition = null;

// Отображение заметок на карте и в списке
function displayNotes() {
    // Очищаем предыдущие маркеры
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    
    // Получаем границы видимой области карты
    const bounds = map.getBounds();
    
    // Фильтруем заметки по видимой области
    const visibleNotes = notes.filter(note => {
        return bounds.contains([note.lat, note.lng]);
    });
    
    // Отображаем заметки на карте
    visibleNotes.forEach(note => {
        const marker = L.marker([note.lat, note.lng]).addTo(map)
            .bindPopup(`<b>${note.title}</b><p>${note.text}</p>`);
        markers.push(marker);
    });
    
    // Отображаем заметки в списке
    notesContainer.innerHTML = '';
    visibleNotes.forEach(note => {
        const noteElement = document.createElement('div');
        noteElement.className = 'note';
        noteElement.innerHTML = `
            <h3>${note.title}</h3>
            <p>${note.text}</p>
            <small>${new Date(note.date).toLocaleString()}</small>
        `;
        noteElement.addEventListener('click', () => {
            map.setView([note.lat, note.lng], 15);
            markers.find(m => m.getLatLng().lat === note.lat && m.getLatLng().lng === note.lng).openPopup();
        });
        notesContainer.appendChild(noteElement);
    });
}

// Обработчик клика по карте для добавления новой заметки
map.on('click', function(e) {
    currentPosition = e.latlng;
    noteForm.style.display = 'block';
    noteTitleInput.focus();
});

// Обработчик кнопки добавления заметки
addNoteBtn.addEventListener('click', function() {
    noteForm.style.display = 'block';
    noteTitleInput.focus();
    currentPosition = map.getCenter();
});

// Обработчик сохранения заметки
saveNoteBtn.addEventListener('click', function() {
    const title = noteTitleInput.value.trim();
    const text = noteTextInput.value.trim();
    
    if (title && text && currentPosition) {
        const newNote = {
            id: Date.now(),
            title,
            text,
            lat: currentPosition.lat,
            lng: currentPosition.lng,
            date: new Date().toISOString()
        };
        
        notes.push(newNote);
        localStorage.setItem('geo-notes', JSON.stringify(notes));
        
        noteTitleInput.value = '';
        noteTextInput.value = '';
        noteForm.style.display = 'none';
        
        displayNotes();
    }
});

// Обработчик отмены
cancelNoteBtn.addEventListener('click', function() {
    noteTitleInput.value = '';
    noteTextInput.value = '';
    noteForm.style.display = 'none';
});

// Обновляем заметки при перемещении карты
map.on('moveend', displayNotes);

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    // Проверяем поддержку геолокации
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            map.setView([position.coords.latitude, position.coords.longitude], 13);
        });
    }
    
    displayNotes();
});

// Service Worker регистрация
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
            console.log('ServiceWorker registration successful');
        }).catch(err => {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}