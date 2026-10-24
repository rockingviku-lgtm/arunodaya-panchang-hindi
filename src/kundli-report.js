
import { calculateVimshottariDasha, formatDashaDateTime, dashaDurationYears } from "./dasha-engine.js";

const SIGNS = ["मेष","वृषभ","मिथुन","कर्क","सिंह","कन्या","तुला","वृश्चिक","धनु","मकर","कुंभ","मीन"];
const NAK = ["अश्विनी","भरणी","कृत्तिका","रोहिणी","मृगशिरा","आर्द्रा","पुनर्वसु","पुष्य","आश्लेषा","मघा","पूर्वा फाल्गुनी","उत्तरा फाल्गुनी","हस्त","चित्रा","स्वाती","विशाखा","अनुराधा","ज्येष्ठा","मूल","पूर्वाषाढ़ा","उत्तराषाढ़ा","श्रवण","धनिष्ठा","शतभिषा","पूर्वाभाद्रपद","उत्तराभाद्रपद","रेवती"];
const NAK_SYLLABLES = ["चू चे चो ला","ली लू ले लो","अ आ ई ऊ","ओ वा वी वू","वे वो का की","कू घ ङ छ","के को हा ही","हू हे हो डा","डी डू डे डो","मा मी मू मे","मो टा टी टू","टे टो पा पी","पू ष ण ठ","पे पो रा री","रू रे रो ता","ती तू ते तो","ना नी नू ने","नो या यी यू","ये यो भा भी","भू धा फा ढा","भे भो जा जी","खी खू खे खो","गा गी गु गे","गो सा सी सू","से सो दा दी","दू थ झ ञ","दे दो चा ची"].map(x => x.split(" "));
const NAK_GANA = ["देव","मनुष्य","राक्षस","मनुष्य","देव","मनुष्य","देव","देव","राक्षस","राक्षस","मनुष्य","मनुष्य","देव","राक्षस","देव","राक्षस","देव","राक्षस","राक्षस","मनुष्य","मनुष्य","देव","राक्षस","राक्षस","मनुष्य","मनुष्य","देव"];
const NAK_NADI = ["आदि","मध्य","अन्त्य","अन्त्य","मध्य","आदि","आदि","मध्य","अन्त्य","अन्त्य","मध्य","आदि","आदि","मध्य","अन्त्य","अन्त्य","मध्य","आदि","आदि","मध्य","अन्त्य","अन्त्य","मध्य","आदि","आदि","मध्य","अन्त्य"];
const NAK_YONI = ["घोड़ा","हाथी","भेड़","सर्प","सर्प","कुत्ता","बिल्ली","भेड़","बिल्ली","चूहा","चूहा","गाय","भैंस","बाघ","भैंस","बाघ","हिरण","हिरण","कुत्ता","वानर","नेवला","वानर","सिंह","घोड़ा","सिंह","गाय","हाथी"];
const LAGNA_SYMBOLS = ["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"];
const HOUSE_BRIEF = [
  "स्वभाव, शरीर, व्यक्तित्व और जीवन की शुरुआत",
  "धन, बचत, वाणी और परिवार",
  "साहस, प्रयास, भाई-बहन और संचार",
  "माता, घर, सुख और संपत्ति",
  "बुद्धि, शिक्षा, संतान और रचनात्मकता",
  "रोग, ऋण, प्रतिस्पर्धा और सेवा",
  "विवाह, साझेदारी और सार्वजनिक संबंध",
  "आयु, परिवर्तन और साझा संसाधन",
  "भाग्य, धर्म, गुरु और उच्च शिक्षा",
  "कर्म, पेशा और प्रतिष्ठा",
  "लाभ, आय, मित्र और इच्छाएँ",
  "व्यय, निद्रा, एकांत और विदेश"
];

const norm = n => ((Number(n) % 360) + 360) % 360;
const sign = n => Math.floor(norm(n) / 30);
const deg = n => norm(n) % 30;
const fmt = n => Number.isFinite(Number(n)) ? Number(n).toFixed(2) + "°" : "—";
const pname = p => p?.full || p?.short || "ग्रह";
const esc = v => String(v ?? "—").replace(/[&<>"']/g, c => ({
  "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
}[c]));

function nak(n) {
  const x = norm(n) / (360 / 27);
  const i = Math.floor(x);
  return { name: NAK[i], pada: Math.floor((x - i) * 4) + 1 };
}

