import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { deleteStaffAccount } from "@/lib/staff.functions";
import type { Report } from "@/lib/locations";

type Profile = { id: string; email: string | null; staff_name: string; staff_id: string; created_at: string };

export function StaffManager({ reports, selfId }: { reports: Report[]; selfId: string }) {
  const [rows, setRows] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<Profile | null>(null);
  const [del, setDel] = useState<Profile | null>(null);
  const [busy, setBusy] = useState(false);
  const delFn = useServerFn(deleteStaffAccount);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data ?? []) as Profile[]);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const r of reports as (Report & { user_id?: string | null })[]) if (r.user_id) m[r.user_id] = (m[r.user_id] ?? 0) + 1;
    return m;
  }, [reports]);

  const shown = rows.filter((p) => `${p.staff_name} ${p.staff_id} ${p.email}`.toLowerCase().includes(q.toLowerCase()));

  const save = async () => {
    if (!edit) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").update({ staff_name: edit.staff_name.trim(), staff_id: edit.staff_id.trim() }).eq("id", edit.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Maklumat staf dikemas kini");
    setEdit(null); load();
  };

  const remove = async () => {
    if (!del) return;
    setBusy(true);
    try {
      await delFn({ data: { userId: del.id } });
      toast.success("Akaun staf dipadam");
      setDel(null); load();
    } catch (e) { toast.error((e as Error).message); }
    setBusy(false);
  };

  return (
    <div className="space-y-3">
      <Input placeholder="Cari nama, No. Staf atau e-mel..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[700px] text-sm">
          <thead className="bg-primary/5 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>{["Nama", "No. Staf / Unit", "E-mel", "Tarikh Daftar", "Laporan", ""].map((h) => <th key={h} className="px-3 py-3">{h}</th>)}</tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={6} className="p-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>
              : shown.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Tiada staf berdaftar.</td></tr>
              : shown.map((p) => (
                <tr key={p.id} className="border-t hover:bg-muted/50">
                  <td className="px-3 py-2 font-medium">{p.staff_name || "-"}</td>
                  <td className="px-3 py-2">{p.staff_id || "-"}</td>
                  <td className="px-3 py-2">{p.email}</td>
                  <td className="whitespace-nowrap px-3 py-2">{new Date(p.created_at).toLocaleDateString("ms-MY")}</td>
                  <td className="px-3 py-2">{counts[p.id] ?? 0}</td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <Button size="sm" variant="outline" onClick={() => setEdit({ ...p })}><Pencil className="mr-1 h-3.5 w-3.5" />Kemas kini</Button>
                    {p.id !== selfId && <Button size="sm" variant="destructive" className="ml-2" onClick={() => setDel(p)}><Trash2 className="mr-1 h-3.5 w-3.5" />Padam</Button>}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Kemas kini maklumat staf</DialogTitle></DialogHeader>
          {edit && <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{edit.email}</p>
            <div className="space-y-1.5"><Label>Nama penuh</Label><Input value={edit.staff_name} onChange={(e) => setEdit({ ...edit, staff_name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>No. Staf / Unit / Kontraktor</Label><Input value={edit.staff_id} onChange={(e) => setEdit({ ...edit, staff_id: e.target.value })} /></div>
            <Button className="w-full" disabled={busy} onClick={save}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Simpan</Button>
          </div>}
        </DialogContent>
      </Dialog>

      <Dialog open={!!del} onOpenChange={(o) => !o && setDel(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Padam akaun staf?</DialogTitle></DialogHeader>
          <p className="text-sm">Akaun <b>{del?.staff_name || del?.email}</b> akan dipadam dan tidak boleh log masuk lagi. Laporan yang telah dihantar akan kekal.</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDel(null)}>Batal</Button>
            <Button variant="destructive" disabled={busy} onClick={remove}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Padam</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
