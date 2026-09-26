// Lists every open question in src/data/portfolio.yaml, grouped by entry. Run: npm run open
import fs from 'node:fs';
import yaml from 'js-yaml';
const d = yaml.load(fs.readFileSync(new URL('../src/data/portfolio.yaml', import.meta.url), 'utf8'));
let n = 0;
const show = (title, list) => { if (!list?.length) return; console.log(`\n${title}`); list.forEach(q => { n++; console.log(`  - ${q}`); }); };
d.experience.forEach(e => show(`Experience: ${e.company}`, e.open));
d.projects.forEach(p => show(`Project: ${p.name} (${p.status})`, p.open));
d.research.forEach(r => show(`Research: ${r.lab}`, r.open));
show('Site-wide', d.open);
console.log(`\n${n} open questions.`);
