// ══════════════════════════════════════════════════════
//  MEGA — ROImp Engine (Bloques A-K)
// ══════════════════════════════════════════════════════

function megaCalcRoimp(d) {
  const evEbit  = mNum(d,'EV_EBIT');
  const wacc    = mNum(d,'WACC');
  const roic    = mNum(d,'ROIC') || mLast(mArr(d,'ROIC'));
  const ev      = mNum(d,'EV');
  const ebit    = mNum(d,'EBIT') || mLast(mArr(d,'EBIT'));
  const ebitda  = mNum(d,'EBITDA') || mLast(mArr(d,'EBITDA'));
  const fcf     = mNum(d,'FCF') || mLast(mArr(d,'FCF'));
  const fcfYield= mNum(d,'FCF_YIELD');
  const evFcf   = mNum(d,'EV_FCF');
  const mgEbit  = mNum(d,'MARGEN_EBIT');
  const mgEbitda= mNum(d,'MARGEN_EBITDA');
  const per     = mNum(d,'PER');
  const perFwd  = mNum(d,'PER_FWD');
  const peg     = mNum(d,'PEG');
  const roe     = mNum(d,'ROE');
  const roa     = mNum(d,'ROA');
  const eq      = mNum(d,'EQUITY') || mLast(mArr(d,'EQUITY'));
  const dt      = mNum(d,'DEUDA_TOTAL');
  const caja    = mNum(d,'CAJA');
  const dnEbitda= mNum(d,'DEUDA_NETA_EBITDA');
  const icr     = mNum(d,'ICR');
  const dPat    = mNum(d,'DEUDA_PATRIMONIO');
  const fcfApal = mNum(d,'FCF_APAL');
  const fcfSinAp= mNum(d,'FCF_SIN_APAL');
  const capex   = mNum(d,'MARGEN_CAPEX');
  const ing     = mNum(d,'INGRESOS') || mLast(mArr(d,'INGRESOS'));
  const ub      = mNum(d,'UTILIDAD_BRUTA') || mLast(mArr(d,'UTILIDAD_BRUTA'));
  const gn      = mNum(d,'GANANCIAS_NETAS') || mLast(mArr(d,'GANANCIAS_NETAS'));
  const mgBruto = mNum(d,'MARGEN_BRUTO');
  const altman  = mNum(d,'ALTMAN');
  const piotr   = mNum(d,'PIOTROSKI');
  const bpaGrowth = mNum(d,'BPA_GROWTH');
  const evEbitda  = mNum(d,'EV_EBITDA');

  // Cálculos clave
  const evEbitCalc = evEbit || (ev && ebit ? ev/ebit : null);
  const roImp = evEbitCalc ? (1/evEbitCalc)*100 : null;
  const umbral = wacc ? wacc + 1.5 : null;
  const deudaNeta = (dt !== null && caja !== null) ? dt - caja : null;
  const dnEbitdaCalc = dnEbitda || (deudaNeta !== null && ebitda ? deudaNeta/ebitda : null);
  const dnEV = (deudaNeta !== null && ev) ? deudaNeta/ev*100 : null;
  const fcfApalCalc = mNum(d,'FCF_APAL') || fcf;
  const mgFcfApal   = fcfApalCalc && ing ? fcfApalCalc/ing*100 : mNum(d,'FCF_APAL');
  const mgFcfSinAp  = fcfSinAp && ing ? fcfSinAp/ing*100 : null;

  // ── Congruencia de ORO ──
  const oroC = [
    { label:'Deuda Neta NEGATIVA', ok: deudaNeta !== null ? deudaNeta < 0 : null, val: deudaNeta !== null ? mFmtN(deudaNeta,0) : '—' },
    { label:'FCF > 0', ok: fcf !== null ? fcf > 0 : null, val: fcf !== null ? mFmtN(fcf,0) : '—' },
    { label:'ROIC > WACC', ok: (roic && wacc) ? roic > wacc : null, val:(roic&&wacc)?`${roic}% vs ${wacc}%`:'—' },
    { label:'ROImp > WACC', ok: (roImp && wacc) ? roImp > wacc : null, val:(roImp&&wacc)?`${mFmt(roImp)}% vs ${wacc}%`:'—' },
  ];
  const oroCount = oroC.filter(c => c.ok === true).length;
  const oroOk = oroCount >= 3;

  // ── Bloques ──
  const bloques = [];

  bloques.push({ id:'A', label:'ROImp Principal', rows:[
    { name:'EV/EBIT', val:evEbitCalc?mFmt(evEbitCalc)+'x':'—', ok:evEbitCalc?evEbitCalc>0:null },
    { name:'ROImp', val:roImp?mPct(roImp):'—', ok:roImp&&wacc?roImp>wacc:null, highlight:true },
    { name:'WACC', val:wacc?wacc+'%':'—', ok:null },
    { name:'Umbral (WACC+1.5%)', val:umbral?umbral.toFixed(1)+'%':'—', ok:null },
  ]});

  bloques.push({ id:'B', label:'ROIC vs WACC (Spread)', rows:[
    { name:'ROIC', val:roic?roic+'%':'—', ok:roic&&wacc?roic>wacc:null },
    { name:'WACC', val:wacc?wacc+'%':'—', ok:null },
    { name:'Spread ROIC-WACC', val:(roic&&wacc)?(roic-wacc).toFixed(2)+'%':'—', ok:(roic&&wacc)?roic>wacc:null, highlight:true },
  ]});

  bloques.push({ id:'C', label:'Trampas de Valor', rows:[
    { name:'CapEx Margin', val:capex?capex.toFixed(1)+'%':'—', ok:capex?capex<5:null },
    { name:'FCF > 0', val:fcf!==null?mFmtN(fcf,0):'—', ok:fcf!==null?fcf>0:null },
    { name:'Deuda Neta', val:deudaNeta!==null?mFmtN(deudaNeta,0):'—', ok:deudaNeta!==null?deudaNeta<0:null },
    { name:'Crec. BPA', val:bpaGrowth!==null?bpaGrowth+'%':'—', ok:bpaGrowth!==null?bpaGrowth>0:null },
  ]});

  bloques.push({ id:'D', label:'Deuda Neta', rows:[
    { name:'Deuda Total', val:dt!==null?mFmtN(dt,0):'—', ok:null },
    { name:'Caja', val:caja!==null?mFmtN(caja,0):'—', ok:null },
    { name:'Deuda Neta', val:deudaNeta!==null?mFmtN(deudaNeta,0):'—', ok:deudaNeta!==null?deudaNeta<0:null, highlight:true },
  ]});

  bloques.push({ id:'E-F', label:'Deuda Controlada', rows:[
    { name:'DN/EBITDA', val:dnEbitdaCalc!==null?mFmt(dnEbitdaCalc)+'x':'—', ok:dnEbitdaCalc!==null?Math.abs(dnEbitdaCalc)<=2:null },
    { name:'ICR', val:icr?mFmt(icr)+'x':'—', ok:icr?icr>=2&&icr<=5:null },
    { name:'Deuda/Patrimonio', val:dPat?mPct(dPat):'—', ok:dPat?dPat<80:null },
    { name:'Mg FCF Apal ≥ Sin Apal', val:(fcfApal&&fcfSinAp)?`${mFmt(fcfApal*100/ing||0)}% vs ${mFmt(fcfSinAp*100/ing||0)}%`:'—', ok:(fcfApal&&fcfSinAp)?fcfApal>=fcfSinAp:null },
  ]});

  bloques.push({ id:'G', label:'EV/FCF', rows:[
    { name:'EV/FCF', val:evFcf?mFmt(evFcf)+'x':'—', ok:evFcf?evFcf>=6&&evFcf<=15:null },
    { name:'FCF Yield', val:fcfYield?mPct(fcfYield):'—', ok:fcfYield?fcfYield>8:null },
  ]});

  bloques.push({ id:'H', label:'Congruencia de ORO', rows:oroC.map(c => ({
    name: c.label, val: c.val, ok: c.ok, highlight: c.ok === true
  }))});

  bloques.push({ id:'I', label:'Márgenes', rows:[
    { name:'Margen EBIT', val:mgEbit?mPct(mgEbit):'—', ok:mgEbit?mgEbit>25:null },
    { name:'Margen EBITDA', val:mgEbitda?mPct(mgEbitda):'—', ok:mgEbitda?mgEbitda>30:null },
    { name:'Margen Bruto', val:mgBruto?mPct(mgBruto):'—', ok:mgBruto?mgBruto>20:null },
  ]});

  bloques.push({ id:'J', label:'Valoración', rows:[
    { name:'PER', val:per?per+'x':'—', ok:per?per>=10&&per<=30:null },
    { name:'PER Forward', val:perFwd?perFwd+'x':'—', ok:perFwd?perFwd>=8&&perFwd<=25:null },
    { name:'PEG', val:peg!==null?String(peg):'—', ok:peg!==null?peg<1:null },
    { name:'EV/EBITDA', val:evEbitda?mFmt(evEbitda)+'x':'—', ok:evEbitda?evEbitda>=8&&evEbitda<=18:null },
  ]});

  bloques.push({ id:'K', label:'DN/EV', rows:[
    { name:'Deuda Neta/EV', val:dnEV!==null?mPct(dnEV):'—', ok:dnEV!==null?dnEV<30:null },
  ]});

  // Veredicto
  let verd, verdCls;
  if (roImp === null) { verd = '⚠ Datos insuficientes — EV/EBIT es obligatorio'; verdCls = 'verd-nd'; }
  else if (roImp < (wacc||0)) { verd = `✘ ROImp (${mFmt(roImp)}%) < WACC (${wacc||'?'}%) → NO COMPRAR`; verdCls = 'verd-no'; }
  else { verd = `✔ ROImp (${mFmt(roImp)}%) > WACC (${wacc||'?'}%) → BUENA SEÑAL`; verdCls = 'verd-ok'; }

  return { bloques, roImp, wacc, umbral, roic, oroC, oroCount, oroOk, verd, verdCls,
    evEbitCalc, deudaNeta, fcf, dnEbitdaCalc, per, peg, perFwd, ev, ebit, ebitda,
    mgEbit, mgEbitda, mgBruto, dPat, icr, fcfYield, evFcf };
}

