import { SwissEphemeris, Planet, SiderealMode } from "@swisseph/browser";
import "./style.css";

const $ = (id) => document.getElementById(id);
$("year").textContent = new Date().getFullYear();

const signs = ["मेष", "वृषभ", "मिथुन", "कर्क", "सिंह", "कन्या", "तुला", "वृश्चिक", "धनु", "मकर", "कुंभ", "मीन"];
const nakshatras = ["अश्विनी","भरणी","कृत्तिका","रोहिणी","मृगशिरा","आर्द्रा","पुनर्वसु","पुष्य","आश्लेषा","मघा","पूर्वा फाल्गुनी","उत्तरा फाल्गुनी","हस्त","चित्रा","स्वाती","विशाखा","अनुराधा","ज्येष्ठा","मूल","पूर्वाषाढ़ा","उत्तराषाढ़ा","श्रवण","धनिष्ठा","शतभिषा","पूर्वाभाद्रपद","उत्तराभाद्रपद","रेवती"];
const planets = [
  ["सूर्य", Planet.Sun], ["चंद्र", Planet.Moon], ["बुध", Planet.Mercury],
  ["शुक्र", Planet.Venus], ["मंगल", Planet.Mars], ["गुरु", Planet.Jupiter],
  ["शनि", Planet.Saturn], ["यूरेनस", Planet.Uranus], ["नेपच्यून", Planet.Neptune],
  ["प्लूटो", Planet.Pluto]
];
let enginePromise;
function getEngine() {
  if (!enginePromise) enginePromise = (async () => {
    const e = new SwissEphemeris();
    await e.init();
    e.setSiderealMode(SiderealMode.Lahiri);
    return e;
  })();
  return enginePromise;
}
function normalize(x) { return ((x % 360) + 360) % 360; }
function signIndex(x) { return Math.floor(normalize(x) / 30); }
function fmtDeg(x) {
  const n = normalize(x) % 30, d = Math.floor(n);
  const minsFloat = (n - d) * 60, m = Math.floor(minsFloat), s = Math.round((minsFloat - m) * 60);
  return `${d}° ${m}' ${s}"`;
}
function navamsaSign(longitude) {
  const n = normalize(longitude), rashi = Math.floor(n / 30);
  const part = Math.min(8, Math.floor((n % 30) / (30 / 9)));
  const start = rashi % 3 === 0 ? rashi : rashi % 3 === 1 ? (rashi + 8) % 12 : (rashi + 4) % 12;
  return (start + part) % 12;
}
function localToUTC(dateText, timeText, offsetHours) {
  const [y,m,d] = dateText.split("-").map(Number);
  const [hh,mm] = timeText.split(":").map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh, mm) - Number(offsetHours) * 3600000);
}
function siderealPositions(engine, jd, ayan) {
  return planets.map(([name, body]) => {
    const p = engine.calculatePosition(jd, body);
    const lon = normalize(p.longitude - ayan), rashi = signIndex(lon), nav = navamsaSign(lon);
    return { name, rashi, degree: fmtDeg(lon), retrograde: typeof p.longitudeSpeed === "number" && p.longitudeSpeed < 0,
      nav, vargottama: rashi === nav, longitude: lon };
  });
}
function safe(v) { return String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }

$("kundali-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  await calculateChart();
});
async function calculateChart() {
  const button = $("calculate-btn"), status = $("status"), results = $("results");
  button.disabled = true; results.hidden = true; status.className = "status"; status.textContent = "गणना इंजन शुरू हो रहा है…";
  try {
    const dateText = $("birth-date").value, timeText = $("birth-time").value, offset = Number($("utc-offset").value);
    const lat = Number($("latitude").value), lon = Number($("longitude").value);
    if (!dateText || !timeText || !Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) throw new Error("जन्म तारीख, समय और वैध coordinates भरें।");
    const utc = localToUTC(dateText, timeText, offset), engine = await getEngine(), jd = engine.dateToJulianDay(utc);
    const ayan = engine.getAyanamsa(jd), rows = siderealPositions(engine, jd, ayan);
    let ascText = "उपलब्ध नहीं";
    try { const h = engine.calculateHouses(jd, lat, lon); ascText = `${signs[signIndex(normalize(h.ascendant - ayan))]} ${fmtDeg(normalize(h.ascendant - ayan))}`; } catch {}
    $("result-title").textContent = $("person-name").value.trim() ? `${safe($("person-name").value.trim())} की जन्म कुंडली` : "जन्म कुंडली";
    $("summary").innerHTML = `
      <article class="summary-card"><span>लग्न</span><strong>${ascText}</strong></article>
      <article class="summary-card"><span>अयनांश</span><strong>${Number(ayan).toFixed(4)}°</strong></article>
      <article class="summary-card"><span>जन्म स्थान</span><strong>${safe($("place").value.trim())}</strong></article>
      <article class="summary-card"><span>स्थानीय तारीख/समय</span><strong>${safe(dateText)} · ${safe(timeText)}</strong></article>`;
    $("planet-rows").innerHTML = rows.map(p => `<tr><td><strong>${p.name}</strong></td><td>${signs[p.rashi]}</td><td>${p.degree}</td><td>${p.retrograde ? '<span class="pill retro">वक्री</span>' : '<span class="pill direct">मार्गी</span>'}</td><td>${signs[p.nav]}</td><td>${p.vargottama ? '<span class="pill varga">हाँ</span>' : "—"}</td></tr>`).join("");
    results.hidden = false; status.textContent = "कुंडली की गणना पूरी हुई।"; status.className = "status success";
  } catch (e) { console.error(e); status.textContent = `गणना नहीं हो सकी: ${e?.message || "अज्ञात त्रुटि"}`; status.className = "status error"; }
  finally { button.disabled = false; }
}

