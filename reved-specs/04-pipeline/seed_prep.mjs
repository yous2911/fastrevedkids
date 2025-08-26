#!/usr/bin/env node

import { readFile, writeFile, mkdir } from 'fs/promises';
import { glob } from 'glob';
import path from 'path';

const outDir = '05-seeds/dist';
await mkdir(outDir, { recursive: true });

const files = await glob('05-seeds/**/*.json', { ignore: ['**/dist/**', '**/report.json'] });
const out = [];

for (const f of files) {
  const ex = JSON.parse(await readFile(f, 'utf8'));

  if (!ex.version) ex.version = 1;
  if (!ex.locale) ex.locale = process.env.DEFAULT_LOCALE || 'fr-FR';

  for (const key of ['question_audio_url', 'image_url']) {
    if (typeof ex[key] === 'string' && !ex[key].startsWith('http')) {
      const base = (process.env.MEDIA_BASE_URL || '').replace(/\/$/, '');
      if (base) ex[key] = `${base}/${ex[key].replace(/^\//, '')}`;
    }
  }
  for (const step of ex.step_by_step_solution || []) {
    if (step.explanation_audio_url && !String(step.explanation_audio_url).startsWith('http')) {
      const base = (process.env.MEDIA_BASE_URL || '').replace(/\/$/, '');
      if (base) step.explanation_audio_url = `${base}/${String(step.explanation_audio_url).replace(/^\//, '')}`;
    }
  }

  out.push(ex);
}

await writeFile(path.join(outDir, 'seed.json'), JSON.stringify(out, null, 2));
console.log(`✅ Seed written: ${path.join(outDir, 'seed.json')} (${out.length} exercises)`);
