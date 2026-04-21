import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import { OverviewPage } from "./pages/OverviewPage";

// Code-split the heavy Mol*-dependent routes.
const PlayerDetailPage = lazy(() =>
  import("./pages/PlayerDetailPage").then((m) => ({ default: m.PlayerDetailPage }))
);
const BroadcastPage = lazy(() =>
  import("./pages/BroadcastPage").then((m) => ({ default: m.BroadcastPage }))
);

const FALLBACK = (
  <div role="status" aria-live="polite" style={{ padding: 24, color: "var(--text-muted)" }}>
    loading view…
  </div>
);

export function App() {
  return (
    <Suspense fallback={FALLBACK}>
      <Routes>
        <Route path="/" element={<OverviewPage />} />
        <Route path="/p/:player" element={<PlayerDetailPage />} />
        <Route path="/broadcast" element={<BroadcastPage />} />
      </Routes>
    </Suspense>
  );
}
