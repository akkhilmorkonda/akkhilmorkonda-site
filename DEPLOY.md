# Deploying akkhilmorkonda.com

Repo: github.com/akkhilmorkonda/akkhilmorkonda-site (branch `main`). Host: Vercel (Hobby plan).

## Status
- **Live at https://akkhilmorkonda.com** since Sept 25, 2026. Vercel builds `main` automatically (Astro preset: `npm run build`, output `dist`).
- `www.akkhilmorkonda.com`: DNS points at Vercel and `http://www` redirects (308). As of Sept 25, 2026, `https://www` failed with a certificate error. `[?]` Confirm in Vercel > Settings > Domains that `www` shows Valid and redirects to the apex.

## Making changes
- Commit to `main` and push: Vercel redeploys in about a minute.
- Bigger changes: work on a branch and open a PR. Vercel builds a preview URL per branch; merge to go live.
- Roll back: Vercel > Deployments > last good deploy > ... > **Promote to Production**.
- Claude (Cowork) can commit in the local folder but cannot push; push from GitHub Desktop. Claude Code on the PC can push directly.

## Domain reference
- Apex: `A @ 76.76.21.21` (or the value on the Vercel domain card). `www`: `CNAME` to the project-specific target, redirected to the apex. HTTPS is automatic once DNS verifies.
