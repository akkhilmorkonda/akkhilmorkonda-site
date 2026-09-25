# akkhilmorkonda.com

Personal engineering portfolio for Akkhil Morkonda. Built with [Astro](https://astro.build) and three.js. Static output, no server.

## Run it locally
```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # outputs to dist/
npm run preview    # serve dist/ locally
```

## Where things live
| What | File |
|---|---|
| All homepage copy (about, education, experience cards, projects, research, links) | `src/data/site.js` |
| Homepage layout and styles | `src/pages/index.astro` |
| Case studies | `src/pages/experience/whoop.astro`, `avanos.astro`, `gt-medical-robotics.astro` |
| Shared nav, footer, fonts, meta tags | `src/layouts/Base.astro` |
| Design tokens (colors, type) | `src/styles/global.css` (`:root`) |
| Case-study styles | `src/styles/case.css` |
| Interactives | `src/scripts/*.js` (testbed, volume, battery, fleet, robot, prosthesis, hero-pod) |

Design: dark, green accent `#16ec9a`, Unbounded (display), Manrope (body), JetBrains Mono (data). Copy follows the taste-skill rules: no em-dashes, one accent, square corners, short hero.

## Open items before launch
- Search the repo for `TODO` and `[` placeholders (dates, one result per role, TA course, lab details).
- Add a resume PDF to `public/` and set `site.resume` (consider removing the phone number first).
- Replace illustrative models with real assets when available: Thorlabs STEP files, fixture CAD, prosthetic arm CAD and FEA, exported LED scan data.
- Portrait for the About section.

See `DEPLOY.md` to put the site live on akkhilmorkonda.com.
