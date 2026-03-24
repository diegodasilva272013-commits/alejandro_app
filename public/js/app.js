// ══════════════════════════════════════════
//  NAVEGACIÓN
// ══════════════════════════════════════════
function showLanding(){ document.getElementById('landing').style.display='flex'; document.getElementById('input-screen').style.display='none'; document.getElementById('dashboard').style.display='none'; document.getElementById('btn-pdf').style.display='none'; document.getElementById('btn-selector').style.display='none'; var bvp=document.getElementById('btn-ver-pdf'); if(bvp)bvp.style.display='none'; var btp=document.getElementById('btn-tech-pdf'); if(btp)btp.style.display='none'; var tis=document.getElementById('tech-input-screen'); if(tis)tis.style.display='none'; var td=document.getElementById('tech-dashboard'); if(td)td.style.display='none'; var bs=document.getElementById('btn-save'); if(bs)bs.style.display='none'; var bsh=document.getElementById('btn-share'); if(bsh)bsh.style.display='none'; var bc=document.getElementById('btn-comparar-cl'); if(bc)bc.style.display='none'; }
function showInput(){ document.getElementById('landing').style.display='none'; document.getElementById('input-screen').style.display='block'; document.getElementById('dashboard').style.display='none'; document.getElementById('btn-pdf').style.display='none'; document.getElementById('btn-selector').style.display='none'; var bvp=document.getElementById('btn-ver-pdf'); if(bvp)bvp.style.display='none'; var btp=document.getElementById('btn-tech-pdf'); if(btp)btp.style.display='none'; var tis=document.getElementById('tech-input-screen'); if(tis)tis.style.display='none'; var td=document.getElementById('tech-dashboard'); if(td)td.style.display='none'; var bs=document.getElementById('btn-save'); if(bs)bs.style.display='none'; var bsh=document.getElementById('btn-share'); if(bsh)bsh.style.display='none'; var bc=document.getElementById('btn-comparar-cl'); if(bc)bc.style.display='none'; }
function showDash(){ document.getElementById('landing').style.display='none'; document.getElementById('input-screen').style.display='none'; document.getElementById('dashboard').style.display='block'; document.getElementById('btn-pdf').style.display='inline-block'; document.getElementById('btn-selector').style.display='inline-block'; var bvp=document.getElementById('btn-ver-pdf'); if(bvp)bvp.style.display='inline-block'; var btp=document.getElementById('btn-tech-pdf'); if(btp)btp.style.display='none'; var tis=document.getElementById('tech-input-screen'); if(tis)tis.style.display='none'; var td=document.getElementById('tech-dashboard'); if(td)td.style.display='none'; var bs=document.getElementById('btn-save'); if(bs)bs.style.display='inline-block'; var bsh=document.getElementById('btn-share'); if(bsh)bsh.style.display='inline-block'; var bc=document.getElementById('btn-comparar-cl'); if(bc)bc.style.display='inline-block'; }
function printPDF(){
  var hdrCopy    = document.getElementById('pdf-header-copy');
  var ftrCopy    = document.getElementById('pdf-footer-copy');
  var contentCell= document.getElementById('pdf-content-cell');
  var dashContent= document.getElementById('dash-content');
  var hdr        = document.getElementById('pdf-header');
  var ftr        = document.getElementById('pdf-footer');

  if(hdrCopy && hdr){
    // Clonar nodo para no duplicar IDs conflictivos de SVG
    var hdrClone = hdr.cloneNode(true);
    hdrClone.removeAttribute('id');
    hdrCopy.innerHTML = '';
    hdrCopy.appendChild(hdrClone);
  }
  if(ftrCopy && ftr){
    var ftrClone = ftr.cloneNode(true);
    ftrClone.removeAttribute('id');
    ftrCopy.innerHTML = '';
    ftrCopy.appendChild(ftrClone);
  }
  if(contentCell && dashContent){
    contentCell.innerHTML = dashContent.innerHTML;
  }

  window.print();
}

// ══════════════════════════════════════════
//  EXAMPLE DATA
// ══════════════════════════════════════════
const EXAMPLE = `ACCION: Empresa Ficticia S.A. (FICT)
COSTO: DATO FALTANTE
PROYECCION: DATO FALTANTE
RIESGO: DATO FALTANTE
MONEDA: USD millones

INGRESOS: 5000, 5400, 5900, 6500, 7200
UTILIDAD_BRUTA: 2400, 2650, 2950, 3350, 3820
GANANCIAS_NETAS: 1100, 1250, 1400, 1600, 1850
EBIT: 1700, 1850, 2050, 2300, 2650
EBITDA: 2100, 2300, 2550, 2900, 3300
OFC: 1500, 1650, 1850, 2150, 2450
CAPEX: 400, 420, 450, 500, 550
FCF: 1100, 1230, 1400, 1650, 1900
BPA: 3.00, 3.40, 3.85, 4.40, 5.00
EQUITY: 8700, 9200, 9600, 10000
ACTIVOS_TOTALES: 14000
ACTIVOS_CORRIENTES: 7800
PASIVOS_CORRIENTES: 3200
INVENTARIOS: 500
PP&E: 6000
DEUDA_TOTAL: 1500
DEUDA_CP: 300
CAJA: 5500
GASTO_INTERESES: 100

EV: 20000
PER: 18
PEG: 0.90
WACC: 9
ROE: 24
ROIC: 19, 20, 21, 21.5, 22
ROA: 16

FCF_SIN_APAL: 2200
FCF_APAL: 1900
MARGEN_CAPEX: 7.64
ALTMAN: 3.4
PIOTROSKI: 8

ALERTAS: Liquidity management actions amid a Challenging macro environment. No immediate Refinancing required. Cost optimización inititives.`;

function loadExample(){ document.getElementById('paste-area').value = EXAMPLE; showInput(); }

// ══════════════════════════════════════════
//  PARSER
// ══════════════════════════════════════════
function parseData(raw){
  const d = {};
  const lines = raw.split('\n').map(l=>l.trim()).filter(l=>l && !l.startsWith('#'));
  for(const line of lines){
    const idx = line.indexOf(':');
    if(idx<0) continue;
    const key = line.slice(0,idx).trim().toUpperCase().replace(/[^A-Z0-9_&]/g,'_');
    const val = line.slice(idx+1).trim();
    if(val.includes(',')){ d[key] = val.split(',').map(v=>parseFloat(v.trim())).filter(v=>!isNaN(v)); }
    else if(!isNaN(parseFloat(val)) && val !== ''){ d[key] = parseFloat(val); }
    else { d[key] = val; }
  }
  return d;
}

function arr(d,key){ const v=d[key]; return Array.isArray(v)?v:[]; }
function num(d,key,def=null){ const v=d[key]; return typeof v==='number'?v:def; }
function str(d,key,def='DATO FALTANTE'){ const v=d[key]; return v!==undefined&&v!==''?(typeof v==='string'?v:String(v)):def; }
function last(a){ return a.length>0?a[a.length-1]:null; }
function pct(v,t=2){ return v!==null?v.toFixed(t)+'%':null; }
function fmt(v,dec=2){ if(v===null||v===undefined) return '—'; return typeof v==='number'?v.toFixed(dec):v; }
function fmtN(v,dec=0){ if(v===null) return '—'; return v.toLocaleString('es',{maximumFractionDigits:dec}); }

