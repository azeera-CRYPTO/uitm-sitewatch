import type { Report } from "./locations";
import logo from "@/assets/uitm-logo-only.png.asset.json";

export async function loadImage(url: string) {
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.src = url;
  await image.decode();
  return image;
}

export function pdfThemeColor(name: string): [number, number, number] {
  const canvas = document.createElement("canvas"); canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Penjana PDF tidak tersedia pada peranti ini.");
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  ctx.fillRect(0, 0, 1, 1);
  const p = ctx.getImageData(0, 0, 1, 1).data;
  return [p[0] ?? 0, p[1] ?? 0, p[2] ?? 0];
}

export async function generateReportPdf(report: Report, photo?: string) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  // Resolve the document palette from the application's semantic theme.
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d");
  const token = (name: string): [number, number, number] => {
    if (!ctx) throw new Error("Penjana PDF tidak tersedia pada peranti ini.");
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    ctx.fillRect(0, 0, 1, 1);
    const p = ctx.getImageData(0, 0, 1, 1).data;
    return [p[0] ?? 0, p[1] ?? 0, p[2] ?? 0];
  };
  const primary = token("--primary");
  const gold = token("--secondary");
  const ink = token("--foreground");
  const officialLogo = await loadImage(logo.url);
  doc.addImage(officialLogo, "PNG", 16, 12, 42, 18);
  doc.setTextColor(...primary);
  doc.setFont("helvetica", "bold"); doc.setFontSize(11);
  doc.text("BAHAGIAN PENGURUSAN FASILITI,", 64, 18);
  doc.text("UiTM CAWANGAN KELANTAN,", 64, 24);
  doc.setFontSize(9);
  doc.text("Sistem Pelaporan & Pemantauan Tugasan Tapak", 64, 30);
  doc.setDrawColor(...gold); doc.setLineWidth(1); doc.line(16, 36, 194, 36);
  let y = 46;
  const space = (height: number) => { if (y + height > 275) { doc.addPage(); y = 20; } };
  const field = (label: string, value: string) => {
    space(16);
    doc.setTextColor(...primary); doc.setFont("helvetica", "bold"); doc.setFontSize(9);
    doc.text(label, 16, y); y += 5;
    doc.setTextColor(...ink); doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    const lines: string[] = doc.splitTextToSize(value || "-", 178);
    for (const line of lines) { space(5); doc.text(line, 16, y); y += 5; }
    y += 4;
  };
  field("Tarikh / Masa", new Date(report.captured_at).toLocaleString("ms-MY"));
  field("Nama Staf / ID Staf / Unit / Kontraktor", `${report.staff_name} / ${report.staff_id}`);
  field("Kategori / Status", `${report.category} / ${report.status}`);
  field("Zon / Bangunan", `${report.zone} / ${report.building}`);
  field("Koordinat GPS / Ketepatan", `${report.latitude.toFixed(6)}, ${report.longitude.toFixed(6)} / ${report.gps_accuracy == null ? "-" : `+/-${Math.round(report.gps_accuracy)} m`}`);
  space(10); doc.setTextColor(...primary);
  doc.textWithLink("Lihat lokasi di Google Maps", 16, y, { url: `https://www.google.com/maps?q=${report.latitude},${report.longitude}` }); y += 10;
  field("Catatan Staf", report.notes || "-");
  field("Catatan / Log Tindakan Admin", report.admin_notes || "-");
  if (report.contractor_company) field("Syarikat / Unit Bertanggungjawab", report.contractor_company);
  if (report.photo_path) {
    if (!photo) throw new Error("Foto belum tersedia. Sila buka semula laporan dan cuba lagi.");
    const image = await loadImage(photo);
    const width = Math.min(178, 90 * image.naturalWidth / image.naturalHeight);
    const height = width * image.naturalHeight / image.naturalWidth;
    space(height + 14); doc.setFont("helvetica", "bold"); doc.text("Bukti Visual", 16, y); y += 6;
    doc.addImage(image, 16, y, width, height); y += height + 8;
  } else field("Bukti Visual", "Tiada foto");
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i); doc.setFontSize(8); doc.setTextColor(...ink);
    doc.text(`Rujukan: ${report.id}`, 16, 287);
    doc.text(`${i} / ${pages}`, 194, 287, { align: "right" });
  }
  return new File([doc.output("blob")], `laporan-tapak-${report.id}.pdf`, { type: "application/pdf" });
}

export function downloadPdf(file: File) {
  const url = URL.createObjectURL(file);
  const a = document.createElement("a"); a.href = url; a.download = file.name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}