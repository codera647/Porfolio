import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { openBrowser, sleep } from "./browser.mjs";

const base = process.argv[2] || "http://localhost:3200";
const browser = await openBrowser();
await mkdir("tmp/pdfs/web", { recursive: true });
try {
  const shot = async (name) => {
    const { data } = await browser.send("Page.captureScreenshot", { format: "png" });
    await writeFile(`tmp/pdfs/web/${name}.png`, Buffer.from(data, "base64"));
  };
  for (const slug of ["synapse", "autobg"]) {
    const html = await (await fetch(`${base}/projects/${slug}/description`)).text();
    assert(html.includes('data-doc-section'), "Article must be server-rendered, not depend on JavaScript for its text");
    assert(!/Source basis|Source snapshot|b79bb2dd2794|68252421347e/i.test(html), "Source-basis notes must not appear on the reading page");
    await browser.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
    await browser.send("Page.navigate", { url: `${base}/projects/${slug}/description` });
    await browser.waitFor(`document.querySelector('[data-project-document="${slug}"][data-enhanced]')`);
    await browser.evaluate("document.fonts.ready.then(()=>true)");
    assert.equal(await browser.evaluate("document.querySelectorAll('[data-doc-section]').length"), 12);
    assert(await browser.evaluate("!!document.querySelector('[data-reveal-pending]')"), "Off-screen text should progressively reveal");
    assert(await browser.evaluate("scrollY <= 1"), "Document must open at top");
    assert(await browser.evaluate("document.documentElement.scrollWidth<=innerWidth+1"), "Desktop article overflows");
    await shot(`${slug}-desktop`);
    await browser.evaluate("document.querySelector('[data-desktop-toc] a[href=\"#runtime\"], [data-desktop-toc] a[href=\"#evaluation\"]').click()");
    await browser.waitFor("document.querySelectorAll('[data-doc-toc] a[aria-current=\"location\"]:is([href=\"#runtime\"],[href=\"#evaluation\"])').length===2");
    await sleep(700);
    assert(await browser.evaluate("!document.querySelector('#runtime [data-reveal-pending], #evaluation [data-reveal-pending]')"), "Jumped chapter must not be invisible");
    await shot(`${slug}-results`);
    await browser.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await browser.evaluate("window.scrollTo({top:0,behavior:'instant'})");
    await sleep(700);
    assert(await browser.evaluate("document.documentElement.scrollWidth<=innerWidth+1"), "Mobile article overflows");
    await shot(`${slug}-mobile`);
    await browser.evaluate("document.querySelector('details').open=true");
    await browser.evaluate("document.querySelector('details a[href=\"#architecture\"]').click()");
    await sleep(700);
    assert(await browser.evaluate("!document.querySelector('details').open"), "Mobile contents should close after selection");
    await browser.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
    assert(await browser.evaluate("[...document.querySelectorAll('[data-reveal-pending]')].every(n=>getComputedStyle(n).opacity==='1')"), "Reduced motion text must stay visible");
    await browser.send("Emulation.setEmulatedMedia", { features: [] });
    const pdf = await fetch(`${base}/projects/${slug}/description.pdf`);
    assert(pdf.ok && pdf.headers.get("content-type")?.includes("application/pdf"), "Download must be a served PDF");
    assert((await pdf.arrayBuffer()).byteLength > 10000, "Empty PDF download");
    console.log(`PASS ${slug}: SSR text, 12 chapters, reveals, contents, reduced motion, desktop/mobile layout, and PDF download.`);
  }
  assert.deepEqual(browser.errors, [], "Browser exceptions");
} finally { browser.close(); }
