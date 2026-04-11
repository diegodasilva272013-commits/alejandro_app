'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// infravaloradas-main.js — UI principal, historial, PDF, renderizado
// ═══════════════════════════════════════════════════════════════════════════════

let _currentResult = null;
let _currentTicker = '';

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.getElementById('inp').addEventListener('keydown', e => {
  if (e.key === 'Enter') run();
});
document.getElementById('inp').addEventListener('input', e => {
  e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9.]/g, '');
});

// ─── MAIN FLOW ────────────────────────────────────────────────────────────────
async function run() {
  const ticker = (document.getElementById('inp').value || '').trim().toUpperCase();
  if (!ticker) return;
  if (/[^A-Z0-9.]/.test(ticker)) {
    showError('Solo letras y números permitidos');
    return;
  }

  clearError();
  _currentTicker = ticker;
  _currentResult = null;

  document.getElementById('btn').disabled = true;
  document.getElementById('spinTicker').textContent = ticker;
  show('searchArea', true);
  show('spinner', true, 'flex');
  show('resultsSection', false);
  document.getElementById('topActions').style.display = 'none';
  document.getElementById('topActionsInit').style.display = 'flex';

  try {
    const data = await infraLlamarAPI(ticker);
    _currentResult = data;
    renderAll(data);
    show('searchArea', false);
    show('spinner', false);
    show('resultsSection', true, 'block');
    document.getElementById('topActions').style.display = 'flex';
    document.getElementById('topActionsInit').style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    showError(err.message || 'Error al analizar. Verificá el ticker e intentá de nuevo.');
    show('spinner', false);
  } finally {
    document.getElementById('btn').disabled = false;
  }
}

function nuevoAnalisis() {
  _currentResult = null;
  _currentTicker = '';
  document.getElementById('inp').value = '';
  document.getElementById('conclusionArea').innerHTML = '';
  document.getElementById('tablaArea').innerHTML = '';
  document.getElementById('lecturaArea').innerHTML = '';
  show('resultsSection', false);
  show('searchArea', true);
  document.getElementById('topActions').style.display = 'none';
  document.getElementById('topActionsInit').style.display = 'flex';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function show(id, visible, displayType) {
  const el = document.getElementById(id);
  if (el) el.style.display = visible ? (displayType || 'block') : 'none';
}

function showError(msg) {
  const el = document.getElementById('errMsg');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

function clearError() {
  const el = document.getElementById('errMsg');
  if (el) { el.style.display = 'none'; el.textContent = ''; }
}

function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.style.opacity = '1';
  t.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateX(-50%) translateY(8px)';
  }, 2800);
}

// ─── RENDER ALL ───────────────────────────────────────────────────────────────
function renderAll(data) {
  renderConclusion(data.conclusion_rapida, data.ticker, data.empresa);
  renderTabla(data.tabla_maestra, data.ticker, data.empresa);
  renderLectura(data.lectura_profesional);
}

// ─── CONCLUSION RAPIDA ────────────────────────────────────────────────────────
function renderConclusion(c, ticker, empresa) {
  if (!c) { document.getElementById('conclusionArea').innerHTML = ''; return; }

  const color = c.veredicto || 'verde';
  const iconMap = { verde: '🟢', amarillo: '🟡', rojo: '🔴' };
  const cpIconMap = { verde: '✅', amarillo: '🟡', rojo: '🔴' };

  const puntosHTML = (c.puntos || []).map(p => {
    const cls = 'cp-' + (p.color || 'verde');
    return `<li class="${cls}"><span class="cp-icon">${cpIconMap[p.color] || '✅'}</span> ${esc(p.texto)}</li>`;
  }).join('');

  document.getElementById('conclusionArea').innerHTML = `
    <div class="conclusion-card ${color}">
      <div class="conclusion-header">🧠 CONCLUSIÓN RÁPIDA ANTES DE LA TABLA</div>
      <div class="veredicto-principal ${color}">
        <span>${iconMap[color] || '🟢'}</span>
        <span>${esc(c.titulo)}</span>
      </div>
      ${c.subtitulo ? `<div class="veredicto-subtitulo">${esc(c.subtitulo)}</div>` : ''}
      <ul class="conclusion-puntos">${puntosHTML}</ul>
      <div class="conclusion-cierre">${iconMap[color] || '🟢'} ${esc(c.frase_cierre)}</div>
      ${c.aclaracion ? `<div class="conclusion-aclaracion">${esc(c.aclaracion)}</div>` : ''}
    </div>`;
}

