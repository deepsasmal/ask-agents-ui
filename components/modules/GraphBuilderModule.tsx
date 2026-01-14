import React, { useState } from 'react';
import { WizardState, Step, INITIAL_TABLES } from '../../types';
import { WizardProgress } from '../WizardProgress';
import { BulkImportProgress, BulkImportStep } from '../BulkImportProgress';
import { WelcomeStep } from '../steps/WelcomeStep';
import { OrgDetailsStep } from '../steps/OrgDetailsStep';
import { DbConnectStep } from '../steps/DbConnectStep';
import { SchemaStep } from '../steps/SchemaStep';
import { ReviewStep } from '../steps/ReviewStep';
import { BulkUploadStep } from '../steps/BulkUploadStep';
import { BulkReviewStep } from '../steps/BulkReviewStep';
import { GraphEditor } from '../editor/GraphEditor';
import { Button } from '../ui/Common';
import { toast } from 'react-toastify';
import { graphApi, authApi } from '../../services/api';
import { Wand2, Edit3, Database, FileText, ArrowRight, Sparkles, Zap, ScanText, BrainCircuit, Upload, Info, HelpCircle, Table, FileStack } from 'lucide-react';

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

interface UploadedFileInfo {
  name: string;
  size: number;
  type: string;
  content: unknown;
  lastModified: number;
}

type ViewMode = 'WIZARD' | 'EDITOR';
type EntryMode = 'CHOOSER' | 'STRUCTURED' | 'BULK_IMPORT';

