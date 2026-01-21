/**
 * PICKEVENT - Wizard Progress Indicator
 */

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WizardProgressProps {
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
}

export function WizardProgress({ currentStep, totalSteps, stepTitles }: WizardProgressProps) {
  return (
    <div className="w-full mb-8">
      {/* Desktop progress */}
      <div className="hidden md:flex items-center justify-between">
        {stepTitles.map((title, index) => (
          <div key={index} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300',
                  index < currentStep
                    ? 'bg-primary text-primary-foreground'
                    : index === currentStep
                    ? 'bg-gradient-primary text-primary-foreground shadow-glow animate-pulse-glow'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {index < currentStep ? (
                  <Check className="w-5 h-5" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={cn(
                  'mt-2 text-sm font-medium transition-colors',
                  index <= currentStep ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {title}
              </span>
            </div>
            {index < totalSteps - 1 && (
              <div
                className={cn(
                  'flex-1 h-1 mx-4 rounded-full transition-colors duration-300',
                  index < currentStep ? 'bg-primary' : 'bg-muted'
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Mobile progress */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">
            Paso {currentStep + 1} de {totalSteps}
          </span>
          <span className="text-sm text-muted-foreground">
            {stepTitles[currentStep]}
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-gradient-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
