// Gato Gamer Store — scripts propios (prefijo gg-)
document.addEventListener('DOMContentLoaded', function () {
  initUtmCapture();
  initReveal();
  initDrawer();
  initDrawerGroups();
  initSearchToggle();
  initLocaleSelector();
  initCarousels();
  initAddToCart();
  initWishlist();
  updateWishlistCount();
  initRecentlyViewed();
  initProductGallery();
  initProductForm();
  initColorPicker();
  initBuyForm();
  initPendingCart();
  initAiChatButton();
  initRewardsButton();
  initPriceCop();
  initQtyStepper();
  initFaqAccordion();
  initStickyCart();
  initVideoPlay();
  initCheckoutReturn();
});

var GG_UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

function ggReadUtm() {
  var data = {};
  try { data = JSON.parse(sessionStorage.getItem('gg_utm') || '{}'); } catch (e) { data = {}; }
  return data;
}

function ggUtmAttributes() {
  var data = ggReadUtm();
  var attrs = {};
  GG_UTM_KEYS.forEach(function (k) {
    if (data[k]) attrs[k] = String(data[k]).slice(0, 80);
  });
  if (data.gclid) attrs.gclid = String(data.gclid).slice(0, 100);
  if (data.fbclid) attrs.fbclid = String(data.fbclid).slice(0, 120);
  if (data.landing) attrs.utm_landing = String(data.landing).slice(0, 120);
  return Object.keys(attrs).length ? attrs : null;
}

function ggCartAddPayload(items) {
  var payload = { items: items };
  var attrs = ggUtmAttributes();
  if (attrs) payload.attributes = attrs;
  return payload;
}

function ggCartRootUrl() {
  return window.Shopify && Shopify.routes && Shopify.routes.root ? Shopify.routes.root : '/';
}

