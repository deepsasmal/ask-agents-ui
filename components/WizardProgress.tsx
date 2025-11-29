import React from 'react';
import { Check } from 'lucide-react';
import { Step } from '../types';

interface WizardProgressProps {
  currentStep: number;
}

const steps = [
  { id: Step.Organization, label: 'Organization' },
  { id: Step.Database, label: 'Connection' },
  { id: Step.Schema, label: 'Schema' },
  { id: Step.Review, label: 'Review' },
];

export const WizardProgress: React.FC<WizardProgressProps> = ({ currentStep }) => {
  if (currentStep === Step.Welcome) return null;

  const totalSteps = steps.length;
  // Progress is 0 to 100 based on steps (0/3, 1/3, 2/3, 3/3)
  // Cap at 100% for Success step (Step 5)
  const progressPercentage = Math.min(100, ((currentStep - 1) / (totalSteps - 1)) * 100);

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <div className="relative">
        {/* Track Background - Dashed Line */}
        {/* Centered vertically relative to the 48px (h-12) circles. Top 24px is center. */}
        <div className="absolute top-6 left-10 right-10 -translate-y-1/2 h-0 border-t-2 border-dashed border-slate-300 z-0" />
        
        {/* Active Progress Track - Solid Line */}
        <div className="absolute top-6 left-10 right-10 -translate-y-1/2 h-0.5 z-0">
             <div 
                className="h-full bg-brand-600 transition-all duration-700 ease-in-out shadow-[0_0_8px_rgba(29,173,143,0.6)]"
                style={{ width: `${progressPercentage}%` }}
             />
        </div>

        <div className="flex justify-between items-start w-full relative z-10">
          {steps.map((step, index) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            
            return (
              <div key={step.id} className="relative flex flex-col items-center group cursor-default w-20"> 
                <div 
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center text-base font-bold transition-all duration-500
                    border-[3px]
                    ${isCompleted 
                      ? 'bg-brand-600 text-white border-brand-600 shadow-lg shadow-brand-600/30' 
                      : isCurrent 
                        ? 'bg-white text-brand-600 border-brand-600 shadow-[0_0_0_4px_rgba(29,173,143,0.15)] scale-110' 
                        : 'bg-white text-slate-400 border-slate-200'}
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-6 h-6 stroke-[3]" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                
                <div className={`
                  mt-3 flex flex-col items-center transition-all duration-500 absolute top-full w-32 left-1/2 -translate-x-1/2
                  ${isCurrent ? 'transform translate-y-0 opacity-100' : isCompleted ? 'opacity-80' : 'opacity-50'}
                `}>
                  <span 
                    className={`
                      text-xs font-bold uppercase tracking-wider whitespace-nowrap
                      ${isCurrent ? 'text-brand-600' : 'text-slate-500'}
                    `}
                  >
                    {step.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};