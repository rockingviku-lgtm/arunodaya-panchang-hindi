
import "./style.css";
import { buildKundli } from "./kundli.js";

const $ = (s) => document.querySelector(s);

const today = new Date();

const dateISO = (d) => {
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

const fmtDate = (
  value,
  options = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }
) => {
  if (!value) return "तारीख चुनें";
  return new Intl.DateTimeFormat("hi-IN", options)
    .format(new Date(`${value}T12:00:00`));
};

const state = {
  date: dateISO(today),
  month: new Date(today.getFullYear(), today.getMonth(), 1),
  active: "home"
};

const nav = [
  ["home", "⌂", "होम"],
  ["panchang", "☼", "पंचांग"],
  ["calendar", "▦", "कैलेंडर"],
  ["muhurat", "✧", "मुहूर्त"],
  ["kundli", "☷", "कुंडली"]
];

$("#app").innerHTML = `
<header class="topbar">
  <div class="brand" role="button" tabindex="0" data-page="home">
    <div class="brand-mark">ॐ</div>
    <div>
      <div class="brand-name">Arunodaya Panchang</div>
      <div class="brand-sub">वैदिक पंचांग · हिंदू कैलेंडर · ज्योतिष</div>
    </div>
  </div>
  <button class="today-btn" data-action="today">आज का पंचांग</button>
</header>

<main>
  <section class="hero" id="hero">
    <div class="eyebrow"><span class="sun-dot"></span> आपका दैनिक वैदिक कैलेंडर</div>
    <h1>समय को जानें,<br><span>शुभता के साथ आगे बढ़ें।</span></h1>
    <p>दैनिक पंचांग, हिंदू कैलेंडर, मुहूर्त और जन्म कुंडली — एक ही जगह, आपके मोबाइल के लिए बनाया गया।</p>
    <div class="hero-actions">
      <button class="btn primary" data-page="panchang">आज का पंचांग देखें <span>→</span></button>
      <button class="btn secondary" data-page="calendar">हिंदू कैलेंडर खोलें</button>
    </div>
  </section>

  <section class="date-strip">
    <div>
      <div class="eyebrow muted">आज की तारीख</div>
      <div class="today-date" id="today-date"></div>
      <div class="today-meta" id="today-meta"></div>
    </div>
    <label class="date-picker-label">
      किसी भी तारीख का पंचांग
      <input type="date" id="global-date">
    </label>
  </section>

  <section class="section" id="page-content"></section>

  <section class="section quick-links">
    <div class="section-heading">
      <div>
        <div class="eyebrow muted">एक नज़र में</div>
        <h2>आपके उपयोगी टूल</h2>
      </div>
    </div>
    <div class="tool-grid">
      <button class="tool-card" data-page="panchang">
        <span class="tool-icon">☼</span>
        <b>दैनिक पंचांग</b>
        <small>तिथि, नक्षत्र, योग और करण</small>
        <span class="tool-arrow">↗</span>
      </button>
      <button class="tool-card" data-page="calendar">
        <span class="tool-icon">▦</span>
        <b>हिंदू कैलेंडर</b>
        <small>महीना और तारीख चुनें</small>
        <span class="tool-arrow">↗</span>
      </button>
      <button class="tool-card" data-page="muhurat">
        <span class="tool-icon">✧</span>
        <b>शुभ मुहूर्त</b>
        <small>समय और स्थान के अनुसार</small>
        <span class="tool-arrow">↗</span>
      </button>
      <button class="tool-card" data-page="kundli">
        <span class="tool-icon">☷</span>
        <b>जन्म कुंडली</b>
        <small>जन्म विवरण से कुंडली</small>
        <span class="tool-arrow">↗</span>
      </button>
    </div>
  </section>

  <section class="notice">
    <span>ⓘ</span>
    <p><b>गणना संबंधी सूचना:</b> पंचांग, तिथि, नक्षत्र, सूर्योदय और मुहूर्त के परिणामों को प्रमाणित खगोलीय गणना से सत्यापित करना आवश्यक है।</p>
  </section>
</main>

<footer>
  <div class="footer-brand">
    <div class="brand-mark small">ॐ</div>
    <div>
      <b>Arunodaya Panchang</b>
      <small>परंपरा और तकनीक का संगम</small>
    </div>
  </div>
  <div class="footer-links">
    <button data-page="home">होम</button>
    <button data-page="panchang">पंचांग</button>
    <button data-page="calendar">कैलेंडर</button>
    <button data-page="kundli">कुंडली</button>
  </div>
  <small class="copyright">© ${today.getFullYear()} Arunodaya Panchang · श्रद्धा, ज्ञान और गणना</small>
</footer>

<nav class="bottom-nav">
  ${nav.map(([id, icon, label]) => `
    <button data-page="${id}" class="${id === "home" ? "selected" : ""}">
      <span>${icon}</span><small>${label}</small>
    </button>
  `).join("")}
</nav>
`;

