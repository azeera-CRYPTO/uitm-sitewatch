import { ADMIN_STATUSES } from "@/lib/locations";

export type Pin = { id: string; lat: number; lng: number; color?: string; popup?: string; accuracy?: number; status?: string };

export function mapStatusClass(status?: string): string {
  if (status === "Selesai") return "map-status-done";
  if (status === "Memerlukan Tindakan Lanjut") return "map-status-urgent";
  if (status === "Dalam Proses") return "map-status-progress";
  return "map-status-action";
}

export function filterMapReports<T extends { status: string }>(rows: T[], visibleStatuses: string[]): T[] {
  return rows.filter((row) => visibleStatuses.includes(row.status));
}

export function toggleMapStatus(visible: string[], status: string): string[] {
  if (!ADMIN_STATUSES.includes(status)) return visible;
  return visible.includes(status) ? visible.filter((value) => value !== status) : [...visible, status];
}