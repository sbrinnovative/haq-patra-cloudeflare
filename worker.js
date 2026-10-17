/* Haq Patra: Cloudflare Worker entry.
   Pages are served as static files from public/. Only /api/* runs this code,
   which hands the request to the same handlers in functions/api/. */
import * as analyze from "./functions/api/analyze.js";
import * as translate from "./functions/api/translate.js";

const ROUTES = { "/api/analyze": analyze, "/api/translate": translate };

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const mod = ROUTES[url.pathname];
    if (!mod) {
      if (url.pathname.startsWith("/api/")) return new Response("Not found", { status: 404 });
      return env.ASSETS.fetch(request);
    }
    const context = { request, env, waitUntil: p => ctx.waitUntil(p) };
    if (request.method === "POST" && mod.onRequestPost) return mod.onRequestPost(context);
    if (request.method === "GET" && mod.onRequestGet) return mod.onRequestGet(context);
    return new Response("Method not allowed", { status: 405, headers: { allow: "POST" } });
  }
};
