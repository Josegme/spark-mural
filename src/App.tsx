import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import RecuperarPasswordPage from "./pages/RecuperarPasswordPage";
import RestablecerPasswordPage from "./pages/RestablecerPasswordPage";
import DashboardPage from "./pages/DashboardPage";
import CreateEventPage from "./pages/CreateEventPage";
import EventDetailPage from "./pages/EventDetailPage";
import MuroPage from "./pages/MuroPage";
import UploadPage from "./pages/UploadPage";
import AlbumPage from "./pages/AlbumPage";
import AdminPage from "./pages/AdminPage";
import AsistentePage from "./pages/AsistentePage";
import SalonPage from "./pages/SalonPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import TestingGuidePage from "./pages/TestingGuidePage";
import TechnicalReportPage from "./pages/TechnicalReportPage";
import StakeholderReportPage from "./pages/StakeholderReportPage";
import NotFound from "./pages/NotFound";
import ComingSoonPage from "./pages/ComingSoonPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
          <Routes>
            {/* Rutas públicas */}
            <Route path="/" element={<Index />} />
            <Route path="/para-salones" element={<ComingSoonPage />} />
            <Route path="/para-organizadores" element={<ComingSoonPage />} />
            <Route path="/contacto" element={<ComingSoonPage />} />
            <Route path="/terminos" element={<ComingSoonPage />} />
            <Route path="/privacidad" element={<ComingSoonPage />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/recuperar-password" element={<RecuperarPasswordPage />} />
            <Route path="/restablecer-password" element={<RestablecerPasswordPage />} />
            
            {/* Rutas del muro (públicas, sin auth) */}
            <Route path="/muro/:token" element={<MuroPage />} />
            <Route path="/subir/:token" element={<UploadPage />} />
            <Route path="/album/:token" element={<AlbumPage />} />
            
            {/* Ruta de pago exitoso (protegida) */}
            <Route
              path="/pago-exitoso"
              element={
                <ProtectedRoute>
                  <PaymentSuccessPage />
                </ProtectedRoute>
              }
            />
            
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
                  <EventDetailPage />
                </ProtectedRoute>
              }
            />
            
            {/* Rutas protegidas - Asistente */}
            <Route
              path="/asistente"
              element={
                <ProtectedRoute allowedRoles={['asistente', 'super_admin']}>
                  <AsistentePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/asistente/*"
              element={
                <ProtectedRoute allowedRoles={['asistente', 'super_admin']}>
                  <AsistentePage />
                </ProtectedRoute>
              }
            />
            
            {/* Rutas protegidas - Salón */}
            <Route
              path="/salon"
              element={
                <ProtectedRoute allowedRoles={['salon', 'super_admin']}>
                  <SalonPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/salon/*"
              element={
                <ProtectedRoute allowedRoles={['salon', 'super_admin']}>
                  <SalonPage />
                </ProtectedRoute>
              }
            />
            
            {/* Rutas protegidas - Super Admin */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['super_admin']}>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute allowedRoles={['super_admin']}>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
            
            {/* Testing Guide - Solo desarrollo/super_admin */}
            <Route
              path="/testing-guide"
              element={
                <ProtectedRoute allowedRoles={['super_admin']}>
                  <TestingGuidePage />
                </ProtectedRoute>
              }
            />
            
            {/* Technical Report - Solo super_admin */}
            <Route path="/technical-report" element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <TechnicalReportPage />
              </ProtectedRoute>
            } />
            
            {/* Stakeholder Report - Solo super_admin */}
            <Route path="/informe-stakeholders" element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <StakeholderReportPage />
              </ProtectedRoute>
            } />
            
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