function table(head, rows) {
  return `<div class="kr-table-wrap"><table class="kr-table">
    <thead><tr>${head.map(x => `<th>${esc(x)}</th>`).join("")}</tr></thead>
    <tbody>${rows.map(r => `<tr>${r.map(x => `<td>${esc(x)}</td>`).join("")}</tr>`).join("")}</tbody>
  </table></div>`;
}

function chart(title, base, planets, kind = "D1") {
  const cells = Array.from({ length: 12 }, (_, i) => ({
    h: i + 1, s: (base + i) % 12, p: []
  }));

  (planets || []).forEach(p => {
    if (Number.isFinite(Number(p.longitude))) {
      cells[(sign(p.longitude) - base + 12) % 12].p.push(p.short || p.full || "");
    }
  });

  const pos = [
    [200,62],[100,45],[45,100],[62,200],[45,300],[100,355],
    [200,338],[300,355],[355,300],[338,200],[355,100],[300,45]
  ];

  const paths = `<rect x="10" y="10" width="380" height="380" fill="#fffaf0" stroke="#9c7133" stroke-width="2"/>
    <path d="M10 10 L390 390 M390 10 L10 390 M200 10 L390 200 L200 390 L10 200 Z" fill="none" stroke="#9c7133" stroke-width="1.5"/>`;

  return `<section class="kr-section"><h2>${esc(title)}</h2>
    <div class="kr-chart-wrap"><svg class="kr-chart" viewBox="0 0 400 400" role="img" aria-label="${esc(title)}">
      ${paths}
      ${cells.map((c, i) => {
        const [x, y] = pos[i];
        return `<g>
          <text x="${x}" y="${y-15}" text-anchor="middle" font-size="10" fill="#795322">${c.h} भाव</text>
          <text x="${x}" y="${y}" text-anchor="middle" font-size="12" font-weight="700" fill="#795322">${SIGNS[c.s]}</text>
          <text x="${x}" y="${y+18}" text-anchor="middle" font-size="11" fill="#182033">${esc(c.p.join(" · ") || "—")}</text>
        </g>`;
      }).join("")}
    </svg></div>
    <p class="kr-muted">${kind === "D9" ? "D9 नवांश कुंडली" : "उत्तर भारतीय डायमंड प्रारूप"}</p>
  </section>`;
}

function normalizeBirthTime(data) {
  const candidates = [
    data?.birthTime, data?.time, data?.birth_time, data?.birthTimeLocal,
    data?.birth_time_local, data?.input?.birthTime, data?.input?.time,
    data?.birth?.time, data?.details?.birthTime
  ];

  for (const value of candidates) {
    if (value == null) continue;
    const text = String(value).trim();
    if (!text || /^(unknown|अज्ञात|उपलब्ध नहीं|n\/?a|--|-)$/i.test(text)) continue;
    const match = text.match(/(?:^|\b)(\d{1,2}):(\d{2})(?::(\d{2}))?/);
    if (match) {
      const h = Number(match[1]), m = Number(match[2]), s = Number(match[3] || 0);
      if (h <= 23 && m <= 59 && s <= 59) {
        return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
      }
    }
  }
  return "";
}

function dateLabel(value) {
  if (!value) return "उपलब्ध नहीं";
  const d = new Date(value + "T12:00:00Z");
  return Number.isNaN(d.getTime()) ? value :
    new Intl.DateTimeFormat("hi-IN", {
      day:"numeric", month:"long", year:"numeric", timeZone:"UTC"
    }).format(d);
}

function checkKaalSarp(planets) {
  const r = planets.find(p => p.short === "रा" || p.full === "राहु");
  const k = planets.find(p => p.short === "के" || p.full === "केतु");
  const classical = planets.filter(p =>
    ["सू","चं","मं","बु","गु","शु","श"].includes(p.short) ||
    ["सूर्य","चंद्र","मंगल","बुध","गुरु","शुक्र","शनि"].includes(p.full)
  );

  if (!r || !k || classical.length < 7 ||
      !Number.isFinite(Number(r.longitude)) ||
      !Number.isFinite(Number(k.longitude)) ||
      classical.some(p => !Number.isFinite(Number(p.longitude)))) {
    return { status:"निर्णय नहीं हो सका", note:"सभी आवश्यक ग्रहों के सटीक देशांतर उपलब्ध नहीं हैं।" };
  }

  const distances = classical.map(p => norm(Number(p.longitude) - Number(r.longitude)));
  const sameHalf = distances.every(x => x <= 180.000001) ||
                   distances.every(x => x >= 179.999999);

  return sameHalf
    ? { status:"संभावित पूर्ण कालसर्प विन्यास", note:"यह प्रारंभिक राशि-अक्ष जाँच है; पारंपरिक नियमों से पुष्टि करें।" }
    : { status:"पूर्ण कालसर्प विन्यास नहीं मिला", note:"ग्रह राहु–केतु अक्ष के एक ही अर्धवृत्त में नहीं हैं।" };
}

