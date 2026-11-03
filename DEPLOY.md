# Deploying UnoffIChO

UnoffIChO is a static site. There is no backend, database or API key. `npm run build` writes everything to `dist/`, and any static host can serve it. This guide uses **Cloudflare** (a Worker serving static files, which is what the dashboard's *Create* button sets up), with the custom domain **unofficho.org**.

## 1. Check the build locally

```bash
npm ci
```

```bash
npm test
```

```bash
npm run build
```

```bash
npx vite preview
```

Open the URL `vite preview` prints. This is the production build, including the service worker. For the mobile smoke tests (they build and serve the app themselves):

```bash
npm run e2e
```

## 2. Create the Cloudflare project

1. Sign in to the [Cloudflare dashboard](https://dash.cloudflare.com) and open **Workers & Pages → Create → Import a repository** (Connect to Git).
2. Authorise GitHub and pick the **jwangexe/unofficho** repository (it can stay private).
3. Set up the build:

   | Setting | Value |
   | --- | --- |
   | Project name | `unofficho` (must match `name` in `wrangler.jsonc`) |
   | Production branch | `main` |
   | Build command | `npm run build` |
   | Deploy command | `npx wrangler deploy` |
   | Environment variable | `NODE_VERSION` = `24` |

4. **Save and Deploy.** The first build gives you a `https://unofficho.<your-subdomain>.workers.dev` address. Check that it works before adding the domain.

From then on, every push to `main` deploys to production.

How the files are served:

- **`wrangler.jsonc`** tells Cloudflare to serve `dist/`. Its `"not_found_handling": "single-page-application"` returns `index.html` for app routes, so links such as `/book/diels-alder` work when opened directly. Do **not** add a `_redirects` file with `/* /index.html 200`: Workers rejects it as an infinite loop.
- **`public/_headers`** (copied into `dist/`) caches the hashed files in `/assets/` for a year. It always revalidates `index.html`, `sw.js`, `registerSW.js` and the manifest, so users never get stuck on an old version. It also adds a few standard security headers.

### Alternative: deploy from your machine

No Git connection needed. Log in once with `npx wrangler login`, then:

```bash
npm run build
```

```bash
npx wrangler deploy
```

To check the configuration without uploading anything, use `npx wrangler deploy --dry-run`.

## 3. Connect unofficho.org

A bare domain (`unofficho.org` with no `www.`) can only point to your Cloudflare project if **Cloudflare runs the domain's DNS**. That is the simplest set-up.

1. **Register the domain.** Buy it through Cloudflare Registrar (dashboard → *Domain Registration*), or at any registrar.
2. **Hand DNS to Cloudflare** (skip this if you bought it from Cloudflare):
   - dashboard → *Add a site* → enter `unofficho.org` → Free plan
   - Cloudflare shows two nameservers; at your registrar, replace the existing nameservers with those two
   - wait until Cloudflare marks the site **Active** (minutes to a day)
3. **Attach the domain to the project:** your project → **Settings → Domains & Routes → Add → Custom domain** → `unofficho.org`. Cloudflare adds the DNS record and issues the HTTPS certificate itself.
4. **Add `www` as well:** repeat step 3 for `www.unofficho.org`.
5. **Redirect `www` to the bare domain**, so there is one canonical address:
   - zone `unofficho.org` → **Rules → Redirect Rules → Create rule**
   - if *Hostname* equals `www.unofficho.org`, redirect dynamically to `concat("https://unofficho.org", http.request.uri.path)`
   - status **301**, preserve query string
6. **HTTPS:** under **SSL/TLS → Edge Certificates**, turn on **Always Use HTTPS**.

DNS and the certificate usually take a few minutes; allow up to 24 hours.

Custom domains on Cloudflare need the domain's DNS to be on Cloudflare (step 2). If you keep DNS elsewhere, use the `workers.dev` address, or move the DNS.

## Suggestions from friends

The speech-bubble button at the top of every screen lets anyone send a suggestion. Each one goes to a **D1 database** called `unofficho-feedback`, attached to the same Cloudflare project. The Worker in `worker/index.ts` handles `/api/suggestions`.

**One-time setup:**

1. **The database.** The first deploy after this change creates `unofficho-feedback` for you, because `wrangler.jsonc` names it without an ID and Wrangler provisions it automatically. The table inside is created on the first suggestion. If that deploy fails while creating the database, create it yourself and paste the `database_id` it prints into `wrangler.jsonc`:

   ```bash
   npx wrangler d1 create unofficho-feedback
   ```

2. **Your inbox password.** In the dashboard, open your project, then **Settings → Variables and Secrets → Add**. Choose type **Secret**, name it `ADMIN_TOKEN`, and give it a long password only you know. Alternatively, run:

   ```bash
   npx wrangler secret put ADMIN_TOKEN
   ```

**Reading suggestions:**

- **In the app:** open `https://<your site>/inbox` and enter that password. It is remembered on that device. You can filter by type and download a CSV. The page is not linked anywhere, and without the password the server returns nothing.
- **In the dashboard:** **Storage & Databases → D1 → unofficho-feedback → Explore data → suggestions**. You can also run SQL in the console, e.g. `SELECT * FROM suggestions ORDER BY id DESC`.

**Review mode:** the same password opens `https://<your site>/review`, for checking content accuracy on your phone. See CONTENT.md.

**What is stored:** the type, the message, the optional name or contact, the app page it was sent from, and the time. Nothing else is stored: no IP address and no progress data.

**Trying it locally:** run `npm run build`, then `npx wrangler dev`. This serves the app and the API at <http://localhost:8787> with a local copy of D1. Put `ADMIN_TOKEN=…` in a `.dev.vars` file, which git ignores.

## 4. Check the live site

- [ ] `https://unofficho.org` loads, and `https://www.unofficho.org/book` redirects to `https://unofficho.org/book`
- [ ] Opening a deep link directly (e.g. `/book/diels-alder`) works
- [ ] The footer and the About screen show the disclaimer
- [ ] On a phone, **Add to Home Screen** installs "UnoffIChO" with its own icon. It opens full-screen.
- [ ] After one visit, switch on aeroplane mode and reopen the app. Every section still works.
- [ ] Chrome DevTools → **Lighthouse** (mobile) reports no major accessibility or best-practice issues

## 5. Updating

Push to `main`. Cloudflare rebuilds and deploys in a minute or two. Users get the update in two steps:

1. While the app is open online, its service worker downloads the new version in the background.
2. The new version shows the next time they open or reload the app.

No action is needed from them.

To roll back, open the project's **Deployments** list and roll back to an earlier version.

## 6. Get found on search engines

The build pre-renders Home, About, Calculations, Reagents, the Book contents and every written Book page into their own HTML files (`scripts/prerender.ts`), each with its own title, description and structured data, and writes `sitemap.xml`. After the first deploy:

1. **Google Search Console** (search.google.com/search-console): add a **Domain** property for `unofficho.org`. It asks for a DNS TXT record; add it in Cloudflare under **DNS → Records**, then click Verify.
2. In Search Console, open **Sitemaps** and submit `https://unofficho.org/sitemap.xml`.
3. Use **URL inspection** on the home page and a Book page, then **Request indexing**.
4. **Bing Webmaster Tools** (bing.com/webmasters): sign in and choose **Import from Google Search Console**. Bing also feeds DuckDuckGo and several AI search tools.

New Book pages join the sitemap automatically on the next deploy. Links from other sites (school chemistry pages, olympiad communities) matter more for ranking than anything on the site itself.

## Notes

- **Privacy.** The site has no analytics or cookies. Progress lives in each user's browser (IndexedDB) and leaves the device only through the user's own export. The only thing stored on the server is a suggestion someone chooses to send.
- **Branding.** UnoffIChO is unofficial. Keep the disclaimer in the footer and on the About screen, and don't use olympiad logos in the icon or the store listing.
- **Other hosts.** On Netlify or classic Cloudflare Pages, add `public/_redirects` containing `/* /index.html 200` for the SPA fallback (`_headers` works as is). On Vercel or GitHub Pages, configure an SPA fallback to `index.html` and the same caching rules instead.
