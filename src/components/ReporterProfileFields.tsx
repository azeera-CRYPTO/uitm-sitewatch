import { useQuery } from "@tanstack/react-query";
import { contractorScopesQuery } from "./ReportContractorFields";
import type { ProfileInput } from "@/lib/profile-rules";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

export function ReporterProfileFields({ value, onChange }: { value: ProfileInput; onChange: (v: ProfileInput) => void }) {
  const { data: scopes = [], isError } = useQuery(contractorScopesQuery);
  const field = (key: "staff_name" | "staff_id" | "department" | "company_name" | "phone", label: string, required = true) => <div className="space-y-1.5"><Label htmlFor={`profile-${key}`}>{label}{required ? " *" : " (Pilihan)"}</Label><Input id={`profile-${key}`} value={value[key]} maxLength={key === "phone" ? 50 : 200} required={required} onChange={(e) => onChange({ ...value, [key]: e.target.value })} /></div>;
  return <div className="space-y-4">
    <div className="space-y-1.5"><Label>Jenis pengguna *</Label><div className="grid grid-cols-2 gap-2">{(["staff", "contractor"] as const).map((type) => <Button key={type} type="button" variant={value.user_type === type ? "default" : "outline"} aria-pressed={value.user_type === type} onClick={() => onChange({ ...value, user_type: type })}>{type === "staff" ? "Staf UiTM" : "Kontraktor"}</Button>)}</div></div>
    {field("staff_name", value.user_type === "staff" ? "Nama penuh" : "Nama wakil / pekerja")}
    {value.user_type === "staff" ? <>{field("staff_id", "No. Staf UiTM")}{field("department", "Unit / Bahagian")}</> : <>
      {field("company_name", "Nama Syarikat Kontraktor")}{field("phone", "No. Telefon / Rujukan Syarikat", false)}
      <div className="space-y-1.5"><Label>Skop Kerja Utama (Pilihan)</Label><Select value={value.main_scope_id ?? "none"} onValueChange={(v) => onChange({ ...value, main_scope_id: v === "none" ? null : v })}><SelectTrigger aria-label="Skop Kerja Utama" className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Tiada skop</SelectItem>{scopes.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>{isError && <p className="text-xs text-destructive">Senarai skop gagal dimuatkan.</p>}</div>
    </>}
  </div>;
}