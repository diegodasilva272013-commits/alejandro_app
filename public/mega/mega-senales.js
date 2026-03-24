// ══════════════════════════════════════════════════════
//  MEGA — Señales v3.0 Engine (29 puntos A→AC)
// ══════════════════════════════════════════════════════

// CUMPLE, NO, FALTA y yesno() vienen de senales/app/evaluador.js (incluido en mega/index.html)

function megaCalcSenales(d, qualitativos) {
  // qualitativos = { BALANCE_SANO, SALUD_DEBIL, etc. } desde el formulario
  const q = qualitativos || {};

  function gQ(key) {
    // buscar en parsed data primero, luego en formulario
    const v = d[key];
    if (v === 'si' || v === 'no') return v;
    const v2 = q[key];
    if (v2 === 'si' || v2 === 'no') return v2;
    return null;
  }

  // Mapeo de campos desde d (parsed con megaParse) a los nombres de señales
  const sd = {
    roic:              mNum(d,'ROIC') || mLast(mArr(d,'ROIC')),
    wacc:              mNum(d,'WACC'),
    roe:               mNum(d,'ROE'),
    roa:               mNum(d,'ROA'),
    ingresos:          mNum(d,'INGRESOS') || mLast(mArr(d,'INGRESOS')),
    ebit:              mNum(d,'EBIT') || mLast(mArr(d,'EBIT')),
    ebitda:            mNum(d,'EBITDA') || mLast(mArr(d,'EBITDA')),
    margen_ebit:       mNum(d,'MARGEN_EBIT'),
    margen_ebitda:     mNum(d,'MARGEN_EBITDA'),
    margen_bruto:      mNum(d,'MARGEN_BRUTO'),
    margen_neto:       mNum(d,'MARGEN_NETO'),
    fcf_neto:          mNum(d,'FCF') || mLast(mArr(d,'FCF')),
    fcf_yield:         mNum(d,'FCF_YIELD'),
    fcf_margen_apal:   mNum(d,'FCF_APAL'),
    fcf_margen_sin_apal:mNum(d,'FCF_SIN_APAL'),
    per_ltm:           mNum(d,'PER'),
    per_fwd:           mNum(d,'PER_FWD'),
    peg:               mNum(d,'PEG'),
    ev:                mNum(d,'EV'),
    ev_ebit:           mNum(d,'EV_EBIT'),
    ev_ebitda:         mNum(d,'EV_EBITDA'),
    ev_fcf:            mNum(d,'EV_FCF'),
    deuda_neta:        mNum(d,'DEUDA_NETA'),
    deuda_neta_ebitda: mNum(d,'DEUDA_NETA_EBITDA'),
    deuda_patrimonio:  mNum(d,'DEUDA_PATRIMONIO'),
    deuda_total:       mNum(d,'DEUDA_TOTAL'),
    capex_margen:      mNum(d,'MARGEN_CAPEX'),
    eps_growth:        mNum(d,'BPA_GROWTH'),
    cfo:               mNum(d,'OFC') || mLast(mArr(d,'OFC')),
    equity:            mNum(d,'EQUITY') || mLast(mArr(d,'EQUITY')),
    altman_z:          mNum(d,'ALTMAN'),
    piotroski:         mNum(d,'PIOTROSKI'),
    icr:               mNum(d,'ICR'),
    // cualitativos
    balance_sano:      gQ('BALANCE_SANO'),
    salud_debil:       gQ('SALUD_DEBIL'),
    ventaja_comp:      gQ('VENTAJA_COMP'),
    sector_deterioro:  gQ('SECTOR_DETERIORO'),
    re_rating_ev:      gQ('RE_RATING_EV'),
    spin_off:          gQ('SPIN_OFF'),
    recompra:          gQ('RECOMPRA'),
    venta_activos:     gQ('VENTA_ACTIVOS'),
  };

  // Derivados
  if (sd.roic !== null && sd.wacc !== null) sd.spread_roic_wacc = sd.roic - sd.wacc;
  if (sd.ev_ebit !== null && sd.ev_ebit !== 0) sd.roimp = (1/sd.ev_ebit)*100;
  if (sd.ebit !== null && sd.ebitda) sd.ratio_ebit_ebitda = (sd.ebit/sd.ebitda)*100;
  if (!sd.deuda_neta) {
    const dt = mNum(d,'DEUDA_TOTAL'), caja = mNum(d,'CAJA');
    if (dt !== null && caja !== null) sd.deuda_neta = dt - caja;
  }
  if (!sd.deuda_neta_ebitda && sd.deuda_neta !== null && sd.ebitda) sd.deuda_neta_ebitda = sd.deuda_neta/sd.ebitda;
  if (!sd.deuda_patrimonio) {
    const dt = mNum(d,'DEUDA_TOTAL'), eq = sd.equity;
    if (dt !== null && eq) sd.deuda_patrimonio = dt/eq*100;
  }

  const pts = [];

  // ── A — ROIC > WACC ──
  pts.push((() => {
    const res = sd.roic!==null&&sd.wacc!==null ? (sd.roic>sd.wacc?CUMPLE:NO) : FALTA;
    return { letra:'A', titulo:'ROIC > WACC — Creación de Valor',
      resultado:res, interpretacion:res===CUMPLE?`ROIC ${sd.roic}% > WACC ${sd.wacc}% → Empresa crea valor.`:res===NO?`ROIC ${sd.roic}% < WACC ${sd.wacc}% → Destruye valor.`:'Dato faltante.', grupo:'Rentabilidad' };
  })());

  // ── B — WACC % razonable ──
  pts.push((() => {
    const res = sd.wacc!==null ? (sd.wacc>=7&&sd.wacc<=11?CUMPLE:NO) : FALTA;
    return { letra:'B', titulo:'WACC razonable (7–11%)',
      resultado:res, interpretacion:`WACC: ${sd.wacc!==null?sd.wacc+'%':'N/E'}`, grupo:'Rentabilidad' };
  })());

  // ── C — ROImp > WACC ──
  pts.push((() => {
    const res = sd.roimp!==null&&sd.wacc!==null ? (sd.roimp>sd.wacc?CUMPLE:NO) : FALTA;
    return { letra:'C', titulo:'ROImp > WACC — Precio de entrada válido',
      resultado:res, interpretacion:sd.roimp!==null?`ROImp ${mFmt(sd.roimp)}% vs WACC ${sd.wacc||'?'}%`:'EV/EBIT no disponible.', grupo:'Rentabilidad' };
  })());

  // ── D — Margen EBIT ──
  pts.push((() => {
    const mg = sd.margen_ebit || (sd.ebit&&sd.ingresos?sd.ebit/sd.ingresos*100:null);
    const res = mg!==null ? (mg>25?CUMPLE:NO) : FALTA;
    return { letra:'D', titulo:'Margen EBIT > 25%',
      resultado:res, interpretacion:mg!==null?mPct(mg):'N/E', grupo:'Márgenes' };
  })());

  // ── E — Margen EBITDA ──
  pts.push((() => {
    const mg = sd.margen_ebitda || (sd.ebitda&&sd.ingresos?sd.ebitda/sd.ingresos*100:null);
    const res = mg!==null ? (mg>30?CUMPLE:NO) : FALTA;
    return { letra:'E', titulo:'Margen EBITDA > 30%',
      resultado:res, interpretacion:mg!==null?mPct(mg):'N/E', grupo:'Márgenes' };
  })());

  // ── F — EBIT/EBITDA > 70% ──
  pts.push((() => {
    const r2 = sd.ratio_ebit_ebitda;
    const res = r2!==null ? (r2>70?CUMPLE:NO) : FALTA;
    return { letra:'F', titulo:'EBIT/EBITDA > 70% (calidad del negocio)',
      resultado:res, interpretacion:r2!==null?mFmt(r2)+'%':'N/E', grupo:'Márgenes' };
  })());

  // ── G — FCF Positivo ──
  pts.push((() => {
    const res = sd.fcf_neto!==null ? (sd.fcf_neto>0?CUMPLE:NO) : FALTA;
    return { letra:'G', titulo:'FCF Positivo y Creciente',
      resultado:res, interpretacion:sd.fcf_neto!==null?mFmtN(sd.fcf_neto,0):'N/E', grupo:'FCF' };
  })());

  // ── H — FCF Yield ──
  pts.push((() => {
    const res = sd.fcf_yield!==null ? (sd.fcf_yield>8?CUMPLE:NO) : FALTA;
    return { letra:'H', titulo:'FCF Yield > 8%',
      resultado:res, interpretacion:sd.fcf_yield!==null?mPct(sd.fcf_yield):'N/E', grupo:'FCF' };
  })());

  // ── I — Deuda Neta Negativa ──
  pts.push((() => {
    const res = sd.deuda_neta!==null ? (sd.deuda_neta<0?CUMPLE:NO) : FALTA;
    return { letra:'I', titulo:'Deuda Neta NEGATIVA (posición de caja neta)',
      resultado:res, interpretacion:sd.deuda_neta!==null?mFmtN(sd.deuda_neta,0):'N/E', grupo:'Deuda' };
  })());

  // ── J — DN/EBITDA ≤ 2x ──
  pts.push((() => {
    const res = sd.deuda_neta_ebitda!==null ? (Math.abs(sd.deuda_neta_ebitda)<=2?CUMPLE:NO) : FALTA;
    return { letra:'J', titulo:'Deuda Neta/EBITDA ≤ 2x',
      resultado:res, interpretacion:sd.deuda_neta_ebitda!==null?mFmt(sd.deuda_neta_ebitda)+'x':'N/E', grupo:'Deuda' };
  })());

  // ── K — ICR ──
  pts.push((() => {
    const res = sd.icr!==null ? (sd.icr>=2&&sd.icr<=5?CUMPLE:NO) : FALTA;
    return { letra:'K', titulo:'ICR entre 2–5x',
      resultado:res, interpretacion:sd.icr!==null?mFmt(sd.icr)+'x':'N/E', grupo:'Deuda' };
  })());

  // ── L — Deuda/Patrimonio < 80% ──
  pts.push((() => {
    const res = sd.deuda_patrimonio!==null ? (sd.deuda_patrimonio<80?CUMPLE:NO) : FALTA;
    return { letra:'L', titulo:'Deuda/Patrimonio < 80%',
      resultado:res, interpretacion:sd.deuda_patrimonio!==null?mPct(sd.deuda_patrimonio):'N/E', grupo:'Deuda' };
  })());

  // ── M — ROE ──
  pts.push((() => {
    const res = sd.roe!==null ? (sd.roe>20?CUMPLE:NO) : FALTA;
    return { letra:'M', titulo:'ROE > 20%',
      resultado:res, interpretacion:sd.roe!==null?sd.roe+'%':'N/E', grupo:'Rentabilidad' };
  })());

  // ── N — PER razonable ──
  pts.push((() => {
    const res = sd.per_ltm!==null ? (sd.per_ltm>=10&&sd.per_ltm<=30?CUMPLE:NO) : FALTA;
    return { letra:'N', titulo:'PER razonable (10–30x)',
      resultado:res, interpretacion:sd.per_ltm!==null?sd.per_ltm+'x':'N/E', grupo:'Valoración' };
  })());

  // ── O — PEG < 1 ──
  pts.push((() => {
    const res = sd.peg!==null ? (sd.peg<1?CUMPLE:NO) : FALTA;
    return { letra:'O', titulo:'PEG < 1 — Valor relativo al crecimiento',
      resultado:res, interpretacion:sd.peg!==null?String(sd.peg):'N/E', grupo:'Valoración' };
  })());

  // ── P — EV/FCF ──
  pts.push((() => {
    const res = sd.ev_fcf!==null ? (sd.ev_fcf>=8&&sd.ev_fcf<=15?CUMPLE:NO) : FALTA;
    return { letra:'P', titulo:'EV/FCF entre 8–15x',
      resultado:res, interpretacion:sd.ev_fcf!==null?mFmt(sd.ev_fcf)+'x':'N/E', grupo:'Valoración' };
  })());

  // ── Q — Altman ──
  pts.push((() => {
    const res = sd.altman_z!==null ? (sd.altman_z>3?CUMPLE:NO) : FALTA;
    return { letra:'Q', titulo:'Altman Z-Score > 3 (zona segura)',
      resultado:res, interpretacion:sd.altman_z!==null?String(sd.altman_z):'N/E', grupo:'Salud' };
  })());

  // ── R — Piotroski ──
  pts.push((() => {
    const res = sd.piotroski!==null ? (sd.piotroski>=7?CUMPLE:NO) : FALTA;
    return { letra:'R', titulo:'Piotroski F-Score ≥ 7',
      resultado:res, interpretacion:sd.piotroski!==null?sd.piotroski+'/9':'N/E', grupo:'Salud' };
  })());

  // ── S — CapEx < 5% ──
  pts.push((() => {
    const res = sd.capex_margen!==null ? (sd.capex_margen<5?CUMPLE:NO) : FALTA;
    return { letra:'S', titulo:'CapEx Margin < 5% (light business)',
      resultado:res, interpretacion:sd.capex_margen!==null?mPct(sd.capex_margen):'N/E', grupo:'CapEx' };
  })());

  // ── T — Crecimiento EPS ──
  pts.push((() => {
    const res = sd.eps_growth!==null ? (sd.eps_growth>10?CUMPLE:NO) : FALTA;
    return { letra:'T', titulo:'Crecimiento EPS > 10%',
      resultado:res, interpretacion:sd.eps_growth!==null?sd.eps_growth+'%':'N/E', grupo:'Crecimiento' };
  })());

  // ── U — CFO / GN > 1 ──
  pts.push((() => {
    const gn = mNum(d,'GANANCIAS_NETAS') || mLast(mArr(d,'GANANCIAS_NETAS'));
    const r2 = sd.cfo&&gn ? sd.cfo/gn : null;
    const res = r2!==null ? (r2>1?CUMPLE:NO) : FALTA;
    return { letra:'U', titulo:'CFO/Ganancias Netas > 1 (calidad de beneficios)',
      resultado:res, interpretacion:r2!==null?mFmt(r2)+'x':'N/E', grupo:'FCF' };
  })());

  // ── V — Balance Sano ──
  pts.push((() => {
    const res = sd.balance_sano==='si'?CUMPLE:sd.balance_sano==='no'?NO:FALTA;
    return { letra:'V', titulo:'Balance Sano — Calidad estructural',
      resultado:res, interpretacion:`Balance sano: ${yesno(sd.balance_sano)}`, grupo:'Cualitativos' };
  })());

  // ── W — Sin debilidad estructural ──
  pts.push((() => {
    const res = sd.salud_debil==='no'?CUMPLE:sd.salud_debil==='si'?NO:FALTA;
    return { letra:'W', titulo:'Ausencia de Debilidad Estructural',
      resultado:res, interpretacion:`Salud débil: ${yesno(sd.salud_debil)}`, grupo:'Cualitativos' };
  })());

  // ── X — Ventaja Competitiva ──
  pts.push((() => {
    const res = sd.ventaja_comp==='si'?CUMPLE:sd.ventaja_comp==='no'?NO:FALTA;
    return { letra:'X', titulo:'Ventaja Competitiva — Moat',
      resultado:res, interpretacion:`Moat: ${yesno(sd.ventaja_comp)}`, grupo:'Cualitativos' };
  })());

  // ── Y — Sector Saludable ──
  pts.push((() => {
    const res = sd.sector_deterioro==='no'?CUMPLE:sd.sector_deterioro==='si'?NO:FALTA;
    return { letra:'Y', titulo:'Sector sin deterioro',
      resultado:res, interpretacion:`Sector en deterioro: ${yesno(sd.sector_deterioro)}`, grupo:'Cualitativos' };
  })());

  // ── Z — Re-rating EV ──
  pts.push((() => {
    const res = sd.re_rating_ev==='si'?CUMPLE:sd.re_rating_ev==='no'?NO:FALTA;
    return { letra:'Z', titulo:'Posible Re-rating de EV',
      resultado:res, interpretacion:`Re-rating: ${yesno(sd.re_rating_ev)}`, grupo:'Catalizadores' };
  })());

  // ── AA — Spin-off ──
  pts.push((() => {
    const res = sd.spin_off==='si'?CUMPLE:sd.spin_off==='no'?NO:FALTA;
    return { letra:'AA', titulo:'Spin-off — Desbloqueo de valor',
      resultado:res, interpretacion:`Spin-off: ${yesno(sd.spin_off)}`, grupo:'Catalizadores' };
  })());

  // ── AB — Recompra ──
  pts.push((() => {
    const res = sd.recompra==='si'?CUMPLE:sd.recompra==='no'?NO:FALTA;
    return { letra:'AB', titulo:'Recompra Agresiva de Acciones',
      resultado:res, interpretacion:`Recompra: ${yesno(sd.recompra)}`, grupo:'Catalizadores' };
  })());

  // ── AC — Venta de Activos ──
  pts.push((() => {
    const res = sd.venta_activos==='si'?CUMPLE:sd.venta_activos==='no'?NO:FALTA;
    return { letra:'AC', titulo:'Venta de Activos — Desapalancamiento',
      resultado:res, interpretacion:`Venta activos: ${yesno(sd.venta_activos)}`, grupo:'Catalizadores' };
  })());

  const totalCumple = pts.filter(p => p.resultado === CUMPLE).length;
  const totalNo     = pts.filter(p => p.resultado === NO).length;
  const totalFalta  = pts.filter(p => p.resultado === FALTA).length;
  const pct = pts.length > 0 ? Math.round(totalCumple/pts.length*100) : 0;

  let conclusion = pct>=70 ? `Empresa sólida: ${totalCumple}/${pts.length} puntos (${pct}%). Perfil favorable.`
    : pct>=50 ? `Fundamentos mixtos: ${totalCumple}/${pts.length} puntos (${pct}%). Monitorear alertas.`
    : `Fundamentos débiles: solo ${totalCumple}/${pts.length} puntos (${pct}%). Alta cautela.`;

  let cita = null;
  if (sd.roimp!==null && sd.wacc!==null && sd.roimp < sd.wacc)
    cita = '"No es mala empresa, es mala entrada." — Señales v3.0';

  return { puntos:pts, totalCumple, totalNo, totalFalta, pct, conclusion, cita,
    sd, grupos:[...new Set(pts.map(p => p.grupo))] };
}

