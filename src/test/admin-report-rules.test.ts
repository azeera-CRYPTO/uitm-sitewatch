import { describe, expect, it } from "vitest";
import { adminReportDeleteSchema, assertReportAdmin, visibleSelectedIds } from "@/lib/admin-report-rules";

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