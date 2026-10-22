
import {
  SwissEphemeris,
  Planet,
  HouseSystem,
  SiderealMode,
  LunarPoint
} from "@swisseph/browser";

const SIGN_NAMES = [
  "मेष", "वृषभ", "मिथुन", "कर्क", "सिंह", "कन्या",
  "तुला", "वृश्चिक", "धनु", "मकर", "कुंभ", "मीन"
];

const PLANETS = [
  ["सू", Planet.Sun],
  ["चं", Planet.Moon],
  ["मं", Planet.Mars],
  ["बु", Planet.Mercury],
  ["गु", Planet.Jupiter],
  ["शु", Planet.Venus],
  ["श", Planet.Saturn]
];

const PLANET_FULL_NAMES = {
  सू: "सूर्य",
  चं: "चंद्र",
  मं: "मंगल",
  बु: "बुध",
  गु: "गुरु",
  शु: "शुक्र",
  श: "शनि"
};

const HOUSE_CENTERS = [
  [150, 45], [78, 38], [38, 78], [45, 150],
  [38, 222], [78, 262], [150, 255], [222, 262],
  [262, 222], [255, 150], [262, 78], [222, 38]
];

const norm = n => ((n % 360) + 360) % 360;
const signOf = longitude => Math.floor(norm(longitude) / 30);
const degInSign = longitude => norm(longitude) % 30;
const signNumber = sign => sign + 1;

function fmtDeg(longitude) {
  const degree = degInSign(longitude);
  const wholeDegrees = Math.floor(degree);
  const minutes = Math.floor((degree - wholeDegrees) * 60);

  return `${wholeDegrees}°${String(minutes).padStart(2, "0")}′`;
}

// D1 राशि और ग्रह की स्थिति से D9 नवांश राशि निकालें।
function navamsaLongitude(longitude) {
  const lon = norm(longitude);
  const sign = signOf(lon);
  const degree = degInSign(lon);
  const navamsaSize = 30 / 9;
  const part = Math.min(8, Math.floor(degree / navamsaSize));

  // मेष/सिंह/धनु आदि चर, स्थिर और द्विस्वभाव राशियों
  // के लिए नवांश की आरंभिक राशि।
  const modality = sign % 3;
  const start =
    modality === 0 ? sign :
    modality === 1 ? (sign + 8) % 12 :
    (sign + 4) % 12;

  const remainder = degree % navamsaSize;

  return norm(
    start * 30 +
    part * 30 +
    remainder * 9
  );
}

function diamondSvg(title, ascSign, planets, note) {
  const byHouse = Array.from({ length: 12 }, () => []);

  planets.forEach(planet => {
    const sign = signOf(planet.longitude);
    const house = (sign - ascSign + 12) % 12;
    byHouse[house].push(planet.short);
  });

  const centers = HOUSE_CENTERS.map(([x, y], index) => {
    const sign = (ascSign + index) % 12;

    return `
      <g>
        <text x="${x}" y="${y - 9}" class="rashi">
          ${signNumber(sign)}
        </text>
        <text x="${x}" y="${y + 10}" class="planet-label">
          ${byHouse[index].join(" ")}
        </text>
      </g>`;
  }).join("");

  return `
    <article class="kundli-chart-card">
      <h3>${title}</h3>
      <div class="kundli-chart-wrap">
        <svg class="kundli-diamond"
             viewBox="0 0 300 300"
             role="img"
             aria-label="${title} डायमंड कुंडली">
          <rect x="5" y="5" width="290" height="290"
                rx="2" class="chart-frame"/>
          <path
            d="M5 5 L295 295 M295 5 L5 295
               M150 5 L295 150 L150 295 L5 150 Z"
            class="chart-lines"/>
          ${centers}
        </svg>
      </div>
      <p class="chart-note">${note}</p>
    </article>`;
}

