import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { deleteAdminReports } from "@/lib/admin-reports.functions";
import { editAdminReport } from "@/lib/contractors.functions";
import { changedFields, type ContractorScope } from "@/lib/contractor-rules";
import { ContractorScopes } from "@/components/ContractorScopes";
import { ExecutiveExport } from "@/components/ExecutiveExport";
import { visibleSelectedIds } from "@/lib/admin-report-rules";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import type { Session } from "@supabase/supabase-js";
import { Download, Loader2, LogOut, ArrowUpDown, MapPin, Table2, Trash2, Users, FileText, Eye, EyeOff } from "lucide-react";
import { filterMapReports, mapStatusClass, toggleMapStatus } from "@/lib/map-reports";
import { ReportExport } from "@/components/ReportExport";
import { sortReports, photoPaths, type ReportSort } from "@/lib/report-output";
import { StaffManager } from "@/components/StaffManager";
import { GoogleSignIn } from "@/components/GoogleSignIn";
import { UitmLogo } from "@/components/UitmLogo";

import { supabase } from "@/integrations/supabase/client";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientMap } from "@/components/ClientMap";
import { ADMIN_STATUSES, CATEGORIES, HIGH_PRIORITY, ZONES, toCsv, type Report } from "@/lib/locations";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Papan Pemuka Admin | Tugasan Tapak UiTM Machang" },
      { name: "description", content: "Papan pemuka selamat untuk memantau laporan tugasan tapak UiTM Kampus Machang." },
      { property: "og:title", content: "Papan Pemuka Admin | Tugasan Tapak UiTM Machang" },
      { property: "og:description", content: "Pantau, tapis dan kemas kini status laporan tapak." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return setIsAdmin(null);
    supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin").maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [session]);

  if (loading) return <Center><Loader2 className="h-6 w-6 animate-spin" /></Center>;
  if (!session) return <LoginForm />;
  if (isAdmin === null) return <Center><Loader2 className="h-6 w-6 animate-spin" /></Center>;
  if (!isAdmin) return (
    <Center>
      <div className="text-center">
        <p className="font-semibold">Akaun ini tiada akses admin.</p>
        <Button variant="outline" className="mt-4" onClick={() => supabase.auth.signOut()}>Log keluar</Button>
      </div>
    </Center>
  );
  return <Dashboard email={session.user.email ?? ""} selfId={session.user.id} />;
}

function Center({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">{children}</div>;
}

function LoginForm() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("fasiliti.uitmck@gmail.com");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
      if (error) toast.error("Log masuk gagal: " + error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password: pw, options: { emailRedirectTo: `${window.location.origin}/admin` } });
      if (error) toast.error(error.message);
      else toast.success("Semak e-mel anda untuk mengesahkan akaun.");
    }
    setBusy(false);
  };
  return (
    <Center>
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 overflow-hidden rounded-xl border bg-card shadow-lg">
        <div className="bg-primary px-6 py-5 text-primary-foreground">
          <div className="mb-4"><UitmLogo /></div>
          <p className="text-xs font-semibold uppercase tracking-widest text-secondary">Bahagian Pengurusan Fasiliti,<br />UiTM Cawangan Kelantan,</p>
          <h1 className="text-lg font-bold">Log Masuk Admin</h1>
        </div>
        <div className="space-y-4 px-6 pb-6">
          <GoogleSignIn destination="/admin" />
          <div className="space-y-1.5"><Label>E-mel</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          <div className="space-y-1.5"><Label>Kata laluan</Label><Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} required minLength={6} /></div>
          <Button type="submit" className="w-full" disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{mode === "in" ? "Log Masuk" : "Daftar Akaun Admin"}</Button>
          <button type="button" className="w-full text-xs text-primary hover:underline" onClick={() => setMode(mode === "in" ? "up" : "in")}>
            {mode === "in" ? "Kali pertama? Daftar akaun admin" : "Sudah ada akaun? Log masuk"}
          </button>
          <Link to="/" className="block text-center text-xs text-muted-foreground hover:underline">← Kembali ke borang staf</Link>
        </div>
      </form>
    </Center>
  );
}

const statusVariant = (s: string) =>
  s === "Selesai" ? "bg-success text-success-foreground" : s === HIGH_PRIORITY ? "bg-destructive text-destructive-foreground" : s === "Dalam Tindakan" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground";

