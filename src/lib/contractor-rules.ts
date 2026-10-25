import { z } from "zod";
import { ADMIN_STATUSES, type Report } from "./locations";

import { optionNames, reportStatusGroup, type ReportOption } from "./report-options";

export type ContractorScope = { id: string; name: string };
export const scopeSchema = z.object({ id: z.string().uuid().optional(), name: z.string().trim().min(1).max(120) });
export const reportAdminEditSchema = z.object({
  id: z.string().uuid(),
  changes: z.object({
    staff_name: z.string().trim().min(1).max(200).optional(), staff_id: z.string().trim().min(1).max(200).optional(),
    category: z.string().trim().min(1).max(120).optional(), status: z.string().trim().min(1).max(120).optional(),
    zone: z.string().min(1).optional(), building: z.string().min(1).optional(), notes: z.string().max(20000).optional(),
    contractor_scope_id: z.string().uuid().nullable().optional(), contractor_company: z.string().trim().max(200).nullable().optional(),
  }).strict(),
  note: z.string().trim().max(5000),
});
export function changedFields<T extends Record<string, unknown>>(original: T, edited: T): Partial<T> {
  return Object.fromEntries(Object.entries(edited).filter(([key, value]) => original[key] !== value)) as Partial<T>;
}
export function executiveSummary(rows: Report[], scopes: ContractorScope[], options?: ReportOption[]) {
  const scopeNames = new Map(scopes.map((s) => [s.id, s.name]));
  const countBy = (key: (r: Report) => string) => {
    const counts = new Map<string, number>();
    rows.forEach((r) => { const name = key(r); counts.set(name, (counts.get(name) ?? 0) + 1); });
    return [...counts].sort(([a], [b]) => a.localeCompare(b, "ms-MY"));
  };
  return { total: rows.length, statuses: (options ? optionNames(options, "status", rows.map((r) => r.status)) : [...new Set([...ADMIN_STATUSES, ...rows.map((r) => r.status)])]).map((s) => [s, rows.filter((r) => r.status === s).length] as const),
    zones: countBy((r) => r.zone), scopes: countBy((r) => scopeNames.get(r.contractor_scope_id ?? "") ?? "Belum diagihkan"),
    critical: rows.filter((r) => reportStatusGroup(r.status, options) === "urgent"),
    unresolved: rows.filter((r) => reportStatusGroup(r.status, options) !== "done"), scopeNames };
}