import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const contractorScopesQuery = {
  queryKey: ["report-contractor-scopes"],
  queryFn: async () => {
    const { data, error } = await supabase.from("contractor_scopes").select("id, name").order("name");
    if (error) throw error;
    return data;
  },
};

export function ReportContractorFields({ scopeId, company, onScopeChange, onCompanyChange }: {
  scopeId: string; company: string; onScopeChange: (value: string) => void; onCompanyChange: (value: string) => void;
}) {
  const { data: scopes = [], isPending, isError } = useQuery(contractorScopesQuery);
  return <div className="grid gap-3 sm:grid-cols-2">
    <div className="space-y-1.5"><Label htmlFor="report-scope">Skop Kerja / Kontraktor (Pilihan)</Label>
      <Select value={scopeId || "none"} onValueChange={(v) => onScopeChange(v === "none" ? "" : v)} disabled={isPending || isError}>
        <SelectTrigger id="report-scope" className="w-full" aria-label="Skop Kerja / Kontraktor"><SelectValue placeholder="Pilih skop" /></SelectTrigger>
        <SelectContent><SelectItem value="none">Tiada skop</SelectItem>{scopes.map((scope) => <SelectItem key={scope.id} value={scope.id}>{scope.name}</SelectItem>)}</SelectContent>
      </Select>
      {isError && <p className="text-xs text-destructive">Senarai skop gagal dimuatkan. Sila cuba semula.</p>}
    </div>
    <div className="space-y-1.5"><Label htmlFor="report-company">Nama Syarikat / Unit (Pilihan)</Label><Input id="report-company" value={company} maxLength={200} onChange={(e) => onCompanyChange(e.target.value)} /></div>
  </div>;
}