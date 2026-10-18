import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { Session } from "@supabase/supabase-js";
import { Download, Loader2, LogOut, MapPin, Table2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
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
  return <Dashboard email={session.user.email ?? ""} />;
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
          <p className="text-xs font-semibold uppercase tracking-widest text-secondary">UiTM Kampus Machang</p>
          <h1 className="text-lg font-bold">Log Masuk Admin</h1>
        </div>
        <div className="space-y-4 px-6 pb-6">
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

function Dashboard({ email }: { email: string }) {
  const [rows, setRows] = useState<Report[]>([]);
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [zone, setZone] = useState("all");
  const [cat, setCat] = useState("all");
  const [selected, setSelected] = useState<Report | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("reports").select("*").order("captured_at", { ascending: false });
    if (error) toast.error(error.message);
    const list = (data ?? []) as Report[];
    setRows(list);
    if (list.length) {
      const { data: signed } = await supabase.storage.from("report-photos").createSignedUrls(list.map((r) => r.photo_path), 3600);
      const map: Record<string, string> = {};
      signed?.forEach((s) => { if (s.path && s.signedUrl) map[s.path] = s.signedUrl; });
      setPhotos(map);
    }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => rows.filter((r) => {
    const d = r.captured_at.slice(0, 10);
    const local = new Date(r.captured_at).toLocaleDateString("en-CA");
    if (from && local < from) return false;
    if (to && local > to) return false;
    if (zone !== "all" && r.zone !== zone) return false;
    if (cat !== "all" && r.category !== cat) return false;
    return !!d;
  }), [rows, from, to, zone, cat]);

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
            <p className="text-xs font-semibold uppercase tracking-widest text-secondary">Papan Pemuka Admin</p>
            <h1 className="text-lg font-bold sm:text-xl">Pemantauan Tugasan Tapak UiTM Machang</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs opacity-80 sm:inline">{email}</span>
            <Button size="sm" variant="secondary" onClick={() => supabase.auth.signOut()}><LogOut className="h-4 w-4" /></Button>
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

        <Tabs defaultValue="table">
          <TabsList>
            <TabsTrigger value="table"><Table2 className="mr-1 h-4 w-4" />Jadual</TabsTrigger>
            <TabsTrigger value="map"><MapPin className="mr-1 h-4 w-4" />Peta</TabsTrigger>
          </TabsList>
          <TabsContent value="table">
            <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
              <table className="w-full min-w-[1100px] text-sm">
                <thead className="bg-primary/5 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>{["Masa", "Staf", "Kategori", "Zon", "Bangunan", "Status", "Catatan", "Foto", "GPS", ""].map((h) => <th key={h} className="px-3 py-3">{h}</th>)}</tr>
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
                        <td className="px-3 py-2">{photos[r.photo_path] && <a href={photos[r.photo_path]} target="_blank" rel="noreferrer"><img src={photos[r.photo_path]} alt="Bukti" className="h-14 w-14 rounded object-cover" /></a>}</td>
                        <td className="whitespace-nowrap px-3 py-2 font-mono text-xs"><a className="text-primary hover:underline" target="_blank" rel="noreferrer" href={`https://www.google.com/maps?q=${r.latitude},${r.longitude}`}>{r.latitude.toFixed(5)}, {r.longitude.toFixed(5)}</a></td>
                        <td className="px-3 py-2"><Button size="sm" variant="outline" onClick={() => setSelected(r)}>Kemas kini</Button></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
          <TabsContent value="map">
            <div className="rounded-xl border bg-card p-3 shadow-sm">
              <ClientMap pins={pins} height={520} onPinClick={onPin} />
              <p className="mt-2 text-xs text-muted-foreground">Klik pin untuk melihat butiran laporan.</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <ReportDialog report={selected} photo={selected ? photos[selected.photo_path] : undefined} onClose={() => setSelected(null)} onSaved={load} />
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
  useEffect(() => { if (report) { setStatus(report.status); setNote(""); } }, [report]);
  const save = async () => {
    if (!report) return;
    setBusy(true);
    const stamp = `[${new Date().toLocaleString("ms-MY")}] ${report.status} → ${status}${note.trim() ? `: ${note.trim()}` : ""}`;
    const admin_notes = (report.admin_notes ? report.admin_notes + "\n" : "") + stamp;
    const { error } = await supabase.from("reports").update({ status, admin_notes, updated_at: new Date().toISOString() }).eq("id", report.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Status dikemas kini.");
    onSaved();
    onClose();
  };
  return (
    <Dialog open={!!report} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>Butiran Laporan</DialogTitle></DialogHeader>
        {report && (
          <div className="space-y-3 text-sm">
            {photo && <img src={photo} alt="Bukti" className="max-h-60 w-full rounded-md object-cover" />}
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
            <div className="space-y-1.5">
              <Label>Status baharu</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ADMIN_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Catatan tindakan / audit</Label><Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="cth. Kontraktor telah dimaklumkan…" /></div>
            <Button className="w-full" onClick={save} disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Simpan</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Info({ k, v }: { k: string; v: string }) {
  return <div><p className="text-xs text-muted-foreground">{k}</p><p className="font-medium">{v}</p></div>;
}
