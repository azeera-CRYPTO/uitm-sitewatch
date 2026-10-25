import { reportStatusGroup, type ReportOption } from "./report-options";

export type Pin = { id: string; lat: number; lng: number; color?: string; popup?: string; accuracy?: number; status?: string; statusClass?: string };

export function mapStatusClass(status?: string, options: ReportOption[] = []): string {
  if (reportStatusGroup(status ?? "", options) === "done") return "map-status-done";
  if (reportStatusGroup(status ?? "", options) === "urgent") return "map-status-urgent";
  if (status === "Dalam Proses") return "map-status-progress";
  return "map-status-action";
}

export function filterMapReports<T extends { status: string }>(rows: T[], visibleStatuses: string[]): T[] {
  return rows.filter((row) => visibleStatuses.includes(row.status));
}

export function toggleMapStatus(visible: string[], status: string): string[] {
  if (!status.trim()) return visible;
  return visible.includes(status) ? visible.filter((value) => value !== status) : [...visible, status];
}