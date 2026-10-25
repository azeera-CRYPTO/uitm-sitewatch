import { ZONES } from "./locations";
import { z } from "zod";

export const ownReportEditSchema = z.object({
  id: z.string().uuid(),
  category: z.string().trim().min(1).max(120),
  status: z.string().trim().min(1).max(120),
  zone: z.string(),
  building: z.string(),
  notes: z.string().max(10000),
  contractor_scope_id: z.string().uuid().nullable().optional(),
  contractor_company: z.string().trim().max(200).nullable().optional(),
}).refine((v) => ZONES[v.zone]?.includes(v.building), "Bangunan tidak sah bagi zon ini");

export function assertReportOwner(ownerId: string | null, userId: string) {
  if (!ownerId || ownerId !== userId) throw new Error("Anda hanya boleh mengurus laporan sendiri.");
}