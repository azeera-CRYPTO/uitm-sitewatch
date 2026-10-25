import { describe, expect, it } from "vitest";
import { changedFields, executiveSummary, reportAdminEditSchema, scopeSchema } from "@/lib/contractor-rules";
import type { Report } from "@/lib/locations";
const base: Report = { id: "a", user_id: "staff", captured_at: "2026-10-25T01:00:00Z", created_at: "2026-10-25T01:00:00Z", staff_name: "Ali", staff_id: "123", category: "Kerja Pembaikan Kecil", zone: "ZON 1", building: "Bangunan Pentadbiran", status: "Memerlukan Tindakan Lanjut", latitude: 5.7, longitude: 102.4, gps_accuracy: 8, notes: "Kerja staf asal", admin_notes: null, photo_path: null, contractor_scope_id: "scope", contractor_company: "Syarikat A" };
describe("contractor assignment and executive report", () => {
  it("only sends intentional edits and preserves staff notes", () => {
    const original = { notes: "Kerja staf asal", contractor_company: "" };
    expect(changedFields(original, { ...original, contractor_company: "Syarikat A" })).toEqual({ contractor_company: "Syarikat A" });
  });
  it("keeps company as optional per-report text rather than a company ID", () => {
    expect(reportAdminEditSchema.parse({ id: "00000000-0000-4000-8000-000000000001", changes: { contractor_company: " Kontraktor Baru " }, note: "" }).changes.contractor_company).toBe("Kontraktor Baru");
  });
  it("accepts custom scopes added by admin", () => { expect(scopeSchema.parse({ name: "Telekomunikasi" }).name).toBe("Telekomunikasi"); expect(scopeSchema.safeParse({ name: " " }).success).toBe(false); });
  it("summarizes statuses, zones, contractor scopes and only unresolved critical issues", () => {
    const result = executiveSummary([base, { ...base, id: "b", status: "Selesai", zone: "ZON 2", contractor_scope_id: null }], [{ id: "scope", name: "Elektrik" }]);
    expect(result.total).toBe(2); expect(result.statuses).toContainEqual(["Selesai", 1]); expect(result.statuses).toContainEqual(["Memerlukan Tindakan Lanjut", 1]);
    expect(result.zones).toEqual([["ZON 1", 1], ["ZON 2", 1]]); expect(result.scopes).toEqual([["Belum diagihkan", 1], ["Elektrik", 1]]);
    expect(result.critical.map((r) => r.id)).toEqual(["a"]); expect(result.unresolved.map((r) => r.id)).toEqual(["a"]);
  });
});