// Custom handwritten signature artwork, plus asset previews. No website code.
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('C:/Users/MEGA IT SOLUTION/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root = path.resolve(__dirname,'..');
const out = path.join(root,'signature');
fs.mkdirSync(out,{recursive:true});
// Original pen trajectories: individual letters with an A crossbar, i dot and finishing flourish.
const strokes = [
 ['A', 'M 54 196 C 101 178 151 92 170 56 C 178 40 183 40 180 64 C 175 99 179 157 190 171 C 197 180 207 165 212 155',3.7,0.12,.30],
 ['A crossbar','M 108 142 C 128 138 164 139 193 128',2.3,.40,.12],
 ['b','M 204 170 C 220 143 246 84 240 72 C 233 57 214 115 214 145 C 214 174 232 180 247 159 C 259 140 250 128 235 136 C 218 144 220 176 248 168 C 258 166 267 156 271 150',3.0,.50,.23],
 ['d','M 290 139 C 275 126 257 145 259 161 C 260 178 278 174 291 155 C 307 132 328 80 321 69 C 313 56 298 117 294 153 C 289 188 312 166 319 152',3.0,.70,.22],
 ['u','M 320 140 C 317 150 309 174 322 173 C 335 173 349 147 352 136 C 346 155 339 177 354 171 C 362 168 370 156 374 149',3.0,.91,.19],
 ['l','M 368 167 C 393 133 410 85 402 73 C 393 61 378 117 377 145 C 375 174 388 177 407 158',3.0,1.07,.18],
 ['M','M 420 177 C 441 135 462 74 469 73 C 478 70 467 147 462 168 C 474 146 499 103 510 100 C 520 98 499 150 499 170 C 520 133 542 110 544 121 C 545 133 528 161 535 171 C 540 178 550 167 557 155',3.4,1.24,.30],
 ['o','M 580 139 C 565 128 548 141 550 159 C 552 182 577 173 585 150 C 591 134 580 133 578 141 C 579 151 593 153 602 143',3.0,1.52,.17],
 ['i','M 603 142 C 598 155 591 174 602 173 C 611 172 620 159 625 151',2.8,1.68,.11],
 ['z','M 623 143 C 635 138 651 137 655 139 C 649 147 628 162 621 171 C 638 165 654 164 659 173 C 664 184 646 205 630 200 C 619 196 639 181 666 171 C 690 162 704 151 715 139',3.0,1.78,.24],
 ['i dot','M 607 123 C 610 120 612 118 612 115',3.4,2.03,.09],
 ['finish','M 691 193 C 581 182 362 191 219 213 C 376 196 592 193 738 183',1.8,2.14,.30]
];
// Cubic lengths, used instead of normalized pathLength to ensure export portability.
function len(d) {
 const t=d.match(/[MC]|[-+]?(?:\d*\.)?\d+/g);let i=0,x=0,y=0,total=0;
 while(i<t.length){const c=t[i++]; if(c==='M'){x=+t[i++];y=+t[i++];}else if(c==='C'){
  let a=+t[i++],b=+t[i++],c1=+t[i++],d1=+t[i++],ex=+t[i++],ey=+t[i++],px=x,py=y;
  for(let k=1;k<=64;k++){let u=k/64,v=1-u;let qx=v*v*v*x+3*v*v*u*a+3*v*u*u*c1+u*u*u*ex;let qy=v*v*v*y+3*v*v*u*b+3*v*u*u*d1+u*u*u*ey;total+=Math.hypot(qx-px,qy-py);px=qx;py=qy;}x=ex;y=ey;
 }else throw new Error('Unexpected SVG command '+c); }
 return total;
}
const spec=strokes.map(([label,d,width,start,duration])=>({label,d,width,start,duration,length:len(d)}));
function artwork(color,animated=false,time=null){
 let styles=animated?`<style>@keyframes draw{to{stroke-dashoffset:0}}@media(prefers-reduced-motion:reduce){.ink{animation:none!important;stroke-dashoffset:0!important}}</style>`:'';
 return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="260" viewBox="0 0 800 260" role="img" aria-labelledby="title desc"><title id="title">Abdul Moiz signature</title><desc id="desc">Original handwritten signature of Abdul Moiz${animated?', drawn once in 2.44 seconds':''}. Transparent background.</desc>${styles}<g fill="none" stroke="${color}" stroke-linecap="round" stroke-linejoin="round">${spec.map((s,i)=>{
 let dash='';if(animated)dash=` class="ink" style="stroke-dasharray:${s.length};stroke-dashoffset:${s.length};animation:draw ${s.duration}s cubic-bezier(.32,0,.45,1) ${s.start}s forwards"`;
 if(time!==null){let t=Math.max(0,Math.min(1,(time-s.start)/s.duration));dash=` stroke-dasharray="${s.length}" stroke-dashoffset="${s.length*(1-t)}"`;}
 return `<path id="stroke-${i+1}" data-letter="${s.label}" d="${s.d}" stroke-width="${s.width}"${dash}/>`;
 }).join('')}</g></svg>`;
}
(async()=>{
 for(const [theme,color] of [['light','#f8f8f8'],['dark','#0c0c0c'],['orange','#f9542a']]){
  const svg=artwork(color);
  fs.writeFileSync(path.join(out,`abdul-moiz-signature-${theme}.svg`),svg);
  await sharp(Buffer.from(svg)).resize(1600,520).png().toFile(path.join(out,`abdul-moiz-signature-${theme}.png`));
 }
 fs.writeFileSync(path.join(out,'abdul-moiz-signature-animated.svg'),artwork('#f8f8f8',true));
 fs.writeFileSync(path.join(out,'signature-motion.json'),JSON.stringify({duration:2.44,canvas:[800,260],strokeOrder:spec,playback:'one shot; hold final frame; reduce motion shows full signature'},null,2));
 const frames=path.join(out,'.preview-frames');fs.mkdirSync(frames,{recursive:true});
 for(let f=0;f<96;f++){
  const t=f/30;const pen=await sharp(Buffer.from(artwork('#f8f8f8',false,t))).png().toBuffer();
  await sharp({create:{width:1280,height:720,channels:4,background:'#0c0c0c'}}).composite([{input:pen,left:240,top:230}]).png().toFile(path.join(frames,`${String(f).padStart(4,'0')}.png`));
 }
 console.log('Signature SVG, PNG and preview frames exported.');
})();