// ─── TABLA MAESTRA ────────────────────────────────────────────────────────────
function renderTabla(tm, ticker, empresa) {
  if (!tm) { document.getElementById('tablaArea').innerHTML = ''; return; }

  const trimestres = tm.trimestres || INFRA_TRIMESTRES;
  const thCells = trimestres.map(t => `<th>${esc(t)}</th>`).join('');

  let tbodyHTML = '';
  (tm.ratios || []).forEach(ratio => {
    let cells = '';
    (ratio.valores || []).forEach(v => {
      const val = v.valor;
      const color = v.color || 'na';
      const isND = val === null || val === undefined || val === 'N/D' || val === '';
      const dotClass = color === 'verde' ? 'dot-verde' : color === 'amarillo' ? 'dot-amarillo' : color === 'rojo' ? 'dot-rojo' : 'dot-na';
      if (isND) {
        cells += `<td class="nd-cell val-cell">N/D<span class="color-dot dot-rojo"></span></td>`;
      } else {
        const formatted = typeof val === 'number' ? (Math.abs(val) >= 100 ? val.toFixed(0) : val.toFixed(2)) : esc(val);
        cells += `<td class="val-cell">${formatted}<span class="color-dot ${dotClass}"></span></td>`;
      }
    });
    tbodyHTML += `<tr><td>${esc(ratio.nombre)}</td>${cells}</tr>`;
  });

  const unidadesHTML = INFRA_UNIDADES_NOTA.map(u => `• ${esc(u)}`).join('<br>');

  document.getElementById('tablaArea').innerHTML = `
    <div class="tabla-section">
      <div class="tabla-header">
        <div>
          <div class="tabla-title">🧠📊 TABLA MAESTRA — ÚLTIMOS 12 TRIMESTRES</div>
          <div class="tabla-sub">${esc(ticker)} — ${esc(empresa)} (Q-12 → Q-1)</div>
        </div>
        <div class="legend">
          <span><i class="ld ld-g"></i>Verde</span>
          <span><i class="ld ld-a"></i>Amarillo</span>
          <span><i class="ld ld-r"></i>Rojo</span>
          <span><i class="ld ld-n"></i>N/D</span>
        </div>
      </div>
      <div class="tabla-unidades">Unidades:<br>${unidadesHTML}</div>
      ${tm.nota_metodologica ? `<div class="tabla-nota">📝 ${esc(tm.nota_metodologica)}</div>` : ''}
      ${tm.fuentes_usadas ? `<div class="tabla-fuentes">📚 Fuentes: ${(tm.fuentes_usadas || []).map(f => esc(f)).join(', ')}</div>` : ''}
      <div class="tbl-wrap">
        <table>
          <thead><tr><th>Ratio</th>${thCells}</tr></thead>
          <tbody>${tbodyHTML}</tbody>
        </table>
      </div>
    </div>`;
}

