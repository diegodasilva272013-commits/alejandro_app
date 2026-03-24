// ══════════════════════════════════════════════════════
//  MEGA — Análisis Técnico Engine (4 metodologías)
// ══════════════════════════════════════════════════════

function megaCalcTecnico(d, techExtras) {
  // techExtras = objeto con campos del formulario técnico opcional
  const te = techExtras || {};

  function tN(key, def=null) {
    // buscar en d primero (si vino en el texto), luego en techExtras
    const v = mNum(d, key);
    if (v !== null) return v;
    const v2 = parseFloat(te[key]);
    return !isNaN(v2) ? v2 : def;
  }
  function tS(key, def='') {
    const v = d[key];
    if (typeof v === 'string') return v.toLowerCase();
    const v2 = te[key];
    return v2 ? String(v2).toLowerCase() : def;
  }

  const precio   = tN('PRECIO_ACTUAL');
  const pivote   = tN('PRECIO_PIVOTE');
  const minPat   = tN('PRECIO_MIN_PATRON');
  const max52    = tN('PRECIO_MAX_52S');
  const min52    = tN('PRECIO_MIN_52S');
  const ma10     = tN('MA10');
  const ma20     = tN('MA20');
  const ma50     = tN('MA50');
  const ma200    = tN('MA200');
  const tendMA200= tS('TENDENCIA_MA200','');
  const volProm  = tN('VOLUMEN_PROMEDIO');
  const volHoy   = tN('VOLUMEN_HOY');
  const vcp1     = tN('VCP_CONTRACCION_1');
  const vcp2     = tN('VCP_CONTRACCION_2');
  const vcp3     = tN('VCP_CONTRACCION_3');
  const dTecho   = tN('DARVAS_TECHO');
  const dPiso    = tN('DARVAS_PISO');
  const dSemanas = tN('DARVAS_SEMANAS');
  const copaProf = tN('COPA_PROFUNDIDAD');
  const copaSem  = tN('COPA_SEMANAS');
  const handleSem= tN('HANDLE_SEMANAS');
  const avPrevio = tN('AVANCE_PREVIO');
  const consol   = tN('CONSOLIDACION_SEMANAS');
  const stopLoss = tN('STOP_LOSS');
  const obj1     = tN('PRECIO_OBJETIVO_1');
  const obj2     = tN('PRECIO_OBJETIVO_2');
  const rsi14    = tN('RSI_14');
  const macdVal  = tN('MACD');
  const macdSig  = tN('MACD_SIGNAL');
  const epsQTrim = tN('EPS_CREC_TRIM');
  const epsAnual = tN('EPS_CREC_ANUAL');
  const ventasCr = tN('VENTAS_CRECIMIENTO');
  const roe      = tN('ROE');
  const instPct  = tN('INST_PCT');
  const rsLine   = tS('RS_LINE','');
  const sectorTend = tS('SECTOR_TENDENCIA','');

  const hasTechData = precio !== null || pivote !== null || ma50 !== null;

  const volRatio   = (volHoy && volProm) ? volHoy/volProm : null;
  const volOk      = volRatio !== null ? volRatio >= 1.4 : null;
  const stage2     = precio && ma50 && ma200
    ? (precio > ma50 && ma50 > ma200 && tendMA200.includes('subiendo')) : null;
  const sobre10    = (precio && ma10)  ? precio > ma10  : null;
  const sobre20    = (precio && ma20)  ? precio > ma20  : null;
  const sobre50    = (precio && ma50)  ? precio > ma50  : null;
  const pctDePivote = (precio && pivote) ? ((pivote-precio)/pivote)*100 : null;
  const enZonaEntry = pctDePivote !== null ? pctDePivote >= 0 && pctDePivote <= 5 : null;
  const riesgo_pct  = (precio && stopLoss) ? ((precio-stopLoss)/precio)*100 : null;
  const reward1_pct = (precio && obj1) ? ((obj1-precio)/precio)*100 : null;
  const rr1 = (reward1_pct && riesgo_pct) ? reward1_pct/riesgo_pct : null;

  function chk(cond, label, detalle='') {
    return { cond, label, detalle };
  }

  // ── 1. Minervini VCP ──
  const vcpChecks = [
    chk(stage2, 'Stage 2 activo (precio > MA50 > MA200, MA200 subiendo)', stage2?`Precio:${precio} > MA50:${ma50} > MA200:${ma200}`:'No confirmado'),
    chk((vcp1&&vcp2)?( vcp3?(vcp1>vcp2&&vcp2>vcp3&&vcp3<=8):(vcp1>vcp2&&vcp2<=12)):null, 'Contracciones progresivamente menores', vcp1?`${vcp1}%→${vcp2||'?'}%→${vcp3||'?'}%`:'N/E'),
    chk((vcp3||vcp2)?((vcp3||vcp2)<=8):null, 'Última contracción ≤ 8%', (vcp3||vcp2)?`${vcp3||vcp2}%`:'N/E'),
    chk(volOk, 'Volumen breakout ≥ 140% del promedio', volRatio?`${(volRatio*100).toFixed(0)}%`:'N/E'),
    chk(enZonaEntry, 'Precio en zona of entry (≤5% bajo pivote)', pctDePivote!==null?`${pctDePivote.toFixed(1)}% del pivote`:'N/E'),
  ];
  const vcpScore = vcpChecks.filter(c => c.cond === true).length;

  // ── 2. Kullamagi ──
  const kullaChecks = [
    chk(avPrevio!==null?avPrevio>=30:null, 'Avance previo ≥ 30%', avPrevio!==null?avPrevio+'%':'N/E'),
    chk(sobre10, 'Precio sobre MA10', ma10?`${precio} > MA10:${ma10}`:'N/E'),
    chk(sobre20, 'Precio sobre MA20', ma20?`${precio} > MA20:${ma20}`:'N/E'),
    chk((ma20&&ma50)?ma20>ma50:null, 'MA20 > MA50', (ma20&&ma50)?`${ma20} > ${ma50}`:'N/E'),
    chk(consol!==null?(consol>=1&&consol<=8):null, 'Consolidación 1–8 semanas', consol!==null?consol+' sem':'N/E'),
    chk(volOk, 'Volumen ≥ 140% en el breakout', volRatio?`${(volRatio*100).toFixed(0)}%`:'N/E'),
  ];
  const kullaScore = kullaChecks.filter(c => c.cond === true).length;

  // ── 3. Darvas ──
  const darvasChecks = [
    chk(dTecho&&dPiso?dTecho>dPiso:null, 'Caja Darvas definida (techo > piso)', (dTecho&&dPiso)?`Techo:${dTecho} Piso:${dPiso}`:'N/E'),
    chk(dSemanas!==null?dSemanas>=3&&dSemanas<=12:null, 'Duración caja 3–12 semanas', dSemanas!==null?dSemanas+' sem':'N/E'),
    chk(precio&&dTecho?precio>dTecho*0.97&&precio<=dTecho*1.03:null, 'Precio cerca del techo de caja', precio&&dTecho?`${precio} vs techo ${dTecho}`:'N/E'),
    chk(volOk, 'Volumen expandido en breakout', volRatio?`${(volRatio*100).toFixed(0)}%`:'N/E'),
    chk(stage2, 'Stage 2 (tendencia alcista)', stage2?'Confirmado':'No confirmado'),
    chk(avPrevio!==null?avPrevio>=20:null, 'Avance previo ≥ 20%', avPrevio!==null?avPrevio+'%':'N/E'),
  ];
  const darvasScore = darvasChecks.filter(c => c.cond === true).length;

  // ── 4. O'Neill C&H ──
  const copaChecks = [
    chk(copaSem!==null?copaSem>=7&&copaSem<=65:null, 'Copa dura 7–65 semanas', copaSem!==null?copaSem+' sem':'N/E'),
    chk(copaProf!==null?copaProf>=15&&copaProf<=33:null, 'Profundidad copa 15–33%', copaProf!==null?copaProf+'%':'N/E'),
    chk(handleSem!==null?handleSem>=1&&handleSem<=8:null, 'Handle 1–8 semanas', handleSem!==null?handleSem+' sem':'N/E'),
    chk(enZonaEntry, 'Precio en zona de entry del handle', pctDePivote!==null?`${pctDePivote.toFixed(1)}%`:'N/E'),
    chk(avPrevio!==null?avPrevio>=30:null, 'Avance previo ≥ 30%', avPrevio!==null?avPrevio+'%':'N/E'),
    chk(volOk, 'Volumen expandido en breakout', volRatio?`${(volRatio*100).toFixed(0)}%`:'N/E'),
  ];
  const copaScore = copaChecks.filter(c => c.cond === true).length;

  // CANSLIM
  const canslim = [
    { cond:epsQTrim!==null?epsQTrim>=25:null, label:'EPS trim ≥25% (E)', val:epsQTrim!==null?epsQTrim+'%':'N/E' },
    { cond:epsAnual!==null?epsAnual>=15:null, label:'EPS anual ≥15% (E)', val:epsAnual!==null?epsAnual+'%':'N/E' },
    { cond:ventasCr!==null?ventasCr>=20:null, label:'Ventas ≥20% (C/A)', val:ventasCr!==null?ventasCr+'%':'N/E' },
    { cond:roe!==null?roe>=17:null, label:'ROE ≥17% (A)', val:roe!==null?roe+'%':'N/E' },
    { cond:instPct!==null?instPct>=30:null, label:'Institucional ≥30% (I)', val:instPct!==null?instPct+'%':'N/E' },
    { cond:rsLine?rsLine.includes('subiendo'):null, label:'RS Line subiendo (R)', val:rsLine||'N/E' },
    { cond:sectorTend?(sectorTend.includes('fuerte')||sectorTend.includes('positiv')):null, label:'Sector líder (L)', val:sectorTend||'N/E' },
  ];
  const canslimScore  = canslim.filter(c => c.cond === true).length;
  const canslimValidos= canslim.filter(c => c.cond !== null).length;

  return {
    hasTechData, precio, pivote, stopLoss, obj1, obj2, rr1, riesgo_pct,
    vcp:{ checks:vcpChecks, score:vcpScore, total:5 },
    kulla:{ checks:kullaChecks, score:kullaScore, total:6 },
    darvas:{ checks:darvasChecks, score:darvasScore, total:6 },
    copa:{ checks:copaChecks, score:copaScore, total:6 },
    canslim, canslimScore, canslimValidos,
    rsi14, macdVal, macdSig, volRatio
  };
}

