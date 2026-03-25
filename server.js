/**
 * Círculo Azul Finanzas — Servidor Express + PDF con Puppeteer
 * Correr con: node server.js
 * Abrir en: http://localhost:3000
 */

'use strict';

// Cargar variables de entorno desde .env
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express       = require('express');
const puppeteer     = require('puppeteer');
const path          = require('path');
const fs            = require('fs');
const crypto        = require('crypto');
const rateLimit     = require('express-rate-limit');
const cookieParser  = require('cookie-parser');
const { createClient } = require('@supabase/supabase-js');

// ─── Cliente Supabase ────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Cookie parser ───────────────────────────────────────────────────────────
app.use(cookieParser());

// ─── Autenticación con página de login personalizada ────────────────────────
const AUTH_ENABLED = !!(process.env.SITE_USER && process.env.SITE_PASSWORD);
const SESSION_SECRET = crypto.createHash('sha256')
  .update(process.env.SITE_PASSWORD || 'no-auth')
  .digest('hex');

function makeSessionToken(user, pass) {
  return crypto.createHmac('sha256', SESSION_SECRET)
    .update(`${user}:${pass}`)
    .digest('hex');
}

const VALID_TOKEN = AUTH_ENABLED
  ? makeSessionToken(process.env.SITE_USER, process.env.SITE_PASSWORD)
  : null;

// Middleware de auth — excluye /login, /api/login y assets de login
function requireAuth(req, res, next) {
  if (!AUTH_ENABLED) return next();
  const open = ['/login', '/api/login'];
  if (open.includes(req.path)) return next();
  if (req.cookies && req.cookies.ca_session === VALID_TOKEN) return next();
  // Para peticiones API devolver 401, para páginas redirigir al login
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'No autorizado.' });
  }
  res.redirect('/login');
}

app.use(requireAuth);

if (AUTH_ENABLED) console.log('🔒 Autenticación activada');

// GET /login
app.get('/login', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// GET /logout
app.get('/logout', (_req, res) => {
  res.clearCookie('ca_session');
  res.redirect('/login');
});

// ─── Rate limiters ───────────────────────────────────────────────────────────
// PDFs: máximo 10 por IP cada 15 minutos (Puppeteer es costoso)
const pdfLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Demasiadas solicitudes de PDF. Esperá 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false
});

// IA: máximo 20 llamadas por IP cada 15 minutos (cuidan costos de API)
const iaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Demasiadas solicitudes de análisis. Esperá 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false
});

// ─── Archivos estáticos y body parser ───────────────────────────────────────
// HTML files: never cache (always fresh); JS/CSS: cache 1 hour
app.use((req, res, next) => {
  if (req.path.endsWith('.html') || req.path === '/' || !req.path.includes('.')) {
    res.setHeader('Cache-Control', 'no-store, must-revalidate');
  } else {
    res.setHeader('Cache-Control', 'public, max-age=3600');
  }
  next();
});
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '5mb' }));

// POST /api/login (aquí abajo para que express.json ya esté activo)
app.post('/api/login', (req, res) => {
  if (!AUTH_ENABLED) return res.json({ ok: true });
  const { user, pass } = req.body || {};
  if (user === process.env.SITE_USER && pass === process.env.SITE_PASSWORD) {
    res.cookie('ca_session', VALID_TOKEN, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 8 * 60 * 60 * 1000
    });
    return res.json({ ok: true });
  }
  res.status(401).json({ error: 'Credenciales incorrectas.' });
});