// ── RENDER ROImp — IDÉNTICO al módulo original ────────────────────────────────
function megaRenderRoimp(r, containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;

  // helpers de badge
  function badge(ok) {
    if (ok === true)  return '<span class="ri-badge cumple">✔ Cumple</span>';
    if (ok === false) return '<span class="ri-badge nocumple">✘ No Cumple</span>';
    return '<span class="ri-badge nd">— N/A</span>';
  }

  // empresa name
  const empresa = document.getElementById('inp-empresa')?.value?.trim() || 'Empresa';

  // veredicto bar
  const verdBarCls = r.verdCls === 'verd-ok' ? 'buena-senal' : 'no-comprar';
  const verdLabel  = r.verdCls === 'verd-ok'
    ? `✔&nbsp;ROImp Superior — Buena Señal`
    : `✘&nbsp;ROImp Inferior — No Comprar`;
  const verdSub = r.roImp !== null && r.wacc !== null
    ? `ROImp ${r.roImp.toFixed(2)}%  vs  WACC ${r.wacc}%`
    : 'EV/EBIT o WACC no disponibles';

  // conteo para score KPI
  const allRows = r.bloques.flatMap(b => b.rows).filter(row => row.ok !== null);
  const cntOk   = allRows.filter(row => row.ok === true).length;
  const scorePct = allRows.length ? Math.round(cntOk / allRows.length * 100) : null;
  const scoreOk  = scorePct !== null ? scorePct >= 60 : null;

  // KPI cards helpers
  function kpi(label, val, sub, ok) {
    const cls = ok === true ? 'cumple' : ok === false ? 'nocumple' : '';
    return `<div class="kpi-card ${cls}">
      <div class="kpi-label">${label}</div>
      <div class="kpi-value">${val ?? '—'}</div>
      <div class="kpi-sub">${sub}</div>
    </div>`;
  }

  const fmt1 = v => v !== null && v !== undefined ? v.toFixed(2) : null;
  const pct1 = v => v !== null && v !== undefined ? v.toFixed(1) + '%' : null;

  let html = `<div class="ri-empresa">${empresa}</div>
  <div class="veredicto-bar ${verdBarCls}">
    <div class="veredicto-badge">${verdLabel}</div>
    <span class="veredicto-sub">${verdSub}</span>
  </div>
  <div class="kpi-row">
    ${kpi('ROImp',        pct1(r.roImp),        r.verdCls==='verd-ok'?'> WACC — Buena señal':'< WACC — No comprar',  r.verdCls==='verd-ok')}
    ${kpi('WACC',         r.wacc ? r.wacc + '%' : null, 'Costo mínimo de capital', null)}
    ${kpi('ROIC',         r.roic ? r.roic + '%' : null, r.roic&&r.wacc?(r.roic>r.wacc?'≥ WACC ✔':'< WACC ✘'):'—', r.roic&&r.wacc?r.roic>r.wacc:null)}
    ${kpi('EV/EBIT',      r.evEbitCalc ? fmt1(r.evEbitCalc) + 'x' : null, 'Múltiplo EV/EBIT', r.evEbitCalc?r.evEbitCalc>0:null)}
    ${kpi('EV/FCF',       r.evFcf ? fmt1(r.evFcf) + 'x' : null, r.evFcf?(r.evFcf>=6&&r.evFcf<=15?'Controlado':'Caro'):'—', r.evFcf?r.evFcf>=6&&r.evFcf<=15:null)}
    ${kpi('Score',        scorePct !== null ? scorePct + '%' : null, scorePct !== null ? `${cntOk} / ${allRows.length} criterios` : '—', scoreOk)}
  </div>`;

  // Bloques A-K como secciones con eval-blocks
  for (const b of r.bloques) {
    if (b.id === 'H') {
      // Congruencia de ORO — diseño especial
      const oroHdr = r.oroOk
        ? '<span style="color:#f59e0b;font-size:.8rem;font-weight:700;margin-left:auto">⭐ CONGRUENCIA ACTIVA</span>'
        : '<span style="color:#8FA8C8;font-size:.8rem;margin-left:auto">Congruencia incompleta</span>';
      html += `<div class="ri-section">
        <div class="ri-section-hdr">
          <div class="ri-section-letter">${b.id}</div>
          <div class="ri-section-title">${b.label} — ${r.oroCount}/4 condiciones</div>
          ${oroHdr}
        </div>`;
      for (const row of b.rows) {
        html += `<div class="eval-block">
          <div>
            <div class="eval-label">${row.name}</div>
            <div class="eval-detail"><span class="eval-key">${row.val}</span></div>
          </div>
          ${badge(row.ok)}
        </div>`;
      }
      html += `</div>`;
      continue;
    }
    html += `<div class="ri-section">
      <div class="ri-section-hdr">
        <div class="ri-section-letter">${b.id}</div>
        <div class="ri-section-title">${b.label}</div>
      </div>`;
    for (const row of b.rows) {
      html += `<div class="eval-block">
        <div>
          <div class="eval-label">${row.name}</div>
          <div class="eval-detail"><span class="eval-key">${row.val}</span></div>
        </div>
        ${badge(row.ok)}
      </div>`;
    }
    html += `</div>`;
  }

  // Summary grid
  const cumpleItems   = r.bloques.flatMap(b => b.rows).filter(row => row.ok === true);
  const nocumpleItems = r.bloques.flatMap(b => b.rows).filter(row => row.ok === false);
  const ndItems       = r.bloques.flatMap(b => b.rows).filter(row => row.ok === null);

  html += `<div class="ri-section">
    <div class="ri-section-hdr">
      <div class="ri-section-letter">Σ</div>
      <div class="ri-section-title">Resumen</div>
    </div>
    <div class="summary-grid">
      <div class="summary-col cumple">
        <div class="col-title">✔ Cumple (${cumpleItems.length})</div>
        <ul>${cumpleItems.map(r => `<li>${r.name}</li>`).join('')}</ul>
      </div>
      <div class="summary-col nocumple">
        <div class="col-title">✘ No Cumple (${nocumpleItems.length})</div>
        <ul>${nocumpleItems.map(r => `<li>${r.name}</li>`).join('')}</ul>
      </div>
      <div class="summary-col faltante">
        <div class="col-title">— N/A (${ndItems.length})</div>
        <ul>${ndItems.map(r => `<li>${r.name}</li>`).join('')}</ul>
      </div>
    </div>
  </div>`;

  // Gráficas
  html += `<div class="ri-charts-grid">
    <div class="ri-chart-box"><div class="ri-chart-title">ROImp · ROIC · WACC</div><div style="position:relative;height:200px"><canvas id="ri-g1"></canvas></div></div>
    <div class="ri-chart-box"><div class="ri-chart-title">Márgenes %</div><div style="position:relative;height:200px"><canvas id="ri-g2"></canvas></div></div>
    <div class="ri-chart-box"><div class="ri-chart-title">Estructura de Capital</div><div style="position:relative;height:200px"><canvas id="ri-g3"></canvas></div></div>
    <div class="ri-chart-box"><div class="ri-chart-title">Valoración (múltiplos)</div><div style="position:relative;height:200px"><canvas id="ri-g4"></canvas></div></div>
  </div>`;

  el.innerHTML = html;

  // Charts
  const cOpts = { responsive:true, maintainAspectRatio:false,
    plugins:{legend:{labels:{color:'#8AACCC',font:{size:10}}}},
    scales:{x:{ticks:{color:'#6A829E',font:{size:9}},grid:{color:'rgba(26,86,196,.12)'}},
            y:{ticks:{color:'#6A829E',font:{size:9}},grid:{color:'rgba(26,86,196,.12)'}}} };
  const blue='#2E74E8', grn='#1A8A4A', red='#C0392B', amb='#f59e0b';

  new Chart(document.getElementById('ri-g1'), { type:'bar',
    data:{ labels:['ROImp','ROIC','WACC','Umbral'],
      datasets:[{ data:[r.roImp, r.roic, r.wacc, r.umbral],
        backgroundColor:[grn+'cc', blue+'cc', red+'cc', amb+'88'], borderWidth:0, borderRadius:4 }]},
    options:{...cOpts, plugins:{legend:{display:false}}} });

  new Chart(document.getElementById('ri-g2'), { type:'bar',
    data:{ labels:['Mg EBIT','Mg EBITDA','Mg Bruto'],
      datasets:[{ data:[r.mgEbit, r.mgEbitda, r.mgBruto],
        backgroundColor:[blue+'cc', grn+'cc', amb+'cc'], borderWidth:0, borderRadius:4 }]},
    options:{...cOpts, plugins:{legend:{display:false}}} });

  new Chart(document.getElementById('ri-g3'), { type:'doughnut',
    data:{ labels:['Caja neta (positivo)','Deuda neta (pasivo)'],
      datasets:[{
        data: r.deudaNeta !== null
          ? (r.deudaNeta < 0 ? [Math.abs(r.deudaNeta), 0.001] : [0.001, r.deudaNeta])
          : [1, 1],
        backgroundColor:[grn+'dd', red+'dd'], borderWidth:0
      }]},
    options:{...cOpts, scales:undefined, plugins:{legend:{labels:{color:'#8AACCC',font:{size:10}}}}} });

  new Chart(document.getElementById('ri-g4'), { type:'bar',
    data:{ labels:['PER','PER Fwd','PEG×10','EV/EBITDA'],
      datasets:[{ data:[r.per, r.perFwd, r.peg ? r.peg*10 : null, r.evFcf],
        backgroundColor: amb+'cc', borderWidth:0, borderRadius:4 }]},
    options:{...cOpts, plugins:{legend:{display:false}}} });
}
