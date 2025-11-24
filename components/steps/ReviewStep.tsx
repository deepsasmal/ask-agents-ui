import React, { useState } from 'react';
import { ArrowLeft, Rocket, CheckCircle, Layers, Database, FileText, Check, Sparkles } from 'lucide-react';
import { Button, Card } from '../ui/Common';
import { WizardState } from '../../types';

interface ReviewStepProps {
  data: WizardState;
  onBack: () => void;
  onComplete: () => void;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({ data, onBack, onComplete }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const handleCreate = () => {
    setIsCreating(true);
    // Mock API call time
    setTimeout(() => {
        setIsCreating(false);
        setIsCompleted(true);
        onComplete(); 
    }, 3000);
  };

  const selectedTables = data.tables.filter(t => t.selected);
  const totalColumns = selectedTables.reduce((acc, t) => acc + t.columns.length, 0);

  if (isCompleted) {
      return (
          <div className="flex flex-col items-center justify-center text-center animate-fade-in py-16">
              <div className="relative mb-8">
                  <div className="absolute inset-0 bg-brand-500 blur-2xl opacity-20 rounded-full animate-pulse-slow"></div>
                  <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center text-brand-600 shadow-2xl shadow-brand-200 border-[6px] border-brand-50 relative z-10">
                      <Check className="w-16 h-16 stroke-[3]" />
                  </div>
              </div>
              
              <h2 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">Graph Created Successfully!</h2>
              <p className="text-xl text-slate-500 max-w-lg mb-12 leading-relaxed">
                Your knowledge graph <span className="font-bold text-slate-900">"{data.projectName}"</span> is ready. 
                {selectedTables.length} tables have been transformed.
              </p>
              
              <div className="flex gap-4">
                <Button variant="outline" onClick={() => window.location.reload()} size="lg">Build Another</Button>
                <Button size="lg" rightIcon={<ArrowLeft className="w-5 h-5 rotate-180" />} className="px-10 shadow-brand-600/30">Explore Graph</Button>
              </div>
          </div>
      )
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-3">Review & Create Graph</h2>
        <p className="text-lg text-slate-500">Confirm your settings before generating the ontology.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <Card className="p-0 flex flex-col border-0 shadow-supreme overflow-hidden group">
            <div className="h-1.5 w-full bg-[#336791]"></div>
            <div className="p-8 flex items-start gap-6">
                <div className="p-4 bg-blue-50 rounded-2xl text-[#336791] shrink-0 ring-1 ring-blue-100 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                    <Database className="w-8 h-8" />
                </div>
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Source</p>
                    <h3 className="text-xl font-bold text-slate-900 mb-1">PostgreSQL</h3>
                    <div className="space-y-1 mt-2">
                        <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                            {data.dbHost}:{data.dbPort}
                        </p>
                        <p className="text-xs text-slate-400 font-mono bg-slate-100 inline-block px-1.5 py-0.5 rounded">{data.dbName}</p>
                    </div>
                </div>
            </div>
          </Card>

          <Card className="p-0 flex flex-col border-0 shadow-supreme overflow-hidden group">
            <div className="h-1.5 w-full bg-brand-500"></div>
            <div className="p-8 flex items-start gap-6">
                <div className="p-4 bg-brand-50 rounded-2xl text-brand-600 shrink-0 ring-1 ring-brand-100 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                    <Layers className="w-8 h-8" />
                </div>
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Scope</p>
                    <h3 className="text-xl font-bold text-slate-900 mb-1">{selectedTables.length} Tables</h3>
                    <div className="space-y-1 mt-2">
                        <p className="text-sm font-semibold text-slate-700">{totalColumns} Columns mapped</p>
                        <p className="text-xs text-slate-400">Schema: <span className="font-mono text-slate-500">public</span></p>
                    </div>
                </div>
            </div>
          </Card>
      </div>

      <Card className="mb-12 border-0 shadow-supreme overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50 to-white px-8 py-6 border-b border-slate-100 flex items-center gap-4">
            <div className="p-2.5 bg-white rounded-xl shadow-sm text-brand-600 border border-slate-100">
                <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Project Summary</h3>
        </div>
        <div className="p-8 space-y-6">
            <div className="grid grid-cols-12 gap-6 pb-6 border-b border-slate-100 last:border-0 last:pb-0">
                <div className="col-span-4 text-sm font-bold text-slate-500 uppercase tracking-wide pt-1">Organization</div>
                <div className="col-span-8 text-lg font-semibold text-slate-900">{data.orgName}</div>
            </div>
            <div className="grid grid-cols-12 gap-6 pb-6 border-b border-slate-100 last:border-0 last:pb-0">
                <div className="col-span-4 text-sm font-bold text-slate-500 uppercase tracking-wide pt-1">Project Name</div>
                <div className="col-span-8 text-lg font-semibold text-slate-900">{data.projectName}</div>
            </div>
             <div className="grid grid-cols-12 gap-6">
                <div className="col-span-4 text-sm font-bold text-slate-500 uppercase tracking-wide pt-2">Included Tables</div>
                <div className="col-span-8 flex flex-wrap gap-2">
                    {selectedTables.map(t => (
                        <span key={t.id} className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-50 text-slate-700 border border-slate-200 shadow-sm hover:border-brand-300 transition-colors cursor-default">
                            {t.name}
                        </span>
                    ))}
                </div>
            </div>
        </div>
      </Card>

      <div className="flex justify-between items-center pb-8">
        <Button variant="ghost" onClick={onBack} disabled={isCreating} leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Back
        </Button>
        <Button 
            size="lg" 
            onClick={handleCreate} 
            isLoading={isCreating} 
            className="px-10 py-4 text-lg shadow-brand-600/40 hover:shadow-brand-600/60"
            rightIcon={!isCreating && <Rocket className="w-5 h-5" />}
        >
          {isCreating ? 'Building Graph...' : 'Create Graph'}
        </Button>
      </div>

      {/* Loading Modal Overlay */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center">
            <div className="bg-white rounded-3xl p-12 shadow-2xl flex flex-col items-center animate-fade-in-up max-w-sm w-full mx-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100">
                    <div className="h-full bg-brand-500 animate-[width_2s_ease-in-out_infinite]" style={{ width: '30%' }}></div>
                </div>
                
                <div className="relative w-24 h-24 mb-8">
                     <div className="absolute inset-0 border-[6px] border-slate-100 rounded-full"></div>
                     <div className="absolute inset-0 border-[6px] border-brand-600 rounded-full border-t-transparent animate-spin"></div>
                     <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="w-10 h-10 text-brand-500 animate-pulse" />
                     </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Constructing Graph</h3>
                <p className="text-slate-500 text-center font-medium leading-relaxed">Analyzing relationships and generating ontology nodes...</p>
            </div>
        </div>
      )}
    </div>
  );
};