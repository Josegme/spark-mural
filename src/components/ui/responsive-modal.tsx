/**
 * ResponsiveModal — Dialog en desktop, Drawer (bottom sheet) en mobile.
 * Uso espejo de la API de Dialog/Drawer.
 */

import * as React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { cn } from '@/lib/utils';

interface RootProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const MobileCtx = React.createContext(false);

export function ResponsiveModal({ open, onOpenChange, children }: RootProps) {
  const isMobile = useIsMobile();
  return (
    <MobileCtx.Provider value={isMobile}>
      {isMobile ? (
        <Drawer open={open} onOpenChange={onOpenChange}>
          {children}
        </Drawer>
      ) : (
        <Dialog open={open} onOpenChange={onOpenChange}>
          {children}
        </Dialog>
      )}
    </MobileCtx.Provider>
  );
}

interface ContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Max width on desktop. Defaults to max-w-lg */
  desktopClassName?: string;
}

export function ResponsiveModalContent({
  className,
  desktopClassName,
  children,
  ...props
}: ContentProps) {
  const isMobile = React.useContext(MobileCtx);
  if (isMobile) {
    return (
      <DrawerContent
        className={cn(
          'max-h-[92vh] safe-bottom',
          className,
        )}
      >
        <div className="overflow-y-auto overflow-x-hidden px-4 pb-6 pt-2">
          {children}
        </div>
      </DrawerContent>
    );
  }
  return (
    <DialogContent
      className={cn(
        'max-h-[92vh] overflow-y-auto overflow-x-hidden',
        desktopClassName ?? 'max-w-lg',
        className,
      )}
      {...props}
    >
      {children}
    </DialogContent>
  );
}

export function ResponsiveModalHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const isMobile = React.useContext(MobileCtx);
  return isMobile ? (
    <DrawerHeader className={cn('text-left px-0 pt-2', className)} {...props} />
  ) : (
    <DialogHeader className={className} {...props} />
  );
}

export function ResponsiveModalTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  const isMobile = React.useContext(MobileCtx);
  return isMobile ? (
    <DrawerTitle className={cn('font-display text-lg', className)} {...props} />
  ) : (
    <DialogTitle className={className} {...props} />
  );
}

export function ResponsiveModalDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  const isMobile = React.useContext(MobileCtx);
  return isMobile ? (
    <DrawerDescription className={className} {...props} />
  ) : (
    <DialogDescription className={className} {...props} />
  );
}

export function ResponsiveModalFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const isMobile = React.useContext(MobileCtx);
  return isMobile ? (
    <DrawerFooter className={cn('px-0 pt-4', className)} {...props} />
  ) : (
    <DialogFooter className={className} {...props} />
  );
}
