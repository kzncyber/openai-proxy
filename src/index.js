export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(env) });
    }

    if (url.pathname === "/chat" && request.method === "POST") {
      try {
        const body = await request.json();
        const payload = {
          model: body.model || "gpt-4o-mini",
          messages: body.messages || [{ role: "user", content: "Hello" }],
          temperature: body.temperature ?? 0.3,
          max_tokens: body.max_tokens,
          stream: body.stream || false,
        };

        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        // Stream対応：そのままOpenAIのストリームを中継
        if (payload.stream) {
          return new Response(res.body, { status: res.status, headers: streamHeaders(env) });
        }

        const data = await res.text();
        return new Response(data, { status: res.status, headers: jsonHeaders(env) });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: jsonHeaders(env) });
      }
    }

    // Health check / ルート
    if (url.pathname === "/") {
      const msg = "OpenAI proxy is running. POST /chat";
      return new Response(msg, { status: 200, headers: corsHeaders(env) });
    }

    return new Response("Not found", { status: 404, headers: corsHeaders(env) });
  }
}

function corsHeaders(env) {
  return {
    "Access-Control-Allow-Origin": env.ALLOW_ORIGIN || "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}
function jsonHeaders(env) {
  return { "Content-Type": "application/json; charset=utf-8", ...corsHeaders(env) };
}
function streamHeaders(env) {
  return { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache", ...corsHeaders(env) };
}
