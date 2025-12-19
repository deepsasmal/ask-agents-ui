import React, { useState, useEffect } from 'react';
import { ArrowRight, Building2, Briefcase, LayoutTemplate, Sparkles, Activity, ChevronDown, Tag } from 'lucide-react';
import { Button, Input, Card } from '../ui/Common';
import { WizardState } from '../../types';

interface OrgDetailsStepProps {
  data: WizardState;
  updateData: (data: Partial<WizardState>) => void;
  onNext: () => void;
}

const DOMAINS = [
  'Retail & E-Commerce',
  'Healthcare & Life Sciences',
  'Financial Services',
  'Manufacturing & Industry',
  'Technology & SaaS',
  'Education & Research',
  'Logistics & Supply Chain',
  'Media & Entertainment',
  'Government & Public Sector',
  'Real Estate'
];

export const OrgDetailsStep: React.FC<OrgDetailsStepProps> = ({ data, updateData, onNext }) => {
  const isFormValid = data.orgName && data.projectName;

  // Determine if the current domain is a custom one (not in the list and not empty)
  const isInitialCustom = !!data.domain && !DOMAINS.includes(data.domain);
  const [showCustomInput, setShowCustomInput] = useState(isInitialCustom);

  // Sync state if data.domain changes externally
  useEffect(() => {
    if (data.domain && !DOMAINS.includes(data.domain) && data.domain !== '') {
      setShowCustomInput(true);
    }
  }, [data.domain]);

  const handleDomainSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'other') {
      setShowCustomInput(true);
      updateData({ domain: '' });
    } else {
      setShowCustomInput(false);
      updateData({ domain: value });
    }
  };

  return (
    <div className="h-full min-h-0 w-full flex flex-col animate-fade-in">
      {/* Header Section */}
      <div className="mb-4 shrink-0">
        <h2 className="text-xl font-bold text-slate-900 mb-1">Organization Details</h2>
        <p className="text-slate-500 text-sm">Tell us about your organization to personalize your knowledge graph ontology.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
        {/* Left Form Section */}
        <div className="lg:col-span-7 min-h-0 flex flex-col">
          <Card className="shadow-supreme border-0 flex-1 min-h-0 flex flex-col" noPadding>
            <div className="p-4 space-y-4 flex-1 min-h-0">
              <div className="grid grid-cols-1 gap-5">
                <Input
                  label="Organization Name"
                  placeholder="e.g. Acme Industries"
                  value={data.orgName}
                  onChange={(e) => updateData({ orgName: e.target.value })}
                  autoFocus
                  className="text-base"
                />
                <Input
                  label="Project Name"
                  placeholder="e.g. Enterprise Knowledge Graph"
                  value={data.projectName}
                  onChange={(e) => updateData({ projectName: e.target.value })}
                  className="text-base"
                />

                {/* Domain Selection */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wide">Industry / Domain</label>
                  <div className="relative group">
                    <select
                      className={`w-full appearance-none px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm hover:border-brand-300 cursor-pointer ${!data.domain && !showCustomInput ? 'text-slate-400' : ''}`}
                      value={showCustomInput ? 'other' : (data.domain || '')}
                      onChange={handleDomainSelect}
                    >
                      <option value="" disabled>Select an Industry...</option>
                      {DOMAINS.map(d => (
                        <option key={d} value={d} className="text-slate-900">{d}</option>
                      ))}
                      <option value="other" className="font-semibold text-brand-600">Other (Custom)...</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-hover:text-brand-500 transition-colors" />
                  </div>

                  {showCustomInput && (
                    <div className="animate-fade-in-up mt-1">
                      <Input
                        placeholder="Enter specific domain..."
                        value={data.domain}
                        onChange={(e) => updateData({ domain: e.target.value })}
                        autoFocus
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-700 ml-1 uppercase tracking-wide">
                  Description <span className="text-slate-400 font-normal normal-case ml-1">(Optional)</span>
                </label>
                <textarea
                  className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm hover:border-brand-300 min-h-[80px] resize-none"
                  placeholder="Describe the goals of this graph analysis..."
                  value={data.description}
                  onChange={(e) => updateData({ description: e.target.value })}
                />
              </div>
            </div>

            <div className="px-4 pb-4 pt-2 flex justify-end">
              <Button
                onClick={onNext}
                disabled={!isFormValid}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                size="sm"
                className="px-6 w-full sm:w-auto shadow-brand-600/30"
              >
                Next Step
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Sidebar Section */}
        <div className="lg:col-span-5 min-h-0 flex flex-col">
          <div className="flex-1 min-h-[280px] lg:min-h-0 relative group">
            {/* Decorative Background Effects */}
            <div className="absolute -inset-1 bg-gradient-to-r from-brand-200 to-brand-100 rounded-[2rem] blur opacity-40 group-hover:opacity-60 transition duration-1000 group-hover:duration-200" />
            <div className="absolute top-10 -right-10 w-40 h-40 bg-brand-300/30 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-300/30 rounded-full blur-3xl" />

            <Card className="relative border-0 shadow-supreme ring-1 ring-white/50 backdrop-blur-md bg-white/90 overflow-hidden h-full flex flex-col" noPadding>
              {/* Visual Illustration Header */}
              <div className="h-32 shrink-0 bg-gradient-to-br from-slate-50 to-brand-50/50 relative overflow-hidden flex items-center justify-center border-b border-slate-100">
                {/* CSS Node Network Illustration */}
                <div className="absolute inset-0">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] h-[240px] border border-brand-100/50 rounded-full" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160px] h-[160px] border border-brand-200/60 rounded-full animate-pulse-slow" />
                </div>

                {/* Central Hub */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-12 h-12 bg-white rounded-xl shadow-xl shadow-brand-500/10 flex items-center justify-center ring-4 ring-white relative mb-2">
                    <Building2 className="w-6 h-6 text-brand-600" />
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-brand-500 rounded-full border-2 border-white" />
                  </div>
                  {/* Connecting Lines */}
                  <div className="absolute top-1/2 left-full w-12 h-[2px] bg-gradient-to-r from-brand-300 to-transparent transform -translate-y-1/2 ml-3" />
                  <div className="absolute top-1/2 right-full w-12 h-[2px] bg-gradient-to-l from-brand-300 to-transparent transform -translate-y-1/2 mr-3" />

                  {/* Orbiting Nodes */}
                  <div className="absolute -top-6 -right-10 p-1.5 bg-white rounded-lg shadow-sm animate-bounce-slow" style={{ animationDelay: '0s' }}>
                    <Activity className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  <div className="absolute -bottom-2 -left-12 p-1.5 bg-white rounded-lg shadow-sm animate-bounce-slow" style={{ animationDelay: '1.5s' }}>
                    <LayoutTemplate className="w-3.5 h-3.5 text-purple-500" />
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-5 flex-1 min-h-0">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Project Preview</h3>
                    {data.domain && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-brand-50 text-brand-700 border border-brand-100/50">
                        <Tag className="w-3 h-3" />
                        {data.domain}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 leading-tight break-words">
                    {data.orgName || 'New Organization'}
                  </h3>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-brand-600">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Project Workspace</p>
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {data.projectName || 'Untitled Graph'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 min-h-[70px]">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-brand-600 shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide mb-0.5">Scope Description</p>
                      <p className="text-xs text-slate-600 leading-snug line-clamp-3">
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