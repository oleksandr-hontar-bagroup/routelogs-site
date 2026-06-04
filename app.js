/* ============================================================
   RouteLogs — interactions
   ============================================================ */
document.documentElement.classList.add('js');

/* ============================================================
   Calendly configuration
   ─────────────────────────────────────────────────────────
   ▶ TO GO LIVE: replace CALENDLY_URL below with your real link,
     e.g. "https://calendly.com/your-team/demo"
   The query params just brand the popup (green accent) and hide
   the cookie banner — keep them on your real URL too.

   The Calendly assets are loaded LAZILY, only on the first
   "Request a Demo" interaction — so no third-party request is
   made on initial page load (faster first paint + privacy).
   ============================================================ */
var CALENDLY_URL = "https://calendly.com/routelogs/demo"; // <-- PLACEHOLDER: swap for your real Calendly link
var CALENDLY_ASSETS = "https://assets.calendly.com/assets/external/";
var calendlyRequested = false;

function calendlyUrl(){
  var sep = CALENDLY_URL.indexOf('?') === -1 ? '?' : '&';
  return CALENDLY_URL + sep + 'hide_gdpr_banner=1&primary_color=1faa6a';
}

/* Inject widget.css + widget.js once, then run cb when Calendly is ready. */
function loadCalendly(cb){
  if (window.Calendly){ cb(); return; }
  if (!calendlyRequested){
    calendlyRequested = true;
    var css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = CALENDLY_ASSETS + 'widget.css';
    document.head.appendChild(css);
    var js = document.createElement('script');
    js.src = CALENDLY_ASSETS + 'widget.js';
    js.async = true;
    js.onload = cb;
    js.onerror = cb; // openCalendly falls back to a new tab if the API is missing
    document.head.appendChild(js);
  } else {
    // Requested but not ready yet (rapid second click) — poll briefly.
    var n = 0;
    (function wait(){
      if (window.Calendly || n++ > 100) cb();
      else setTimeout(wait, 50);
    })();
  }
}

function openCalendly(prefill){
  loadCalendly(function(){
    if (window.Calendly && typeof window.Calendly.initPopupWidget === 'function'){
      window.Calendly.initPopupWidget({ url: calendlyUrl(), prefill: prefill || {} });
    } else {
      // Failsafe if the widget script can't load — open the scheduler in a new tab.
      window.open(CALENDLY_URL, '_blank', 'noopener');
    }
  });
  return false;
}

/* ---------- Wire "Request a Demo" buttons to Calendly ---------- */
(function initCalendly(){
  // Every link/button pointing at the demo section opens the scheduler popup.
  var triggers = document.querySelectorAll('a[href="#demo"]');
  triggers.forEach(function(el){
    // Skip in-page anchor jump; open the popup instead.
    el.addEventListener('click', function(e){ e.preventDefault(); openCalendly(); });
  });
})();

