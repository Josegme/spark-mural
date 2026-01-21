import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import CreateEventPage from "./pages/CreateEventPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Rutas públicas */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<AuthPage />} />
            
            {/* Rutas del muro (públicas, sin auth) */}
            <Route path="/muro/:token" element={<NotFound />} />
            <Route path="/subir/:token" element={<NotFound />} />
            <Route path="/album/:token" element={<NotFound />} />
            
            {/* Rutas protegidas - Cliente */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/crear-evento"
              element={
                <ProtectedRoute>
                  <CreateEventPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/evento/:id"
              element={
                <ProtectedRoute>
                  <NotFound />
                </ProtectedRoute>
              }
            />
            
            {/* Rutas protegidas - Asistente */}
            <Route
              path="/asistente/*"
              element={
                <ProtectedRoute allowedRoles={['asistente', 'super_admin']}>
                  <NotFound />
                </ProtectedRoute>
              }
            />
            
            {/* Rutas protegidas - Salón */}
            <Route
              path="/salon/*"
              element={
                <ProtectedRoute allowedRoles={['salon', 'super_admin']}>
                  <NotFound />
                </ProtectedRoute>
              }
            />
            
            {/* Rutas protegidas - Super Admin */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute allowedRoles={['super_admin']}>
                  <NotFound />
                </ProtectedRoute>
              }
            />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
