// src/index.js
const VERSION = "2025-09-02";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(env) });
    }

    // Chat relay (POST /chat)
    if (url.pathname === "/chat") {
      if (request.method !== "POST") {
        return new Response(JSON.stringify({ error: "Use POST /chat" }), {
          status: 405,
          headers: jsonHeaders(env),
        });
      }

      try {
        const body = await request.json();
        const payload = {
          model: body.model ?? "gpt-4o-mini",
          messages: body.messages ?? [{ role: "user", content: "Hello" }],
          temperature: body.temperature ?? 0.3,
          max_tokens: body.max_tokens,
          stream: body.stream ?? false,
        };

        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        // stream中継
        if (payload.stream) {
          return new Response(res.body, {
            status: res.status,
            headers: streamHeaders(env),
          });
        }

        const data = await res.text(); // そのまま中継
        return new Response(data, {
          status: res.status,
          headers: jsonHeaders(env),
        });
      } catch (e) {
        return new Response(
          JSON.stringify({ error: String(e?.message ?? e) }),
          { status: 500, headers: jsonHeaders(env) }
        );
      }
    }

    // JSONステータス (GET /status)
    if (url.pathname === "/status") {
      const allow = env.ALLOW_ORIGIN || "*";
      const ok = Boolean(env.OPENAI_API_KEY);
      return new Response(
        JSON.stringify({
          ok,
          name: "openai-proxy",
          version: VERSION,
          allow_origin: allow,
          endpoints: ["/chat (POST)", "/status (GET)"],
          default_model: "gpt-4o-mini",
        }),
        { status: 200, headers: jsonHeaders(env) }
      );
    }

    // HTMLトップページ (GET /)
    if (url.pathname === "/" || url.pathname === "/index.html") {
      const allow = env.ALLOW_ORIGIN || "*";
      const html = `<!doctype html>
<html lang="ja">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>OpenAI Proxy</title>
<style>
  body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Inter,Helvetica,Arial,sans-serif;margin:40px;line-height:1.6;color:#0b1220}
  code{background:#f2f4f8;padding:2px 6px;border-radius:6px}
  .badge{display:inline-block;background:#e6f4ff;color:#0958d9;border:1px solid #91caff;padding:2px 8px;border-radius:999px;font-size:12px;margin-left:8px}
  ul{padding-left:1.2em}
</style>
<h1>OpenAI Proxy <span class="badge">ready</span></h1>
<p>このWorkerは OpenAI API へのプロキシです。</p>
<ul>
  <li><code>POST /chat</code> … Chat Completions を中継</li>
  <li><code>GET  /status</code> … 稼働状況（JSON）</li>
</ul>
<p>許可オリジン: <code>${escapeHtml(allow)}</code></p>
<p>デフォルトモデル: <code>gpt-4o-mini</code></p>
<p>更新日時: <code>${VERSION}</code></p>`;
      return new Response(html, { status: 200, headers: htmlHeaders() });
    }

    // 404
    return new Response("Not found", { status: 404, headers: corsHeaders(env) });
  },
};

// ---- helpers ----
function corsHeaders(env) {
  return {
    "Access-Control-Allow-Origin": env.ALLOW_ORIGIN || "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}
function jsonHeaders(env) {
  return {
    "Content-Type": "application/json; charset=utf-8",
    ...corsHeaders(env),
  };
}
function streamHeaders(env) {
  return {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache",
    ...corsHeaders(env),
  };
}
function htmlHeaders() {
  return { "Content-Type": "text/html; charset=utf-8" };
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}
