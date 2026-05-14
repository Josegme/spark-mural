/**
 * PICKEVENT - Hook para crear eventos con pago integrado
 * Soporta múltiples pasarelas: Mercado Pago (AR/BR/PY) y Stripe (NZ/ES/AU/US/GB)
 * Incluye: flujos por rol (Cliente, Salón, Admin, Asistente)
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { generateQRToken } from '@/lib/utils';
import { CreateEventData } from '@/lib/validations/event';
import { usePublicPrices } from '@/hooks/usePublicPrices';
import { toast } from 'sonner';

// Países que usan Stripe
const STRIPE_COUNTRIES = ['NZ', 'ES', 'AU', 'US', 'GB', 'DE', 'FR', 'IT'];

export type PaymentGateway = 'mercadopago' | 'stripe';
export type UserFlowRole = 'cliente' | 'salon' | 'admin' | 'asistente';

export function getPaymentGateway(countryCode: string): PaymentGateway {
  if (STRIPE_COUNTRIES.includes(countryCode.toUpperCase())) {
    return 'stripe';
  }
  return 'mercadopago';
}

export function getCountryFromProfile(pais: string | null | undefined): string {
  if (!pais) return 'AR';
  return pais.toUpperCase().trim();
}

export interface WizardFormData extends CreateEventData {
  aceptaTerminos: boolean;
}

const initialFormData: WizardFormData = {
  nombre: '',
  tipo: 'cumpleanos',
  fecha_evento: '',
  hora_inicio: '20:00',
  duracion_horas: 6,
  es_premium: false,
  tema_ia: '',
  estilo_ia: undefined,
  logo_url: '',
  color_banner: '#4c1d95',
  limite_subidas_por_invitado: undefined,
  moderacion_activa: false,
  aceptaTerminos: false,
};

export function useCreateEvent() {
  const navigate = useNavigate();
  const { user, profile, isSuperAdmin } = useAuth();
  const { prices } = usePublicPrices();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<WizardFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdEvent, setCreatedEvent] = useState<{
    id: string;
    qr_pantalla_token: string;
    qr_invitados_token: string;
    qr_descarga_token: string;
  } | null>(null);
  
  // Payment link state for "Copy Link" feature
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [isPaymentLinkGenerated, setIsPaymentLinkGenerated] = useState(false);

  const [searchParams] = useSearchParams();

  useEffect(() => {
    const plan = searchParams.get('plan');
    if (plan === 'premium') {
      setFormData(prev => ({ ...prev, es_premium: true }));
    } else if (plan === 'basico') {
      setFormData(prev => ({ ...prev, es_premium: false }));
    }
  }, []);

  const totalSteps = 4;
  const stepTitles = ['Información', 'Personalización', 'Configuración', 'Pago'];

  // Detectar qué flujo de UI usar según el rol
  const getUserFlowRole = (): UserFlowRole => {
    if (!profile?.rol) return 'cliente';
    
    switch (profile.rol) {
      case 'super_admin':
        return 'admin';
      case 'asistente':
        return 'asistente';
      case 'salon':
        return 'salon';
      case 'cliente':
      default:
        return 'cliente';
    }
  };

  const updateFormData = (data: Partial<WizardFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const goToStep = (step: number) => {
    if (step >= 0 && step < totalSteps) {
      setCurrentStep(step);
    }
  };

  const calculatePrice = (): number => {
    return formData.es_premium ? prices.premium.precio : prices.basico.precio;
  };

  // Detectar qué pasarela usar según el país del usuario
  const getActiveGateway = (): PaymentGateway => {
    const countryCode = getCountryFromProfile(profile?.pais);
    return getPaymentGateway(countryCode);
  };

  // Generate payment link without redirecting (for copy feature)
  const generatePaymentLink = async (): Promise<string | null> => {
    if (!user || !profile) {
      toast.error('Debés iniciar sesión para generar el link de pago');
      return null;
    }

    setIsSubmitting(true);

    try {
      const precio = calculatePrice();

      const { data, error } = await supabase.functions.invoke('create-payment-preference', {
        body: {
          nombre_evento: formData.nombre,
          tipo_evento: formData.tipo,
          es_premium: formData.es_premium,
          precio: precio,
          cliente_email: profile.email,
          cliente_nombre: profile.nombre,
          evento_data: {
            tipo: formData.tipo,
            fecha_evento: formData.fecha_evento,
            hora_inicio: formData.hora_inicio,
            duracion_horas: formData.duracion_horas,
            tema_ia: formData.es_premium ? formData.tema_ia : null,
            estilo_ia: formData.es_premium ? formData.estilo_ia : null,
            logo_url: formData.logo_url,
            color_banner: formData.color_banner,
            limite_subidas_por_invitado: formData.limite_subidas_por_invitado,
            moderacion_activa: formData.moderacion_activa,
          },
        },
      });

      if (error) {
        console.error('Error creating MP payment preference:', error);
        toast.error('Error al generar el link de pago');
        return null;
      }

      const checkoutUrl = data.init_point || data.sandbox_init_point;
      setPaymentLink(checkoutUrl);
      setIsPaymentLinkGenerated(true);
      return checkoutUrl;
    } catch (error) {
      console.error('Error generating payment link:', error);
      toast.error('Error inesperado. Intentá de nuevo.');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copy payment link to clipboard
  const copyPaymentLink = async (): Promise<boolean> => {
    let link = paymentLink;
    
    // Generate link if not already generated
    if (!link) {
      link = await generatePaymentLink();
    }
    
    if (!link) return false;

    try {
      await navigator.clipboard.writeText(link);
      toast.success('Link copiado - podés compartirlo por WhatsApp');
      return true;
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('Error al copiar el link');
      return false;
    }
  };

  // Iniciar proceso de pago con Mercado Pago
  const initiatePaymentMP = async (): Promise<boolean> => {
    const precio = calculatePrice();

    const { data, error } = await supabase.functions.invoke('create-payment-preference', {
      body: {
        nombre_evento: formData.nombre,
        tipo_evento: formData.tipo,
        es_premium: formData.es_premium,
        precio: precio,
        cliente_email: profile!.email,
        cliente_nombre: profile!.nombre,
        evento_data: {
          tipo: formData.tipo,
          fecha_evento: formData.fecha_evento,
          hora_inicio: formData.hora_inicio,
          duracion_horas: formData.duracion_horas,
          tema_ia: formData.es_premium ? formData.tema_ia : null,
          estilo_ia: formData.es_premium ? formData.estilo_ia : null,
          logo_url: formData.logo_url,
          color_banner: formData.color_banner,
          limite_subidas_por_invitado: formData.limite_subidas_por_invitado,
          moderacion_activa: formData.moderacion_activa,
        },
      },
    });

    if (error) {
      console.error('Error creating MP payment preference:', error);
      toast.error('Error al iniciar el pago con Mercado Pago.');
      return false;
    }

    if (!data?.init_point && !data?.sandbox_init_point) {
      console.error('No MP payment URL received:', data);
      toast.error('Error al conectar con Mercado Pago');
      return false;
    }

    const checkoutUrl = data.init_point || data.sandbox_init_point;
    setPaymentLink(checkoutUrl);
    toast.success('Redirigiendo a Mercado Pago...');
    
    setTimeout(() => {
      window.location.href = checkoutUrl;
    }, 500);

    return true;
  };

  // Iniciar proceso de pago con Stripe
  const initiatePaymentStripe = async (): Promise<boolean> => {
    const precio = calculatePrice();
    const countryCode = getCountryFromProfile(profile?.pais);

    const { data, error } = await supabase.functions.invoke('create-stripe-payment', {
      body: {
        evento_nombre: formData.nombre,
        evento_tipo: formData.tipo,
        fecha_evento: formData.fecha_evento,
        hora_inicio: formData.hora_inicio,
        duracion_horas: formData.duracion_horas,
        es_premium: formData.es_premium,
        precio: precio,
        moneda: 'nzd', // Default, will be overridden by country
        pais: countryCode,
        estilo_ia: formData.es_premium ? formData.estilo_ia : undefined,
        tema_ia: formData.es_premium ? formData.tema_ia : undefined,
        color_banner: formData.color_banner,
        cliente_email: profile!.email,
        cliente_nombre: profile!.nombre,
      },
    });

    if (error) {
      console.error('Error creating Stripe payment:', error);
      toast.error('Error al iniciar el pago con Stripe.');
      return false;
    }

    if (!data?.url) {
      console.error('No Stripe checkout URL received:', data);
      toast.error('Error al conectar con Stripe');
      return false;
    }

    toast.success('Redirigiendo a Stripe...');
    
    setTimeout(() => {
      window.location.href = data.url;
    }, 500);

    return true;
  };

  // Iniciar proceso de pago (detecta automáticamente la pasarela)
  const initiatePayment = async (): Promise<boolean> => {
    if (!user || !profile) {
      toast.error('Debés iniciar sesión para crear un evento');
      return false;
    }

    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast.error('Sesión expirada. Por favor, volvé a iniciar sesión.');
        return false;
      }

      const gateway = getActiveGateway();
      console.log('Using payment gateway:', gateway, 'for country:', profile.pais);

      if (gateway === 'stripe') {
        return await initiatePaymentStripe();
      } else {
        return await initiatePaymentMP();
      }

    } catch (error) {
      console.error('Error initiating payment:', error);
      toast.error('Error inesperado. Intentá de nuevo.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Crear evento directamente (sin pago - para flujos especiales o promocionales)
  const createEventDirectly = async (isPromotional: boolean = false, clienteEmail?: string): Promise<boolean> => {
    if (!user) {
      toast.error('Debés iniciar sesión para crear un evento');
      return false;
    }

    setIsSubmitting(true);

    try {
      const qr_pantalla_token = generateQRToken();
      const qr_invitados_token = generateQRToken();
      const qr_descarga_token = generateQRToken();

      // Determine tenant_id: if user is salon or asistente, use their tenant_id
      const userRole = getUserFlowRole();
      const tenantId = ((userRole === 'salon' || userRole === 'asistente') && profile?.tenant_id) ? profile.tenant_id : null;

      const eventData = {
        cliente_user_id: user.id,
        nombre: formData.nombre,
        tipo: formData.tipo,
        fecha_evento: formData.fecha_evento,
        hora_inicio: formData.hora_inicio,
        duracion_horas: formData.duracion_horas,
        es_premium: formData.es_premium,
        tema_ia: formData.es_premium && formData.tema_ia ? formData.tema_ia : null,
        estilo_ia: formData.es_premium && formData.estilo_ia ? formData.estilo_ia : null,
        logo_url: formData.logo_url || null,
        color_banner: formData.color_banner || '#4c1d95',
        limite_subidas_por_invitado: formData.limite_subidas_por_invitado || null,
        moderacion_activa: formData.moderacion_activa,
        // If promotional, price is 0; otherwise calculate normally
        precio_pagado: isPromotional ? 0 : calculatePrice(),
        qr_pantalla_token,
        qr_invitados_token,
        qr_descarga_token,
        estado: 'programado' as const,
        // Associate with salon's tenant if applicable
        tenant_id: tenantId,
      };

      const { data, error } = await supabase
        .from('eventos')
        .insert(eventData)
        .select('id, qr_pantalla_token, qr_invitados_token, qr_descarga_token')
        .single();

      if (error) {
        console.error('Error creating event:', error);
        toast.error('Error al crear el evento. Intentá de nuevo.');
        return false;
      }

      // Decrement courtesy counter for promotional asistente/admin events,
      // OR for salon events created without an active subscription (free trial)
      const shouldDecrementCourtesy =
        (isPromotional && (userRole === 'asistente' || userRole === 'admin') && tenantId) ||
        (userRole === 'salon' && tenantId);

      if (shouldDecrementCourtesy && tenantId) {
        // For salons, only decrement if there is no active subscription
        let mustDecrement = isPromotional;
        if (userRole === 'salon') {
          const nowIso = new Date().toISOString();
          const { data: activeSub } = await supabase
            .from('suscripciones')
            .select('id')
            .eq('salon_id', tenantId)
            .eq('estado', 'activo')
            .gt('fecha_vencimiento', nowIso)
            .limit(1)
            .maybeSingle();
          mustDecrement = !activeSub;
        }

        if (mustDecrement) {
          try {
            const { data: decrementData, error: decrementError } = await supabase.functions.invoke(
              'decrement-courtesy-counter',
              { body: { tenantId } }
            );

            if (decrementError) {
              console.error('Error decrementing courtesy counter:', decrementError);
              toast.error('El evento se creó pero no se pudo actualizar el contador de cortesías.');
            } else if (decrementData?.ok) {
              console.log('Courtesy counter decremented to:', decrementData.nuevoCuenta);
            } else {
              console.warn('Courtesy decrement response:', decrementData);
              toast.error('No se pudo descontar la cortesía: ' + (decrementData?.message || 'error desconocido'));
            }
          } catch (courtesyError) {
            console.error('Error calling decrement-courtesy-counter:', courtesyError);
            toast.error('Error al actualizar el contador de cortesías.');
          }
        }
      }

      // If clienteEmail is provided, send QR emails to both the user and the client
      if (clienteEmail) {
        try {
          const recipientEmails = [profile!.email];
          // Only add client email if it's different from user email
          if (clienteEmail !== profile!.email) {
            recipientEmails.push(clienteEmail);
          }
          
          await supabase.functions.invoke('send-event-qr-emails', {
            body: {
              evento_id: data.id,
              recipientEmails,
            },
          });
        } catch (emailError) {
          console.error('Error sending QR emails:', emailError);
          // Don't fail the event creation if email fails
        }
      }

      setCreatedEvent(data);
      toast.success(isPromotional 
        ? '¡Evento promocional creado exitosamente!' 
        : '¡Evento creado exitosamente!'
      );
      return true;
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Error inesperado. Intentá de nuevo.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate payment link for external sharing (Admin/Asistente flow)
  // This creates the event first, then generates a payment link associated with it
  const generatePaymentLinkForClient = async (clienteEmail: string, precioOverride?: number): Promise<string | null> => {
    if (!user) {
      toast.error('Debés iniciar sesión para generar el link');
      return null;
    }

    setIsSubmitting(true);

    try {
      const precio = precioOverride !== undefined ? precioOverride : calculatePrice();

      // Determine tenant_id
      const userRole = getUserFlowRole();
      const tenantId = ((userRole === 'salon' || userRole === 'asistente' || userRole === 'admin') && profile?.tenant_id) ? profile.tenant_id : null;

      // Call create-payment-preference directly — the webhook will create the event upon payment approval
      const { data, error } = await supabase.functions.invoke('create-payment-preference', {
        body: {
          nombre_evento: formData.nombre,
          tipo_evento: formData.tipo,
          es_premium: formData.es_premium,
          precio: precio,
          cliente_email: clienteEmail,
          cliente_nombre: 'Cliente',
          tenant_id: tenantId,
          evento_data: {
            tipo: formData.tipo,
            fecha_evento: formData.fecha_evento,
            hora_inicio: formData.hora_inicio,
            duracion_horas: formData.duracion_horas,
            tema_ia: formData.es_premium ? formData.tema_ia : null,
            estilo_ia: formData.es_premium ? formData.estilo_ia : null,
            logo_url: formData.logo_url,
            color_banner: formData.color_banner,
            limite_subidas_por_invitado: formData.limite_subidas_por_invitado,
            moderacion_activa: formData.moderacion_activa,
          },
        },
      });

      if (error) {
        console.error('Error creating payment preference:', error);
        toast.error('Error al generar el link de pago');
        return null;
      }

      const checkoutUrl = data.init_point || data.sandbox_init_point;
      setPaymentLink(checkoutUrl);
      setIsPaymentLinkGenerated(true);
      toast.success('¡Link de pago generado! Copialo y compartilo con el cliente.');
      
      // Auto-copy to clipboard
      try {
        await navigator.clipboard.writeText(checkoutUrl);
        toast.success('Link copiado al portapapeles');
      } catch (e) {
        // Clipboard copy failed silently
      }
      
      return checkoutUrl;
    } catch (error) {
      console.error('Error generating payment link:', error);
      toast.error('Error inesperado. Intentá de nuevo.');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetWizard = () => {
    setCurrentStep(0);
    setFormData(initialFormData);
    setCreatedEvent(null);
    setPaymentLink(null);
    setIsPaymentLinkGenerated(false);
  };

  return {
    currentStep,
    totalSteps,
    stepTitles,
    formData,
    updateFormData,
    nextStep,
    prevStep,
    goToStep,
    calculatePrice,
    initiatePayment,
    createEventDirectly,
    isSubmitting,
    createdEvent,
    resetWizard,
    navigate,
    getActiveGateway,
    getUserFlowRole,
    // New exports for promotional events and copy link
    isSuperAdmin: isSuperAdmin(),
    paymentLink,
    isPaymentLinkGenerated,
    copyPaymentLink,
    generatePaymentLink,
    generatePaymentLinkForClient,
  };
}
