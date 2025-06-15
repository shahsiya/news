// app.js — отображение карточек новостей + кнопка анализа

const newsContainer = document.getElementById('news-container');

async function fetchNews(page = 1) {
  const res = await fetch(`/api/news?page=${page}`);
  const data = await res.json();
  renderNews(data.news);
}

function renderNews(newsList) {
  newsContainer.innerHTML = ''; // очищаем контейнер
  newsList.forEach(news => {
    const card = document.createElement('div');
    card.className = 'news-card';

    card.innerHTML = `
      <h3>${news.title_ru || news.title_en}</h3>
      <img src="${news.image_url || ''}" alt="news image" style="max-width:100%; height:auto" />
      <p><a href="${news.url}" target="_blank">Открыть источник</a></p>
      <button class="analyze-btn" data-id="${news.id}">Анализировать</button>
      <div class="analysis-result" id="analysis-${news.id}"></div>
    `;

    newsContainer.appendChild(card);
  });
}

// Слушатель кнопки "Анализировать"
document.addEventListener('click', async (e) => {
  if (e.target.classList.contains('analyze-btn')) {
    const newsId = e.target.getAttribute('data-id');
    const resultDiv = document.getElementById(`analysis-${newsId}`);
    resultDiv.innerHTML = '⏳ Анализируем...';

    try {
      const res = await fetch(`/api/news/${newsId}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (data.analysis) {
        resultDiv.innerHTML = `
          <pre>${JSON.stringify(data.analysis, null, 2)}</pre>
        `;
      } else {
        resultDiv.innerHTML = '❌ Анализ не удалось получить';
      }
    } catch (err) {
      resultDiv.innerHTML = '⚠️ Ошибка при анализе';
      console.error('Ошибка анализа:', err);
    }
  }
});

// Загружаем первую страницу при старте
fetchNews();
