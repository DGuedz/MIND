import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "./layouts/MainLayout";
import { HomePage } from "./pages/Home";
import { AppPage } from "./pages/App";
import { FeaturesPage } from "./pages/Features";
import { InfrastructurePage } from "./pages/Infrastructure";
import { RegisterPage } from "./pages/Register";
import { GamePage } from "./pages/Game";
import { TooltipProvider } from "./components/ui/tooltip";

function App() {
  return (
    <TooltipProvider>
      <BrowserRouter>
        <Routes>
          {/* Game Route - No Layout (Fullscreen for Telegram) - Must be before the layout catch-all */}
          <Route path="/game" element={<GamePage />} />
          
          <Route path="/" element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route path="app" element={<AppPage />} />
            <Route path="features" element={<FeaturesPage />} />
            <Route path="infrastructure" element={<InfrastructurePage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  );
}

export default App;
