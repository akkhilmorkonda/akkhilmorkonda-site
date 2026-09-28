# Interactives: what is built and how

Entry facts, copy, sources and open questions live in `src/data/portfolio.yaml`. This file only records how the custom visuals work. Every simulated visual carries an "illustrative" caption.

## WHOOP (`/experience/whoop`)
- **Rendering** (Sept 27, 2026): `mkStudio()` in `whoop-common.js`. Half-float 4x MSAA buffer, bloom threshold 4.5 (only LEDs driven to about 8 bloom), ACES filmic tone mapping, background colour solved so the canvas matches the page after tone mapping, PMREM studio environment of softbox strips (edge highlights on black anodize), PCF shadows with radius, contact shadow on a faint floor pool (re-rendered only when parts move), physically based material recipes (`PBR`) with a shared noise roughness map. MediScan still uses the older `mkPipe()`.
- **Dev capture hook:** in `npm run dev`, `window.__tb.shot(progress, t)` renders a given scroll position so frames can be saved for review (stripped from production builds).
- **Exploded testbed** (`testbed.js`, scroll, 6 steps): blackout enclosure, breadboard + K-Cube controllers, Thorlabs 3-axis stage, precision fixture, fiber + Feasa analysers, WHOOP 5.0. Ends by zooming into the DUT with LEDs on, then the project Results. Camera pulls back on narrow canvases so the rig stays in frame.
- **Battery check** (`battery.js`, simplified at Akkhil's request): Healthy / Bad capacitor toggle, spectrum, PASS/FLAG.
- **Live test DAG** (`ate-dag.js`, replaced the fleet chart Sept 27, 2026): six test steps as a dependency graph (Flash, Boot, then Sensors to Optical and Battery to Radio in parallel). DAG vs legacy serial toggle, clock, shared-scale timeline bars (50 s vs 35 s, 30% faster). Click a step to make it fail: DAG skips only its dependents, serial aborts the rest. Runs once on scroll into view. Illustrative steps and timings.

## Avanos (`/experience/avanos`)
- **Robot viewer** (`robot.js`): 6-axis arm replaying an interpolated path, scrubber, play/pause, live joint angles. Not built: pump cross-section.

## GT Medical Robotics (`/experience/gt-medical-robotics`)
- **Explodable arm** (`prosthesis.js`): explode slider, Original / Redesign wrist toggle, relative peak stress and factor of safety readouts.

## MediScan (`/projects/mediscan`)
- **CAD explode** (`mediscan-explode.js`): real PCB CAD from the team's Altium STEP files, converted by `tools/cad-to-glb.py` into `public/models/*.glb` (one mesh per part group). Chip, heater plate and stacking are simplified blocks. Loaded lazily near the section.
- **Sensing stack** (`mediscan-sense.js`): one channel in cross-section plus four amplification curves over 20 minutes; sample, heater on/off, channel select, time scrubber; RNase P control gates validity.

## Partial Weight Bearing Insole (`/projects/pwb-insole`)
- **Insole** (`insole.js`): foot with five placeholder sensor sites, gait cycle, limit slider, WITHIN/OVER LIMIT state.

## Guitar amp head (`/projects/amp-head`)
- **Tone stack** (`amp.js`): three draggable, keyboard-operable knobs driving the real '59 Bassman tone stack response (Yeh and Smith closed form), presets.

## Wearable Robotics Lab (`/research/wearable-robotics`)
- **EMG strip** (`emg.js`): raw, envelope, thresholded control with hysteresis; "Hold to flex".

## Homepage
- **Hero callouts** (`hero-callouts.js`): drawing marks measured from live word boxes after the intro wipe lands.
- **Scroll motion** (`scroll-fx.js`): see CLAUDE.md.

## Testbed geometry (phase 5, in progress Sept 27, 2026)
Phases 1 to 4 (the `mkStudio` render pipeline above) are live. Phase 5 rebuilds the testbed parts in `testbed.js` from Thorlabs drawings; Akkhil approved it Sept 27, 2026 ("model from Thorlabs drawings").

Model from Thorlabs drawings (use their STEP only as reference; do not publish converted Thorlabs meshes without Thorlabs' permission, their site terms forbid redistribution). Thorlabs STEP and PDF drawings: product page, item row, Docs. URL pattern `https://media.thorlabs.com/globalassets/items/{a}/{ab}/{abc}/{part}/{id}-e0w.step` (swap `.step` for `.pdf` for the dimensioned drawing). Checked Sept 27, 2026 (all return 200, no login):

| Part | Base URL (`.../globalassets/items/` + ) | STEP | PDF |
|---|---|---|---|
| MT3/M-Z9 stage | `m/mt/mt3/mt3_m-z9/ttn330847-e0w` | 50 MB | 213 KB |
| KDC101 K-Cube | `k/kd/kdc/kdc101/etn017655-e0w` | 30 MB | 620 KB |
| MB3045/M breadboard | `m/mb/mb3/mb3045_m/6280-e0w` | 4 MB | 182 KB |

Download STEP files to a scratch folder only (never `public/`). Read dimensions from the PDF drawings first, and open the STEP only when the drawing leaves a shape unclear.

**Keep working when the geometry is replaced:**
- Explode groups `[enc, bb, ctrl, bp, sx, sy, sz, za, fx, ana, fib, dut]` with their EX/AW offsets.
- Step highlights `[['enc'], ['board','ctrl'], ['stX','stY','stZ','zAct'], ['fx','baseplate'], ['ana','fib'], ['dut']]`, and the matching step text in `whoop.astro`.
- The DUT is `makePod()` placed sensor-side up in the base-plate pocket; the stage carries the fiber probe above it.
- The final zoom onto the lit LEDs, `P.exclude(enc, cone, glow)` for the contact shadow, the enclosure's `keepEnv`, and the mobile camera pull-back.

**Review loop:**
1. Run `npm run dev` (preview name `astro-dev`).
2. Start `node tools/shotsrv.mjs <folder>`, which saves frames POSTed to `127.0.0.1:4399`.
3. In the page console, `__tb.shot(progress, t)` renders a scroll position, which you copy to a 900 px canvas and POST as `{name, data}` (snippet in the tool's header).
4. Check the frames at progress 0, 0.2, 0.4, 0.6, 0.8 and 1, then at 390 px and 320 px widths.
- **Stage: MT3/M-Z9** (Akkhil confirmed): 12 mm travel per axis, 0.2 um minimum repeatable incremental motion; one axis 197.7 x 61.2 x 20.6 mm; MT402 bracket for Z; three KDC101. STEP: `.../m/mt/mt3/mt3_m-z9/ttn330847-e0w.step`.
- **KDC101 K-Cube:** 60.0 x 60.0 x 49.2 mm; dark maroon ribbed side panels, black front and top; backlit display and velocity wheel on top; gold TRIG 1/2 connectors, red power switch, micro-USB on the front; black clip-on base plate. STEP: `.../k/kd/kdc/kdc101/etn017655-e0w.step` (30 MB, decimate). Hub KEH3 193.5 x 70 x 27 mm.
- **Breadboard:** MB series, matte black anodized, 12.7 mm thick, M6 on 25 mm, first hole 12.5 mm from each edge (e.g. MB3045/M 300 x 450).
- **Feasa LED Analyser:** silver ribbed aluminium extrusion, black end caps and top plate, about 105 x 57 x 50 mm (10 ch); fibers exit the top through black strain reliefs. **Feasa IR Analyser:** red anodized ribbed body, black top plate, silver end flanges, about 86 x 57 x 55 mm. Fibers 1 mm, 0.6 m, 15 mm bend radius; optical heads about 4.57 x 50 mm. No Feasa CAD (ask sales@feasa.ie).
- **Probe holder (unconfirmed):** VH1/M V-clamp on a TR30/M post, or a custom block.
- **Enclosure:** XE25 25 mm black extrusion frame with TB4 black hardboard panels (e.g. XE25C7/M 375 x 225 x 300).
- Detail that sells it: 0.3 to 0.8 mm chamfers, instanced socket-head screws, catenary cable sag, printed labels via CanvasTexture.

## WHOOP 5.0 device model (open, Sept 27, 2026)
Akkhil asked how to make the DUT (`makePod()` in `whoop-common.js`) look realistic. Today it is a primitive rounded box, 32.6 x 9.6 x 23.4 scene units, with a lens, a ring, five LEDs in a row (G G R IR G) and four photodiodes, and a `0x0c0c0d` shell (metalness .1, roughness .5).
- **Limits:** no AI-generated WHOOP imagery, and never the real rig photo. Use public specs only: 5 LEDs (3 green, 1 red, 1 IR), 4 photodiodes, 28 g, about 7% smaller than the 4.0.
- **Options to put to Akkhil:**
  1. Model it from published dimensions and review photos.
  2. Use a licensed 3D model.
  3. Photograph the underside of his own device as a texture reference.
  4. Photogrammetry of his own device.
- **Research findings:** pending (a research pass was running when this was written). Record the sourced dimensions, the underside layout and the chosen approach here.

## Parked quality ideas
- Upgrade three.js 0.149 to current (about 0.186): OutputPass with Neutral/AgX tone mapping, N8AO ambient occlusion, anisotropic milled aluminium, `scene.environmentIntensity`. Needs visual retuning of every 3D scene (hex colours darken, light units change).
- Move MediScan to `mkStudio()`; compress its GLBs with gltfpack meshopt (Vercel does not gzip .glb).
- Real CAD for the prosthetic arm and robot; exact WHOOP 5.0 sensor layout.