export function calculateSadeSati(moonLongitude, transitSaturnLongitude) {
  if (!Number.isFinite(Number(moonLongitude)) ||
      !Number.isFinite(Number(transitSaturnLongitude))) {
    return { status:"गणना हेतु शनि का गोचर आवश्यक", phase:"—" };
  }

  const ms = sign(moonLongitude), ss = sign(transitSaturnLongitude);
  const rel = (ss - ms + 12) % 12;

  if (rel === 11) return { status:"साढ़ेसाती चल रही है", phase:"प्रथम चरण" };
  if (rel === 0) return { status:"साढ़ेसाती चल रही है", phase:"द्वितीय चरण" };
  if (rel === 1) return { status:"साढ़ेसाती चल रही है", phase:"तृतीय चरण" };
  return { status:"चयनित गोचर राशि में साढ़ेसाती नहीं", phase:"—" };
}

export function buildKundliReportSections(data) {
  if (!data || !Array.isArray(data.planets)) {
    throw new Error("कुंडली डेटा उपलब्ध नहीं है।");
  }

  const planets = data.planets;
  const birthTime = normalizeBirthTime(data);
  const birthDate = data.birthDate ?? data.date ?? data.dob ?? data.input?.date ?? "";
  const asc = Number.isFinite(Number(data.ascendantSign))
    ? Number(data.ascendantSign) : sign(data.ascendantLongitude || 0);
  const moon = planets.find(p => p.short === "चं" || p.full === "चंद्र");
  const moonSign = Number.isFinite(Number(data.moonSign))
    ? Number(data.moonSign) : moon ? sign(moon.longitude) : 0;

  const meta = [
    ["नाम", data.name || "उपलब्ध नहीं"],
    ["जन्म तिथि", dateLabel(birthDate)],
    ["जन्म समय", birthTime || "उपलब्ध नहीं"],
    ["जन्म स्थान", data.place || "उपलब्ध नहीं"],
    ["अक्षांश", Number.isFinite(Number(data.lat)) ? Number(data.lat).toFixed(5) + "°" : "उपलब्ध नहीं"],
    ["देशांतर", Number.isFinite(Number(data.lon)) ? Number(data.lon).toFixed(5) + "°" : "उपलब्ध नहीं"],
    ["अयनांश", fmt(data.ayanamsa)],
    ["लग्न", `${LAGNA_SYMBOLS[asc] || ""} ${SIGNS[asc] || "—"} (${fmt(data.ascendantLongitude)})`],
    ["चंद्र राशि", SIGNS[moonSign] || "—"]
  ];

  const planetRows = planets.map(p => {
    const n = nak(p.longitude);
    return [
      pname(p), SIGNS[sign(p.longitude)], fmt(deg(p.longitude)),
      n.name, "पाद " + n.pada, p.retrograde ? "वक्री" : "मार्गी"
    ];
  });

  const houses = Array.from({ length:12 }, (_, i) => [
    i + 1,
    SIGNS[(asc + i) % 12],
    planets.filter(p => (sign(p.longitude) - asc + 12) % 12 === i).map(pname).join(", ") || "—",
    HOUSE_BRIEF[i]
  ]);

  const d9 = Array.isArray(data.d9Planets) ? data.d9Planets : [];
  const sade = calculateSadeSati(
    moon ? moon.longitude : NaN,
    data.transitSaturnLongitude ?? data.currentTransitSaturnLongitude
  );
  const kaalSarp = checkKaalSarp(planets);

  let dashaHtml = `<p class="kr-muted">विंशोत्तरी दशा के लिए जन्म तिथि, जन्म समय और चंद्रमा का देशांतर आवश्यक है।</p>`;
  const timeMatch = birthTime.match(/^(\d{2}):(\d{2})$/);
  const timezoneMinutes = Number.isFinite(Number(data.timezoneMinutes)) ? Number(data.timezoneMinutes) : 330;

  if (birthDate && timeMatch && moon && Number.isFinite(Number(moon.longitude))) {
    const date = String(birthDate).slice(0,10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const localMs = Date.UTC(
        Number(date.slice(0,4)), Number(date.slice(5,7))-1, Number(date.slice(8,10)),
        Number(timeMatch[1]), Number(timeMatch[2])
      );
      const birthUtc = new Date(localMs - timezoneMinutes * 60000);
      const result = calculateVimshottariDasha(Number(moon.longitude), birthUtc, new Date());

      if (result?.ok) {
        const current = result.currentMaha;
        dashaHtml = `<p><strong>जन्म नक्षत्र:</strong> ${esc(result.nakshatra || nak(moon.longitude).name)}</p>
          <p><strong>वर्तमान महादशा:</strong> ${esc(current?.lord || "उपलब्ध नहीं")}</p>
          <p><strong>अंतर्दशा:</strong> ${esc(result.currentAntar?.lord || "उपलब्ध नहीं")}</p>`;
      } else {
        dashaHtml = `<p class="kr-muted">${esc(result?.reason || "दशा की गणना नहीं हो सकी।")}</p>`;
      }
    }
  }

  return `<div class="kr-report">
    <section class="kr-cover">
      <div class="kr-ganesh">ॐ गं गणपतये नमः</div>
      <div class="kr-eyebrow">ARUNODAYA PANCHANG</div>
      <h1>वैदिक जन्म कुंडली</h1>
      <p>जन्म विवरण · ग्रह स्थिति · वर्ग कुंडली · दशा विवरण</p>
      ${table(["विवरण","मान"], meta.slice(0,4))}
      <p class="kr-muted">गणना-आधारित विवरण · पारंपरिक ज्योतिषीय संदर्भ</p>
    </section>

    <section class="kr-section"><h2>1. जन्म विवरण</h2>${table(["विवरण","मान"], meta)}</section>
    ${chart("2. D1 जन्म कुंडली", asc, planets)}
    ${chart("3. चंद्र कुंडली", moonSign, planets)}
    ${chart("4. D9 नवांश कुंडली", Number.isFinite(Number(data.d9Asc)) ? Number(data.d9Asc) : asc, d9, "D9")}

    <section class="kr-section"><h2>5. ग्रह स्थिति</h2>
      ${table(["ग्रह","राशि","अंश","नक्षत्र","पाद","गति"], planetRows)}
    </section>

    <section class="kr-section"><h2>6. सभी 12 भाव</h2>
      ${table(["भाव","राशि","स्थित ग्रह","मुख्य विषय"], houses)}
    </section>

    <section class="kr-section"><h2>7. D9 नवांश ग्रह</h2>
      ${d9.length ? table(["ग्रह","राशि","अंश","नक्षत्र"], d9.map(p => [
        pname(p), SIGNS[sign(p.longitude)], fmt(deg(p.longitude)), nak(p.longitude).name
      ])) : "<p>नवांश ग्रह डेटा उपलब्ध नहीं है।</p>"}
    </section>

    <section class="kr-section"><h2>8. साढ़ेसाती एवं योग संकेत</h2>
      ${table(["विषय","स्थिति","टिप्पणी"], [
        ["साढ़ेसाती", sade.status, sade.phase],
        ["कालसर्प योग", kaalSarp.status, kaalSarp.note]
      ])}
    </section>

    <section class="kr-section"><h2>9. विंशोत्तरी दशा</h2>${dashaHtml}</section>

    <section class="kr-section"><h2>10. महत्वपूर्ण टिप्पणी</h2>
      <p class="kr-muted">यह रिपोर्ट उपलब्ध वेबसाइट डेटा का सारांश है। ज्योतिषीय व्याख्याएँ परंपरा के अनुसार बदल सकती हैं; इसे निश्चित भविष्यवाणी या पेशेवर सलाह न मानें।</p>
    </section>

    <footer class="kr-copyright">Kundali PDF Created by ARUNODAYA PANCHANG<br>© 2026 All Rights Reserved</footer>
  </div>`;
}

