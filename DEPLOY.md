# Deploying UnoffIChO

UnoffIChO is a static site. There is no backend, database or API key. `npm run build` writes everything to `dist/`, and any static host can serve it. This guide uses **Cloudflare Pages**, with the custom domain **unofficho.org**.

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

## 2. Create the Pages project

1. Sign in to the [Cloudflare dashboard](https://dash.cloudflare.com) and open **Workers & Pages → Create → Pages → Connect to Git**.
2. Authorise GitHub and pick the **jwangexe/unofficho** repository (it can stay private).
3. Set up the build:

   | Setting | Value |
   | --- | --- |
   | Production branch | `main` |
   | Framework preset | None (or Vite) |
   | Build command | `npm run build` |
   | Build output directory | `dist` |
   | Environment variable | `NODE_VERSION` = `24` |

4. **Save and Deploy.** The first build gives you a `https://<project>.pages.dev` address. Check that it works before adding the domain.

From then on:

- every push to `main` deploys to production
- every other branch or pull request gets its own preview URL

Two files in `public/` are copied into `dist/` and read by Pages:

- **`_redirects`** sends every path to `index.html`, so links such as `/book/diels-alder` work when opened directly.
- **`_headers`** caches the hashed files in `/assets/` for a year. It always revalidates `index.html`, `sw.js`, `registerSW.js` and the manifest, so users never get stuck on an old version. It also adds a few standard security headers.

### Alternative: upload from your machine

No Git connection needed:

```bash
npm run build
```

```bash
npx wrangler pages deploy dist --project-name unofficho
```

## 3. Connect unofficho.org

A bare domain (`unofficho.org` with no `www.`) can only point to Pages if **Cloudflare runs the domain's DNS**. That is the simplest set-up.

1. **Register the domain.** Buy it through Cloudflare Registrar (dashboard → *Domain Registration*), or at any registrar.
2. **Hand DNS to Cloudflare** (skip this if you bought it from Cloudflare):
   - dashboard → *Add a site* → enter `unofficho.org` → Free plan
   - Cloudflare shows two nameservers; at your registrar, replace the existing nameservers with those two
   - wait until Cloudflare marks the site **Active** (minutes to a day)
3. **Attach the domain to the project:** Pages project → **Custom domains → Set up a custom domain** → `unofficho.org`. Cloudflare adds the DNS record and issues the HTTPS certificate itself.
4. **Add `www` as well:** repeat step 3 for `www.unofficho.org`.
5. **Redirect `www` to the bare domain**, so there is one canonical address:
   - zone `unofficho.org` → **Rules → Redirect Rules → Create rule**
   - if *Hostname* equals `www.unofficho.org`, redirect dynamically to `concat("https://unofficho.org", http.request.uri.path)`
   - status **301**, preserve query string
6. **HTTPS:** under **SSL/TLS → Edge Certificates**, turn on **Always Use HTTPS**.

DNS and the certificate usually take a few minutes; allow up to 24 hours.

If you keep DNS with another provider, Pages only works for subdomains. Add a `CNAME` from, say, `app.unofficho.org` to `<project>.pages.dev`, then add that name under **Custom domains**.

## 4. Check the live site

- [ ] `https://unofficho.org` loads, and `https://www.unofficho.org/book` redirects to `https://unofficho.org/book`
- [ ] Opening a deep link directly (e.g. `/book/diels-alder`) works
- [ ] The footer and the About screen show the disclaimer
- [ ] On a phone, **Add to Home Screen** installs "UnoffIChO" with its own icon. It opens full-screen.
- [ ] After one visit, switch on aeroplane mode and reopen the app. Every section still works.
- [ ] Chrome DevTools → **Lighthouse** (mobile) reports no major accessibility or best-practice issues

## 5. Updating

Push to `main`. Pages rebuilds and deploys in a minute or two. Users get the update in two steps:

1. While the app is open online, its service worker downloads the new version in the background.
2. The new version shows the next time they open or reload the app.

No action is needed from them.

To roll back, open the project's **Deployments** list and choose **Rollback** on an earlier build.

## Notes

- **Privacy.** The site has no analytics, cookies or server-side storage. Progress lives in each user's browser (IndexedDB) and leaves the device only through the user's own export.
- **Branding.** UnoffIChO is unofficial. Keep the disclaimer in the footer and on the About screen, and don't use olympiad logos in the icon or the store listing.
- **Other hosts.** Netlify understands the same `_redirects` and `_headers` files. On Vercel or GitHub Pages, configure an SPA fallback to `index.html` and the same caching rules instead.
