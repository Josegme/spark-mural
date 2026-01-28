/**
 * PICKEVENT - Validaciones de Evento
 */

import { z } from 'zod';

// Paso 1: Info básica
export const stepBasicInfoSchema = z.object({
  nombre: z.string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  tipo: z.enum(['cumpleanos', 'casamiento', 'graduacion', 'corporativo', 'fiesta_tematica', 'otro'], {
    required_error: 'Seleccioná un tipo de evento',
  }),
  fecha_evento: z.string()
    .min(1, 'Seleccioná una fecha'),
  hora_inicio: z.string()
    .min(1, 'Seleccioná una hora de inicio'),
  duracion_horas: z.union([z.literal(6), z.literal(12), z.literal(24)], {
    required_error: 'Seleccioná una duración',
  }),
});

// Paso 2: Personalización
export const stepPersonalizationSchema = z.object({
  es_premium: z.boolean(),
  tema_ia: z.string().max(200, 'El tema no puede exceder 200 caracteres').optional(),
  estilo_ia: z.enum(['caricatura', 'comico', 'cinematografico', 'futurista', 'realista', 'fantasia', 'anime', 'vintage', 'acuarela', 'neon', 'minimalista']).optional(),
  logo_url: z.string().url('URL inválida').optional().or(z.literal('')),
  color_banner: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido').optional(),
});

// Paso 3: Configuración
export const stepConfigurationSchema = z.object({
  limite_subidas_por_invitado: z.number().min(1).max(100).optional(),
  moderacion_activa: z.boolean(),
});

// Paso 4: Pago (solo validación de aceptación)
export const stepPaymentSchema = z.object({
  aceptaTerminos: z.boolean().refine(val => val === true, {
    message: 'Debés aceptar los términos y condiciones',
  }),
});

// Schema completo
export const createEventSchema = stepBasicInfoSchema
  .merge(stepPersonalizationSchema)
  .merge(stepConfigurationSchema);

export type StepBasicInfoData = z.infer<typeof stepBasicInfoSchema>;
export type StepPersonalizationData = z.infer<typeof stepPersonalizationSchema>;
export type StepConfigurationData = z.infer<typeof stepConfigurationSchema>;
export type StepPaymentData = z.infer<typeof stepPaymentSchema>;
export type CreateEventData = z.infer<typeof createEventSchema>;