function ggNormColor(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function ggVariantColorValues(variant) {
  var vals = [];
  if (!variant) return vals;
  if (variant.options && variant.options.length) {
    for (var i = 0; i < variant.options.length; i++) vals.push(variant.options[i]);
  }
  if (variant.option1) vals.push(variant.option1);
  if (variant.option2) vals.push(variant.option2);
  if (variant.option3) vals.push(variant.option3);
  if (variant.title && variant.title !== 'Default Title') vals.push(variant.title);
  return vals;
}

function ggFindVariantForColor(product, colorName) {
  if (!product || !product.variants || !product.variants.length) return null;
  var want = ggNormColor(colorName);
  if (!want) return product.variants[0];
  var i, v, vals, n, j;
  for (i = 0; i < product.variants.length; i++) {
    v = product.variants[i];
    vals = ggVariantColorValues(v);
    for (j = 0; j < vals.length; j++) {
      n = ggNormColor(vals[j]);
      if (n && n === want) return v;
    }
  }
  for (i = 0; i < product.variants.length; i++) {
    v = product.variants[i];
    vals = ggVariantColorValues(v);
    for (j = 0; j < vals.length; j++) {
      n = ggNormColor(vals[j]);
      if (n && (n.indexOf(want) !== -1 || want.indexOf(n) !== -1)) return v;
    }
  }
  return product.variants[0];
}

function ggReadEmbeddedProduct(root) {
  var dataEl = root.querySelector('[data-gg-product-json]');
  if (!dataEl) return null;
  try {
    var product = JSON.parse(dataEl.textContent);
    if (product && product.variants && product.variants.length) return product;
  } catch (e) {}
  return null;
}

function ggWriteEmbeddedProduct(root, product) {
  var dataEl = root.querySelector('[data-gg-product-json]');
  if (dataEl) dataEl.textContent = JSON.stringify(product);
  root._ggProduct = product;
}

function ggNormalizeAjaxProduct(p) {
  if (!p) return null;
  var options = p.options || [];
  if (options.length && typeof options[0] === 'object' && options[0].name) {
    options = options.map(function (o) { return o.name; });
  }
  return {
    handle: p.handle,
    options: options,
    variants: (p.variants || []).map(function (v) {
      return {
        id: v.id,
        title: v.title,
        option1: v.option1,
        option2: v.option2,
        option3: v.option3,
        price: v.price,
        compare_at_price: v.compare_at_price,
        available: v.available,
        options: v.options || [v.option1, v.option2, v.option3].filter(Boolean),
        media_id: v.featured_image ? v.featured_image.id : null
      };
    })
  };
}

function ggEnsureProduct(root) {
  if (root._ggProductPromise) return root._ggProductPromise;
  var embedded = ggReadEmbeddedProduct(root);
  if (embedded) {
    root._ggProduct = embedded;
    return Promise.resolve(embedded);
  }
  if (root._ggProduct && root._ggProduct.variants && root._ggProduct.variants.length) {
    return Promise.resolve(root._ggProduct);
  }
  var handle = root.getAttribute('data-gg-product-handle') || root.getAttribute('data-gg-track-product') || 'gamesir-g7-se-control-xbox-hall-effect';
  root._ggProductPromise = fetch(ggCartRootUrl() + 'products/' + handle + '.js', { headers: { Accept: 'application/json' } })
    .then(function (res) { return res.ok ? res.json() : null; })
    .then(function (raw) {
      var product = ggNormalizeAjaxProduct(raw);
      if (product && product.variants.length) ggWriteEmbeddedProduct(root, product);
      return product;
    })
    .catch(function () { return null; });
  return root._ggProductPromise;
}

function ggShowBuyError(root, message) {
  var el = root.querySelector('[data-gg-buy-error]');
  if (!el) return;
  if (!message) {
    el.hidden = true;
    el.textContent = '';
    return;
  }
  el.hidden = false;
  el.textContent = message;
}

function ggSelectedColor(root) {
  var active = root.querySelector('[data-gg-color].gg-active');
  return active ? active.getAttribute('data-gg-color') : '';
}

function ggApplyColorToVariant(root, colorName) {
  var product = root._ggProduct || ggReadEmbeddedProduct(root);
  if (!product) return;
  var variant = ggFindVariantForColor(product, colorName);
  if (!variant) return;
  var idInput = root.querySelector('[data-gg-variant-id]');
  if (idInput) idInput.value = variant.id;
  var addBtn = root.querySelector('[data-gg-buy-add]');
  if (addBtn) {
    var available = variant.available !== false;
    addBtn.disabled = !available;
    addBtn.textContent = available
      ? (addBtn.getAttribute('data-label-add') || addBtn.textContent)
      : (addBtn.getAttribute('data-label-sold-out') || addBtn.textContent);
  }
}

function ggUpdateCartCount() {
  var cartIcon = document.querySelector('[data-gg-cart-count]');
  if (!cartIcon) return;
  fetch(ggCartRootUrl() + 'cart.js')
    .then(function (r) { return r.json(); })
    .then(function (cart) {
      cartIcon.textContent = cart.item_count;
      cartIcon.hidden = cart.item_count === 0;
    })
    .catch(function () {});
}

function ggBuyUnavailableMessage() {
  var lang = (document.documentElement.lang || 'es').toLowerCase();
  if (lang.indexOf('en') === 0) return 'This product is not available for online purchase yet.';
  return 'Este producto aún no está disponible para compra online.';
}

function ggBuyErrorMessage(payload) {
  if (!payload) return ggBuyUnavailableMessage();
  return payload.description || payload.message || ggBuyUnavailableMessage();
}

function ggCartPageUrl() {
  return ggCartRootUrl().replace(/\/?$/, '/') + 'cart';
}

function ggGoToCart() {
  window.location.assign(ggCartPageUrl());
}

function ggSavePendingCart(item) {
  try { sessionStorage.setItem('gg_pending_cart', JSON.stringify(item)); } catch (e) {}
}

function ggReadPendingCart() {
  try {
    var raw = sessionStorage.getItem('gg_pending_cart');
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function ggClearPendingCart() {
  try { sessionStorage.removeItem('gg_pending_cart'); } catch (e) {}
}

function ggEscapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function ggPendingItemFromRoot(root) {
  var color = ggSelectedColor(root);
  var tileImg = root.querySelector('[data-gg-color].gg-active img');
  var qtyInput = root.querySelector('[data-gg-qty-input]');
  var qty = qtyInput ? parseInt(qtyInput.value, 10) : 1;
  if (!qty || qty < 1) qty = 1;
  var titleEl = root.querySelector('.gg-buy__title');
  return {
    handle: root.getAttribute('data-gg-product-handle') || root.getAttribute('data-gg-track-product') || 'gamesir-g7-se-control-xbox-hall-effect',
    title: (titleEl && titleEl.textContent.trim()) || 'GameSir G7 SE',
    color: color,
    qty: qty,
    image: tileImg ? tileImg.getAttribute('src') : ''
  };
}

function ggBumpCartCount(n) {
  var cartIcon = document.querySelector('[data-gg-cart-count]');
  if (!cartIcon) return;
  var qty = parseInt(n, 10) || 1;
  cartIcon.textContent = qty;
  cartIcon.hidden = qty === 0;
}

function ggAddVariantToCart(variantId, qty) {
  return fetch(ggCartRootUrl() + 'cart/add.js', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(ggCartAddPayload([{ id: parseInt(variantId, 10), quantity: qty }]))
  }).then(function (res) {
    return res.json().then(function (data) { return { ok: res.ok, data: data }; });
  });
}

function ggFetchProductByHandle(handle) {
  return fetch(ggCartRootUrl() + 'products/' + handle + '.js', { headers: { Accept: 'application/json' } })
    .then(function (res) { return res.ok ? res.json() : null; })
    .then(function (raw) { return ggNormalizeAjaxProduct(raw); })
    .catch(function () { return null; });
}

function initBuyForm() {
  var root = document.querySelector('[data-gg-product-root]');
  if (!root) return;
  var form = root.querySelector('[data-gg-buy-form]') || root.querySelector('form[action*="/cart/add"]');
  if (!form) return;

  ggEnsureProduct(root).then(function (product) {
    if (product) ggApplyColorToVariant(root, ggSelectedColor(root));
  });

  if (form.getAttribute('data-gg-buy-bound') === 'true') return;
  form.setAttribute('data-gg-buy-bound', 'true');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = form.querySelector('[data-gg-buy-add]');
    if (btn && btn.disabled) return;
    ggShowBuyError(root, '');
    var pending = ggPendingItemFromRoot(root);
    ggSavePendingCart(pending);
    ggBumpCartCount(pending.qty);
    if (btn) {
      btn.disabled = true;
      btn.textContent = (document.documentElement.lang || '').indexOf('en') === 0 ? 'Going to cart…' : 'Yendo al carrito…';
    }
    ggEnsureProduct(root).then(function () {
      ggApplyColorToVariant(root, pending.color);
      var idInput = form.querySelector('[data-gg-variant-id]');
      var variantId = idInput && idInput.value ? parseInt(idInput.value, 10) : 0;
      if (!variantId) return null;
      return ggAddVariantToCart(variantId, pending.qty);
    }).then(function (result) {
      if (result && result.ok && !result.data.status) {
        ggClearPendingCart();
        document.dispatchEvent(new CustomEvent('cart:refresh'));
        document.dispatchEvent(new CustomEvent('cart:add'));
      }
      ggGoToCart();
    }).catch(function () {
      ggGoToCart();
    });
  });
}

function ggPendingCartMarkup(item) {
  var en = (document.documentElement.lang || '').indexOf('en') === 0;
  var colorLine = item.color ? (en ? 'Color: ' : 'Color: ') + ggEscapeHtml(item.color) : '';
  return (
    '<div class="gg-pending-cart">' +
      '<p class="gg-pending-cart__kicker">' + (en ? 'Your cart' : 'Tu carrito') + '</p>' +
      '<div class="gg-pending-cart__item">' +
        (item.image ? '<img class="gg-pending-cart__img" src="' + ggEscapeHtml(item.image) + '" alt="' + ggEscapeHtml(item.color || item.title) + '">' : '') +
        '<div class="gg-pending-cart__info">' +
          '<p class="gg-pending-cart__title">' + ggEscapeHtml(item.title) + '</p>' +
          (colorLine ? '<p class="gg-pending-cart__meta">' + colorLine + '</p>' : '') +
          '<p class="gg-pending-cart__meta">' + (en ? 'Qty: ' : 'Cantidad: ') + ggEscapeHtml(item.qty) + '</p>' +
        '</div>' +
      '</div>' +
      '<button type="button" class="gg-btn gg-btn--accent gg-pending-cart__pay" data-gg-pending-checkout>' +
        (en ? 'Checkout' : 'Pagar ahora') +
      '</button>' +
      '<p class="gg-pending-cart__error" data-gg-pending-error hidden></p>' +
    '</div>'
  );
}

