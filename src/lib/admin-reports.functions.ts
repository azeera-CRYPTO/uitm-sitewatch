import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { adminReportDeleteSchema, assertReportAdmin } from "./admin-report-rules";

export const deleteAdminReports = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => adminReportDeleteSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    assertReportAdmin(roleError ? false : isAdmin);
    // RLS remains active; only rows actually deleted may supply cleanup paths.
    const { data: removed, error } = await context.supabase.from("reports").delete().in("id", data.ids).select("id, photo_path");
    if (error) throw new Error("Laporan gagal dipadam. Sila cuba semula.");
    const deletedIds = (removed ?? []).map((row) => row.id);
    const paths = [...new Set((removed ?? []).flatMap((row) => row.photo_path?.trim() ? [row.photo_path] : []))];
    if (!paths.length) return { deletedIds, photoRemoved: true };
    // Do not remove a legacy/shared photo still referenced by another report.
    const { data: linked, error: linkedError } = await context.supabase.from("reports").select("photo_path").in("photo_path", paths);
    if (linkedError) return { deletedIds, photoRemoved: false };
    const retained = new Set((linked ?? []).map((row) => row.photo_path));
    const cleanup = paths.filter((path) => !retained.has(path));
    if (!cleanup.length) return { deletedIds, photoRemoved: true };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    try {
      const { error: photoError } = await supabaseAdmin.storage.from("report-photos").remove(cleanup);
      return { deletedIds, photoRemoved: !photoError };
    } catch {
      return { deletedIds, photoRemoved: false };
    }
  });