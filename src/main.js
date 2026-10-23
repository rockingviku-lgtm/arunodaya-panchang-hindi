import "./style.css";
import {
  buildKundli,
  buildKundliData,
  buildKundliHtml
} from "./kundli.js";
import { calculatePanchang, geocodePanchangPlace, formatPanchangTime, formatPanchangDateTime } from "./panchak-engine.js";
import {
  searchBirthPlaces,
  getBirthTimezoneOffset
} from "./location.js";
import {
  renderMuhuratResult,
  updateMuhuratCards
} from "./muhurat.js";

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
<a href="/privacy-policy.html">गोपनीयता नीति</a>
  <a href="/disclaimer.html">अस्वीकरण</a>
  <a href="/terms-and-conditions.html">नियम एवं शर्तें</a>
  <a href="/about-us.html">हमारे बारे में</a>
  <a href="/cookies.html">कुकीज़ नीति</a>
  <a href="/services.html">हमारी सेवाएँ</a>
  <a href="/contact-us.html">संपर्क करें</a>
  <div class="footer-credit">
    <small>Made In India 🇮🇳</small>
    <small>Website by Seven Ink Digital Developers Team</small>
  </div>
  <small class="copyright">©${today.getFullYear()} Arunodaya Panchang · श्रद्धा, ज्ञान और गणना</small>
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
      ${fact("तिथि", "पंचांग खोलें", "◷")}
      ${fact("नक्षत्र", "पंचांग खोलें", "✦")}
      ${fact("योग", "पंचांग खोलें", "✧")}
      ${fact("करण", "पंचांग खोलें", "☼")}
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
        <label>स्थान / शहर<input id="p-place" value="Lucknow, India"></label><button
  class="btn secondary"
  type="button"
  data-action="use-panchang-location"
  style="margin-top: 12px; width: 100%;"
