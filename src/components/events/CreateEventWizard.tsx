/**
 * PICKEVENT - Create Event Wizard
 * Wizard de 4 pasos para crear eventos
 */

import { useCreateEvent } from '@/hooks/useCreateEvent';
import { getMuroUrl } from '@/lib/utils';
import {
  WizardProgress,
  StepBasicInfo,
  StepPersonalization,
  StepConfiguration,
  StepPayment,
  EventCreatedSuccess,
} from './wizard';

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
    isSubmitting,
    createdEvent,
    navigate,
    getActiveGateway,
  } = useCreateEvent();

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
        return (
          <StepPayment
            formData={formData}
            onSubmit={initiatePayment}
            onBack={prevStep}
            isSubmitting={isSubmitting}
            calculatePrice={calculatePrice}
            activeGateway={getActiveGateway()}
          />
        );
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
