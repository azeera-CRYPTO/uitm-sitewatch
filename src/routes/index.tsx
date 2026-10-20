import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { Session } from "@supabase/supabase-js";
import { Lock, Camera, Loader2, CheckCircle2, ShieldCheck, RefreshCw, LogOut, History, ClipboardPlus, Pencil, Trash2 } from "lucide-react";
import { GoogleSignIn } from "@/components/GoogleSignIn";
import { UitmLogo } from "@/components/UitmLogo";
import { OwnReportDialog } from "@/components/OwnReportDialog";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClientMap } from "@/components/ClientMap";
import { CATEGORIES, STAFF_STATUSES, ZONES, type Report } from "@/lib/locations";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Borang Laporan Tugasan Tapak | UiTM Kampus Machang" },
      { name: "description", content: "Borang pelaporan tugasan tapak staf UiTM Kampus Machang dengan GPS, masa dan foto bukti." },
      { property: "og:title", content: "Borang Laporan Tugasan Tapak | UiTM Kampus Machang" },
      { property: "og:description", content: "Laporkan tugasan tapak dengan lokasi GPS automatik dan foto bukti." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StaffPage,
});

type Geo = { lat: number; lng: number; acc: number } | null;

function StaffPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"form" | "history">("form");
  const [profileOk, setProfileOk] = useState<boolean | null>(null);
  useEffect(() => {
    const acceptSession = (s: Session | null) => {
      setSession(s);
      if (s) {
        const destination = sessionStorage.getItem("google_destination");
        sessionStorage.removeItem("google_destination");
        if (destination === "/admin") window.location.assign("/admin");
      }
    };
    const { data } = supabase.auth.onAuthStateChange((_e, s) => acceptSession(s));
    supabase.auth.getSession().then(({ data }) => { acceptSession(data.session); setLoading(false); });
    return () => data.subscription.unsubscribe();
  }, []);
  const uid = session?.user.id;
  useEffect(() => {
    if (!uid) { setProfileOk(null); return; }
    supabase.from("profiles").select("staff_name, staff_id").eq("id", uid).maybeSingle().then(({ data }) => {
      const ok = !!data?.staff_id?.trim() && !!data?.staff_name?.trim();
      if (ok) { localStorage.setItem("staff_name", data!.staff_name); localStorage.setItem("staff_id", data!.staff_id); }
      setProfileOk(ok);
    });
  }, [uid]);
  return (
    <div className="min-h-screen bg-muted/40">
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-secondary">Bahagian Pengurusan Fasiliti,<br />UiTM Cawangan Kelantan,</p>
            <h1 className="text-lg font-bold leading-tight sm:text-xl">Sistem Pelaporan & Pemantauan Tugasan Tapak</h1>
          </div>
          <div className="flex shrink-0 gap-2">
            {session && <button onClick={() => supabase.auth.signOut()} className="rounded-md border border-primary-foreground/30 px-2 py-1.5 hover:bg-primary-foreground/10" aria-label="Log keluar"><LogOut className="h-4 w-4" /></button>}
            <Link to="/admin" className="rounded-md border border-primary-foreground/30 px-3 py-1.5 text-xs font-medium hover:bg-primary-foreground/10">Admin</Link>
          </div>
        </div>
        <div className="h-1 bg-secondary" />
      </header>
      <main className="mx-auto max-w-2xl px-4 py-6">
        {loading ? <Loader2 className="mx-auto h-6 w-6 animate-spin" /> : !session ? <StaffAuth /> : profileOk === null ? <Loader2 className="mx-auto h-6 w-6 animate-spin" /> : !profileOk ? <StaffOnboarding session={session} onDone={() => setProfileOk(true)} /> : (
          <>
            <div className="mb-5 grid grid-cols-2 gap-1 rounded-lg bg-card p-1 shadow-sm">
              <Button variant={tab === "form" ? "default" : "ghost"} onClick={() => setTab("form")}><ClipboardPlus className="mr-1 h-4 w-4" />Laporan Baharu</Button>
              <Button variant={tab === "history" ? "default" : "ghost"} onClick={() => setTab("history")}><History className="mr-1 h-4 w-4" />Sejarah Saya</Button>
            </div>
            {tab === "form" ? <StaffForm session={session} /> : <StaffHistory userId={session.user.id} />}
          </>
        )}
      </main>
    </div>
  );
}

