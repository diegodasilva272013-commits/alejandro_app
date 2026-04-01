// ── export.js — Módulo 5: Exportación PDF y Word ──────────────────────────────
const Exporter = {

  // ── Descarga PDF via html2pdf (client-side, consistente) ───────────────────
  async exportPDF(empresa) {
    const dash = document.getElementById('screen-dashboard');
    if (!dash) return;

    const btnPDF = document.querySelector('[onclick="exportPDF()"]');
    if (btnPDF) { btnPDF.disabled = true; btnPDF.textContent = '⏳ Generando...'; }

    try {
      const empresa2 = empresa || 'Acciones 360';
      const filename = empresa2.replace(/[^a-zA-Z0-9\u00C0-\u024F]/g, '_') + '_A360_CirculoAzul.pdf';

      // Temporalmente ocultar sidebar y botones para el PDF
      const sidebar = dash.querySelector('.dash-sidebar');
      const exportBtns = dash.querySelector('.nav-export-btns');
      if (sidebar) sidebar.style.display = 'none';
      if (exportBtns) exportBtns.style.display = 'none';

      await html2pdf().set({
        margin:       [8, 4, 8, 4],
        filename:     filename,
        image:        { type: 'jpeg', quality: 0.95 },
        html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#05080F', scrollY: 0 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
      }).from(dash).save();

      // Restaurar elementos ocultos
      if (sidebar) sidebar.style.display = '';
      if (exportBtns) exportBtns.style.display = '';

    } catch(err) {
      console.error('exportPDF error:', err);
      alert('Error generando PDF: ' + err.message);
    } finally {
      if (btnPDF) { btnPDF.disabled = false; btnPDF.textContent = '⬇ PDF'; }
    }
  },

  // ── Word (.docx) via docx.js CDN ─────────────────────────────────────────
  async exportWord(empresa, results, summary) {
    // If docx library is not loaded, load it dynamically
    if (typeof docx === 'undefined') {
      await this._loadScript('https://cdn.jsdelivr.net/npm/docx@8.2.0/build/index.umd.min.js');
    }
    if (typeof docx === 'undefined' || typeof saveAs === 'undefined') {
      await this._loadScript('https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js');
    }

    const { Document, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
            BorderStyle, ShadingType, AlignmentType, Packer } = docx;

    const fecha = new Date().toLocaleDateString('es-AR', { year:'numeric', month:'long', day:'numeric' });
    const NAVY  = '0D1B3E';
    const GOLD  = 'C9A84C';
    const TEAL  = '1A6B72';

    const colorMap = { green:'27AE60', teal:'1A6B72', orange:'E67E22', red:'C0392B', gray:'4A5568' };

    // ── Children (paragraphs) ───────────────────────────────────────────────
    const children = [];

    // Cover
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'ANÁLISIS FINANCIERO 360°', color: GOLD, size: 52, bold: true, font: 'Garamond' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 }
      }),
      new Paragraph({
        children: [new TextRun({ text: empresa || 'Empresa', color: NAVY, size: 36, bold: true })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 }
      }),
      new Paragraph({
        children: [new TextRun({ text: `Fecha: ${fecha}`, color: '4A5568', size: 20 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      }),
      new Paragraph({
        children: [new TextRun({ text: '43 Indicadores Analizados · 9 Gráficas · Acciones 360', color: TEAL, size: 20, italics: true })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 }
      }),
    );

    // Fortalezas / Alertas header
    children.push(
      new Paragraph({ text: 'RESUMEN EJECUTIVO', heading: HeadingLevel.HEADING_1, spacing: { after: 200 } }),
    );

    if (summary) {
      children.push(
        new Paragraph({ children: [new TextRun({ text: `Salud Financiera: ${summary.scoreNum}%`, bold: true, size: 28, color: summary.scoreNum >= 70 ? '27AE60' : summary.scoreNum >= 45 ? 'E67E22' : 'C0392B' })], spacing: { after:160 } }),
        new Paragraph({ children: [new TextRun({ text: `✅ Excelente: ${summary.counts.green || 0}   🔵 Bueno: ${summary.counts.teal || 0}   🟠 Moderado: ${summary.counts.orange || 0}   🔴 Crítico: ${summary.counts.red || 0}   ⚫ Sin dato: ${summary.counts.gray || 0}`, size:20 })], spacing: { after: 300 } }),
      );
    }

    // All 43 indicators
    if (results) {
      children.push(new Paragraph({ text: 'INDICADORES DETALLADOS', heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } }));
      for (const r of results) {
        const cc = colorMap[r.rango?.color] || '4A5568';
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${r.num}  `, color: GOLD, bold: true, size: 22 }),
              new TextRun({ text: r.nombre, bold: true, size: 22, color: NAVY }),
            ],
            shading: { type: ShadingType.SOLID, color: NAVY, fill: NAVY },
            spacing: { before: 200, after: 0 },
          }),
          new Paragraph({
            children: [new TextRun({ text: `Fórmula: ${r.formula}`, color: TEAL, size: 18 })],
            shading: { type: ShadingType.SOLID, color: 'D6E4F0', fill: 'D6E4F0' },
            spacing: { after: 0 },
          }),
          new Paragraph({
            children: [new TextRun({ text: `Resultado: `, bold: true, size: 20 }), new TextRun({ text: r.valorFmt || '—', color: cc, bold: true, size: 20 })],
            spacing: { after: 0 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Lectura: `, bold: true, size: 18 }),
              new TextRun({ text: r.rango?.texto || '—', size: 18 }),
              new TextRun({ text: `  [${r.rango?.badge || '—'}]`, bold: true, color: cc, size: 18 }),
            ],
            shading: { type: ShadingType.SOLID, color: 'FDF5E0', fill: 'FDF5E0' },
            spacing: { after: 0 },
          }),
          new Paragraph({
            children: [new TextRun({ text: `Tendencia: ${r.tendencia || '— Solo 1 periodo disponible'}`, color: '4A5568', size: 18 })],
            shading: { type: ShadingType.SOLID, color: 'F4F6F9', fill: 'F4F6F9' },
            spacing: { after: 120 },
          }),
        );
      }
    }

    // Resumen Final
    children.push(new Paragraph({ text: 'RESUMEN FINAL', heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } }));
    if (summary) {
      if (summary.fortalezas?.length) {
        children.push(new Paragraph({ children: [new TextRun({ text: 'FORTALEZAS', bold: true, color: '27AE60', size: 24 })], spacing: { after: 80 } }));
        summary.fortalezas.forEach(r => {
          children.push(new Paragraph({ children: [new TextRun({ text: `• ${r.nombre}: ${r.valorFmt} — ${r.rango?.badge}`, size: 20, color: '155724' })], spacing: { after: 60 } }));
        });
      }
      if (summary.alertas?.length) {
        children.push(new Paragraph({ children: [new TextRun({ text: 'ALERTAS', bold: true, color: 'E67E22', size: 24 })], spacing: { before: 200, after: 80 } }));
        summary.alertas.forEach(r => {
          children.push(new Paragraph({ children: [new TextRun({ text: `• ${r.nombre}: ${r.valorFmt} — ${r.rango?.badge}`, size: 20, color: '7D4E10' })], spacing: { after: 60 } }));
        });
      }
      if (summary.conclusion) {
        children.push(
          new Paragraph({ children: [new TextRun({ text: 'CONCLUSIÓN OPERATIVA', bold: true, color: GOLD, size: 24 })], spacing: { before: 300, after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: summary.conclusion, size: 20, color: '2d3748' })], spacing: { after: 200 } }),
        );
      }
    }

    const doc = new Document({
      sections: [{
        properties: {},
        children,
      }]
    });

    const blob = await Packer.toBlob(doc);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${empresa || 'Acciones360'}_Analisis_Financiero.docx`;
    a.click();
    URL.revokeObjectURL(a.href);
  },

  _loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
      const s = document.createElement('script');
      s.src = src; s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  }
};

// Global wrappers called from HTML buttons
function exportPDF() {
  Exporter.exportPDF(window._a360Empresa || '');
}
function exportWord() {
  Exporter.exportWord(window._a360Empresa || '', window._a360Results, window._a360Summary)
    .catch(e => alert('Error generando Word: ' + e.message));
}
