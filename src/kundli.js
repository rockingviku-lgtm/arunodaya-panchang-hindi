import { SwissEphemeris, Planet, HouseSystem, SiderealMode, LunarPoint } from "@swisseph/browser";

const SIGN_NAMES = ["मेष","वृषभ","मिथुन","कर्क","सिंह","कन्या","तुला","वृश्चिक","धनु","मकर","कुंभ","मीन"];
const PLANETS = [
  ["सू", Planet.Sun], ["चं", Planet.Moon], ["मं", Planet.Mars], ["बु", Planet.Mercury],
  ["गु", Planet.Jupiter], ["शु", Planet.Venus], ["श", Planet.Saturn]
];
const HOUSE_CENTERS = [[150,45],[78,38],[38,78],[45,150],[38,222],[78,262],[150,255],[222,262],[262,222],[255,150],[262,78],[222,38]];
const NAKSHATRAS = ["अश्विनी","भरणी","कृत्तिका","रोहिणी","मृगशिरा","आर्द्रा","पुनर्वसु","पुष्य","आश्लेषा","मघा","पूर्वा फाल्गुनी","उत्तरा फाल्गुनी","हस्त","चित्रा","स्वाती","विशाखा","अनुराधा","ज्येष्ठा","मूल","पूर्वाषाढ़ा","उत्तराषाढ़ा","श्रवण","धनिष्ठा","शतभिषा","पूर्वाभाद्रपद","उत्तराभाद्रपद","रेवती"];
const DASHA_LORDS = [["केतु",7],["शुक्र",20],["सूर्य",6],["चंद्र",10],["मंगल",7],["राहु",18],["गुरु",16],["शनि",19],["बुध",17]];
const NAK_SPAN = 360 / 27;
const norm = n => ((n % 360) + 360) % 360;
const signOf = lon => Math.floor(norm(lon) / 30);
const degInSign = lon => norm(lon) % 30;
const signNumber = s => s + 1;
const fmtDeg = lon => {
  const d = degInSign(lon), deg = Math.floor(d), min = Math.floor((d-deg)*60);
  return `${deg}°${String(min).padStart(2,"0")}′`;
};
function nakshatraInfo(longitude) {
  const lon = norm(longitude);
  const index = Math.floor(lon / NAK_SPAN);
  const fraction = (lon - index * NAK_SPAN) / NAK_SPAN;
  return { name: NAKSHATRAS[index], pada: Math.min(4, Math.floor(fraction * 4) + 1), index, fraction };
}
function dateAtYears(start, years) {
  return new Date(start.getTime() + years * 365.2425 * 86400000);
}
function fmtDashaDate(date) {
  return new Intl.DateTimeFormat("hi-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(date);
}
function vimshottariDasha(moonLongitude, birthUtc) {
  const nak = nakshatraInfo(moonLongitude);
  const firstIndex = nak.index % 9;
  const firstBalance = DASHA_LORDS[firstIndex][1] * (1 - nak.fraction);
  const periods = [];
  let cursor = new Date(birthUtc);
  for (let i = 0; i < 18; i++) {
    const idx = (firstIndex + i) % 9;
    const years = i === 0 ? firstBalance : DASHA_LORDS[idx][1];
    const end = dateAtYears(cursor, years);
    periods.push({ lord: DASHA_LORDS[idx][0], start: new Date(cursor), end, years });
    cursor = end;
  }
  const now = new Date();
  const maha = periods.find(x => now >= x.start && now < x.end) || periods[periods.length - 1];
  let subCursor = new Date(maha.start), antar = null;
  const mahaIndex = DASHA_LORDS.findIndex(x => x[0] === maha.lord);
  for (let j = 0; j < 9; j++) {
    const idx = (mahaIndex + j) % 9;
    const years = maha.years * DASHA_LORDS[idx][1] / 120;
    const end = dateAtYears(subCursor, years);
    if (now >= subCursor && now < end) antar = { lord: DASHA_LORDS[idx][0], start: subCursor, end };
    subCursor = end;
  }
  return { nakshatra: nak.name, pada: nak.pada, balanceYears: firstBalance, mahadasha: maha, antardasha: antar, timeline: periods.slice(0, 9) };
}
function navamsaLongitude(longitude) {
  // Each 3°20′ segment maps to one Navamsa sign. Keep the within-segment
  // position scaled by 9 so the D9 longitude retains its degree within sign.
  const lon = norm(longitude);
  const sign = signOf(lon);
  const withinSign = degInSign(lon);
  const navamsaPart = Math.min(8, Math.floor(withinSign / (30 / 9)));
  const modality = sign % 3; // 0 movable, 1 fixed, 2 dual
  const firstNavamsaSign = modality === 0 ? sign : modality === 1 ? (sign + 8) % 12 : (sign + 4) % 12;
  const navamsaSign = (firstNavamsaSign + navamsaPart) % 12;
  const degreeWithinNavamsa = (withinSign - navamsaPart * (30 / 9)) * 9;
  return norm(navamsaSign * 30 + degreeWithinNavamsa);
}
function parseBirthDateTime(dateText, timeText, timezoneMinutes) {
  if (typeof dateText !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dateText)) {
    throw new Error("जन्म तारीख चुनें (दिन-महीना-वर्ष)");
  }
  if (typeof timeText !== "string" || !/^\d{2}:\d{2}$/.test(timeText)) {
    throw new Error("जन्म समय सही भरें");
  }
  const [year, month, day] = dateText.split("-").map(Number);
  const [hour, minute] = timeText.split(":").map(Number);
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day || hour > 23 || minute > 59) {
    throw new Error("जन्म तारीख या समय मान्य नहीं है");
  }
  // Default to India Standard Time when caller doesn't provide a timezone.
  const offset = Number.isFinite(timezoneMinutes) ? timezoneMinutes : 330;
  return new Date(Date.UTC(year, month - 1, day, hour, minute) - offset * 60000);
}
function diamondSvg(title, ascSign, planets, note) {
  const byHouse = Array.from({length:12},()=>[]);
  planets.forEach(p => {
    const sign = signOf(p.longitude);
    const house = (sign - ascSign + 12) % 12;
    byHouse[house].push(p.short);
  });
  const centers = HOUSE_CENTERS.map(([x,y],i)=>{
    const sign = (ascSign+i)%12;
    return `<g><text x="${x}" y="${y-9}" class="rashi">${signNumber(sign)}</text><text x="${x}" y="${y+10}" class="planet-label">${byHouse[i].join(" ")}</text></g>`;
  }).join("");
  return `<article class="kundli-chart-card"><h3>${title}</h3><div class="kundli-chart-wrap"><svg class="kundli-diamond" viewBox="0 0 300 300" role="img" aria-label="${title} डायमंड कुंडली">
  <rect x="5" y="5" width="290" height="290" rx="2" class="chart-frame"/>
  <path d="M5 5 L295 295 M295 5 L5 295 M150 5 L295 150 L150 295 L5 150 Z" class="chart-lines"/>
  ${centers}</svg></div><p class="chart-note">${note}</p></article>`;
}
function planetTable(planets) {
 return `<div class="panel planet-table-panel"><h3>ग्रहों की स्थिति (निरयन / लाहिरी)</h3><div class="planet-table-scroll"><table class="planet-table"><thead><tr><th>ग्रह</th><th>राशि</th><th>अंश</th><th>नक्षत्र</th><th>पद</th><th>गति</th></tr></thead><tbody>${planets.map(p=>{const n=nakshatraInfo(p.longitude);return `<tr><td>${p.short} <span>${p.full}</span></td><td>${SIGN_NAMES[signOf(p.longitude)]}</td><td>${fmtDeg(p.longitude)}</td><td>${n.name}</td><td>${n.pada}</td><td>${p.retrograde?"वक्री":"मार्गी"}</td></tr>`}).join("")}</tbody></table></div></div>`;
}
function dashaPanel(dasha) {
 const maha = dasha.mahadasha, antar = dasha.antardasha;
 return `<div class="panel calculation-summary"><h3>विंशोत्तरी दशा</h3><div class="summary-pills"><span>जन्म नक्षत्र: ${dasha.nakshatra} (पद ${dasha.pada})</span><span>जन्म के समय शेष दशा: ${dasha.balanceYears.toFixed(2)} वर्ष</span><span>वर्तमान महादशा: ${maha.lord}</span><span>वर्तमान अंतरदशा: ${antar ? antar.lord : "गणना उपलब्ध नहीं"}</span></div><p>महादशा: ${fmtDashaDate(maha.start)} – ${fmtDashaDate(maha.end)}${antar ? ` · अंतरदशा: ${fmtDashaDate(antar.start)} – ${fmtDashaDate(antar.end)}` : ""}</p><div class="planet-table-scroll"><table class="planet-table"><thead><tr><th>महादशा</th><th>आरंभ</th><th>समाप्ति</th></tr></thead><tbody>${dasha.timeline.map(x=>`<tr><td>${x.lord}</td><td>${fmtDashaDate(x.start)}</td><td>${fmtDashaDate(x.end)}</td></tr>`).join("")}</tbody></table></div></div>`;
}
function getPosition(swe,jd,body,short,full) {
 const pos=swe.calculatePosition(jd,body);
 return {short,full,longitude:norm(pos.longitude),speed:pos.longitudeSpeed,retrograde:pos.longitudeSpeed<0};
}
export async function buildKundli(input) {
 if(!input || !input.date || !input.time) throw new Error("जन्म तारीख और समय भरें");
 if(!Number.isFinite(Number(input.lat))||!Number.isFinite(Number(input.lon))||Math.abs(Number(input.lat))>90||Math.abs(Number(input.lon))>180) throw new Error("अक्षांश या देशांतर सही नहीं है");
 const utcDate = parseBirthDateTime(input.date, input.time, input.timezoneMinutes);
 const swe = new SwissEphemeris();
 try {
   await swe.init();
   swe.setSiderealMode(SiderealMode.Lahiri);
   const jd=swe.dateToJulianDay(utcDate);
   const ayanamsa=swe.getAyanamsa(jd);
   const houses=swe.calculateHouses(jd,Number(input.lat),Number(input.lon),HouseSystem.WholeSign);
   const ascendant=norm(houses.ascendant-ayanamsa);
   const planets=PLANETS.map(([short,body])=>getPosition(swe,jd,body,short,({सू:"सूर्य",चं:"चंद्र",मं:"मंगल",बु:"बुध",गु:"गुरु",शु:"शुक्र",श:"शनि"})[short]))
     .map(p=>({...p,longitude:norm(p.longitude-ayanamsa)}));
   let node;
   try { node=getPosition(swe,jd,LunarPoint.MeanNode,"रा","राहु"); }
   catch { node=getPosition(swe,jd,LunarPoint.TrueNode,"रा","राहु"); }
   node.longitude=norm(node.longitude-ayanamsa);
   planets.push(node,{short:"के",full:"केतु",longitude:norm(node.longitude+180),speed:node.speed,retrograde:true});
   const ascSign=signOf(ascendant);
   const moon=planets.find(p=>p.short==="चं");
   const moonSign=signOf(moon.longitude);
   const dasha=vimshottariDasha(moon.longitude,utcDate);
   const d9Planets=planets.map(p=>({...p,d1Sign:signOf(p.longitude),longitude:navamsaLongitude(p.longitude)}));
   const d9Asc=signOf(navamsaLongitude(ascendant));
   const name=input.name ? `${input.name} — ` : "";
   const dateLabel=new Intl.DateTimeFormat("hi-IN",{day:"numeric",month:"long",year:"numeric",timeZone:"UTC"}).format(new Date(`${input.date}T12:00:00Z`));
   const meta=`<div class="kundli-meta"><b>${name}${dateLabel} · ${input.time}</b><span>लग्न: ${SIGN_NAMES[ascSign]} (${fmtDeg(ascendant)})</span><span>अयनांश (लाहिरी): ${ayanamsa.toFixed(4)}°</span></div>`;
   const charts=`<div class="kundli-chart-grid">${diamondSvg("जन्म कुंडली (D1)",ascSign,planets,"लग्न-आधारित राशि कुंडली")}${diamondSvg("चंद्र कुंडली",moonSign,planets,"चंद्र राशि को प्रथम भाव मानकर")}${diamondSvg("नवांश कुंडली (D9)",d9Asc,d9Planets,"ग्रहों की नवांश राशि के आधार पर")}</div>`;
   // Vargottama means the planet occupies the same sign in D1 and D9.
   // Compare the original sidereal D1 sign with the D9 sign exactly once.
   const vargottama = planets.filter(p => {
  const d1Sign = signOf(p.longitude);
  const d9Sign = signOf(navamsaLongitude(p.longitude));
  return d1Sign === d9Sign;
});
   const extra=`<div class="panel calculation-summary"><h3>अन्य विवरण</h3><div class="summary-pills"><span>लग्न: ${SIGN_NAMES[ascSign]}</span><span>चंद्र राशि: ${SIGN_NAMES[moonSign]}</span><span>वक्री ग्रह: ${planets.filter(p=>p.retrograde).map(p=>p.short).join(", ")||"कोई नहीं"}</span><span>वर्गोत्तम: ${vargottama.map(p=>p.short).join(", ")||"कोई नहीं"}</span></div><p>ग्रहों की राशि और भाव स्थिति जन्म समय, स्थान, समय क्षेत्र तथा लाहिरी अयनांश पर आधारित है।</p></div>`;
   return `${meta}${charts}${planetTable(planets)}${dashaPanel(dasha)}${extra}`;
 } finally { try{swe.close();}catch{} }
}