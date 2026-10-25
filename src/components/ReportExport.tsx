import { useState } from "react";
import { Download, Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { generateReportPdf, downloadPdf } from "@/lib/report-pdf";
import { whatsappText } from "@/lib/report-output";
import type { Report } from "@/lib/locations";
import { supabase } from "@/integrations/supabase/client";

export function ReportExport({ report, photo }: { report: Report; photo?: string | undefined }) {
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [open, setOpen] = useState(false);
  const [scopeName, setScopeName] = useState<string>();
  const prepare = async (share: boolean) => {
    setBusy(true);
    try {
      let name: string | undefined;
      if (report.contractor_scope_id) {
        const { data, error } = await supabase.from("contractor_scopes").select("name").eq("id", report.contractor_scope_id).maybeSingle();
        if (error) throw new Error("Skop laporan gagal dimuatkan. Sila cuba lagi.");
        name = data?.name;
      }
      setScopeName(name);
      const pdf = await generateReportPdf(report, photo, name);
      if (share) { setFile(pdf); setOpen(true); } else downloadPdf(pdf);
    } catch (e) { toast.error(e instanceof Error ? e.message : "PDF gagal dijana."); }
    finally { setBusy(false); }
  };
  const share = async () => {
    if (!file) return;
    if (navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title: "Laporan Tapak UiTM", text: whatsappText(report, scopeName) }); setOpen(false); }
      catch (e) { if (!(e instanceof Error && e.name === "AbortError")) toast.error("Perkongsian gagal. Sila muat turun PDF dan lampirkan dalam WhatsApp."); }
    } else {
      downloadPdf(file);
      window.open(`https://wa.me/?text=${encodeURIComponent(whatsappText(report, scopeName))}`, "_blank", "noopener,noreferrer");
      toast.info("PDF dimuat turun. Lampirkan fail tersebut dalam WhatsApp.");
      setOpen(false);
    }
  };
  return <>
    <Button size="sm" variant="secondary" disabled={busy} onClick={() => void prepare(false)}>{busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Download className="mr-1 h-4 w-4" />}Muat Turun PDF</Button>
    <Button size="sm" variant="outline" disabled={busy} onClick={() => void prepare(true)}><Share2 className="mr-1 h-4 w-4 text-success" />Kongsi ke WhatsApp</Button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>Kongsi Laporan PDF</DialogTitle></DialogHeader>
      <p className="break-all text-sm text-muted-foreground">{file?.name}</p>
      <Button onClick={() => void share()}><Share2 className="mr-2 h-4 w-4" />Teruskan ke Perkongsian / WhatsApp</Button>
    </DialogContent></Dialog>
  </>;
}