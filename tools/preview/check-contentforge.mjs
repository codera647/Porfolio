import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { openBrowser, sleep } from "../documents/browser.mjs";

const base = process.argv[2] || "http://localhost:3200";
const directory = await mkdtemp(path.join(tmpdir(), "contentforge-qa-"));
const browser = await openBrowser();
const shot = async name => {
  const { data } = await browser.send("Page.captureScreenshot", { format: "png" });
  await writeFile(path.join(directory, `${name}.png`), Buffer.from(data, "base64"));
};

try {
  await browser.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await browser.send("Page.navigate", { url: `${base}/?intro=0` });
  await browser.waitFor("document.querySelector('[data-project=contentforge] video')");
  await browser.evaluate("document.querySelector('[data-project=contentforge]').scrollIntoView({behavior:'instant'})");
  await browser.waitFor("document.querySelector('[data-project=contentforge] video').readyState>=2 && !document.querySelector('[data-project=contentforge] video').paused");
  assert(await browser.evaluate("document.querySelector('[data-project=contentforge] video').currentSrc.endsWith('/contentforge/demo-1.mp4')"), "Thumbnail must use demo 1");
  await shot('thumbnail');
  for (const [width, height] of [[1440, 1000], [1366, 768], [390, 844], [320, 740]]) {
    await browser.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 760 });
    await browser.send("Page.navigate", { url: `${base}/projects/contentforge` });
    await browser.waitFor("document.querySelector('h1')?.textContent==='ContentForge AI'");
    await browser.waitFor("document.querySelector('[data-walkthrough-ready]')");
    await browser.evaluate("document.fonts.ready.then(()=>true)");
    await sleep(700);
    assert(await browser.evaluate("scrollY <= 1"), "Project page must open at the top");
    assert(await browser.evaluate("document.documentElement.scrollWidth<=innerWidth+1"), `Page overflow at ${width}`);
    assert.equal(await browser.evaluate("document.querySelector('footer a').getAttribute('href')"), "/projects/synapse");
    await shot(`hero-${width}`);
    await browser.evaluate("document.querySelector('#demo').scrollIntoView({behavior:'instant'})");
    await browser.waitFor("document.querySelector('#demo video').readyState>=2");
    await browser.waitFor("!document.querySelector('#demo video').paused");
    const video = await browser.evaluate("(()=>{const v=document.querySelector('#demo video');return {src:v.currentSrc,loop:v.loop,muted:v.muted,controls:v.controls,time:v.currentTime,width:v.videoWidth}})()");
    assert(video.src.endsWith('/contentforge/demo-2.mp4') && video.loop && video.muted && !video.controls);
    await sleep(500);
    assert(await browser.evaluate(`document.querySelector('#demo video').currentTime>${video.time}`), "Video must advance without a play button");
    await shot(`demo-${width}`);
    const track = await browser.evaluate("(()=>{const n=document.querySelector('[class*=walkthrough-distance]') || document.querySelector('[style*=walkthrough-distance]');return {top:n.getBoundingClientRect().top+scrollY,height:n.offsetHeight}})()");
    assert.equal(await browser.evaluate("document.querySelectorAll('[class*=imageFrame] img').length"), 6);
    if (width > 760) {
      const start = track.top;
      const distance = track.height - height;
      const positions = [];
      for (const fraction of [0, 0.5, 1]) {
        await browser.evaluate(`window.scrollTo({top:${start + fraction * distance},behavior:'instant'})`);
        await sleep(1400);
        if (fraction === 1) await browser.waitFor("document.querySelector('[class*=counter] span').textContent==='06'", 30000);
        positions.push(await browser.evaluate("(()=>{const rail=document.querySelector('[class*=rail]');const stage=rail.parentElement;const imgs=[...rail.querySelectorAll('img')];return {x:new DOMMatrix(getComputedStyle(rail).transform).m41,stageTop:stage.getBoundingClientRect().top,index:stage.querySelector('[class*=counter] span').textContent,loaded:imgs.every(i=>i.complete&&i.naturalWidth>0),fit:imgs.every(i=>getComputedStyle(i).objectFit==='contain'&&parseFloat(getComputedStyle(i).borderRadius)>0)}})()"));
        await shot(`gallery-${width}-${fraction}`);
      }
      assert(positions[0].x > positions[1].x && positions[1].x > positions[2].x, "Vertical scrolling must move screenshots horizontally");
      assert(positions.every(p=>Math.abs(p.stageTop)<2&&p.fit) && positions.at(-1).loaded, `Pinned gallery must load complete rounded screenshots: ${JSON.stringify(positions)}`);
      assert.equal(positions[2].index, "06");
    } else {
      assert(await browser.evaluate("getComputedStyle(document.querySelector('[style*=walkthrough-distance]')).height !== '312svh'"));
      await browser.evaluate("document.querySelector('#system').scrollIntoView({behavior:'instant'})");
      await sleep(600);
      assert(await browser.evaluate("document.documentElement.scrollWidth<=innerWidth+1"), "Diagrams must not widen the mobile page");
      await shot(`architecture-${width}`);
    }
    console.log(`PASS ${width}: page layout, demo 2 playback, footer and screenshot gallery.`);
  }

  await browser.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await browser.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await browser.send("Page.navigate", { url: `${base}/projects/contentforge` });
  await browser.waitFor("document.querySelector('[data-walkthrough-ready]')");
  assert(await browser.evaluate("getComputedStyle(document.querySelector('[class*=rail]')).display==='grid'"), "Reduced motion gallery should stay readable");
  await browser.send("Emulation.setEmulatedMedia", { features: [] });
  await browser.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await sleep(300);
  await browser.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await sleep(300);
  await browser.evaluate("(()=>{const t=document.querySelector('[style*=walkthrough-distance]');window.scrollTo({top:scrollY+t.getBoundingClientRect().top+(t.offsetHeight-innerHeight)/2,behavior:'instant'})})()");
  await browser.waitFor("new DOMMatrix(getComputedStyle(document.querySelector('[class*=rail]')).transform).m41 < -500");
  assert(await browser.evaluate("getComputedStyle(document.querySelector('[class*=rail]')).display==='flex'"), "Pinned motion must resume after a mobile-to-desktop resize");

  await browser.send("Page.navigate", { url: `${base}/projects/contentforge/description` });
  await browser.waitFor("document.querySelector('[data-project-document=contentforge][data-enhanced]')");
  assert.equal(await browser.evaluate("document.querySelectorAll('[data-doc-section]').length"), 12);
  assert(await browser.evaluate("!!document.querySelector('[data-reveal-pending]')"), "Document needs progressive text reveals");
  assert(await browser.evaluate("scrollY<=1&&document.documentElement.scrollWidth<=innerWidth+1"));
  await shot('document-desktop');
  await browser.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  assert(await browser.evaluate("document.documentElement.scrollWidth<=innerWidth+1"), "Document mobile overflow");
  await shot('document-mobile');
  const pdf = await fetch(`${base}/projects/contentforge/description.pdf`);
  assert(pdf.ok && pdf.headers.get('content-type')?.includes('application/pdf') && (await pdf.arrayBuffer()).byteLength>10000, "Technical study download must be a real PDF");
  await browser.send("Page.navigate", { url: `${base}/projects/autobg` });
  await browser.waitFor("document.querySelector('footer a[href=\"/projects/contentforge\"]')");
  await browser.evaluate("window.scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'})");
  await sleep(300);
  await browser.evaluate("document.querySelector('footer a[href=\"/projects/contentforge\"]').click()");
  await browser.waitFor("document.querySelector('h1')?.textContent==='ContentForge AI'");
  await sleep(400);
  assert(await browser.evaluate("scrollY<=1"), "Next-project link must reset scrolling");
  assert.deepEqual(browser.errors, [], "Browser exceptions");
  console.log(`PASS demo 1 thumbnail, reduced motion, 12-chapter study, text reveals, PDF download and next-project navigation. Screenshots: ${directory}`);
} finally { browser.close(); }
