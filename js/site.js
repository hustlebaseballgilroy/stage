// Hustle Baseball — shared site behavior (every page loads this).
(function () {
  // ---- footer year ----
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // ---- highlight the current page in the menu ----
  var here = location.pathname.replace(/\/index\.html$/, '/').replace(/\/$/, '/') || '/';
  document.querySelectorAll('nav.main a').forEach(function (a) {
    var p = new URL(a.href, location.href).pathname;
    if (p === here) a.setAttribute('aria-current', 'page');
  });

  // ---- mobile menu ----
  var burger = document.querySelector('.burger'), nav = document.getElementById('mainnav');
  if (burger && nav) {
    var close = function () { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); burger.textContent = 'Menu'; };
    burger.addEventListener('click', function () {
      var o = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', o); burger.textContent = o ? 'Close' : 'Menu';
    });
    nav.addEventListener('click', function (e) { if (e.target.tagName === 'A') close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  // ---- flip cards ----
  document.querySelectorAll('.fcoach').forEach(function (b) {
    b.addEventListener('click', function () { b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true'); });
  });

  // ---- tryouts: hide date-specific bits once the tryout date has passed ----
  var tEl = document.querySelector('[data-tryout-date]');
  if (tEl) {
    var tDate = tEl.getAttribute('data-tryout-date');               // YYYY-MM-DD
    var endOfDay = new Date(tDate + 'T23:59:59');
    if (!isNaN(endOfDay) && new Date() > endOfDay) document.documentElement.classList.add('tryouts-past');
  }

  // ---- tryouts: Add to Calendar (.ics) ----
  var block = document.querySelector('.tryout-block');
  var icsLink = document.querySelector('.js-ics');
  if (block && icsLink && block.dataset.tryoutDate) {
    var d = block.dataset, day = d.tryoutDate.replace(/-/g, '');
    var t = function (hm) { return hm.replace(':', '') + '00'; };
    var esc = function (s) { return String(s).replace(/([,;\\])/g, '\\$1'); };
    var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Hustle Baseball//Tryouts//EN', 'BEGIN:VEVENT',
      'UID:hb-tryouts-' + day + '@hustlebaseballgilroy.org', 'DTSTAMP:' + day + 'T000000Z',
      'DTSTART;TZID=America/Los_Angeles:' + day + 'T' + t(d.start),
      'DTEND;TZID=America/Los_Angeles:' + day + 'T' + t(d.end),
      'SUMMARY:' + esc('Hustle Baseball Tryouts (' + d.divisions + ')'),
      'LOCATION:' + esc(d.venue + ', ' + d.address),
      'DESCRIPTION:' + esc('Bring: ' + d.equipment + '. Register: ' + d.email),
      'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    icsLink.href = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics);
  }

  // ---- tryouts: division finder ----
  var fres = document.getElementById('fres'), dob = document.getElementById('dob');
  if (fres && dob) {
    var cut = [];
    try { cut = JSON.parse(fres.getAttribute('data-cutoffs')); } catch (e) {}
    dob.addEventListener('input', function () {
      if (!dob.value) return;
      var born = new Date(dob.value + 'T12:00:00');
      var cls = '', tag = '—',
        msg = 'Older than the current age cutoffs. Email info@hustlebaseballgilroy.org and we can point you in the right direction.';
      for (var i = 0; i < cut.length; i++) {
        if (born >= new Date(cut[i].on + 'T00:00:00')) {
          cls = i === 0 ? 'u11' : 'u12'; tag = cut[i].d;
          msg = 'Eligible for ' + cut[i].d + ' (born on or after ' + cut[i].label + ').';
          break;
        }
      }
      fres.className = 'f-res ' + cls;
      fres.innerHTML = '<b>' + tag + '</b><span>' + msg + '</span>';
    });
  }
})();
