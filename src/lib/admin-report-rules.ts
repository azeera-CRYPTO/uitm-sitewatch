import { z } from "zod";
import { reportStatusGroup, type ReportOption } from "./report-options";

export function kpiSummary(rows: { status: string }[], options: ReportOption[]) {
  const group = (s: string) => reportStatusGroup(s, options);
  const done = rows.filter((r) => group(r.status) === "done").length;
  return {
    total: rows.length,
    urgent: rows.filter((r) => group(r.status) === "urgent").length,
    progress: rows.filter((r) => group(r.status) === "progress").length,
    done,
    doneRate: rows.length ? Math.round((done / rows.length) * 100) : 0,
  };
}

export const adminReportDeleteSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(1000),
}).transform(({ ids }) => ({ ids: [...new Set(ids)] }));

export function assertReportAdmin(isAdmin: boolean | null) {
  if (isAdmin !== true) throw new Error("Hanya admin boleh memadam laporan terpilih.");
}

export function visibleSelectedIds(selected: string[], visible: { id: string }[]) {
  const selectedSet = new Set(selected);
  return visible.filter((row) => selectedSet.has(row.id)).map((row) => row.id);
}