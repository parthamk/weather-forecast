// Main Application Controller
class WeatherApp {
  constructor() {
    this.weatherData = null;
    this.currentLocation = null;
    this.isInitialized = false;
  }

  // Initialize the application
  async initialize() {
    try {
      console.log("Initializing Weather App...");

      // Check if APIs are configured
      if (!CONFIG.IS_DEVELOPMENT) {
        throw new Error(
          "API keys not configured. Please check your environment variables."
        );
      }

      // Show loading screen
      uiController.showLoading();

      // Try to get user location
      await this.loadUserLocation();
    } catch (error) {
      console.error("Initialization error:", error);
      uiController.hideLoading();
      uiController.showError(error.message);
    }
  }

  // Load user's current location weather
  async loadUserLocation() {
    try {
      // Try to get cached location first
      const cachedLocation = this.getCachedLocation();

      if (cachedLocation) {
        console.log("Using cached location:", cachedLocation);
        await this.loadWeatherForLocation(
          cachedLocation.lat,
          cachedLocation.lon
        );
      } else {
        console.log("Getting current position...");
        const position = await weatherAPI.getCurrentPosition();
        await this.loadWeatherForLocation(position.lat, position.lon);

        // Cache the location
        this.setCachedLocation(position);
      }
    } catch (error) {
      console.error("Location error:", error);

      // Try to load default location (New York) as fallback
      console.log("Falling back to default location...");
      await this.loadWeatherForLocation(40.7128, -74.006); // New York coordinates
    }
  }

  // Load weather for specific coordinates
  async loadWeatherForLocation(lat, lon) {
    try {
      console.log(`Loading weather for coordinates: ${lat}, ${lon}`);

      // Get weather data
      const rawData = await weatherAPI.getWeatherByCoords(lat, lon);

      // Format the data
      this.weatherData = weatherAPI.formatWeatherData(rawData);
      this.currentLocation = { lat, lon };

      console.log("Weather data loaded:", this.weatherData);

      // Update UI
      await this.updateUI();

      // Cache the successful location
      this.setCachedLocation({ lat, lon });

      // Mark as initialized
      if (!this.isInitialized) {
        this.isInitialized = true;
        uiController.hideLoading();
      }
    } catch (error) {
      console.error("Weather loading error:", error);
      throw error;
    }
  }

  // Load weather for a specific city
  async loadWeatherForCity(cityName) {
    try {
      console.log(`Loading weather for city: ${cityName}`);

      uiController.showLoading();

      const rawData = await weatherAPI.getWeatherByCity(cityName);
      this.weatherData = weatherAPI.formatWeatherData(rawData);

      // Extract coordinates from the response for caching
      this.currentLocation = {
        lat: rawData.lat,
        lon: rawData.lon,
      };

      await this.updateUI();

      // Cache the location
      this.setCachedLocation(this.currentLocation);

      uiController.hideLoading();
    } catch (error) {
      console.error("City weather loading error:", error);
      uiController.hideLoading();
      uiController.showError(error.message);
    }
  }

  // Update all UI components
  async updateUI() {
    if (!this.weatherData) {
      console.error("No weather data to display");
      return;
    }

    try {
      // Update current weather
      uiController.updateCurrentWeather(this.weatherData);

      // Update forecast
      uiController.updateForecast(this.weatherData);

      // Update activities based on current weather theme
      await uiController.updateActivities(this.weatherData.current.theme);

      // Update profile picture based on location
      await this.updateProfilePicture();

      console.log("UI updated successfully");
    } catch (error) {
      console.error("UI update error:", error);
    }
  }

  // Update profile picture based on location
  async updateProfilePicture() {
    try {
      const locationName = this.weatherData.location
        .toLowerCase()
        .replace(/\s+/g, "-");
      const profilePicUrl = `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face&auto=format&q=80`;

      // You could customize this further based on location
      // For now, we'll keep the default profile picture
      // uiController.elements.profilePic.src = profilePicUrl;
    } catch (error) {
      console.warn("Could not update profile picture:", error);
    }
  }

