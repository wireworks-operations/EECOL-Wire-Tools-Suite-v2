// tape-scale.js - EECOL-themed tape measure component
// <tape-scale inches="1"
//              metric="true"
//              metric-unit="mm|cm"
//              cm-label-step="1"
//              mm-label-step="5"
//              imperial-feet="auto|on|off"
//              feet-label-step="1"
//              mode="fractions|decimals|both"
//              compact="false"
//              height="120"
//              marker="0.0"></tape-scale>

const tpl = document.createElement('template');
tpl.innerHTML = `
<style>
:host { display:block; }
.wrapper {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: .75rem;
  box-sizing: border-box;
  color: #0058B3;
  font-family: system-ui, Segoe UI, Inter, Roboto, Arial, sans-serif;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
.strip      { fill: #f9fafb; stroke: #d1d5db; }
.strip-mm   { fill: #ffffff; stroke: #d1d5db; }
.label { fill: #0058B3; font-size: 12px; text-anchor: middle; dominant-baseline: hanging; font-weight: 600; }
.sub   { fill: #6b7280; font-size: 11px; text-anchor: middle; dominant-baseline: hanging; }
.bold  { stroke: #0058B3; }
.med   { stroke: #3b82f6; }
.thin  { stroke: #93c5fd; }
.bold-mm { stroke: #059669; }
.med-mm  { stroke: #10b981; }
.thin-mm { stroke: #6ee7b7; }
.marker  { stroke: #dc2626; stroke-width: 3; shape-rendering: crispEdges; }
.foot    { stroke: #7c3aed; stroke-width: 4; shape-rendering: crispEdges; }
.legend {
  display:flex; flex-wrap: wrap; gap: .4rem .8rem; align-items:center; margin-top: .25rem;
  color:#6b7280; font-size:.9rem;
}
.badge { display:inline-flex; align-items:center; gap:.35rem; }
.sw { width:20px; height:0; border-top: 3px solid currentColor; }
.small .label { font-size: 11px; }
.small .sub   { font-size: 10px; }
</style>
<div class="wrapper">
  <svg id="svg" width="100%" part="svg"></svg>
  <div id="legend" class="legend" part="legend"></div>
</div>
`;

class TapeScale extends HTMLElement {
  static get observedAttributes() {
    return [
      'inches','metric','mode','compact','height',
      'mm-label-step','metric-unit','cm-label-step',
      'imperial-feet','feet-label-step','marker'
    ];
  }
  constructor(){
    super();
    this._root = this.attachShadow({mode:'open'});
    this._root.appendChild(tpl.content.cloneNode(true));
    this.svg = this._root.getElementById('svg');
    this.legend = this._root.getElementById('legend');
    this._resize = new ResizeObserver(()=>this.render());
    this._resize.observe(this);
  }
  connectedCallback(){ this.render(); }
  disconnectedCallback(){ this._resize.disconnect(); }
  attributeChangedCallback(){ this.render(); }

  // --- attributes ---
  get inches(){ return Math.max(1, parseInt(this.getAttribute('inches')||'1',10)); }
  get metric(){ return (this.getAttribute('metric')||'true') !== 'false'; }
  get mode(){ return (this.getAttribute('mode')||'fractions'); }
  get compact(){ return (this.getAttribute('compact')||'false') === 'true'; }
  get height(){ const h=parseInt(this.getAttribute('height')||'120',10); return Math.max(60,h); }
  get mmStep(){ const s=parseInt(this.getAttribute('mm-label-step')||'5',10); return Math.min(50, Math.max(1,s)); }
  get metricUnit(){ const u=(this.getAttribute('metric-unit')||'mm').toLowerCase(); return (u==='cm'?'cm':'mm'); }
  get cmStep(){ const s=parseFloat(this.getAttribute('cm-label-step')||'1'); return Math.max(0.1, s); }
  get imperialFeet(){ const v=(this.getAttribute('imperial-feet')||'auto').toLowerCase(); return ['auto','on','off'].includes(v)?v:'auto'; }
  get feetStep(){ const s=parseInt(this.getAttribute('feet-label-step')||'1',10); return Math.max(1,s); }
  get markerIn(){ return Math.max(0, parseFloat(this.getAttribute('marker')||'0')); }

