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

const newsContainer = document.getElementById('vacancies');
  // или #vacancies — проверь свой HTML

async function loadNews() {
  newsContainer.innerHTML = '<p>Загрузка новостей...</p>';

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
    newsContainer.innerHTML = `<p>Ошибка загрузки: ${error.message}</p>`;
  }
}

function setupSourceFilter() {
  const sourceFilter = document.getElementById('sourceFilter');
  if (!sourceFilter) return;

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
  const searchVal = document.getElementById('searchInput')?.value.toLowerCase() || '';
  const sourceVal = document.getElementById('sourceFilter')?.value || '';

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
  newsContainer.innerHTML = '';

  const start = (page - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const pageItems = filteredNews.slice(start, end);

  if (pageItems.length === 0) {
    newsContainer.innerHTML = '<p>Новостей не найдено.</p>';
    return;
  }

  pageItems.forEach(article => {
    const created = article.created
      ? new Date(article.created).toLocaleString('ru-RU')
      : 'Неизвестно';

    const card = document.createElement('div');
    card.className = 'vacancy-card';

    card.innerHTML = `
      ${article.image_url ? `<img src="${article.image_url}" alt="Изображение новости" style="max-width:100%; height:auto" />` : ''}
      <h3>${article.title_ru || article.title_en || 'Без заголовка'}</h3>
      <p>${article.summary_ru || article.summary_en || ''}</p>
      <div><strong>Источник:</strong> ${article.source || '—'}</div>
      <div><strong>Дата:</strong> ${created}</div>
      ${article.url ? `<p><a href="${article.url}" target="_blank">Открыть источник</a></p>` : ''}
      <button class="analyze-btn" data-id="${article.id}">Анализировать</button>
      <div class="analysis-result" id="analysis-${article.id}"></div>
    `;

    newsContainer.appendChild(card);
  });
}

function renderPagination() {
  const pagination = document.getElementById('pagination');
  if (!pagination) return;

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

// Обработка кликов на кнопки "Анализировать"
document.addEventListener('click', async (e) => {
  if (e.target.classList.contains('analyze-btn')) {
    const newsId = e.target.getAttribute('data-id');
    const resultDiv = document.getElementById(`analysis-${newsId}`);
    if (!resultDiv) return;

    resultDiv.innerHTML = '⏳ Анализируем...';

    try {
      const res = await fetch(`/api/news/${newsId}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (data.analysis) {
        resultDiv.innerHTML = `<pre>${JSON.stringify(data.analysis, null, 2)}</pre>`;
      } else {
        resultDiv.innerHTML = '❌ Анализ не удалось получить';
      }
    } catch (err) {
      resultDiv.innerHTML = '⚠️ Ошибка при анализе';
      console.error('Ошибка анализа:', err);
    }
  }
});

// События для фильтров и кнопок обновления
window.onload = () => {
  loadNews();

  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) refreshBtn.addEventListener('click', () => loadNews());

  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.addEventListener('input', applyFilters);

  const sourceFilter = document.getElementById('sourceFilter');
  if (sourceFilter) sourceFilter.addEventListener('change', applyFilters);

  const resetFilter = document.getElementById('resetFilter');
  if (resetFilter) resetFilter.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    if (sourceFilter) sourceFilter.value = '';
    applyFilters();
  });
};
