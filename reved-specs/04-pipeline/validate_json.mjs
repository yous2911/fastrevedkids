#!/usr/bin/env node

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFile } from 'fs/promises';
import { glob } from 'glob';
import path from 'path';

const schemaPath = path.resolve('02-json-schema/exercise.schema.json');
const files = await glob('02-json-schema/examples/*.json');

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const schema = JSON.parse(await readFile(schemaPath, 'utf8'));
const validate = ajv.compile(schema);

let ok = true;
for (const f of files) {
  const data = JSON.parse(await readFile(f, 'utf8'));
  const valid = validate(data);
  if (!valid) {
    ok = false;
    console.error(`\n❌ ${f}`);
    for (const err of validate.errors) {
      console.error('  -', err.instancePath || '/', err.message);
    }
  } else {
    console.log(`✅ ${path.basename(f)} valid`);
  }
}

if (!ok) process.exit(1);
