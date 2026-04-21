import { Route, Routes } from "react-router-dom";
import { OverviewPage } from "./pages/OverviewPage";
import { PlayerDetailPage } from "./pages/PlayerDetailPage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<OverviewPage />} />
      <Route path="/p/:player" element={<PlayerDetailPage />} />
    </Routes>
  );
}
