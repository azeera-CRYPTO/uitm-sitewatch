import { describe, expect, it } from "vitest";
import { assertReportOwner, ownReportEditSchema } from "@/lib/report-rules";

describe("staff report rules", () => {
  it("allows staff to manage only their own reports", () => {
    expect(() => assertReportOwner("staff-a", "staff-a")).not.toThrow();
    expect(() => assertReportOwner("staff-b", "staff-a")).toThrow();
    expect(() => assertReportOwner(null, "staff-a")).toThrow();
  });
  it("keeps GPS and capture time out of editable fields", () => {
    const value = ownReportEditSchema.parse({ id: "00000000-0000-4000-8000-000000000001", category: "Perkhidmatan Pencucian", status: "Selesai", zone: "ZON 2", building: "Birda", notes: "Kerja selesai", latitude: 0, longitude: 0, captured_at: "changed", admin_notes: "changed" });
    expect(value).not.toHaveProperty("latitude");
    expect(value).not.toHaveProperty("longitude");
    expect(value).not.toHaveProperty("captured_at");
    expect(value).not.toHaveProperty("admin_notes");
  });
});