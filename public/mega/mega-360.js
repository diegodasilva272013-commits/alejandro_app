// ══════════════════════════════════════════════════════
//  MEGA — Acciones 360 Engine (43 indicadores simplificado)
// ══════════════════════════════════════════════════════

function megaCalc360(d) {
  const ing   = mArr(d,'INGRESOS');
  const ub    = mArr(d,'UTILIDAD_BRUTA');
  const gn    = mArr(d,'GANANCIAS_NETAS');
  const ebit  = mArr(d,'EBIT');
  const ebitda= mArr(d,'EBITDA');
  const ofc   = mArr(d,'OFC');
  const capex = mArr(d,'CAPEX');
  const fcf   = mArr(d,'FCF');
  const roicS = mArr(d,'ROIC');

  const ing25   = mLast(ing);
  const ub25    = mLast(ub);
  const gn25    = mLast(gn);
  const ebit25  = mLast(ebit);
  const ebitda25= mLast(ebitda);
  const ofc25   = mLast(ofc);
  const cap25   = mLast(capex);
  const fcf25   = mLast(fcf);
  const roic25  = mLast(roicS);
  const roic    = roic25 || mNum(d,'ROIC');
  const wacc    = mNum(d,'WACC');
  const roe     = mNum(d,'ROE');
  const roa     = mNum(d,'ROA');
  const ev      = mNum(d,'EV');
  const per     = mNum(d,'PER');
  const peg     = mNum(d,'PEG');
  const dt      = mNum(d,'DEUDA_TOTAL');
  const caja    = mNum(d,'CAJA');
  const ac      = mNum(d,'ACTIVOS_CORRIENTES');
  const pc      = mNum(d,'PASIVOS_CORRIENTES');
  const inv     = mNum(d,'INVENTARIOS');
  const eq25    = mNum(d,'EQUITY') || mLast(mArr(d,'EQUITY'));
  const at      = mNum(d,'ACTIVOS_TOTALES');
  const altman  = mNum(d,'ALTMAN');
  const piotr   = mNum(d,'PIOTROSKI');
  const evEbit  = mNum(d,'EV_EBIT') || (ev && ebit25 ? ev/ebit25 : null);
  const evFcf   = mNum(d,'EV_FCF') || (ev && fcf25 ? ev/fcf25 : null);
  const evEbitda= mNum(d,'EV_EBITDA') || (ev && ebitda25 ? ev/ebitda25 : null);
  const dnEbitda= mNum(d,'DEUDA_NETA_EBITDA');
  const dPat    = mNum(d,'DEUDA_PATRIMONIO') || (dt && eq25 ? dt/eq25*100 : null);
  const icr     = mNum(d,'ICR');
  const cratio  = mNum(d,'CURRENT_RATIO') || (ac && pc ? ac/pc : null);
  const qratio  = mNum(d,'QUICK_RATIO')   || (ac && inv && pc ? (ac-inv)/pc : null);
  const dn      = (dt !== null && caja !== null) ? dt - caja : null;
  const dnEbitdaCalc = dnEbitda || (dn !== null && ebitda25 ? dn/ebitda25 : null);

  // Calcular indicadores con colores
  function ind(id, nombre, bloque, formula, valor, bueno, malo, unidad='') {
    let color, badge;
    if (valor === null) { color='gray'; badge='DATO FALTANTE'; }
    else if (typeof bueno === 'function' && bueno(valor)) { color='green'; badge='EXCELENTE'; }
    else if (typeof malo === 'function' && malo(valor)) { color='red'; badge='ALERTA'; }
    else { color='orange'; badge='MODERADO'; }
    const fmt = valor !== null ? (unidad==='%'?mPct(valor,1):unidad==='x'?mFmt(valor)+'x':mFmtN(valor,1)) : '—';
    return { id, nombre, bloque, formula, valor, fmt, color, badge };
  }

  const indicadores = [
    // BLOQUE I — Crecimiento
    ind('01','Crecimiento de Ingresos %','I','(Ing_n/Ing_0)^(1/n)-1',
      ing.length>=2&&ing[0]?((ing25/ing[0])**(1/(ing.length-1))-1)*100:null, v=>v>10, v=>v<0, '%'),
    ind('02','Crecimiento Utilidad Bruta %','I','UB CAGR',
      ub.length>=2&&ub[0]?((ub25/ub[0])**(1/(ub.length-1))-1)*100:null, v=>v>10, v=>v<0, '%'),
    ind('03','Crecimiento Ganancias Netas %','I','GN CAGR',
      gn.length>=2&&gn[0]?((gn25/gn[0])**(1/(gn.length-1))-1)*100:null, v=>v>10, v=>v<0, '%'),
    // BLOQUE II — Márgenes
    ind('04','Margen Bruto %','II','(UB/Ing)×100',
      ub25&&ing25?(ub25/ing25)*100:null, v=>v>30, v=>v<15, '%'),
    ind('05','Margen EBIT %','II','(EBIT/Ing)×100',
      ebit25&&ing25?(ebit25/ing25)*100:null, v=>v>20, v=>v<5, '%'),
    ind('06','Margen EBITDA %','II','(EBITDA/Ing)×100',
      ebitda25&&ing25?(ebitda25/ing25)*100:null, v=>v>25, v=>v<10, '%'),
    ind('07','Margen Neto %','II','(GN/Ing)×100',
      gn25&&ing25?(gn25/ing25)*100:null, v=>v>15, v=>v<0, '%'),
    // BLOQUE III — FCF
    ind('08','Margen FCF %','III','(FCF/Ing)×100',
      fcf25&&ing25?(fcf25/ing25)*100:null, v=>v>=10&&v<=25, v=>v<0, '%'),
    ind('09','FCF Yield %','III','(FCF/EV)×100',
      fcf25&&ev?(fcf25/ev)*100:null, v=>v>8, v=>v<3, '%'),
    ind('10','OFC/CapEx','III','OFC/CapEx',
      ofc25&&cap25?ofc25/cap25:null, v=>v>2, v=>v<1, 'x'),
    // BLOQUE IV — Retornos
    ind('11','ROIC %','IV','ROIC',
      roic, v=>v>20, v=>v<10, '%'),
    ind('12','ROE %','IV','ROE',
      roe, v=>v>20, v=>v<10, '%'),
    ind('13','ROA %','IV','ROA',
      roa, v=>v>15, v=>v<5, '%'),
    ind('14','Spread ROIC-WACC','IV','ROIC-WACC',
      roic&&wacc?roic-wacc:null, v=>v>5, v=>v<0, '%'),
    // BLOQUE V — Deuda
    ind('15','Deuda Neta/EBITDA','V','DN/EBITDA',
      dnEbitdaCalc, v=>v<=1, v=>v>3, 'x'),
    ind('16','Deuda/Patrimonio %','V','(DT/Equity)×100',
      dPat, v=>v<50, v=>v>100, '%'),
    ind('17','ICR','V','EBIT/Gasto Intereses',
      icr, v=>v>3, v=>v<2, 'x'),
    // BLOQUE VI — Liquidez
    ind('18','Liquidez Corriente','VI','AC/PC',
      cratio, v=>v>1.5, v=>v<1, 'x'),
    ind('19','Liquidez Ácida','VI','(AC-Inv)/PC',
      qratio, v=>v>1, v=>v<0.5, 'x'),
    // BLOQUE VII — Valoración
    ind('20','EV/EBIT','VII','EV/EBIT',
      evEbit, v=>v>=8&&v<=15, v=>v>25||v<0, 'x'),
    ind('21','EV/EBITDA','VII','EV/EBITDA',
      evEbitda, v=>v>=6&&v<=14, v=>v>20, 'x'),
    ind('22','EV/FCF','VII','EV/FCF',
      evFcf, v=>v>=8&&v<=15, v=>v>25||v<6, 'x'),
    ind('23','PER','VII','P/E',
      per, v=>v>=10&&v<=30, v=>v<0||v>40, 'x'),
    ind('24','PEG','VII','PEG',
      peg, v=>v<1, v=>v>=2, 'x'),
    // BLOQUE XX — Scoring
    ind('25','Altman Z-Score','XX','Z-Score',
      altman, v=>v>3, v=>v<1.8),
    ind('26','Piotroski F-Score','XX','F-Score /9',
      piotr, v=>v>=7, v=>v<5),
    ind('27','UB/Activos Totales %','XX','(UB/AT)×100',
      ub25&&at?(ub25/at)*100:null, v=>v>25, v=>v<10, '%'),
  ];

  const counts = { green:0, orange:0, red:0, gray:0 };
  for (const i of indicadores) counts[i.color] = (counts[i.color]||0) + 1;
  const totalCalc = indicadores.length - counts.gray;
  const healthScore = totalCalc > 0 ? Math.round(((counts.green*2)/(totalCalc*2))*100) : 0;

  return { indicadores, counts, healthScore, ing, ub, gn, ebit, ebitda, ofc, capex, fcf, roicS,
    ing25, ub25, gn25, ebit25, ebitda25, ofc25, cap25, fcf25, roic25,
    roe, roa, wacc, roic, ev, per, peg, cratio, qratio, dt, caja, dn, dnEbitdaCalc, dPat, icr };
}

