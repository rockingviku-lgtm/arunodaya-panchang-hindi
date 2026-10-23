import { getKundliIndicators, getHousePlacements } from "./kundli-dosha.js";
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

export function buildKundliReportSections(data) {
  if (!data || !Array.isArray(data.planets) || !Number.isFinite(Number(data.ascendantLongitude))) {
    throw new Error("रिपोर्ट के लिए structured कुंडली डेटा चाहिए।");
  }
  const houses = getHousePlacements(data);
  const indicators = getKundliIndicators(data);
  const rows = houses.map(h => `<tr><td>${h.house}</td><td>${esc(h.sign)}</td><td>${esc(h.occupants.join(", ") || "कोई ग्रह नहीं")}</td></tr>`).join("");
  const cards = indicators.map(x => `<article class="kpdf-card"><h3>${esc(x.title)}</h3><p class="kpdf-status">${esc(x.status)}</p><p>${esc(x.detail)}</p>${x.method ? `<p class="kpdf-note">${esc(x.method)}</p>` : ""}</article>`).join("");
  return `<main class="kpdf-page">
    <header class="kpdf-cover"><p class="kpdf-eyebrow">ARUNODAYA PANCHANG</p><h1>जन्म कुंडली रिपोर्ट</h1><p>वैदिक ज्योतिषीय गणना विवरण</p>
    <div class="kpdf-cover-meta"><p><b>नाम:</b> ${esc(data.name || "उपलब्ध नहीं")}</p><p><b>जन्म तारीख:</b> ${esc(data.date || "उपलब्ध नहीं")}</p><p><b>जन्म समय:</b> ${esc(data.time || "उपलब्ध नहीं")}</p><p><b>जन्म स्थान:</b> ${esc(data.place || "उपलब्ध नहीं")}</p></div></header>
    <h2>12 भावों का विवरण</h2><table class="kpdf-table"><thead><tr><th>भाव</th><th>राशि</th><th>स्थित ग्रह</th></tr></thead><tbody>${rows}</tbody></table>
    <h2>दोष और पारंपरिक संकेत</h2><div class="kpdf-cards">${cards}</div>
    <p class="kpdf-disclaimer">ये संकेत पारंपरिक ज्योतिषीय नियमों पर आधारित हैं। विभिन्न परंपराओं में नियम और अपवाद अलग हो सकते हैं। इन्हें वैज्ञानिक रूप से प्रमाणित भविष्यवाणी या चिकित्सा, वित्तीय अथवा कानूनी सलाह न मानें।</p>
  </main>`;
}

export function mountKundliPrintButton({ resultElement, getReportHtml, buttonLabel = "PDF / प्रिंट रिपोर्ट", cssHref = "/src/kundli-pdf.css" } = {}) {
  if (!resultElement || typeof getReportHtml !== "function") throw new Error("resultElement और getReportHtml देना आवश्यक है।");
  let button = resultElement.querySelector("[data-kpdf-print]");
  if (!button) {
    button = document.createElement("button");
    button.type = "button"; button.dataset.kpdfPrint = "true";
    button.className = "kpdf-print-button"; button.textContent = buttonLabel;
    resultElement.appendChild(button);
  }
  button.onclick = () => {
    const html = getReportHtml();
    if (typeof html !== "string" || !html.trim()) return window.alert("रिपोर्ट डेटा उपलब्ध नहीं है।");
    const win = window.open("", "_blank");
    if (!win) return window.alert("पॉप-अप ब्लॉक है। वेबसाइट के लिए पॉप-अप अनुमति दें।");
    win.document.open();
    win.document.write(`<!doctype html><html lang="hi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>जन्म कुंडली रिपोर्ट</title><link rel="stylesheet" href="${esc(cssHref)}"></head><body class="kpdf-document">${html}<script>window.addEventListener('load',()=>setTimeout(()=>window.print(),300));window.addEventListener('afterprint',()=>window.close());<\/script></body></html>`);
    win.document.close();
  };
  return button;
}
