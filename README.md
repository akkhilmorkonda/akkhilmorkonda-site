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
| All content: every experience, project and research entry, homepage copy, facts and open questions | `src/data/portfolio.yaml` (`npm run open` lists open questions) |
| Homepage layout and styles | `src/pages/index.astro` |
| Case studies | `src/pages/experience/*.astro`, `src/pages/projects/*.astro` |
| Shared nav, footer, fonts, meta tags | `src/layouts/Base.astro` |
| Design tokens (colors, type) | `src/styles/global.css` (`:root`) |
| Case-study styles | `src/styles/case.css` |
| Interactives | `src/scripts/*.js` (testbed, volume, battery, fleet, robot, prosthesis, hero-pod, insole, amp, emg) |

Design: dark, green accent `#16ec9a`, Unbounded (display), Manrope (body), JetBrains Mono (data). Copy follows the taste-skill rules: no em-dashes, one accent, square corners, short hero.

## Open items
Run `npm run open` to list every open question (they live in `src/data/portfolio.yaml`).
