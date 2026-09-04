// CleanPro360 — scripts propios (mt-*). Vanilla JS, sin librerias externas.
document.addEventListener('DOMContentLoaded', function () {
  initReveal();
  initEscenaSticky();
  initComparador();
  initMarquesina();
  initFaq();
  initContador();
  initCountUp();
  initVariantes();
});

// Reveal al hacer scroll (una sola observer compartida)
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

// Escena sticky (galeria de angulos con texto que va cambiando la imagen activa)
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

// Comparador antes/despues con arrastre de raton y tactil
function initComparador() {
  var comparadores = document.querySelectorAll('[data-mt-comparador]');
  comparadores.forEach(function (comp) {
    var despues = comp.querySelector('.mt-comparador-despues');
    var linea = comp.querySelector('.mt-comparador-linea');
    var asa = comp.querySelector('.mt-comparador-asa');
    if (!despues || !linea || !asa) return;
    var arrastrando = false;

    function mover(clientX) {
      var rect = comp.getBoundingClientRect();
      var pct = ((clientX - rect.left) / rect.width) * 100;
      pct = Math.max(0, Math.min(100, pct));
      despues.style.width = pct + '%';
      linea.style.left = pct + '%';
      asa.style.left = pct + '%';
    }

    asa.addEventListener('pointerdown', function (e) { arrastrando = true; asa.setPointerCapture(e.pointerId); });
    window.addEventListener('pointerup', function () { arrastrando = false; });
    comp.addEventListener('pointermove', function (e) {
      if (!arrastrando) return;
      mover(e.clientX);
    });
    comp.addEventListener('pointerdown', function (e) {
      arrastrando = true;
      mover(e.clientX);
    });
    window.addEventListener('pointerup', function () { arrastrando = false; }, { passive: true });
  });
}

// Marquesina infinita (duplica el contenido para bucle continuo)
function initMarquesina() {
  var tracks = document.querySelectorAll('[data-mt-marquesina]');
  tracks.forEach(function (track) {
    if (track.dataset.mtDuplicado) return;
    track.innerHTML += track.innerHTML;
    track.dataset.mtDuplicado = 'true';
  });
}

// Acordeon FAQ
function initFaq() {
  var items = document.querySelectorAll('.mt-faq-item');
  items.forEach(function (item) {
    var btn = item.querySelector('.mt-faq-pregunta');
    var resp = item.querySelector('.mt-faq-respuesta');
    if (!btn || !resp) return;
    btn.addEventListener('click', function () {
      var abierta = item.classList.contains('mt-abierta');
      items.forEach(function (it) {
        it.classList.remove('mt-abierta');
        var r = it.querySelector('.mt-faq-respuesta');
        if (r) r.style.maxHeight = null;
      });
      if (!abierta) {
        item.classList.add('mt-abierta');
        resp.style.maxHeight = resp.scrollHeight + 'px';
      }
    });
  });
}

// Contador de urgencia (cuenta atras hasta medianoche)
function initContador() {
  var contador = document.querySelector('[data-mt-contador]');
  if (!contador) return;
  var horasEl = contador.querySelector('[data-mt-h]');
  var minEl = contador.querySelector('[data-mt-m]');
  var segEl = contador.querySelector('[data-mt-s]');

  function actualizar() {
    var ahora = new Date();
    var fin = new Date();
    fin.setHours(23, 59, 59, 999);
    var diff = Math.max(0, fin - ahora);
    var h = Math.floor(diff / 3600000);
    var m = Math.floor((diff % 3600000) / 60000);
    var s = Math.floor((diff % 60000) / 1000);
    if (horasEl) horasEl.textContent = String(h).padStart(2, '0');
    if (minEl) minEl.textContent = String(m).padStart(2, '0');
    if (segEl) segEl.textContent = String(s).padStart(2, '0');
  }
  actualizar();
  setInterval(actualizar, 1000);
}

// Cifras animadas (count-up) al entrar en pantalla
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

// Selector de variantes en la pagina de producto
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