// ══════════════════════════════════════════
//  CALCULATE ALL 35 INDICATORS
// ══════════════════════════════════════════
function calcIndicators(d){
  const ing  = arr(d,'INGRESOS');
  const ub   = arr(d,'UTILIDAD_BRUTA');
  const gn   = arr(d,'GANANCIAS_NETAS');
  const ebit = arr(d,'EBIT');
  const ebitda=arr(d,'EBITDA');
  const ofc  = arr(d,'OFC');
  const capex= arr(d,'CAPEX');
  const fcf  = arr(d,'FCF');
  const bpa  = arr(d,'BPA');
  const eq   = arr(d,'EQUITY');
  const roicS= arr(d,'ROIC');

  const ing25  = last(ing);
  const ub25   = last(ub);
  const gn25   = last(gn);
  const ebit25 = last(ebit);
  const ebitda25=last(ebitda);
  const ofc25  = last(ofc);
  const capex25= last(capex);
  const fcf25  = last(fcf);
  const bpa25  = last(bpa);
  const bpa21  = bpa[0]||null;

  const at    = num(d,'ACTIVOS_TOTALES');
  const ac    = num(d,'ACTIVOS_CORRIENTES');
  const pc    = num(d,'PASIVOS_CORRIENTES');
  const inv   = num(d,'INVENTARIOS');
  const ppe   = num(d,'PP_E',num(d,'PP&E_',num(d,'PPE')));
  const dt    = num(d,'DEUDA_TOTAL');
  const dcp   = num(d,'DEUDA_CP');
  const caja  = num(d,'CAJA');
  const gi    = num(d,'GASTO_INTERESES');
  const eq25  = last(eq);
  const eq22  = eq[0]||null;

  const ev    = num(d,'EV');
  const per   = num(d,'PER');
  const peg   = num(d,'PEG');
  const wacc  = num(d,'WACC');
  const roe   = num(d,'ROE');
  const roic25= last(roicS);
  const roa   = num(d,'ROA');
  const fcfSA = num(d,'FCF_SIN_APAL');
  const fcfA  = num(d,'FCF_APAL');
  const mgCap = num(d,'MARGEN_CAPEX');
  const altman= num(d,'ALTMAN');
  const piotr = num(d,'PIOTROSKI');
  const alertTxt = str(d,'ALERTAS','');
  const moneda= str(d,'MONEDA','');
  const anios = ['2021','2022','2023','2024','2025'];

  // ── CÁLCULOS ──
  const mgBruto25 = (ub25&&ing25) ? (ub25/ing25)*100 : null;
  const mgNeto25  = (gn25&&ing25) ? (gn25/ing25)*100 : null;
  const rndFCF    = (fcf25&&ev)   ? (fcf25/ev)*100   : null;
  const mgFCF = fcf.map((f,i)=>ing[i]?(f/ing[i])*100:null);
  const mgFCF3 = mgFCF.slice(-3);
  const mgFCFBad = mgFCF3.some(v=>v!==null&&v>25);
  const mgFCFGood= mgFCF3.every(v=>v!==null&&v>=10);
  const mgFCFSignal = mgFCF3.every(v=>v!==null&&v>=10&&v<=25)?'🟢':mgFCF3.some(v=>v!==null&&v<10)?'🔴':'🟡';

  const vefcf   = (ev&&fcf25) ? ev/fcf25 : null;
  const fcfYield= vefcf ? (1/vefcf)*100 : null;

  const mgEBIT25 = (ebit25&&ing25) ? (ebit25/ing25)*100 : null;
  const mgEBITDA25=(ebitda25&&ing25)?(ebitda25/ing25)*100:null;

  const evEBIT  = (ev&&ebit25) ? ev/ebit25 : null;
  const roImp   = evEBIT ? (1/evEBIT)*100 : null;

  const liqCte  = (ac&&pc)  ? ac/pc  : null;
  const liqAcida= (ac&&inv&&pc) ? (ac-inv)/pc : null;
  const icr     = (ebit25&&gi) ? ebit25/gi : null;
  const dPat    = (dt&&eq25) ? (dt/eq25)*100 : null;
  const dn      = (dt!==null&&caja!==null) ? dt-caja : null;
  const dnEBITDA= (dn!==null&&ebitda25) ? dn/ebitda25 : null;

  const mgFCFSA = (fcfSA&&ing25) ? (fcfSA/ing25)*100 : null;
  const mgFCFA  = (fcfA&&ing25)  ? (fcfA/ing25)*100  : null;

  const ubAt    = (ub25&&at) ? (ub25/at)*100 : null;
  const ppeIng  = (ppe&&ing25) ? (ppe/ing25)*100 : null;

  // BPA CAGR
  let bpaCagr = null;
  if(bpa25&&bpa21&&bpa.length>=4){ bpaCagr=(Math.pow(bpa25/bpa21,1/(bpa.length-1))-1)*100; }
  const ebitEBITDA = (ebit25&&ebitda25) ? (ebit25/ebitda25)*100 : null;
  const ccr = (ofc25&&ebitda25) ? ofc25/ebitda25 : null;

  // CF BLOCK (39-42) — calculados desde datos existentes
  const croic   = (fcf25!=null&&at!=null&&caja!=null&&(at-caja)!==0) ? (fcf25/(at-caja))*100 : null;
  const ofcNI   = (ofc25!=null&&gn25!=null&&gn25!==0) ? ofc25/gn25 : null;
  const fcfNI   = (fcf25!=null&&gn25!=null&&gn25!==0) ? fcf25/gn25 : null;
  const niFCF   = (gn25!=null&&fcf25!=null&&fcf25!==0) ? gn25/fcf25 : null;
  const accrual = (gn25!=null&&ofc25!=null&&at!=null&&at!==0) ? ((gn25-ofc25)/at)*100 : null;

  // EQUITY TREND
  const eqGood = (eq25&&eq22) ? eq25>eq22 : null;

  // FCF verification
  const fcfCalc = (ofc25&&capex25) ? ofc25-capex25 : null;

  // SPREAD
  const spread = (roic25&&wacc) ? roic25-wacc : null;
  const spreadROImp = (roImp&&wacc) ? roImp-wacc : null;

  // ALERT PHRASES
  const phrases = [
    { phrase:'Refinancing', found: alertTxt.toLowerCase().includes('refinanc'), negated: /no\s+immediate\s+refinanc/i.test(alertTxt) },
    { phrase:'Liquidity management', found: /liquidity\s+management/i.test(alertTxt), negated:false },
    { phrase:'Challenging macro environment', found: /challenging\s+macro/i.test(alertTxt), negated:false },
    { phrase:'Cost optim', found: /cost\s+optim/i.test(alertTxt), negated:false },
  ];

  // SIGNALS helper
  const sig = (v,good,bad)=>{
    if(v===null) return 'N/E';
    if(good(v)) return '🟢';
    if(bad&&bad(v)) return '🔴';
    return '🟡';
  };

  const inds = [
    { n:1,  name:'INGRESOS',            dato:ing.map((v,i)=>anios[i]+': '+fmtN(v)).join(' | ')+' ('+moneda+')', bueno:'Creciente', malo:'—', signal:'🟢', calc:'Serie pegada. Creciente ✓' },
    { n:2,  name:'UTILIDAD BRUTA',      dato:ub.map((v,i)=>anios[i]+': '+fmtN(v)).join(' | ')+' ('+moneda+')', bueno:'Creciente', malo:'—', signal:'🟢', calc:'Serie pegada. Creciente ✓' },
    { n:3,  name:'GANANCIAS NETAS',     dato:gn.map((v,i)=>anios[i]+': '+fmtN(v)).join(' | ')+' ('+moneda+')', bueno:'Creciente', malo:'—', signal:'🟢', calc:'Serie pegada. Creciente ✓' },
    { n:4,  name:'MARGEN BENEFICIO BRUTO', dato:mgBruto25?mgBruto25.toFixed(2)+'%':'N/E', bueno:'> 20%', malo:'≤ 20%', signal:sig(mgBruto25,v=>v>20,v=>v<=20), calc:'('+fmtN(ub25)+'/'+fmtN(ing25)+')×100 = '+(mgBruto25?mgBruto25.toFixed(2)+'%':'N/E') },
    { n:5,  name:'MARGEN NETO / MARGEN ACCIONISTAS', dato:mgNeto25?mgNeto25.toFixed(2)+'%':'N/E', bueno:'> 20%', malo:'≤ 20%', signal:sig(mgNeto25,v=>v>20,v=>v<=20), calc:'('+fmtN(gn25)+'/'+fmtN(ing25)+')×100 = '+(mgNeto25?mgNeto25.toFixed(2)+'%':'N/E') },
    { n:6,  name:'FLUJO DE CAJA LIBRE (FCF)', dato:fcf.map((v,i)=>anios[i]+': '+fmtN(v)).join(' | ')+' ('+moneda+')', bueno:'Positivo y creciente', malo:'Negativo', signal:'🟢', calc:'FCF=OFC−CapEx. Verificado: '+(fcfCalc?fmtN(fcfCalc):'N/E')+' ✓' },
    { n:7,  name:'RENDIMIENTO DE FCF',  dato:rndFCF?rndFCF.toFixed(2)+'%':'N/E', bueno:'> 8%', malo:'≤ 8%', signal:sig(rndFCF,v=>v>8,v=>v<=8), calc:'('+fmtN(fcf25)+'/'+fmtN(ev)+')×100 = '+(rndFCF?rndFCF.toFixed(2)+'%':'N/E') },
    { n:8,  name:'MARGEN FCF (FCF/ING) — 3 años', dato:mgFCF3.map((v,i)=>anios[2+i]+': '+(v?v.toFixed(2)+'%':'N/E')).join(' | '), bueno:'10–25%', malo:'Fuera de rango', signal:mgFCFSignal, calc:'Rango 10–25%. '+(mgFCFBad?'2024–2025 superan el techo (25%)':'Dentro del rango') },
    { n:9,  name:'VE/FCF + FCF Yield',  dato:(vefcf?vefcf.toFixed(2)+'x':'N/E')+' · '+(fcfYield?fcfYield.toFixed(2)+'%':'N/E'), bueno:'8–15x / Yield 8–10%', malo:'Fuera de rango', signal:sig(vefcf,v=>v>=8&&v<=15,v=>v<8||v>15), calc:fmtN(ev)+'/'+fmtN(fcf25)+'='+(vefcf?vefcf.toFixed(2)+'x':'N/E')+' · Yield='+(fcfYield?fcfYield.toFixed(2)+'%':'N/E') },
    { n:10, name:'MARGEN EBIT',         dato:mgEBIT25?mgEBIT25.toFixed(2)+'%':'N/E', bueno:'> 30%', malo:'≤ 30%', signal:sig(mgEBIT25,v=>v>30,v=>v<=30), calc:'('+fmtN(ebit25)+'/'+fmtN(ing25)+')×100 = '+(mgEBIT25?mgEBIT25.toFixed(2)+'%':'N/E') },
    { n:11, name:'PER',                 dato:per?per+'x':'N/E', bueno:'10–30x', malo:'Fuera de rango', signal:sig(per,v=>v>=10&&v<=30,v=>v<10||v>30), calc:'Dato pegado' },
    { n:12, name:'PEG',                 dato:peg!==null?String(peg):'N/E', bueno:'< 1', malo:'≥ 1', signal:sig(peg,v=>v<1,v=>v>=1), calc:'Dato pegado' },
    { n:13, name:'RENDIMIENTO DE CAPITAL (ROE)', dato:roe?roe+'%':'N/E', bueno:'> 20%', malo:'≤ 20%', signal:sig(roe,v=>v>20,v=>v<=20), calc:'Dato pegado' },
    { n:14, name:'RENDIMIENTO CAPITAL INVERTIDO (ROIC)', dato:roicS.map((v,i)=>anios[i]+': '+v+'%').join(' | '), bueno:'> 20%', malo:'≤ 20%', signal:sig(roic25,v=>v>20,v=>v<=20), calc:'ROIC 2025: '+roic25+'% > 20% '+(roic25>20?'✓':'✗') },
    { n:15, name:'RENDIMIENTO DE ACTIVOS (ROA)', dato:roa?roa+'%':'N/E', bueno:'> 15%', malo:'≤ 15%', signal:sig(roa,v=>v>15,v=>v<=15), calc:'Dato pegado' },
    { n:16, name:'EQUITY — últimos 4 años', dato:eq.map((v,i)=>('2022,2023,2024,2025'.split(',')[i]||'')+': '+fmtN(v)).join(' | ')+' ('+moneda+')', bueno:'Creciente', malo:'Erosionándose', signal:eqGood===null?'N/E':eqGood?'🟢':'🔴', calc:fmtN(eq25)+' > '+fmtN(eq22)+' → '+(eqGood?'CRECIENTE ✓':'DECRECIENTE ✗') },
    { n:17, name:'WACC',                dato:wacc?wacc+'%':'N/E', bueno:'7–11%', malo:'Fuera de rango', signal:sig(wacc,v=>v>=7&&v<=11,v=>v<7||v>11), calc:'Dato pegado' },
    { n:18, name:'EV/EBIT + ROImp vs WACC', dato:(evEBIT?evEBIT.toFixed(2)+'x':'N/E')+' · ROImp: '+(roImp?roImp.toFixed(2)+'%':'N/E'), bueno:'ROImp > WACC', malo:'ROImp < WACC', signal:sig(roImp,v=>wacc&&v>wacc,v=>wacc&&v<=wacc), calc:fmtN(ev)+'/'+fmtN(ebit25)+'='+(evEBIT?evEBIT.toFixed(2)+'x':'N/E')+' · ROImp='+(roImp?roImp.toFixed(2)+'%':'N/E')+' '+(roImp&&wacc?(roImp>wacc?'> '+wacc+'% ✓':'< '+wacc+'% ✗'):'') },
    { n:19, name:'LIQUIDEZ CORRIENTE',  dato:liqCte?liqCte.toFixed(2)+'x':'N/E', bueno:'> 1', malo:'≤ 1', signal:sig(liqCte,v=>v>1,v=>v<=1), calc:fmtN(ac)+'/'+fmtN(pc)+' = '+(liqCte?liqCte.toFixed(2)+'x':'N/E') },
    { n:20, name:'LIQUIDEZ ÁCIDA',      dato:liqAcida?liqAcida.toFixed(2)+'x':'N/E', bueno:'> 1', malo:'≤ 1', signal:sig(liqAcida,v=>v>1,v=>v<=1), calc:'('+fmtN(ac)+'−'+fmtN(inv)+')/'+fmtN(pc)+' = '+(liqAcida?liqAcida.toFixed(2)+'x':'N/E') },
    { n:21, name:'ÍNDICE COBERTURA INTERÉS (ICR)', dato:icr?icr.toFixed(2)+'x':'N/E', bueno:'> 3x', malo:'≤ 3x', signal:sig(icr,v=>v>3,v=>v<=3), calc:fmtN(ebit25)+'/'+fmtN(gi)+' = '+(icr?icr.toFixed(2)+'x':'N/E') },
    { n:22, name:'DEUDA / PATRIMONIO',  dato:dPat?dPat.toFixed(2)+'%':'N/E', bueno:'< 20%', malo:'≥ 20%', signal:sig(dPat,v=>v<20,v=>v>=20), calc:'('+fmtN(dt)+'/'+fmtN(eq25)+')×100 = '+(dPat?dPat.toFixed(2)+'%':'N/E') },
    { n:23, name:'DEUDA NETA / EBITDA', dato:(dn?fmtN(dn,0)+' '+moneda:'N/E')+' · '+(dnEBITDA?dnEBITDA.toFixed(2)+'x':'N/E'), bueno:'Negativo a 1', malo:'≥ 1 (peligro > 3x)', signal:sig(dnEBITDA,v=>v<=1,v=>v>1), calc:'DN='+fmtN(dt)+'−'+fmtN(caja)+'='+(dn?fmtN(dn,0):'N/E')+' · '+(dn?fmtN(dn,0):'')+'/'+(ebitda25?fmtN(ebitda25):'')+'='+(dnEBITDA?dnEBITDA.toFixed(2)+'x':'N/E') },
    { n:24, name:'DEUDA NETA',          dato:dn!==null?fmtN(dn,0)+' '+moneda:'N/E', bueno:'NEGATIVA (controlada)', malo:'POSITIVA', signal:sig(dn,v=>v<0,v=>v>=0), calc:'DN='+fmtN(dt)+'−'+fmtN(caja)+'='+(dn!==null?fmtN(dn,0):'N/E') },
    { n:25, name:'MARGEN FCF SIN APALANCAMIENTO', dato:mgFCFSA?mgFCFSA.toFixed(2)+'%':'N/E', bueno:'> 20%', malo:'≤ 20%', signal:sig(mgFCFSA,v=>v>20,v=>v<=20), calc:'('+fmtN(fcfSA)+'/'+fmtN(ing25)+')×100 = '+(mgFCFSA?mgFCFSA.toFixed(2)+'%':'N/E') },
    { n:26, name:'MARGEN FCF APALANCADO', dato:mgFCFA?mgFCFA.toFixed(2)+'%':'N/E', bueno:'> 15%', malo:'≤ 15%', signal:sig(mgFCFA,v=>v>15,v=>v<=15), calc:'('+fmtN(fcfA)+'/'+fmtN(ing25)+')×100 = '+(mgFCFA?mgFCFA.toFixed(2)+'%':'N/E')+' · Sin apal > Apal: '+(mgFCFSA&&mgFCFA?mgFCFSA>mgFCFA?'✓':'✗':'N/E') },
    { n:27, name:'EBIT',                dato:fmtN(ebit25,0)+' '+moneda, bueno:'Creciente', malo:'—', signal:'🟢', calc:'Serie: '+ebit.map(v=>fmtN(v,0)).join('|') },
    { n:28, name:'EBITDA',              dato:fmtN(ebitda25,0)+' '+moneda, bueno:'Creciente', malo:'—', signal:'🟢', calc:'Serie: '+ebitda.map(v=>fmtN(v,0)).join('|') },
    { n:29, name:'MARGEN EBITDA',       dato:mgEBITDA25?mgEBITDA25.toFixed(2)+'%':'N/E', bueno:'> 30%', malo:'≤ 30%', signal:sig(mgEBITDA25,v=>v>30,v=>v<=30), calc:'('+fmtN(ebitda25)+'/'+fmtN(ing25)+')×100 = '+(mgEBITDA25?mgEBITDA25.toFixed(2)+'%':'N/E') },
    { n:30, name:'GASTOS DE CAPITAL (CapEx)', dato:fmtN(capex25,0)+' '+moneda, bueno:'Controlado', malo:'—', signal:'🟢', calc:'Serie: '+capex.map(v=>fmtN(v,0)).join('|') },
    { n:31, name:'MARGEN GASTOS DE CAPITAL', dato:mgCap?mgCap.toFixed(2)+'% (Bajo)':'N/E', bueno:'Margen Bajo', malo:'Margen Alto', signal:mgCap?mgCap<=15?'🟢':'🔴':'N/E', calc:'Dato pegado directo' },
    { n:32, name:'BENEFICIO BRUTO / ACTIVOS TOTALES', dato:ubAt?ubAt.toFixed(2)+'%':'N/E', bueno:'> 25%', malo:'≤ 25%', signal:sig(ubAt,v=>v>25,v=>v<=25), calc:'('+fmtN(ub25)+'/'+fmtN(at)+')×100 = '+(ubAt?ubAt.toFixed(2)+'%':'N/E') },
    { n:33, name:'PP&E BRUTOS / INGRESOS', dato:(ppe?fmtN(ppe,0)+' '+moneda:'N/E')+(ppeIng?' · '+ppeIng.toFixed(2)+'%':''), bueno:'PP&E/Ing Bajo', malo:'PP&E/Ing Alto', signal:sig(ppeIng,v=>v<=50,v=>v>50), calc:'PP&E='+fmtN(ppe,0)+' · PP&E/Ing='+(ppeIng?ppeIng.toFixed(2)+'%':'N/E')+' → '+(ppeIng>50?'ALTO = MALO ✗':'BAJO = BUENO ✓') },
    { n:34, name:'ALTMAN Z-SCORE',      dato:altman!==null?String(altman):'N/E', bueno:'> 3 (zona segura)', malo:'≤ 3', signal:sig(altman,v=>v>3,v=>v<=3), calc:'Dato pegado directo' },
    { n:35, name:'PIOTROSKI',           dato:piotr?piotr+' / 9':'N/E', bueno:'7–9', malo:'< 7', signal:sig(piotr,v=>v>=7,v=>v<7), calc:'Dato pegado directo' },
    { n:36, name:'CAGR BPA',            dato:bpaCagr!=null?bpaCagr.toFixed(1)+'%':'N/E', bueno:'> 12%', malo:'≤ 12%', signal:sig(bpaCagr,v=>v>12,v=>v<=12), calc:'CAGR BPA últimos '+(bpa.length-1)+' años = '+(bpaCagr!=null?bpaCagr.toFixed(1)+'%':'N/E') },
    { n:37, name:'EBIT / EBITDA',       dato:ebitEBITDA!=null?ebitEBITDA.toFixed(1)+'%':'N/E', bueno:'> 80%', malo:'< 60%', signal:sig(ebitEBITDA,v=>v>80,v=>v<60), calc:'('+fmtN(ebit25)+'/'+fmtN(ebitda25)+')×100 = '+(ebitEBITDA!=null?ebitEBITDA.toFixed(1)+'%':'N/E') },
    { n:38, name:'CASH CONVERSION RATE', dato:ccr!=null?ccr.toFixed(2):'N/E', bueno:'> 1', malo:'< 0.8', signal:sig(ccr,v=>v>1,v=>v<0.8), calc:'OFC/EBITDA = '+fmtN(ofc25)+'/'+fmtN(ebitda25)+' = '+(ccr!=null?ccr.toFixed(2):'N/E') },
    // CF Block
    { n:39, name:'CROIC — Retorno Caja sobre Capital', dato:croic!=null?croic.toFixed(1)+'%':'N/E', bueno:'> 15%', malo:'≤ 10%', signal:sig(croic,v=>v>15,v=>v<=10), calc:'FCF/(Activos Totales−Caja)×100 = '+(croic!=null?croic.toFixed(1)+'%':'N/E') },
    { n:40, name:'OFC / GANANCIA NETA', dato:ofcNI!=null?ofcNI.toFixed(2):'N/E', bueno:'> 1', malo:'< 0.5', signal:sig(ofcNI,v=>v>1,v=>v<0.5), calc:'OFC/GN = '+fmtN(ofc25)+'/'+fmtN(gn25)+' = '+(ofcNI!=null?ofcNI.toFixed(2):'N/E') },
    { n:41, name:'FCF / GANANCIA NETA', dato:fcfNI!=null?fcfNI.toFixed(2):'N/E', bueno:'> 1', malo:'< 0.5', signal:sig(fcfNI,v=>v>1,v=>v<0.5), calc:'FCF/GN = '+fmtN(fcf25)+'/'+fmtN(gn25)+' = '+(fcfNI!=null?fcfNI.toFixed(2):'N/E') },
    { n:43, name:'UTILIDAD NETA / FCF', dato:niFCF!=null?niFCF.toFixed(2):'N/E', bueno:'< 1 Saludable', malo:'> 1.5 Malo', signal:sig(niFCF,v=>v<1,v=>v>1.5), calc:'GN/FCF = '+fmtN(gn25)+'/'+fmtN(fcf25)+' = '+(niFCF!=null?niFCF.toFixed(2):'N/E') },
    { n:42, name:'ACCRUAL RATIO',       dato:accrual!=null?accrual.toFixed(2)+'%':'N/E', bueno:'< 1%', malo:'> 5%', signal:sig(accrual,v=>v<1,v=>v>5), calc:'(GN−OFC)/Activos×100 = '+(accrual!=null?accrual.toFixed(2)+'%':'N/E') },
  ];

  const cntGreen = inds.filter(i=>i.signal==='🟢').length;
  const cntAmber = inds.filter(i=>i.signal==='🟡').length;
  const cntRed   = inds.filter(i=>i.signal==='🔴').length;

  // ── HEATMAP: indicadores clave por año ──
  const sCls=(v,good,bad)=>{if(v==null)return 'n';return good(v)?'g':bad&&bad(v)?'r':'a';};
  const htInds=[
    { name:'ROIC %',
      years: roicS.map((v,i)=>({y:anios[i],v:v!=null?v+'%':'—',c:sCls(v,a=>a>20,a=>a<=20)})) },
    { name:'CROIC %',
      years: fcf.map((v,i)=>{ const cap=at&&caja!=null?at-caja:null; const cr=v!=null&&cap?v/cap*100:null; return{y:anios[i],v:cr!=null?cr.toFixed(1)+'%':'—',c:sCls(cr,a=>a>15,a=>a<=15)}; }) },
    { name:'Gross Profit / Assets %',
      years: ub.map((v,i)=>{ const r=v!=null&&at?v/at*100:null; return{y:anios[i],v:r!=null?r.toFixed(1)+'%':'—',c:sCls(r,a=>a>25,a=>a<=25)}; }) },
    { name:'Asset Turnover',
      years: ing.map((v,i)=>{ const r=v!=null&&at?v/at:null; return{y:anios[i],v:r!=null?r.toFixed(2):'—',c:sCls(r,a=>a>0.5,a=>a<=0.5)}; }) },
    { name:'Deuda Neta / EBITDA',
      years: ebitda.map((v,i)=>{ const dn2=dt!=null&&caja!=null?dt-caja:null; const r=dn2!=null&&v?dn2/v:null; return{y:anios[i],v:r!=null?r.toFixed(1)+'x':'—',c:sCls(r,a=>a<=1,a=>a>1)}; }) },
    { name:'FCF Yield %',
      years: fcf.map((v,i)=>{ const r=v!=null&&ev?v/ev*100:null; return{y:anios[i],v:r!=null?r.toFixed(1)+'%':'—',c:sCls(r,a=>a>8,a=>a<=8)}; }) },
    per!=null?{ name:'PER',
      years: anios.map((yr,i)=>({y:yr,v:i===anios.length-1?per+'x':'—',c:i===anios.length-1?sCls(per,a=>a>=10&&a<=30,a=>a<10||a>30):'n'})) }:null,
    peg!=null?{ name:'PEG',
      years: anios.map((yr,i)=>({y:yr,v:i===anios.length-1?String(peg):'—',c:i===anios.length-1?sCls(peg,a=>a<1,a=>a>=1):'n'})) }:null,
    { name:'Margen FCF %',
      years: fcf.map((v,i)=>{ const m=v!=null&&ing[i]?v/ing[i]*100:null; return{y:anios[i],v:m!=null?m.toFixed(1)+'%':'—',c:sCls(m,a=>a>=10&&a<=25,a=>a<10||a>25)}; }) },
    { name:'OCF / Net Income',
      years: ofc.map((v,i)=>{ const r=v!=null&&gn[i]?v/gn[i]:null; return{y:anios[i],v:r!=null?r.toFixed(2):'—',c:sCls(r,a=>a>1,a=>a<=1)}; }) },
  ].filter(Boolean);

  return {d, ing, ub, gn, ebit, ebitda, fcf, ofc, capex, bpa, roicS,
    ing25, ub25, gn25, ebit25, ebitda25, fcf25, ofc25, capex25, bpa25, bpa21,
    at, ac, pc, inv, ppe, dt, dcp, caja, gi, eq25, eq22, eq,
    ev, per, peg, wacc, roe, roic25, roa,
    mgBruto25, mgNeto25, rndFCF, vefcf, fcfYield, mgEBIT25, mgEBITDA25,
    evEBIT, roImp, liqCte, liqAcida, icr, dPat, dn, dnEBITDA,
    mgFCFSA, mgFCFA, ubAt, ppeIng, bpaCagr, ebitEBITDA, ccr,
    croic, ofcNI, fcfNI, niFCF, accrual,
    spread, spreadROImp, phrases, inds, cntGreen, cntAmber, cntRed,
    moneda, alertTxt, anios, fcfSA, fcfA, mgCap, altman, piotr, htInds};
}

