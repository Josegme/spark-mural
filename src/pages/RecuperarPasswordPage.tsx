/**
 * PICKEVENT - Página de Recuperación de Contraseña
 * Permite solicitar un email para restablecer la contraseña
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';

const resetSchema = z.object({
  email: z.string().email('Email inválido'),
});

type ResetFormData = z.infer<typeof resetSchema>;

export default function RecuperarPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors }, getValues } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async (data: ResetFormData) => {
    setIsLoading(true);
    
    const redirectUrl = `${window.location.origin}/restablecer-password`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: redirectUrl,
    });
    
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo enviar el email de recuperación. Intentá nuevamente.',
      });
    } else {
      setEmailSent(true);
      toast({
        title: 'Email enviado',
        description: 'Revisá tu bandeja de entrada para restablecer tu contraseña.',
      });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <span className="text-4xl">🎉</span>
            <span className="font-display text-3xl font-bold text-gradient-primary">
              PickEvent
            </span>
          </Link>
        </div>

        <Card className="border-2">
          <CardHeader className="text-center">
            <CardTitle className="font-display text-2xl">
              {emailSent ? 'Email Enviado' : 'Recuperar Contraseña'}
            </CardTitle>
            <CardDescription>
              {emailSent 
                ? 'Revisá tu bandeja de entrada'
                : 'Ingresá tu email para recibir un enlace de recuperación'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {emailSent ? (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Enviamos un email a:
                  </p>
                  <p className="font-medium">{getValues('email')}</p>
                  <p className="text-sm text-muted-foreground">
                    Hacé clic en el enlace del email para crear una nueva contraseña.
                  </p>
                </div>
                <div className="pt-4 space-y-3">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setEmailSent(false)}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Enviar a otro email
                  </Button>
                  <Link to="/login" className="block">
                    <Button variant="ghost" className="w-full">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Volver al inicio de sesión
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="tu@email.com"
                    {...register('email')}
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full btn-hero" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Enviar email de recuperación
                    </>
                  )}
                </Button>

                <Link to="/login" className="block">
                  <Button variant="ghost" className="w-full">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver al inicio de sesión
                  </Button>
                </Link>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
