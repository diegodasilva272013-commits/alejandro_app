'use strict';

// ─── RATIO CONFIG ─────────────────────────────────────────────────────────────
const RATIO_CONFIG = [
  { key: 'roic',       greenFn: v => v >= 15,  amberFn: v => v >= 10 && v < 15  },
  { key: 'roa',        greenFn: v => v >= 10,  amberFn: v => v >= 7  && v < 10  },
  { key: 'roe',        greenFn: v => v >= 15,  amberFn: v => v >= 10 && v < 15  },
  { key: 'croic',      greenFn: v => v >= 10,  amberFn: v => v >= 7  && v < 10  },
  { key: 'per',        greenFn: v => v <= 20,  amberFn: v => v > 20  && v <= 30 },
  { key: 'fcfYield',   greenFn: v => v >= 5,   amberFn: v => v >= 3  && v < 5   },
  { key: 'ccr',        greenFn: v => v >= 1,   amberFn: v => v >= 0.8 && v < 1  },
  { key: 'ocfNi',      greenFn: v => v >= 1,   amberFn: v => v >= 0.8 && v < 1  },
  { key: 'fcfNi',      greenFn: v => v >= 1,   amberFn: v => v >= 0.8 && v < 1  },
  { key: 'accrual',    greenFn: v => v <= -5,  amberFn: v => v > -5  && v <= 0  },
  { key: 'assetTurn',  greenFn: v => v >= 0.5, amberFn: v => v >= 0.3 && v < 0.5 },
  { key: 'gpAssets',   greenFn: v => v >= 45,  amberFn: v => v >= 30 && v < 45  },
  { key: 'ebitMargin', greenFn: v => v >= 15,  amberFn: v => v >= 10 && v < 15  },
  { key: 'roicWacc',   greenFn: v => v > 0,    amberFn: v => v > -3  && v <= 0  },
  { key: 'fcfCagr',    greenFn: v => v >= 15,  amberFn: v => v >= 10 && v < 15  },
  { key: 'deudaFcf',   greenFn: v => v <= 3,   amberFn: v => v > 3   && v <= 5  },
  { key: 'altmanZ',    greenFn: v => v >= 3,   amberFn: v => v >= 1.8 && v < 3  },
  { key: 'piotroski',  greenFn: v => v >= 7,   amberFn: v => v >= 5  && v < 7   },
  { key: 'bookBill',   greenFn: v => v >= 1,   amberFn: v => v >= 0.9 && v < 1  },
  { key: 'backlog',    text: true, greenFn: v => typeof v === 'string' && v.toLowerCase().startsWith('crec'), amberFn: () => false },
];

function getStatus(key, value) {
  if (value === null || value === undefined || value === '' || value === 'N/D') return 'na';
  const cfg = RATIO_CONFIG.find(r => r.key === key);
  if (!cfg) return 'na';
  if (cfg.text) {
    if (typeof value !== 'string') return 'na';
    return cfg.greenFn(value) ? 'green' : 'red';
  }
  const n = parseFloat(value);
  if (isNaN(n)) return 'na';
  if (cfg.greenFn(n)) return 'green';
  if (cfg.amberFn && cfg.amberFn(n)) return 'amber';
  return 'red';
}

function fmtValue(value, unit) {
  if (value === null || value === undefined || value === '') return 'N/D';
  if (unit === 'txt') return String(value) || 'N/D';
  const n = parseFloat(value);
  if (isNaN(n)) return String(value) || 'N/D';
  if (unit === '%')  return n.toFixed(1) + '%';
  if (unit === '/9') return n.toFixed(0) + '/9';
  if (unit === 'x')  return n.toFixed(2) + 'x';
  return n.toFixed(2);
}

// ─── MARKDOWN RENDERER ────────────────────────────────────────────────────────
function renderMarkdown(md) {
  if (!md) return '';
  return md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
    .replace(/\n{2,}/g, '\n')
    .split('\n')
    .map(line => {
      const t = line.trim();
      if (!t) return '';
      if (/^<[hul]/.test(t)) return t;
      return `<p>${t}</p>`;
    })
    .join('');
}

// ─── UI HELPERS ───────────────────────────────────────────────────────────────
function setStep(n) {
  for (let i = 1; i <= 4; i++) {
    const el = document.getElementById('step' + i);
    if (!el) continue;
    el.className = i < n ? 'loading-step done' : i === n ? 'loading-step active' : 'loading-step';
  }
}

function showSection(id, show, displayType) {
  const el = document.getElementById(id);
  if (el) el.style.display = show ? (displayType || 'block') : 'none';
}

