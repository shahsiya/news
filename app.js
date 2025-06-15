import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB15DfYRfexQNhiToIrqBb5L7hRIEctM3I",
  authDomain: "news-d2cb9.firebaseapp.com",
  projectId: "news-d2cb9",
  storageBucket: "news-d2cb9.appspot.com",
  messagingSenderId: "59311537316",
  appId: "1:59311537316:web:2bd53798a9085263b2ba31",
  measurementId: "G-4D8G8PHXQ4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const ITEMS_PER_PAGE = 30;
let allNews = [];
let filteredNews = [];
let currentPage = 1;

async function loadNews() {
  const container = document.getElementById('vacancies');
  container.innerHTML = '<p>Загрузка новостей...</p>';

  try {
    const querySnapshot = await getDocs(collection(db, "news"));
    allNews = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      data.id = doc.id;
      allNews.push(data);
    });

    allNews.sort((a, b) => new Date(b.created) - new Date(a.created));
    setupSourceFilter();
    applyFilters();
  } catch (error) {
    container.innerHTML = `<p>Ошибка загрузки: ${error.message}</p>`;
  }
}

function setupSourceFilter() {
  const sourceFilter = document.getElementById('sourceFilter');
  const sources = Array.from(new Set(allNews.map(n => n.source).filter(Boolean))).sort();

  sourceFilter.innerHTML = '<option value="">Все источники</option>';
  sources.forEach(source => {
    const option = document.createElement('option');
    option.value = source;
    option.textContent = source;
    sourceFilter.appendChild(option);
  });
}

function applyFilters() {
  const searchVal = document.getElementById('searchInput').value.toLowerCase();
  const sourceVal = document.getElementById('sourceFilter').value;

  filteredNews = allNews.filter(n => {
    const title = (n.title_ru || n.title_en || '').toLowerCase();
    const source = n.source || '';
    const matchesSearch = title.includes(searchVal);
    const matchesSource = sourceVal === '' || source === sourceVal;
    return matchesSearch && matchesSource;
  });

  currentPage = 1;
  renderPage(currentPage);
  renderPagination();
}

function renderPage(page) {
  const container = document.getElementById('vacancies');
  container.innerHTML = '';

  const start = (page - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const pageItems = filteredNews.slice(start, end);

  if (pageItems.length === 0) {
    container.innerHTML = '<p>Новостей не найдено.</p>';
    return;
  }

  pageItems.forEach(article => {
    const card = document.createElement('div');
    card.className = 'vacancy-card';

    const created = article.created
      ? new Date(article.created).toLocaleString('ru-RU')
      : 'Неизвестно';

    card.innerHTML = `
      ${article.image_url ? `<img src="${article.image_url}" alt="Изображение новости" />` : ''}
      <div class="vacancy-title">${article.title_ru || article.title_en || 'Без заголовка'}</div>
      <div class="vacancy-desc">${article.summary_ru || article.summary_en || ''}</div>
      <div><strong>Источник:</strong> ${article.source || '—'}</div>
      <div><strong>Дата:</strong> ${created}</div>
      ${article.url ? `<a class="vacancy-link" href="${article.url}" target="_blank">Читать далее</a>` : ''}
    `;

    container.appendChild(card);
  });
}

function renderPagination() {
  const pagination = document.getElementById('pagination');
  pagination.innerHTML = '';
  const totalPages = Math.ceil(filteredNews.length / ITEMS_PER_PAGE);

  if (totalPages <= 1) return;

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    if (i === currentPage) btn.classList.add('active');
    btn.addEventListener('click', () => {
      currentPage = i;
      renderPage(currentPage);
      renderPagination();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    pagination.appendChild(btn);
  }
}

window.onload = () => {
  loadNews();

  document.getElementById('refreshBtn').addEventListener('click', () => loadNews());
  document.getElementById('searchInput').addEventListener('input', applyFilters);
  document.getElementById('sourceFilter').addEventListener('change', applyFilters);
  document.getElementById('resetFilter').addEventListener('click', () => {
    document.getElementById('searchInput').value = '';
    document.getElementById('sourceFilter').value = '';
    applyFilters();
  });
};