function StaffAuth() {
  return (
    <div className="mx-auto max-w-sm space-y-4 rounded-xl border bg-card p-6 shadow-sm">
      <div className="rounded-md bg-primary p-4"><UitmLogo /></div>
      <h2 className="text-lg font-bold">Log Masuk Staf</h2>
      <p className="text-sm text-muted-foreground">Gunakan akaun Google anda. Staf baharu akan diminta melengkapkan maklumat selepas log masuk.</p>
      <GoogleSignIn />
    </div>
  );
}

function StaffOnboarding({ session, onDone }: { session: Session; onDone: () => void }) {
  const meta = session.user.user_metadata ?? {};
  const [name, setName] = useState<string>(meta['full_name'] ?? meta['name'] ?? "");
  const [sid, setSid] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sid.trim()) { toast.error("Sila isi semua medan."); return; }
    setBusy(true);
    const { error } = await supabase.from("profiles").update({ staff_name: name.trim(), staff_id: sid.trim() }).eq("id", session.user.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    localStorage.setItem("staff_name", name.trim());
    localStorage.setItem("staff_id", sid.trim());
    toast.success("Maklumat staf disimpan.");
    onDone();
  };
  return (
    <form onSubmit={submit} className="mx-auto max-w-sm space-y-4 rounded-xl border bg-card p-6 shadow-sm">
      <div className="rounded-md bg-primary p-4"><UitmLogo /></div>
      <h2 className="text-lg font-bold">Lengkapkan Maklumat Staf</h2>
      <p className="text-xs text-muted-foreground">{session.user.email}</p>
      <div className="space-y-1.5"><Label>Nama penuh *</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
      <div className="space-y-1.5"><Label>ID Staf / Unit / Kontraktor *</Label><Input value={sid} onChange={(e) => setSid(e.target.value)} placeholder="cth. 123456 / BPF / Syarikat ABC" required /></div>
      <Button type="submit" className="w-full" disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Simpan & Teruskan</Button>
    </form>
  );
}

const badge = (s: string) => s === "Selesai" ? "bg-success text-success-foreground" : s === "Memerlukan Tindakan Lanjut" ? "bg-destructive text-destructive-foreground" : s === "Dalam Tindakan" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground";

function StaffHistory({ userId }: { userId: string }) {
  const [rows, setRows] = useState<Report[] | null>(null);
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<{ report: Report; action: "edit" | "delete" } | null>(null);
  const load = useCallback(async () => {
      const { data, error } = await supabase.from("reports").select("*").eq("user_id", userId).order("captured_at", { ascending: false });
      if (error) toast.error(error.message);
      const list = (data ?? []) as Report[];
      setRows(list);
       const own = list.map((r) => r.photo_path).filter(Boolean);
      if (own.length) {
        const { data: s } = await supabase.storage.from("report-photos").createSignedUrls(own, 3600);
        const m: Record<string, string> = {};
        s?.forEach((x) => { if (x.path && x.signedUrl) m[x.path] = x.signedUrl; });
        setPhotos(m);
      }
    }, [userId]);
  useEffect(() => { void load(); }, [load]);
  if (!rows) return <Loader2 className="mx-auto h-6 w-6 animate-spin" />;
  if (!rows.length) return <p className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">Tiada laporan lagi.</p>;
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.id} className="flex gap-3 rounded-xl border bg-card p-3 shadow-sm">
          {photos[r.photo_path] ? <img src={photos[r.photo_path]} alt="Bukti" className="h-20 w-20 shrink-0 rounded object-cover" /> : <div className="h-20 w-20 shrink-0 rounded bg-muted" />}
          <div className="min-w-0 flex-1 text-sm">
            <div className="flex flex-wrap items-center gap-2"><Badge className={badge(r.status)}>{r.status}</Badge><span className="text-xs text-muted-foreground">{new Date(r.captured_at).toLocaleString("ms-MY")}</span></div>
            <p className="mt-1 font-semibold">{r.category}</p>
            <p className="text-xs text-muted-foreground">{r.zone} · {r.building}</p>
            {r.notes && <p className="mt-1 text-xs">{r.notes}</p>}
            {r.admin_notes && <pre className="mt-1 whitespace-pre-wrap rounded bg-muted p-2 text-xs text-primary">{r.admin_notes}</pre>}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setSelected({ report: r, action: "edit" })}><Pencil className="mr-1 h-3.5 w-3.5" />Kemas kini</Button>
              <Button size="sm" variant="destructive" onClick={() => setSelected({ report: r, action: "delete" })}><Trash2 className="mr-1 h-3.5 w-3.5" />Padam</Button>
            </div>
          </div>
        </div>
      ))}
      {selected && <OwnReportDialog key={`${selected.report.id}-${selected.action}`} report={selected.report} action={selected.action} onClose={() => setSelected(null)} onSaved={() => { void load(); }} />}
    </div>
  );
}

