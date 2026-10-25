import { describe, expect, it } from "vitest";
import { assertOptionAdmin, optionNames, reportOptionSchema, reportStatusGroup, type ReportOption } from "@/lib/report-options";
import { executiveSummary } from "@/lib/contractor-rules";
import { toggleMapStatus } from "@/lib/map-reports";
import { ownReportEditSchema } from "@/lib/report-rules";
import type { Report } from "@/lib/locations";

const option: ReportOption = { id: "00000000-0000-4000-8000-000000000001", kind: "status", name: "Disahkan", active: true, status_group: "done", previous_names: ["Selesai"] };
describe("dynamic report categories and statuses", () => {
  it("restricts option management to admin", () => {
    expect(() => assertOptionAdmin(true)).not.toThrow();
    expect(() => assertOptionAdmin(false)).toThrow();
    expect(() => assertOptionAdmin(null)).toThrow();
  });
  it("accepts admin-added category and status names without a description field", () => {
    expect(reportOptionSchema.parse({ kind: "category", name: " Pemeriksaan Berkala ", description: "extra" })).toEqual({ kind: "category", name: "Pemeriksaan Berkala", status_group: "progress" });
    expect(reportOptionSchema.parse({ kind: "status", name: "Disahkan", status_group: "done" }).name).toBe("Disahkan");
  });
  it("removes retired selections from new reports but retains the current historical value for editing", () => {
    const retired = { ...option, active: false };
    expect(optionNames([retired], "status")).toEqual([]);
    expect(optionNames([retired], "status", ["Disahkan"])).toEqual(["Disahkan"]);
  });
  it("preserves renamed status meaning through prior-name aliases", () => {
    expect(reportStatusGroup("Selesai", [option])).toBe("done");
    expect(reportStatusGroup("Disahkan", [option])).toBe("done");
    expect(reportStatusGroup("Perlu Semakan", [{ ...option, name: "Perlu Semakan", status_group: "urgent" }])).toBe("urgent");
  });
  it("includes custom and historical statuses in executive counts and excludes completed work", () => {
    const row = { id: "a", status: "Disahkan", zone: "ZON 1", contractor_scope_id: null } as Report;
    const summary = executiveSummary([row, { ...row, id: "b", status: "Status Lama" }], [], [option]);
    expect(summary.statuses).toContainEqual(["Disahkan", 1]);
    expect(summary.statuses).toContainEqual(["Status Lama", 1]);
    expect(summary.unresolved.map((r) => r.id)).toEqual(["b"]);
  });
  it("toggles custom map statuses", () => {
    expect(toggleMapStatus(["Disahkan"], "Disahkan")).toEqual([]);
    expect(toggleMapStatus([], "Disahkan")).toEqual(["Disahkan"]);
  });
  it("accepts dynamic report selections while keeping location validation", () => {
    const input = { id: option.id, category: "Pemeriksaan Berkala", status: "Disahkan", zone: "ZON 2", building: "Birda", notes: "Pemeriksaan" };
    expect(ownReportEditSchema.parse(input).category).toBe("Pemeriksaan Berkala");
    expect(ownReportEditSchema.safeParse({ ...input, building: "Tidak Sah" }).success).toBe(false);
  });
});