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

  // Calculate width for the progress line
  const totalSteps = steps.length;
  // We want the line to stop at the center of the current step circle
  const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="w-full max-w-4xl mx-auto mb-16 px-4">
      <div className="relative">
        {/* Track Background - The gray line */}
        <div className="absolute top-6 left-0 w-full h-[3px] bg-slate-100 rounded-full -z-10" />
        
        {/* Active Progress Track - The colored line */}
        <div 
            className="absolute top-6 left-0 h-[3px] bg-brand-600 rounded-full -z-0 transition-all duration-700 ease-in-out shadow-[0_0_8px_rgba(29,173,143,0.6)]"
            style={{ width: `${progressPercentage}%` }}
        />

        <div className="flex justify-between items-start w-full">
          {steps.map((step, index) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            const isPending = currentStep < step.id;
            
            return (
              <div key={step.id} className="relative flex flex-col items-center group cursor-default" style={{ width: '80px' }}>
                <div 
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 z-10 
                    ${isCompleted 
                      ? 'bg-brand-600 text-white scale-100 shadow-lg shadow-brand-600/30' 
                      : isCurrent 
                        ? 'bg-white text-brand-600 border-[3px] border-brand-600 shadow-[0_0_0_4px_rgba(29,173,143,0.15)] scale-110' 
                        : 'bg-white text-slate-300 border-[3px] border-slate-100'}
                  `}
                >
                  {isCompleted ? <Check className="w-6 h-6 stroke-[3]" /> : <span className="text-base">{index + 1}</span>}
                </div>
                
                <div className={`
                  mt-3 flex flex-col items-center transition-all duration-500
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