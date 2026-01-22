/**
 * PICKEVENT - Test Card Information Component
 * Displays test card numbers for Mercado Pago and Stripe
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, CreditCard, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface TestCard {
  number: string;
  result: string;
  variant: 'default' | 'destructive' | 'secondary' | 'outline';
  cvv?: string;
  expiry?: string;
}

interface TestCardInfoProps {
  provider: 'mercadopago' | 'stripe';
}

const mercadoPagoCards: TestCard[] = [
  { number: '5031 7557 3453 0604', result: 'Aprobada', variant: 'default', cvv: '123', expiry: '11/25' },
  { number: '5031 4332 1540 6351', result: 'Rechazada', variant: 'destructive', cvv: '123', expiry: '11/25' },
  { number: '5031 4332 1540 5507', result: 'Pendiente', variant: 'secondary', cvv: '123', expiry: '11/25' },
];

const stripeCards: TestCard[] = [
  { number: '4242 4242 4242 4242', result: 'Aprobada', variant: 'default', cvv: '123', expiry: '12/34' },
  { number: '4000 0000 0000 0002', result: 'Rechazada', variant: 'destructive', cvv: '123', expiry: '12/34' },
  { number: '4000 0027 6000 3184', result: '3D Secure', variant: 'secondary', cvv: '123', expiry: '12/34' },
  { number: '4000 0000 0000 9995', result: 'Fondos insuficientes', variant: 'destructive', cvv: '123', expiry: '12/34' },
];

export function TestCardInfo({ provider }: TestCardInfoProps) {
  const [copiedCard, setCopiedCard] = useState<string | null>(null);
  
  const cards = provider === 'mercadopago' ? mercadoPagoCards : stripeCards;
  const title = provider === 'mercadopago' ? 'Mercado Pago' : 'Stripe';
  const color = provider === 'mercadopago' ? 'bg-primary' : 'bg-secondary';

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text.replace(/\s/g, ''));
    setCopiedCard(text);
    toast.success('Número copiado al portapapeles');
    setTimeout(() => setCopiedCard(null), 2000);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${color}`} />
          <CardTitle className="text-base">Tarjetas de Prueba - {title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {cards.map(card => (
          <div
            key={card.number}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border"
          >
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <div>
                <code className="text-sm font-mono">{card.number}</code>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={card.variant} className="text-xs">
                    {card.result}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    CVV: {card.cvv} | Exp: {card.expiry}
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(card.number)}
            >
              {copiedCard === card.number ? (
                <Check className="h-4 w-4 text-primary" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        ))}
        
        {provider === 'mercadopago' && (
          <div className="mt-3 p-3 bg-accent/50 border border-border rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">DNI de prueba:</strong> Usar cualquier número de 8 dígitos (ej: 12345678)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
