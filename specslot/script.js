import { RESULTS } from './results.js';
import { PROMPTS } from './prompts.js';
import { MECHANISMS, BASIS_SCALING } from './mechanisms.js';
import { createCarousel } from './carousel.js';

// Set a local or hosted MP4 URL here when the overview is ready.
// Example: src: 'assets/specslot-overview.mp4', captions: 'assets/overview.en.vtt'
const VIDEO = { src: '', captions: '' };

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
function enterPanel(element) {
  if(reducedMotion.matches) return;
  element.classList.remove('panel-enter');
  void element.offsetWidth;
  element.classList.add('panel-enter');
}

const steps = {
  read: ['Read the evidence, then assign roles.', 'The input grid should determine where evidence comes from, not how many output roles the model can express. SpecSlot projects non-overlapping image cells into W spatial anchors. An input mixer lets neighboring anchors exchange evidence before each anchor expands into K slot states, with anchor and slot positions added. All K slots thus draw on the same local evidence but take different output roles, separating input density from spectral subdivision.', 'W anchors × K slots'],
  allocate: ['Give each slot an output responsibility.', 'To route tokens by what they produce, each needs an explicit output responsibility. SpecSlot orders each window’s DCT coefficients by radial frequency and divides them into K equal, disjoint groups. Each slot always predicts its assigned group, from broad structure to fine detail; every coefficient belongs to exactly one slot. With N = W × K image slots, a fixed budget trades denser spatial anchors against finer spectral subdivision, making tokenization an explicit quality–compute choice.', 'N = W × K'],
  route: ['Let the output role guide communication.', 'Sending every spectral slot through global attention would make its cost grow with spectral subdivision. To avoid this, global blocks connect only each anchor’s lowest-frequency carrier and the context states. Local blocks then mix all K slots within each anchor. Two global and two local blocks repeat three times. Carriers deliver global information locally and carry detail updates into later global blocks. Detail thus communicates indirectly, while the global image sequence stays at W carriers.', 'W carriers + context'],
  decode: ['Reconstruct in two complementary bases.', 'Independent window predictions can leave seams. SpecSlot therefore assembles each window’s coefficients, applies an inverse DCT, and blends overlapping windows into a spectral base. To also allow correction in pixel coordinates, a second head reads the same final slot states and adds an anchor-aligned spatial residual. Their sum requires no extra tokens or attention edges. Spectral ownership applies only to the base; the generative state, target, and loss remain in pixel space.', 'spectral base + residual'],
};

function activateTab(button) {
  for (const item of button.closest('[role="tablist"]').querySelectorAll('[role="tab"]')) {
    const selected = item === button;
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
  }
}

$$('[role="tablist"]').forEach((list) => {
  list.addEventListener('keydown', (event) => {
    const tabs = [...list.querySelectorAll('[role="tab"]')];
    const index = tabs.indexOf(document.activeElement);
    if (index < 0) return;
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next !== undefined) { event.preventDefault(); tabs[next].focus(); tabs[next].click(); }
  });
});

$$('[data-step]').forEach((button) => button.addEventListener('click', () => {
  activateTab(button);
  const [kicker, copy, formula] = steps[button.dataset.step];
  $('#step-kicker').textContent = kicker;
  $('#step-copy').textContent = copy;
  $('#step-formula').textContent = formula;
  $('#method-detail').setAttribute('aria-labelledby', button.id);
  enterPanel($('#method-detail'));
}));

const stories = {
  imagenet512: { headline: '9.14 FID.<br>135.64 GFLOPs.', description: 'SpecSlot-K4 improves FID by 2.84 over the compute-matched JiT control, using 3.9% fewer forward FLOPs.', takeaway: 'Only 0.69 FID behind JiT-B/16, at 38.2% lower forward cost.' },
  imagenet256: { headline: 'Two allocations.<br>Two operating points.', description: 'SpecSlot-K2 and K4 sit between JiT’s lower- and higher-cost settings. K4 reaches 6.59 FID at 129.20 forward GFLOPs.', takeaway: 'K4 is close to JiT-CM in final FID, with faster early-to-mid training convergence in the aligned comparison.' },
  t2i: { headline: '62.21 DPG-Bench.<br>40.6% fewer FLOPs.', description: 'SpecSlot-K4 improves DPG-Bench by 1.06 points over JiT-B/8, with no T2I-specific change to the allocation and routing architecture.', takeaway: 'GenEval improves over JiT-B/16; JiT-B/8 retains the highest GenEval score among these models.' },
};

