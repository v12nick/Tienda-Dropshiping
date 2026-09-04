// CleanPro360 — scripts propios (mt-*). Vanilla JS, sin librerias externas.
(function () {
  if (window.__mtScriptsInit) return;
  window.__mtScriptsInit = true;

  function boot() {
    initReveal();
    initEscenaSticky();
    initComparador();
    initMarquesina();
    initFaq();
    initCountUp();
    initVariantes();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  function initReveal() {
    var els = document.querySelectorAll('.mt-reveal');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('mt-visible'); });
      return;
    }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('mt-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el, i) {
      el.style.setProperty('--mt-i', i % 6);
      obs.observe(el);
    });
  }

  function initEscenaSticky() {
    var escenas = document.querySelectorAll('[data-mt-escena]');
    escenas.forEach(function (escena) {
      var items = escena.querySelectorAll('.mt-escena-item');
      var imgs = escena.querySelectorAll('.mt-escena-visual img');
      if (!items.length || !imgs.length) return;
      if (!('IntersectionObserver' in window)) return;
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var idx = Array.prototype.indexOf.call(items, entry.target);
            items.forEach(function (it) { it.classList.remove('mt-activa'); });
            imgs.forEach(function (im) { im.classList.remove('mt-activa'); });
            entry.target.classList.add('mt-activa');
            if (imgs[idx]) imgs[idx].classList.add('mt-activa');
          }
        });
      }, { threshold: 0.6, rootMargin: '-15% 0px -15% 0px' });
      items.forEach(function (it) { obs.observe(it); });
      if (items[0]) items[0].classList.add('mt-activa');
      if (imgs[0]) imgs[0].classList.add('mt-activa');
    });
  }

  function initComparador() {
    var comparadores = document.querySelectorAll('[data-mt-comparador]');
    comparadores.forEach(function (comp) {
      var antes = comp.querySelector('.mt-comparador-antes');
      var linea = comp.querySelector('.mt-comparador-linea');
      var asa = comp.querySelector('.mt-comparador-asa');
      if (!antes || !linea || !asa) return;
      var arrastrando = false;

      function mover(clientX) {
        var rect = comp.getBoundingClientRect();
        var pct = ((clientX - rect.left) / rect.width) * 100;
        pct = Math.max(0, Math.min(100, pct));
        antes.style.clipPath = 'inset(0 ' + (100 - pct) + '% 0 0)';
        linea.style.left = pct + '%';
        asa.style.left = pct + '%';
      }

      asa.addEventListener('pointerdown', function (e) {
        arrastrando = true;
        asa.setPointerCapture(e.pointerId);
      });
      window.addEventListener('pointerup', function () { arrastrando = false; });
      comp.addEventListener('pointermove', function (e) {
        if (!arrastrando) return;
        mover(e.clientX);
      });
      comp.addEventListener('pointerdown', function (e) {
        arrastrando = true;
        mover(e.clientX);
      });
    });
  }

  function initMarquesina() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var tracks = document.querySelectorAll('[data-mt-marquesina]');
    tracks.forEach(function (track) {
      if (track.dataset.mtDuplicado) return;
      track.innerHTML += track.innerHTML;
      track.dataset.mtDuplicado = 'true';
    });
  }

  function initFaq() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('.mt-faq-pregunta');
      if (!btn) return;
      var item = btn.closest('.mt-faq-item');
      if (!item) return;
      var resp = item.querySelector('.mt-faq-respuesta');
      var wrap = item.parentElement;
      var abierta = item.classList.contains('mt-abierta');
      wrap.querySelectorAll('.mt-faq-item').forEach(function (it) {
        it.classList.remove('mt-abierta');
        var r = it.querySelector('.mt-faq-respuesta');
        if (r) r.style.maxHeight = null;
      });
      if (!abierta && resp) {
        item.classList.add('mt-abierta');
        resp.style.maxHeight = resp.scrollHeight + 'px';
      }
    });
  }

  function initCountUp() {
    var els = document.querySelectorAll('.mt-countup');
    if (!els.length || !('IntersectionObserver' in window)) return;
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var final = parseFloat(el.dataset.final || el.textContent);
        var duracion = 1400;
        var inicio = null;
        function paso(ts) {
          if (!inicio) inicio = ts;
          var progreso = Math.min(1, (ts - inicio) / duracion);
          var valor = final * (1 - Math.pow(1 - progreso, 3));
          el.textContent = (el.dataset.decimales ? valor.toFixed(1) : Math.round(valor)) + (el.dataset.sufijo || '');
          if (progreso < 1) requestAnimationFrame(paso);
        }
        requestAnimationFrame(paso);
        obs.unobserve(el);
      });
    }, { threshold: 0.5 });
    els.forEach(function (el) { obs.observe(el); });
  }

  function initVariantes() {
    var forms = document.querySelectorAll('[data-mt-producto-form]');
    forms.forEach(function (form) {
      var dataEl = form.querySelector('[data-mt-variantes-json]');
      if (!dataEl) return;
      var variantes;
      try { variantes = JSON.parse(dataEl.textContent); } catch (e) { return; }
      var selects = form.querySelectorAll('[data-mt-opcion]');
      var inputId = form.querySelector('[data-mt-variant-id]');
      var precioEl = form.querySelector('[data-mt-precio-actual]');
      var precioAntesEl = form.querySelector('[data-mt-precio-antes]');
      var btn = form.querySelector('[data-mt-add]');

      function actualizar() {
        var seleccion = Array.prototype.map.call(selects, function (s) { return s.value; });
        var match = variantes.find(function (v) {
          return v.options.every(function (op, i) { return op === seleccion[i]; });
        });
        if (!match) return;
        if (inputId) inputId.value = match.id;
        if (precioEl) precioEl.textContent = formatearDinero(match.price);
        if (precioAntesEl) {
          if (match.compare_at_price && match.compare_at_price > match.price) {
            precioAntesEl.textContent = formatearDinero(match.compare_at_price);
            precioAntesEl.style.display = '';
          } else {
            precioAntesEl.style.display = 'none';
          }
        }
        if (btn) {
          btn.disabled = !match.available;
          btn.textContent = match.available ? btn.dataset.textoDisponible : btn.dataset.textoAgotado;
        }
      }
      function formatearDinero(centavos) {
        return (window.Shopify && window.Shopify.formatMoney)
          ? window.Shopify.formatMoney(centavos, window.theme_money_format || '${{amount}}')
          : '$' + (centavos / 100).toFixed(2);
      }
      selects.forEach(function (s) { s.addEventListener('change', actualizar); });
    });
  }
})();
