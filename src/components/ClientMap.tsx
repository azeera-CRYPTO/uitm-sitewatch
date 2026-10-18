import { lazy, Suspense, useEffect, useState } from "react";
import type { Pin } from "./LeafletMap";

const LeafletMap = lazy(() => import("./LeafletMap"));

export function ClientMap(props: { pins: Pin[]; height?: number; onPinClick?: (id: string) => void }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const fallback = <div style={{ height: props.height ?? 200 }} className="w-full animate-pulse rounded-lg bg-muted" />;
  if (!ready) return fallback;
  return (
    <Suspense fallback={fallback}>
      <LeafletMap {...props} />
    </Suspense>
  );
}
export type { Pin };
