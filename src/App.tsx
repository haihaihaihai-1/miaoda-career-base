import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "@/context/AppContext";
import BrandAdvisor from "@/components/ai/BrandAdvisor";
import NetworkStatusBanner from "@/components/NetworkStatusBanner";
import { brand } from "@/config";
import Index from "./pages/Index";
import HireflowIndex from "./pages/hireflow/Index";
import TeachingIndex from "./pages/teaching/Index";
import CampusIndex from "./pages/campus/Index";
import LaiLuIndex from "./pages/lai-lu/Index";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

/** 按 brand 选择根路由组件 */
function RootRoute() {
  switch (brand.id) {
    case "hireflow":
      return <HireflowIndex />;
    case "teaching":
      return <TeachingIndex />;
    case "campus":
      return <CampusIndex />;
    case "lai-lu":
      return <LaiLuIndex />;
    default:
      return <Index />;
  }
}

/** GitHub Pages 部署时 base !== "/" 须设置 basename */
const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, "") || "/";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <Toaster />
        <Sonner />
        <NetworkStatusBanner className="fixed top-0 left-0 right-0 z-50" />
        <BrowserRouter basename={routerBasename}>
          <Routes>
            <Route path="/" element={<RootRoute />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <BrandAdvisor />
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
