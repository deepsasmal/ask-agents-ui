import React from 'react';
import { Check } from 'lucide-react';

export enum BulkImportStep {
    Organization = 1,
    Upload = 2,
    Review = 3,
    Success = 4,
}

interface BulkImportProgressProps {
    currentStep: number;
}

const steps = [
    { id: BulkImportStep.Organization, label: 'Organization' },
    { id: BulkImportStep.Upload, label: 'Upload' },
    { id: BulkImportStep.Review, label: 'Review' },
];

export const BulkImportProgress: React.FC<BulkImportProgressProps> = ({ currentStep }) => {
    const totalSteps = steps.length;
    const progressPercentage = Math.min(100, ((currentStep - 1) / (totalSteps - 1)) * 100);

    return (
        <div className="w-full max-w-md mx-auto px-2">
            <div className="relative">
                {/* Track Background - Dashed Line */}
                <div className="absolute top-4 left-8 right-8 -translate-y-1/2 h-0 border-t-2 border-dashed border-slate-300 z-0" />

                {/* Active Progress Track - Solid Line */}
                <div className="absolute top-4 left-8 right-8 -translate-y-1/2 h-0.5 z-0">
                    <div
                        className="h-full bg-brand-600 transition-all duration-700 ease-in-out shadow-[0_0_6px_rgba(29,173,143,0.5)]"
                        style={{ width: `${progressPercentage}%` }}
                    />
                </div>

                <div className="flex justify-between items-start w-full relative z-10">
                    {steps.map((step, index) => {
                        const isCompleted = currentStep > step.id;
                        const isCurrent = currentStep === step.id;

                        return (
                            <div key={step.id} className="relative flex flex-col items-center group cursor-default w-16">
                                <div
                                    className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500
                    border-2
                    ${isCompleted
                                            ? 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-600/25'
                                            : isCurrent
                                                ? 'bg-white text-brand-600 border-brand-600 shadow-[0_0_0_3px_rgba(29,173,143,0.12)] scale-105'
                                                : 'bg-white text-slate-400 border-slate-200'}
                  `}
                                >
                                    {isCompleted ? (
                                        <Check className="w-4 h-4 stroke-[2.5]" />
                                    ) : (
                                        <span>{index + 1}</span>
                                    )}
                                </div>

                                <div className={`
                  mt-1.5 flex flex-col items-center transition-all duration-500 absolute top-full w-24 left-1/2 -translate-x-1/2
                  ${isCurrent ? 'transform translate-y-0 opacity-100' : isCompleted ? 'opacity-70' : 'opacity-40'}
                `}>
                                    <span
                                        className={`
                      text-[10px] font-bold uppercase tracking-wider whitespace-nowrap
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
