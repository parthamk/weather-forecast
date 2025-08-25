// UI Controller - Handles all DOM manipulation and user interactions
class UIController {
  constructor() {
    this.elements = this.initializeElements();
    this.currentView = "5day";
    this.currentTheme = "default";
    this.setupEventListeners();
    this.updateTime();
    this.timeInterval = setInterval(() => this.updateTime(), 1000);
  }

  // Initialize DOM elements
  initializeElements() {
    return {
      // Loading and app containers
      loadingScreen: document.getElementById("loading-screen"),
      app: document.getElementById("app"),

      // Header elements
      cityName: document.getElementById("city-name"),
      changeLocationBtn: document.getElementById("change-location"),
      profilePic: document.getElementById("profile-pic"),

      // Weather notification
      weatherNotification: document.getElementById("weather-notification"),

      // Current weather elements
      weatherCondition: document.getElementById("weather-condition"),
      weatherIcon: document.getElementById("weather-icon"),
      weatherEffects: document.getElementById("weather-effects"),
      currentTemp: document.getElementById("current-temp"),
      currentDate: document.getElementById("current-date"),
      currentTime: document.getElementById("current-time"),

      // Forecast elements
      forecastContainer: document.getElementById("forecast-container"),
      hourlyForecast: document.getElementById("hourly-forecast"),
      hourlyContainer: document.getElementById("hourly-container"),
      toggleBtns: document.querySelectorAll(".toggle-btn"),

      // Weather details
      feelsLike: document.getElementById("feels-like"),
      windSpeed: document.getElementById("wind-speed"),
      humidity: document.getElementById("humidity"),
      uvIndex: document.getElementById("uv-index"),

      // Activities
      activitiesGrid: document.getElementById("activities-grid"),

      // Modal elements
      locationModal: document.getElementById("location-modal"),
      locationSearch: document.getElementById("location-search"),
      searchBtn: document.getElementById("search-btn"),
      closeModal: document.getElementById("close-modal"),
      searchResults: document.getElementById("search-results"),

      // Error modal
      errorModal: document.getElementById("error-modal"),
      errorMessage: document.getElementById("error-message"),
      retryBtn: document.getElementById("retry-btn"),
    };
  }

