import { getKundliIndicators, getHousePlacements } from "./kundli-dosha.js";

const esc = (v) => String(v ?? "").replace(/[&<>\"']/g, (c) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}[c]));

const REPORT_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body.kpdf-document {
    background: #f2f3f6;
    color: #182033;
    font-family: "Noto Sans Devanagari", "Nirmala UI", sans-serif;
    line-height: 1.65;
    font-size: 11pt;
  }
  .kpdf-shell { width: 100%; }
  .kpdf-page {
    max-width: 210mm;
    margin: 18px auto;
    padding: 15mm;
    background: #fff;
    box-shadow: 0 2px 12px rgba(16, 17, 24, 0.08);
    border: 1px solid rgba(16, 17, 24, 0.08);
  }
  .kpdf-cover {
    min-height: 235mm;
    display: flex;
    flex-direction: column;
    justify-content: center;
    border: 2px solid #9b6b22;
    padding: 14mm;
    box-sizing: border-box;
    background: linear-gradient(145deg, #fffdf7, #fff6e5);
  }
  .kpdf-eyebrow {
    letter-spacing: 2px;
    color: #85551a;
    font-weight: 800;
    margin: 0 0 8mm;
    text-transform: uppercase;
  }
  .kpdf-cover h1 {
    font-size: 30pt;
    line-height: 1.35;
    color: #623b12;
    margin: 0 0 8mm;
  }
  .kpdf-cover-meta {
    margin-top: 18mm;
    border-top: 1px solid #d9c49e;
    padding-top: 6mm;
    display: grid;
    gap: 2mm;
  }
  .kpdf-cover-meta p {
    margin: 0;
  }
  .kpdf-page h2 {
    color: #623b12;
    font-size: 17pt;
    border-bottom: 1px solid #decba8;
    padding-bottom: 3mm;
    margin-top: 10mm;
  }
  .kpdf-cards {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 5mm;
  }
  .kpdf-card {
    border: 1px solid #e2d5bd;
    border-radius: 3mm;
    padding: 5mm;
    break-inside: avoid;
  }
  .kpdf-card h3 {
    margin: 0 0 2mm;
    font-size: 12pt;
    color: #6b451c;
  }
  .kpdf-status {
    font-weight: 700;
  }
  .kpdf-note,
  .kpdf-disclaimer {
    color: #555d6d;
    font-size: 9pt;
  }
  .kpdf-table {
    width: 100%;
    border-collapse: collapse;
    margin: 4mm 0 8mm;
  }
  .kpdf-table th,
  .kpdf-table td {
    border: 1px solid #d8dce4;
    padding: 2.5mm;
    text-align: left;
    vertical-align: top;
  }
  .kpdf-table th {
    background: #f7edda;
    color: #50391d;
  }
  .kpdf-print-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 0;
    border-radius: 8px;
    padding: 12px 18px;
    background: #7b4b15;
    color: white;
    font: inherit;
    font-weight: 700;
    cursor: pointer;
    margin: 14px 0;
  }
  .kpdf-report-body {
    margin-top: 10mm;
  }
  .kpdf-report-body > * {
    max-width: 100%;
  }
  .kpdf-report-body .kundli-meta,
  .kpdf-report-body .panel,
  .kpdf-report-body .kundli-chart-card {
    margin-bottom: 12px;
  }
  @page {
    size: A4;
    margin: 12mm;
  }
  @media print {
    body.kpdf-document {
      background: white;
      font-size: 10pt;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .kpdf-page {
      max-width: none;
      margin: 0;
      padding: 0;
      box-shadow: none;
      border: 0;
    }
    .kpdf-cover {
      min-height: 0;
      border: 2px solid #9b6b22;
      padding: 12mm;
    }
    .kpdf-card, .kpdf-table th, .kpdf-table td { break-inside: avoid; }
  }
  @media (max-width: 640px) {
    .kpdf-page { margin: 0; padding: 6mm; }
    .kpdf-cards { grid-template-columns: 1fr; }
    .kpdf-cover h1 { font-size: 24pt; }
  }
`;

export function buildKundliReportSections(data) {
  if (!data) {
    throw new Error("रिपोर्ट के लिए डेटा आवश्यक है।");
  }

  const normalized = typeof data === "string" ? { html: data } : data;
  const providedHtml = normalized.html || "";

  if (Array.isArray(normalized.planets) && Number.isFinite(Number(normalized.ascendantLongitude))) {
    const houses = getHousePlacements(normalized);
    const indicators = getKundliIndicators(normalized);
    const rows = houses.map((h) => `<tr><td>${esc(h.house)}</td><td>${esc(h.sign)}</td><td>${esc(h.occupants.join(", ") || "कोई ग्रह नहीं")}</td></tr>`).join("");
    const cards = indicators.map((x) => `<article class="kpdf-card"><h3>${esc(x.title)}</h3><p class="kpdf-status">${esc(x.status)}</p><p>${esc(x.detail)}</p>${x.method ? `<p class="kpdf-note">${esc(x.method)}</p>` : ""}</article>`).join("");

    return `
      <main class="kpdf-page">
        <header class="kpdf-cover">
          <p class="kpdf-eyebrow">ARUNODAYA PANCHANG</p>
          <h1>जन्म कुंडली रिपोर्ट</h1>
          <div class="kpdf-cover-meta">
            <p><b>नाम:</b> ${esc(normalized.name || "उपलब्ध नहीं")}</p>
            <p><b>जन्म तारीख:</b> ${esc(normalized.date || "उपलब्ध नहीं")}</p>
            <p><b>जन्म समय:</b> ${esc(normalized.time || "उपलब्ध नहीं")}</p>
            <p><b>जन्म स्थान:</b> ${esc(normalized.place || "उपलब्ध नहीं")}</p>
          </div>
        </header>

        <section class="kpdf-section">
          <h2>12 भावों का विवरण</h2>
          <table class="kpdf-table">
            <thead><tr><th>भाव</th><th>राशि</th><th>स्थित ग्रह</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </section>

        <section class="kpdf-section">
          <h2>दोष और पारंपरिक संकेत</h2>
          <div class="kpdf-cards">${cards}</div>
        </section>

        ${providedHtml ? `<section class="kpdf-section kpdf-report-body">${providedHtml}</section>` : ""}

        <p class="kpdf-disclaimer">ये संकेत पारंपरिक ज्योतिषीय नियमों पर आधारित हैं। निष्कर्ष का अंतिम मूल्यांकन योग्य विशेषज्ञ से परामर्श के साथ करें।</p>
      </main>
    `;
  }

  return `
    <main class="kpdf-page">
      <header class="kpdf-cover">
        <p class="kpdf-eyebrow">ARUNODAYA PANCHANG</p>
        <h1>जन्म कुंडली रिपोर्ट</h1>
        <div class="kpdf-cover-meta">
          <p><b>नाम:</b> ${esc(normalized.name || "उपलब्ध नहीं")}</p>
          <p><b>जन्म तारीख:</b> ${esc(normalized.date || "उपलब्ध नहीं")}</p>
          <p><b>जन्म समय:</b> ${esc(normalized.time || "उपलब्ध नहीं")}</p>
          <p><b>जन्म स्थान:</b> ${esc(normalized.place || "उपलब्ध नहीं")}</p>
        </div>
      </header>

      <section class="kpdf-section kpdf-report-body">
        ${providedHtml || '<p>रिपोर्ट के लिए आवश्यक कुंडली डेटा उपलब्ध नहीं है।</p>'}
      </section>

      <p class="kpdf-disclaimer">यह रिपोर्ट उपयोगकर्ताओं द्वारा उपलब्ध Kundli data पर आधारित है। कृपया अंतिम ज्योतिषीय निष्कर्ष के लिए अनुभवी ज्योतिषी से सलाह लें।</p>
    </main>
  `;
}


export function mountKundliPrintButton({
  resultElement,
  getReportHtml,
  buttonLabel = "PDF / प्रिंट रिपोर्ट"
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
    button.textContent = buttonLabel;
    resultElement.appendChild(button);
  }

  button.onclick = () => {
    let html;

    try {
      html = getReportHtml();
    } catch (error) {
      window.alert("रिपोर्ट बनाने में समस्या हुई: " + (error?.message || error));
      return;
    }

    if (typeof html !== "string" || !html.trim()) {
      window.alert("रिपोर्ट डेटा उपलब्ध नहीं है।");
      return;
    }

    const win = window.open("", "_blank");

    if (!win) {
      window.alert("पॉप-अप ब्लॉक है। ब्राउज़र में पॉप-अप की अनुमति दें।");
      return;
    }

    const doc = win.document;
    doc.open();
    doc.write(`<!doctype html>
<html lang="hi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>जन्म कुंडली रिपोर्ट</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700;800&display=swap');

    body.kpdf-document {
      margin: 0;
      background: #f2f3f6;
      color: #182033;
      font-family: "Noto Sans Devanagari", "Nirmala UI", sans-serif;
      font-size: 11pt;
      line-height: 1.65;
    }
    .kpdf-page {
      max-width: 210mm;
      margin: 18px auto;
      padding: 15mm;
      background: white;
      box-sizing: border-box;
    }
    .kpdf-cover {
      min-height: 235mm;
      display: flex;
      flex-direction: column;
      justify-content: center;
      border: 2px solid #9b6b22;
      padding: 14mm;
      box-sizing: border-box;
      background: linear-gradient(145deg, #fffdf7, #fff6e5);
    }
    .kpdf-eyebrow {
      letter-spacing: 2px;
      color: #85551a;
      font-weight: 800;
    }
    .kpdf-cover h1 {
      font-size: 30pt;
      line-height: 1.35;
      color: #623b12;
      margin: 12mm 0 3mm;
    }
    .kpdf-cover-meta {
      margin-top: 18mm;
      border-top: 1px solid #d9c49e;
      padding-top: 6mm;
    }
    .kpdf-page h2 {
      color: #623b12;
      font-size: 17pt;
      border-bottom: 1px solid #decba8;
      padding-bottom: 3mm;
      margin-top: 10mm;
    }
    .kpdf-cards {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 5mm;
    }
    .kpdf-card {
      border: 1px solid #e2d5bd;
      border-radius: 3mm;
      padding: 5mm;
      break-inside: avoid;
    }
    .kpdf-card h3 {
      margin: 0 0 2mm;
      font-size: 12pt;
      color: #6b451c;
    }
    .kpdf-status { font-weight: 700; }
    .kpdf-note, .kpdf-disclaimer {
      color: #555d6d;
      font-size: 9pt;
    }
    .kpdf-table {
      width: 100%;
      border-collapse: collapse;
      margin: 4mm 0 8mm;
    }
    .kpdf-table th, .kpdf-table td {
      border: 1px solid #d8dce4;
      padding: 2.5mm;
      text-align: left;
      vertical-align: top;
    }
    .kpdf-table th {
      background: #f7edda;
      color: #50391d;
    }
    @page { size: A4; margin: 12mm; }
    @media print {
      body.kpdf-document {
        background: white;
        font-size: 10pt;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .kpdf-page {
        max-width: none;
        margin: 0;
        padding: 0;
        box-shadow: none;
      }
      .kpdf-cover {
        min-height: 0;
        border: 2px solid #9b6b22;
        padding: 12mm;
        break-after: page;
      }
      .kpdf-cards { break-inside: auto; }
      .kpdf-card { break-inside: avoid; }
    }
    @media screen and (max-width: 640px) {
      .kpdf-page { margin: 0; padding: 6mm; }
      .kpdf-cards { grid-template-columns: 1fr; }
      .kpdf-cover h1 { font-size: 24pt; }
    }
  </style>
</head>
<body class="kpdf-document">
  ${html}
  <script>
    window.addEventListener("load", function () {
      setTimeout(function () {
        window.print();
      }, 700);
    });
  <\/script>
</body>
</html>`);
    doc.close();
  };

  return button;
}
