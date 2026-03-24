// ══════════════════════════════════════════════════════
//  MEGA — Check List Engine (35 indicadores)
// ══════════════════════════════════════════════════════

function megaCalcChecklist(d) {
  const ing   = mArr(d,'INGRESOS');
  const ub    = mArr(d,'UTILIDAD_BRUTA');
  const gn    = mArr(d,'GANANCIAS_NETAS');
  const ebit  = mArr(d,'EBIT');
  const ebitda= mArr(d,'EBITDA');
  const ofc   = mArr(d,'OFC');
  const capex = mArr(d,'CAPEX');
  const fcf   = mArr(d,'FCF');
  const bpa   = mArr(d,'BPA');
  const eq    = mArr(d,'EQUITY');
  const roicS = mArr(d,'ROIC');

  const ing25   = mLast(ing);
  const ub25    = mLast(ub);
  const gn25    = mLast(gn);
  const ebit25  = mLast(ebit);
  const ebitda25= mLast(ebitda);
  const ofc25   = mLast(ofc);
  const capex25 = mLast(capex);
  const fcf25   = mLast(fcf);
  const bpa25   = mLast(bpa);
  const bpa21   = bpa[0] || null;
  const roic25  = mLast(roicS);
  const eq25    = mLast(eq);
  const eq22    = eq[0] || null;

  const at   = mNum(d,'ACTIVOS_TOTALES');
  const ac   = mNum(d,'ACTIVOS_CORRIENTES');
  const pc   = mNum(d,'PASIVOS_CORRIENTES');
  const inv  = mNum(d,'INVENTARIOS');
  const ppe  = mNum(d,'PP_E', mNum(d,'PP&E_', mNum(d,'PPE')));
  const dt   = mNum(d,'DEUDA_TOTAL');
  const dcp  = mNum(d,'DEUDA_CP');
  const caja = mNum(d,'CAJA');
  const gi   = mNum(d,'GASTO_INTERESES');
  const ev   = mNum(d,'EV');
  const per  = mNum(d,'PER');
  const peg  = mNum(d,'PEG');
  const wacc = mNum(d,'WACC');
  const roe  = mNum(d,'ROE');
  const roa  = mNum(d,'ROA');
  const fcfSA = mNum(d,'FCF_SIN_APAL');
  const fcfA  = mNum(d,'FCF_APAL');
  const mgCap = mNum(d,'MARGEN_CAPEX');
  const altman= mNum(d,'ALTMAN');
  const piotr = mNum(d,'PIOTROSKI');
  const alertTxt = mStr(d,'ALERTAS','');
  const moneda   = mStr(d,'MONEDA','');
  const anios = ['2021','2022','2023','2024','2025'];

  // ── Cálculos derivados ──
  const mgBruto25  = (ub25 && ing25) ? (ub25/ing25)*100 : null;
  const mgNeto25   = (gn25 && ing25) ? (gn25/ing25)*100 : null;
  const vefcf      = (ev && fcf25)   ? ev/fcf25 : null;
  const fcfYield   = vefcf ? (1/vefcf)*100 : null;
  const rndFCF     = (fcf25 && ev)   ? (fcf25/ev)*100 : null;
  const mgEBIT25   = (ebit25 && ing25) ? (ebit25/ing25)*100 : null;
  const mgEBITDA25 = (ebitda25 && ing25) ? (ebitda25/ing25)*100 : null;
  const evEBIT     = (ev && ebit25)  ? ev/ebit25 : null;
  const roImp      = evEBIT ? (1/evEBIT)*100 : null;
  const liqCte     = (ac && pc) ? ac/pc : null;
  const liqAcida   = (ac && inv && pc) ? (ac-inv)/pc : null;
  const icr        = (ebit25 && gi) ? ebit25/gi : null;
  const dPat       = (dt && eq25) ? (dt/eq25)*100 : null;
  const dn         = (dt !== null && caja !== null) ? dt-caja : null;
  const dnEBITDA   = (dn !== null && ebitda25) ? dn/ebitda25 : null;
  const mgFCFSA    = (fcfSA && ing25) ? (fcfSA/ing25)*100 : null;
  const mgFCFA     = (fcfA && ing25)  ? (fcfA/ing25)*100  : null;
  const ubAt       = (ub25 && at) ? (ub25/at)*100 : null;
  const ppeIng     = (ppe && ing25) ? (ppe/ing25)*100 : null;

  let bpaCagr = null;
  if (bpa25 && bpa21 && bpa.length >= 4) bpaCagr = (Math.pow(bpa25/bpa21, 1/(bpa.length-1))-1)*100;

  const fcfCalc = (ofc25 && capex25) ? ofc25-capex25 : null;
  const spread  = (roic25 && wacc) ? roic25-wacc : null;

  const mgFCF = fcf.map((f,i) => ing[i] ? (f/ing[i])*100 : null);
  const mgFCF3 = mgFCF.slice(-3);
  const mgFCFOk = mgFCF3.every(v => v !== null && v >= 10 && v <= 25);
  const mgFCFSignal = mgFCFOk ? '🟢' : mgFCF3.some(v => v !== null && v < 10) ? '🔴' : '🟡';

  const eqGood = (eq25 && eq22) ? eq25 > eq22 : null;

  function sig(v, good, bad) {
    if (v === null) return '❓';
    if (good(v)) return '🟢';
    if (bad && bad(v)) return '🔴';
    return '🟡';
  }

  const inds = [
    { n:1,  name:'INGRESOS',            dato:ing.map((v,i)=>anios[i]+': '+mFmtN(v)).join(' | ')+' ('+moneda+')', signal:'🟢' },
    { n:2,  name:'UTILIDAD BRUTA',      dato:ub.map((v,i)=>anios[i]+': '+mFmtN(v)).join(' | ')+' ('+moneda+')',  signal:'🟢' },
    { n:3,  name:'GANANCIAS NETAS',     dato:gn.map((v,i)=>anios[i]+': '+mFmtN(v)).join(' | ')+' ('+moneda+')',  signal:'🟢' },
    { n:4,  name:'MARGEN BRUTO',        dato:mgBruto25 ? mPct(mgBruto25) : '—', signal:sig(mgBruto25,v=>v>20,v=>v<=20) },
    { n:5,  name:'MARGEN NETO',         dato:mgNeto25  ? mPct(mgNeto25)  : '—', signal:sig(mgNeto25, v=>v>20,v=>v<=20) },
    { n:6,  name:'FCF',                 dato:fcf.map((v,i)=>anios[i]+': '+mFmtN(v)).join(' | ')+' ('+moneda+')', signal:'🟢' },
    { n:7,  name:'RENDIMIENTO FCF',     dato:rndFCF ? mPct(rndFCF) : '—', signal:sig(rndFCF,v=>v>8,v=>v<=8) },
    { n:8,  name:'MARGEN FCF (3 años)', dato:mgFCF3.map((v,i)=>anios[Math.max(0,anios.length-3+i)]+': '+(v?mPct(v):'—')).join(' | '), signal:mgFCFSignal },
    { n:9,  name:'VE/FCF + FCF Yield',  dato:(vefcf?mFmt(vefcf)+'x':'—')+' · '+(fcfYield?mPct(fcfYield):'—'), signal:sig(vefcf,v=>v>=8&&v<=15,v=>v<8||v>15) },
    { n:10, name:'MARGEN EBIT',         dato:mgEBIT25  ? mPct(mgEBIT25)  : '—', signal:sig(mgEBIT25, v=>v>30,v=>v<=30) },
    { n:11, name:'PER',                 dato:per ? per+'x' : '—', signal:sig(per,v=>v>=10&&v<=30,v=>v<10||v>30) },
    { n:12, name:'PEG',                 dato:peg !== null ? String(peg) : '—', signal:sig(peg,v=>v<1,v=>v>=1) },
    { n:13, name:'ROE',                 dato:roe ? roe+'%' : '—', signal:sig(roe,v=>v>20,v=>v<=20) },
    { n:14, name:'ROIC',                dato:roicS.map((v,i)=>anios[i]+': '+v+'%').join(' | '), signal:sig(roic25,v=>v>20,v=>v<=20) },
    { n:15, name:'ROA',                 dato:roa ? roa+'%' : '—', signal:sig(roa,v=>v>15,v=>v<=15) },
    { n:16, name:'EQUITY',              dato:eq.map((v,i)=>(['2022','2023','2024','2025'][i]||'')+': '+mFmtN(v)).join(' | ')+' ('+moneda+')', signal:eqGood===null?'❓':eqGood?'🟢':'🔴' },
    { n:17, name:'WACC',                dato:wacc ? wacc+'%' : '—', signal:sig(wacc,v=>v>=7&&v<=11,v=>v<7||v>11) },
    { n:18, name:'EV/EBIT + ROImp',     dato:(evEBIT?mFmt(evEBIT)+'x':'—')+' · ROImp: '+(roImp?mPct(roImp):'—'), signal:sig(roImp,v=>wacc&&v>wacc,v=>wacc&&v<=wacc) },
    { n:19, name:'LIQUIDEZ CORRIENTE',  dato:liqCte  ? mFmt(liqCte)+'x'  : '—', signal:sig(liqCte,  v=>v>1, v=>v<=1) },
    { n:20, name:'LIQUIDEZ ÁCIDA',      dato:liqAcida? mFmt(liqAcida)+'x': '—', signal:sig(liqAcida,v=>v>1, v=>v<=1) },
    { n:21, name:'ICR',                 dato:icr ? mFmt(icr)+'x' : '—', signal:sig(icr,v=>v>3,v=>v<=3) },
    { n:22, name:'DEUDA / PATRIMONIO',  dato:dPat ? mPct(dPat) : '—', signal:sig(dPat,v=>v<20,v=>v>=20) },
    { n:23, name:'DEUDA NETA / EBITDA', dato:(dn!==null?mFmtN(dn,0)+' '+moneda:'—')+' · '+(dnEBITDA?mFmt(dnEBITDA)+'x':'—'), signal:sig(dnEBITDA,v=>v<=1,v=>v>1) },
    { n:24, name:'DEUDA NETA',          dato:dn!==null?mFmtN(dn,0)+' '+moneda:'—', signal:sig(dn,v=>v<0,v=>v>=0) },
    { n:25, name:'MARGEN FCF SIN APAL', dato:mgFCFSA ? mPct(mgFCFSA) : '—', signal:sig(mgFCFSA,v=>v>20,v=>v<=20) },
    { n:26, name:'MARGEN FCF APALANCADO',dato:mgFCFA ? mPct(mgFCFA)  : '—', signal:sig(mgFCFA, v=>v>15,v=>v<=15) },
    { n:27, name:'EBIT',                dato:mFmtN(ebit25,0)+' '+moneda, signal:'🟢' },
    { n:28, name:'EBITDA',              dato:mFmtN(ebitda25,0)+' '+moneda, signal:'🟢' },
    { n:29, name:'MARGEN EBITDA',       dato:mgEBITDA25?mPct(mgEBITDA25):'—', signal:sig(mgEBITDA25,v=>v>30,v=>v<=30) },
    { n:30, name:'CapEx',               dato:mFmtN(capex25,0)+' '+moneda, signal:'🟢' },
    { n:31, name:'MARGEN CAPEX',        dato:mgCap?mFmt(mgCap)+'%':'—', signal:mgCap?mgCap<=15?'🟢':'🔴':'❓' },
    { n:32, name:'UB / ACTIVOS TOTALES',dato:ubAt?mPct(ubAt):'—', signal:sig(ubAt,v=>v>25,v=>v<=25) },
    { n:33, name:'PP&E / INGRESOS',     dato:(ppe?mFmtN(ppe,0)+' '+moneda:'—')+(ppeIng?' · '+mPct(ppeIng):''), signal:sig(ppeIng,v=>v<=50,v=>v>50) },
    { n:34, name:'ALTMAN Z-SCORE',      dato:altman!==null?String(altman):'—', signal:sig(altman,v=>v>3,v=>v<=3) },
    { n:35, name:'PIOTROSKI',           dato:piotr?piotr+'/9':'—', signal:sig(piotr,v=>v>=7,v=>v<7) },
  ];

  const cntGreen = inds.filter(i => i.signal === '🟢').length;
  const cntAmber = inds.filter(i => i.signal === '🟡').length;
  const cntRed   = inds.filter(i => i.signal === '🔴').length;
  const pctScore = Math.round(cntGreen / inds.length * 100);

  // Heatmap
  const htInds = [
    { name:'ROIC %',      years: roicS.map((v,i) => ({ y:anios[i], v:v+'%', c:v>20?'g':v<15?'r':'a' })) },
    { name:'Margen Bruto',years: ub.map((v,i) => { const m = v&&ing[i]?v/ing[i]*100:null; return { y:anios[i],v:m?mPct(m,1):'—',c:m?m>20?'g':m<10?'r':'a':'n' }; }) },
    { name:'Margen FCF',  years: fcf.map((v,i) => { const m = v&&ing[i]?v/ing[i]*100:null; return { y:anios[i],v:m?mPct(m,1):'—',c:m?m>=10&&m<=25?'g':m<5?'r':'a':'n' }; }) },
    { name:'DN/EBITDA',   years: ebitda.map((v,i) => { const r = dn!==null&&v?dn/v:null; return { y:anios[i],v:r?mFmt(r)+'x':'—',c:r?r<=1?'g':r>3?'r':'a':'n' }; }) },
    { name:'OCF/GN',      years: ofc.map((v,i) => { const r = v&&gn[i]?v/gn[i]:null; return { y:anios[i],v:r?mFmt(r):'—',c:r?r>1?'g':r<0.5?'r':'a':'n' }; }) },
  ];

  return { inds, cntGreen, cntAmber, cntRed, pctScore, moneda, anios,
    ing, ub, gn, ebit, ebitda, fcf, ofc, capex, roicS,
    ing25, ub25, gn25, ebit25, ebitda25, fcf25, ofc25, capex25,
    ev, per, peg, wacc, roe, roic25, roa, dn, dnEBITDA, roImp, evEBIT,
    liqCte, liqAcida, icr, dPat, mgBruto25, mgNeto25, mgEBIT25, mgEBITDA25,
    altman, piotr, mgCap, spread, bpaCagr, fcfYield, vefcf, htInds, alertTxt };
}

