#!/usr/bin/env node

import { readFile, writeFile } from 'fs/promises';
import { createHash } from 'crypto';
import { glob } from 'glob';

function fingerprint(obj) {
  const subset = {
    skill_id: obj.skill_id,
    difficulty_level: obj.difficulty_level,
    exercise_type: obj.exercise_type,
    question_text: obj.question_text,
    options: obj.options?.map(o => ({ id: o.id, text: o.text ?? null })) ?? [],
    correct_option_id: obj.correct_option_id ?? null,
    correct_answer: obj.correct_answer ?? null,
    step_by_step_solution: obj.step_by_step_solution?.map(s => s.explanation_text) ?? [],
    key_concept_takeaway: obj.key_concept_takeaway
  };
  return createHash('sha256').update(JSON.stringify(subset)).digest('hex');
}

const files = await glob('05-seeds/**/*.json', { ignore: ['**/dist/**', '**/report.json'] });
const seen = new Map();
const report = [];

for (const f of files) {
  const data = JSON.parse(await readFile(f, 'utf8'));
  const hash = fingerprint(data);
  data.content_hash = hash;
  await writeFile(f, JSON.stringify(data, null, 2));

  if (seen.has(hash)) {
    report.push({ duplicate: f, original: seen.get(hash) });
  } else {
    seen.set(hash, f);
  }
}

if (report.length) {
  console.log('⚠️ Duplicates detected:');
  for (const r of report) console.log(` - ${r.duplicate} == ${r.original}`);
  await writeFile('05-seeds/report.json', JSON.stringify({ duplicates: report }, null, 2));
  process.exitCode = 2;
} else {
  console.log('✅ No duplicates.');
}
