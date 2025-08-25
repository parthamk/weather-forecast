class WeatherApp {
  constructor() {
    this.currentLocation = { lat: null, lon: null };
    this.currentCity = "";
    this.weatherData = null;
    this.backgroundImages = {};

    this.init();
  }

  init() {
    this.bindEvents();
    this.updateTime();
    this.getLocationAndWeather();

    // Update time every second
    setInterval(() => this.updateTime(), 1000);
  }

  bindEvents() {
    const locationInfo = document.querySelector(".location-info");
    locationInfo.addEventListener("click", () => this.openSearchModal());

    const searchClose = document.getElementById("search-close");
    searchClose.addEventListener("click", () => this.closeSearchModal());

    const searchInput = document.getElementById("search-input");
    searchInput.addEventListener("input", (e) =>
      this.handleSearchInput(e.target.value)
    );
  }

  updateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    const dateString = now.toLocaleDateString("en-US", {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    document.getElementById("current-time").textContent = timeString + " GMT";
    document.getElementById("current-date").textContent = dateString;
  }

  async getLocationAndWeather() {
    this.showLoading(true);

    try {
      // Get user's location
      const position = await this.getCurrentPosition();
      this.currentLocation = {
        lat: position.coords.latitude,
        lon: position.coords.longitude,
      };

      // Fetch weather data
      await this.fetchWeatherData();
    } catch (error) {
      console.error("Error getting location or weather:", error);
      // Fallback to default location (New York)
      this.currentLocation = { lat: 40.7128, lon: -74.006 };
      this.currentCity = "New York";
      await this.fetchWeatherData();
    } finally {
      this.showLoading(false);
    }
  }

  getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 10000,
        enableHighAccuracy: true,
      });
    });
  }

  async fetchWeatherData() {
    try {
      // Fetch from our Netlify function (which will handle API keys securely)
      const response = await fetch(
        `/.netlify/functions/weather?lat=${this.currentLocation.lat}&lon=${this.currentLocation.lon}`
      );

      if (!response.ok) {
        throw new Error("Weather API request failed");
      }

      const data = await response.json();
      this.weatherData = data;

      // Get city name from reverse geocoding
      await this.getCityName();

      // Update UI
      this.updateWeatherDisplay();
      this.updateBackgroundImage();
    } catch (error) {
      console.error("Error fetching weather data:", error);
      this.showError("Unable to fetch weather data");
    }
  }

  async getCityName() {
    try {
      const response = await fetch(
        `/.netlify/functions/geocoding?lat=${this.currentLocation.lat}&lon=${this.currentLocation.lon}`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        this.currentCity = data[0].name || "Unknown Location";
      }
    } catch (error) {
      console.error("Error getting city name:", error);
      this.currentCity = "Unknown Location";
    }
  }

  updateWeatherDisplay() {
    if (!this.weatherData) return;

    const current = this.weatherData.current;
    const daily = this.weatherData.daily;
    const hourly = this.weatherData.hourly;

    // Update location
    document.getElementById("location-name").textContent = this.currentCity;

    // Update current weather
    document.getElementById("weather-condition").textContent =
      this.capitalizeWords(current.weather[0].description);
    document.getElementById("current-temp").textContent = `${Math.round(
      current.temp
    )}°C`;
    document.getElementById(
      "main-weather-icon"
    ).src = `https://openweathermap.org/img/wn/${current.weather[0].icon}@4x.png`;

    // Update air conditions
    document.getElementById("feels-like").textContent = `${Math.round(
      current.feels_like
    )}°`;
    document.getElementById("wind-speed").textContent = `${(
      current.wind_speed * 3.6
    ).toFixed(1)} km/hr`;
    document.getElementById("rain-chance").textContent = `${Math.round(
      (hourly[0].pop || 0) * 100
    )}%`;
    document.getElementById("uv-index").textContent = Math.round(
      current.uvi || 0
    );

    // Update weekly forecast
    this.updateWeeklyForecast(daily);

    // Update hourly forecast
    this.updateHourlyForecast(hourly);

    // Set weather theme
    this.setWeatherTheme(current.weather[0].main.toLowerCase());
  }

  updateWeeklyForecast(daily) {
    const forecastContainer = document.getElementById("forecast-days");
    const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

    forecastContainer.innerHTML = daily
      .slice(0, 6)
      .map((day, index) => {
        const date = new Date(day.dt * 1000);
        const dayName = index === 0 ? "TODAY" : days[date.getDay()];
        const isActive = index === 0 ? "active" : "";

        return `
                <div class="forecast-day ${isActive}">
                    <div class="day">${dayName}</div>
                    <img src="https://openweathermap.org/img/wn/${
                      day.weather[0].icon
                    }@2x.png" 
                         alt="${
                           day.weather[0].description
                         }" class="forecast-icon">
                    <div class="temp">${Math.round(day.temp.max)}°</div>
                </div>
            `;
      })
      .join("");
  }

  updateHourlyForecast(hourly) {
    const hourlyContainer = document.getElementById("hourly-chart");

    const hourlyItems = hourly
      .slice(0, 8)
      .map((hour) => {
        const time = new Date(hour.dt * 1000);
        const timeString =
          time.getHours() === 0
            ? "00:00"
            : `${time.getHours().toString().padStart(2, "0")}:00`;

        return `
                <div class="hourly-item">
                    <div class="hourly-temp">${Math.round(hour.temp)}°</div>
                    <img src="https://openweathermap.org/img/wn/${
                      hour.weather[0].icon
                    }.png" 
                         alt="${
                           hour.weather[0].description
                         }" class="hourly-icon">
                    <div class="hourly-wind">${Math.round(
                      hour.wind_speed * 3.6
                    )}km/h</div>
                    <div class="hourly-time">${timeString}</div>
                </div>
            `;
      })
      .join("");

    hourlyContainer.innerHTML = `<div class="hourly-items">${hourlyItems}</div>`;
  }

  async updateBackgroundImage() {
    const weatherCondition =
      this.weatherData.current.weather[0].main.toLowerCase();
    const timeOfDay = this.isDay() ? "day" : "night";

    try {
      const response = await fetch(
        `/.netlify/functions/background-image?weather=${weatherCondition}&time=${timeOfDay}&city=${this.currentCity}`
      );
      const data = await response.json();

      if (data.imageUrl) {
        const container = document.getElementById("app-container");
        container.style.backgroundImage = `url(${data.imageUrl})`;

        // Optionally update user avatar with a weather-related image
        const avatar = document.getElementById("user-avatar");
        if (data.avatarUrl) {
          avatar.src = data.avatarUrl;
        }
      }
    } catch (error) {
      console.error("Error updating background image:", error);
    }
  }

  setWeatherTheme(weatherType) {
    const container = document.getElementById("app-container");
    const overlay = document.querySelector(".background-overlay");

    // Remove existing theme classes
    container.classList.remove("sunny", "rainy", "cloudy", "snowy");

    // Map weather conditions to themes
    const themeMap = {
      clear: "sunny",
      rain: "rainy",
      drizzle: "rainy",
      thunderstorm: "rainy",
      snow: "snowy",
      clouds: "cloudy",
      mist: "cloudy",
      fog: "cloudy",
    };

    const theme = themeMap[weatherType] || "cloudy";
    container.classList.add(theme);

    // Update overlay gradient based on theme
    const gradients = {
      sunny:
        "linear-gradient(135deg, rgba(240, 147, 251, 0.8) 0%, rgba(245, 87, 108, 0.8) 50%, rgba(79, 172, 254, 0.8) 100%)",
      rainy:
        "linear-gradient(135deg, rgba(102, 126, 234, 0.8) 0%, rgba(118, 75, 162, 0.8) 100%)",
      cloudy:
        "linear-gradient(135deg, rgba(255, 234, 167, 0.8) 0%, rgba(250, 177, 160, 0.8) 50%, rgba(253, 121, 168, 0.8) 100%)",
      snowy:
        "linear-gradient(135deg, rgba(168, 237, 234, 0.8) 0%, rgba(254, 214, 227, 0.8) 100%)",
    };

    overlay.style.background = gradients[theme];
  }

  isDay() {
    const current = this.weatherData?.current;
    if (!current) return true;

    const now = Date.now() / 1000;
    return now >= current.sunrise && now <= current.sunset;
  }

  openSearchModal() {
    document.getElementById("search-modal").style.display = "flex";
    document.getElementById("search-input").focus();
  }

  closeSearchModal() {
    document.getElementById("search-modal").style.display = "none";
    document.getElementById("search-input").value = "";
    document.getElementById("search-results").innerHTML = "";
  }

  async handleSearchInput(query) {
    if (query.length < 3) {
      document.getElementById("search-results").innerHTML = "";
      return;
    }

    try {
      const response = await fetch(
        `/.netlify/functions/search-cities?q=${encodeURIComponent(query)}`
      );
      const cities = await response.json();

      const resultsHtml = cities
        .slice(0, 5)
        .map((city) => (
          <div
            class="search-result-item"
            onclick="app.selectCity('${city.name}', ${city.lat}, ${city.lon})"
          >
            {" "}
            <i class="fas fa-map-marker-alt"></i>{" "}
            <span>
              ${city.name}, ${city.country}
            </span>{" "}
          </div>
        ))
        .join("");
      document.getElementById("search-results").innerHTML = resultsHtml;
    } catch (error) {
      console.error("Error searching cities:", error);
    }
  }

  async selectCity(cityName, lat, lon) {
    this.currentLocation = { lat, lon };
    this.currentCity = cityName;
    this.closeSearchModal();
    this.showLoading(true);

    await this.fetchWeatherData();
    this.showLoading(false);
  }

  showLoading(show) {
    const loadingScreen = document.getElementById("loading-screen");
    loadingScreen.style.display = show ? "flex" : "none";
  }

  showError(message) {
    // You can implement a toast notification system here
    console.error(message);
  }

  capitalizeWords(str) {
    return str.replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  }
}
// Global functions
function toggleExtendedForecast() {
  // Implementation for showing 5-day detailed forecast
  alert("5-day forecast feature coming soon!");
}
// Initialize the app
let app;
document.addEventListener("DOMContentLoaded", () => {
  app = new WeatherApp();
});
