import { CATEGORIES, STAFF_STATUSES, ZONES } from "./locations";
import { z } from "zod";

export const ownReportEditSchema = z.object({
  id: z.string().uuid(),
  category: z.string().refine((v) => CATEGORIES.includes(v)),
  status: z.string().refine((v) => [...STAFF_STATUSES, "Dalam Tindakan"].includes(v)),
  zone: z.string(),
  building: z.string(),
  notes: z.string().max(10000),
}).refine((v) => ZONES[v.zone]?.includes(v.building), "Bangunan tidak sah bagi zon ini");

export function assertReportOwner(ownerId: string | null, userId: string) {
  if (!ownerId || ownerId !== userId) throw new Error("Anda hanya boleh mengurus laporan sendiri.");
}