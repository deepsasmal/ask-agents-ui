import React, { useState } from 'react';
import { ArrowRight, Sparkles, Network, Edit3 } from 'lucide-react';
import { Button } from '../ui/Common';

interface WelcomeStepProps {
  onStart: () => void;
  onBulkImport?: () => void;
  onStartEditing?: () => void;
}

export const WelcomeStep: React.FC<WelcomeStepProps> = ({ onStart, onBulkImport, onStartEditing }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] text-center animate-fade-in-up relative">

      {/* Decorative background elements - Reverted to Simple Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-50 rounded-full blur-3xl opacity-60 -z-10" />

      <style>
        {`
          @keyframes float-slow {
            0%, 100% { transform: translateY(0) rotate(0); }
            50% { transform: translateY(-10px) rotate(1deg); }
          }
          .animate-float-slow {
            animation: float-slow 5s ease-in-out infinite;
          }
        `}
      </style>

      {/* Main Content Area */}
      <div className="relative mb-12 group animate-float-slow z-20 p-4">
        {/* Simplified Glow to prevent "foggy" look */}
        <div className="absolute inset-0 bg-brand-400/20 blur-2xl opacity-40 group-hover:opacity-60 transition-opacity rounded-full" />
        <div className="w-32 h-32 bg-gradient-to-br from-white to-brand-50 rounded-3xl flex items-center justify-center shadow-xl shadow-brand-100 ring-1 ring-white relative">
          <Network className="w-16 h-16 text-brand-600 stroke-[2]" />

          {/* Badge position fixed to prevent clipping and centered more on the corner */}
          <div className="absolute -top-2 -right-2 w-10 h-10 bg-brand-600 rounded-2xl flex items-center justify-center shadow-lg border-[3px] border-white animate-bounce-slow z-30">
            <Sparkles className="w-5 h-5 text-white fill-white" />
          </div>
        </div>
      </div>

      <h1 className="text-5xl md:text-7xl font-bold text-slate-900 tracking-tight mb-8">
        Graph<span className="text-brand-600">Builder</span>
      </h1>

      <p className="text-xl text-slate-500 max-w-2xl mb-12 leading-relaxed font-light">
        Transform your relational data into a powerful <span className="font-semibold text-slate-900 border-b border-brand-100">semantic knowledge graph</span>.
        Visualize connections and unlock insights effortlessly.
      </p>

      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-4">
          <Button
            size="lg"
            onClick={onStart}
            rightIcon={<ArrowRight className="w-5 h-5" />}
            className="px-12 py-5 text-lg shadow-brand-600/30 hover:shadow-brand-600/50 hover:-translate-y-1 rounded-full"
          >
            Start Building
          </Button>

          <Button
            size="lg"
            variant="secondary"
            className="px-8 py-5 text-lg bg-white/80 border-slate-200 text-slate-600 hover:text-brand-600 hover:border-brand-200 rounded-full"
            onClick={onBulkImport}
          >
            Bulk Import
          </Button>
        </div>

        <button
          onClick={onStartEditing}
          className="group flex items-center gap-2.5 px-6 py-3 rounded-full bg-white/50 hover:bg-white border border-transparent hover:border-brand-200/60 text-slate-500 hover:text-brand-600 hover:shadow-lg hover:shadow-brand-500/10 transition-all duration-300 font-medium text-sm backdrop-blur-sm"
        >
          <span className="w-6 h-6 rounded-full bg-slate-100 group-hover:bg-brand-50 flex items-center justify-center transition-colors">
            <Edit3 className="w-3.5 h-3.5" />
          </span>
          Start Editing
        </button>
      </div>

      {/* Feature pills */}
      <div className="mt-12 flex flex-wrap justify-center gap-4 opacity-70">
        {['PostgreSQL Compatible', 'Auto-Schema Detection', 'No-Code Ontology'].map((text) => (
          <span key={text} className="px-5 py-2.5 bg-white/80 backdrop-blur-sm rounded-full text-sm font-medium text-slate-600 border border-slate-200 shadow-sm">
            {text}
          </span>
        ))}
      </div>
    </div>
  );
};