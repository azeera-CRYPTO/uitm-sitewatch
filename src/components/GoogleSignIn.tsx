import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { lovable } from "@/integrations/lovable";

export function GoogleSignIn({ destination = "/" }: { destination?: "/" | "/admin" }) {
  const [busy, setBusy] = useState(false);
  const signIn = async () => {
    setBusy(true);
    try {
      sessionStorage.setItem("google_destination", destination);
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin, extraParams: { prompt: "select_account" } });
      if (result.error) { sessionStorage.removeItem("google_destination"); toast.error("Log masuk Google gagal. Sila cuba lagi."); return; }
      if (result.redirected) return;
      // Navigate only once the helper has established an authenticated session.
      sessionStorage.removeItem("google_destination");
      window.location.assign(destination);
    } catch {
      toast.error("Log masuk Google gagal. Sila cuba lagi.");
    } finally { setBusy(false); }
  };
  return <Button type="button" variant="outline" className="w-full gap-3" disabled={busy} onClick={signIn}>
    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="font-bold text-primary" aria-hidden="true">G</span>}
    Log Masuk dengan Google
  </Button>;
}