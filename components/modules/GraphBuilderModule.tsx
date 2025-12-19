import React, { useState } from 'react';
import { WizardState, Step, INITIAL_TABLES } from '../../types';
import { WizardProgress } from '../WizardProgress';
import { WelcomeStep } from '../steps/WelcomeStep';
import { OrgDetailsStep } from '../steps/OrgDetailsStep';
import { DbConnectStep } from '../steps/DbConnectStep';
import { SchemaStep } from '../steps/SchemaStep';
import { ReviewStep } from '../steps/ReviewStep';
import { GraphEditor } from '../editor/GraphEditor';
import { Wand2, Edit3, Database, FileText, ArrowRight, Sparkles, Zap, ScanText, BrainCircuit } from 'lucide-react';

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
type EntryMode = 'CHOOSER' | 'STRUCTURED';

export const GraphBuilderModule: React.FC = () => {
  const [entryMode, setEntryMode] = useState<EntryMode>('CHOOSER');
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
      {/* Smooth Flash Animation Style */}
      <style>
        {`
          @keyframes shimmer-flash {
            0% { transform: translateX(-100%) skewX(-15deg); opacity: 0; }
            10% { opacity: 1; }
            50% { opacity: 1; }
            100% { transform: translateX(200%) skewX(-15deg); opacity: 0; }
          }
          .animate-shimmer-flash {
            animation: shimmer-flash 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          }
        `}
      </style>

      {/* Top Smooth Flash Loader */}
      <div className="absolute top-0 left-0 right-0 h-[2px] z-[60] pointer-events-none overflow-hidden">
        <div className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent blur-[2px] animate-shimmer-flash"></div>
        <div className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-shimmer-flash" style={{ animationDelay: '0.1s' }}></div>
      </div>

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
      <div className="h-12 bg-white/80 border-b border-slate-200/60 flex items-center justify-between px-4 sticky top-0 z-40 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-bold text-slate-900">Graph Builder</h2>
          <div className="h-4 w-px bg-slate-200" />

          {/* View Switcher Tabs */}
          {entryMode === 'STRUCTURED' && (
            <div className="flex bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/60">
              <button
                onClick={() => setViewMode('WIZARD')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${viewMode === 'WIZARD' ? 'bg-white text-brand-600 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Wand2 className="w-3 h-3" />
                Wizard
              </button>
              <button
                onClick={() => setViewMode('EDITOR')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${viewMode === 'EDITOR' ? 'bg-white text-brand-600 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Edit3 className="w-3 h-3" />
                Editor
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Status Indicator */}
          <div className="hidden md:flex items-center gap-2 text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-50 text-slate-600 border border-slate-200/60 shadow-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-500"></span>
            </span>
            System Ready
          </div>
        </div>
      </div>

      {entryMode === 'CHOOSER' ? (
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 z-10 relative">
          <div className="max-w-5xl mx-auto w-full">
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">How would you like to build your graph?</h1>
              <p className="text-slate-500 mt-1 text-sm">
                Pick a source type to tailor the workflow and graph creation experience.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Card A — Structured Data */}
              <button
                type="button"
                onClick={() => {
                  setEntryMode('STRUCTURED');
                  setViewMode('WIZARD');
                  setCurrentStep(Step.Welcome);
                }}
                className="text-left group rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all overflow-hidden focus:outline-none focus:ring-2 focus:ring-brand-500/20 cursor-default min-h-[320px]"
              >
                <div className="p-7">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-700">
                        <Database className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-base font-extrabold text-slate-900">Structured Data</div>
                        <div className="text-sm text-slate-500">SQL tables, CSVs, warehouse data</div>
                      </div>
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-wide text-brand-700 bg-brand-50 border border-brand-100 px-2 py-1 rounded-full">
                      Recommended
                    </div>
                  </div>

                  <ul className="mt-6 space-y-3 text-sm text-slate-600">
                    <li className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
                        <Zap className="w-4 h-4 text-brand-700" />
                      </span>
                      <span>Fast &amp; deterministic</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
                        <Database className="w-4 h-4 text-brand-700" />
                      </span>
                      <span>Column-based graphing</span>
                    </li>
                  </ul>

                  <div className="mt-7 flex items-center justify-between">
                    <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-600">
                      <Sparkles className="w-4 h-4" />
                      Best for databases
                    </div>
                    <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold shadow-sm group-hover:bg-slate-800 transition-colors">
                      Build graph from tables
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
                <div className="h-px bg-slate-100" />
              </button>

              {/* Card B — Documents (Coming Soon) */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden opacity-60 min-h-[320px] cursor-default">
                <div className="p-7">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                          Documents (PDFs, Text)
                        </div>
                        <div className="text-xs text-slate-500">Reports, contracts, invoices</div>
                      </div>
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-wide text-slate-600 bg-slate-100 border border-slate-200 px-2 py-1 rounded-full">
                      Coming soon
                    </div>
                  </div>

                  <ul className="mt-6 space-y-3 text-sm text-slate-600">
                    <li className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                        <BrainCircuit className="w-4 h-4 text-slate-500" />
                      </span>
                      <span>AI-powered extraction</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                        <ScanText className="w-4 h-4 text-slate-500" />
                      </span>
                      <span>Semantic interpretation</span>
                    </li>
                  </ul>

                  <div className="mt-7 flex items-center justify-between">
                    <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-600">
                      <FileText className="w-4 h-4" />
                      Document ingestion
                    </div>
                    <button
                      type="button"
                      disabled
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 text-slate-500 text-sm font-bold cursor-default border border-slate-200"
                      title="Coming soon"
                    >
                      Build graph from documents
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="h-px bg-slate-100" />
              </div>
            </div>
          </div>
        </div>
      ) : viewMode === 'WIZARD' ? (
        <div className="flex-1 flex flex-col relative w-full overflow-hidden z-10">
          <div className="shrink-0 pt-4 pb-8 px-2">
            <WizardProgress currentStep={currentStep} />
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 flex justify-center">
            <div className="w-full max-w-5xl h-full flex flex-col">
              {renderWizardStep()}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-hidden animate-fade-in z-10 relative flex flex-col">
          <GraphEditor
            projectName={wizardData.projectName || 'Untitled Graph'}
            initialGraphId={wizardData.graphId}
          />
        </div>
      )}
    </div>
  );
};