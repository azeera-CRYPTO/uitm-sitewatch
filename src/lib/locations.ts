export const ZONES: Record<string, string[]> = {
  "ZON 1": [
    "Bangunan Pentadbiran",
    "Blok Akademik A & B",
    "Pusat Islam / Medan Ilmu",
    "Pos Utama Polis Bantuan",
    "BPF / Unit Kenderaan",
    "Blok Akademik D",
    "Dewan Badminton UiTM",
    "Pusat Pelajar / Premier Lounge",
  ],
  "ZON 2": [
    "Kolej Tun Razak",
    "Kolej Tunku Abdul Rahman",
    "Dewan Profesional",
    "Pusat Kesihatan",
    "Bengkel FSSR",
    "Pejabat Unit Kaunseling",
    "Perpustakaan Tengku Anis",
    "Blok Akademik C",
    "Birda",
  ],
  "ZON 3": [
    "Kolej Dato Onn",
    "Pejabat Unit Sukan",
    "Kolej Tun Hussein Onn",
    "Food Court THO (Surau)",
    "Kolej Tun Dr Mahathir",
    "Rumah Universiti",
    "Pejabat Polis Bantuan",
  ],
};

export const CATEGORIES = [
  "Perkhidmatan Pencucian",
  "Kerja Pembaikan Kecil",
  "Pemantauan Projek",
  "Lain-lain / Aduan",
];

export const STAFF_STATUSES = ["Selesai", "Dalam Proses", "Memerlukan Tindakan Lanjut"];
export const ADMIN_STATUSES = ["Selesai", "Dalam Proses", "Memerlukan Tindakan Lanjut", "Dalam Tindakan"];
export const HIGH_PRIORITY = "Memerlukan Tindakan Lanjut";

export type Report = {
  id: string;
  user_id: string | null;
  reporter_type?: string | null;
  created_at: string;
  captured_at: string;
  latitude: number;
  longitude: number;
  gps_accuracy: number | null;
  staff_name: string;
  staff_id: string;
  category: string;
  status: string;
  zone: string;
  building: string;
  notes: string | null;
  photo_path: string | null;
  admin_notes: string | null;
  contractor_scope_id?: string | null;
  contractor_company?: string | null;
};

export type CsvScope = { id: string; name: string };

export function reporterTypeLabel(type?: string | null): string {
  return type === "staff" ? "Staf UiTM" : type === "contractor" ? "Kontraktor" : "Rekod lama";
}

export function toCsv(rows: Report[], scopes: CsvScope[] = []): string {
  const scopeName = (id?: string | null) => (id ? scopes.find((s) => s.id === id)?.name ?? "" : "");
  const head = ["Tarikh/Masa", "Nama", "ID/Unit", "Jenis Pelapor", "Skop Kerja", "Nama Syarikat", "Kategori", "Zon", "Bangunan", "Status", "Catatan", "Catatan Admin", "Latitud", "Longitud", "Ketepatan (m)"];
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = rows.map((r) =>
    [new Date(r.captured_at).toLocaleString("ms-MY"), r.staff_name, r.staff_id, reporterTypeLabel(r.reporter_type), scopeName(r.contractor_scope_id), r.contractor_company ?? "", r.category, r.zone, r.building, r.status, r.notes, r.admin_notes, r.latitude, r.longitude, r.gps_accuracy ? Math.round(r.gps_accuracy) : ""]
      .map(esc)
      .join(","),
  );
  return "\uFEFF" + [head.map(esc).join(","), ...lines].join("\n");
}
