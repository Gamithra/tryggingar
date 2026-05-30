# Rental deposit calculator

According to Article 40 of Icelandic Rent Act No. 36/1994, landlords must keep rental deposits in the highest available interest savings account. Many landlords do not, and the law does not specify how to calculate the interest owed. This tool estimates approximate interest on a deposit from 2000 to today.

## Development

```bash
npm install
npm run update-rates   # refresh public/data/rates.json from CBI + Auður
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Rate data

Interest is based on:

- **CBI key rate** (daily history from 2000) via [Seðlabanki XML API](https://sedlabanki.is/gagnatorg/xml-gogn/)
- **Auður unbound savings rate** from [audur.is/vaxtatafla](https://audur.is/vaxtatafla)

The deposit rate used is `CBI key rate − (CBI − Auður margin today)`, applied across all historical periods. See `/rates/` for the full table and last fetch time.

## Hosting on your own domain (GitHub Pages)

This project is a **static site** (`output: 'export'` in `next.config.mjs`). There is no server at runtime — only HTML/JS and `data/rates.json` in the `out/` folder after build.

### How GitHub Pages works

1. Push the repo to GitHub.
2. Enable **Settings → Pages → Build and deployment → GitHub Actions** (the included workflow builds and deploys `out/`).
3. Your site is served at `https://<username>.github.io/<repo>/` unless you add a custom domain.

The workflow (`.github/workflows/deploy.yml`) runs on every push to `main`, weekly (to refresh rates), or manually. It runs `npm run update-rates`, then `npm run build`, then publishes `out/`.

### Custom domain: `deposit.gamithra.com`

`public/CNAME` already contains `deposit.gamithra.com` (copied into `out/` on build).

**One-time GitHub setup**

1. Open [github.com/Gamithra/tryggingar/settings/pages](https://github.com/Gamithra/tryggingar/settings/pages).
2. Under **Build and deployment → Source**, choose **GitHub Actions** (not “Deploy from a branch”).
3. Under **Custom domain**, enter `deposit.gamithra.com` and save. Enable **Enforce HTTPS** when it becomes available.

**DNS** (wherever `gamithra.com` is managed)

| Type  | Name    | Value              |
|-------|---------|--------------------|
| CNAME | deposit | `gamithra.github.io` |

Remove any old **A** record for `deposit` if you pointed it at your own server before.

**First deploy**

Push to `main` (or run the workflow manually: **Actions → Build and deploy → Run workflow**). When it finishes, the site should be live at `https://deposit.gamithra.com`.

You no longer need to copy `out/` by hand unless you keep a mirror on your own server.

### Other hosts

Any static host works: upload the `out/` folder after `npm run build`, or connect the repo to **Cloudflare Pages**, **Netlify**, etc. Run `npm run update-rates` before each build (or in CI).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Local development |
| `npm run update-rates` | Fetch CBI + Auður → `public/data/rates.json` |
| `npm run build` | Static export to `out/` |
