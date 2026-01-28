/**
 * PICKEVENT - Layout Principal
 * Wrapper para páginas públicas con header y footer
 */

import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Shield } from 'lucide-react';

interface MainLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
}

export function MainLayout({ 
  children, 
  showHeader = true, 
  showFooter = true 
}: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {showHeader && <Header />}
      <main className="flex-1">{children}</main>
      {showFooter && <Footer />}
    </div>
  );
}

function Header() {
  const { user, profile, isSuperAdmin } = useAuth();
  const isLoggedIn = !!user;
  const showAdminButton = isSuperAdmin();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">🎉</span>
          <span className="font-display text-xl font-bold text-gradient-primary">
            PickEvent
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link 
            to="/#como-funciona" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cómo Funciona
          </Link>
          <Link 
            to="/#planes" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Planes
          </Link>
          <Link 
            to="/#casos-de-uso" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Casos de Uso
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {showAdminButton && (
            <Button variant="outline" size="sm" asChild className="gap-2 border-accent text-accent hover:bg-accent/10">
              <Link to="/admin">
                <Shield className="w-4 h-4" />
                Panel Admin
              </Link>
            </Button>
          )}
          
          {isLoggedIn ? (
            <>
              <Button variant="ghost" asChild>
                <Link to="/dashboard">Mi Dashboard</Link>
              </Button>
              <Button className="btn-hero text-sm px-4 py-2" asChild>
                <Link to="/crear-evento">Crear Evento</Link>
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to="/login">Iniciar Sesión</Link>
              </Button>
              <Button className="btn-hero text-sm px-4 py-2" asChild>
                <Link to="/crear-evento">Crear Evento</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/30">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎉</span>
              <span className="font-display text-xl font-bold">PickEvent</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Muros interactivos en tiempo real para eventos inolvidables.
            </p>
          </div>

          {/* Producto */}
          <div className="space-y-4">
            <h4 className="font-display font-semibold">Producto</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/#como-funciona" className="hover:text-foreground transition-colors">Cómo Funciona</Link></li>
              <li><Link to="/#planes" className="hover:text-foreground transition-colors">Planes y Precios</Link></li>
              <li><Link to="/#casos-de-uso" className="hover:text-foreground transition-colors">Casos de Uso</Link></li>
            </ul>
          </div>

          {/* Empresa */}
          <div className="space-y-4">
            <h4 className="font-display font-semibold">Empresa</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/para-salones" className="hover:text-foreground transition-colors">Para Salones</Link></li>
              <li><Link to="/para-organizadores" className="hover:text-foreground transition-colors">Para Organizadores</Link></li>
              <li><Link to="/contacto" className="hover:text-foreground transition-colors">Contacto</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="font-display font-semibold">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/terminos" className="hover:text-foreground transition-colors">Términos y Condiciones</Link></li>
              <li><Link to="/privacidad" className="hover:text-foreground transition-colors">Política de Privacidad</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>© {currentYear} PickEvent. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}

export default MainLayout;
