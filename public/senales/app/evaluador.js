// ── evaluador.js — Señales v3.0 — 29 puntos A→AC ─────────────────────────
// Evalúa cada punto y devuelve { resultados[], resumen }

const CUMPLE  = 'CUMPLE';
const NO      = 'NO CUMPLE';
const FALTA   = 'DATO FALTANTE';

function fmt(val, sufijo) {
  if (val === DF || val === null || val === undefined) return 'N/D';
  return Number(val).toLocaleString('es-AR', { maximumFractionDigits: 2 }) + (sufijo || '');
}
function fmtx(val)  { return fmt(val, 'x'); }
function fmtp(val)  { return fmt(val, '%'); }
function ok(v)      { return v !== DF && v !== null && v !== undefined; }
function yesno(val) { if (val === 'si') return 'Sí'; if (val === 'no') return 'No'; return 'N/D'; }

function evaluarLos29Puntos(d) {
  const pts = [];

  // ── A — Regla de Oro: ROIC vs WACC ────────────────────────────────────
  pts.push((() => {
    const res = (!ok(d.roic) || !ok(d.wacc)) ? FALTA : d.roic > d.wacc ? CUMPLE : NO;
    const spread = ok(d.roic) && ok(d.wacc) ? (d.roic - d.wacc).toFixed(2) : null;
    const interp = res === CUMPLE
      ? `ROIC ${fmtp(d.roic)} > WACC ${fmtp(d.wacc)} → Spread de +${spread}pp. La empresa CREA valor por encima del costo de capital.`
      : res === NO
      ? `ROIC ${fmtp(d.roic)} < WACC ${fmtp(d.wacc)} → La empresa destruye valor económico. Diferencia: ${Math.abs(+spread).toFixed(2)}pp.`
      : 'No se puede evaluar la Regla de Oro sin ROIC y WACC.';
    return { letra:'A', titulo:'Regla de Oro: ROIC vs WACC',
      datosReq:'ROIC, WACC', datosRec:`ROIC: ${fmtp(d.roic)} | WACC: ${fmtp(d.wacc)}`,
      resultado: res, interpretacion: interp, grupo:'Rentabilidad' };
  })());

  // ── B — ROE y ROA ──────────────────────────────────────────────────────
  pts.push((() => {
    const res = (!ok(d.roe) || !ok(d.roa)) ? FALTA : (d.roe > 15 && d.roa > 10) ? CUMPLE : NO;
    const interp = res === CUMPLE
      ? `ROE ${fmtp(d.roe)} > 15% y ROA ${fmtp(d.roa)} > 10% → Empresa eficiente en uso de capital propio y activos.`
      : res === NO
      ? `ROE ${fmtp(d.roe)} / ROA ${fmtp(d.roa)} — No superan los umbrales de referencia (ROE>15%, ROA>10%).`
      : 'Requiere ROE y ROA.';
    return { letra:'B', titulo:'ROE y ROA — Eficiencia operativa real',
      datosReq:'ROE, ROA', datosRec:`ROE: ${fmtp(d.roe)} | ROA: ${fmtp(d.roa)}`,
      resultado: res, interpretacion: interp, grupo:'Rentabilidad' };
  })());

  // ── C — Margen Bruto ───────────────────────────────────────────────────
  pts.push((() => {
    const res = !ok(d.margen_bruto) ? FALTA : d.margen_bruto >= 40 ? CUMPLE : NO;
    const interp = res === CUMPLE
      ? `Margen Bruto ${fmtp(d.margen_bruto)} ≥ 40% → Indica pricing power y/o estructura de costos eficiente.`
      : res === NO
      ? `Margen Bruto ${fmtp(d.margen_bruto)} < 40% → Estructura de costos presionada o sector de bajo margen.`
      : 'Requiere Margen Bruto.';
    return { letra:'C', titulo:'Margen Bruto — Pricing power',
      datosReq:'Margen Bruto', datosRec:`Margen Bruto: ${fmtp(d.margen_bruto)}`,
      resultado: res, interpretacion: interp, grupo:'Márgenes' };
  })());

  // ── D — Margen Neto ────────────────────────────────────────────────────
  pts.push((() => {
    const res = !ok(d.margen_neto) ? FALTA : d.margen_neto >= 20 ? CUMPLE : NO;
    const interp = res === CUMPLE
      ? `Margen Neto ${fmtp(d.margen_neto)} ≥ 20% → Alta rentabilidad neta después de impuestos e intereses.`
      : res === NO
      ? `Margen Neto ${fmtp(d.margen_neto)} < 20% → Margen insuficiente según el criterio de referencia.`
      : 'Requiere Margen Neto.';
    return { letra:'D', titulo:'Margen Neto — Rentabilidad final',
      datosReq:'Margen Neto', datosRec:`Margen Neto: ${fmtp(d.margen_neto)}`,
      resultado: res, interpretacion: interp, grupo:'Márgenes' };
  })());

  // ── E — Margen EBITDA ──────────────────────────────────────────────────
  pts.push((() => {
    const res = !ok(d.margen_ebitda) ? FALTA : d.margen_ebitda >= 25 ? CUMPLE : NO;
    const interp = res === CUMPLE
      ? `Margen EBITDA ${fmtp(d.margen_ebitda)} ≥ 25% → Generación de caja operativa robusta.`
      : res === NO
      ? `Margen EBITDA ${fmtp(d.margen_ebitda)} < 25% → Generación de caja operativa por debajo del umbral.`
      : 'Requiere Margen EBITDA.';
    return { letra:'E', titulo:'Margen EBITDA — Generación de caja operativa',
      datosReq:'Margen EBITDA', datosRec:`Margen EBITDA: ${fmtp(d.margen_ebitda)}`,
      resultado: res, interpretacion: interp, grupo:'Márgenes' };
  })());

  // ── F — Margen EBIT ────────────────────────────────────────────────────
  pts.push((() => {
    const res = !ok(d.margen_ebit) ? FALTA : d.margen_ebit >= 15 ? CUMPLE : NO;
    const interp = res === CUMPLE
      ? `Margen EBIT ${fmtp(d.margen_ebit)} ≥ 15% → Rentabilidad operativa sólida antes de intereses e impuestos.`
      : res === NO
      ? `Margen EBIT ${fmtp(d.margen_ebit)} < 15% → Rentabilidad operativa por debajo del criterio.`
      : 'Requiere Margen EBIT.';
    return { letra:'F', titulo:'Margen EBIT — Rentabilidad operativa',
      datosReq:'Margen EBIT', datosRec:`Margen EBIT: ${fmtp(d.margen_ebit)}`,
      resultado: res, interpretacion: interp, grupo:'Márgenes' };
  })());

  // ── G — FCF Yield ──────────────────────────────────────────────────────
  pts.push((() => {
    const res = !ok(d.fcf_yield) ? FALTA : d.fcf_yield >= 4 ? CUMPLE : NO;
    const interp = res === CUMPLE
      ? `FCF Yield ${fmtp(d.fcf_yield)} ≥ 4% → Empresa genera suficiente caja libre para el inversor.`
      : res === NO
      ? `FCF Yield ${fmtp(d.fcf_yield)} < 4% → Generación de caja libre baja para el precio actual.`
      : 'Requiere FCF Yield.';
    return { letra:'G', titulo:'FCF Yield — Rendimiento de caja libre',
      datosReq:'FCF Yield', datosRec:`FCF Yield: ${fmtp(d.fcf_yield)}`,
      resultado: res, interpretacion: interp, grupo:'FCF' };
  })());

  // ── H — Margen FCF Apalancado ─────────────────────────────────────────
  pts.push((() => {
    const res = !ok(d.fcf_margen_apal) ? FALTA : d.fcf_margen_apal >= 15 ? CUMPLE : NO;
    const interp = res === CUMPLE
      ? `Margen FCF apalancado ${fmtp(d.fcf_margen_apal)} ≥ 15% → Conversión eficiente de ingresos en caja.`
      : res === NO
      ? `Margen FCF apalancado ${fmtp(d.fcf_margen_apal)} < 15% → Conversión de ingresos en caja insuficiente.`
      : 'Requiere Margen FCF apalancado.';
    return { letra:'H', titulo:'Margen FCF Apalancado — Conversión de caja',
      datosReq:'Margen FCF apalancado', datosRec:`Margen FCF apal.: ${fmtp(d.fcf_margen_apal)}`,
      resultado: res, interpretacion: interp, grupo:'FCF' };
  })());

  // ── I — PER LTM ────────────────────────────────────────────────────────
  pts.push((() => {
    const res = !ok(d.per_ltm) ? FALTA : (d.per_ltm > 0 && d.per_ltm <= 25) ? CUMPLE : NO;
    const interp = res === CUMPLE
      ? `PER LTM ${fmtx(d.per_ltm)} ≤ 25x → Valoración razonable sobre ganancias históricas.`
      : res === NO
      ? `PER LTM ${fmtx(d.per_ltm)} — Fuera del rango de referencia (0x–25x). ${d.per_ltm < 0 ? 'Ganancias negativas.' : 'Sobrevalorado en base LTM.'}`
      : 'Requiere PER LTM.';
    return { letra:'I', titulo:'PER LTM — Valoración histórica',
      datosReq:'PER LTM', datosRec:`PER LTM: ${fmtx(d.per_ltm)}`,
      resultado: res, interpretacion: interp, grupo:'Valoración' };
  })());

  // ── J — PER Forward ───────────────────────────────────────────────────
  pts.push((() => {
    const res = !ok(d.per_fwd) ? FALTA : (d.per_fwd > 0 && d.per_fwd <= 20) ? CUMPLE : NO;
    const interp = res === CUMPLE
      ? `PER Forward ${fmtx(d.per_fwd)} ≤ 20x → El mercado descuenta crecimiento a precio razonable.`
      : res === NO
      ? `PER Forward ${fmtx(d.per_fwd)} — Por encima del umbral de referencia de 20x.`
      : 'Requiere PER Forward.';
    return { letra:'J', titulo:'PER Forward — Valoración proyectada',
      datosReq:'PER Forward', datosRec:`PER Fwd: ${fmtx(d.per_fwd)}`,
      resultado: res, interpretacion: interp, grupo:'Valoración' };
  })());

  // ── K — PEG Ratio ─────────────────────────────────────────────────────
  pts.push((() => {
    const res = !ok(d.peg) ? FALTA : (d.peg > 0 && d.peg <= 1.5) ? CUMPLE : NO;
    const interp = res === CUMPLE
      ? `PEG ${d.peg?.toFixed(2)} ≤ 1.5 → El crecimiento está bien pagado respecto al precio.`
      : res === NO
      ? `PEG ${d.peg?.toFixed(2)} > 1.5 → Se paga caro por el crecimiento. ${d.peg < 0 ? 'Crecimiento negativo.' : ''}`
      : 'Requiere PEG Ratio.';
    return { letra:'K', titulo:'PEG Ratio — Crecimiento vs. Precio',
      datosReq:'PEG', datosRec:`PEG: ${d.peg !== DF ? d.peg?.toFixed(2) : 'N/D'}`,
      resultado: res, interpretacion: interp, grupo:'Valoración' };
  })());

  // ── L — EV/EBIT ───────────────────────────────────────────────────────
  pts.push((() => {
    const res = !ok(d.ev_ebit) ? FALTA : (d.ev_ebit > 0 && d.ev_ebit <= 20) ? CUMPLE : NO;
    const interp = res === CUMPLE
      ? `EV/EBIT ${fmtx(d.ev_ebit)} ≤ 20x → Empresa razonablemente valorada respecto a su resultado operativo.`
      : res === NO
      ? `EV/EBIT ${fmtx(d.ev_ebit)} > 20x → Alto múltiplo sobre resultado operativo.`
      : 'Requiere EV/EBIT.';
    return { letra:'L', titulo:'EV/EBIT — Múltiplo operativo',
      datosReq:'EV/EBIT', datosRec:`EV/EBIT: ${fmtx(d.ev_ebit)}`,
      resultado: res, interpretacion: interp, grupo:'Valoración' };
  })());

  // ── M — EV/EBITDA ─────────────────────────────────────────────────────
  pts.push((() => {
    const res = !ok(d.ev_ebitda) ? FALTA : (d.ev_ebitda > 0 && d.ev_ebitda <= 15) ? CUMPLE : NO;
    const interp = res === CUMPLE
      ? `EV/EBITDA ${fmtx(d.ev_ebitda)} ≤ 15x → Valoración atractiva o razonable sobre EBITDA.`
      : res === NO
      ? `EV/EBITDA ${fmtx(d.ev_ebitda)} > 15x → Múltiplo elevado.`
      : 'Requiere EV/EBITDA.';
    return { letra:'M', titulo:'EV/EBITDA — Múltiplo de caja operativa',
      datosReq:'EV/EBITDA', datosRec:`EV/EBITDA: ${fmtx(d.ev_ebitda)}`,
      resultado: res, interpretacion: interp, grupo:'Valoración' };
  })());

  // ── N — EV/FCF ────────────────────────────────────────────────────────
  pts.push((() => {
    const res = !ok(d.ev_fcf) ? FALTA : (d.ev_fcf > 0 && d.ev_fcf <= 25) ? CUMPLE : NO;
    const interp = res === CUMPLE
      ? `EV/FCF ${fmtx(d.ev_fcf)} ≤ 25x → La empresa está valorada de forma atractiva sobre su caja libre.`
      : res === NO
      ? `EV/FCF ${fmtx(d.ev_fcf)} > 25x → Se paga mucho por la caja libre generada.`
      : 'Requiere EV/FCF.';
    return { letra:'N', titulo:'EV/FCF — Valoración sobre caja libre',
      datosReq:'EV/FCF', datosRec:`EV/FCF: ${fmtx(d.ev_fcf)}`,
      resultado: res, interpretacion: interp, grupo:'Valoración' };
  })());

  // ── O — ROIMP (Rendimiento Implícito) ─────────────────────────────────
  pts.push((() => {
    const roimp = d.roimp;
    const res = !ok(roimp) || !ok(d.wacc) ? FALTA : roimp >= d.wacc ? CUMPLE : NO;
    const interp = res === CUMPLE
      ? `ROIMP ${fmtp(roimp)} ≥ WACC ${fmtp(d.wacc)} → El precio de mercado implica un retorno ≥ al costo de capital. Entrada atractiva.`
      : res === NO
      ? `ROIMP ${fmtp(roimp)} < WACC ${fmtp(d.wacc)} → el precio no compensa el riesgo. "No es mala empresa, es mala entrada."`
      : 'Requiere EV/EBIT y WACC para calcular ROIMP.';
    return { letra:'O', titulo:'ROIMP — Rendimiento Implícito del mercado',
      datosReq:'EV/EBIT, WACC', datosRec:`ROIMP: ${fmtp(roimp)} | WACC: ${fmtp(d.wacc)}`,
      resultado: res, interpretacion: interp, grupo:'Valoración',
      alerta: res === NO ? 'No es mala empresa, es mala entrada.' : null };
  })());

  // ── P — Deuda / Patrimonio ────────────────────────────────────────────
  pts.push((() => {
    const res = !ok(d.deuda_patrimonio) ? FALTA : d.deuda_patrimonio <= 100 ? CUMPLE : NO;
    const interp = res === CUMPLE
      ? `D/E ${fmtp(d.deuda_patrimonio)} ≤ 100% → Nivel de apalancamiento manejable.`
      : res === NO
      ? `D/E ${fmtp(d.deuda_patrimonio)} > 100% → Alto endeudamiento relativo al equity.`
      : 'Requiere Deuda/Patrimonio.';
    return { letra:'P', titulo:'Deuda/Patrimonio — Apalancamiento',
      datosReq:'Deuda/Patrimonio', datosRec:`D/E: ${fmtp(d.deuda_patrimonio)}`,
      resultado: res, interpretacion: interp, grupo:'Deuda' };
  })());

  // ── Q — Deuda Neta / EBITDA ───────────────────────────────────────────
  pts.push((() => {
    const res = !ok(d.deuda_neta_ebitda) ? FALTA : d.deuda_neta_ebitda <= 2.5 ? CUMPLE : NO;
    const interp = res === CUMPLE
      ? `Deuda Neta/EBITDA ${fmtx(d.deuda_neta_ebitda)} ≤ 2.5x → Carga de deuda razonable respecto a la generación operativa.`
      : res === NO
      ? `Deuda Neta/EBITDA ${fmtx(d.deuda_neta_ebitda)} > 2.5x → Carga de deuda elevada, riesgo financiero presente.`
      : 'Requiere Deuda Neta/EBITDA.';
    return { letra:'Q', titulo:'Deuda Neta/EBITDA — Carga de deuda',
      datosReq:'Deuda Neta/EBITDA', datosRec:`Deuda Neta/EBITDA: ${fmtx(d.deuda_neta_ebitda)}`,
      resultado: res, interpretacion: interp, grupo:'Deuda' };
  })());

  // ── R — Ratio EBIT/EBITDA ─────────────────────────────────────────────
  pts.push((() => {
    const ratio = d.ratio_ebit_ebitda;
    const res = !ok(ratio) ? FALTA : ratio >= 70 ? CUMPLE : NO;
    const interp = res === CUMPLE
      ? `EBIT/EBITDA ${fmtp(ratio)} ≥ 70% → La amortización no erosiona fuertemente el resultado operativo.`
      : res === NO
      ? `EBIT/EBITDA ${fmtp(ratio)} < 70% → Gran parte del EBITDA se consume en depreciación/amortización.`
      : 'Requiere EBIT y EBITDA.';
    return { letra:'R', titulo:'EBIT/EBITDA — Calidad del EBITDA',
      datosReq:'EBIT, EBITDA', datosRec:`EBIT: ${fmtp(ok(d.ebit)?d.ebit:null)} | EBITDA: ${fmtp(ok(d.ebitda)?d.ebitda:null)} | Ratio: ${fmtp(ratio)}`,
      resultado: res, interpretacion: interp, grupo:'Márgenes' };
  })());

  // ── S — CapEx / Ingresos (Margen CapEx) ──────────────────────────────
  pts.push((() => {
    const res = !ok(d.capex_margen) ? FALTA : d.capex_margen <= 10 ? CUMPLE : NO;
    const interp = res === CUMPLE
      ? `Margen CapEx ${fmtp(d.capex_margen)} ≤ 10% → Bajo requerimiento de reinversión; modelo de negocio eficiente en capital.`
      : res === NO
      ? `Margen CapEx ${fmtp(d.capex_margen)} > 10% → Empresa intensiva en capital (capital-intensive).`
      : 'Requiere Margen CapEx.';
    return { letra:'S', titulo:'Margen CapEx — Intensidad de capital',
      datosReq:'Margen CapEx', datosRec:`Margen CapEx: ${fmtp(d.capex_margen)}`,
      resultado: res, interpretacion: interp, grupo:'CapEx' };
  })());

  // ── T — Beneficio Bruto / Activos (Piotroski proxy) ──────────────────
  pts.push((() => {
    const res = !ok(d.benef_bruto_activos) ? FALTA : d.benef_bruto_activos >= 25 ? CUMPLE : NO;
    const interp = res === CUMPLE
      ? `Benef.Bruto/Activos ${fmtp(d.benef_bruto_activos)} ≥ 25% → Alta productividad de los activos (indicador Piotroski).`
      : res === NO
      ? `Benef.Bruto/Activos ${fmtp(d.benef_bruto_activos)} < 25% → Baja productividad de activos relativa.`
      : 'Requiere Beneficio Bruto/Activos.';
    return { letra:'T', titulo:'Benef. Bruto/Activos — Productividad activa',
      datosReq:'Benef. Bruto/Activos', datosRec:`Benef.Bruto/Activos: ${fmtp(d.benef_bruto_activos)}`,
      resultado: res, interpretacion: interp, grupo:'CapEx' };
  })());

  // ── U — EPS Growth ────────────────────────────────────────────────────
  pts.push((() => {
    const res = !ok(d.eps_growth) ? FALTA : d.eps_growth >= 10 ? CUMPLE : NO;
    const interp = res === CUMPLE
      ? `EPS Growth ${fmtp(d.eps_growth)} ≥ 10% → Crecimiento de ganancias por acción sólido.`
      : res === NO
      ? `EPS Growth ${fmtp(d.eps_growth)} < 10% → Crecimiento de ganancias por acción insuficiente.`
      : 'Requiere EPS Growth.';
    return { letra:'U', titulo:'EPS Growth — Crecimiento de ganancias',
      datosReq:'EPS Growth', datosRec:`EPS Growth: ${fmtp(d.eps_growth)}`,
      resultado: res, interpretacion: interp, grupo:'Crecimiento' };
  })());

  // ── V — Balance Sano ──────────────────────────────────────────────────
  pts.push((() => {
    const res = d.balance_sano === 'si' ? CUMPLE : d.balance_sano === 'no' ? NO : FALTA;
    const interp = res === CUMPLE
      ? 'Balance calificado como sano/sólido/limpio. Señal fundamental positiva.'
      : res === NO
      ? 'Balance calificado como NO sano. Revisar estructura de activos y pasivos.'
      : 'Dato cualitativo no provisto.';
    return { letra:'V', titulo:'Balance Sano — Calidad estructural',
      datosReq:'Balance sano (Sí/No)', datosRec:`Balance sano: ${yesno(d.balance_sano)}`,
      resultado: res, interpretacion: interp, grupo:'Cualitativos' };
  })());

  // ── W — Salud Estructural Débil ───────────────────────────────────────
  pts.push((() => {
    // CUMPLE si NO tiene salud débil (señal positiva cuando es "No")
    const res = d.salud_debil === 'no' ? CUMPLE : d.salud_debil === 'si' ? NO : FALTA;
    const interp = res === CUMPLE
      ? 'No se detecta salud estructural débil. Positivo.'
      : res === NO
      ? '⚠ Salud estructural identificada como débil. Señal negativa importante.'
      : 'Dato cualitativo no provisto.';
    return { letra:'W', titulo:'Ausencia de Debilidad Estructural',
      datosReq:'Salud estructural débil (Sí/No)', datosRec:`Salud débil: ${yesno(d.salud_debil)}`,
      resultado: res, interpretacion: interp, grupo:'Cualitativos',
      alerta: res === NO ? 'Salud estructural débil confirmada. Riesgo elevado.' : null };
  })());

  // ── X — Ventaja Competitiva ───────────────────────────────────────────
  pts.push((() => {
    const res = d.ventaja_comp === 'si' ? CUMPLE : d.ventaja_comp === 'no' ? NO : FALTA;
    const interp = res === CUMPLE
      ? 'Ventaja competitiva clara (moat) identificada. Protege márgenes a largo plazo.'
      : res === NO
      ? 'Sin ventaja competitiva clara. Mayor exposición a competencia y erosión de márgenes.'
      : 'Dato cualitativo no provisto.';
    return { letra:'X', titulo:'Ventaja Competitiva — Moat',
      datosReq:'Ventaja competitiva (Sí/No)', datosRec:`Ventaja comp.: ${yesno(d.ventaja_comp)}`,
      resultado: res, interpretacion: interp, grupo:'Cualitativos' };
  })());

  // ── Y — Sector en Deterioro ───────────────────────────────────────────
  pts.push((() => {
    // CUMPLE si el sector NO se está deteriorando
    const res = d.sector_deterioro === 'no' ? CUMPLE : d.sector_deterioro === 'si' ? NO : FALTA;
    const interp = res === CUMPLE
      ? 'Sector sin deterioro identificado. Viento de cola favorable.'
      : res === NO
      ? '⚠ Sector en proceso de deterioro. Riesgo sistémico para la empresa.'
      : 'Dato cualitativo no provisto.';
    return { letra:'Y', titulo:'Sector Saludable — Sin deterioro sectorial',
      datosReq:'Sector deteriorándose (Sí/No)', datosRec:`Sector en deterioro: ${yesno(d.sector_deterioro)}`,
      resultado: res, interpretacion: interp, grupo:'Cualitativos',
      alerta: res === NO ? 'Sector en deterioro. Evaluar impacto en proyecciones de largo plazo.' : null };
  })());

  // ── Z — Posible Re-rating EV ──────────────────────────────────────────
  pts.push((() => {
    const res = d.re_rating_ev === 'si' ? CUMPLE : d.re_rating_ev === 'no' ? NO : FALTA;
    const interp = res === CUMPLE
      ? 'Se identifica posibilidad de re-rating positivo del Enterprise Value. Catalizador potencial.'
      : res === NO
      ? 'No se identifica catalizador de re-rating EV en el horizonte.'
      : 'Dato cualitativo no provisto.';
    return { letra:'Z', titulo:'Posible Re-rating de EV — Catalizador',
      datosReq:'Posible re-rating EV (Sí/No)', datosRec:`Re-rating EV: ${yesno(d.re_rating_ev)}`,
      resultado: res, interpretacion: interp, grupo:'Catalizadores' };
  })());

  // ── AA — Spin-off ─────────────────────────────────────────────────────
  pts.push((() => {
    const res = d.spin_off === 'si' ? CUMPLE : d.spin_off === 'no' ? NO : FALTA;
    const interp = res === CUMPLE
      ? 'Spin-off identificado. Históricamente los spin-offs suelen desbloqueado valor oculto.'
      : res === NO
      ? 'No hay spin-off en curso ni planificado.'
      : 'Dato cualitativo no provisto.';
    return { letra:'AA', titulo:'Spin-off — Desbloqueo de valor',
      datosReq:'Spin-off (Sí/No)', datosRec:`Spin-off: ${yesno(d.spin_off)}`,
      resultado: res, interpretacion: interp, grupo:'Catalizadores' };
  })());

  // ── AB — Recompra Agresiva ────────────────────────────────────────────
  pts.push((() => {
    const res = d.recompra === 'si' ? CUMPLE : d.recompra === 'no' ? NO : FALTA;
    const interp = res === CUMPLE
      ? 'Recompra agresiva de acciones activa. Reduce el float y aumenta el EPS per share.'
      : res === NO
      ? 'Sin programa de recompra agresiva. Sin este catalizador de EPS.'
      : 'Dato cualitativo no provisto.';
    return { letra:'AB', titulo:'Recompra Agresiva — Reducción de float',
      datosReq:'Recompra agresiva (Sí/No)', datosRec:`Recompra: ${yesno(d.recompra)}`,
      resultado: res, interpretacion: interp, grupo:'Catalizadores' };
  })());

  // ── AC — Venta de Activos ─────────────────────────────────────────────
  pts.push((() => {
    const res = d.venta_activos === 'si' ? CUMPLE : d.venta_activos === 'no' ? NO : FALTA;
    const interp = res === CUMPLE
      ? 'Proceso de venta de activos identificado. Puede mejorar el balance y reducir deuda.'
      : res === NO
      ? 'Sin venta de activos activa.'
      : 'Dato cualitativo no provisto.';
    return { letra:'AC', titulo:'Venta de Activos — Desapalancamiento',
      datosReq:'Venta de activos (Sí/No)', datosRec:`Venta activos: ${yesno(d.venta_activos)}`,
      resultado: res, interpretacion: interp, grupo:'Catalizadores' };
  })());

  // ── Resumen ──────────────────────────────────────────────────────────
  const totalCumple   = pts.filter(p => p.resultado === CUMPLE).length;
  const totalNo       = pts.filter(p => p.resultado === NO).length;
  const totalFaltante = pts.filter(p => p.resultado === FALTA).length;
  const alertas       = pts.filter(p => p.alerta);

  // Conclusión basada en resultados
  let conclusion = '';
  const pct = pts.length > 0 ? Math.round((totalCumple / pts.length) * 100) : 0;
  if (pct >= 70) conclusion = `Empresa con fundamentos sólidos: ${totalCumple} de ${pts.length} puntos CUMPLEN (${pct}%). Perfil de inversión favorable según Señales v3.0.`;
  else if (pct >= 50) conclusion = `Empresa con fundamentos mixtos: ${totalCumple} de ${pts.length} puntos CUMPLEN (${pct}%). Existen señales positivas pero también áreas de mejora.`;
  else conclusion = `Empresa con fundamentos débiles: solo ${totalCumple} de ${pts.length} puntos CUMPLEN (${pct}%). Cautela recomendada.`;

  // Cita Señales v3.0 si aplica
  let cita = null;
  if (ok(d.roimp) && ok(d.wacc) && d.roimp < d.wacc) {
    cita = '"No es mala empresa, es mala entrada." — Señales v3.0';
  }

  return {
    puntos: pts,
    resumen: { totalCumple, totalNo, totalFaltante, alertas, conclusion, cita, total: pts.length }
  };
}
