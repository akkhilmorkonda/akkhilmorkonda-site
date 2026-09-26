// Loads src/data/portfolio.yaml (the single source of truth), validates it, and exposes
// the shapes pages use. Edit the YAML, not this file.
import yaml from 'js-yaml';
import { z } from 'astro/zod';
import raw from './portfolio.yaml?raw';

const str = z.string().min(1);
const stat = z.object({ value: z.union([str, z.number()]).transform(String), label: str });
const page = z.object({
  title: str, crumb: str, description: str,
  headline: str, roleLine: str, lead: str,
  stats: z.array(stat).optional(),
  chain: z.array(z.object({ label: str, sub: str, on: z.boolean().optional() })).optional(),
  // every deep dive answers What, Why, How, Results (CLAUDE.md)
  brief: z.object({ what: str, why: str, how: z.array(str).min(1), results: z.array(str).min(1) }),
  // optional: headline projects with their own section, and smaller additional projects
  core: z.array(z.object({ key: str, title: str, summary: str, points: z.array(str).min(1), result: str })).optional(),
  more: z.array(z.object({ title: str, summary: str, result: str.optional() })).optional(),
});
const notes = { facts: z.array(str).optional(), sources: z.array(str).optional(), open: z.array(str).optional() };

const schema = z.object({
  site: z.object({ name: str, description: str, email: str, linkedin: str, github: z.string().nullable(), resume: z.string().nullable(), portrait: z.string().nullable() }),
  hero: z.object({ headline: str, sub: str }),
  about: str,
  education: z.object({ school: str, degree: str, minor: str, dates: str, gpa: str, ta: z.object({ course: str, dates: str, text: str }) }),
  logos: z.array(z.object({ name: str, src: str, ratio: str, h: z.number() })),
  experience: z.array(z.object({ slug: str, company: str, role: str, dates: str, summary: str, stat: z.union([str, z.number()]).transform(String), statLabel: str, page, ...notes })),
  projects: z.array(z.object({ name: str, slug: str.optional(), status: z.enum(['live', 'in-progress', 'hidden']), feature: z.boolean().optional(), tag: z.string(), text: str, link: z.string().url().optional(), page: page.optional(), ...notes })
    .refine(p => !p.slug || p.page, p => ({ message: `project "${p.name}" has a slug but no page:` }))),
  research: z.array(z.object({ slug: str.optional(), lab: str, role: str, dates: str, text: str, page: page.optional(), ...notes })
    .refine(r => !r.slug || r.page, r => ({ message: `research "${r.lab}" has a slug but no page:` }))),
  open: z.array(str).optional(),
});

const parsed = schema.safeParse(yaml.load(raw));
if (!parsed.success) {
  const msg = parsed.error.issues.map(i => `  ${i.path.join('.')}: ${i.message}`).join('\n');
  throw new Error(`src/data/portfolio.yaml is invalid:\n${msg}`);
}
const data = parsed.data;

export const { site, hero, about, education, logos, experience, research } = data;
export const projects = data.projects.filter(p => p.status === 'live');
export const inProgress = data.projects.filter(p => p.status === 'in-progress');

/** Core project by key within a deep dive: core(e, 'optical'). */
export const core = (e, key) => { const c = e.page.core?.find(x => x.key === key); if (!c) throw new Error('No core project ' + key + ' in ' + e.page.title); return c; };

/** Deep-dive data for a page: entry('experience' | 'projects' | 'research', slug). */
export function entry(kind, slug) {
  const e = data[kind].find(x => x.slug === slug);
  if (!e?.page) throw new Error(`No page for ${kind}/${slug} in portfolio.yaml`);
  return e;
}