function ggMountPendingCart(item) {
  var host = document.querySelector('[data-gg-pending-cart]');
  if (!host) {
    host = document.createElement('div');
    host.setAttribute('data-gg-pending-cart', '');
    var warnings = document.querySelector('.cart__warnings');
    var main = document.getElementById('MainContent');
    if (warnings) warnings.insertBefore(host, warnings.firstChild);
    else if (main) main.insertBefore(host, main.firstChild);
    else document.body.insertBefore(host, document.body.firstChild);
  }
  host.hidden = false;
  host.innerHTML = ggPendingCartMarkup(item);
  var emptyText = document.querySelector('.cart__empty-text');
  if (emptyText) emptyText.hidden = true;
  var continueBtn = document.querySelector('.cart__warnings .button');
  if (continueBtn) continueBtn.hidden = true;
  ggBumpCartCount(item.qty);
  var pay = host.querySelector('[data-gg-pending-checkout]');
  if (pay) {
    pay.addEventListener('click', function () {
      ggCheckoutPending(item, host);
    });
  }
}

function ggCheckoutPending(item, host) {
  var err = host.querySelector('[data-gg-pending-error]');
  var pay = host.querySelector('[data-gg-pending-checkout]');
  var en = (document.documentElement.lang || '').indexOf('en') === 0;
  if (pay) {
    pay.disabled = true;
    pay.textContent = en ? 'Checking out…' : 'Redirigiendo…';
  }
  ggFetchProductByHandle(item.handle).then(function (product) {
    var variant = product ? ggFindVariantForColor(product, item.color) : null;
    if (!variant || !variant.id) {
      throw new Error('no-variant');
    }
    return ggAddVariantToCart(variant.id, item.qty || 1);
  }).then(function (result) {
    if (!result || !result.ok || result.data.status) throw new Error('add-failed');
    ggClearPendingCart();
    window.location.assign('/checkout');
  }).catch(function () {
    if (pay) {
      pay.disabled = false;
      pay.textContent = en ? 'Checkout' : 'Pagar ahora';
    }
    if (err) {
      err.hidden = false;
      err.textContent = en
        ? 'This product is not published to the Online Store yet, so Shopify checkout cannot start.'
        : 'Este producto aún no está publicado en la Tienda online, así que Shopify no puede iniciar el pago.';
    }
  });
}

function initPendingCart() {
  var pending = ggReadPendingCart();
  if (pending && pending.qty) ggBumpCartCount(pending.qty);

  var path = (window.location.pathname || '').replace(/\/$/, '');
  if (path !== '/cart') return;
  if (!pending) return;

  ggFetchProductByHandle(pending.handle).then(function (product) {
    var variant = product ? ggFindVariantForColor(product, pending.color) : null;
    if (variant && variant.id) {
      return ggAddVariantToCart(variant.id, pending.qty || 1).then(function (result) {
        if (result && result.ok && !result.data.status) {
          ggClearPendingCart();
          window.location.reload();
          return true;
        }
        return false;
      });
    }
    return false;
  }).then(function (added) {
    if (!added) ggMountPendingCart(pending);
  }).catch(function () {
    ggMountPendingCart(pending);
  });
}

function initUtmCapture() {
  var data = ggReadUtm();
  var params;
  try { params = new URLSearchParams(location.search); } catch (e) { params = null; }
  var changed = false;
  if (params) {
    GG_UTM_KEYS.forEach(function (k) {
      var v = params.get(k);
      if (v) { data[k] = v; changed = true; }
    });
    var gclid = params.get('gclid');
    if (gclid) { data.gclid = gclid; changed = true; }
    var fbclid = params.get('fbclid');
    if (fbclid) { data.fbclid = fbclid; changed = true; }
    if (changed) data.landing = (location.pathname || '/').slice(0, 120);
  }
  if (changed) {
    try { sessionStorage.setItem('gg_utm', JSON.stringify(data)); } catch (e) {}
  }
  var attrs = ggUtmAttributes();
  if (!attrs) return;
  document.querySelectorAll('form[action*="/cart/add"]').forEach(function (form) {
    Object.keys(attrs).forEach(function (k) {
      var name = 'attributes[' + k + ']';
      var input = form.elements[name];
      if (!input) {
        input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        form.appendChild(input);
      }
      input.value = attrs[k];
    });
  });
}

function initQtyStepper() {
  document.querySelectorAll('[data-gg-qty]').forEach(function (wrap) {
    var input = wrap.querySelector('[data-gg-qty-input]');
    var minus = wrap.querySelector('[data-gg-qty-minus]');
    var plus = wrap.querySelector('[data-gg-qty-plus]');
    if (!input || !minus || !plus) return;
    function clamp() {
      var v = parseInt(input.value, 10);
      if (!v || v < 1) v = 1;
      input.value = v;
    }
    minus.addEventListener('click', function () {
      clamp();
      input.value = parseInt(input.value, 10) - 1;
      clamp();
    });
    plus.addEventListener('click', function () {
      clamp();
      input.value = parseInt(input.value, 10) + 1;
    });
    input.addEventListener('change', clamp);
  });
}

function formatCop(usdAmount, tasa) {
  var cop = Math.round(usdAmount * tasa);
  return '≈ ' + cop.toLocaleString('es-CO') + ' COP';
}

function fillPriceCop() {
  document.querySelectorAll('[data-gg-price-cop]').forEach(function (el) {
    var usd = parseFloat(el.getAttribute('data-usd'));
    var tasa = parseFloat(el.getAttribute('data-tasa'));
    if (!usd || !tasa) return;
    el.textContent = formatCop(usd, tasa);
  });
}

function initPriceCop() {
  fillPriceCop();
  // El carrito (cantidad +/-) reemplaza su HTML por AJAX sin recargar
  // la página, así que los precios en COP quedan vacíos hasta que se
  // vuelvan a rellenar. Se observa el contenedor y se rellenan de nuevo
  // cada vez que cambia — desconectando el observer mientras se rellena
  // para no entrar en bucle infinito con su propio cambio.
  var containers = document.querySelectorAll('cart-items, cart-drawer-items, .totals');
  if (!containers.length) return;
  var observer = new MutationObserver(function () {
    observer.disconnect();
    fillPriceCop();
    containers.forEach(function (c) { observer.observe(c, { childList: true, subtree: true }); });
  });
  containers.forEach(function (c) { observer.observe(c, { childList: true, subtree: true }); });
}