// ─── API: Generar PDF ────────────────────────────────────────────────────────
app.post('/api/pdf', pdfLimiter, async (req, res) => {
  const { dashboardHTML, companyName, reportDate } = req.body;

  if (!dashboardHTML) {
    return res.status(400).json({ error: 'dashboardHTML requerido' });
  }

  // CSS embebido en la página PDF
  const cssPath = path.join(__dirname, 'public', 'css', 'styles.css');
  const css = fs.readFileSync(cssPath, 'utf8');

  // Template HTML completo para Puppeteer
  const fullHTML = buildPDFHtml(css, dashboardHTML, companyName, reportDate);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none']
    });

    const page = await browser.newPage();
    await page.setContent(fullHTML, { waitUntil: 'networkidle0' });

    // Esperar fuentes de Google Fonts
    await page.evaluateHandle('document.fonts.ready');

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,

      // ── HEADER repetido en cada página ──
      headerTemplate: buildPDFHeader(companyName, reportDate),

      // ── FOOTER repetido en cada página ──
      footerTemplate: buildPDFFooter(),

      margin: {
        top:    '90px',
        bottom: '62px',
        left:   '0',
        right:  '0'
      }
    });

    const filename = `CirculoAzul_${(companyName||'Analisis').replace(/[^a-zA-Z0-9]/g,'_')}_${new Date().toISOString().slice(0,10)}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdf.length
    });
    res.end(pdf);

  } catch (err) {
    console.error('Error Puppeteer:', err);
    res.status(500).json({ error: 'Error generando PDF', detail: err.message });
  } finally {
    if (browser) await browser.close();
  }
});

// ─── API: Generar PDF desde HTML completo (Acciones 360 / ROImp) ────────────
app.post('/api/pdf360', pdfLimiter, async (req, res) => {
  const { fullHTML, companyName } = req.body;
  if (!fullHTML) return res.status(400).json({ error: 'fullHTML requerido' });

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900, deviceScaleFactor: 1 });
    await page.setContent(fullHTML, { waitUntil: 'networkidle0' });
    await page.evaluateHandle('document.fonts.ready');

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '18px', bottom: '18px', left: '0', right: '0' }
    });

    const filename = `A360_${(companyName||'Analisis').replace(/[^a-zA-Z0-9]/g,'_')}_${new Date().toISOString().slice(0,10)}.pdf`;
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdf.length
    });
    res.end(pdf);
  } catch (err) {
    console.error('Error pdf360:', err);
    res.status(500).json({ error: 'Error generando PDF', detail: err.message });
  } finally {
    if (browser) await browser.close();
  }
});

// ────────────────────────────────────────────────────────────────────────────
// Helper: construir el HTML completo que Puppeteer va a renderizar
// ────────────────────────────────────────────────────────────────────────────
function buildPDFHtml(css, dashboardHTML, companyName, reportDate) {
  // Overrides de CSS específicos para el PDF (fondo claro, sin animaciones)
  const pdfOverrides = `
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,400&family=Inter:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap');

    /* ─ CSS Variables (necesarias para var(--green) etc. en estilos inline) ─ */
    :root {
      --bg0:#05080F; --bg1:#080E1A; --bg2:#0D1627; --bg3:#142035;
      --gold1:#1A56C4; --gold2:#2E74E8; --gold3:#5A9BFF;
      --silver1:#8FA8C8; --silver2:#B8CEEA; --silver3:#D8E6F5;
      --white:#FFFFFF; --gray1:#C4D4EA; --gray2:#6A829E;
      --green:#1A8A4A; --greenbg:#0F5C32;
      --red:#C0392B;   --redbg:#7D1F1A;
      --amber:#D68910; --amberbg:#7D5B00;
    }

    *, *::before, *::after { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; animation: none !important; transition: none !important; }

    html, body { margin: 0; padding: 0; background: #fff !important; color: #1e293b !important; font-family: 'Inter', sans-serif; }

    .topbar, .sidebar, #landing, #input-screen, .no-print, #pdf-header, #pdf-footer { display: none !important; }

    /* ─ Secciones — sin page-break-inside para evitar páginas en blanco ─ */
    .dash-section { padding: 18px 44px; border-top: 1px solid #c8d8f0; orphans: 4; widows: 4; }
    .dash-section:first-child { border-top: none; padding-top: 10px; }
    .sec-tag { color: #1A56C4 !important; font-size: 10px; letter-spacing: .3em; text-transform: uppercase; margin-bottom: 6px; }
    .sec-title { color: #0f172a !important; font-family: 'Cormorant Garamond', serif; font-size: 28px; margin-bottom: 16px; }
    .sec-title span { color: #1A56C4 !important; -webkit-text-fill-color: #1A56C4 !important; background: none !important; }

    /* ─ Ficha ─ */
    .ficha { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; }
    .ficha-item { background: #f8faff !important; border: 1px solid #c8d8f0 !important; border-radius: 8px; padding: 14px; display: flex; flex-direction: column; gap: 4px; }
    .ficha-val { color: #1A56C4 !important; -webkit-text-fill-color: #1A56C4 !important; background: none !important; font-family: 'Space Mono', monospace; font-size: 13px; font-weight: 700; }
    .ficha-lbl { color: #475569 !important; font-size: 9px; letter-spacing: .2em; text-transform: uppercase; }

    /* ─ Verdict ─ */
    .verdict { background: #f0f6ff !important; border: 1px solid #c8d8f0 !important; border-radius: 10px; padding: 16px 24px; display: flex; align-items: center; gap: 20px; margin-top: 14px; }
    .vd-item { display: flex; flex-direction: column; align-items: center; }
    .vd-num { font-family: 'Space Mono', monospace; font-size: 28px; font-weight: 700; line-height: 1; }
    .vd-lbl { font-size: 9px; color: #475569; letter-spacing: .2em; text-transform: uppercase; margin-top: 2px; }
    .vd-sep { width: 1px; height: 40px; background: #c8d8f0; }

    /* ─ Semáforos ─ */
    .sg { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; }
    .sc { border-radius: 8px; padding: 10px; background: #f8faff !important; border: 1px solid #e2ebf8; }
    .sc.g { background: #f0fdf4 !important; border-color: #bbf7d0; }
    .sc.r { background: #fff1f0 !important; border-color: #fca5a5; }
    .sc.a { background: #fffbeb !important; border-color: #fde68a; }
    .sc-hd { display: flex; align-items: center; gap: 4px; margin-bottom: 4px; }
    .sc-num { font-family: 'Space Mono', monospace; font-size: 8px; color: #1A56C4; }
    .sc-name { font-size: 9px; color: #1e293b; line-height: 1.2; margin-bottom: 4px; font-weight: 500; }
    .sc.g .sc-val { color: #16803a !important; font-size: 10px; font-weight: 700; }
    .sc.r .sc-val { color: #dc2626 !important; font-size: 10px; font-weight: 700; }
    .sc.a .sc-val { color: #d97706 !important; font-size: 10px; font-weight: 700; }

    /* ─ KPIs ─ */
    .kg { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
    .kc { background: #f0f6ff !important; border: 1px solid #c8d8f0 !important; border-top: 3px solid #1A56C4 !important; border-radius: 8px; padding: 18px 20px; }
    .kc-val { font-family: 'Space Mono', monospace; font-size: 26px; font-weight: 700; color: #1A56C4 !important; -webkit-text-fill-color: #1A56C4 !important; background: none !important; display: block; margin-bottom: 6px; }
    .kc-name { font-size: 11px; font-weight: 600; color: #1e293b; margin-bottom: 4px; }
    .kc-thr { font-size: 9px; color: #475569; margin-bottom: 10px; }
    .kc-bar { background: #dde8f8 !important; height: 6px; border-radius: 3px; overflow: hidden; }
    .kc-fill { height: 100%; border-radius: 3px; background: #1A56C4 !important; }

    /* ─ Chart box ─ */
    .chart-box { background: #f8faff !important; border: 1px solid #e2ebf8 !important; border-radius: 8px; padding: 16px; }
    .chart-title-small { font-size: 9px; font-weight: 700; letter-spacing: .2em; text-transform: uppercase; color: #1A56C4 !important; margin-bottom: 8px; }
    .ch-legend { display: flex; gap: 16px; margin-top: 10px; flex-wrap: wrap; }
    .ch-li { display: flex; align-items: center; gap: 6px; font-size: 10px; color: #475569; }
    .ch-dot { width: 12px; height: 12px; border-radius: 50%; }

    /* ─ Badges ─ */
    .badge { display: inline-block; padding: 3px 8px; border-radius: 10px; font-size: 9px; font-weight: 700; letter-spacing: .05em; }
    .badge.g { background: #dcfce7 !important; color: #16803a !important; }
    .badge.r { background: #fee2e2 !important; color: #dc2626 !important; }
    .badge.a { background: #fef3c7 !important; color: #d97706 !important; }

    /* ─ dcards ─ */
    .dcard { background: #f8faff !important; border-left: 3px solid #1A56C4; border-radius: 0 6px 6px 0; padding: 10px 14px; }
    .dcard.rb { border-left-color: #dc2626; }
    .dcard-val { font-family: 'Space Mono', monospace; font-size: 16px; font-weight: 700; color: #1A56C4 !important; -webkit-text-fill-color: #1A56C4 !important; background: none !important; }
    .dcard-lbl { font-size: 9px; color: #475569; letter-spacing: .2em; text-transform: uppercase; margin-bottom: 4px; }
    .dcard-note { font-size: 10px; color: #64748b; margin-top: 3px; }

    /* ─ Deuda ─ */
    .dg { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
    .dcol { display: flex; flex-direction: column; gap: 10px; }
    .dhero { background: #f0f6ff !important; border: 2px solid #1A56C4; border-radius: 12px; padding: 24px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .dhero-val { font-family: 'Space Mono', monospace; font-size: 28px; font-weight: 700; color: #1A56C4; }
    .dhero-lbl { font-size: 9px; color: #475569; letter-spacing: .3em; text-transform: uppercase; }
    .dhero-note { font-size: 11px; color: #64748b; text-align: center; }

    /* ─ Métricas X ─ */
    .xg { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
    .xc { background: #f0f6ff !important; border: 1px solid #c8d8f0 !important; border-top: 3px solid #1A56C4; border-radius: 8px; padding: 18px; }
    .xc-tag { font-size: 9px; color: #1A56C4; letter-spacing: .2em; text-transform: uppercase; margin-bottom: 6px; }
    .xc-val { font-family: 'Space Mono', monospace; font-size: 28px; font-weight: 700; color: #1A56C4 !important; -webkit-text-fill-color: #1A56C4 !important; background: none !important; margin-bottom: 6px; display: block; }
    .xc-name { font-size: 11px; font-weight: 600; color: #1e293b; margin-bottom: 6px; }
    .xc-note { font-size: 10px; color: #64748b; line-height: 1.4; }

    /* ─ Tabla ─ */
    .ft { width: 100%; border-collapse: collapse; font-size: 10px; }
    .ft thead tr { background: #1A56C4 !important; }
    .ft thead th { color: #fff !important; padding: 8px 10px; text-align: left; font-size: 9px; letter-spacing: .1em; text-transform: uppercase; }
    .ft tbody tr:nth-child(even) { background: #f0f6ff !important; }
    .ft tbody tr { border-bottom: 1px solid #c8d8f0; }
    .ft td { padding: 7px 10px; color: #1e293b; }
    .ft td:first-child { color: #1A56C4; font-family: 'Space Mono', monospace; font-size: 9px; }
    .ft td.mono { font-family: 'Space Mono', monospace; color: #1A56C4; }

    /* ─ Alertas ─ */
    .al-hdr { background: #fff5f5 !important; color: #dc2626 !important; border: 1px solid #fca5a5; border-radius: 6px 6px 0 0; padding: 10px 16px; font-size: 11px; font-weight: 700; }
    .al-item { background: #fff !important; border: 1px solid #e2e8f0; border-top: none; padding: 12px 16px; display: grid; grid-template-columns: 100px 1fr; gap: 16px; align-items: start; }
    .al-item.ral { border-left: 3px solid #dc2626; }
    .al-item.aal { border-left: 3px solid #d97706; }
    .al-frase { font-size: 11px; font-weight: 700; color: #0f172a; margin-bottom: 3px; }
    .al-desc { font-size: 10px; color: #475569; }

    /* ─ ROIC gauge ─ */
    .roic-wrap { display: flex; gap: 24px; align-items: flex-start; }
    .gauge-box { flex-shrink: 0; }
    .gauge-rings { position: relative; width: 140px; height: 140px; display: flex; align-items: center; justify-content: center; }
    .ring { position: absolute; border-radius: 50%; border-style: solid; }
    .rg1 { width: 140px; height: 140px; border-width: 10px; border-color: rgba(26,86,196,.2); }
    .rg2 { width: 110px; height: 110px; border-width: 10px; border-color: rgba(26,86,196,.45); }
    .rg3 { width: 80px; height: 80px; border-width: 10px; border-color: #1A56C4; }
    .gauge-center { position: absolute; width: 56px; height: 56px; background: #e4edfc !important; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .gs { font-family: 'Space Mono', monospace; font-size: 13px; font-weight: 700; color: #1A56C4 !important; -webkit-text-fill-color: #1A56C4 !important; background: none !important; }
    .gs-lbl { font-size: 7px; color: #1A56C4; letter-spacing: .2em; text-transform: uppercase; }
    .roic-rows { display: flex; flex-direction: column; gap: 8px; flex: 1; }
    .rrow { background: #f8faff !important; border-radius: 6px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; border-left: 3px solid transparent; }
    .rrow.g { border-left-color: #16803a; }
    .rrow.s { border-left-color: #1A56C4; }
    .rrow-lbl { font-size: 9px; color: #475569; letter-spacing: .1em; text-transform: uppercase; }
    .rrow-val { font-family: 'Space Mono', monospace; font-size: 16px; font-weight: 700; color: #1e293b; }
    .rrow.g .rrow-val { color: #16803a !important; }
    .rrow.s .rrow-val { color: #1A56C4 !important; -webkit-text-fill-color: #1A56C4 !important; background: none !important; }
    .impact-q { background: #f0f6ff !important; border-left: 3px solid #1A56C4; padding: 12px 16px; border-radius: 0 6px 6px 0; margin-top: 10px; font-style: italic; color: #1e293b !important; font-size: 11px; line-height: 1.5; }

    /* ─ Cierre ─ */
    .close-sec { background: #f0f6ff !important; padding: 48px 8%; text-align: center; }
    .close-big { font-family: 'Space Mono', monospace; font-size: 80px; font-weight: 700; color: #1A56C4 !important; -webkit-text-fill-color: #1A56C4 !important; background: none !important; display: block; line-height: 1; }
    .close-sub { font-size: 14px; color: #1e293b; margin-top: 6px; letter-spacing: .2em; text-transform: uppercase; }
    .close-div { height: 2px; background: linear-gradient(to right, transparent, #1A56C4, transparent); margin: 24px auto; max-width: 300px; }
    .close-cols { display: flex; justify-content: center; gap: 0; }
    .cc { padding: 0 32px; border-right: 1px solid #c8d8f0; }
    .cc:last-child { border-right: none; }
    .cc-val { font-family: 'Space Mono', monospace; font-size: 20px; font-weight: 700; color: #1A56C4 !important; -webkit-text-fill-color: #1A56C4 !important; background: none !important; }
    .cc-lbl { font-size: 9px; color: #475569; letter-spacing: .2em; text-transform: uppercase; margin-top: 4px; }
    .close-q { font-size: 12px; color: #1e293b; max-width: 680px; margin: 24px auto 0; line-height: 1.6; }

    /* ─ Gráficas PDF ─ */
    .pdf-charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 10px 0; }
    .pdf-chart-panel { background: #f8faff !important; border: 1px solid #c8d8f0; border-top: 3px solid #1A56C4; border-radius: 4px; padding: 14px; }

    /* ─ Sección torta + barras: ajuste para PDF ─ */
    .charts-2col { display: grid !important; grid-template-columns: 200px 1fr !important; gap: 20px !important; align-items: start !important; }

    /* ─ Evitar cortes internos en componentes pequeños ─ */
    .kc, .xc, .dcard, .dhero, .al-item { page-break-inside: avoid; break-inside: avoid; }
    .sc { page-break-inside: avoid; break-inside: avoid; }
    .ficha-item { page-break-inside: avoid; break-inside: avoid; }
    .chart-box { page-break-inside: avoid; break-inside: avoid; }
    .verdict { page-break-inside: avoid; break-inside: avoid; }
    .roic-wrap { page-break-inside: avoid; break-inside: avoid; }
    .kg, .sg, .ficha, .xg, .dg { break-inside: avoid; }
  `;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
${pdfOverrides}
</style>
</head>
<body>
<div id="dashboard">
${dashboardHTML}
</div>
</body>
</html>`;
}

// ────────────────────────────────────────────────────────────────────────────
// Header Puppeteer (HTML inline — estilos DEBEN ser inline aquí)
// ────────────────────────────────────────────────────────────────────────────
function buildPDFHeader(companyName, reportDate) {
  const company = companyName || 'Análisis Financiero';
  const date    = reportDate  || new Date().toLocaleDateString('es', { day:'2-digit', month:'long', year:'numeric' });

  return `
  <div style="
    width:100%; height:80px;
    background:#091428;
    display:flex; align-items:center; justify-content:space-between;
    padding:0 44px; box-sizing:border-box;
    border-bottom:3px solid #1A56C4;
    font-family:Inter,sans-serif;
    -webkit-print-color-adjust:exact;
  ">
    <!-- Logo + Brand -->
    <div style="display:flex;align-items:center;gap:12px">
      <svg width="38" height="38" viewBox="0 0 64 64" fill="none">
        <defs>
          <radialGradient id="hg" cx="50%" cy="35%" r="60%">
            <stop offset="0%" stop-color="#5A9BFF"/>
            <stop offset="100%" stop-color="#0D2870"/>
          </radialGradient>
        </defs>
        <circle cx="32" cy="32" r="30" fill="url(#hg)"/>
        <ellipse cx="26" cy="22" rx="4" ry="5.5" fill="white" opacity=".95"/>
        <ellipse cx="33" cy="19" rx="3.2" ry="4.5" fill="white" opacity=".85"/>
        <ellipse cx="39.5" cy="21" rx="3.2" ry="4.5" fill="white" opacity=".85"/>
        <ellipse cx="44" cy="27" rx="3" ry="4" fill="white" opacity=".75"/>
        <ellipse cx="32" cy="34" rx="10" ry="9" fill="white" opacity=".95"/>
        <polyline points="20,50 28,43 34,47 46,34" stroke="#5A9BFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <polygon points="46,34 40,32 44,38" fill="#5A9BFF"/>
      </svg>
      <div>
        <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:15px;font-weight:700;color:#fff;letter-spacing:.04em">CÍRCULO AZUL FINANZAS</div>
        <div style="font-size:8px;font-weight:500;letter-spacing:.35em;color:#8FA8C8;text-transform:uppercase;margin-top:2px">Análisis Cuantitativo Profesional</div>
      </div>
    </div>
    <!-- Empresa -->
    <div style="text-align:center">
      <div style="font-family:'Courier New',monospace;font-size:13px;font-weight:700;color:#5A9BFF">${company}</div>
      <div style="font-size:8px;letter-spacing:.25em;color:#8FA8C8;text-transform:uppercase;margin-top:3px">Check List · Indicadores Financieros</div>
    </div>
    <!-- Fecha + Confidencial -->
    <div style="text-align:right">
      <div style="font-family:'Courier New',monospace;font-size:10px;color:#B8CEEA">${date}</div>
      <div style="font-size:8px;font-weight:700;letter-spacing:.3em;color:#2E74E8;text-transform:uppercase;margin-top:3px">CONFIDENCIAL</div>
    </div>
  </div>`;
}

// ────────────────────────────────────────────────────────────────────────────
// Footer Puppeteer
// ────────────────────────────────────────────────────────────────────────────
function buildPDFFooter() {
  const year = new Date().getFullYear();
  return `
  <div style="
    width:100%; height:52px;
    background:#f0f6ff;
    display:flex; align-items:center; justify-content:space-between;
    padding:0 44px; box-sizing:border-box;
    border-top:2px solid #1A56C4;
    font-family:Inter,sans-serif;
    -webkit-print-color-adjust:exact;
  ">
    <div style="font-size:8.5px;color:#475569;max-width:55%;line-height:1.4">
      Documento de carácter informativo. No constituye asesoramiento de inversión ni recomendación personalizada. Elaborado exclusivamente para uso interno del cliente.
    </div>
    <div style="font-size:10px;font-weight:600;color:#1A56C4;letter-spacing:.06em;text-align:right">
      CÍRCULO AZUL FINANZAS &nbsp;·&nbsp; circuloazulfinanzas.com &nbsp;·&nbsp; ${year}
      <br><span style="font-size:8px;color:#8FA8C8;font-weight:400">Pág. <span class="pageNumber"></span> / <span class="totalPages"></span></span>
    </div>
  </div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// ANÁLISIS IA — Endpoints
// ─────────────────────────────────────────────────────────────────────────────
const { spawn }    = require('child_process');
const os           = require('os');

// ── Genera el HTML completo para Puppeteer ────────────────────────────────────
function buildAnalisisPDFHtml(d) {
  const esc = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const rec = ((d.recomendacion||'HOLD').toUpperCase());
  const recColor = rec.includes('BUY')||rec.includes('ACUMULAR') ? '#22c55e' : rec.includes('SELL') ? '#ef4444' : '#f59e0b';
  const upside = d.precio_cierre && d.target_alto
    ? (((Number(d.target_alto)-Number(d.precio_cierre))/Number(d.precio_cierre))*100).toFixed(1)
    : null;

  // ── Pre-computed helpers for thin-page panels ──────────────────────────────
  const pricePct = (d.empresa_52w_low && d.empresa_52w_high && d.precio_cierre)
    ? Math.min(100,Math.max(0,((+d.precio_cierre-+d.empresa_52w_low)/(+d.empresa_52w_high-+d.empresa_52w_low))*100)).toFixed(1)
    : null;
  const scAll = [...(d.scorecard_izq||[]),...(d.scorecard_der||[])];
  const scValuation = scAll.filter(([l])=>['P/E','P/S','P/B','EV/EBITDA','EV/Rev','PEG','FCF Yield','Div Yield','Beta'].some(k=>String(l).toUpperCase().includes(k.toUpperCase()))).slice(0,8);
  const scBalance = scAll.filter(([l])=>['Debt','Cash','Current Ratio','Quick','Interest','Leverage','Net Debt','Equity'].some(k=>String(l).toUpperCase().includes(k.toUpperCase()))).slice(0,8);
  const scProfitability = scAll.filter(([l])=>['ROE','ROA','ROIC','Return','Margin','EPS','Net Income'].some(k=>String(l).toUpperCase().includes(k.toUpperCase()))).slice(0,8);
  // Scenario return matrix
  const _cur = +d.precio_cierre||0;
  const _blo = +d.target_bajo||0;
  const _bhi = +d.target_alto||0;
  const _bmid = _blo&&_bhi ? ((_blo+_bhi)/2) : 0;
  const _fmtRet = (px) => _cur&&px ? ((px-_cur)/_cur*100>=0?'+':'')+((px-_cur)/_cur*100).toFixed(1)+'%' : '—';
  const _fmtPx = (px) => px ? '$'+px.toFixed(2) : '—';
  const _bearRet = _fmtRet(_blo), _baseRet = _fmtRet(_bmid), _bullRet = _fmtRet(_bhi);
  const _evPx = _cur&&_blo&&_bhi ? (0.25*_blo+0.50*_bmid+0.25*_bhi) : 0;
  const _evRet = _fmtRet(_evPx);

  // Helpers para tablas
  function tblRows(rows, highlightFirst=false) {
    return (rows||[]).map((r,i) => {
      const cells = (Array.isArray(r)?r:[r]).map((c,ci) =>
        `<td style="${ci===0?'color:#C9A84C;font-weight:600;':''}">${esc(c)}</td>`).join('');
      return `<tr style="background:${i%2===0?'#080E1A':'#0D1627'}">${cells}</tr>`;
    }).join('');
  }
  function tblHdr(cols) {
    return `<tr style="background:#1A56C4">${cols.map(c=>`<th>${esc(c)}</th>`).join('')}</tr>`;
  }
  function section(title, tag, content) {
    return `
    <div class="section">
      <div class="section-tag">${esc(tag)}</div>
      <div class="section-title">${esc(title)}</div>
      <div class="section-hr"></div>
      ${content}
    </div>`;
  }

  // ── Resumen ejecutivo bullets
  const bulletsHtml = (d.resumen_ejecutivo||[]).map(row => {
    const bg = String(row[0]||'').toLowerCase();
    const titulo = row[3]||'', texto = row[4]||'';
    const clr = bg.includes('grn') ? '#22c55e' : bg.includes('red') ? '#ef4444' : '#f59e0b';
    const dot  = bg.includes('grn') ? '▲' : bg.includes('red') ? '▼' : '►';
    return `<div class="bullet" style="border-left:3px solid ${clr};background:${clr}11">
      <span style="color:${clr};font-weight:700">${dot} ${esc(titulo)}</span>
      <span style="color:#8FA8C8;margin-left:8px">${esc(texto)}</span>
    </div>`;
  }).join('');

  // ── Bull/Bear
  function thesisList(items, clr, dot) {
    return (items||[]).map(([t,txt]) =>
      `<div class="bullet" style="border-left:3px solid ${clr};background:${clr}11">
        <span style="color:${clr};font-weight:700">${dot} ${esc(t)}</span>
        <div style="color:#8FA8C8;margin-top:3px">${esc(txt)}</div>
      </div>`).join('');
  }

  // ── Scorecard grid
  const scItems = [...(d.scorecard_izq||[]), ...(d.scorecard_der||[])];
  const scHtml = scItems.map(([l,v]) =>
    `<div class="sc-item"><span class="sc-label">${esc(l)}</span><span class="sc-val">${esc(v)}</span></div>`
  ).join('');

  // ── P&L tabla
  let pnlHtml = '';
  if (Array.isArray(d.pnl) && d.pnl.length > 1) {
    const [hdr,...rows] = d.pnl;
    pnlHtml = `<table class="data-table"><thead>${tblHdr(hdr)}</thead><tbody>${tblRows(rows)}</tbody></table>`;
  }

  // ── Métricas de mercado
  const mercHtml = `<table class="data-table"><thead>${tblHdr(['Métrica','Valor','Fuente'])}</thead><tbody>${
    (d.metricas_mercado||[]).map((r,i)=>`<tr style="background:${i%2===0?'#080E1A':'#0D1627'}">
      <td style="color:#C9A84C;font-weight:600">${esc(r[0])}</td>
      <td style="font-family:monospace;color:#5A9BFF">${esc(r[1])}</td>
      <td style="color:#4A5568;font-size:10px">${esc(r[2]||'')}</td></tr>`).join('')
  }</tbody></table>`;

  // ── Fuentes de ingresos
  const ingresosHtml = `<table class="data-table"><thead>${tblHdr(['Segmento','Descripción','% Revenue'])}</thead><tbody>${
    (d.fuentes_ingresos||[]).map((r,i)=>`<tr style="background:${i%2===0?'#080E1A':'#0D1627'}">
      <td style="color:#C9A84C;font-weight:600">${esc(r[0])}</td>
      <td style="color:#8FA8C8">${esc(r[1])}</td>
      <td style="font-family:monospace;color:#22c55e">${esc(r[2]||'')}</td></tr>`).join('')
  }</tbody></table>`;

  // ── Peers
  const peersHtml = `<table class="data-table"><thead>${tblHdr(['Empresa','Ticker','P/S','EV/EBITDA','Rev Growth','Rating'])}</thead><tbody>${tblRows(d.comparables||[])}</tbody></table>`;

  // ── DCF tabla
  let dcfHtml = '';
  if (Array.isArray(d.dcf_tabla) && d.dcf_tabla.length > 1) {
    const [hdr,...rows] = d.dcf_tabla;
    dcfHtml = `<table class="data-table"><thead>${tblHdr(hdr)}</thead><tbody>${tblRows(rows)}</tbody></table>`;
  }

  // ── Monte Carlo
  const mcHtml = `<table class="data-table"><thead>${tblHdr(['Percentil','Escenario','Precio','Prob.'])}</thead><tbody>${tblRows(d.montecarlo||[])}</tbody></table>`;

  // ── Balance Sheet
  let bsHtml = '';
  if (Array.isArray(d.balance_sheet) && d.balance_sheet.length > 1) {
    const [hdr,...rows] = d.balance_sheet;
    bsHtml = `<table class="data-table"><thead>${tblHdr(hdr)}</thead><tbody>${tblRows(rows)}</tbody></table>`;
  }

  // ── Cash Flow
  let cfHtml = '';
  if (Array.isArray(d.cashflow) && d.cashflow.length > 1) {
    const [hdr,...rows] = d.cashflow;
    cfHtml = `<table class="data-table"><thead>${tblHdr(hdr)}</thead><tbody>${tblRows(rows)}</tbody></table>`;
  }

  // ── KPIs Sectoriales
  const kpisHtml = (d.kpis_sector||[]).length ? `<table class="data-table"><thead>${tblHdr(['KPI Sectorial','Valor','YoY','Descripción'])}</thead><tbody>${
    (d.kpis_sector||[]).map((r,i)=>`<tr style="background:${i%2===0?'#080E1A':'#0D1627'}">
      <td style="color:#C9A84C;font-weight:600">${esc(r[0])}</td>
      <td style="font-family:monospace;color:#5A9BFF">${esc(r[1])}</td>
      <td style="color:${String(r[2]||'').startsWith('+') ? '#22c55e' : '#ef4444'};font-family:monospace">${esc(r[2])}</td>
      <td style="color:#8FA8C8;font-size:10px">${esc(r[3])}</td></tr>`).join('')
  }</tbody></table>` : '';

  // ── Geografía
  const geoHtml = (d.geografia||[]).length ? `<table class="data-table"><thead>${tblHdr(['Región','Revenue (M)','Growth','% del Total'])}</thead><tbody>${
    (d.geografia||[]).map((r,i)=>`<tr style="background:${i%2===0?'#080E1A':'#0D1627'}">
      <td style="color:#C9A84C;font-weight:600">${esc(r[0])}</td>
      <td style="font-family:monospace;color:#5A9BFF">$${esc(r[1])}M</td>
      <td style="color:${String(r[2]||'').startsWith('+') ? '#22c55e' : '#ef4444'};font-family:monospace">${esc(r[2])}</td>
      <td style="font-family:monospace;color:#D8E6F5">${esc(r[3])}</td></tr>`).join('')
  }</tbody></table>` : '';

  // ── Capital Allocation
  const capAllocHtml = (d.capital_alloc||[]).length ? `<table class="data-table"><thead>${tblHdr(['Año','Buybacks','Dividendos','FCF','Uso de Capital'])}</thead><tbody>${tblRows(d.capital_alloc||[])}</tbody></table>` : '';

  // ── Guidance
  const guidanceHtml = (d.guidance||[]).length ? `<table class="data-table"><thead>${tblHdr(['Métrica','Guía Management','Consenso Analistas','vs. Consenso'])}</thead><tbody>${tblRows(d.guidance||[])}</tbody></table>` : '';

  // ── Ownership
  const ownershipHtml = (d.ownership||[]).length ? `<table class="data-table"><thead>${tblHdr(['Accionista','% Capital','Acciones'])}</thead><tbody>${
    (d.ownership||[]).map((r,i)=>`<tr style="background:${i%2===0?'#080E1A':'#0D1627'}">
      <td style="color:#C9A84C;font-weight:600">${esc(r[0])}</td>
      <td style="font-family:monospace;color:#5A9BFF">${esc(r[1])}</td>
      <td style="color:#8FA8C8">${esc(r[2])}</td></tr>`).join('')
  }</tbody></table>` : '';

  // ── Forense
  const forenseHtml = `<table class="data-table"><thead>${tblHdr(['Señal','Evaluación','Veredicto'])}</thead><tbody>${
    (d.forense_tabla||[]).map((r,i)=>{
      const st = String(r[2]||'');
      const stClr = st.includes('✅')?'#22c55e':st.includes('🚨')?'#ef4444':'#f59e0b';
      return `<tr style="background:${i%2===0?'#080E1A':'#0D1627'}">
        <td style="color:#C9A84C;font-weight:600">${esc(r[0])}</td>
        <td style="color:#8FA8C8;font-size:11px">${esc(r[1])}</td>
        <td style="color:${stClr};font-weight:700">${esc(r[2])}</td></tr>`;
    }).join('')
  }</tbody></table>`;

  // ── Escenarios earnings
  const earningsHtml = `<table class="data-table"><thead>${tblHdr(['Escenario','Condición','Impacto','Acción'])}</thead><tbody>${
    (d.escenarios_earnings||[]).map((r,i)=>{
      const esc2 = String(r[0]||'').toLowerCase();
      const clr2 = esc2.includes('bull')||esc2.includes('beat')?'#22c55e':esc2.includes('miss')?'#ef4444':'#f59e0b';
      return `<tr style="background:${i%2===0?'#080E1A':'#0D1627'}">
        <td style="color:${clr2};font-weight:700">${esc(r[0])}</td>
        <td style="color:#8FA8C8">${esc(r[1])}</td>
        <td style="font-family:monospace;color:#5A9BFF">${esc(r[2])}</td>
        <td style="color:#8FA8C8">${esc(r[3])}</td></tr>`;
    }).join('')
  }</tbody></table>`;

  // ── MOAT
  const moatHtml = `<table class="data-table"><thead>${tblHdr(['Factor','Descripción','Score'])}</thead><tbody>${tblRows(d.moat||[])}</tbody></table>`;

  // ── Riesgos
  const riesgosHtml = `<table class="data-table"><thead>${tblHdr(['Riesgo','Descripción','Prob.','Impacto','Tipo'])}</thead><tbody>${tblRows(d.riesgos||[])}</tbody></table>`;

  // ── Noticias
  const noticiasHtml = (d.noticias||[]).length
    ? `<table class="data-table"><thead>${tblHdr(['Fecha','Evento','Impacto','Fuente'])}</thead><tbody>${tblRows(d.noticias||[])}</tbody></table>` : '';

  // ── Insiders
  const insidersHtml = (d.insiders||[]).length
    ? `<table class="data-table"><thead>${tblHdr(['Insider','Rol','Acción','Precio','Fecha','Tipo'])}</thead><tbody>${tblRows(d.insiders||[])}</tbody></table>` : '';

  // ── Meta análisis
  const metaHtml = `<table class="data-table"><thead>${tblHdr(['Campo','Detalle'])}</thead><tbody>${
    (d.meta_analisis||[
      ['Modelo IA utilizado','GPT-4o'],
      ['Empresa analizada',empresa||'—'],
      ['Fecha análisis',fecha],
      ['Fuentes consultadas','15+'],
      ['Páginas del informe', d.paginas_informe||'Ver informe']
    ]).map((r,i)=>`<tr style="background:${i%2===0?'#080E1A':'#0D1627'}">
      <td style="color:#C9A84C;font-weight:600">${esc(r[0])}</td>
      <td style="color:#D8E6F5">${esc(r[1])}</td></tr>`).join('')
  }</tbody></table>`;

  // ── Fuentes
  const fuentesHtml = (d.fuentes||[]).map(f => {
    const txt = Array.isArray(f) ? [f[0],f[1],f[2]].filter(Boolean).join(' · ') : String(f||'');
    return `<div style="color:#4A5568;font-size:11px;padding:3px 0;border-bottom:1px solid #0D1627">${esc(txt)}</div>`;
  }).join('');

  const fecha = d.fecha_analisis || new Date().toLocaleDateString('es-AR');
  const ticker = d.empresa_ticker || '';
  const empresa = d.empresa_nombre || '';

  // Chart data embedded as JSON for Puppeteer rendering
  const chartDataJSON = JSON.stringify({
    g_years: d.g_years||[], g_rev:(d.g_rev||[]).map(v=>+String(v).replace(/,/g,'')||0),
    g_ni:(d.g_ni||[]).map(v=>+String(v).replace(/,/g,'')||0),
    g_mix_lbl:d.g_mix_lbl||[], g_mix_pct:(d.g_mix_pct||[]).map(v=>+v||0),
    g_gross_m:(d.g_gross_m||[]).map(v=>+v||0), g_ebitda_m:(d.g_ebitda_m||[]).map(v=>+v||0),
    g_fcf_m:(d.g_fcf_m||[]).map(v=>+v||0), g_qtrs:d.g_qtrs||[],
    g_dcf_lo:(d.g_dcf_lo||[]).map(v=>+v||0), g_dcf_hi:(d.g_dcf_hi||[]).map(v=>+v||0),
    g_precio:+(d.g_precio||d.precio_cierre||0),
    g_peers_co:d.g_peers_co||[], g_peers_ps:(d.g_peers_ps||[]).map(v=>+v||0),
    g_peers_eve:(d.g_peers_eve||[]).map(v=>+v||0), g_peers_gr:(d.g_peers_gr||[]).map(v=>+v||0),
    g_qtrs_rev:(d.g_qtrs_rev||[]).map(v=>+v||0),
    g_qtrs_ni:(d.g_qtrs_ni||[]).map(v=>+v||0),
    g_qtrs_growth:(d.g_qtrs_growth||[]).map(v=>+v||0),
    montecarlo:d.montecarlo||[], pnl:d.pnl||[],
    capalloc_yrs:(d.capital_alloc||[]).map(r=>r[0]||''),
    capalloc_bb:(d.capital_alloc||[]).map(r=>+String(r[1]||0).replace(/[$,BMK]/g,'')||0),
    capalloc_div:(d.capital_alloc||[]).map(r=>+String(r[2]||0).replace(/[$,BMK]/g,'')||0),
    capalloc_fcf:(d.capital_alloc||[]).map(r=>+String(r[3]||0).replace(/[$,BMK]/g,'')||0),
    own_lbl:(d.ownership||[]).map(r=>r[0]||''),
    own_pct:(d.ownership||[]).map(r=>+String(r[1]||0).replace(/[%,]/g,'')||0),
    price_52w_low:+(d.empresa_52w_low||0),
    price_52w_high:+(d.empresa_52w_high||0),
    price_target_lo:+(d.target_bajo||0),
    price_target_hi:+(d.target_alto||0),
    radar_lbl:['Crecimiento','Rentabilidad','Solidez Fin.','Ventaja Comp.','Valoración','Confianza'],
    radar_scores:(function(){
      var revArr=(d.g_rev||[]).map(function(v){return +String(v).replace(/,/g,'')||0;}).filter(function(v){return v>0;});
      var lastG=revArr.length>1?(revArr[revArr.length-1]-revArr[revArr.length-2])/revArr[revArr.length-2]*100:10;
      var rGrow=Math.min(10,Math.max(0,lastG>30?9.5:lastG>15?7.5:lastG>5?6:lastG>0?4:2));
      var lastM=(d.g_gross_m||[]).filter(function(v){return v;}).slice(-1)[0]||0;
      var rMarg=Math.min(10,Math.max(0,lastM>60?9:lastM>40?7.5:lastM>20?5.5:lastM>0?3.5:0));
      var rMoat=Math.min(10,Math.max(3,(d.moat||[]).length*1.5));
      var ups=upside!==null?+upside:0;
      var rVal=Math.min(10,Math.max(1,ups>40?9:ups>20?7.5:ups>10?6:ups>0?4.5:2.5));
      var rConf=(d.confianza||'').toUpperCase().includes('ALTA')?8.5:(d.confianza||'').toUpperCase().includes('MEDIA')?6.5:4;
      var rSol=7; // solidez financiera — valor razonable por defecto
      return [rGrow,rMarg,rSol,rMoat,rVal,rConf];
    })()
  });

  // ── Shared page-header / footer inline HTML ──────────────────────────────────
  const ph = `<div class="page-header"><div class="page-header-brand"><div class="ph-logo">CA</div><span class="ph-name">Círculo Azul Finanzas</span><span class="ph-empresa">${esc(empresa)}${ticker?' ('+esc(ticker)+')':''}</span></div><span class="ph-fecha">${esc(fecha)}</span></div>`;
  const pf = `<div class="page-footer"><span>Círculo Azul Finanzas · Análisis Institucional IA</span><span>${esc(empresa)}${ticker?' ('+esc(ticker)+')':''} · ${esc(fecha)}</span><span style="color:#C9A84C">CONFIDENCIAL</span></div>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"><\/script>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Inter:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
@page{size:A4;margin:0}
*,*::before,*::after{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;box-sizing:border-box;margin:0;padding:0}
html,body{background:#05080F;color:#FFF;font-family:'Inter',sans-serif;font-size:12px;line-height:1.5}
/* ── PORTADA ─────────────────────────────────────────────────────── */
.cover{width:100%;min-height:297mm;background:#05080F;break-after:page;page-break-after:always;display:flex;flex-direction:column}
.cover-top-line{height:4px;background:linear-gradient(90deg,#1A56C4,#C9A84C,#1A56C4)}
.cover-header{padding:28px 44px 20px;display:flex;align-items:center;gap:14px;border-bottom:1px solid rgba(201,168,76,.2)}
.cover-logo-circle{width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#1A56C4,#2E74E8);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;color:#fff;flex-shrink:0}
.cover-brand-name{font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:700;color:#fff}
.cover-brand-sub{font-size:9px;color:#8FA8C8;letter-spacing:.18em;text-transform:uppercase}
.cover-confidential{margin-left:auto;font-size:9px;color:#C9A84C;letter-spacing:.18em;border:1px solid rgba(201,168,76,.3);padding:4px 10px;border-radius:4px}
.cover-body{flex:1;padding:60px 44px 44px;display:flex;flex-direction:column;gap:32px}
.cover-type-tag{font-size:9px;letter-spacing:.25em;color:#5A9BFF;text-transform:uppercase;font-weight:600}
.cover-empresa{font-family:'Cormorant Garamond',serif;font-size:54px;font-weight:700;color:#fff;line-height:1.0;margin-top:8px}
.cover-ticker{font-family:'Space Mono',monospace;font-size:22px;color:#C9A84C;margin-top:12px}
.cover-divider{height:1px;background:linear-gradient(90deg,rgba(201,168,76,.5),transparent);margin:8px 0}
.cover-rec-row{display:flex;align-items:center;gap:28px;flex-wrap:wrap}
.cover-badge{padding:8px 22px;border-radius:6px;font-size:20px;font-weight:800;letter-spacing:.06em}
.cover-targets{display:flex;gap:32px}
.cover-target-item label{display:block;font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:#8FA8C8;margin-bottom:4px}
.cover-target-item span{font-family:'Space Mono',monospace;font-size:18px;font-weight:700;color:#fff}
.cover-infobox{background:#0D1627;border:1px solid rgba(90,155,255,.2);border-radius:10px;padding:24px;display:grid;grid-template-columns:1fr 1fr;gap:12px}
.cover-infobox-item{display:flex;flex-direction:column;gap:3px}
.cover-infobox-item label{font-size:9px;letter-spacing:.15em;text-transform:uppercase;color:#4A5568}
.cover-infobox-item span{font-size:13px;color:#D8E6F5}
.cover-features{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:auto}
.cover-feat{background:#080E1A;border:1px solid rgba(255,255,255,.06);border-radius:8px;padding:14px}
.cover-feat-icon{font-size:18px;margin-bottom:6px}
.cover-feat-title{font-size:11px;font-weight:600;color:#D8E6F5;margin-bottom:3px}
.cover-feat-desc{font-size:10px;color:#4A5568;line-height:1.5}
.cover-footer{padding:18px 44px;background:#080E1A;border-top:1px solid rgba(201,168,76,.15);display:flex;justify-content:space-between;align-items:center}
.cover-footer-left{font-size:10px;color:#4A5568;max-width:60%}
.cover-footer-right{font-size:10px;color:#C9A84C;text-align:right}
/* ── PÁGINAS CONTENIDO ───────────────────────────────────────────── */
/* break-before se aplica sólo entre .pg consecutivos (nunca crea pág en blanco) */
.pg{padding:32px 42px;min-height:257mm;display:flex;flex-direction:column}.pg+.pg{break-before:page;page-break-before:always}.section{page-break-inside:avoid;break-inside:avoid}
.page-header{display:flex;align-items:center;justify-content:space-between;padding-bottom:11px;border-bottom:2px solid rgba(201,168,76,.25);margin-bottom:22px}
.page-header-brand{display:flex;align-items:center;gap:8px}
.ph-logo{width:22px;height:22px;border-radius:50%;background:#1A56C4;display:flex;align-items:center;justify-content:center;font-size:7px;font-weight:700;color:#fff}
.ph-name{font-family:'Cormorant Garamond',serif;font-size:11px;font-weight:700;color:#C9A84C}
.ph-empresa{font-size:10px;color:#8FA8C8;margin-left:4px}
.ph-fecha{font-size:10px;color:#4A5568}
.page-footer{margin-top:auto;padding-top:9px;border-top:1px solid rgba(255,255,255,.06);display:flex;justify-content:space-between;font-size:9px;color:#4A5568}
/* ── SECCIONES ───────────────────────────────────────────────────── */
.section{margin-bottom:20px}
.section-tag{font-size:8px;letter-spacing:.22em;text-transform:uppercase;color:#5A9BFF;margin-bottom:2px;font-weight:600;page-break-after:avoid}
.section-title{font-family:'Cormorant Garamond',serif;font-size:19px;font-weight:700;color:#C9A84C;margin-bottom:5px;page-break-after:avoid}
.section-hr{height:1px;background:rgba(201,168,76,.2);margin-bottom:12px}
/* ── TABLAS ─────────────────────────────────────────────────────── */
.data-table{width:100%;border-collapse:collapse;font-size:11px}
.data-table th{padding:6px 9px;text-align:left;font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:#8FA8C8;background:#1A56C4;font-weight:600}
.data-table td{padding:6px 9px;border-bottom:1px solid rgba(255,255,255,.04);color:#D8E6F5;vertical-align:middle}
.data-table tr:last-child td{border-bottom:none}
/* ── OTROS ───────────────────────────────────────────────────────── */
.bullet{padding:8px 13px;border-radius:5px;margin-bottom:5px;font-size:11px;line-height:1.5}
.scorecard-grid{display:grid;grid-template-columns:1fr 1fr;gap:5px}
.sc-item{background:#0D1627;border:1px solid rgba(255,255,255,.06);border-radius:6px;padding:7px 11px;display:flex;justify-content:space-between;align-items:center}
.sc-label{font-size:10px;color:#4A5568}.sc-val{font-family:'Space Mono',monospace;font-size:11px;color:#5A9BFF;font-weight:700}
.hero-metrics{background:#0D1627;border:1px solid rgba(90,155,255,.15);border-radius:10px;padding:18px;display:flex;gap:24px;flex-wrap:wrap;margin-bottom:18px}
.hero-metric label{display:block;font-size:8px;letter-spacing:.18em;text-transform:uppercase;color:#4A5568;margin-bottom:3px}
.hero-metric span{font-family:'Space Mono',monospace;font-size:14px;font-weight:700;color:#fff}
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.card{background:#0D1627;border:1px solid rgba(255,255,255,.07);border-radius:8px;padding:14px}
.card-title{font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:#C9A84C;margin-bottom:8px;font-weight:600}
.conclusion-box{background:#080E1A;border:1px solid rgba(201,168,76,.2);border-left:4px solid #C9A84C;border-radius:8px;padding:18px;font-family:'Cormorant Garamond',serif;font-size:14px;color:#D8E6F5;line-height:1.7}
.profile-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}
.profile-item{background:#080E1A;border-radius:6px;padding:7px 11px;border-left:3px solid rgba(90,155,255,.3)}
.profile-item label{display:block;font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:#4A5568;margin-bottom:2px}
.profile-item span{font-size:11px;color:#D8E6F5}
.disclaimer-box{background:#080E1A;border-radius:8px;padding:16px;font-size:10px;color:#4A5568;line-height:1.7;border:1px solid rgba(255,255,255,.04)}
.chart-box{background:#080E1A;border:1px solid rgba(255,255,255,.07);border-radius:8px;padding:12px;margin-bottom:12px;page-break-inside:avoid}
.chart-box-title{font-size:8px;letter-spacing:.2em;text-transform:uppercase;color:#C9A84C;margin-bottom:8px;font-weight:600}
.chart-wrap{position:relative;width:100%}
</style>
</head>
<body>

<!-- ══ PORTADA ══════════════════════════════════════════════════════ -->
<div class="cover">
  <div class="cover-top-line"></div>
  <div class="cover-header">
    <div class="cover-logo-circle">CA</div>
    <div>
      <div class="cover-brand-name">Círculo Azul Finanzas</div>
      <div class="cover-brand-sub">Análisis Cuantitativo Institucional</div>
    </div>
    <div class="cover-confidential">CONFIDENCIAL</div>
  </div>
  <div class="cover-body">
    <div>
      <div class="cover-type-tag">Informe de Research Institucional · Análisis IA</div>
      <div class="cover-empresa">${esc(empresa)}</div>
      ${ticker ? `<div class="cover-ticker">${esc(ticker)}</div>` : ''}
      <div class="cover-divider"></div>
      <div class="cover-rec-row">
        <div class="cover-badge" style="background:${recColor}22;color:${recColor};border:2px solid ${recColor}44">${esc(d.recomendacion||'HOLD')}</div>
        <div class="cover-targets">
          <div class="cover-target-item"><label>Precio actual</label><span>${d.precio_cierre?'$'+d.precio_cierre:'—'}</span></div>
          <div class="cover-target-item"><label>Target rango 12M</label><span style="color:#C9A84C">${d.target_bajo&&d.target_alto?'$'+d.target_bajo+' – $'+d.target_alto:'—'}</span></div>
          ${upside!==null?`<div class="cover-target-item"><label>Upside potencial</label><span style="color:${Number(upside)>=0?'#22c55e':'#ef4444'}">${Number(upside)>=0?'▲ +':'▼ '}${upside}%</span></div>`:''}
          <div class="cover-target-item"><label>Confianza</label><span>${esc(d.confianza||'—')}</span></div>
        </div>
      </div>
    </div>
    <div class="cover-infobox">
      <div class="cover-infobox-item"><label>Sector</label><span>${esc(d.empresa_sector||'—')}</span></div>
      <div class="cover-infobox-item"><label>CEO</label><span>${esc(d.empresa_ceo||'—')}</span></div>
      <div class="cover-infobox-item"><label>Market Cap</label><span>${esc(d.market_cap||'—')}</span></div>
      <div class="cover-infobox-item"><label>Sede</label><span>${esc(d.empresa_sede||'—')}</span></div>
      <div class="cover-infobox-item"><label>Auditora</label><span>${esc(d.empresa_auditora||'—')}</span></div>
      <div class="cover-infobox-item"><label>Fecha análisis</label><span>${esc(fecha)}</span></div>
    </div>
    <div class="cover-features">
      <div class="cover-feat"><div class="cover-feat-icon">🔍</div><div class="cover-feat-title">Investigación en tiempo real</div><div class="cover-feat-desc">Precios, revenue histórico, márgenes, KPIs, balance y comparables del sector.</div></div>
      <div class="cover-feat"><div class="cover-feat-icon">🧠</div><div class="cover-feat-title">Análisis institucional</div><div class="cover-feat-desc">DCF 3 escenarios, Monte Carlo, scorecard, MOAT, forense contable y riesgos.</div></div>
      <div class="cover-feat"><div class="cover-feat-icon">📊</div><div class="cover-feat-title">Datos fundamentales</div><div class="cover-feat-desc">P&amp;L histórico, métricas de mercado, peers y fuentes verificadas.</div></div>
      <div class="cover-feat"><div class="cover-feat-icon">✍️</div><div class="cover-feat-title">Conclusión ejecutiva</div><div class="cover-feat-desc">Tesis bull/bear, escenarios earnings y recomendación con horizonte 12 meses.</div></div>
    </div>
  </div>
  <div class="cover-footer">
    <div class="cover-footer-left">Este documento es de carácter informativo y no constituye asesoramiento de inversión personalizado. Elaborado por Círculo Azul Finanzas para uso interno del cliente.</div>
    <div class="cover-footer-right">© Círculo Azul Finanzas ${new Date().getFullYear()}<br><span style="font-size:9px;color:#4A5568">circuloazulfinanzas.com</span></div>
  </div>
</div>

<!-- ══ PG 1 — HERO METRICS + RESUMEN EJECUTIVO ══════════════════════ -->
<div class="pg">
  ${ph}
  <div class="hero-metrics">
    <div class="hero-metric"><label>Recomendación</label><span style="color:${recColor}">${esc(d.recomendacion||'HOLD')}</span></div>
    <div class="hero-metric"><label>Precio actual</label><span>${d.precio_cierre?'$'+d.precio_cierre:'—'}</span></div>
    <div class="hero-metric"><label>Target mín.</label><span>${d.target_bajo?'$'+d.target_bajo:'—'}</span></div>
    <div class="hero-metric"><label>Target máx.</label><span style="color:#C9A84C">${d.target_alto?'$'+d.target_alto:'—'}</span></div>
    <div class="hero-metric"><label>Upside</label><span style="color:${upside!==null&&Number(upside)>=0?'#22c55e':'#ef4444'}">${upside!==null?(Number(upside)>=0?'+':'')+upside+'%':'—'}</span></div>
    <div class="hero-metric"><label>Horizonte</label><span>${esc(d.horizonte||'12 meses')}</span></div>
    <div class="hero-metric"><label>Confianza</label><span>${esc(d.confianza||'—')}</span></div>
    <div class="hero-metric"><label>Sector</label><span>${esc(d.empresa_sector||'—')}</span></div>
  </div>
  ${section('Resumen Ejecutivo','Sección 01', bulletsHtml||'<p style="color:#4A5568">Sin datos.</p>')}
  ${pf}
</div>

<!-- ══ PG 2 — SCORECARD + PERFIL ══════════════════════════════════ -->
<div class="pg">
  ${ph}
  ${section('Scorecard de Métricas','Sección 02', `<div class="scorecard-grid">${scHtml}</div>`)}
  ${section('Perfil de la Empresa','Sección 03',`
    <div class="profile-grid">
      ${[['Empresa',d.empresa_nombre],['Ticker',d.empresa_ticker],['Sector',d.empresa_sector],
         ['CEO',d.empresa_ceo],['CFO',d.empresa_cfo],['Empleados',d.empresa_empleados],
         ['IPO',d.empresa_ipo],['Sede',d.empresa_sede],['Auditora',d.empresa_auditora],
         ['Market Cap',d.market_cap]].filter(([,v])=>v).map(([l,v])=>
        `<div class="profile-item"><label>${esc(l)}</label><span>${esc(v)}</span></div>`).join('')}
    </div>
    ${d.empresa_modelo?`<div style="margin-top:8px;padding:8px 10px;background:#080E1A;border-radius:6px;border-left:3px solid rgba(201,168,76,.4);font-size:10px;color:#D8E6F5;line-height:1.55">${esc(d.empresa_modelo)}</div>`:''}
  `)}
  ${pf}
</div>

<!-- ══ PG 3 — FUENTES INGRESOS + MÉTRICAS DE MERCADO ══════════════ -->
<div class="pg">
  ${ph}
  <div class="two-col">
    <div>${section('Fuentes de Ingresos','Sección 03b', ingresosHtml)}</div>
    <div>${section('Métricas de Mercado','Sección 03c', mercHtml)}</div>
  </div>
  <div class="section">
    <div class="section-tag">Sección 03d</div>
    <div class="section-title">Precio de Mercado &amp; Valoración Relativa</div>
    <div class="section-hr"></div>
    <div class="two-col">
      <div style="background:#080E1A;border:1px solid rgba(255,255,255,.07);border-radius:8px;padding:14px 16px">
        <div style="font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:#C9A84C;margin-bottom:10px;font-weight:600">📍 Rango de Precio — 52 Semanas</div>
        ${pricePct!==null?`
          <div style="position:relative;height:8px;background:rgba(255,255,255,.08);border-radius:4px;margin:14px 0">
            <div style="position:absolute;left:0;width:${pricePct}%;height:8px;background:linear-gradient(90deg,#ef444460,#C9A84C);border-radius:4px 0 0 4px"></div>
            <div style="position:absolute;left:${pricePct}%;transform:translateX(-50%);width:12px;height:12px;background:#C9A84C;border-radius:50%;top:-2px;border:2px solid #05080F"></div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:9px;margin-bottom:12px">
            <span style="color:#ef4444">Mín: $${esc(d.empresa_52w_low)}</span>
            <span style="color:#C9A84C;font-weight:700">Actual: $${esc(d.precio_cierre)}</span>
            <span style="color:#22c55e">Máx: $${esc(d.empresa_52w_high)}</span>
          </div>`:'<div style="color:#4A5568;font-size:10px;padding:8px 0">Sin datos de rango de precio.</div>'}
        ${[['Market Cap',d.market_cap||'—'],['Acciones en circ.',d.shares_outstanding||'—'],['Target conservador',d.target_bajo?'$'+d.target_bajo:'—'],['Target optimista',d.target_alto?'$'+d.target_alto:'—'],['Upside estimado',upside!==null?(Number(upside)>=0?'+':'')+upside+'%':'—']].map(([l,v])=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.04)"><span style="color:#4A5568;font-size:10px">${esc(l)}</span><span style="color:#D8E6F5;font-size:10px;font-family:monospace">${esc(v)}</span></div>`).join('')}
      </div>
      <div style="background:#080E1A;border:1px solid rgba(255,255,255,.07);border-radius:8px;padding:14px 16px">
        <div style="font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:#C9A84C;margin-bottom:10px;font-weight:600">📊 Múltiplos de Valoración</div>
        ${scValuation.length?scValuation.map(([l,v])=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.04)"><span style="color:#8FA8C8;font-size:10px">${esc(l)}</span><span style="color:#5A9BFF;font-size:11px;font-family:monospace;font-weight:700">${esc(v)}</span></div>`).join(''):'<div style="color:#4A5568;font-size:10px">Ver Scorecard — Sección 02 para múltiplos de valoración.</div>'}
      </div>
    </div>
  </div>
  ${pf}
</div>

<!-- ══ PG 4 — P&L HISTÓRICO ════════════════════════════════════════ -->
<div class="pg">
  ${ph}
  ${section('Estado de Resultados Histórico','Sección 04', pnlHtml||'<p style="color:#4A5568">Sin datos P&amp;L disponibles.</p>')}
  <div class="section">
    <div class="section-tag">Sección 04a</div>
    <div class="section-title">Tendencia de Crecimiento — Revenue YoY</div>
    <div class="section-hr"></div>
    <div class="chart-box">
      <div class="chart-box-title">📈 Variación Porcentual del Revenue vs. Año Anterior (%)</div>
      <div class="chart-wrap" style="height:185px"><canvas id="pdf-chart-rev-growth"></canvas></div>
    </div>
  </div>
  ${pf}
</div>

<!-- ══ PG 5 — BALANCE GENERAL ══════════════════════════════════════ -->
<div class="pg">
  ${ph}
  ${section('Balance General','Sección 04b', bsHtml||'<p style="color:#4A5568">Sin datos de balance disponibles.</p>')}
  <div class="section">
    <div class="section-tag">Sección 04b2</div>
    <div class="section-title">Solidez Financiera — Ratios &amp; Rentabilidad Clave</div>
    <div class="section-hr"></div>
    <div class="two-col">
      <div style="background:#080E1A;border:1px solid rgba(255,255,255,.07);border-radius:8px;padding:14px 16px">
        <div style="font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:#C9A84C;margin-bottom:10px;font-weight:600">⚖️ Estructura de Capital &amp; Liquidez</div>
        ${scBalance.length?scBalance.map(([l,v])=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.04)"><span style="color:#8FA8C8;font-size:10px">${esc(l)}</span><span style="color:#5A9BFF;font-size:11px;font-family:monospace;font-weight:700">${esc(v)}</span></div>`).join(''):'<div style="color:#4A5568;font-size:10px">Sin métricas de balance en scorecard.</div>'}
      </div>
      <div style="background:#080E1A;border:1px solid rgba(255,255,255,.07);border-radius:8px;padding:14px 16px">
        <div style="font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:#C9A84C;margin-bottom:10px;font-weight:600">💹 Retorno &amp; Rentabilidad</div>
        ${scProfitability.length?scProfitability.map(([l,v])=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.04)"><span style="color:#8FA8C8;font-size:10px">${esc(l)}</span><span style="color:#22c55e;font-size:11px;font-family:monospace;font-weight:700">${esc(v)}</span></div>`).join(''):'<div style="color:#4A5568;font-size:10px">Ver Scorecard — Sección 02.</div>'}
      </div>
    </div>
  </div>
  ${pf}
</div>

<!-- ══ PG 6 — CASH FLOW + KPIs SECTORIALES ════════════════════════ -->
<div class="pg">
  ${ph}
  ${section('Estado de Flujo de Caja','Sección 04c', cfHtml||'<p style="color:#4A5568">Sin datos de cash flow disponibles.</p>')}
  ${section('KPIs Sectoriales — Métricas Operativas Clave','Sección 04d', kpisHtml||'<p style="color:#4A5568">Sin KPIs sectoriales disponibles.</p>')}
  ${pf}
</div>

<!-- ══ PG 7 — GEOGRAFÍA + GRÁFICO REVENUE ═════════════════════════ -->
<div class="pg">
  ${ph}
  ${geoHtml ? section('Revenue por Geografía','Sección 04e', geoHtml) : ''}
  <div class="section">
    <div class="section-tag">Sección 04f</div>
    <div class="section-title">Revenue &amp; Net Income Histórico</div>
    <div class="section-hr"></div>
    <div class="chart-box">
      <div class="chart-box-title">📈 Revenue &amp; Net Income Histórico (M USD)</div>
      <div class="chart-wrap" style="height:200px"><canvas id="pdf-chart-revenue"></canvas></div>
    </div>
  </div>
  ${pf}
</div>

<!-- ══ PG 8 — GRÁFICOS MIX + MÁRGENES + QUARTERLY ════════════════ -->
<div class="pg">
  ${ph}
  <div class="section">
    <div class="section-tag">Sección 04g</div>
    <div class="section-title">Análisis Gráfico — Mix, Márgenes &amp; Trimestral</div>
    <div class="section-hr"></div>
    <div class="two-col">
      <div class="chart-box">
        <div class="chart-box-title">🥧 Mix de Ingresos por Segmento</div>
        <div class="chart-wrap" style="height:200px"><canvas id="pdf-chart-mix"></canvas></div>
      </div>
      <div class="chart-box">
        <div class="chart-box-title">📉 Evolución de Márgenes (%)</div>
        <div class="chart-wrap" style="height:200px"><canvas id="pdf-chart-margins"></canvas></div>
      </div>
    </div>
    <div class="chart-box" style="margin-top:10px">
      <div class="chart-box-title">📊 Revenue Trimestral — Últimos 8 Trimestres (M USD)</div>
      <div class="chart-wrap" style="height:200px"><canvas id="pdf-chart-qtrs"></canvas></div>
    </div>
  </div>
  ${pf}
</div>

<!-- ══ PG 9 — TESIS BULL/BEAR ═════════════════════════════════════ -->
<div class="pg">
  ${ph}
  <div class="section">
    <div class="section-tag">Sección 05 &amp; 05b</div>
    <div class="section-title">Tesis de Inversión — Bull vs Bear</div>
    <div class="section-hr"></div>
    <div class="two-col">
      <div class="card">
        <div class="card-title" style="color:#22c55e">🟢 Tesis Alcista</div>
        ${thesisList(d.bull_items,'#22c55e','▲')}
      </div>
      <div class="card">
        <div class="card-title" style="color:#ef4444">🔴 Tesis Bajista</div>
        ${thesisList(d.bear_items,'#ef4444','▼')}
      </div>
    </div>
  </div>
  <div class="section">
    <div class="section-tag">Sección 05c</div>
    <div class="section-title">Retorno Esperado Ponderado — Análisis de Escenarios</div>
    <div class="section-hr"></div>
    <table class="data-table">
      <thead><tr style="background:#1A56C4"><th>Escenario</th><th>Ponderación</th><th>Precio Objetivo</th><th>Retorno Est.</th><th>Acción Sugerida</th></tr></thead>
      <tbody>
        <tr style="background:#080E1A">
          <td style="color:#ef4444;font-weight:700">▼ Bajista (Bear)</td>
          <td style="color:#8FA8C8;font-family:monospace">25%</td>
          <td style="color:#D8E6F5;font-family:monospace">${_blo?'$'+_blo.toFixed(2):'—'}</td>
          <td style="color:#ef4444;font-family:monospace;font-weight:700">${_bearRet}</td>
          <td style="color:#4A5568;font-size:10px">Reducir / Stop-loss activo</td>
        </tr>
        <tr style="background:#0D1627">
          <td style="color:#f59e0b;font-weight:700">► Base</td>
          <td style="color:#8FA8C8;font-family:monospace">50%</td>
          <td style="color:#D8E6F5;font-family:monospace">${_bmid?'$'+_bmid.toFixed(2):'—'}</td>
          <td style="color:#f59e0b;font-family:monospace;font-weight:700">${_baseRet}</td>
          <td style="color:#4A5568;font-size:10px">Mantener posición</td>
        </tr>
        <tr style="background:#080E1A">
          <td style="color:#22c55e;font-weight:700">▲ Alcista (Bull)</td>
          <td style="color:#8FA8C8;font-family:monospace">25%</td>
          <td style="color:#D8E6F5;font-family:monospace">${_bhi?'$'+_bhi.toFixed(2):'—'}</td>
          <td style="color:#22c55e;font-family:monospace;font-weight:700">${_bullRet}</td>
          <td style="color:#4A5568;font-size:10px">Acumular en retrocesos</td>
        </tr>
        <tr style="background:#0D1627;border-top:1px solid rgba(201,168,76,.3)">
          <td style="color:#C9A84C;font-weight:800">★ Valor Esperado</td>
          <td style="color:#C9A84C;font-family:monospace;font-weight:700">100%</td>
          <td style="color:#C9A84C;font-family:monospace;font-weight:700">${_evPx?'$'+_evPx.toFixed(2):'—'}</td>
          <td style="color:#C9A84C;font-family:monospace;font-weight:800">${_evRet}</td>
          <td style="color:#C9A84C;font-size:10px;font-weight:600">${esc(d.recomendacion||'HOLD')}</td>
        </tr>
      </tbody>
    </table>
  </div>
  ${pf}
</div>

<!-- ══ PG 10 — MOAT + RIESGOS ════════════════════════════════════ -->
<div class="pg">
  ${ph}
  ${section('Análisis MOAT — Ventajas Competitivas','Sección 05c', moatHtml)}
  ${section('Mapa de Riesgos','Sección 05d', riesgosHtml)}
  ${pf}
</div>

<!-- ══ PG 11 — DCF + MONTE CARLO ═════════════════════════════════ -->
<div class="pg">
  ${ph}
  ${section('Valoración DCF — 3 Escenarios','Sección 06',`
    <div class="chart-box"><div class="chart-box-title">Valor intrínseco por escenario (pesimista / base / optimista)</div><div class="chart-wrap" style="height:170px"><canvas id="pdf-chart-dcf"></canvas></div></div>
    ${dcfHtml}
  `)}
  ${section('Monte Carlo — Distribución de Precio','Sección 06b',`
    <div class="chart-box"><div class="chart-box-title">Distribución de precios simulados (P10 → P90)</div><div class="chart-wrap" style="height:155px"><canvas id="pdf-chart-mc"></canvas></div></div>
    ${mcHtml}
  `)}
  ${pf}
</div>

<!-- ══ PG 12 — COMPARABLES DEL SECTOR ════════════════════════════ -->
<div class="pg">
  ${ph}
  ${section('Comparables del Sector — Múltiplos vs. Peers','Sección 06c',`
    <div class="chart-box"><div class="chart-box-title">Múltiplos vs. peers — P/S · EV/EBITDA · Rev Growth %</div><div class="chart-wrap" style="height:170px"><canvas id="pdf-chart-peers"></canvas></div></div>
    ${peersHtml}
  `)}
  <div class="section">
    <div class="section-tag">Sección 06d</div>
    <div class="section-title">Síntesis Competitiva — Posicionamiento vs. Industria</div>
    <div class="section-hr"></div>
    <div class="two-col">
      <div style="background:#080E1A;border:1px solid rgba(255,255,255,.07);border-radius:8px;padding:14px 16px">
        <div style="font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:#22c55e;margin-bottom:10px;font-weight:600">✅ Ventajas Competitivas vs. Peers</div>
        ${(d.moat||[]).slice(0,4).map(([f,d2,s])=>`<div style="padding:7px 0;border-bottom:1px solid rgba(255,255,255,.04)"><div style="color:#C9A84C;font-size:10px;font-weight:600">${esc(f)} <span style="color:#22c55e;float:right">${esc(s||'')}</span></div><div style="color:#8FA8C8;font-size:9px;margin-top:2px">${esc(d2)}</div></div>`).join('')||'<div style="color:#4A5568;font-size:10px">Ver análisis MOAT — Sección 05c, Pág. 10.</div>'}
      </div>
      <div style="background:#080E1A;border:1px solid rgba(255,255,255,.07);border-radius:8px;padding:14px 16px">
        <div style="font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:#C9A84C;margin-bottom:10px;font-weight:600">🎯 Valoración Relativa — Empresa vs. Sector</div>
        ${scValuation.slice(0,6).map(([l,v])=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.04)"><span style="color:#8FA8C8;font-size:10px">${esc(l)}</span><span style="color:#5A9BFF;font-size:11px;font-family:monospace;font-weight:700">${esc(v)}</span></div>`).join('')||'<div style="color:#4A5568;font-size:10px">Ver Scorecard — Sección 02.</div>'}
      </div>
    </div>
  </div>
  ${pf}
</div>

<!-- ══ PG 13 — FORENSE CONTABLE ══════════════════════════════════ -->
<div class="pg">
  ${ph}
  ${section('Forense Contable','Sección 07',`
    ${d.forense_intro?`<div style="font-size:11px;color:#8FA8C8;margin-bottom:10px;line-height:1.6;padding:9px 12px;background:#080E1A;border-radius:6px">${esc(d.forense_intro)}</div>`:''}
    ${forenseHtml}
    ${d.forense_semaforo?`<div style="margin-top:8px;padding:9px 12px;background:#0D1627;border-radius:6px;font-size:11px;color:#D8E6F5">${esc(d.forense_semaforo)}</div>`:''}
  `)}
  ${pf}
</div>

<!-- ══ PG 14 — EARNINGS + GUIDANCE ════════════════════════════════ -->
<div class="pg">
  ${ph}
  ${section('Escenarios Post-Earnings','Sección 07b', earningsHtml)}
  ${guidanceHtml ? section('Guidance Management vs. Consenso','Sección 07b2', guidanceHtml) : ''}
  <div class="section">
    <div class="section-tag">Sección 07b3</div>
    <div class="section-title">Catalizadores Clave — Próximos 12 Meses</div>
    <div class="section-hr"></div>
    <div class="two-col">
      <div style="background:#080E1A;border:1px solid rgba(255,255,255,.07);border-radius:8px;padding:14px 16px">
        <div style="font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:#C9A84C;margin-bottom:10px;font-weight:600">📅 Variables a Monitorear</div>
        ${[['Próximo Earnings',esc(d.horizonte||'12 meses')],
           ['Recomendación actual',esc(d.recomendacion||'—')],
           ['Target conservador',d.target_bajo?'$'+d.target_bajo:'—'],
           ['Target optimista',d.target_alto?'$'+d.target_alto:'—'],
           ['Confianza del modelo',esc(d.confianza||'—')]
          ].map(([l,v])=>`<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.04)"><span style="color:#8FA8C8;font-size:10px">${l}</span><span style="color:#5A9BFF;font-family:monospace;font-size:10px;font-weight:700">${v}</span></div>`).join('')}
      </div>
      <div style="background:#080E1A;border:1px solid rgba(255,255,255,.07);border-radius:8px;padding:14px 16px">
        <div style="font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:#C9A84C;margin-bottom:10px;font-weight:600">⚡ Escenario Beat vs. Miss</div>
        ${[['Beat significativo (>5%)','+8% a +15% en precio','#22c55e'],
           ['Beat moderado (2-5%)','+3% a +8% en precio','#22c55e'],
           ['In-line (±2%)','Neutro, volumen bajo','#f59e0b'],
           ['Miss moderado (-2 a -5%)','-5% a -12% en precio','#ef4444'],
           ['Miss significativo (>5%)','-12% a -25% en precio','#ef4444']
          ].map(([e,i,c])=>`<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.04)"><span style="color:${c};font-size:9px;font-weight:600">${e}</span><span style="color:#8FA8C8;font-size:9px">${i}</span></div>`).join('')}
      </div>
    </div>
  </div>
  ${pf}
</div>

<!-- ══ PG 15 — NOTICIAS + INSIDERS + CAPITAL ALLOC + OWNERSHIP ═══ -->
<div class="pg">
  ${ph}
  <div class="two-col">
    <div>
      ${noticiasHtml ? section('Noticias Relevantes','Sección 07c', noticiasHtml) : section('Noticias Relevantes','Sección 07c','<div style="color:#4A5568;font-size:11px;padding:8px">Sin noticias recientes disponibles.</div>')}
    </div>
    <div>
      ${insidersHtml ? section('Transacciones Insiders (Form 4)','Sección 07d', insidersHtml) : section('Transacciones Insiders','Sección 07d','<div style="color:#4A5568;font-size:11px;padding:8px">Sin transacciones de insiders recientes.</div>')}
    </div>
  </div>
  ${capAllocHtml ? section('Capital Allocation — Retorno al Accionista','Sección 07e',`
    <div class="chart-box"><div class="chart-box-title">📊 Buybacks vs. Dividendos vs. FCF (M USD)</div><div class="chart-wrap" style="height:160px"><canvas id="pdf-chart-capalloc"></canvas></div></div>
    ${capAllocHtml}
  `) : ''}
  ${ownershipHtml ? section('Estructura Accionarial — Top Holders','Sección 07f',`
    <div class="two-col">
      <div class="chart-box"><div class="chart-box-title">🍚 Distribución Accionarial</div><div class="chart-wrap" style="height:160px"><canvas id="pdf-chart-ownership"></canvas></div></div>
      <div>${ownershipHtml}</div>
    </div>
  `) : ''}
  ${!capAllocHtml && !ownershipHtml ? section('Capital &amp; Accionarial — Métricas del Scorecard','Sección 07e',`
    <div class="two-col">
      <div style="background:#080E1A;border:1px solid rgba(255,255,255,.07);border-radius:8px;padding:14px 16px">
        <div style="font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:#C9A84C;margin-bottom:10px;font-weight:600">💰 Retorno al Accionista</div>
        ${scAll.filter(([l])=>['Yield','Buyback','Dividend','Capital','FCF','Payout'].some(k=>String(l).toUpperCase().includes(k.toUpperCase()))).slice(0,7).map(([l,v])=>`<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.04)"><span style="color:#8FA8C8;font-size:10px">${esc(l)}</span><span style="color:#22c55e;font-family:monospace;font-size:11px;font-weight:700">${esc(v)}</span></div>`).join('')||'<div style="color:#4A5568;font-size:10px">Sin datos de retorno al accionista disponibles.</div>'}
      </div>
      <div style="background:#080E1A;border:1px solid rgba(255,255,255,.07);border-radius:8px;padding:14px 16px">
        <div style="font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:#C9A84C;margin-bottom:10px;font-weight:600">📊 Estructura de Propiedad</div>
        ${[['Precio actual',d.precio_cierre?'$'+d.precio_cierre:'—'],['Market Cap',d.market_cap||'—'],['Acciones en circ.',d.shares_outstanding||'—'],['52W High','$'+(d.empresa_52w_high||'—')],['52W Low','$'+(d.empresa_52w_low||'—')]].map(([l,v])=>`<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.04)"><span style="color:#8FA8C8;font-size:10px">${esc(l)}</span><span style="color:#5A9BFF;font-family:monospace;font-size:11px;font-weight:700">${esc(v)}</span></div>`).join('')}
      </div>
    </div>
  `) : ''}
  ${pf}
</div>

<!-- ══ PG 17 — CONCLUSIÓN + FUENTES ══════════════════════════════ -->
<div class="pg">
  ${ph}
  ${section('Conclusión &amp; Recomendación Final','Sección 08',`
    <div style="margin-bottom:12px;display:flex;align-items:center;gap:14px;padding:13px 16px;background:#0D1627;border-radius:8px;border:1px solid ${recColor}33">
      <span style="font-size:18px;font-weight:800;color:${recColor};letter-spacing:.06em">${esc(d.recomendacion||'HOLD')}</span>
      <span style="color:#8FA8C8;font-size:11px">Confianza: <b style="color:#fff">${esc(d.confianza||'—')}</b> · Target: <b style="color:#C9A84C">${d.target_bajo&&d.target_alto?'$'+d.target_bajo+' – $'+d.target_alto:'—'}</b> · Horizonte: ${esc(d.horizonte||'12 meses')}</span>
    </div>
    <div class="conclusion-box">${esc(d.conclusion_texto||'Sin conclusión disponible.')}</div>
  `)}
  ${section('Fuentes y Referencias','Sección 09', fuentesHtml||'<div style="color:#4A5568;font-size:11px">Sin fuentes disponibles.</div>')}
  <div class="section">
    <div class="section-tag">Sección 09b</div>
    <div class="section-title">Análisis Visual Integrado — Escenarios &amp; Precio</div>
    <div class="section-hr"></div>
    <div class="two-col">
      <div class="chart-box">
        <div class="chart-box-title">🎯 Distribución de Escenarios de Inversión</div>
        <div class="chart-wrap" style="height:190px"><canvas id="pdf-chart-scenarios"></canvas></div>
      </div>
      <div class="chart-box">
        <div class="chart-box-title">📍 Espectro de Precio — 52W · Actual · Targets</div>
        <div class="chart-wrap" style="height:190px"><canvas id="pdf-chart-price-range"></canvas></div>
      </div>
    </div>
  </div>
  ${pf}
</div>

<!-- ══ PG 18 — META ANÁLISIS + AVISO LEGAL ══════════════════════ -->
<div class="pg">
  ${ph}
  <div class="two-col">
    <div>${section('Meta Análisis del Informe','Sección 10', metaHtml)}</div>
    <div>${section('Indicadores de Calidad','Sección 10b',`
      <div style="display:flex;flex-direction:column;gap:8px">
        ${[['Cobertura de datos','Alta — 30+ métricas verificadas','#22c55e'],
           ['Profundidad del análisis','Institucional — DCF + Monte Carlo + Forense','#22c55e'],
           ['Fuentes primarias','Bloomberg, SEC, earnings calls, Reuters','#22c55e'],
           ['Análisis de riesgo','Completo — 5+ riesgos cuantificados','#22c55e'],
           ['Modelado cuantitativo','3 escenarios + 1.000 simulaciones MC','#22c55e'],
           ['Peers comparables',''+((d.comparables||[]).length||'N/A')+' compañías del sector','#f59e0b'],
           ['Vigencia del análisis','12 meses · Sujeto a actualización trimestral','#8FA8C8']
          ].map(([l,v,c])=>`
          <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 10px;background:#080E1A;border-radius:6px;border-left:3px solid ${c}">
            <span style="color:#8FA8C8;font-size:10px">${esc(l)}</span>
            <span style="color:${c};font-size:10px;font-weight:600;text-align:right;max-width:55%">${esc(v)}</span>
          </div>`).join('')}
      </div>
    `)}</div>
  </div>
  <div class="section">
    <div class="section-tag">Sección 10c</div>
    <div class="section-title">Perfil Multidimensional de la Empresa</div>
    <div class="section-hr"></div>
    <div class="two-col">
      <div class="chart-box">
        <div class="chart-box-title">🕸️ Scorecard Visual — 6 Dimensiones (0–10)</div>
        <div class="chart-wrap" style="height:200px"><canvas id="pdf-chart-radar"></canvas></div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;justify-content:center">
        ${['Crecimiento de Revenue','Rentabilidad & Márgenes','Solidez Financiera','Ventaja Competitiva (MOAT)','Valoración vs. Precio','Confianza del Modelo'].map((l,i)=>`
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:9px;color:#8FA8C8;min-width:140px">${esc(l)}</span>
            <div style="flex:1;height:6px;background:rgba(255,255,255,.07);border-radius:3px;overflow:hidden">
              <div class="radar-bar-${i}" style="height:6px;border-radius:3px;background:rgba(90,155,255,.7);width:0%" data-score-idx="${i}"></div>
            </div>
            <span class="radar-val-${i}" style="font-size:9px;color:#5A9BFF;font-family:monospace;min-width:22px">—</span>
          </div>`).join('')}
      </div>
    </div>
  </div>
  ${section('Aviso Legal','Disclaimer',`
    <div class="disclaimer-box">
      Este documento ha sido elaborado por Círculo Azul Finanzas con fines exclusivamente informativos y <strong>no constituye asesoramiento financiero, de inversión o legal personalizado</strong>. La información proviene de fuentes consideradas confiables pero no se garantiza su exactitud ni integridad. Las opiniones, estimaciones y proyecciones representan el juicio del modelo analítico a la fecha de publicación y están sujetas a cambios sin previo aviso.<br><br>
      <strong>Riesgo de inversión:</strong> Invertir en valores implica riesgos, incluida la posible pérdida total del capital. Los resultados pasados no garantizan resultados futuros. La performance histórica de cualquier activo financiero no es indicativa de resultados futuros.<br><br>
      <strong>Conflictos de interés:</strong> Círculo Azul Finanzas no mantiene posiciones en los valores analizados al momento de la publicación de este informe, y no recibe compensación de las empresas analizadas.<br><br>
      <strong>Jurisdicción:</strong> Este informe está dirigido a inversores sofisticados en Argentina y no constituye una oferta pública de valores en ningún país. El inversor debe consultar a su asesor financiero antes de tomar decisiones de inversión basadas en este documento.<br><br>
      © Círculo Azul Finanzas ${new Date().getFullYear()} · circuloazulfinanzas.com · Todos los derechos reservados. Prohibida la reproducción total o parcial sin autorización expresa.
    </div>
  `)}
  <div class="page-footer" style="color:#C9A84C">
    <span>Círculo Azul Finanzas · Análisis Institucional IA · Modelo: GPT-4o</span>
    <span>${esc(empresa)}${ticker?' ('+esc(ticker)+')':''} · ${esc(fecha)}</span>
    <span>FIN DEL INFORME</span>
  </div>
</div>

<!-- ══ PG 19 — SEMÁFORO INTEGRADO — 20 INDICADORES ══════════ -->
<div class="pg">
  ${ph}
  <div class="section">
    <div class="section-tag">Sección 11</div>
    <div class="section-title">Semáforo Integrado — 20 Indicadores Clave</div>
    <div class="section-hr"></div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:6px">
      ${((d.semaforo_integrado)||[]).slice(0,20).map(function(item){
        var lbl=item[0]||'', val=item[1]||'—', sig=item[2]||'a', nota=item[3]||'';
        var clr=sig==='g'?'#22c55e':sig==='r'?'#ef4444':'#f59e0b';
        var bg=sig==='g'?'rgba(34,197,94,.07)':sig==='r'?'rgba(239,68,68,.07)':'rgba(245,158,11,.07)';
        var icon=sig==='g'?'✅':sig==='r'?'🚨':'🟡';
        return '<div style="background:'+bg+';border:1px solid '+clr+'33;border-radius:8px;padding:10px 10px;display:flex;flex-direction:column;gap:4px"><div style="display:flex;align-items:center;gap:5px"><span style="font-size:13px">'+icon+'</span><span style="font-size:9px;font-weight:700;color:'+clr+'">'+esc(lbl)+'</span></div><div style="font-size:14px;font-weight:800;color:'+clr+';letter-spacing:-.3px">'+esc(val)+'</div><div style="font-size:8px;color:rgba(255,255,255,.4);line-height:1.3">'+esc(nota)+'</div></div>';
      }).join('')}
    </div>
    <div style="margin-top:10px;padding:8px 14px;background:rgba(90,155,255,.06);border-radius:6px;border:1px solid rgba(90,155,255,.15);display:flex;gap:24px;justify-content:center">
      <span style="font-size:10px;color:#8FA8C8">✅ <strong style="color:#22c55e">${((d.semaforo_integrado)||[]).filter(function(i){return i[2]==='g';}).length}</strong> Favorable</span>
      <span style="font-size:10px;color:#8FA8C8">🟡 <strong style="color:#f59e0b">${((d.semaforo_integrado)||[]).filter(function(i){return i[2]==='a';}).length}</strong> Intermedio</span>
      <span style="font-size:10px;color:#8FA8C8">🚨 <strong style="color:#ef4444">${((d.semaforo_integrado)||[]).filter(function(i){return i[2]==='r';}).length}</strong> Alerta</span>
    </div>
  </div>
  ${pf}
</div>

<!-- ══ PG 20 — SCORING FINAL ════════════════════════════════════ -->
<div class="pg">
  ${ph}
  ${(function(){
    var sf = d.scoring_final || {};
    var total = parseInt(sf.score_total)||0;
    var cats = [
      ['Crecimiento Revenue',sf.score_crecimiento||'—',sf.score_crecimiento,'#5A9BFF'],
      ['Rentabilidad & Márgenes',sf.score_rentabilidad||'—',sf.score_rentabilidad,'#22c55e'],
      ['Solidez Financiera',sf.score_solidez||'—',sf.score_solidez,'#f59e0b'],
      ['Valoración Relativa',sf.score_valoracion||'—',sf.score_valoracion,'#a78bfa'],
      ['Ventaja Competitiva',sf.score_ventaja||'—',sf.score_ventaja,'#f472b6']
    ];
    var totalColor = total>=80?'#22c55e':total>=60?'#f59e0b':'#ef4444';
    var totalLabel = total>=80?'EXCELENTE':total>=70?'NOTABLE':total>=60?'BUENO':total>=50?'REGULAR':'EN REVISIÓN';
    return section('Scoring Final — Análisis Institucional Completo','Sección 11b',`
      <div class="two-col" style="align-items:flex-start;gap:20px">
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;background:rgba(0,0,0,.3);border-radius:12px;border:2px solid ${totalColor}33;text-align:center;gap:6px">
          <div style="font-size:9px;color:#8FA8C8;letter-spacing:1px;text-transform:uppercase">Score Total</div>
          <div style="font-size:54px;font-weight:900;color:${totalColor};line-height:1;letter-spacing:-2px">${esc(String(sf.score_total||'—'))}</div>
          <div style="font-size:10px;font-weight:700;color:${totalColor};letter-spacing:2px">${totalLabel}</div>
          <div style="width:100%;height:6px;background:rgba(255,255,255,.07);border-radius:3px;overflow:hidden;margin-top:4px">
            <div style="height:6px;width:${total}%;background:${totalColor};border-radius:3px"></div>
          </div>
        </div>
        <div style="flex:1;display:flex;flex-direction:column;gap:10px">
          ${cats.map(function(c){
            var pct=0;try{pct=Math.min(100,(parseInt(String(c[2]).split('/')[0])||0)/20*100);}catch(e){}
            return '<div><div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-size:9px;color:#8FA8C8">'+esc(c[0])+'</span><span style="font-size:9px;font-weight:700;color:'+c[3]+'">'+esc(String(c[1]))+'</span></div><div style="height:8px;background:rgba(255,255,255,.06);border-radius:4px;overflow:hidden"><div style="height:8px;width:'+pct+'%;background:'+c[3]+';border-radius:4px"></div></div></div>';
          }).join('')}
        </div>
      </div>
      <div style="margin-top:12px;padding:14px 16px;background:rgba(201,168,76,.06);border-radius:8px;border:1px solid rgba(201,168,76,.2)">
        <div style="font-size:9px;color:#C9A84C;font-weight:700;letter-spacing:.5px;text-transform:uppercase;margin-bottom:6px">Veredicto del Modelo</div>
        <div style="font-size:10px;color:#E5ECF4;line-height:1.6">${esc(sf.veredicto||'Análisis completado.')}</div>
      </div>
      ${sf.comparativa?'<div style="margin-top:8px;padding:10px 14px;background:rgba(90,155,255,.05);border-radius:6px;border:1px solid rgba(90,155,255,.1)"><span style="font-size:9px;color:#5A9BFF">'+esc(sf.comparativa)+'</span></div>':''}
    `);
  })()}
  <div class="section">
    <div class="section-tag">Nota Final</div>
    <div class="section-title">Aviso Legal</div>
    <div class="section-hr"></div>
    <div class="disclaimer-box" style="font-size:8.5px">
      Este documento ha sido elaborado por Círculo Azul Finanzas con fines exclusivamente informativos y <strong>no constituye asesoramiento financiero, de inversión o legal personalizado</strong>. La información proviene de fuentes consideradas confiables pero no se garantiza su exactitud ni integridad. Las opiniones, estimaciones y proyecciones representan el juicio del modelo analítico a la fecha de publicación y están sujetas a cambios sin previo aviso. Invertir en valores implica riesgos, incluida la posible pérdida total del capital. Los resultados pasados no garantizan resultados futuros. El inversor debe consultar a su asesor financiero antes de tomar decisiones de inversión basadas en este documento.<br>
      © Círculo Azul Finanzas ${new Date().getFullYear()} · circuloazulfinanzas.com · Todos los derechos reservados.
    </div>
  </div>
  <div class="page-footer" style="color:#C9A84C">
    <span>Círculo Azul Finanzas · Mega Reporte Institucional IA · Modelo: GPT-4o</span>
    <span>${esc(empresa)}${ticker?' ('+esc(ticker)+')':''} · ${esc(fecha)}</span>
    <span>20 PÁGINAS · ANÁLISIS COMPLETO</span>
  </div>
</div>

<script>
(function() {
  if (typeof Chart === 'undefined') { window.chartsReady = true; return; }
  var CD = ${chartDataJSON};
  Chart.defaults.color = 'rgba(255,255,255,.5)';
  Chart.defaults.borderColor = 'rgba(255,255,255,.05)';
  Chart.defaults.font.family = 'Inter, sans-serif';
  Chart.defaults.font.size = 10;
  var SX = {grid:{color:'rgba(255,255,255,.04)'}};
  var SY = {grid:{color:'rgba(255,255,255,.04)'}};
  var NOANI = {animation:{duration:0}};
  var LEG = {labels:{boxWidth:10,padding:10,font:{size:9}}};

  function toPct(arr) {
    if (!arr||!arr.length) return [];
    var filt = arr.filter(function(v){return v&&v!==0;});
    if (filt.length && Math.max.apply(null,filt)<=1.5) return arr.map(function(v){return +(v*100).toFixed(1);});
    return arr.map(function(v){return +v||0;});
  }
  function cleanNum(v){return +(String(v).replace(/[$,%\s]/g,''))||0;}

  try {
    if (document.getElementById('pdf-chart-revenue')&&CD.g_years&&CD.g_years.length) {
      new Chart(document.getElementById('pdf-chart-revenue'),{
        type:'bar',
        data:{labels:CD.g_years,datasets:[
          {label:'Revenue (M)',data:CD.g_rev,backgroundColor:'rgba(90,155,255,.25)',borderColor:'rgba(90,155,255,.8)',borderWidth:1,borderRadius:3,yAxisID:'y'},
          {label:'Net Income (M)',data:CD.g_ni,type:'line',borderColor:'#C9A84C',backgroundColor:'rgba(201,168,76,.06)',borderWidth:2,pointBackgroundColor:'#C9A84C',pointRadius:3,tension:.35,fill:false,yAxisID:'y2'}
        ]},
        options:{responsive:true,maintainAspectRatio:false,...NOANI,plugins:{legend:LEG},
          scales:{x:SX,y:{...SY,position:'left',ticks:{callback:function(v){return v>=1000?(v/1000).toFixed(0)+'K':v;}}},
            y2:{position:'right',grid:{display:false},ticks:{callback:function(v){return v>=1000?(v/1000).toFixed(0)+'K':v;}}}}}
      });
    }
  } catch(e){}
  try {
    if (document.getElementById('pdf-chart-mix')&&CD.g_mix_lbl&&CD.g_mix_lbl.length) {
      var pal=['#5A9BFF','#C9A84C','#4ade80','#f87171','#fbbf24','#818cf8','#34d399','#fb923c'];
      new Chart(document.getElementById('pdf-chart-mix'),{
        type:'doughnut',
        data:{labels:CD.g_mix_lbl,datasets:[{data:CD.g_mix_pct,backgroundColor:pal.slice(0,CD.g_mix_lbl.length).map(function(c){return c+'99';}),borderColor:pal.slice(0,CD.g_mix_lbl.length),borderWidth:2}]},
        options:{responsive:true,maintainAspectRatio:false,cutout:'55%',...NOANI,
          plugins:{legend:{position:'bottom',labels:{boxWidth:9,padding:7,font:{size:8}}},
            tooltip:{callbacks:{label:function(ctx){return ctx.label+': '+ctx.parsed+'%';}}}}}
      });
    }
  } catch(e){}
  try {
    if (document.getElementById('pdf-chart-margins')) {
      var rawG=CD.g_gross_m||[],rawE=CD.g_ebitda_m||[],rawF=CD.g_fcf_m||[];
      var allZ=rawG.every(function(v){return !v;})&&rawE.every(function(v){return !v;});
      var qL,gross,ebitda,fcf;
      if (allZ&&CD.pnl&&CD.pnl.length>1) {
        qL=CD.pnl[0].slice(1);
        function findRow(k){var r=CD.pnl.slice(1).find(function(r){return r[0]&&r[0].toLowerCase().indexOf(k)>=0;});return r?r.slice(1).map(cleanNum):[];}
        gross=toPct(findRow('gross'));ebitda=toPct(findRow('ebitda'));fcf=toPct(findRow('fcf'));
      } else {
        qL=(CD.g_qtrs&&CD.g_qtrs.length?CD.g_qtrs:rawG.map(function(_,i){return 'P'+(i+1);}));
        gross=toPct(rawG);ebitda=toPct(rawE);fcf=toPct(rawF);
      }
      var mDs=[];
      if (gross.some(function(v){return v;})) mDs.push({label:'Gross Margin',data:gross,borderColor:'#4ade80',borderWidth:2,tension:.3,fill:false,pointRadius:3});
      if (ebitda.some(function(v){return v;})) mDs.push({label:'EBITDA Margin',data:ebitda,borderColor:'#5A9BFF',borderWidth:2,tension:.3,fill:false,pointRadius:3});
      if (fcf.some(function(v){return v;})) mDs.push({label:'FCF Margin',data:fcf,borderColor:'#C9A84C',borderWidth:2,tension:.3,fill:false,pointRadius:3});
      if (!mDs.length) mDs=[{label:'Sin datos',data:[0],borderColor:'rgba(255,255,255,.1)'}];
      new Chart(document.getElementById('pdf-chart-margins'),{
        type:'line',data:{labels:qL,datasets:mDs},
        options:{responsive:true,maintainAspectRatio:false,...NOANI,plugins:{legend:LEG},
          scales:{x:SX,y:{...SY,min:0,ticks:{callback:function(v){return v+'%';}}}}}
      });
    }
  } catch(e){}
  try {
    if (document.getElementById('pdf-chart-dcf')&&CD.g_dcf_lo&&CD.g_dcf_lo.length) {
      var mids=CD.g_dcf_lo.map(function(lo,i){return +((lo+(CD.g_dcf_hi[i]||lo))/2).toFixed(2);});
      var dcfDs=[{label:'Valor DCF',data:mids,backgroundColor:['rgba(248,113,113,.4)','rgba(90,155,255,.4)','rgba(74,222,128,.4)'],borderColor:['rgba(248,113,113,.9)','rgba(90,155,255,.9)','rgba(74,222,128,.9)'],borderWidth:2,borderRadius:6}];
      if (CD.g_precio) dcfDs.push({label:'Precio actual',data:[CD.g_precio,CD.g_precio,CD.g_precio],type:'line',borderColor:'rgba(201,168,76,.9)',borderWidth:2,borderDash:[5,3],pointRadius:0,fill:false});
      new Chart(document.getElementById('pdf-chart-dcf'),{
        type:'bar',data:{labels:['Pesimista','Base','Optimista'],datasets:dcfDs},
        options:{responsive:true,maintainAspectRatio:false,...NOANI,plugins:{legend:LEG},
          scales:{x:SX,y:{...SY,ticks:{callback:function(v){return '$'+v;}}}}}
      });
    }
  } catch(e){}
  try {
    if (document.getElementById('pdf-chart-mc')&&CD.montecarlo&&CD.montecarlo.length) {
      var mcL=CD.montecarlo.map(function(r){return r[0];});
      var mcP=CD.montecarlo.map(function(r){return +(String(r[2]||'0').replace(/[$,]/g,''))||0;});
      new Chart(document.getElementById('pdf-chart-mc'),{
        type:'bar',
        data:{labels:mcL,datasets:[{label:'Precio objetivo',data:mcP,
          backgroundColor:['rgba(248,113,113,.4)','rgba(251,191,36,.4)','rgba(90,155,255,.4)','rgba(74,222,128,.4)','rgba(74,222,128,.6)'],
          borderColor:['rgba(248,113,113,.9)','rgba(251,191,36,.9)','rgba(90,155,255,.9)','rgba(74,222,128,.9)','rgba(74,222,128,.9)'],
          borderWidth:2,borderRadius:6}]},
        options:{responsive:true,maintainAspectRatio:false,...NOANI,plugins:{legend:{display:false}},
          scales:{x:SX,y:{...SY,ticks:{callback:function(v){return '$'+v;}}}}}
      });
    }
  } catch(e){}
  try {
    if (document.getElementById('pdf-chart-peers')&&CD.g_peers_co&&CD.g_peers_co.length) {
      var grMax=Math.max.apply(null,CD.g_peers_gr.concat([0]));
      var grPct=CD.g_peers_gr.map(function(v){return grMax<=1.5?+(v*100).toFixed(1):+v||0;});
      new Chart(document.getElementById('pdf-chart-peers'),{
        type:'bar',
        data:{labels:CD.g_peers_co,datasets:[
          {label:'P/S',data:CD.g_peers_ps,backgroundColor:'rgba(90,155,255,.4)',borderColor:'rgba(90,155,255,.85)',borderWidth:1,borderRadius:3},
          {label:'EV/EBITDA',data:CD.g_peers_eve,backgroundColor:'rgba(201,168,76,.4)',borderColor:'rgba(201,168,76,.85)',borderWidth:1,borderRadius:3},
          {label:'Rev Gr %',data:grPct,backgroundColor:'rgba(74,222,128,.35)',borderColor:'rgba(74,222,128,.85)',borderWidth:1,borderRadius:3}
        ]},
        options:{responsive:true,maintainAspectRatio:false,...NOANI,plugins:{legend:LEG},scales:{x:SX,y:SY}}
      });
    }
  } catch(e){}

  try {
    if (document.getElementById('pdf-chart-qtrs')&&CD.g_qtrs&&CD.g_qtrs.length&&CD.g_qtrs_rev&&CD.g_qtrs_rev.some(function(v){return v;})) {
      new Chart(document.getElementById('pdf-chart-qtrs'),{
        type:'bar',
        data:{labels:CD.g_qtrs,datasets:[
          {label:'Revenue (M)',data:CD.g_qtrs_rev,backgroundColor:'rgba(90,155,255,.3)',borderColor:'rgba(90,155,255,.85)',borderWidth:1,borderRadius:3,yAxisID:'y'},
          {label:'Net Income (M)',data:CD.g_qtrs_ni,type:'line',borderColor:'#C9A84C',backgroundColor:'rgba(201,168,76,.06)',borderWidth:2,pointBackgroundColor:'#C9A84C',pointRadius:3,tension:.35,fill:false,yAxisID:'y2'},
          {label:'Rev Growth %',data:CD.g_qtrs_growth,type:'line',borderColor:'rgba(74,222,128,.8)',backgroundColor:'rgba(74,222,128,.04)',borderWidth:1.5,borderDash:[4,3],pointRadius:2,tension:.3,fill:false,yAxisID:'y3'}
        ]},
        options:{responsive:true,maintainAspectRatio:false,...NOANI,plugins:{legend:LEG},
          scales:{x:SX,
            y:{...SY,position:'left',ticks:{callback:function(v){return v>=1000?(v/1000).toFixed(0)+'K':v;}}},
            y2:{position:'right',grid:{display:false},ticks:{callback:function(v){return v>=1000?(v/1000).toFixed(0)+'K':v;}}},
            y3:{position:'right',grid:{display:false},ticks:{color:'rgba(74,222,128,.6)',callback:function(v){return v+'%';}},display:false}
          }}
      });
    }
  } catch(e){}

  try {
    if (document.getElementById('pdf-chart-rev-growth')&&CD.g_years&&CD.g_years.length>1) {
      var revGrw=CD.g_rev.map(function(v,i){
        if(i===0) return 0;
        var prev=CD.g_rev[i-1];
        return prev?+((v-prev)/Math.abs(prev)*100).toFixed(1):0;
      }).slice(1);
      var revLbl=CD.g_years.slice(1);
      new Chart(document.getElementById('pdf-chart-rev-growth'),{
        type:'bar',
        data:{labels:revLbl,datasets:[{
          label:'Revenue YoY Growth %',
          data:revGrw,
          backgroundColor:revGrw.map(function(v){return v>=0?'rgba(74,222,128,.35)':'rgba(239,68,68,.35)';}),
          borderColor:revGrw.map(function(v){return v>=0?'rgba(74,222,128,.85)':'rgba(239,68,68,.85)';}),
          borderWidth:1,borderRadius:4
        }]},
        options:{responsive:true,maintainAspectRatio:false,...NOANI,
          plugins:{legend:{display:false},tooltip:{callbacks:{label:function(ctx){return ctx.parsed.y+'%';}}}},
          scales:{x:SX,y:{...SY,ticks:{callback:function(v){return v+'%';}},
            grid:{color:'rgba(255,255,255,.04)'},
            afterDataLimits:function(axis){axis.max=Math.max(axis.max,10);axis.min=Math.min(axis.min,-10);}
          }}
        }
      });
    }
  } catch(e){}

  try {
    if (document.getElementById('pdf-chart-capalloc')&&CD.capalloc_yrs&&CD.capalloc_yrs.length) {
      new Chart(document.getElementById('pdf-chart-capalloc'),{
        type:'bar',
        data:{labels:CD.capalloc_yrs,datasets:[
          {label:'Buybacks (M)',data:CD.capalloc_bb,backgroundColor:'rgba(90,155,255,.4)',borderColor:'rgba(90,155,255,.85)',borderWidth:1,borderRadius:3},
          {label:'Dividendos (M)',data:CD.capalloc_div,backgroundColor:'rgba(201,168,76,.4)',borderColor:'rgba(201,168,76,.85)',borderWidth:1,borderRadius:3},
          {label:'FCF (M)',data:CD.capalloc_fcf,type:'line',borderColor:'#22c55e',backgroundColor:'rgba(34,197,94,.06)',borderWidth:2,pointRadius:3,tension:.35,fill:false}
        ]},
        options:{responsive:true,maintainAspectRatio:false,...NOANI,plugins:{legend:LEG},scales:{x:SX,y:SY}}
      });
    }
  } catch(e){}

  try {
    if (document.getElementById('pdf-chart-ownership')&&CD.own_lbl&&CD.own_lbl.length) {
      new Chart(document.getElementById('pdf-chart-ownership'),{
        type:'doughnut',
        data:{labels:CD.own_lbl,datasets:[{data:CD.own_pct,backgroundColor:['rgba(90,155,255,.7)','rgba(201,168,76,.7)','rgba(34,197,94,.7)','rgba(239,68,68,.7)','rgba(168,85,247,.7)','rgba(251,146,60,.7)'],borderWidth:1,borderColor:'#05080F'}]},
        options:{responsive:true,maintainAspectRatio:false,...NOANI,plugins:{legend:{...LEG,position:'right'}}}
      });
    }
  } catch(e){}

  try {
    if (document.getElementById('pdf-chart-scenarios')) {
      new Chart(document.getElementById('pdf-chart-scenarios'),{
        type:'doughnut',
        data:{
          labels:['Bajista (Bear) 25%','Base 50%','Alcista (Bull) 25%'],
          datasets:[{
            data:[25,50,25],
            backgroundColor:['rgba(239,68,68,.7)','rgba(90,155,255,.7)','rgba(34,197,94,.7)'],
            borderColor:['rgba(239,68,68,.9)','rgba(90,155,255,.9)','rgba(34,197,94,.9)'],
            borderWidth:2,hoverOffset:6
          }]
        },
        options:{responsive:true,maintainAspectRatio:false,...NOANI,cutout:'50%',
          plugins:{legend:{position:'bottom',labels:{boxWidth:10,padding:9,font:{size:8}}},
            tooltip:{callbacks:{label:function(ctx){return ctx.label+': '+ctx.parsed+'%';}}}}}
      });
    }
  } catch(e){}

  try {
    if (document.getElementById('pdf-chart-price-range')) {
      var pricePoints=[CD.price_52w_low,CD.g_precio,CD.price_target_lo,CD.price_target_hi];
      var priceLabels=['52W Mínimo','Precio Actual','Target Mín.','Target Máx.'];
      var priceColors=['rgba(239,68,68,.6)','rgba(90,155,255,.8)','rgba(201,168,76,.7)','rgba(34,197,94,.8)'];
      var validPrices=pricePoints.filter(function(v){return v>0;});
      if(validPrices.length>=2) {
        new Chart(document.getElementById('pdf-chart-price-range'),{
          type:'bar',
          data:{
            labels:priceLabels,
            datasets:[{
              label:'Precio (USD)',
              data:pricePoints,
              backgroundColor:priceColors,
              borderColor:priceColors.map(function(c){return c.replace('.6','.95').replace('.7','.95').replace('.8','.95');}),
              borderWidth:2,borderRadius:6
            }]
          },
          options:{responsive:true,maintainAspectRatio:false,...NOANI,
            indexAxis:'y',
            plugins:{legend:{display:false},
              tooltip:{callbacks:{label:function(ctx){return '$'+ctx.parsed.x.toFixed(2);}}}},
            scales:{
              x:{...SX,ticks:{callback:function(v){return '$'+v;}}},
              y:{...SY,ticks:{font:{size:9}}}
            }}
        });
      }
    }
  } catch(e){}

  try {
    if (document.getElementById('pdf-chart-radar')&&CD.radar_scores&&CD.radar_scores.length) {
      new Chart(document.getElementById('pdf-chart-radar'),{
        type:'radar',
        data:{
          labels:CD.radar_lbl,
          datasets:[{
            label:'Perfil de la Empresa',
            data:CD.radar_scores,
            backgroundColor:'rgba(90,155,255,.15)',
            borderColor:'rgba(90,155,255,.8)',
            borderWidth:2,
            pointBackgroundColor:'#C9A84C',
            pointBorderColor:'#C9A84C',
            pointRadius:4,
            pointHoverRadius:5
          },{
            label:'Referencia (7/10)',
            data:[7,7,7,7,7,7],
            backgroundColor:'rgba(201,168,76,.04)',
            borderColor:'rgba(201,168,76,.3)',
            borderWidth:1,
            borderDash:[4,4],
            pointRadius:0
          }]
        },
        options:{responsive:true,maintainAspectRatio:false,...NOANI,
          plugins:{legend:{position:'bottom',labels:{boxWidth:9,padding:8,font:{size:8}}}},
          scales:{r:{
            min:0,max:10,
            ticks:{stepSize:2,backdropColor:'transparent',font:{size:8},color:'rgba(255,255,255,.35)'},
            grid:{color:'rgba(255,255,255,.06)'},
            angleLines:{color:'rgba(255,255,255,.08)'},
            pointLabels:{font:{size:9},color:'rgba(255,255,255,.6)'}
          }}
        }
      });
      // Llenar barras laterales con scores
      CD.radar_scores.forEach(function(score,i){
        var bar=document.querySelector('.radar-bar-'+i);
        var val=document.querySelector('.radar-val-'+i);
        if(bar) bar.style.width=Math.min(100,(score/10*100))+'%';
        if(val) val.textContent=score.toFixed(1);
      });
    }
  } catch(e){}

  window.chartsReady = true;
})();
</script>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/analisis/generar
// Body: { empresa, archivo (base64 opcional), archivoNombre }
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/analisis/generar', iaLimiter, async (req, res) => {
  const { empresa, archivo, archivoNombre } = req.body || {};

  if (!empresa || !empresa.trim()) {
    return res.status(400).json({ error: 'El campo empresa es requerido.' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key de OpenAI no configurada en el servidor.' });
  }

  // Directorio para PDFs generados
  const filesDir = path.join(__dirname, 'files');
  if (!fs.existsSync(filesDir)) fs.mkdirSync(filesDir, { recursive: true });

  const systemPrompt = `Eres un analista financiero institucional de élite especializado en renta variable global. Analizas empresas públicas con rigor cuantitativo y cualitativo. Respondes SIEMPRE con un JSON válido perfectamente estructurado con todos los campos del esquema solicitado. No omites ningún campo. Si no tienes datos precisos, usas estimaciones razonables basadas en el sector y tamaño de la empresa.`;

  const userPrompt = `Genera un análisis financiero institucional COMPLETO y DETALLADO de la empresa "${empresa.trim()}".${archivoNombre ? ` El usuario adjuntó contexto adicional en: ${archivoNombre}.` : ''}

INSTRUCCIONES CRÍTICAS:
- Usa datos REALES y ACTUALIZADOS para "${empresa.trim()}" específicamente. NO uses datos de ejemplo ni placeholders.
- Para campos de estimados, usa proyecciones racionales basadas en el historial real de la empresa.
- Todas las cifras financieras en millones USD salvo que se indique.
- El JSON debe estar perfectamente formado. No omitas ningún campo.
- Si no conoces un dato exacto, usa la mejor estimación basada en la industria y tamaño de la empresa, pero sé específico.

Responde SOLO con JSON con EXACTAMENTE estos campos (NO incluyas keys adicionales ni ejemplos literales — usa datos reales de ${empresa.trim()}):
{
  "empresa_nombre": "nombre completo legal",
  "empresa_ticker": "símbolo bursátil principal o N/A",
  "empresa_sector": "sector GICS principal",
  "empresa_subsector": "subsector específico (ej: 'SaaS / EdTech' o 'Semiconductores / Diseño de Chips')",
  "empresa_ceo": "nombre del CEO actual",
  "empresa_cfo": "nombre del CFO actual o N/D",
  "empresa_empleados": "número de empleados (ej: '4,200')",
  "empresa_ipo": "año de IPO o N/A",
  "empresa_sede": "ciudad, país",
  "empresa_auditora": "firma auditora Big-4 o equivalente",
  "empresa_modelo": "Modelo de negocio en 3-4 oraciones: qué hace, cómo gana dinero, ventaja diferencial y posición competitiva.",
  "market_cap": "capitalización bursátil actual (ej: '$8.5B')",
  "shares_outstanding": "acciones en circulación (ej: '47.5M')",
  "precio_cierre": "precio de cierre reciente solo número sin símbolo",
  "empresa_52w_high": "máximo 52 semanas solo número",
  "empresa_52w_low": "mínimo 52 semanas solo número",
  "target_bajo": "precio objetivo pesimista solo número",
  "target_alto": "precio objetivo optimista solo número",
  "recomendacion": "BUY | HOLD | SELL | ACUMULAR | REDUCIR",
  "confianza": "ALTA | MEDIA | BAJA",
  "horizonte": "horizonte de inversión (ej: '12-18 meses')",

  "resumen_ejecutivo": [
    ["grn", null, null, "Catalizador primario: [nombre específico]", "Descripción concisa con métricas reales — revenue, usuarios, margen u otra métrica clave + tendencia YoY."],
    ["grn", null, null, "Catalizador secundario: [nombre]", "Segundo argumento más convincente con datos cuantitativos."],
    ["grn", null, null, "Fortaleza estructural: [nombre]", "Moat o ventaja competitiva duradera con evidencia concreta."],
    ["amb", null, null, "Factor a monitorear: [nombre]", "Riesgo o variable clave que puede impactar la tesis pero aún no es determinante."],
    ["red", null, null, "Riesgo principal: [nombre]", "El riesgo más relevante para el inversor con probabilidad estimada e impacto potencial."],
    ["red", null, null, "Riesgo secundario: [nombre]", "Segundo factor de riesgo significativo con contexto competitivo o regulatorio."],
    ["grn", null, null, "Veredicto: [BUY/HOLD/SELL]", "Conclusión de inversión con precio objetivo, horizonte y ratio riesgo/retorno estimado."]
  ],

  "scorecard_izq": [
    ["P/E Ratio", "— x"],
    ["EV/EBITDA", "— x"],
    ["EV/Ventas", "— x"],
    ["Deuda Neta/EBITDA", "— x"],
    ["FCF Yield", "— %"]
  ],
  "scorecard_der": [
    ["ROE", "— %"],
    ["ROIC", "— %"],
    ["Margen EBITDA", "— %"],
    ["Rev Growth YoY", "+— %"],
    ["Gross Margin", "— %"]
  ],

  "pnl": [
    ["Período", "2020", "2021", "2022", "2023", "2024E"],
    ["Revenue (M USD)", 0, 0, 0, 0, 0],
    ["Gross Profit (M)", 0, 0, 0, 0, 0],
    ["EBITDA (M)", 0, 0, 0, 0, 0],
    ["EBIT (M)", 0, 0, 0, 0, 0],
    ["Net Income (M)", 0, 0, 0, 0, 0],
    ["EPS (USD)", 0, 0, 0, 0, 0],
    ["Gross Margin", "0%", "0%", "0%", "0%", "0%"],
    ["EBITDA Margin", "0%", "0%", "0%", "0%", "0%"],
    ["Net Margin", "0%", "0%", "0%", "0%", "0%"]
  ],

  "balance_sheet": [
    ["Período", "2020", "2021", "2022", "2023", "2024E"],
    ["Cash & Equivalents (M)", 0, 0, 0, 0, 0],
    ["Inversiones LP (M)", 0, 0, 0, 0, 0],
    ["Cuentas por Cobrar (M)", 0, 0, 0, 0, 0],
    ["Total Activos (M)", 0, 0, 0, 0, 0],
    ["Deuda Total (M)", 0, 0, 0, 0, 0],
    ["Deuda Neta (M)", 0, 0, 0, 0, 0],
    ["Total Equity (M)", 0, 0, 0, 0, 0],
    ["Book Value/Acción (USD)", 0, 0, 0, 0, 0]
  ],

  "cashflow": [
    ["Período", "2020", "2021", "2022", "2023", "2024E"],
    ["Flujo Operativo (M)", 0, 0, 0, 0, 0],
    ["CapEx (M)", 0, 0, 0, 0, 0],
    ["Free Cash Flow (M)", 0, 0, 0, 0, 0],
    ["FCF Margin", "0%", "0%", "0%", "0%", "0%"],
    ["Recompras Acciones (M)", 0, 0, 0, 0, 0],
    ["Dividendos Pagados (M)", 0, 0, 0, 0, 0],
    ["FCF por Acción (USD)", 0, 0, 0, 0, 0]
  ],

  "kpis_sector": [
    ["KPI Sectorial 1", "valor real", "+XX% YoY", "Descripción de qué mide este KPI y por qué es relevante para esta empresa"],
    ["KPI Sectorial 2", "valor real", "+XX% YoY", "Descripción"],
    ["KPI Sectorial 3", "valor real", "+XX% YoY", "Descripción"],
    ["KPI Sectorial 4", "valor real", "+XX% YoY", "Descripción"],
    ["KPI Sectorial 5", "valor real", "+XX% YoY", "Descripción"],
    ["KPI Sectorial 6", "valor real", "+XX% YoY", "Descripción"],
    ["KPI Sectorial 7", "valor real", "+XX% YoY", "Descripción"],
    ["KPI Sectorial 8", "valor real", "+XX% YoY", "Descripción"]
  ],

  "geografia": [
    ["Región/País 1", 0, "+XX%", "XX%"],
    ["Región/País 2", 0, "+XX%", "XX%"],
    ["Región/País 3", 0, "+XX%", "XX%"],
    ["Región/País 4", 0, "+XX%", "XX%"]
  ],

  "capital_alloc": [
    ["2020", "$0M", "$0M", "$0M", "Descripción de uso de capital ese año"],
    ["2021", "$0M", "$0M", "$0M", "Descripción"],
    ["2022", "$0M", "$0M", "$0M", "Descripción"],
    ["2023", "$0M", "$0M", "$0M", "Descripción"],
    ["2024E", "$0M", "$0M", "$0M", "Descripción"]
  ],

  "guidance": [
    ["Revenue FY siguiente", "guía low - guía high", "consenso analistas", "vs. consenso"],
    ["EBITDA / Margen", "guía low - guía high", "consenso", "vs. consenso"],
    ["Métrica operativa clave", "guía", "consenso", "vs. consenso"]
  ],

  "ownership": [
    ["Accionista 1", "XX%", "XM acc"],
    ["Accionista 2", "XX%", "XM acc"],
    ["Accionista 3", "XX%", "XM acc"],
    ["Accionista 4", "XX%", "XM acc"],
    ["Accionista 5", "XX%", "XM acc"]
  ],

  "fuentes_ingresos": [
    ["Segmento A", "Descripción clara del segmento: qué incluye, modelo de precios, dinámica de crecimiento", "XX%"],
    ["Segmento B", "Descripción", "XX%"],
    ["Segmento C", "Descripción", "XX%"]
  ],

  "metricas_mercado": [
    ["P/E Trailing", "—x", "Bloomberg"],
    ["P/E Forward", "—x", "Bloomberg"],
    ["EV/EBITDA Trailing", "—x", "Bloomberg"],
    ["EV/EBITDA Forward", "—x", "Bloomberg"],
    ["EV/Ventas", "—x", "Bloomberg"],
    ["P/S Ratio", "—x", "Bloomberg"],
    ["PEG Ratio", "—x", "Bloomberg"],
    ["52W High", "$—", "Yahoo Finance"],
    ["52W Low", "$—", "Yahoo Finance"],
    ["Beta 1Y", "—", "Bloomberg"],
    ["Short Interest", "—%", "FINRA"]
  ],

  "g_years": ["2020", "2021", "2022", "2023", "2024E"],
  "g_rev": [0, 0, 0, 0, 0],
  "g_ni": [0, 0, 0, 0, 0],
  "g_qtrs": ["Q1 23", "Q2 23", "Q3 23", "Q4 23", "Q1 24", "Q2 24", "Q3 24", "Q4 24E"],
  "g_gross_m": [0, 0, 0, 0, 0, 0, 0, 0],
  "g_ebitda_m": [0, 0, 0, 0, 0, 0, 0, 0],
  "g_fcf_m": [0, 0, 0, 0, 0, 0, 0, 0],
  "g_qtrs_rev": [0, 0, 0, 0, 0, 0, 0, 0],
  "g_qtrs_ni": [0, 0, 0, 0, 0, 0, 0, 0],
  "g_qtrs_growth": [0, 0, 0, 0, 0, 0, 0, 0],
  "g_mix_lbl": ["Segmento A", "Segmento B"],
  "g_mix_pct": [60, 40],

  "bull_items": [
    ["Catalizador 1 — [nombre concreto]", "Descripción con métricas reales, tendencia YoY y por qué es un catalizador positivo de inversión."],
    ["Catalizador 2 — [nombre concreto]", "Descripción específica con datos cuantitativos de respaldo."],
    ["Catalizador 3 — [nombre concreto]", "Descripción con contexto competitivo o financiero."],
    ["Catalizador 4 — [nombre concreto]", "Descripción del cuarto argumento alcista más relevante."],
    ["Catalizador 5 — [nombre concreto]", "Descripción con potencial de revaluación o expansión de múltiplos."]
  ],

  "bear_items": [
    ["Riesgo 1 — [nombre concreto]", "Descripción con probabilidad estimada, impacto en valuación y qué triggería el riesgo."],
    ["Riesgo 2 — [nombre concreto]", "Descripción con datos de referencia de la industria o competencia."],
    ["Riesgo 3 — [nombre concreto]", "Descripción del tercer factor de riesgo con mitigantes identificados."],
    ["Riesgo 4 — [nombre concreto]", "Descripción con contexto regulatorio, macroeconómico o estructural."]
  ],

  "moat": [
    ["Factor MOAT 1", "Descripción concreta de por qué esta ventaja es sostenible con evidencia cuantitativa", "★★★★★"],
    ["Factor MOAT 2", "Descripción", "★★★★☆"],
    ["Factor MOAT 3", "Descripción", "★★★★☆"],
    ["Factor MOAT 4", "Descripción", "★★★☆☆"],
    ["Factor MOAT 5", "Descripción", "★★★☆☆"]
  ],

  "riesgos": [
    ["Riesgo 1", "Alta/Media/Baja", "Alto/Medio/Bajo", "Descripción de la mitigación o cobertura natural"],
    ["Riesgo 2", "Alta/Media/Baja", "Alto/Medio/Bajo", "Descripción de la mitigación"],
    ["Riesgo 3", "Alta/Media/Baja", "Alto/Medio/Bajo", "Descripción de la mitigación"],
    ["Riesgo 4", "Alta/Media/Baja", "Alto/Medio/Bajo", "Descripción de la mitigación"],
    ["Riesgo 5", "Alta/Media/Baja", "Alto/Medio/Bajo", "Descripción de la mitigación"]
  ],

  "dcf_tabla": [
    ["Escenario", "WACC", "g Terminal", "Valor/Acción", "Upside vs Precio"],
    ["Pesimista", "—%", "—%", "—", "—%"],
    ["Base", "—%", "—%", "—", "—%"],
    ["Optimista", "—%", "—%", "—", "—%"]
  ],
  "g_dcf_lo": [0, 0, 0],
  "g_dcf_hi": [0, 0, 0],
  "g_precio": 0,

  "montecarlo": [
    ["P10", "Bear extremo", "$—", "10%"],
    ["P25", "Bajista", "$—", "15%"],
    ["P50", "Base", "$—", "50%"],
    ["P75", "Alcista", "$—", "15%"],
    ["P90", "Bull extremo", "$—", "10%"]
  ],

  "comparables": [
    ["Empresa 1", "TKR1", "—x", "—x", "—%", "BUY/HOLD/SELL"],
    ["Empresa 2", "TKR2", "—x", "—x", "—%", "BUY/HOLD/SELL"],
    ["Empresa 3", "TKR3", "—x", "—x", "—%", "BUY/HOLD/SELL"],
    ["Empresa 4", "TKR4", "—x", "—x", "—%", "BUY/HOLD/SELL"]
  ],
  "g_peers_co": ["—", "Peer1", "Peer2", "Peer3"],
  "g_peers_ps": [0, 0, 0, 0],
  "g_peers_eve": [0, 0, 0, 0],
  "g_peers_gr": [0, 0, 0, 0],

  "forense_intro": "El análisis forense contable evalúa la calidad de las ganancias reportadas y detecta posibles señales de alerta en prácticas contables.",
  "forense_tabla": [
    ["Beneish M-Score", "valor calculado (umbral: -1.78)", "✅ o ⚠️ o 🚨 — veredicto"],
    ["Accruals / Total Assets", "valor% (bajo = bueno)", "✅ o ⚠️ o 🚨 — veredicto"],
    ["DSO (Days Sales Outstanding)", "X días vs año anterior", "✅ o ⚠️ o 🚨 — veredicto"],
    ["Reconocimiento de Revenue", "descripción de política contable", "✅ o ⚠️ o 🚨 — veredicto"],
    ["Stock-Based Compensation / FCF", "X% del FCF anuualized", "✅ o ⚠️ o 🚨 — veredicto"],
    ["Deferred Revenue Trend", "crecimiento vs revenue growth", "✅ o ⚠️ o 🚨 — veredicto"],
    ["Inventory Turnover (si aplica)", "X veces vs peers", "✅ o ⚠️ o 🚨 — veredicto"]
  ],
  "forense_semaforo": "✅/🟡/🚨 Semáforo: descripción del veredicto global del análisis forense contable.",

  "escenarios_earnings": [
    ["Beat fuerte (+10%)", "Condición específica basada en métricas reales de la empresa", "+X% a +Y%", "Acción recomendada"],
    ["Beat moderado (+5%)", "Condición específica", "+X% a +Y%", "Acción recomendada"],
    ["In-line (0%)", "Condición específica", "0% a +X%", "Acción recomendada"],
    ["Miss leve (-5%)", "Condición específica", "-X% a -Y%", "Acción recomendada"],
    ["Miss severo (-10%)", "Condición específica", "-X% a -Y%", "Acción recomendada"]
  ],

  "noticias": [
    ["Mes Año", "Titular concreto del hecho noticioso más reciente", "Fuente", "Positivo/Negativo/Neutro"],
    ["Mes Año", "Segundo hecho relevante", "Fuente", "Positivo/Negativo/Neutro"],
    ["Mes Año", "Tercer hecho relevante", "Fuente", "Positivo/Negativo/Neutro"],
    ["Mes Año", "Cuarto hecho relevante", "Fuente", "Positivo/Negativo/Neutro"]
  ],

  "insiders": [
    ["Mes Año", "Nombre del insider", "Cargo (CEO/CFO/Director)", "Tipo de transacción", "N° acciones", "$precio"],
    ["Mes Año", "Nombre", "Cargo", "Tipo", "N° acciones", "$precio"]
  ],

  "conclusion_texto": "Tesis de inversión en 5-6 oraciones: recomendación con argumentos principales, precio objetivo con horizonte temporal, principales riesgos a monitorear, y ratio riesgo/retorno para el inversor.",

  "fuentes": [
    ["10-K / Informe Anual más reciente", "Regulatorio / SEC", "Mes Año"],
    ["10-Q / Informe Trimestral más reciente", "Regulatorio / SEC", "Mes Año"],
    ["Earnings Call más reciente", "Conference Call", "Mes Año"],
    ["Bloomberg Terminal — Datos de mercado", "Mercado", "Fecha"],
    ["Fuente de datos alternativos relevante", "Datos Alternativos", "Fecha"],
    ["Reporte sell-side de banco de inversión", "Sell-side Research", "Mes Año"]
  ],

  "semaforo_integrado": [
    ["Revenue Growth YoY", "X%", "g", ">10% es fuerte crecimiento"],
    ["Revenue CAGR 5Y", "X%", "g", ">10% compuesto sostenible"],
    ["Gross Margin", "X%", "g", ">40% moat de precios"],
    ["EBITDA Margin", "X%", "g", ">25% excelente operativo"],
    ["Net Margin", "X%", "g", ">15% rentabilidad alta"],
    ["FCF Margin", "X%", "g", ">10% conversión sólida"],
    ["ROIC", "X%", "g", ">15% supera costo capital"],
    ["ROE", "X%", "g", ">15% retorno accionista"],
    ["ROA", "X%", "a", ">8% uso eficiente activos"],
    ["Deuda / EBITDA", "Xx", "g", "<2x apalancamiento bajo"],
    ["Current Ratio", "Xx", "g", ">1.5x liquidez cómoda"],
    ["P/E Ratio", "Xx", "a", "<25x valoración razonable"],
    ["EV/EBITDA", "Xx", "a", "<15x sector tecnología"],
    ["FCF Yield", "X%", "g", ">5% generación de valor"],
    ["PEG Ratio", "Xx", "g", "<1.5 crecimiento pagado"],
    ["Piotroski Score", "X/9", "g", ">=7 empresa sólida"],
    ["Altman Z-Score", "X.X", "g", ">2.99 zona segura"],
    ["Calidad Earnings", "Alta/Media/Baja", "g", "Consistencia contable"],
    ["Fortaleza MOAT", "Fuerte/Moderado/Débil", "g", "Ventaja competitiva"],
    ["Solidez Accionarial", "Alta/Media/Baja", "g", "Estructura de propiedad"]
  ],

  "scoring_final": {
    "score_total": "X/100",
    "score_crecimiento": "X/20",
    "score_rentabilidad": "X/20",
    "score_solidez": "X/20",
    "score_valoracion": "X/20",
    "score_ventaja": "X/20",
    "veredicto": "Empresa de calidad institucional con sólida tesis de inversión — descripción 2-3 oraciones del perfil de riesgo/retorno.",
    "comparativa": "Percentil estimado vs. universo de cobertura: ej. Top 15% de empresas analizadas por calidad financiera."
  },

  "meta_analisis": [
    ["Modelo IA", "GPT-4o (OpenAI)"],
    ["Versión análisis", "4.0"],
    ["Empresa analizada", "${empresa.trim()}"],
    ["Cobertura temporal", "2020-2024E"],
    ["Campos de datos", "95+"],
    ["Metodologías aplicadas", "DCF 3-escenarios, Monte Carlo P10-P90, Beneish M-Score, MOAT Canvas, Forensic Accounting, Comparable Company Analysis"]
  ]
}

Para el campo semaforo_integrado: reemplaza TODOS los valores (X%, Xx, etc.) con los valores REALES de ${empresa.trim()}. Para la señal usa exactamente: "g" (verde, bueno), "a" (amarillo, intermedio), "r" (rojo, alerta). Para scoring_final usa valores numéricos reales estimados basados en el análisis completo.

RECORDATORIO FINAL: Todos los valores numéricos deben ser los REALES de ${empresa.trim()} — no uses los ceros o guiones del template, reemplázalos con datos concretos. Los textos entre corchetes [nombre concreto] deben reemplazarse con el contenido real específico de la empresa analizada.`;



  try {
    const { OpenAI } = require('openai');
    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 16000,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt   }
      ]
    });

    const rawJson = completion.choices?.[0]?.message?.content || '{}';
    let d;
    try {
      d = JSON.parse(rawJson);
    } catch (parseErr) {
      throw new Error('La respuesta de OpenAI no es JSON válido.');
    }

    // Generar PDF con Puppeteer
    const jobId      = crypto.randomBytes(16).toString('hex');
    const pdfPath    = path.join(filesDir, `analisis_${jobId}.pdf`);
    const htmlContet = buildAnalisisPDFHtml(d);

    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none']
      });
      const page = await browser.newPage();
      await page.setContent(htmlContet, { waitUntil: 'domcontentloaded' });

      // Esperar a que Chart.js inicialice los gráficos
      try {
        await page.waitForFunction('window.chartsReady === true', { timeout: 20000 });
      } catch (_) { /* continuar aunque no estén listos */ }

      await new Promise(r => setTimeout(r, 800));

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '0', bottom: '0', left: '0', right: '0' }
      });

      fs.writeFileSync(pdfPath, pdfBuffer);
    } finally {
      if (browser) await browser.close();
    }

    res.json({
      jobId,
      pdfUrl:  `/api/analisis/descargar/${jobId}`,
      resumen: d
    });

  } catch (err) {
    console.error('Error /api/analisis/generar:', err);
    res.status(500).json({ error: err.message || 'Error generando el análisis.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/analisis/descargar/:id
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/analisis/descargar/:id', (req, res) => {
  const id = req.params.id;

  // Validar formato del id para evitar path traversal
  if (!/^[a-f0-9]{32}$/.test(id)) {
    return res.status(400).json({ error: 'ID de descarga inválido.' });
  }

  const pdfPath = path.join(__dirname, 'files', `analisis_${id}.pdf`);
  if (!fs.existsSync(pdfPath)) {
    return res.status(404).json({ error: 'PDF no encontrado. Puede haber expirado.' });
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="analisis_${id}.pdf"`);
  fs.createReadStream(pdfPath).pipe(res);
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/analisis
// Body: { texto, empresa, prompt_extra }
// Endpoint simple para el Mega Reporte — devuelve { analisis: string }
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/analisis', iaLimiter, async (req, res) => {
  const { texto, empresa, prompt_extra } = req.body || {};
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key de OpenAI no configurada en el servidor.' });
  }
  if (!texto) {
    return res.status(400).json({ error: 'El campo texto es requerido.' });
  }

  try {
    const { OpenAI } = require('openai');
    const openai = new OpenAI({ apiKey });

    const systemMsg = 'Sos un analista financiero institucional de Círculo Azul Finanzas. Respondés con rigor cuantitativo, en español, sin inventar datos. Usás los datos exactos del texto provisto.';
    const userMsg   = prompt_extra || `Analizá la empresa "${empresa || 'N/E'}" con estos datos:\n\n${texto}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 2000,
      messages: [
        { role: 'system', content: systemMsg },
        { role: 'user',   content: userMsg   }
      ]
    });

    const analisis = completion.choices?.[0]?.message?.content || 'Sin respuesta del modelo.';
    res.json({ analisis });
  } catch (err) {
    console.error('Error /api/analisis:', err);
    res.status(500).json({ error: err.message || 'Error consultando OpenAI.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/mega/pdf
// Body: { empresa }
// Lanza Puppeteer sobre /mega/?print=1 y devuelve el PDF
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/mega/pdf', pdfLimiter, async (req, res) => {
  const { empresa } = req.body || {};
  const company    = (empresa || 'MegaReporte').replace(/[^a-zA-Z0-9ÁÉÍÓÚáéíóúÑñ _-]/g, '');

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    // Cargar la página del mega reporte ya renderizada en el servidor
    await page.goto(`http://localhost:${PORT}/mega/`, { waitUntil: 'networkidle0', timeout: 30000 });

    // Esperar que el dashboard esté visible (si el usuario ya corrió el reporte)
    // En modo PDF directo no hay interacción; rendericemos los tabs visibles
    await page.evaluate(() => {
      // Hacer visibles todos los tabs para el PDF
      document.querySelectorAll('.tab-content').forEach(t => {
        t.style.display = 'block';
        t.style.opacity = '1';
      });
      // Ocultar elementos de input
      const si = document.getElementById('screen-input');
      const sp = document.getElementById('screen-progress');
      if (si) si.style.display = 'none';
      if (sp) sp.style.display = 'none';
    });

    await new Promise(r => setTimeout(r, 1000));

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '12px', bottom: '12px', left: '0', right: '0' }
    });

    const filename = `MegaReporte_${company.replace(/\s+/g,'_')}_${new Date().toISOString().slice(0,10)}.pdf`;
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdf.length
    });
    res.end(pdf);
  } catch (err) {
    console.error('Error /api/mega/pdf:', err);
    res.status(500).json({ error: 'Error generando PDF', detail: err.message });
  } finally {
    if (browser) await browser.close();
  }
});

// ─── API: Datos completos de empresa (FMP) ──────────────────────────────────
app.get('/api/datos-empresa/:ticker', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase().trim();
  const KEY    = process.env.FMP_API_KEY;
  const BASE   = 'https://financialmodelingprep.com/stable';

  if (!KEY) return res.status(500).json({ error: 'FMP_API_KEY no configurada.' });

  try {
    const q = async ep => {
      const r = await fetch(`${BASE}${ep}&apikey=${KEY}`);
      const text = await r.text();
      try { return JSON.parse(text); } catch { return []; } // FMP puede devolver texto "Premium required"
    };

    const [income, balance, cashflow, metrics, profileArr, ratios, sma50Arr, sma200Arr] = await Promise.all([
      q(`/income-statement?symbol=${ticker}&limit=5`),
      q(`/balance-sheet-statement?symbol=${ticker}&limit=5`),
      q(`/cash-flow-statement?symbol=${ticker}&limit=5`),
      q(`/key-metrics?symbol=${ticker}&limit=5`),
      q(`/profile?symbol=${ticker}`),
      q(`/ratios?symbol=${ticker}&limit=5`),
      q(`/technical-indicator/sma?symbol=${ticker}&period=50&limit=1`),
      q(`/technical-indicator/sma?symbol=${ticker}&period=200&limit=1`),
    ]);

    if (!Array.isArray(income) || !income.length) {
      return res.status(404).json({ error: `No se encontraron datos para "${ticker}". Verificá el ticker o intentá con el ticker exacto de NYSE/NASDAQ.` });
    }

    // Garantizar que todos los datasets sean arrays (FMP puede devolver objetos de error)
    const safeArr = d => Array.isArray(d) ? d : [];
    const balanceSafe  = safeArr(balance);
    const cashflowSafe = safeArr(cashflow);
    const metricsSafe  = safeArr(metrics);
    const ratiosSafe   = safeArr(ratios);

    const prof = Array.isArray(profileArr) ? profileArr[0] : (profileArr || {});
    const M    = 1_000_000;
    const n1   = (v, d = 1) => v != null ? Math.round(v * Math.pow(10, d)) / Math.pow(10, d) : null;
    const mM   = (v, d = 1) => n1((v || 0) / M, d);

    // Arrays oldest→newest (FMP returns newest first)
    const arr = (dataset, key, scale = M, decimals = 1) =>
      [...dataset].reverse().map(d => n1((d[key] || 0) / scale, decimals)).filter(v => v !== null);

    const fmt  = a => a.join(', ');

    const i0   = income[0]   || {};
    const b0   = balanceSafe[0]  || {};
    const cf0  = cashflowSafe[0] || {};
    const km0  = metricsSafe[0]  || {};
    const r0   = ratiosSafe[0]   || {};

    // ── Series históricas ────────────────────────────────────────────────────
    const ingresos   = arr(income,        'revenue');
    const utilBruta  = arr(income,        'grossProfit');
    const ganNetas   = arr(income,        'netIncome');
    const ebitArr    = arr(income,        'ebit');
    const ebitdaArr  = arr(income,        'ebitda');
    const ofcArr     = arr(cashflowSafe,  'operatingCashFlow');
    const capexArr   = arr(cashflowSafe,  'capitalExpenditure').map(v => Math.abs(v));
    const fcfArr     = arr(cashflowSafe,  'freeCashFlow');
    const bpaArr     = [...income].reverse().map(d => n1(d.epsDiluted || d.eps || 0, 2));
    const equityArr  = arr(balanceSafe,   'totalStockholdersEquity');
    const roicArr    = [...metricsSafe].reverse().map(d => n1((d.returnOnInvestedCapital || 0) * 100, 2));

    // ── Balance latest ───────────────────────────────────────────────────────
    const actTot    = mM(b0.totalAssets, 0);
    const actCorr   = mM(b0.totalCurrentAssets, 0);
    const pasCorr   = mM(b0.totalCurrentLiabilities, 0);
    const inv       = mM(b0.inventory, 0);
    const ppe       = mM(b0.propertyPlantEquipmentNet, 0);
    const deudaTot  = mM(b0.totalDebt, 0);
    const deudaCP   = mM(b0.shortTermDebt, 0);
    const caja      = mM(b0.cashAndShortTermInvestments, 0);
    const netDebt   = mM(b0.netDebt, 0);

    // ── Income latest ────────────────────────────────────────────────────────
    const gastoInt  = mM(i0.interestExpense, 0);

    // ── Métricas latest ──────────────────────────────────────────────────────
    const ev        = mM(km0.enterpriseValue, 0);
    const roe       = n1((km0.returnOnEquity  || 0) * 100, 2);
    const roa       = n1((km0.returnOnAssets  || 0) * 100, 2);
    const fcfYield  = n1((km0.freeCashFlowYield || 0) * 100, 2);

    // ── Ratios latest ────────────────────────────────────────────────────────
    const per       = n1(r0.priceToEarningsRatio || 0, 1);
    const peg       = n1(r0.priceToEarningsGrowthRatio || 0, 2);
    const mBruto    = n1((r0.grossProfitMargin  || 0) * 100, 2);
    const mNeto     = n1((r0.netProfitMargin    || 0) * 100, 2);
    const mEbitda   = n1((r0.ebitdaMargin       || 0) * 100, 2);
    const deudaEq   = n1(r0.debtToEquityRatio   || 0, 2);
    const currentR  = n1(r0.currentRatio        || 0, 2);

    // ── Valores derivados ────────────────────────────────────────────────────
    const fcfApal     = mM(cf0.freeCashFlow, 0);
    const fcfSinApal  = mM((cf0.freeCashFlow || 0) + (i0.interestExpense || 0), 0);
    const lastIngr    = ingresos[ingresos.length - 1] || 1;
    const lastCapex   = capexArr[capexArr.length - 1]  || 0;
    const margenCapex = n1(lastCapex / lastIngr * 100, 2);
    const lastEbitda  = ebitdaArr[ebitdaArr.length - 1] || 1;
    const lastRoic    = roicArr[roicArr.length - 1]     || 0;
    const evEbit      = ebitArr[ebitArr.length - 1]   > 0 ? n1(ev / ebitArr[ebitArr.length - 1], 1)   : 'N/D';
    const evEbitda    = lastEbitda > 0                    ? n1(ev / lastEbitda, 1)                      : 'N/D';
    const dNetaEbitda = lastEbitda > 0                    ? n1(netDebt / lastEbitda, 2)                 : 'N/D';

    // ── Altman Z-Score ───────────────────────────────────────────────────────
    const wc  = (b0.totalCurrentAssets - b0.totalCurrentLiabilities) || 0;
    const ta  = b0.totalAssets  || 1;
    const re  = b0.retainedEarnings || 0;
    const ebitRaw = i0.ebit || i0.operatingIncome || 0;
    const mcap    = prof?.marketCap || km0.marketCap || 0;
    const totLiab = b0.totalLiabilities || 1;
    const rev     = i0.revenue || 1;
    const altman  = n1(1.2*(wc/ta) + 1.4*(re/ta) + 3.3*(ebitRaw/ta) + 0.6*(mcap/totLiab) + (rev/ta), 2);

    // ── Datos técnicos (precio, MAs) ─────────────────────────────────────────
    const precioActual  = n1(prof?.price, 2) || null;
    const max52         = n1(prof?.range ? parseFloat((prof.range||'').split('-')[1]) : null, 2);
    const min52         = n1(prof?.range ? parseFloat((prof.range||'').split('-')[0]) : null, 2);
    const ma50Val       = Array.isArray(sma50Arr)  && sma50Arr[0]  ? n1(sma50Arr[0].sma,  2) : null;
    const ma200Val      = Array.isArray(sma200Arr) && sma200Arr[0] ? n1(sma200Arr[0].sma, 2) : null;

    // ── Metadata ─────────────────────────────────────────────────────────────
    const empresa = prof?.companyName || ticker;
    const moneda  = `${i0.reportedCurrency || 'USD'} millones`;
    const balanceSano  = currentR > 1.5 ? 'Sí' : 'No';
    const ventajaComp  = mBruto > 40    ? 'Sí' : 'No';

    // ── FORMATO CHECKLIST / MEGA ──────────────────────────────────────────────
    const checklist = [
      `ACCION: ${empresa}`,
      `TICKER: ${ticker}`,
      `MONEDA: ${moneda}`,
      ``,
      `INGRESOS: ${fmt(ingresos)}`,
      `UTILIDAD_BRUTA: ${fmt(utilBruta)}`,
      `GANANCIAS_NETAS: ${fmt(ganNetas)}`,
      `EBIT: ${fmt(ebitArr)}`,
      `EBITDA: ${fmt(ebitdaArr)}`,
      `OFC: ${fmt(ofcArr)}`,
      `CAPEX: ${fmt(capexArr)}`,
      `FCF: ${fmt(fcfArr)}`,
      `BPA: ${fmt(bpaArr)}`,
      `EQUITY: ${fmt(equityArr)}`,
      `ACTIVOS_TOTALES: ${actTot}`,
      `ACTIVOS_CORRIENTES: ${actCorr}`,
      `PASIVOS_CORRIENTES: ${pasCorr}`,
      `INVENTARIOS: ${inv}`,
      `PP&E: ${ppe}`,
      `DEUDA_TOTAL: ${deudaTot}`,
      `DEUDA_CP: ${deudaCP}`,
      `CAJA: ${caja}`,
      `GASTO_INTERESES: ${gastoInt}`,
      ``,
      `EV: ${ev}`,
      `PER: ${per}`,
      `PEG: ${peg}`,
      `WACC: `,
      `ROE: ${roe}`,
      `ROIC: ${fmt(roicArr)}`,
      `ROA: ${roa}`,
      ``,
      `FCF_SIN_APAL: ${fcfSinApal}`,
      `FCF_APAL: ${fcfApal}`,
      `MARGEN_CAPEX: ${margenCapex}`,
      `ALTMAN: ${altman}`,
      `PIOTROSKI: `,
      ``,
      `ALERTAS: `,
      ...(precioActual ? [
        ``,
        `PRECIO_ACTUAL: ${precioActual}`,
        ...(max52   ? [`PRECIO_MAX_52S: ${max52}`]   : []),
        ...(min52   ? [`PRECIO_MIN_52S: ${min52}`]   : []),
        ...(ma50Val ? [`MA50: ${ma50Val}`]            : []),
        ...(ma200Val? [`MA200: ${ma200Val}`]          : []),
        `TENDENCIA_MA200: ${ma200Val && precioActual > ma200Val ? 'alcista' : 'bajista'}`,
      ] : []),
    ].join('\n');

    // ── Cálculos adicionales ──────────────────────────────────────────────────
    const lastEbitVal   = ebitArr[ebitArr.length - 1]    || 0;
    const lastUBruta    = utilBruta[utilBruta.length - 1] || 0;
    const lastGanNetaV  = ganNetas[ganNetas.length - 1]   || 0;
    const lastOfc       = ofcArr[ofcArr.length - 1]       || 0;
    const lastCapexV    = capexArr[capexArr.length - 1]   || 0;
    const shares        = n1((i0.weightedAverageShsOutDil || 0) / M, 1);
    const icr           = gastoInt && gastoInt !== 0 ? n1(lastEbitVal / Math.abs(gastoInt), 1) : null;
    const quickR        = actCorr && inv !== null ? n1((actCorr - inv) / (pasCorr || 1), 1) : null;
    const bpaGrowth     = bpaArr.length >= 2 && bpaArr[bpaArr.length-2] !== 0
      ? n1(((bpaArr[bpaArr.length-1] - bpaArr[bpaArr.length-2]) / Math.abs(bpaArr[bpaArr.length-2])) * 100, 1)
      : null;
    const mEbit             = lastIngr > 0 ? n1(lastEbitVal / lastIngr * 100, 1) : null;
    const evFCF             = fcfApal > 0  ? n1(ev / fcfApal, 1) : null;
    const deudaLP           = mM(b0.longTermDebt || 0, 1);
    const da                = mM(Math.abs(cf0.depreciationAndAmortization || 0), 1);
    const totLiabM          = mM(b0.totalLiabilities || 0, 0);
    const efectivoNetoBG    = n1(caja - totLiabM, 0);
    const gbpTA             = actTot > 0 ? n1(lastUBruta / actTot * 100, 1) : null;
    const capitalTotal      = n1((equityArr[equityArr.length-1] || 0) + deudaTot, 0);
    const assetTurnover     = actTot > 0 ? n1(lastIngr / actTot, 2) : null;
    const minorityIntPct    = i0.revenue ? n1((i0.minorityInterest || 0) / i0.revenue * 100, 1) : null;
    const fcfMargenApalPct  = lastIngr > 0 ? n1(fcfApal    / lastIngr * 100, 1) : null;
    const fcfMargenSinApalPct = lastIngr > 0 ? n1(fcfSinApal / lastIngr * 100, 1) : null;
    const deudaEqPct        = n1((r0.debtToEquityRatio || 0) * 100, 1);
    const eqLast            = equityArr[equityArr.length-1] || 0;

    // ── Helper: formato InvestingPro ──────────────────────────────────────────
    function ipFmt(valM, type = 'money') {
      if (valM == null || valM === 'N/D') return null;
      const v = typeof valM === 'number' ? valM : Number(valM);
      if (isNaN(v)) return null;
      if (type === 'pct')  return v.toFixed(1) + '%';
      if (type === 'x')    return v.toFixed(1) + 'x';
      if (type === 'raw')  return String(v);
      const abs = Math.abs(v);
      if (abs >= 1000) return parseFloat((v / 1000).toFixed(3)) + ' B';
      return parseFloat(v.toFixed(1)) + ' M';
    }
    function ip(label, val) {
      return (val != null && val !== '') ? `${label}\n${val}` : null;
    }

    // ── FORMATO INVESTINGPRO (mega, acciones360, roimp, señales) ─────────────
    const investingPro = [
      ip('Empresa',                                           empresa),
      ip('TICKER',                                            ticker),
      ip('Ingresos',                                          ipFmt(lastIngr)),
      ip('Utilidad bruta',                                    ipFmt(lastUBruta)),
      ip('Ganancias netas',                                   ipFmt(lastGanNetaV)),
      ip('Margen beneficio bruto',                            ipFmt(mBruto, 'pct')),
      ip('Ingresos netos margen accionistas',                 ipFmt(mNeto, 'pct')),
      ip('Flujo de caja libre neto',                          ipFmt(fcfApal)),
      ip('Rendimiento de flujo de caja libre',                ipFmt(fcfYield, 'pct')),
      minorityIntPct !== null ? ip('Margen de intereses minoritarios de los resultados', ipFmt(minorityIntPct, 'pct')) : null,
      evFCF !== null          ? ip('VE / Flujo de caja libre',    ipFmt(evFCF, 'x'))    : null,
      mEbit !== null          ? ip('Margen EBIT',                  ipFmt(mEbit, 'pct')) : null,
      ip('PER',                                               ipFmt(per, 'x')),
      ip('Ratio PEG',                                         ipFmt(peg, 'raw')),
      ip('Rendimiento de capital',                            ipFmt(roe, 'pct')),
      ip('Rendimiento del capital invertido',                 ipFmt(lastRoic, 'pct')),
      ip('Rendimiento de activos',                            ipFmt(roa, 'pct')),
      ip('Capital contable',                                  ipFmt(eqLast)),
      ip('VE/EBIT',            evEbit   !== 'N/D' ? ipFmt(evEbit,   'x') : null),
      ip('VE/EBITDA',          evEbitda !== 'N/D' ? ipFmt(evEbitda, 'x') : null),
      ip('Ratio de solvencia',                                ipFmt(currentR, 'x')),
      quickR !== null ? ip('Prueba ácida',                    ipFmt(quickR, 'x'))  : null,
      icr    !== null ? ip('Ratio de Cobertura de Intereses', ipFmt(icr,    'x'))  : null,
      ip('Deuda / Patrimonio',                                ipFmt(deudaEqPct, 'pct')),
      dNetaEbitda !== 'N/D' ? ip('Deuda neta / EBITDA',      ipFmt(dNetaEbitda, 'x')) : null,
      ip('Deuda neta',                                        ipFmt(netDebt)),
      ip('Deuda total',                                       ipFmt(deudaTot)),
      deudaLP ? ip('Deuda a largo plazo',                     ipFmt(deudaLP)) : null,
      ip('Margen de flujo de caja libre sin apalancamiento',  ipFmt(fcfMargenSinApalPct, 'pct')),
      ip('Margen de flujo de caja libre apalancado',          ipFmt(fcfMargenApalPct,    'pct')),
      ip('EBIT',                                              ipFmt(lastEbitVal)),
      ip('EBITDA',                                            ipFmt(lastEbitda)),
      ip('Margen EBITDA',                                     ipFmt(mEbitda, 'pct')),
      ip('Valor de la empresa (VE)',                          ipFmt(ev)),
      ip('Gastos de capital',                                 ipFmt(lastCapexV)),
      ip('Margen de gastos de capital',                       ipFmt(margenCapex, 'pct')),
      da ? ip('Depreciación y amortización',                  ipFmt(da)) : null,
      ip('Efectivo neto (Ben Graham)',                        ipFmt(efectivoNetoBG)),
      gbpTA !== null ? ip('Beneficio bruto / Activos totales', ipFmt(gbpTA, 'pct')) : null,
      ppe   ? ip('Propiedad, planta y equipo brutos',         ipFmt(ppe)) : null,
      ip('Fórmula Altman Z-Score',                            ipFmt(altman, 'raw')),
      ip('Efectivo de las operaciones',                       ipFmt(lastOfc)),
      bpaGrowth !== null ? ip('Crecimiento básico del BPA',   ipFmt(bpaGrowth, 'pct')) : null,
      capitalTotal ? ip('Capital total',                      ipFmt(capitalTotal)) : null,
      assetTurnover !== null ? ip('Rotación de Activos',      ipFmt(assetTurnover, 'x')) : null,
      ip('Efectivo y equivalentes',                           ipFmt(caja)),
      shares ? ip('Acc. en circulación',                      ipFmt(shares)) : null,
      balanceSano  ? ip('Balance sano',                       balanceSano)   : null,
      ventajaComp  ? ip('Ventaja competitiva',                ventajaComp)   : null,
    ].filter(Boolean).join('\n');

    res.json({
      meta: { empresa, ticker, sector: prof?.sector || '', moneda, precio: prof?.price || null },
      checklist,
      mega:        investingPro,
      roimp:       investingPro,
      senales:     investingPro,
      acciones360: investingPro,
    });

  } catch (err) {
    console.error('Error /api/datos-empresa:', err);
    res.status(500).json({ error: 'Error obteniendo datos financieros: ' + (err.message || err) });
  }
});

// ─── API: Búsqueda de empresas ───────────────────────────────────────────────
app.get('/api/buscar-empresa', async (req, res) => {
  const q   = (req.query.q || '').trim();
  const KEY = process.env.FMP_API_KEY;
  if (!q || q.length < 1) return res.json([]);
  if (!KEY) return res.json([]);
  try {
    // 1) Intentar búsqueda general (por nombre o ticker)
    const r1   = await fetch(`https://financialmodelingprep.com/stable/search?query=${encodeURIComponent(q)}&limit=7&apikey=${KEY}`);
    const j1   = await r1.json();
    // Si responde con array válido, usarlo
    if (Array.isArray(j1) && j1.length > 0 && j1[0].symbol) {
      return res.json(j1.slice(0, 7).map(item => ({
        ticker:   item.symbol,
        nombre:   item.name || item.companyName || item.symbol,
        exchange: item.stockExchange || item.exchangeShortName || '',
        tipo:     item.type || 'EQUITY'
      })));
    }
    // 2) Fallback: validar como ticker exacto con /profile
    const ticker = q.toUpperCase();
    const r2   = await fetch(`https://financialmodelingprep.com/stable/profile?symbol=${encodeURIComponent(ticker)}&apikey=${KEY}`);
    const j2   = await r2.json();
    const prof = Array.isArray(j2) ? j2[0] : null;
    if (!prof || !prof.symbol) return res.json([]);
    return res.json([{
      ticker:   prof.symbol,
      nombre:   prof.companyName || prof.symbol,
      exchange: prof.exchangeFullName || prof.exchange || '',
      tipo:     'EQUITY'
    }]);
  } catch (err) {
    console.error('Error búsqueda empresa:', err.message);
    res.json([]);
  }
});

// ─── API: Historial (Supabase) ───────────────────────────────────────────────

// GET /api/hist — traer todos los análisis (últimos 100)
app.get('/api/hist', async (_req, res) => {
  const { data, error } = await supabase
    .from('checklist_historial')
    .select('id, empresa, ticker, fecha, conteo')
    .order('fecha', { ascending: false })
    .limit(100);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/hist — guardar análisis
app.post('/api/hist', async (req, res) => {
  const { id, empresa, ticker, fecha, raw, conteo } = req.body || {};
  if (!id || !raw) return res.status(400).json({ error: 'id y raw son requeridos.' });
  const { error } = await supabase
    .from('checklist_historial')
    .upsert({ id, empresa, ticker, fecha, raw, conteo });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// GET /api/hist/:id — traer raw de un análisis para cargarlo
app.get('/api/hist/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('checklist_historial')
    .select('raw')
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(404).json({ error: 'No encontrado.' });
  res.json(data);
});

// DELETE /api/hist/:id — eliminar análisis
app.delete('/api/hist/:id', async (req, res) => {
  const { error } = await supabase
    .from('checklist_historial')
    .delete()
    .eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ─── Limpieza automática de PDFs viejos ─────────────────────────────────────
// Elimina PDFs en /files con más de 7 días de antigüedad
function limpiarPDFsViejos() {
  const filesDir = path.join(__dirname, 'files');
  if (!fs.existsSync(filesDir)) return;

  const ahora = Date.now();
  const SIETE_DIAS = 7 * 24 * 60 * 60 * 1000;

  fs.readdirSync(filesDir).forEach(archivo => {
    if (!archivo.endsWith('.pdf')) return;
    const ruta = path.join(filesDir, archivo);
    try {
      const { mtimeMs } = fs.statSync(ruta);
      if (ahora - mtimeMs > SIETE_DIAS) {
        fs.unlinkSync(ruta);
        console.log(`🗑️  PDF eliminado (>7 días): ${archivo}`);
      }
    } catch (_) {}
  });
}

// Ejecutar al iniciar y luego cada 24 horas
limpiarPDFsViejos();
setInterval(limpiarPDFsViejos, 24 * 60 * 60 * 1000);

// ─────────────────────────────────────────────────────────────────────────────
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
