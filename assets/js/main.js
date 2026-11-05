// main.js - shared logic for all pages.
// Each init function runs only if its page elements exist.

// Shortcuts for querying the DOM
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// Date helpers
const parseDate = d => { const [y, m, dd] = d.split("-").map(Number); return new Date(y, m - 1, dd); };

const fmtDate = d => { const t = parseDate(d); return `${DAYS[t.getDay()]} ${t.getDate()} ${MONTHS[t.getMonth()]} ${t.getFullYear()}`; };

const pad = n => String(n).padStart(2, "0");

// Safe localStorage wrapper (used by the bonus features)
const store = {
  get(k, def = "") { try { return localStorage.getItem(k) ?? def; } catch (_) { return def; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (_) { } },
  del(k) { try { localStorage.removeItem(k); } catch (_) { } }
};
const PREF_KEY = "mahfil_pref_cat";
const THEME_KEY = "mahfil_theme";
const BOOK_KEY = "mahfil_bookings";

const getBookings = () => { try { return JSON.parse(store.get(BOOK_KEY, "{}")) || {}; } catch (_) { return {}; } };

// Badge text: today / tomorrow / in N days
const daysFromToday = d => Math.round((parseDate(d) - TODAY) / 86400000);

function whenLabel(e) {
  const n = daysFromToday(e.date);
  if (n === 0) return { text: "اليوم", cls: "today" };
  if (n === 1) return { text: "غدًا", cls: "soon" };
  if (n === 2) return { text: "بعد يومين", cls: "soon" };
  if (n > 2 && n <= 7) return { text: `بعد ${n} أيام`, cls: "soon" };
  return null;
}

// Builds one event card (Bootstrap Card)
function cardHTML(e) {
  const c = CATS[e.cat], t = parseDate(e.date), w = whenLabel(e);
  return `<div class="col"><article class="card ev-card" style="--c:${c.color}">
    <a class="ev-img" href="event.html?id=${e.id}" aria-label="${e.title}">
      <img class="card-img-top" src="assets/img/ev${e.id}.svg" alt="ملصق فعالية ${e.title}" loading="lazy">
      ${w ? `<span class="badge when-badge ${w.cls}">${w.text}</span>` : ""}
      <span class="ev-date"><b>${t.getDate()}</b><i>${MONTHS[t.getMonth()]}</i></span>
    </a>
    <div class="card-body ev-body">
      <span class="badge cat-badge" style="--c:${c.color}"><i class="bi ${c.icon}"></i> ${e.cat}</span>
      <h3 class="card-title"><a href="event.html?id=${e.id}">${e.title}</a></h3>
      <ul class="ev-meta"><li><i class="bi bi-geo-alt"></i>${e.place}</li><li><i class="bi bi-clock"></i>${e.time}</li></ul>
      <p class="card-text">${e.short}</p>
      <a class="btn btn-ink btn-sm px-3" href="event.html?id=${e.id}">التفاصيل <i class="bi bi-arrow-left"></i></a>
    </div></article></div>`;
}

// ---------- Home page ----------
function initHome() {
  const root = $("#featSlider");
  if (!root) return;

  // Featured slider
  const feats = EVENTS.filter(e => e.featured);
  const slidesBox = $(".slides", root);
  slidesBox.innerHTML = feats.map((e, i) => {
    const c = CATS[e.cat], t = parseDate(e.date), w = whenLabel(e);
    return `<div class="slide" role="group" aria-roledescription="شريحة" aria-label="${i + 1} من ${feats.length}">
      <div class="slide-inner">
        <div class="slide-media"><img src="assets/img/ev${e.id}.svg" alt="ملصق ${e.title}">
          <span class="badge cat-badge tag" style="--c:${c.color};background:#fffdf8!important"><i class="bi ${c.icon}"></i> ${e.cat}</span>
          ${w ? `<span class="badge when-badge ${w.cls}">${w.text}</span>` : ""}</div>
        <div class="slide-info">
          <div class="big-num">${pad(t.getDate())}<small>${MONTHS[t.getMonth()]}<br>${DAYS[t.getDay()]}</small></div>
          <h3>${e.title}</h3>
          <div class="slide-meta"><span><i class="bi bi-geo-alt"></i> ${e.place}</span><span><i class="bi bi-clock"></i> ${e.time}</span></div>
          <p>${e.short}</p>
          <div><a class="btn btn-gold" href="event.html?id=${e.id}">تفاصيل الفعالية <i class="bi bi-arrow-left"></i></a></div>
        </div>
      </div></div>`;
  }).join("");

  const slides = $$(".slide", root);
  $(".sl-dots-list", root).innerHTML = feats.map((_, i) => `<button class="sl-dot" aria-label="الشريحة ${i + 1}">${pad(i + 1)}</button>`).join("");
  const dots = $$(".sl-dot", root);
  let cur = 0, timer;

  // Show slide n (wraps around)
  function go(n) {
    cur = (n + slides.length) % slides.length;
    slides.forEach((s, k) => { s.classList.toggle("active", k === cur); s.setAttribute("aria-hidden", k !== cur); });
    dots.forEach((d, k) => d.classList.toggle("on", k === cur));
  }

  // Autoplay with setTimeout
  function play() { clearTimeout(timer); timer = setTimeout(function () { go(cur + 1); play(); }, 6000); }

  function stop() { clearTimeout(timer); }

  $(".sl-next", root).addEventListener("click", () => { go(cur + 1); play(); });
  $(".sl-prev", root).addEventListener("click", () => { go(cur - 1); play(); });
  dots.forEach((d, k) => d.addEventListener("click", () => { go(k); play(); }));

  root.addEventListener("mouseenter", stop);
  root.addEventListener("mouseleave", () => { go(cur); play(); });
  go(0); play();

  // Quick categories (the saved preference gets a badge)
  const pref = store.get(PREF_KEY);
  $("#catList").innerHTML = Object.entries(CATS).map(([name, c]) => {
    const n = EVENTS.filter(e => e.cat === name).length;
    return `<a class="cat-pill" style="--c:${c.color}" href="events.html?cat=${encodeURIComponent(name)}">
      <span class="dot"></span><i class="bi ${c.icon}"></i><span>${name}</span>
      <span class="badge rounded-pill count">${n}</span>
      ${name === pref ? '<span class="badge pref-badge"><i class="bi bi-star-fill"></i> تفضيلك</span>' : ""}</a>`;
  }).join("");

  // Latest events: the 6 newest
  $("#latestGrid").innerHTML = [...EVENTS].sort((a, b) => b.id - a.id).slice(0, 6).map(cardHTML).join("");

  // Repeat the words so the strip loops
  $("#marquee").innerHTML = Object.keys(CATS).map(k => `<span>${k}</span>`).join("").repeat(4);
}

// ---------- Events page: search and filters ----------
function initEvents() {
  const grid = $("#eventsGrid");
  if (!grid) return;

  const q = $("#fQ"), cat = $("#fCat"), place = $("#fPlace"), from = $("#fFrom"), to = $("#fTo");

  cat.innerHTML += Object.keys(CATS).map(c => `<option>${c}</option>`).join("");
  place.innerHTML += PLACES.map(p => `<option>${p}</option>`).join("");

  // Initial category: from the URL, otherwise the saved preference
  const param = new URLSearchParams(location.search).get("cat");
  const saved = store.get(PREF_KEY);
  if (param && CATS[param]) cat.value = param;
  else if (saved && CATS[saved]) cat.value = saved;

  // Filter, sort by date, then draw the cards
  function render() {
    const term = q.value.trim();

    let list = EVENTS.filter(e =>
      (!term || (e.title + e.short + e.place + e.cat).includes(term)) &&
      (!cat.value || e.cat === cat.value) &&
      (!place.value || e.place === place.value) &&
      (!from.value || e.date >= from.value) &&
      (!to.value || e.date <= to.value));

    list.sort((a, b) => a.date.localeCompare(b.date));

    if (cat.value) store.set(PREF_KEY, cat.value); else store.del(PREF_KEY);
    $("#prefNote").textContent = cat.value ? `✓ نتذكّر تفضيلك: ${cat.value}` : "";

    $("#count").textContent = list.length;
    $("#emptyBox").classList.toggle("d-none", list.length > 0);
    grid.innerHTML = list.map(cardHTML).join("");
  }

  [q, cat, place, from, to].forEach(el => el.addEventListener("input", render));

  $("#fReset").addEventListener("click", () => { q.value = ""; cat.value = ""; place.value = ""; from.value = ""; to.value = ""; render(); });
  render();
}

// ---------- Event details page ----------
function initDetail() {
  const root = $("#detailRoot");
  if (!root) return;

  // Read the event id from the URL (event.html?id=3)
  const id = Number(new URLSearchParams(location.search).get("id")) || 1;
  const e = EVENTS.find(x => x.id === id);
  if (!e) {
    root.innerHTML = `<div class="container py-5"><div class="alert alert-warning">لم نعثر على هذه الفعالية. <a href="events.html" class="alert-link">تصفّح كل الفعاليات</a></div></div>`;
    return;
  }
  const c = CATS[e.cat];
  document.title = `${e.title} — محفل`;

  // Related events: same category first
  const related = [...EVENTS.filter(x => x.id !== e.id && x.cat === e.cat), ...EVENTS.filter(x => x.id !== e.id && x.cat !== e.cat)].slice(0, 3);
  const durText = `${e.dur} ساعة`;
  const w = whenLabel(e);
  const booked = Number(getBookings()[e.id]) || 0;

  root.innerHTML = `
  <section class="detail-hero" style="--bg:url(assets/img/ev${e.id}.svg)">
    <div class="container">
      <nav class="crumbs" aria-label="مسار التنقل"><a href="index.html">الرئيسية</a><span class="sep">/</span><a href="events.html">كل الفعاليات</a><span class="sep">/</span><span>${e.title}</span></nav>
      <span class="badge cat-badge mt-4" style="--c:${c.color};background:#fffdf8!important"><i class="bi ${c.icon}"></i> ${e.cat}</span>
      <h1>${e.title}</h1>
      <div>
        <span class="chip-info"><i class="bi bi-calendar-event"></i>${fmtDate(e.date)}</span>
        <span class="chip-info"><i class="bi bi-clock"></i>${e.time} · ${durText}</span>
        <span class="chip-info"><i class="bi bi-geo-alt"></i>${e.place}</span>
        ${w ? `<span class="chip-info chip-when ${w.cls}"><i class="bi bi-lightning-charge-fill"></i>${w.text}</span>` : ""}
      </div>
    </div>
  </section>
  <main id="main" class="section">
    <div class="container">
      <div class="row g-5">
        <div class="col-lg-8">
          <div class="prose">${e.long.split("\n").map(p => `<p>${p}</p>`).join("")}</div>
          <h2 class="h3 mt-5 mb-4">معرض الصور</h2>
          <div class="gallery">
            ${["", "-b", "-c"].map((s, i) => `<div><img src="assets/img/ev${e.id}${s}.svg" alt="صورة ${i + 1} من فعالية ${e.title}"></div>`).join("")}
          </div>
        </div>
        <div class="col-lg-4">
          <aside class="card aside-card" style="border-top:4px solid ${c.color}">
            <dl>
              <dt>التاريخ</dt><dd>${fmtDate(e.date)}</dd>
              <dt>الوقت</dt><dd>${e.time} (بتوقيت دمشق)</dd>
              <dt>المكان</dt><dd>${e.place}</dd>
              <dt>التصنيف</dt><dd>${e.cat}</dd>
              <dt>المقاعد المتبقية</dt><dd><span id="seatsLeft">${Math.max(e.seats - booked, 0)}</span> من ${e.seats}</dd>
            </dl>
            <div class="d-grid gap-2">
              <button class="btn btn-gold py-2" data-bs-toggle="modal" data-bs-target="#bookModal"><i class="bi bi-ticket-perforated"></i> احجز مكانك</button>
              <a id="gcalLink" class="btn btn-ink py-2" target="_blank" rel="noopener"><i class="bi bi-calendar-plus"></i> أضف للتقويم</a>
              <button class="btn btn-outline-ink" data-bs-toggle="modal" data-bs-target="#shareModal"><i class="bi bi-share"></i> شارك</button>
            </div>
            <figure class="map-fig"><img src="assets/img/map.svg" alt="خريطة ثابتة توضح موقع ${e.place}"><figcaption><i class="bi bi-geo-alt-fill"></i> ${e.place} — الحرم الجامعي الافتراضي</figcaption></figure>
          </aside>
        </div>
      </div>
    </div>
  </main>
  <section class="section section-dark">
    <div class="container">
      <div class="sec-head"><div><span class="idx">— اقرأ أيضًا</span><h2>فعاليات ذات صلة</h2></div><div class="rule"></div></div>
      <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">${related.map(cardHTML).join("")}</div>
    </div>
  </section>`;

  // Add to calendar: build the Google Calendar link
  const stamp = (d, t) => d.replace(/-/g, "") + "T" + t.replace(":", "") + "00";
  const endDate = new Date(parseDate(e.date).getTime());
  const [sh, sm] = e.time.split(":").map(Number);
  const endTotal = sh * 60 + sm + e.dur * 60;
  endDate.setDate(endDate.getDate() + Math.floor(endTotal / 1440));
  const endD = `${endDate.getFullYear()}-${pad(endDate.getMonth() + 1)}-${pad(endDate.getDate())}`;
  const endT = `${pad(Math.floor((endTotal % 1440) / 60))}:${pad(endTotal % 60)}`;
  const start = stamp(e.date, e.time), end = stamp(endD, endT);

  $("#gcalLink").href = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(e.title)}&dates=${start}/${end}&details=${encodeURIComponent(e.short)}&location=${encodeURIComponent(e.place)}`;

  // Share links
  const url = location.href, txt = `${e.title} — ${fmtDate(e.date)}`;
  $("#shareWa").href = `https://wa.me/?text=${encodeURIComponent(txt + " " + url)}`;
  $("#shareTg").href = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(txt)}`;
  $("#shareX").href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(txt)}&url=${encodeURIComponent(url)}`;

  // Bonus: fake booking modal
  const form = $("#bookForm"), box = $("#bookAlert");
  $("#bookTitle").textContent = `احجز مكانك: ${e.title}`;

  $("#bookModal").addEventListener("show.bs.modal", () => { box.innerHTML = ""; form.classList.remove("d-none"); });

  const bRules = {
    bName: v => v.trim().length >= 3,
    bEmail: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())
  };
  const bCheck = el => { const ok = bRules[el.id](el.value); el.classList.toggle("is-invalid", !ok); el.classList.toggle("is-valid", ok); return ok; };
  Object.keys(bRules).forEach(id => $("#" + id).addEventListener("input", ev => bCheck(ev.target)));

  form.addEventListener("submit", ev => {
    ev.preventDefault();
    const valid = Object.keys(bRules).map(id => bCheck($("#" + id))).every(Boolean);
    if (!valid) {
      box.innerHTML = `<div class="alert alert-danger" role="alert"><i class="bi bi-exclamation-triangle-fill"></i> يرجى تصحيح الحقول المظلّلة بالأحمر.</div>`;
      return;
    }
    const want = Number($("#bSeats").value);
    const all = getBookings(), left = e.seats - (Number(all[e.id]) || 0);
    if (want > left) {
      box.innerHTML = `<div class="alert alert-warning" role="alert"><i class="bi bi-info-circle-fill"></i> المتاح الآن ${left} مقعد فقط.</div>`;
      return;
    }

    all[e.id] = (Number(all[e.id]) || 0) + want;
    store.set(BOOK_KEY, JSON.stringify(all));
    $("#seatsLeft").textContent = Math.max(e.seats - all[e.id], 0);
    const code = `MH-${e.id}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    box.innerHTML = `<div class="alert alert-success" role="alert"><i class="bi bi-check-circle-fill"></i> تم حجز ${want} مقعد باسم ${$("#bName").value.trim()}.<br>رمز الحجز: <strong dir="ltr">${code}</strong><br><small>(حجز تجريبي لا يُرسل إلى أي خادم)</small></div>
      <button type="button" class="btn btn-ink btn-sm" data-bs-dismiss="modal">إغلاق</button>`;
    form.reset(); form.classList.add("d-none");
    box.tabIndex = -1; box.focus();
    $$(".is-valid", form).forEach(el => el.classList.remove("is-valid"));
  });
}

// ---------- Contact form validation ----------
function initContact() {
  const form = $("#contactForm");
  if (!form) return;
  const alertBox = $("#formAlert");

  // Validation rules
  const rules = {
    name: v => v.trim().length >= 3,
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
    message: v => v.trim().length >= 10
  };

  const check = el => { const ok = rules[el.name](el.value); el.classList.toggle("is-invalid", !ok); el.classList.toggle("is-valid", ok); return ok; };

  Object.keys(rules).forEach(n => form.elements[n].addEventListener("input", e => check(e.target)));

  form.addEventListener("submit", ev => {
    ev.preventDefault();
    const results = Object.keys(rules).map(n => check(form.elements[n]));
    if (results.every(Boolean)) {

      const nm = form.elements.name.value.trim();
      alertBox.innerHTML = `<div class="alert alert-success alert-dismissible fade show" role="alert"><i class="bi bi-check-circle-fill"></i> شكرًا ${nm}، وصلتنا رسالتك وسنرد عليك خلال يومي عمل.<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="إغلاق"></button></div>`;
      form.reset(); $$(".is-valid", form).forEach(el => el.classList.remove("is-valid"));
    } else {

      alertBox.innerHTML = `<div class="alert alert-danger alert-dismissible fade show" role="alert"><i class="bi bi-exclamation-triangle-fill"></i> تعذّر الإرسال؛ يرجى تصحيح الحقول المظلّلة بالأحمر ثم المحاولة مجددًا.<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="إغلاق"></button></div>`;
    }
    alertBox.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

// ---------- Team cards (from TEAM in data.js) ----------
function renderTeam(selector, showId) {
  const box = $(selector);
  if (!box) return;
  box.innerHTML = TEAM.map(m => `
    <div class="col-6 col-md-2">
      <div class="card team-card">
        <div class="ph"><img class="card-img-top" src="${m.img}" alt="صورة رمزية لـ ${m.name}"></div>
        <div class="card-body p-0">
          <h4 class="card-title">${m.name}</h4>
          ${showId ? `<span class="badge id-badge" dir="ltr">${m.id}</span><br>` : ""}
          <span class="role">${m.role}</span>
        </div>
      </div>
    </div>`).join("");
}

// ---------- Bonus: dark mode and scroll-to-top ----------
function applyTheme(t) {
  document.documentElement.setAttribute("data-theme", t);
  document.documentElement.setAttribute("data-bs-theme", t);
  const b = $("#themeToggle");
  if (b) {
    b.innerHTML = t === "dark" ? '<i class="bi bi-sun"></i>' : '<i class="bi bi-moon-stars"></i>';
    b.setAttribute("aria-label", t === "dark" ? "التبديل إلى الوضع الفاتح" : "التبديل إلى الوضع الداكن");
  }
}
function initTheme() {
  applyTheme(store.get(THEME_KEY, "light"));
  const b = $("#themeToggle");
  if (!b) return;
  b.addEventListener("click", () => {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(next);
    store.set(THEME_KEY, next);
  });
}

// Scroll-to-top button
function initScrollTop() {
  const btn = document.createElement("button");
  btn.className = "to-top";
  btn.type = "button";
  btn.setAttribute("aria-label", "العودة إلى أعلى الصفحة");
  btn.innerHTML = '<i class="bi bi-arrow-up"></i>';
  document.body.appendChild(btn);
  window.addEventListener("scroll", () => btn.classList.toggle("show", window.scrollY > 400), { passive: true });
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

// ---------- Start ----------
document.addEventListener("DOMContentLoaded", () => {
  const y = $("#year"); if (y) y.textContent = new Date().getFullYear();
  initTheme(); initScrollTop();
  renderTeam("#teamGrid", true); renderTeam("#aboutTeam", false);

  initHome(); initEvents(); initDetail(); initContact();
});
