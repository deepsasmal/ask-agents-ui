import React from 'react';
import { Bot, Globe, Newspaper, Sparkles, ArrowRight, BrainCircuit, ScanText, Megaphone } from 'lucide-react';

export const AgentsModule: React.FC = () => {
    return (
        <div className="h-full flex flex-col bg-[#f8fafc] relative overflow-hidden">
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
            </div>

            {/* Module Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl sticky top-0 z-40 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center shadow-sm">
                            <Bot className="w-5 h-5 text-brand-600" />
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg font-bold text-slate-900 leading-tight tracking-tight">AI Agents</h1>
                                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-brand-50 border border-brand-100 text-brand-700">
                                    <Sparkles className="w-3 h-3" />
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider">Coming Soon</span>
                                </div>
                            </div>
                            <p className="text-xs text-slate-500 font-medium">Select an autonomous agent to perform specialized tasks</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-8 z-10 relative">
                <div className="max-w-5xl mx-auto w-full">
                    <div className="mb-10">
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Available Agents</h1>
                        <p className="text-slate-500 mt-2">
                            Automate the hard work by hiring your own agentic workforce.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Web Scraper Agent */}
                        <div className="relative rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-slate-50/80 to-white shadow-sm overflow-hidden min-h-[320px] cursor-not-allowed group">
                            {/* Disabled overlay */}
                            <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-10" />

                            {/* Coming soon ribbon */}
                            <div className="absolute top-4 right-4 z-20">
                                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full shadow-sm">
                                    Coming Soon
                                </div>
                            </div>

                            <div className="p-8 relative">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-slate-100 border-2 border-slate-200 flex items-center justify-center text-slate-400 shadow-sm">
                                        <Globe className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <div className="text-xl font-extrabold text-slate-600">Web Scraper Agent</div>
                                        <div className="text-sm text-slate-400">Extract structured data from any website</div>
                                    </div>
                                </div>

                                <ul className="mt-8 space-y-4 text-sm text-slate-500">
                                    <li className="flex items-center gap-4">
                                        <span className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                                            <BrainCircuit className="w-5 h-5 text-slate-400" />
                                        </span>
                                        <span className="font-medium">URL-to-Graph conversion</span>
                                    </li>
                                    <li className="flex items-center gap-4">
                                        <span className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                                            <ScanText className="w-5 h-5 text-slate-400" />
                                        </span>
                                        <span className="font-medium">Automatic schema mapping</span>
                                    </li>
                                </ul>

                                <div className="mt-10 flex items-center justify-between">
                                    <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                                        <Globe className="w-4 h-4" />
                                        Real-time scraping
                                    </div>
                                    <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-200 text-slate-400 text-sm font-bold border border-slate-300">
                                        Configure Agent
                                        <ArrowRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Ai News Aggregator Agent */}
                        <div className="relative rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-slate-50/80 to-white shadow-sm overflow-hidden min-h-[320px] cursor-not-allowed group">
                            {/* Disabled overlay */}
                            <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-10" />

                            {/* Coming soon ribbon */}
                            <div className="absolute top-4 right-4 z-20">
                                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full shadow-sm">
                                    Coming Soon
                                </div>
                            </div>

                            <div className="p-8 relative">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-slate-100 border-2 border-slate-200 flex items-center justify-center text-slate-400 shadow-sm">
                                        <Newspaper className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <div className="text-xl font-extrabold text-slate-600">AI News Aggregator</div>
                                        <div className="text-sm text-slate-400">Keep your graph updated with latest trends</div>
                                    </div>
                                </div>

                                <ul className="mt-8 space-y-4 text-sm text-slate-500">
                                    <li className="flex items-center gap-4">
                                        <span className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                                            <BrainCircuit className="w-5 h-5 text-slate-400" />
                                        </span>
                                        <span className="font-medium">Trend & event extraction</span>
                                    </li>
                                    <li className="flex items-center gap-4">
                                        <span className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                                            <ScanText className="w-5 h-5 text-slate-400" />
                                        </span>
                                        <span className="font-medium">Automated knowledge updates</span>
                                    </li>
                                </ul>

                                <div className="mt-10 flex items-center justify-between">
                                    <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                                        <Newspaper className="w-4 h-4" />
                                        Continuous monitoring
                                    </div>
                                    <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-200 text-slate-400 text-sm font-bold border border-slate-300">
                                        Configure Agent
                                        <ArrowRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Marketing Campaign Agent */}
                        <div className="relative rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-slate-50/80 to-white shadow-sm overflow-hidden min-h-[320px] cursor-not-allowed group">
                            {/* Disabled overlay */}
                            <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-10" />

                            {/* Coming soon ribbon */}
                            <div className="absolute top-4 right-4 z-20">
                                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full shadow-sm">
                                    Coming Soon
                                </div>
                            </div>

                            <div className="p-8 relative">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-slate-100 border-2 border-slate-200 flex items-center justify-center text-slate-400 shadow-sm">
                                        <Megaphone className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <div className="text-xl font-extrabold text-slate-600">Marketing Campaign Agent</div>
                                        <div className="text-sm text-slate-400">Generate and optimize personalized campaigns</div>
                                    </div>
                                </div>

                                <ul className="mt-8 space-y-4 text-sm text-slate-500">
                                    <li className="flex items-center gap-4">
                                        <span className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                                            <BrainCircuit className="w-5 h-5 text-slate-400" />
                                        </span>
                                        <span className="font-medium">Audience persona generation</span>
                                    </li>
                                    <li className="flex items-center gap-4">
                                        <span className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                                            <ScanText className="w-5 h-5 text-slate-400" />
                                        </span>
                                        <span className="font-medium">Multi-channel content strategy</span>
                                    </li>
                                </ul>

                                <div className="mt-10 flex items-center justify-between">
                                    <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                                        <Megaphone className="w-4 h-4" />
                                        Automated ROI tracking
                                    </div>
                                    <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-200 text-slate-400 text-sm font-bold border border-slate-300">
                                        Configure Agent
                                        <ArrowRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
