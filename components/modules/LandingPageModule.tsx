import React from 'react';
import { Network, MessageSquareText, ArrowRight, Sparkles, Bot, Database, PieChart } from 'lucide-react';
import { Button } from '../ui/Common';

interface LandingPageProps {
    onNavigate: (module: 'GRAPH_BUILDER' | 'CHAT' | 'DATA_INSIGHTS') => void;
}

export const LandingPageModule: React.FC<LandingPageProps> = ({ onNavigate }) => {
    return (
        <div className="flex-1 h-full overflow-y-auto bg-[#f8fafc] custom-scrollbar flex flex-col">
            {/* Hero Section */}
            <div className="relative overflow-hidden pt-12 pb-16 px-6 shrink-0">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-brand-50/50 rounded-full blur-3xl -z-10" />

                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-brand-100 shadow-sm text-brand-700 text-[10px] font-bold uppercase tracking-wider mb-6">
                        <Sparkles className="w-3 h-3" />
                        <span>The Future of Data Interaction</span>
                    </div>

                    <h1 className="text-5xl md:text-6xl font-bold text-slate-900 tracking-tight mb-6">
                        Ask <span className="text-brand-600">Agents</span>
                    </h1>

                    <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed mb-10">
                        Unified platform to build semantic knowledge graphs and interact with your enterprise data using intelligent AI agents.
                    </p>

                    <div className="flex items-center justify-center gap-4">
                        <Button
                            size="lg"
                            onClick={() => onNavigate('CHAT')}
                            rightIcon={<ArrowRight className="w-4 h-4" />}
                            className="px-8 py-3 h-auto text-base shadow-brand-600/30 hover:shadow-brand-600/40"
                        >
                            Chat with Agents
                        </Button>
                        <Button
                            variant="secondary"
                            size="lg"
                            onClick={() => onNavigate('GRAPH_BUILDER')}
                            className="px-8 py-3 h-auto text-base bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        >
                            Build Graph
                        </Button>
                    </div>
                </div>
            </div>

            {/* Feature Cards */}
            <div className="max-w-5xl mx-auto px-6 pb-20 w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Graph Builder Card */}
                    <div
                        onClick={() => onNavigate('GRAPH_BUILDER')}
                        className="group relative bg-white rounded-2xl p-6 border border-slate-200 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-brand-900/5 transition-all duration-300 cursor-pointer overflow-hidden min-h-[240px]"
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                            <Network className="w-48 h-48 text-brand-600" />
                        </div>

                        <div className="relative z-10 h-full flex flex-col items-start">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                                <Database className="w-6 h-6" />
                            </div>

                            <h3 className="text-xl font-bold text-slate-900 mb-2">Graph Builder</h3>
                            <p className="text-slate-500 text-sm mb-6 max-w-xs leading-relaxed">
                                Transform relational databases into semantic knowledge graphs. Define ontologies and visualize connections.
                            </p>

                            <span className="mt-auto inline-flex items-center text-sm text-blue-600 font-bold group-hover:gap-2 transition-all">
                                Open Builder <ArrowRight className="w-3.5 h-3.5 ml-1" />
                            </span>
                        </div>
                    </div>

                    {/* AI Assistant Card */}
                    <div
                        onClick={() => onNavigate('CHAT')}
                        className="group relative bg-white rounded-2xl p-6 border border-slate-200 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-brand-900/5 transition-all duration-300 cursor-pointer overflow-hidden min-h-[240px]"
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                            <Bot className="w-48 h-48 text-brand-600" />
                        </div>

                        <div className="relative z-10 h-full flex flex-col items-start">
                            <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                                <MessageSquareText className="w-6 h-6" />
                            </div>

                            <h3 className="text-xl font-bold text-slate-900 mb-2">AI Agents</h3>
                            <p className="text-slate-500 text-sm mb-6 max-w-xs leading-relaxed">
                                Interact with your data using specialized AI agents. Run analysis, generate reports, and get answers.
                            </p>

                            <span className="mt-auto inline-flex items-center text-sm text-brand-600 font-bold group-hover:gap-2 transition-all">
                                Launch Chat <ArrowRight className="w-3.5 h-3.5 ml-1" />
                            </span>
                        </div>
                    </div>

                    {/* Data Insights Card */}
                    <div
                        onClick={() => onNavigate('DATA_INSIGHTS')}
                        className="group relative bg-white rounded-2xl p-6 border border-slate-200 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-brand-900/5 transition-all duration-300 cursor-pointer overflow-hidden min-h-[240px] md:col-span-2"
                    >
                        <div className="absolute top-5 right-5 z-20">
                            <span className="inline-flex items-center rounded-full bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
                                ⚠️ Experimental
                            </span>
                        </div>
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                            <PieChart className="w-48 h-48 text-brand-600" />
                        </div>

                        <div className="relative z-10 h-full flex flex-col items-start">
                            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                                <PieChart className="w-6 h-6" />
                            </div>

                            <h3 className="text-xl font-bold text-slate-900 mb-2">Data Insights</h3>
                            <p className="text-slate-500 text-sm mb-6 max-w-xs leading-relaxed">
                                Explore quick insights, summaries, and visualizations from your connected data.
                            </p>

                            <span className="mt-auto inline-flex items-center text-sm text-emerald-700 font-bold group-hover:gap-2 transition-all">
                                Open Insights <ArrowRight className="w-3.5 h-3.5 ml-1" />
                            </span>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};