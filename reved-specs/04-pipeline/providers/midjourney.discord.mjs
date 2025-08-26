import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs/promises';
import { ensureDir, saveBuffer, sleep } from './utils.mjs';
import dotenv from 'dotenv';
dotenv.config();

const DISCORD = {
  email: process.env.DISCORD_EMAIL,
  password: process.env.DISCORD_PASSWORD,
  storageState: process.env.DISCORD_COOKIES || './.auth/discord.storage.json',
  guildId: process.env.DISCORD_GUILD_ID,
  channelId: process.env.DISCORD_CHANNEL_ID,
  slowModeMs: Number(process.env.MIDJOURNEY_SLOW_MODE_MS || 4000)
};

async function safeReadState(p) { try { return JSON.parse(await fs.readFile(p, 'utf8')); } catch { return undefined; } }

async function getBrowser() {
  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const context = await browser.newContext({ storageState: await safeReadState(DISCORD.storageState) });
  const page = await context.newPage();
  return { browser, context, page };
}

export async function discordLogin(page) {
  await page.goto('https://discord.com/login');
  if ((await page.locator('nav[aria-label="Servers"]').count()) > 0) return;
  await page.fill('input[name=email]', DISCORD.email);
  await page.fill('input[name=password]', DISCORD.password);
  await page.click('button[type=submit]');
  await page.waitForLoadState('networkidle');
}

async function openChannel(page) {
  const url = `https://discord.com/channels/${DISCORD.guildId}/${DISCORD.channelId}`;
  await page.goto(url);
  await page.waitForSelector('[data-slate-editor="true"], div[role=textbox]');
}

async function sendImagine(page, prompt) {
  const box = page.locator('[data-slate-editor="true"], div[role=textbox]');
  await box.click();
  await box.type('/imagine');
  await sleep(800);
  await page.keyboard.press('Enter');
  await sleep(600);
  await box.type(prompt);
  await page.keyboard.press('Enter');
}

async function waitForMJImage(page) {
  const selector = `img[src*="cdn"], a[href*="cdn.discordapp.com/attachments"]`;
  const timeout = Date.now() + 180000;
  while (Date.now() < timeout) {
    const links = await page.locator(selector).elementHandles();
    if (links.length > 0) {
      for (let i = links.length - 1; i >= 0; i--) {
        const el = links[i];
        const src = await el.getAttribute('src') || await el.getAttribute('href');
        if (src && /\.(png|jpg|jpeg)$/.test(src)) return src;
      }
    }
    await sleep(2000);
  }
  throw new Error('Timeout waiting for Midjourney image');
}

async function downloadImage(page, url, outPath) {
  const resp = await page.request.get(url);
  const buf = await resp.body();
  await saveBuffer(outPath, buf);
  return outPath;
}

export async function mjGenerateImage(imagePrompt, outDirBase, exerciseId) {
  const { browser, context, page } = await getBrowser();
  try {
    await discordLogin(page);
    await openChannel(page);
    await sendImagine(page, imagePrompt);
    await sleep(DISCORD.slowModeMs);

    const url = await waitForMJImage(page);
    const outDir = path.join(outDirBase, exerciseId);
    await ensureDir(outDir);
    const outPath = path.join(outDir, 'image.png');
    await downloadImage(page, url, outPath);
    return outPath;
  } finally {
    await context.storageState({ path: DISCORD.storageState });
    await browser.close();
  }
}