/* ---------- Route map SVG builder ---------- */
function buildRouteSVG(prefix, opts) {
  opts = opts || {};
  var pid = prefix + '-motion';
  // node coordinates
  var c = [ {x:62,y:58}, {x:62,y:150}, {x:62,y:242} ];
  var hub = {x:242, y:150};
  var lab = {x:402, y:150};
  var motion = 'M62 58 L62 150 L62 242 L242 150 L402 150';

  function clinic(p, label) {
    return '<g class="node" data-role="clinic">' +
      '<circle class="ring" cx="'+p.x+'" cy="'+p.y+'" r="17" fill="none" stroke="#34c281" stroke-width="1.5" opacity=".35"></circle>' +
      '<circle cx="'+p.x+'" cy="'+p.y+'" r="8.5" fill="#34c281"></circle>' +
      '<circle cx="'+p.x+'" cy="'+p.y+'" r="3.2" fill="#0a2b4d"></circle>' +
      '<text x="'+(p.x+16)+'" y="'+(p.y+4)+'" fill="#cdd9e8" font-family="IBM Plex Mono, monospace" font-size="11">'+label+'</text>' +
      '</g>';
  }

  var svg = '<svg viewBox="0 0 470 300" role="img" aria-label="Route from clinics through a transfer hub to the laboratory">';
  // connector routes
  svg += '<g fill="none" stroke-linecap="round">';
  svg += '<path class="route" d="M62 58 L62 242" stroke="rgba(255,255,255,.12)" stroke-width="2"></path>';
  svg += '<path class="route" data-leg="collect" d="M62 58 C150 58 165 150 242 150" stroke="#34c281" stroke-width="2.5" stroke-dasharray="5 6" opacity=".6"></path>';
  svg += '<path class="route" data-leg="collect" d="M62 150 L242 150" stroke="#34c281" stroke-width="2.5" stroke-dasharray="5 6" opacity=".6"></path>';
  svg += '<path class="route" data-leg="collect" d="M62 242 C150 242 165 150 242 150" stroke="#34c281" stroke-width="2.5" stroke-dasharray="5 6" opacity=".6"></path>';
  svg += '<path class="route" data-leg="deliver" d="M242 150 L402 150" stroke="#5b9bd5" stroke-width="2.5" stroke-dasharray="5 6" opacity=".7"></path>';
  svg += '</g>';

  // clinics
  svg += clinic(c[0], 'Clinic A');
  svg += clinic(c[1], 'Clinic B');
  svg += clinic(c[2], 'Clinic C');

  // hub
  svg += '<g class="node" data-role="hub">' +
    '<rect class="ring" x="'+(hub.x-22)+'" y="'+(hub.y-22)+'" width="44" height="44" rx="11" fill="none" stroke="#5b9bd5" stroke-width="1.5" opacity=".35"></rect>' +
    '<rect x="'+(hub.x-14)+'" y="'+(hub.y-14)+'" width="28" height="28" rx="7" fill="#2a6299"></rect>' +
    '<path d="M'+(hub.x-7)+' '+(hub.y+5)+' v-7 l7-4 7 4 v7 z" fill="none" stroke="#cfe2f5" stroke-width="1.6" stroke-linejoin="round"></path>' +
    '<text x="'+hub.x+'" y="'+(hub.y+34)+'" text-anchor="middle" fill="#cdd9e8" font-family="IBM Plex Mono, monospace" font-size="11">Transfer hub</text>' +
    '</g>';

  // lab
  svg += '<g class="node" data-role="lab">' +
    '<circle class="ring" cx="'+lab.x+'" cy="'+lab.y+'" r="21" fill="none" stroke="#fff" stroke-width="1.5" opacity=".35"></circle>' +
    '<circle cx="'+lab.x+'" cy="'+lab.y+'" r="14" fill="#fff"></circle>' +
    '<path d="M'+(lab.x-4)+' '+(lab.y-6)+' v5 l-4 7 a1 1 0 0 0 1 1.5 h10 a1 1 0 0 0 1-1.5 l-4-7 v-5 z" fill="none" stroke="#0d2a4a" stroke-width="1.5" stroke-linejoin="round"></path>' +
    '<text x="'+lab.x+'" y="'+(lab.y+34)+'" text-anchor="middle" fill="#cdd9e8" font-family="IBM Plex Mono, monospace" font-size="11">Laboratory</text>' +
    '</g>';

  // courier dot
  svg += '<g class="courier">' +
    '<circle r="11" fill="#1faa6a" opacity=".25"><animateMotion dur="7s" repeatCount="indefinite" rotate="0" keyPoints="0;1" keyTimes="0;1" calcMode="linear" path="'+motion+'"></animateMotion></circle>' +
    '<circle r="6" fill="#fff" stroke="#1faa6a" stroke-width="2.5"><animateMotion dur="7s" repeatCount="indefinite" path="'+motion+'"></animateMotion></circle>' +
    '</g>';

  svg += '</svg>';
  return svg;
}

(function initMaps(){
  var hero = document.getElementById('heroMap');
  if (hero) hero.innerHTML = buildRouteSVG('hero');
  var rm = document.getElementById('routemap');
  if (rm) rm.innerHTML = buildRouteSVG('how');
})();

/* ---------- How it works step interaction ---------- */
(function initSteps(){
  var steps = Array.prototype.slice.call(document.querySelectorAll('#steps .step'));
  var rm = document.getElementById('routemap');
  var capLbl = document.getElementById('capLbl');
  var capTxt = document.getElementById('capTxt');
  if (!steps.length || !rm) return;

  var data = {
    1: { roles: ['clinic'], legs: ['collect'], lbl: 'Step 01 · Collection', txt: 'Clinics across the territory ready blood, urine, and other samples for pickup on an agreed schedule.' },
    2: { roles: ['clinic'], legs: ['collect'], courier: true, lbl: 'Step 02 · Optimized route', txt: 'A courier follows the automatically optimized route, collecting from every point in the most efficient order.' },
    3: { roles: ['hub','lab'], legs: ['deliver'], lbl: 'Step 03 · Delivery', txt: 'Samples are delivered to a transfer hub or taken directly to the laboratory for processing.' },
    4: { roles: ['hub'], legs: [], lbl: 'Step 04 · Consolidation', txt: 'At transfer hubs, samples from multiple couriers and dispatchers are consolidated and forwarded onward.' }
  };

  function select(n) {
    steps.forEach(function(s){ s.setAttribute('aria-selected', s.dataset.step === String(n) ? 'true' : 'false'); });
    var d = data[n];
    // dim nodes not in focus
    rm.querySelectorAll('.node').forEach(function(node){
      var on = d.roles.indexOf(node.getAttribute('data-role')) !== -1;
      node.classList.toggle('dim', !on);
    });
    // route legs
    rm.querySelectorAll('.route[data-leg]').forEach(function(p){
      var on = d.legs.indexOf(p.getAttribute('data-leg')) !== -1;
      p.style.opacity = on ? '0.95' : '0.18';
      p.style.strokeWidth = on ? '3' : '2';
    });
    var courier = rm.querySelector('.courier');
    if (courier) courier.style.opacity = d.courier ? '1' : '0.25';
    capLbl.textContent = d.lbl;
    capTxt.textContent = d.txt;
  }

  steps.forEach(function(s){
    s.addEventListener('click', function(){ select(s.dataset.step); restart(); });
  });

  // auto-advance
  var current = 1, timer;
  function tick(){ current = current % 4 + 1; select(current); }
  function restart(){ clearInterval(timer); current = parseInt(document.querySelector('#steps .step[aria-selected="true"]').dataset.step,10); timer = setInterval(tick, 3600); }
  select(1); restart();
})();

