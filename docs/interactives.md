# Interactives: what is built and how

Entry facts, copy, sources and open questions live in `src/data/portfolio.yaml`. This file only records how the custom visuals work. Every simulated visual carries an "illustrative" caption.

## WHOOP (`/experience/whoop`)
- **Rendering** (Sept 27, 2026): `mkStudio()` in `whoop-common.js`. Half-float 4x MSAA buffer, bloom threshold 4.5 (only LEDs driven to about 8 bloom), ACES filmic tone mapping, background colour solved so the canvas matches the page after tone mapping, PMREM studio environment of softbox strips (edge highlights on black anodize), PCF shadows with radius, contact shadow on a faint floor pool (re-rendered only when parts move; the pool's gradient fill was commented out by accident until Sept 27, 2026, so keep its tone low, about .008, or it shows a horizon arc), physically based material recipes (`PBR`) with a shared noise roughness map. MediScan still uses the older `mkPipe()`.
- **Performance** (Sept 27, 2026; measured at 1x, 962 x 836 canvas):
  - **Result:** frame time went from 14 to 18 ms down to 8 to 10 ms (the zoom is about 11 ms), and draw calls from about 480 to about 100.
  - **Merged meshes:** within each explode group, opaque meshes sharing a material are merged at load, so highlights stay per group.
  - **Shadows on demand:** the shadow map redraws only when parts move (`P.shadow()`), not every frame.
  - **Zoom-only effects:** bloom, the particle cone and the LED halos run only during the zoom. They render once on the first frame so no shader compiles mid-scroll. Keep the point light always on: toggling a light recompiles every material.
  - **One output pass:** ACES and sRGB share a single full-screen pass.
  - **Adaptive resolution:** `P.adapt()` steps the pixel ratio down by 0.25, never below 1, only if frames average over 24 ms.
- **Dev capture hook:** in `npm run dev`, `window.__tb.shot(progress, t)` renders a given scroll position so frames can be saved for review, and `__tb.bench(progress)` returns ms per frame, draw calls and shader compiles (both stripped from production builds).
- **Exploded testbed** (`testbed.js`, scroll, 6 steps): blackout enclosure, breadboard + K-Cube controllers, Thorlabs 3-axis stage, precision fixture, fiber + Feasa analysers, WHOOP 5.0. Steps 1 to 5 share the first 70% of the scroll (section is 600vh, about 70vh per step). The zoom onto the lit DUT then holds for the last 30% (about 150vh): the camera slowly orbits the pod and the light field rises with scroll, before the project Results. Camera pulls back on narrow canvases so the rig stays in frame. Enclosure panels and frame bars on the camera side cut away as the camera orbits. Lit LEDs get a coloured halo sprite each, because ACES turns the bright dies white. No caption (Akkhil removed it, Sept 27, 2026).
- **Battery check** (`battery.js`, simplified at Akkhil's request): Healthy / Bad capacitor toggle, spectrum, PASS/FLAG.
- **Live test DAG** (`ate-dag.js`, replaced the fleet chart Sept 27, 2026): six test steps as a dependency graph (Flash, Boot, then Sensors to Optical and Battery to Radio in parallel). DAG vs legacy serial toggle, clock, shared-scale timeline bars (50 s vs 35 s, 30% faster). Click a step to make it fail: DAG skips only its dependents, serial aborts the rest. Runs once on scroll into view. Illustrative steps and timings.

## Avanos (`/experience/avanos`, showcase since Sept 28, 2026; content from Akkhil's write-up, Oct 8, 2026)
- **Projects:** pump leak-test fixture, failure reporting analytics (SAP and Salesforce), 6-axis robot validation software (DOBOT CR5A). The enteral feeding tube fixture is listed under Additional projects. Hero image `public/images/game-ready.webp`, from Akkhil's `gameready.jpg` with the white background and drop shadow removed.
- **Pump leak-test monitor** (`pump-trace.js`): 10 pumps held at 75 psi over a 12-hour run, compressed to about 9 s, then a 2 s hold and repeat.
  - Ten P1 to P10 buttons toggle a leak. P4 leaks by default because only a handful of the 115 pumps leaked.
  - A leaking pump sags past the leak threshold, gets an X marker and "P# power cut", and its button reads CUT.
  - The verdict reads hours elapsed, then "N LEAKS" or "ALL HOLD".
  - The threshold is drawn without a number because Akkhil does not remember the real value.
  - Dev hook: `__pump.shot(hours)`. Illustrative.
- **Robot project:** no interactive (Akkhil's call, Oct 8, 2026). It shows two product photos on white tiles: the DOBOT CR5A (`dobot-robot.webp`, Akkhil's transparent PNG composited onto white; model and CORTRAK naming confirmed Oct 8, 2026) and the CORTRAK 2 it validated (`cortrak-2.webp`, near-white background lifted to pure white). The old `robot.js` viewer was removed.
- **Analytics system diagram** (static HTML and CSS in `avanos.astro`, `.sys` styles in `case.css`; Akkhil chose static, Oct 8, 2026):
  - Data-source lane: customer to Salesforce, device shipped to service center, then to SAP.
  - Example record card: Salesforce "Pump leaking", SAP "Non-pump fault", "Pump replaced, looked old or rusted", flagged "Mislogged pump failure".
  - "What I built" lane in accent: Salesforce and SAP, REST APIs, Python analysis, Streamlit app (CI/CD), R&D and Quality engineers.
  - The pipeline stacks vertically under 900px. Caption says the example record is illustrative.

## GT Medical Robotics (`/experience/gt-medical-robotics`, showcase with one project since Oct 8, 2026)
- **Hand CAD explode** (`gt-hand.js`):
  - **Model:** the team's `PhantomLimb.stl` (Akkhil, Oct 8, 2026; OK to publish), converted by `tools/hand-to-glb.py` into `public/models/hand.glb`. 290k to 97k triangles, 1.75 MB, 22 nodes: palm, palm_hw, backplate, thumb base, proximal and distal, and f1 to f4 base, proximal, middle and distal.
  - **Rendering:** the `mkStudio` pipeline with a floor and contact shadow.
  - **Controls:** drag or arrow keys rotate. The Explode slider sends parts out along the line from the palm centre; the back plate lifts off and the hardware drops out the front.
  - **"My parts":** ghosts everything but Akkhil's wrist and palm, which are always green. Other parts are grey PLA, hardware satin metal.
  - **Behaviour:** loads lazily, auto-spins until touched, and skips frames when idle.
  - **Dev hooks:** `__gt.shot(explode, yaw)` and `__gt.hero()`, which returns a transparent square PNG used for the hero image `public/images/gt-hand.webp`.
- The old placeholder `prosthesis.js` arm was removed.

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

## Testbed geometry (phase 5, built Sept 27, 2026)
Phases 1 to 4 (the `mkStudio` render pipeline above) and phase 5 (geometry from Thorlabs drawings, approved by Akkhil Sept 27, 2026) are done. Layout in `testbed.js` (mm, y up, breadboard top y = 12.7):
- **Breadboard:** MB3045/M, 300 (x) by 450 (z), 216 M6 holes on 25 mm, five counterbored mounting screws.
- **Stage:** MT3/M-Z9 centred at x -75, z -37.5, built from the drawing:
  - MT401 base plate 61 x 2.9 x 108 with four slot screws, then two 61 x 24.15 x 61 MT1 axes.
  - MT402 angle plate: a 61.1 L section with a concave quarter-round back.
  - Vertical Z axis facing +z, and three Z912B actuators (Ø9.5 barrel, Ø15 housing, printed labels).
  - X actuator points +x, Y points -z, Z points up (top at about 262).
- **Fixture:** bead-blast aluminium adapter on the Z carriage with dowel pins, arm and clamp holding a Ø4.57 x 50 optical head. The tip sits 2.7 mm above the pod, and the head feeds a breakout into two fibers.
- **Base plate:** 100 x 75 x 8 at z 62.5, with four counterbored M6 screws on the grid and a 35.3 x 24.6 pocket, 4 deep.
- **K-Cubes:** three KDC101 at z -170, fronts toward the rig:
  - red ribbed side extrusions, black plates, clip-on base with quick-release clamps
  - gold SMA I/O, power switch, USB and power jack on the front; display showing a position, menu button and velocity wheel on top
  - D-sub motor plugs on the back
- **Feasa analysers:** LED (105 x 57 x 50, silver ribbed, black caps, 10 fiber ports) and IR (86 x 57 x 55, red ribbed, silver flanges, 2 ports), front right.
- **Enclosure:** 25 mm T-slot frame 370 x 360 x 550 with TB4-style panels.
- **Cables:** motor cables drape off the back edge of the board to the K-Cube plugs.

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

## WHOOP 5.0 device model (built Sept 27, 2026)
Akkhil asked how to make the DUT (`makePod()` in `whoop-common.js`) look realistic. Today it is a primitive rounded box, 32.6 x 9.6 x 23.4 scene units, with a lens, a ring, five LEDs in a row (G G R IR G) and four photodiodes, and a `0x0c0c0d` shell (metalness .1, roughness .5).
- **Limits:** no AI-generated WHOOP imagery, and never the real rig photo. Use public specs only: 5 LEDs (3 green, 1 red, 1 IR), 4 photodiodes, 28 g, about 7% smaller than the 4.0.
- **Options to put to Akkhil:**
  1. Model it from published dimensions and review photos.
  2. Use a licensed 3D model.
  3. Photograph the underside of his own device as a texture reference.
  4. Photogrammetry of his own device.
- **Findings (Sept 27, 2026):**
  - **Size:** official 34.7 x 24 x 10.6 mm (support.whoop.com, WHOOP Basics and "Unlock New with WHOOP 5.0"). About 26.5 g with the band; pod-only weight is not published.
  - **FCC IDs:** model WG50, FCC ID 2AJ2X-WG50. The MG is WS50.
  - **Body:** matte black plastic, flat top with no logo, rounded-rectangle plan with tight corners, a band-rail groove near the sensor face on each long side.
  - **Underside (from review photos: the5krunner, road.cc, Digital Trends):**
    - a raised glossy plateau about 1 mm high, with one recessed near-black window about 55 to 60% of the length and 40% of the width
    - inside the window, along the length: 2 photodiodes (dark violet dies with a gold edge strip), a line of 5 small LEDs across the width, 2 more photodiodes
    - a small lozenge carrying the W mark at the clasp end
  - **Charging:** wireless via the slide-on PowerPack. No exposed contacts.
  - **Existing 3D models:** none usable. The 3dmodels.org terms bar extractable web use, TurboSquid WHOOP 4 models are editorial only, and the CGI agency assets are all rights reserved. Photogrammetry is a poor fit for a 35 mm glossy black part.
- **Chosen and built:** option 1. `makePod()` is modelled procedurally from the official size and the photo layout: matte body with rail grooves, glossy clearcoat plateau with the window cut through, violet photodiodes with gold strips, 5 LED dies, window glass and a plain lozenge (no logo).
- **Still open (for Akkhil):**
  - Calipers check against his own 5.0.
  - The LED order across the width (currently G G R IR G).
  - The underside text on a plain 5.0.
  - The plateau material.
  - A reference photo of his own underside, to use for modelling only and never published.

## Parked quality ideas
- Upgrade three.js 0.149 to current (about 0.186): OutputPass with Neutral/AgX tone mapping, N8AO ambient occlusion, anisotropic milled aluminium, `scene.environmentIntensity`. Needs visual retuning of every 3D scene (hex colours darken, light units change).
- Move MediScan to `mkStudio()`; compress its GLBs with gltfpack meshopt (Vercel does not gzip .glb).
- Real CAD for the prosthetic arm and robot.