function scatter(data) {
  const compact=window.matchMedia('(max-width:700px)').matches;
  const w=compact?Math.max(310,$('#result-chart').clientWidth):640, h=compact?320:360, left=compact?30:53, right=compact?12:24, top=46, bottom=57;
  const ymax=data.id === 'imagenet512' ? 18 : 9;
  const x=(n)=>left+n/240*(w-left-right);
  const y=(n)=>h-bottom-n/ymax*(h-top-bottom);
  const yticks=data.id === 'imagenet512' ? [0,3,6,9,12,15,18] : [0,2,4,6,8];
  const labelOffsets=compact ? (data.id==='imagenet512' ? [[7,-10,'start'],[-5,23,'end'],[-6,24,'end'],[8,-10,'start'],[-8,35,'end'],[8,23,'start']] : [[-5,30,'end'],[-5,-12,'end'],[4,-18,'start'],[-8,44,'end'],[4,-10,'start'],[10,23,'start']]) : (data.id==='imagenet512' ? [[9,-10,'start'],[-8,25,'end'],[-8,26,'end'],[12,-12,'start'],[-12,32,'end'],[12,24,'start']] : [[-9,31,'end'],[-8,-14,'end'],[10,-20,'start'],[-8,31,'end'],[8,-13,'start'],[12,25,'start']]);
  let content=`<svg viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="plot-title plot-desc"><title id="plot-title">${data.title}: FID versus forward compute</title><desc id="plot-desc">${data.rows.map(r=>`${r.model}: ${r.fid} FID at ${r.gflops} GFLOPs`).join('; ')}. Lower is better on both axes. The complete data table is available below.</desc>`;
  content+=`<circle cx="${w-208}" cy="15" r="5" fill="#526d60"/><text x="${w-196}" y="19" fill="#526d60" font-size="11">SpecSlot</text><circle cx="${w-113}" cy="15" r="4" fill="#81949d"/><text x="${w-101}" y="19" fill="#66726b" font-size="11">Baselines</text>`;
  for(const n of yticks) content+=`<line x1="${left}" y1="${y(n)}" x2="${w-right}" y2="${y(n)}" stroke="#dce0d6" stroke-width="1"/><text x="${left-12}" y="${y(n)+4}" text-anchor="end" fill="#66726b" font-size="12">${n}</text>`;
  for(const n of [0,50,100,150,200]) content+=`<line x1="${x(n)}" y1="${h-bottom}" x2="${x(n)}" y2="${h-bottom+5}" stroke="#aebaaa"/><text x="${x(n)}" y="${h-bottom+23}" text-anchor="middle" fill="#66726b" font-size="12">${n}</text>`;
  content+=`<text x="${left}" y="20" fill="#66726b" font-size="12">FID ↓</text><text x="${(left+w-right)/2}" y="${h-8}" text-anchor="middle" fill="#66726b" font-size="12">Conditional forward GFLOPs ↓</text>`;
  data.rows.forEach((r,i)=>{
    const [dx,dy,anchor]=labelOffsets[i];
    const color=r.ours?'#526d60':r.model.startsWith('SF')?'#a7806b':'#81949d';
    const name=r.ours ? (r.model.includes('K2')?(compact?'K2':'SpecSlot-K2'):(compact?'K4':'SpecSlot-K4')) : r.model;
    if(r.ours)content+=`<circle cx="${x(r.gflops)}" cy="${y(r.fid)}" r="12" fill="#526d6018"/>`;
    content+=`<circle cx="${x(r.gflops)}" cy="${y(r.fid)}" r="${r.ours?5.5:4.5}" fill="${color}" stroke="#f5f3ed" stroke-width="1.5"/><text x="${x(r.gflops)+dx}" y="${y(r.fid)+dy}" text-anchor="${anchor}" fill="${r.ours?'#385245':'#56655c'}" font-size="12" font-weight="${r.ours?650:450}">${name}</text>`;
  });
  return content+'</svg>';
}