// ── RENDER SEÑALES — llama al dashboard original de Señales v3.0 ─────────────
function megaRenderSenales(d, containerId) {
  // 1) Adaptar claves UPPERCASE del mega-parser → lowercase para el motor de señales
  const adapted = megaAdaptToLower(d);
  const empresa = document.getElementById('inp-empresa')?.value?.trim() || adapted.empresa || 'Empresa';
  adapted.empresa = empresa;

  // 2) Fusionar cualitativos de _qualState (botones toggle del formulario)
  if (typeof _qualState !== 'undefined') {
    const QK = {
      BALANCE_SANO:'balance_sano', SALUD_DEBIL:'salud_debil',
      VENTAJA_COMP:'ventaja_competitiva', SECTOR_DETERIORO:'sector_deterioro',
      RE_RATING_EV:'re_rating_ev', SPIN_OFF:'spin_off',
      RECOMPRA:'recompra', VENTA_ACTIVOS:'venta_activos',
    };
    for (const [UK, LK] of Object.entries(QK)) {
      if (adapted[LK] == null && _qualState[UK] != null) adapted[LK] = _qualState[UK];
    }
  }

  // 3) Destruir charts anteriores
  if (typeof destruirCharts === 'function') destruirCharts();

  // 4) Evaluar 29 puntos con el motor original de evaluador.js
  const { puntos, resumen } = evaluarLos29Puntos(adapted);

  // 5) Actualizar encabezado de empresa
  const hdrEl = document.getElementById('dash-empresa-sn');
  if (hdrEl) hdrEl.textContent = empresa;

  // 6) Llamar a las funciones originales del dashboard de Señales v3.0
  renderScoreStrip(adapted, resumen, empresa);
  renderSidebarNav(puntos, resumen);
  renderResumenEjecutivo(adapted, puntos, resumen, empresa, adapted.ticker || '', '');
  renderPuntos(puntos);
  renderResumenFinal(puntos, resumen);
  setTimeout(() => {
    try { renderGraficos(adapted, resumen, empresa); } catch(e) { console.warn('[mega-senales] renderGraficos:', e); }
  }, 80);
}
