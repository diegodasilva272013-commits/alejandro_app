// ── indicators.js — Módulo 2: Motor de cálculo de los 43 indicadores ──────────
const IndicatorEngine = {

  COLOR_MAP: {
    green:  '#27AE60',
    teal:   '#1A6B72',
    orange: '#E67E22',
    red:    '#C0392B',
    gray:   '#4A5568',
    tealb:  '#1A6B72',
  },

  // Devuelve el rango que corresponde al valor
  getRango(rangos, valor) {
    for (const r of rangos) {
      if (valor >= r.min && valor < r.max) return r;
    }
    return rangos[rangos.length - 1];
  },

  // Formatea un valor para mostrarlo
  formatValue(val, unidad) {
    if (val == null) return '—';
    const abs = Math.abs(val);
    let str;
    if (unidad === 'M') {
      if (abs >= 1000)  str = (val / 1000).toFixed(2) + 'B';
      else              str = val.toFixed(2) + 'M';
    } else if (unidad === '%') {
      str = val.toFixed(2) + '%';
    } else if (unidad === 'x') {
      str = val.toFixed(2) + 'x';
    } else if (unidad === '$') {
      str = '$' + val.toFixed(2);
    } else if (unidad === '/9') {
      str = val.toFixed(0) + '/9';
    } else {
      str = val.toFixed(2);
    }
    return str;
  },

  // Calcula un indicador individual y devuelve el objeto completo
  calcOne(ind, data) {
    // Try primary calc
    let valor = null;
    try { valor = ind.calc(data); } catch(e) {}

    // Try fallback if exists
    if ((valor == null || isNaN(valor)) && ind.fallback) {
      try { valor = ind.fallback(data); } catch(e) {}
    }

    if (valor == null || isNaN(valor)) {
      return {
        ...ind,
        valor: null,
        valorFmt: '—',
        rango: { color: 'gray', badge: 'DATO FALTANTE', texto: 'No se encontró este dato en el archivo subido.' },
        color: this.COLOR_MAP.gray,
        tendencia: null,
        faltante: true,
      };
    }

    const rango = this.getRango(ind.rangos, valor);
    return {
      ...ind,
      valor,
      valorFmt: this.formatValue(valor, ind.unidad),
      rango,
      color: this.COLOR_MAP[rango.color] || this.COLOR_MAP.gray,
      tendencia: data._tendencias?.[ind.id] || null,
      faltante: false,
    };
  },

  // Calcula todos los indicadores
  calcAll(data) {
    return INDICATORS.map(ind => this.calcOne(ind, data));
  },

  // Devuelve resumen: totales por color, fortalezas, alertas
  getSummary(results) {
    const counts = { green: 0, teal: 0, orange: 0, red: 0, gray: 0 };
    const fortalezas = [];
    const alertas = [];
    const faltantes = [];

    for (const r of results) {
      const c = r.rango.color;
      counts[c] = (counts[c] || 0) + 1;
      if (c === 'green' || c === 'teal') fortalezas.push(r);
      if (c === 'red' || c === 'orange') alertas.push(r);
      if (r.faltante) faltantes.push(r);
    }

    const totalCalc = results.length - counts.gray;
    const scoreNum = totalCalc > 0
      ? Math.round(((counts.green * 2 + counts.teal) / (totalCalc * 2)) * 100)
      : 0;

    // Auto-generate conclusion text
    const sc = scoreNum;
    let conclusion = '';
    if (sc >= 75) {
      conclusion = `Con un score de salud financiera del ${sc}%, la empresa muestra una posición financiera sólida y consistente. La mayoría de los indicadores se encuentran en rango excelente o bueno. Las métricas de rentabilidad, flujo de caja y valoración son favorables. Se recomienda continuar monitoreando la evolución de los indicadores clave para sostener esta trayectoria.`;
    } else if (sc >= 55) {
      conclusion = `Con un score del ${sc}%, la empresa presenta una salud financiera moderada-buena con áreas de fortaleza claras pero también puntos de atención. Algunos indicadores muestran presión que merece seguimiento. Se recomienda un análisis más profundo de las alertas identificadas antes de tomar decisiones de inversión.`;
    } else if (sc >= 35) {
      conclusion = `Con un score del ${sc}%, la empresa enfrenta desafíos financieros significativos. Varios indicadores clave se encuentran en zona de alerta o crítica. Es fundamental evaluar los riesgos identificados, la solidez del flujo de caja y la capacidad de servicio de deuda antes de cualquier decisión de inversión.`;
    } else {
      conclusion = `Con un score del ${sc}%, la empresa presenta señales de fragilidad financiera en múltiples dimensiones. Se recomienda extremar la precaución y realizar due diligence exhaustivo. Los indicadores en zona roja requieren atención inmediata y justificación clara antes de considerar cualquier posición.`;
    }

    return { counts, fortalezas, alertas, faltantes, scoreNum, conclusion };
  },
};