function barChart(data) {
  const description='Overall scores in percent, on a zero to one hundred scale. '+data.rows.map(r=>`${r.model}: DPG-Bench ${r.dpg.toFixed(2)}, GenEval ${r.geneval.toFixed(2)}`).join('; ');
  return `<div class="bar-chart" role="img" aria-label="${escapeHTML(description)}">${[['dpg','DPG-Bench ↑'],['geneval','GenEval ↑']].map(([key,title])=>`<div><h4 class="bar-title">${title}</h4>${data.rows.map(r=>`<div class="bar-item ${r.ours?'ours':''}"><div class="bar-label"><span>${r.ours?'SpecSlot-K4':r.model}</span><span>${r[key].toFixed(2)}</span></div><div class="bar-track"><div class="bar-fill" style="width:${r[key]}%"></div></div></div>`).join('')}<div class="bar-scale"><span>0</span><span>100%</span></div></div>`).join('')}</div>`;
}

function showResults(id) {
  const data=RESULTS.find(r=>r.id===id);
  if(!data) return;
  const button=$(`[data-result="${id}"]`);
  activateTab(button);
  $('#result-panel').setAttribute('aria-labelledby', button.id);
  const story=stories[id];
  $('#result-tag').textContent=data.title;
  $('#result-headline').innerHTML=story.headline;
  $('#result-description').textContent=story.description;
  $('#result-takeaway').textContent=story.takeaway;
  $('#result-chart').innerHTML=id==='t2i'?barChart(data):scatter(data);
  $('#chart-note').textContent=id==='t2i'?'400 training epochs · Overall scores (%), higher is better.':'120 training epochs · FID-50K vs. conditional forward GFLOPs. Lower is better.';
  $('#result-table caption').textContent=`${data.title} benchmark results`;
  $('#result-table thead').innerHTML='<tr>'+data.columns.map(c=>`<th scope="col">${escapeHTML(c.label)}${c.direction?(c.direction==='up'?' ↑':' ↓'):''}</th>`).join('')+'</tr>';
  $('#result-table tbody').innerHTML=data.rows.map(r=>`<tr class="${r.ours?'ours':''}">${data.columns.map((c,i)=>i===0?`<th scope="row">${escapeHTML(r.model)}</th>`:`<td>${r[c.key].toFixed(2)}</td>`).join('')}</tr>`).join('');
  enterPanel($('#result-chart'));
}
$$('[data-result]').forEach(b=>b.addEventListener('click',()=>showResults(b.dataset.result)));
$$('[data-result-link]').forEach(a=>a.addEventListener('click',()=>showResults(a.dataset.resultLink)));
showResults('imagenet512');
$('.data-details').hidden=false;
$('#results-fallback').hidden=true;

