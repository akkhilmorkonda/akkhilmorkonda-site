# Content: projects and research

Homepage copy for these lives in `src/data/site.js`. `[?]` = question for Akkhil.

## Build status
- Built pages: `/projects/pwb-insole` (foot with five sensor sites, gait cycle, PWB limit slider, WITHIN/OVER LIMIT state) and `/projects/amp-head` (signal chain, three draggable tone knobs driving the real '59 Bassman tone stack response, presets).
- `/research/wearable-robotics`: live EMG strip (raw, envelope, thresholded GRIP/OPEN control) with a "Hold to flex" button, moved off the homepage Sept 25, 2026. The homepage lab entry links to it.
- Direction (Sept 25, 2026): every experience, project and research entry gets its own deep-dive page. Still missing: FIXT, Metrix, BetCircle, Structured Information for Precision Neuroengineering Lab.
- All three are labelled illustrative. No page yet for FIXT, Metrix or BetCircle.

## Projects

### FIXT (startup, co-founder)
- Homepage line: "Agents that understand hardware well enough to run, monitor and control the test line end to end." Links to fixt.run.
- Possible case study: an agent reading a failing test log, proposing a fix, re-running on the fixture. Could reuse the WHOOP fleet visual in a different color.
- `[?]` OK to name FIXT and link fixt.run publicly? Co-founder named or not? Any demo video, screenshots, early users or pilots we can mention?

### PWB Smart Insole (Jan to Jul 2025)
- Force-sensitive resistors, embedded C++ firmware, ESP32 wireless telemetry, real-time plantar load for partial-weight-bearing rehab. ±3% accuracy via calibration and regression; validated with paired t-tests and power analysis.
- Page built (see above). Sensor sites are placeholders: heel, lateral midfoot, 5th met head, 1st met head, hallux.
- `[?]` Team or solo? Class project or independent? Number and placement of FSRs, target load limit, photos of the insole or app.

### Metrix (Mar 2025 to present)
- watchOS app in SwiftUI + HealthKit; real-time pipelines for heart rate, HRV and motion to estimate hydration state.
- `[?]` How is hydration estimated (model, ground truth)? Any validation numbers? Screenshots of the watch app?

### Guitar amp head (personal build)
- TDA2040/TDA2030 power stage, TL072 preamp, Fender-style tone stack; KiCad schematic, SPICE validation; now assembled from amp and pedal modules in a custom clear, industrial-style enclosure.
- Page built (see above). Tone curve uses Yeh & Smith closed form with '59 Bassman values; noon gives about -12 dB at 1 kHz, "Scooped" about -18 dB.
- `[?]` Is the enclosure finished? Photos? Should the site describe the pivot to modules or only the design work? (Page currently says "now being built into a custom clear enclosure" and does not mention modules.)

### BetCircle (HackMIT 2026)
- Prediction market for friend circles; fake currency, per-category Elo ratings drive odds, evidence-based resolution with circle vote fallback.
- `[?]` Did it get built at HackMIT? Demo link, repo, prizes?

## Research

### Physiology of Wearable Robotics Lab (May 2025 to present)
- Designed EMG acquisition protocols for 50+ human-subject studies; MATLAB pipelines for time-series analysis and real-time control.
- Page: `/research/wearable-robotics` with the EMG strip (rectify, low-pass, threshold with hysteresis).
- `[?]` PI name to credit? Which device or study (exoskeleton, prosthesis control)? Any publication, poster or abstract?

### Structured Information for Precision Neuroengineering Lab (Dec 2024 to May 2025)
- 40+ test cases and Brian2 simulation environments for closed-loop electrophysiology; neural dynamics under raster-scanned calcium imaging.
- `[?]` PI name? One-sentence research question in plain words?

## Other open items
- Resume PDF for download (remove phone number?), GitHub link, portrait photo (4:5; set `site.portrait` and About switches to a two-column layout with it).
- Research interests line for the Research section (earlier notes mention BCI and wearable sensing, with the Inan and Flavin labs as fits). `[?]` Mention those or not?
- Parked quality items: real CAD/STEP for WHOOP testbed, prosthetic arm and robot; exact WHOOP 5.0 sensor layout.
