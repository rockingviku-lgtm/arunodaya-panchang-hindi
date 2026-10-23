import { buildKundliReportSections, mountKundliPrintButton } from "./kundli-report.js";

/** Browser print dialog provides "Save as PDF"; no extra package is required. */
export function createKundliPdfReport(data) {
  return buildKundliReportSections(data);
}
export function addKundliPdfButton(resultElement, getData, options = {}) {
  return mountKundliPrintButton({
    resultElement,
    getReportHtml: () => createKundliPdfReport(getData()),
    ...options
  });
}