// Mechanistic controls use the paper's trained ablations. The branch probe is
// separate: fixed-checkpoint interventions, not an estimate of generated FID.
let currentMechanism='carrier';
let basisIndex=5;
function evidenceTable(data) {
  return `<div class="table-scroll" tabindex="0" aria-label="Mechanism results"><table class="mechanism-table"><caption class="sr-only">${escapeHTML(data.title)}</caption><thead><tr>${data.columns.map(c=>`<th scope="col">${escapeHTML(c.label)}${c.direction?(c.direction==='up'?' ↑':' ↓'):''}</th>`).join('')}</tr></thead><tbody>${data.rows.map((r,i)=>`<tr class="${i===0?'ours':''}">${data.columns.map((c,j)=>j===0?`<th scope="row">${escapeHTML(r.model)}</th>`:`<td>${r[c.key].toFixed(2)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function evidencePlot(id) {
  const data=MECHANISMS[id],carrier=id==='carrier';
  const w=Math.max(300,$('#evidence-plot').clientWidth),h=330;
  const left=44,right=20,top=43,bottom=57;
  const xmin=carrier?6.4:100,xmax=carrier?7.4:250,ymin=carrier?200:5.5,ymax=carrier?225:7.5;
  const x=n=>left+(n-xmin)/(xmax-xmin)*(w-left-right);
  const y=n=>h-bottom-(n-ymin)/(ymax-ymin)*(h-top-bottom);
  const xticks=carrier?[6.4,6.6,6.8,7.0,7.2,7.4]:[100,150,200,250];
  const yticks=carrier?[200,205,210,215,220,225]:[5.5,6,6.5,7,7.5];
  const description=data.rows.map(r=>`${r.model}: FID ${r.fid}, IS ${r.is}${carrier?'':`, ${r.gflops} forward GFLOPs, ${r.throughput} images per second`}`).join('; ');
  let svg=`<svg viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="evidence-title evidence-desc"><title id="evidence-title">${carrier?'Carrier identity: FID and IS':'Routing: FID and forward compute'}</title><desc id="evidence-desc">${escapeHTML(description)}. Exact values are also shown in the adjacent table.</desc>`;
  svg+=`<text x="${left}" y="20" fill="#5e6b63" font-size="12">${carrier?'IS ↑':'FID ↓'}</text>`;
  for(const n of yticks)svg+=`<line x1="${left}" x2="${w-right}" y1="${y(n)}" y2="${y(n)}" stroke="#d0d8c9" stroke-width=".8"/><text x="${left-10}" y="${y(n)+4}" text-anchor="end" fill="#5e6b63" font-size="11">${n}</text>`;
  for(const n of xticks)svg+=`<line x1="${x(n)}" x2="${x(n)}" y1="${h-bottom}" y2="${h-bottom+4}" stroke="#acb9a9"/><text x="${x(n)}" y="${h-bottom+21}" text-anchor="middle" fill="#5e6b63" font-size="11">${carrier?n.toFixed(1):n}</text>`;
  svg+=`<text x="${(left+w-right)/2}" y="${h-9}" text-anchor="middle" fill="#5e6b63" font-size="12">${carrier?'FID ↓':'Conditional forward GFLOPs ↓'}</text>`;
  const offsets=carrier?[[11,-12,'start'],[10,-11,'start'],[-9,23,'end'],[11,22,'start']]:[[12,24,'start'],[12,-12,'start'],[13,4,'start'],[-9,-13,'end']];
  data.rows.forEach((r,i)=>{
    const px=x(carrier?r.fid:r.gflops),py=y(carrier?r.is:r.fid),[dx,dy,anchor]=offsets[i];
    const name=carrier?`Slot ${i}`:r.model;
    if(i===0)svg+=`<circle cx="${px}" cy="${py}" r="12" fill="#526d6018"/>`;
    svg+=`<circle cx="${px}" cy="${py}" r="${i===0?5.5:4.5}" fill="${i===0?'#526d60':'#81949d'}" stroke="#eeeee7" stroke-width="1.5"/><text x="${px+dx}" y="${py+dy}" text-anchor="${anchor}" fill="${i===0?'#385245':'#56655c'}" font-size="12" font-weight="${i===0?650:450}">${escapeHTML(name)}</text>`;
  });
  $('#evidence-plot').innerHTML=svg+'</svg>';
}
function basisChart(index) {
  const data=BASIS_SCALING[index];
  const compact=window.matchMedia('(max-width:700px)').matches;
  const w=compact?Math.max(310,$('#basis-chart').clientWidth):800,h=compact?340:355,left=compact?43:60,right=compact?15:35,top=63,bottom=62;
  const x=n=>left+n/2*(w-left-right);
  const y=n=>h-bottom-(Math.log10(n)-Math.log10(.8))/(2-Math.log10(.8))*(h-top-bottom);
  let svg=`<svg viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="basis-title basis-desc"><title id="basis-title">Branch scaling at flow time ${data.t.toFixed(2)}</title><desc id="basis-desc">Relative velocity MSE, logarithmic y-axis. Measured scales ${data.scales.join(', ')}. Spatial branch: ${data.spatial.map(v=>v.toFixed(3)).join(', ')}. Spectral branch: ${data.spectral.map(v=>v.toFixed(3)).join(', ')}. The other branch is unchanged. Connected markers show measured means, not additional experiments.</desc><text x="${left}" y="17" fill="#5e6b63" font-size="12">Relative velocity MSE · log scale</text>`;
  svg+=`<line x1="${left}" x2="${left+24}" y1="38" y2="38" stroke="#a7806b" stroke-width="2"/><text x="${left+31}" y="42" fill="#5e6b63" font-size="11">Spatial</text><line x1="${left+111}" x2="${left+135}" y1="38" y2="38" stroke="#526d60" stroke-width="2" stroke-dasharray="6 3"/><text x="${left+142}" y="42" fill="#5e6b63" font-size="11">Spectral</text>`;
  for(const v of [1,2,5,10,20,50,100])svg+=`<line x1="${left}" x2="${w-right}" y1="${y(v)}" y2="${y(v)}" stroke="#d0d8c9" stroke-width="${v===1?1.5:.7}"/><text x="${left-9}" y="${y(v)+4}" text-anchor="end" fill="#5e6b63" font-size="11">${v}</text>`;
  for(const v of [0,.5,1,1.5,2])svg+=`<text x="${x(v)}" y="${h-bottom+22}" text-anchor="middle" fill="#5e6b63" font-size="11">${v.toFixed(1)}</text>`;
  svg+=`<line x1="${x(1)}" x2="${x(1)}" y1="${top}" y2="${h-bottom}" stroke="#9ba694" stroke-dasharray="3 4"/><text x="${(left+w-right)/2}" y="${h-8}" text-anchor="middle" fill="#5e6b63" font-size="12">Branch scale α · 1 = unchanged</text>`;
  for(const [key,color,dash] of [['spatial','#a7806b',''],['spectral','#526d60','6 3']]){
    const coords=data.scales.map((s,i)=>`${x(s)},${y(data[key][i])}`).join(' ');
    svg+=`<polyline points="${coords}" stroke="${color}" stroke-width="2" stroke-dasharray="${dash}" fill="none"/>`;
    svg+=data.scales.map((s,i)=>`<circle cx="${x(s)}" cy="${y(data[key][i])}" r="3.5" fill="${color}"><title>${key} scale ${s}: ${data[key][i].toFixed(4)}×</title></circle>`).join('');
  }
  $('#basis-chart').innerHTML=svg+'</svg>';
  $('#basis-time').textContent=data.t.toFixed(2);
  $('#basis-t-slider').setAttribute('aria-valuetext',`Flow time ${data.t.toFixed(2)}`);
  $('#basis-readout').textContent=`At α = 0: ${data.spatial[0].toFixed(2)}× without spatial; ${data.spectral[0].toFixed(2)}× without spectral.`;
}
function showMechanism(id) {
  currentMechanism=id;
  const data=MECHANISMS[id],button=$(`[data-mechanism="${id}"]`);
  activateTab(button);
  $('#mechanism-panel').setAttribute('aria-labelledby',button.id);
  if(id==='carrier'){
    $('#mechanism-content').innerHTML=`<div class="carrier-explanation"><div class="carrier-copy"><h3>${escapeHTML(data.title)}</h3><p>${escapeHTML(data.description)}</p><p>${escapeHTML(data.detail)}</p></div>${evidenceTable(data)}</div>`;
    enterPanel($('#mechanism-content'));return;
  }
  let content=`<div class="mechanism-intro"><h3>${escapeHTML(data.title)}</h3><p>${escapeHTML(data.description)}</p></div>`;
  if(id==='basis'){
    content+='<div class="basis-controls"><label for="basis-t-slider">Flow time t = <strong id="basis-time">0.90</strong></label><input id="basis-t-slider" type="range" min="0" max="5" step="1" value="5" aria-label="Select one of six measured flow times"><span class="basis-readout" id="basis-readout" aria-live="polite"></span></div><div class="basis-chart" id="basis-chart"></div><p class="basis-chart-note">Six measured times, from noise toward the image. Markers show mean MSE relative to the unchanged model; only the selected branch is rescaled.</p>';
    content+='<div class="basis-figure"><button class="diagram zoomable" data-image="assets/hybrid-mechanism.png" data-caption="Figure 7 · Output-branch probes" aria-label="Enlarge the paper’s Figure 7"><img src="assets/hybrid-mechanism.png" alt="Figure 7: normalized branch energies and cross term, spatial energy share by radial band, and branch-scale counterfactuals" width="2800" height="847" loading="lazy"></button><p>Figure 7. Normalized branch energies and their cross term; spatial self-energy share by radial band; branch-scale interventions. Energy bands show 95% bootstrap intervals; other panels show means.</p></div>';
  }else{
    content+=`<div class="mechanism-chart-layout"><div class="evidence-plot" id="evidence-plot"></div>${evidenceTable(data)}</div>`;
  }
  $('#mechanism-content').innerHTML=content;
  if(id==='basis'){basisIndex=5;basisChart(basisIndex);}else evidencePlot(id);
  enterPanel($('#mechanism-content'));
}
$$('[data-mechanism]').forEach(b=>b.addEventListener('click',()=>showMechanism(b.dataset.mechanism)));
$('#mechanism-content').addEventListener('input',e=>{if(e.target.id==='basis-t-slider'){basisIndex=Number(e.target.value);basisChart(basisIndex);}});
showMechanism('carrier');

async function decodeImage(src) {
  const image=new Image();image.src=src;
  let timeout;
  try {
    await Promise.race([
      image.decode(),
      new Promise((_,reject)=>{timeout=setTimeout(()=>reject(new Error(`Image loading timed out: ${src}`)),10000);}),
    ]);
  } finally {clearTimeout(timeout);}
}
const galleries=[createCarousel({
  root:$('#gallery-carousel'),panel:$('#prompt-panel'),tabs:$$('[data-sample]'),
  previous:$('#gallery-prev'),next:$('#gallery-next'),
  progress:$('#gallery-progress'),position:$('#sample-position'),interval:8000,
  prepare:async button=>{
    const id=button.dataset.sample,src=`assets/${id}.webp`,label=button.textContent.trim();
    await decodeImage(src);
    return ()=>{
      $('#gallery-image').src=src;
      $('#gallery-image').alt=`Four SpecSlot generations for the displayed ${label.toLowerCase()} prompt`;
      $('#gallery-prompt').textContent=PROMPTS[id];
      $('#prompt-source').href=`https://github.com/TencentQQGYLab/ELLA/blob/main/dpg_bench/prompts/${id}.txt`;
      const zoom=$('#gallery-image-button');zoom.dataset.image=src;zoom.dataset.promptId=id;zoom.dataset.caption=`${label} · Four generations`;
      enterPanel($('#gallery-image'));enterPanel($('.prompt-copy'));
    };
  }
}),createCarousel({
  root:$('#pair-carousel'),panel:$('#pair-panel'),tabs:$$('[data-pair]'),
  previous:$('#pair-prev'),next:$('#pair-next'),
  progress:$('#pair-progress'),position:$('#pair-position'),interval:5000,
  prepare:async button=>{
    const label=button.textContent.trim();
    const pair=[['ours','specslot','SpecSlot W256/K4'],['baseline','jitcm','JiT-CM']].map(([id,model,name])=>({id,name,src:`assets/${button.dataset.pair}-${model}.webp`}));
    await Promise.all(pair.map(({src})=>decodeImage(src)));
    return ()=>{
      for(const {id,name,src} of pair){
        const image=$(`#pair-${id}`),zoom=$(`#pair-${id}-button`);
        image.src=src;image.alt=`${name} generation of ${label.toLowerCase()}`;
        zoom.dataset.image=src;zoom.dataset.caption=`${label} · ${name}`;
        zoom.setAttribute('aria-label',`Enlarge ${name} ${label.toLowerCase()}`);
      }
      enterPanel($('#pair-panel'));
    };
  }
})];

