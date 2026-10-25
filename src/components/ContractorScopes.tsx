import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Pencil, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { saveContractorScope, deleteContractorScope } from "@/lib/contractors.functions";
import type { ContractorScope } from "@/lib/contractor-rules";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function ContractorScopes({ scopes, onSaved }: { scopes: ContractorScope[]; onSaved: () => Promise<void> }) {
  const [editing, setEditing] = useState<ContractorScope | null>(null);
  const [name, setName] = useState(""); const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState<ContractorScope | null>(null);
  const saveFn = useServerFn(saveContractorScope); const deleteFn = useServerFn(deleteContractorScope);
  const save = async (e: React.FormEvent) => { e.preventDefault(); setBusy(true);
    try { await saveFn({ data: { ...(editing ? { id: editing.id } : {}), name } }); setName(""); setEditing(null); await onSaved(); toast.success("Skop disimpan."); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Skop gagal disimpan."); } finally { setBusy(false); }
  };
  const remove = async () => { if (!removing) return; setBusy(true);
    try { await deleteFn({ data: { id: removing.id } }); setRemoving(null); if (editing?.id === removing.id) { setEditing(null); setName(""); } await onSaved(); toast.success("Skop dipadam."); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Skop gagal dipadam."); } finally { setBusy(false); }
  };
  return <section className="space-y-4 py-3">
    <h2 className="font-semibold">Skop Kontraktor</h2>
    <form onSubmit={save} className="flex flex-wrap items-end gap-2">
      <div className="min-w-0 flex-1 space-y-1.5"><Label htmlFor="scope-name">{editing ? "Kemas kini skop" : "Skop baharu"}</Label><Input id="scope-name" value={name} maxLength={120} required onChange={(e) => setName(e.target.value)} /></div>
      <Button disabled={busy || !name.trim()} type="submit">{busy ? <Loader2 className="animate-spin" /> : <Plus />}{editing ? "Simpan skop" : "Tambah skop"}</Button>
      {editing && <Button variant="outline" type="button" disabled={busy} onClick={() => { setEditing(null); setName(""); }}>Batal</Button>}
    </form>
    <ul className="divide-y border-y">{scopes.map((s) => <li key={s.id} className="flex items-center justify-between gap-3 py-3"><span className="min-w-0 break-words">{s.name}</span><div className="flex shrink-0 gap-1"><Button size="icon" variant="ghost" title={`Edit ${s.name}`} aria-label={`Edit ${s.name}`} disabled={busy} onClick={() => { setEditing(s); setName(s.name); }}><Pencil /></Button><Button size="icon" variant="ghost" className="text-destructive" title={`Padam ${s.name}`} aria-label={`Padam ${s.name}`} disabled={busy} onClick={() => setRemoving(s)}><Trash2 /></Button></div></li>)}</ul>
    {!scopes.length && <p className="text-sm text-muted-foreground">Tiada skop kontraktor.</p>}
    <Dialog open={!!removing} onOpenChange={(o) => { if (!o && !busy) setRemoving(null); }}><DialogContent><DialogHeader><DialogTitle>Padam skop {removing?.name}?</DialogTitle></DialogHeader><p className="text-sm">Laporan dan nama syarikat dikekalkan. Laporan berkaitan akan menjadi belum diagihkan dan boleh dipilih skop baharu.</p><div className="flex justify-end gap-2"><Button variant="outline" disabled={busy} onClick={() => setRemoving(null)}>Batal</Button><Button variant="destructive" disabled={busy} onClick={remove}>Ya, padam skop</Button></div></DialogContent></Dialog>
  </section>;
}