function Dashboard({ email, selfId }: { email: string; selfId: string }) {
  const [rows, setRows] = useState<Report[]>([]);
  const [scopes, setScopes] = useState<ContractorScope[]>([]);
  const [scopeFilter, setScopeFilter] = useState("all");
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [zone, setZone] = useState("all");
  const [cat, setCat] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<ReportSort>("date-desc");
  const [visibleStatuses, setVisibleStatuses] = useState<string[]>([...ADMIN_STATUSES]);
  const toggleSort = (field: "date" | "name") => setSort((old) => old === `${field}-asc` ? `${field}-desc` : `${field}-asc`);
  const [selected, setSelected] = useState<Report | null>(null);
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [deleteIds, setDeleteIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  const deleteFn = useServerFn(deleteAdminReports);
  useEffect(() => { setCheckedIds([]); }, [from, to, zone, cat, query, scopeFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: scopeList, error: scopeError } = await supabase.from("contractor_scopes").select("id, name").order("name");
    if (scopeError) toast.error("Senarai skop gagal dimuatkan.");
    setScopes(scopeList ?? []);
    const { data, error } = await supabase.from("reports").select("*").order("captured_at", { ascending: false });
    if (error) toast.error(error.message);
    const list = (data ?? []) as Report[];
    setRows(list);
    setCheckedIds((ids) => visibleSelectedIds(ids, list));
    if (photoPaths(list).length) {
      const { data: signed } = await supabase.storage.from("report-photos").createSignedUrls(photoPaths(list), 3600);
      const map: Record<string, string> = {};
      signed?.forEach((s) => { if (s.path && s.signedUrl) map[s.path] = s.signedUrl; });
      setPhotos(map);
    }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => sortReports(rows.filter((r) => {
    const d = r.captured_at.slice(0, 10);
    const local = new Date(r.captured_at).toLocaleDateString("en-CA");
    if (from && local < from) return false;
    if (to && local > to) return false;
    if (zone !== "all" && r.zone !== zone) return false;
    if (cat !== "all" && r.category !== cat) return false;
    if (scopeFilter === "unassigned" && r.contractor_scope_id) return false;
    if (scopeFilter !== "all" && scopeFilter !== "unassigned" && r.contractor_scope_id !== scopeFilter) return false;
    return !!d;
  }), sort, query), [rows, from, to, zone, cat, sort, query, scopeFilter]);

  const checkedVisible = visibleSelectedIds(checkedIds, filtered);
  const allChecked = filtered.length > 0 && checkedVisible.length === filtered.length;
  const removeChecked = async () => {
    if (!deleteIds.length || deleting) return;
    setDeleting(true);
    try {
      const result = await deleteFn({ data: { ids: deleteIds } });
      const removed = new Set(result.deletedIds);
      setRows((current) => current.filter((row) => !removed.has(row.id)));
      setCheckedIds((current) => current.filter((id) => !removed.has(id)));
      setDeleteIds([]);
      if (result.deletedIds.length) toast.success(`${result.deletedIds.length} laporan dipadam.`);
      else toast.info("Laporan terpilih sudah tiada.");
      if (!result.photoRemoved) toast.warning("Laporan dipadam, tetapi sebahagian foto belum dapat dibersihkan.");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Laporan gagal dipadam.");
    } finally { setDeleting(false); }
  };

  const mapRows = useMemo(() => filterMapReports(filtered, visibleStatuses), [filtered, visibleStatuses]);
  const pins = useMemo(() => mapRows.map((r) => ({ id: r.id, lat: r.latitude, lng: r.longitude, status: r.status })), [mapRows]);
  const onPin = useCallback((id: string) => setSelected(rows.find((r) => r.id === id) ?? null), [rows]);

  const exportCsv = () => {
    const blob = new Blob([toCsv(filtered)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `laporan-tapak-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const counts = {
    total: filtered.length,
    high: filtered.filter((r) => r.status === HIGH_PRIORITY).length,
    action: filtered.filter((r) => r.status === "Dalam Tindakan" || r.status === "Dalam Proses").length,
    done: filtered.filter((r) => r.status === "Selesai").length,
  };

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-secondary">Bahagian Pengurusan Fasiliti,<br />UiTM Cawangan Kelantan,</p>
            <h1 className="text-lg font-bold sm:text-xl">Sistem Pelaporan & Pemantauan Tugasan Tapak</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs opacity-80 lg:inline">{email}</span>
            <Link to="/" aria-label="Borang Pelaporan" title="Borang Pelaporan" className={buttonVariants({ size: "sm", variant: "secondary" })}>
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Borang Pelaporan</span>
            </Link>
            <Button size="sm" variant="outline" className="text-foreground" onClick={() => supabase.auth.signOut()}><LogOut className="h-4 w-4" /></Button>
          </div>
        </div>
        <div className="h-1 bg-secondary" />
      </header>

      <main className="mx-auto max-w-7xl space-y-5 px-4 py-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Jumlah Laporan" v={counts.total} />
          <Stat label="Perlu Tindakan Lanjut" v={counts.high} accent="text-destructive" />
          <Stat label="Dalam Proses / Tindakan" v={counts.action} accent="text-primary" />
          <Stat label="Selesai" v={counts.done} accent="text-success" />
        </div>

        <div className="grid gap-3 rounded-xl border bg-card p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1.5"><Label>Dari tarikh</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Hingga tarikh</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
          <FilterSel label="Zon" value={zone} onChange={setZone} items={Object.keys(ZONES)} />
          <FilterSel label="Kategori" value={cat} onChange={setCat} items={CATEGORIES} />
          <div className="flex items-end"><Button className="w-full" variant="secondary" onClick={exportCsv}><Download className="mr-2 h-4 w-4" />Eksport Excel/CSV</Button></div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="staff-search">Cari nama / ID staf</Label><Input id="staff-search" placeholder="Nama atau ID staf" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Susunan laporan</Label><Select value={sort} onValueChange={(v) => { if (v === "date-desc" || v === "date-asc" || v === "name-asc" || v === "name-desc") setSort(v); }}><SelectTrigger aria-label="Susunan laporan" className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="date-desc">Tarikh: Terkini dahulu</SelectItem><SelectItem value="date-asc">Tarikh: Terlama dahulu</SelectItem><SelectItem value="name-asc">Nama staf: A–Z</SelectItem><SelectItem value="name-desc">Nama staf: Z–A</SelectItem></SelectContent></Select></div>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="w-full space-y-1.5 sm:w-80"><Label>Skop kontraktor</Label><Select value={scopeFilter} onValueChange={setScopeFilter}><SelectTrigger aria-label="Tapis skop kontraktor" className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Semua skop</SelectItem><SelectItem value="unassigned">Belum diagihkan</SelectItem>{scopes.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
          <ExecutiveExport rows={filtered} scopes={scopes} from={from} to={to} filters={[zone === "all" ? "Semua zon" : zone, cat === "all" ? "Semua kategori" : cat, scopeFilter === "all" ? "Semua skop" : scopes.find((s) => s.id === scopeFilter)?.name ?? "Belum diagihkan", query ? `Staf: ${query}` : ""].filter(Boolean).join(" · ")} />
        </div>
        <Tabs defaultValue="table">
          <TabsList className="h-auto flex-wrap">
            <TabsTrigger value="table"><Table2 className="mr-1 h-4 w-4" />Jadual</TabsTrigger>
            <TabsTrigger value="map"><MapPin className="mr-1 h-4 w-4" />Peta</TabsTrigger>
            <TabsTrigger value="staff"><Users className="mr-1 h-4 w-4" />Senarai Staf</TabsTrigger>
            <TabsTrigger value="scopes"><Users className="mr-1 h-4 w-4" />Skop Kontraktor</TabsTrigger>
          </TabsList>
          <TabsContent value="table">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm text-muted-foreground" role="status">{checkedVisible.length} laporan dipilih</span>
              <div className="flex flex-wrap gap-2">
                {checkedVisible.length > 0 && <Button variant="outline" size="sm" disabled={deleting} onClick={() => setCheckedIds([])}>Batal pilihan</Button>}
                <Button variant="destructive" size="sm" disabled={!checkedVisible.length || loading || deleting} onClick={() => setDeleteIds([...checkedVisible])}><Trash2 className="mr-1 h-4 w-4" />Padam terpilih ({checkedVisible.length})</Button>
              </div>
            </div>
            <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
              <table className="w-full min-w-[1100px] text-sm">
                <thead className="bg-primary/5 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr><th className="w-12 px-3 py-3"><Checkbox aria-label="Pilih semua laporan dipaparkan" checked={allChecked ? true : checkedVisible.length ? "indeterminate" : false} disabled={!filtered.length || loading || deleting} onCheckedChange={(checked) => setCheckedIds(checked === true ? filtered.map((row) => row.id) : [])} /></th>{["Masa", "Staf", "Kategori", "Zon", "Bangunan", "Status", "Catatan", "Foto", "GPS", ""].map((h) => <th key={h} className="px-3 py-3" aria-sort={h === "Masa" && sort.startsWith("date") || h === "Staf" && sort.startsWith("name") ? (sort.endsWith("asc") ? "ascending" : "descending") : undefined}>{h === "Masa" || h === "Staf" ? <Button size="sm" variant="ghost" onClick={() => toggleSort(h === "Masa" ? "date" : "name")}>{h}<ArrowUpDown className="ml-1 h-3.5 w-3.5" /></Button> : h}</th>)}</tr>
                </thead>
                <tbody>
                  {loading ? <tr><td colSpan={11} className="p-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>
                    : filtered.length === 0 ? <tr><td colSpan={11} className="p-8 text-center text-muted-foreground">Tiada laporan.</td></tr>
                    : filtered.map((r) => (
                      <tr key={r.id} className="border-t align-top hover:bg-muted/50">
                        <td className="px-3 py-3"><Checkbox aria-label={`Pilih laporan ${r.staff_name} ${r.id}`} checked={checkedVisible.includes(r.id)} disabled={deleting} onCheckedChange={(checked) => setCheckedIds((ids) => checked === true ? [...new Set([...ids, r.id])] : ids.filter((id) => id !== r.id))} /></td>
                        <td className="whitespace-nowrap px-3 py-2">{new Date(r.captured_at).toLocaleString("ms-MY")}</td>
                        <td className="px-3 py-2"><div className="font-medium">{r.staff_name}</div><div className="text-xs text-muted-foreground">{r.staff_id}</div></td>
                        <td className="px-3 py-2">{r.category}<div className="mt-1 text-xs text-primary">{scopes.find((s) => s.id === r.contractor_scope_id)?.name ?? "Belum diagihkan"}</div>{r.contractor_company && <div className="text-xs text-muted-foreground">{r.contractor_company}</div>}</td>
                        <td className="px-3 py-2">{r.zone}</td>
                        <td className="px-3 py-2">{r.building}</td>
                        <td className="px-3 py-2"><Badge className={statusVariant(r.status)}>{r.status}</Badge></td>
                        <td className="max-w-[200px] px-3 py-2 text-xs">{r.notes}{r.admin_notes && <div className="mt-1 italic text-primary">Admin: {r.admin_notes}</div>}</td>
                        <td className="px-3 py-2">{photos[r.photo_path ?? ""] ? <a href={photos[r.photo_path ?? ""]} target="_blank" rel="noreferrer"><img src={photos[r.photo_path ?? ""]} alt="Bukti" className="h-14 w-14 rounded object-cover" /></a> : <Badge variant="outline">{r.photo_path ? "Foto belum tersedia" : "Tiada foto"}</Badge>}</td>
                        <td className="whitespace-nowrap px-3 py-2 font-mono text-xs"><a className="text-primary hover:underline" target="_blank" rel="noreferrer" href={`https://www.google.com/maps?q=${r.latitude},${r.longitude}`}>{r.latitude.toFixed(5)}, {r.longitude.toFixed(5)}</a></td>
                        <td className="px-3 py-2"><Button size="sm" variant="outline" onClick={() => setSelected(r)}>Kemas kini</Button></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
          <TabsContent value="staff">
            <StaffManager reports={rows} selfId={selfId} />
          </TabsContent>
          <TabsContent value="scopes"><ContractorScopes scopes={scopes} onSaved={load} /></TabsContent>
          <TabsContent value="map">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">Status pada peta</h2>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => setVisibleStatuses([...ADMIN_STATUSES])}><Eye />Papar semua</Button>
                <Button size="sm" variant="ghost" onClick={() => setVisibleStatuses([])}><EyeOff />Sembunyi semua</Button>
              </div>
            </div>
            <div className="mb-3 flex flex-wrap gap-2">
              {ADMIN_STATUSES.map((status) => {
                const visible = visibleStatuses.includes(status);
                const count = filtered.filter((row) => row.status === status).length;
                return <Button key={status} size="sm" variant="outline" className={visible ? "border-primary bg-accent text-accent-foreground" : "text-muted-foreground"} aria-pressed={visible} aria-label={`${visible ? "Sembunyi" : "Papar"} ${status}`} onClick={() => setVisibleStatuses((current) => toggleMapStatus(current, status))}>
                  <span className={`map-status-swatch ${mapStatusClass(status)} h-3 w-3 shrink-0 rounded-full`} aria-hidden="true" />
                  {status} ({count}){visible ? <Eye /> : <EyeOff />}
                </Button>;
              })}
            </div>
            <div className="mb-2 text-sm text-muted-foreground" role="status">{mapRows.length} daripada {filtered.length} laporan dipaparkan</div>
            <div className="relative">
              <ClientMap pins={pins} clustered height={520} onPinClick={onPin} />
              {pins.length === 0 && <div className="absolute inset-x-4 top-3 z-[500] rounded-md border bg-background p-3 text-center text-sm" role="status">Tiada laporan untuk status dan penapis dipilih.</div>}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <ReportDialog report={selected} scopes={scopes} photo={selected ? photos[selected.photo_path ?? ""] : undefined} onClose={() => setSelected(null)} onSaved={load} />
      <Dialog open={deleteIds.length > 0} onOpenChange={(open) => { if (!open && !deleting) setDeleteIds([]); }}>
        <DialogContent onEscapeKeyDown={(event) => { if (deleting) event.preventDefault(); }} onPointerDownOutside={(event) => { if (deleting) event.preventDefault(); }}>
          <DialogHeader><DialogTitle>Padam {deleteIds.length} laporan terpilih?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Laporan terpilih dan foto berkaitan akan dipadam secara kekal. Tindakan ini tidak boleh dibatalkan.</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" disabled={deleting} onClick={() => setDeleteIds([])}>Batal</Button>
            <Button variant="destructive" disabled={deleting} onClick={removeChecked}>{deleting ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Trash2 className="mr-1 h-4 w-4" />}Ya, padam {deleteIds.length} laporan</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ label, v, accent }: { label: string; v: number; accent?: string }) {
  return <div className="rounded-xl border bg-card p-4 shadow-sm"><p className="text-xs text-muted-foreground">{label}</p><p className={`text-2xl font-bold ${accent ?? ""}`}>{v}</p></div>;
}

function FilterSel({ label, value, onChange, items }: { label: string; value: string; onChange: (v: string) => void; items: string[] }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="all">Semua</SelectItem>{items.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}

function ReportDialog({ report, scopes, photo, onClose, onSaved }: { report: Report | null; scopes: ContractorScope[]; photo?: string | undefined; onClose: () => void; onSaved: () => void }) {
  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [scopeId, setScopeId] = useState("unassigned");
  const [company, setCompany] = useState("");
  const saveFn = useServerFn(editAdminReport);
  const [f, setF] = useState({ staff_name: "", staff_id: "", category: "", zone: "", building: "", notes: "" });
  useEffect(() => { if (report) { setStatus(report.status); setNote(""); setScopeId(report.contractor_scope_id ?? "unassigned"); setCompany(report.contractor_company ?? ""); setF({ staff_name: report.staff_name, staff_id: report.staff_id, category: report.category, zone: report.zone, building: report.building, notes: report.notes ?? "" }); } }, [report]);
  const save = async () => {
    if (!report) return;
    if (!f.staff_name.trim() || !f.staff_id.trim() || !f.building) { toast.error("Nama, ID staf dan bangunan wajib diisi."); return; }
    setBusy(true);
    const original = { staff_name: report.staff_name, staff_id: report.staff_id, category: report.category, zone: report.zone, building: report.building, notes: report.notes ?? "", status: report.status, contractor_scope_id: report.contractor_scope_id ?? null, contractor_company: report.contractor_company ?? null };
    const edited = { ...f, staff_name: f.staff_name.trim(), staff_id: f.staff_id.trim(), status, contractor_scope_id: scopeId === "unassigned" ? null : scopeId, contractor_company: company.trim() || null };
    try {
      await saveFn({ data: { id: report.id, changes: changedFields(original, edited), note } });
      toast.success("Laporan dikemas kini."); onSaved(); onClose();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Laporan gagal disimpan."); }
    finally { setBusy(false); }
  };
  const remove = async () => {
    if (!report || !window.confirm("Padam laporan ini secara kekal? Tindakan ini tidak boleh dibatalkan.")) return;
    setBusy(true);
    const { error } = await supabase.from("reports").delete().eq("id", report.id);
    if (!error && report.photo_path) await supabase.storage.from("report-photos").remove([report.photo_path]);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Laporan dipadam.");
    onSaved();
    onClose();
  };
  return (
    <Dialog open={!!report} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>Butiran Laporan</DialogTitle></DialogHeader>
        {report && (
          <div className="space-y-3 text-sm">
            {photo ? <img src={photo} alt="Bukti" className="max-h-60 w-full rounded-md object-cover" /> : <Badge variant="outline">{report.photo_path ? "Foto belum tersedia" : "Tiada foto"}</Badge>}
            <div className="grid grid-cols-2 gap-2">
              <Info k="Staf" v={`${report.staff_name} (${report.staff_id})`} />
              <Info k="Masa" v={new Date(report.captured_at).toLocaleString("ms-MY")} />
              <Info k="Kategori" v={report.category} />
              <Info k="Lokasi" v={`${report.zone} · ${report.building}`} />
              <Info k="GPS" v={`${report.latitude.toFixed(6)}, ${report.longitude.toFixed(6)}`} />
              <Info k="Ketepatan" v={report.gps_accuracy ? `±${Math.round(report.gps_accuracy)} m` : "—"} />
            </div>
            {report.notes && <Info k="Catatan staf" v={report.notes} />}
            {report.admin_notes && <div><p className="text-xs text-muted-foreground">Log tindakan</p><pre className="whitespace-pre-wrap rounded bg-muted p-2 text-xs">{report.admin_notes}</pre></div>}
            <div className="space-y-3 rounded-md border p-3">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Edit maklumat laporan</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5"><Label>Nama staf</Label><Input value={f.staff_name} onChange={(e) => setF({ ...f, staff_name: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>ID Staf / Unit</Label><Input value={f.staff_id} onChange={(e) => setF({ ...f, staff_id: e.target.value })} /></div>
              </div>
              <div className="space-y-1.5"><Label>Kategori</Label>
                <Select value={f.category} onValueChange={(v) => setF({ ...f, category: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5"><Label>Zon</Label>
                  <Select value={f.zone} onValueChange={(v) => setF({ ...f, zone: v, building: "" })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.keys(ZONES).map((z) => <SelectItem key={z} value={z}>{z}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-1.5"><Label>Bangunan</Label>
                  <Select value={f.building} onValueChange={(v) => setF({ ...f, building: v })}><SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger><SelectContent>{(ZONES[f.zone as keyof typeof ZONES] ?? []).map((b: string) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent></Select></div>
              </div>
              <div className="space-y-1.5"><Label>Catatan staf</Label><Textarea rows={3} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5"><Label>Skop tugasan</Label><Select value={scopeId} onValueChange={setScopeId}><SelectTrigger className="w-full" aria-label="Skop tugasan"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="unassigned">Belum diagihkan</SelectItem>{scopes.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label htmlFor="contractor-company">Syarikat / Unit Bertanggungjawab (pilihan)</Label><Input id="contractor-company" maxLength={200} value={company} onChange={(e) => setCompany(e.target.value)} /></div>
            <div className="space-y-1.5">
              <Label>Status baharu</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ADMIN_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Catatan tindakan / audit</Label><Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="cth. Kontraktor telah dimaklumkan…" /></div>
            <Button className="w-full" onClick={save} disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Simpan</Button>
            <div className="flex flex-wrap gap-2">
              <ReportExport report={report} photo={photo} />
              <Button variant="destructive" disabled={busy} onClick={remove}><Trash2 className="mr-1 h-4 w-4" />Padam</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Info({ k, v }: { k: string; v: string }) {
  return <div><p className="text-xs text-muted-foreground">{k}</p><p className="font-medium">{v}</p></div>;
}
