import {
  SwissEphemeris,
  Planet,
  SiderealMode
} from "@swisseph/browser";
import "./style.css";

const $ = (id) => document.getElementById(id);
$("year").textContent = new Date().getFullYear();

const signs = ["मेष", "वृषभ", "मिथुन", "कर्क", "सिंह", "कन्या", "तुला", "वृश्चिक", "धनु", "मकर", "कुंभ", "मीन"];
const planets = [
  ["सूर्य", Planet.Sun],
  ["चंद्र", Planet.Moon],
  ["बुध", Planet.Mercury],
  ["शुक्र", Planet.Venus],
  ["मंगल", Planet.Mars],
  ["गुरु", Planet.Jupiter],
  ["शनि", Planet.Saturn],
  ["यूरेनस", Planet.Uranus],
  ["नेपच्यून", Planet.Neptune],
  ["प्लूटो", Planet.Pluto]
];

let enginePromise;
function getEngine() {
  if (!enginePromise) {
    enginePromise = (async () => {
      const engine = new SwissEphemeris();
      await engine.init();
      engine.setSiderealMode(SiderealMode.Lahiri);
      return engine;
    })();
  }
  return enginePromise;
}

function normalize(deg) {
  return ((deg % 360) + 360) % 360;
}
function signIndex(deg) {
  return Math.floor(normalize(deg) / 30);
}
function formatPosition(deg) {
  const n = normalize(deg);
  const d = n % 30;
  const whole = Math.floor(d);
  const minutes = Math.floor((d - whole) * 60);
  const seconds = Math.round((((d - whole) * 60) - minutes) * 60);
  return `${whole}° ${minutes}' ${seconds}"`;
}
function navamsaSign(longitude) {
  // Each 30° sign is divided into nine 3°20' navamsas.
  const n = normalize(longitude);
  const rashi = Math.floor(n / 30);
  const part = Math.min(8, Math.floor((n % 30) / (30 / 9)));
  const modality = rashi % 3;
  const start = modality === 0 ? rashi : modality === 1 ? (rashi + 8) % 12 : (rashi + 4) % 12;
  return (start + part) % 12;
}
function dateToUTC(dateText, timeText, offsetHours) {
  const [y, m, d] = dateText.split("-").map(Number);
  const [hh, mm] = timeText.split(":").map(Number);
  // Convert local birth time to UTC by subtracting the selected UTC offset.
  return new Date(Date.UTC(y, m - 1, d, hh, mm) - Number(offsetHours) * 3600000);
}

$("kundali-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = $("calculate-btn");
  const status = $("status");
  const results = $("results");
  results.hidden = true;
  button.disabled = true;
  status.textContent = "गणना इंजन शुरू हो रहा है…";
  status.className = "status";
  try {
    const dateText = $("birth-date").value;
    const timeText = $("birth-time").value;
    const offset = Number($("utc-offset").value);
    const lat = Number($("latitude").value);
    const lon = Number($("longitude").value);
    if (!dateText || !timeText || !Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      throw new Error("जन्म तारीख, समय और वैध coordinates भरें।");
    }
    const birthUTC = dateToUTC(dateText, timeText, offset);
    const engine = await getEngine();
    const jd = engine.dateToJulianDay(birthUTC);
    const ayanamsha = engine.getAyanamsa(jd);
    const rows = planets.map(([name, body]) => {
      const p = engine.calculatePosition(jd, body);
      const sidereal = normalize(p.longitude - ayanamsha);
      const rashi = signIndex(sidereal);
      const nav = navamsaSign(sidereal);
      const retrograde = typeof p.longitudeSpeed === "number" && p.longitudeSpeed < 0;
      return {
        name, rashi, degree: formatPosition(sidereal), retrograde,
        nav, vargottama: rashi === nav, longitude: sidereal
      };
    });
    // Ascendant from houses; convert tropical ascendant to sidereal using the same ayanamsha.
    let ascText = "उपलब्ध नहीं";
    try {
      const houses = engine.calculateHouses(jd, lat, lon);
      const asc = normalize(houses.ascendant - ayanamsha);
      ascText = `${signs[signIndex(asc)]} ${formatPosition(asc)}`;
    } catch (e) {
      console.warn("Ascendant calculation unavailable:", e);
    }
    $("result-title").textContent = $("person-name").value.trim()
      ? `${$("person-name").value.trim()} की जन्म कुंडली`
      : "ग्रहों की स्थिति";
    $("summary").innerHTML = `
      <article class="summary-card"><span>लग्न (अनुमानित)</span><strong>${ascText}</strong></article>
      <article class="summary-card"><span>अयनांश</span><strong>${Number(ayanamsha).toFixed(4)}°</strong></article>
      <article class="summary-card"><span>जन्म स्थान</span><strong>${escapeHtml($("place").value.trim())}</strong></article>
      <article class="summary-card"><span>समय (UTC)</span><strong>${birthUTC.toISOString().replace("T", " ").slice(0, 16)}</strong></article>`;
    $("planet-rows").innerHTML = rows.map(p => `
      <tr>
        <td><strong>${p.name}</strong></td>
        <td>${signs[p.rashi]}</td>
        <td>${p.degree}</td>
        <td>${p.retrograde ? '<span class="pill retro">वक्री</span>' : '<span class="pill direct">मार्गी</span>'}</td>
        <td>${signs[p.nav]}</td>
        <td>${p.vargottama ? '<span class="pill varga">हाँ</span>' : "—"}</td>
      </tr>`).join("");
    results.hidden = false;
    status.textContent = "गणना पूरी हुई। नीचे परिणाम देखें।";
    status.className = "status success";
  } catch (error) {
    console.error(error);
    status.textContent = `गणना नहीं हो सकी: ${error?.message || "अज्ञात त्रुटि"}। Build log देखें।`;
    status.className = "status error";
  } finally {
    button.disabled = false;
  }
});

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[ch]));
}
$("print-btn").addEventListener("click", () => window.print());
