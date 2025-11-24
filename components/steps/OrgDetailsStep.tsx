import React from 'react';
import { ArrowRight, Building2, Briefcase, LayoutTemplate, Sparkles, Activity } from 'lucide-react';
import { Button, Input, Card } from '../ui/Common';
import { WizardState } from '../../types';

interface OrgDetailsStepProps {
  data: WizardState;
  updateData: (data: Partial<WizardState>) => void;
  onNext: () => void;
}

export const OrgDetailsStep: React.FC<OrgDetailsStepProps> = ({ data, updateData, onNext }) => {
  const isFormValid = data.orgName && data.projectName;

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      {/* Header Section - Moved outside grid for alignment */}
      <div className="mb-10">
        <h2 className="text-3xl font-bold text-slate-900 mb-3">Organization Details</h2>
        <p className="text-slate-500 text-lg">Tell us about your organization to personalize your knowledge graph ontology.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Form Section */}
        <div className="lg:col-span-7 flex flex-col">
          <Card className="shadow-supreme border-0 h-full flex flex-col" noPadding>
            <div className="p-8 space-y-8 flex-1">
              <div className="grid grid-cols-1 gap-6">
                <Input 
                  label="Organization Name" 
                  placeholder="e.g. Acme Industries" 
                  value={data.orgName}
                  onChange={(e) => updateData({ orgName: e.target.value })}
                  autoFocus
                  className="text-lg"
                />
                <Input 
                  label="Project Name" 
                  placeholder="e.g. Enterprise Knowledge Graph" 
                  value={data.projectName}
                  onChange={(e) => updateData({ projectName: e.target.value })}
                  className="text-lg"
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">
                  Description <span className="text-slate-400 font-normal ml-1">(Optional)</span>
                </label>
                <textarea
                  className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm hover:border-brand-300 min-h-[140px] resize-none"
                  placeholder="Describe the goals of this graph analysis..."
                  value={data.description}
                  onChange={(e) => updateData({ description: e.target.value })}
                />
              </div>
            </div>

            <div className="px-8 pb-8 pt-2 flex justify-end">
                <Button 
                    onClick={onNext} 
                    disabled={!isFormValid} 
                    rightIcon={<ArrowRight className="w-5 h-5" />}
                    size="lg"
                    className="px-8 w-full sm:w-auto shadow-brand-600/30"
                >
                    Next Step
                </Button>
            </div>
          </Card>
        </div>

        {/* Right Sidebar Section */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="h-full relative group">
               {/* Decorative Background Effects */}
               <div className="absolute -inset-1 bg-gradient-to-r from-brand-200 to-brand-100 rounded-[2rem] blur opacity-40 group-hover:opacity-60 transition duration-1000 group-hover:duration-200" />
               <div className="absolute top-10 -right-10 w-40 h-40 bg-brand-300/30 rounded-full blur-3xl" />
               <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-300/30 rounded-full blur-3xl" />
               
               <Card className="relative border-0 shadow-supreme ring-1 ring-white/50 backdrop-blur-md bg-white/90 overflow-hidden h-full flex flex-col" noPadding>
                  {/* Visual Illustration Header */}
                  <div className="h-48 shrink-0 bg-gradient-to-br from-slate-50 to-brand-50/50 relative overflow-hidden flex items-center justify-center border-b border-slate-100">
                    {/* CSS Node Network Illustration */}
                    <div className="absolute inset-0">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border border-brand-100/50 rounded-full" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] border border-brand-200/60 rounded-full animate-pulse-slow" />
                    </div>

                    {/* Central Hub */}
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-20 h-20 bg-white rounded-2xl shadow-xl shadow-brand-500/10 flex items-center justify-center ring-4 ring-white relative mb-3">
                            <Building2 className="w-10 h-10 text-brand-600" />
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-brand-500 rounded-full border-2 border-white" />
                        </div>
                        {/* Connecting Lines */}
                        <div className="absolute top-1/2 left-full w-16 h-[2px] bg-gradient-to-r from-brand-300 to-transparent transform -translate-y-1/2 ml-4" />
                        <div className="absolute top-1/2 right-full w-16 h-[2px] bg-gradient-to-l from-brand-300 to-transparent transform -translate-y-1/2 mr-4" />
                        
                        {/* Orbiting Nodes */}
                        <div className="absolute -top-8 -right-12 p-2 bg-white rounded-lg shadow-sm animate-bounce-slow" style={{ animationDelay: '0s' }}>
                            <Activity className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="absolute -bottom-4 -left-16 p-2 bg-white rounded-lg shadow-sm animate-bounce-slow" style={{ animationDelay: '1.5s' }}>
                            <LayoutTemplate className="w-4 h-4 text-purple-500" />
                        </div>
                    </div>
                </div>
                
                <div className="p-8 space-y-6 flex-1">
                  <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Project Preview</h3>
                    <h3 className="text-2xl font-bold text-slate-900 leading-tight break-words">
                        {data.orgName || 'New Organization'}
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-brand-600">
                            <Briefcase className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-500 font-medium">Project Workspace</p>
                            <p className="text-sm font-semibold text-slate-900 truncate">
                                {data.projectName || 'Untitled Graph'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100 min-h-[80px]">
                         <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-brand-600 shrink-0">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-500 font-medium mb-1">Scope Description</p>
                            <p className="text-sm text-slate-600 leading-snug line-clamp-3">
                                {data.description ? (
                                    <span className="italic">"{data.description}"</span>
                                ) : (
                                    <span className="text-slate-400 italic">No description provided.</span>
                                )}
                            </p>
                        </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
        </div>
      </div>
    </div>
  );
};