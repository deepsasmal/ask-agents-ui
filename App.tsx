
import React, { useState } from 'react';
import { WizardState, Step, INITIAL_TABLES } from './types';
import { WizardProgress } from './components/WizardProgress';
import { WelcomeStep } from './components/steps/WelcomeStep';
import { OrgDetailsStep } from './components/steps/OrgDetailsStep';
import { DbConnectStep } from './components/steps/DbConnectStep';
import { SchemaStep } from './components/steps/SchemaStep';
import { ReviewStep } from './components/steps/ReviewStep';
import { GraphEditor } from './components/editor/GraphEditor';
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

const App: React.FC = () => {
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-brand-200 selection:text-brand-900 overflow-hidden flex flex-col">
      
      {/* Header/Nav */}
      <nav className="h-20 bg-white/80 border-b border-slate-200/60 flex items-center justify-between px-6 lg:px-12 sticky top-0 z-40 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 font-bold text-xl tracking-tight text-slate-900 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setCurrentStep(Step.Welcome)}>
               <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/30 ring-1 ring-white/20">
                 <Network className="w-6 h-6" />
               </div>
               <span>Graph<span className="text-brand-600">Builder</span></span>
            </div>
            
            {/* View Switcher Tabs */}
            <div className="hidden md:flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
                <button 
                  onClick={() => setViewMode('WIZARD')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'WIZARD' ? 'bg-white text-brand-600 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Wand2 className="w-4 h-4" />
                    Wizard
                </button>
                <button 
                  onClick={() => setViewMode('EDITOR')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'EDITOR' ? 'bg-white text-brand-600 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Edit3 className="w-4 h-4" />
                    Graph Editor
                </button>
            </div>
        </div>

        <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full bg-slate-50 text-slate-600 border border-slate-200/60 shadow-sm">
               <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
                </span>
               System Ready
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-b from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs shadow-inner">
                GB
            </div>
        </div>
      </nav>

      {viewMode === 'WIZARD' ? (
          <main className="flex-1 max-w-7xl mx-auto px-4 py-8 md:py-12 relative w-full overflow-y-auto">
            <WizardProgress currentStep={currentStep} />
            <div className="transition-all duration-500 ease-in-out">
              {renderWizardStep()}
            </div>
          </main>
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

export default App;
