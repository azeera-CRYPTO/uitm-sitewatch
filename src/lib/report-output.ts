import type { Report } from "./locations";

export type ReportSort = "date-desc" | "date-asc" | "name-asc" | "name-desc";
export function sortReports(rows: Report[], sort: ReportSort, query = "") {
  const q = query.trim().toLocaleLowerCase("ms-MY");
  return rows.filter((r) => `${r.staff_name} ${r.staff_id}`.toLocaleLowerCase("ms-MY").includes(q)).sort((a, b) => {
    const date = new Date(a.captured_at).getTime() - new Date(b.captured_at).getTime();
    if (sort === "date-asc") return date || a.id.localeCompare(b.id);
    if (sort === "date-desc") return -date || a.id.localeCompare(b.id);
    const name = a.staff_name.localeCompare(b.staff_name, "ms-MY", { sensitivity: "base" });
    return (sort === "name-asc" ? name : -name) || -date || a.id.localeCompare(b.id);
  });
}
export function photoPaths(rows: Report[]): string[] {
  return rows.flatMap((r) => r.photo_path ? [r.photo_path] : []);
}
export function whatsappText(r: Report, scopeName?: string) {
  return ["*LAPORAN TUGASAN TAPAK BPF UiTM CAWANGAN KELANTAN*", `Tarikh/Masa: ${new Date(r.captured_at).toLocaleString("ms-MY")}`, `Pelapor: ${r.staff_name} (${r.staff_id})`, `Kategori: ${r.category}`, `Lokasi: ${r.zone} - ${r.building}`, `Status: ${r.status}`, `Skop: ${scopeName || "Tiada skop"}`, `Syarikat / Unit: ${r.contractor_company || "-"}`, `Catatan: ${r.notes || "-"}`, `Catatan Admin: ${r.admin_notes || "-"}`, `GPS: https://www.google.com/maps?q=${r.latitude},${r.longitude}`].join("\n");
}