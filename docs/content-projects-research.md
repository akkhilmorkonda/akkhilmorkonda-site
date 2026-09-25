# Content: projects and research

Homepage copy for these lives in `src/data/site.js`. `[?]` = question for Akkhil.

## Build status
- Built pages: `/projects/pwb-insole` (foot with five sensor sites, gait cycle, PWB limit slider, WITHIN/OVER LIMIT state) and `/projects/amp-head` (signal chain, three draggable tone knobs driving the real '59 Bassman tone stack response, presets).
- `/research/wearable-robotics`: live EMG strip (raw, envelope, thresholded GRIP/OPEN control) with a "Hold to flex" button, moved off the homepage Sept 25, 2026. The homepage lab entry links to it.
- Direction (Sept 25, 2026): every experience, project and research entry gets its own deep-dive page. Still missing: FIXT, Metrix, BetCircle, Structured Information for Precision Neuroengineering Lab.
- `/projects/mediscan`: scroll explode of the real PCB CAD (GLB) plus a sensing-stack interactive (cross-section + amplification curves, heater on/off, RNase P control logic).
- All three are labelled illustrative. No page yet for FIXT, Metrix or BetCircle.

## Projects

### FIXT (startup, co-founder)
- Sept 25, 2026: moved to the homepage "Coming soon" section (in progress, no deep dive). Link is now https://usefixt.ai (was fixt.run).
- Homepage line: "Agents that understand hardware well enough to run, monitor and control the test line end to end." Links to usefixt.ai.
- Possible case study: an agent reading a failing test log, proposing a fix, re-running on the fixture. Could reuse the WHOOP fleet visual in a different color.
- `[?]` OK to name FIXT and link fixt.run publicly? Co-founder named or not? Any demo video, screenshots, early users or pilots we can mention?

### MediScan (I2CE Lab VIP, Cluster 4, Jan to May 2026)
- Page: `/projects/mediscan`. Akkhil was team lead and led the electromechanical design across the NAAT, fluorescence and power modules (confirmed Sept 25, 2026). Source: `Documents/VIP/2026` (Spring 2026 final deck, CAD). The Fall 2025 notebook is NOT a source (Akkhil said to disregard it).
- Platform: portable, non-invasive (urine) point-of-care diagnostics for low-resource clinics.
- NAAT: LAMP at constant 65°C for Zika (NS5), dengue (3' UTR), malaria (18S rRNA), RNase P internal control. ESP32 PI(D) heater loop, 5V heater via boost converter (3.3 to 5V), low-side MOSFET PWM 1 to 2 kHz, thermistor, soldered thermal fuse. Blue LED excitation, green fluorescence read in reflection by photodiodes.
- CAD (`public/models/*.glb`, made by `tools/cad-to-glb.py`): NAAT sensing board 17.7 x 69.3 mm with 4 Lite-On blue LEDs + 4 Vishay TEMD6200 photodiodes on the underside, TI boost IC + 10 mm inductor, MOSFET, JST + Molex connectors. Hybrid board 47.9 x 57.4 mm: ESP32-WROOM-32E, USB-C, Silicon Labs USB-UART, 2 tactile buttons, display connector.
- Fluorescence: ESP32-S3, two AS7341 sensors (control + test line); HE4, LYVE-1, PSA, KIM-1, NGAL.
- Power: 3.7V 5000 mAh LiPo, solar + USB-C charging, 3.3V regulator, 2.4" TFT. Worst case 4.45 W; 1.69 Wh (9.1%) per 20-minute reading; ~37 h solar full charge.
- Cost: $57.22 per NAAT device, $3.08 per test.
- Deck says "at least 12 measurements" per charge, but 18.5 Wh / 1.69 Wh = ~10.9. Site says "about ten". `[?]` Confirm.
- The 4-channel to 4-target mapping in the sensing interactive is an inference from the CAD; labelled illustrative. Chip, heater plate and the stacked layout in the 3D view are simplified.
- `[?]` Team size? Photos of the built prototype?

### PWB Smart Insole (Jan to Jul 2025)
- Force-sensitive resistors, embedded C++ firmware, ESP32 wireless telemetry, real-time plantar load for partial-weight-bearing rehab. ±3% accuracy via calibration and regression; validated with paired t-tests and power analysis.
- Page built (see above). Sensor sites are placeholders: heel, lateral midfoot, 5th met head, 1st met head, hallux.
- `[?]` Team or solo? Class project or independent? Number and placement of FSRs, target load limit, photos of the insole or app.

### Metrix (Mar 2025 to present)
- Sept 25, 2026: removed from the site (confirmed by Akkhil).
- watchOS app in SwiftUI + HealthKit; real-time pipelines for heart rate, HRV and motion to estimate hydration state.
- `[?]` How is hydration estimated (model, ground truth)? Any validation numbers? Screenshots of the watch app?

### Guitar amp head (personal build)
- `[?]` Why did you build it? The Brief currently says "A personal build: take an amplifier from circuit design to working hardware."
- TDA2040/TDA2030 power stage, TL072 preamp, Fender-style tone stack; KiCad schematic, SPICE validation; now assembled from amp and pedal modules in a custom clear, industrial-style enclosure.
- Page built (see above). Tone curve uses Yeh & Smith closed form with '59 Bassman values; noon gives about -12 dB at 1 kHz, "Scooped" about -18 dB.
- `[?]` Is the enclosure finished? Photos? Should the site describe the pivot to modules or only the design work? (Page currently says "now being built into a custom clear enclosure" and does not mention modules.)

### Betcha (HackMIT 2026, formerly BetCircle)
- Renamed Sept 25, 2026. Pitch decks in Downloads (`Betcha — HackMIT 2026.pdf`).
- Prediction market for friend circles; fake currency, per-category Elo ratings drive odds, evidence-based resolution with circle vote fallback.
- `[?]` Did it get built at HackMIT? Demo link, repo, prizes?

### Smart Respirator
- Resume: "Smart Filtering Facepiece Respirator | Root Cause Analysis, ISO Regulations | Aug 2024 to Jan 2025. Prototyped a medical device that monitors the pressure and dust concentration inside of a respirator to ensure proper face seal and respirator effectiveness." On the homepage as "Smart Respirator" (3rd). `[?]` Team or solo, sensors used, any results, photos (for a deep dive).

### Non-invasive BP monitoring for LVAD patients (in progress)
- Homepage "Coming soon" section, no deep dive yet. Card (Sept 25, 2026): title names the system being developed ("Non-invasive BP monitor for LVAD patients"), text gives the why ("Continuous-flow heart pumps flatten the pulse, so standard cuffs often cannot get a reading."). Title and text must not repeat each other. The why is general clinical background, not a project claim. Associated with Emory Hospital (Akkhil, Sept 25, 2026); tag reads "With Emory Hospital". `[?]` Formally sponsored or a collaboration (wording)? Lab or team, role, approach.
- Sponsored by Emory Hospital (confirmed by Akkhil, Sept 25, 2026). Card tag reads "Sponsored by Emory Hospital, in progress" (no logo on the card; Akkhil removed it). Emory's logo is in the homepage logo strip. `[?]` Lab or team, role, approach.

## Research

### Physiology of Wearable Robotics Lab (May 2025 to present)
- `[?]` Why: Brief says "Human-subject studies need consistent EMG recordings and a reliable path from raw signal to control." Replace with the real study goal once known.
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
