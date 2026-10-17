#!/usr/bin/env python3
"""Build Haq Patra.

Reads   maintenance/raw/*.json (verified contacts) and maintenance/content.py (guides)
Writes  public/assets/contacts.js, public/assets/site.js, public/guides/*, public/privacy.html,
        public/404.html, public/robots.txt, public/sitemap.xml, public/ads.txt (only with an AdSense ID)
        and preview/ (a copy for the claude.ai preview, where index.html is a fragment).

Run:    python3 build.py
Settings are the four constants below. Nothing else needs editing for a normal update.
"""
import json, re, shutil, html, sys
from pathlib import Path

SITE_URL = "https://haqpatra.pages.dev"   # change to the real domain when it is bought
ADSENSE_CLIENT = ""                       # e.g. "ca-pub-1234567890123456"
ADSENSE_SLOT = ""                         # one responsive display ad unit id, e.g. "1234567890"
CONTACT_EMAIL = ""                        # the site's Gmail, shown in the footer and privacy page

ROOT = Path(__file__).parent
PUB = ROOT / "public"
RAW = ROOT / "maintenance" / "raw"
sys.path.insert(0, str(ROOT / "maintenance"))
import content as C  # noqa: E402

def load(name): return json.loads((RAW / name).read_text(encoding="utf-8"))

# ---------- contacts ----------
def first_checked(rec):
    if rec.get("checked"): return rec["checked"]
    for s in rec.get("sources") or []:
        if s.get("checked"): return s["checked"]
    return None

def compile_contacts():
    ins = load("insurers_gro.json"); banks = load("banks_pno.json"); offs = load("ombudsman_offices.json"); oth = load("other_contacts.json")
    out = {"checked": ins.get("checked") or "2026-10-16", "insurers": [], "banks": [], "upi": [], "offices": [], "national": {}}
    for x in ins["insurers"]:
        g = x.get("gro") or {}
        out["insurers"].append({
            "id": x["id"], "name": x["name"], "aliases": x.get("aliases") or [], "type": x.get("type"),
            "gro": {k: g.get(k) for k in ("name", "email", "officer_email", "phone", "address")},
            "emails": x.get("grievance_emails") or [], "tollFree": x.get("toll_free") or [],
            "page": x.get("grievance_page_url"), "form": x.get("online_grievance_form"),
            "notes": None, "checked": first_checked(x)})
    def bank_rec(x, upi=False):
        p = x.get("principal_nodal_officer") or x.get("nodal_officer") or {}
        if upi and not p.get("name") and x.get("nodal_officer"): p = x["nodal_officer"]
        esc = [e for e in (x.get("escalation") or []) if isinstance(e, dict) and e.get("value")]
        return {"id": x["id"], "name": x["name"], "aliases": x.get("aliases") or [], "status": x.get("status", "active"),
                "care": x.get("customer_care") or [], "portal": x.get("complaint_portal_url") or x.get("level2_url"),
                "level2": x.get("nodal_officer_url") if upi else None,
                "pno": {"name": p.get("name"), "email": p.get("email"), "phone": p.get("phone"), "address": p.get("address") or x.get("address")},
                "esc": [{"channel": e.get("channel") or "", "value": e["value"]} for e in esc][:4],
                "notes": x.get("notes") if x.get("status") == "in_liquidation" or upi else None,
                "checked": first_checked(x)}
    for x in banks["banks"]: out["banks"].append(bank_rec(x))
    for x in banks.get("upi_apps") or []: out["upi"].append(bank_rec(x, True))
    for o in offs["offices"]:
        j = o.get("jurisdiction") or {}
        part = j.get("partial") or {}
        if isinstance(part, list): part = {s: [] for s in part}
        exc = j.get("exclusions") or {}
        if isinstance(exc, list): exc = {s: [] for s in exc}
        out["offices"].append({"id": o["id"], "city": o["city"], "ombudsman": o.get("ombudsman"), "address": o.get("address"),
                               "phones": o.get("phones") or [], "email": o.get("email"),
                               "j": {"states": j.get("states_uts") or [], "partial": part, "exclusions": exc},
                               "checked": o.get("checked")})
    byid = {c["id"]: c for c in oth["contacts"]}
    def ck(c): return first_checked(c)
    bb = byid.get("irdai_bima_bharosa", {}); io = byid.get("insurance_ombudsman_online", {}); rb = byid.get("rbi_cms", {})
    cy = byid.get("cyber_1930", {}); np_ = byid.get("npci_upi_dispute", {}); nch = byid.get("nch", {}); ej = byid.get("e_jagriti", {})
    out["national"] = {
        "bima_bharosa": {"portal": bb.get("portal_url"), "email": bb.get("email"), "phones": bb.get("toll_free") or [], "address": bb.get("postal_address"), "checked": ck(bb)},
        "ombudsman": {"online": io.get("portal_url") or offs.get("online_complaint_url"), "list": io.get("office_list_url") or "https://www.cioins.co.in/ombudsman", "checked": ck(io)},
        "rbi": {"portal": rb.get("portal_url"), "email": rb.get("email"), "phone": rb.get("contact_centre"), "address": rb.get("crpc_postal_address"), "checked": ck(rb)},
        "cyber": {"phone": cy.get("helpline"), "portal": cy.get("portal_url"), "checked": ck(cy)},
        "npci": {"page": np_.get("page_url"), "checked": ck(np_)},
        "nch": {"phone": nch.get("toll_free"), "whatsapp": nch.get("whatsapp"), "portal": "https://consumerhelpline.gov.in/", "checked": ck(nch)},
        "ejagriti": {"portal": ej.get("portal_url"), "checked": ck(ej)},
    }
    js = "/* Generated by build.py from maintenance/raw. Do not edit by hand. */\nwindow.HAQ_CONTACTS=" + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n"
    (PUB / "assets" / "contacts.js").write_text(js, encoding="utf-8")
    return out

