import React from 'react';
import { ArrowRight, Sparkles, Network } from 'lucide-react';
import { Button } from '../ui/Common';

interface WelcomeStepProps {
  onStart: () => void;
}

export const WelcomeStep: React.FC<WelcomeStepProps> = ({ onStart }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] text-center animate-fade-in-up relative overflow-hidden">
      
      {/* Decorative background elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-50 rounded-full blur-3xl opacity-60 -z-10" />
      
      <div className="relative mb-10 group">
        <div className="absolute inset-0 bg-brand-400/30 blur-2xl opacity-40 group-hover:opacity-60 transition-opacity rounded-full" />
        <div className="w-28 h-28 bg-gradient-to-br from-white to-brand-50 rounded-3xl flex items-center justify-center shadow-xl shadow-brand-100 ring-1 ring-white relative">
          <Network className="w-14 h-14 text-brand-600" />
          
          <div className="absolute -top-3 -right-3 w-10 h-10 bg-brand-600 rounded-2xl flex items-center justify-center shadow-lg border-[3px] border-white animate-bounce-slow">
            <Sparkles className="w-5 h-5 text-white fill-white" />
          </div>
        </div>
      </div>
      
      <h1 className="text-5xl md:text-7xl font-bold text-slate-900 tracking-tight mb-8">
        Graph<span className="text-brand-600">Builder</span>
      </h1>
      
      <p className="text-xl text-slate-500 max-w-2xl mb-12 leading-relaxed font-light">
        Transform your relational data into a powerful <span className="font-semibold text-slate-900">semantic knowledge graph</span>. 
        Visualize connections and unlock insights effortlessly.
      </p>

      <Button 
        size="lg" 
        onClick={onStart} 
        rightIcon={<ArrowRight className="w-5 h-5" />} 
        className="px-12 py-5 text-lg shadow-brand-600/30 hover:shadow-brand-600/50 hover:-translate-y-1 rounded-full"
      >
        Start Building
      </Button>

      {/* Feature pills */}
      <div className="mt-16 flex flex-wrap justify-center gap-4 opacity-70">
        {['PostgreSQL Compatible', 'Auto-Schema Detection', 'No-Code Ontology'].map((text) => (
          <span key={text} className="px-5 py-2.5 bg-white/80 backdrop-blur-sm rounded-full text-sm font-medium text-slate-600 border border-slate-200 shadow-sm">
            {text}
          </span>
        ))}
      </div>
    </div>
  );
};