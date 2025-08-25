exports.handler = async (event, context) => {
  const { weather, time, city } = event.queryStringParameters;

  const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

  if (!UNSPLASH_ACCESS_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Unsplash API key not configured" }),
    };
  }

  try {
    // Create search query based on weather and time
    const searchQueries = {
      sunny: time === "day" ? "sunny clear sky blue" : "clear night stars",
      rainy: "rain storm clouds dark",
      cloudy: "cloudy overcast sky",
      snowy: "snow winter landscape",
    };

    const query = searchQueries[weather] || "weather landscape";

    const response = await fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(
        query
      )}&orientation=landscape&w=1920&h=1080`,
      {
        headers: {
          Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`);
    }

    const data = await response.json();

    // Also get a user avatar (optional)
    const avatarResponse = await fetch(
      `https://api.unsplash.com/photos/random?query=portrait&orientation=square&w=80&h=80`,
      {
        headers: {
          Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      }
    );

    let avatarUrl = "https://via.placeholder.com/40";
    if (avatarResponse.ok) {
      const avatarData = await avatarResponse.json();
      avatarUrl = avatarData.urls.small;
    }

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageUrl: data.urls.full,
        avatarUrl: avatarUrl,
        photographer: data.user.name,
        photographerUrl: data.user.links.html,
      }),
    };
  } catch (error) {
    console.error("Unsplash API Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch background image" }),
    };
  }
};