$("panchang-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = $("panchang-btn"), status = $("panchang-status"), box = $("panchang-results");
  button.disabled = true; box.hidden = true; status.className = "status"; status.textContent = "चुनी हुई तारीख की गणना हो रही है…";
  try {
    const date = $("panchang-date").value, time = $("panchang-time").value, offset = Number($("panchang-offset").value);
    const lat = Number($("panchang-lat").value), lon = Number($("panchang-lon").value);
    if (!date || !time || !Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) throw new Error("तारीख, समय और वैध coordinates भरें।");
    const utc = localToUTC(date, time, offset), engine = await getEngine(), jd = engine.dateToJulianDay(utc), ayan = engine.getAyanamsa(jd);
    const sun = engine.calculatePosition(jd, Planet.Sun), moon = engine.calculatePosition(jd, Planet.Moon);
    const sunLon = normalize(sun.longitude - ayan), moonLon = normalize(moon.longitude - ayan);
    const elongation = normalize(moonLon - sunLon);
    const tithiNum = Math.floor(elongation / 12) + 1;
    const paksha = tithiNum <= 15 ? "शुक्ल पक्ष" : "कृष्ण पक्ष";
    const tithiNames = ["प्रतिपदा","द्वितीया","तृतीया","चतुर्थी","पंचमी","षष्ठी","सप्तमी","अष्टमी","नवमी","दशमी","एकादशी","द्वादशी","त्रयोदशी","चतुर्दशी","पूर्णिमा"];
    const tithiName = tithiNum === 30 ? "अमावस्या" : tithiNames[(tithiNum - 1) % 15];
    const nMoon = Math.floor(moonLon / (360 / 27)), nYoga = Math.floor(normalize(sunLon + moonLon) / (360 / 27));
    const karanaNames = ["किंस्तुघ्न","बव","बालव","कौलव","तैतिल","गर","वणिज","विष्टि"];
    const halfTithi = Math.floor(elongation / 6);
    const karana = halfTithi === 0 ? karanaNames[0] : karanaNames[halfTithi % 7 + 1];
    const weekday = new Date(`${date}T12:00:00`).getDay();
    const weekdays = ["रविवार","सोमवार","मंगलवार","बुधवार","गुरुवार","शुक्रवार","शनिवार"];
    $("panchang-results").innerHTML = `
      <div class="summary-grid">
        <article class="summary-card"><span>तारीख</span><strong>${safe(date)}</strong></article>
        <article class="summary-card"><span>वार</span><strong>${weekdays[weekday]}</strong></article>
        <article class="summary-card"><span>तिथि (अनुमानित)</span><strong>${tithiName}</strong><small>${paksha}</small></article>
        <article class="summary-card"><span>चंद्र नक्षत्र (अनुमानित)</span><strong>${nakshatras[nMoon]}</strong></article>
        <article class="summary-card"><span>योग (अनुमानित)</span><strong>${nakshatras[nYoga]}</strong></article>
        <article class="summary-card"><span>करण (अनुमानित)</span><strong>${karana}</strong></article>
        <article class="summary-card"><span>चंद्र राशि</span><strong>${signs[signIndex(moonLon)]}</strong></article>
        <article class="summary-card"><span>सूर्य राशि</span><strong>${signs[signIndex(sunLon)]}</strong></article>
      </div>
      <p class="disclaimer">ध्यान दें: यह तारीख और दिए गए समय पर ग्रहों के कोण से निकला प्रारंभिक अनुमान है। स्थानीय सूर्योदय, चंद्रास्त, पंचांग परंपरा और समय-सीमा के कारण तिथि/नक्षत्र बदल सकते हैं। इसे प्रमाणित दैनिक पंचांग न मानें।</p>`;
    box.hidden = false; status.textContent = "चुनी हुई तारीख की गणना पूरी हुई।"; status.className = "status success";
  } catch (e) { console.error(e); status.textContent = `गणना नहीं हो सकी: ${e?.message || "अज्ञात त्रुटि"}`; status.className = "status error"; }
  finally { button.disabled = false; }
});
$("print-btn").addEventListener("click", () => window.print());
$("panchang-print").addEventListener("click", () => window.print());
