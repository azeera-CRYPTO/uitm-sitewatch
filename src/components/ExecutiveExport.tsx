import { useQuery } from "@tanstack/react-query";
import { reportOptionsQuery } from "@/lib/report-options-query";
import { useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Report } from "@/lib/locations";
import type { ContractorScope } from "@/lib/contractor-rules";
import { generateExecutivePdf } from "@/lib/executive-pdf";
import { downloadPdf } from "@/lib/report-pdf";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ExecutiveExport({ rows, scopes, from, to, filters }: { rows: Report[]; scopes: ContractorScope[]; from: string; to: string; filters: string }) {
  const { data: statuses = [] } = useQuery(reportOptionsQuery);
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false);
  const [prepared, setPrepared] = useState(""), [approved, setApproved] = useState("");
  const generate = async () => { setBusy(true); try { downloadPdf(await generateExecutivePdf(rows, scopes, { from, to, filters, prepared, approved, statuses })); setOpen(false); } catch (e) { toast.error(e instanceof Error ? e.message : "PDF gagal dijana."); } finally { setBusy(false); } };
  return <><Button variant="secondary" onClick={() => setOpen(true)}><FileText />Ringkasan Eksekutif PDF</Button>
    <Dialog open={open} onOpenChange={(v) => { if (!busy) setOpen(v); }}><DialogContent><DialogHeader><DialogTitle>Ringkasan Eksekutif PDF</DialogTitle></DialogHeader>
      <p className="text-sm">{from || "Semua tarikh"} — {to || "Semua tarikh"}<br />{rows.length} laporan · {filters}</p>
      <div className="space-y-1.5"><Label htmlFor="prepared-name">Disediakan oleh (pilihan)</Label><Input id="prepared-name" maxLength={120} value={prepared} onChange={(e) => setPrepared(e.target.value)} /></div>
      <div className="space-y-1.5"><Label htmlFor="approved-name">Disahkan oleh (pilihan)</Label><Input id="approved-name" maxLength={120} value={approved} onChange={(e) => setApproved(e.target.value)} /></div>
      <Button disabled={busy} onClick={generate}>{busy ? <Loader2 className="animate-spin" /> : <Download />}Muat Turun Ringkasan PDF</Button>
    </DialogContent></Dialog></>;
}