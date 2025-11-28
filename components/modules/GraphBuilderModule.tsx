import React, { useState } from 'react';
import { WizardState, Step, INITIAL_TABLES } from '../../types';
import { WizardProgress } from '../WizardProgress';
import { WelcomeStep } from '../steps/WelcomeStep';
import { OrgDetailsStep } from '../steps/OrgDetailsStep';
import { DbConnectStep } from '../steps/DbConnectStep';
import { SchemaStep } from '../steps/SchemaStep';
import { ReviewStep } from '../steps/ReviewStep';
import { GraphEditor } from '../editor/GraphEditor';
import { Network, Wand2, Edit3 } from 'lucide-react';

const INITIAL_STATE: WizardState = {
  orgName: '',
  projectName: '',
  description: '',
  domain: '',
  dbHost: 'db.production.internal',
  dbPort: '5432',
  dbUser: '',
  dbPass: '',
  dbName: '',
  schemaName: 'public',
  tables: INITIAL_TABLES,
};

type ViewMode = 'WIZARD' | 'EDITOR';

export const GraphBuilderModule: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('WIZARD');
  const [currentStep, setCurrentStep] = useState<number>(Step.Welcome);
  const [wizardData, setWizardData] = useState<WizardState>(INITIAL_STATE);

  const updateData = (newData: Partial<WizardState>) => {
    setWizardData(prev => ({ ...prev, ...newData }));
  };

  const nextStep = () => setCurrentStep(prev => prev + 1);
  const prevStep = () => setCurrentStep(prev => prev - 1);

  const renderWizardStep = () => {
    switch (currentStep) {
      case Step.Welcome:
        return <WelcomeStep onStart={nextStep} />;
      case Step.Organization:
        return (
          <OrgDetailsStep 
            data={wizardData} 
            updateData={updateData} 
            onNext={nextStep} 
          />
        );
      case Step.Database:
        return (
          <DbConnectStep 
            data={wizardData} 
            updateData={updateData} 
            onNext={nextStep} 
            onBack={prevStep}
          />
        );
      case Step.Schema:
        return (
          <SchemaStep 
            data={wizardData} 
            updateData={updateData} 
            onNext={nextStep} 
            onBack={prevStep}
          />
        );
      case Step.Review:
      case Step.Success:
        return (
          <ReviewStep 
            data={wizardData} 
            onBack={prevStep} 
            onComplete={() => setCurrentStep(Step.Success)}
            isSuccess={currentStep === Step.Success}
          />
        );
      default:
        return <div>Unknown Step</div>;
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#f8fafc]">
      {/* Module Header */}
      <div className="h-16 bg-white/80 border-b border-slate-200/60 flex items-center justify-between px-6 sticky top-0 z-40 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-slate-900">Graph Builder</h2>
            <div className="h-6 w-px bg-slate-200" />
            
            {/* View Switcher Tabs */}
            <div className="flex bg-slate-100/80 p-1 rounded-lg border border-slate-200/60">
                <button 
                  onClick={() => setViewMode('WIZARD')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'WIZARD' ? 'bg-white text-brand-600 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Wand2 className="w-3.5 h-3.5" />
                    Wizard
                </button>
                <button 
                  onClick={() => setViewMode('EDITOR')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'EDITOR' ? 'bg-white text-brand-600 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Edit3 className="w-3.5 h-3.5" />
                    Editor
                </button>
            </div>
        </div>

        <div className="flex items-center gap-4">
             {/* Status Indicator */}
            <div className="hidden md:flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full bg-slate-50 text-slate-600 border border-slate-200/60 shadow-sm">
               <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
                </span>
               System Ready
            </div>
        </div>
      </div>

      {viewMode === 'WIZARD' ? (
          <div className="flex-1 max-w-7xl mx-auto px-4 py-8 md:py-12 relative w-full overflow-y-auto">
            <WizardProgress currentStep={currentStep} />
            <div className="transition-all duration-500 ease-in-out pb-20">
              {renderWizardStep()}
            </div>
          </div>
      ) : (
          <div className="flex-1 overflow-hidden animate-fade-in">
              <GraphEditor 
                projectName={wizardData.projectName || 'Untitled Graph'} 
                initialGraphId={wizardData.graphId}
              />
          </div>
      )}
    </div>
  );
};