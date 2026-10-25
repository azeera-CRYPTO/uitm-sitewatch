import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { reportAdminEditSchema, scopeSchema } from "./contractor-rules";

export const saveContractorScope = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => scopeSchema.parse(input)).handler(async ({ data, context }) => {
    const { data: admin, error: roleError } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (roleError || admin !== true) throw new Error("Hanya admin boleh mengurus skop.");
    const result = data.id ? await context.supabase.from("contractor_scopes").update({ name: data.name }).eq("id", data.id).select().single()
      : await context.supabase.from("contractor_scopes").insert({ name: data.name }).select().single();
    if (result.error) throw new Error(result.error.code === "23505" ? "Nama skop sudah wujud." : "Skop gagal disimpan.");
    return result.data;
  });
export const deleteContractorScope = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input)).handler(async ({ data, context }) => {
    const { data: admin, error: roleError } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (roleError || admin !== true) throw new Error("Hanya admin boleh mengurus skop.");
    const { error } = await context.supabase.from("contractor_scopes").delete().eq("id", data.id);
    if (error) throw new Error("Skop gagal dipadam.");
    return { ok: true };
  });
export const editAdminReport = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => reportAdminEditSchema.parse(input)).handler(async ({ data, context }) => {
    const { data: admin, error: roleError } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (roleError || admin !== true) throw new Error("Hanya admin boleh mengemas kini laporan.");
    const { data: original, error: readError } = await context.supabase.from("reports").select("*").eq("id", data.id).single();
    if (readError || !original) throw new Error("Laporan tidak ditemui.");
    const stamp = `[${new Date().toLocaleString("ms-MY", { timeZone: "Asia/Kuala_Lumpur" })}] ${original.status} → ${data.changes.status ?? original.status}${data.note ? `: ${data.note}` : ": Maklumat laporan dikemas kini"}`;
    const { data: saved, error } = await context.supabase.from("reports").update({ ...data.changes, admin_notes: [original.admin_notes, stamp].filter(Boolean).join("\n"), updated_at: new Date().toISOString() })
      .eq("id", data.id).eq("updated_at", original.updated_at).select().maybeSingle();
    if (error || !saved) throw new Error("Laporan telah berubah atau gagal disimpan. Buka semula dan cuba lagi.");
    return saved;
  });