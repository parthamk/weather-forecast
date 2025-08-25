exports.handler = async (event, context) => {
  const { q } = event.queryStringParameters;

  if (!q || q.length < 2) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Query too short" }),
    };
  }

  const API_KEY = process.env.OPENWEATHER_API_KEY;

  try {
    const response = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
        q
      )}&limit=10&appid=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Search API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error("City Search API Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to search cities" }),
    };
  }
};
