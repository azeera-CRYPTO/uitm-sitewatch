import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertOptionAdmin, reportOptionSchema } from "./report-options";

export const saveReportOption = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => reportOptionSchema.parse(input))
  .handler(async ({ data, context }) => {
    const role = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    assertOptionAdmin(role.error ? false : role.data);
    const fields = { kind: data.kind, name: data.name, status_group: data.status_group, active: true };
    const result = data.id
      ? await context.supabase.from("report_options").update(fields).eq("id", data.id).eq("kind", data.kind).select().single()
      : await context.supabase.from("report_options").upsert(fields, { onConflict: "kind,name" }).select().single();
    if (result.error) throw new Error(result.error.code === "23505" ? "Nama sudah wujud." : "Pilihan gagal disimpan.");
    return { ok: true };
  });

export const deleteReportOption = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const role = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    assertOptionAdmin(role.error ? false : role.data);
    const result = await context.supabase.from("report_options").update({ active: false }).eq("id", data.id).select("id").single();
    if (result.error) throw new Error("Pilihan gagal dipadam.");
    return { ok: true };
  });