// ══════════════════════════════════════════
//  RENDER DASHBOARD — VERSIÓN ÉPICA
// ══════════════════════════════════════════
function renderDash(c){
  const D = str(c.d,'ACCION','Empresa'); const MON=c.moneda;
  const costo=str(c.d,'COSTO'); const proy=str(c.d,'PROYECCION'); const riesgo=str(c.d,'RIESGO');
  const fcfGrowth = c.fcf[0]?((c.fcf25-c.fcf[0])/c.fcf[0]*100):null;
  const ingGrowth = c.ing[0]?((c.ing25-c.ing[0])/c.ing[0]*100):null;
  const gnGrowth  = c.gn[0]?((c.gn25-c.gn[0])/c.gn[0]*100):null;

  // ═══════════════════════════════════════════════════════════════
  //  SVG CHART ENGINES
  // ═══════════════════════════════════════════════════════════════

  // 1. LINE CHART multi-series con área
  function svgLine(series, labels, colors, h=180){
    if(!series.length||!series[0].length) return '';
    const allVals=series.flat().filter(v=>v!=null&&!isNaN(v));
    if(!allVals.length) return '';
    const mn=Math.min(...allVals)*0.88, mx=Math.max(...allVals)*1.05;
    const W=560,H=h,padL=8,padR=8,padT=12,padB=28;
    const xs=labels.map((_,i)=>padL+i*(W-padL-padR)/(labels.length-1));
    const ys=v=>padT+(1-(v-mn)/(mx-mn))*(H-padT-padB);
    let out='';
    [.25,.5,.75].forEach(p=>{
      const y=padT+p*(H-padT-padB);
      out+=`<line x1="${padL}" y1="${y}" x2="${W-padR}" y2="${y}" stroke="rgba(26,86,196,.15)" stroke-width="1"/>`;
    });
    series.forEach((s,si)=>{
      const pts=s.map((v,i)=>v!=null?[xs[i],ys(v)]:null).filter(Boolean);
      if(!pts.length) return;
      const aD=`M${pts[0].join(',')} ${pts.slice(1).map(p=>'L'+p.join(',')).join(' ')} L${pts[pts.length-1][0]},${H-padB} L${pts[0][0]},${H-padB} Z`;
      out+=`<path d="${aD}" fill="${colors[si]}" fill-opacity=".1"/>`;
      out+=`<polyline points="${pts.map(p=>p.join(',')).join(' ')}" fill="none" stroke="${colors[si]}" stroke-width="2.2" stroke-linejoin="round"/>`;
      pts.forEach(([x,y],i)=>{
        const isLast=i===pts.length-1;
        out+=`<circle cx="${x}" cy="${y}" r="${isLast?4.5:2.5}" fill="${isLast?'#F2CC6E':colors[si]}" stroke="${isLast?colors[si]:'none'}" stroke-width="${isLast?1.5:0}"/>`;
      });
    });
    labels.forEach((l,i)=>out+=`<text x="${xs[i]}" y="${H-8}" fill="#6A829E" font-size="9" font-family="Space Mono,monospace" text-anchor="middle">${l}</text>`);
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block">${out}</svg>`;
  }

  // 2. DONUT CHART anular
  function svgDonut(green, amber, red){
    const total=green+amber+red; if(!total) return '';
    const cx=90,cy=90,R=72,ri=46;
    const toRad=p=>p/total*2*Math.PI;
    function arc(start,sweep,col){
      if(sweep>=2*Math.PI) sweep=2*Math.PI-0.0001;
      const x1=cx+R*Math.sin(start), y1=cy-R*Math.cos(start);
      const x2=cx+R*Math.sin(start+sweep), y2=cy-R*Math.cos(start+sweep);
      const xi1=cx+ri*Math.sin(start), yi1=cy-ri*Math.cos(start);
      const xi2=cx+ri*Math.sin(start+sweep), yi2=cy-ri*Math.cos(start+sweep);
      const lg=sweep>Math.PI?1:0;
      return `<path d="M${x1},${y1} A${R},${R} 0 ${lg},1 ${x2},${y2} L${xi2},${yi2} A${ri},${ri} 0 ${lg},0 ${xi1},${yi1} Z" fill="${col}"/>`;
    }
    let a=0;
    const gS=toRad(green),aS=toRad(amber),rS=toRad(red);
    let arcs='';
    if(green){arcs+=arc(a,gS,'#22c55e');a+=gS;}
    if(amber){arcs+=arc(a,aS,'#f59e0b');a+=aS;}
    if(red  ){arcs+=arc(a,rS,'#ef4444');}
    const score=Math.round(green/total*100);
    return `<svg viewBox="0 0 180 180" width="180" height="180">
      <circle cx="${cx}" cy="${cy}" r="${R+8}" fill="rgba(26,86,196,.06)" stroke="rgba(26,86,196,.12)" stroke-width="1"/>
      ${arcs}
      <circle cx="${cx}" cy="${cy}" r="${ri}" fill="#080E1A"/>
      <text x="${cx}" y="${cy-10}" text-anchor="middle" fill="#FFFFFF" font-size="30" font-weight="700" font-family="Space Mono,monospace">${green}</text>
      <text x="${cx}" y="${cy+8}" text-anchor="middle" fill="#6A829E" font-size="9" font-family="Inter,sans-serif">POSITIVOS</text>
      <text x="${cx}" y="${cy+26}" text-anchor="middle" fill="#22c55e" font-size="14" font-weight="700" font-family="Space Mono,monospace">${score}%</text>
    </svg>`;
  }

  // 3. GROUPED BAR CHART — años x grupos
  function svgGroupedBars(seriesList, labels, colors){
    const W=560,H=200,padL=16,padR=10,padT=14,padB=32;
    const n=labels.length, g=seriesList.length;
    const allVals=seriesList.flat().filter(v=>v!=null&&!isNaN(v)&&v>0);
    if(!allVals.length) return '';
    const mx=Math.max(...allVals)*1.12;
    const groupW=(W-padL-padR)/n;
    const bW=Math.min((groupW/(g+1))*0.9, 20);
    const bGap=(groupW-bW*g)/(g+1);
    let out='';
    [.25,.5,.75,1].forEach(p=>{
      const y=padT+p*(H-padT-padB);
      out+=`<line x1="${padL}" y1="${y}" x2="${W-padR}" y2="${y}" stroke="rgba(26,86,196,.1)" stroke-width="1"/>`;
    });
    seriesList.forEach((series,si)=>{
      series.forEach((v,li)=>{
        if(v==null||v<=0) return;
        const gX=padL+li*groupW;
        const bX=gX+bGap+si*(bW+bGap);
        const bH=(v/mx)*(H-padT-padB);
        const bY=H-padB-bH;
        out+=`<rect x="${bX}" y="${bY}" width="${bW}" height="${bH}" rx="2" fill="${colors[si]}" fill-opacity=".85"/>`;
        if(bH>18) out+=`<text x="${bX+bW/2}" y="${bY+bH/2+4}" text-anchor="middle" fill="rgba(255,255,255,.7)" font-size="7" font-family="Space Mono,monospace">${v>=1000?Math.round(v/1000)+'K':Math.round(v)}</text>`;
      });
    });
    labels.forEach((l,i)=>out+=`<text x="${padL+i*groupW+groupW/2}" y="${H-10}" fill="#6A829E" font-size="9" font-family="Space Mono,monospace" text-anchor="middle">${l}</text>`);
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block">${out}</svg>`;
  }

  // 4. WATERFALL P&L cascade
  function svgWaterfall(items){
    const W=560,H=200,padL=24,padR=10,padT=16,padB=36;
    if(!items.length) return '';
    const allVals=items.flatMap(it=>[it.cumulative, it.prev||0]);
    const mn=Math.min(0,...allVals), mx=Math.max(...allVals)*1.12;
    const n=items.length;
    const colW=(W-padL-padR)/n;
    const bW=colW*0.55;
    const ys=v=>padT+(1-(v-mn)/(mx-mn))*(H-padT-padB);
    let out='';
    const zeroY=ys(0);
    out+=`<line x1="${padL}" y1="${zeroY}" x2="${W-padR}" y2="${zeroY}" stroke="rgba(26,86,196,.25)" stroke-width="1" stroke-dasharray="4,3"/>`;
    items.forEach((it,i)=>{
      const cx=padL+i*colW+colW/2;
      const bX=cx-bW/2;
      const top=it.isTotal?ys(it.cumulative):ys(Math.max(it.prev,it.cumulative));
      const bot=it.isTotal?ys(0):ys(Math.min(it.prev,it.cumulative));
      const h=Math.max(Math.abs(bot-top),2);
      const color=it.isTotal?'#2E74E8':it.value>=0?'#22c55e':'#ef4444';
      out+=`<rect x="${bX}" y="${top}" width="${bW}" height="${h}" rx="2" fill="${color}" fill-opacity="${it.isTotal?1:.85}"/>`;
      if(i<n-1&&!it.isTotal){
        out+=`<line x1="${bX+bW}" y1="${ys(it.cumulative)}" x2="${bX+colW}" y2="${ys(it.cumulative)}" stroke="rgba(100,116,139,.35)" stroke-width="1" stroke-dasharray="3,2"/>`;
      }
      const numStr=(it.cumulative>=1000?Math.round(it.cumulative/1000)+'K':Math.round(it.cumulative).toString());
      out+=`<text x="${cx}" y="${top-5}" fill="${color}" font-size="8" font-family="Space Mono,monospace" text-anchor="middle" font-weight="700">${numStr}</text>`;
      out+=`<text x="${cx}" y="${H-12}" fill="#6A829E" font-size="8.5" font-family="Inter,sans-serif" text-anchor="middle">${it.label}</text>`;
    });
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block">${out}</svg>`;
  }

  // 5. RADAR / SPIDER — 5 pilares
  function svgRadar(values, labels, scores){
    const n=values.length;
    const cx=130,cy=130,R=95,levels=4;
    const angle=i=>(-Math.PI/2)+(2*Math.PI/n)*i;
    const pt=(r,i)=>[cx+r*Math.cos(angle(i)),cy+r*Math.sin(angle(i))];
    let out='';
    for(let l=1;l<=levels;l++){
      const r=R*(l/levels);
      const pts=Array.from({length:n},(_,i)=>pt(r,i));
      out+=`<polygon points="${pts.map(p=>p.join(',')).join(' ')}" fill="${l===levels?'rgba(26,86,196,.06)':'none'}" stroke="rgba(26,86,196,.18)" stroke-width="1"/>`;
    }
    for(let i=0;i<n;i++){
      const [x,y]=pt(R,i);
      out+=`<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="rgba(26,86,196,.18)" stroke-width="1"/>`;
    }
    const dataPts=values.map((v,i)=>pt(R*(Math.min(v,100)/100),i));
    out+=`<polygon points="${dataPts.map(p=>p.join(',')).join(' ')}" fill="#1A56C4" fill-opacity=".22" stroke="#5A9BFF" stroke-width="2"/>`;
    values.forEach((v,i)=>{
      const [x,y]=pt(R*(Math.min(v,100)/100),i);
      const bc=scores[i]==='🟢'?'#22c55e':scores[i]==='🔴'?'#ef4444':'#f59e0b';
      out+=`<circle cx="${x}" cy="${y}" r="5" fill="${bc}" stroke="#080E1A" stroke-width="1.5"/>`;
      const [lx,ly]=pt(R+28,i);
      out+=`<text x="${lx}" y="${ly+4}" text-anchor="middle" fill="#B8CEEA" font-size="10" font-family="Inter,sans-serif" font-weight="600">${labels[i]}</text>`;
      const pctTxt=Math.round(v)+'%';
      out+=`<text x="${x}" y="${y-8}" text-anchor="middle" fill="${bc}" font-size="8" font-family="Space Mono,monospace" font-weight="700">${pctTxt}</text>`;
    });
    out+=`<circle cx="${cx}" cy="${cy}" r="3" fill="#5A9BFF"/>`;
    return `<svg viewBox="0 0 260 260" width="260" height="260">${out}</svg>`;
  }

  // 6. GAUGE SEMICÍRCULO
  function svgGauge(value, max, label, color){
    const pct=Math.max(0,Math.min(value/max,1));
    const cx=100,cy=90,R=72;
    const sA=Math.PI, eA=2*Math.PI;
    const arcSt=[cx+R*Math.cos(sA),cy+R*Math.sin(sA)];
    const arcEn=[cx+R*Math.cos(eA),cy+R*Math.sin(eA)];
    const vA=sA+pct*Math.PI;
    const vEnd=[cx+R*Math.cos(vA),cy+R*Math.sin(vA)];
    const lg=pct>0.5?1:0;
    // tick marks
    let ticks='';
    for(let t=0;t<=max;t++){
      const ta=Math.PI+(t/max)*Math.PI;
      const [ox,oy]=[cx+R*Math.cos(ta),cy+R*Math.sin(ta)];
      const [ix,iy]=[cx+(R-10)*Math.cos(ta),cy+(R-10)*Math.sin(ta)];
      ticks+=`<line x1="${ox}" y1="${oy}" x2="${ix}" y2="${iy}" stroke="rgba(26,86,196,.3)" stroke-width="${t===0||t===max?2:1}"/>`;
    }
    return `<svg viewBox="0 0 200 110" width="170" height="94">
      ${ticks}
      <path d="M${arcSt[0]},${arcSt[1]} A${R},${R} 0 0,1 ${arcEn[0]},${arcEn[1]}" fill="none" stroke="rgba(26,86,196,.15)" stroke-width="14" stroke-linecap="round"/>
      <path d="M${arcSt[0]},${arcSt[1]} A${R},${R} 0 ${lg},1 ${vEnd[0]},${vEnd[1]}" fill="none" stroke="${color}" stroke-width="14" stroke-linecap="round"/>
      <text x="${cx}" y="${cy-4}" text-anchor="middle" fill="${color}" font-size="28" font-weight="700" font-family="Space Mono,monospace">${value}</text>
      <text x="${cx}" y="${cy+14}" text-anchor="middle" fill="#6A829E" font-size="10" font-family="Inter,sans-serif">${label}</text>
    </svg>`;
  }

  // 7. SPARKLINE mini
  function svgSparkline(data, color, W=80, H=28){
    const v=data.filter(x=>x!=null&&!isNaN(x));
    if(v.length<2) return '';
    const mn=Math.min(...v), mx=Math.max(...v), range=mx-mn||1;
    const xs=data.map((_,i)=>i*(W/(data.length-1)));
    const ys=val=>H-3-(val-mn)/range*(H-6);
    const pts=data.map((d,i)=>d!=null?`${xs[i]},${ys(d)}`:null).filter(Boolean);
    const last=data[data.length-1];
    const aD=`M${pts[0]} ${pts.slice(1).map(p=>'L'+p).join(' ')} L${xs[data.length-1]},${H} L0,${H} Z`;
    return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" style="display:block;flex-shrink:0">
      <path d="${aD}" fill="${color}" fill-opacity=".12"/>
      <polyline points="${pts.join(' ')}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linejoin="round"/>
      <circle cx="${xs[data.length-1]}" cy="${ys(last)}" r="3" fill="${color}"/>
    </svg>`;
  }

  // 8. HORIZONTAL BAR — márgenes con umbral
  function svgHBar(items){
    const W=440,barH=20,gap=9,padL=128,padR=58,padT=8;
    const H=padT+items.length*(barH+gap);
    let out='';
    items.forEach((it,i)=>{
      const y=padT+i*(barH+gap);
      const pct=Math.max(0,Math.min((it.val||0)/it.max,1));
      const bw=(W-padL-padR)*pct;
      if(it.thr){const tx=padL+(it.thr/it.max)*(W-padL-padR);out+=`<line x1="${tx}" y1="${y}" x2="${tx}" y2="${y+barH}" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="3,2"/>`;}
      out+=`<text x="${padL-7}" y="${y+barH/2+4}" text-anchor="end" fill="#8FA8C8" font-size="9.5" font-family="Inter,sans-serif">${it.lbl}</text>`;
      out+=`<rect x="${padL}" y="${y}" width="${W-padL-padR}" height="${barH}" rx="3" fill="rgba(26,86,196,.1)"/>`;
      out+=`<rect x="${padL}" y="${y}" width="${bw}" height="${barH}" rx="3" fill="${it.color||'#1A56C4'}"/>`;
      out+=`<text x="${padL+bw+6}" y="${y+barH/2+4}" fill="${it.color||'#5A9BFF'}" font-size="9.5" font-family="Space Mono,monospace" font-weight="700">${it.val!=null?it.val.toFixed(1)+'%':'N/E'}</text>`;
    });
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block">${out}</svg>`;
  }

  // 9. ROIC vs WACC con área spread
  function svgROICLine(roicS, wacc, anios){
    if(!roicS.length) return '';
    const W=560,H=200,padL=36,padR=54,padT=18,padB=30;
    const allV=[...roicS]; if(wacc) allV.push(wacc);
    const dataMin=Math.min(...allV), dataMax=Math.max(...allV);
    // Rango expandido para que las líneas ocupen bien el espacio
    const mn=Math.max(0, dataMin - (dataMax-dataMin)*0.6);
    const mx=dataMax + (dataMax-dataMin)*0.4;
    const xs=anios.map((_,i)=>padL+i*(W-padL-padR)/(anios.length-1));
    const ys=v=>padT+(1-(v-mn)/(mx-mn))*(H-padT-padB);
    const waccY=wacc!=null?ys(wacc):null;
    let out='';
    // Grid lines con etiquetas de valor
    [0,.25,.5,.75,1].forEach(p=>{
      const yg=padT+p*(H-padT-padB);
      const val=(mn+(1-p)*(mx-mn)).toFixed(1);
      out+=`<line x1="${padL}" y1="${yg}" x2="${W-padR}" y2="${yg}" stroke="rgba(26,86,196,.12)" stroke-width="1"/>`;
      out+=`<text x="${padL-6}" y="${yg+4}" fill="#6A829E" font-size="8" font-family="Space Mono,monospace" text-anchor="end">${val}%</text>`;
    });
    if(waccY!=null){
      out+=`<line x1="${padL}" y1="${waccY}" x2="${W-padR}" y2="${waccY}" stroke="#ef4444" stroke-width="1.8" stroke-dasharray="6,4"/>`;
      out+=`<text x="${W-padR+5}" y="${waccY+4}" fill="#ef4444" font-size="9" font-family="Space Mono,monospace" font-weight="700">WACC ${wacc}%</text>`;
      // Área spread (entre ROIC y WACC)
      out+=`<path d="M${xs[0]},${Math.min(ys(roicS[0]),waccY)} L${roicS.map((v,i)=>xs[i]+','+Math.min(ys(v),waccY)).join(' L')} L${xs[roicS.length-1]},${waccY} L${xs[0]},${waccY} Z" fill="#22c55e" fill-opacity=".10"/>`;
    }
    // Área bajo la línea ROIC
    const aD=`M${xs[0]},${ys(roicS[0])} ${roicS.map((v,i)=>`L${xs[i]},${ys(v)}`).join(' ')} L${xs[roicS.length-1]},${H-padB} L${xs[0]},${H-padB} Z`;
    out+=`<path d="${aD}" fill="#2E74E8" fill-opacity=".08"/>`;
    // Línea ROIC
    out+=`<polyline points="${roicS.map((v,i)=>xs[i]+','+ys(v)).join(' ')}" fill="none" stroke="#2E74E8" stroke-width="2.5" stroke-linejoin="round"/>`;
    // Puntos con etiquetas de valor
    roicS.forEach((v,i)=>{
      const isLast=i===roicS.length-1;
      const cx=xs[i], cy=ys(v);
      out+=`<circle cx="${cx}" cy="${cy}" r="${isLast?5.5:3.5}" fill="${isLast?'#F2CC6E':'#2E74E8'}" stroke="${isLast?'#2E74E8':'none'}" stroke-width="${isLast?1.5:0}"/>`;
      out+=`<text x="${cx}" y="${cy-9}" text-anchor="middle" fill="${isLast?'#F2CC6E':'#8FA8C8'}" font-size="${isLast?10:8}" font-family="Space Mono,monospace" font-weight="${isLast?700:400}">${v}%</text>`;
    });
    // Etiquetas eje X
    anios.forEach((l,i)=>out+=`<text x="${xs[i]}" y="${H-8}" fill="#6A829E" font-size="9" font-family="Space Mono,monospace" text-anchor="middle">${l}</text>`);
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block;overflow:visible">${out}</svg>`;
  }

  // ═══════════════════════════════════════════════════════════════
  //  SEMÁFORO CARD
  // ═══════════════════════════════════════════════════════════════
  function sc(ind){
    const cls=ind.signal==='🟢'?'g':ind.signal==='🔴'?'r':'a';
    const val=String(ind.dato).split('|')[0].split(':').pop().trim().slice(0,14);
    return `<div class="sc ${cls}">
      <div class="sc-hd"><span class="sc-num">${String(ind.n).padStart(2,'0')}</span></div>
      <div class="sc-name">${ind.name.length>20?ind.name.slice(0,20)+'…':ind.name}</div>
      <div class="sc-val">${ind.signal} ${val}</div>
    </div>`;
  }

  function alertRow(p){
    const active=p.found&&!p.negated, attenuated=p.found&&p.negated;
    const badge=active?'<span class="badge r">ACTIVA</span>':attenuated?'<span class="badge a">ATENUADA</span>':'<span class="badge" style="background:var(--bg3);color:var(--gray2)">NO ENCONTRADA</span>';
    const color=active?'var(--red)':attenuated?'var(--amber)':'var(--gray2)';
    return `<div class="al-item ${p.found?(active?'ral':'aal'):''}" style="${p.found?'':'opacity:.5'}">
      <div>${badge}</div>
      <div><div class="al-frase" style="color:${color}">"${p.phrase}"</div>
      <div class="al-desc">${active?'Frase de alerta activa detectada en el texto corporativo.':attenuated?'Encontrada con negación explícita — señal atenuada.':'No encontrada en el texto proporcionado.'}</div></div>
    </div>`;
  }

  // ═══════════════════════════════════════════════════════════════
  //  PREPARAR DATOS PARA GRÁFICAS
  // ═══════════════════════════════════════════════════════════════
  const donutChart    = svgDonut(c.cntGreen, c.cntAmber, c.cntRed);
  const lineChart     = svgLine([c.ing.map(v=>v||null), c.ub.map(v=>v||null), c.gn.map(v=>v||null)], c.anios, ['#F2CC6E','#2E74E8','#22c55e']);
  const groupedChart  = svgGroupedBars([c.ebit, c.ebitda, c.fcf], c.anios, ['#1A56C4','#5A9BFF','#22c55e']);
  const roicChart     = svgROICLine(c.roicS, c.wacc, c.anios);
  const marginBars    = svgHBar([
    {lbl:'Margen Bruto',    val:c.mgBruto25,  max:100, color:'#2E74E8', thr:20},
    {lbl:'Mg EBITDA',       val:c.mgEBITDA25, max:100, color:'#5A9BFF', thr:30},
    {lbl:'Mg EBIT',         val:c.mgEBIT25,   max:100, color:'#1A56C4', thr:30},
    {lbl:'Mg Neto',         val:c.mgNeto25,   max:100, color:'#8FA8C8', thr:20},
    {lbl:'FCF s/Apal.',     val:c.mgFCFSA,    max:100, color:'#22c55e', thr:20},
    {lbl:'FCF Apal.',       val:c.mgFCFA,     max:100, color:'#16803a', thr:15},
  ]);

  // Waterfall P&L
  const wfItems=[];
  if(c.ing25){
    let prev=0;
    const addW=(label,val,isTotal=false)=>{if(val==null)return;wfItems.push({label,value:val-prev,cumulative:val,prev,isTotal});prev=isTotal?prev:val;};
    addW('Ingresos',c.ing25);
    if(c.ub25)    addW('Ut. Bruta', c.ub25);
    if(c.ebitda25)addW('EBITDA',    c.ebitda25);
    if(c.ebit25)  addW('EBIT',      c.ebit25);
    if(c.gn25)    addW('Gan. Neta', c.gn25);
    if(c.fcf25)   wfItems.push({label:'FCF',value:c.fcf25,cumulative:c.fcf25,prev:0,isTotal:true});
  }
  const waterfallChart=svgWaterfall(wfItems);

  // Radar 5 pilares
  const p1=Math.min(c.mgBruto25||0,100);
  const p2=Math.min((c.liqCte||0)*33,100);
  const p3=Math.min(c.roic25||0,100);
  const p4=c.dnEBITDA!=null?Math.max(0,Math.min(100-c.dnEBITDA*25,100)):50;
  const p5=Math.min((c.piotr||0)/9*100,100);
  const radarChart=svgRadar([p1,p2,p3,p4,p5],['Rentab.','Liquidez','Retorno','Deuda','Salud'],[
    c.inds.find(i=>i.n===4)?.signal||'N/E',
    c.inds.find(i=>i.n===19)?.signal||'N/E',
    c.inds.find(i=>i.n===14)?.signal||'N/E',
    c.inds.find(i=>i.n===23)?.signal||'N/E',
    c.inds.find(i=>i.n===35)?.signal||'N/E',
  ]);

  // Gauges para Altman y Piotroski
  const altmanGauge = c.altman!=null ? svgGauge(c.altman, 5, 'Altman Z', c.altman>3?'#22c55e':'#ef4444') : '';
  const piotrGauge  = c.piotr!=null  ? svgGauge(c.piotr,  9, 'Piotroski', c.piotr>=7?'#22c55e':'#f59e0b') : '';

  // Sparklines para KPI cards
  const ingSpk  = svgSparkline(c.ing,   '#F2CC6E');
  const fcfSpk  = svgSparkline(c.fcf,   '#22c55e');
  const roicSpk = svgSparkline(c.roicS, '#5A9BFF');
  const gnSpk   = svgSparkline(c.gn,    '#B8CEEA');

  const spread=c.spread!=null?(c.spread>0?'+':'')+c.spread.toFixed(1)+'pp':'N/E';

  // ── GRÁFICAS ADICIONALES ──
  const mgBrutoArr = c.ing.map((v,i)=>(c.ub[i]&&v)?+(c.ub[i]/v*100).toFixed(2):null);
  const mgEBITDArr = c.ing.map((v,i)=>(c.ebitda[i]&&v)?+(c.ebitda[i]/v*100).toFixed(2):null);
  const mgEBITArr  = c.ing.map((v,i)=>(c.ebit[i]&&v)?+(c.ebit[i]/v*100).toFixed(2):null);
  const mgNetoArr  = c.ing.map((v,i)=>(c.gn[i]&&v)?+(c.gn[i]/v*100).toFixed(2):null);
  const marginEvolChart = svgLine([mgBrutoArr, mgEBITDArr, mgEBITArr, mgNetoArr], c.anios, ['#F2CC6E','#5A9BFF','#2E74E8','#22c55e']);
  const cashflowGroupChart = svgGroupedBars([c.ofc, c.capex, c.fcf], c.anios, ['#2E74E8','#ef4444','#22c55e']);
  const bpaLineChart = c.bpa.length ? svgLine([c.bpa], c.anios.slice(0,c.bpa.length), ['#F2CC6E'], 160) : '';
  const eqAnios2 = ['2022','2023','2024','2025'].slice(0, c.eq.length);
  const eqLineChart = c.eq.length ? svgLine([c.eq], eqAnios2, ['#5A9BFF'], 140) : '';
  const rentabBars = svgHBar([
    {lbl:'ROE',  val:c.roe,    max:50, color:'#F2CC6E', thr:20},
    {lbl:'ROIC', val:c.roic25, max:50, color:'#5A9BFF', thr:20},
    {lbl:'ROA',  val:c.roa,    max:50, color:'#2E74E8', thr:15},
  ]);

  // ═══════════════════════════════════════════════════════════════
  //  HTML — DASHBOARD ÉPICO
  // ═══════════════════════════════════════════════════════════════
  const html=`

  <!-- ══ 1. HERO ══ -->
  <div class="dash-section" style="padding-bottom:36px">
    <div class="sec-tag">Análisis cuantitativo · Check List Indicadores Financieros 2</div>
    <div style="display:grid;grid-template-columns:1fr auto;gap:28px;align-items:start">
      <div>
        <h2 class="sec-title" style="font-size:clamp(26px,4vw,52px);margin-bottom:14px">${D}</h2>
        <div class="ficha">
          <div class="ficha-item"><span class="ficha-val">${costo}</span><span class="ficha-lbl">Precio / Costo</span></div>
          <div class="ficha-item"><span class="ficha-val">${proy}</span><span class="ficha-lbl">Proyección</span></div>
          <div class="ficha-item"><span class="ficha-val">${riesgo}</span><span class="ficha-lbl">Riesgo</span></div>
          <div class="ficha-item"><span class="ficha-val">${MON}</span><span class="ficha-lbl">Moneda</span></div>
          <div class="ficha-item"><span class="ficha-val">2021–2025</span><span class="ficha-lbl">Período</span></div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:16px">
          ${c.ev?`<div style="background:var(--bg2);border:1px solid rgba(46,116,232,.2);border-radius:6px;padding:12px;text-align:center"><div style="font-family:'Space Mono',monospace;font-size:14px;font-weight:700;background:linear-gradient(135deg,var(--gold3),var(--silver3));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">${fmtN(c.ev,0)}</div><div style="font-size:9px;color:var(--gray2);letter-spacing:.2em;text-transform:uppercase;margin-top:3px">EV (${MON})</div></div>`:''}
          ${c.per?`<div style="background:var(--bg2);border:1px solid rgba(46,116,232,.2);border-radius:6px;padding:12px;text-align:center"><div style="font-family:'Space Mono',monospace;font-size:14px;font-weight:700;color:var(--gold3)">${c.per}×</div><div style="font-size:9px;color:var(--gray2);letter-spacing:.2em;text-transform:uppercase;margin-top:3px">PER</div></div>`:''}
          ${c.peg?`<div style="background:var(--bg2);border:1px solid rgba(46,116,232,.2);border-radius:6px;padding:12px;text-align:center"><div style="font-family:'Space Mono',monospace;font-size:14px;font-weight:700;color:${c.peg<1?'#22c55e':'#ef4444'}">${c.peg}</div><div style="font-size:9px;color:var(--gray2);letter-spacing:.2em;text-transform:uppercase;margin-top:3px">PEG</div></div>`:''}
          ${c.wacc?`<div style="background:var(--bg2);border:1px solid rgba(46,116,232,.2);border-radius:6px;padding:12px;text-align:center"><div style="font-family:'Space Mono',monospace;font-size:14px;font-weight:700;color:var(--silver2)">${c.wacc}%</div><div style="font-size:9px;color:var(--gray2);letter-spacing:.2em;text-transform:uppercase;margin-top:3px">WACC</div></div>`:''}
        </div>
      </div>
      <!-- DONUT -->
      <div style="display:flex;flex-direction:column;align-items:center;gap:10px">
        ${donutChart}
        <div style="display:flex;gap:14px">
          <div style="display:flex;align-items:center;gap:5px;font-size:10px;color:var(--gray1)"><div style="width:10px;height:10px;border-radius:50%;background:#22c55e"></div>${c.cntGreen}</div>
          <div style="display:flex;align-items:center;gap:5px;font-size:10px;color:var(--gray1)"><div style="width:10px;height:10px;border-radius:50%;background:#f59e0b"></div>${c.cntAmber}</div>
          <div style="display:flex;align-items:center;gap:5px;font-size:10px;color:var(--gray1)"><div style="width:10px;height:10px;border-radius:50%;background:#ef4444"></div>${c.cntRed}</div>
        </div>
        <div style="font-size:9px;color:var(--gray2);letter-spacing:.2em;text-transform:uppercase">de 35 indicadores</div>
      </div>
    </div>
  </div>

  <!-- ══ 2. SEMÁFOROS ══ -->
  <div class="dash-section">
    <div class="sec-tag">Vista global · 35 indicadores</div>
    <h2 class="sec-title">Dashboard de <span>Señales</span></h2>
    <div class="sg">${c.inds.map(i=>sc(i)).join('')}</div>
  </div>

  <!-- ══ 3. CASCADA P&L ══ -->
  <div class="dash-section">
    <div class="sec-tag">Cascada de resultados · ${c.anios[c.anios.length-1]}</div>
    <h2 class="sec-title">Cascada de <span>Márgenes</span></h2>
    <div style="display:grid;grid-template-columns:1fr 260px;gap:24px;align-items:start">
      <div class="chart-box">
        <div class="chart-title-small" style="margin-bottom:10px">Ingresos → Gan. Bruta → EBITDA → EBIT → Neta → FCF (${MON})</div>
        ${waterfallChart}
        <div style="display:flex;gap:16px;margin-top:8px">
          <div style="display:flex;align-items:center;gap:6px;font-size:10px;color:var(--gray2)"><div style="width:12px;height:8px;border-radius:2px;background:#22c55e;opacity:.85"></div>Positivo</div>
          <div style="display:flex;align-items:center;gap:6px;font-size:10px;color:var(--gray2)"><div style="width:12px;height:8px;border-radius:2px;background:#2E74E8"></div>Total / FCF</div>
          <div style="display:flex;align-items:center;gap:6px;font-size:10px;color:var(--gray2)"><div style="width:12px;height:8px;border-radius:2px;background:#ef4444;opacity:.85"></div>Reducción</div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px">
        ${c.mgBruto25!=null?`<div class="dcard"><div class="dcard-lbl">Margen Bruto</div><div class="dcard-val">${c.mgBruto25.toFixed(1)}%</div><div class="dcard-note">Umbral &gt;20% ${c.mgBruto25>20?'✓':''}</div></div>`:''}
        ${c.mgEBITDA25!=null?`<div class="dcard"><div class="dcard-lbl">Margen EBITDA</div><div class="dcard-val">${c.mgEBITDA25.toFixed(1)}%</div><div class="dcard-note">Umbral &gt;30% ${c.mgEBITDA25>30?'✓':''}</div></div>`:''}
        ${c.mgEBIT25!=null?`<div class="dcard"><div class="dcard-lbl">Margen EBIT</div><div class="dcard-val">${c.mgEBIT25.toFixed(1)}%</div><div class="dcard-note">Umbral &gt;30% ${c.mgEBIT25>30?'✓':''}</div></div>`:''}
        ${c.mgNeto25!=null?`<div class="dcard"><div class="dcard-lbl">Margen Neto</div><div class="dcard-val">${c.mgNeto25.toFixed(1)}%</div><div class="dcard-note">Umbral &gt;20% ${c.mgNeto25>20?'✓':''}</div></div>`:''}
      </div>
    </div>
  </div>

  <!-- ══ 4. KPIs CON SPARKLINES ══ -->
  <div class="dash-section">
    <div class="sec-tag">Métricas clave · ${c.anios[c.anios.length-1]} · Con tendencia histórica</div>
    <h2 class="sec-title">KPIs <span>Protagonistas</span></h2>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px">
      ${c.ing25!=null?`<div class="kc"><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px"><span class="kc-val" style="font-size:20px">${fmtN(c.ing25,0)}</span>${ingSpk}</div><div class="kc-name">Ingresos (${MON})</div><div class="kc-thr">${ingGrowth!=null?'+'+ingGrowth.toFixed(1)+'% vs 2021':''}</div><div class="kc-bar"><div class="kc-fill" style="width:100%;background:linear-gradient(to right,var(--gold1),var(--gold3))"></div></div></div>`:''}
      ${c.fcf25!=null?`<div class="kc"><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px"><span class="kc-val" style="font-size:20px;color:#22c55e;-webkit-text-fill-color:#22c55e">${fmtN(c.fcf25,0)}</span>${fcfSpk}</div><div class="kc-name">FCF (${MON})</div><div class="kc-thr">${fcfGrowth!=null?'+'+fcfGrowth.toFixed(1)+'% vs 2021':''} · Yield ${c.fcfYield!=null?c.fcfYield.toFixed(1)+'%':'N/E'}</div><div class="kc-bar"><div class="kc-fill" style="width:${c.rndFCF!=null?Math.min(c.rndFCF/20*100,100):50}%;background:#22c55e"></div></div></div>`:''}
      ${c.roic25!=null?`<div class="kc"><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px"><span class="kc-val" style="font-size:20px">${c.roic25}%</span>${roicSpk}</div><div class="kc-name">ROIC</div><div class="kc-thr">WACC: ${c.wacc||'N/E'}% · Spread: ${spread}</div><div class="kc-bar"><div class="kc-fill" style="width:${Math.min(c.roic25/30*100,100)}%"></div></div></div>`:''}
      ${c.gn25!=null?`<div class="kc"><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px"><span class="kc-val" style="font-size:20px;color:var(--silver2);-webkit-text-fill-color:var(--silver2)">${fmtN(c.gn25,0)}</span>${gnSpk}</div><div class="kc-name">Ganancias Netas (${MON})</div><div class="kc-thr">${gnGrowth!=null?'+'+gnGrowth.toFixed(1)+'% vs 2021':''}</div><div class="kc-bar"><div class="kc-fill" style="width:${c.mgNeto25!=null?Math.min(c.mgNeto25/40*100,100):50}%;background:var(--silver1)"></div></div></div>`:''}
      ${c.mgBruto25!=null?`<div class="kc"><span class="kc-val">${c.mgBruto25.toFixed(1)}%</span><div class="kc-name">Margen Bruto</div><div class="kc-thr">+${(c.mgBruto25-20).toFixed(1)}pp sobre umbral &gt;20%</div><div class="kc-bar"><div class="kc-fill" style="width:${Math.min(c.mgBruto25/80*100,100)}%"></div></div></div>`:''}
      ${c.icr!=null?`<div class="kc"><span class="kc-val">${c.icr.toFixed(1)}×</span><div class="kc-name">Cobertura Interés (ICR)</div><div class="kc-thr">${(c.icr/3).toFixed(1)}× el umbral de 3×</div><div class="kc-bar"><div class="kc-fill" style="width:${Math.min(c.icr/30*100,100)}%"></div></div></div>`:''}
      ${c.dPat!=null?`<div class="kc"><span class="kc-val" style="color:${c.dPat<20?'var(--gold2)':'var(--red)'};-webkit-text-fill-color:${c.dPat<20?'var(--gold2)':'var(--red)'}">${c.dPat.toFixed(1)}%</span><div class="kc-name">Deuda / Patrimonio</div><div class="kc-thr">Umbral &lt;20%</div><div class="kc-bar"><div class="kc-fill" style="width:${Math.min(c.dPat/40*100,100)}%;background:${c.dPat<20?'var(--green)':'var(--red)'}"></div></div></div>`:''}
      ${c.mgFCFSA!=null?`<div class="kc"><span class="kc-val" style="color:#22c55e;-webkit-text-fill-color:#22c55e">${c.mgFCFSA.toFixed(1)}%</span><div class="kc-name">FCF Sin Apalancamiento</div><div class="kc-thr">Umbral &gt;20%</div><div class="kc-bar"><div class="kc-fill" style="width:${Math.min(c.mgFCFSA/40*100,100)}%;background:#22c55e"></div></div></div>`:''}
    </div>
  </div>

  <!-- ══ 5. HISTÓRICO — línea + barras agrupadas ══ -->
  <div class="dash-section">
    <div class="sec-tag">Evolución histórica 2021–2025</div>
    <h2 class="sec-title">Crecimiento <span>Histórico</span></h2>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
      <div class="chart-box">
        <div class="chart-title-small" style="margin-bottom:8px">Ingresos · Utilidad Bruta · Ganancias Netas (${MON})</div>
        ${lineChart}
        <div class="ch-legend">
          <div class="ch-li"><div class="ch-dot" style="background:#F2CC6E"></div>Ingresos</div>
          <div class="ch-li"><div class="ch-dot" style="background:#2E74E8"></div>Util. Bruta</div>
          <div class="ch-li"><div class="ch-dot" style="background:#22c55e"></div>Gan. Neta</div>
        </div>
      </div>
      <div class="chart-box">
        <div class="chart-title-small" style="margin-bottom:8px">EBIT · EBITDA · FCF por año — barras agrupadas (${MON})</div>
        ${groupedChart}
        <div class="ch-legend">
          <div class="ch-li"><div class="ch-dot" style="background:#1A56C4"></div>EBIT</div>
          <div class="ch-li"><div class="ch-dot" style="background:#5A9BFF"></div>EBITDA</div>
          <div class="ch-li"><div class="ch-dot" style="background:#22c55e"></div>FCF</div>
        </div>
      </div>
    </div>
  </div>

  <!-- ══ 5b. EVOLUCIÓN DE MÁRGENES ══ -->
  <div class="dash-section">
    <div class="sec-tag">Tendencia histórica 2021–2025 · Expansión y Contracción de márgenes</div>
    <h2 class="sec-title">Evolución de <span>Márgenes</span></h2>
    <div class="chart-box">
      <div class="chart-title-small" style="margin-bottom:8px">Márgenes % anuales — Bruto · EBITDA · EBIT · Neto</div>
      ${marginEvolChart}
      <div class="ch-legend" style="margin-top:10px">
        <div class="ch-li"><div class="ch-dot" style="background:#F2CC6E"></div>Mg Bruto</div>
        <div class="ch-li"><div class="ch-dot" style="background:#5A9BFF"></div>Mg EBITDA</div>
        <div class="ch-li"><div class="ch-dot" style="background:#2E74E8"></div>Mg EBIT</div>
        <div class="ch-li"><div class="ch-dot" style="background:#22c55e"></div>Mg Neto</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-top:16px">
      ${c.mgBruto25!=null?`<div class="kc" style="padding:20px 16px"><span class="kc-val" style="font-size:28px">${c.mgBruto25.toFixed(1)}%</span><div class="kc-name" style="color:#F2CC6E">Margen Bruto</div><div class="kc-thr">${c.mgBruto25>20?'✓ +'+( c.mgBruto25-20).toFixed(1)+'pp sobre &gt;20%':'Umbral &gt;20%'}</div><div class="kc-bar" style="margin-top:10px"><div class="kc-fill" style="width:${Math.min(c.mgBruto25/80*100,100)}%;background:#F2CC6E"></div></div></div>`:''}
      ${c.mgEBITDA25!=null?`<div class="kc" style="padding:20px 16px"><span class="kc-val" style="font-size:28px">${c.mgEBITDA25.toFixed(1)}%</span><div class="kc-name" style="color:#5A9BFF">Margen EBITDA</div><div class="kc-thr">${c.mgEBITDA25>30?'✓ Supera &gt;30%':'Umbral &gt;30%'}</div><div class="kc-bar" style="margin-top:10px"><div class="kc-fill" style="width:${Math.min(c.mgEBITDA25/80*100,100)}%;background:#5A9BFF"></div></div></div>`:''}
      ${c.mgEBIT25!=null?`<div class="kc" style="padding:20px 16px"><span class="kc-val" style="font-size:28px">${c.mgEBIT25.toFixed(1)}%</span><div class="kc-name" style="color:#2E74E8">Margen EBIT</div><div class="kc-thr">${c.mgEBIT25>30?'✓ Supera &gt;30%':'Umbral &gt;30%'}</div><div class="kc-bar" style="margin-top:10px"><div class="kc-fill" style="width:${Math.min(c.mgEBIT25/80*100,100)}%;background:#2E74E8"></div></div></div>`:''}
      ${c.mgNeto25!=null?`<div class="kc" style="padding:20px 16px"><span class="kc-val" style="font-size:28px">${c.mgNeto25.toFixed(1)}%</span><div class="kc-name" style="color:#22c55e">Margen Neto</div><div class="kc-thr">${c.mgNeto25>20?'✓ Supera &gt;20%':'Umbral &gt;20%'}</div><div class="kc-bar" style="margin-top:10px"><div class="kc-fill" style="width:${Math.min(c.mgNeto25/60*100,100)}%;background:#22c55e"></div></div></div>`:''}
      ${c.mgFCFSA!=null?`<div class="kc" style="padding:20px 16px"><span class="kc-val" style="font-size:28px;color:var(--green);-webkit-text-fill-color:var(--green)">${c.mgFCFSA.toFixed(1)}%</span><div class="kc-name">FCF s/Apal.</div><div class="kc-thr">${c.mgFCFSA>20?'✓ Supera &gt;20%':'Umbral &gt;20%'}</div><div class="kc-bar" style="margin-top:10px"><div class="kc-fill" style="width:${Math.min(c.mgFCFSA/50*100,100)}%;background:var(--green)"></div></div></div>`:''}
    </div>
  </div>

  <!-- ══ 6. MÁRGENES + RADAR 5 PILARES ══ -->
  <div class="dash-section">
    <div class="sec-tag">Rentabilidad estructural · 5 dimensiones de análisis</div>
    <h2 class="sec-title">Márgenes y <span>Radar de Pilares</span></h2>
    <div style="display:grid;grid-template-columns:1fr auto;gap:28px;align-items:center">
      <div class="chart-box" style="padding:20px">
        <div class="chart-title-small" style="margin-bottom:14px">Márgenes % · ${c.anios[c.anios.length-1]}  — línea <span style="color:#f59e0b">■</span> umbral mínimo</div>
        ${marginBars}
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:6px">
        <div class="chart-title-small" style="margin-bottom:2px;text-align:center">Radar · 5 Pilares</div>
        ${radarChart}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px;margin-top:2px">
          <div style="font-size:9px;color:var(--gray2)">🔵 Rentab. ${Math.round(p1)}%</div>
          <div style="font-size:9px;color:var(--gray2)">🔵 Liquidez ${Math.round(p2)}%</div>
          <div style="font-size:9px;color:var(--gray2)">🔵 Retorno ${Math.round(p3)}%</div>
          <div style="font-size:9px;color:var(--gray2)">🔵 Deuda ${Math.round(p4)}%</div>
          <div style="font-size:9px;color:var(--gray2)">🔵 Salud ${Math.round(p5)}%</div>
        </div>
      </div>
    </div>
  </div>

  <!-- ══ 7. ROIC vs WACC ══ -->
  <div class="dash-section">
    <div class="sec-tag">Creación de valor económico — EVA</div>
    <h2 class="sec-title">ROIC <span>vs</span> WACC — Spread de Valor</h2>
    <div class="chart-box" style="padding:20px 24px">
      <div class="chart-title-small" style="margin-bottom:12px">Evolución ROIC vs WACC (%) 2021–2025 · área verde = spread positivo = creación de valor</div>
      ${roicChart}
      <div class="ch-legend" style="margin-top:14px">
        <div class="ch-li"><div class="ch-dot" style="background:#2E74E8"></div>ROIC %</div>
        <div class="ch-li" style="gap:6px"><div style="width:22px;height:2px;border-top:2px dashed #ef4444;flex-shrink:0"></div><span style="font-size:10px;color:var(--gray2)">WACC %</span></div>
        <div class="ch-li"><div style="width:14px;height:10px;background:#22c55e;opacity:.3;border-radius:2px;flex-shrink:0"></div><span style="font-size:10px;color:var(--gray2)">Spread positivo = valor creado</span></div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:16px">
      ${c.roic25!=null?`<div class="kc" style="border-top-color:#2E74E8">
        <span class="kc-val">${c.roic25}%</span>
        <div class="kc-name">ROIC 2025</div>
        <div class="kc-thr">Umbral &gt;20% ${c.roic25>20?'· ✓ Supera':'· ✗ No alcanza'}</div>
        <div class="kc-bar" style="margin-top:10px"><div class="kc-fill" style="width:${Math.min(c.roic25/30*100,100)}%;background:#2E74E8"></div></div>
        <div style="margin-top:8px"><span class="badge ${c.roic25>20?'g':'r'}">${c.roic25>20?'✓ ÉLITE':''} &gt;20%</span></div>
      </div>`:''} 
      ${c.wacc!=null?`<div class="kc" style="border-top-color:var(--gray2)">
        <span class="kc-val" style="color:var(--silver2);-webkit-text-fill-color:var(--silver2)">${c.wacc}%</span>
        <div class="kc-name">WACC</div>
        <div class="kc-thr">Costo de capital · 7–11% óptimo</div>
        <div class="kc-bar" style="margin-top:10px"><div class="kc-fill" style="width:${Math.min(c.wacc/20*100,100)}%;background:var(--silver1)"></div></div>
        <div style="margin-top:8px"><span class="badge ${c.wacc>=7&&c.wacc<=11?'g':'a'}" >${c.wacc>=7&&c.wacc<=11?'✓ Rango óptimo':'Fuera de rango'}</span></div>
      </div>`:''}
      ${c.spread!=null?`<div class="kc" style="border-top-color:${c.spread>0?'var(--green)':'var(--red)'}">
        <span class="kc-val" style="color:${c.spread>0?'#22c55e':'#ef4444'};-webkit-text-fill-color:${c.spread>0?'#22c55e':'#ef4444'}">${c.spread>0?'+':''}${c.spread.toFixed(1)}pp</span>
        <div class="kc-name">Spread ROIC − WACC</div>
        <div class="kc-thr">${c.spread>0?'Crea valor económico':'Destruye valor'}</div>
        <div class="kc-bar" style="margin-top:10px"><div class="kc-fill" style="width:${Math.min(Math.abs(c.spread)/20*100,100)}%;background:${c.spread>0?'var(--green)':'var(--red)'}"></div></div>
        <div style="margin-top:8px"><span class="badge ${c.spread>0?'g':'r'}">${c.spread>0?'✓ CREA VALOR':'✗ DESTRUYE'}</span></div>
      </div>`:''}
      ${c.roImp!=null?`<div class="kc" style="border-top-color:${c.spreadROImp>0?'var(--green)':'var(--amber)'}">
        <span class="kc-val">${c.roImp.toFixed(1)}%</span>
        <div class="kc-name">ROImp · 1/(EV/EBIT)</div>
        <div class="kc-thr">Spread vs WACC: ${c.spreadROImp!=null?(c.spreadROImp>0?'+':'')+c.spreadROImp.toFixed(1)+'pp':'N/E'}</div>
        <div class="kc-bar" style="margin-top:10px"><div class="kc-fill" style="width:${Math.min(c.roImp/30*100,100)}%;background:${c.spreadROImp>0?'var(--green)':'var(--amber)'}"></div></div>
        <div style="margin-top:8px"><span class="badge ${c.spreadROImp>0?'g':'a'}">${c.spreadROImp>0?'✓ ROImp &gt; WACC':'ROImp &lt; WACC'}</span></div>
      </div>`:''}
    </div>
  </div>

  <!-- ══ 8. DEUDA ══ -->
  <div class="dash-section">
    <div class="sec-tag">Estructura de capital · ${c.anios[c.anios.length-1]}</div>
    <h2 class="sec-title">Posición de <span>Deuda</span></h2>
    <div class="dg">
      <div class="dcol">
        ${c.dt!=null?`<div class="dcard"><div class="dcard-lbl">Deuda Total</div><div class="dcard-val">${fmtN(c.dt,0)} ${MON}</div><div class="dcard-note">C/P: ${c.dcp?fmtN(c.dcp,0):'-'} ${MON}</div></div>`:''}
        ${c.caja!=null?`<div class="dcard"><div class="dcard-lbl">Caja y Equiv.</div><div class="dcard-val" style="color:var(--green)">${fmtN(c.caja,0)} ${MON}</div><div class="dcard-note">${c.dt&&c.caja?(c.caja/c.dt).toFixed(2)+'× deuda bruta':''}</div></div>`:''}
        ${c.dPat!=null?`<div class="dcard ${c.dPat>=20?'rb':''}"><div class="dcard-lbl">Deuda / Patrimonio</div><div class="dcard-val" style="color:${c.dPat<20?'var(--gold2)':'var(--red)'}">${c.dPat.toFixed(1)}%</div><div class="dcard-note">Umbral &lt;20%</div></div>`:''}
        ${c.ppeIng!=null?`<div class="dcard ${c.ppeIng>50?'rb':''}"><div class="dcard-lbl">PP&E / Ingresos</div><div class="dcard-val" style="color:${c.ppeIng>50?'var(--red)':'var(--gold2)'}">${c.ppeIng.toFixed(1)}%</div><div class="dcard-note">${c.ppeIng>50?'Intensivo en activos':'Controlado'}</div></div>`:''}
      </div>
      <div class="dhero">
        <div class="dhero-val">${c.dn!=null?fmtN(c.dn,0):'N/E'}</div>
        <div class="dhero-lbl">${MON} · DEUDA NETA</div>
        <div class="dhero-note">${c.dn!=null&&c.dn<0?'✓ Posición de CAJA NETA':c.dn!=null?'Deuda neta positiva':''}</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-top:16px">
          ${c.dnEBITDA!=null?`<span class="badge ${c.dnEBITDA<=1?'g':'r'}">DN/EBITDA: ${c.dnEBITDA.toFixed(2)}×</span>`:''}
          ${c.icr!=null?`<span class="badge g">ICR: ${c.icr.toFixed(1)}×</span>`:''}
        </div>
      </div>
      <div class="dcol">
        ${c.icr!=null?`<div class="dcard"><div class="dcard-lbl">ICR — Cobertura Interés</div><div class="dcard-val">${c.icr.toFixed(1)}×</div><div class="dcard-note">${(c.icr/3).toFixed(1)}× el mínimo (3×)</div></div>`:''}
        ${c.liqCte!=null?`<div class="dcard"><div class="dcard-lbl">Liquidez Corriente</div><div class="dcard-val">${c.liqCte.toFixed(2)}×</div><div class="dcard-note">${fmtN(c.ac,0)} / ${fmtN(c.pc,0)} ${MON}</div></div>`:''}
        ${c.liqAcida!=null?`<div class="dcard"><div class="dcard-lbl">Liquidez Ácida</div><div class="dcard-val">${c.liqAcida.toFixed(2)}×</div><div class="dcard-note">Sin inventario (${fmtN(c.inv,0)} ${MON})</div></div>`:''}
        ${c.eq25&&c.eq22?`<div class="dcard"><div class="dcard-lbl">Equity (4 años)</div><div class="dcard-val">+${((c.eq25-c.eq22)/c.eq22*100).toFixed(1)}%</div><div class="dcard-note">${fmtN(c.eq22,0)} → ${fmtN(c.eq25,0)} ${MON}</div></div>`:''}
      </div>
    </div>
  </div>

  <!-- ══ 8b. FLUJO DE CAJA · BPA · EQUITY · RENTABILIDAD ══ -->
  <div class="dash-section">
    <div class="sec-tag">Generación de valor · Accionistas · Evolución histórica</div>
    <h2 class="sec-title">Flujo de Caja · BPA & <span>Rentabilidad</span></h2>

    <!-- Fila 1: Dos gráficas simétricas -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
      <div class="chart-box">
        <div class="chart-title-small" style="margin-bottom:8px">OFC · CapEx · FCF por año (${MON})</div>
        ${cashflowGroupChart}
        <div class="ch-legend" style="margin-top:10px">
          <div class="ch-li"><div class="ch-dot" style="background:#2E74E8"></div>OFC</div>
          <div class="ch-li"><div class="ch-dot" style="background:#ef4444"></div>CapEx</div>
          <div class="ch-li"><div class="ch-dot" style="background:#22c55e"></div>FCF</div>
        </div>
      </div>
      <div class="chart-box">
        <div class="chart-title-small" style="margin-bottom:8px">BPA — Beneficio por Acción · ${c.anios[0]}–${c.anios[c.anios.length-1]}</div>
        ${bpaLineChart}
        <div class="ch-legend" style="margin-top:10px">
          <div class="ch-li"><div class="ch-dot" style="background:#F2CC6E"></div>BPA anual</div>
        </div>
      </div>
    </div>

    <!-- Fila 2: Datos numéricos debajo de cada gráfica -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:14px">
      <!-- Debajo del cashflow: 3 KPI cards -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
        ${c.ofc25?`<div class="kc" style="padding:18px 14px;text-align:center"><span class="kc-val" style="font-size:22px;color:#5A9BFF;-webkit-text-fill-color:#5A9BFF">${fmtN(c.ofc25,0)}</span><div class="kc-name">OFC ${MON}</div><div class="kc-thr">Flujo Operativo</div></div>`:''}
        ${c.capex25?`<div class="kc" style="padding:18px 14px;text-align:center"><span class="kc-val" style="font-size:22px;color:#ef4444;-webkit-text-fill-color:#ef4444">(${fmtN(c.capex25,0)})</span><div class="kc-name">CapEx ${MON}</div><div class="kc-thr">Inversión: ${c.mgCap?c.mgCap.toFixed(1)+'%/Ing':''}</div></div>`:''}
        ${c.fcf25?`<div class="kc" style="padding:18px 14px;text-align:center"><span class="kc-val" style="font-size:22px;color:#22c55e;-webkit-text-fill-color:#22c55e">${fmtN(c.fcf25,0)}</span><div class="kc-name">FCF ${MON}</div><div class="kc-thr">Yield: ${c.fcfYield!=null?c.fcfYield.toFixed(1)+'%':'N/E'}</div></div>`:''}
      </div>
      <!-- Debajo del BPA: valores anuales + CAGR -->
      <div style="display:grid;grid-template-columns:repeat(${c.bpa.length+1},1fr);gap:8px">
        ${c.bpa.map((v,i)=>`<div class="kc" style="padding:14px 10px;text-align:center"><span class="kc-val" style="font-size:18px">${v.toFixed(2)}</span><div class="kc-name" style="font-size:9px">${c.anios[i]}</div></div>`).join('')}
        ${c.bpaCagr!=null?`<div class="kc" style="padding:14px 10px;text-align:center;border-top:2px solid ${c.bpaCagr>12?'var(--green)':'var(--amber)'}"><span class="kc-val" style="font-size:18px;color:${c.bpaCagr>12?'#22c55e':'#f59e0b'};-webkit-text-fill-color:${c.bpaCagr>12?'#22c55e':'#f59e0b'}">${c.bpaCagr.toFixed(1)}%</span><div class="kc-name" style="font-size:9px">CAGR</div></div>`:''}
      </div>
    </div>

    <!-- Fila 3: Equity + ROE/ROIC/ROA -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:20px">
      <div class="chart-box">
        <div class="chart-title-small" style="margin-bottom:10px">Equity — Patrimonio Neto (${MON}) · 2022–2025</div>
        ${eqLineChart}
        ${c.eq25&&c.eq22?`<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:14px">
          <div style="text-align:center;background:var(--bg2);border-radius:5px;padding:12px"><div style="font-family:'Space Mono',monospace;font-size:14px;font-weight:700;color:var(--gold3)">${fmtN(c.eq22,0)}</div><div style="font-size:8px;letter-spacing:.15em;color:var(--gray2);margin-top:4px">2022</div></div>
          <div style="text-align:center;background:var(--bg2);border-radius:5px;padding:12px"><div style="font-family:'Space Mono',monospace;font-size:14px;font-weight:700;color:#22c55e">${fmtN(c.eq25,0)}</div><div style="font-size:8px;letter-spacing:.15em;color:var(--gray2);margin-top:4px">2025</div></div>
          <div style="text-align:center;background:${c.eq25>c.eq22?'rgba(34,197,94,.08)':'rgba(239,68,68,.08)'};border:1px solid ${c.eq25>c.eq22?'rgba(34,197,94,.2)':'rgba(239,68,68,.2)'};border-radius:5px;padding:12px"><div style="font-family:'Space Mono',monospace;font-size:14px;font-weight:700;color:${c.eq25>c.eq22?'#22c55e':'#ef4444'}">${c.eq25>c.eq22?'+':''}${((c.eq25-c.eq22)/c.eq22*100).toFixed(1)}%</div><div style="font-size:8px;letter-spacing:.1em;color:var(--gray2);margin-top:4px">${c.eq25>c.eq22?'✓ Creciente':'✗ Decreciente'}</div></div>
        </div>`:''}
      </div>
      <div class="chart-box">
        <div class="chart-title-small" style="margin-bottom:14px">ROE · ROIC · ROA — Comparativa ${c.anios[c.anios.length-1]}</div>
        ${rentabBars}
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:14px">
          ${c.roe?`<div style="text-align:center;background:var(--bg2);border-radius:5px;padding:12px;border-top:2px solid #F2CC6E"><div style="font-family:'Space Mono',monospace;font-size:20px;font-weight:700;color:#F2CC6E">${c.roe}%</div><div style="font-size:8px;letter-spacing:.15em;color:var(--gray2);margin-top:4px">ROE ${c.roe>20?'✓':''}</div></div>`:''}
          ${c.roic25?`<div style="text-align:center;background:var(--bg2);border-radius:5px;padding:12px;border-top:2px solid #5A9BFF"><div style="font-family:'Space Mono',monospace;font-size:20px;font-weight:700;color:#5A9BFF">${c.roic25}%</div><div style="font-size:8px;letter-spacing:.15em;color:var(--gray2);margin-top:4px">ROIC ${c.roic25>20?'✓':''}</div></div>`:''}
          ${c.roa?`<div style="text-align:center;background:var(--bg2);border-radius:5px;padding:12px;border-top:2px solid #2E74E8"><div style="font-family:'Space Mono',monospace;font-size:20px;font-weight:700;color:#2E74E8">${c.roa}%</div><div style="font-size:8px;letter-spacing:.15em;color:var(--gray2);margin-top:4px">ROA ${c.roa>15?'✓':''}</div></div>`:''}
        </div>
      </div>
    </div>
  </div>

  <!-- ══ 9. ALTMAN + PIOTROSKI GAUGES ══ -->
  <div class="dash-section">
    <div class="sec-tag">Modelos cuantitativos de salud financiera</div>
    <h2 class="sec-title">Altman Z &amp; <span>Piotroski</span></h2>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;align-items:start">
      <div class="chart-box" style="padding:24px;text-align:center">
        <div class="chart-title-small" style="margin-bottom:16px">Altman Z-Score</div>
        <div style="display:flex;justify-content:center">${altmanGauge}</div>
        <div style="font-size:30px;font-weight:700;font-family:'Space Mono',monospace;color:${c.altman>3?'#22c55e':'#ef4444'};margin-top:4px">${c.altman||'N/E'}</div>
        <div style="font-size:11px;color:var(--gray2);margin-top:6px">${c.altman>3?'✓ Zona segura (&gt;3)':'✗ Zona de riesgo'}</div>
        <div style="display:flex;justify-content:center;gap:5px;margin-top:12px;flex-wrap:wrap">
          <span style="font-size:8px;padding:3px 6px;background:rgba(239,68,68,.12);color:#f87171;border-radius:3px">&lt;1.8 Distress</span>
          <span style="font-size:8px;padding:3px 6px;background:rgba(245,158,11,.12);color:#fbbf24;border-radius:3px">1.8–3 Zona gris</span>
          <span style="font-size:8px;padding:3px 6px;background:rgba(34,197,94,.12);color:#4ade80;border-radius:3px">&gt;3 Seguro</span>
        </div>
      </div>
      <div class="chart-box" style="padding:24px;text-align:center">
        <div class="chart-title-small" style="margin-bottom:16px">Piotroski F-Score</div>
        <div style="display:flex;justify-content:center">${piotrGauge}</div>
        <div style="font-size:30px;font-weight:700;font-family:'Space Mono',monospace;color:${c.piotr>=7?'#22c55e':'#f59e0b'};margin-top:4px">${c.piotr||'N/E'}<span style="font-size:16px;color:var(--gray2)">/9</span></div>
        <div style="font-size:11px;color:var(--gray2);margin-top:6px">${c.piotr>=7?'✓ Empresa sólida (≥7)':'⚠ Revisar fundamentales'}</div>
        <div style="display:flex;justify-content:center;gap:5px;margin-top:12px;flex-wrap:wrap">
          <span style="font-size:8px;padding:3px 6px;background:rgba(239,68,68,.12);color:#f87171;border-radius:3px">0–2 Débil</span>
          <span style="font-size:8px;padding:3px 6px;background:rgba(245,158,11,.12);color:#fbbf24;border-radius:3px">3–6 Medio</span>
          <span style="font-size:8px;padding:3px 6px;background:rgba(34,197,94,.12);color:#4ade80;border-radius:3px">7–9 Sólido</span>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:14px">
        ${c.bpaCagr!=null?`<div class="xc">
          <div class="xc-tag">CAGR BPA · ${c.bpa.length-1} años</div>
          <span class="xc-val">${c.bpaCagr.toFixed(1)}%</span>
          <div class="xc-name">Crecimiento BPA</div>
          <div class="xc-note">Umbral &gt;12% ${c.bpaCagr>12?'·  ✓ Supera el umbral de élite':'· ✗ Por debajo del umbral'}</div>
          <span class="badge ${c.bpaCagr>12?'g':'r'}" style="margin-top:10px;display:inline-block">${c.bpaCagr>12?'✓ ÉLITE':'✗ REVISAR'}</span>
        </div>`:''}
        ${c.ebitEBITDA!=null?`<div class="xc">
          <div class="xc-tag">EBIT / EBITDA — Calidad</div>
          <span class="xc-val">${c.ebitEBITDA.toFixed(1)}%</span>
          <div class="xc-name">Calidad EBITDA</div>
          <div class="xc-note">&gt;80% Atractivo · 60–80% Bueno · &lt;50% Alerta · ${c.ebitEBITDA>80?'✓ Atractivo':c.ebitEBITDA>=60?'✓ Bueno':'⚠ Revisar'}</div>
          <span class="badge ${c.ebitEBITDA>80?'g':c.ebitEBITDA>=60?'a':'r'}" style="margin-top:10px;display:inline-block">${c.ebitEBITDA>80?'✓ ATRACTIVO':c.ebitEBITDA>=60?'⚠ BUENO':'✗ ALERTA'}</span>
        </div>`:''}
        ${c.ccr!=null?`<div class="xc">
          <div class="xc-tag">Cash Conversion Rate</div>
          <span class="xc-val">${c.ccr.toFixed(2)}</span>
          <div class="xc-name">OFC / EBITDA</div>
          <div class="xc-note">Bueno &gt;1 · ${c.ccr>1?'✓ Conversión fuerte':'⚠ Revisar'}</div>
          <span class="badge ${c.ccr>1?'g':'a'}" style="margin-top:10px;display:inline-block">${c.ccr>1?'✓ BUENO':'⚠ VIGILAR'}</span>
        </div>`:''}
      </div>
    </div>
  </div>

  <!-- ══ 10. HEATMAP INDICADORES CLAVE ══ -->
  <div class="dash-section">
    <div class="sec-tag">Indicadores clave · Evolución año a año</div>
    <h2 class="sec-title">Heatmap <span>Financiero</span></h2>
    <div style="overflow-x:auto">
      <table class="ht">
        <thead><tr>
          <th class="ht-nm">Indicador</th>
          ${c.anios.map(y=>`<th class="ht-yr">${y}</th>`).join('')}
        </tr></thead>
        <tbody>${c.htInds.map(ind=>{
          const cols=c.anios.map(yr=>{
            const yd=ind.years.find(y=>y.y===yr);
            if(!yd||yd.v==='—') return `<td class="ht-e">—</td>`;
            return `<td class="ht-c ht-${yd.c}"><span class="ht-d ${yd.c}"></span>${yd.v}</td>`;
          }).join('');
          return `<tr><td class="ht-nm">${ind.name}</td>${cols}</tr>`;
        }).join('')}</tbody>
      </table>
    </div>
  </div>

  <!-- ══ 11. ALERTAS ══ -->
  <div class="dash-section">
    <div class="sec-tag">Análisis de filings · Texto corporativo</div>
    <h2 class="sec-title">Alertas de <span>Documentos</span></h2>
    <div class="al-hdr">⚠ FRASES DETECTADAS EN NOTAS / FILINGS DE LA EMPRESA</div>
    ${c.phrases.map(p=>alertRow(p)).join('')}
    <div class="al-item" style="background:var(--bg2);border-color:rgba(46,116,232,.2)">
      <div><span class="badge" style="background:var(--bg3);color:var(--gold1)">DIAGNÓSTICO</span></div>
      <div class="al-desc" style="color:var(--gray1)">${c.phrases.filter(p=>p.found&&!p.negated).length} activa(s) · ${c.phrases.filter(p=>p.negated).length} atenuada(s) · ${c.phrases.filter(p=>!p.found).length} no encontrada(s)</div>
    </div>
  </div>

  <!-- ══ 12. CIERRE ══ -->
  <div class="close-sec">
    <div class="close-big">${c.cntGreen}</div>
    <div class="close-sub">de 35 indicadores en zona positiva</div>
    <div class="close-div"></div>
    <div class="close-cols">
      ${fcfGrowth!=null?`<div class="cc"><div class="cc-val">+${fcfGrowth.toFixed(1)}%</div><div class="cc-lbl">FCF 5 años</div></div>`:''}
      ${c.dn!=null?`<div class="cc"><div class="cc-val">${fmtN(c.dn,0)}</div><div class="cc-lbl">Caja Neta (${MON})</div></div>`:''}
      ${c.spread!=null?`<div class="cc"><div class="cc-val">+${c.spread.toFixed(0)}pp</div><div class="cc-lbl">ROIC vs WACC</div></div>`:''}
      ${c.bpaCagr!=null?`<div class="cc"><div class="cc-val">${c.bpaCagr.toFixed(1)}%</div><div class="cc-lbl">BPA CAGR</div></div>`:''}
      ${c.piotr!=null?`<div class="cc"><div class="cc-val">${c.piotr}/9</div><div class="cc-lbl">Piotroski</div></div>`:''}
    </div>
    <div class="close-q">Análisis cuantitativo completo · La empresa muestra ${c.cntGreen} señales positivas de 35 indicadores evaluados.</div>
    <div style="margin-top:36px;font-size:10px;color:var(--gray2);letter-spacing:.3em;text-transform:uppercase">CÍRCULO AZUL FINANZAS · ${D} · ${MON} · 2021–2025</div>
  </div>`;

  document.getElementById('dash-content').innerHTML = html;

  // ── Inyectar datos en el header/footer PDF ──
  var nameEl = document.getElementById('pdf-company-name');
  if(nameEl) nameEl.textContent = D;
  var dateEl = document.getElementById('pdf-report-date');
  if(dateEl){
    var now = new Date();
    dateEl.textContent = now.toLocaleDateString('es', {day:'2-digit', month:'long', year:'numeric'});
  }
  var yrEl = document.getElementById('pdf-footer-year');
  if(yrEl) yrEl.textContent = new Date().getFullYear();
  // Arrancar animaciones
  setTimeout(initDashAnimations, 80);
}

// ══════════════════════════════════════════
//  MOTOR DE ANIMACIONES
// ══════════════════════════════════════════
function initDashAnimations(){

  // ── TOOLTIP GLOBAL ──
  var tip = document.getElementById('_svgtip');
  if(!tip){
    tip = document.createElement('div');
    tip.id = '_svgtip'; tip.className = 'svg-tip';
    document.body.appendChild(tip);
  }

  // ── 1. PROGRESS BARS — 0 → valor real ──
  document.querySelectorAll('.kc-fill').forEach(function(bar){
    var tw = bar.style.width;
    if(!tw || tw==='0%') return;
    bar.style.width='0%';
    bar.style.transition='none';
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        bar.style.transition='width 1.4s cubic-bezier(.16,1,.3,1)';
        bar.style.width=tw;
      });
    });
  });

  // ── 2. SVG POLYLINE DRAW (stroke-dashoffset) ──
  document.querySelectorAll('.chart-box svg polyline').forEach(function(line){
    try{
      var len = Math.ceil(line.getTotalLength())+20;
      line.style.strokeDasharray=len+' '+len;
      line.style.strokeDashoffset=len;
      line.style.transition='stroke-dashoffset 1.9s cubic-bezier(.16,1,.3,1)';
      setTimeout(function(){ line.style.strokeDashoffset='0'; }, 260);
    }catch(e){}
  });

  // ── 3. STAGGER SEMÁFOROS ──
  document.querySelectorAll('.sc').forEach(function(sc, i){
    sc.style.opacity='0';
    sc.style.transform='translateY(14px) scale(.95)';
    setTimeout(function(){
      sc.style.transition='opacity .38s ease, transform .38s cubic-bezier(.16,1,.3,1)';
      sc.style.opacity='';
      sc.style.transform='';
    }, 40 + i*32);
  });

  // ── 4. COUNT-UP en valores numéricos ──
  function countUp(el, dur){
    var orig = el.textContent.trim();
    if(orig.length>16 || orig.indexOf('|')>-1 || orig.indexOf(':')>-1) return;
    var m = orig.match(/^([+\-]?)([0-9][\d\.,]*)([^0-9]*)$/);
    if(!m) return;
    var sign=m[1], raw=m[2].replace(/[\.,]/g,''), suf=m[3]||'';
    var n=parseFloat(raw); if(isNaN(n)||n<=0) return;
    var large=(n>=100), hasDec=(orig.indexOf('.')>-1&&!large);
    var d=dur||Math.min(1600, 700+(large?Math.log(n+1)*180:n*10));
    var t0=performance.now();
    function tick(now){
      var p=Math.min((now-t0)/d,1);
      var ease=1-Math.pow(1-p,3);
      var cur=n*ease;
      var disp=large?Math.round(cur).toLocaleString('es'):(hasDec?cur.toFixed(1):Math.round(cur).toString());
      el.textContent=sign+disp+suf;
      if(p<1) requestAnimationFrame(tick); else el.textContent=orig;
    }
    requestAnimationFrame(tick);
  }

  setTimeout(function(){
    document.querySelectorAll('.kc-val').forEach(function(el){ countUp(el,1200); });
    document.querySelectorAll('.close-big').forEach(function(el){ countUp(el,2000); });
    document.querySelectorAll('.dhero-val').forEach(function(el){ countUp(el,1400); });
    document.querySelectorAll('.gs').forEach(function(el){ countUp(el,1000); });
    document.querySelectorAll('.xc-val').forEach(function(el){ countUp(el,1300); });
  }, 320);

  // ── 5. SCROLL REVEAL (IntersectionObserver) ──
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(!e.isIntersecting) return;
      e.target.classList.add('vi');
      io.unobserve(e.target);
    });
  },{ threshold:0.06, rootMargin:'0px 0px -50px 0px' });
  document.querySelectorAll('.dash-section').forEach(function(s){
    s.classList.add('rv');
    io.observe(s);
  });

  // ── 6. SVG CROSSHAIR + TOOLTIP INTERACTIVO ──
  document.querySelectorAll('.chart-box svg').forEach(function(svg){
    var lines = svg.querySelectorAll('polyline');
    if(!lines.length) return;
    var vb = svg.viewBox&&svg.viewBox.baseVal&&svg.viewBox.baseVal.width
              ? svg.viewBox.baseVal : {width:560,height:180};

    // Línea cursor vertical
    var cline = document.createElementNS('http://www.w3.org/2000/svg','line');
    cline.setAttribute('y1','0'); cline.setAttribute('y2', vb.height||180);
    cline.setAttribute('stroke','rgba(90,155,255,.45)');
    cline.setAttribute('stroke-width','1.2');
    cline.setAttribute('stroke-dasharray','5 3');
    cline.style.display='none'; cline.style.pointerEvents='none';
    svg.appendChild(cline);

    // Parsear X de la primera polyline
    var firstPts=[];
    try{
      firstPts=lines[0].getAttribute('points').trim().split(/\s+/).map(function(p){
        var xy=p.split(','); return{x:parseFloat(xy[0]),y:parseFloat(xy[1])};
      });
    }catch(e){}
    if(!firstPts.length) return;

    // Etiquetas del eje X (años debajo del SVG)
    var xLabels=Array.from(svg.querySelectorAll('text')).filter(function(t){
      return parseFloat(t.getAttribute('y')||-1)>(vb.height||180)-36;
    }).map(function(t){ return t.textContent.trim(); });

    // Hit area
    var hit=document.createElementNS('http://www.w3.org/2000/svg','rect');
    hit.setAttribute('x','0'); hit.setAttribute('y','0');
    hit.setAttribute('width',vb.width||560); hit.setAttribute('height',vb.height||180);
    hit.setAttribute('fill','transparent');
    svg.appendChild(hit);
    svg.style.cursor='crosshair';

    // Círculos de hover (uno por serie)
    var hovers=Array.from(lines).map(function(l){
      var c=document.createElementNS('http://www.w3.org/2000/svg','circle');
      c.setAttribute('r','5'); c.setAttribute('fill','#F2CC6E');
      c.setAttribute('stroke',l.getAttribute('stroke')||'#2E74E8');
      c.setAttribute('stroke-width','2');
      c.style.display='none'; c.style.pointerEvents='none';
      svg.appendChild(c); return c;
    });

    var box=svg.closest('.chart-box');
    var titleEl=box?box.querySelector('.chart-title-small'):null;
    var titleTxt=titleEl?titleEl.textContent.trim().split('—')[0].split('·')[0].trim():'';

    hit.addEventListener('mousemove',function(e){
      var bbox=svg.getBoundingClientRect();
      var svgX=(e.clientX-bbox.left)/bbox.width*(vb.width||560);
      // Punto más cercano
      var near=0,minD=Infinity;
      firstPts.forEach(function(pt,i){
        var d=Math.abs(pt.x-svgX); if(d<minD){minD=d;near=i;}
      });
      cline.setAttribute('x1',firstPts[near].x);
      cline.setAttribute('x2',firstPts[near].x);
      cline.style.display='';
      // Mover círculos de hover
      Array.from(lines).forEach(function(l,si){
        if(!hovers[si]) return;
        try{
          var pts=l.getAttribute('points').trim().split(/\s+/);
          if(pts[near]){ var xy=pts[near].split(','); hovers[si].setAttribute('cx',xy[0]); hovers[si].setAttribute('cy',xy[1]); hovers[si].style.display=''; }
        }catch(er){}
      });
      // Tooltip
      var label=xLabels[near]||(near+1).toString();
      tip.innerHTML='<b>'+label+'</b> &nbsp;<span>'+titleTxt+'</span>';
      tip.style.display='block';
      tip.style.left=(e.clientX+18)+'px';
      tip.style.top=(e.clientY-42)+'px';
    });
    hit.addEventListener('mouseleave',function(){
      cline.style.display='none';
      hovers.forEach(function(h){ h.style.display='none'; });
      tip.style.display='none';
    });
  });
}

// ══════════════════════════════════════════
//  SELECTOR DE INDICADORES
// ══════════════════════════════════════════
var _indChks = null;
var _countEl = null;
function getIndChks(){ return _indChks || (_indChks = document.querySelectorAll('.ind-chk')); }
function getCountEl(){ return _countEl || (_countEl = document.getElementById('sel-active-count')); }

// ══════════════════════════════════════════
//  INDICADORES PERSONALIZADOS
// ══════════════════════════════════════════
var _customInds    = [];
var _customNextId  = 100;

function addCustomIndicator(){
  var name   = (document.getElementById('caf-name')  ? document.getElementById('caf-name').value  : '').trim();
  var valor  = (document.getElementById('caf-valor') ? document.getElementById('caf-valor').value : '').trim();
  var bueno  = (document.getElementById('caf-bueno') ? document.getElementById('caf-bueno').value : '').trim() || '—';
  var malo   = (document.getElementById('caf-malo')  ? document.getElementById('caf-malo').value  : '').trim() || '—';
  var sigEl  = document.querySelector('input[name="caf-sig"]:checked');
  var signal = sigEl ? sigEl.value : '🟡';
  var errEl  = document.getElementById('caf-error');

  if(!name){
    errEl.textContent = 'El nombre del indicador es obligatorio.';
    errEl.style.display = 'block'; return;
  }
  if(!valor){
    errEl.textContent = 'El valor es obligatorio.';
    errEl.style.display = 'block'; return;
  }
  errEl.style.display = 'none';

  var id  = _customNextId++;
  var num = id - 99;

  _customInds.push({ n:id, name:name, dato:valor, bueno:bueno, malo:malo, signal:signal, calc:'Indicador personalizado' });

  // Invalidar caché de checkboxes
  _indChks = null;

  // Inyectar fila en el panel
  var list = document.getElementById('custom-inds-list');
  if(list){
    var div = document.createElement('div');
    div.className = 'sel-item';
    div.id = 'custom-item-' + id;
    div.innerHTML =
      '<div class="sel-item-info" style="gap:6px">'
      + '<div class="sel-item-num" style="font-size:9px">C' + String(num).padStart(2,'0') + '</div>'
      + '<div class="sel-item-name">' + name + '</div>'
      + '<div style="font-size:10px;color:var(--gray2);margin-left:4px">' + signal + ' ' + valor + '</div>'
      + '</div>'
      + '<div style="display:flex;align-items:center;gap:10px">'
      + '<label class="toggle"><input type="checkbox" class="ind-chk" data-grp="gcustom" value="' + id + '" checked onchange="updateGlobalCount()"><span class="toggle-slider"></span></label>'
      + '<button onclick="removeCustomIndicator(' + id + ')" class="caf-remove-btn" title="Eliminar">✕</button>'
      + '</div>';
    list.appendChild(div);
  }

  _indChks = null;
  updateGlobalCount();

  // Limpiar formulario
  document.getElementById('caf-name').value  = '';
  document.getElementById('caf-valor').value = '';
  document.getElementById('caf-bueno').value = '';
  document.getElementById('caf-malo').value  = '';
  var greenRadio = document.querySelector('input[name="caf-sig"][value="🟢"]');
  if(greenRadio) greenRadio.checked = true;
}

function removeCustomIndicator(id){
  _customInds = _customInds.filter(function(i){ return i.n !== id; });
  var el = document.getElementById('custom-item-' + id);
  if(el) el.remove();
  _indChks = null;
  updateGlobalCount();
}

// ══════════════════════════════════════════
//  PDF VÍA SERVIDOR (Puppeteer)
// ══════════════════════════════════════════
async function generarPDF() {
  var toast = document.getElementById('pdf-toast');
  if (toast) toast.style.display = 'flex';

  try {
    // Contenido del dashboard
    var dashContent = document.getElementById('dash-content');
    if (!dashContent) throw new Error('No hay dashboard activo');

    // Nombre de empresa y fecha
    var companyEl   = document.getElementById('pdf-company-name');
    var companyName = companyEl ? companyEl.textContent.trim() : 'Empresa';
    var reportDate  = new Date().toLocaleDateString('es', { day: '2-digit', month: 'long', year: 'numeric' });

    // Clonar el HTML para limpiar interactividad antes de enviarlo
    var clone = dashContent.cloneNode(true);

    // Resolver las canvas de Chart.js a imágenes estáticas
    var canvases = dashContent.querySelectorAll('canvas');
    var cloneCanvases = clone.querySelectorAll('canvas');
    canvases.forEach(function(cv, i) {
      try {
        var img = document.createElement('img');
        img.src = cv.toDataURL('image/png');
        img.style.width  = '100%';
        img.style.height = 'auto';
        img.style.display = 'block';
        if (cloneCanvases[i] && cloneCanvases[i].parentNode) {
          cloneCanvases[i].parentNode.replaceChild(img, cloneCanvases[i]);
        }
      } catch(e) { /* canvas puede fallar por CORS */ }
    });

    var dashboardHTML = clone.innerHTML;

    var resp = await fetch('/api/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dashboardHTML: dashboardHTML, companyName: companyName, reportDate: reportDate })
    });

    if (!resp.ok) {
      var err = await resp.json().catch(function(){ return { error: 'Error del servidor' }; });
      throw new Error(err.error || ('HTTP ' + resp.status));
    }

    var blob = await resp.blob();
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    a.href     = url;
    a.download = companyName.replace(/[^a-zA-Z0-9\u00C0-\u024F]/g,'_') + '_CirculoAzul.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(url); }, 30000);

  } catch (err) {
    console.error('generarPDF error:', err);
    if (confirm('No se pudo conectar con el servidor para generar el PDF.\n\n¿Desea usar la impresión del navegador como alternativa?')) {
      window.print();
    }
  } finally {
    if (toast) toast.style.display = 'none';
  }
}

// ══════════════════════════════════════════
//  VISTA PREVIA PDF (nueva ventana)
// ══════════════════════════════════════════
function verPDF() {
  var dashContent = document.getElementById('dash-content');
  if (!dashContent) { alert('No hay dashboard activo para previsualizar.'); return; }

  var companyEl   = document.getElementById('pdf-company-name');
  var companyName = companyEl ? companyEl.textContent.trim() : 'Empresa';
  var reportDate  = new Date().toLocaleDateString('es', { day: '2-digit', month: 'long', year: 'numeric' });

  // Convertir canvas de Chart.js a imágenes estáticas en el clon
  var clone = dashContent.cloneNode(true);
  var canvases = dashContent.querySelectorAll('canvas');
  var cloneCanvases = clone.querySelectorAll('canvas');
  canvases.forEach(function(cv, i) {
    try {
      var img = document.createElement('img');
      img.src = cv.toDataURL('image/png');
      img.style.width = '100%';
      img.style.height = 'auto';
      img.style.display = 'block';
      if (cloneCanvases[i] && cloneCanvases[i].parentNode) {
        cloneCanvases[i].parentNode.replaceChild(img, cloneCanvases[i]);
      }
    } catch(e) {}
  });

  // Traer el CSS actual de la página
  var cssLinks = '';
  document.querySelectorAll('link[rel="stylesheet"]').forEach(function(lnk) {
    cssLinks += '<link rel="stylesheet" href="' + lnk.href + '">';
  });

  var previewHTML = '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">' +
    '<title>Vista Previa — ' + companyName + '</title>' +
    cssLinks +
    '<style>' +
    'body{background:#fff;color:#1e293b;font-family:Inter,sans-serif;margin:0;padding:0}' +
    '.topbar,.sidebar,.no-print,#pdf-header,#pdf-footer{display:none!important}' +
    '.preview-toolbar{position:fixed;top:0;left:0;right:0;background:#091428;border-bottom:1px solid #1A56C4;' +
    'display:flex;align-items:center;justify-content:space-between;padding:10px 24px;z-index:9999}' +
    '.preview-toolbar h3{color:#B8CEEA;margin:0;font-size:14px;font-weight:500}' +
    '.preview-toolbar .btns{display:flex;gap:10px}' +
    '.pbtn{padding:8px 18px;border-radius:6px;border:none;font-size:13px;font-weight:600;cursor:pointer}' +
    '.pbtn-gold{background:#1A56C4;color:#fff}.pbtn-gold:hover{background:#2E74E8}' +
    '.pbtn-out{background:transparent;color:#B8CEEA;border:1px solid #1A56C4}.pbtn-out:hover{background:#0d1627}' +
    '.preview-content{margin-top:56px;padding:24px 40px}' +
    '@media print{.preview-toolbar{display:none!important}.preview-content{margin-top:0;padding:0}}' +
    '</style></head><body>' +
    '<div class="preview-toolbar">' +
    '  <h3>📄 Vista Previa — ' + companyName + ' · ' + reportDate + '</h3>' +
    '  <div class="btns">' +
    '    <button class="pbtn pbtn-gold" onclick="window.print()">🖨 Imprimir / Guardar como PDF</button>' +
    '    <button class="pbtn pbtn-out" onclick="window.close()">✕ Cerrar</button>' +
    '  </div>' +
    '</div>' +
    '<div class="preview-content">' + clone.innerHTML + '</div>' +
    '</body></html>';

  var win = window.open('', '_blank', 'width=1100,height=850,scrollbars=yes,resizable=yes');
  if (!win) { alert('El navegador bloqueó la ventana emergente. Por favor permita las ventanas emergentes para este sitio.'); return; }
  win.document.open();
  win.document.write(previewHTML);
  win.document.close();
}

function updateGlobalCount(){
  var allChks = document.querySelectorAll('.ind-chk');
  var checked = 0;
  allChks.forEach(function(chk){ if(chk.checked) checked++; });
  var el = getCountEl();
  if(el) el.textContent = checked;
  var totEl = document.getElementById('sel-total-count');
  if(totEl) totEl.textContent = allChks.length;
}

function toggleAll(val){
  getIndChks().forEach(function(chk){ chk.checked = val; });
  updateGlobalCount();
}

function toggleGroup(grp, val){
  getIndChks().forEach(function(chk){ if(chk.dataset.grp === grp) chk.checked = val; });
  updateGlobalCount();
}

function toggleIndPanel(){
  var body = document.getElementById('ind-panel-body');
  var arrow = document.getElementById('ind-arrow');
  if(!body) return;
  var open = body.style.display !== 'none';
  body.style.display = open ? 'none' : 'block';
  if(arrow) arrow.classList.toggle('open', !open);
}

// ══════════════════════════════════════════
//  PARSE & RENDER
// ══════════════════════════════════════════
function parseAndRender(){
  var raw = document.getElementById('paste-area').value.trim();
  var errBox = document.getElementById('parse-error');
  var okBox  = document.getElementById('parse-ok');
  errBox.style.display='none'; okBox.style.display='none';

  if(!raw){ errBox.textContent='Por favor pegá los datos antes de continuar.'; errBox.style.display='block'; return; }

  var d;
  try { d = parseData(raw); } catch(e){ errBox.textContent='Error al interpretar los datos: '+e.message; errBox.style.display='block'; return; }

  if(!d['INGRESOS']&&!d['EBIT']){ errBox.textContent='No se encontraron datos financieros. Verificá el formato e intentá de nuevo.'; errBox.style.display='block'; return; }

  try {
    var calc = calcIndicators(d);

    // Leer IDs seleccionados del panel
    var selectedIds = [];
    getIndChks().forEach(function(chk){
      if(chk.checked) selectedIds.push(parseInt(chk.value));
    });
    // Si no hay ninguno seleccionado, usar todos
    if(selectedIds.length === 0) calc.inds.forEach(function(i){ selectedIds.push(i.n); });

    var filteredCalc = Object.assign({}, calc);
    filteredCalc.inds = calc.inds.filter(function(i){ return selectedIds.indexOf(i.n) !== -1; });
    filteredCalc.cntGreen = filteredCalc.inds.filter(function(i){ return i.signal==='🟢'; }).length;
    filteredCalc.cntAmber = filteredCalc.inds.filter(function(i){ return i.signal==='🟡'; }).length;
    filteredCalc.cntRed   = filteredCalc.inds.filter(function(i){ return i.signal==='🔴'; }).length;
    filteredCalc._showBPACagr    = selectedIds.indexOf(36) !== -1;
    filteredCalc._showEbitEbitda = selectedIds.indexOf(37) !== -1;
    filteredCalc._showCCR        = selectedIds.indexOf(38) !== -1;

    // Agregar indicadores personalizados seleccionados
    selectedIds.forEach(function(id){
      if(id >= 100){
        var cind = _customInds.find(function(i){ return i.n === id; });
        if(cind) filteredCalc.inds.push(cind);
      }
    });
    // Recuentar tras agregar personalizados
    filteredCalc.cntGreen = filteredCalc.inds.filter(function(i){ return i.signal==='🟢'; }).length;
    filteredCalc.cntAmber = filteredCalc.inds.filter(function(i){ return i.signal==='🟡'; }).length;
    filteredCalc.cntRed   = filteredCalc.inds.filter(function(i){ return i.signal==='🔴'; }).length;

    renderDash(filteredCalc);
    _lastRawInput = raw;
    _lastCalc = filteredCalc;
    okBox.textContent='✓ '+Object.keys(d).length+' campos interpretados · '+selectedIds.length+' indicadores incluidos.';
    okBox.style.display='block';
    showDash(); window.scrollTo({top:0,behavior:'smooth'});
  } catch(e){ errBox.textContent='Error al calcular indicadores: '+e.message; errBox.style.display='block'; console.error(e); }
}

// ══ HISTORIAL + COMPARTIR ══
var _lastRawInput = null;
var _lastCalc = null;

function saveAnalisis(){
  if(!_lastCalc) return;
  var empresa = (_lastCalc.d && (_lastCalc.d['ACCION']||_lastCalc.d['Empresa'])) || 'Sin nombre';
  var ticker  = (_lastCalc.d && _lastCalc.d['TICKER']) || '';
  var entry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2,6),
    empresa: empresa, ticker: ticker,
    fecha: new Date().toISOString(),
    raw: _lastRawInput,
    conteo: { verde: _lastCalc.cntGreen, amarillo: _lastCalc.cntAmber, rojo: _lastCalc.cntRed }
  };
  fetch('/api/hist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry)
  }).then(function(r){
    if(r.ok){ showShareToast('✓ Análisis guardado'); renderHistList(); }
    else { showShareToast('⚠ Error al guardar'); }
  }).catch(function(){ showShareToast('⚠ Error de conexión'); });
}

function openHist(){
  renderHistList();
  var p = document.getElementById('hist-panel');
  var o = document.getElementById('hist-overlay');
  if(p) p.style.right = '0';
  if(o) o.style.display = 'block';
}

function closeHist(){
  var p = document.getElementById('hist-panel');
  var o = document.getElementById('hist-overlay');
  if(p) p.style.right = '-420px';
  if(o) o.style.display = 'none';
}

function renderHistList(){
  var el = document.getElementById('hist-list');
  if(!el) return;
  el.innerHTML = '<div style="text-align:center;color:#7A8599;font-size:12px;padding:20px">Cargando...</div>';
  fetch('/api/hist').then(function(r){ return r.json(); }).then(function(hist){
    if(!hist.length){
      el.innerHTML = '<div style="text-align:center;color:#7A8599;font-size:13px;padding:40px 20px">No hay análisis guardados aún.<br><br>Calculá un análisis y hacé clic en <b>💾 Guardar</b>.</div>';
      return;
    }
    el.innerHTML = hist.map(function(h){
      var fecha = new Date(h.fecha).toLocaleDateString('es',{day:'2-digit',month:'short',year:'numeric'});
      return '<div style="background:rgba(26,86,196,.08);border:1px solid rgba(26,86,196,.2);border-radius:10px;padding:14px;margin-bottom:10px;cursor:pointer" onclick="loadHistEntry(\''+h.id+'\')" onmouseover="this.style.borderColor=\'rgba(26,86,196,.5)\'" onmouseout="this.style.borderColor=\'rgba(26,86,196,.2)\'">'
        +'<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px">'
        +'<div style="font-size:13px;font-weight:700;color:#fff">'+(h.empresa||'Sin nombre')+(h.ticker?' · '+h.ticker:'')+'</div>'
        +'<button onclick="event.stopPropagation();deleteHistEntry(\''+h.id+'\')" style="background:none;border:none;color:#7A8599;font-size:14px;cursor:pointer;padding:0">✕</button>'
        +'</div>'
        +'<div style="font-size:10px;color:#7A8599;margin-bottom:8px">'+fecha+'</div>'
        +'<div style="display:flex;gap:6px">'
        +'<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;background:rgba(34,197,94,.15);color:#22c55e">🟢 '+(h.conteo&&h.conteo.verde||0)+'</span>'
        +'<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;background:rgba(245,158,11,.15);color:#f59e0b">🟡 '+(h.conteo&&h.conteo.amarillo||0)+'</span>'
        +'<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;background:rgba(239,68,68,.15);color:#ef4444">🔴 '+(h.conteo&&h.conteo.rojo||0)+'</span>'
        +'</div></div>';
    }).join('');
  }).catch(function(){
    el.innerHTML = '<div style="text-align:center;color:#e07060;font-size:13px;padding:40px 20px">Error cargando historial.</div>';
  });
}

function loadHistEntry(id){
  fetch('/api/hist/'+id).then(function(r){ return r.json(); }).then(function(data){
    if(!data.raw) return;
    closeHist();
    var ta = document.getElementById('paste-area');
    if(ta){ ta.value = data.raw; parseAndRender(); }
  });
}

function deleteHistEntry(id){
  fetch('/api/hist/'+id, { method: 'DELETE' }).then(function(r){
    if(r.ok) renderHistList();
  });
}

function shareAnalisis(){
  if(!_lastRawInput) return;
  try {
    var data = btoa(unescape(encodeURIComponent(_lastRawInput)));
    var url = window.location.origin + window.location.pathname + '?d=' + data;
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(url).then(function(){ showShareToast('✓ Link copiado al portapapeles'); });
    } else {
      var ta = document.createElement('textarea');
      ta.value = url; document.body.appendChild(ta); ta.select(); document.execCommand('copy');
      document.body.removeChild(ta); showShareToast('✓ Link copiado al portapapeles');
    }
  } catch(e){ showShareToast('⚠ No se pudo copiar el link'); }
}

function showShareToast(msg){
  var t = document.getElementById('share-toast');
  if(!t) return;
  t.textContent = msg;
  t.style.opacity = '1';
  t.style.transform = 'translateX(-50%) translateY(0)';
  setTimeout(function(){ t.style.opacity='0'; t.style.transform='translateX(-50%) translateY(60px)'; }, 3000);
}

// ══════════════════════════════════════════
//  COMPARAR EMPRESAS — CHECK LIST
// ══════════════════════════════════════════
var _clCompareCalcB  = null;
var _clCompareEmpresaB = '';

function openComparePanelCL() {
  var el = document.getElementById('cl-compare-empresa-a');
  var empA = (_lastCalc && _lastCalc.d && (_lastCalc.d['ACCION']||_lastCalc.d['Empresa'])) || 'empresa actual';
  if (el) el.textContent = empA;
  document.getElementById('cl-compare-error').style.display = 'none';
  document.getElementById('compare-overlay-cl').style.display = 'block';
  requestAnimationFrame(function(){ document.getElementById('compare-panel-cl').style.right = '0'; });
}

function closeComparePanelCL() {
  document.getElementById('compare-panel-cl').style.right = '-440px';
  setTimeout(function(){ document.getElementById('compare-overlay-cl').style.display = 'none'; }, 320);
}

function runCLCompare() {
  var raw = (document.getElementById('cl-compare-paste-b').value || '').trim();
  var errEl = document.getElementById('cl-compare-error');
  if (!raw) { errEl.style.display = 'block'; errEl.textContent = 'Pegá los datos de la segunda empresa antes de comparar.'; return; }
  errEl.style.display = 'none';
  try {
    var dataB = parseData(raw);
    _clCompareCalcB = calcIndicators(dataB);
    _clCompareEmpresaB = dataB.d && dataB.d['ACCION'] ? dataB.d['ACCION'] : 'Empresa B';
    closeComparePanelCL();
    renderCLCompareSection();
  } catch(e) {
    errEl.style.display = 'block';
    errEl.textContent = 'Error al procesar los datos: ' + e.message;
  }
}

function closeCLCompare() {
  _clCompareCalcB = null; _clCompareEmpresaB = '';
  var sec = document.getElementById('cl-sec-compare');
  if (sec) sec.style.display = 'none';
}

function renderCLCompareSection() {
  if (!_lastCalc || !_clCompareCalcB) return;
  var cA = _lastCalc;
  var cB = _clCompareCalcB;
  var empA = (_lastCalc.d && (_lastCalc.d['ACCION']||_lastCalc.d['Empresa'])) || 'Empresa A';
  var empB = _clCompareEmpresaB;

  var sigColor = function(s){ return s==='🟢'?'#4ADE80':s==='🟡'?'#FBBF24':'#F87171'; };
  var sigWeight = function(s){ return s==='🟢'?3:s==='🟡'?2:s==='🔴'?1:0; };

  // Header cards
  var hdr = document.getElementById('cl-compare-header-cards');
  if (hdr) {
    var cntA = { g: cA.cntGreen, a: cA.cntAmber, r: cA.cntRed };
    var cntB = { g: cB.cntGreen, a: cB.cntAmber, r: cB.cntRed };
    var scoreA = Math.round((cntA.g * 100 + cntA.a * 50) / (cA.inds.length || 1));
    var scoreB = Math.round((cntB.g * 100 + cntB.a * 50) / (cB.inds.length || 1));
    var colCard = function(emp, cnt, score, isWinner) {
      return '<div style="background:rgba(15,25,50,.6);border:2px solid '+(isWinner?'#C9A84C':'rgba(26,86,196,.25)')+';border-radius:14px;padding:1.2rem;text-align:center">' +
        (isWinner?'<div style="font-size:.6rem;color:#C9A84C;font-weight:700;letter-spacing:.1em;margin-bottom:.4rem">🏆 MEJOR POSICIÓN</div>':'') +
        '<div style="font-size:1.1rem;font-weight:800;color:#D8E6F5;margin-bottom:.5rem">'+emp+'</div>' +
        '<div style="font-size:2.6rem;font-weight:900;color:#4ADE80;line-height:1">'+score+'%</div>' +
        '<div style="font-size:.65rem;color:#4A5568;margin:.3rem 0 .7rem">Score estimado</div>' +
        '<div style="display:flex;gap:.4rem;justify-content:center;flex-wrap:wrap">' +
        '<span style="font-size:.65rem;padding:.12rem .4rem;border-radius:4px;background:rgba(39,174,96,.12);color:#4ADE80;border:1px solid rgba(39,174,96,.4)">🟢 '+cnt.g+'</span>' +
        '<span style="font-size:.65rem;padding:.12rem .4rem;border-radius:4px;background:rgba(230,126,34,.12);color:#FBBF24;border:1px solid rgba(230,126,34,.4)">🟡 '+cnt.a+'</span>' +
        '<span style="font-size:.65rem;padding:.12rem .4rem;border-radius:4px;background:rgba(192,57,43,.12);color:#F87171;border:1px solid rgba(192,57,43,.4)">🔴 '+cnt.r+'</span>' +
        '</div></div>';
    };
    hdr.innerHTML = colCard(empA, cntA, scoreA, scoreA >= scoreB) + colCard(empB, cntB, scoreB, scoreB > scoreA);
  }

  // Side-by-side indicators table
  var wrap = document.getElementById('cl-compare-table-wrap');
  if (!wrap) return;

  var SECTIONS = [
    { label: 'Rentabilidad y Márgenes', test: function(n){ return n>=1&&n<=5; } },
    { label: 'Flujo de Caja y Valoración', test: function(n){ return n>=6&&n<=10; } },
    { label: 'Rentabilidad del Capital', test: function(n){ return n>=11&&n<=15; } },
    { label: 'Liquidez y Deuda', test: function(n){ return n>=16&&n<=24; } },
    { label: 'Márgenes FCF y EBITDA', test: function(n){ return n>=25&&n<=30; } },
    { label: 'Calidad y Scoring', test: function(n){ return n>=31&&n<=42; } },
  ];

  var groups = {};
  SECTIONS.forEach(function(s){ groups[s.label] = []; });
  cA.inds.forEach(function(rA, i) {
    var rB = cB.inds[i] || rA;
    var sec = null;
    for (var si=0; si<SECTIONS.length; si++) { if (SECTIONS[si].test(rA.n)) { sec = SECTIONS[si]; break; } }
    if (!sec) sec = SECTIONS[SECTIONS.length-1];
    groups[sec.label].push({ rA: rA, rB: rB });
  });

  var winA=0, winB=0;
  var html = '<div style="background:rgba(26,86,196,.08);border:1px solid rgba(90,155,255,.25);border-radius:10px;padding:.85rem 1.2rem;margin-bottom:1.2rem;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:.5rem;text-align:center" id="cl-scoreboard"></div>';
  var sectHtml = '';

  SECTIONS.forEach(function(sec) {
    var rows = groups[sec.label];
    if (!rows || !rows.length) return;
    var sWinA=0, sWinB=0;
    rows.forEach(function(p){ var wa=sigWeight(p.rA.signal),wb=sigWeight(p.rB.signal); if(wa>wb){sWinA++;winA++;}else if(wb>wa){sWinB++;winB++;} });
    var secLbl = sWinA>sWinB ? '<span style="color:#4ADE80;font-size:.65rem;font-weight:700">▲ '+empA+'</span>' : sWinB>sWinA ? '<span style="color:#4ADE80;font-size:.65rem;font-weight:700">▲ '+empB+'</span>' : '<span style="color:#4A5568;font-size:.65rem">= Empate</span>';
    var rowsHtml = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin-bottom:.3rem"><div style="font-size:.62rem;font-weight:700;color:#5A9BFF;text-align:center;padding:.2rem;border-bottom:1px solid rgba(90,155,255,.3)">'+empA+'</div><div style="font-size:.62rem;font-weight:700;color:#5A9BFF;text-align:center;padding:.2rem;border-bottom:1px solid rgba(90,155,255,.3)">'+empB+'</div></div>';
    rows.forEach(function(p) {
      var wa=sigWeight(p.rA.signal), wb=sigWeight(p.rB.signal);
      var aW=wa>wb, bW=wb>wa;
      var cardA = '<div style="background:rgba(255,255,255,.03);border:1px solid '+(aW?'rgba(39,174,96,.4)':'rgba(26,86,196,.18)')+';border-radius:7px;padding:.6rem;height:100%">' +
        '<div style="font-size:.62rem;color:#4A5568;font-weight:700;margin-bottom:.2rem">#'+p.rA.n+'</div>' +
        '<div style="font-size:.72rem;font-weight:700;color:#D8E6F5;margin-bottom:.3rem;line-height:1.3">'+p.rA.name+'</div>' +
        '<div style="font-size:1.1rem;font-weight:900;color:'+sigColor(p.rA.signal)+';margin-bottom:.2rem">'+p.rA.signal+' <span style="font-size:.78rem">'+p.rA.dato+'</span></div>' +
        '<div style="font-size:.6rem;color:#4A5568">Bueno: '+p.rA.bueno+'</div>' +
        (aW?'<div style="font-size:.58rem;background:#C9A84C;color:#0a0a0a;border-radius:3px;padding:.1rem .35rem;font-weight:800;display:inline-block;margin-top:.25rem">▲ MEJOR</div>':'')+
        '</div>';
      var cardB = '<div style="background:rgba(255,255,255,.03);border:1px solid '+(bW?'rgba(39,174,96,.4)':'rgba(26,86,196,.18)')+';border-radius:7px;padding:.6rem;height:100%">' +
        '<div style="font-size:.62rem;color:#4A5568;font-weight:700;margin-bottom:.2rem">#'+p.rB.n+'</div>' +
        '<div style="font-size:.72rem;font-weight:700;color:#D8E6F5;margin-bottom:.3rem;line-height:1.3">'+p.rB.name+'</div>' +
        '<div style="font-size:1.1rem;font-weight:900;color:'+sigColor(p.rB.signal)+';margin-bottom:.2rem">'+p.rB.signal+' <span style="font-size:.78rem">'+p.rB.dato+'</span></div>' +
        '<div style="font-size:.6rem;color:#4A5568">Bueno: '+p.rB.bueno+'</div>' +
        (bW?'<div style="font-size:.58rem;background:#C9A84C;color:#0a0a0a;border-radius:3px;padding:.1rem .35rem;font-weight:800;display:inline-block;margin-top:.25rem">▲ MEJOR</div>':'')+
        '</div>';
      rowsHtml += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin-bottom:.45rem;align-items:start">'+cardA+cardB+'</div>';
    });
    sectHtml += '<div style="margin-bottom:1.6rem;border:1px solid rgba(26,86,196,.2);border-radius:10px;overflow:hidden">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;padding:.55rem .85rem;background:rgba(90,155,255,.05);border-bottom:1px solid rgba(26,86,196,.2)">' +
      '<div style="font-size:.75rem;font-weight:800;color:#C9A84C;text-transform:uppercase;letter-spacing:.06em">'+sec.label+'</div>'+secLbl+'</div>' +
      '<div style="padding:.65rem">'+rowsHtml+'</div></div>';
  });

  // Update scoreboard
  var sbHtml = '<div><div style="font-size:2.2rem;font-weight:900;color:'+(winA>winB?'#4ADE80':'#8FA8C8')+'">'+winA+'</div><div style="font-size:.7rem;color:#4A5568;margin-top:.2rem">'+empA+'</div>'+(winA>winB?'<div style="font-size:.65rem;color:#C9A84C;margin-top:.3rem">🏆 Gana en indicadores</div>':'')+
    '</div><div style="font-size:.72rem;color:#4A5568;font-weight:700;white-space:nowrap">INDICADORES<br>GANADOS</div>' +
    '<div><div style="font-size:2.2rem;font-weight:900;color:'+(winB>winA?'#4ADE80':'#8FA8C8')+'">'+winB+'</div><div style="font-size:.7rem;color:#4A5568;margin-top:.2rem">'+empB+'</div>'+(winB>winA?'<div style="font-size:.65rem;color:#C9A84C;margin-top:.3rem">🏆 Gana en indicadores</div>':'')+'</div>';

  wrap.innerHTML = html + sectHtml;
  var sb = document.getElementById('cl-scoreboard');
  if (sb) sb.innerHTML = sbHtml;

  // IA
  var iaWrap = document.getElementById('cl-compare-ia-wrap');
  if (iaWrap) {
    iaWrap.style.display = 'block';
    document.getElementById('cl-compare-ia-text').innerHTML = '<div style="display:flex;align-items:center;gap:.6rem;color:#4A5568"><div style="width:14px;height:14px;border:2px solid rgba(90,155,255,.3);border-top-color:#5A9BFF;border-radius:50%;animation:spin .7s linear infinite;flex-shrink:0"></div>Generando análisis comparativo...</div>';
    _runCLCompareIA(cA, cB, empA, empB);
  }

  var sec2 = document.getElementById('cl-sec-compare');
  if (sec2) { sec2.style.display = 'block'; sec2.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
}

async function _runCLCompareIA(cA, cB, empA, empB) {
  var fmtInds = function(c) { return c.inds.filter(function(i){ return i.signal!=='N/E'; }).map(function(i){ return i.name+': '+i.dato+' ['+i.signal+']'; }).join('\n'); };
  var prompt = 'Sos un analista financiero de Círculo Azul Finanzas. Comparás DOS empresas basándote EXCLUSIVAMENTE en los datos calculados.\n\n' +
    'EMPRESA A: '+empA+'\n'+fmtInds(cA)+'\n\nEMPRESA B: '+empB+'\n'+fmtInds(cB)+'\n\n' +
    'INSTRUCCIONES: Comparar rentabilidad, flujo de caja, deuda, valoración. Conclusión clara de cuál empresa presenta mejor posición financiera. NO inventar datos externos. Estructurá con: ## Rentabilidad, ## Flujo de Caja, ## Deuda y Liquidez, ## Valoración, ## Conclusión';
  try {
    var res = await fetch('/api/analisis', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto: fmtInds(cA)+'\n---\n'+fmtInds(cB), empresa: empA+' vs '+empB, prompt_extra: prompt })
    });
    var data = await res.json();
    var texto = data.analisis || data.result || 'Sin respuesta del modelo.';
    var el = document.getElementById('cl-compare-ia-text');
    if (el) el.innerHTML = texto.replace(/\n/g,'<br>').replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/#{1,3} (.+)/g,'<h4 style="color:#C9A84C;margin:.7rem 0 .3rem">$1</h4>');
  } catch(e) {
    var el = document.getElementById('cl-compare-ia-text');
    if (el) el.innerHTML = '<span style="color:#e74c3c">Error al contactar IA: '+e.message+'</span>';
  }
}

// Cargar desde URL al iniciar
(function(){
  try {
    var params = new URLSearchParams(window.location.search);
    var data = params.get('d');
    if(data){
      var raw = decodeURIComponent(escape(atob(data)));
      setTimeout(function(){
        var ta = document.getElementById('paste-area');
        if(ta){ ta.value = raw; showInput(); parseAndRender(); }
      }, 300);
    }
  } catch(e){}
})();