const dialog=$('#lightbox');
document.addEventListener('click',event=>{
  const trigger=event.target.closest('.zoomable');
  if(!trigger)return;
  const img=$('#lightbox-image');
  img.src=trigger.dataset.image;
  img.alt=trigger.dataset.caption;
  img.className=trigger.classList.contains('diagram')?'diagram-image':'square';
  $('.lightbox-body').classList.remove('is-zoomed');
  $('#lightbox-zoom').setAttribute('aria-pressed','false');
  $('#lightbox-zoom').textContent='Zoom in';
  $('#lightbox-caption').textContent=trigger.dataset.caption;
  const prompt=PROMPTS[trigger.dataset.promptId];
  $('#lightbox-prompt-block').hidden=!prompt;
  $('#lightbox-prompt').textContent=prompt||'';
  $('#lightbox-original').href=trigger.dataset.image;
  dialog.showModal(); document.body.classList.add('modal-open');
});
$('#lightbox-close').addEventListener('click',()=>dialog.close());
$('#lightbox-zoom').addEventListener('click',()=>{
  const zoomed=$('.lightbox-body').classList.toggle('is-zoomed');
  $('#lightbox-zoom').setAttribute('aria-pressed',String(zoomed));
  $('#lightbox-zoom').textContent=zoomed?'Fit image':'Zoom in';
});
dialog.addEventListener('click',e=>{if(e.target===dialog){const b=dialog.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)dialog.close();}});
dialog.addEventListener('close',()=>document.body.classList.remove('modal-open'));

