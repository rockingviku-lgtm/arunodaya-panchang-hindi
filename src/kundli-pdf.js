import { buildKundliReportSections, mountKundliPrintButton } from "./kundli-report.js";
export function createKundliPdfReport(data) { return buildKundliReportSections(data); }
export function addKundliPdfButton(resultElement, getData, options = {}) { return mountKundliPrintButton({ resultElement, getReportHtml: () => createKundliPdfReport(getData()), ...options }); }
