import fs from 'fs/promises';
import path from 'path';

export async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

export async function saveBuffer(filePath, buf) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, buf);
  return filePath;
}

export function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