function initRewardsButton() {
  var btn = document.querySelector('[data-gg-open-rewards]');
  if (!btn) return;
  btn.addEventListener('click', function () {
    var frame = document.getElementById('smile-lite-launcher-frame');
    var doc = frame && frame.contentDocument;
    var launcher = doc ? doc.querySelector('button') : null;
    if (launcher) launcher.click();
  });
}

function initAiChatButton() {
  document.querySelectorAll('[data-gg-open-aichat]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      if (typeof window.GGSalesAssistantOpen === 'function') {
        window.GGSalesAssistantOpen();
      }
    });
  });
}

// ---------- Reveal on scroll ----------
function initReveal() {
  document.querySelectorAll('.gg-reveal').forEach(function (el) {
    el.classList.add('gg-visible');
  });
}

// ---------- Mobile drawer menu ----------
function initDrawer() {
  var burger = document.querySelector('[data-gg-burger]');
  var drawer = document.querySelector('[data-gg-drawer]');
  var overlay = document.querySelector('[data-gg-drawer-overlay]');
  var close = document.querySelector('[data-gg-drawer-close]');
  if (!burger || !drawer || !overlay) return;

  function open() {
    drawer.classList.add('gg-open');
    overlay.classList.add('gg-open');
    drawer.setAttribute('aria-hidden', 'false');
    overlay.setAttribute('aria-hidden', 'false');
    burger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
  function shut() {
    drawer.classList.remove('gg-open');
    overlay.classList.remove('gg-open');
    drawer.setAttribute('aria-hidden', 'true');
    overlay.setAttribute('aria-hidden', 'true');
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
  burger.addEventListener('click', open);
  overlay.addEventListener('click', shut);
  if (close) close.addEventListener('click', shut);
}

// ---------- Grupos desplegables dentro del menú móvil (ej. "Juegos" con plataformas) ----------
function initDrawerGroups() {
  document.querySelectorAll('[data-gg-drawer-group-trigger]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var group = btn.closest('.gg-drawer__group');
      var open = group.classList.toggle('gg-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });
}

// ---------- Mobile search toggle ----------
function initSearchToggle() {
  var toggle = document.querySelector('[data-gg-search-toggle]');
  var search = document.querySelector('[data-gg-search]');
  if (!toggle || !search) return;
  toggle.addEventListener('click', function () {
    search.classList.toggle('gg-search--open');
    var input = search.querySelector('input');
    if (input && search.classList.contains('gg-search--open')) input.focus();
  });
}

// ---------- Selector de idioma / país-moneda ----------
function initLocaleSelector() {
  var root = document.querySelector('[data-gg-locale]');
  if (!root) return;
  var trigger = root.querySelector('[data-gg-locale-trigger]');
  var panel = root.querySelector('[data-gg-locale-panel]');
  if (!trigger || !panel) return;

  function close() {
    panel.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
  }
  function open() {
    panel.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
  }

  trigger.addEventListener('click', function (e) {
    e.stopPropagation();
    if (panel.hidden) open(); else close();
  });
  document.addEventListener('click', function (e) {
    if (!root.contains(e.target)) close();
  });
  document.addEventListener('keyup', function (e) {
    if (e.key === 'Escape') close();
  });

  root.querySelectorAll('[data-gg-locale-value]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      var form = link.closest('form');
      var input = form ? form.querySelector('[data-gg-locale-input]') : null;
      if (!form || !input) return;
      input.value = link.getAttribute('data-gg-locale-value');
      form.submit();
    });
  });
}

// ---------- Carousels (arrow buttons) ----------
function initCarousels() {
  document.querySelectorAll('[data-gg-carousel]').forEach(function (wrap) {
    var scope = wrap.closest('.gg-container') || wrap.parentElement || wrap;
    var track = wrap.querySelector('.gg-carrusel');
    var prev = scope.querySelector('[data-gg-prev]');
    var next = scope.querySelector('[data-gg-next]');
    if (!track) return;
    function step() {
      var item = track.querySelector('.gg-carrusel__item');
      return item ? item.getBoundingClientRect().width + 16 : 240;
    }
    if (prev) prev.addEventListener('click', function () { track.scrollBy({ left: -step() * 2, behavior: 'smooth' }); });
    if (next) next.addEventListener('click', function () { track.scrollBy({ left: step() * 2, behavior: 'smooth' }); });
  });
}

// ---------- Add to cart (AJAX) from product cards ----------
function initAddToCart() {
  document.body.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-gg-add-card]');
    if (!btn) return;
    e.preventDefault();
    var variantId = btn.getAttribute('data-variant-id');
    if (!variantId || btn.disabled) return;
    var original = btn.innerHTML;
    btn.disabled = true;
    fetch(window.Shopify && window.Shopify.routes && window.Shopify.routes.root ? window.Shopify.routes.root + 'cart/add.js' : '/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(ggCartAddPayload([{ id: parseInt(variantId, 10), quantity: 1 }]))
    })
      .then(function (res) { return res.json(); })
      .then(function () {
        btn.classList.add('gg-added');
        btn.textContent = '¡Agregado!';
        document.dispatchEvent(new CustomEvent('cart:refresh'));
        var cartIcon = document.querySelector('[data-gg-cart-count]');
        if (cartIcon) {
          fetch('/cart.js').then(function (r) { return r.json(); }).then(function (cart) {
            cartIcon.textContent = cart.item_count;
            cartIcon.hidden = cart.item_count === 0;
          });
        }
        document.dispatchEvent(new CustomEvent('cart:add'));
        setTimeout(function () {
          btn.classList.remove('gg-added');
          btn.innerHTML = original;
          btn.disabled = false;
        }, 1800);
      })
      .catch(function () {
        btn.disabled = false;
        btn.innerHTML = original;
      });
  });
}

// ---------- Wishlist (favoritos propios, guardados en este navegador) ----------
function getWishlist() {
  try { return JSON.parse(localStorage.getItem('gg_wishlist') || '[]'); } catch (e) { return []; }
}
function saveWishlist(list) {
  localStorage.setItem('gg_wishlist', JSON.stringify(list));
  document.dispatchEvent(new CustomEvent('gg:wishlist-updated'));
}
function initWishlist() {
  document.querySelectorAll('[data-gg-wish]').forEach(function (btn) {
    var handle = btn.getAttribute('data-gg-wish');
    if (getWishlist().indexOf(handle) > -1) btn.classList.add('gg-active');
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      var list = getWishlist();
      var idx = list.indexOf(handle);
      if (idx > -1) {
        list.splice(idx, 1);
        btn.classList.remove('gg-active');
      } else {
        list.push(handle);
        btn.classList.add('gg-active', 'gg-pop');
        setTimeout(function () { btn.classList.remove('gg-pop'); }, 350);
      }
      saveWishlist(list);
      updateWishlistCount();
    });
  });
}
function updateWishlistCount() {
  var badge = document.querySelector('[data-gg-wish-count]');
  if (!badge) return;
  var n = getWishlist().length;
  badge.textContent = n;
  badge.hidden = n === 0;
}
document.addEventListener('gg:wishlist-updated', updateWishlistCount);