const REPORT_CSS = `
*{box-sizing:border-box}
body{margin:0;background:#eef1f6;color:#1e293b;font-family:"Noto Sans Devanagari","Nirmala UI",sans-serif;font-size:10pt;line-height:1.55}
.kr-report{max-width:210mm;margin:16px auto;background:white;padding:10mm}
.kr-cover{min-height:240mm;padding:12mm;border:3px double #a8792a;background:#fff8e8;display:flex;flex-direction:column;justify-content:center;page-break-after:always}
.kr-ganesh{text-align:center;color:#754612;font-size:16pt;font-weight:800;margin-bottom:12mm}
.kr-eyebrow{font-weight:800;color:#8a5a16;letter-spacing:1px}
.kr-cover h1{font-size:28pt;color:#633b12}
.kr-section{margin-bottom:9mm;break-inside:auto}
.kr-section h2{font-size:15pt;color:#713f12;border-bottom:2px solid #d6b36b;padding-bottom:2mm}
.kr-table-wrap{width:100%;overflow:visible}
.kr-table{width:100%;border-collapse:collapse;margin:3mm 0 5mm;font-size:8.5pt}
.kr-table th,.kr-table td{border:1px solid #d7dce5;padding:2mm;text-align:left;vertical-align:top;overflow-wrap:anywhere}
.kr-table th{background:#f7e8c9;color:#573915}
.kr-table tbody tr:nth-child(even){background:#f8fafc}
.kr-chart{display:block;width:100%;max-width:140mm;margin:auto;background:#fffdf8}
.kr-chart-wrap{width:100%;max-width:140mm;margin:3mm auto}
.kr-muted{font-size:8pt;color:#64748b}
.kr-copyright{text-align:center;border-top:1px solid #d6b36b;padding:5mm;margin-top:12mm;color:#76501d;font-size:8pt;font-weight:600}
@page{size:A4;margin:10mm}
@media print{body{background:white}.kr-report{max-width:none;margin:0;padding:0}.kr-cover{min-height:250mm}.kr-table tr{break-inside:avoid}}
@media(max-width:650px){.kr-report{margin:0;padding:5mm}}
`;

