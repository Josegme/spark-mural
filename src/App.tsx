import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          {/* Rutas públicas */}
          <Route path="/login" element={<NotFound />} />
          <Route path="/crear-evento" element={<NotFound />} />
          {/* Rutas del muro (públicas, sin auth) */}
          <Route path="/muro/:token" element={<NotFound />} />
          <Route path="/subir/:token" element={<NotFound />} />
          <Route path="/album/:token" element={<NotFound />} />
          {/* Rutas de cliente */}
          <Route path="/dashboard" element={<NotFound />} />
          <Route path="/evento/:id" element={<NotFound />} />
          {/* Rutas de asistente */}
          <Route path="/asistente/*" element={<NotFound />} />
          {/* Rutas de salón */}
          <Route path="/salon/*" element={<NotFound />} />
          {/* Rutas de super admin */}
          <Route path="/admin/*" element={<NotFound />} />
          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
