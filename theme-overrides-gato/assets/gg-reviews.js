(function () {
  var root = document.querySelector('[data-gg-resenas]');
  if (!root) return;

  function revealReviewImages() {
    root.querySelectorAll('img[data-src]').forEach(function (img) {
      var src = img.getAttribute('data-src');
      if (src && (!img.getAttribute('src') || img.classList.contains('jdgm--loading'))) {
        img.setAttribute('src', src);
        img.setAttribute('loading', 'lazy');
        img.setAttribute('decoding', 'async');
        img.classList.remove('jdgm--loading');
      }
    });
  }

  function localizeJudgeme() {
    if ((document.documentElement.lang || '').toLowerCase().indexOf('en') !== 0) return;
    var nodes = root.querySelectorAll(
      '.jdgm-carousel-title, .jdgm-all-reviews-rating-wrapper, .jdgm-rev-widg__title, .jdgm-widget h2, .jdgm-carousel-number-of-reviews, .jdgm-histogram__text'
    );
    nodes.forEach(function (el) {
      var raw = el.textContent || '';
      var next = raw
        .replace(/Valoraciones/g, 'Ratings')
        .replace(/Los clientes nos califican con/g, 'Customers rate us')
        .replace(/Los clientes nos califican/g, 'Customers rate us')
        .replace(/basado en/g, 'based on')
        .replace(/reseñas/g, 'reviews')
        .replace(/reseña/g, 'review');
      if (next !== raw) el.textContent = next;
    });
  }

  function refresh() {
    revealReviewImages();
    localizeJudgeme();
  }

  refresh();
  window.setTimeout(refresh, 800);
  window.setTimeout(refresh, 2500);

  if (window.MutationObserver) {
    var scheduled = 0;
    var observer = new MutationObserver(function () {
      window.clearTimeout(scheduled);
      scheduled = window.setTimeout(refresh, 160);
    });
    observer.observe(root, { childList: true, subtree: true });
  }
})();
