'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// infravaloradas-config.js — Ratios, umbrales y colores
// Protocolo Empresas Infravaloradas Trimestral
// ═══════════════════════════════════════════════════════════════════════════════

const INFRA_RATIOS = [
  {
    id: "ingresos_totales",
    nombre: "Ingresos Totales (B)",
    tipo: "valor_absoluto",
    evaluacion: "crecimiento_yoy",
    umbral: { verde: ">10%_yoy", amarillo: "0-10%_yoy", rojo: "<0%_yoy" }
  },
  {
    id: "utilidad_bruta",
    nombre: "Utilidad Bruta (B)",
    tipo: "valor_absoluto",
    evaluacion: "tendencia",
    umbral: { verde: "creciente_estable", amarillo: "plana", rojo: "cayendo" }
  },
  {
    id: "ganancia_neta",
    nombre: "Ganancia Neta (B)",
    tipo: "valor_absoluto",
    evaluacion: "tendencia",
    umbral: { verde: "creciente", amarillo: "volatil", rojo: "cayendo" }
  },
  {
    id: "margen_bruto",
    nombre: "Margen Bruto (%)",
    tipo: "porcentaje",
    evaluacion: "umbral_fijo",
    umbral: { verde: ">45", amarillo: "35-45", rojo: "<35" }
  },
  {
    id: "fcf",
    nombre: "Flujo de Caja Libre — FCF (B)",
    tipo: "valor_absoluto",
    evaluacion: "umbral_fijo",
    umbral: { verde: "positivo_creciente", amarillo: "positivo_irregular", rojo: "negativo" }
  },
  {
    id: "margen_fcf",
    nombre: "Margen FCF (%)",
    tipo: "porcentaje",
    evaluacion: "umbral_fijo",
    umbral: { verde: ">10", amarillo: "5-10", rojo: "<5" }
  },
  {
    id: "per",
    nombre: "PER",
    tipo: "multiplo",
    evaluacion: "umbral_fijo",
    umbral: { verde: "<20", amarillo: "20-30", rojo: ">30" }
  },
  {
    id: "peg",
    nombre: "PEG",
    tipo: "multiplo",
    evaluacion: "umbral_fijo",
    umbral: { verde: "<1.5", amarillo: "1.5-2.0", rojo: ">2.0" }
  },
  {
    id: "equity",
    nombre: "Equity / Capital Contable (B)",
    tipo: "valor_absoluto",
    evaluacion: "tendencia",
    umbral: { verde: "creciente", amarillo: "estable", rojo: "deteriorandose" }
  },
  {
    id: "deuda_patrimonio",
    nombre: "Deuda / Patrimonio",
    tipo: "multiplo",
    evaluacion: "umbral_fijo",
    umbral: { verde: "<0.8", amarillo: "0.8-1.5", rojo: ">1.5" }
  },
  {
    id: "deuda_ebitda",
    nombre: "Deuda Neta / EBITDA",
    tipo: "multiplo",
    evaluacion: "umbral_fijo",
    umbral: { verde: "<1.5", amarillo: "1.5-2.5", rojo: ">2.5" }
  },
  {
    id: "deuda_neta",
    nombre: "Deuda Neta (B)",
    tipo: "valor_absoluto",
    evaluacion: "tendencia_inversa",
    umbral: { verde: "bajando", amarillo: "estable", rojo: "subiendo" }
  },
  {
    id: "deuda_total",
    nombre: "Deuda Total (B)",
    tipo: "valor_absoluto",
    evaluacion: "tendencia_inversa",
    umbral: { verde: "controlada", amarillo: "moderada", rojo: "excesiva" }
  },
  {
    id: "capex",
    nombre: "CapEx (B)",
    tipo: "valor_absoluto",
    evaluacion: "cualitativo",
    umbral: { verde: "sana_productiva", amarillo: "alta_razonable", rojo: "muy_alta_sin_retorno" }
  },
  {
    id: "croic",
    nombre: "CROIC (%)",
    tipo: "porcentaje",
    evaluacion: "umbral_fijo",
    umbral: { verde: ">10", amarillo: "5-10", rojo: "<5" }
  },
  {
    id: "gross_profit_assets",
    nombre: "Gross Profit / Assets (%)",
    tipo: "porcentaje",
    evaluacion: "umbral_fijo",
    umbral: { verde: ">35", amarillo: "20-35", rojo: "<20" }
  },
  {
    id: "asset_turnover",
    nombre: "Asset Turnover",
    tipo: "multiplo",
    evaluacion: "umbral_fijo",
    umbral: { verde: ">0.50", amarillo: "0.30-0.50", rojo: "<0.30" }
  }
];

const INFRA_COLORES = {
  verde:    { dot: "🟢", hex: "#16a34a", label: "favorable / cumple criterio" },
  amarillo: { dot: "🟡", hex: "#d97706", label: "aceptable / transición / neutral" },
  rojo:     { dot: "🔴", hex: "#dc2626", label: "débil / no cumple criterio" }
};

const INFRA_TRIMESTRES = ["Q-12","Q-11","Q-10","Q-9","Q-8","Q-7","Q-6","Q-5","Q-4","Q-3","Q-2","Q-1"];

const INFRA_UNIDADES_NOTA = [
  "ingresos, utilidad, FCF, equity, deuda, capex = USD miles de millones (B)",
  "ratios = múltiplos / % según corresponda"
];
