// Single source of truth for site copy. Edit here; pages read from this file.
// Items marked TODO need details from Akkhil before launch.
export const site = {
  name: 'Akkhil Morkonda',
  description: 'Biomedical engineer at Georgia Tech. I build sensors, robots, and the systems that test them.',
  email: 'amorkonda28@gmail.com',
  linkedin: 'https://linkedin.com/in/akkhil-morkonda',
  github: null, // TODO: add GitHub URL if wanted
  resume: null, // TODO: add /resume.pdf (consider removing phone number first)
  portrait: null, // TODO: add /portrait.jpg (4:5); About shows it only when set
};

export const hero = {
  headline: 'Engineering by Akkhil, built and tested.',
  sub: 'Biomedical engineer at Georgia Tech. I build sensors, robots, and the systems that test them.',
};

export const about =
  "Fourth-year Biomedical Engineering student at Georgia Tech with a minor in Embedded Devices. 5+ years building and leading end-to-end biomedical product innovation across medical devices, robotics and digital health sensing, in regulated environments. Passionate about optimizing human performance through recovery and rehabilitation technology.";

export const education = {
  school: 'Georgia Institute of Technology',
  degree: 'B.S. Biomedical Engineering',
  minor: 'Minor in Embedded Devices',
  dates: 'Aug 2023 to May 2027',
  gpa: '4.0',
  ta: {
    course: 'Intro to Biomedical Engineering Design',
    dates: 'Jan to Dec 2025',
    text: 'Led milestone design reviews for 100+ students on verification planning, FMEA and engineering trade-offs. Final project performance up 22%.',
  },
};

export const experience = [
  {
    slug: 'whoop', company: 'WHOOP', role: 'Manufacturing Test Engineering Intern', dates: 'Jan 2026 to Jun 2026',
    stat: '$1.8M', statLabel: 'saved by battery diagnostics',
    summary: 'Rebuilt HIL test across 12 fixtures and built the optical testbed that characterizes the sensor LEDs.',
    ready: true,
  },
  {
    slug: 'avanos', company: 'Avanos Medical', role: 'R&D Engineering Intern', dates: 'May to Aug 2025',
    stat: '1000+', statLabel: 'hours of validation automated',
    summary: 'Built a LabVIEW test fixture, 6-axis robot control software and an analytics platform to root-cause pump failures.',
    ready: true,
  },
  {
    slug: 'gt-medical-robotics', company: 'GT Medical Robotics', role: 'Mechanical Engineering Team Lead', dates: 'Sept 2023 to Dec 2025',
    stat: '+35%', statLabel: 'wrist factor of safety, at lower weight',
    summary: 'Led electromechanical integration of a trans-radial prosthetic arm across a 17-member team.',
    ready: true,
  },
];

// In order of importance. A `slug` makes the card open /projects/<slug>.
export const projects = [
  { name: 'MediScan', slug: 'mediscan', tag: 'I2CE Lab VIP, team lead, 2026', text: 'Portable point-of-care diagnostics for low-resource clinics. Led the electromechanical design: 65°C closed-loop heating, four-channel optical detection and a solar-charged power board.', feature: true },
  { name: 'Partial Weight Bearing Insole', slug: 'pwb-insole', tag: 'Jan to Jul 2025', text: 'Force sensors, embedded C++ and ESP32 telemetry for real-time plantar load monitoring in partial-weight-bearing rehab. ±3% accuracy.' },
  { name: 'Smart Respirator', tag: 'Aug 2024 to Jan 2025', text: 'Prototyped a filtering facepiece respirator that monitors pressure and dust concentration inside the mask to confirm a proper face seal and that the respirator is working. Root cause analysis and ISO regulations.' },
  { name: 'Guitar amp head', slug: 'amp-head', tag: 'Personal build', text: 'TDA2040 power stage, TL072 preamp and a Fender-style tone stack, designed in KiCad and checked in SPICE, housed in a custom clear enclosure.' },
  { name: 'Betcha', tag: 'HackMIT 2026', text: 'A prediction market for friend groups, with per-category Elo ratings setting the odds.' },
];

// Coming soon: projects in progress. No deep dives; only an external link where one exists.
export const inProgress = [
  { name: 'FIXT', tag: 'Startup, co-founder', text: 'Agents that understand hardware well enough to run, monitor and control the test line end to end.', link: 'https://usefixt.ai' },
  { name: 'Non-invasive BP monitoring for LVAD patients', tag: '', text: 'Non-invasive blood pressure monitoring for patients living with a left ventricular assist device.' },
];

export const research = [
  { slug: 'wearable-robotics', lab: 'Physiology of Wearable Robotics Lab', role: 'Undergraduate Research Assistant', dates: 'May 2025 to present', text: 'Designed EMG acquisition protocols for 50+ human-subject studies and built MATLAB pipelines for time-series analysis and real-time control.' },
  { lab: 'Structured Information for Precision Neuroengineering Lab', role: 'Undergraduate Research Assistant', dates: 'Dec 2024 to May 2025', text: 'Built 40+ test cases and Brian2 simulation environments for closed-loop electrophysiology, modeling neural dynamics under raster-scanned calcium imaging.' },
];
