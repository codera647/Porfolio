import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { openBrowser, sleep } from "../documents/browser.mjs";

const base = process.argv[2] || "http://localhost:3200";
const directory = await mkdtemp(path.join(tmpdir(), "portfolio-projects-qa-"));
const browser = await openBrowser();
try {
  await browser.send("Page.navigate", { url: `${base}/?intro=0` });
  await browser.waitFor("document.querySelectorAll('[data-scroll-scene]').length === 3");
  await browser.waitFor("document.querySelector('[data-project=\"diffwise\"]')");
  await browser.evaluate("document.fonts.ready.then(()=>true)");
  const content = await browser.evaluate(`(() => {
    const projects = document.querySelector('#projects');
    const cards = [...projects.querySelector('[class*="projectGrid"]').children];
    const locked = cards[0];
    return {
      titles: cards.map(card => card.querySelector('h4').textContent),
      beforeExperience: !!(projects.compareDocumentPosition(document.querySelector('#experience')) & Node.DOCUMENT_POSITION_FOLLOWING),
      indices: projects.querySelectorAll('[class*="projectIndex"]').length,
      locked: locked.tagName === 'ARTICLE' && !locked.querySelector('a') && locked.querySelector('[class*="lockBadge"]').textContent.trim() === 'Locked',
      videos: [...projects.querySelectorAll('video')].map(video => ({ loop: video.loop, muted: video.muted, controls: video.controls })),
    };
  })()`);
  assert.deepEqual(content.titles, ["Diffwise", "ContentForge AI", "Synapse", "AutoBG"]);
  assert(content.beforeExperience && content.locked && content.indices === 0);
  assert(content.videos.length === 3 && content.videos.every(video => video.loop && video.muted && !video.controls));

  for (const [width, height] of [[1440, 1000], [768, 900], [390, 844], [320, 740]]) {
    await browser.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 680 });
    await browser.evaluate(`window.scrollTo({top:scrollY + document.querySelector('#projects').getBoundingClientRect().top,behavior:'instant'})`);
    await sleep(800);
    const layout = await browser.evaluate(`(() => {
      const card = document.querySelector('[data-project="diffwise"]');
      const media = card.querySelector('[class*="lockedMedia"]').getBoundingClientRect();
      const badge = card.querySelector('[class*="lockBadge"]').getBoundingClientRect();
      const wordmark = card.querySelector('[class*="lockedWordmark"]').getBoundingClientRect();
      return {
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
        badgeInside: badge.left >= media.left && badge.right <= media.right && badge.top >= media.top && badge.bottom <= media.bottom,
        wordmarkInside: wordmark.left >= media.left && wordmark.right <= media.right && wordmark.top >= media.top && wordmark.bottom <= media.bottom,
        tagsInside: [...card.querySelectorAll('li')].every(tag => tag.getBoundingClientRect().right <= card.getBoundingClientRect().right + 1),
        grain: getComputedStyle(card.querySelector('[class*="lockedMedia"]')).backgroundImage.includes('data:image/svg'),
      };
    })()`);
    assert(!layout.overflow && layout.badgeInside && layout.wordmarkInside && layout.tagsInside && layout.grain, `Layout issue at ${width}: ${JSON.stringify(layout)}`);
    const { data } = await browser.send("Page.captureScreenshot", { format: "png" });
    await writeFile(path.join(directory, `${width}x${height}.png`), Buffer.from(data, "base64"));
    console.log(`PASS ${width}x${height}: locked thumbnail, wordmark, badge, tags, grain and no overflow.`);
  }
  assert.deepEqual(browser.errors, [], "Browser exceptions");
  console.log("PASS project order, section order, no thumbnail numbers, and existing looping previews.");
  console.log(`Screenshots: ${directory}`);
} finally { browser.close(); }