function showError(msg) {
  const el = document.getElementById('errorBanner');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

function clearError() {
  const el = document.getElementById('errorBanner');
  if (el) { el.style.display = 'none'; el.textContent = ''; }
}

// ─── PROTOCOL SCORE ───────────────────────────────────────────────────────────
function renderProtocol(ratiosData) {
  let green = 0, amber = 0, red = 0, na = 0;

  (ratiosData.ratios || []).forEach(ratio => {
    const last = [...(ratio.values || [])].reverse().find(v => v !== null && v !== undefined && v !== '' && v !== 'N/D');
    const st = getStatus(ratio.key, last);
    if (st === 'green') green++;
    else if (st === 'amber') amber++;
    else if (st === 'red') red++;
    else na++;
  });

  const effective = green + amber + red;
  const score = effective > 0 ? Math.round((green / effective) * 100) : 0;

  document.getElementById('protocolTicker').textContent = ratiosData.ticker || '';
  document.getElementById('protocolCompany').textContent = ratiosData.company || ratiosData.ticker || '';
  document.getElementById('countGreen').textContent = green;
  document.getElementById('countAmber').textContent = amber;
  document.getElementById('countRed').textContent = red;
  document.getElementById('scoreNum').textContent = score;

  const arc = document.getElementById('scoreArc');
  if (arc) {
    const circumference = 289;
    arc.style.strokeDashoffset = circumference - (score / 100) * circumference;
    arc.style.stroke = score >= 75 ? '#2ECC71' : score >= 50 ? '#F39C12' : '#E74C3C';
  }

  const badge = document.getElementById('protocolBadge');
  if (badge) {
    if (green >= 15) { badge.textContent = '⭐ Empresa Extraordinaria'; badge.className = 'protocol-badge badge-extraordinary'; }
    else if (green >= 10) { badge.textContent = '👁 En Seguimiento'; badge.className = 'protocol-badge badge-seguimiento'; }
    else { badge.textContent = '✕ Descartar'; badge.className = 'protocol-badge badge-descartar'; }
  }
}

// ─── RENDER TABLE ─────────────────────────────────────────────────────────────
function renderTable(ratiosData) {
  const months = ratiosData.months || ratiosData.quarters || [];

  // Subtitle
  const sub = document.getElementById('tableSubtitle');
  if (sub && months.length > 0) {
    sub.textContent = `20 indicadores · ${months[0]} → ${months[months.length - 1]}`;
  }

  // Header
  const thead = document.getElementById('ratiosHead');
  if (thead) {
    thead.innerHTML = `<tr>
      <th style="text-align:left;min-width:190px">Indicador</th>
      <th style="width:28px"></th>
      ${months.map(m => `<th>${m}</th>`).join('')}
    </tr>`;
  }

  // Body
  const tbody = document.getElementById('ratiosBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  (ratiosData.ratios || []).forEach(ratio => {
    const vals = ratio.values || [];
    const lastVal = [...vals].reverse().find(v => v !== null && v !== undefined && v !== '' && v !== 'N/D');
    const rowStatus = getStatus(ratio.key, lastVal);

    const dotClass = { green: 's-green', amber: 's-amber', red: 's-red', na: 's-na' }[rowStatus] || 's-na';

    const cells = months.map((_, i) => {
      const val = vals[i];
      const st = getStatus(ratio.key, val);
      const isEmpty = val === null || val === undefined || val === '' || val === 'N/D';
      const cls = isEmpty ? 'cell-na' : { green: 'cell-green', amber: 'cell-amber', red: 'cell-red', na: 'cell-na' }[st] || 'cell-na';
      return `<td class="${cls}">${fmtValue(val, ratio.unit)}</td>`;
    }).join('');

    tbody.innerHTML += `<tr>
      <td class="td-name">${ratio.name}</td>
      <td class="td-status"><span class="status-dot ${dotClass}"></span></td>
      ${cells}
    </tr>`;
  });
}

// ─── NARRATIVE ────────────────────────────────────────────────────────────────
function renderNarrative(text) {
  const el = document.getElementById('narrativeContent');
  if (el) el.innerHTML = renderMarkdown(text);
}

function showNarrativeLoading() {
  const el = document.getElementById('narrativeContent');
  if (el) el.innerHTML = `<div style="display:flex;align-items:center;gap:12px;padding:20px 0;color:var(--silver1)">
    <div class="loading-spinner" style="width:24px;height:24px;border-width:2px"></div>
    <span>Generando análisis narrativo...</span>
  </div>`;
}

// ─── MAIN FLOW ────────────────────────────────────────────────────────────────
async function startAnalysis() {
  const input = document.getElementById('searchInput').value.trim();
  if (!input) return;

  clearError();
  document.getElementById('searchBtn').disabled = true;

  // Reset UI
  showSection('emptyState', false);
  showSection('resultsSection', false, 'flex');
  showSection('loadingSection', true, 'flex');
  setStep(1);

  try {
    // ── Step 1: fetch ratios ──
    setStep(1);
    const ratiosRes = await fetch('/api/emp-ext/ratios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticker: input, company: input }),
    });

    const ratiosData = await ratiosRes.json();
    if (!ratiosRes.ok) throw new Error(ratiosData.error || 'Error obteniendo ratios');

    // ── Step 2: render table ──
    setStep(2);
    await new Promise(r => setTimeout(r, 200));

    renderTable(ratiosData);
    renderProtocol(ratiosData);

    // ── Mostrar tabla — ocultar spinner global ──
    showSection('loadingSection', false);
    showSection('resultsSection', true, 'flex');
    showNarrativeLoading();  // spinner pequeño solo en la card de análisis

    // ── Step 3: fetch narrative (sin spinner global) ──
    const analisisRes = await fetch('/api/emp-ext/analisis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticker: ratiosData.ticker, company: ratiosData.company }),
    });

    const analisisData = await analisisRes.json();
    if (!analisisRes.ok) throw new Error(analisisData.error || 'Error generando análisis');

    // ── Step 4: compile ──
    setStep(4);
    await new Promise(r => setTimeout(r, 150));

    renderNarrative(analisisData.analisis);

  } catch (err) {
    showError('Error: ' + err.message);
    showSection('emptyState', !document.getElementById('ratiosBody').children.length, 'flex');
  } finally {
    showSection('loadingSection', false);
    showSection('resultsSection', true, 'flex');
    document.getElementById('searchBtn').disabled = false;
  }
}

// ─── ENTER KEY ────────────────────────────────────────────────────────────────
document.getElementById('searchInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') startAnalysis();
});
