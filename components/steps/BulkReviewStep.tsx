import React, { useState } from 'react';
import { ArrowLeft, Rocket, CheckCircle, FileJson, Building2, Layers, Check, Sparkles, Network, Box, Link2, AlertTriangle } from 'lucide-react';
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
    description: string;
    domain?: string;
    uploadedFile: UploadedFileInfo | null;
    onBack: () => void;
    onComplete: () => void;
    isSuccess?: boolean;
}

export const BulkReviewStep: React.FC<BulkReviewStepProps> = ({
    orgName,
    projectName,
    description,
    domain,
    uploadedFile,
    onBack,
    onComplete,
    isSuccess = false
}) => {
    const [isImporting, setIsImporting] = useState(false);

    // Parse schema statistics from uploaded file
    const getSchemaStats = () => {
        if (!uploadedFile?.content || typeof uploadedFile.content !== 'object') {
            return { nodes: 0, edges: 0, properties: 0 };
        }

        const content = uploadedFile.content as Record<string, unknown>;

        // Try to detect common schema structures
        const nodes = Array.isArray(content.nodes) ? content.nodes.length :
            Array.isArray(content.entities) ? content.entities.length :
                Array.isArray(content.vertices) ? content.vertices.length : 0;

        const edges = Array.isArray(content.edges) ? content.edges.length :
            Array.isArray(content.relationships) ? content.relationships.length :
                Array.isArray(content.links) ? content.links.length : 0;

        // Count total properties
        let properties = 0;
        if (Array.isArray(content.nodes)) {
            properties = content.nodes.reduce((acc: number, node: unknown) => {
                if (typeof node === 'object' && node !== null) {
                    return acc + Object.keys(node).length;
                }
                return acc;
            }, 0);
        }

        return { nodes, edges, properties };
    };

    const stats = getSchemaStats();

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleImport = async () => {
        setIsImporting(true);
        // Simulate import process - no API calls as requested
        await new Promise(resolve => setTimeout(resolve, 2000));
        setIsImporting(false);
        onComplete();
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
                    Your graph schema has been imported with {stats.nodes} nodes and {stats.edges} relationships.
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
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="shadow-sm border-slate-200 bg-white/50" noPadding>
                        <div className="flex flex-col items-center text-center p-4">
                            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                                <Box className="w-6 h-6" />
                            </div>
                            <span className="text-3xl font-bold text-slate-900">{stats.nodes}</span>
                            <span className="text-sm font-medium text-slate-500">Nodes Detected</span>
                        </div>
                    </Card>

                    <Card className="shadow-sm border-slate-200 bg-white/50" noPadding>
                        <div className="flex flex-col items-center text-center p-4">
                            <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                                <Link2 className="w-6 h-6" />
                            </div>
                            <span className="text-3xl font-bold text-slate-900">{stats.edges}</span>
                            <span className="text-sm font-medium text-slate-500">Relationships</span>
                        </div>
                    </Card>

                    <Card className="shadow-sm border-slate-200 bg-white/50" noPadding>
                        <div className="flex flex-col items-center text-center p-4">
                            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                                <Layers className="w-6 h-6" />
                            </div>
                            <span className="text-3xl font-bold text-slate-900">{stats.properties}</span>
                            <span className="text-sm font-medium text-slate-500">Properties</span>
                        </div>
                    </Card>
                </div>

                {/* Configuration Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Organization Details */}
                    <Card className="shadow-supreme border-0" noPadding>
                        <div className="flex items-center gap-4 border-b border-slate-100 p-4">
                            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
                                <Building2 className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Organization</h3>
                                <p className="text-sm text-slate-500">Project configuration</p>
                            </div>
                        </div>

                        <div className="p-4 space-y-3">
                            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                                <span className="text-sm text-slate-500">Organization</span>
                                <span className="text-sm font-bold text-slate-900">{orgName || 'Not specified'}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                                <span className="text-sm text-slate-500">Project</span>
                                <span className="text-sm font-bold text-slate-900">{projectName || 'Not specified'}</span>
                            </div>
                            {domain && (
                                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                                    <span className="text-sm text-slate-500">Domain</span>
                                    <span className="text-sm font-bold text-slate-900">{domain}</span>
                                </div>
                            )}
                            {description && (
                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                    <span className="text-sm text-slate-500 block mb-1">Description</span>
                                    <span className="text-sm text-slate-700">{description}</span>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* File Details */}
                    <Card className="shadow-supreme border-0" noPadding>
                        <div className="flex items-center gap-4 border-b border-slate-100 p-4">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                                <FileJson className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Uploaded File</h3>
                                <p className="text-sm text-slate-500">Schema definition</p>
                            </div>
                        </div>

                        <div className="p-4 space-y-3">
                            {uploadedFile ? (
                                <>
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                                        <span className="text-sm text-slate-500">File Name</span>
                                        <span className="text-sm font-bold text-slate-900 truncate max-w-[200px]">{uploadedFile.name}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                                        <span className="text-sm text-slate-500">File Size</span>
                                        <span className="text-sm font-bold text-slate-900">{formatFileSize(uploadedFile.size)}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                                        <span className="text-sm text-slate-500">Format</span>
                                        <span className="text-sm font-bold text-slate-900">JSON</span>
                                    </div>

                                    {/* Validation Status */}
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-brand-50 border border-brand-100">
                                        <CheckCircle className="w-5 h-5 text-brand-600" />
                                        <span className="text-sm font-medium text-brand-700">Schema validated successfully</span>
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100">
                                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                                    <span className="text-sm font-medium text-amber-700">No file uploaded</span>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Ready to Import */}
                <Card className="shadow-supreme border-0 bg-gradient-to-br from-brand-600 to-brand-700 text-white overflow-hidden relative" noPadding>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                    <div className="relative p-8 flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-bold mb-2">Ready to Import?</h3>
                            <p className="text-brand-100 max-w-md">This will create the knowledge graph structure from your uploaded schema. The process may take a few moments.</p>
                        </div>
                        <div className="hidden md:block">
                            <Network className="w-16 h-16 text-white/20" />
                        </div>
                    </div>
                </Card>
            </div>

            <div className="flex justify-between pt-6 pb-6">
                <Button variant="ghost" onClick={onBack} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                    Back
                </Button>
                <Button
                    onClick={handleImport}
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
