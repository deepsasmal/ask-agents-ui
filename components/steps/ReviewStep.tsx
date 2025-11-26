import React, { useState } from 'react';
import { ArrowLeft, Rocket, CheckCircle, Layers, Database, FileText, Check, Sparkles, Settings2, Search, BrainCircuit } from 'lucide-react';
import { Button, Card } from '../ui/Common';
import { WizardState } from '../../types';
import { graphApi } from '../../services/api';

interface ReviewStepProps {
  data: WizardState;
  onBack: () => void;
  onComplete: () => void;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({ data, onBack, onComplete }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [enableTextIndexing, setEnableTextIndexing] = useState(false);
  const [enableVectorSearch, setEnableVectorSearch] = useState(false);

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      // Use sanitized project name as ID to match SchemaStep
      const graphId = data.projectName.trim().replace(/\s+/g, '_').toLowerCase();
      
      await graphApi.createGraphFromMetadata(graphId, {
        enableTextIndexing,
        enableVectorSearch
      });
      setIsCompleted(true);
      onComplete();
    } catch (error) {
      console.error('Failed to create graph', error);
      alert('Failed to create graph. Please try again.');
    } finally {
      setIsCreating(false);
    }
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
              <p className="text-xl text-slate-500 max-w-lg mx-auto mb-10">
                  Your knowledge graph has been initialized with {selectedTables.length} tables and {totalColumns} data points.
              </p>

              <Button onClick={() => window.location.reload()} size="lg" className="px-10 shadow-brand-600/30">
                  Back to Home
              </Button>
          </div>
      );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Review & Build</h2>
        <p className="text-slate-500 mt-1">Review your configuration before generating the knowledge graph.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="shadow-sm border-slate-200 bg-white/50">
           <div className="flex flex-col items-center text-center p-4">
               <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                   <Database className="w-6 h-6" />
               </div>
               <span className="text-3xl font-bold text-slate-900">{selectedTables.length}</span>
               <span className="text-sm font-medium text-slate-500">Tables Selected</span>
           </div>
        </Card>

        <Card className="shadow-sm border-slate-200 bg-white/50">
           <div className="flex flex-col items-center text-center p-4">
               <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                   <Layers className="w-6 h-6" />
               </div>
               <span className="text-3xl font-bold text-slate-900">{totalColumns}</span>
               <span className="text-sm font-medium text-slate-500">Columns Mapped</span>
           </div>
        </Card>

        <Card className="shadow-sm border-slate-200 bg-white/50">
           <div className="flex flex-col items-center text-center p-4">
               <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                   <FileText className="w-6 h-6" />
               </div>
               <span className="text-xl font-bold text-slate-900 truncate max-w-full px-2">{data.schemaName}</span>
               <span className="text-sm font-medium text-slate-500">Target Schema</span>
           </div>
        </Card>
      </div>

      <div className="space-y-6 mb-10">
        <Card className="shadow-supreme border-0">
           <div className="flex items-center gap-4 border-b border-slate-100 p-6">
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
                  <Settings2 className="w-5 h-5" />
              </div>
              <div>
                  <h3 className="text-lg font-bold text-slate-900">Graph Configuration</h3>
                  <p className="text-sm text-slate-500">Configure indexing and search capabilities.</p>
              </div>
           </div>
           
           <div className="p-6 space-y-4">
              {/* Text Indexing Option */}
              <label className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${enableTextIndexing ? 'bg-brand-50/50 border-brand-200' : 'bg-white border-slate-200 hover:border-brand-200'}`}>
                  <div className="relative flex items-center mt-1">
                      <input 
                          type="checkbox" 
                          checked={enableTextIndexing}
                          onChange={(e) => setEnableTextIndexing(e.target.checked)}
                          className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 transition-all checked:border-brand-600 checked:bg-brand-600 focus:ring-2 focus:ring-brand-500/20"
                      />
                      <Check className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
                  </div>
                  <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                          <Search className="w-4 h-4 text-slate-600" />
                          <span className="font-bold text-slate-900">Enable Text Indexing</span>
                      </div>
                      <p className="text-sm text-slate-500">Creates full-text search indexes on string columns for faster keyword lookup.</p>
                  </div>
              </label>

              {/* Vector Search Option (Disabled) */}
              <label className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50 cursor-not-allowed opacity-70">
                  <div className="relative flex items-center mt-1">
                      <input 
                          type="checkbox" 
                          checked={enableVectorSearch}
                          disabled
                          className="h-5 w-5 appearance-none rounded-md border border-slate-300 bg-slate-100"
                      />
                  </div>
                  <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                          <BrainCircuit className="w-4 h-4 text-slate-400" />
                          <span className="font-bold text-slate-500">Enable Vector Search</span>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded">Coming Soon</span>
                      </div>
                      <p className="text-sm text-slate-400">Generates embeddings for content to enable semantic similarity search.</p>
                  </div>
              </label>
           </div>
        </Card>

        <Card className="shadow-supreme border-0 bg-gradient-to-br from-brand-600 to-brand-700 text-white overflow-hidden relative">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
           <div className="relative p-8 flex items-center justify-between">
              <div>
                  <h3 className="text-2xl font-bold mb-2">Ready to Build?</h3>
                  <p className="text-brand-100 max-w-md">This process will initialize the graph structure in the database. It may take a few moments.</p>
              </div>
              <div className="hidden md:block">
                  <Rocket className="w-16 h-16 text-white/20 rotate-45" />
              </div>
           </div>
        </Card>
      </div>

      <div className="flex justify-between pb-8">
        <Button variant="ghost" onClick={onBack} leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Back
        </Button>
        <Button 
          onClick={handleCreate} 
          isLoading={isCreating} 
          rightIcon={<Rocket className="w-4 h-4" />} 
          size="lg" 
          className="px-10 shadow-brand-600/30 bg-brand-600 hover:bg-brand-500 text-white"
        >
          {isCreating ? 'Building Graph...' : 'Build Knowledge Graph'}
        </Button>
      </div>
    </div>
  );
};