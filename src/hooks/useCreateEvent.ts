/**
 * PICKEVENT - Hook para crear eventos
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { generateQRToken } from '@/lib/utils';
import { CreateEventData } from '@/lib/validations/event';
import { EVENT_PRICES } from '@/lib/constants';
import { toast } from 'sonner';

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
  const { user } = useAuth();
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

  const createEvent = async (): Promise<boolean> => {
    if (!user) {
      toast.error('Debés iniciar sesión para crear un evento');
      return false;
    }

    setIsSubmitting(true);

    try {
      // Generar tokens únicos para QR
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
    createEvent,
    isSubmitting,
    createdEvent,
    resetWizard,
    navigate,
  };
}
