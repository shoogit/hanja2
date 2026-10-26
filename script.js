let allHanja = [];
let starList = JSON.parse(localStorage.getItem('starList') || '[]');
let trashList = JSON.parse(localStorage.getItem('trashList') || '[]');
let currentDeck = 'main';
let currentHanja = null;
let currentIndex = -1;
let orderMode = 'random'; // 'random' or 'sequential'
let autoScrollInterval = null;

const hanjaEl = document.getElementById('hanja');
const meaningEl = document.getElementById('meaning');
const deckInfoEl = document.getElementById('deck-info');
const flashcardEl = document.getElementById('flashcard');
const btnStar = document.getElementById('btn-star');
const btnTrash = document.getElementById('btn-trash');
const viewMainBtn = document.getElementById('view-main');
const viewStarBtn = document.getElementById('view-star');
const viewTrashBtn = document.getElementById('view-trash');
const autoScrollBtn = document.getElementById('auto-scroll-toggle');
const orderRandomBtn = document.getElementById('order-random');
const orderSequentialBtn = document.getElementById('order-sequential');
const btnShowTable = document.getElementById('btn-show-table');
const tableModal = document.getElementById('table-modal');
const closeModal = document.getElementById('close-modal');
const tableBody = document.querySelector('#hanja-table tbody');

async function init() {
    try {
        const response = await fetch('hanja_data.json');
        allHanja = await response.json();
        showNextCard();
        updateDeckInfo();
        renderTable();
    } catch (error) {
        console.error('Error loading hanja data:', error);
        deckInfoEl.textContent = '데이터를 불러오지 못했습니다.';
    }
}

function getFilteredDeck() {
    if (currentDeck === 'star') {
        return allHanja.filter(h => starList.includes(h.한자));
    } else if (currentDeck === 'trash') {
        return allHanja.filter(h => trashList.includes(h.한자));
    } else {
        return allHanja.filter(h => !starList.includes(h.한자) && !trashList.includes(h.한자));
    }
}

function showNextCard() {
    const deck = getFilteredDeck();
    if (deck.length === 0) {
        displayEmpty();
        return;
    }

    if (orderMode === 'random') {
        currentIndex = Math.floor(Math.random() * deck.length);
    } else {
        currentIndex = (currentIndex + 1) % deck.length;
    }
    updateCardDisplay(deck);
}

function showPrevCard() {
    const deck = getFilteredDeck();
    if (deck.length === 0) {
        displayEmpty();
        return;
    }

    if (orderMode === 'random') {
        currentIndex = Math.floor(Math.random() * deck.length);
    } else {
        currentIndex = (currentIndex - 1 + deck.length) % deck.length;
    }
    updateCardDisplay(deck);
}

function updateCardDisplay(deck) {
    currentHanja = deck[currentIndex];
    hanjaEl.textContent = currentHanja.한자;
    meaningEl.textContent = currentHanja['한글 뜻/음'];
}

function displayEmpty() {
    hanjaEl.textContent = '텅';
    meaningEl.textContent = '카드가 없습니다.';
    currentHanja = null;
    currentIndex = -1;
}

function updateDeckInfo() {
    const deck = getFilteredDeck();
    let deckName = '';
    if (currentDeck === 'main') deckName = '메인 데크';
    else if (currentDeck === 'star') deckName = '스타 보관함';
    else if (currentDeck === 'trash') deckName = '휴지통';

    deckInfoEl.textContent = `${deckName}: ${deck.length}개의 카드`;
}

function renderTable() {
    tableBody.innerHTML = '';
    allHanja.forEach(h => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${h.한자}</td><td>${h['한글 뜻/음']}</td>`;
        tableBody.appendChild(row);
    });
}

// Event Listeners
flashcardEl.addEventListener('click', (e) => {
    if (autoScrollInterval) {
        stopAutoScroll();
    } else {
        const rect = flashcardEl.getBoundingClientRect();
        const x = e.clientX - rect.left; // x position within the element.
        if (x < rect.width / 2) {
            showPrevCard();
        } else {
            showNextCard();
        }
    }
});

btnStar.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!currentHanja) return;

    if (starList.includes(currentHanja.한자)) {
        starList = starList.filter(h => h !== currentHanja.한자);
    } else {
        starList.push(currentHanja.한자);
        trashList = trashList.filter(h => h !== currentHanja.한자);
    }
    saveAndRefresh();
});

btnTrash.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!currentHanja) return;

    if (trashList.includes(currentHanja.한자)) {
        trashList = trashList.filter(h => h !== currentHanja.한자);
    } else {
        trashList.push(currentHanja.한자);
        starList = starList.filter(h => h !== currentHanja.한자);
    }
    saveAndRefresh();
});

function saveAndRefresh() {
    localStorage.setItem('starList', JSON.stringify(starList));
    localStorage.setItem('trashList', JSON.stringify(trashList));
    currentIndex = -1; // Reset index when deck content changes
    showNextCard();
    updateDeckInfo();
}

function switchDeck(deck) {
    currentDeck = deck;
    [viewMainBtn, viewStarBtn, viewTrashBtn].forEach(btn => btn.classList.remove('active'));
    if (deck === 'main') viewMainBtn.classList.add('active');
    else if (deck === 'star') viewStarBtn.classList.add('active');
    else if (deck === 'trash') viewTrashBtn.classList.add('active');

    stopAutoScroll();
    currentIndex = -1;
    showNextCard();
    updateDeckInfo();
}

viewMainBtn.addEventListener('click', () => switchDeck('main'));
viewStarBtn.addEventListener('click', () => switchDeck('star'));
viewTrashBtn.addEventListener('click', () => switchDeck('trash'));

orderRandomBtn.addEventListener('click', () => {
    orderMode = 'random';
    orderRandomBtn.classList.add('active');
    orderSequentialBtn.classList.remove('active');
});

orderSequentialBtn.addEventListener('click', () => {
    orderMode = 'sequential';
    orderSequentialBtn.classList.add('active');
    orderRandomBtn.classList.remove('active');
    currentIndex = -1; // Start from beginning when switching to sequential
    showNextCard();
});

function startAutoScroll() {
    if (autoScrollInterval) return;
    autoScrollBtn.textContent = '자동스크롤 정지';
    autoScrollBtn.classList.add('active');
    autoScrollInterval = setInterval(() => {
        showNextCard();
    }, 1000);
}

function stopAutoScroll() {
    if (!autoScrollInterval) return;
    clearInterval(autoScrollInterval);
    autoScrollInterval = null;
    autoScrollBtn.textContent = '자동스크롤 시작';
    autoScrollBtn.classList.remove('active');
}

autoScrollBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (autoScrollInterval) {
        stopAutoScroll();
    } else {
        startAutoScroll();
    }
});

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        if (autoScrollInterval) {
            stopAutoScroll();
        } else {
            showNextCard();
        }
    } else if (e.code === 'ArrowLeft') {
        showPrevCard();
    } else if (e.code === 'ArrowRight') {
        showNextCard();
    }
});

btnShowTable.addEventListener('click', () => {
    tableModal.style.display = 'block';
});

closeModal.addEventListener('click', () => {
    tableModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === tableModal) {
        tableModal.style.display = 'none';
    }
});

init();