$('#copy-citation').addEventListener('click',async()=>{
  const text=$('#bibtex').textContent;
  try { await navigator.clipboard.writeText(text); $('#copy-status').textContent='BibTeX copied.'; }
  catch { const range=document.createRange();range.selectNodeContents($('#bibtex'));const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);$('#copy-status').textContent='Citation selected. Press Ctrl+C or ⌘C to copy.'; }
});

if(VIDEO.src) {
  const video=$('#overview-video');
  video.src=VIDEO.src; video.hidden=false;
  $('#video-placeholder').hidden=true;
  $('#video-frame').classList.add('has-video');
  $('#video-status').textContent='Video overview';
  if(VIDEO.captions){const track=document.createElement('track');track.kind='captions';track.src=VIDEO.captions;track.srclang='en';track.label='English';track.default=true;video.append(track);}
}

const navigation=$$('.site-header nav a');
const sections=navigation.map(a=>$(a.getAttribute('href')));
let queued=false;
function updateNavigation(){
  let current='';for(const section of sections)if(section.getBoundingClientRect().top<=160)current=section.id;
  navigation.forEach(a=>{const active=a.hash==='#'+current;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
  const range=document.documentElement.scrollHeight-innerHeight;
  $('#reading-progress').style.transform=`scaleX(${range>0?Math.min(1,Math.max(0,scrollY/range)):0})`;
  queued=false;
}
window.addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(updateNavigation);}},{passive:true});
updateNavigation();
let resizeTimer;
window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{
  const current=$('[data-result][aria-selected="true"]').dataset.result;
  const data=RESULTS.find(r=>r.id===current);
  if(current!=='t2i')$('#result-chart').innerHTML=scatter(data);
  if(currentMechanism==='basis')basisChart(basisIndex);
  else if(currentMechanism==='routing')evidencePlot(currentMechanism);
},120);});

// Optional motion never gates navigation or access to the page.
if(!reducedMotion.matches){
  try{
    if(!sessionStorage.getItem('specslot-opening-v2')&&!location.hash){
      sessionStorage.setItem('specslot-opening-v2','seen');
      $('#opening').hidden=false;
      setTimeout(()=>$('#opening').hidden=true,1150);
    }
  }catch{/* Storage-restricted browsers simply skip the opening. */}
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}
    }),{threshold:.08});
    $$('.overview-copy,.highlights,.section-heading,.allocation-diagram,.resource-grid,.video-frame').forEach(el=>{
      if(el.getBoundingClientRect().top>innerHeight){el.classList.add('reveal-ready');observer.observe(el);}
    });
    // Restore all content if observers fail or the page is revisited via history.
    window.addEventListener('pageshow',e=>{if(e.persisted)$$('.reveal-ready').forEach(el=>el.classList.add('is-visible'));});
  }
}
