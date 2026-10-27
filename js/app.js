/* منطق الموقع — محفل */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const parseDate = d => { const [y, m, dd] = d.split("-").map(Number); return new Date(y, m - 1, dd); };
const fmtDate = d => { const t = parseDate(d); return `${DAYS[t.getDay()]} ${t.getDate()} ${MONTHS[t.getMonth()]} ${t.getFullYear()}`; };
const pad = n => String(n).padStart(2, "0");
const addMin = (time, min) => { const [h, m] = time.split(":").map(Number); const t = h * 60 + m + min; return `${pad(Math.floor(t / 60) % 24)}:${pad(t % 60)}`; };

/* ---------- بطاقة فعالية ---------- */
function cardHTML(e) {
  const c = CATS[e.cat], t = parseDate(e.date);
  return `<div class="col"><article class="ev-card reveal" style="--c:${c.color}">
    <a class="ev-img" href="event.html?id=${e.id}" aria-label="${e.title}">
      <img src="images/ev${e.id}.svg" alt="ملصق فعالية ${e.title}" loading="lazy">
      <span class="ev-date"><b>${t.getDate()}</b><i>${MONTHS[t.getMonth()]}</i></span>
    </a>
    <div class="ev-body">
      <span class="badge cat-badge" style="--c:${c.color}"><i class="bi ${c.icon}"></i> ${e.cat}</span>
      <h3><a href="event.html?id=${e.id}">${e.title}</a></h3>
      <ul class="ev-meta"><li><i class="bi bi-geo-alt"></i>${e.place}</li><li><i class="bi bi-clock"></i>${e.time}</li></ul>
      <p>${e.short}</p>
      <a class="btn btn-ink btn-sm px-3" href="event.html?id=${e.id}">التفاصيل <i class="bi bi-arrow-left"></i></a>
    </div></article></div>`;
}

/* ---------- ظهور تدريجي ---------- */
let io;
function observeReveal() {
  if (!("IntersectionObserver" in window)) { $$(".reveal").forEach(el => el.classList.add("in")); return; }
  io = io || new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }), { threshold: .12 });
  $$(".reveal:not(.in)").forEach((el, i) => { el.style.transitionDelay = (i % 3) * 90 + "ms"; io.observe(el); });
}