export function mountKundliPrintButton({
  resultElement,
  getReportHtml,
  buttonLabel = "PDF / प्रिंट रिपोर्ट",
  cssHref = ""
} = {}) {
  if (!resultElement || typeof getReportHtml !== "function") {
    throw new Error("resultElement और getReportHtml देना आवश्यक है।");
  }

  let button = resultElement.querySelector("[data-kpdf-print]");

  if (!button) {
    button = document.createElement("button");
    button.type = "button";
    button.dataset.kpdfPrint = "true";
    button.className = "kpdf-print-button";
    resultElement.appendChild(button);
  }

  button.textContent = buttonLabel;
  button.style.cssText = "display:block;width:100%;max-width:320px;margin:16px auto;padding:13px 18px;background:#754612;color:#fff;border:0;border-radius:9px;font-size:16px;font-weight:700;cursor:pointer";
  button.onclick = async () => {
    let win;

    try {
      // Open synchronously from the click so mobile browsers don't block it.
      win = window.open("", "_blank");
      if (!win) {
        window.alert("पॉप-अप ब्लॉक है। ब्राउज़र में इस वेबसाइट के लिए पॉप-अप की अनुमति दें।");
        return;
      }

      win.document.open();
      win.document.write("<!doctype html><html lang='hi'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>कुंडली रिपोर्ट</title></head><body style='font-family:sans-serif;padding:24px'>रिपोर्ट तैयार हो रही है…</body></html>");
      win.document.close();

      const html = await getReportHtml();

      if (typeof html !== "string" || !html.trim()) {
        win.close();
        window.alert("रिपोर्ट डेटा उपलब्ध नहीं है।");
        return;
      }

      win.document.open();
      win.document.write(`<!doctype html>
        <html lang="hi">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width,initial-scale=1">
          <title>वैदिक जन्म कुंडली रिपोर्ट</title>
          <style>${REPORT_CSS}</style>
          ${cssHref ? `<link rel="stylesheet" href="${esc(cssHref)}">` : ""}
        </head>
        <body>${html}
          <script>
            window.addEventListener("load", function() {
              setTimeout(function() {
                window.focus();
                window.print();
              }, 500);
            });
          <\/script>
        </body>
        </html>`);
      win.document.close();
    } catch (error) {
      console.error("Kundli PDF/Print error:", error);
      if (win && !win.closed) {
        win.document.body.innerHTML = "<p style='font-family:sans-serif;padding:20px'>रिपोर्ट तैयार नहीं हो सकी। कृपया पेज रीफ्रेश करके दोबारा प्रयास करें।</p>";
      } else {
        window.alert("रिपोर्ट तैयार नहीं हो सकी। कृपया दोबारा प्रयास करें।");
      }
    }
  };

  return button;
}