function planetTable(planets) {
  return `
    <div class="panel planet-table-panel">
      <h3>ग्रहों की स्थिति (निरयन / लाहिरी)</h3>
      <div class="planet-table-scroll">
        <table class="planet-table">
          <thead>
            <tr>
              <th>ग्रह</th>
              <th>राशि</th>
              <th>अंश</th>
              <th>गति</th>
            </tr>
          </thead>
          <tbody>
            ${planets.map(planet => `
              <tr>
                <td>
                  ${planet.short}
                  <span>${planet.full}</span>
                </td>
                <td>${SIGN_NAMES[signOf(planet.longitude)]}</td>
                <td>${fmtDeg(planet.longitude)}</td>
                <td>${planet.retrograde ? "वक्री" : "मार्गी"}</td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>
    </div>`;
}

function getPosition(swe, julianDay, body, short, full) {
  const position = swe.calculatePosition(julianDay, body);

  return {
    short,
    full,
    longitude: norm(position.longitude),
    speed: position.longitudeSpeed,
    retrograde: position.longitudeSpeed < 0
  };
}

export async function buildKundli(input) {
  if (!input.date || !input.time) {
    throw new Error("जन्म तारीख और समय भरें");
  }

  if (
    !Number.isFinite(input.lat) ||
    !Number.isFinite(input.lon) ||
    Math.abs(input.lat) > 90 ||
    Math.abs(input.lon) > 180
  ) {
    throw new Error("अक्षांश या देशांतर सही नहीं है");
  }

  const swe = new SwissEphemeris();

  try {
    await swe.init();
    swe.setSiderealMode(SiderealMode.Lahiri);

    const [year, month, day] = input.date.split("-").map(Number);
    const [hour, minute] = input.time.split(":").map(Number);

    // स्थानीय जन्म-समय को UTC में बदलें।
    const utcMs =
      Date.UTC(year, month - 1, day, hour, minute) -
      input.timezoneMinutes * 60000;

    const utcDate = new Date(utcMs);
    const julianDay = swe.dateToJulianDay(utcDate);
    const ayanamsa = swe.getAyanamsa(julianDay);

    const houses = swe.calculateHouses(
      julianDay,
      input.lat,
      input.lon,
      HouseSystem.WholeSign
    );

    const ascendant = norm(houses.ascendant - ayanamsa);

    const planets = PLANETS.map(([short, body]) =>
      getPosition(
        swe,
        julianDay,
        body,
        short,
        PLANET_FULL_NAMES[short]
      )
    ).map(planet => ({
      ...planet,
      longitude: norm(planet.longitude - ayanamsa)
    }));

    // राहु की स्थिति निकालें।
    let node;

    try {
      node = getPosition(
        swe, julianDay, LunarPoint.MeanNode, "रा", "राहु"
      );
    } catch {
      node = getPosition(
        swe, julianDay, LunarPoint.TrueNode, "रा", "राहु"
      );
    }

    node.longitude = norm(node.longitude - ayanamsa);

    planets.push(
      node,
      {
        short: "के",
        full: "केतु",
        longitude: norm(node.longitude + 180),
        speed: node.speed,
        retrograde: true
      }
    );

    const ascSign = signOf(ascendant);
    const moonSign = signOf(
      planets.find(planet => planet.short === "चं").longitude
    );

    // D9 में हर ग्रह और लग्न का नवांश निकालें।
    const d9Planets = planets.map(planet => ({
      ...planet,
      longitude: navamsaLongitude(planet.longitude)
    }));

    const d9Asc = signOf(navamsaLongitude(ascendant));

    const name = input.name ? `${input.name} — ` : "";

    const dateLabel = new Intl.DateTimeFormat("hi-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC"
    }).format(new Date(`${input.date}T12:00:00Z`));

    const meta = `
      <div class="kundli-meta">
        <b>${name}${dateLabel} · ${input.time}</b>
        <span>लग्न: ${SIGN_NAMES[ascSign]} (${fmtDeg(ascendant)})</span>
        <span>अयनांश (लाहिरी): ${ayanamsa.toFixed(4)}°</span>
      </div>`;

    const charts = `
      <div class="kundli-chart-grid">
        ${diamondSvg(
          "जन्म कुंडली (D1)",
          ascSign,
          planets,
          "लग्न-आधारित राशि कुंडली"
        )}
        ${diamondSvg(
          "चंद्र कुंडली",
          moonSign,
          planets,
          "चंद्र राशि को प्रथम भाव मानकर"
        )}
        ${diamondSvg(
          "नवांश कुंडली (D9)",
          d9Asc,
          d9Planets,
          "ग्रहों की नवांश राशि के आधार पर"
        )}
      </div>`;

    // वर्गोत्तम: D1 और D9 में एक ही राशि।
    const vargottama = planets.filter(planet =>
      signOf(planet.longitude) ===
      signOf(navamsaLongitude(planet.longitude))
    );

    const extra = `
      <div class="panel calculation-summary">
        <h3>अन्य विवरण</h3>
        <div class="summary-pills">
          <span>लग्न: ${SIGN_NAMES[ascSign]}</span>
          <span>चंद्र राशि: ${SIGN_NAMES[moonSign]}</span>
          <span>
            वक्री ग्रह:
            ${planets.filter(p => p.retrograde)
              .map(p => p.short).join(", ") || "कोई नहीं"}
          </span>
          <span>
            वर्गोत्तम:
            ${vargottama.map(p => p.short).join(", ") || "कोई नहीं"}
          </span>
        </div>
        <p>
          ग्रहों की स्थिति जन्म-तिथि, समय, स्थान, समय क्षेत्र
          और लाहिरी अयनांश पर आधारित है।
        </p>
      </div>`;

    return `${meta}${charts}${planetTable(planets)}${extra}`;

  } finally {
    try {
      swe.close();
    } catch {
      // Library cleanup failure should not hide the calculation error.
    }
  }
}
