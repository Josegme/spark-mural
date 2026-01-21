/**
 * PICKEVENT - Layout de Muro Interactivo
 * Fullscreen sin header/footer para proyección
 */

import { ReactNode } from 'react';

interface MuroLayoutProps {
  children: ReactNode;
}

export function MuroLayout({ children }: MuroLayoutProps) {
  return (
    <div className="muro-fullscreen">
      {children}
    </div>
  );
}

export default MuroLayout;
