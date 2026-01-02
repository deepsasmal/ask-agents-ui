import React from 'react';
import { Network, MessageSquareText, ArrowRight, Sparkles, Bot, Database, PieChart } from 'lucide-react';
import { Button } from '../ui/Common';

interface LandingPageProps {
    onNavigate: (module: 'GRAPH_BUILDER' | 'CHAT' | 'DATA_INSIGHTS') => void;
}

export const LandingPageModule: React.FC<LandingPageProps> = ({ onNavigate }) => {
    return (
        <div className="flex-1 h-full overflow-y-auto bg-[#f8fafc] custom-scrollbar flex flex-col">
            <style>
                {`
                  @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-15px); }
                  }
                  @keyframes float {
                    0%, 100% { transform: translate(0, 0); }
                    50% { transform: translate(10px, -15px); }
                  }
                  @keyframes float-reverse {
                    0%, 100% { transform: translate(0, 0); }
                    50% { transform: translate(-10px, 15px); }
                  }
                  @keyframes dash {
                    to { stroke-dashoffset: -20; }
                  }
                  .animate-bounce-slow {
                    animation: bounce-slow 4s ease-in-out infinite;
                  }
                  .animate-float {
                    animation: float 6s ease-in-out infinite;
                  }
                  .animate-float-reverse {
                    animation: float-reverse 7s ease-in-out infinite;
                  }
                  .animate-dash {
                    animation: dash 2s linear infinite;
                  }
                `}
            </style>
            {/* Hero Section */}
            <div className="relative overflow-hidden pt-12 pb-16 px-6 shrink-0">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-brand-50/50 rounded-full blur-3xl -z-10" />

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-brand-100 shadow-sm text-brand-700 text-[10px] font-bold uppercase tracking-wider mb-6">
                        <Sparkles className="w-3 h-3" />
                        <span>The Future of Data Interaction</span>
                    </div>

                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 tracking-tight mb-6">
                        Ask <span className="text-brand-600">Agents</span>
                    </h1>

                    <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed mb-10">
                        Build semantic knowledge graphs and query enterprise data using AI agents.
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
                            leftIcon={<Network className="w-4 h-4" />}
                            className="px-8 py-3 h-auto text-base bg-blue-50/50 border-blue-100/50 text-blue-700 hover:bg-blue-100/80 transition-all duration-300"
                        >
                            Build Graph
                        </Button>
                    </div>
                </div>

                {/* Hero Illustration - Positioned as Background Decoration */}
                <div className="hidden lg:block absolute top-1/2 right-[5%] -translate-y-1/2 w-[400px] h-[400px] pointer-events-none opacity-40 select-none overflow-visible">
                    <div className="absolute inset-0 flex items-center justify-center scale-90 origin-right">
                        {/* Central Hub */}
                        <div className="relative z-20 w-20 h-20 rounded-2xl bg-white border-2 border-brand-200 shadow-2xl flex items-center justify-center animate-bounce-slow">
                            <Bot className="w-10 h-10 text-brand-600" />
                            <div className="absolute -inset-4 bg-brand-500/10 rounded-full blur-2xl animate-pulse" />
                        </div>

                        {/* Floating Orbitals */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full">
                            {/* Orbital 1 */}
                            <div className="absolute top-0 right-1/4 p-3 rounded-xl bg-white border border-slate-200 shadow-lg animate-float" style={{ animationDelay: '0.2s' }}>
                                <Database className="w-5 h-5 text-blue-500" />
                            </div>
                            {/* Orbital 2 */}
                            <div className="absolute bottom-1/4 -left-4 p-3 rounded-xl bg-white border border-slate-200 shadow-lg animate-float-reverse" style={{ animationDelay: '0.5s' }}>
                                <PieChart className="w-5 h-5 text-emerald-500" />
                            </div>
                            {/* Orbital 3 */}
                            <div className="absolute top-1/3 -right-8 p-3 rounded-xl bg-white border border-slate-200 shadow-lg animate-float" style={{ animationDelay: '1s' }}>
                                <Network className="w-5 h-5 text-indigo-500" />
                            </div>

                            {/* Connection Lines */}
                            <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 400 400">
                                <defs>
                                    <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#10b981" />
                                        <stop offset="100%" stopColor="#6366f1" />
                                    </linearGradient>
                                </defs>
                                <path d="M200,200 L300,100" stroke="url(#lineGrad)" strokeWidth="1.5" strokeDasharray="4 4" className="animate-dash" />
                                <path d="M200,200 L100,300" stroke="url(#lineGrad)" strokeWidth="1.5" strokeDasharray="4 4" className="animate-dash" style={{ animationDirection: 'reverse' }} />
                                <path d="M200,200 L350,200" stroke="url(#lineGrad)" strokeWidth="1.5" strokeDasharray="4 4" className="animate-dash" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Feature Cards */}
            <div className="max-w-5xl mx-auto px-6 pb-20 w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

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
                                <Database className="w-6 h-6" strokeWidth={2} />
                            </div>

                            <h3 className="text-xl font-bold text-slate-900 mb-2">Graph Builder</h3>
                            <p className="text-slate-500 text-sm mb-6 max-w-xs leading-relaxed">
                                Transform relational databases into semantic knowledge graphs. Define ontologies and visualize connections.
                            </p>

                            <span className="mt-auto inline-flex items-center text-sm text-blue-600 font-bold group-hover:gap-2 transition-all">
                                Open Builder <ArrowRight className="w-3.5 h-3.5 ml-1" strokeWidth={2.5} />
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
                                <MessageSquareText className="w-6 h-6" strokeWidth={2} />
                            </div>

                            <h3 className="text-xl font-bold text-slate-900 mb-2">Chat</h3>
                            <p className="text-slate-500 text-sm mb-6 max-w-xs leading-relaxed">
                                Interact with your data using specialized AI agents. Run analysis, generate reports, and get answers.
                            </p>

                            <span className="mt-auto inline-flex items-center text-sm text-brand-600 font-bold group-hover:gap-2 transition-all">
                                Open Chat <ArrowRight className="w-3.5 h-3.5 ml-1" strokeWidth={2.5} />
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
                                <PieChart className="w-6 h-6" strokeWidth={2} />
                            </div>

                            <h3 className="text-xl font-bold text-slate-900 mb-2">Data Insights</h3>
                            <p className="text-slate-500 text-sm mb-6 max-w-xs leading-relaxed">
                                Explore quick insights, summaries, and visualizations from your connected data.
                            </p>

                            <span className="mt-auto inline-flex items-center text-sm text-emerald-700 font-bold group-hover:gap-2 transition-all">
                                Open Insights <ArrowRight className="w-3.5 h-3.5 ml-1" strokeWidth={2.5} />
                            </span>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};