// ── RENDER TÉCNICO ────────────────────────────────────────────────────────────
function megaRenderTecnico(r, containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;

  if (!r.hasTechData) {
    el.innerHTML = `<div class="ri-section" style="margin:1.5rem">
      <div class="ri-section-hdr">
        <div class="ri-section-letter">!</div>
        <div class="ri-section-title">Datos Técnicos no disponibles</div>
      </div>
      <div class="eval-block" style="grid-template-columns:1fr">
        <div class="eval-detail">Expandí la sección "Datos Técnicos opcionales" en el formulario y completá los campos clave: PRECIO_ACTUAL, PRECIO_PIVOTE, MA50, MA200, VOLUMEN_HOY, VOLUMEN_PROMEDIO.</div>
      </div>
    </div>`;
    return;
  }

  const empresa = document.getElementById('inp-empresa')?.value?.trim() || 'Empresa';

  function scoreColor(s, total) {
    const p = s/total;
    return p >= 0.7 ? '#1A8A4A' : p >= 0.4 ? '#f59e0b' : '#C0392B';
  }
  function scoreCls(s, total) {
    const p = s/total;
    return p >= 0.7 ? 'cumple' : p >= 0.4 ? 'warn' : 'nocumple';
  }
  function scoreLabel(s, total) {
    const p = s/total;
    return p >= 0.7 ? 'Setup Activo' : p >= 0.4 ? 'Setup Parcial' : 'No Cumple';
  }

  // KPI con los 4 setup scores
  const metodologias = [
    { key:'vcp',   nombre:'Minervini VCP', r:r.vcp },
    { key:'kulla', nombre:'Kullamagi MA',  r:r.kulla },
    { key:'darvas',nombre:'Darvas Box',    r:r.darvas },
    { key:'copa',  nombre:"O'Neill C&H",   r:r.copa },
  ];

  let html = `<div class="ri-empresa">${empresa} — Análisis Técnico</div>
  <div class="kpi-row">`;
  for (const m of metodologias) {
    const cls = scoreCls(m.r.score, m.r.total);
    html += `<div class="kpi-card ${cls}">
      <div class="kpi-label">${m.nombre}</div>
      <div class="kpi-value">${m.r.score}/${m.r.total}</div>
      <div class="kpi-sub">${scoreLabel(m.r.score, m.r.total)}</div>
    </div>`;
  }
  if (r.precio && r.stopLoss && r.rr1) {
    const rrCls = r.rr1 >= 2 ? 'cumple' : r.rr1 >= 1 ? '' : 'nocumple';
    html += `<div class="kpi-card ${rrCls}">
      <div class="kpi-label">R:R Ratio</div>
      <div class="kpi-value">${r.rr1.toFixed(1)}x</div>
      <div class="kpi-sub">${r.rr1>=2?'Favorable':'Mejorable'}</div>
    </div>`;
  }
  html += `</div>`;

  // 4 metodologías con checks como eval-blocks
  for (const m of metodologias) {
    const sc = m.r.score; const tot = m.r.total;
    const col = scoreColor(sc, tot);
    html += `<div class="ri-section">
      <div class="ri-section-hdr">
        <div class="ri-section-letter" style="font-size:.65rem">${sc}/${tot}</div>
        <div class="ri-section-title">${m.nombre}</div>
        <span class="ri-section-extra" style="color:${col}">${scoreLabel(sc, tot)}</span>
      </div>
      <div style="height:4px;background:rgba(26,86,196,.15)"><div style="height:100%;width:${sc/tot*100}%;background:${col};transition:width .5s;border-radius:2px"></div></div>`;
    for (const c of m.r.checks) {
      const bCls = c.cond === true ? 'cumple' : c.cond === false ? 'nocumple' : 'nd';
      html += `<div class="eval-block">
        <div>
          <div class="eval-label">${c.label}</div>
          ${c.detalle ? `<div class="eval-detail"><span class="eval-key">${c.detalle}</span></div>` : ''}
        </div>
        <span class="ri-badge ${bCls}">${c.cond===true?'✔ Sí':c.cond===false?'✘ No':'— N/A'}</span>
      </div>`;
    }
    html += `</div>`;
  }

  // R:R section
  if (r.precio && r.stopLoss && r.obj1) {
    html += `<div class="ri-section">
      <div class="ri-section-hdr">
        <div class="ri-section-letter">R</div>
        <div class="ri-section-title">Riesgo / Recompensa</div>
      </div>
      <div class="eval-block">
        <div><div class="eval-label">Precio Actual</div><div class="eval-detail"><span class="eval-key">$${r.precio}</span>${r.pivote ? ` · Pivote: $${r.pivote}` : ''}</div></div>
        <span class="ri-badge ${r.precio < (r.pivote||r.precio*1.05) ? 'cumple' : 'warn'}">En rango</span>
      </div>
      <div class="eval-block">
        <div><div class="eval-label">Stop Loss</div><div class="eval-detail"><span class="eval-key">$${r.stopLoss}</span>${r.riesgo_pct ? ` · Riesgo: ${r.riesgo_pct.toFixed(1)}%` : ''}</div></div>
        <span class="ri-badge ${r.riesgo_pct&&r.riesgo_pct<=8?'cumple':'nocumple'}">${r.riesgo_pct?r.riesgo_pct.toFixed(1)+'%':'—'}</span>
      </div>
      <div class="eval-block">
        <div><div class="eval-label">Objetivo 1</div><div class="eval-detail"><span class="eval-key">$${r.obj1}</span></div></div>
        <span class="ri-badge ${r.rr1>=2?'cumple':r.rr1>=1?'warn':'nocumple'}">R:R ${r.rr1?r.rr1.toFixed(1)+'x':'—'}</span>
      </div>
    </div>`;
  }

  // CANSLIM como eval-blocks
  html += `<div class="ri-section">
    <div class="ri-section-hdr">
      <div class="ri-section-letter" style="font-size:.65rem">${r.canslimScore}/${r.canslimValidos||7}</div>
      <div class="ri-section-title">CANSLIM</div>
    </div>`;
  for (const c of r.canslim) {
    const bCls = c.cond === true ? 'cumple' : c.cond === false ? 'nocumple' : 'nd';
    html += `<div class="eval-block">
      <div>
        <div class="eval-label">${c.label}</div>
        <div class="eval-detail"><span class="eval-key">${c.val}</span></div>
      </div>
      <span class="ri-badge ${bCls}">${c.cond===true?'✔ Sí':c.cond===false?'✘ No':'— N/A'}</span>
    </div>`;
  }
  html += `</div>`;

  // Indicadores técnicos adicionales
  const techRows = [];
  if (r.rsi14 !== null) techRows.push({ name:'RSI 14', val:r.rsi14.toFixed(1), note:r.rsi14<30?'Sobreventa':r.rsi14>70?'Sobrecompra':'Saludable', ok:r.rsi14>=30&&r.rsi14<=70 });
  if (r.macdVal !== null) techRows.push({ name:'MACD', val:r.macdVal.toFixed(3), note:r.macdSig?(r.macdVal>r.macdSig?'Alcista':'Bajista'):'—', ok:r.macdSig?r.macdVal>r.macdSig:null });
  if (r.volRatio !== null) techRows.push({ name:'Vol Ratio', val:(r.volRatio*100).toFixed(0)+'%', note:r.volRatio>=1.4?'Expandido':'Normal', ok:r.volRatio>=1.4 });

  if (techRows.length > 0) {
    html += `<div class="ri-section">
      <div class="ri-section-hdr">
        <div class="ri-section-letter">T</div>
        <div class="ri-section-title">Indicadores Técnicos Adicionales</div>
      </div>`;
    for (const row of techRows) {
      const bCls = row.ok === true ? 'cumple' : row.ok === false ? 'warn' : 'nd';
      html += `<div class="eval-block">
        <div><div class="eval-label">${row.name}</div><div class="eval-detail"><span class="eval-key">${row.val}</span> · ${row.note}</div></div>
        <span class="ri-badge ${bCls}">${row.val}</span>
      </div>`;
    }
    html += `</div>`;
  }

  el.innerHTML = html;
}
