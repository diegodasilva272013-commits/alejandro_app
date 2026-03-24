// ══════════════════════════════════════════════════════
//  MEGA — Análisis IA (GPT-4o via /api/analisis)
// ══════════════════════════════════════════════════════

async function megaCallIA(empresa, rawText, resumen) {
  // resumen = objeto con síntesis de los 5 módulos para enriquecer el prompt
  const prompt = `Sos un analista financiero institucional de Círculo Azul Finanzas. 
Analizá la empresa "${empresa}" con los datos reales que te proveo. NO inventes cifras. Solo analizá las que están en el texto y en el resumen de módulos.

DATOS FINANCIEROS:
${rawText}

RESUMEN DE MÓDULOS CALCULADOS:
- Check List: ${resumen.clScore}% positivo (${resumen.clGreen} de ${resumen.clTotal} indicadores ✓)
- ROImp: ${resumen.roImp ? resumen.roImp.toFixed(2)+'%' : 'N/E'} vs WACC ${resumen.wacc||'N/E'}% → ${resumen.roimpVerd}
- Acciones 360: Salud financiera ${resumen.health360}%
- Señales v3.0: ${resumen.senalesPct}% (${resumen.senalesCumple}/${resumen.senalesTotal} puntos CUMPLEN)
- Congruencia de ORO: ${resumen.oroCount}/4 condiciones

INSTRUCCIONES:
1. Analizá las fortalezas fundamentales reales.
2. Identificá los riesgos clave con cifras del texto.
3. Evaluá la posición de deuda con los números dados.
4. Dá una perspectiva de valoración usando EV/EBIT, ROImp, WACC.
5. Conclusión de inversión (favorable / cautela / negativa) con justificación.
6. NO inventes proyecciones, ratings de agencias ni datos externos.
7. Estructurá con subtítulos claros (## Fortalezas, ## Riesgos, ## Deuda, ## Valoración, ## Conclusión).`;

  try {
    const res = await fetch('/api/analisis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto: rawText, empresa, prompt_extra: prompt })
    });
    if (!res.ok) throw new Error('Error ' + res.status);
    const data = await res.json();
    return data.analisis || data.result || 'Sin respuesta del modelo.';
  } catch (e) {
    return `Error al contactar el servicio de IA: ${e.message}. Verificá que el servidor esté corriendo y tengas API key configurada.`;
  }
}

function megaRenderIA(texto, empresa, containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `
  <div class="sec-title">🤖 Análisis IA — GPT-4o · Círculo Azul</div>
  <div style="background:rgba(26,86,196,.06);border:1px solid var(--border);border-radius:8px;padding:.7rem 1rem;margin-bottom:1rem;font-size:.78rem;color:var(--text3)">
    ⚠ El Análisis IA se basa exclusivamente en los datos que ingresaste. No inventa cifras ni usa fuentes externas.
  </div>
  <div class="ia-section">
    <h3>📊 ${empresa}</h3>
    <div class="ia-text">${texto.replace(/\n/g,'<br>').replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/#{1,3} (.+)/g,'<h4 style="color:var(--gold);margin:.6rem 0 .3rem">$1</h4>')}</div>
  </div>`;
}
