/** Typeset native documents; Chrome exports individual vector diagrams only. */
import { mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { synapseDocument, autobgDocument } from "../../src/content/projectDocuments.ts";
import { contentforgeDocument } from "../../src/content/contentforgeDocument.ts";
import { openBrowser } from "./browser.mjs";

const base = process.argv[2] || "http://localhost:3200";
const requestedSlug = process.argv[3];
const documents = [synapseDocument, autobgDocument, contentforgeDocument].filter(document => !requestedSlug || document.slug === requestedSlug);
if (!documents.length) throw new Error(`Unknown project: ${requestedSlug}`);
const directory = "tmp/pdfs/typeset";
await mkdir(directory, { recursive: true });
await writeFile(`${directory}/documents.json`, JSON.stringify(documents));
const browser = await openBrowser();
const figures = {};

// These overrides apply to isolated diagram clones, never the live reading page.
const figureStyle = `
  @page { size:auto; margin:0!important; }
  html, body { margin:0!important; padding:0!important; background:#fff!important; }
  body > *:not(#pdf-figure):not(#pdf-figure-style) { display:none!important; }
  #pdf-figure { display:block!important; width:900px!important; margin:0!important; padding:0!important;
    --canvas:#fff; --text-primary:#303030; --doc-muted:#555; --rust:#87392a; --amber:#d9835a;
    --doc-border:#d6d1cb; --grain-soft:none; --grain-tile:none; background:#fff!important; }
  #pdf-figure * { min-width:0!important; color:#303030!important; background-image:none!important; }
  #pdf-figure [data-doc-figure], #pdf-figure figure { width:100%!important; margin:0!important; }
  #pdf-figure [data-diagram-shell] { padding:26px!important; overflow:visible!important;
    border:1px solid #d6d1cb!important; border-radius:16px!important; background:#f7f6f3!important; }
  #pdf-figure [data-diagram-title] { border-color:#d6d1cb!important; padding-bottom:18px!important; }
  #pdf-figure [data-diagram-title] > span:first-child { font-size:21px!important; }
  #pdf-figure [data-diagram-title] > span:last-child { font-size:11px!important; color:#666!important; }
  #pdf-figure [data-diagram-columns] { font-size:12px!important; color:#666!important; padding:20px 0!important; }
  #pdf-figure [data-diagram-node] { padding:14px 12px!important; min-height:90px!important;
    border:1px solid #c8c3bc!important; background:#fff!important; border-radius:12px!important; }
  #pdf-figure [data-diagram-node][class*="accent"] { background:#f0ded9!important; border-color:#87392a!important; }
  #pdf-figure [data-diagram-node] strong { font-size:18px!important; line-height:1.3!important; }
  #pdf-figure [data-diagram-node] span { font-size:15px!important; line-height:1.4!important; color:#555!important; }
  #pdf-figure [data-diagram-flow] { display:grid!important; grid-template-columns:repeat(3,minmax(0,1fr))!important; gap:18px 8px!important; }
  #pdf-figure [class*="arrow"] { color:#87392a!important; font-size:30px!important; }
  #pdf-figure [class*="persisted"], #pdf-figure [class*="note"] {
    font-size:14px!important; border-color:#c8c3bc!important; background:#ece9e4!important; }
  #pdf-figure [class*="zone"] { border-color:#c8c3bc!important; }
  #pdf-figure [class*="zone"] > span { font-size:13px!important; }
`;

try {
  await browser.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  for (const document of documents) {
    await browser.send("Emulation.setEmulatedMedia", { media: "screen", features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
    await browser.send("Page.navigate", { url: `${base}/projects/${document.slug}/description` });
    await browser.waitFor(`document.querySelector('[data-project-document="${document.slug}"][data-enhanced]') && document.querySelectorAll('[data-doc-section]').length === 12`);
    await browser.evaluate("document.fonts.ready.then(()=>true)");
    const expected = {
      chapters: document.sections.map(section => section.title),
      paragraphs: document.sections.flatMap(section => section.blocks.flatMap(block => {
        if (block.type === "paragraph" || block.type === "note") return [block.text];
        if (block.type === "list") return block.items;
        if (block.type === "table") return [...block.columns, ...block.rows.flat()];
        if (block.type === "code") return [block.label, block.text];
        return [];
      })),
    };
    await writeFile(`tmp/pdfs/${document.slug}-expected-text.json`, JSON.stringify(expected));
    const ids = document.sections.flatMap(section => section.blocks.filter(block => block.type === "diagram").map(block => block.id));
    await browser.evaluate(`window.__pdfFigures = Object.fromEntries([...document.querySelectorAll('[data-doc-figure]')].map(node=>[node.dataset.docFigure,node.cloneNode(true)]));`);
    for (const id of ids) {
      if (id === "synapse-results") {
        figures[id] = await browser.evaluate(`(() => {
          const node=window.__pdfFigures['synapse-results'];
          const labels=[...node.querySelectorAll('[aria-label]')].map(n=>n.getAttribute('aria-label'));
          return {
            kind:'results',
            retrieval:labels.filter(label=>/^.+: \\d\\.\\d{3}$/.test(label)).map(label=>{const [name,value]=label.split(': ');return {name,value:Number(value)};}),
            answers:labels.filter(label=>/^Judge [AB]:/.test(label)).map(label=>{
              const match=label.match(/^(Judge [AB]): (\\d+)% correct, (\\d+)% partially correct, (\\d+)% incorrect/);
              return {name:match[1],correct:Number(match[2]),partial:Number(match[3]),incorrect:Number(match[4])};
            }),
          };
        })()`);
        if (figures[id].retrieval.length !== 6 || figures[id].answers.length !== 2) throw new Error("Benchmark graph data changed: check PDF extraction.");
        continue;
      }
      if (id === "autobg-runtime") {
        figures[id] = await browser.evaluate(`({kind:'runtime', rows:[...window.__pdfFigures['autobg-runtime'].querySelectorAll('svg g')].filter(node=>node.querySelector('rect')).map(node=>{const texts=[...node.querySelectorAll('text')].map(n=>n.textContent);return {name:texts[0],value:Number(texts[1].replace(/[~s]/g,''))};})})`);
        if (figures[id].rows.length !== 3) throw new Error("Runtime graph data changed: check PDF extraction.");
        continue;
      }
      const metadata = await browser.evaluate(`(() => {
        document.getElementById('pdf-figure')?.remove();
        document.getElementById('pdf-figure-style')?.remove();
        const original=document.querySelector('[data-project-document]');
        const wrapper=document.createElement('div');
        wrapper.id='pdf-figure'; wrapper.className=original.className;
        const node=window.__pdfFigures[${JSON.stringify(id)}].cloneNode(true);
        const caption=[...node.querySelectorAll('figcaption')].map(n=>n.textContent.trim()).join(' ');
        node.querySelectorAll('figcaption').forEach(n=>n.remove());
        wrapper.append(node); document.body.append(wrapper);
        const style=document.createElement('style'); style.id='pdf-figure-style';
        style.textContent=${JSON.stringify(figureStyle)}; document.body.append(style);
        return {kind:'vector',title:node.querySelector('[data-diagram-title]')?.firstElementChild?.textContent.trim(),caption,
          nodes:[...node.querySelectorAll('[data-diagram-node] strong')].map(n=>n.textContent.trim())};
      })()`);
      await browser.send("Emulation.setEmulatedMedia", { media: "print" });
      const size = await browser.evaluate(`(() => {const rect=document.getElementById('pdf-figure').getBoundingClientRect();return {width:rect.width,height:Math.ceil(rect.height)+2};})()`);
      const { data } = await browser.send("Page.printToPDF", {
        printBackground: true, displayHeaderFooter: false, preferCSSPageSize: false,
        paperWidth: size.width / 96, paperHeight: size.height / 96,
        marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0,
      });
      const file = `${directory}/${id}.pdf`;
      await writeFile(file, Buffer.from(data, "base64"));
      figures[id] = { ...metadata, file, ...size };
      console.log(`Vector figure: ${id} (${size.width} x ${size.height})`);
    }
  }
  if (browser.errors.length) throw new Error(browser.errors.join("\n"));
} finally { browser.close(); }

await writeFile(`${directory}/figures.json`, JSON.stringify(figures));
await new Promise((resolve, reject) => {
  const child = spawn("python", ["-X", "utf8", "tools/documents/typeset_pdfs.py"], { stdio: "inherit" });
  child.on("error", reject);
  child.on("close", code => code === 0 ? resolve() : reject(new Error(`PDF typesetting failed (${code})`)));
});
