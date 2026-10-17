# Haq Patra

Free help in 8 Indian languages for a rejected health insurance claim or a bank, UPI or fraud problem. People describe the problem, upload their letter, or answer simple questions, and get their rights, their deadlines, the exact officer to contact and a ready complaint letter in English or Hindi.

It runs on Cloudflare's free tier. The free AI helper uses Cloudflare Workers AI. Claude is not needed to run it.

## What is in this folder

| Folder or file | What it is |
| --- | --- |
| `public/` | The website. This is what Cloudflare serves. |
| `functions/api/analyze.js` | The free AI helper. It reads a problem with names and numbers removed, and sorts it. |
| `functions/api/translate.js` | Translates the rule text into Marathi, Bengali, Tamil, Telugu, Gujarati and Kannada. |
| `maintenance/raw/` | The verified contact lists (insurers, banks, Ombudsman offices), each with its source and date. |
| `maintenance/content.py` | The guide pages. |
| `build.py` | Rebuilds the site after any change. Run `python3 build.py`. |

## One-time setup (about 45 minutes)

### 1. Put the files on GitHub (free)
1. Sign in at github.com (create a free account if needed).
2. Click **New repository**. Name it `haq-patra`. Choose **Private**. Click **Create repository**.
3. Click **uploading an existing file**. Drag in everything from this folder: `public`, `functions`, `maintenance`, `build.py`, `README.md`. Click **Commit changes**.

### 2. Connect Cloudflare Pages (free)
1. In the Cloudflare dashboard, open **Workers & Pages**, then **Create**, then the **Pages** tab, then **Connect to Git**.
2. Choose the `haq-patra` repository.
3. Build settings: Framework preset **None**. Build command: leave empty. **Build output directory: `public`**.
4. Click **Save and Deploy**. The site goes live at `haqpatra.pages.dev` (or a similar name Cloudflare shows).

### 3. Switch on the AI helper (free)
1. In the Pages project, open **Settings**, then **Bindings**, then **Add**, then **Workers AI**.
2. Variable name: **`AI`** (capital letters). Save.
3. Open **Deployments** and click **Retry deployment** on the latest one.

Without this step the site still works fully; it just uses keyword matching instead of the AI helper.

### 4. Choose the address
- **Free:** keep `haqpatra.pages.dev`. Everything works, but Google AdSense will not approve this address.
- **For ads:** buy a cheap `.in` domain (about Rs 100 to 500 for the first year), then in the Pages project open **Custom domains** and add it. Tell Claude the domain so the site's links and sitemap are updated.

### 5. Things to send to Claude
- The site's contact Gmail (make a free one, for example haqpatra.help@gmail.com).
- After the domain: your AdSense publisher ID (starts with `ca-pub-`) and one display ad unit ID.

### 6. Tell Google the site exists
1. Open Google Search Console, add the site, and verify it (the DNS method works with Cloudflare).
2. Submit `sitemap.xml`.

## Making changes later

Edit the files, run `python3 build.py`, and upload the changed files to GitHub. Cloudflare redeploys automatically. Settings for the domain, AdSense and contact email are the four lines at the top of `build.py`.

## Free limits

- Workers AI: 10,000 units a day free, roughly 200 to 400 analyses. Past that, Cloudflare refuses the call and the site falls back to keyword matching. Nothing is ever charged on the free plan.
- Pages and Functions: 100,000 function calls a day, unlimited page views.

## Rules to watch

- RBI's revised fraud rules apply to transactions from 1 January 2027. The bank fraud check and letter need an update in December.
- Draft changes to the Insurance Ombudsman Rules (November 2025) and IRDAI's internal ombudsman guidelines were still drafts on 16 October 2026.
- Contacts: officers change several times a year. Recheck `cioins.co.in/GRONonLife` and `cioins.co.in/ombudsman` monthly.
- Screen text in Marathi, Bengali, Tamil, Telugu, Gujarati and Kannada should be checked by a native speaker.