// ---------- Recently viewed ----------
function initRecentlyViewed() {
  var tracker = document.querySelector('[data-gg-track-product]');
  if (tracker) {
    var handle = tracker.getAttribute('data-gg-track-product');
    try {
      var list = JSON.parse(localStorage.getItem('gg_recent') || '[]');
      list = list.filter(function (h) { return h !== handle; });
      list.unshift(handle);
      localStorage.setItem('gg_recent', JSON.stringify(list.slice(0, 12)));
    } catch (e) {}
  }

  var section = document.querySelector('[data-gg-recent-section]');
  if (!section) return;
  var track = section.querySelector('.gg-carrusel');
  var empty = section.querySelector('[data-gg-recent-empty]');
  var current = tracker ? tracker.getAttribute('data-gg-track-product') : null;
  var recent = [];
  try { recent = JSON.parse(localStorage.getItem('gg_recent') || '[]'); } catch (e) {}
  recent = recent.filter(function (h) { return h !== current; }).slice(0, 8);

  if (!recent.length || !track) {
    section.hidden = true;
    return;
  }
  section.hidden = false;
  if (empty) empty.hidden = true;

  var tpl = section.querySelector('template');
  Promise.all(recent.map(function (h) {
    return fetch('/products/' + h + '.js').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
  })).then(function (products) {
    products.filter(Boolean).forEach(function (p) {
      var li = document.createElement('div');
      li.className = 'gg-carrusel__item';
      var price = (p.price / 100).toLocaleString('es-ES', { style: 'currency', currency: (window.Shopify && Shopify.currency && Shopify.currency.active) || 'EUR' });
      li.innerHTML =
        '<a class="gg-card" href="' + p.url + '">' +
        '<div class="gg-card__media"><img src="' + (p.featured_image || '') + '" alt="' + p.title.replace(/"/g, '') + '" loading="lazy"></div>' +
        '<div class="gg-card__body"><p class="gg-card__title">' + p.title + '</p>' +
        '<div class="gg-card__prices"><span class="gg-card__price">' + price + '</span></div></div></a>';
      track.appendChild(li);
    });
    if (!track.children.length) section.hidden = true;
  });
}

// ---------- Product page: horizontal swipeable gallery ----------
function initProductGallery() {
  var root = document.querySelector('[data-gg-product-root]');
  if (!root) return;
  var track = root.querySelector('[data-gg-track]');
  if (!track) return;
  var slides = Array.prototype.slice.call(root.querySelectorAll('[data-gg-slide]'));
  var dots = Array.prototype.slice.call(root.querySelectorAll('[data-gg-dot]'));
  var thumbs = Array.prototype.slice.call(root.querySelectorAll('[data-gg-thumb]'));
  var prevBtn = root.querySelector('[data-gg-gallery-prev]');
  var nextBtn = root.querySelector('[data-gg-gallery-next]');
  if (!slides.length) return;

  function setActive(index) {
    dots.forEach(function (d, i) {
      var on = i === index;
      d.classList.toggle('gg-active', on);
      if (on) d.setAttribute('aria-current', 'true');
      else d.removeAttribute('aria-current');
    });
    thumbs.forEach(function (t, i) { t.classList.toggle('gg-active', i === index); });
  }

  function goTo(index, behavior) {
    if (index < 0 || index >= slides.length) return;
    track.scrollTo({ left: slides[index].offsetLeft, behavior: behavior || 'smooth' });
    setActive(index);
  }

  root.ggGalleryGoToMedia = function (mediaId) {
    var idx = slides.findIndex(function (s) { return s.getAttribute('data-media-id') === String(mediaId); });
    if (idx > -1) goTo(idx);
  };

  // Sync active dot/thumb while the user scrolls/swipes manually
  var scrollTimer;
  track.addEventListener('scroll', function () {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(function () {
      var idx = Math.round(track.scrollLeft / track.clientWidth);
      setActive(Math.max(0, Math.min(idx, slides.length - 1)));
    }, 80);
  });

  if (prevBtn) prevBtn.addEventListener('click', function () {
    goTo(Math.round(track.scrollLeft / track.clientWidth) - 1);
  });
  if (nextBtn) nextBtn.addEventListener('click', function () {
    goTo(Math.round(track.scrollLeft / track.clientWidth) + 1);
  });
  dots.forEach(function (d, i) { d.addEventListener('click', function () { goTo(i); }); });
  thumbs.forEach(function (t, i) { t.addEventListener('click', function () { goTo(i); }); });

  // Desktop mouse-drag to scroll (touch already works natively via overflow-x)
  var isDown = false, startX = 0, startScroll = 0, moved = false;
  track.addEventListener('mousedown', function (e) {
    isDown = true; moved = false;
    startX = e.pageX; startScroll = track.scrollLeft;
    track.classList.add('gg-dragging');
  });
  window.addEventListener('mouseup', function () {
    if (!isDown) return;
    isDown = false;
    track.classList.remove('gg-dragging');
    if (moved) {
      var idx = Math.round(track.scrollLeft / track.clientWidth);
      goTo(idx);
    }
  });
  window.addEventListener('mousemove', function (e) {
    if (!isDown) return;
    var dx = e.pageX - startX;
    if (Math.abs(dx) > 4) moved = true;
    track.scrollLeft = startScroll - dx;
  });
  track.addEventListener('dragstart', function (e) { e.preventDefault(); });

  setActive(0);
}

// ---------- Product page: variant selector ----------
function initProductForm() {
  var root = document.querySelector('[data-gg-product-root]');
  if (!root) return;
  var dataEl = root.querySelector('[data-gg-product-json]');
  if (!dataEl) return;
  var product;
  try { product = JSON.parse(dataEl.textContent); } catch (e) { return; }

  var idInput = root.querySelector('[data-gg-variant-id]');
  var priceEl = root.querySelector('[data-gg-price]');
  var priceCopEl = root.querySelector('[data-gg-price-cop]');
  var puntosWrap = root.querySelector('[data-gg-puntos-wrap]');
  var compareEl = root.querySelector('[data-gg-compare]');
  var badgeEl = root.querySelector('[data-gg-badge]');
  var addBtn = root.querySelector('[data-gg-buy-add]');
  var stockEl = root.querySelector('[data-gg-stock]');
  var swatches = root.querySelectorAll('[data-gg-swatch]');

  var selected = {};
  swatches.forEach(function (s) {
    if (s.classList.contains('gg-active')) selected[s.getAttribute('data-option-name')] = s.getAttribute('data-option-value');
  });

  function findVariant() {
    return product.variants.find(function (v) {
      return v.options.every(function (val, i) {
        var optName = product.options[i];
        return !selected[optName] || selected[optName] === val;
      });
    });
  }

  function formatMoney(cents) {
    var currency = root.getAttribute('data-shop-currency') || 'COP';
    if (currency === 'COP') {
      var pesos = Math.round(Number(cents) / 100);
      return '$' + pesos.toLocaleString('es-CO') + ' COP';
    }
    var locale = 'es-ES';
    try {
      return (cents / 100).toLocaleString(locale, { style: 'currency', currency: currency });
    } catch (e) {
      return (cents / 100).toLocaleString('es-ES', { style: 'currency', currency: currency });
    }
  }

  function render(userTriggered) {
    var variant = findVariant();
    swatches.forEach(function (s) {
      var name = s.getAttribute('data-option-name');
      var value = s.getAttribute('data-option-value');
      s.classList.toggle('gg-active', selected[name] === value);
      s.setAttribute('aria-pressed', selected[name] === value ? 'true' : 'false');
      var testSel = Object.assign({}, selected);
      testSel[name] = value;
      var exists = product.variants.some(function (v) {
        return v.available && v.options.every(function (val, i) { return !testSel[product.options[i]] || testSel[product.options[i]] === val; });
      });
      s.disabled = !exists;
    });

    if (!variant) return;
    if (idInput) idInput.value = variant.id;
    if (priceEl) priceEl.textContent = formatMoney(variant.price);
    if (priceCopEl) {
      var tasa = parseFloat(priceCopEl.getAttribute('data-tasa'));
      if (tasa) priceCopEl.textContent = formatCop(variant.price / 100, tasa);
    }
    if (puntosWrap && puntosWrap.getAttribute('data-sin-puntos') !== 'true') {
      var porDolar = parseFloat(puntosWrap.getAttribute('data-puntos-por-dolar'));
      var puntosSpan = puntosWrap.querySelector('.gg-price-puntos');
      var puntos = Math.floor((variant.price / 100) * (porDolar || 0));
      if (puntos > 0) {
        if (!puntosSpan) {
          puntosSpan = document.createElement('span');
          puntosSpan.className = 'gg-price-puntos';
          puntosWrap.appendChild(puntosSpan);
        }
        puntosSpan.textContent = '🎁 Ganas ' + puntos + ' puntos';
      } else if (puntosSpan) {
        puntosSpan.remove();
      }
    }
    if (compareEl) {
      if (variant.compare_at_price && variant.compare_at_price > variant.price) {
        compareEl.textContent = formatMoney(variant.compare_at_price);
        compareEl.hidden = false;
        if (badgeEl) {
          var pct = Math.round((1 - variant.price / variant.compare_at_price) * 100);
          badgeEl.textContent = '-' + pct + '%';
          badgeEl.hidden = false;
        }
      } else {
        compareEl.hidden = true;
        if (badgeEl) badgeEl.hidden = true;
      }
    }
    if (addBtn) {
      addBtn.disabled = !variant.available;
      addBtn.textContent = variant.available ? addBtn.getAttribute('data-label-add') : addBtn.getAttribute('data-label-sold-out');
    }
    if (stockEl) {
      stockEl.textContent = variant.available ? stockEl.getAttribute('data-label-in-stock') : stockEl.getAttribute('data-label-out-stock');
      stockEl.classList.toggle('gg-ok', variant.available);
    }
    if (userTriggered && variant.media_id && root.ggGalleryGoToMedia) {
      root.ggGalleryGoToMedia(variant.media_id);
    }
  }

  swatches.forEach(function (s) {
    s.addEventListener('click', function () {
      if (s.disabled) return;
      selected[s.getAttribute('data-option-name')] = s.getAttribute('data-option-value');
      render(true);
    });
  });

  render(false);
}

// ---------- Colores del catálogo (mosaico + muestras) ----------
function initColorPicker() {
  var root = document.querySelector('[data-gg-product-root]');
  if (!root) return;
  var picks = root.querySelectorAll('[data-gg-color]');
  if (!picks.length) return;
  var label = root.querySelector('[data-gg-color-label]');
  var wa = root.querySelector('[data-gg-wa-color]');
  var productSwatches = root.querySelectorAll('[data-gg-swatch]');

  function current() {
    var active = root.querySelector('[data-gg-color].gg-active');
    return active ? active.getAttribute('data-gg-color') : '';
  }

  function apply(value) {
    if (!value) return;
    picks.forEach(function (el) {
      var on = el.getAttribute('data-gg-color') === value;
      el.classList.toggle('gg-active', on);
      el.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (label) label.textContent = value;
    if (wa) {
      var base = wa.getAttribute('data-gg-wa-base') || 'https://wa.me/573112333744';
      var msg = wa.getAttribute('data-gg-wa-msg') || 'Hola Gato Gamer Store, quiero el GameSir G7 SE en color';
      wa.href = base + '?text=' + encodeURIComponent(msg + ' ' + value);
    }
    ggApplyColorToVariant(root, value);
    productSwatches.forEach(function (s) {
      if ((s.getAttribute('data-option-value') || '') === value) s.click();
    });
  }

  picks.forEach(function (el) {
    el.addEventListener('click', function () {
      apply(el.getAttribute('data-gg-color'));
    });
  });
  apply(current());
}

// ---------- FAQ acordeón ----------
function initFaqAccordion() {
  document.querySelectorAll('.gg-faq').forEach(function (list) {
    var items = list.querySelectorAll('.gg-faq__item');
    items.forEach(function (item) {
      var btn = item.querySelector('.gg-faq__q');
      var panel = item.querySelector('.gg-faq__a');
      if (!btn || !panel) return;
      btn.addEventListener('click', function () {
        var isOpen = item.getAttribute('data-open') === 'true';
        items.forEach(function (other) {
          other.setAttribute('data-open', 'false');
          other.querySelector('.gg-faq__a').style.maxHeight = null;
          other.querySelector('.gg-faq__q').setAttribute('aria-expanded', 'false');
        });
        if (!isOpen) {
          item.setAttribute('data-open', 'true');
          btn.setAttribute('aria-expanded', 'true');
          panel.style.maxHeight = panel.scrollHeight + 'px';
        }
      });
    });
  });
}

// ---------- Barra fija de compra en móvil ----------
function initStickyCart() {
  var bar = document.querySelector('[data-gg-sticky-cart]');
  var root = document.querySelector('[data-gg-product-root]');
  if (!bar || !root) return;

  var path = (window.location.pathname || '').replace(/\/$/, '');
  if (
    path === '/cart' ||
    path.indexOf('/checkout') === 0 ||
    path.indexOf('/checkouts') === 0 ||
    path.indexOf('/thank_you') !== -1 ||
    path.indexOf('compra-confirmada') !== -1
  ) {
    bar.remove();
    return;
  }

  if (bar.parentElement !== document.body) {
    document.body.appendChild(bar);
  }

  var trigger = root.querySelector('[data-gg-buy-add]') || document.getElementById('gg-comprar');
  var priceEl = bar.querySelector('[data-gg-sticky-price]');
  var btn = bar.querySelector('[data-gg-sticky-add]');
  var buyOutOfView = !trigger;

  function syncStickyCart() {
    bar.classList.toggle('gg-show', buyOutOfView);
    document.body.classList.toggle('gg-sticky-visible', buyOutOfView);
    bar.setAttribute('aria-hidden', buyOutOfView ? 'false' : 'true');
  }

  if (trigger && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        buyOutOfView = !entry.isIntersecting;
        syncStickyCart();
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0 }).observe(trigger);
  } else {
    buyOutOfView = true;
    syncStickyCart();
  }

  function syncPrice() {
    var mainPrice = root.querySelector('[data-gg-price]');
    if (mainPrice && priceEl) priceEl.textContent = mainPrice.textContent;
  }
  syncPrice();
  var priceObserverTarget = root.querySelector('[data-gg-price]');
  if (priceObserverTarget && 'MutationObserver' in window) {
    new MutationObserver(syncPrice).observe(priceObserverTarget, { childList: true, characterData: true, subtree: true });
  }

  if (btn) {
    btn.addEventListener('click', function () {
      var idInput = root.querySelector('[data-gg-variant-id]');
      var mainAddBtn = root.querySelector('[data-gg-buy-add]');
      if (!idInput || !idInput.value) return;
      if (mainAddBtn && mainAddBtn.disabled) return;
      var qtyInput = root.querySelector('[data-gg-qty-input]');
      var qty = qtyInput ? parseInt(qtyInput.value, 10) : 1;
      if (!qty || qty < 1) qty = 1;
      var original = btn.textContent;
      btn.disabled = true;
      fetch((window.Shopify && window.Shopify.routes && window.Shopify.routes.root ? window.Shopify.routes.root : '/') + 'cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(ggCartAddPayload([{ id: parseInt(idInput.value, 10), quantity: qty }]))
      })
        .then(function (res) { return res.json(); })
        .then(function () {
          btn.textContent = '¡Agregado!';
          document.dispatchEvent(new CustomEvent('cart:refresh'));
          document.dispatchEvent(new CustomEvent('cart:add'));
          var cartIcon = document.querySelector('[data-gg-cart-count]');
          if (cartIcon) {
            fetch('/cart.js').then(function (r) { return r.json(); }).then(function (cart) {
              cartIcon.textContent = cart.item_count;
              cartIcon.hidden = cart.item_count === 0;
            });
          }
          setTimeout(function () { btn.textContent = original; btn.disabled = false; }, 1800);
        })
        .catch(function () { btn.disabled = false; btn.textContent = original; });
    });
  }
}

