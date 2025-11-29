import React, { useState } from 'react';
import { WizardState, Step, INITIAL_TABLES } from '../../types';
import { WizardProgress } from '../WizardProgress';
import { WelcomeStep } from '../steps/WelcomeStep';
import { OrgDetailsStep } from '../steps/OrgDetailsStep';
import { DbConnectStep } from '../steps/DbConnectStep';
import { SchemaStep } from '../steps/SchemaStep';
import { ReviewStep } from '../steps/ReviewStep';
import { GraphEditor } from '../editor/GraphEditor';
import { Network, Wand2, Edit3, Share2 } from 'lucide-react';

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
    <div className="h-full flex flex-col bg-[#f8fafc] relative overflow-hidden">
      
      {/* Background Visuals */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03]" 
             style={{ 
                 backgroundImage: 'radial-gradient(#0f172a 1px, transparent 1px)', 
                 backgroundSize: '24px 24px' 
             }} 
        />
        
        {/* Abstract Shapes */}
        <div className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] bg-brand-200/20 rounded-full blur-[100px] animate-pulse-slow" />
        <div className="absolute bottom-0 right-0 w-[40vw] h-[40vw] bg-blue-100/30 rounded-full blur-[80px]" />
        
        {/* Network Lines Decoration */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
            <path d="M100,100 C300,300 800,100 900,400" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="10 10" />
            <path d="M-50,600 C200,400 600,800 1200,500" fill="none" stroke="#6366f1" strokeWidth="2" strokeDasharray="10 10" />
            <circle cx="100" cy="100" r="6" fill="#10b981" className="animate-ping" style={{ animationDuration: '3s' }} />
            <circle cx="900" cy="400" r="6" fill="#10b981" />
            <circle cx="1200" cy="500" r="6" fill="#6366f1" />
        </svg>
      </div>

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
          <div className="flex-1 flex flex-col relative w-full overflow-hidden z-10">
            <div className="shrink-0 pt-8 pb-4 px-4">
              <WizardProgress currentStep={currentStep} />
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex justify-center">
               <div className="w-full max-w-7xl h-full flex flex-col">
                  {renderWizardStep()}
               </div>
            </div>
          </div>
      ) : (
          <div className="flex-1 overflow-hidden animate-fade-in z-10 relative">
              <GraphEditor 
                projectName={wizardData.projectName || 'Untitled Graph'} 
                initialGraphId={wizardData.graphId}
              />
          </div>
      )}
    </div>
  );
};