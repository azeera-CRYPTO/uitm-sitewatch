import { describe, expect, it } from "vitest";
import { photoPaths, sortReports, whatsappText } from "@/lib/report-output";
import type { Report } from "@/lib/locations";

const base: Report = { id: "a", user_id: "staff", captured_at: "2026-10-20T01:00:00Z", created_at: "2026-10-20T01:00:00Z", staff_name: "Zain", staff_id: "BPF123", category: "Kerja Pembaikan Kecil", zone: "ZON 2", building: "Birda", status: "Selesai", latitude: 5.7, longitude: 102.4, gps_accuracy: 8, notes: "Baik paip", admin_notes: null, photo_path: null };
const other = { ...base, id: "b", staff_name: "Ali", staff_id: "ABC", captured_at: "2026-10-21T01:00:00Z", photo_path: "staff/photo.jpg" };
describe("report output rules", () => {
  it("shares the reporter's selected scope and per-report company", () => {
    const message = whatsappText({ ...base, contractor_company: "Syarikat ABC" }, "Elektrik");
    expect(message).toContain("Skop: Elektrik");
    expect(message).toContain("Syarikat / Unit: Syarikat ABC");
  });
  it("allows a report without a photo and never signs an empty path", () => {
    expect(photoPaths([base, { ...base, photo_path: "" }, other])).toEqual(["staff/photo.jpg"]);
  });
  it("sorts dates in either direction", () => {
    expect(sortReports([base, other], "date-desc").map((r) => r.id)).toEqual(["b", "a"]);
    expect(sortReports([base, other], "date-asc").map((r) => r.id)).toEqual(["a", "b"]);
  });
  it("sorts staff names in either direction", () => {
    expect(sortReports([base, other], "name-asc").map((r) => r.staff_name)).toEqual(["Ali", "Zain"]);
    expect(sortReports([base, other], "name-desc").map((r) => r.staff_name)).toEqual(["Zain", "Ali"]);
  });
  it("searches by name and staff ID", () => {
    expect(sortReports([base, other], "date-desc", "bpf123")).toEqual([base]);
    expect(sortReports([base, other], "date-desc", "ali")).toEqual([other]);
  });
  it("shares report details and the actual GPS link", () => {
    expect(whatsappText(base)).toContain("https://www.google.com/maps?q=5.7,102.4");
    expect(whatsappText(base)).toContain("Zain (BPF123)");
  });
  it("exports reporter type, work scope and company columns", () => {
    const contractor: Report = { ...base, id: "c", reporter_type: "contractor", contractor_scope_id: "s2", contractor_company: "Syarikat ABC" };
    const csv = toCsv([base, contractor], [{ id: "s2", name: "Elektrik" }]);
    const header = csv.split("\n")[0];
    expect(header).toContain("Jenis Pelapor");
    expect(header).toContain("Skop Kerja");
    expect(header).toContain("Nama Syarikat");
    const contractorLine = csv.split("\n").find((l) => l.includes("Syarikat ABC"));
    expect(contractorLine).toContain("Kontraktor");
    expect(contractorLine).toContain("Elektrik");
    expect(csv.split("\n").find((l) => l.includes("BPF123"))).toContain("Rekod lama");
  });
});