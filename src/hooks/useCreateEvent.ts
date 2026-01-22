/**
 * PICKEVENT - Hook para crear eventos con pago integrado
 * Soporta múltiples pasarelas: Mercado Pago (AR/BR/PY) y Stripe (NZ/ES/AU/US/GB)
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { generateQRToken } from '@/lib/utils';
import { CreateEventData } from '@/lib/validations/event';
import { EVENT_PRICES, PAYMENT_GATEWAYS } from '@/lib/constants';
import { toast } from 'sonner';

// Países que usan Stripe
const STRIPE_COUNTRIES = ['NZ', 'ES', 'AU', 'US', 'GB', 'DE', 'FR', 'IT'];
// Países que usan Mercado Pago
const MP_COUNTRIES = ['AR', 'BR', 'PY', 'MX', 'CL', 'CO', 'UY', 'PE'];

export type PaymentGateway = 'mercadopago' | 'stripe';

export function getPaymentGateway(countryCode: string): PaymentGateway {
  if (STRIPE_COUNTRIES.includes(countryCode.toUpperCase())) {
    return 'stripe';
  }
  return 'mercadopago';
}

export function getCountryFromProfile(pais: string | null | undefined): string {
  if (!pais) return 'AR'; // Default to Argentina
  
  // Map common country names to codes
  const countryMap: Record<string, string> = {
    'argentina': 'AR',
    'brasil': 'BR',
    'brazil': 'BR',
    'paraguay': 'PY',
    'new zealand': 'NZ',
    'nueva zelanda': 'NZ',
    'españa': 'ES',
    'spain': 'ES',
    'australia': 'AU',
    'united states': 'US',
    'estados unidos': 'US',
    'united kingdom': 'GB',
    'reino unido': 'GB',
  };
  
  const normalized = pais.toLowerCase().trim();
  return countryMap[normalized] || pais.toUpperCase().substring(0, 2);
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
  const { user, profile } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<WizardFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdEvent, setCreatedEvent] = useState<{
    id: string;
    qr_pantalla_token: string;
    qr_invitados_token: string;
    qr_descarga_token: string;
  } | null>(null);

  const totalSteps = 4;
  const stepTitles = ['Información', 'Personalización', 'Configuración', 'Pago'];

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
    return formData.es_premium ? EVENT_PRICES.premium.precio : EVENT_PRICES.basico.precio;
  };

  // Detectar qué pasarela usar según el país del usuario
  const getActiveGateway = (): PaymentGateway => {
    const countryCode = getCountryFromProfile(profile?.pais);
    return getPaymentGateway(countryCode);
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

    const checkoutUrl = data.sandbox_init_point || data.init_point;
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

  // Crear evento directamente (sin pago - para flujos especiales)
  const createEventDirectly = async (): Promise<boolean> => {
    if (!user) {
      toast.error('Debés iniciar sesión para crear un evento');
      return false;
    }

    setIsSubmitting(true);

    try {
      const qr_pantalla_token = generateQRToken();
      const qr_invitados_token = generateQRToken();
      const qr_descarga_token = generateQRToken();

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
        precio_pagado: calculatePrice(),
        qr_pantalla_token,
        qr_invitados_token,
        qr_descarga_token,
        estado: 'programado' as const,
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

      setCreatedEvent(data);
      toast.success('¡Evento creado exitosamente!');
      return true;
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Error inesperado. Intentá de nuevo.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetWizard = () => {
    setCurrentStep(0);
    setFormData(initialFormData);
    setCreatedEvent(null);
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
  };
}