function dateFacts(date) {
  const d = new Date(`${date}T12:00:00`);
  return {
    weekday: new Intl.DateTimeFormat("hi-IN", {
      weekday: "long"
    }).format(d),
    full: fmtDate(date),
    month: new Intl.DateTimeFormat("hi-IN", {
      month: "long",
      year: "numeric"
    }).format(d)
  };
}

function setDate(date) {
  state.date = date || dateISO(new Date());
  $("#global-date").value = state.date;
  $("#today-date").textContent = fmtDate(state.date, {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
  $("#today-meta").textContent =
    `${dateFacts(state.date).weekday} · भारत (IST)`;
  render();
}

function fact(title, value, icon) {
  return `<div class="fact-card">
    <span>${icon}</span>
    <div><small>${title}</small><b>${value}</b></div>
  </div>`;
}

function renderHome() {
  return `
    <div class="section-heading">
      <div><div class="eyebrow muted">आज और हर दिन</div><h2>पंचांग और कैलेंडर</h2></div>
      <span class="pill">भारत · IST</span>
    </div>
    <div class="feature-grid">
      <article class="feature-card featured">
        <div class="feature-top"><span class="feature-icon">☼</span><span class="pill light">दैनिक जानकारी</span></div>
        <h3>दैनिक पंचांग</h3><p>चुनी गई तारीख के पंचांग विवरण देखें।</p>
        <button class="text-link" data-page="panchang">पंचांग देखें →</button>
      </article>
      <article class="feature-card">
        <div class="feature-top"><span class="feature-icon gold">▦</span><span class="pill">कैलेंडर</span></div>
        <h3>हिंदू कैलेंडर</h3><p>महीने के दिनों में जाएँ और तारीख चुनें।</p>
        <button class="text-link" data-page="calendar">कैलेंडर खोलें →</button>
      </article>
      <article class="feature-card">
        <div class="feature-top"><span class="feature-icon purple">✧</span><span class="pill">शुभ समय</span></div>
        <h3>मुहूर्त</h3><p>मुहूर्त और दैनिक समय-सारणी देखें।</p>
        <button class="text-link" data-page="muhurat">मुहूर्त देखें →</button>
      </article>
      <article class="feature-card">
        <div class="feature-top"><span class="feature-icon blue">☷</span><span class="pill">ज्योतिष</span></div>
        <h3>जन्म कुंडली</h3><p>जन्म तारीख, समय और स्थान भरें।</p>
        <button class="text-link" data-page="kundli">कुंडली बनाएँ →</button>
      </article>
    </div>
    <div class="section-heading mini-heading">
      <div><div class="eyebrow muted">आपके लिए</div><h2>आज के मुख्य विवरण</h2></div>
    </div>
    <div class="facts-grid">
      ${fact("तिथि", "गणना उपलब्ध होने पर", "◷")}
      ${fact("नक्षत्र", "गणना उपलब्ध होने पर", "✦")}
      ${fact("योग", "गणना उपलब्ध होने पर", "✧")}
      ${fact("करण", "गणना उपलब्ध होने पर", "☼")}
    </div>`;
}

function renderPanchang() {
  return `
    <div class="page-title">
      <div class="eyebrow muted">DAILY PANCHANG</div>
      <h2>दैनिक पंचांग</h2><p>अपनी तारीख और स्थान चुनें।</p>
    </div>
    <div class="panel">
      <div class="panel-head"><div><h3>पंचांग विवरण</h3><p>तारीख चुनकर विवरण देखें</p></div><span class="panel-symbol">☼</span></div>
      <div class="form-grid">
        <label>पंचांग की तारीख<input id="p-date" type="date" value="${state.date}"></label>
        <label>समय<input id="p-time" type="time" value="12:00"></label>
        <label>स्थान / शहर<input id="p-place" value="Lucknow, India"></label>
        <label>समय क्षेत्र<select id="p-zone"><option value="330">भारत (UTC +05:30)</option><option value="0">UTC</option></select></label>
      </div>
      <button class="btn primary" data-action="show-panchang">चुनी तारीख का पंचांग देखें →</button>
      <div id="p-result"></div>
    </div>
    <div class="notice compact"><span>ⓘ</span><p>सटीक तिथि, नक्षत्र और मुहूर्त के लिए सत्यापित खगोलीय गणना आवश्यक है।</p></div>`;
}

function renderCalendar() {
  const y = state.month.getFullYear();
  const m = state.month.getMonth();
  const first = new Date(y, m, 1);
  const days = new Date(y, m + 1, 0).getDate();
  const start = (first.getDay() + 6) % 7;
  const weekdays = ["सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि", "रवि"];

  let cells = weekdays.map(x => `<div class="cal-week">${x}</div>`).join("");

  for (let i = 0; i < start; i++) {
    cells += `<div class="cal-day empty"></div>`;
  }

  for (let n = 1; n <= days; n++) {
    const d = dateISO(new Date(y, m, n));
    const isSelected = d === state.date;
    const isToday = d === dateISO(today);
    cells += `<button class="cal-day ${isSelected ? "chosen" : ""} ${isToday ? "today" : ""}" data-date="${d}">
      <span>${n}</span>${isToday ? "<i>आज</i>" : ""}
    </button>`;
  }

  return `
    <div class="page-title"><div class="eyebrow muted">HINDU CALENDAR</div><h2>हिंदू कैलेंडर</h2><p>किसी भी तारीख पर टैप करके उसे चुनें।</p></div>
    <div class="panel calendar-panel">
      <div class="calendar-toolbar">
        <button class="icon-btn" data-action="prev-month">‹</button>
        <h3>${new Intl.DateTimeFormat("hi-IN", { month: "long", year: "numeric" }).format(state.month)}</h3>
        <button class="icon-btn" data-action="next-month">›</button>
      </div>
      <div class="calendar-grid">${cells}</div>
      <div class="calendar-legend"><span><i class="legend-dot"></i> आज</span><span><i class="legend-dot gold-dot"></i> चुनी गई तारीख</span></div>
    </div>
    <div class="panel selected-date-panel">
      <div><small>चुनी गई तारीख</small><h3>${fmtDate(state.date)}</h3><p>इस तारीख का विवरण देखने के लिए पंचांग खोलें।</p></div>
      <button class="btn primary" data-page="panchang">पंचांग देखें →</button>
    </div>`;
}

function timing(name, desc, icon) {
  return `<div class="timing-item"><span class="timing-icon">${icon}</span><div><b>${name}</b><small>${desc}</small></div><span class="timing-status">जल्द उपलब्ध</span></div>`;
}

function renderMuhurat() {
  return `
    <div class="page-title"><div class="eyebrow muted">AUSPICIOUS TIMINGS</div><h2>मुहूर्त और शुभ समय</h2><p>स्थान और तारीख के अनुसार मुहूर्त।</p></div>
    <div class="panel">
      <div class="panel-head"><div><h3>दैनिक समय-सारणी</h3><p>अपनी तारीख और शहर चुनें</p></div><span class="panel-symbol purple-bg">✧</span></div>
      <div class="form-grid">
        <label>तारीख<input id="m-date" type="date" value="${state.date}"></label>
        <label>शहर / स्थान<input id="m-place" value="Lucknow, India"></label>
      </div>
      <button class="btn primary" data-action="show-muhurat">समय-सारणी देखें →</button>
      <div id="m-result"></div>
    </div>
    <div class="timing-list">
      ${timing("राहुकाल", "स्थानीय गणना आवश्यक", "☾")}
      ${timing("गुलिक काल", "स्थानीय गणना आवश्यक", "◷")}
      ${timing("अभिजीत मुहूर्त", "सूर्योदय-सूर्यास्त आवश्यक", "✧")}
      ${timing("सूर्योदय / सूर्यास्त", "स्थान के अनुसार बदलता है", "☼")}
    </div>`;
}

function renderKundli() {
  return `
    <div class="page-title">
      <div class="eyebrow muted">VEDIC ASTROLOGY</div>
      <h2>जन्म कुंडली</h2><p>अपना जन्म विवरण भरें।</p>
    </div>
    <div class="panel">
      <div class="panel-head"><div><h3>जन्म विवरण</h3><p>सटीक जन्म समय और जन्मस्थान भरें।</p></div><span class="panel-symbol blue-bg">☷</span></div>
      <form id="k-form">
        <div class="form-grid">
          <label>नाम (वैकल्पिक)<input id="k-name" placeholder="अपना नाम"></label>
          <label>जन्म तारीख (DD-MM-YYYY)
            <input id="k-date" type="text" inputmode="numeric" placeholder="08-01-2002" maxlength="10" pattern="[0-9]{2}-[0-9]{2}-[0-9]{4}" autocomplete="off" required>
          </label>
          <label>जन्म समय<input id="k-time" type="time" value="12:00" required></label>
          <label>समय क्षेत्र
            <select id="k-zone">
              <option value="330">भारत (UTC +05:30)</option>
              <option value="0">UTC</option>
            </select>
          </label>
          <label>जन्म स्थान<input id="k-place" value="Lucknow, India" required></label>
          <label>अक्षांश (Latitude)<input id="k-lat" type="number" value="26.8467" min="-90" max="90" step="any" required></label>
          <label>देशांतर (Longitude)<input id="k-lon" type="number" value="80.9462" min="-180" max="180" step="any" required></label>
        </div>
        <button class="btn secondary" type="button" data-action="use-location">📍 मेरी लोकेशन इस्तेमाल करें</button>
        <button class="btn primary" type="submit">कुंडली बनाएँ →</button>
      </form>
      <div id="k-result"></div>
    </div>
    <div class="notice compact"><span>ⓘ</span><p>जन्मकुंडली की गणना के लिए Swiss Ephemeris इंजन का सही तरीके से लोड होना आवश्यक है। वर्तमान GPS लोकेशन जन्मस्थान से अलग हो सकती है।</p></div>`;
}

function render() {
  const root = $("#page-content");
  root.innerHTML = ({
    home: renderHome,
    panchang: renderPanchang,
    calendar: renderCalendar,
    muhurat: renderMuhurat,
    kundli: renderKundli
  })[state.active]();

  document.querySelectorAll(".bottom-nav [data-page]").forEach(b => {
    b.classList.toggle("selected", b.dataset.page === state.active);
  });
}

function go(page) {
  state.active = page;
  render();
  window.scrollTo({
    top: $("#page-content").getBoundingClientRect().top + window.scrollY - 90,
    behavior: "smooth"
  });
}

function showLocationError(message) {
  const result = $("#k-result");
  if (result) {
    result.innerHTML = `<div class="result-box error-box"><b>लोकेशन उपलब्ध नहीं</b><p>${message}</p></div>`;
  }
}

document.addEventListener("click", async (e) => {
  const page = e.target.closest("[data-page]");
  if (page) {
    go(page.dataset.page);
    return;
  }

  const dateButton = e.target.closest("[data-date]");
  if (dateButton) {
    setDate(dateButton.dataset.date);
    state.active = "calendar";
    render();
    return;
  }

  const actionButton = e.target.closest("[data-action]");
  const action = actionButton?.dataset.action;
  if (!action) return;

  if (action === "today") {
    setDate(dateISO(today));
    go("panchang");
    return;
  }

  if (action === "prev-month") {
    state.month = new Date(state.month.getFullYear(), state.month.getMonth() - 1, 1);
    render();
    return;
  }

  if (action === "next-month") {
    state.month = new Date(state.month.getFullYear(), state.month.getMonth() + 1, 1);
    render();
    return;
  }

  if (action === "show-panchang") {
    const d = $("#p-date").value;
    if (!d) return;
    setDate(d);
    $("#p-result").innerHTML = `<div class="result-box"><b>${fmtDate(d)}</b><p>तिथि, नक्षत्र और सूर्योदय के सटीक परिणामों के लिए पंचांग इंजन आवश्यक है।</p></div>`;
    return;
  }

  if (action === "show-muhurat") {
    const d = $("#m-date").value;
    $("#m-result").innerHTML = `<div class="result-box"><b>${fmtDate(d)}</b><p>${$("#m-place").value || "चुना गया स्थान"} के लिए प्रमाणित मुहूर्त गणना अभी उपलब्ध नहीं है।</p></div>`;
    return;
  }

  if (action === "use-location") {
    if (!navigator.geolocation) {
      alert("इस ब्राउज़र में GPS लोकेशन सुविधा उपलब्ध नहीं है।");
      return;
    }

    actionButton.disabled = true;
    actionButton.textContent = "लोकेशन प्राप्त हो रही है…";

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        $("#k-lat").value = lat.toFixed(6);
        $("#k-lon").value = lon.toFixed(6);

        try {
          const url = new URL("https://nominatim.openstreetmap.org/reverse");
          url.searchParams.set("format", "jsonv2");
          url.searchParams.set("lat", String(lat));
          url.searchParams.set("lon", String(lon));

          const response = await fetch(url.toString());
          if (!response.ok) throw new Error("स्थान का नाम नहीं मिल पाया।");

          const data = await response.json();
          const a = data.address || {};
          const place = [
            a.city || a.town || a.village || a.county,
            a.state,
            a.country
          ].filter(Boolean);

          if (place.length) {
            $("#k-place").value = [...new Set(place)].join(", ");
          }

          alert("GPS coordinates भर दिए गए हैं। यदि जन्मस्थान अलग है, तो सही जन्मस्थान के coordinates भरें।");
        } catch (err) {
          console.warn("Reverse geocoding failed:", err);
          alert("Coordinates भर दिए गए हैं, लेकिन स्थान का नाम प्राप्त नहीं हुआ।");
        } finally {
          actionButton.disabled = false;
          actionButton.textContent = "📍 मेरी लोकेशन इस्तेमाल करें";
        }
      },
      (err) => {
        const messages = {
          1: "लोकेशन की अनुमति नहीं मिली। ब्राउज़र सेटिंग में अनुमति दें।",
          2: "डिवाइस की लोकेशन उपलब्ध नहीं है।",
          3: "लोकेशन प्राप्त करने में समय समाप्त हो गया। फिर कोशिश करें।"
        };

        alert(messages[err.code] || "लोकेशन प्राप्त नहीं हो सकी।");
        actionButton.disabled = false;
        actionButton.textContent = "📍 मेरी लोकेशन इस्तेमाल करें";
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }
});

$("#global-date").addEventListener("change", (e) => {
  if (e.target.value) {
    setDate(e.target.value);
    go("panchang");
  }
});

document.addEventListener("submit", async (e) => {
  if (e.target.id !== "k-form") return;

  e.preventDefault();

  const form = e.target;
  const result = $("#k-result");
  const submitButton = form.querySelector('[type="submit"]');

  if (submitButton) submitButton.disabled = true;

  result.innerHTML = `
    <div class="result-box">
      <b>गणना शुरू हो रही है…</b>
      <p>जन्म विवरण की जाँच की जा रही है।</p>
    </div>`;

  try {
    const value = $("#k-date").value.trim();
    const match = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);

    if (!match) {
      throw new Error("जन्म तारीख DD-MM-YYYY में लिखें, जैसे 08-01-2002।");
    }

    const [, dd, mm, yyyy] = match;
    const day = Number(dd);
    const month = Number(mm);
    const year = Number(yyyy);

    const check = new Date(Date.UTC(year, month - 1, day));

    if (
      check.getUTCFullYear() !== year ||
      check.getUTCMonth() !== month - 1 ||
      check.getUTCDate() !== day
    ) {
      throw new Error("जन्म तारीख सही नहीं है।");
    }

    const time = $("#k-time").value;
    if (!/^\d{2}:\d{2}$/.test(time)) {
      throw new Error("जन्म समय सही भरें।");
    }

    const lat = Number($("#k-lat").value);
    const lon = Number($("#k-lon").value);

    if (
      !Number.isFinite(lat) || lat < -90 || lat > 90 ||
      !Number.isFinite(lon) || lon < -180 || lon > 180
    ) {
      throw new Error("अक्षांश या देशांतर सही भरें।");
    }

    const payload = {
      name: $("#k-name").value.trim(),
      date: `${yyyy}-${mm}-${dd}`,
      time,
      timezoneMinutes: Number($("#k-zone").value),
      lat,
      lon
    };

    result.innerHTML = `
      <div class="result-box">
        <b>कुंडली की गणना हो रही है…</b>
        <p>Swiss Ephemeris से परिणाम प्राप्त किए जा रहे हैं।</p>
      </div>`;

    let timeoutId;

    const timeout = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(
          "30 सेकंड में गणना पूरी नहीं हुई। src/kundli.js में Swiss Ephemeris की loading जाँचनी होगी।"
        ));
      }, 30000);
    });

    try {
      const html = await Promise.race([
        buildKundli(payload),
        timeout
      ]);
      result.innerHTML = html;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (err) {
    console.error("Kundli calculation failed:", err);
    result.innerHTML = `
      <div class="result-box error-box">
        <b>कुंडली नहीं बन सकी</b>
        <p>${String(err?.message || err)}</p>
      </div>`;
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
});

setDate(state.date);
