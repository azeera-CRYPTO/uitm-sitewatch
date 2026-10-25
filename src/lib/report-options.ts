import { z } from "zod";

export type ReportOption = { id: string; kind: "category" | "status"; name: string; active: boolean; status_group: "progress" | "done" | "urgent"; previous_names: string[] };
export const reportOptionSchema = z.object({ id: z.string().uuid().optional(), kind: z.enum(["category", "status"]), name: z.string().trim().min(1).max(120), status_group: z.enum(["progress", "done", "urgent"]).default("progress") });
export function assertOptionAdmin(admin: boolean | null) {
  if (admin !== true) throw new Error("Hanya admin boleh mengurus kategori dan status.");
}
export function optionNames(options: ReportOption[], kind: ReportOption["kind"], retained: string[] = []) {
  return [...new Set([...options.filter((o) => o.kind === kind && o.active).map((o) => o.name), ...retained.filter(Boolean)])];
}
export function reportStatusGroup(name: string, options: ReportOption[] = []): ReportOption["status_group"] {
  const status = options.find((o) => o.kind === "status" && o.name === name)
    ?? options.find((o) => o.kind === "status" && o.previous_names.includes(name));
  return status?.status_group ?? (name === "Selesai" ? "done" : name === "Memerlukan Tindakan Lanjut" ? "urgent" : "progress");
}
export function reportStatusBadge(name: string, options: ReportOption[]) {
  const group = reportStatusGroup(name, options);
  return group === "done" ? "bg-success text-success-foreground" : group === "urgent" ? "bg-destructive text-destructive-foreground" : "bg-secondary text-secondary-foreground";
}