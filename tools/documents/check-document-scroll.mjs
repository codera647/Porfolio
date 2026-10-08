import assert from "node:assert/strict";
import { openBrowser, sleep } from "./browser.mjs";

const base = process.argv[2] || "http://localhost:3200";
const browser = await openBrowser();
try {
  for (const slug of ["synapse", "autobg"]) {
    await browser.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
    await browser.send("Page.navigate", { url: `${base}/projects/${slug}/description` });
    await browser.waitFor(`document.querySelector('[data-project-document="${slug}"][data-enhanced]')`);
    await browser.evaluate("document.fonts.ready.then(()=>true)");

    for (const selector of ["#document-body p[data-doc-reveal]", "[data-doc-figure]", "#document-body table", "#document-body img", "#document-body pre"]) {
      if (!await browser.evaluate(`!!document.querySelector(${JSON.stringify(selector)})`)) continue;
      await browser.evaluate(`(() => {
        const node = document.querySelector(${JSON.stringify(selector)});
        window.scrollTo({ top: scrollY + node.getBoundingClientRect().top - 200, behavior: 'instant' });
      })()`);
      await sleep(800);
      const point = await browser.evaluate(`(() => {
        const node = document.querySelector(${JSON.stringify(selector)});
        const rect = node.getBoundingClientRect();
        window.__docWheel = null;
        window.__docSamples = [scrollY];
        window.addEventListener('wheel', event => {
          window.__docWheel = { prevented: event.defaultPrevented };
          const start = performance.now();
          const sample = () => {
            window.__docSamples.push(scrollY);
            if (performance.now() - start < 900) requestAnimationFrame(sample);
          };
          requestAnimationFrame(sample);
        }, { once: true, passive: true });
        return { x: rect.left + Math.min(rect.width / 2, 250), y: rect.top + Math.min(rect.height / 2, 150) };
      })()`);
      await browser.send("Input.dispatchMouseEvent", { type: "mouseWheel", ...point, deltaX: 0, deltaY: 180 });
      await sleep(1100);
      const result = await browser.evaluate(`(() => {
        const values = window.__docSamples;
        return {
          prevented: window.__docWheel?.prevented,
          distance: scrollY - values[0],
          movingFrames: values.slice(1).filter((value, index) => Math.abs(value - values[index]) > 0.5).length,
          reversed: values.slice(1).some((value, index) => value < values[index] - 1),
        };
      })()`);
      console.log(`${slug} ${selector}: ${JSON.stringify(result)}`);
      assert.equal(result.prevented, true, `Vertical wheel over ${selector} must stay with smooth page scrolling`);
      assert(result.distance >= 175 && result.distance <= 185, "Wheel distance must settle without jumps");
      assert(result.movingFrames > 3 && !result.reversed, "Scroll must ease across multiple frames without snapping back");
    }

    await browser.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await browser.evaluate(`(() => {
      const table = document.querySelector('#document-body table').parentElement;
      table.scrollLeft = 0;
      window.scrollTo({ top: scrollY + table.getBoundingClientRect().top - 200, behavior: 'instant' });
    })()`);
    await sleep(800);
    const point = await browser.evaluate(`(() => {
      const table = document.querySelector('#document-body table').parentElement;
      const rect = table.getBoundingClientRect();
      window.__docBeforeHorizontal = scrollY;
      return { x: rect.left + 150, y: rect.top + 80 };
    })()`);
    await browser.send("Input.dispatchMouseEvent", { type: "mouseWheel", ...point, deltaX: 120, deltaY: 0 });
    await sleep(400);
    const horizontal = await browser.evaluate(`({ left: document.querySelector('#document-body table').parentElement.scrollLeft, vertical: scrollY - window.__docBeforeHorizontal })`);
    assert(horizontal.left > 30 && Math.abs(horizontal.vertical) < 2, "Wide tables must still scroll sideways without moving the page");
    console.log(`PASS ${slug}: vertical easing over text/figures/tables/images/code and native horizontal table scrolling.`);
  }
  assert.deepEqual(browser.errors, [], "Browser exceptions");
} finally { browser.close(); }
