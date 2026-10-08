/** Timeline reveal, geometry, fast wheel, reversal, and reduced-motion checks. */
import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { openBrowser, sleep } from "../documents/browser.mjs";

const base = process.argv[2] || "http://localhost:3200";
const dir = await mkdtemp(path.join(tmpdir(), "portfolio-timeline-qa-"));
const b = await openBrowser();
const state = () => b.evaluate(`(() => {
  const track=document.querySelector('#experience [data-timeline-animated]');
  const rows=[...document.querySelectorAll('#experience ol[aria-label="Professional experience"] > li')];
  const line=document.querySelector('#experience [class*="lineFill"]').getBoundingClientRect();
  return {progress:Number(track?.dataset.sceneProgress),y:scrollY,
    rows:rows.map(row=>({reveal:Number(row.dataset.reveal),stop:Number(row.dataset.checkpoint),opacity:Number(getComputedStyle(row.querySelector('article')).opacity)})),
    lineBottom:line.bottom,nodeTops:rows.map(row=>{const r=row.querySelector('[data-timeline-node]').getBoundingClientRect();return r.top+r.height/2;})};
})()`);
const go = async (progress) => {
  await b.evaluate(`{const nodes=[...document.querySelectorAll('#experience [data-timeline-node]')];const first=nodes[0].getBoundingClientRect();const last=nodes.at(-1).getBoundingClientRect();window.scrollTo({top:scrollY+first.top+first.height/2+(last.top-first.top)*${progress}-innerHeight*0.6,behavior:'instant'});}`);
  await b.waitFor(`Math.abs(Number(document.querySelector('#experience [data-scroll-scene]').dataset.sceneProgress)-${progress})<0.001`);
};
const shot = async (name) => {
  const {data}=await b.send("Page.captureScreenshot",{format:"png"});
  await writeFile(path.join(dir,`${name}.png`),Buffer.from(data,"base64"));
};
try {
  await b.send("Emulation.setDeviceMetricsOverride",{width:1440,height:900,deviceScaleFactor:1,mobile:false});
  await b.send("Page.navigate",{url:`${base}/?intro=0`});
  await b.waitFor("document.querySelector('#experience [data-timeline-animated]')");
  await b.evaluate("document.fonts.ready.then(()=>true)");
  await go(0);
  let initial=await state();
  assert.deepEqual(initial.rows.map(row=>row.opacity),[1,0,0,0,0]);
  await shot("desktop-first");
  console.log("PASS only the first entry is visible initially.");
  for(let i=1;i<5;i++) {
    const stop=initial.rows[i].stop;
    const previous=initial.rows[i-1].stop;
    await go(previous+(stop-previous)*0.5);
    let s=await state();
    assert(s.rows[i].opacity===0 && s.lineBottom>s.nodeTops[i-1] && s.lineBottom<s.nodeTops[i]);
    await go(previous+(stop-previous)*0.9);
    s=await state();
    assert(s.rows[i].opacity>0 && s.rows[i].opacity<1,"Entry must fade, not snap");
    assert(Math.abs(s.lineBottom-s.nodeTops[i])<2,"Line must reach the node before its entry fades in");
    await go(stop);
    s=await state();
    assert(s.rows.slice(0,i+1).every(row=>row.opacity>=0.999));
    assert(s.rows.slice(i+1).every(row=>row.opacity===0));
    assert(Math.abs(s.lineBottom-s.nodeTops[i])<2,"Highlight must end at the revealed node");
    if(i===1) await shot("desktop-second");
  }
  await go(0.1);
  assert((await state()).rows.slice(1).every(row=>row.opacity===0));
  console.log("PASS line-first progression, gradual entry reveals, and reverse scrolling.");

  for(const [width,height] of [[1920,720],[1366,600],[768,900],[390,844],[320,740]]) {
    await b.send("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile:width<680});
    await sleep(300);
    await go(1);
    const geometry=await b.evaluate(`(() => {
      const rows=[...document.querySelectorAll('#experience ol[aria-label="Professional experience"] > li')];
      const line=document.querySelector('#experience [class*="lineFill"]').getBoundingClientRect();
      return {overflow:document.documentElement.scrollWidth>innerWidth+1,
        rows:rows.map((row,i)=>{const a=row.querySelector('article');const r=a.getBoundingClientRect();const n=row.querySelector('[data-timeline-node]').getBoundingClientRect();return {spine:Math.abs(line.left+line.width/2-n.left-n.width/2)<1,
          clear:innerWidth<=680?r.left>n.right:i%2?r.left>n.right:r.right<n.left,
          clipping:a.scrollWidth>a.clientWidth+1||a.scrollHeight>a.clientHeight+1,
          tags:[...a.querySelectorAll('li')].every(tag=>tag.getBoundingClientRect().right<=r.right+1)};})};
    })()`);
    assert(!geometry.overflow && geometry.rows.every(row=>row.spine&&row.clear&&!row.clipping&&row.tags),JSON.stringify({width,geometry}));
    await go(0);
    await shot(`${width}x${height}-first`);
    const second=(await state()).rows[1].stop;
    await go(second);
    await shot(`${width}x${height}-second`);
    console.log(`PASS ${width}x${height}: timeline alignment, wrapping, tags and no overflow.`);
  }
  await go(0);
  const seen=new Set([0]);
  const started=Date.now();
  while(Date.now()-started<45000) {
    await b.send("Input.dispatchMouseEvent",{type:"mouseWheel",x:160,y:300,deltaX:0,deltaY:12000});
    await sleep(70);
    const s=await state();
    s.rows.forEach((row,i)=>{if(row.opacity>=0.999)seen.add(i);});
    if(s.progress>=0.999) break;
  }
  assert.deepEqual([...seen].sort(),[0,1,2,3,4],"Fast mobile wheel input skipped an entry");
  console.log("PASS fast input at 320px completes all five entries in order.");
  await b.send("Emulation.setEmulatedMedia",{features:[{name:"prefers-reduced-motion",value:"reduce"}]});
  await b.waitFor("!document.querySelector('#experience [data-scroll-scene]')");
  assert(await b.evaluate("[...document.querySelectorAll('#experience article')].every(a=>getComputedStyle(a).opacity==='1'&&getComputedStyle(a).transform==='none')"));
  console.log("PASS reduced motion shows all entries without animation or scroll guarding.");
  assert.deepEqual(b.errors,[],"Browser errors");
  console.log(`Screenshots: ${dir}`);
} finally { b.close(); }