export const GraphBuilderModule: React.FC = () => {
  const [entryMode, setEntryMode] = useState<EntryMode>('CHOOSER');
  const [viewMode, setViewMode] = useState<ViewMode>('WIZARD');
  const [currentStep, setCurrentStep] = useState<number>(Step.Welcome);
  const [wizardData, setWizardData] = useState<WizardState>(INITIAL_STATE);

  // Bulk Import specific state
  const [bulkImportStep, setBulkImportStep] = useState<number>(BulkImportStep.Organization);
  const [uploadedFile, setUploadedFile] = useState<UploadedFileInfo | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateData = (newData: Partial<WizardState>) => {
    setWizardData(prev => ({ ...prev, ...newData }));
  };

  const nextStep = () => setCurrentStep(prev => prev + 1);
  const prevStep = () => setCurrentStep(prev => prev - 1);

  const nextBulkStep = () => setBulkImportStep(prev => prev + 1);
  const prevBulkStep = () => setBulkImportStep(prev => prev - 1);

  // Handler for starting bulk import from WelcomeStep
  const handleStartBulkImport = () => {
    setEntryMode('BULK_IMPORT');
    setBulkImportStep(BulkImportStep.Organization);
    setUploadedFile(null); // Reset file
  };

  const handleBulkUpload = async () => {
    if (!uploadedFile) return;

    setIsSubmitting(true);
    try {
      const email = authApi.getUserEmail();
      const payload = {
        org_id: wizardData.orgName || 'default_org',
        email: email,
        graph_payload: uploadedFile.content,
        schema_name: wizardData.projectName?.replace(/\s+/g, '_').toLowerCase() || 'default_schema',
        table_name: 'graph_metadata', // Default or derived
        postgres_schema: 'ai',
      };

      const response = await graphApi.bulkImport(payload);

      // Update wizard data with the returned graph ID
      updateData({ graphId: response.id });

      toast.success('File uploaded successfully!');
      nextBulkStep(); // Move to Review step
    } catch (error: any) {
      console.error("Bulk upload failed", error);
      toast.error(error.message || 'Failed to upload graph configuration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkBuild = async (options: { enableTextIndexing: boolean; enableVectorSearch: boolean }) => {
    // Check if we have a graph ID from the previous step
    if (!wizardData.graphId) {
      toast.error('Graph ID missing. Please re-upload schema.');
      return;
    }

    setIsSubmitting(true);
    try {
      await graphApi.createGraphFromMetadata(wizardData.graphId, options);

      toast.success('Knowledge Graph created successfully!');
      setBulkImportStep(BulkImportStep.Success);
    } catch (error: any) {
      console.error("Graph build failed", error);
      toast.error(error.message || 'Failed to build knowledge graph.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderBulkImportStep = () => {
    switch (bulkImportStep) {
      case BulkImportStep.Organization:
        return (
          <OrgDetailsStep
            data={wizardData}
            updateData={updateData}
            onNext={nextBulkStep}
          />
        );
      case BulkImportStep.Upload:
        return (
          <BulkUploadStep
            uploadedFile={uploadedFile}
            onFileUpload={setUploadedFile}
            onNext={handleBulkUpload}
            onBack={prevBulkStep}
            isLoading={isSubmitting}
          />
        );
      case BulkImportStep.Review:
      case BulkImportStep.Success:
        return (
          <BulkReviewStep
            orgName={wizardData.orgName}
            projectName={wizardData.projectName}
            uploadedFile={uploadedFile}
            onBack={prevBulkStep}
            onBuild={handleBulkBuild}
            isSuccess={bulkImportStep === BulkImportStep.Success}
          />
        );
      default:
        return <div>Unknown Step</div>;
    }
  };

  const renderWizardStep = () => {
    switch (currentStep) {
      case Step.Welcome:
        return <WelcomeStep onStart={nextStep} onBulkImport={handleStartBulkImport} />;
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
          
          .custom-tooltip {
            position: relative;
            display: inline-flex;
            align-items: center;
          }
          
          .custom-tooltip::before {
            content: attr(data-tooltip);
            position: absolute;
            bottom: 125%;
            left: 50%;
            transform: translateX(-50%) translateY(10px);
            width: 200px;
            padding: 8px 12px;
            background: #1e293b;
            color: white;
            font-size: 11px;
            font-weight: 500;
            line-height: 1.4;
            border-radius: 8px;
            text-align: center;
            opacity: 0;
            visibility: hidden;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            z-index: 100;
            pointer-events: none;
          }
          
          .custom-tooltip::after {
            content: '';
            position: absolute;
            bottom: 110%;
            left: 50%;
            transform: translateX(-50%) translateY(10px);
            border-width: 6px;
            border-style: solid;
            border-color: #1e293b transparent transparent transparent;
            opacity: 0;
            visibility: hidden;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 100;
            pointer-events: none;
          }
          
          .custom-tooltip:hover::before,
          .custom-tooltip:hover::after {
            opacity: 1;
            visibility: visible;
            transform: translateX(-50%) translateY(0);
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
      <div className="flex items-center justify-between px-6 py-1.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 sticky top-0 z-40 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-brand-50 dark:bg-brand-900/15 border border-brand-100 dark:border-brand-900/40 flex items-center justify-center shadow-sm">
              <BrainCircuit className="w-4 h-4 text-brand-700 dark:text-brand-300" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">Graph Builder</h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* View Switcher Tabs - Aligned with Data Insights */}
          {entryMode === 'STRUCTURED' && (
            <div className="flex bg-slate-100/80 dark:bg-slate-900/50 p-0.5 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-inner">
              <button
                onClick={() => setViewMode('WIZARD')}
                className={`flex items-center gap-2 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all duration-200 ${viewMode === 'WIZARD' ? 'bg-brand-600 text-white shadow-sm ring-1 ring-black/5' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-white/5'}`}
              >
                <Wand2 className="w-3 h-3" />
                Wizard
              </button>
              <button
                onClick={() => setViewMode('EDITOR')}
                className={`flex items-center gap-2 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all duration-200 ${viewMode === 'EDITOR' ? 'bg-brand-600 text-white shadow-sm ring-1 ring-black/5' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-white/5'}`}
              >
                <Edit3 className="w-3 h-3" />
                Editor
              </button>
            </div>
          )}

          {entryMode !== 'CHOOSER' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setEntryMode('CHOOSER');
                setCurrentStep(Step.Welcome);
                setBulkImportStep(BulkImportStep.Organization);
              }}
              className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-lg"
            >
              Exit
            </Button>
          )}
        </div>
      </div>

      {entryMode === 'CHOOSER' ? (
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 z-10 relative flex flex-col justify-center">
          <div className="max-w-5xl mx-auto w-full">
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">How would you like to build your graph?</h1>
              <p className="text-slate-500 mt-1 text-sm">
                Pick a source type to tailor the workflow and graph creation experience.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Card A — Structured Data (Active) */}
              <button
                type="button"
                onClick={() => {
                  setEntryMode('STRUCTURED');
                  setViewMode('WIZARD');
                  setCurrentStep(Step.Welcome);
                }}
                className="text-left group relative rounded-2xl border-2 border-brand-200 bg-white shadow-lg hover:shadow-xl hover:shadow-brand-500/10 hover:border-brand-400 transition-all duration-300 overflow-hidden focus:outline-none focus:ring-4 focus:ring-brand-500/20 min-h-[320px] hover:-translate-y-1"
              >
                {/* Active indicator glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-brand-50/50 via-transparent to-brand-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Top accent bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-400 via-brand-500 to-brand-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Decorative background icon */}
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity transform group-hover:scale-110 duration-500 pointer-events-none">
                  <Table className="w-48 h-48 text-brand-600" />
                </div>

                <div className="relative p-7">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 border-2 border-brand-200 flex items-center justify-center text-brand-600 shadow-sm group-hover:shadow-md group-hover:border-brand-300 group-hover:scale-105 transition-all duration-300">
                        <Database className="w-7 h-7" />
                      </div>
                      <div>
                        <div className="text-lg font-extrabold text-slate-900 group-hover:text-brand-700 transition-colors">Structured Data</div>
                        <div className="text-sm text-slate-500">SQL tables, CSVs, warehouse data</div>
                      </div>
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-wide text-white bg-brand-500 px-3 py-1.5 rounded-full shadow-sm">
                      Recommended
                    </div>
                  </div>

                  <ul className="mt-7 space-y-4 text-sm text-slate-700">
                    <li className="flex items-center gap-4">
                      <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 border border-brand-200 flex items-center justify-center shrink-0 group-hover:border-brand-300 group-hover:shadow-sm transition-all">
                        <Zap className="w-5 h-5 text-brand-600" />
                      </span>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 font-medium">
                          Fast &amp; deterministic
                          <div className="custom-tooltip" data-tooltip="Direct mapping from tables ensures consistent and predictable graph structures every time.">
                            <Info className="w-3.5 h-3.5 text-slate-400 hover:text-brand-500 transition-colors cursor-help" />
                          </div>
                        </div>
                        <span className="text-[11px] text-slate-500">Perfect for structured pipelines</span>
                      </div>
                    </li>
                    <li className="flex items-center gap-4">
                      <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 border border-brand-200 flex items-center justify-center shrink-0 group-hover:border-brand-300 group-hover:shadow-sm transition-all">
                        <Database className="w-5 h-5 text-brand-600" />
                      </span>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 font-medium">
                          Column-based graphing
                          <div className="custom-tooltip" data-tooltip="Automatically converts database columns into entities and relationships based on schema metadata.">
                            <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-brand-500 transition-colors cursor-help" />
                          </div>
                        </div>
                        <span className="text-[11px] text-slate-500">Automatic schema traversal</span>
                      </div>
                    </li>
                  </ul>

                  <div className="mt-8 flex items-center justify-between">
                    <div className="inline-flex items-center gap-2 text-[11px] font-extrabold text-brand-700 bg-brand-100/80 px-4 py-2 rounded-full border border-brand-200 shadow-sm transition-colors group-hover:bg-brand-100 group-hover:border-brand-300">
                      <Sparkles className="w-4 h-4 text-brand-600" />
                      Best for databases
                    </div>
                    <div className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-brand-600 text-white text-sm font-bold shadow-md group-hover:bg-brand-700 active:bg-brand-800 active:scale-[0.98] group-hover:shadow-lg group-hover:shadow-brand-500/25 transition-all duration-300">
                      Build graph from tables
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              </button>

              {/* Card B — Documents (Coming Soon) */}
              <div className="relative rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-slate-50/80 to-white shadow-sm overflow-hidden min-h-[320px] cursor-not-allowed">
                {/* Disabled overlay */}
                <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-10" />

                {/* Coming soon ribbon */}
                <div className="absolute top-4 right-4 z-20">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full shadow-sm">
                    Coming Soon
                  </div>
                </div>

                {/* Decorative background icon */}
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] transition-opacity pointer-events-none">
                  <FileStack className="w-48 h-48 text-slate-400" />
                </div>

                <div className="p-7 relative">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 border-2 border-slate-200 flex items-center justify-center text-slate-400 shadow-sm">
                        <FileText className="w-7 h-7" />
                      </div>
                      <div>
                        <div className="text-lg font-extrabold text-slate-600">Documents (PDFs, Text)</div>
                        <div className="text-sm text-slate-400">Reports, contracts, invoices</div>
                      </div>
                    </div>
                  </div>

                  <ul className="mt-7 space-y-4 text-sm text-slate-500">
                    <li className="flex items-center gap-4">
                      <span className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                        <BrainCircuit className="w-5 h-5 text-slate-400" />
                      </span>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 font-medium text-slate-600">
                          AI-powered extraction
                          <div className="custom-tooltip" data-tooltip="Uses LLMs to extract entities, properties, and relationships from unstructured text.">
                            <Info className="w-3.5 h-3.5 text-slate-300 hover:text-slate-500 transition-colors cursor-help" />
                          </div>
                        </div>
                        <span className="text-[11px] text-slate-400">LLM-driven knowledge parsing</span>
                      </div>
                    </li>
                    <li className="flex items-center gap-4">
                      <span className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                        <ScanText className="w-5 h-5 text-slate-400" />
                      </span>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 font-medium text-slate-600">
                          Semantic interpretation
                          <div className="custom-tooltip" data-tooltip="Goes beyond keywords to understand context and meaning within your documents.">
                            <HelpCircle className="w-3.5 h-3.5 text-slate-300 hover:text-slate-500 transition-colors cursor-help" />
                          </div>
                        </div>
                        <span className="text-[11px] text-slate-400">Deep context understanding</span>
                      </div>
                    </li>
                  </ul>

                  <div className="mt-8 flex items-center justify-between">
                    <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                      <FileText className="w-4 h-4" />
                      Document ingestion
                    </div>
                    <div className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-slate-200 text-slate-400 text-sm font-bold border border-slate-300">
                      Build graph from documents
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : entryMode === 'BULK_IMPORT' ? (
        <div className="flex-1 flex flex-col relative w-full overflow-hidden z-10">
          {bulkImportStep !== BulkImportStep.Success && (
            <div className="shrink-0 pt-4 pb-8 px-2">
              <BulkImportProgress currentStep={bulkImportStep} />
            </div>
          )}

          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 flex justify-center">
            <div className="w-full max-w-5xl min-h-full flex flex-col">
              {renderBulkImportStep()}
            </div>
          </div>
        </div>
      ) : viewMode === 'WIZARD' ? (
        <div className="flex-1 flex flex-col relative w-full overflow-hidden z-10">
          <div className="shrink-0 pt-4 pb-8 px-2">
            <WizardProgress currentStep={currentStep} />
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 flex justify-center">
            <div className="w-full max-w-5xl min-h-full flex flex-col">
              {renderWizardStep()}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-hidden animate-fade-in z-10 relative flex flex-col">
          <GraphEditor
            projectName={wizardData.projectName || 'Untitled Graph'}
            initialGraphId={wizardData.graphId}
            initialGraphName={wizardData.projectName}
          />
        </div>
      )
      }
    </div >
  );
};