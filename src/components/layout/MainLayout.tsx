/**
 * PICKEVENT - Layout Principal
 * Wrapper para páginas públicas con header y footer
 */

import { ReactNode, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Menu, LayoutDashboard, PartyPopper, LogIn, X } from 'lucide-react';

interface MainLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
}

export function MainLayout({
  children,
  showHeader = true,
  showFooter = true,
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
  const { user, isSuperAdmin, isRole } = useAuth();
  const [open, setOpen] = useState(false);
  const isLoggedIn = !!user;
  const showAdminButton = isSuperAdmin();

  const getDashboardUrl = () => {
    if (isSuperAdmin()) return '/admin';
    if (isRole('asistente')) return '/asistente';
    if (isRole('salon')) return '/salon';
    return '/dashboard';
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-top">
      <div className="container flex h-16 items-center justify-between gap-2">
        <Link to="/" className="flex items-center gap-2 min-w-0 touch-feedback">
          <span className="text-2xl">🎉</span>
          <span className="font-display text-lg sm:text-xl font-bold text-gradient-primary truncate">
            PickEvent
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          <a
            href="/#como-funciona"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cómo Funciona
          </a>
          <a
            href="/#planes"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Planes
          </a>
          <a
            href="/#casos-de-uso"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Casos de Uso
          </a>
        </nav>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-3">
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
                <Link to={getDashboardUrl()}>Mi Dashboard</Link>
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

        {/* Mobile: solo CTA principal + hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <Button asChild size="sm" className="btn-hero text-xs px-3 h-9 touch-feedback">
            <Link to="/crear-evento">
              <PartyPopper className="w-4 h-4" />
              Crear
            </Link>
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9 touch-feedback" aria-label="Abrir menú">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] max-w-sm p-0 flex flex-col safe-top safe-bottom">
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🎉</span>
                  <span className="font-display text-lg font-bold text-gradient-primary">PickEvent</span>
                </div>
                <SheetClose asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Cerrar menú">
                    <X className="w-5 h-5" />
                  </Button>
                </SheetClose>
              </div>

              <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                {isLoggedIn && (
                  <SheetClose asChild>
                    <Link
                      to={getDashboardUrl()}
                      className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium hover:bg-muted transition-colors touch-feedback"
                    >
                      <LayoutDashboard className="w-5 h-5 text-primary" />
                      Mi Dashboard
                    </Link>
                  </SheetClose>
                )}

                {showAdminButton && (
                  <SheetClose asChild>
                    <Link
                      to="/admin"
                      className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium hover:bg-muted transition-colors touch-feedback"
                    >
                      <Shield className="w-5 h-5 text-accent" />
                      Panel Admin
                    </Link>
                  </SheetClose>
                )}

                <div className="my-3 border-t" />

                <SheetClose asChild>
                  <a
                    href="/#como-funciona"
                    className="block px-3 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors touch-feedback"
                  >
                    Cómo Funciona
                  </a>
                </SheetClose>
                <SheetClose asChild>
                  <a
                    href="/#planes"
                    className="block px-3 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors touch-feedback"
                  >
                    Planes
                  </a>
                </SheetClose>
                <SheetClose asChild>
                  <a
                    href="/#casos-de-uso"
                    className="block px-3 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors touch-feedback"
                  >
                    Casos de Uso
                  </a>
                </SheetClose>
              </nav>

              {!isLoggedIn && (
                <div className="p-4 border-t">
                  <SheetClose asChild>
                    <Button asChild variant="outline" className="w-full touch-feedback">
                      <Link to="/login">
                        <LogIn className="w-4 h-4" />
                        Iniciar Sesión
                      </Link>
                    </Button>
                  </SheetClose>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  const currentYear = new Date().getFullYear();

  const sections = [
    {
      title: 'Producto',
      links: [
        { label: 'Cómo Funciona', href: '/#como-funciona', external: false, isAnchor: true },
        { label: 'Planes y Precios', href: '/#planes', external: false, isAnchor: true },
        { label: 'Casos de Uso', href: '/#casos-de-uso', external: false, isAnchor: true },
      ],
    },
    {
      title: 'Empresa',
      links: [
        { label: 'Para Salones', href: '/para-salones', external: false, isAnchor: false },
        { label: 'Para Organizadores', href: '/para-organizadores', external: false, isAnchor: false },
        { label: 'Contacto', href: '/contacto', external: false, isAnchor: false },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Términos y Condiciones', href: '/terminos', external: false, isAnchor: false },
        { label: 'Política de Privacidad', href: '/privacidad', external: false, isAnchor: false },
      ],
    },
  ];

  const renderLink = (link: { label: string; href: string; isAnchor: boolean }) =>
    link.isAnchor ? (
      <a href={link.href} className="hover:text-foreground transition-colors">
        {link.label}
      </a>
    ) : (
      <Link to={link.href} className="hover:text-foreground transition-colors">
        {link.label}
      </Link>
    );

  return (
    <footer className="border-t bg-muted/30 safe-bottom">
      <div className="container py-10 md:py-12">
        {/* Brand siempre visible */}
        <div className="space-y-3 md:space-y-4 md:mb-0 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎉</span>
            <span className="font-display text-xl font-bold">PickEvent</span>
          </div>
          <p className="text-sm text-muted-foreground max-w-md">
            Muros interactivos en tiempo real para eventos inolvidables.
          </p>
        </div>

        {/* Mobile: accordion */}
        <div className="md:hidden mt-2">
          <Accordion type="single" collapsible className="w-full">
            {sections.map((section) => (
              <AccordionItem key={section.title} value={section.title}>
                <AccordionTrigger className="font-display font-semibold text-sm py-3">
                  {section.title}
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 text-sm text-muted-foreground pl-1">
                    {section.links.map((link) => (
                      <li key={link.label}>{renderLink(link)}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Desktop: grid 4 columnas */}
        <div className="hidden md:grid grid-cols-4 gap-8 mt-8">
          <div className="space-y-4">
            {/* placeholder para alinear con el brand de arriba */}
          </div>
          {sections.map((section) => (
            <div key={section.title} className="space-y-4">
              <h4 className="font-display font-semibold">{section.title}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {section.links.map((link) => (
                  <li key={link.label}>{renderLink(link)}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t text-center text-sm text-muted-foreground">
          <p>© {currentYear} PickEvent. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}

export default MainLayout;