  // --- util ---
  _gcd(a,b){ return b?this._gcd(b,a%b):Math.abs(a); }
  _frac(n,d){
    const g=this._gcd(n,d); n/=g; d/=g;
    const map={'1/2':'½','1/4':'¼','3/4':'¾','1/8':'⅛','3/8':'⅜','5/8':'⅝','7/8':'⅞'};
    const key=`${n}/${d}`; return map[key]||key;
  }
  _addText(x,y,txt,cls='label'){
    const t = document.createElementNS('http://www.w3.org/2000/svg','text');
    t.setAttribute('x', x); t.setAttribute('y', y);
    t.setAttribute('class', cls); t.textContent = txt;
    return t;
  }

  render(){
    const W = this.clientWidth || 800;
    const pad = 10;
    const rows = 2; // Always show both rows for dual measurement
    const rowH = Math.max(60, Math.floor((this.height - 10) / rows));
    const totalH = rows*rowH + 10;

    this.svg.setAttribute('viewBox', `0 0 ${W} ${totalH}`);
    this.svg.setAttribute('height', `${totalH}`);
    this.svg.innerHTML='';

    // groups
    const gStripIn = document.createElementNS('http://www.w3.org/2000/svg','g');
    const gIn      = document.createElementNS('http://www.w3.org/2000/svg','g');
    const gLblIn   = document.createElementNS('http://www.w3.org/2000/svg','g');
    const gFoot    = document.createElementNS('http://www.w3.org/2000/svg','g');

    const gStripMM = document.createElementNS('http://www.w3.org/2000/svg','g');
    const gMM      = document.createElementNS('http://www.w3.org/2000/svg','g');
    const gLblMM   = document.createElementNS('http://www.w3.org/2000/svg','g');

    const gMarker  = document.createElementNS('http://www.w3.org/2000/svg','g');

    // geometry
    const inchTop = 0;
    const inchBaseline = inchTop + rowH - 20;
    const mmTop = rowH + 10;
    const mmBaseline = mmTop + rowH - 20;

    // background strips
    const mkRect = (y,h,cls)=>{
      const r = document.createElementNS('http://www.w3.org/2000/svg','rect');
      r.setAttribute('x', pad); r.setAttribute('y', y+10);
      r.setAttribute('width', W - 2*pad); r.setAttribute('height', h-30);
      r.setAttribute('rx', 8); r.setAttribute('class', cls); return r;
    };
    gStripIn.appendChild(mkRect(inchTop, rowH, 'strip'));
    gStripMM.appendChild(mkRect(mmTop, rowH, 'strip-mm'));

    // --- INCH ticks/labels ---
    const totalSixteenths = this.inches * 16;
    const spanPx = (W-2*pad);
    const xIn = i => pad + spanPx * (i/totalSixteenths);

    const tickIn = (i)=>{
      let cls='thin', h=24, sw=2;
      if (i%16===0) { cls='bold'; h=52; sw=5; }
      else if (i%8===0) { cls='med'; h=44; sw=4; }
      else if (i%4===0) { cls='med'; h=40; sw=3; }
      else if (i%2===0) { cls='med'; h=32, sw=3; }
      return {cls,h,sw};
    };
    for (let i=0;i<=totalSixteenths;i++){
      const {cls,h,sw} = tickIn(i);
      const x = xIn(i);
      const ln = document.createElementNS('http://www.w3.org/2000/svg','line');
      ln.setAttribute('x1',x); ln.setAttribute('x2',x);
      ln.setAttribute('y1',inchBaseline-h); ln.setAttribute('y2',inchBaseline);
      ln.setAttribute('class',cls); ln.setAttribute('stroke-width',sw);
      ln.setAttribute('shape-rendering','crispEdges');
      gIn.appendChild(ln);
    }
    // inch labels - show fractional equivalents for every line
    for (let i=0;i<=totalSixteenths;i++){
      const x = xIn(i);
      const whole = Math.floor(i/16);
      const rem = i%16;
      let fracLabel = '';

      if (rem === 0) {
        fracLabel = whole === 0 ? '0' : `${whole}`;
      } else {
        fracLabel = this._frac(rem,16);
        if (whole > 0) fracLabel = `${whole} ${fracLabel}`;
      }

      // Show labels for every 1/16th mark
      if (i % 1 === 0) { // Every 1/16th
        gLblIn.appendChild(this._addText(x, inchBaseline+12, fracLabel, 'label'));
      }
    }

    // --- METRIC row - show mm/cm up to 1 inch (25.4mm) ---
    const mmMax = this.inches * 25.4;
    const xMM = mm => pad + spanPx * (mm/mmMax);
    const tickMM = (mm)=>{
      if (mm===0 || mm===mmMax) return {cls:'bold-mm',h:50,sw:5};
      if (Number.isInteger(mm)) {
        if (mm%10===0) return {cls:'bold-mm',h:42,sw:4};
        if (mm%5===0)  return {cls:'med-mm', h:34,sw:3};
        return {cls:'thin-mm',h:24,sw:2};
      }
      return {cls:'thin-mm',h:20,sw:2};
    };

    // draw mm ticks for every 1mm up to 25.4mm
    for (let mm=0; mm<=Math.floor(mmMax); mm++){
      const {cls,h,sw}=tickMM(mm);
      const x=xMM(mm);
      const ln = document.createElementNS('http://www.w3.org/2000/svg','line');
      ln.setAttribute('x1',x); ln.setAttribute('x2',x);
      ln.setAttribute('y1', mmBaseline-h); ln.setAttribute('y2', mmBaseline);
      ln.setAttribute('class',cls); ln.setAttribute('stroke-width',sw);
      ln.setAttribute('shape-rendering','crispEdges');
      gMM.appendChild(ln);
    }
    // precise end (25.4mm)
    if (!Number.isInteger(mmMax)){
      const {cls,h,sw}=tickMM(mmMax);
      const x=xMM(mmMax);
      const ln = document.createElementNS('http://www.w3.org/2000/svg','line');
      ln.setAttribute('x1',x); ln.setAttribute('x2',x);
      ln.setAttribute('y1', mmBaseline-h); ln.setAttribute('y2', mmBaseline);
      ln.setAttribute('class',cls); ln.setAttribute('stroke-width',sw);
      ln.setAttribute('shape-rendering','crispEdges');
      gMM.appendChild(ln);
    }

    // metric labels - show 0-23, then 24 at 24mm, 25 at 25mm (second last), no label at 25.4mm
    for (let mm=0; mm<24; mm++){
      const x = xMM(mm);
      gLblMM.appendChild(this._addText(x, mmBaseline+12, `${mm}`, 'label'));
    }
    // Show 24 at 24mm position
    gLblMM.appendChild(this._addText(xMM(24), mmBaseline+12, `24`, 'label'));
    // Show 25 at 25mm position (second last tick)
    gLblMM.appendChild(this._addText(xMM(25), mmBaseline+12, `25`, 'label'));
    // Final tick at 25.4mm has no label

    // marker
    if (isFinite(this.markerIn)){
      const m = Math.max(0, Math.min(this.inches, this.markerIn));
      const x = pad + spanPx * (m/this.inches);
      const ln = document.createElementNS('http://www.w3.org/2000/svg','line');
      ln.setAttribute('x1',x); ln.setAttribute('x2',x);
      ln.setAttribute('y1',8); ln.setAttribute('y2', totalH-8);
      ln.setAttribute('class','marker');
      gMarker.appendChild(ln);
    }

    // append
    this.svg.appendChild(gStripIn);
    this.svg.appendChild(gIn);
    this.svg.appendChild(gFoot);
    this.svg.appendChild(gLblIn);
    this.svg.appendChild(gStripMM);
    this.svg.appendChild(gMM);
    this.svg.appendChild(gLblMM);
    this.svg.appendChild(gMarker);

    // legend (hide on compact)
    this.legend.innerHTML='';
    if (!this.compact){
      this.legend.innerHTML = `
        <span class="badge" style="color:#0058B3"><span class="sw"></span>Inch: full inch</span>
        <span class="badge" style="color:#3b82f6"><span class="sw"></span>Inch: 1/2, 1/4, 1/8</span>
        <span class="badge" style="color:#93c5fd"><span class="sw"></span>Inch: 1/16</span>
        <span class="badge" style="color:#059669"><span class="sw"></span>Metric: 10 mm</span>
        <span class="badge" style="color:#10b981"><span class="sw"></span>Metric: 5 mm</span>
        <span class="badge" style="color:#6ee7b7"><span class="sw"></span>Metric: 1 mm</span>
      `;
      if (this.height <= 90) this.svg.classList.add('small'); else this.svg.classList.remove('small');
    }
  }
}
customElements.define('tape-scale', TapeScale);
