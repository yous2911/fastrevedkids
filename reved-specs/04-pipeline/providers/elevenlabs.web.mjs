import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs/promises';
import { ensureDir, saveBuffer, sleep } from './utils.mjs';
import dotenv from 'dotenv';
dotenv.config();

const ELEVEN = {
  email: process.env.ELEVEN_EMAIL,
  password: process.env.ELEVEN_PASSWORD,
  voiceName: process.env.ELEVEN_VOICE_NAME || 'French',
  storageState: process.env.ELEVEN_COOKIES || './.auth/elevenlabs.storage.json'
};

async function safeReadState(p) {
  try { return JSON.parse(await fs.readFile(p, 'utf8')); } catch { return undefined; }
}

async function getBrowser() {
  const browser = await chromium.launch({ headless: false, slowMo: 150 });
  const context = await browser.newContext({ storageState: await safeReadState(ELEVEN.storageState) });
  const page = await context.newPage();
  return { browser, context, page };
}

async function saveState(context, p) {
  await ensureDir(path.dirname(p));
  await context.storageState({ path: p });
}

export async function elevenLogin(page, context) {
  await page.goto('https://elevenlabs.io/app');
  if ((await page.locator('text=Speech Synthesis').count()) > 0) return;

  await page.goto('https://elevenlabs.io/sign-in');
  await page.fill('input[type=email]', ELEVEN.email);
  await page.fill('input[type=password]', ELEVEN.password);
  await page.click('button:has-text("Sign in")');
  await page.waitForLoadState('networkidle');
  await saveState(context, ELEVEN.storageState);
}

export async function synthesizeAll(exercise, outDirBase) {
  const { browser, context, page } = await getBrowser();
  try {
    await elevenLogin(page, context);
    await page.goto('https://elevenlabs.io/app/speech-synthesis');
    await page.waitForLoadState('networkidle');

    const outDir = path.join(outDirBase, exercise.exercise_id);
    await ensureDir(outDir);

    async function generateOne(text, filename) {
      if (!text || !text.trim()) return null;

      await page.click('button:has-text("New project"), button:has-text("New generation")', { timeout: 5000 }).catch(() => {});
      await page.locator('button:has-text("Voice"), [data-testid="voice-selector"]').first().click({ timeout: 8000 }).catch(() => {});
      await page.fill('input[placeholder*="Search" i]', ELEVEN.voiceName).catch(() => {});
      await page.keyboard.press('Enter').catch(() => {});

      const area = page.locator('textarea, [contenteditable="true"]');
      await area.first().click({ timeout: 8000 });
      await area.first().fill(text.slice(0, 4800));

      const genBtn = page.locator('button:has-text("Generate"), button:has-text("Convert")').first();
      await genBtn.click();

      const response = await page.waitForResponse(r => /\.mp3(\?|$)/.test(r.url()), { timeout: 120000 });
      const buf = await response.body();
      const filePath = path.join(outDir, filename);
      await saveBuffer(filePath, buf);
      return filePath;
    }

    const results = { question_audio_url: null, steps: [] };
    results.question_audio_url = await generateOne(exercise.question_text, 'question.mp3');

    for (const step of exercise.step_by_step_solution || []) {
      const p = await generateOne(step.explanation_text, `step-${step.step}.mp3`);
      results.steps.push({ step: step.step, path: p });
      await sleep(1200);
    }

    return results;
  } finally {
    await context.storageState({ path: ELEVEN.storageState });
    await browser.close();
  }
}