// ─── LECTURA PROFESIONAL ──────────────────────────────────────────────────────
function renderLectura(lect) {
  if (!lect) { document.getElementById('lecturaArea').innerHTML = ''; return; }

  const bloquesHTML = (lect.bloques || []).map(b => {
    const color = b.color_bloque || 'verde';
    const highlightHTML = b.highlight
      ? `<div class="bloque-highlight ${color}">${esc(b.icono || '🔥')} ${esc(b.highlight)}</div>`
      : '';

    return `
      <div class="bloque-card">
        <div class="bloque-header ${color}">
          <div class="bloque-num">${b.numero || ''}</div>
          <div class="bloque-icon">${b.icono || '🔥'}</div>
          <div class="bloque-titulo">${esc(b.titulo)}</div>
        </div>
        <div class="bloque-body">
          <div class="bloque-contenido">${esc(b.contenido)}</div>
          ${highlightHTML}
        </div>
      </div>`;
  }).join('');

  document.getElementById('lecturaArea').innerHTML = `
    <div class="lectura-section">
      <div class="lectura-title">🧠 LECTURA PROFESIONAL DE LA TABLA</div>
      ${lect.intro ? `<div class="lectura-intro">${esc(lect.intro)}</div>` : ''}
      ${bloquesHTML}
    </div>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── HISTORIAL (localStorage) ──────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
const INFRA_HIST_KEY = 'infravaloradas_historial';

function getHist() {
  try { return JSON.parse(localStorage.getItem(INFRA_HIST_KEY) || '[]'); }
  catch (e) { return []; }
}

function saveAnalisis() {
  if (!_currentResult) { alert('Primero generá un análisis.'); return; }
  const hist = getHist();
  const c = _currentResult.conclusion_rapida || {};
  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    ticker: _currentResult.ticker || _currentTicker,
    empresa: _currentResult.empresa || '',
    fecha: new Date().toISOString(),
    veredicto: c.veredicto || '',
    titulo: c.titulo || '',
    data: _currentResult
  };
  hist.unshift(entry);
  localStorage.setItem(INFRA_HIST_KEY, JSON.stringify(hist.slice(0, 50)));
  showToast('💾 Análisis guardado');
}

function openHist() {
  renderHistList();
  document.getElementById('hist-overlay').style.display = 'block';
  requestAnimationFrame(() => {
    document.getElementById('hist-panel').style.right = '0';
  });
}

function closeHist() {
  document.getElementById('hist-panel').style.right = '-440px';
  setTimeout(() => { document.getElementById('hist-overlay').style.display = 'none'; }, 320);
}

function renderHistList() {
  const list = document.getElementById('hist-list');
  const hist = getHist();
  if (!hist.length) {
    list.innerHTML = '<div style="color:#3d5a7a;text-align:center;padding:3rem 1rem;font-size:.83rem;line-height:1.6">No hay análisis guardados todavía.<br><br>Generá un análisis y usá<br>💾 <strong style="color:#14b8a6">Guardar</strong> para conservarlo aquí.</div>';
    return;
  }
  list.innerHTML = hist.map((e, i) => {
    const fecha = new Date(e.fecha);
    const fechaStr = fecha.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
    const hora = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    const vColor = e.veredicto === 'verde' ? '#16a34a' : e.veredicto === 'amarillo' ? '#d97706' : e.veredicto === 'rojo' ? '#dc2626' : '#6A829E';
    const vIcon = e.veredicto === 'verde' ? '🟢' : e.veredicto === 'amarillo' ? '🟡' : e.veredicto === 'rojo' ? '🔴' : '⚪';
    return `
    <div style="background:rgba(13,22,39,.6);border:1px solid rgba(26,86,196,.2);border-radius:8px;margin-bottom:.6rem;overflow:hidden;transition:border-color .2s">
      <div style="padding:.75rem 1rem;display:flex;align-items:flex-start;gap:.75rem">
        <div style="width:8px;height:8px;border-radius:50%;background:${vColor};margin-top:.35rem;flex-shrink:0"></div>
        <div style="flex:1;min-width:0">
          <div style="font-size:.88rem;font-weight:600;color:#D8E6F5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(e.ticker)} — ${esc(e.empresa)}</div>
          <div style="font-size:.68rem;color:#3d5a7a;margin-top:.1rem">${fechaStr} · ${hora}</div>
          <div style="font-size:.7rem;margin-top:.3rem;display:flex;gap:.6rem;flex-wrap:wrap">
            <span style="color:${vColor};font-weight:600">${vIcon} ${esc(e.veredicto || 'N/D')}</span>
            ${e.titulo ? `<span style="color:#5f7a99">${esc(e.titulo.slice(0, 40))}…</span>` : ''}
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:.3rem;flex-shrink:0">
          <button onclick="loadHistEntry(${i})" style="background:#0d9488;color:#fff;border:none;padding:.28rem .75rem;border-radius:5px;cursor:pointer;font-size:.7rem;font-weight:600;white-space:nowrap">↩ Cargar</button>
          <button onclick="deleteHistEntry(${i})" style="background:rgba(239,83,80,.12);color:#ef5350;border:1px solid rgba(239,83,80,.2);padding:.28rem .75rem;border-radius:5px;cursor:pointer;font-size:.7rem;white-space:nowrap">🗑 Borrar</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function loadHistEntry(index) {
  const hist = getHist();
  const entry = hist[index];
  if (!entry || !entry.data) {
    alert('Este análisis no tiene datos recuperables.');
    return;
  }
  closeHist();
  _currentResult = entry.data;
  _currentTicker = entry.ticker || '';
  document.getElementById('inp').value = _currentTicker;
  renderAll(_currentResult);
  show('searchArea', false);
  show('spinner', false);
  show('resultsSection', true, 'block');
  document.getElementById('topActions').style.display = 'flex';
  document.getElementById('topActionsInit').style.display = 'none';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteHistEntry(index) {
  if (!confirm('¿Borrar este análisis del historial?')) return;
  const hist = getHist();
  hist.splice(index, 1);
  localStorage.setItem(INFRA_HIST_KEY, JSON.stringify(hist));
  renderHistList();
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── PDF ───────────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
function verPDF() {
  if (!_currentResult) { alert('Primero generá un análisis.'); return; }

  const results = document.getElementById('resultsSection');
  const clone = results.cloneNode(true);

  // Remove "nuevo análisis" button from clone
  const btns = clone.querySelectorAll('.btn-nuevo');
  btns.forEach(b => b.parentElement.remove());

  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map(el => el.outerHTML).join('\n');

  const empresa = _currentResult.empresa || _currentTicker || 'Infravaloradas';
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>${empresa} — Protocolo Empresas Infravaloradas</title>
${styles}
<style>
  body { background:#05080F !important; margin:0; padding:0; }
  .topbar { display:none !important; }
  .wrap { padding:10px 28px !important; }
  @media print {
    body { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    .no-print { display:none !important; }
  }
</style>
</head>
<body>
<div class="print-toolbar no-print" style="position:sticky;top:0;z-index:9999;background:rgba(5,8,15,.97);backdrop-filter:blur(10px);border-bottom:1px solid rgba(20,184,166,.25);padding:.55rem 1.5rem;display:flex;gap:.65rem;align-items:center">
  <strong style="color:#D8E6F5;font-family:'Inter',sans-serif;font-size:.88rem;letter-spacing:.02em">📄 ${esc(empresa)} — Protocolo Infravaloradas</strong>
  <div style="flex:1"></div>
  <button onclick="window.print()" style="background:#0d9488;color:#fff;border:none;padding:.38rem 1.1rem;border-radius:6px;cursor:pointer;font-size:.8rem;font-weight:600;letter-spacing:.02em">🖨 Imprimir / Guardar PDF</button>
  <button onclick="window.close()" style="background:rgba(255,255,255,.07);color:#8FA8C8;border:1px solid rgba(255,255,255,.09);padding:.38rem .9rem;border-radius:6px;cursor:pointer;font-size:.8rem">✕ Cerrar</button>
</div>
<div class="wrap">
${clone.outerHTML}
</div>
</body></html>`;

  const win = window.open('', '_blank');
  if (!win) { alert('Habilitá las ventanas emergentes para este sitio.'); return; }
  win.document.write(html);
  win.document.close();
}

async function exportPDF() {
  if (!_currentResult) { alert('Primero generá un análisis.'); return; }
  const btn = document.querySelector('.btn-pdf-top');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Generando...'; }

  try {
    const results = document.getElementById('resultsSection');
    if (!results) throw new Error('No hay resultados activos');
    const empresa = _currentResult.empresa || _currentTicker || 'Infravaloradas';
    const filename = empresa.replace(/[^a-zA-Z0-9\u00C0-\u024F]/g, '_') + '_Infravaloradas_CirculoAzul.pdf';

    await html2pdf().set({
      margin:      [8, 4, 8, 4],
      filename:    filename,
      image:       { type: 'jpeg', quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#05080F', scrollY: 0 },
      jsPDF:       { unit: 'mm', format: 'a4', orientation: 'landscape' },
      pagebreak:   { mode: ['avoid-all', 'css', 'legacy'] }
    }).from(results).save();

  } catch (err) {
    console.error('exportPDF error:', err);
    alert('Error generando PDF: ' + err.message);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '⬇ Descargar PDF'; }
  }
}
