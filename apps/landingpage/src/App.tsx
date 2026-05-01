import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "./layouts/MainLayout";
import { HomePage } from "./pages/Home";
import { AppPage } from "./pages/App";
import { MarketplacePage } from "./pages/Marketplace";
import { FeaturesPage } from "./pages/Features";
import { InfrastructurePage } from "./pages/Infrastructure";
import { RegisterPage } from "./pages/Register";
import { CloakGatewayPage } from "./pages/CloakGateway";
import { PitchdeckPage } from "./pages/Pitchdeck";
import { TheGaragePage } from "./pages/TheGarage";
import { ContributePage } from "./pages/Contribute";
import { TooltipProvider } from "./components/ui/tooltip";
// Dialog components are now in DialogComponents.tsx

import { LinksPage } from "./pages/Links";
import { Start } from "./pages/Start";
import { Dashboard } from "./pages/Dashboard";
import { ScrollToTop } from "./components/ScrollToTop";

function App() {
  return (
    <TooltipProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route path="app" element={<AppPage />} />
            <Route path="marketplace" element={<MarketplacePage />} />
            <Route path="features" element={<FeaturesPage />} />
            <Route path="infrastructure" element={<InfrastructurePage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="links" element={<LinksPage />} />
            <Route path="start" element={<Start />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="gateway" element={<CloakGatewayPage />} />
            <Route path="pitchdeck" element={<PitchdeckPage />} />
            <Route path="contribute" element={<ContributePage />} />
            <Route path="the-garage" element={<TheGaragePage />} />
            <Route path="builders" element={<Navigate to="/contribute" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  );
}

export default App;
