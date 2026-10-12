(function () {
  var form = document.querySelector('[data-beta]');
  if (!form) return;
  var input = form.querySelector('input[type="email"]');
  var button = form.querySelector('button');
  var msg = form.querySelector('.beta-msg');
  var valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function say(text, kind) {
    msg.textContent = text;
    msg.className = 'beta-msg' + (kind ? ' ' + kind : '');
  }

  input.addEventListener('input', function () {
    if (msg.classList.contains('is-bad')) say('');
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = input.value.trim();
    if (!valid.test(email)) {
      say(form.dataset.bad, 'is-bad');
      input.setAttribute('aria-invalid', 'true');
      input.focus();
      return;
    }
    input.removeAttribute('aria-invalid');
    button.disabled = true;
    input.disabled = true;
    say(form.dataset.busy);
    var data = new FormData(form);
    data.set('email', email);
    data.set('language', document.documentElement.lang || 'en');
    fetch(form.action, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
      .then(function (res) {
        if (!res.ok) throw new Error(String(res.status));
        form.classList.add('is-done');
        button.textContent = form.dataset.done;
        say(form.dataset.ok, 'is-ok');
      })
      .catch(function () {
        button.disabled = false;
        input.disabled = false;
        say(form.dataset.fail, 'is-bad');
      });
  });
})();