# ---------- site.js (ads and contact) ----------
SITE_JS = """/* Generated by build.py. Ads and contact details. */
(function(){
  var CONFIG = {adsenseClient:%s, adSlot:%s, contactEmail:%s};
  document.querySelectorAll("[data-contact]").forEach(function(n){ if(!CONFIG.contactEmail){ n.hidden=true; return; } n.querySelectorAll(".contact-email").forEach(function(e){ e.textContent=CONFIG.contactEmail; }); });
  if(!CONFIG.adsenseClient) return;
  var s=document.createElement("script"); s.async=true; s.crossOrigin="anonymous";
  s.src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client="+CONFIG.adsenseClient; document.head.appendChild(s);
  if(!CONFIG.adSlot) return;
  document.querySelectorAll(".ad-slot").forEach(function(el){
    el.hidden=false;
    el.innerHTML='<span class="ad-label">Advertisement</span><ins class="adsbygoogle" style="display:block" data-ad-client="'+CONFIG.adsenseClient+'" data-ad-slot="'+CONFIG.adSlot+'" data-ad-format="auto" data-full-width-responsive="true"></ins>';
    try{ (window.adsbygoogle=window.adsbygoogle||[]).push({}); }catch(e){}
  });
})();
"""

# ---------- page template for guides and privacy ----------
def head(title, desc, path, extra=""):
    canon = SITE_URL.rstrip("/") + "/" + path
    ads = f'<meta name="google-adsense-account" content="{ADSENSE_CLIENT}">\n' if ADSENSE_CLIENT else ""
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{html.escape(title)}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="{html.escape(desc)}">
<link rel="canonical" href="{canon}">
<meta property="og:title" content="{html.escape(title)}">
<meta property="og:description" content="{html.escape(desc)}">
<meta property="og:type" content="article">
<meta property="og:url" content="{canon}">
{ads}<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;700;800&family=Mukta:wght@400;500;700&family=Tiro+Devanagari+Hindi&display=swap">
<link rel="stylesheet" href="{'../' if '/' in path else ''}assets/app.css">
<style>
.g{{display:flex;flex-direction:column;gap:18px;max-width:68ch}}
.g h1{{font-size:1.8rem}}
.g h2{{font-size:1.3rem;margin-top:8px}}
.g ul,.g ol{{margin:0;padding-left:22px;display:grid;gap:6px}}
.g .answer{{background:var(--sheet);border:1px solid var(--line);border-left:4px solid var(--stamp);border-radius:8px;padding:14px 16px;display:grid;gap:6px}}
.g .cta{{background:var(--inland);border-radius:6px;padding:16px;display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between}}
.g blockquote{{margin:0;padding:10px 16px;border-left:3px solid var(--line);color:var(--muted)}}
.g .tablewrap{{overflow-x:auto}}
.g table{{border-collapse:collapse;width:100%;font-size:.95rem;background:var(--sheet)}}
.g th,.g td{{border:1px solid var(--line);padding:8px 10px;text-align:left;vertical-align:top}}
.g .num td:nth-child(n+2),.g .num th:nth-child(n+2){{font-variant-numeric:tabular-nums;white-space:nowrap}}
.g .note{{font-size:.92rem}}
.g .hi{{background:var(--sheet);border:1px solid var(--line);border-radius:10px;padding:14px 16px;display:grid;gap:6px}}
.g .stampline{{font-size:.85rem;color:var(--muted)}}
.g .crumbs{{font-size:.9rem;color:var(--muted)}}
.g .sources ol{{font-size:.88rem}}
</style>
{extra}</head>
<body>
<div class="wrap">
"""

def topbar(prefix):
    return f"""  <div class="topbar">
    <a class="brand" href="{prefix}"><svg class="mark" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="14.5" fill="none" stroke="#C8161D" stroke-width="2.5"/><path d="M8.5 11.5h15v10h-15z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M8.5 11.5l7.5 6 7.5-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>Haq Patra<small>हक़ पत्र</small></a>
    <nav aria-label="Site"><a href="{prefix}guides/">Guides</a><a href="{prefix}privacy.html">Privacy</a><a href="{prefix}">Write my letter</a></nav>
  </div>
