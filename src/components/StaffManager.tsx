import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { ArrowUpDown, Loader2, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { deleteStaffAccount } from "@/lib/staff.functions";
import type { Report } from "@/lib/locations";
import { ReporterProfileFields } from "./ReporterProfileFields";
import { reporterLabel, emptyProfile, type ReporterProfile, type ProfileInput } from "@/lib/profile-rules";
import { saveReporterProfile } from "@/lib/profiles.functions";
import { Badge } from "./ui/badge";
import { useQuery } from "@tanstack/react-query";
import { contractorScopesQuery } from "./ReportContractorFields";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

type Profile = ReporterProfile;

export function StaffManager({ reports, selfId, onSaved }: { reports: Report[]; selfId: string; onSaved: () => void }) {
  const [rows, setRows] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"name-asc" | "name-desc" | "count-desc" | "count-asc">("name-asc");
  const [edit, setEdit] = useState<Profile | null>(null);
  const [del, setDel] = useState<Profile | null>(null);
  const [busy, setBusy] = useState(false);
  const [kind, setKind] = useState("all");
  const [value, setValue] = useState<ProfileInput>(emptyProfile);
  const saveFn = useServerFn(saveReporterProfile);
  const { data: scopes = [] } = useQuery(contractorScopesQuery);
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

  const shown = rows.filter((p) => (kind === "all" || p.user_type === kind || (kind === "incomplete" && !p.user_type)) && `${p.staff_name} ${p.staff_id} ${p.email} ${p.company_name} ${p.department}`.toLowerCase().includes(q.toLowerCase())).sort((a, b) => sort.startsWith("name") ? (sort === "name-asc" ? 1 : -1) * a.staff_name.localeCompare(b.staff_name, "ms-MY", { sensitivity: "base" }) : (sort === "count-asc" ? 1 : -1) * ((counts[a.id] ?? 0) - (counts[b.id] ?? 0)));

  const save = async () => {
    if (!edit) return;
    setBusy(true);
    try {
      await saveFn({ data: { userId: edit.id, profile: value } });
      toast.success("Maklumat pengguna dikemas kini"); setEdit(null); void load(); onSaved();
    } catch { toast.error("Maklumat gagal disimpan. Sila lengkapkan medan wajib."); }
    finally { setBusy(false); }
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
      <div className="flex flex-wrap gap-3"><Input placeholder="Cari nama, No. Staf, syarikat atau e-mel..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" /><Select value={kind} onValueChange={setKind}><SelectTrigger aria-label="Tapis jenis pengguna" className="w-56"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Semua pengguna</SelectItem><SelectItem value="staff">Staf UiTM</SelectItem><SelectItem value="contractor">Kontraktor</SelectItem><SelectItem value="incomplete">Belum dilengkapkan</SelectItem></SelectContent></Select></div>
      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[700px] text-sm">
          <thead className="bg-primary/5 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>{["Nama / Jenis", "Maklumat Pengguna", "E-mel", "Tarikh Daftar", "Laporan", ""].map((h) => <th key={h} className="px-3 py-3">{h === "Nama / Jenis" || h === "Laporan" ? <Button variant="ghost" size="sm" onClick={() => setSort(h === "Nama / Jenis" ? (sort === "name-asc" ? "name-desc" : "name-asc") : (sort === "count-desc" ? "count-asc" : "count-desc"))}>{h}<ArrowUpDown className="ml-1 h-3.5 w-3.5" /></Button> : h}</th>)}</tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={6} className="p-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>
              : shown.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Tiada pengguna.</td></tr>
              : shown.map((p) => (
                <tr key={p.id} className="border-t hover:bg-muted/50">
                  <td className="px-3 py-2 font-medium"><div>{p.staff_name || "-"}</div><Badge variant={p.user_type === "contractor" ? "secondary" : "outline"}>{reporterLabel(p.user_type)}</Badge></td>
                  <td className="px-3 py-2">{p.user_type === "contractor" ? <><div>{p.company_name}</div><div className="text-xs text-muted-foreground">{scopes.find((s) => s.id === p.main_scope_id)?.name ?? "Tiada skop utama"}</div>{p.phone && <div className="text-xs">{p.phone}</div>}</> : <><div>{p.staff_id || "-"}</div><div className="text-xs text-muted-foreground">{p.department}</div></>}</td>
                  <td className="px-3 py-2">{p.email}</td>
                  <td className="whitespace-nowrap px-3 py-2">{new Date(p.created_at).toLocaleDateString("ms-MY")}</td>
                  <td className="px-3 py-2">{counts[p.id] ?? 0}</td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <Button size="sm" variant="outline" onClick={() => { setEdit({ ...p }); setValue({ ...p, user_type: p.user_type === "contractor" ? "contractor" : "staff" }); }}><Pencil className="mr-1 h-3.5 w-3.5" />Kemas kini</Button>
                    {p.id !== selfId && <Button size="sm" variant="destructive" className="ml-2" onClick={() => setDel(p)}><Trash2 className="mr-1 h-3.5 w-3.5" />Padam</Button>}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Kemas kini maklumat pengguna</DialogTitle></DialogHeader>
          {edit && <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{edit.email}</p>
            <ReporterProfileFields value={value} onChange={setValue} />
            <Button className="w-full" disabled={busy} onClick={save}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Simpan</Button>
          </div>}
        </DialogContent>
      </Dialog>

      <Dialog open={!!del} onOpenChange={(o) => !o && setDel(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Padam akaun pengguna?</DialogTitle></DialogHeader>
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
