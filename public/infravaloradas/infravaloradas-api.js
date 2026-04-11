'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// infravaloradas-api.js — Llamadas al servidor (proxy a Claude API)
// ═══════════════════════════════════════════════════════════════════════════════

async function infraLlamarAPI(ticker) {
  const response = await fetch('/api/infravaloradas/analizar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ticker: ticker.toUpperCase().trim() })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Error ${response.status}: No se pudo analizar ${ticker}`);
  }

  const data = await response.json();
  return data;
}
