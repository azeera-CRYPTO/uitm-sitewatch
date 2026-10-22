import { lazy, Suspense } from "react";
import { ClientOnly } from "@tanstack/react-router";
import type { Pin } from "@/lib/map-reports";

const LeafletMap = lazy(() => import("./LeafletMap"));

export function ClientMap(props: { pins: Pin[]; height?: number; clustered?: boolean; onPinClick?: (id: string) => void }) {
  const fallback = <div style={{ height: props.height ?? 200 }} className="w-full animate-pulse rounded-lg bg-muted" />;
  return (
    <ClientOnly fallback={fallback}>
    <Suspense fallback={fallback}>
      <LeafletMap {...props} />
    </Suspense>
    </ClientOnly>
  );
}
export type { Pin };
