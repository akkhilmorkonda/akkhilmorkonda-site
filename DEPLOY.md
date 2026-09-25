# Deploying to akkhilmorkonda.com

About 15 minutes. You need a GitHub account and a Vercel account (free Hobby plan is enough).

As of Sept 25, 2026 the domain did not appear to be registered (an RDAP lookup for akkhilmorkonda.com returned "not found"), so it should be available to buy.

## 1. Put the code on GitHub
1. Go to github.com/new, name the repo `akkhilmorkonda.com` (private is fine), create it empty.
2. Unzip `akkhilmorkonda-site.zip` and, from that folder, run:
   ```bash
   git init && git add . && git commit -m "Initial site"
   git branch -M main
   git remote add origin https://github.com/<your-username>/akkhilmorkonda.com.git
   git push -u origin main
   ```

## 2. Deploy on Vercel
1. Sign in at vercel.com with GitHub.
2. **Add New > Project**, import the repo. Vercel detects Astro (build `npm run build`, output `dist`). Click **Deploy**.
3. You get a `*.vercel.app` URL within a minute or two. Check it on your phone.

## 3. Connect the domain
Easiest: buy the domain inside Vercel (**Domains > Buy**). DNS is then set up for you automatically.

If you buy it elsewhere (Cloudflare Registrar, Namecheap, etc.):
1. In Vercel: **Project > Settings > Domains > Add Domain**, enter `akkhilmorkonda.com`, accept the prompt to also add `www.akkhilmorkonda.com`.
2. At your registrar's DNS settings, add the records Vercel shows on the domain card. Typically:
   | Type | Name | Value |
   |---|---|---|
   | A | `@` | `76.76.21.21` (or the value shown on your domain card) |
   | CNAME | `www` | the project-specific target Vercel shows |
3. Wait for Vercel to show "Valid Configuration". HTTPS certificates are issued automatically.
4. Pick `akkhilmorkonda.com` as primary and redirect `www` to it (Vercel offers this on the Domains page).

Source: https://vercel.com/docs/domains/working-with-domains/add-a-domain

## 4. Updating the site
Edit files, commit and push to `main`. Vercel rebuilds and deploys automatically. Every pull request gets its own preview URL.
