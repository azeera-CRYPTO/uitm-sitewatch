import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertProfileEditor, profileSchema } from "./profile-rules";

export const saveReporterProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid(), profile: profileSchema }).parse(d))
  .handler(async ({ data, context }) => {
    let isAdmin = false;
    if (data.userId !== context.userId) {
      const role = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
      if (role.error) throw new Error(role.error.message);
      isAdmin = role.data === true;
    }
    assertProfileEditor(data.userId, context.userId, isAdmin);
    const { data: saved, error } = await context.supabase.from("profiles").update(data.profile).eq("id", data.userId).select("*").single();
    if (error) throw new Error(error.message);
    return saved;
  });