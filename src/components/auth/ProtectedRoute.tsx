/**
 * PICKEVENT - Componente de Ruta Protegida
 * Redirige a login si el usuario no está autenticado
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // Mostrar loading mientras se verifica la sesión
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario, redirigir a login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si hay roles permitidos y el usuario no tiene uno de ellos
  if (allowedRoles && profile && !allowedRoles.includes(profile.rol)) {
    // Redirigir según el rol del usuario
    const redirectPath = getDefaultPathForRole(profile.rol);
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}

// Obtener la ruta por defecto según el rol
function getDefaultPathForRole(role: UserRole): string {
  switch (role) {
    case 'super_admin':
      return '/admin';
    case 'asistente':
      return '/asistente';
    case 'salon':
      return '/salon';
    case 'cliente':
    default:
      return '/dashboard';
  }
}

export default ProtectedRoute;