/* ---------- Sticky header ---------- */
(function initHeader(){
  var h = document.getElementById('siteHeader');
  function onScroll(){ h.classList.toggle('scrolled', window.scrollY > 12); }
  window.addEventListener('scroll', onScroll, { passive:true });
  onScroll();
})();

/* ---------- Scroll reveal ---------- */
(function initReveal(){
  var els = document.querySelectorAll('.reveal');
  function revealAll(){ els.forEach(function(e){ e.classList.add('in'); }); }
  if (!('IntersectionObserver' in window)) { revealAll(); return; }
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  els.forEach(function(e){ io.observe(e); });
  // Failsafe: if IO never reports intersection (offscreen / print / capture contexts),
  // reveal everything so content is never permanently invisible.
  setTimeout(function(){
    if (!document.querySelector('.reveal.in')) revealAll();
  }, 700);
})();

/* ---------- Count-up KPIs ---------- */
(function initCounters(){
  var dash = document.getElementById('dash');
  if (!dash) return;
  var started = false;
  function run(){
    if (started) return; started = true;
    dash.querySelectorAll('[data-count]').forEach(function(el){
      var target = parseInt(el.getAttribute('data-count'), 10);
      var dur = 1100, t0 = performance.now();
      function step(now){
        var p = Math.min((now - t0) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased);
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }
  var io = new IntersectionObserver(function(ent){
    ent.forEach(function(e){ if (e.isIntersecting) { run(); io.disconnect(); } });
  }, { threshold: 0.4 });
  io.observe(dash);
})();

/* ---------- Live dashboard ticks ---------- */
(function initDashLive(){
  var upd = document.getElementById('dashUpd');
  var checks = document.getElementById('checks');
  if (!upd || !checks) return;
  var secs = 2;
  setInterval(function(){ secs = (secs >= 58) ? 1 : secs + 3; upd.textContent = 'updated ' + secs + 's ago'; }, 2600);

  // Rotate states so the board always shows a realistic mix (never drains to all-collected)
  var rows = Array.prototype.slice.call(checks.querySelectorAll('.check'));
  var META = {
    collected: { cls: 'collected', label: 'Collected' },
    transit:   { cls: 'transit',   label: 'In transit' },
    delayed:   { cls: 'delayed',   label: 'Delayed' },
    pending:   { cls: 'pending',   label: 'Pending' }
  };
  var cycle = ['collected','transit','delayed','pending'];
  var offset = 0;
  function applyRow(row, key){
    var m = META[key];
    cycle.forEach(function(c){ row.classList.remove(c); });
    row.classList.add(m.cls);
    var badge = row.querySelector('.badge');
    badge.className = 'badge ' + m.cls;
    badge.innerHTML = '<span class="d"></span> ' + m.label;
  }
  setInterval(function(){
    // advance one row to its next state, keeping the overall set varied
    var idx = offset % rows.length;
    var row = rows[idx];
    var curKey = cycle.find(function(c){ return row.classList.contains(c); }) || 'pending';
    var next = cycle[(cycle.indexOf(curKey) + 1) % cycle.length];
    applyRow(row, next);
    row.style.background = 'rgba(31,170,106,.07)';
    setTimeout(function(){ row.style.background = ''; }, 900);
    offset++;
  }, 3200);
})();

/* ---------- Temperature chart ---------- */
(function initTemp(){
  var line = document.getElementById('tempLine');
  var dot = document.getElementById('tempDot');
  var now = document.getElementById('tempNow');
  if (!line) return;
  var W = 320, N = 26, vals = [];
  for (var k = 0; k < N; k++) vals.push(4 + (Math.random() - 0.5) * 2.2);
  function tempToY(v){ // 2C -> y78 (bottom of band), 8C -> y34 (top); map full 0-12 to 100-12
    return 100 - (v / 12) * 88 - 6;
  }
  function render(){
    var step = W / (N - 1), d = '';
    for (var i = 0; i < N; i++){
      var x = i * step, y = tempToY(vals[i]);
      d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';
    }
    line.setAttribute('d', d.trim());
    var lastY = tempToY(vals[N-1]);
    dot.setAttribute('cx', W); dot.setAttribute('cy', lastY.toFixed(1));
    if (now) now.textContent = vals[N-1].toFixed(1);
  }
  render();
  setInterval(function(){
    vals.shift();
    var nv = 4 + (Math.random() - 0.5) * 2.4;
    vals.push(Math.max(2.4, Math.min(7.6, nv)));
    render();
  }, 2200);
})();

/* ---------- ROI calculator ---------- */
(function initROI(){
  var disp = document.getElementById('roiDisp');
  if (!disp) return;
  var hrs = document.getElementById('roiHrs');
  var rateNum = document.getElementById('roiRate');
  var rateRange = document.getElementById('roiRateRange');

  var dispVal = document.getElementById('roiDispVal');
  var hrsVal = document.getElementById('roiHrsVal');

  var outHours = document.getElementById('roiHours');
  var outDays = document.getElementById('roiDays');
  var outCostM = document.getElementById('roiCostM');
  var outCostY = document.getElementById('roiCostY');

  var WEEKS = 4.33;        // avg weeks per month
  var AUTOMATION = 0.75;   // share of manual planning time RouteLogs reclaims

  function fmt(n){ return Math.round(n).toLocaleString('en-US'); }

  function render(){
    var d = parseInt(disp.value, 10) || 0;
    var h = parseInt(hrs.value, 10) || 0;
    var r = parseFloat(rateNum.value) || 0;

    dispVal.textContent = d;
    hrsVal.innerHTML = h + '<small> h</small>';

    var hoursMonth = d * h * WEEKS * AUTOMATION;
    var daysMonth = hoursMonth / 8;
    var costMonth = hoursMonth * r;

    outHours.textContent = fmt(hoursMonth);
    outDays.textContent = fmt(daysMonth);
    outCostM.textContent = fmt(costMonth);
    outCostY.textContent = fmt(costMonth * 12);
  }

  disp.addEventListener('input', render);
  hrs.addEventListener('input', render);
  // keep the rate number box and its slider in sync
  rateRange.addEventListener('input', function(){ rateNum.value = rateRange.value; render(); });
  rateNum.addEventListener('input', function(){
    var v = Math.max(0, Math.min(200, parseFloat(rateNum.value) || 0));
    if (v >= rateRange.min && v <= rateRange.max) rateRange.value = v;
    render();
  });

  render();
})();

(function initForm(){
  var form = document.getElementById('demoForm');
  if (!form) return;
  var success = document.getElementById('formSuccess');
  var fields = {
    name: { wrap: document.getElementById('f-name'), input: document.getElementById('in-name'), test: function(v){ return v.trim().length >= 2; } },
    company: { wrap: document.getElementById('f-company'), input: document.getElementById('in-company'), test: function(v){ return v.trim().length >= 2; } },
    email: { wrap: document.getElementById('f-email'), input: document.getElementById('in-email'), test: function(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); } }
  };

  function validate(key){
    var f = fields[key];
    var ok = f.test(f.input.value);
    f.wrap.classList.toggle('invalid', !ok);
    return ok;
  }
  Object.keys(fields).forEach(function(key){
    fields[key].input.addEventListener('input', function(){
      if (fields[key].wrap.classList.contains('invalid')) validate(key);
    });
    fields[key].input.addEventListener('blur', function(){ if (fields[key].input.value) validate(key); });
  });

  form.addEventListener('submit', function(e){
    e.preventDefault();
    var allOk = true, firstBad = null;
    Object.keys(fields).forEach(function(key){
      var ok = validate(key);
      if (!ok && !firstBad) firstBad = fields[key].input;
      allOk = allOk && ok;
    });
    if (!allOk) { if (firstBad) firstBad.focus(); return; }
    var fullName = fields.name.input.value.trim();
    var first = fullName.split(' ')[0];
    var email = fields.email.input.value.trim();
    var company = fields.company.input.value.trim();
    var prefill = {
      name: fullName,
      email: email,
      customAnswers: { a1: company }   // maps to your first Calendly custom question, if set
    };
    document.getElementById('successName').textContent = first || 'there';
    form.style.display = 'none';
    success.classList.add('show');
    openCalendly(prefill);

    // allow re-opening the scheduler from the confirmation state
    var reopen = document.getElementById('reopenCal');
    if (reopen) reopen.onclick = function(ev){ ev.preventDefault(); openCalendly(prefill); };
  });
})();
