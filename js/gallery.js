// Photo gallery: reads photos/image-index.json (built by scripts/generate_image_index.py).
(function () {
  var ALBUMS = { all: 'All Photos', '10u': '10U', '11u': '11U', sjgiants: 'SJ Giants' };
  var PAGE = 24;
  var grid = document.getElementById('gallery'), chips = document.getElementById('albums');
  var more = document.getElementById('galMore'), lb = document.getElementById('lightbox');
  var lbImg = document.getElementById('lbImg'), lbCount = document.getElementById('lbCount');
  var all = [], list = [], shown = 0, cur = 0;

  function chip(key, count) {
    var b = document.createElement('button');
    b.type = 'button'; b.setAttribute('aria-pressed', key === 'all');
    b.innerHTML = (ALBUMS[key] || key) + '<span>' + count + '</span>';
    b.addEventListener('click', function () {
      chips.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
      select(key);
    });
    chips.appendChild(b);
  }

  function select(key) {
    list = key === 'all' ? all : all.filter(function (i) { return i.team === key; });
    grid.innerHTML = ''; shown = 0; renderMore();
  }

  function renderMore() {
    var end = Math.min(shown + PAGE, list.length);
    for (var i = shown; i < end; i++) {
      (function (idx) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'cham';
        b.setAttribute('aria-label', 'Open photo ' + (idx + 1) + ' of ' + list.length);
        var img = new Image(); img.src = '/' + list[idx].path; img.alt = ''; img.loading = 'lazy'; img.decoding = 'async';
        b.appendChild(img);
        b.addEventListener('click', function () { open(idx); });
        grid.appendChild(b);
      })(i);
    }
    shown = end;
    more.hidden = shown >= list.length;
    if (!list.length) grid.innerHTML = '<p class="news-err">No photos in this album yet.</p>';
  }

  function show() {
    lbImg.src = '/' + list[cur].path;
    lbCount.textContent = (cur + 1) + ' / ' + list.length;
  }
  function open(i) { cur = i; show(); lb.classList.add('show'); document.body.style.overflow = 'hidden'; lb.querySelector('.lb-x').focus(); }
  function close() { lb.classList.remove('show'); document.body.style.overflow = ''; }
  function step(n) { cur = (cur + n + list.length) % list.length; show(); }

  lb.querySelector('.lb-x').addEventListener('click', close);
  lb.querySelector('.lb-prev').addEventListener('click', function () { step(-1); });
  lb.querySelector('.lb-next').addEventListener('click', function () { step(1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('show')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
  });
  // swipe on phones
  var x0 = null;
  lb.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
  });
  more.querySelector('button').addEventListener('click', renderMore);

  fetch('/photos/image-index.json').then(function (r) { return r.json(); }).then(function (data) {
    all = data.images || [];
    var counts = { all: all.length };
    all.forEach(function (i) { counts[i.team] = (counts[i.team] || 0) + 1; });
    Object.keys(ALBUMS).forEach(function (k) { if (counts[k]) chip(k, counts[k]); });
    select('all');
  }).catch(function () {
    grid.innerHTML = '<p class="news-err">Photos could not be loaded right now.</p>';
  });
})();
