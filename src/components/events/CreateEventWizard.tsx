/**
 * PICKEVENT - Create Event Wizard
 * Wizard de 4 pasos para crear eventos con flujos diferenciados por rol
 */

import { useCreateEvent } from '@/hooks/useCreateEvent';
import { getMuroUrl } from '@/lib/utils';
import {
  WizardProgress,
  StepBasicInfo,
  StepPersonalization,
  StepConfiguration,
  StepPaymentClient,
  StepPaymentSalon,
  StepPaymentAdmin,
  EventCreatedSuccess,
} from './wizard';
import { useSalonData } from '@/hooks/useSalonData';
import { useAsistenteData } from '@/hooks/useAsistenteData';

export function CreateEventWizard() {
  const {
    currentStep,
    totalSteps,
    stepTitles,
    formData,
    updateFormData,
    nextStep,
    prevStep,
    calculatePrice,
    initiatePayment,
    createEventDirectly,
    isSubmitting,
    createdEvent,
    navigate,
    getActiveGateway,
    getUserFlowRole,
    isSuperAdmin,
    paymentLink,
    generatePaymentLinkForClient,
  } = useCreateEvent();

  // Get salon data for quota validation (only used for salon role)
  const userFlowRole = getUserFlowRole();
  const { stats: salonStats, tenantInfo: salonTenantInfo } = useSalonData();
  const { stats: asistenteStats, tenantInfo: asistenteTenantInfo } = useAsistenteData();

  // Si el evento fue creado, mostrar pantalla de éxito
  if (createdEvent) {
    return (
      <EventCreatedSuccess
        event={createdEvent}
        eventName={formData.nombre}
        onGoToDashboard={() => navigate('/dashboard')}
        onViewMuro={() => window.open(getMuroUrl(createdEvent.qr_pantalla_token), '_blank')}
      />
    );
  }

  // Render del paso 4 según el rol
  const renderPaymentStep = () => {
    const activeGateway = getActiveGateway();

    switch (userFlowRole) {
      case 'salon':
        return (
          <StepPaymentSalon
            formData={formData}
            onSubmit={async (clienteEmail) => {
              return await createEventDirectly(false, clienteEmail);
            }}
            onBack={prevStep}
            isSubmitting={isSubmitting}
            eventosDisponibles={salonStats ? salonStats.limiteEventosMes - salonStats.eventosEsteMes : 0}
            limiteEventosMes={salonStats?.limiteEventosMes || 0}
            puedeCrearEvento={salonStats?.puedeCrearEvento ?? false}
            suscripcionVencida={salonStats?.alertaCritica}
          />
        );

      case 'admin':
      case 'asistente':
        return (
          <StepPaymentAdmin
            formData={formData}
            onGeneratePaymentLink={generatePaymentLinkForClient}
            onCreatePromotional={async (clienteEmail) => {
              return await createEventDirectly(true, clienteEmail);
            }}
            onBack={prevStep}
            isSubmitting={isSubmitting}
            calculatePrice={calculatePrice}
            activeGateway={activeGateway}
            paymentLink={paymentLink}
            isAsistente={userFlowRole === 'asistente'}
            // Pass courtesy data for assistants
            eventosVendidosTotal={asistenteTenantInfo?.eventos_vendidos_total ?? 0}
            eventosCortesiaDisponibles={asistenteTenantInfo?.eventos_cortesia_disponibles ?? 2}
          />
        );

      case 'cliente':
      default:
        return (
          <StepPaymentClient
            formData={formData}
            onSubmit={initiatePayment}
            onBack={prevStep}
            isSubmitting={isSubmitting}
            calculatePrice={calculatePrice}
            activeGateway={activeGateway}
          />
        );
    }
  };

  // Render del paso actual
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <StepBasicInfo
            data={formData}
            onNext={(data) => {
              updateFormData(data);
              nextStep();
            }}
          />
        );
      case 1:
        return (
          <StepPersonalization
            data={formData}
            onNext={(data) => {
              updateFormData(data);
              nextStep();
            }}
            onBack={prevStep}
          />
        );
      case 2:
        return (
          <StepConfiguration
            data={formData}
            onNext={(data) => {
              updateFormData(data);
              nextStep();
            }}
            onBack={prevStep}
          />
        );
      case 3:
        return renderPaymentStep();
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <WizardProgress
        currentStep={currentStep}
        totalSteps={totalSteps}
        stepTitles={stepTitles}
      />
      
      <div className="bg-card rounded-2xl border p-6 md:p-8 shadow-lg">
        {renderStep()}
      </div>
    </div>
  );
}
