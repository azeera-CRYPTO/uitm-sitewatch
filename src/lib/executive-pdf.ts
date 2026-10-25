import type { Report } from "./locations";
import { executiveSummary, type ContractorScope } from "./contractor-rules";
import { loadImage, pdfThemeColor } from "./report-pdf";
import logo from "@/assets/uitm-logo-only.png.asset.json";

export type ExecutiveOptions = { from: string; to: string; filters: string; prepared: string; approved: string };
export async function generateExecutivePdf(rows: Report[], scopes: ContractorScope[], options: ExecutiveOptions) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF(); const summary = executiveSummary(rows, scopes);
  const primary = pdfThemeColor("--primary"), gold = pdfThemeColor("--secondary"), ink = pdfThemeColor("--foreground");
  const officialLogo = await loadImage(logo.url);
  let y = 46;
  const header = () => {
    doc.addImage(officialLogo, "PNG", 16, 12, 42, 18);
    doc.setTextColor(...primary); doc.setFont("helvetica", "bold"); doc.setFontSize(11);
    doc.text("BAHAGIAN PENGURUSAN FASILITI,", 64, 18); doc.text("UiTM CAWANGAN KELANTAN,", 64, 24);
    doc.setFontSize(9); doc.text("Sistem Pelaporan & Pemantauan Tugasan Tapak", 64, 30);
    doc.setDrawColor(...gold); doc.setLineWidth(0.8); doc.line(16, 36, 194, 36);
  };
  header();
  const space = (height: number) => { if (y + height > 270) { doc.addPage(); header(); y = 46; } };
  const text = (value: string, bold = false, size = 10) => {
    doc.setFont("helvetica", bold ? "bold" : "normal"); doc.setFontSize(size); doc.setTextColor(...(bold ? primary : ink));
    const printable = (value || "-").replace(/→/g, "->").replace(/[–—]/g, "-").replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
    const lines: string[] = doc.splitTextToSize(printable, 178);
    for (const line of lines) { space(4.5); doc.text(line, 16, y); y += 4.5; } y += 1.5;
  };
  const heading = (value: string) => { space(18); y += 4; text(value, true, 11); };
  text("RINGKASAN EKSEKUTIF LAPORAN TAPAK", true, 14);
  const date = (v: string) => v ? new Date(`${v}T00:00:00`).toLocaleDateString("ms-MY") : "Semua tarikh";
  text(`Tempoh: ${date(options.from)} hingga ${date(options.to)}`);
  text(`Tapisan: ${options.filters}`);
  text(`Dijana: ${new Date().toLocaleString("ms-MY", { timeZone: "Asia/Kuala_Lumpur" })}`);
  heading("1. Ringkasan Status"); text(`Jumlah laporan: ${summary.total}`, true);
  summary.statuses.forEach(([name, count]) => text(`${name}: ${count}`));
  heading("2. Pecahan Mengikut Zon");
  if (!summary.zones.length) text("Tiada laporan dalam tempoh dan tapisan ini.");
  summary.zones.forEach(([name, count]) => text(`${name}: ${count}`));
  heading("3. Pecahan Mengikut Skop Kontraktor");
  if (!summary.scopes.length) text("Tiada laporan dalam tempoh dan tapisan ini.");
  summary.scopes.forEach(([name, count]) => text(`${name}: ${count}`));
  heading("4. Isu Kritikal Memerlukan Tindakan Lanjut");
  text(`Jumlah isu kritikal: ${summary.critical.length}`);
  if (!summary.critical.length) text("Tiada isu kritikal dalam tempoh dan tapisan ini.");
  summary.critical.forEach((r, i) => {
    space(30); text(`${i + 1}. ${r.zone} - ${r.building}`, true);
    text(`${new Date(r.captured_at).toLocaleDateString("ms-MY")} | ${r.category}`);
    text(`Skop: ${summary.scopeNames.get(r.contractor_scope_id ?? "") ?? "Belum diagihkan"} | Syarikat / Unit: ${r.contractor_company || "-"}`);
    text(`Catatan staf: ${r.notes || "-"}`); text(`Tindakan admin: ${r.admin_notes || "-"}`);
  });
  heading("5. Senarai Tugasan Belum Selesai");
  if (!summary.unresolved.length) text("Tiada tugasan tertunggak.");
  summary.unresolved.forEach((r, i) => { space(17); text(`${i + 1}. ${r.zone} - ${r.building} | ${r.status}`); text(`Syarikat / Unit: ${r.contractor_company || "Belum ditetapkan"}`); });
  doc.setFont("helvetica", "normal"); doc.setFontSize(9);
  const preparedLines = doc.splitTextToSize(options.prepared || "Nama: ____________________", 76);
  const approvedLines = doc.splitTextToSize(options.approved || "Nama: ____________________", 78);
  const nameHeight = Math.max(preparedLines.length, approvedLines.length) * 4;
  space(35 + nameHeight); y += 12; doc.setDrawColor(...ink); doc.setLineWidth(0.2); doc.line(16, y, 92, y); doc.line(116, y, 194, y); y += 6;
  doc.setTextColor(...primary); doc.setFont("helvetica", "bold"); doc.setFontSize(10);
  doc.text("Disediakan oleh", 16, y); doc.text("Disahkan oleh", 116, y); y += 6;
  doc.setTextColor(...ink); doc.setFont("helvetica", "normal"); doc.setFontSize(9);
  doc.text(preparedLines, 16, y); doc.text(approvedLines, 116, y);
  y += nameHeight + 10; doc.text("Tarikh: ___________________", 16, y); doc.text("Tarikh: ___________________", 116, y);
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) { doc.setPage(i); doc.setFontSize(8); doc.setTextColor(...ink); doc.text("BPF UiTM Cawangan Kelantan | Ringkasan Eksekutif", 16, 287); doc.text(`${i} / ${pages}`, 194, 287, { align: "right" }); }
  return new File([doc.output("blob")], `ringkasan-eksekutif-${options.from || "semua"}-${options.to || "tarikh"}.pdf`, { type: "application/pdf" });
}