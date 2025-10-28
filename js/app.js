// OpenWeatherMap API Configuration
// IMPORTANT: Replace 'YOUR_API_KEY' with your actual API key from https://openweathermap.org/api
const API_KEY = "1791c9806f5e8fa78f9fbadc373023f2"; // Get your free API key at openweathermap.org
const API_BASE_URL = "https://api.openweathermap.org/data/2.5";
const DEFAULT_CITY = "Calcutta";

// Weather icon mapping
const weatherIcons = {
  "01d": "☀️",
  "01n": "🌙",
  "02d": "⛅",
  "02n": "☁️",
  "03d": "☁️",
  "03n": "☁️",
  "04d": "☁️",
  "04n": "☁️",
  "09d": "🌧️",
  "09n": "🌧️",
  "10d": "🌦️",
  "10n": "🌧️",
  "11d": "⛈️",
  "11n": "⛈️",
  "13d": "❄️",
  "13n": "❄️",
  "50d": "🌫️",
  "50n": "🌫️",
};

// DOM Elements
const elements = {
  loading: document.getElementById("loading"),
  errorMessage: document.getElementById("error-message"),
  cityInput: document.getElementById("city-input"),
  searchBtn: document.getElementById("search-btn"),
  currentDate: document.getElementById("current-date"),
  cityName: document.getElementById("city-name"),
  temperature: document.getElementById("temperature"),
  weatherDescription: document.getElementById("weather-description"),
  weatherIcon: document.getElementById("weather-icon"),
  feelsLike: document.getElementById("feels-like"),
  humidity: document.getElementById("humidity"),
  windSpeed: document.getElementById("wind-speed"),
  pressure: document.getElementById("pressure"),
  visibility: document.getElementById("visibility"),
  sunrise: document.getElementById("sunrise"),
  sunset: document.getElementById("sunset"),
  cloudiness: document.getElementById("cloudiness"),
  hourlyForecast: document.getElementById("hourly-forecast"),
  dailyForecast: document.getElementById("daily-forecast"),
};

// Initialize App
function init() {
  // Check if API key is set
  if (API_KEY === "YOUR_API_KEY") {
    console.warn("Please add your OpenWeatherMap API key in app.js");
    hideLoading();
    return;
  } else {
    // Hide API notice if key is set
    const apiNotice = document.getElementById("api-notice");
    if (apiNotice) {
      apiNotice.style.display = "none";
    }
  }

  updateDateTime();
  setInterval(updateDateTime, 60000); // Update every minute

  // Event listeners
  elements.searchBtn.addEventListener("click", handleSearch);
  elements.cityInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleSearch();
  });

  // Load default city weather
  getWeatherData(DEFAULT_CITY);
}

// Update Date and Time
function updateDateTime() {
  const now = new Date();
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  elements.currentDate.textContent = now.toLocaleDateString("en-US", options);
}

// Handle Search
function handleSearch() {
  const city = elements.cityInput.value.trim();
  if (city) {
    getWeatherData(city);
    elements.cityInput.value = "";
  }
}

// Show/Hide Loading
function showLoading() {
  elements.loading.style.display = "flex";
}

function hideLoading() {
  elements.loading.style.display = "none";
}

// Show Error Message
function showError(message) {
  elements.errorMessage.style.display = "block";
  elements.errorMessage.querySelector("p").textContent = message;
  setTimeout(() => {
    elements.errorMessage.style.display = "none";
  }, 5000);
}

// Get Weather Data
async function getWeatherData(city) {
  showLoading();
  elements.errorMessage.style.display = "none";

  try {
    // Fetch current weather
    const currentWeatherUrl = `${API_BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=metric`;
    const currentResponse = await fetch(currentWeatherUrl);

    if (!currentResponse.ok) {
      throw new Error("City not found");
    }

    const currentData = await currentResponse.json();

    // Fetch forecast data
    const forecastUrl = `${API_BASE_URL}/forecast?q=${city}&appid=${API_KEY}&units=metric`;
    const forecastResponse = await fetch(forecastUrl);
    const forecastData = await forecastResponse.json();

    // Update UI
    updateCurrentWeather(currentData);
    updateHourlyForecast(forecastData);
    updateDailyForecast(forecastData);
    updateBackground(currentData.weather[0].main);

    hideLoading();
  } catch (error) {
    hideLoading();
    showError(
      error.message || "Failed to fetch weather data. Please try again."
    );
    console.error("Error fetching weather data:", error);
  }
}

