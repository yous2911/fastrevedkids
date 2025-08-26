import fs from 'fs/promises';
import fse from 'fs-extra';
import path from 'path';
import { glob } from 'glob';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

import { synthesizeAll } from './providers/elevenlabs.web.mjs';
import { mjGenerateImage } from './providers/midjourney.discord.mjs';

const SCHEMA_PATH = path.resolve('02-json-schema/exercise.schema.json');
const PENDING_DIR = '05-seeds/pending';
const FINAL_DIR = '05-seeds/cp';
const AUDIO_DIR = '06-media/audio';
const IMAGE_DIR = '06-media/images';

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
  return crypto.createHash('sha256').update(JSON.stringify(subset)).digest('hex');
}

async function loadSchema() {
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const schema = JSON.parse(await fs.readFile(SCHEMA_PATH, 'utf8'));
  return ajv.compile(schema);
}

async function main() {
  await fse.ensureDir(PENDING_DIR);
  await fse.ensureDir(FINAL_DIR);

  const files = await glob(`${PENDING_DIR}/*.json`);
  if (!files.length) {
    console.log('No pending exercises. Put files into 05-seeds/pending/');
    return;
  }

  const validate = await loadSchema();

  for (const file of files) {
    const ex = JSON.parse(await fs.readFile(file, 'utf8'));

    if (!validate(ex)) {
      console.error(`❌ Invalid schema: ${file}`);
      console.error(validate.errors);
      continue;
    }

    ex.content_hash = fingerprint(ex);

    try {
      const res = await synthesizeAll(ex, AUDIO_DIR);
      if (res?.question_audio_url) {
        ex.question_audio_url = path.relative('.', res.question_audio_url).replace(/\\/g, '/');
      }
      for (const st of res?.steps || []) {
        const step = ex.step_by_step_solution.find(s => s.step === st.step);
        if (step && st.path) step.explanation_audio_url = path.relative('.', st.path).replace(/\\/g, '/');
      }
    } catch (e) {
      console.error('AUDIO generation failed:', e.message);
    }

    try {
      if (ex.image_prompt) {
        const imgPath = await mjGenerateImage(ex.image_prompt, IMAGE_DIR, ex.exercise_id);
        ex.image_url = path.relative('.', imgPath).replace(/\\/g, '/');
      }
    } catch (e) {
      console.error('IMAGE generation failed:', e.message);
    }

    if (!validate(ex)) {
      console.error(`❌ Post-media invalid: ${file}`);
      console.error(validate.errors);
      continue;
    }

    const outPath = path.join(FINAL_DIR, path.basename(file));
    await fs.writeFile(outPath, JSON.stringify(ex, null, 2));
    console.log('✅ Finalized:', outPath);
  }

  console.log('\nDone. Next: npm run seed:prep');
}

main().catch(err => { console.error(err); process.exit(1); });