// ---------- Video de producto (clic para reproducir) ----------
function initVideoPlay() {
  document.querySelectorAll('[data-gg-video]').forEach(function (wrap) {
    var video = wrap.querySelector('.gg-video__el');
    var btn = wrap.querySelector('[data-gg-video-play]');
    if (!video || !btn) return;
    btn.addEventListener('click', function () {
      video.play();
    });
    video.addEventListener('play', function () { wrap.classList.add('is-playing'); });
    video.addEventListener('pause', function () { wrap.classList.remove('is-playing'); });
    video.addEventListener('ended', function () { wrap.classList.remove('is-playing'); });
  });
}

function ggStorageGet(key) {
  try {
    var sessionVal = sessionStorage.getItem(key);
    if (sessionVal) return sessionVal;
  } catch (e) {}
  return null;
}

function ggStorageSet(key, value) {
  try { sessionStorage.setItem(key, value); } catch (e) {}
}

function ggStorageRemove(key) {
  try { sessionStorage.removeItem(key); } catch (e) {}
  try { localStorage.removeItem(key); } catch (e2) {}
}

function ggReadPendingAt() {
  var t = 0;
  try { t = Number(sessionStorage.getItem('gg_checkout_pending') || 0); } catch (e) {}
  try {
    var raw = localStorage.getItem('gg_checkout_pending');
    if (raw) {
      var parsed = JSON.parse(raw);
      var other = parsed && typeof parsed === 'object' ? Number(parsed.t || 0) : Number(parsed || 0);
      if (other > t) t = other;
    }
  } catch (e2) {}
  return t;
}

