# Content: work experience

Source: resume (Sept 2026) plus Akkhil's corrections. `[?]` = question for Akkhil.

Order on the site: WHOOP, Avanos, GT Medical Robotics, then TA as a small line (not a case study).

## Build status
- Live case studies: `/experience/whoop`, `/experience/avanos`, `/experience/gt-medical-robotics`.
- All 3D geometry and data are illustrative placeholders until real CAD and data arrive. Each visual says so in its caption.

---

## 1. WHOOP

**Role:** Manufacturing Test Engineering Intern, Jan 2026 to Jun 2026
**Headline:** Scaling test for a wearable fleet.
**One-liner:** Rebuilt WHOOP's HIL test system across 12 fixtures and built the optical testbed that characterizes its LEDs.
**Stats:** 30% faster test time · 95% pytest coverage · $1.8M saved by battery diagnostics · 40% fewer false failures

### Beats
1. **Problem.** Legacy ATE didn't scale as the fixture fleet grew. `[?] what broke first: throughput, flaky results, maintenance?`
2. **Test architecture.** Distributed, DAG-scheduled HIL system across 12 fixtures. Test time down 30%, pytest coverage up to 95%.
3. **Optical testbed.** Thorlabs 3-axis, nanometer-resolution stage for LED characterization, precision fixtures for repeatable HIL and black-box validation.
4. **Bad capacitors from current alone.** Firmware samples raw battery current over BLE, FFT features, inline logistic regression. 99% accuracy, $1.8M saved.
5. **Rig faults vs device faults.** Fleet-wide analysis isolated testbed faults from real DUT defects. False failures down 40%.

### Built interactives
- **Exploded testbed** (scroll, 6 steps): blackout enclosure, breadboard + K-Cube controllers, Thorlabs 3-axis stage, precision fixture, fiber + Feasa analysers, WHOOP 5.0. Ends by zooming into the DUT with LEDs on, leading into "What it measures".
- **Brightness volume viewer:** green / IR LED, volume / slice view, slice height, threshold, scan replay.
- **Battery check** (simplified at Akkhil's request): Healthy / Bad capacitor toggle, spectrum, PASS/FLAG.
- **Fleet chart:** 12 fixture lanes, Legacy ATE vs DAG scheduler, run time 100% to 70%.

### Confirmed facts
- Thorlabs **3-axis** translation stage (NOT 5-axis; the resume bullet should also say 3-axis). Thorlabs K-Cube motor controllers.
- DUT = **WHOOP 5.0**, fixed sensor-side up in a base-plate pocket; the stage moves the fiber probe above it.
- Rig: optical breadboard, vertical fiber probe, Feasa LED Analyser + Feasa IR Analyser, cardboard blackout enclosure.
- Output: 3D volumetric brightness plots (x/y/z relative mm), one per LED.
- WHOOP 5.0 public specs used for the model: 5 LEDs (3 green, 1 red, 1 IR), 4 photodiodes, 28 g. Exact LED layout approximated.
- **Never publish the real rig photo.** No standalone WHOOP hero render.

### Open questions
- `[?]` CAD of the testbed or fixtures (STEP/GLB), or Thorlabs part numbers.
- `[?]` NDA: OK to say "capacitor" and "$1.8M" publicly (resume already does)?
- `[?]` DAG scheduler stack (Airflow, Prefect, custom)?
- `[?]` How was $1.8M calculated? One sentence.
- `[?]` Scan grid size/step; what the "fit model" fits; can real scan data (CSV) be exported?

---

## 2. Avanos Medical

**Role:** R&D Engineering Intern, May to Aug 2025
**Headline:** Root-causing failures in high-pressure pumps.
**One-liner:** Built the test fixture, robot automation and analytics that traced pump failures back to their cause.
**Stats:** $40M inventory covered by the CAPA · 1000+ hours of validation automated · 95% faster failure analysis · 6-axis robot

### Beats
1. **Problem.** Electromechanical failures in high-pressure pumps, $40M of inventory on the line.
2. **Test fixture.** LabVIEW + NI myDAQ fixture to root-cause failures, feeding an ISO-compliant CAPA.
3. **Robot automation.** C++ control software for a 6-axis robot: 3D trajectory interpolation, joint kinematics, TCP command streaming under ISO 12207. Replaced 1000+ hours of manual validation.
4. **Analytics.** CI/CD-deployed platform joining SAP and Salesforce data to catch SKU-level discrepancies. Failure analysis time down 95%.

### Built interactives
- **Robot viewer:** 6-axis arm replaying an interpolated path, trajectory scrubber, play/pause, live joint angles J1 to J6.
- Not built: pump cross-section idea (generic cutaway showing the failure location).

### Open questions
- `[?]` Pump type / product line that can be named? Root cause at whatever level is allowed?
- `[?]` Robot brand/model? Photo or video?
- `[?]` Fixture photo or LabVIEW front-panel screenshot?

---

## 3. Georgia Tech Medical Robotics

**Role:** Mechanical Engineering Team Lead, Sept 2023 to Dec 2025
**Headline:** A lighter, stronger prosthetic wrist.
**One-liner:** Led electromechanical integration of a trans-radial prosthetic arm across a 17-member team and redesigned its multi-DOF wrist.
**Stats:** +35% wrist factor of safety · 17 engineers · multi-DOF wrist · lighter `[? how much]`

### Beats
1. **Problem.** The wrist had to hit torque and range-of-motion targets without adding weight.
2. **Integration.** Owned how actuation, sensing and structure fit together across sub-teams.
3. **Wrist redesign.** CAD + FEA iterated under dynamic loading. Factor of safety up 35%, weight down.
4. **Result.** `[?] built and tested? demo, competition, user trial?`

### Built interactives
- **Explodable arm:** explode slider, Original / Redesign wrist toggle, relative peak stress and factor of safety readouts, stress color legend.

### Open questions
- `[?]` CAD of the arm/wrist (the most valuable asset for the whole site). FEA screenshots before/after?
- `[?]` Photos of the arm, team photo?
- `[?]` Actuators and sensors used? Link to the EMG lab work?

---

## 4. Teaching Assistant (small line on the homepage)

**Intro to Biomedical Engineering Design, Jan to Dec 2025.** Led milestone design reviews for 100+ students on verification planning, FMEA and trade-offs; final project performance up 22%.

---

## Parked quality pass
- Replace primitive geometry with real models: Thorlabs stage / actuator / K-Cube STEP files (need part numbers), fixture CAD if allowed. Convert STEP to GLB.
- Exact WHOOP 5.0 sensor-face layout.
- Possible upgrades: SSAO, HDRI lighting, higher shadow resolution, real scan data in the brightness volume.