  // Setup event listeners
  setupEventListeners() {
    // Location change
    this.elements.changeLocationBtn.addEventListener("click", () => {
      this.showLocationModal();
    });

    // Modal close
    this.elements.closeModal.addEventListener("click", () => {
      this.hideLocationModal();
    });

    // Search functionality
    this.elements.searchBtn.addEventListener("click", () => {
      this.performSearch();
    });

    this.elements.locationSearch.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.performSearch();
      }
    });

    this.elements.locationSearch.addEventListener("input", (e) => {
      if (e.target.value.length > 2) {
        this.searchCitiesDebounced(e.target.value);
      } else {
        this.clearSearchResults();
      }
    });

    // Forecast toggle
    this.elements.toggleBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const view = e.target.dataset.view;
        this.switchForecastView(view);
      });
    });

    // Retry button
    this.elements.retryBtn.addEventListener("click", () => {
      this.hideErrorModal();
      if (window.app) {
        window.app.initialize();
      }
    });

    // Modal backdrop clicks
    this.elements.locationModal.addEventListener("click", (e) => {
      if (e.target === this.elements.locationModal) {
        this.hideLocationModal();
      }
    });

    this.elements.errorModal.addEventListener("click", (e) => {
      if (e.target === this.elements.errorModal) {
        this.hideErrorModal();
      }
    });

    // Keyboard accessibility
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.hideLocationModal();
        this.hideErrorModal();
      }
    });
  }

  // Debounced city search
  searchCitiesDebounced = this.debounce(async (query) => {
    try {
      const cities = await weatherAPI.searchCities(query);
      this.displaySearchResults(cities);
    } catch (error) {
      console.error("Search error:", error);
    }
  }, 300);

  // Debounce utility function
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Show loading screen
  showLoading() {
    this.elements.loadingScreen.classList.remove("fade-out");
    this.elements.loadingScreen.style.display = "flex";
  }

  // Hide loading screen
  hideLoading() {
    this.elements.loadingScreen.classList.add("fade-out");
    setTimeout(() => {
      this.elements.loadingScreen.style.display = "none";
    }, 500);
  }

  // Show weather notification
  showNotification(title, message, icon = "fas fa-info-circle") {
    this.elements.weatherNotification.querySelector(
      ".notification-icon"
    ).className = `notification-icon ${icon}`;
    this.elements.weatherNotification.querySelector(
      ".notification-title"
    ).textContent = title;
    this.elements.weatherNotification.querySelector(
      ".notification-message"
    ).textContent = message;
    this.elements.weatherNotification.classList.remove("hidden");

    // Auto-hide after 5 seconds
    setTimeout(() => {
      this.elements.weatherNotification.classList.add("hidden");
    }, 5000);
  }

  // Update current time
  updateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    this.elements.currentTime.textContent = timeString;
  }

  // Update current weather display
  updateCurrentWeather(data) {
    const { current, location } = data;

    // Update location
    this.elements.cityName.textContent = location;

    // Update weather condition and icon
    this.elements.weatherCondition.textContent = current.condition;
    this.elements.weatherIcon.innerHTML = `<i class="${current.icon}"></i>`;

    // Update temperature
    this.elements.currentTemp.textContent = current.temperature;

    // Update date
    const date = new Date();
    const dateString = date.toLocaleDateString("en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    this.elements.currentDate.textContent = dateString;

    // Update weather details
    this.elements.feelsLike.textContent = `${current.feelsLike}°`;
    this.elements.windSpeed.textContent = `${current.windSpeed} km/h`;
    this.elements.humidity.textContent = `${current.humidity}%`;
    this.elements.uvIndex.textContent = current.uvIndex;

    // Update theme
    this.updateTheme(current.theme);

    // Add weather notification based on conditions
    this.addWeatherNotifications(current);
  }

  // Update app theme based on weather
  updateTheme(theme) {
    if (this.currentTheme !== theme) {
      // Remove previous theme
      this.elements.app.classList.remove(this.currentTheme);

      // Add new theme
      this.elements.app.classList.add(theme);
      this.currentTheme = theme;

      // Update weather effects
      this.updateWeatherEffects(theme);
    }
  }

  // Update weather effects animation
  updateWeatherEffects(theme) {
    const effects = this.elements.weatherEffects;
    effects.innerHTML = "";

    switch (theme) {
      case "rainy":
        this.createRainEffect(effects);
        break;
      case "snowy":
        this.createSnowEffect(effects);
        break;
      case "stormy":
        this.createLightningEffect(effects);
        break;
    }
  }

  // Create rain effect
  createRainEffect(container) {
    for (let i = 0; i < 50; i++) {
      const drop = document.createElement("div");
      drop.className = "rain-drop";
      drop.style.cssText = `
                position: absolute;
                width: 2px;
                height: 20px;
                background: rgba(255, 255, 255, 0.6);
                left: ${Math.random() * 100}%;
                animation: rain ${Math.random() * 2 + 1}s linear infinite;
                animation-delay: ${Math.random() * 2}s;
            `;
      container.appendChild(drop);
    }

    // Add rain animation CSS if not already present
    if (!document.getElementById("rain-styles")) {
      const style = document.createElement("style");
      style.id = "rain-styles";
      style.textContent = `
                @keyframes rain {
                    from { transform: translateY(-100px); opacity: 1; }
                    to { transform: translateY(200px); opacity: 0; }
                }
            `;
      document.head.appendChild(style);
    }
  }

  // Create snow effect
  createSnowEffect(container) {
    for (let i = 0; i < 30; i++) {
      const flake = document.createElement("div");
      flake.className = "snow-flake";
      flake.innerHTML = "❄";
      flake.style.cssText = `
                position: absolute;
                color: rgba(255, 255, 255, 0.8);
                left: ${Math.random() * 100}%;
                font-size: ${Math.random() * 10 + 10}px;
                animation: snow ${Math.random() * 3 + 2}s linear infinite;
                animation-delay: ${Math.random() * 2}s;
            `;
      container.appendChild(flake);
    }

    // Add snow animation CSS
    if (!document.getElementById("snow-styles")) {
      const style = document.createElement("style");
      style.id = "snow-styles";
      style.textContent = `
                @keyframes snow {
                    from { transform: translateY(-100px) rotate(0deg); opacity: 1; }
                    to { transform: translateY(200px) rotate(360deg); opacity: 0; }
                }
            `;
      document.head.appendChild(style);
    }
  }

  // Create lightning effect
  createLightningEffect(container) {
    const lightning = document.createElement("div");
    lightning.className = "lightning";
    lightning.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.1);
            animation: lightning 4s infinite;
        `;
    container.appendChild(lightning);

    // Add lightning animation CSS
    if (!document.getElementById("lightning-styles")) {
      const style = document.createElement("style");
      style.id = "lightning-styles";
      style.textContent = `
                @keyframes lightning {
                    0%, 90%, 100% { opacity: 0; }
                    95% { opacity: 1; }
                }
            `;
      document.head.appendChild(style);
    }
  }

  // Add weather-based notifications
  addWeatherNotifications(current) {
    let notification = null;

    if (current.temperature > 30) {
      notification = {
        title: "Hot Weather Alert",
        message: "It's quite hot today! Stay hydrated and wear sunscreen.",
        icon: "fas fa-thermometer-full",
      };
    } else if (current.temperature < 5) {
      notification = {
        title: "Cold Weather Alert",
        message: "Bundle up! It's quite cold outside today.",
        icon: "fas fa-thermometer-empty",
      };
    } else if (current.humidity > 80) {
      notification = {
        title: "High Humidity",
        message: "It might feel more humid than usual today.",
        icon: "fas fa-tint",
      };
    } else if (current.windSpeed > 30) {
      notification = {
        title: "Windy Conditions",
        message: "Strong winds expected. Secure loose objects.",
        icon: "fas fa-wind",
      };
    } else if (current.uvIndex > 7) {
      notification = {
        title: "High UV Index",
        message: "UV levels are high. Wear sunscreen and protective clothing.",
        icon: "fas fa-sun",
      };
    }

    if (notification) {
      setTimeout(() => {
        this.showNotification(
          notification.title,
          notification.message,
          notification.icon
        );
      }, 1000);
    }
  }

  // Update forecast display
  updateForecast(data) {
    this.update5DayForecast(data.daily);
    this.updateHourlyForecast(data.hourly);
  }

  // Update 5-day forecast
  update5DayForecast(dailyData) {
    this.elements.forecastContainer.innerHTML = "";

    dailyData.forEach((day, index) => {
      const dayName =
        index === 0
          ? "Today"
          : day.date.toLocaleDateString("en-US", { weekday: "short" });

      const forecastItem = document.createElement("div");
      forecastItem.className = "forecast-item fade-in";
      forecastItem.style.animationDelay = `${index * 0.1}s`;

      forecastItem.innerHTML = `
                <div class="forecast-day">${dayName}</div>
                <div class="forecast-icon">
                    <i class="${day.icon}"></i>
                </div>
                <div class="forecast-temp">${day.temperature.max}°</div>
                <div class="forecast-temp-range">${day.temperature.min}°</div>
            `;

      this.elements.forecastContainer.appendChild(forecastItem);
    });
  }

  // Update hourly forecast
  updateHourlyForecast(hourlyData) {
    this.elements.hourlyContainer.innerHTML = "";

    hourlyData.slice(0, 12).forEach((hour, index) => {
      const time = hour.time.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      const hourlyItem = document.createElement("div");
      hourlyItem.className = "hourly-item fade-in";
      hourlyItem.style.animationDelay = `${index * 0.05}s`;

      hourlyItem.innerHTML = `
                <div class="hourly-time">${time}</div>
                <div class="hourly-icon">
                    <i class="${hour.icon}"></i>
                </div>
                <div class="hourly-temp">${hour.temperature}°</div>
            `;

      this.elements.hourlyContainer.appendChild(hourlyItem);
    });
  }

  // Switch forecast view
  switchForecastView(view) {
    if (this.currentView === view) return;

    this.currentView = view;

    // Update toggle buttons
    this.elements.toggleBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.view === view);
    });

    // Show/hide forecast containers
    if (view === "hourly") {
      this.elements.forecastContainer.parentElement.classList.add("hidden");
      this.elements.hourlyForecast.classList.remove("hidden");
    } else {
      this.elements.forecastContainer.parentElement.classList.remove("hidden");
      this.elements.hourlyForecast.classList.add("hidden");
    }
  }

  // Update activities
  async updateActivities(theme) {
    try {
      const activities =
        CONFIG.WEATHER_ACTIVITIES[theme] || CONFIG.WEATHER_ACTIVITIES.sunny;
      const images = await weatherAPI.getActivityImages(
        theme,
        activities.length
      );

      this.elements.activitiesGrid.innerHTML = "";

      activities.forEach((activity, index) => {
        const image = images[index] || images[0];

        const activityCard = document.createElement("div");
        activityCard.className = "activity-card fade-in";
        activityCard.style.animationDelay = `${index * 0.1}s`;

        activityCard.innerHTML = `
                    <img class="activity-image" src="${image.url}" alt="${activity.name}" loading="lazy">
                    <div class="activity-info">
                        <div class="activity-distance">${activity.distance}</div>
                        <div class="activity-name">${activity.name}</div>
                    </div>
                `;

        this.elements.activitiesGrid.appendChild(activityCard);
      });
    } catch (error) {
      console.error("Error updating activities:", error);
    }
  }

  // Location modal functions
  showLocationModal() {
    this.elements.locationModal.classList.remove("hidden");
    this.elements.locationSearch.focus();
  }

  hideLocationModal() {
    this.elements.locationModal.classList.add("hidden");
    this.elements.locationSearch.value = "";
    this.clearSearchResults();
  }

  // Search functionality
  async performSearch() {
    const query = this.elements.locationSearch.value.trim();
    if (!query) return;

    try {
      const cities = await weatherAPI.searchCities(query);
      this.displaySearchResults(cities);
    } catch (error) {
      console.error("Search error:", error);
    }
  }

  // Display search results
  displaySearchResults(cities) {
    this.elements.searchResults.innerHTML = "";

    if (cities.length === 0) {
      this.elements.searchResults.innerHTML =
        '<p style="padding: 16px; color: var(--text-secondary);">No cities found</p>';
      return;
    }

    cities.forEach((city) => {
      const resultItem = document.createElement("div");
      resultItem.className = "search-result-item";
      resultItem.style.cssText = `
                padding: 12px 16px;
                cursor: pointer;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                transition: background-color 0.2s ease;
            `;

      resultItem.innerHTML = `
                <div style="font-weight: 500;">${city.name}</div>
                <div style="font-size: 0.9rem; color: var(--text-secondary); margin-top: 2px;">
                    ${city.state ? city.state + ", " : ""}${city.country}
                </div>
            `;

      resultItem.addEventListener("click", () => {
        this.selectCity(city);
      });

      resultItem.addEventListener("mouseenter", () => {
        resultItem.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
      });

      resultItem.addEventListener("mouseleave", () => {
        resultItem.style.backgroundColor = "transparent";
      });

      this.elements.searchResults.appendChild(resultItem);
    });
  }

  // Clear search results
  clearSearchResults() {
    this.elements.searchResults.innerHTML = "";
  }

  // Select city from search results
  selectCity(city) {
    this.hideLocationModal();
    if (window.app) {
      window.app.loadWeatherForLocation(city.lat, city.lon);
    }
  }

  // Error handling
  showError(message) {
    this.elements.errorMessage.textContent = message;
    this.elements.errorModal.classList.remove("hidden");
  }

  hideErrorModal() {
    this.elements.errorModal.classList.add("hidden");
  }

  // Cleanup function
  destroy() {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }

    // Remove event listeners if needed
    // This would be more comprehensive in a real application
  }
}

// Create and export singleton instance
const uiController = new UIController();