// ── RENDER 360 — llama al Dashboard original de acciones360 ─────────────────
function megaRender360(d, containerId) {
  // 1) Adapt UPPERCASE mega data → lowercase for the 360 engine
  const adapted = megaAdaptToLower(d);
  adapted.empresa = document.getElementById('inp-empresa')?.value?.trim() || adapted.empresa || 'Empresa';

  // Merge qualitative / extra state if available
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

  // 2) Destroy previous 360 charts to avoid canvas reuse error
  if (typeof Charts360 !== 'undefined') Charts360.destroyAll();

  // 3) Calculate all 43 indicators using the original engine
  const results = IndicatorEngine.calcAll(adapted);
  const summary = IndicatorEngine.getSummary(results);

  // 4) Render into the tab-360 DOM structure (same IDs as acciones360 module)
  Dashboard.render(adapted, results, summary, adapted.empresa, adapted.ticker || '');

  // 5) Render charts after DOM has been updated by Dashboard (canvas inserted by _chartBlock)
  setTimeout(() => {
    try {
      Charts360.renderG1(adapted, adapted.empresa);
      Charts360.renderG2(adapted, adapted.empresa);
      Charts360.renderG3(results,  adapted.empresa);
      Charts360.renderG4(adapted, adapted.empresa);
      Charts360.renderG5(adapted, adapted.empresa);
      Charts360.renderG6(adapted, adapted.empresa);
      Charts360.renderG7(adapted, adapted.empresa);
      Charts360.renderG8(adapted, adapted.empresa);
      Charts360.renderG9(adapted, adapted.empresa);
    } catch(e) {
      console.warn('[mega-360] Charts360 render error:', e);
    }
  }, 80);
}

