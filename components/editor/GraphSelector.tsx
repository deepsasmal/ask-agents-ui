import React, { useState, useEffect } from 'react';
import { Loader2, FolderOpen, Calendar, ArrowRight, LayoutGrid, List as ListIcon, Search, Database } from 'lucide-react';
import { authApi, graphApi, GraphMetadataSummary } from '../../services/api';
import { Card, Button } from '../ui/Common';
import { toast } from 'react-toastify';

interface GraphSelectorProps {
    onSelect: (graphId: string, graphName: string, orgId: string) => void;
}

export const GraphSelector: React.FC<GraphSelectorProps> = ({ onSelect }) => {
    const [graphs, setGraphs] = useState<GraphMetadataSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const fetchedRef = React.useRef(false);

    useEffect(() => {
        const fetchGraphs = async () => {
            if (fetchedRef.current) return;
            fetchedRef.current = true;

            try {
                const email = authApi.getUserEmail();
                if (!email) {
                    setIsLoading(false);
                    return;
                }
                const response = await graphApi.fetchGraphsByEmail(email);
                setGraphs(response.records || []);
            } catch (error) {
                console.error("Failed to fetch graphs", error);
                toast.error("Failed to load your graphs. Please try again.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchGraphs();
    }, []);

    const filteredGraphs = graphs.filter(g =>
        g.schema_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.org_id?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Unknown date';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 animate-fade-in">
                <Loader2 className="w-10 h-10 text-brand-600 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Loading your graphs...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-50/50 p-6 md:p-10 overflow-hidden">
            <div className="max-w-6xl mx-auto w-full flex flex-col h-full">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 shrink-0">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                            <div className="p-2 bg-brand-100 rounded-lg text-brand-600">
                                <FolderOpen className="w-6 h-6" />
                            </div>
                            Select Knowledge Graph
                        </h1>
                        <p className="text-slate-500 mt-1 ml-14">Choose a graph to edit or visualize.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search graphs..."
                                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm w-64"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-brand-50 text-brand-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-brand-50 text-brand-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <ListIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                {filteredGraphs.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-slate-200 rounded-2xl bg-white/50">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 ring-1 ring-slate-100">
                            <Database className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">No graphs found</h3>
                        <p className="text-slate-500 max-w-md mb-6">
                            {searchQuery ? `No graphs matching "${searchQuery}" found.` : "You haven't created any knowledge graphs yet."}
                        </p>
                        {/* Optionally add a 'Create Graph' button if there's a flow for it */}
                    </div>
                ) : (
                    <div className={`flex-1 overflow-y-auto custom-scrollbar pb-6 ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5' : 'flex flex-col gap-3'}`}>
                        {filteredGraphs.map(graph => (
                            <div
                                key={graph.id}
                                onClick={() => onSelect(graph.id, graph.schema_name || 'Untitled Graph', graph.org_id)}
                                className={`
                                    group bg-white border border-slate-200 hover:border-brand-300 hover:shadow-brand-500/10 hover:shadow-lg transition-all cursor-pointer overflow-hidden relative
                                    ${viewMode === 'grid' ? 'rounded-2xl flex flex-col p-5' : 'rounded-xl flex items-center p-4 gap-6'}
                                `}
                            >
                                <div className={`flex items-start justify-between ${viewMode === 'grid' ? 'mb-4' : 'flex-1'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-50 to-white border border-brand-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-sm">
                                            <Database className="w-5 h-5 text-brand-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 group-hover:text-brand-700 transition-colors line-clamp-1">{graph.schema_name}</h3>
                                            <p className="text-xs text-slate-500 font-mono mt-0.5 opacity-70 group-hover:opacity-100 transition-opacity">ID: {graph.id.substring(0, 8)}...</p>
                                        </div>
                                    </div>

                                    {viewMode === 'grid' && (
                                        <span className="px-2 py-1 rounded-md bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider border border-slate-100">
                                            Active
                                        </span>
                                    )}
                                </div>

                                <div className={`flex items-center gap-4 text-xs text-slate-400 ${viewMode === 'grid' ? 'mt-auto pt-4 border-t border-slate-50' : ''}`}>
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>Updated {formatDate(graph.updated_at || graph.created_at)}</span>
                                    </div>
                                    <div className="flex ml-auto items-center gap-1.5 text-brand-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0 duration-300">
                                        Open Graph
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
