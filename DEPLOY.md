# Deploying akkhilmorkonda.com

Repo: github.com/akkhilmorkonda/akkhilmorkonda-site (branch `main`). Host: Vercel (Hobby plan).

## First deploy
1. vercel.com > **Add New > Project**. Connect GitHub and grant access to `akkhilmorkonda-site`.
2. **Import** the repo. Vercel detects Astro (build `npm run build`, output `dist`). Leave defaults. **Deploy**.
3. Check the `*.vercel.app` URL on desktop and phone.

## Domain
1. Project > **Settings > Domains > Add** `akkhilmorkonda.com` (as of Sept 25, 2026 it looked unregistered, so buying it inside Vercel is simplest; DNS is then automatic).
2. If bought elsewhere, add the records Vercel shows: `A @ 76.76.21.21` (or the value on the domain card) and `CNAME www` to the project-specific target.
3. Add `www.akkhilmorkonda.com` and redirect it to the apex. HTTPS is automatic.

## Making changes
- Commit to `main` and push: Vercel redeploys in about a minute.
- Bigger changes: work on a branch and open a PR. Vercel builds a preview URL per branch; merge to go live.
- Roll back: Vercel > Deployments > last good deploy > ... > **Promote to Production**.
- Claude (Cowork) can commit in the local folder but cannot push; push from GitHub Desktop. Claude Code on the PC can push directly.