function ggMarkCheckoutPending() {
  var stamp = Date.now();
  try { sessionStorage.setItem('gg_checkout_pending', String(stamp)); } catch (e) {}
  try { localStorage.setItem('gg_checkout_pending', JSON.stringify({ t: stamp })); } catch (e2) {}
}

function ggPaymentStatusValue(params) {
  if (!params) return '';
  return String(
    params.get('bold-tx-status') ||
    params.get('bold_tx_status') ||
    params.get('collection_status') ||
    params.get('status') ||
    params.get('payment_status') ||
    params.get('transactionState') ||
    params.get('lapTransactionState') ||
    params.get('x_transaction_state') ||
    params.get('x_cod_response') ||
    ''
  ).toLowerCase().trim();
}

function ggPaymentOutcome(params) {
  var status = ggPaymentStatusValue(params);
  if (
    status === 'approved' ||
    status === 'aprobada' ||
    status === 'success' ||
    status === 'ok' ||
    status === 'paid' ||
    status === 'pagado' ||
    status === '4' ||
    status === '1'
  ) {
    return 'paid';
  }
  if (
    status === 'rejected' ||
    status === 'rechazada' ||
    status === 'declined' ||
    status === 'failed' ||
    status === 'error' ||
    status === 'cancelled' ||
    status === 'canceled' ||
    status === 'voided' ||
    status === 'abandoned' ||
    status === 'abort' ||
    status === '2' ||
    status === '3' ||
    status === '0'
  ) {
    return 'failed';
  }
  return 'unknown';
}

