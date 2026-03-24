/**
 * Círculo Azul — Widget de búsqueda de empresa reutilizable
 * Uso: EmpresaSearch.init({ wrapperId, textareaId, formato })
 * formato: 'checklist' | 'mega' | 'acciones360' | 'roimp' | 'senales' | 'tecnico'
 */
(function(global) {

  var CSS_INJECTED = false;

  function injectCSS() {
    if (CSS_INJECTED) return;
    CSS_INJECTED = true;
    var style = document.createElement('style');
    style.textContent = [
      '.ca-search-wrap{position:relative;margin-bottom:16px}',
      '.ca-search-label{font-size:10px;font-weight:500;letter-spacing:.25em;text-transform:uppercase;color:#8FA8C8;margin-bottom:8px}',
      '.ca-search-row{display:flex;gap:10px;align-items:stretch}',
      '.ca-search-box{position:relative;display:flex;align-items:center;flex:1}',
      '.ca-search-icon{position:absolute;left:13px;width:16px;height:16px;color:#6A829E;pointer-events:none;flex-shrink:0}',
      '.ca-search-input{width:100%;padding:11px 36px 11px 38px;background:rgba(13,22,39,.8);border:1px solid rgba(46,116,232,.3);border-radius:8px;color:#fff;font-family:"Inter",sans-serif;font-size:14px;outline:none;transition:border-color .2s,box-shadow .2s}',
      '.ca-search-input:focus{border-color:#2E74E8;box-shadow:0 0 0 3px rgba(46,116,232,.12)}',
      '.ca-search-input::placeholder{color:#4A6080}',
      '.ca-search-clear{position:absolute;right:12px;color:#6A829E;cursor:pointer;font-size:13px;padding:4px;transition:color .15s}',
      '.ca-search-clear:hover{color:#B8CEEA}',
      '.ca-btn-cargar{padding:11px 18px;background:linear-gradient(135deg,#1A56C4,#1A4FAA);border:none;border-radius:8px;color:#fff;font-family:"Inter",sans-serif;font-size:12px;font-weight:600;letter-spacing:.08em;cursor:pointer;white-space:nowrap;transition:all .2s;box-shadow:0 2px 12px rgba(26,86,196,.3)}',
      '.ca-btn-cargar:hover{background:linear-gradient(135deg,#2E74E8,#1A56C4);box-shadow:0 4px 20px rgba(46,116,232,.4)}',
      '.ca-btn-cargar:disabled{opacity:.5;cursor:not-allowed}',
      '.ca-dropdown{position:absolute;top:calc(100% + 6px);left:0;right:0;background:#0D1627;border:1px solid rgba(46,116,232,.35);border-radius:10px;box-shadow:0 16px 40px rgba(0,0,0,.6);z-index:500;overflow:hidden;animation:caDD .15s ease}',
      '@keyframes caDD{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}',
      '.ca-dd-item{display:flex;align-items:center;gap:12px;padding:11px 14px;cursor:pointer;transition:background .15s;border-bottom:1px solid rgba(46,116,232,.1)}',
      '.ca-dd-item:last-child{border-bottom:none}',
      '.ca-dd-item:hover,.ca-dd-item:focus{background:rgba(26,86,196,.18);outline:none}',
      '.ca-dd-ticker{font-family:"Space Mono",monospace;font-size:12px;font-weight:700;color:#5A9BFF;min-width:56px;flex-shrink:0}',
      '.ca-dd-info{display:flex;flex-direction:column;gap:2px;overflow:hidden}',
      '.ca-dd-nombre{font-size:13px;color:#D8E6F5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.ca-dd-exch{font-size:10px;color:#6A829E}',
      '.ca-dd-msg{padding:14px 16px;text-align:center;color:#6A829E;font-size:12px;display:flex;align-items:center;justify-content:center;gap:8px}',
      '.ca-spin{width:12px;height:12px;border:2px solid rgba(90,155,255,.3);border-top-color:#5A9BFF;border-radius:50%;animation:caSpin .6s linear infinite;flex-shrink:0}',
      '@keyframes caSpin{to{transform:rotate(360deg)}}',
      '.ca-status{margin-top:10px;padding:10px 14px;border-radius:8px;font-size:12px;display:none}',
      '.ca-status.ok{background:rgba(26,138,74,.12);border:1px solid rgba(26,138,74,.3);color:#4ade80}',
      '.ca-status.err{background:rgba(192,57,43,.12);border:1px solid rgba(192,57,43,.3);color:#f87171}',
      '.ca-status.loading{background:rgba(46,116,232,.08);border:1px solid rgba(46,116,232,.25);color:#93C5FD;display:flex;align-items:center;gap:8px}',
      '.ca-status.show{display:flex}',
    ].join('');
    document.head.appendChild(style);
  }

  function createWidget(cfg) {
    injectCSS();
    var wrap    = document.getElementById(cfg.wrapperId);
    if (!wrap) return;

    wrap.className = 'ca-search-wrap';
    wrap.innerHTML = [
      '<div class="ca-search-label">Cargar datos automáticamente</div>',
      '<div class="ca-search-row">',
        '<div class="ca-search-box" id="'+cfg.wrapperId+'-box">',
          '<svg class="ca-search-icon" viewBox="0 0 20 20" fill="none">',
            '<circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" stroke-width="1.6"/>',
            '<path d="M13.5 13.5L17 17" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
          '</svg>',
          '<input type="text" class="ca-search-input" id="'+cfg.wrapperId+'-input"',
            ' placeholder="Buscar empresa o ticker (ej: Apple, AAPL, Tesla, TSLA...)"',
            ' autocomplete="off" spellcheck="false">',
          '<div class="ca-search-clear" id="'+cfg.wrapperId+'-clear" style="display:none">✕</div>',
          '<div class="ca-dropdown" id="'+cfg.wrapperId+'-dd" style="display:none"></div>',
        '</div>',
        '<button class="ca-btn-cargar" id="'+cfg.wrapperId+'-btn" disabled>',
          '⬇ Cargar datos',
        '</button>',
      '</div>',
      '<div class="ca-status" id="'+cfg.wrapperId+'-status"></div>',
    ].join('');

    var input    = document.getElementById(cfg.wrapperId + '-input');
    var dropdown = document.getElementById(cfg.wrapperId + '-dd');
    var clearBtn = document.getElementById(cfg.wrapperId + '-clear');
    var loadBtn  = document.getElementById(cfg.wrapperId + '-btn');
    var status   = document.getElementById(cfg.wrapperId + '-status');
    var selectedTicker = null;
    var debounce = null;

    function showStatus(msg, type) {
      status.className = 'ca-status show ' + type;
      status.innerHTML = type === 'loading'
        ? '<div class="ca-spin"></div>' + msg
        : msg;
    }
    function hideStatus() {
      status.className = 'ca-status';
    }

    input.addEventListener('input', function() {
      var q = input.value.trim();
      clearBtn.style.display = q ? 'block' : 'none';
      selectedTicker = null;
      loadBtn.disabled = true;
      clearTimeout(debounce);
      if (q.length < 2) { dropdown.style.display = 'none'; return; }
      debounce = setTimeout(function() { buscar(q); }, 280);
    });

    input.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') { dropdown.style.display = 'none'; }
      if (e.key === 'ArrowDown') {
        var items = dropdown.querySelectorAll('.ca-dd-item');
        if (items.length) { e.preventDefault(); items[0].focus(); }
      }
    });

    clearBtn.addEventListener('click', function() {
      input.value = '';
      clearBtn.style.display = 'none';
      dropdown.style.display = 'none';
      selectedTicker = null;
      loadBtn.disabled = true;
      hideStatus();
      input.focus();
    });

    loadBtn.addEventListener('click', function() {
      if (!selectedTicker) return;
      cargarDatos(selectedTicker);
    });

    document.addEventListener('click', function(e) {
      if (!e.target.closest('#' + cfg.wrapperId + '-box')) {
        dropdown.style.display = 'none';
      }
    });

    function buscar(q) {
      dropdown.innerHTML = '<div class="ca-dd-msg"><div class="ca-spin"></div>Buscando...</div>';
      dropdown.style.display = 'block';
      fetch('/api/buscar-empresa?q=' + encodeURIComponent(q))
        .then(function(r) { return r.json(); })
        .then(function(items) {
          if (!items || !items.length) {
            dropdown.innerHTML = '<div class="ca-dd-msg">Sin resultados para "' + q + '"</div>';
            return;
          }
          dropdown.innerHTML = items.map(function(item) {
            return '<div class="ca-dd-item" tabindex="0" data-ticker="' + item.ticker + '" data-nombre="' + item.nombre + '">'
              + '<span class="ca-dd-ticker">' + item.ticker + '</span>'
              + '<div class="ca-dd-info">'
              +   '<span class="ca-dd-nombre">' + item.nombre + '</span>'
              +   '<span class="ca-dd-exch">' + item.exchange + '</span>'
              + '</div>'
              + '</div>';
          }).join('');

          dropdown.querySelectorAll('.ca-dd-item').forEach(function(el) {
            el.addEventListener('click', function() { seleccionar(el); });
            el.addEventListener('keydown', function(e) {
              if (e.key === 'Enter') seleccionar(el);
              if (e.key === 'ArrowDown' && el.nextElementSibling) el.nextElementSibling.focus();
              if (e.key === 'ArrowUp') {
                if (el.previousElementSibling) el.previousElementSibling.focus();
                else input.focus();
              }
            });
          });
        })
        .catch(function() { dropdown.style.display = 'none'; });
    }

    function seleccionar(el) {
      selectedTicker = el.getAttribute('data-ticker');
      var nombre     = el.getAttribute('data-nombre');
      input.value    = nombre + '  (' + selectedTicker + ')';
      clearBtn.style.display = 'block';
      dropdown.style.display = 'none';
      loadBtn.disabled = false;
      hideStatus();
    }

    function cargarDatos(ticker) {
      var ta = document.getElementById(cfg.textareaId);
      if (!ta) return;

      loadBtn.disabled = true;
      loadBtn.textContent = 'Cargando...';
      showStatus('Obteniendo datos reales de ' + ticker + '...', 'loading');

      fetch('/api/datos-empresa/' + encodeURIComponent(ticker))
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (data.error) {
            showStatus('⚠ ' + data.error, 'err');
            loadBtn.disabled = false;
            loadBtn.textContent = '⬇ Cargar datos';
            return;
          }

          var texto = data[cfg.formato] || data.checklist || '';
          ta.value = texto;

          // Disparar evento input para módulos que escuchan cambios
          ta.dispatchEvent(new Event('input', { bubbles: true }));

          var empresa = (data.meta && data.meta.empresa) || ticker;
          showStatus('✓ Datos de <strong>' + empresa + '</strong> cargados. Revisá WACC y completá los campos vacíos antes de analizar.', 'ok');
          loadBtn.disabled = false;
          loadBtn.textContent = '⬇ Cargar datos';
          ta.focus();
        })
        .catch(function() {
          showStatus('⚠ Error de conexión. Intentá de nuevo.', 'err');
          loadBtn.disabled = false;
          loadBtn.textContent = '⬇ Cargar datos';
        });
    }
  }

  global.EmpresaSearch = { init: createWidget };

})(window);
