window.CONFIG = window.CONFIG;
// Configuration for API keys and settings
const CONFIG = {
  // These will be loaded from environment variables in production
  API_KEYS: {
    OPENWEATHERMAP:
      process.env.OPENWEATHERMAP_API_KEY || "6432b1f236f8fa1c0c6d742cab46ed41",
    UNSPLASH:
      process.env.UNSPLASH_ACCESS_KEY ||
      "bn9FqstnBj9bL2n_ZnO8uiIr7fpTUgJCDrKNag2Giys",
  },

  // API endpoints
  API_ENDPOINTS: {
    OPENWEATHER_BASE: "https://api.openweathermap.org/data/2.5",
    OPENWEATHER_ONECALL: "https://api.openweathermap.org/data/3.0/onecall",
    OPENWEATHER_GEOCODING: "https://api.openweathermap.org/geo/1.0",
    UNSPLASH_BASE: "https://api.unsplash.com",
  },

  // Default settings
  DEFAULTS: {
    UNITS: "metric", // metric, imperial, standard
    LANGUAGE: "en",
    FORECAST_DAYS: 5,
    HOURLY_HOURS: 24,
  },

  // Weather condition mappings for themes and icons
  WEATHER_CONDITIONS: {
    // Clear sky
    "01d": { theme: "sunny", icon: "fas fa-sun", name: "Clear Sky" },
    "01n": { theme: "night", icon: "fas fa-moon", name: "Clear Night" },

    // Few clouds
    "02d": { theme: "cloudy", icon: "fas fa-cloud-sun", name: "Partly Cloudy" },
    "02n": {
      theme: "night",
      icon: "fas fa-cloud-moon",
      name: "Partly Cloudy Night",
    },

    // Scattered clouds
    "03d": { theme: "cloudy", icon: "fas fa-cloud", name: "Scattered Clouds" },
    "03n": { theme: "cloudy", icon: "fas fa-cloud", name: "Scattered Clouds" },

    // Broken clouds
    "04d": { theme: "cloudy", icon: "fas fa-cloud", name: "Broken Clouds" },
    "04n": { theme: "cloudy", icon: "fas fa-cloud", name: "Broken Clouds" },

    // Shower rain
    "09d": { theme: "rainy", icon: "fas fa-cloud-rain", name: "Shower Rain" },
    "09n": { theme: "rainy", icon: "fas fa-cloud-rain", name: "Shower Rain" },

    // Rain
    "10d": { theme: "rainy", icon: "fas fa-cloud-rain", name: "Rain" },
    "10n": { theme: "rainy", icon: "fas fa-cloud-rain", name: "Rain" },

    // Thunderstorm
    "11d": { theme: "stormy", icon: "fas fa-bolt", name: "Thunderstorm" },
    "11n": { theme: "stormy", icon: "fas fa-bolt", name: "Thunderstorm" },

    // Snow
    "13d": { theme: "snowy", icon: "fas fa-snowflake", name: "Snow" },
    "13n": { theme: "snowy", icon: "fas fa-snowflake", name: "Snow" },

    // Mist/Fog
    "50d": { theme: "cloudy", icon: "fas fa-smog", name: "Mist" },
    "50n": { theme: "cloudy", icon: "fas fa-smog", name: "Mist" },
  },

  // Activity suggestions based on weather
  WEATHER_ACTIVITIES: {
    sunny: [
      { name: "Beach", distance: "2km away", image: "beach" },
      { name: "Park", distance: "1.5km away", image: "park" },
      { name: "Outdoor Sports", distance: "3km away", image: "sports" },
      { name: "Hiking Trail", distance: "5km away", image: "hiking" },
    ],
    cloudy: [
      { name: "Museum", distance: "2km away", image: "museum" },
      { name: "Shopping Mall", distance: "1km away", image: "shopping" },
      { name: "Cafe", distance: "500m away", image: "cafe" },
      { name: "Art Gallery", distance: "1.5km away", image: "gallery" },
    ],
    rainy: [
      { name: "Indoor Gym", distance: "1km away", image: "gym" },
      { name: "Movie Theater", distance: "2km away", image: "cinema" },
      { name: "Library", distance: "800m away", image: "library" },
      { name: "Spa Center", distance: "1.5km away", image: "spa" },
    ],
    stormy: [
      { name: "Home Activities", distance: "At home", image: "home" },
      { name: "Board Game Cafe", distance: "1km away", image: "games" },
      { name: "Indoor Market", distance: "2km away", image: "market" },
      { name: "Coworking Space", distance: "1.5km away", image: "coworking" },
    ],
    snowy: [
      { name: "Ski Resort", distance: "15km away", image: "ski" },
      { name: "Hot Chocolate Cafe", distance: "500m away", image: "cafe" },
      { name: "Indoor Activities", distance: "1km away", image: "indoor" },
      { name: "Winter Market", distance: "2km away", image: "market" },
    ],
    night: [
      { name: "Night Market", distance: "2km away", image: "market" },
      { name: "Observatory", distance: "10km away", image: "stars" },
      { name: "Night Cafe", distance: "1km away", image: "cafe" },
      { name: "Evening Walk", distance: "500m away", image: "walk" },
    ],
  },

  // Error messages
  ERROR_MESSAGES: {
    GEOLOCATION_DENIED:
      "Location access denied. Please enable location services.",
    GEOLOCATION_UNAVAILABLE: "Location service unavailable.",
    GEOLOCATION_TIMEOUT: "Location request timed out.",
    API_ERROR: "Unable to fetch weather data. Please check your connection.",
    CITY_NOT_FOUND: "City not found. Please try a different search.",
    NETWORK_ERROR: "Network error. Please check your internet connection.",
  },

  // Local storage keys
  STORAGE_KEYS: {
    LAST_LOCATION: "weather_last_location",
    PREFERRED_UNITS: "weather_preferred_units",
    CACHED_WEATHER: "weather_cached_data",
    CACHE_TIMESTAMP: "weather_cache_timestamp",
  },

  // Cache settings
  CACHE: {
    DURATION: 10 * 60 * 1000, // 10 minutes in milliseconds
    MAX_AGE: 30 * 60 * 1000, // 30 minutes max age
  },
};

// Check if we're in development mode
CONFIG.IS_DEVELOPMENT = !CONFIG.API_KEYS.OPENWEATHERMAP.includes('your-') && 
                       !CONFIG.API_KEYS.UNSPLASH.includes('your-');

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}