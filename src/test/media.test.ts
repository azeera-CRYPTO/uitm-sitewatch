import { describe, it, expect } from "vitest";
import { fitWithin, isExternalPhoto, MAX_DIMENSION, WEBP_QUALITY } from "@/lib/media";
import { purgeIdsBefore } from "@/lib/admin-report-rules";
import { photoPaths, externalPhotos } from "@/lib/report-output";

describe("media rules", () => {
  it("caps images at 500px keeping ratio", () => {
    expect(fitWithin(2000, 1000)).toEqual({ width: 500, height: 250 });
    expect(fitWithin(300, 200)).toEqual({ width: 300, height: 200 });
    expect(MAX_DIMENSION).toBe(500);
    expect(WEBP_QUALITY).toBe(0.6);
  });
  it("separates Cloudinary URLs from legacy paths", () => {
    const rows = [{ photo_path: "https://res.cloudinary.com/oezaiw9s/a.webp" }, { photo_path: "u/2026-10-19/a.png" }, { photo_path: null }] as never[];
    expect(isExternalPhoto("u/a.png")).toBe(false);
    expect(photoPaths(rows)).toEqual(["u/2026-10-19/a.png"]);
    expect(Object.keys(externalPhotos(rows))).toEqual(["https://res.cloudinary.com/oezaiw9s/a.webp"]);
  });
  it("purges only records before the chosen date", () => {
    const rows = [{ id: "a", captured_at: "2025-01-10T04:00:00Z" }, { id: "b", captured_at: "2026-06-01T04:00:00Z" }];
    expect(purgeIdsBefore(rows, "2026-01-01")).toEqual(["a"]);
    expect(purgeIdsBefore(rows, "")).toEqual([]);
  });
});
