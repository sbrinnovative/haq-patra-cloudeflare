/* Haq Patra: POST /api/translate
   Translates the site's fixed rule text (never the user's personal details) from English into an Indian language
   with the free IndicTrans2 model on Cloudflare Workers AI. Results are cached at the edge to save the free allowance. */

const CODES = { hi: "hin_Deva", mr: "mar_Deva", bn: "ben_Beng", ta: "tam_Taml", te: "tel_Telu", gu: "guj_Gujr", kn: "kan_Knda", ml: "mal_Mlym", pa: "pan_Guru", or: "ory_Orya", as: "asm_Beng" };
const MODEL = "@cf/ai4bharat/indictrans2-en-indic-1B";

function json(obj, status, extra) {
  return new Response(JSON.stringify(obj), { status: status || 200, headers: Object.assign({ "content-type": "application/json; charset=utf-8" }, extra || {}) });
}
async function sha(s) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, "0")).join("");
}
function outList(r) {
  if (!r) return null;
  const t = r.translations || (r.result && r.result.translations);
  if (Array.isArray(t)) return t.map(x => typeof x === "string" ? x : (x && (x.translation || x.text)) || "");
  if (typeof r.translated_text === "string") return [r.translated_text];
  return null;
}

export async function onRequestPost({ request, env, waitUntil }) {
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(request.url).host) return json({ ok: false, error: "origin" }, 403);
  if (!env.AI) return json({ ok: false, error: "ai_not_configured" }, 503);
  let body;
  try { body = await request.json(); } catch (e) { return json({ ok: false, error: "bad_json" }, 400); }
  const target = CODES[body.target];
  const texts = Array.isArray(body.texts) ? body.texts.slice(0, 60).map(x => String(x || "").slice(0, 700)) : [];
  if (!target || !texts.length) return json({ ok: false, error: "bad_input" }, 400);
  if (texts.join("").length > 12000) return json({ ok: false, error: "too_long" }, 413);

  const key = new Request("https://cache.haqpatra/translate/" + body.target + "/" + (await sha(JSON.stringify(texts))));
  const cache = caches.default;
  const hit = await cache.match(key);
  if (hit) return hit;

  const out = new Array(texts.length).fill("");
  const todo = [];
  texts.forEach((t, i) => { if (t.trim()) todo.push(i); });
  try {
    let list = null;
    try { list = outList(await env.AI.run(MODEL, { text: todo.map(i => texts[i]), target_language: target })); } catch (e) { list = null; }
    if (list && list.length === todo.length) todo.forEach((i, k) => { out[i] = list[k]; });
    else {
      for (const i of todo) {
        const r = outList(await env.AI.run(MODEL, { text: texts[i], target_language: target }));
        out[i] = (r && r[0]) || texts[i];
      }
    }
  } catch (e) {
    const msg = String(e && e.message || e);
    return json({ ok: false, error: /limit|quota|neuron|429/i.test(msg) ? "quota" : "ai_failed" }, 503);
  }
  const res = json({ ok: true, translations: out.map(s => String(s).replace(/[\u2014\u2013]/g, ",")) }, 200, { "cache-control": "public, max-age=2592000" });
  const p = cache.put(key, res.clone());
  if (waitUntil) waitUntil(p);
  return res;
}
