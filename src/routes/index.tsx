import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Lock, MapPin, Camera, Loader2, CheckCircle2, ShieldCheck, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClientMap } from "@/components/ClientMap";
import { CATEGORIES, STAFF_STATUSES, ZONES } from "@/lib/locations";

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
  component: StaffForm,
});

type Geo = { lat: number; lng: number; acc: number } | null;

function StaffForm() {
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
    if (!navigator.geolocation) return setGeoErr("Peranti tidak menyokong GPS.");
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
    if (!geo || !capturedAt) return toast.error("Lokasi GPS belum dikunci.");
    if (!name.trim() || !staffId.trim() || !category || !status || !zone || !building) return toast.error("Sila lengkapkan semua medan wajib.");
    if (!photo) return toast.error("Foto bukti adalah wajib.");
    setBusy(true);
    try {
      localStorage.setItem("staff_name", name.trim());
      localStorage.setItem("staff_id", staffId.trim());
      const ext = photo.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${capturedAt.toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
      const up = await supabase.storage.from("report-photos").upload(path, photo, { contentType: photo.type || "image/jpeg" });
      if (up.error) throw up.error;
      const { error } = await supabase.from("reports").insert({
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
                <Pick label="Bangunan / Lokasi *" value={building} onChange={setBuilding} items={zone ? ZONES[zone] : []} disabled={!zone} placeholder={zone ? "Pilih bangunan" : "Pilih zon dahulu"} />
              </div>
              <div className="space-y-1.5">
                <Label>Catatan Terperinci</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Aras, nombor bilik, atau catatan kerja…" />
              </div>
            </section>

            <section className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
              <h2 className="flex items-center gap-2 font-semibold"><Camera className="h-4 w-4 text-primary" /> Bukti Visual *</h2>
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
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full"><SelectValue placeholder={placeholder ?? "Pilih"} /></SelectTrigger>
        <SelectContent>{items.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}

export { MapPin };
