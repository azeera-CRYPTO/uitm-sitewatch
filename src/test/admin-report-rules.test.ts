import { describe, expect, it } from "vitest";
import { adminReportDeleteSchema, assertReportAdmin, kpiSummary, visibleSelectedIds } from "@/lib/admin-report-rules";
import type { ReportOption } from "@/lib/report-options";

describe("KPI summary cards", () => {
  const options: ReportOption[] = [
    { id: "s1", kind: "status", name: "Selesai", active: true, status_group: "done", previous_names: [] },
    { id: "s2", kind: "status", name: "Dalam Proses", active: true, status_group: "progress", previous_names: [] },
    { id: "s3", kind: "status", name: "Memerlukan Tindakan Lanjut", active: true, status_group: "urgent", previous_names: [] },
  ];
  it("counts groups by the admin-managed status list and gives the completion rate", () => {
    const rows = [{ status: "Selesai" }, { status: "Selesai" }, { status: "Dalam Proses" }, { status: "Memerlukan Tindakan Lanjut" }];
    expect(kpiSummary(rows, options)).toEqual({ total: 4, urgent: 1, progress: 1, done: 2, doneRate: 50 });
  });
  it("returns a zero completion rate with no reports", () => {
    expect(kpiSummary([], options)).toEqual({ total: 0, urgent: 0, progress: 0, done: 0, doneRate: 0 });
  });
  it("follows the active status group even when the status name is new", () => {
    const custom = [...options, { id: "s4", kind: "status" as const, name: "Kritikal", active: true, status_group: "urgent" as const, previous_names: [] }];
    expect(kpiSummary([{ status: "Kritikal" }], custom).urgent).toBe(1);
  });
});

describe("admin bulk report deletion", () => {
  it("allows admin only and denies ordinary or missing roles", () => {
    expect(() => assertReportAdmin(true)).not.toThrow();
    expect(() => assertReportAdmin(false)).toThrow();
    expect(() => assertReportAdmin(null)).toThrow();
  });
  it("targets only selected reports visible under current filters", () => {
    expect(visibleSelectedIds(["old", "duplicate"], [{ id: "duplicate" }, { id: "keep" }])).toEqual(["duplicate"]);
    expect(visibleSelectedIds([], [{ id: "keep" }])).toEqual([]);
  });
  it("rejects empty or invalid targets and deduplicates selected reports", () => {
    const id = "00000000-0000-4000-8000-000000000001";
    expect(adminReportDeleteSchema.parse({ ids: [id, id] }).ids).toEqual([id]);
    expect(adminReportDeleteSchema.safeParse({ ids: [] }).success).toBe(false);
    expect(adminReportDeleteSchema.safeParse({ ids: ["invalid"] }).success).toBe(false);
  });
});