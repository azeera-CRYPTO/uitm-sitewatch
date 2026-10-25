import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ReportOption } from "./report-options";

export const reportOptionsQuery = queryOptions({
  queryKey: ["report-options"],
  staleTime: 0,
  queryFn: async (): Promise<ReportOption[]> => {
    const { data, error } = await supabase.from("report_options").select("*").order("created_at");
    if (error) throw new Error("Senarai kategori dan status gagal dimuatkan.");
    return (data ?? []) as ReportOption[];
  },
});