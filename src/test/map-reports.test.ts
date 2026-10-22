import { describe, expect, it } from "vitest";
import { ADMIN_STATUSES } from "@/lib/locations";
import { filterMapReports, toggleMapStatus } from "@/lib/map-reports";

const rows = ADMIN_STATUSES.map((status, id) => ({ id, status }));
describe("admin map visibility", () => {
  it("shows every status initially and permits hiding all", () => {
    expect(filterMapReports(rows, ADMIN_STATUSES)).toHaveLength(4);
    expect(filterMapReports(rows, [])).toEqual([]);
  });
  it.each(ADMIN_STATUSES)("hides and restores %s without losing other statuses", (status) => {
    const hidden = toggleMapStatus(ADMIN_STATUSES, status);
    expect(filterMapReports(rows, hidden).map((row) => row.status)).toEqual(ADMIN_STATUSES.filter((value) => value !== status));
    expect(filterMapReports(rows, toggleMapStatus(hidden, status))).toEqual(rows);
  });
  it("applies status selection only to the reports already filtered by the admin", () => {
    const prefiltered = rows.filter((row) => row.id === 0 || row.id === 2);
    expect(filterMapReports(prefiltered, ["Memerlukan Tindakan Lanjut"])).toEqual([{ id: 2, status: "Memerlukan Tindakan Lanjut" }]);
    expect(rows).toHaveLength(4);
  });
});