"""

def foot(prefix):
    return f"""  <footer class="fine">
    <p>Haq Patra explains public rules and fills letter templates. It is a self-help tool, not a lawyer, and not connected to IRDAI, RBI, any insurer or any bank.</p>
    <p><a href="{prefix}guides/">All guides</a> · <a href="{prefix}privacy.html">Privacy and terms</a><span data-contact> · Contact: <span class="contact-email"></span></span></p>
  </footer>
</div>
<script src="{prefix}assets/site.js" defer></script>
</body>
</html>
"""

def guide_page(g):
    path = f"guides/{g['slug']}.html"
    src = "".join(f'<li><a href="{html.escape(C.S[k][1])}" rel="noopener" target="_blank">{html.escape(C.S[k][0])}</a></li>' for k in g["src"])
    cta_hash = "bank" if g["mod"] == "bank" else "health"
    ld = {"@context": "https://schema.org", "@type": "Article", "headline": g["h1"], "description": g["desc"],
          "dateModified": "2026-10-16", "inLanguage": "en-IN", "publisher": {"@type": "Organization", "name": "Haq Patra"}}
    extra = '<script type="application/ld+json">' + json.dumps(ld, ensure_ascii=False) + "</script>\n"
    body = f"""{topbar('../')}  <main class="g">
    <p class="crumbs"><a href="./">Guides</a> / {html.escape(g['cat'])}</p>
    <h1>{html.escape(g['h1'])}</h1>
    <p class="stampline">Rules checked on {C.CHECKED}. Sources are listed at the end.</p>
    <div class="answer"><p class="eyebrow">Short answer</p><p>{html.escape(g['answer'])}</p></div>
    <aside class="ad-slot" hidden aria-label="Advertisement"></aside>
    {g['body']}
    <div class="cta"><p>Haq Patra checks your dates against these rules, finds the right officer for your insurer or bank, and writes the letter in English or Hindi. Free.</p><a class="btn" href="../index.html#{cta_hash}">Write my letter</a></div>
    <section class="hi" lang="hi"><h2>हिंदी में सार</h2><p>{html.escape(g['hi'])}</p></section>
    <aside class="ad-slot" hidden aria-label="Advertisement"></aside>
    <section class="sources"><h2>Sources</h2><ol>{src}</ol></section>
  </main>
{foot('../')}"""
    return path, head(g["title"] + " | Haq Patra", g["desc"], path, extra) + body

def guides_index():
    items = "".join(f'<li><a href="{g["slug"]}.html"><b>{html.escape(g["h1"])}</b></a><br><span class="muted small">{html.escape(g["desc"])}</span></li>' for g in C.GUIDES)
    body = f"""{topbar('../')}  <main class="g">
    <h1>Guides</h1>
    <p>Plain-language guides to the rules on health insurance claims and bank complaints in India. Each one is checked against official sources and dated.</p>
    <ul>{items}</ul>
    <div class="cta"><p>Have a rejected claim or a bank problem now?</p><a class="btn" href="../index.html">Start here</a></div>
  </main>
{foot('../')}"""
    return "guides/index.html", head("Haq Patra Guides", "Plain-language guides to health insurance claim rejections, the Insurance Ombudsman, failed UPI payments, fraud debits and the RBI Ombudsman in India.", "guides/") + body

def privacy_page():
    contact = f"<p>Questions or a request about your data: <b>{html.escape(CONTACT_EMAIL)}</b>.</p>" if CONTACT_EMAIL else '<p>Questions or a request about your data: use the contact address shown at the bottom of this page.</p>'
    body = f"""{topbar('')}  <main class="g">
    <h1>Privacy and terms</h1>
    <p class="stampline">Last updated 16 October 2026.</p>
    <h2>The short version</h2>
    <ul>
      <li>What you type into the letter builder stays on your phone. We do not store it, and closing the page clears it.</li>
      <li>If you choose to use the free AI helper, the text is first stripped of names, phone numbers and ID numbers on your phone, then sent once to Cloudflare Workers AI to sort out what kind of problem it is. It is not stored by us, and Cloudflare states it does not use this content to train AI models.</li>
      <li>The site shows Google ads. Google and its partners use cookies to show ads.</li>
      <li>Haq Patra is not a lawyer and is not connected to IRDAI, RBI, any insurer or any bank.</li>
    </ul>
    <h2>What happens to your information</h2>
    <ul>
      <li><b>Answers and letters.</b> Processed in your browser. Kept only in this browser tab's session storage so a page refresh does not lose your work. Cleared when you close the tab.</li>
      <li><b>Uploaded letters.</b> PDFs and photos are read on your phone with PDF.js and Tesseract. The file is never uploaded.</li>
      <li><b>AI helper (optional, you choose it each time).</b> Only the edited text you see on screen, after names and numbers are removed, is sent to our Cloudflare function, which passes it to Cloudflare Workers AI and returns a short summary. We keep no logs of the text. You must be 18 or older to use it. You can always use the guided questions instead.</li>
      <li><b>Translation.</b> When you choose a language other than English or Hindi, the site's own rule text (not your answers) is sent to Cloudflare Workers AI for translation, and the translation is cached.</li>
      <li><b>Voice typing.</b> If you tap "Speak instead", your browser sends the audio to Google to turn it into text. The site tells you this before you use it.</li>
      <li><b>Language choice.</b> Remembered in your browser so the site opens in your language next time.</li>
    </ul>
    <h2>Ads and cookies</h2>
    <p>Third-party vendors, including Google, use cookies to serve ads based on your prior visits to this and other websites. Google's use of advertising cookies enables it and its partners to serve ads based on your visits. You can opt out of personalised advertising at <a href="https://adssettings.google.com" target="_blank" rel="noopener">Google Ads Settings</a>, and opt out of some third-party vendors' cookies at <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener">aboutads.info</a>. Ads never appear inside your letter.</p>
    <h2>Your rights</h2>
    <p>Because we do not store what you type, there is usually nothing for us to give back or delete. {'' if CONTACT_EMAIL else ''}</p>
    {contact}
    <h2>Terms of use</h2>
    <ul>
      <li>Haq Patra gives general information about public rules and fills self-help letter formats. It is not legal advice and not a law firm.</li>
      <li>Rules and contacts change. Every rule shows its source and every contact shows the date it was checked. Check details before you rely on them.</li>
      <li>You decide what to send and you send it yourself. Haq Patra does not file anything for you and does not promise any outcome.</li>
      <li>For a large or complicated claim, consider an advocate. The Insurance Ombudsman and the RBI Ombudsman are free.</li>
    </ul>
  </main>
{foot('')}"""
    return "privacy.html", head("Privacy and terms | Haq Patra", "How Haq Patra handles your information: on-phone processing, an optional AI helper with names removed, ads and cookies, and terms of use.", "privacy.html") + body

def not_found():
    body = f"""{topbar('/')}  <main class="g"><h1>Page not found</h1><p>This page does not exist. <a href="/">Go to Haq Patra</a> or see the <a href="/guides/">guides</a>.</p></main>
{foot('/')}"""
    return "404.html", head("Page not found | Haq Patra", "Page not found.", "404.html") + body

def head_extra_index():
    canon = SITE_URL.rstrip("/") + "/"
    s = f'<link rel="canonical" href="{canon}">\n<meta property="og:title" content="Haq Patra">\n<meta property="og:description" content="Free help in 8 Indian languages for a rejected health insurance claim or a bank problem: your rights, deadlines, the right officer and a ready letter.">\n<meta property="og:url" content="{canon}">\n<meta property="og:type" content="website">\n'
    if ADSENSE_CLIENT: s += f'<meta name="google-adsense-account" content="{ADSENSE_CLIENT}">\n'
    return s

def main():
    no_dash = re.compile("[\u2014\u2013]")
    data = compile_contacts()
    (PUB / "assets" / "site.js").write_text(SITE_JS % (json.dumps(ADSENSE_CLIENT), json.dumps(ADSENSE_SLOT), json.dumps(CONTACT_EMAIL)), encoding="utf-8")
    pages = [guide_page(g) for g in C.GUIDES] + [guides_index(), privacy_page(), not_found()]
    (PUB / "guides").mkdir(exist_ok=True)
    for path, text in pages:
        if no_dash.search(text): raise SystemExit("long dash found in " + path)
        (PUB / path).write_text(text, encoding="utf-8")
    idx = (PUB / "index.html").read_text(encoding="utf-8")
    idx = re.sub(r"<!--HEAD_EXTRA-->.*?(?:<!--/HEAD_EXTRA-->|(?=<link rel=\"preconnect\"))", "<!--HEAD_EXTRA-->\n" + head_extra_index() + "<!--/HEAD_EXTRA-->\n", idx, count=1, flags=re.S)
    (PUB / "index.html").write_text(idx, encoding="utf-8")
    urls = [""] + ["guides/"] + [f"guides/{g['slug']}.html" for g in C.GUIDES] + ["privacy.html"]
    sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "".join(f"  <url><loc>{SITE_URL.rstrip('/')}/{u}</loc><lastmod>2026-10-16</lastmod></url>\n" for u in urls) + "</urlset>\n"
    (PUB / "sitemap.xml").write_text(sm, encoding="utf-8")
    (PUB / "robots.txt").write_text(f"User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: {SITE_URL.rstrip('/')}/sitemap.xml\n", encoding="utf-8")
    ads = PUB / "ads.txt"
    if ADSENSE_CLIENT: ads.write_text(f"google.com, {ADSENSE_CLIENT.replace('ca-', '')}, DIRECT, f08c47fec0942fa0\n", encoding="utf-8")
    elif ads.exists(): ads.unlink()
    # cache busting: every page asks for assets with ?v=<content hash>, so visitors get changes at once
    import hashlib
    def h8(b): return hashlib.sha256(b).hexdigest()[:8]
    i18n_v = h8(b"".join(p.read_bytes() for p in sorted((PUB / "assets").glob("i18n-*.js"))))
    appjs = PUB / "assets" / "app.js"
    appjs.write_text(re.sub(r'"assets/i18n-"\+l\+"\.js(?:\?v=\w+)?"', '"assets/i18n-"+l+".js?v=' + i18n_v + '"', appjs.read_text(encoding="utf-8")), encoding="utf-8")
    vers = {p.name: h8(p.read_bytes()) for p in (PUB / "assets").iterdir() if p.suffix in (".css", ".js")}
    for p in PUB.rglob("*.html"):
        s = p.read_text(encoding="utf-8")
        s2 = re.sub(r'(assets/)([\w.-]+\.(?:css|js))(?:\?v=\w+)?"', lambda m: m.group(1) + m.group(2) + ("?v=" + vers[m.group(2)] if m.group(2) in vers else "") + '"', s)
        if s2 != s: p.write_text(s2, encoding="utf-8")
    idx = (PUB / "index.html").read_text(encoding="utf-8")
    (PUB / "_headers").write_text("/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(self), microphone=(self), geolocation=()\n/assets/*\n  Cache-Control: public, max-age=3600\n", encoding="utf-8")
    # preview copy for claude.ai: index.html becomes a fragment
    prev = ROOT / "preview"
    if prev.exists(): shutil.rmtree(prev)
    shutil.copytree(PUB, prev)
    m_head = re.search(r"<head>(.*?)</head>", idx, re.S).group(1)
    m_body = re.search(r"<body>(.*?)</body>", idx, re.S).group(1)
    keep = "\n".join(l for l in m_head.splitlines() if not re.search(r'<meta charset|<meta name="viewport"', l))
    (prev / "index.html").write_text(keep.strip() + "\n" + m_body.strip() + "\n", encoding="utf-8")
    for p in [PUB / "index.html"] + list((PUB / "assets").glob("*.js")):
        if no_dash.search(p.read_text(encoding="utf-8")): raise SystemExit("long dash found in " + str(p))
    print("built:", len(data["insurers"]), "insurers,", len(data["banks"]), "banks,", len(data["upi"]), "UPI apps,", len(data["offices"]), "ombudsman offices,", len(pages), "pages")

if __name__ == "__main__":
    main()
