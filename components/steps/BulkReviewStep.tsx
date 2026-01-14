import React, { useState } from 'react';
import { ArrowLeft, Rocket, CheckCircle, Database, FileText, Check, Settings2, Search, BrainCircuit, Layers } from 'lucide-react';
import { Button, Card } from '../ui/Common';

interface UploadedFileInfo {
    name: string;
    size: number;
    type: string;
    content: unknown;
    lastModified: number;
}

interface BulkReviewStepProps {
    orgName: string;
    projectName: string;
    uploadedFile: UploadedFileInfo | null;
    onBack: () => void;
    onBuild: (options: { enableTextIndexing: boolean; enableVectorSearch: boolean }) => Promise<void>;
    isSuccess?: boolean;
}

export const BulkReviewStep: React.FC<BulkReviewStepProps> = ({
    orgName,
    projectName,
    uploadedFile,
    onBack,
    onBuild,
    isSuccess = false
}) => {
    const [isImporting, setIsImporting] = useState(false);
    const [enableTextIndexing, setEnableTextIndexing] = useState(true);
    const [enableVectorSearch, setEnableVectorSearch] = useState(false);

    // Parse schema statistics from uploaded file
    const getSchemaStats = () => {
        if (!uploadedFile?.content || typeof uploadedFile.content !== 'object') {
            return { tables: 0, columns: 0 };
        }

        const content = uploadedFile.content as any;

        let tables = 0;
        let columns = 0;

        if (Array.isArray(content.tables)) {
            tables = content.tables.length;
            columns = content.tables.reduce((acc: number, table: any) => {
                if (Array.isArray(table.columns)) {
                    return acc + table.columns.length;
                }
                return acc;
            }, 0);
        }

        return { tables, columns };
    };

    const stats = getSchemaStats();

    const handleBuildClick = async () => {
        setIsImporting(true);
        try {
            await onBuild({
                enableTextIndexing,
                enableVectorSearch
            });
        } finally {
            setIsImporting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="h-full min-h-0 w-full flex flex-col items-center justify-center text-center animate-fade-in py-10">
                <div className="relative mb-8">
                    <div className="absolute inset-0 bg-brand-500 blur-2xl opacity-20 rounded-full animate-pulse-slow"></div>
                    <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center text-brand-600 shadow-2xl shadow-brand-200 border-[6px] border-brand-50 relative z-10">
                        <Check className="w-16 h-16 stroke-[3]" />
                    </div>
                </div>

                <h2 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">Import Successful!</h2>
                <p className="text-xl text-slate-500 max-w-lg mx-auto mb-10">
                    Your graph schema has been imported with {stats.tables} tables and {stats.columns} columns.
                </p>

                <Button onClick={() => window.location.reload()} size="lg" className="px-10 shadow-brand-600/30">
                    Back to Home
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-full w-full flex flex-col animate-fade-in">
            <div className="mb-6 shrink-0">
                <h2 className="text-3xl font-bold text-slate-900">Review & Import</h2>
                <p className="text-slate-500 mt-1">Review your configuration before importing the graph schema.</p>
            </div>

            <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="shadow-sm border-slate-200 bg-white/50" noPadding>
                        <div className="flex flex-col items-center text-center p-4">
                            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                                <Database className="w-6 h-6" />
                            </div>
                            <span className="text-3xl font-bold text-slate-900">{stats.tables}</span>
                            <span className="text-sm font-medium text-slate-500">Tables Detected</span>
                        </div>
                    </Card>

                    <Card className="shadow-sm border-slate-200 bg-white/50" noPadding>
                        <div className="flex flex-col items-center text-center p-4">
                            <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                                <Layers className="w-6 h-6" />
                            </div>
                            <span className="text-3xl font-bold text-slate-900">{stats.columns}</span>
                            <span className="text-sm font-medium text-slate-500">Columns Detected</span>
                        </div>
                    </Card>

                    <Card className="shadow-sm border-slate-200 bg-white/50" noPadding>
                        <div className="flex flex-col items-center text-center p-4">
                            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                                <FileText className="w-6 h-6" />
                            </div>
                            <span className="text-xl font-bold text-slate-900 truncate max-w-full px-2">{projectName?.replace(/\s+/g, '_').toLowerCase() || 'default_schema'}</span>
                            <span className="text-sm font-medium text-slate-500">Target Schema</span>
                        </div>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="shadow-supreme border-0" noPadding>
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
                                    <p className="text-sm text-slate-500">Creates full-text search indexes on name and description fields for faster keyword lookup.</p>
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

                    <Card className="shadow-supreme border-0 bg-gradient-to-br from-brand-600 to-brand-700 text-white overflow-hidden relative" noPadding>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                        <div className="relative p-8 flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-bold mb-2">Ready to Import?</h3>
                                <p className="text-brand-100 max-w-md">This will create the knowledge graph structure from your uploaded schema. The process may take a few moments.</p>
                            </div>
                            <div className="hidden md:block">
                                <Rocket className="w-16 h-16 text-white/20 rotate-45" />
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            <div className="flex justify-between pt-6 pb-6">
                <Button variant="ghost" onClick={onBack} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                    Back
                </Button>
                <Button
                    onClick={handleBuildClick}
                    isLoading={isImporting}
                    disabled={!uploadedFile}
                    rightIcon={<Rocket className="w-4 h-4" />}
                    size="lg"
                    className="px-10 shadow-brand-600/30 bg-brand-600 hover:bg-brand-500 text-white"
                >
                    {isImporting ? 'Importing...' : 'Import Schema'}
                </Button>
            </div>
        </div>
    );
};
