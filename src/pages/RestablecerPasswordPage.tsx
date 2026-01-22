/**
 * PICKEVENT - Página para Restablecer Contraseña
 * El usuario llega aquí desde el email de recuperación
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, CheckCircle2, KeyRound } from 'lucide-react';

const passwordSchema = z.object({
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

export default function RestablecerPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors } } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    // Check if user has a valid recovery session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsValidSession(!!session);
    };
    checkSession();
  }, []);

  const onSubmit = async (data: PasswordFormData) => {
    setIsLoading(true);
    
    const { error } = await supabase.auth.updateUser({
      password: data.password,
    });
    
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo actualizar la contraseña. El enlace puede haber expirado.',
      });
    } else {
      setIsSuccess(true);
      toast({
        title: '¡Contraseña actualizada!',
        description: 'Ya podés iniciar sesión con tu nueva contraseña.',
      });
      
      // Sign out to force re-login with new password
      await supabase.auth.signOut();
      
      // Redirect after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    }
    
    setIsLoading(false);
  };

  // Loading state while checking session
  if (isValidSession === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Invalid or expired link
  if (!isValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
        <div className="w-full max-w-md">
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
              <CardTitle className="font-display text-2xl">Enlace Expirado</CardTitle>
              <CardDescription>
                El enlace de recuperación ya no es válido
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Los enlaces de recuperación de contraseña expiran después de un tiempo por seguridad.
              </p>
              <Link to="/recuperar-password">
                <Button className="w-full">
                  Solicitar nuevo enlace
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
              {isSuccess ? '¡Listo!' : 'Nueva Contraseña'}
            </CardTitle>
            <CardDescription>
              {isSuccess 
                ? 'Tu contraseña fue actualizada'
                : 'Ingresá tu nueva contraseña'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSuccess ? (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Tu contraseña ha sido actualizada correctamente.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Serás redirigido al inicio de sesión en unos segundos...
                  </p>
                </div>
                <Link to="/login">
                  <Button className="w-full">
                    Ir al inicio de sesión
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nueva Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Mínimo 6 caracteres"
                      {...register('password')}
                      className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
                  <Input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Repetí la contraseña"
                    {...register('confirmPassword')}
                    className={errors.confirmPassword ? 'border-destructive' : ''}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full btn-hero" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Actualizando...
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4 mr-2" />
                      Actualizar Contraseña
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