// ── RENDER CHECK LIST — delega a renderDash() original de /js/app.js ─────────
// Recibe d (datos crudos de megaParse) para llamar calcIndicators() + renderDash()
function megaRenderChecklist(d, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Garantizar que #dash-content esté dentro del tab (renderDash escribe ahí)
  let dc = document.getElementById('dash-content');
  if (!dc || !container.contains(dc)) {
    container.innerHTML = '<div id="dash-content" style="padding:0 5%"></div>';
    dc = document.getElementById('dash-content');
  }

  // Setear clave ACCION para que renderDash muestre el nombre correcto
  const empresa = document.getElementById('inp-empresa')?.value?.trim() ||
                  d.EMPRESA || d.ACCION || d.TICKER || 'Empresa';
  d.ACCION = empresa;

  // calcIndicators y renderDash son globales (vienen de /js/app.js)
  const c = calcIndicators(d);
  renderDash(c);
}

// ── RENDER LEGACY (fallback si app.js no está disponible) ───────────────────
function megaRenderChecklistFallback(r, containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;

  // Score card
  const sc = r.pctScore;
  const scColor = sc >= 70 ? '#22c55e' : sc >= 45 ? '#f59e0b' : '#ef4444';
  const scLabel = sc >= 70 ? 'Sólido' : sc >= 45 ? 'Moderado' : 'Débil';

  let html = `
  <div class="score-card">
    <div class="score-num" style="color:${scColor}">${sc}%</div>
    <div class="score-info">
      <h3>Check List — ${r.cntGreen} de ${r.inds.length} indicadores ✓</h3>
      <p>🟢 ${r.cntGreen} positivos · 🟡 ${r.cntAmber} moderados · 🔴 ${r.cntRed} alertas</p>
      <p style="margin-top:.3rem;color:${scColor};font-weight:600">${scLabel}</p>
    </div>
  </div>`;

  // Tabla de 35 indicadores
  html += `<div class="sec-title">📋 Los 35 Indicadores</div>
  <table class="ind-table" style="margin-bottom:1.5rem">
    <thead><tr><th>#</th><th>Indicador</th><th>Valor / Serie</th><th style="text-align:center">Señal</th></tr></thead>
    <tbody>`;
  for (const ind of r.inds) {
    html += `<tr>
      <td style="color:var(--text3);font-size:.72rem">${ind.n}</td>
      <td style="font-weight:600">${ind.name}</td>
      <td style="font-family:'Space Mono',monospace;font-size:.76rem">${ind.dato}</td>
      <td style="text-align:center;font-size:1rem">${ind.signal}</td>
    </tr>`;
  }
  html += `</tbody></table>`;

  // Gráficas con Chart.js
  html += `<div class="sec-title">📊 Gráficas</div>
  <div class="grid-2" style="margin-bottom:1rem">
    <div class="chart-card"><h4>Ingresos · UB · GN (${r.moneda})</h4><div class="chart-wrap"><canvas id="cl-g1"></canvas></div></div>
    <div class="chart-card"><h4>EBIT vs EBITDA (${r.moneda})</h4><div class="chart-wrap"><canvas id="cl-g2"></canvas></div></div>
    <div class="chart-card"><h4>FCF · OFC · CapEx (${r.moneda})</h4><div class="chart-wrap"><canvas id="cl-g3"></canvas></div></div>
    <div class="chart-card"><h4>ROIC % vs WACC</h4><div class="chart-wrap"><canvas id="cl-g4"></canvas></div></div>
    <div class="chart-card"><h4>Márgenes %</h4><div class="chart-wrap"><canvas id="cl-g5"></canvas></div></div>
    <div class="chart-card"><h4>Liquidez · Deuda</h4><div class="chart-wrap"><canvas id="cl-g6"></canvas></div></div>
  </div>`;

  // Heatmap
  html += `<div class="sec-title">🗺 Heatmap de KPIs</div>
  <div style="overflow-x:auto;margin-bottom:1.5rem"><table class="heatmap-table">
    <thead><tr><th>Indicador</th>${r.anios.map(y=>`<th>${y}</th>`).join('')}</tr></thead>
    <tbody>`;
  for (const ht of r.htInds) {
    html += `<tr><td style="text-align:left;padding:.35rem .6rem;background:var(--panel2);color:var(--text2);font-size:.72rem">${ht.name}</td>`;
    html += ht.years.map(c => `<td class="hm-${c.c||'n'}">${c.v}</td>`).join('');
    html += `</tr>`;
  }
  html += `</tbody></table></div>`;

  // Alertas
  if (r.alertTxt) {
    html += `<div class="alert-box">⚠ Alertas del reporte: ${r.alertTxt}</div>`;
  }

  el.innerHTML = html;

  // Render charts
  const anlbs = r.anios;
  const blue='#2E74E8', grn='#22c55e', amb='#f59e0b', teal='#14b8a6', red='#ef4444';
  const defOpts = { responsive:true, maintainAspectRatio:false, plugins:{legend:{labels:{color:'#8AACCC',font:{size:10}}}}, scales:{x:{ticks:{color:'#6A829E',font:{size:9}}},y:{ticks:{color:'#6A829E',font:{size:9}}}} };

  new Chart(document.getElementById('cl-g1'), { type:'bar', data:{ labels:anlbs,
    datasets:[
      { label:'Ingresos', data:r.ing, backgroundColor:blue+'99', borderColor:blue, borderWidth:1 },
      { label:'UB',       data:r.ub,  backgroundColor:grn+'99',  borderColor:grn,  borderWidth:1 },
      { label:'GN',       data:r.gn,  backgroundColor:teal+'99', borderColor:teal, borderWidth:1 },
    ]}, options:{...defOpts} });

  new Chart(document.getElementById('cl-g2'), { type:'bar', data:{ labels:anlbs,
    datasets:[
      { label:'EBIT',   data:r.ebit,   backgroundColor:blue+'99', borderColor:blue, borderWidth:1 },
      { label:'EBITDA', data:r.ebitda, backgroundColor:grn+'99',  borderColor:grn,  borderWidth:1 },
    ]}, options:{...defOpts} });

  new Chart(document.getElementById('cl-g3'), { type:'bar', data:{ labels:anlbs,
    datasets:[
      { label:'OFC',   data:r.ofc,   backgroundColor:grn+'99',  borderColor:grn,  borderWidth:1 },
      { label:'CapEx', data:r.capex, backgroundColor:red+'99',  borderColor:red,   borderWidth:1 },
      { label:'FCF',   data:r.fcf,   backgroundColor:teal+'99', borderColor:teal,  borderWidth:1 },
    ]}, options:{...defOpts} });

  const roicData = r.roicS.map((v,i) => ({ x:anlbs[i], y:v }));
  const waccLine = anlbs.map(() => r.wacc);
  new Chart(document.getElementById('cl-g4'), { type:'line', data:{ labels:anlbs,
    datasets:[
      { label:'ROIC %', data:r.roicS, borderColor:grn, backgroundColor:grn+'22', fill:true, tension:.3 },
      { label:'WACC %', data:waccLine, borderColor:red,  borderDash:[5,4], pointRadius:0 },
    ]}, options:{...defOpts} });

  const mgIngs = r.ing.map((v,i) => r.ub[i] && v ? r.ub[i]/v*100 : null);
  const mgEbits = r.ing.map((v,i) => r.ebit[i] && v ? r.ebit[i]/v*100 : null);
  const mgFcfs  = r.ing.map((v,i) => r.fcf[i]  && v ? r.fcf[i]/v*100  : null);
  new Chart(document.getElementById('cl-g5'), { type:'line', data:{ labels:anlbs,
    datasets:[
      { label:'Mg Bruto %',data:mgIngs,  borderColor:grn,  fill:false, tension:.3 },
      { label:'Mg EBIT %', data:mgEbits, borderColor:blue, fill:false, tension:.3 },
      { label:'Mg FCF %',  data:mgFcfs,  borderColor:teal, fill:false, tension:.3 },
    ]}, options:{...defOpts} });

  new Chart(document.getElementById('cl-g6'), { type:'bar', data:{ labels:['Liq Cte','Liq Ácida','ICR/5','D/Patr%/10'],
    datasets:[{ label:'Ratio', data:[r.liqCte, r.liqAcida, r.icr?r.icr/5:null, r.dPat?r.dPat/10:null],
      backgroundColor:[grn+'99',teal+'99',amb+'99',red+'99'], borderWidth:1
    }]}, options:{...defOpts,plugins:{legend:{display:false}}} });
}