function ggPaymentReturnedOk(params) {
  return ggPaymentOutcome(params) === 'paid';
}

function ggFromPaidReferrer(ref) {
  return /bold\.co|bold\.com|payments\.bold|checkout\.bold|online\.bold|thank[_-]you|\/thank_you|order[_-]status|checkout\.shopify|shop\.app/i.test(ref || '');
}

function initCheckoutReturn() {
  try { localStorage.removeItem('gg_confirm_shown'); } catch (e) {}

  var CONFIRM_PATH = '/pages/compra-confirmada';
  var path = (location.pathname || '').replace(/\/$/, '') || '/';
  var onConfirmPage = path === CONFIRM_PATH;
  var banner = document.querySelector('[data-gg-confirm="banner"]');
  var confirmFallback = document.querySelector('[data-gg-confirm-fallback]');
  var notFound = document.querySelector('[data-gg-404]');

  function applyOrderFromQuery() {
    var params;
    try { params = new URLSearchParams(location.search); } catch (e) { return; }
    var raw = params.get('order') || params.get('order_name') || params.get('shopify_order') || '';
    var clean = String(raw).replace(/^#/, '').trim();
    if (!/^\d{1,8}$/.test(clean)) return;
    var page = document.querySelector('[data-gg-confirm="page"]');
    if (!page) return;
    var pending = page.querySelector('.gg-confirm__number--pending');
    if (!pending) return;
    var name = '#' + clean;
    pending.className = 'gg-confirm__number';
    pending.innerHTML =
      '<p class="gg-confirm__number-label">Número de pedido</p>' +
      '<p class="gg-confirm__number-value">Pedido ' + name + '</p>' +
      '<p class="gg-confirm__number-note">Recibirás la confirmación y los detalles de tu pedido en tu correo electrónico.</p>';
    var warn = page.querySelector('.gg-confirm__warn');
    if (warn) warn.remove();
  }

  function showConfirmFallback() {
    if (confirmFallback) {
      confirmFallback.hidden = false;
      confirmFallback.removeAttribute('hidden');
    }
    if (notFound) {
      notFound.hidden = true;
      notFound.setAttribute('hidden', '');
    }
    hideBanner();
    applyOrderFromQuery();
    if (document.title && /404|no encontrado|not found/i.test(document.title)) {
      document.title = 'Pedido confirmado – Gato Gamer Store';
    }
  }

  if (onConfirmPage) showConfirmFallback();

  function hideBanner() {
    ggStorageRemove('gg_confirm_shown');
    if (!banner) return;
    banner.hidden = true;
    banner.setAttribute('hidden', '');
  }

  function revealBanner() {
    if (!banner) return;
    banner.hidden = false;
    banner.removeAttribute('hidden');
    ggStorageRemove('gg_checkout_pending');
    ggStorageSet('gg_confirm_shown', '1');
  }

  function goToCheckout() {
    hideBanner();
    if ((location.pathname || '').indexOf('/checkouts') !== -1) return;
    if ((location.pathname || '').replace(/\/$/, '') === '/checkout') return;
    location.replace('/checkout');
  }

  function goToConfirmPage(qs) {
    if (onConfirmPage) return;
    var suffix = qs || '';
    fetch(CONFIRM_PATH, { credentials: 'same-origin' })
      .then(function (res) { return res.text().then(function (html) { return { res: res, html: html }; }); })
      .then(function (data) {
        var html = data.html || '';
        var exists = html.indexOf('data-gg-confirm="page"') !== -1;
        if (exists) {
          location.replace(CONFIRM_PATH + suffix);
          return;
        }
        revealBanner();
      })
      .catch(function () { revealBanner(); });
  }

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[name="checkout"], .cart__checkout-button, a[href*="/checkout"], button[name="checkout"], .gg-pago__method--bold');
    if (!el) return;
    hideBanner();
    ggMarkCheckoutPending();
  }, true);

  document.querySelectorAll('form[action*="/cart"]').forEach(function (form) {
    form.addEventListener('submit', function () {
      var btn = form.querySelector('[name="checkout"], .gg-pago__method--bold');
      if (!btn) return;
      hideBanner();
      ggMarkCheckoutPending();
    });
  });

  if (banner) {
    banner.addEventListener('click', function (e) {
      var keepShopping = e.target.closest('a.gg-btn--accent');
      if (!keepShopping) return;
      hideBanner();
      ggStorageRemove('gg_checkout_pending');
    });
  }

  function syncPaidReturn() {
    if ((location.pathname || '').indexOf('/checkouts') !== -1) return;

    var params;
    try { params = new URLSearchParams(location.search); } catch (e) { params = null; }
    var outcome = ggPaymentOutcome(params);
    var fromPay = ggFromPaidReferrer(document.referrer || '');
    var pending = ggReadPendingAt();
    var fresh = pending && Date.now() - pending < 6 * 60 * 60 * 1000;
    var qs = location.search || '';

    if (outcome === 'failed') {
      goToCheckout();
      return;
    }

    if (onConfirmPage) {
      if (outcome === 'paid') {
        ggStorageRemove('gg_checkout_pending');
        ggStorageSet('gg_confirm_shown', '1');
      }
      applyOrderFromQuery();
      return;
    }

    // Paid on the storefront means Bold used a custom return URL and skipped
    // Shopify Thank you. Send them to the store confirmation, never to Pay now.
    if (outcome === 'paid') {
      goToConfirmPage(qs);
      return;
    }

    // Unknown status: only use the store confirmation if Shopify already
    // emptied the cart (order created). Do not send people to /checkout —
    // that is the "Pagar ahora" screen and can look like a second charge.
    if (!fresh && !fromPay) return;
    fetch('/cart.js', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (cart) {
        var empty = cart && Number(cart.item_count) === 0;
        if (empty && (fresh || fromPay)) goToConfirmPage(qs);
        else hideBanner();
      })
      .catch(function () {});
  }

  syncPaidReturn();
  window.addEventListener('pageshow', function (event) {
    if (event && event.persisted) syncPaidReturn();
  });
}
