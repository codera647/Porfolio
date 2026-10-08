import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { openBrowser, sleep } from "../documents/browser.mjs";

const base = process.argv[2] || "http://localhost:3200";
const browser = await openBrowser();
await mkdir("tmp/pdfs/trailforge-web", { recursive: true });
const shot = async name => {
  const { data } = await browser.send("Page.captureScreenshot", { format: "png" });
  await writeFile(`tmp/pdfs/trailforge-web/${name}.png`, Buffer.from(data, "base64"));
};
try {
  await browser.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await browser.send("Page.navigate", { url: `${base}/?intro=0` });
  await browser.waitFor("document.querySelector('[data-project=trailforge]')");
  await browser.evaluate("document.fonts.ready.then(()=>true)");
  await browser.waitFor("document.querySelectorAll('[data-scroll-scene]').length===3");
  assert(await browser.evaluate("!!document.querySelector('[data-project=trailforge] svg title')&&!document.querySelector('[data-project=trailforge] video')"));
  for (const [width, height] of [[1440, 1000], [768, 900], [390, 844], [320, 740]]) {
    await browser.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 680 });
    await browser.evaluate("document.querySelector('[data-project=trailforge]').scrollIntoView({behavior:'instant',block:'start'})");
    await sleep(600);
    assert(await browser.evaluate("document.documentElement.scrollWidth<=innerWidth+1"), `Home overflow at ${width}`);
    assert(await browser.evaluate("(()=>{const c=document.querySelector('[data-project=trailforge]');const t=c.querySelector('h4').getBoundingClientRect();const tags=c.querySelector('ul').getBoundingClientRect();return t.bottom<=tags.top&&[...c.querySelectorAll('li')].every(n=>n.getBoundingClientRect().right<=c.getBoundingClientRect().right+1)})()"), `Card metadata overlap at ${width}`);
    await shot(`thumbnail-${width}`);
  }
  for (const [width, height] of [[1440, 1000], [390, 844], [320, 740]]) {
    await browser.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 680 });
    await browser.send("Page.navigate", { url: `${base}/projects/trailforge` });
    await browser.waitFor("document.querySelector('h1')?.textContent==='Trailforge'");
    await browser.evaluate("document.fonts.ready.then(()=>true)");
    assert(await browser.evaluate("scrollY<=1&&document.documentElement.scrollWidth<=innerWidth+1"), `Case page overflow at ${width}`);
    assert.equal(await browser.evaluate("document.querySelectorAll('[data-diagram-shell]').length"), 5);
    assert.equal(await browser.evaluate("document.querySelectorAll('video').length"), 0);
    assert(await browser.evaluate("!!document.querySelector('footer a[href=\"/projects/contentforge\"]')"));
    await shot(`case-${width}`);
    await browser.evaluate("document.querySelector('#system').scrollIntoView({behavior:'instant'})");
    await sleep(500);
    assert(await browser.evaluate("document.documentElement.scrollWidth<=innerWidth+1"), `Diagram widened page at ${width}`);
    await shot(`architecture-${width}`);
  }
  await browser.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await browser.send("Page.navigate", { url: `${base}/projects/trailforge/description` });
  await browser.waitFor("document.querySelector('[data-project-document=trailforge][data-enhanced]')");
  assert.equal(await browser.evaluate("document.querySelectorAll('[data-doc-section]').length"), 12);
  assert(await browser.evaluate("!!document.querySelector('[data-reveal-pending]')&&!!document.querySelector('a[download][href=\"/projects/trailforge/description.pdf\"]')"));
  await shot("document-desktop");
  await browser.evaluate("document.querySelector('[data-desktop-toc] a[href=\"#verification\"]').click()");
  await browser.waitFor("document.querySelector('[data-desktop-toc] a[aria-current=location][href=\"#verification\"]')");
  await sleep(500);
  await shot("document-release-evidence");
  await browser.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await browser.evaluate("window.scrollTo({top:0,behavior:'instant'})");
  await sleep(400);
  assert(await browser.evaluate("document.documentElement.scrollWidth<=innerWidth+1"));
  await shot("document-mobile");
  const pdf = await fetch(`${base}/projects/trailforge/description.pdf`);
  assert(pdf.ok && pdf.headers.get("content-type")?.includes("application/pdf"));
  const downloaded = Buffer.from(await pdf.arrayBuffer());
  const original = await readFile("public/projects/trailforge/description.pdf");
  assert.equal(createHash("sha256").update(downloaded).digest("hex"), createHash("sha256").update(original).digest("hex"));
  await browser.send("Page.navigate", { url: `${base}/projects/autobg` });
  await browser.waitFor("document.querySelector('footer a[href=\"/projects/trailforge\"]')");
  await browser.evaluate("window.scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'})");
  await browser.evaluate("document.querySelector('footer a[href=\"/projects/trailforge\"]').click()");
  await browser.waitFor("document.querySelector('h1')?.textContent==='Trailforge'");
  await sleep(600);
  assert(await browser.evaluate("scrollY<=1"), "Next project should open at top");
  assert.deepEqual(browser.errors, [], "Browser exceptions");
  console.log("PASS Trailforge: static thumbnail, responsive layouts, five diagrams, 12-chapter study, progressive text, contents navigation, unchanged PDF download, and next-project navigation.");
  console.log("Screenshots: tmp/pdfs/trailforge-web");
} finally { browser.close(); }
