// ── ranges.js — 43 Indicadores Acciones 360 ───────────────────────────────────
// Cada indicador define: id, número, nombre, fórmula, fuente, rangos de color,
// función de interpretación, y a qué gráfica pertenece.

const INDICATORS = [

  // ────────────────────── BLOQUE I: RENTABILIDAD ────────────────────────────
  {
    id: 'ind_01', num: '01', nombre: 'Margen de Utilidad Bruta',
    formula: 'Utilidad Bruta / Ingresos × 100',
    fuente: ['utilidad_bruta', 'ingresos'],
    calc: d => d.utilidad_bruta != null && d.ingresos != null ? (d.utilidad_bruta / d.ingresos) * 100 : null,
    rangos: [
      { min: 50,  max: Infinity, color: 'green',  badge: 'EXCELENTE',  texto: 'Ventaja competitiva fuerte, pricing power alto.' },
      { min: 30,  max: 50,      color: 'teal',   badge: 'BUENO',      texto: 'Márgenes saludables, negocio rentable.' },
      { min: 15,  max: 30,      color: 'orange', badge: 'MODERADO',   texto: 'Márgenes ajustados, presión competitiva.' },
      { min: -Infinity, max: 15, color: 'red',   badge: 'DEFICIENTE', texto: 'Márgenes críticos, riesgo de sostenibilidad.' },
    ],
    unidad: '%', grafica: 'G3'
  },
  {
    id: 'ind_02', num: '02', nombre: 'Margen EBIT (Operativo)',
    formula: 'EBIT / Ingresos × 100',
    fuente: ['ebit', 'ingresos'],
    calc: d => d.ebit != null && d.ingresos != null ? (d.ebit / d.ingresos) * 100 : null,
    rangos: [
      { min: 20,  max: Infinity, color: 'green',  badge: 'EXCELENTE',  texto: 'Alta eficiencia operativa.' },
      { min: 10,  max: 20,      color: 'teal',   badge: 'BUENO',      texto: 'Operación saludable.' },
      { min: 5,   max: 10,      color: 'orange', badge: 'MODERADO',   texto: 'Margen estrecho, vigilar costos.' },
      { min: -Infinity, max: 5, color: 'red',    badge: 'DEFICIENTE', texto: 'Operación apenas rentable o pérdidas.' },
    ],
    unidad: '%', grafica: 'G3'
  },
  {
    id: 'ind_03', num: '03', nombre: 'Margen EBITDA',
    formula: 'EBITDA / Ingresos × 100',
    fuente: ['ebitda', 'ingresos'],
    calc: d => d.ebitda != null && d.ingresos != null ? (d.ebitda / d.ingresos) * 100 : null,
    rangos: [
      { min: 30,  max: Infinity, color: 'green',  badge: 'EXCELENTE',  texto: 'Generación de caja operativa sobresaliente.' },
      { min: 15,  max: 30,      color: 'teal',   badge: 'BUENO',      texto: 'Buena capacidad de generación de caja.' },
      { min: 5,   max: 15,      color: 'orange', badge: 'MODERADO',   texto: 'Caja operativa ajustada.' },
      { min: -Infinity, max: 5, color: 'red',    badge: 'DEFICIENTE', texto: 'Empresa consume más caja de la que genera.' },
    ],
    unidad: '%', grafica: 'G3'
  },
  {
    id: 'ind_04', num: '04', nombre: 'Margen Neto',
    formula: 'Ganancia Neta / Ingresos × 100',
    fuente: ['ganancias_netas', 'ingresos'],
    calc: d => d.ganancias_netas != null && d.ingresos != null ? (d.ganancias_netas / d.ingresos) * 100 : null,
    rangos: [
      { min: 20,  max: Infinity, color: 'green',  badge: 'EXCELENTE',  texto: 'Alta rentabilidad neta, excelente conversión.' },
      { min: 10,  max: 20,      color: 'teal',   badge: 'BUENO',      texto: 'Rentabilidad neta sólida.' },
      { min: 3,   max: 10,      color: 'orange', badge: 'MODERADO',   texto: 'Margen neto estrecho.' },
      { min: -Infinity, max: 3, color: 'red',    badge: 'DEFICIENTE', texto: 'Empresa apenas gana o pierde dinero.' },
    ],
    unidad: '%', grafica: 'G3'
  },
  {
    id: 'ind_05', num: '05', nombre: 'Margen FCF (apalancado)',
    formula: 'FCF / Ingresos × 100',
    fuente: ['fcf', 'ingresos'],
    calc: d => d.fcf != null && d.ingresos != null ? (d.fcf / d.ingresos) * 100 : null,
    rangos: [
      { min: 20,  max: Infinity, color: 'green',  badge: 'EXCELENTE',  texto: 'Máquina de generar caja libre.' },
      { min: 10,  max: 20,      color: 'teal',   badge: 'BUENO',      texto: 'Buena conversión a FCF.' },
      { min: 3,   max: 10,      color: 'orange', badge: 'MODERADO',   texto: 'Conversión ajustada.' },
      { min: -Infinity, max: 3, color: 'red',    badge: 'DEFICIENTE', texto: 'Conversión a caja muy baja o negativa.' },
    ],
    unidad: '%', grafica: 'G3'
  },

  // ────────────────────── BLOQUE II: RETORNO SOBRE CAPITAL ──────────────────
  {
    id: 'ind_06', num: '06', nombre: 'ROE — Retorno sobre Patrimonio',
    formula: 'Ganancia Neta / Patrimonio × 100',
    fuente: ['ganancias_netas', 'equity'],
    calc: d => d.ganancias_netas != null && d.equity != null && d.equity !== 0 ? (d.ganancias_netas / d.equity) * 100 : null,
    fallback: d => d.roe,
    rangos: [
      { min: 20,  max: Infinity, color: 'green',  badge: 'EXCELENTE',  texto: 'Alta rentabilidad sobre el patrimonio.' },
      { min: 12,  max: 20,      color: 'teal',   badge: 'BUENO',      texto: 'Retorno sólido para el accionista.' },
      { min: 5,   max: 12,      color: 'orange', badge: 'MODERADO',   texto: 'Retorno limitado.' },
      { min: -Infinity, max: 5, color: 'red',    badge: 'DEFICIENTE', texto: 'ROE bajo o negativo — erosión de valor.' },
    ],
    unidad: '%', grafica: 'G6'
  },
  {
    id: 'ind_07', num: '07', nombre: 'ROA — Retorno sobre Activos',
    formula: 'Ganancia Neta / Activos Totales × 100',
    fuente: ['roa'],
    calc: d => d.roa,
    rangos: [
      { min: 10,  max: Infinity, color: 'green',  badge: 'EXCELENTE',  texto: 'Uso eficiente de todos los activos.' },
      { min: 5,   max: 10,      color: 'teal',   badge: 'BUENO',      texto: 'Retorno sobre activos saludable.' },
      { min: 1,   max: 5,       color: 'orange', badge: 'MODERADO',   texto: 'Eficiencia de activos limitada.' },
      { min: -Infinity, max: 1, color: 'red',    badge: 'DEFICIENTE', texto: 'Activos no generan retorno adecuado.' },
    ],
    unidad: '%', grafica: 'G6'
  },
  {
    id: 'ind_08', num: '08', nombre: 'ROIC — Retorno sobre Capital Invertido',
    formula: 'EBIT × (1 - t) / (Deuda + Patrimonio)',
    fuente: ['roic'],
    calc: d => d.roic,
    rangos: [
      { min: 15,  max: Infinity, color: 'green',  badge: 'EXCELENTE',  texto: 'Destruye deuda y crea valor consistentemente.' },
      { min: 8,   max: 15,      color: 'teal',   badge: 'BUENO',      texto: 'ROIC por encima del costo de capital típico.' },
      { min: 4,   max: 8,       color: 'orange', badge: 'MODERADO',   texto: 'ROIC cercano al costo de capital.' },
      { min: -Infinity, max: 4, color: 'red',    badge: 'DEFICIENTE', texto: 'ROIC < WACC probable → destruye valor.' },
    ],
    unidad: '%', grafica: 'G6'
  },
  {
    id: 'ind_09', num: '09', nombre: 'FCF Yield — Rendimiento FCF',
    formula: 'FCF / Market Cap × 100  (≈ FCF / EV para comparación)',
    fuente: ['fcf_yield'],
    calc: d => d.fcf_yield,
    rangos: [
      { min: 5,   max: Infinity, color: 'green',  badge: 'ATRACTIVO',  texto: 'Alta generación de FCF respecto al precio.' },
      { min: 3,   max: 5,       color: 'teal',   badge: 'RAZONABLE',  texto: 'Rendimiento FCF aceptable.' },
      { min: 1,   max: 3,       color: 'orange', badge: 'BAJO',       texto: 'Rendimiento ajustado, valoración exigente.' },
      { min: -Infinity, max: 1, color: 'red',    badge: 'CARO',       texto: 'FCF Yield muy baja — precio muy elevado.' },
    ],
    unidad: '%', grafica: null
  },
  {
    id: 'ind_10', num: '10', nombre: 'Crecimiento BPA (EPS Growth)',
    formula: 'Crecimiento porcentual del BPA periodo anterior vs actual',
    fuente: ['bpa_growth'],
    calc: d => d.bpa_growth,
    rangos: [
      { min: 20,  max: Infinity, color: 'green',  badge: 'FUERTE',     texto: 'Crecimiento acelerado de ganancias por acción.' },
      { min: 10,  max: 20,      color: 'teal',   badge: 'SÓLIDO',     texto: 'Crecimiento positivo y sostenible.' },
      { min: 0,   max: 10,      color: 'orange', badge: 'MODERADO',   texto: 'Crecimiento lento.' },
      { min: -Infinity, max: 0, color: 'red',    badge: 'CONTRACCIÓN',texto: 'Ganancias en caída — riesgo de deterioro.' },
    ],
    unidad: '%', grafica: 'G2'
  },

  // ────────────────────── BLOQUE III: FLUJO DE CAJA ─────────────────────────
  {
    id: 'ind_11', num: '11', nombre: 'FCF — Flujo de Caja Libre',
    formula: 'CFO - CapEx',
    fuente: ['fcf', 'cash_ops', 'capex'],
    calc: d => {
      if (d.fcf != null) return d.fcf;
      if (d.cash_ops != null && d.capex != null) return d.cash_ops - Math.abs(d.capex);
      return null;
    },
    rangos: [
      { min: 0,   max: Infinity, color: 'green',  badge: 'POSITIVO',   texto: 'Empresa genera caja libre.' },
      { min: -Infinity, max: 0, color: 'red',     badge: 'NEGATIVO',   texto: 'Consume más caja de la que genera.' },
    ],
    unidad: 'M', grafica: 'G4'
  },
  {
    id: 'ind_12', num: '12', nombre: 'CFO — Flujo de Caja Operativo',
    formula: 'Efectivo de las Operaciones',
    fuente: ['cash_ops'],
    calc: d => d.cash_ops,
    rangos: [
      { min: 0,   max: Infinity, color: 'green',  badge: 'POSITIVO',   texto: 'Operaciones generan caja.' },
      { min: -Infinity, max: 0, color: 'red',     badge: 'NEGATIVO',   texto: 'Operaciones consumen caja.' },
    ],
    unidad: 'M', grafica: 'G4'
  },
  {
    id: 'ind_13', num: '13', nombre: 'CapEx — Gasto de Capital',
    formula: 'Gastos de capital (inversión en activos fijos)',
    fuente: ['capex'],
    calc: d => d.capex != null ? Math.abs(d.capex) : null,
    rangos: [
      { min: -Infinity, max: Infinity, color: 'teal', badge: 'INFORMATIVO', texto: 'Monto de inversión en activos productivos.' },
    ],
    unidad: 'M', grafica: 'G4'
  },
  {
    id: 'ind_14', num: '14', nombre: 'Margen FCF sin Apalancamiento',
    formula: 'FCF Unlevered / Ingresos × 100',
    fuente: ['fcf_margin_unapal'],
    calc: d => d.fcf_margin_unapal,
    rangos: [
      { min: 15,  max: Infinity, color: 'green',  badge: 'EXCELENTE',  texto: 'Operación eficiente antes de estructura de capital.' },
      { min: 8,   max: 15,      color: 'teal',   badge: 'BUENO',      texto: 'Buena eficiencia operativa.' },
      { min: 3,   max: 8,       color: 'orange', badge: 'MODERADO',   texto: 'Eficiencia limitada.' },
      { min: -Infinity, max: 3, color: 'red',    badge: 'DEFICIENTE', texto: 'Negocio apenas genera caja sin deuda.' },
    ],
    unidad: '%', grafica: null
  },
  {
    id: 'ind_15', num: '15', nombre: 'Margen CapEx sobre Ingresos',
    formula: 'CapEx / Ingresos × 100',
    fuente: ['capex', 'ingresos'],
    calc: d => d.capex != null && d.ingresos != null ? (Math.abs(d.capex) / d.ingresos) * 100 : null,
    fallback: d => d.capex_margin,
    rangos: [
      { min: -Infinity, max: 5,  color: 'green',  badge: 'LIGERO',     texto: 'Negocio de bajo capex — asset-light.' },
      { min: 5,         max: 15, color: 'teal',   badge: 'MODERADO',   texto: 'Inversión razonable en activos.' },
      { min: 15,        max: 30, color: 'orange', badge: 'INTENSIVO',  texto: 'Alta intensidad de capital.' },
      { min: 30,        max: Infinity, color: 'red', badge: 'MUY ALTO', texto: 'CapEx consume la mayor parte del FCF.' },
    ],
    unidad: '%', grafica: null
  },

  // ────────────────────── BLOQUE IV: DEUDA Y SOLVENCIA ─────────────────────
  {
    id: 'ind_16', num: '16', nombre: 'Deuda Neta / EBITDA',
    formula: 'Deuda Neta / EBITDA',
    fuente: ['deuda_neta', 'ebitda'],
    calc: d => {
      if (d.deuda_neta_ebitda != null) return d.deuda_neta_ebitda;
      if (d.deuda_neta != null && d.ebitda != null && d.ebitda !== 0) return d.deuda_neta / d.ebitda;
      return null;
    },
    rangos: [
      { min: -Infinity, max: 0,  color: 'green',  badge: 'CAJA NETA',  texto: 'Empresa tiene más caja que deuda — fortísima.' },
      { min: 0,         max: 2,  color: 'teal',   badge: 'EXCELENTE',  texto: 'Deuda muy manejable.' },
      { min: 2,         max: 4,  color: 'orange', badge: 'MODERADO',   texto: 'Palanca moderada, vigilar.' },
      { min: 4,         max: Infinity, color: 'red', badge: 'ALTO',    texto: 'Deuda elevada respecto al EBITDA.' },
    ],
    unidad: 'x', grafica: 'G9'
  },
  {
    id: 'ind_17', num: '17', nombre: 'Deuda / Patrimonio (D/E)',
    formula: 'Deuda Total / Patrimonio',
    fuente: ['deuda_total', 'equity'],
    calc: d => {
      if (d.deuda_patrimonio != null) return d.deuda_patrimonio / 100;
      if (d.deuda_total != null && d.equity != null && d.equity !== 0) return d.deuda_total / d.equity;
      return null;
    },
    rangos: [
      { min: -Infinity, max: 0.5, color: 'green',  badge: 'BAJO',      texto: 'Empresa casi sin deuda, sólida.' },
      { min: 0.5,       max: 1.5, color: 'teal',   badge: 'RAZONABLE', texto: 'Palanca manejable.' },
      { min: 1.5,       max: 3,   color: 'orange', badge: 'ELEVADO',   texto: 'Palanca financiera alta.' },
      { min: 3,         max: Infinity, color: 'red', badge: 'PELIGROSO', texto: 'Deuda excesiva vs patrimonio.' },
    ],
    unidad: 'x', grafica: 'G8'
  },
  {
    id: 'ind_18', num: '18', nombre: 'ICR — Cobertura de Intereses',
    formula: 'EBIT / Gastos por Intereses',
    fuente: ['icr'],
    calc: d => d.icr,
    rangos: [
      { min: 10,  max: Infinity, color: 'green',  badge: 'EXCELENTE',  texto: 'Cubre intereses con gran holgura.' },
      { min: 5,   max: 10,      color: 'teal',   badge: 'BUENO',      texto: 'Cobertura sólida de intereses.' },
      { min: 2,   max: 5,       color: 'orange', badge: 'MODERADO',   texto: 'Cobertura ajustada — vigilar.' },
      { min: -Infinity, max: 2, color: 'red',    badge: 'RIESGO',     texto: 'Riesgo real de impago de intereses.' },
    ],
    unidad: 'x', grafica: null
  },
  {
    id: 'ind_19', num: '19', nombre: 'Liquidez Corriente',
    formula: 'Activos Corrientes / Pasivos Corrientes',
    fuente: ['current_ratio'],
    calc: d => d.current_ratio,
    rangos: [
      { min: 2,   max: Infinity, color: 'green',  badge: 'EXCELENTE',  texto: 'Amplia cobertura de obligaciones de corto plazo.' },
      { min: 1.5, max: 2,       color: 'teal',   badge: 'BUENO',      texto: 'Liquidez saludable.' },
      { min: 1,   max: 1.5,     color: 'orange', badge: 'AJUSTADO',   texto: 'Liquidez justa, vigilar vencimientos.' },
      { min: -Infinity, max: 1, color: 'red',    badge: 'RIESGO',     texto: 'No cubre pasivos corrientes con activos.' },
    ],
    unidad: 'x', grafica: 'G8'
  },
  {
    id: 'ind_20', num: '20', nombre: 'Prueba Ácida',
    formula: '(Activos Corrientes - Inventarios) / Pasivos Corrientes',
    fuente: ['quick_ratio'],
    calc: d => d.quick_ratio,
    rangos: [
      { min: 1.5, max: Infinity, color: 'green',  badge: 'EXCELENTE',  texto: 'Liquidez inmediata muy fuerte.' },
      { min: 1,   max: 1.5,     color: 'teal',   badge: 'BUENO',      texto: 'Puede cubrir deuda corto plazo sin inventarios.' },
      { min: 0.5, max: 1,       color: 'orange', badge: 'MODERADO',   texto: 'Liquidez ajustada sin inventarios.' },
      { min: -Infinity, max: 0.5, color: 'red',  badge: 'RIESGO',     texto: 'Posible estrés de liquidez inmediato.' },
    ],
    unidad: 'x', grafica: 'G8'
  },

  // ────────────────────── BLOQUE V: VALORACIÓN (MÚLTIPLOS) ──────────────────
  {
    id: 'ind_21', num: '21', nombre: 'PER — Price / Earnings',
    formula: 'Precio / Ganancia por Acción',
    fuente: ['per'],
    calc: d => d.per,
    rangos: [
      { min: -Infinity, max: 10, color: 'green',  badge: 'BARATO',     texto: 'Valoración históricamente baja.' },
      { min: 10,        max: 20, color: 'teal',   badge: 'RAZONABLE',  texto: 'Múltiplo dentro de rangos normales.' },
      { min: 20,        max: 35, color: 'orange', badge: 'EXIGENTE',   texto: 'El mercado paga una prima importante.' },
      { min: 35,        max: Infinity, color: 'red', badge: 'MUY CARO', texto: 'Valoración muy exigente — riesgo de decepción.' },
    ],
    unidad: 'x', grafica: 'G7'
  },
  {
    id: 'ind_22', num: '22', nombre: 'PER Forward',
    formula: 'Precio / Ganancia por Acción Proyectada',
    fuente: ['per_fwd'],
    calc: d => d.per_fwd,
    rangos: [
      { min: -Infinity, max: 10, color: 'green',  badge: 'BARATO',     texto: 'Mercado descontando beneficios futuros baratos.' },
      { min: 10,        max: 18, color: 'teal',   badge: 'RAZONABLE',  texto: 'Valoración forward normalizada.' },
      { min: 18,        max: 30, color: 'orange', badge: 'EXIGENTE',   texto: 'Prima alta sobre beneficios esperados.' },
      { min: 30,        max: Infinity, color: 'red', badge: 'MUY CARO', texto: 'PER Forward muy alto — mucha expectativa.' },
    ],
    unidad: 'x', grafica: 'G7'
  },
  {
    id: 'ind_23', num: '23', nombre: 'EV/EBIT',
    formula: 'Enterprise Value / EBIT',
    fuente: ['ev', 'ebit'],
    calc: d => {
      if (d.ev_ebit != null) return d.ev_ebit;
      if (d.ev != null && d.ebit != null && d.ebit !== 0) return d.ev / d.ebit;
      return null;
    },
    rangos: [
      { min: -Infinity, max: 10, color: 'green',  badge: 'BARATO',     texto: 'Empresa compra a múltiplo operativo muy bajo.' },
      { min: 10,        max: 20, color: 'teal',   badge: 'RAZONABLE',  texto: 'Múltiplo operativo en rango normal.' },
      { min: 20,        max: 35, color: 'orange', badge: 'EXIGENTE',   texto: 'El mercado paga prima sobre EBIT.' },
      { min: 35,        max: Infinity, color: 'red', badge: 'MUY CARO', texto: 'EV/EBIT muy alto — valoración exigente.' },
    ],
    unidad: 'x', grafica: 'G7'
  },
  {
    id: 'ind_24', num: '24', nombre: 'EV/FCF',
    formula: 'Enterprise Value / FCF',
    fuente: ['ev', 'fcf'],
    calc: d => {
      if (d.ev_fcf != null) return d.ev_fcf;
      if (d.ev != null && d.fcf != null && d.fcf !== 0) return d.ev / d.fcf;
      return null;
    },
    rangos: [
      { min: -Infinity, max: 10, color: 'green',  badge: 'BARATO',     texto: 'Pagas muy poco por el FCF.' },
      { min: 10,        max: 25, color: 'teal',   badge: 'RAZONABLE',  texto: 'Múltiplo de caja libre aceptable.' },
      { min: 25,        max: 40, color: 'orange', badge: 'EXIGENTE',   texto: 'Múltiplo de caja elevado.' },
      { min: 40,        max: Infinity, color: 'red', badge: 'MUY CARO', texto: 'EV/FCF muy alto — valoración exigente.' },
    ],
    unidad: 'x', grafica: 'G7'
  },
  {
    id: 'ind_25', num: '25', nombre: 'EV/EBITDA',
    formula: 'Enterprise Value / EBITDA',
    fuente: ['ev', 'ebitda'],
    calc: d => {
      if (d.ev != null && d.ebitda != null && d.ebitda !== 0) return d.ev / d.ebitda;
      return null;
    },
    rangos: [
      { min: -Infinity, max: 8,  color: 'green',  badge: 'BARATO',     texto: 'Múltiplo EBITDA muy atractivo.' },
      { min: 8,         max: 15, color: 'teal',   badge: 'RAZONABLE',  texto: 'EV/EBITDA en rango normal.' },
      { min: 15,        max: 25, color: 'orange', badge: 'EXIGENTE',   texto: 'Paga prima sobre EBITDA.' },
      { min: 25,        max: Infinity, color: 'red', badge: 'MUY CARO', texto: 'EV/EBITDA elevado — mercado descuenta mucho crecimiento.' },
    ],
    unidad: 'x', grafica: 'G7'
  },
  {
    id: 'ind_26', num: '26', nombre: 'PEG — Price/Earnings to Growth',
    formula: 'PER / Crecimiento BPA (%)',
    fuente: ['per', 'bpa_growth'],
    calc: d => {
      if (d.peg != null) return d.peg;
      if (d.per != null && d.bpa_growth != null && d.bpa_growth > 0) return d.per / d.bpa_growth;
      return null;
    },
    rangos: [
      { min: -Infinity, max: 1,  color: 'green',  badge: 'INFRAVALORADO', texto: 'Pagas menos de 1x por unidad de crecimiento.' },
      { min: 1,         max: 2,  color: 'teal',   badge: 'RAZONABLE',  texto: 'Valoración justa considerando el crecimiento.' },
      { min: 2,         max: 3,  color: 'orange', badge: 'EXIGENTE',   texto: 'Estás pagando prima por el crecimiento.' },
      { min: 3,         max: Infinity, color: 'red', badge: 'MUY CARO', texto: 'Muy caro ajustado por crecimiento.' },
    ],
    unidad: 'x', grafica: null
  },

  // ────────────────────── BLOQUE VI: ESTRUCTURA FINANCIERA ──────────────────
  {
    id: 'ind_27', num: '27', nombre: 'EBIT',
    formula: 'Ingresos - COGS - Gastos Operativos',
    fuente: ['ebit'],
    calc: d => d.ebit,
    rangos: [
      { min: 0,   max: Infinity, color: 'green',  badge: 'POSITIVO',   texto: 'Operaciones rentables antes de intereses e impuestos.' },
      { min: -Infinity, max: 0, color: 'red',     badge: 'PÉRDIDA OP.', texto: 'Operación en pérdida operativa.' },
    ],
    unidad: 'M', grafica: 'G2'
  },
  {
    id: 'ind_28', num: '28', nombre: 'EBITDA',
    formula: 'EBIT + Depreciación + Amortización',
    fuente: ['ebitda'],
    calc: d => d.ebitda,
    rangos: [
      { min: 0,   max: Infinity, color: 'green',  badge: 'POSITIVO',   texto: 'Proxy de generación de caja operativa.' },
      { min: -Infinity, max: 0, color: 'red',     badge: 'NEGATIVO',   texto: 'Sin generación de caja operativa.' },
    ],
    unidad: 'M', grafica: 'G2'
  },
  {
    id: 'ind_29', num: '29', nombre: 'Ingresos Totales',
    formula: 'Top-line revenue',
    fuente: ['ingresos'],
    calc: d => d.ingresos,
    rangos: [
      { min: -Infinity, max: Infinity, color: 'teal', badge: 'INFORMATIVO', texto: 'Base de ingresos de la empresa.' },
    ],
    unidad: 'M', grafica: 'G1'
  },
  {
    id: 'ind_30', num: '30', nombre: 'Utilidad Bruta',
    formula: 'Ingresos - Costo de Ventas',
    fuente: ['utilidad_bruta'],
    calc: d => d.utilidad_bruta,
    rangos: [
      { min: 0,   max: Infinity, color: 'green',  badge: 'POSITIVO',   texto: 'Genera valor después de costos directos.' },
      { min: -Infinity, max: 0, color: 'red',     badge: 'NEGATIVO',   texto: 'Costos directos superan ingresos.' },
    ],
    unidad: 'M', grafica: 'G1'
  },
  {
    id: 'ind_31', num: '31', nombre: 'Ganancia Neta',
    formula: 'Resultado neto después de impuestos e intereses',
    fuente: ['ganancias_netas'],
    calc: d => d.ganancias_netas,
    rangos: [
      { min: 0,   max: Infinity, color: 'green',  badge: 'GANANCIA',   texto: 'Empresa rentable en resultado final.' },
      { min: -Infinity, max: 0, color: 'red',     badge: 'PÉRDIDA',    texto: 'Empresa en pérdida neta.' },
    ],
    unidad: 'M', grafica: 'G1'
  },
  {
    id: 'ind_32', num: '32', nombre: 'Deuda Total',
    formula: 'Deuda corto plazo + Deuda largo plazo',
    fuente: ['deuda_total'],
    calc: d => d.deuda_total,
    rangos: [
      { min: -Infinity, max: Infinity, color: 'teal', badge: 'INFORMATIVO', texto: 'Deuda financiera total de la empresa.' },
    ],
    unidad: 'M', grafica: 'G5'
  },
  {
    id: 'ind_33', num: '33', nombre: 'Deuda Neta',
    formula: 'Deuda Total - Caja y Equivalentes',
    fuente: ['deuda_neta'],
    calc: d => d.deuda_neta,
    rangos: [
      { min: -Infinity, max: 0,  color: 'green',  badge: 'CAJA NETA',  texto: 'Empresa tiene más caja que deuda.' },
      { min: 0,         max: Infinity, color: 'orange', badge: 'DEUDA NETA', texto: 'Empresa con deuda neta positiva.' },
    ],
    unidad: 'M', grafica: 'G9'
  },
  {
    id: 'ind_34', num: '34', nombre: 'Equity / Patrimonio',
    formula: 'Activos - Pasivos Totales',
    fuente: ['equity'],
    calc: d => d.equity,
    rangos: [
      { min: 0,   max: Infinity, color: 'green',  badge: 'POSITIVO',   texto: 'Patrimonio neto positivo — empresa solvente.' },
      { min: -Infinity, max: 0, color: 'red',     badge: 'NEGATIVO',   texto: 'Patrimonio negativo — pasivos superan activos.' },
    ],
    unidad: 'M', grafica: 'G5'
  },
  {
    id: 'ind_35', num: '35', nombre: 'Enterprise Value (EV)',
    formula: 'Market Cap + Deuda Neta',
    fuente: ['ev'],
    calc: d => d.ev,
    rangos: [
      { min: -Infinity, max: Infinity, color: 'teal', badge: 'INFORMATIVO', texto: 'Valor total de la empresa incluyendo deuda.' },
    ],
    unidad: 'M', grafica: 'G5'
  },

  // ────────────────────── BLOQUE XX: COMPARATIVOS ───────────────────────────
  {
    id: 'ind_xx', num: 'XX', nombre: 'ROImp (Rendimiento Operativo Implícito)',
    formula: '1 / (EV/EBIT) × 100',
    fuente: ['ev', 'ebit'],
    calc: d => {
      const ev_ebit = d.ev_ebit || (d.ev != null && d.ebit != null ? d.ev / d.ebit : null);
      return ev_ebit != null ? (1 / ev_ebit) * 100 : null;
    },
    rangos: [
      { min: 10,  max: Infinity, color: 'green',  badge: 'EXCELENTE',  texto: 'ROImp muy por encima del costo de capital típico.' },
      { min: 6,   max: 10,      color: 'teal',   badge: 'BUENO',      texto: 'ROImp saludable.' },
      { min: 3,   max: 6,       color: 'orange', badge: 'MODERADO',   texto: 'ROImp cercano al WACC típico.' },
      { min: -Infinity, max: 3, color: 'red',    badge: 'BAJO',       texto: 'ROImp posiblemente menor que el WACC.' },
    ],
    unidad: '%', grafica: null
  },

  // ────────────────────── BLOQUE CF: CALIDAD DE FLUJO DE CAJA ──────────────
  {
    id: 'ind_cf1', num: 'CF1', nombre: 'CROIC — Retorno de Caja sobre Capital',
    formula: 'FCF / (Equity + Deuda Neta) × 100',
    fuente: ['fcf', 'equity', 'deuda_neta'],
    calc: d => {
      if (d.fcf != null && d.equity != null && d.deuda_neta != null) {
        const ci = d.equity + d.deuda_neta;
        return ci !== 0 ? (d.fcf / ci) * 100 : null;
      }
      return null;
    },
    rangos: [
      { min: 15,  max: Infinity, color: 'green',  badge: 'EXCELENTE',  texto: 'CROIC muy superior al costo de capital — crea valor real.' },
      { min: 10,  max: 15,      color: 'teal',   badge: 'BUENO',      texto: 'Retorno de caja sobre capital sólido.' },
      { min: 5,   max: 10,      color: 'orange', badge: 'MODERADO',   texto: 'CROIC cerca del WACC típico.' },
      { min: -Infinity, max: 5, color: 'red',    badge: 'BAJO',       texto: 'CROIC inferior al costo de capital.' },
    ],
    unidad: '%', grafica: null
  },
  {
    id: 'ind_cf2', num: 'CF2', nombre: 'Calidad de Beneficios — CFO/Net Income',
    formula: 'Flujo de Caja Operativo / Ganancia Neta × 100',
    fuente: ['cash_ops', 'ganancias_netas'],
    calc: d => {
      if (d.cash_ops != null && d.ganancias_netas != null && d.ganancias_netas !== 0)
        return (d.cash_ops / d.ganancias_netas) * 100;
      return null;
    },
    rangos: [
      { min: 100, max: Infinity, color: 'green',  badge: 'EXCELENTE',  texto: 'Beneficios con alta conversión a caja operativa.' },
      { min: 80,  max: 100,     color: 'teal',   badge: 'BUENO',      texto: 'Conversión a caja operativa saludable.' },
      { min: 60,  max: 80,      color: 'orange', badge: 'MODERADO',   texto: 'Conversión ajustada — vigilar accruals.' },
      { min: -Infinity, max: 60, color: 'red',   badge: 'BAJO',       texto: 'Baja conversión — señal de ingeniería contable.' },
    ],
    unidad: '%', grafica: null
  },
  {
    id: 'ind_cf3', num: 'CF3', nombre: 'Calidad FCF — FCF/Net Income',
    formula: 'FCF / Ganancia Neta × 100',
    fuente: ['fcf', 'ganancias_netas'],
    calc: d => {
      if (d.fcf != null && d.ganancias_netas != null && d.ganancias_netas !== 0)
        return (d.fcf / d.ganancias_netas) * 100;
      return null;
    },
    rangos: [
      { min: 100, max: Infinity, color: 'green',  badge: 'EXCELENTE',  texto: 'FCF supera la ganancia neta — calidad contable alta.' },
      { min: 75,  max: 100,     color: 'teal',   badge: 'BUENO',      texto: 'Alta conversión de beneficios a caja libre.' },
      { min: 50,  max: 75,      color: 'orange', badge: 'MODERADO',   texto: 'Conversión FCF parcial.' },
      { min: -Infinity, max: 50, color: 'red',   badge: 'BAJO',       texto: 'FCF muy inferior a beneficios — cuidado con accruals.' },
    ],
    unidad: '%', grafica: null
  },
  {
    id: 'ind_cf4', num: 'CF4', nombre: 'Ratio de Acumulación (Accrual Ratio)',
    formula: '(Ganancia Neta − CFO) / Activos Totales × 100',
    fuente: ['ganancias_netas', 'cash_ops', 'activos_totales'],
    calc: d => {
      if (d.ganancias_netas != null && d.cash_ops != null && d.activos_totales != null && d.activos_totales !== 0)
        return ((d.ganancias_netas - d.cash_ops) / d.activos_totales) * 100;
      return null;
    },
    rangos: [
      { min: -Infinity, max: -5, color: 'green',  badge: 'EXCELENTE',  texto: 'Accruals negativos — caja supera beneficios contables.' },
      { min: -5,        max: 5,  color: 'teal',   badge: 'NEUTRO',     texto: 'Nivel de accruals normal.' },
      { min: 5,         max: 10, color: 'orange', badge: 'MODERADO',   texto: 'Accruals elevados — vigilar calidad de beneficios.' },
      { min: 10,        max: Infinity, color: 'red', badge: 'ALTO',    texto: 'Accruals muy altos — señal de riesgo contable.' },
    ],
    unidad: '%', grafica: null
  },
  {
    id: 'ind_cf5', num: 'CF5', nombre: 'Gross Profit / Activos Totales',
    formula: 'Utilidad Bruta / Activos Totales × 100',
    fuente: ['utilidad_bruta', 'activos_totales'],
    calc: d => {
      if (d.utilidad_bruta != null && d.activos_totales != null && d.activos_totales !== 0)
        return (d.utilidad_bruta / d.activos_totales) * 100;
      return null;
    },
    rangos: [
      { min: 40,  max: Infinity, color: 'green',  badge: 'EXCELENTE',  texto: 'Alta productividad de activos en generación bruta.' },
      { min: 25,  max: 40,      color: 'teal',   badge: 'BUENO',      texto: 'Buena eficiencia de activos.' },
      { min: 10,  max: 25,      color: 'orange', badge: 'MODERADO',   texto: 'Eficiencia de activos ajustada.' },
      { min: -Infinity, max: 10, color: 'red',   badge: 'BAJO',       texto: 'Activos generan poco valor bruto.' },
    ],
    unidad: '%', grafica: null
  },
  {
    id: 'ind_cf6', num: 'CF6', nombre: 'Book-to-Bill',
    formula: 'Pedidos Nuevos / Facturación del Período',
    fuente: ['book_to_bill'],
    calc: d => d.book_to_bill,
    rangos: [
      { min: 1.1, max: Infinity, color: 'green',  badge: 'EXPANSIÓN',  texto: 'Más pedidos que facturación — demanda creciente.' },
      { min: 0.9, max: 1.1,     color: 'teal',   badge: 'EQUILIBRIO', texto: 'Flujo de pedidos estable.' },
      { min: -Infinity, max: 0.9, color: 'orange', badge: 'CONTRACCIÓN', texto: 'Menos pedidos que facturación — señal de desaceleración.' },
    ],
    unidad: 'x', grafica: null
  },
  {
    id: 'ind_cf7', num: 'CF7', nombre: 'Backlog (Cartera de Pedidos)',
    formula: 'Total de pedidos en cartera pendientes de entrega',
    fuente: ['backlog'],
    calc: d => d.backlog,
    rangos: [
      { min: -Infinity, max: Infinity, color: 'teal', badge: 'INFORMATIVO', texto: 'Pedidos pendientes de entrega — visibilidad de ingresos futuros.' },
    ],
    unidad: 'M', grafica: null
  },

  // ────────────────────── BLOQUE FWD: INDICADORES FORWARD ───────────────────
  {
    id: 'ind_fwd1', num: 'FWD1', nombre: 'Forward EPS (BPA Proyectado)',
    formula: 'Consenso de analistas — BPA próximo año fiscal',
    fuente: ['eps_proj'],
    calc: d => d.eps_proj,
    rangos: [
      { min: 0,   max: Infinity, color: 'green',  badge: 'POSITIVO',   texto: 'Se proyecta ganancia por acción positiva.' },
      { min: -Infinity, max: 0, color: 'red',     badge: 'NEGATIVO',   texto: 'Se proyectan pérdidas por acción.' },
    ],
    unidad: '$', grafica: null
  },
  {
    id: 'ind_fwd2', num: 'FWD2', nombre: 'Forward P/E',
    formula: 'Precio de Mercado / Forward EPS',
    fuente: ['per_fwd', 'eps_proj'],
    calc: d => {
      if (d.per_fwd != null) return d.per_fwd;
      if (d.precio_accion != null && d.eps_proj != null && d.eps_proj !== 0)
        return d.precio_accion / d.eps_proj;
      return null;
    },
    rangos: [
      { min: -Infinity, max: 15, color: 'green',  badge: 'BARATO',     texto: 'Forward P/E bajo — potencial de upside.' },
      { min: 15,        max: 25, color: 'teal',   badge: 'RAZONABLE',  texto: 'Valoración forward justa.' },
      { min: 25,        max: 35, color: 'orange', badge: 'EXIGENTE',   texto: 'Se paga prima sobre ganancias futuras.' },
      { min: 35,        max: Infinity, color: 'red', badge: 'MUY CARO', texto: 'Forward P/E elevado — descuenta mucho crecimiento.' },
    ],
    unidad: 'x', grafica: null
  },
  {
    id: 'ind_fwd3', num: 'FWD3', nombre: 'FCF Forecast (Proyectado)',
    formula: 'Flujo de Caja Libre proyectado próximo período',
    fuente: ['fcf_forecast'],
    calc: d => d.fcf_forecast,
    rangos: [
      { min: 0,   max: Infinity, color: 'green',  badge: 'POSITIVO',   texto: 'FCF proyectado positivo — generación de caja esperada.' },
      { min: -Infinity, max: 0, color: 'red',     badge: 'NEGATIVO',   texto: 'FCF proyectado negativo — consumo de caja esperado.' },
    ],
    unidad: 'M', grafica: null
  },
  {
    id: 'ind_fwd4', num: 'FWD4', nombre: 'FCF Yield Forward',
    formula: 'FCF Forecast / Market Cap × 100',
    fuente: ['fcf_forecast', 'ev'],
    calc: d => {
      if (d.fcf_forecast != null && d.ev != null && d.deuda_neta != null) {
        const mktCap = d.ev - d.deuda_neta;
        return mktCap > 0 ? (d.fcf_forecast / mktCap) * 100 : null;
      }
      return null;
    },
    rangos: [
      { min: 6,   max: Infinity, color: 'green',  badge: 'ATRACTIVO',  texto: 'FCF Yield forward muy atractivo.' },
      { min: 3,   max: 6,       color: 'teal',   badge: 'BUENO',      texto: 'FCF Yield forward razonable.' },
      { min: 1,   max: 3,       color: 'orange', badge: 'MODERADO',   texto: 'FCF Yield forward ajustado.' },
      { min: -Infinity, max: 1, color: 'red',    badge: 'BAJO',       texto: 'FCF Yield forward poco atractivo.' },
    ],
    unidad: '%', grafica: null
  },

  // ────────────────────── BLOQUE A–E: SCORINGS Y PROYECCIONES ───────────────
  {
    id: 'ind_a', num: 'A', nombre: 'Altman Z-Score',
    formula: 'Modelo probabilístico de quiebra (5 variables)',
    fuente: ['altman_z'],
    calc: d => d.altman_z,
    rangos: [
      { min: 3,          max: Infinity, color: 'green',  badge: 'SEGURO',    texto: 'Muy baja probabilidad de quiebra.' },
      { min: 1.8,        max: 3,       color: 'orange', badge: 'ZONA GRIS', texto: 'Zona de incertidumbre — vigilar.' },
      { min: -Infinity,  max: 1.8,     color: 'red',    badge: 'RIESGO',    texto: 'Alta probabilidad de dificultades financieras.' },
    ],
    unidad: '', grafica: 'G9'
  },
  {
    id: 'ind_b', num: 'B', nombre: 'Piotroski F-Score',
    formula: 'Score 0-9 basado en 9 señales financieras',
    fuente: ['piotroski'],
    calc: d => d.piotroski,
    rangos: [
      { min: 7,   max: Infinity, color: 'green',  badge: 'FUERTE',     texto: 'Empresa en excelente condición financiera.' },
      { min: 4,   max: 7,       color: 'teal',   badge: 'NEUTRAL',    texto: 'Salud financiera aceptable.' },
      { min: -Infinity, max: 4, color: 'red',    badge: 'DÉBIL',      texto: 'Señales de deterioro financiero.' },
    ],
    unidad: '/9', grafica: null
  },
  {
    id: 'ind_c', num: 'C', nombre: 'Proyección BPA (EPS Forecast)',
    formula: 'Consenso de analistas — BPA proyectado próximo año',
    fuente: ['eps_proj'],
    calc: d => d.eps_proj,
    rangos: [
      { min: 0,   max: Infinity, color: 'green',  badge: 'POSITIVO',   texto: 'Se espera ganancia por acción positiva.' },
      { min: -Infinity, max: 0, color: 'red',     badge: 'NEGATIVO',   texto: 'Se proyectan pérdidas por acción.' },
    ],
    unidad: '$', grafica: null
  },
  {
    id: 'ind_d', num: 'D', nombre: 'Proyección de Ingresos',
    formula: 'Consenso de analistas — Revenue proyectado',
    fuente: ['revenue_proj'],
    calc: d => d.revenue_proj,
    rangos: [
      { min: -Infinity, max: Infinity, color: 'teal', badge: 'PROYECCIÓN', texto: 'Estimación de crecimiento de ingresos.' },
    ],
    unidad: 'M', grafica: null
  },
  {
    id: 'ind_e', num: 'E', nombre: 'Acciones en Circulación',
    formula: 'Total de acciones ordinarias en circulación',
    fuente: ['shares'],
    calc: d => d.shares,
    rangos: [
      { min: -Infinity, max: Infinity, color: 'teal', badge: 'INFORMATIVO', texto: 'Determina el peso de dilución.' },
    ],
    unidad: 'M', grafica: null
  },
];

// Mapa rápido id → indicador
const INDICATOR_MAP = Object.fromEntries(INDICATORS.map(i => [i.id, i]));
