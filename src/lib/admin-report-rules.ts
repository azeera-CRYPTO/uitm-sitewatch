import { z } from "zod";

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