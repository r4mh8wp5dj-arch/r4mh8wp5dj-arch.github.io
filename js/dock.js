(function () {
  var dock = document.querySelector('.dock');
  var start = document.querySelector('.hero .cta-row'), end = document.querySelector('.end');
  if (dock && start && end && 'IntersectionObserver' in window) {
    var past = false, ahead = true;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var above = !e.isIntersecting && e.boundingClientRect.top < 0;
        if (e.target === start) past = above;
        else ahead = !e.isIntersecting && !above;
      });
      dock.classList.toggle('show', past && ahead);
    });
    io.observe(start);
    io.observe(end);
  }

  var steps = document.querySelector('.steps'), dots = document.querySelectorAll('.steps-dots i');
  if (!steps || !dots.length) return;
  var queued = false;
  function mark() {
    queued = false;
    var cards = steps.children, box = steps.getBoundingClientRect(), mid = box.left + box.width / 2;
    var best = 0, bd = Infinity;
    for (var i = 0; i < cards.length; i++) {
      var r = cards[i].getBoundingClientRect(), d = Math.abs(r.left + r.width / 2 - mid);
      if (d < bd) { bd = d; best = i; }
    }
    for (var k = 0; k < dots.length; k++) dots[k].classList.toggle('on', k === best);
  }
  steps.addEventListener('scroll', function () {
    if (!queued) { queued = true; requestAnimationFrame(mark); }
  }, { passive: true });
})();
