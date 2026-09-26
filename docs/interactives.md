# Interactives: what is built and how

Entry facts, copy, sources and open questions live in `src/data/portfolio.yaml`. This file only records how the custom visuals work. Every simulated visual carries an "illustrative" caption.

## WHOOP (`/experience/whoop`)
- **Exploded testbed** (`testbed.js`, scroll, 6 steps): blackout enclosure, breadboard + K-Cube controllers, Thorlabs 3-axis stage, precision fixture, fiber + Feasa analysers, WHOOP 5.0. Ends by zooming into the DUT with LEDs on, leading into "What it measures". Camera pulls back on narrow canvases so the rig stays in frame.
- **Brightness volume viewer** (`volume.js`): green / IR LED, volume / slice view, slice height, threshold, scan replay.
- **Battery check** (`battery.js`, simplified at Akkhil's request): Healthy / Bad capacitor toggle, spectrum, PASS/FLAG.
- **Fleet chart** (`fleet.js`): 12 fixture lanes, Legacy ATE vs DAG scheduler, run time 100% to 70%; switches to DAG on scroll.

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

## Parked quality ideas
- Real CAD for the WHOOP testbed, prosthetic arm and robot; exact WHOOP 5.0 sensor layout; SSAO/HDRI lighting; real scan data in the brightness volume.
