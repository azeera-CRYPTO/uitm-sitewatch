import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Pencil, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { saveReportOption, deleteReportOption } from "@/lib/report-options.functions";
import type { ReportOption } from "@/lib/report-options";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function ReportOptionManager({ kind, options, onSaved }: { kind: ReportOption["kind"]; options: ReportOption[]; onSaved: () => Promise<unknown> }) {
  const title = kind === "category" ? "Kategori Laporan" : "Status Tugasan";
  const [editing, setEditing] = useState<ReportOption | null>(null);
  const [name, setName] = useState("");
  const [group, setGroup] = useState<ReportOption["status_group"]>("progress");
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState<ReportOption | null>(null);
  const saveFn = useServerFn(saveReportOption), deleteFn = useServerFn(deleteReportOption);
  const reset = () => { setEditing(null); setName(""); setGroup("progress"); };
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try { await saveFn({ data: { ...(editing ? { id: editing.id } : {}), kind, name, status_group: group } }); await onSaved(); reset(); toast.success("Pilihan disimpan."); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Pilihan gagal disimpan."); }
    finally { setBusy(false); }
  };
  const remove = async () => {
    if (!removing) return;
    setBusy(true);
    try { await deleteFn({ data: { id: removing.id } }); await onSaved(); if (editing?.id === removing.id) reset(); setRemoving(null); toast.success("Pilihan dipadam."); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Pilihan gagal dipadam."); }
    finally { setBusy(false); }
  };
  const groups = { progress: "Dalam proses / tindakan", done: "Selesai", urgent: "Memerlukan tindakan lanjut" };
  const list = options.filter((o) => o.kind === kind && o.active);
  return <section className="space-y-4 py-3">
    <h2 className="font-semibold">{title}</h2>
    <form onSubmit={save} className="flex flex-wrap items-end gap-3">
      <div className="min-w-0 flex-1 basis-64 space-y-1.5"><Label htmlFor={`${kind}-name`}>{editing ? `Kemas kini ${title.toLowerCase()}` : `${title} baharu`}</Label><Input id={`${kind}-name`} required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} /></div>
      {kind === "status" && <div className="w-full space-y-1.5 sm:w-64"><Label>Kumpulan status</Label><Select value={group} onValueChange={(v) => { if (v === "progress" || v === "done" || v === "urgent") setGroup(v); }}><SelectTrigger aria-label="Kumpulan status" className="w-full"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(groups).map(([value, label]) => <SelectItem value={value} key={value}>{label}</SelectItem>)}</SelectContent></Select></div>}
      <Button type="submit" disabled={busy || !name.trim()}>{busy ? <Loader2 className="animate-spin" /> : <Plus />}{editing ? "Simpan perubahan" : kind === "category" ? "Tambah kategori" : "Tambah status"}</Button>
      {editing && <Button variant="outline" type="button" disabled={busy} onClick={reset}>Batal</Button>}
    </form>
    <ul className="divide-y border-y">{list.map((o) => <li key={o.id} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0 break-words"><span>{o.name}</span>{kind === "status" && <Badge className="ml-2" variant={o.status_group === "urgent" ? "destructive" : "outline"}>{groups[o.status_group]}</Badge>}</div><div className="flex shrink-0 gap-1"><Button size="icon" variant="ghost" title={`Edit ${o.name}`} aria-label={`Edit ${o.name}`} disabled={busy} onClick={() => { setEditing(o); setName(o.name); setGroup(o.status_group); }}><Pencil /></Button><Button size="icon" variant="ghost" className="text-destructive" title={`Padam ${o.name}`} aria-label={`Padam ${o.name}`} disabled={busy} onClick={() => setRemoving(o)}><Trash2 /></Button></div></li>)}</ul>
    {!list.length && <p className="text-sm text-muted-foreground">Tiada pilihan tersedia.</p>}
    <Dialog open={!!removing} onOpenChange={(open) => { if (!open && !busy) setRemoving(null); }}><DialogContent><DialogHeader><DialogTitle>Padam {removing?.name}?</DialogTitle></DialogHeader><p className="text-sm">Pilihan ini tidak lagi tersedia untuk laporan baharu. Maklumat dalam laporan lama dikekalkan.</p><div className="flex justify-end gap-2"><Button variant="outline" disabled={busy} onClick={() => setRemoving(null)}>Batal</Button><Button variant="destructive" disabled={busy} onClick={remove}>Ya, padam pilihan</Button></div></DialogContent></Dialog>
  </section>;
}