// Update Current Weather
function updateCurrentWeather(data) {
  const { name, sys, main, weather, wind, visibility, clouds } = data;

  elements.cityName.textContent = `${name}, ${sys.country}`;
  elements.temperature.textContent = Math.round(main.temp);
  elements.weatherDescription.textContent = weather[0].description;
  elements.weatherIcon.textContent = weatherIcons[weather[0].icon] || "☀️";
  elements.feelsLike.textContent = `${Math.round(main.feels_like)}°C`;
  elements.humidity.textContent = `${main.humidity}%`;
  elements.windSpeed.textContent = `${wind.speed} m/s`;
  elements.pressure.textContent = `${main.pressure} hPa`;
  elements.visibility.textContent = `${(visibility / 1000).toFixed(1)} km`;
  elements.cloudiness.textContent = `${clouds.all}%`;
  elements.sunrise.textContent = formatTime(sys.sunrise);
  elements.sunset.textContent = formatTime(sys.sunset);
}

// Update Hourly Forecast
function updateHourlyForecast(data) {
  elements.hourlyForecast.innerHTML = "";

  // Get next 8 three-hour forecasts
  const hourlyData = data.list.slice(0, 8);

  hourlyData.forEach((item) => {
    const time = new Date(item.dt * 1000);
    const temp = Math.round(item.main.temp);
    const icon = weatherIcons[item.weather[0].icon] || "☀️";
    const desc = item.weather[0].description;

    const card = document.createElement("div");
    card.className = "hourly-card";
    card.innerHTML = `
      <div class="hourly-time">${formatHourTime(time)}</div>
      <div class="hourly-icon">${icon}</div>
      <div class="hourly-temp">${temp}°C</div>
      <div class="hourly-desc">${desc}</div>
    `;

    elements.hourlyForecast.appendChild(card);
  });
}

// Update Daily Forecast
function updateDailyForecast(data) {
  elements.dailyForecast.innerHTML = "";

  // Group forecasts by day and get one forecast per day
  const dailyData = {};

  data.list.forEach((item) => {
    const date = new Date(item.dt * 1000);
    const dateKey = date.toDateString();

    if (!dailyData[dateKey]) {
      dailyData[dateKey] = {
        temps: [],
        weather: item.weather[0],
        date: date,
      };
    }

    dailyData[dateKey].temps.push(item.main.temp);
  });

  // Convert to array and take first 5 days
  const days = Object.values(dailyData).slice(0, 5);

  days.forEach((day) => {
    const high = Math.round(Math.max(...day.temps));
    const low = Math.round(Math.min(...day.temps));
    const icon = weatherIcons[day.weather.icon] || "☀️";
    const desc = day.weather.description;

    const card = document.createElement("div");
    card.className = "daily-card";
    card.innerHTML = `
      <div class="daily-date">${formatDayDate(day.date)}</div>
      <div class="daily-icon">${icon}</div>
      <div class="daily-temps">
        <span class="daily-high">${high}°</span>
        <span class="daily-low">${low}°</span>
      </div>
      <div class="daily-desc">${desc}</div>
    `;

    elements.dailyForecast.appendChild(card);
  });
}

// Update Background based on weather
function updateBackground(weatherCondition) {
  const body = document.body;
  const conditions = [
    "clear",
    "clouds",
    "rain",
    "drizzle",
    "thunderstorm",
    "snow",
    "mist",
    "smoke",
    "haze",
    "fog",
  ];

  // Remove all weather classes
  conditions.forEach((condition) => body.classList.remove(condition));

  // Add current weather class
  body.classList.add(weatherCondition.toLowerCase());
}

// Format timestamp to time (HH:MM)
function formatTime(timestamp) {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Format time for hourly forecast
function formatHourTime(date) {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Format date for daily forecast
function formatDayDate(date) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return "Tomorrow";
  } else {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }
}

// Initialize app when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
