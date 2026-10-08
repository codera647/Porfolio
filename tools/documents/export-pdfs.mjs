/** Run against a local preview after document/content changes. No server PDF dependency. */
import { mkdir, writeFile, copyFile } from "node:fs/promises";
import path from "node:path";
import { openBrowser } from "./browser.mjs";

const base = process.argv[2] || "http://localhost:3200";
const browser = await openBrowser();
try {
  await browser.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await browser.send("Emulation.setEmulatedMedia", { media: "print", features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await mkdir("output/pdf", { recursive: true });
  for (const slug of ["synapse", "autobg"]) {
    await browser.send("Page.navigate", { url: `${base}/projects/${slug}/description` });
    await browser.waitFor(`document.querySelector('[data-project-document="${slug}"][data-enhanced]') && document.querySelectorAll('[data-doc-section]').length === 12`);
    await browser.evaluate(`Promise.all([document.fonts.ready, ...[...document.images].map(img => {
      img.loading='eager';
      return img.complete ? Promise.resolve() : new Promise(resolve => {img.addEventListener('load',resolve,{once:true});img.addEventListener('error',resolve,{once:true});});
    })]).then(()=>true)`);
    const broken = await browser.evaluate("[...document.images].filter(img=>!img.naturalWidth).map(img=>img.src)");
    if (broken.length) throw new Error(`Broken PDF figures: ${broken.join(", ")}`);
    // Print CSS overrides reveal opacity and screen scroll regions for every chapter.
    const { data } = await browser.send("Page.printToPDF", {
      printBackground: true, preferCSSPageSize: true, generateTaggedPDF: true,
      displayHeaderFooter: true,
      headerTemplate: "<span></span>",
      footerTemplate: `<div style="width:100%;padding:0 48px;display:flex;justify-content:space-between;font:8px monospace;color:#999"><span>ABDUL MOIZ / ${slug.toUpperCase()} / TECHNICAL STUDY</span><span class="pageNumber"></span></div>`,
      marginTop: 0.63, marginBottom: 0.71, marginLeft: 0.51, marginRight: 0.51,
    });
    const output = path.join("output", "pdf", `${slug}-technical-description.pdf`);
    await writeFile(output, Buffer.from(data, "base64"));
    const assets = path.join("public", "projects", slug);
    await mkdir(assets, { recursive: true });
    await copyFile(output, path.join(assets, "description.pdf"));
    console.log(`Exported ${output} -> ${assets}/description.pdf (${Math.round(Buffer.from(data,"base64").length/1024)} KB)`);
  }
  if (browser.errors.length) throw new Error(browser.errors.join("\n"));
} finally { browser.close(); }