/* ---------- الصفحة الرئيسية ---------- */
function initHome() {
  const root = $("#featSlider"); if (!root) return;

  /* العدّادات */
  const stats = { events: EVENTS.length, cats: Object.keys(CATS).length, places: PLACES.length };
  $$("[data-count]").forEach(el => {
    const target = stats[el.dataset.count]; let n = 0;
    const tick = () => { n++; el.textContent = n; if (n < target) setTimeout(tick, 70); };
    tick();
  });

  /* وهج الماوس */
  const hero = $("#hero");
  hero.addEventListener("pointermove", e => {
    const r = hero.getBoundingClientRect();
    hero.style.setProperty("--mx", (e.clientX - r.left) + "px");
    hero.style.setProperty("--my", (e.clientY - r.top) + "px");
  });

  /* السلايدر */
  const feats = EVENTS.filter(e => e.featured);
  const slidesBox = $(".slides", root);
  slidesBox.innerHTML = feats.map((e, i) => {
    const c = CATS[e.cat], t = parseDate(e.date);
    return `<div class="slide" role="group" aria-roledescription="شريحة" aria-label="${i + 1} من ${feats.length}">
      <div class="slide-inner">
        <div class="slide-media"><img src="images/ev${e.id}.svg" alt="ملصق ${e.title}">
          <span class="badge cat-badge tag" style="--c:${c.color};background:#fffdf8!important"><i class="bi ${c.icon}"></i> ${e.cat}</span></div>
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
  const dotsBox = $(".sl-dots-list", root);
  dotsBox.innerHTML = feats.map((_, i) => `<button class="sl-dot" aria-label="الشريحة ${i + 1}">${pad(i + 1)}</button>`).join("");
  const dots = $$(".sl-dot", root), bar = $(".sl-progress i", root);
  let cur = 0, timer;

  function go(n) {
    cur = (n + slides.length) % slides.length;
    slides.forEach((s, k) => { s.classList.toggle("active", k === cur); s.setAttribute("aria-hidden", k !== cur); });
    dots.forEach((d, k) => { d.classList.toggle("on", k === cur); });
    bar.classList.remove("run"); void bar.offsetWidth; bar.classList.add("run");
  }
  const play = () => { clearInterval(timer); timer = setInterval(() => go(cur + 1), 6000); };
  const stop = () => { clearInterval(timer); bar.classList.remove("run"); };

  $(".sl-next", root).addEventListener("click", () => { go(cur + 1); play(); });
  $(".sl-prev", root).addEventListener("click", () => { go(cur - 1); play(); });
  dots.forEach((d, k) => d.addEventListener("click", () => { go(k); play(); }));
  root.addEventListener("mouseenter", stop);
  root.addEventListener("mouseleave", () => { go(cur); play(); });
  root.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft") { go(cur + 1); play(); }
    if (e.key === "ArrowRight") { go(cur - 1); play(); }
  });
  let x0 = null;
  root.addEventListener("touchstart", e => { x0 = e.touches[0].clientX; }, { passive: true });
  root.addEventListener("touchend", e => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) { go(dx < 0 ? cur + 1 : cur - 1); play(); }
    x0 = null;
  });
  go(0); play();

  /* التصنيفات */
  $("#catList").innerHTML = Object.entries(CATS).map(([name, c]) => {
    const n = EVENTS.filter(e => e.cat === name).length;
    return `<a class="cat-pill reveal" style="--c:${c.color}" href="events.html?cat=${encodeURIComponent(name)}">
      <span class="dot"></span><i class="bi ${c.icon}"></i><span>${name}</span><span class="count">${n}</span></a>`;
  }).join("");

  /* أحدث الفعاليات: آخر ستّ فعاليات أُضيفت */
  $("#latestGrid").innerHTML = [...EVENTS].sort((a, b) => b.id - a.id).slice(0, 6).map(cardHTML).join("");

  /* الشريط المتحرك */
  const words = Object.keys(CATS).map(k => `<span>${k}</span>`).join("");
  $("#marquee").innerHTML = words.repeat(4);
  observeReveal();
}

/* ---------- صفحة الفعاليات ---------- */
function initEvents() {
  const grid = $("#eventsGrid"); if (!grid) return;
  const q = $("#fQ"), cat = $("#fCat"), place = $("#fPlace"), from = $("#fFrom"), to = $("#fTo"), sort = $("#fSort");
  cat.innerHTML += Object.keys(CATS).map(c => `<option>${c}</option>`).join("");
  place.innerHTML += PLACES.map(p => `<option>${p}</option>`).join("");
  $("#chips").innerHTML = `<button class="chip on" data-cat="">الكل</button>` + Object.keys(CATS).map(c => `<button class="chip" data-cat="${c}">${c}</button>`).join("");

  const param = new URLSearchParams(location.search).get("cat");
  if (param && CATS[param]) cat.value = param;

  function render() {
    const term = q.value.trim();
    let list = EVENTS.filter(e =>
      (!term || (e.title + e.short + e.place + e.cat).includes(term)) &&
      (!cat.value || e.cat === cat.value) &&
      (!place.value || e.place === place.value) &&
      (!from.value || e.date >= from.value) &&
      (!to.value || e.date <= to.value));
    list.sort((a, b) => sort.value === "late" ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date));
    $("#count").textContent = list.length;
    $$(".chip").forEach(ch => ch.classList.toggle("on", ch.dataset.cat === cat.value));
    $("#emptyBox").classList.toggle("d-none", list.length > 0);
    grid.innerHTML = list.map(cardHTML).join("");
    observeReveal();
  }
  [q, cat, place, from, to, sort].forEach(el => el.addEventListener("input", render));
  $("#chips").addEventListener("click", e => { const b = e.target.closest(".chip"); if (b) { cat.value = b.dataset.cat; render(); } });
  $("#fReset").addEventListener("click", () => { q.value = ""; cat.value = ""; place.value = ""; from.value = ""; to.value = ""; sort.value = "soon"; render(); });
  render();
}

/* ---------- تفاصيل الفعالية ---------- */
function initDetail() {
  const root = $("#detailRoot"); if (!root) return;
  const id = Number(new URLSearchParams(location.search).get("id")) || 1;
  const e = EVENTS.find(x => x.id === id);
  if (!e) {
    root.innerHTML = `<div class="container py-5"><div class="alert alert-warning">لم نعثر على هذه الفعالية. <a href="events.html" class="alert-link">تصفّح كل الفعاليات</a></div></div>`;
    return;
  }
  const c = CATS[e.cat];
  document.title = `${e.title} — محفل`;
  const program = [
    [addMin(e.time, -30), "فتح الأبواب والتسجيل"],
    [e.time, "الافتتاح وكلمة الترحيب"],
    [addMin(e.time, 30), "الفقرة الرئيسية"],
    [addMin(e.time, Math.max(60, Math.round(e.dur * 60 * 0.75))), "حوار مفتوح مع الحضور"]
  ];
  const related = [...EVENTS.filter(x => x.id !== e.id && x.cat === e.cat), ...EVENTS.filter(x => x.id !== e.id && x.cat !== e.cat)].slice(0, 3);
  const durText = e.dur >= 24 ? `${e.dur} ساعة` : `${e.dur} ${e.dur <= 2 ? "ساعات" : "ساعات"}`;

  root.innerHTML = `
  <section class="detail-hero" style="--bg:url(images/ev${e.id}.svg)">
    <div class="container">
      <nav class="crumbs" aria-label="مسار التنقل"><a href="index.html">الرئيسية</a><span class="sep">/</span><a href="events.html">كل الفعاليات</a><span class="sep">/</span><span>${e.title}</span></nav>
      <span class="badge cat-badge mt-4" style="--c:${c.color};background:#fffdf8!important"><i class="bi ${c.icon}"></i> ${e.cat}</span>
      <h1>${e.title}</h1>
      <div>
        <span class="chip-info"><i class="bi bi-calendar-event"></i>${fmtDate(e.date)}</span>
        <span class="chip-info"><i class="bi bi-clock"></i>${e.time} · ${durText}</span>
        <span class="chip-info"><i class="bi bi-geo-alt"></i>${e.place}</span>
      </div>
    </div>
  </section>
  <main id="main" class="section">
    <div class="container">
      <div class="row g-5">
        <div class="col-lg-8">
          <div class="prose reveal">${e.long.split("\n").map(p => `<p>${p}</p>`).join("")}</div>
          <h2 class="h3 mt-5 mb-4">معرض الصور</h2>
          <div class="gallery reveal">
            ${["", "-b", "-c"].map((s, i) => `<button type="button" data-bs-toggle="modal" data-bs-target="#lightModal" data-img="images/ev${e.id}${s}.svg" aria-label="تكبير الصورة ${i + 1}"><img src="images/ev${e.id}${s}.svg" alt="صورة ${i + 1} من فعالية ${e.title}"></button>`).join("")}
          </div>
          <h2 class="h3 mt-5 mb-4">برنامج الفعالية</h2>
          <ol class="timeline reveal">${program.map(p => `<li><b>${p[0]}</b>${p[1]}</li>`).join("")}</ol>
        </div>
        <div class="col-lg-4">
          <aside class="aside-card reveal" style="border-top:4px solid ${c.color}">
            <dl>
              <dt>التاريخ</dt><dd>${fmtDate(e.date)}</dd>
              <dt>الوقت</dt><dd>${e.time} (بتوقيت دمشق)</dd>
              <dt>المكان</dt><dd>${e.place}</dd>
              <dt>التصنيف</dt><dd>${e.cat}</dd>
              <dt>الحضور</dt><dd>مفتوح لطلبة الجامعة وضيوفهم</dd>
            </dl>
            <div class="d-grid gap-2">
              <button class="btn btn-ink py-2" data-bs-toggle="modal" data-bs-target="#calModal"><i class="bi bi-calendar-plus"></i> أضف للتقويم</button>
              <button class="btn btn-outline-ink" data-bs-toggle="modal" data-bs-target="#shareModal"><i class="bi bi-share"></i> شارك</button>
            </div>
            <figure class="map-fig"><img src="images/map.svg" alt="خريطة ثابتة توضح موقع ${e.place}"><figcaption><i class="bi bi-geo-alt-fill"></i> ${e.place} — الحرم الجامعي الافتراضي</figcaption></figure>
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

  /* التقويم */
  const stamp = (d, t) => d.replace(/-/g, "") + "T" + t.replace(":", "") + "00";
  const endDate = new Date(parseDate(e.date).getTime());
  const [sh, sm] = e.time.split(":").map(Number);
  const endTotal = sh * 60 + sm + e.dur * 60;
  endDate.setDate(endDate.getDate() + Math.floor(endTotal / 1440));
  const endD = `${endDate.getFullYear()}-${pad(endDate.getMonth() + 1)}-${pad(endDate.getDate())}`;
  const endT = `${pad(Math.floor((endTotal % 1440) / 60))}:${pad(endTotal % 60)}`;
  const start = stamp(e.date, e.time), end = stamp(endD, endT);
  $("#gcalLink").href = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(e.title)}&dates=${start}/${end}&details=${encodeURIComponent(e.short)}&location=${encodeURIComponent(e.place)}`;
  $("#icsBtn").addEventListener("click", () => {
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Mahfil//AR", "BEGIN:VEVENT", `UID:mahfil-${e.id}@events.local`,
      `DTSTAMP:${start}`, `DTSTART:${start}`, `DTEND:${end}`, `SUMMARY:${e.title}`, `LOCATION:${e.place}`, `DESCRIPTION:${e.short}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    a.download = `mahfil-event-${e.id}.ics`; document.body.appendChild(a); a.click(); a.remove();
  });

  /* المشاركة */
  const url = location.href, txt = `${e.title} — ${fmtDate(e.date)}`;
  $("#shareUrl").value = url;
  $("#shareWa").href = `https://wa.me/?text=${encodeURIComponent(txt + " " + url)}`;
  $("#shareTg").href = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(txt)}`;
  $("#shareX").href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(txt)}&url=${encodeURIComponent(url)}`;
  $("#copyBtn").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(url); } catch (_) { $("#shareUrl").select(); document.execCommand("copy"); }
    $("#copyBtn").innerHTML = '<i class="bi bi-check2"></i> تم النسخ';
    setTimeout(() => $("#copyBtn").innerHTML = '<i class="bi bi-clipboard"></i> نسخ', 2000);
  });

  /* المعرض المكبّر */
  $("#lightModal").addEventListener("show.bs.modal", ev => { $("#lightImg").src = ev.relatedTarget.dataset.img; });
  observeReveal();
}

/* ---------- اتصل بنا ---------- */
function initContact() {
  const form = $("#contactForm"); if (!form) return;
  const alertBox = $("#formAlert");
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

/* ---------- عام ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const y = $("#year"); if (y) y.textContent = new Date().getFullYear();
  initHome(); initEvents(); initDetail(); initContact();
  observeReveal();
});
