// Weather API Service
class WeatherAPI {
  constructor() {
    this.cache = new Map();
    this.cacheTimestamp = new Map();
  }

  // Get current position using geolocation
  async getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error(CONFIG.ERROR_MESSAGES.GEOLOCATION_UNAVAILABLE));
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5 * 60 * 1000, // 5 minutes
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        (error) => {
          let errorMessage;
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = CONFIG.ERROR_MESSAGES.GEOLOCATION_DENIED;
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = CONFIG.ERROR_MESSAGES.GEOLOCATION_UNAVAILABLE;
              break;
            case error.TIMEOUT:
              errorMessage = CONFIG.ERROR_MESSAGES.GEOLOCATION_TIMEOUT;
              break;
            default:
              errorMessage = CONFIG.ERROR_MESSAGES.API_ERROR;
          }
          reject(new Error(errorMessage));
        },
        options
      );
    });
  }

  // Check if cached data is still valid
  isCacheValid(key) {
    const timestamp = this.cacheTimestamp.get(key);
    return timestamp && Date.now() - timestamp < CONFIG.CACHE.DURATION;
  }

  // Get cached data if valid
  getCachedData(key) {
    if (this.isCacheValid(key)) {
      return this.cache.get(key);
    }
    return null;
  }

  // Set cache data
  setCacheData(key, data) {
    this.cache.set(key, data);
    this.cacheTimestamp.set(key, Date.now());
  }

  // Make API request with error handling
  async makeAPIRequest(url) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(CONFIG.ERROR_MESSAGES.CITY_NOT_FOUND);
        } else if (response.status === 401) {
          throw new Error("Invalid API key. Please check your configuration.");
        } else {
          throw new Error(`API Error: ${response.status}`);
        }
      }

      return await response.json();
    } catch (error) {
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        throw new Error(CONFIG.ERROR_MESSAGES.NETWORK_ERROR);
      }
      throw error;
    }
  }

  // Get weather data for coordinates
  async getWeatherByCoords(lat, lon) {
    const cacheKey = `weather_${lat}_${lon}`;
    const cachedData = this.getCachedData(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    const url = `${CONFIG.API_ENDPOINTS.OPENWEATHER_ONECALL}?lat=${lat}&lon=${lon}&exclude=minutely,alerts&units=${CONFIG.DEFAULTS.UNITS}&appid=${CONFIG.API_KEYS.OPENWEATHERMAP}`;

    const data = await this.makeAPIRequest(url);

    // Get location name
    const locationName = await this.getLocationName(lat, lon);
    data.locationName = locationName;

    this.setCacheData(cacheKey, data);
    return data;
  }

  // Get location name from coordinates
  async getLocationName(lat, lon) {
    try {
      const url = `${CONFIG.API_ENDPOINTS.OPENWEATHER_GEOCODING}/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${CONFIG.API_KEYS.OPENWEATHERMAP}`;
      const data = await this.makeAPIRequest(url);

      if (data && data.length > 0) {
        const location = data[0];
        return location.name || "Unknown Location";
      }
      return "Unknown Location";
    } catch (error) {
      console.warn("Could not get location name:", error);
      return "Unknown Location";
    }
  }

  // Search for cities
  async searchCities(query) {
    if (!query || query.length < 2) {
      return [];
    }

    try {
      const url = `${
        CONFIG.API_ENDPOINTS.OPENWEATHER_GEOCODING
      }/direct?q=${encodeURIComponent(query)}&limit=5&appid=${
        CONFIG.API_KEYS.OPENWEATHERMAP
      }`;
      const data = await this.makeAPIRequest(url);

      return data.map((city) => ({
        name: city.name,
        country: city.country,
        state: city.state,
        lat: city.lat,
        lon: city.lon,
        displayName: `${city.name}${city.state ? ", " + city.state : ""}, ${
          city.country
        }`,
      }));
    } catch (error) {
      console.error("City search error:", error);
      return [];
    }
  }

  // Get weather data for a city
  async getWeatherByCity(cityName) {
    try {
      // First, get coordinates for the city
      const cities = await this.searchCities(cityName);
      if (cities.length === 0) {
        throw new Error(CONFIG.ERROR_MESSAGES.CITY_NOT_FOUND);
      }

      const city = cities[0];
      return await this.getWeatherByCoords(city.lat, city.lon);
    } catch (error) {
      throw error;
    }
  }

  // Get Unsplash photos for activities
  async getActivityImages(theme, count = 4) {
    const cacheKey = `images_${theme}`;
    const cachedData = this.getCachedData(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    try {
      // Map weather themes to search terms
      const searchTerms = {
        sunny: "outdoor activities sunny day",
        cloudy: "indoor activities museum cafe",
        rainy: "indoor activities cozy cafe",
        stormy: "indoor activities home",
        snowy: "winter activities snow",
        night: "nightlife evening activities",
      };

      const query = searchTerms[theme] || "activities";
      const url = `${
        CONFIG.API_ENDPOINTS.UNSPLASH_BASE
      }/search/photos?query=${encodeURIComponent(
        query
      )}&per_page=${count}&orientation=landscape&client_id=${
        CONFIG.API_KEYS.UNSPLASH
      }`;

      const data = await this.makeAPIRequest(url);

      const images = data.results.map((photo) => ({
        id: photo.id,
        url: photo.urls.small,
        alt: photo.alt_description || "Activity image",
        photographer: photo.user.name,
      }));

      this.setCacheData(cacheKey, images);
      return images;
    } catch (error) {
      console.warn("Could not fetch activity images:", error);
      // Return placeholder images
      return Array(count)
        .fill(null)
        .map((_, index) => ({
          id: `placeholder_${index}`,
          url: `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop`,
          alt: "Activity placeholder",
          photographer: "Unsplash",
        }));
    }
  }

  // Format weather data for UI consumption
  formatWeatherData(data) {
    const current = data.current;
    const weather = current.weather[0];
    const condition =
      CONFIG.WEATHER_CONDITIONS[weather.icon] ||
      CONFIG.WEATHER_CONDITIONS["01d"];

    return {
      location: data.locationName,
      current: {
        temperature: Math.round(current.temp),
        feelsLike: Math.round(current.feels_like),
        condition: condition.name,
        description: weather.description,
        icon: condition.icon,
        theme: condition.theme,
        humidity: current.humidity,
        windSpeed: Math.round(current.wind_speed * 3.6), // Convert m/s to km/h
        uvIndex: Math.round(current.uvi),
        pressure: current.pressure,
        visibility: current.visibility
          ? Math.round(current.visibility / 1000)
          : null,
        timestamp: current.dt,
      },
      hourly: data.hourly.slice(0, 24).map((hour) => {
        const hourWeather = hour.weather[0];
        const hourCondition =
          CONFIG.WEATHER_CONDITIONS[hourWeather.icon] ||
          CONFIG.WEATHER_CONDITIONS["01d"];

        return {
          time: new Date(hour.dt * 1000),
          temperature: Math.round(hour.temp),
          condition: hourCondition.name,
          icon: hourCondition.icon,
          precipitation: Math.round((hour.pop || 0) * 100),
        };
      }),
      daily: data.daily.slice(0, 5).map((day) => {
        const dayWeather = day.weather[0];
        const dayCondition =
          CONFIG.WEATHER_CONDITIONS[dayWeather.icon] ||
          CONFIG.WEATHER_CONDITIONS["01d"];

        return {
          date: new Date(day.dt * 1000),
          temperature: {
            max: Math.round(day.temp.max),
            min: Math.round(day.temp.min),
          },
          condition: dayCondition.name,
          icon: dayCondition.icon,
          precipitation: Math.round((day.pop || 0) * 100),
        };
      }),
    };
  }

  // Clear cache (useful for debugging or forced refresh)
  clearCache() {
    this.cache.clear();
    this.cacheTimestamp.clear();
  }
}

// Create and export singleton instance
const weatherAPI = new WeatherAPI();