  // Refresh weather data
  async refreshWeather() {
    if (!this.currentLocation) {
      console.error("No current location to refresh");
      return;
    }

    try {
      console.log("Refreshing weather data...");

      // Clear cache to force fresh data
      weatherAPI.clearCache();

      // Reload weather for current location
      await this.loadWeatherForLocation(
        this.currentLocation.lat,
        this.currentLocation.lon
      );

      // Show success notification
      uiController.showNotification(
        "Weather Updated",
        "Weather data has been refreshed successfully.",
        "fas fa-check-circle"
      );
    } catch (error) {
      console.error("Refresh error:", error);
      uiController.showError(
        "Failed to refresh weather data. Please try again."
      );
    }
  }

  // Get cached location from localStorage
  getCachedLocation() {
    try {
      const cached = localStorage.getItem(CONFIG.STORAGE_KEYS.LAST_LOCATION);
      if (cached) {
        const location = JSON.parse(cached);

        // Check if cache is still valid (24 hours)
        const cacheAge = Date.now() - (location.timestamp || 0);
        if (cacheAge < 24 * 60 * 60 * 1000) {
          return location;
        }
      }
    } catch (error) {
      console.warn("Could not get cached location:", error);
    }
    return null;
  }

  // Set cached location in localStorage
  setCachedLocation(location) {
    try {
      const locationData = {
        ...location,
        timestamp: Date.now(),
      };
      localStorage.setItem(
        CONFIG.STORAGE_KEYS.LAST_LOCATION,
        JSON.stringify(locationData)
      );
    } catch (error) {
      console.warn("Could not cache location:", error);
    }
  }

  // Get user preferences
  getUserPreferences() {
    try {
      const units = localStorage.getItem(CONFIG.STORAGE_KEYS.PREFERRED_UNITS);
      return {
        units: units || CONFIG.DEFAULTS.UNITS,
      };
    } catch (error) {
      return { units: CONFIG.DEFAULTS.UNITS };
    }
  }

  // Set user preferences
  setUserPreferences(preferences) {
    try {
      if (preferences.units) {
        localStorage.setItem(
          CONFIG.STORAGE_KEYS.PREFERRED_UNITS,
          preferences.units
        );
      }
    } catch (error) {
      console.warn("Could not save preferences:", error);
    }
  }

  // Handle app visibility change (for data refresh)
  handleVisibilityChange() {
    if (document.visibilityState === "visible") {
      // Check if we need to refresh data (if more than 10 minutes old)
      const lastUpdate = this.weatherData?.current?.timestamp || 0;
      const timeSinceUpdate = Date.now() - lastUpdate * 1000;

      if (timeSinceUpdate > CONFIG.CACHE.DURATION) {
        console.log("App became visible, refreshing weather data...");
        this.refreshWeather();
      }
    }
  }

  // Handle online/offline status
  handleConnectionChange() {
    if (navigator.onLine) {
      console.log("Connection restored, refreshing weather data...");
      uiController.showNotification(
        "Connection Restored",
        "Refreshing weather data...",
        "fas fa-wifi"
      );
      this.refreshWeather();
    } else {
      uiController.showNotification(
        "No Internet Connection",
        "Weather data may not be up to date.",
        "fas fa-wifi"
      );
    }
  }

  // Setup additional event listeners
  setupGlobalEventListeners() {
    // App visibility change
    document.addEventListener("visibilitychange", () => {
      this.handleVisibilityChange();
    });

    // Online/offline status
    window.addEventListener("online", () => {
      this.handleConnectionChange();
    });

    window.addEventListener("offline", () => {
      this.handleConnectionChange();
    });

    // Handle page refresh
    window.addEventListener("beforeunload", () => {
      // Clear any pending timeouts or intervals
      if (uiController.timeInterval) {
        clearInterval(uiController.timeInterval);
      }
    });
  }

  // Start the application
  start() {
    console.log("Starting Weather App...");

    // Setup global event listeners
    this.setupGlobalEventListeners();

    // Initialize the app
    this.initialize();
  }

  // Cleanup function
  destroy() {
    if (uiController) {
      uiController.destroy();
    }

    // Clear any cached data
    weatherAPI.clearCache();

    console.log("Weather App destroyed");
  }
}

// Initialize and start the application when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded, initializing Weather App...");

  // Create global app instance
  window.app = new WeatherApp();

  // Start the application
  window.app.start();
});

// Handle service worker registration (for future PWA features)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("SW registered: ", registration);
      })
      .catch((registrationError) => {
        console.log("SW registration failed: ", registrationError);
      });
  });
}