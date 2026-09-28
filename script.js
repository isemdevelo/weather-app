// 🔑 Put your OpenWeatherMap API key here
const API_KEY = '26ba06703940231dc013df471997974c';
const BASE = 'https://api.openweathermap.org/data/2.5';

const form = document.getElementById('search-form');
const input = document.getElementById('city-input');
const status = document.getElementById('status');
const current = document.getElementById('current');
const forecast = document.getElementById('forecast');
const forecastGrid = document.getElementById('forecast-grid');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const city = input.value.trim();
  if (!city) return;

  setStatus('Loading…');
  current.classList.add('hidden');
  forecast.classList.add('hidden');

  try {
    const [curRes, foreRes] = await Promise.all([
      fetch(`${BASE}/weather?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`),
      fetch(`${BASE}/forecast?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`)
    ]);

    if (!curRes.ok) {
      if (curRes.status === 404) throw new Error(`City "${city}" not found.`);
      if (curRes.status === 401) throw new Error('Invalid API key. Check script.js.');
      throw new Error('Could not fetch weather.');
    }

    const currentData = await curRes.json();
    const forecastData = await foreRes.json();

    renderCurrent(currentData);
    renderForecast(forecastData);
    setStatus('');
  } catch (err) {
    setStatus(err.message, true);
  }
});

function renderCurrent(data) {
  const icon = data.weather[0].icon;
  current.innerHTML = `
    <div class="city">${data.name}</div>
    <div class="country">${data.sys.country}</div>
    <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${data.weather[0].description}" />
    <div class="temp">${Math.round(data.main.temp)}°C</div>
    <div class="desc">${data.weather[0].description}</div>
    <div class="meta">
      <div>Feels like<strong>${Math.round(data.main.feels_like)}°C</strong></div>
      <div>Humidity<strong>${data.main.humidity}%</strong></div>
      <div>Wind<strong>${Math.round(data.wind.speed)} m/s</strong></div>
    </div>
  `;
  current.classList.remove('hidden');
}

function renderForecast(data) {
  // Group by day, take one entry per day (closest to noon)
  const days = {};
  data.list.forEach(item => {
    const date = item.dt_txt.split(' ')[0];
    const hour = parseInt(item.dt_txt.split(' ')[1].split(':')[0]);
    if (!days[date] || Math.abs(hour - 12) < Math.abs(days[date].hour - 12)) {
      days[date] = { ...item, hour };
    }
  });

  const entries = Object.values(days).slice(0, 5);

  forecastGrid.innerHTML = entries.map(item => {
    const date = new Date(item.dt * 1000);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    return `
      <div class="forecast-card">
        <div class="day">${dayName}</div>
        <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png" alt="${item.weather[0].description}" />
        <div class="ftemp">${Math.round(item.main.temp)}°C</div>
        <div class="fdesc">${item.weather[0].description}</div>
      </div>
    `;
  }).join('');

  forecast.classList.remove('hidden');
}

function setStatus(message, isError = false) {
  status.textContent = message;
  status.classList.toggle('error', isError);
}