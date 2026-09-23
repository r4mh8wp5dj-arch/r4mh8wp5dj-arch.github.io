(function () {
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var MSG = {
    ok: 'Check your inbox to confirm.',
    verify: 'One more step: Buttondown needs a quick check that you’re not a bot.',
    opened: 'Finish the check in the new tab, then check your inbox to confirm.',
    invalid: 'That email address doesn’t look right. Check it and try again.',
    network: 'Couldn’t reach the sign-up service. Check your connection and try again.',
    failed: 'Couldn’t sign you up right now. Try again in a moment.'
  };

  var boxes = [];
  document.querySelectorAll('[data-notify]').forEach(function (box) {
    boxes.push(box);
    var open = box.querySelector('[data-notify-open]');
    var form = box.querySelector('form');
    var input = form.querySelector('input[type="email"]');
    var send = form.querySelector('button[type="submit"]');
    var msg = box.querySelector('.notify-msg');
    var consent = box.querySelector('.consent');
    var verify = box.querySelector('.notify-verify');

    function say(text, kind) {
      msg.textContent = text;
      msg.className = 'notify-msg is-' + kind;
      msg.hidden = false;
    }
    function busy(on) {
      send.disabled = on;
      send.textContent = on ? 'Sending…' : 'Notify Me';
    }
    function finish(text) {
      busy(false);
      form.hidden = true;
      verify.hidden = true;
      say(text, 'ok');
    }

    open.addEventListener('click', function () {
      open.hidden = true;
      open.setAttribute('aria-expanded', 'true');
      form.hidden = false;
      consent.hidden = false;
      input.focus();
    });

    input.addEventListener('input', function () {
      input.removeAttribute('aria-invalid');
      if (!msg.classList.contains('is-ok')) msg.hidden = true;
      verify.hidden = true;
    });

    verify.addEventListener('click', function () {
      form.target = '_blank';
      HTMLFormElement.prototype.submit.call(form);
      finish(MSG.opened);
    });

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var email = input.value.trim();
      if (!EMAIL.test(email)) {
        input.setAttribute('aria-invalid', 'true');
        say(MSG.invalid, 'error');
        input.focus();
        return;
      }
      input.value = email;
      busy(true);
      fetch(form.action, {
        method: 'POST',
        body: new URLSearchParams({ email: email }),
        headers: { Accept: 'application/json' }
      }).then(function (res) {
        if (res.ok) return finish(MSG.ok);
        return res.text().then(function (body) {
          busy(false);
          if (/verification|turnstile/i.test(body)) {
            say(MSG.verify, 'info');
            verify.hidden = false;
            verify.focus();
          } else if (/not valid|invalid/i.test(body)) {
            input.setAttribute('aria-invalid', 'true');
            say(MSG.invalid, 'error');
          } else {
            say(MSG.failed, 'error');
          }
        });
      }).catch(function () {
        busy(false);
        say(MSG.network, 'error');
      });
    });
  });
  function jump(smooth) {
    var box = document.getElementById('notify');
    if (!box) return false;
    var open = box.querySelector('[data-notify-open]'), input = box.querySelector('input[type="email"]');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    box.scrollIntoView({ behavior: smooth && !reduce ? 'smooth' : 'auto', block: 'center' });
    if (open && !open.hidden) open.click();
    else if (input) input.focus({ preventScroll: true });
    return true;
  }

  document.querySelectorAll('[data-notify-jump]').forEach(function (a) {
    a.addEventListener('click', function (ev) {
      if (jump(true)) ev.preventDefault();
    });
  });
  if (location.hash === '#notify') setTimeout(function () { jump(false); }, 60);

  var params = new URLSearchParams(location.search);
  if (params.get('subscribed') === '1') {
    var hero = document.getElementById('notify');
    if (hero) {
      var m = hero.querySelector('.notify-msg');
      m.textContent = 'You\u2019re in. See you when the pit opens.';
      m.className = 'notify-msg is-ok';
      m.hidden = false;
    }
    params.delete('subscribed');
    var q = params.toString();
    history.replaceState(null, '', location.pathname + (q ? '?' + q : '') + location.hash);
  }
})();
