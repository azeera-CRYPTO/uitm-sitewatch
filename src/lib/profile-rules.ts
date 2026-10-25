import { z } from "zod";
import type { Tables } from "@/integrations/supabase/types";

export type ReporterProfile = Tables<"profiles">;
const text = z.string().trim().max(200);
export const profileSchema = z.object({
  staff_name: text.min(1), user_type: z.enum(["staff", "contractor"]),
  staff_id: text, department: text, company_name: text,
  phone: z.string().trim().max(50), main_scope_id: z.string().uuid().nullable(),
}).superRefine((v, ctx) => {
  if (v.user_type === "staff") {
    if (!v.staff_id) ctx.addIssue({ code: "custom", path: ["staff_id"], message: "No. staf wajib diisi." });
    if (!v.department) ctx.addIssue({ code: "custom", path: ["department"], message: "Unit / bahagian wajib diisi." });
  } else if (!v.company_name) ctx.addIssue({ code: "custom", path: ["company_name"], message: "Nama syarikat wajib diisi." });
}).transform((v) => v.user_type === "staff" ? { ...v, company_name: "", phone: "", main_scope_id: null } : { ...v, staff_id: "", department: "" });
export type ProfileInput = z.input<typeof profileSchema>;
export const emptyProfile: ProfileInput = { staff_name: "", user_type: "staff", staff_id: "", department: "", company_name: "", phone: "", main_scope_id: null };
export function profileComplete(p: ReporterProfile | null) { return !!p && profileSchema.safeParse(p).success; }
export function reporterLabel(type?: string | null) { return type === "staff" ? "Staf UiTM" : type === "contractor" ? "Kontraktor" : "Belum dilengkapkan"; }
export function assertProfileEditor(target: string, caller: string, isAdmin: boolean) {
  if (target !== caller && !isAdmin) throw new Error("Anda hanya boleh mengurus maklumat sendiri.");
}