>मेरी लोकेशन इस्तेमाल करें</button>
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
    <div class="page-title">
      <div class="eyebrow muted">AUSPICIOUS TIMINGS</div>
      <h2>मुहूर्त और शुभ समय</h2>
      <p>स्थान और तारीख के अनुसार मुहूर्त।</p>
    </div>

    <div class="panel">
      <div class="panel-head">
        <div>
          <h3>दैनिक समय-सारणी</h3>
          <p>अपनी तारीख और शहर चुनें</p>
        </div>
        <span class="panel-symbol purple-bg">✧</span>
      </div>

      <div class="form-grid">
        <label>
          तारीख
          <input id="m-date" type="date" value="${state.date}">
        </label>

        <label>
          शहर / स्थान
          <input id="m-place" value="Lucknow, India">
        </label>
      </div>

      <button
        class="btn secondary"
        type="button"
        data-action="use-muhurat-location"
        style="margin-top: 12px; width: 100%;"
      >मेरी लोकेशन इस्तेमाल करें</button>

      <button
        class="btn primary"
        type="button"
        data-action="show-muhurat"
        style="margin-top: 12px;"
      >समय-सारणी देखें →</button>

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
          <label class="birthplace-field">
            जन्म स्थान (शहर या गाँव)
            <input id="k-place" placeholder="जैसे Lucknow, London, New York" autocomplete="off" required>
          </label>
          <div id="k-place-results" class="birthplace-results"></div>
          <p id="k-place-status" class="birthplace-status">जन्मस्थान खोजें और सूची से सही शहर चुनें।</p>
          <label>अक्षांश (Latitude)<input id="k-lat" type="number" min="-90" max="90" step="any" required></label>
          <label>देशांतर (Longitude)<input id="k-lon" type="number" min="-180" max="180" step="any" required></label>
        </div>
     <button class="btn primary" type="submit">कुंडली बनाएँ →</button>
      </form>
      <div id="k-result"></div>
    </div>`;
}

let selectedBirthPlace = null;
let birthPlaceSearchNumber = 0;

function setupBirthPlaceSearch() {
  const input = $("#k-place");
  const results = $("#k-place-results");
  const status = $("#k-place-status");
  if (!input || !results || !status) return;

  selectedBirthPlace = null;
  const latInput = $("#k-lat");
  const lonInput = $("#k-lon");

  input.addEventListener("input", async () => {
    selectedBirthPlace = null;
    const query = input.value.trim();
    const searchNumber = ++birthPlaceSearchNumber;
    results.replaceChildren();
    if (latInput) latInput.value = "";
    if (lonInput) lonInput.value = "";

    if (query.length < 2) {
      status.textContent = "कम-से-कम 2 अक्षर लिखें।";
      return;
    }

    status.textContent = "दुनिया भर में स्थान खोजे जा रहे हैं…";
    try {
      const places = await searchBirthPlaces(query);
      if (searchNumber !== birthPlaceSearchNumber) return;
      if (!places.length) {
        status.textContent = "स्थान नहीं मिला। शहर के साथ देश का नाम भी लिखें।";
        return;
      }

      status.textContent = "सही शहर चुनें:";
      for (const place of places) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "birthplace-option";
        const details = [place.region, place.country].filter(Boolean).join(", ");
        button.textContent = details ? `${place.name} — ${details}` : place.name;

        button.addEventListener("click", () => {
          selectedBirthPlace = place;
          input.value = [place.name, place.region, place.country]
            .filter(Boolean)
            .filter((value, index, array) => array.indexOf(value) === index)
            .join(", ");
          if (latInput) latInput.value = place.latitude.toFixed(6);
          if (lonInput) lonInput.value = place.longitude.toFixed(6);
          results.replaceChildren();
          status.textContent = `चुना गया: ${place.name} · ${place.timezone}`;

          const zone = $("#k-zone");
          if (zone) {
            zone.dataset.ianaTimezone = place.timezone;
            zone.dataset.locationSelected = "true";
          }
        });
        results.appendChild(button);
      }
    } catch (error) {
      if (searchNumber !== birthPlaceSearchNumber) return;
      console.error("Birthplace search failed:", error);
      status.textContent = "स्थान खोजने में समस्या हुई। इंटरनेट कनेक्शन जाँचकर फिर कोशिश करें।";
    }
  });
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

  if (state.active === "kundli") setupBirthPlaceSearch();

  document.querySelectorAll(".bottom-nav [data-page]").forEach((b) => {
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

document.addEventListener("click", async (e) => {
  const page = e.target.closest("[data-page]");
  if (page) {
    go(page.dataset.page);
    return;
  }

  const dateButton = e.target.closest("[data-date]");
  if (dateButton) {
    state.active = "calendar";
    setDate(dateButton.dataset.date);
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

  if (action === "show-panchang" || action === "show-muhurat") {
    const isPanchang = action === "show-panchang";
    const d = $(isPanchang ? "#p-date" : "#m-date").value;
    const placeInput = $(isPanchang ? "#p-place" : "#m-place");
    const result = $(isPanchang ? "#p-result" : "#m-result");
    const zoneEl = isPanchang ? $("#p-zone") : null;
    const offset = zoneEl ? Number(zoneEl.value) : 330;
    if (!d) { result.innerHTML = `<div class="result-box"><p>कृपया तारीख चुनें।</p></div>`; return; }
    if (actionButton.disabled) return;
    actionButton.disabled = true;
    const originalLabel = actionButton.textContent;
    actionButton.textContent = "गणना हो रही है…";
    result.innerHTML = `<div class="result-box"><p>खगोलीय गणना और स्थान खोजे जा रहे हैं…</p></div>`;
    try {
      const savedLat = result.dataset.latitude;
const savedLon = result.dataset.longitude;

let place;

if (
  savedLat !== undefined &&
  savedLon !== undefined &&
  savedLat !== "" &&
  savedLon !== ""
) {
  place = {
    lat: Number(savedLat),
    lon: Number(savedLon),
    name: placeInput.value.trim() || "GPS Location"
  };
} else {
  place = await geocodePanchangPlace(
    placeInput.value || "Lucknow, India"
  );
}

const data = await calculatePanchang({
  date: d,
  lat: place.lat,
  lon: place.lon,
  timezoneMinutes: offset,
  place: place.name
});
      const time = value => formatPanchangTime(value, offset);
      const dateTime = value => formatPanchangDateTime(value, offset);
      const item = (label, value, end) => `<div class="summary-pill"><small>${label}</small><b>${value}</b>${end ? `<span>समाप्ति: ${dateTime(end)}</span>` : ""}</div>`;
      const period = (label, value) => `<div class="timing-item"><span class="timing-icon">◷</span><div><b>${label}</b><small>${value ? `${time(value.start)} – ${time(value.end)}` : "इस तारीख के लिए गणना उपलब्ध नहीं"}</small></div></div>`;
      const panchakText = data.panchak.active ? `पंचक चल रहा है${data.panchak.end ? ` · समाप्ति ${dateTime(data.panchak.end)}` : ""}` : `पंचक नहीं चल रहा${data.panchak.start ? ` · अगली शुरुआत ${dateTime(data.panchak.start)}` : ""}`;
      const common = `<div class="result-box"><h3>${fmtDate(d)}</h3><p>${data.place} · ${data.weekday}</p><div class="facts-grid">${item("तिथि", `${data.tithi.name} (${data.tithi.paksha})`, data.tithi.end)}${item("नक्षत्र", `${data.nakshatra.name} · पद ${data.nakshatra.pada}`, data.nakshatra.end)}${item("योग", data.yoga.name, data.yoga.end)}${item("करण", data.karana.name, data.karana.end)}${item("सूर्योदय", time(data.sunrise))}${item("सूर्यास्त", time(data.sunset))}</div><p><b>पंचक:</b> ${panchakText}</p><p class="muted">${data.accuracyNote}</p></div>`;
      if (isPanchang) {
        result.innerHTML = common;
        state.date = d;
        $("#global-date").value = d;
        $("#today-date").textContent = fmtDate(d, { day: "numeric", month: "long", year: "numeric" });
        $("#today-meta").textContent = `${data.weekday} · ${data.place}`;
      } else {
  result.innerHTML = renderMuhuratResult(data, d, offset);
  updateMuhuratCards(data, offset);
}
    } catch (error) {
      console.error("Panchang calculation failed:", error);
      result.innerHTML = `<div class="result-box"><b>गणना पूरी नहीं हो सकी</b><p>${String(error?.message || "अज्ञात त्रुटि").replace(/[<>]/g, "")}</p><p>इंटरनेट कनेक्शन और शहर का नाम जाँचें, फिर दोबारा कोशिश करें।</p></div>`;
    } finally {
      actionButton.disabled = false;
      actionButton.textContent = originalLabel;
    }
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
        selectedBirthPlace = null;

        try {
          const url = new URL("https://nominatim.openstreetmap.org/reverse");
          url.searchParams.set("format", "jsonv2");
          url.searchParams.set("lat", String(lat));
          url.searchParams.set("lon", String(lon));
          const response = await fetch(url.toString());
          if (!response.ok) throw new Error("स्थान का नाम नहीं मिल पाया।");
          const data = await response.json();
          const a = data.address || {};
          const place = [a.city || a.town || a.village || a.county, a.state, a.country]
            .filter(Boolean);
          if (place.length) $("#k-place").value = [...new Set(place)].join(", ");
          $("#k-place-status").textContent =
            "GPS स्थान भरा गया है। कुंडली बनाने के लिए जन्मस्थान को खोजकर सूची से चुनें।";
          alert("वर्तमान GPS coordinates भर दिए गए हैं। जन्मस्थान अलग है तो उसे खोजकर सूची से चुनें।");
        } catch (err) {
          console.warn("Reverse geocoding failed:", err);
          alert("Coordinates भर दिए गए हैं, लेकिन स्थान का नाम प्राप्त नहीं हुआ।");
        } finally {
          actionButton.disabled = false;
          actionButton.textContent = " मेरी लोकेशन इस्तेमाल करें";
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
        actionButton.textContent = " मेरी लोकेशन इस्तेमाल करें";
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }


if (
  action === "use-muhurat-location" ||
  action === "use-panchang-location"
) {
  if (!navigator.geolocation) {
    alert("इस ब्राउज़र में GPS सुविधा उपलब्ध नहीं है।");
    return;
  }

  const isMuhurat = action === "use-muhurat-location";
  const placeInput = $(isMuhurat ? "#m-place" : "#p-place");
  const result = $(isMuhurat ? "#m-result" : "#p-result");
  const originalLabel = actionButton.textContent;

  actionButton.disabled = true;
  actionButton.textContent = "लोकेशन प्राप्त हो रही है…";

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      result.dataset.latitude = String(lat);
      result.dataset.longitude = String(lon);

      try {
        const url = new URL(
          "https://nominatim.openstreetmap.org/reverse"
        );
        url.searchParams.set("format", "jsonv2");
        url.searchParams.set("lat", String(lat));
        url.searchParams.set("lon", String(lon));

        const response = await fetch(url.toString());
        if (!response.ok) throw new Error("स्थान का नाम नहीं मिला।");

        const data = await response.json();
        const a = data.address || {};
        const parts = [
          a.city || a.town || a.village || a.county,
          a.state,
          a.country
        ].filter(Boolean);

        if (parts.length) {
          placeInput.value = [...new Set(parts)].join(", ");
        }

        alert("GPS लोकेशन प्राप्त हो गई। अब समय-सारणी देखें।");
      } catch (error) {
        console.warn("GPS reverse geocoding failed:", error);
        alert("GPS coordinates सेव हैं, लेकिन शहर का नाम नहीं मिल पाया।");
      } finally {
        actionButton.disabled = false;
        actionButton.textContent = originalLabel;
      }
    },
    (error) => {
      const messages = {
        1: "लोकेशन की अनुमति नहीं मिली। ब्राउज़र सेटिंग में अनुमति दें।",
        2: "डिवाइस की लोकेशन उपलब्ध नहीं है।",
        3: "लोकेशन प्राप्त करने में समय समाप्त हो गया।"
      };

      alert(messages[error.code] || "लोकेशन प्राप्त नहीं हो सकी।");
      actionButton.disabled = false;
      actionButton.textContent = originalLabel;
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000
    }
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
    if (!match) throw new Error("जन्म तारीख DD-MM-YYYY में लिखें, जैसे 08-01-2002।");

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
    if (!/^\d{2}:\d{2}$/.test(time)) throw new Error("जन्म समय सही भरें।");

    if (!selectedBirthPlace) {
      throw new Error("जन्मस्थान लिखकर खोजें और सूची से सही शहर चुनें।");
    }

    const timezoneMinutes = getBirthTimezoneOffset(
      `${yyyy}-${mm}-${dd}`,
      time,
      selectedBirthPlace.timezone
    );
    const lat = Number(selectedBirthPlace.latitude);
    const lon = Number(selectedBirthPlace.longitude);

    if (
      !Number.isFinite(lat) || lat < -90 || lat > 90 ||
      !Number.isFinite(lon) || lon < -180 || lon > 180
    ) {
      throw new Error("चुने गए स्थान के अक्षांश या देशांतर सही नहीं हैं।");
    }

    const payload = {
      name: $("#k-name").value.trim(),
      date: `${yyyy}-${mm}-${dd}`,
      time,
      timezoneMinutes,
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
      
const reportData = await buildKundliData(payload);
const html = buildKundliHtml(reportData);
result.innerHTML = html;
addKundliPdfButton(result, () => data);
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