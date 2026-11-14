// Registration form (signup.html #register).
// Validates on the page, then posts the answers to the Google Form named in
// _data/registration.yml so they land in its response sheet. Google doesn't let
// other sites read its reply ("no-cors"), so a completed request = success.
(function () {
  var form = document.getElementById('regForm');
  if (!form) return;
  var done = document.getElementById('rfDone');
  var err = document.getElementById('rfError');
  var dob = document.getElementById('rfDob');
  var other = document.getElementById('rfHeardOther');
  var heard = form.getAttribute('data-heard');
  var btn = form.querySelector('button[type="submit"]');
  var btnHtml = btn.innerHTML;

  // Show the "Other" text box only when Other is picked.
  form.addEventListener('change', function (e) {
    if (e.target.name === heard) {
      var isOther = e.target.value === '__other_option__';
      other.hidden = !isOther;
      if (isOther) other.focus();
    }
    var f = e.target.closest('.rf-field, .rf-group');
    if (f) f.classList.remove('bad');
  });
  form.addEventListener('input', function (e) {
    var f = e.target.closest('.rf-field');
    if (f) f.classList.remove('bad');
  });

  // Suggest the age group from the birth date (cutoffs from _data/tryouts.yml).
  // Picks the matching 11U/12U button unless the parent already chose one themselves.
  var hint = document.getElementById('rfDobHint');
  var divName = form.getAttribute('data-division');
  var cuts = [];
  try { cuts = JSON.parse(form.getAttribute('data-cutoffs')); } catch (e) {}
  var autoPicked = false;
  form.addEventListener('change', function (e) {
    if (e.target.name === divName) autoPicked = false;
  });
  dob.addEventListener('change', function () {
    hint.className = 'rf-hint';
    hint.textContent = '';
    if (!dob.value || !cuts.length) return;
    var born = new Date(dob.value + 'T12:00:00'), match = null;
    for (var i = 0; i < cuts.length; i++) {
      if (born >= new Date(cuts[i].on + 'T00:00:00')) { match = cuts[i]; break; }
    }
    if (!match) {
      if (autoPicked) {
        var picked = form.querySelector('input[name="' + divName + '"]:checked');
        if (picked) picked.checked = false;
        autoPicked = false;
      }
      hint.classList.add('warn');
      hint.textContent = 'Born before ' + cuts[cuts.length - 1].label + ', which is older than our ' +
        cuts.map(function (c) { return c.d; }).join(' and ') + ' cutoffs. Mention it in the comments and a coach will follow up.';
      return;
    }
    hint.classList.add('ok');
    hint.textContent = 'Eligible for ' + match.d + ' (born on or after ' + match.label + ').';
    var current = form.querySelector('input[name="' + divName + '"]:checked');
    if (!current || autoPicked) {
      var pill = form.querySelector('input[name="' + divName + '"][value="' + match.d.toLowerCase() + '"]');
      if (pill) { pill.checked = true; autoPicked = true; pill.closest('.rf-group').classList.remove('bad'); }
    } else if (current.value !== match.d.toLowerCase()) {
      var order = cuts.map(function (c) { return c.d.toLowerCase(); }); // youngest group first
      hint.textContent += order.indexOf(current.value) > order.indexOf(match.d.toLowerCase())
        ? ' You picked ' + current.value.toUpperCase() + ' (playing up). That works, a coach will confirm.'
        : ' You picked ' + current.value.toUpperCase() + ', but this player is too old for it. Please choose ' + match.d + '.';
      if (hint.textContent.indexOf('too old') > -1) hint.className = 'rf-hint warn';
    }
  });

  function invalid() {
    var bad = [];
    form.querySelectorAll('input[required]').forEach(function (el) {
      if (!el.checkValidity()) bad.push(el.closest('.rf-field'));
    });
    form.querySelectorAll('.rf-group[data-required]').forEach(function (g) {
      if (!g.querySelector('input:checked')) bad.push(g);
    });
    if (dob.value) {
      var y = +dob.value.slice(0, 4), now = new Date().getFullYear();
      if (y < now - 25 || y > now) bad.push(dob.closest('.rf-field'));
    }
    return bad;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    form.querySelectorAll('.bad').forEach(function (el) { el.classList.remove('bad'); });
    var bad = invalid();
    if (bad.length) {
      bad.forEach(function (el) { el.classList.add('bad'); });
      err.textContent = 'Please fill in the highlighted fields.';
      err.hidden = false;
      bad[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
      var first = bad[0].querySelector('input, textarea');
      if (first) first.focus({ preventScroll: true });
      return;
    }
    err.hidden = true;

    var data = new URLSearchParams(new FormData(form));
    var d = dob.value.split('-'); // yyyy-mm-dd
    var key = form.getAttribute('data-dob');
    data.append(key + '_year', d[0]);
    data.append(key + '_month', String(+d[1]));
    data.append(key + '_day', String(+d[2]));
    if (data.get(heard) === '__other_option__') {
      data.append(heard + '.other_option_response', other.value.trim() || 'Other');
    }

    btn.disabled = true;
    btn.textContent = 'Sending…';
    fetch(form.getAttribute('data-action'), { method: 'POST', mode: 'no-cors', body: data })
      .then(function () {
        form.hidden = true;
        done.hidden = false;
        done.focus();
        done.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (window.gtag) gtag('event', 'registration_submit');
      })
      .catch(function () {
        err.innerHTML = 'Something went wrong sending your registration. Please try again, or use the Google Form link below.';
        err.hidden = false;
      })
      .then(function () {
        btn.disabled = false;
        btn.innerHTML = btnHtml;
      });
  });

  document.getElementById('rfAgain').addEventListener('click', function () {
    // Keep the parent's details, clear the player's.
    ['rfPlayer', 'rfDob', 'rfComments'].forEach(function (id) { document.getElementById(id).value = ''; });
    hint.textContent = ''; hint.className = 'rf-hint'; autoPicked = false;
    form.querySelectorAll('.rf-group input:checked').forEach(function (el) { el.checked = false; });
    other.hidden = true; other.value = '';
    done.hidden = true;
    form.hidden = false;
    document.getElementById('rfPlayer').focus();
  });
})();
