// netlify/functions/proxy.js
export async function handler(event) {
  // Handle preflight CORS
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: "",
    };
  }

  try {
    const body = JSON.parse(event.body);

    const response = await fetch(
      "https://publicdata.kl.dfki.de/public/elasticsearchKaiserslauternPublicRead.php",
      {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=UTF-8" },
        body: JSON.stringify(body),
      }
    );

    const raw = await response.text();
    let data, statusCode, isJson;
    try {
      data = JSON.parse(raw);
      isJson = true;
    } catch (jsonErr) {
      // Not JSON, return as plain text
      data = raw;
      isJson = false;
    }
    statusCode = data.status || 200;

    return {
      statusCode,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": isJson ? "application/json" : "text/plain",
      },
      body: typeof data === "string" ? data : JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ error: err.message }),
    };
  }
}
