import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { Session } from "@supabase/supabase-js";
import { Download, Loader2, LogOut, ArrowUpDown, MapPin, Table2, Trash2, Users, FileText } from "lucide-react";
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
const statusColor = (s: string) => (s === "Selesai" ? "#16a34a" : s === HIGH_PRIORITY ? "#dc2626" : s === "Dalam Tindakan" ? "#5b2a86" : "#d4a017");

function Dashboard({ email, selfId }: { email: string; selfId: string }) {
  const [rows, setRows] = useState<Report[]>([]);
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [zone, setZone] = useState("all");
  const [cat, setCat] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<ReportSort>("date-desc");
  const toggleSort = (field: "date" | "name") => setSort((old) => old === `${field}-asc` ? `${field}-desc` : `${field}-asc`);
  const [selected, setSelected] = useState<Report | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("reports").select("*").order("captured_at", { ascending: false });
    if (error) toast.error(error.message);
    const list = (data ?? []) as Report[];
    setRows(list);
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
    return !!d;
  }), sort, query), [rows, from, to, zone, cat, sort, query]);

  const pins = useMemo(() => filtered.map((r) => ({ id: r.id, lat: r.latitude, lng: r.longitude, color: statusColor(r.status) })), [filtered]);
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
            <Button size="sm" variant="outline" onClick={() => supabase.auth.signOut()}><LogOut className="h-4 w-4" /></Button>
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
        <Tabs defaultValue="table">
          <TabsList>
            <TabsTrigger value="table"><Table2 className="mr-1 h-4 w-4" />Jadual</TabsTrigger>
            <TabsTrigger value="map"><MapPin className="mr-1 h-4 w-4" />Peta</TabsTrigger>
            <TabsTrigger value="staff"><Users className="mr-1 h-4 w-4" />Senarai Staf</TabsTrigger>
          </TabsList>
          <TabsContent value="table">
            <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
              <table className="w-full min-w-[1100px] text-sm">
                <thead className="bg-primary/5 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>{["Masa", "Staf", "Kategori", "Zon", "Bangunan", "Status", "Catatan", "Foto", "GPS", ""].map((h) => <th key={h} className="px-3 py-3" aria-sort={h === "Masa" && sort.startsWith("date") || h === "Staf" && sort.startsWith("name") ? (sort.endsWith("asc") ? "ascending" : "descending") : undefined}>{h === "Masa" || h === "Staf" ? <Button size="sm" variant="ghost" onClick={() => toggleSort(h === "Masa" ? "date" : "name")}>{h}<ArrowUpDown className="ml-1 h-3.5 w-3.5" /></Button> : h}</th>)}</tr>
                </thead>
                <tbody>
                  {loading ? <tr><td colSpan={10} className="p-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>
                    : filtered.length === 0 ? <tr><td colSpan={10} className="p-8 text-center text-muted-foreground">Tiada laporan.</td></tr>
                    : filtered.map((r) => (
                      <tr key={r.id} className="border-t align-top hover:bg-muted/50">
                        <td className="whitespace-nowrap px-3 py-2">{new Date(r.captured_at).toLocaleString("ms-MY")}</td>
                        <td className="px-3 py-2"><div className="font-medium">{r.staff_name}</div><div className="text-xs text-muted-foreground">{r.staff_id}</div></td>
                        <td className="px-3 py-2">{r.category}</td>
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
          <TabsContent value="map">
            <div className="rounded-xl border bg-card p-3 shadow-sm">
              <ClientMap pins={pins} height={520} onPinClick={onPin} />
              <p className="mt-2 text-xs text-muted-foreground">Klik pin untuk melihat butiran laporan.</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <ReportDialog report={selected} photo={selected ? photos[selected.photo_path ?? ""] : undefined} onClose={() => setSelected(null)} onSaved={load} />
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

function ReportDialog({ report, photo, onClose, onSaved }: { report: Report | null; photo?: string | undefined; onClose: () => void; onSaved: () => void }) {
  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ staff_name: "", staff_id: "", category: "", zone: "", building: "", notes: "" });
  useEffect(() => { if (report) { setStatus(report.status); setNote(""); setF({ staff_name: report.staff_name, staff_id: report.staff_id, category: report.category, zone: report.zone, building: report.building, notes: report.notes ?? "" }); } }, [report]);
  const save = async () => {
    if (!report) return;
    if (!f.staff_name.trim() || !f.staff_id.trim() || !f.building) { toast.error("Nama, ID staf dan bangunan wajib diisi."); return; }
    setBusy(true);
    const stamp = `[${new Date().toLocaleString("ms-MY")}] ${report.status} → ${status}${note.trim() ? `: ${note.trim()}` : ""}`;
    const admin_notes = (report.admin_notes ? report.admin_notes + "\n" : "") + stamp;
    const { error } = await supabase.from("reports").update({ status, admin_notes, staff_name: f.staff_name.trim(), staff_id: f.staff_id.trim(), category: f.category, zone: f.zone, building: f.building, notes: f.notes.trim(), updated_at: new Date().toISOString() }).eq("id", report.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Status dikemas kini.");
    onSaved();
    onClose();
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
