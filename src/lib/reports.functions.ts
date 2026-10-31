import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertReportOwner, ownReportEditSchema } from "./report-rules";
import { isExternalPhoto } from "./media";

export const editOwnReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => ownReportEditSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: report, error: readError } = await context.supabase.from("reports").select("user_id").eq("id", data.id).single();
    if (readError || !report) throw new Error("Laporan tidak ditemui.");
    assertReportOwner(report.user_id, context.userId);
    const { id, contractor_scope_id, contractor_company, ...fields } = data;
    const { data: saved, error } = await context.supabase.from("reports").update({ ...fields,
      ...(contractor_scope_id !== undefined ? { contractor_scope_id } : {}),
      ...(contractor_company !== undefined ? { contractor_company: contractor_company?.trim() || null } : {}),
      notes: fields.notes.trim() || null, updated_at: new Date().toISOString() }).eq("id", id).eq("user_id", context.userId).select("id").single();
    if (error || !saved) throw new Error("Laporan gagal dikemas kini.");
    return { ok: true };
  });

export const deleteOwnReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: report, error: readError } = await context.supabase.from("reports").select("user_id, photo_path").eq("id", data.id).single();
    if (readError || !report) throw new Error("Laporan tidak ditemui.");
    assertReportOwner(report.user_id, context.userId);
    const { data: removed, error } = await context.supabase.from("reports").delete().eq("id", data.id).eq("user_id", context.userId).select("id").single();
    if (error || !removed) throw new Error("Laporan gagal dipadam.");
    if (!report.photo_path || isExternalPhoto(report.photo_path)) return { ok: true, photoRemoved: true };
    // Privileged cleanup is limited to the verified owner's stored photo path,
    // including older photos whose paths predate user folders.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: photoError } = await supabaseAdmin.storage.from("report-photos").remove([report.photo_path]);
    return { ok: true, photoRemoved: !photoError };
  });