function StaffForm({ session }: { session: Session }) {
  const [capturedAt, setCapturedAt] = useState<Date | null>(null);
  const [geo, setGeo] = useState<Geo>(null);
  const [geoErr, setGeoErr] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [staffId, setStaffId] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [zone, setZone] = useState("");
  const [building, setBuilding] = useState("");
  const [notes, setNotes] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const capture = () => {
    setCapturedAt(new Date());
    setGeo(null);
    setGeoErr(null);
    if (!navigator.geolocation) { setGeoErr("Peranti tidak menyokong GPS."); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => setGeo({ lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy }),
      (e) => setGeoErr(e.code === 1 ? "Akses lokasi ditolak. Sila benarkan lokasi dalam tetapan pelayar." : "Gagal mendapatkan lokasi GPS."),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  };

  useEffect(() => {
    capture();
    setName(localStorage.getItem("staff_name") ?? "");
    setStaffId(localStorage.getItem("staff_id") ?? "");
  }, []);

  const pins = useMemo(() => (geo ? [{ id: "me", lat: geo.lat, lng: geo.lng, accuracy: geo.acc }] : []), [geo]);
  const accLevel = !geo ? null : geo.acc <= 20 ? { t: "Tinggi", c: "bg-success" } : geo.acc <= 50 ? { t: "Sederhana", c: "bg-secondary" } : { t: "Rendah", c: "bg-destructive" };

  const onPhoto = (f: File | null) => {
    setPhoto(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const reset = () => {
    setCategory(""); setStatus(""); setZone(""); setBuilding(""); setNotes(""); onPhoto(null); setDone(false); capture();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!geo || !capturedAt) { toast.error("Lokasi GPS belum dikunci."); return; }
    if (!name.trim() || !staffId.trim() || !category || !status || !zone || !building) { toast.error("Sila lengkapkan semua medan wajib."); return; }
    setBusy(true);
    try {
      localStorage.setItem("staff_name", name.trim());
      localStorage.setItem("staff_id", staffId.trim());
      let path = "";
      if (photo) {
        const ext = photo.name.split(".").pop()?.toLowerCase() || "jpg";
        path = `${session.user.id}/${capturedAt.toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
        const up = await supabase.storage.from("report-photos").upload(path, photo, { contentType: photo.type || "image/jpeg" });
        if (up.error) throw up.error;
      }
      const { error } = await supabase.from("reports").insert({
        user_id: session.user.id,
        captured_at: capturedAt.toISOString(),
        latitude: geo.lat,
        longitude: geo.lng,
        gps_accuracy: geo.acc,
        staff_name: name.trim(),
        staff_id: staffId.trim(),
        category, status, zone, building,
        notes: notes.trim() || null,
        photo_path: path,
      });
      if (error) throw error;
      setDone(true);
    } catch (err) {
      console.error(err);
      toast.error("Gagal menghantar laporan. Sila cuba lagi.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-secondary">UiTM Kampus Machang</p>
            <h1 className="text-lg font-bold leading-tight sm:text-xl">Sistem Pelaporan & Pemantauan Tugasan Tapak</h1>
          </div>
          <Link to="/admin" className="shrink-0 rounded-md border border-primary-foreground/30 px-3 py-1.5 text-xs font-medium hover:bg-primary-foreground/10">Admin</Link>
        </div>
        <div className="h-1 bg-secondary" />
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        {done ? (
          <div className="rounded-xl border bg-card p-8 text-center shadow-sm">
            <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
            <h2 className="mt-3 text-xl font-bold">Laporan berjaya dihantar</h2>
            <p className="mt-1 text-sm text-muted-foreground">Terima kasih, {name}. Laporan anda telah direkodkan.</p>
            <Button className="mt-6" onClick={reset}>Hantar laporan baharu</Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            <section className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-semibold"><Lock className="h-4 w-4 text-primary" /> Data Dikunci Automatik</h2>
                <button type="button" onClick={capture} className="flex items-center gap-1 text-xs text-primary hover:underline"><RefreshCw className="h-3 w-3" /> Ambil semula</button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <LockedField label="Tarikh" value={capturedAt?.toLocaleDateString("ms-MY", { day: "2-digit", month: "long", year: "numeric" }) ?? "—"} />
                <LockedField label="Masa" value={capturedAt?.toLocaleTimeString("ms-MY") ?? "—"} />
                <LockedField label="Latitud" value={geo ? geo.lat.toFixed(6) : "—"} />
                <LockedField label="Longitud" value={geo ? geo.lng.toFixed(6) : "—"} />
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs">
                {geo && accLevel ? (
                  <>
                    <span className={`inline-block h-2.5 w-2.5 rounded-full ${accLevel.c}`} />
                    <span>Ketepatan GPS: <b>±{Math.round(geo.acc)} m</b> ({accLevel.t})</span>
                  </>
                ) : geoErr ? (
                  <span className="text-destructive">{geoErr}</span>
                ) : (
                  <span className="flex items-center gap-1 text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Mengunci lokasi GPS…</span>
                )}
              </div>
              <div className="mt-3">
                <ClientMap pins={pins} height={180} />
              </div>
            </section>

            <section className="space-y-4 rounded-xl border bg-card p-4 shadow-sm">
              <h2 className="font-semibold">Maklumat Staf</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5"><Label>Nama *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama penuh" /></div>
                <div className="space-y-1.5"><Label>ID Staf / Unit / Kontraktor *</Label><Input value={staffId} onChange={(e) => setStaffId(e.target.value)} placeholder="cth. 123456 / BPF" /></div>
              </div>
              <p className="text-xs text-muted-foreground">Disimpan dalam peranti ini untuk kegunaan seterusnya.</p>
            </section>

            <section className="space-y-4 rounded-xl border bg-card p-4 shadow-sm">
              <h2 className="font-semibold">Butiran Laporan</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <Pick label="Kategori Laporan *" value={category} onChange={setCategory} items={CATEGORIES} />
                <Pick label="Status Tugasan *" value={status} onChange={setStatus} items={STAFF_STATUSES} />
                <Pick label="Zon *" value={zone} onChange={(v) => { setZone(v); setBuilding(""); }} items={Object.keys(ZONES)} />
                <Pick label="Bangunan / Lokasi *" value={building} onChange={setBuilding} items={(zone && ZONES[zone]) || []} disabled={!zone} placeholder={zone ? "Pilih bangunan" : "Pilih zon dahulu"} />
              </div>
              <div className="space-y-1.5">
                <Label>Catatan Terperinci</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Aras, nombor bilik, atau catatan kerja…" />
              </div>
            </section>

            <section className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
              <h2 className="flex items-center gap-2 font-semibold"><Camera className="h-4 w-4 text-primary" /> Bukti Visual (Pilihan)</h2>
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary/40 bg-accent/40 p-6 text-center hover:bg-accent">
                {preview ? <img src={preview} alt="Pratonton foto" className="max-h-64 rounded-md object-contain" /> : <><Camera className="h-8 w-8 text-primary" /><span className="text-sm font-medium">Ambil / muat naik foto</span></>}
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onPhoto(e.target.files?.[0] ?? null)} />
              </label>
            </section>

            <Button type="submit" size="lg" className="w-full" disabled={busy || !geo}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
              Hantar Laporan
            </Button>
          </form>
        )}
      </main>
    </div>
  );
}

function LockedField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted px-3 py-2">
      <p className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground"><Lock className="h-2.5 w-2.5" />{label}</p>
      <p className="select-none font-mono text-sm font-semibold">{value}</p>
    </div>
  );
}

function Pick({ label, value, onChange, items, disabled, placeholder }: { label: string; value: string; onChange: (v: string) => void; items: string[]; disabled?: boolean; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange} disabled={!!disabled}>
        <SelectTrigger className="w-full"><SelectValue placeholder={placeholder ?? "Pilih"} /></SelectTrigger>
        <SelectContent>{items.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}

