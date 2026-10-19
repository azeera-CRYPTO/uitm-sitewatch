import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { CATEGORIES, STAFF_STATUSES, ZONES, type Report } from "@/lib/locations";
import { editOwnReport, deleteOwnReport } from "@/lib/reports.functions";

export function OwnReportDialog({ report, action, onClose, onSaved }: { report: Report; action: "edit" | "delete"; onClose: () => void; onSaved: () => void }) {
  const [category, setCategory] = useState(report.category);
  const [status, setStatus] = useState(report.status);
  const [zone, setZone] = useState(report.zone);
  const [building, setBuilding] = useState(report.building);
  const [notes, setNotes] = useState(report.notes ?? "");
  const [busy, setBusy] = useState(false);
  const edit = useServerFn(editOwnReport);
  const remove = useServerFn(deleteOwnReport);
  const submit = async () => {
    setBusy(true);
    try {
      if (action === "delete") {
        const result = await remove({ data: { id: report.id } });
        if (!result.photoRemoved) toast.warning("Laporan dipadam, tetapi foto belum dapat dipadam. Sila maklumkan admin.");
        else toast.success("Laporan dan foto dipadam.");
      } else {
        await edit({ data: { id: report.id, category, status, zone, building, notes } });
        toast.success("Laporan berjaya dikemas kini.");
      }
      onSaved(); onClose();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Tindakan gagal. Sila cuba lagi."); }
    finally { setBusy(false); }
  };
  if (action === "delete") return <AlertDialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
    <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Padam laporan ini?</AlertDialogTitle><AlertDialogDescription>{report.category} · {report.building}. Laporan dan foto akan dipadam secara kekal. Tindakan ini tidak boleh dibatalkan.</AlertDialogDescription></AlertDialogHeader>
      <AlertDialogFooter><AlertDialogCancel disabled={busy}>Batal</AlertDialogCancel><Button variant="destructive" onClick={submit} disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Padam laporan</Button></AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>;
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>Kemas kini laporan</DialogTitle></DialogHeader>
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
      <div className="border-b pb-3 text-xs text-muted-foreground"><p>{new Date(report.captured_at).toLocaleString("ms-MY")}</p><p className="font-mono">GPS: {report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}</p></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Kategori" value={category} onChange={setCategory} items={CATEGORIES} />
        <Field label="Status" value={status} onChange={setStatus} items={report.status === "Dalam Tindakan" ? [...STAFF_STATUSES, "Dalam Tindakan"] : STAFF_STATUSES} />
        <Field label="Zon" value={zone} onChange={(v) => { setZone(v); setBuilding(""); }} items={Object.keys(ZONES)} />
        <Field label="Bangunan / Lokasi" value={building} onChange={setBuilding} items={ZONES[zone] ?? []} />
      </div>
      <div className="space-y-1.5"><Label htmlFor="edit-notes">Catatan</Label><Textarea id="edit-notes" rows={4} maxLength={10000} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose} disabled={busy}>Batal</Button><Button type="submit" disabled={busy || !building}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Simpan perubahan</Button></div>
    </form>
  </DialogContent></Dialog>;
}

function Field({ label, value, onChange, items }: { label: string; value: string; onChange: (v: string) => void; items: string[] }) {
  return <div className="space-y-1.5"><Label>{label}</Label><Select value={value} onValueChange={onChange}><SelectTrigger className="w-full" aria-label={label}><SelectValue placeholder="Pilih" /></SelectTrigger><SelectContent>{items.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>;
}