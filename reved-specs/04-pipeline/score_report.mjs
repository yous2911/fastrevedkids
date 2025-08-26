#!/usr/bin/env node

import { readFile, writeFile } from 'fs/promises';
import { glob } from 'glob';

const files = await glob('05-seeds/**/*.json', { ignore: ['**/dist/**', '**/report.json'] });

const rows = [];
for (const f of files) {
  const ex = JSON.parse(await readFile(f, 'utf8'));
  const s = ex.judge_scores || { clarity: 0, factuality: 0, age_fit: 0, overall: 0 };
  const overall = s.overall || (0.4 * s.clarity + 0.4 * s.factuality + 0.2 * s.age_fit);
  rows.push({ file: f, skill_id: ex.skill_id, diff: ex.difficulty_level, overall, clarity: s.clarity, factuality: s.factuality, age_fit: s.age_fit });
}

rows.sort((a, b) => b.overall - a.overall);

const bySkill = new Map();
for (const r of rows) {
  const key = `${r.skill_id}#${r.diff}`;
  if (!bySkill.has(key)) bySkill.set(key, []);
  bySkill.get(key).push(r);
}

const summary = [];
for (const [key, list] of bySkill) {
  summary.push({ bucket: key, top5: list.slice(0, 5) });
}

await writeFile('05-seeds/report.json', JSON.stringify({ ranked: rows, buckets: summary }, null, 2));
console.log('✅ Wrote 05-seeds/report.json (ranked + top5 per skill/difficulty)');
