/**
 * ResponsiveModal — Dialog en desktop, Drawer (bottom sheet) en mobile.
 * Uso espejo de la API de Dialog/Drawer.
 */

import * as React from 'react';
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
  desktopClassName?: string;
}

export const ResponsiveModalContent = React.forwardRef<HTMLDivElement, ContentProps>(
  ({ className, desktopClassName, children, ...props }, ref) => {
    const isMobile = React.useContext(MobileCtx);
    if (isMobile) {
      return (
        <DrawerContent
          ref={ref}
          className={cn('max-h-[92vh] safe-bottom', className)}
        >
          <div className="overflow-y-auto overflow-x-hidden px-4 pb-6 pt-2">
            {children}
          </div>
        </DrawerContent>
      );
    }
    return (
      <DialogContent
        ref={ref}
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
  },
);
ResponsiveModalContent.displayName = 'ResponsiveModalContent';

export const ResponsiveModalHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const isMobile = React.useContext(MobileCtx);
    return isMobile ? (
      <DrawerHeader className={cn('text-left px-0 pt-2', className)} {...props} />
    ) : (
      <div ref={ref} className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />
    );
  },
);
ResponsiveModalHeader.displayName = 'ResponsiveModalHeader';

export const ResponsiveModalTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => {
    const isMobile = React.useContext(MobileCtx);
    return isMobile ? (
      <DrawerTitle ref={ref} className={cn('font-display text-lg', className)} {...props} />
    ) : (
      <DialogTitle ref={ref} className={className} {...props} />
    );
  },
);
ResponsiveModalTitle.displayName = 'ResponsiveModalTitle';

export const ResponsiveModalDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => {
    const isMobile = React.useContext(MobileCtx);
    return isMobile ? (
      <DrawerDescription ref={ref} className={className} {...props} />
    ) : (
      <DialogDescription ref={ref} className={className} {...props} />
    );
  },
);
ResponsiveModalDescription.displayName = 'ResponsiveModalDescription';

export const ResponsiveModalFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const isMobile = React.useContext(MobileCtx);
    return isMobile ? (
      <DrawerFooter className={cn('px-0 pt-4', className)} {...props} />
    ) : (
      <DialogFooter className={className} {...props} />
    );
  },
);
ResponsiveModalFooter.displayName = 'ResponsiveModalFooter';
