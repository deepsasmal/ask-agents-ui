import React, { useState, useRef, useCallback } from 'react';
import { ArrowRight, ArrowLeft, Upload, FileJson, FileCheck2, X, CloudUpload, AlertCircle, Sparkles } from 'lucide-react';
import { Button, Card } from '../ui/Common';

interface UploadedFileInfo {
    name: string;
    size: number;
    type: string;
    content: unknown;
    lastModified: number;
}

interface BulkUploadStepProps {
    uploadedFile: UploadedFileInfo | null;
    onFileUpload: (file: UploadedFileInfo | null) => void;
    onNext: () => void;
    onBack: () => void;
}

export const BulkUploadStep: React.FC<BulkUploadStepProps> = ({
    uploadedFile,
    onFileUpload,
    onNext,
    onBack
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const processFile = useCallback(async (file: File) => {
        setIsProcessing(true);
        setError(null);

        // Validate file type
        if (!file.name.toLowerCase().endsWith('.json')) {
            setError('Please upload a valid JSON file.');
            setIsProcessing(false);
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            setError('File size must be less than 10MB.');
            setIsProcessing(false);
            return;
        }

        try {
            const text = await file.text();
            const content = JSON.parse(text);

            onFileUpload({
                name: file.name,
                size: file.size,
                type: file.type || 'application/json',
                content,
                lastModified: file.lastModified
            });
        } catch (err) {
            setError('Invalid JSON format. Please check your file.');
        } finally {
            setIsProcessing(false);
        }
    }, [onFileUpload]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            processFile(files[0]);
        }
    }, [processFile]);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            processFile(files[0]);
        }
        // Reset input value to allow re-selecting the same file
        e.target.value = '';
    }, [processFile]);

    const handleRemoveFile = useCallback(() => {
        onFileUpload(null);
        setError(null);
    }, [onFileUpload]);

    const handleBrowseClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="w-full flex flex-col animate-fade-in">
            {/* Header Section */}
            <div className="mb-4 shrink-0">
                <h2 className="text-xl font-bold text-slate-900 mb-1">Upload JSON Schema</h2>
                <p className="text-slate-500 text-sm">Upload your graph schema definition in JSON format to bulk import your knowledge graph structure.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Left Upload Section */}
                <div className="lg:col-span-7 flex flex-col">
                    <Card className="shadow-supreme border-0 flex flex-col" noPadding>
                        <div className="p-4 space-y-4">
                            {/* Hidden file input */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".json,application/json"
                                onChange={handleFileSelect}
                                className="hidden"
                            />

                            {/* Upload Area */}
                            {!uploadedFile ? (
                                <div
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onClick={handleBrowseClick}
                                    className={`
                    relative min-h-[280px] rounded-2xl border-2 border-dashed cursor-pointer
                    transition-all duration-300 flex flex-col items-center justify-center p-8
                    ${isDragging
                                            ? 'border-brand-500 bg-brand-50/50 scale-[1.01]'
                                            : 'border-slate-200 hover:border-brand-300 hover:bg-brand-50/30 bg-slate-50/50'
                                        }
                    ${isProcessing ? 'pointer-events-none opacity-70' : ''}
                  `}
                                >
                                    {/* Animated Upload Icon */}
                                    <div className={`
                    relative mb-6 transition-transform duration-300
                    ${isDragging ? 'scale-110 -translate-y-1' : ''}
                  `}>
                                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 border-2 border-brand-200 flex items-center justify-center shadow-lg">
                                            {isProcessing ? (
                                                <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
                                            ) : (
                                                <CloudUpload className={`w-10 h-10 text-brand-600 transition-transform duration-300 ${isDragging ? '-translate-y-1' : ''}`} />
                                            )}
                                        </div>
                                        {/* Decorative corner elements */}
                                        <div className="absolute -top-2 -right-2 w-5 h-5 bg-brand-500 rounded-lg flex items-center justify-center shadow-md">
                                            <FileJson className="w-3 h-3 text-white" />
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                                        {isProcessing ? 'Processing...' : isDragging ? 'Drop your file here' : 'Drag & drop your JSON file'}
                                    </h3>
                                    <p className="text-sm text-slate-500 mb-4">
                                        or <span className="text-brand-600 font-semibold hover:underline">browse</span> to choose a file
                                    </p>

                                    {/* Supported format badge */}
                                    <div className="flex items-center gap-2 text-xs text-slate-400 bg-white/80 px-3 py-1.5 rounded-full border border-slate-100">
                                        <FileJson className="w-3.5 h-3.5" />
                                        <span>Supports .json files up to 10MB</span>
                                    </div>
                                </div>
                            ) : (
                                /* File Preview */
                                <div className="relative min-h-[280px] rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50/30 to-white p-6 flex flex-col">
                                    {/* Success Header */}
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 rounded-xl bg-brand-100 border-2 border-brand-200 flex items-center justify-center">
                                            <FileCheck2 className="w-6 h-6 text-brand-600" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-slate-900">File Uploaded</h3>
                                            <p className="text-sm text-slate-500">Ready for review</p>
                                        </div>
                                        <button
                                            onClick={handleRemoveFile}
                                            className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                                            title="Remove file"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* File Details Card */}
                                    <div className="flex-1 bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
                                        <div className="flex items-start gap-4">
                                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
                                                <FileJson className="w-7 h-7 text-amber-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-base font-bold text-slate-900 truncate mb-1">
                                                    {uploadedFile.name}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                                                    <span className="flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
                                                        {formatFileSize(uploadedFile.size)}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                                        JSON Format
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* JSON Preview snippet */}
                                        <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100 overflow-hidden">
                                            <pre className="text-xs text-slate-600 font-mono whitespace-pre-wrap break-all max-h-24 overflow-y-auto">
                                                {JSON.stringify(uploadedFile.content, null, 2).slice(0, 500)}
                                                {JSON.stringify(uploadedFile.content, null, 2).length > 500 && '...'}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Error Message */}
                            {error && (
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 animate-fade-in">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <span className="text-sm font-medium">{error}</span>
                                </div>
                            )}
                        </div>

                        <div className="px-4 pb-4 pt-2 flex justify-between">
                            <Button
                                variant="ghost"
                                onClick={onBack}
                                leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
                                size="sm"
                            >
                                Back
                            </Button>
                            <Button
                                onClick={onNext}
                                disabled={!uploadedFile}
                                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                                size="sm"
                                className="px-6 shadow-brand-600/30"
                            >
                                Review & Import
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* Right Sidebar Section */}
                <div className="lg:col-span-5 flex flex-col">
                    <div className="flex-1 min-h-[280px] lg:min-h-0 relative group">
                        {/* Decorative Background Effects */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-brand-200 to-brand-100 rounded-[2rem] blur opacity-40 group-hover:opacity-60 transition duration-1000 group-hover:duration-200" />
                        <div className="absolute top-10 -right-10 w-40 h-40 bg-brand-300/30 rounded-full blur-3xl" />
                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-300/30 rounded-full blur-3xl" />

                        <Card className="relative border-0 shadow-supreme ring-1 ring-white/50 backdrop-blur-md bg-white/90 overflow-hidden flex flex-col" noPadding>
                            {/* Visual Illustration Header */}
                            <div className="h-32 shrink-0 bg-gradient-to-br from-slate-50 to-brand-50/50 relative overflow-hidden flex items-center justify-center border-b border-slate-100">
                                {/* Animated pattern */}
                                <div className="absolute inset-0">
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] h-[240px] border border-brand-100/50 rounded-full" />
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160px] h-[160px] border border-brand-200/60 rounded-full animate-pulse-slow" />
                                </div>

                                <div className="relative z-10 flex flex-col items-center">
                                    <div className="w-12 h-12 bg-white rounded-xl shadow-xl shadow-brand-500/10 flex items-center justify-center ring-4 ring-white relative mb-2">
                                        <Upload className="w-6 h-6 text-brand-600" />
                                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-brand-500 rounded-full border-2 border-white" />
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 sm:p-6 space-y-5">
                                <div>
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">JSON Schema Format</h3>
                                    <p className="text-sm text-slate-600">
                                        Your JSON file should contain the graph schema definition with nodes, edges, and their properties.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-brand-600">
                                            <Sparkles className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Nodes & Entities</p>
                                            <p className="text-sm font-semibold text-slate-900 truncate">Define graph vertices</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-brand-600">
                                            <Sparkles className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Relationships</p>
                                            <p className="text-sm font-semibold text-slate-900 truncate">Define edge connections</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-brand-600">
                                            <Sparkles className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Properties</p>
                                            <p className="text-sm font-semibold text-slate-900 truncate">Metadata & attributes</p>
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
