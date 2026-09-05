(function () {
  if (window.GGSalesAssistant) return;

  var cfg = {};
  try {
    cfg = JSON.parse(document.getElementById('gg-assistant-config').textContent);
  } catch (e) {
    cfg = {};
  }

  /* Editar el número en: Personalizar tema → Pie de página → Número de WhatsApp.
     Formato Colombia: 57XXXXXXXXXX (sin +, espacios ni guiones). */
  var WHATSAPP_NUMBER = String(cfg.whatsappNumber || '').replace(/\D/g, '');
  var root = document.getElementById('gg-sales-assistant');
  if (!root) return;

  var logEl = root.querySelector('[data-gg-sa-log]');
  var form = root.querySelector('[data-gg-sa-form]');
  var input = root.querySelector('#gg-sa-input');
  var lastTopic = 'asesor';
  var greeted = false;
  var product = cfg.productTitle || 'GameSir G7 SE';
  var buyUrl = cfg.productUrl || '/products/control-gamesir-g7se-cable-joysticks-hall-xbox-pc';

  function formatPrice() {
    var cents = Number(cfg.priceCents);
    var cur = String(cfg.shopCurrency || '').toUpperCase();
    if (cur === 'COP' && cents > 0) {
      return '$' + Math.round(cents / 100).toLocaleString('es-CO') + ' COP';
    }
    return '';
  }

  var price = formatPrice();

  function onCheckoutSurface() {
    var p = location.pathname || '';
    return p.indexOf('/checkouts') !== -1 || /(^|\/)cart\/?$/.test(p);
  }

  function track(name) {
    var n = 0;
    function send() {
      if (typeof window.clarity === 'function') {
        try { window.clarity('event', name); } catch (err) {}
        return;
      }
      if (n++ < 16) setTimeout(send, 300);
    }
    send();
  }

  function norm(s) {
    return String(s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function waUrl(topic) {
    var messages = {
      precio: 'Hola Gato Gamer Store \uD83D\uDC4B. Estoy interesado en el GameSir G7 SE y quisiera confirmar el precio.',
      envio: 'Hola Gato Gamer Store \uD83D\uDC4B. Quiero consultar sobre el envío del GameSir G7 SE.',
      pedido: 'Hola Gato Gamer Store \uD83D\uDC4B. Necesito ayuda con un pedido del GameSir G7 SE.',
      gamepass: 'Hola Gato Gamer Store \uD83D\uDC4B. Quiero confirmar lo del Xbox Game Pass Ultimate con el GameSir G7 SE.',
      asesor: 'Hola Gato Gamer Store \uD83D\uDC4B. Necesito hablar con un asesor sobre el GameSir G7 SE.'
    };
    var text = messages[topic] || messages.asesor;
    return 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(text);
  }

  function waButton(topic) {
    return '<a class="gg-sa__wa" data-gg-sa-wa href="' + waUrl(topic) + '" target="_blank" rel="noopener">💬 Hablar con un asesor</a>';
  }

  function addMsg(html, who) {
    var div = document.createElement('div');
    div.className = 'gg-sa__msg gg-sa__msg--' + who;
    div.innerHTML = html;
    logEl.appendChild(div);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function greeting() {
    return (
      '¡Hola! 👋 Soy el asistente de Gato Gamer Store 🎮\n' +
      'Puedo ayudarte con:\n' +
      '🎮 Información del GameSir G7 SE\n' +
      '💰 Precio\n' +
      '🚚 Envíos\n' +
      '🎁 Game Pass\n' +
      '💳 Formas de pago\n' +
      '📦 Pedidos\n' +
      '👤 Hablar con un asesor\n' +
      '¿Qué quieres saber?'
    );
  }

  function unknown() {
    return (
      'No quiero darte información incorrecta. Si quieres, puedo comunicarte con un asesor para confirmarlo.\n' +
      waButton('asesor')
    );
  }

  var HUMAN = [
    'quiero hablar con alguien', 'quiero un asesor', 'hablar con una persona',
    'necesito un humano', 'atencion humana', 'llamenme', 'llamame',
    'quiero reclamar', 'quiero cancelar', 'quiero devolver', 'devolver el producto',
    'mi pedido no llego', 'pedido retrasado', 'problema con mi pedido',
    'problema con el producto', 'hablar con un asesor', 'asesor humano',
    'quiero ayuda', 'necesito ayuda', 'tengo un problema', 'atencion al cliente'
  ];

  function isHuman(q) {
    var n = norm(q);
    if (/\b(asesor|humano|persona real|whatsapp)\b/.test(n)) return true;
    return HUMAN.some(function (p) { return n.indexOf(norm(p)) !== -1; });
  }

  function answer(raw) {
    var q = norm(raw);

    if (!q || /^(hola|buenas|buenos dias|buenas tardes|hey|hi|holi)\b/.test(q)) {
      return { html: greeting(), intent: 'chatbot_message', topic: lastTopic };
    }

    if (isHuman(q) || /reclamar|cancelar|devolver|problema con mi pedido/.test(q)) {
      lastTopic = /envio|lleg|pedido/.test(q) ? 'pedido' : 'asesor';
      return {
        html: 'Claro 👍 Te comunico con un asesor de Gato Gamer Store por WhatsApp.\n' + waButton(lastTopic),
        intent: 'chatbot_human_agent_request',
        topic: lastTopic,
        openWa: true
      };
    }

    if (/precio|cuanto (cuesta|vale|es)|vale\?/.test(q)) {
      lastTopic = 'precio';
      if (!price) {
        return { html: unknown(), intent: 'chatbot_product_question', topic: 'precio' };
      }
      return {
        html: 'El ' + product + ' está en ' + price + ' 🎮\nSi quieres, también puedo explicarte qué incluye y cómo comprarlo.',
        intent: 'chatbot_product_question',
        topic: 'precio'
      };
    }

    if (/disponible|hay stock|agotado|tienen el mando/.test(q)) {
      var stock = cfg.available
        ? 'Sí, el GameSir G7 SE está disponible para compra en la tienda.'
        : 'Para confirmarte la disponibilidad con precisión, puedo comunicarte con un asesor de Gato Gamer Store.\n' + waButton('asesor');
      return { html: stock, intent: 'chatbot_product_question', topic: 'precio' };
    }

    if (/envios a colombia|envian a colombia|hacen envios/.test(q)) {
      lastTopic = 'envio';
      return {
        html: 'Sí, el envío es nacional a Colombia 🇨🇴\nTe avisamos por correo apenas se despache, con el número de guía.\n<a href="' + (cfg.shippingUrl || '/pages/politica-de-envios') + '">Ver política de envíos</a>',
        intent: 'chatbot_question',
        topic: 'envio'
      };
    }

    if (/cuesta el envio|valor del envio|precio del envio/.test(q)) {
      lastTopic = 'envio';
      return {
        html: 'El valor exacto del envío lo calcula Shopify en el checkout según tu dirección. No quiero inventarte un número.\nSi prefieres, un asesor te lo confirma.\n' + waButton('envio'),
        intent: 'chatbot_question',
        topic: 'envio'
      };
    }

    if (/cuanto (tarda|demora)|cuando llega|tiempo de envio|dias habiles/.test(q)) {
      lastTopic = 'envio';
      return {
        html: 'El envío es nacional, entre 1 y 10 días hábiles. Te compartimos el número de guía apenas se despache.',
        intent: 'chatbot_question',
        topic: 'envio'
      };
    }

    if (/rastre|seguimiento|guia|número de guia|numero de guia/.test(q)) {
      lastTopic = 'pedido';
      return {
        html: 'Puedes rastrear tu pedido aquí:\n<a href="' + (cfg.trackUrl || '/pages/rastrea-tu-pedido') + '">Rastrea tu pedido</a>\nSi no te llegó el correo de despacho, un asesor te ayuda.\n' + waButton('pedido'),
        intent: 'chatbot_question',
        topic: 'pedido'
      };
    }

    if (/pagar|tarjeta|transferencia|pse|medios de pago|formas de pago/.test(q)) {
      return {
        html: 'Pagas de forma segura en el checkout de Shopify. Ahí ves los métodos disponibles en ese momento (por ejemplo tarjeta u otras opciones que tenga activa la tienda).\nNo quiero listarte un medio que no esté habilitado ahora mismo.',
        intent: 'chatbot_question',
        topic: 'precio'
      };
    }

    if (/original|originales|licencia/.test(q)) {
      return {
        html: 'Es el GameSir G7 SE que vendemos en Gato Gamer Store, licenciado oficialmente para Xbox Series X|S según la ficha de la tienda.',
        intent: 'chatbot_product_question',
        topic: lastTopic
      };
    }

    if (/que incluye|qué incluye|incluye la caja|que trae/.test(q) && !/game ?pass/.test(q)) {
      return {
        html: 'La caja incluye el mando GameSir G7 SE y cable USB-C.\nAdemás, la oferta vigente de la tienda incluye 1 mes de Xbox Game Pass Ultimate.',
        intent: 'chatbot_product_question',
        topic: 'gamepass'
      };
    }

    if (/game ?pass|ultimate/.test(q)) {
      lastTopic = 'gamepass';
      if (/activar|codigo|código/.test(q)) {
        return {
          html: 'Recibes el código de Xbox Game Pass Ultimate junto con tu pedido y lo activas tú en tu cuenta de Xbox/Microsoft.',
          intent: 'chatbot_product_question',
          topic: 'gamepass'
        };
      }
      return {
        html: 'Sí: 1 mes de Xbox Game Pass Ultimate, con acceso a cientos de juegos en consola, PC y la nube. Aplican los términos de Microsoft para el código.',
        intent: 'chatbot_product_question',
        topic: 'gamepass'
      };
    }

    if (/series x|series s|xbox one|funciona (en|con) xbox|compatible con xbox/.test(q)) {
      return {
        html: 'Sí. Según la ficha de la tienda:\n• Xbox Series X|S (licencia oficial)\n• Xbox One y Xbox One S/X\n• PC con Windows 10/11 por cable USB-C',
        intent: 'chatbot_product_question',
        topic: lastTopic
      };
    }

    if (/\bpc\b|windows/.test(q)) {
      return {
        html: 'Sí, es compatible con Windows 10 y 11 vía cable USB-C.',
        intent: 'chatbot_product_question',
        topic: lastTopic
      };
    }

    if (/inalambrico|inalámbrico|bluetooth|bateria|batería|pila/.test(q) || /tiene cable/.test(q)) {
      return {
        html: 'No es inalámbrico. Es un mando con cable USB-C, sin batería interna: conectas y juegas.',
        intent: 'chatbot_product_question',
        topic: lastTopic
      };
    }

    if (/vibracion|vibración/.test(q)) {
      return {
        html: 'Sí. Con el software gratuito GameSir Nexus puedes configurar, entre otras cosas, la vibración, el mapeo de botones y las zonas muertas.',
        intent: 'chatbot_product_question',
        topic: lastTopic
      };
    }

    if (/botones traseros|paddles|botones atras/.test(q)) {
      return {
        html: 'Sí, dos botones traseros remapeables, con seguro rápido para activarlos o desactivarlos.',
        intent: 'chatbot_product_question',
        topic: lastTopic
      };
    }

    if (/anti-?drift|drift|hall effect/.test(q)) {
      return {
        html: 'Los joysticks y gatillos usan Hall Effect (sensores magnéticos). En la tienda lo presentamos como una forma de reducir el desgaste asociado al drift. Ningún control es indestructible.',
        intent: 'chatbot_product_question',
        topic: lastTopic
      };
    }

    if (/mejor que el (control|mando) original|mejor que xbox/.test(q)) {
      return {
        html: 'Es una opción pensada para quienes buscan extras frente al control estándar: Hall Effect, botones traseros y el Game Pass de la oferta. La mejor elección depende de cómo juegas.',
        intent: 'chatbot_product_question',
        topic: lastTopic
      };
    }

    if (/es bueno|vale la pena|lo recomiendas/.test(q)) {
      return {
        html: 'Sí, es una opción muy enfocada en gaming, sobre todo si buscas un control con extras frente al estándar.\nSi quieres, te cuento sus ventajas principales o te ayudo a comprarlo.',
        intent: 'chatbot_purchase_intent',
        topic: 'precio'
      };
    }

    if (/garantia|garantía/.test(q)) {
      return {
        html: 'Para no inventarte condiciones, te dejo la política de la tienda:\n<a href="' + (cfg.returnsUrl || '/pages/politica-de-devoluciones') + '">Devoluciones</a>\nSi tu caso es puntual, un asesor te confirma.\n' + waButton('asesor'),
        intent: 'chatbot_question',
        topic: 'asesor'
      };
    }

    if (/donde estan|dónde están|ubicados|medellin|bogota|dirección/.test(q)) {
      return {
        html: 'Atendemos compras en línea con envío nacional en Colombia. Para una dirección física exacta, un asesor te confirma.\n' + waButton('asesor'),
        intent: 'chatbot_question',
        topic: 'asesor'
      };
    }

    if (/comprar|quiero (el mando|este|uno)|hacer el pedido|comprarlo/.test(q)) {
      lastTopic = 'precio';
      var line = price ? 'El ' + product + ' está en ' + price + '.' : '';
      return {
        html: '¡Perfecto! 🎮🔥\n' + line + '\nPuedes continuar aquí: <a href="' + buyUrl + '">Ir a comprar</a>\nSi prefieres, hablas directo con un asesor.\n' + waButton('precio'),
        intent: 'chatbot_purchase_intent',
        topic: 'precio'
      };
    }

    return { html: unknown(), intent: 'chatbot_question', topic: lastTopic };
  }

  function handleUser(text, opts) {
    var trimmed = String(text || '').trim();
    if (!trimmed) return;
    addMsg(trimmed.replace(/</g, '&lt;'), 'user');
    track('chatbot_message');
    var res = answer(trimmed);
    lastTopic = res.topic || lastTopic;
    addMsg(res.html, 'bot');
    if (res.intent) track(res.intent);
    if (res.openWa && WHATSAPP_NUMBER && !(opts && opts.skipOpen)) {
      window.open(waUrl(lastTopic), '_blank', 'noopener');
      track('chatbot_whatsapp_click');
    }
  }

  function open() {
    if (onCheckoutSurface()) {
      if (WHATSAPP_NUMBER) window.open(waUrl('pedido'), '_blank', 'noopener');
      return;
    }
    root.hidden = false;
    if (!greeted) {
      greeted = true;
      addMsg(greeting(), 'bot');
    }
    track('chatbot_open');
    document.querySelectorAll('.gg-alex-fab').forEach(function (el) {
      el.hidden = true;
    });
    setTimeout(function () { if (input) input.focus(); }, 50);
  }

  function close() {
    root.hidden = true;
    track('chatbot_close');
    document.querySelectorAll('.gg-alex-fab').forEach(function (el) {
      el.hidden = false;
    });
  }

  root.addEventListener('click', function (e) {
    var wa = e.target.closest('[data-gg-sa-wa]');
    if (wa) track('chatbot_whatsapp_click');
    if (e.target.closest('[data-gg-sa-close]')) close();
  });

  root.querySelectorAll('[data-gg-sa-chip]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var map = {
        precio: '¿Cuánto cuesta?',
        envio: '¿Hacen envíos a Colombia?',
        gamepass: '¿Incluye Game Pass?',
        xbox: '¿Es compatible con Xbox?',
        asesor: 'Quiero un asesor'
      };
      var key = btn.getAttribute('data-gg-sa-chip');
      handleUser(map[key] || btn.textContent);
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var v = input.value;
    input.value = '';
    handleUser(v);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !root.hidden) close();
  });

  window.GGSalesAssistant = { open: open, close: close };
})();
