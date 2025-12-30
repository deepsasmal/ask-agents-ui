import React, { useState, useRef, useCallback } from 'react';
import { ArrowRight, ArrowLeft, Upload, FileJson, FileCheck2, X, CloudUpload, AlertCircle, Sparkles } from 'lucide-react';
import { Button, Card } from '../ui/Common';
import { toast } from 'react-toastify';

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
                <div className="lg:col-span-5 flex flex-col min-w-0">
                    <Card className="shadow-supreme border-0 flex flex-col flex-1" noPadding>
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-brand-600" />
                                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Required JSON Structure</h3>
                            </div>
                            <button
                                onClick={() => {
                                    const sample = {
                                        "database": "db_name",
                                        "description": "General description",
                                        "tables": [{
                                            "name": "table_name",
                                            "description": "Table description",
                                            "columns": [{
                                                "name": "id",
                                                "description": "Primary key",
                                                "properties": { "type": "integer", "is_primary_key": true }
                                            }]
                                        }]
                                    };
                                    navigator.clipboard.writeText(JSON.stringify(sample, null, 2));
                                    toast.success('Sample copied to clipboard!');
                                }}
                                className="text-[10px] font-bold text-brand-600 hover:text-brand-700 uppercase flex items-center gap-1 transition-colors"
                            >
                                Copy Sample
                            </button>
                        </div>

                        <div className="p-4 flex-1 overflow-hidden flex flex-col">
                            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                                Ensure your JSON file follows this structure for a successful import. Each table must define its columns and their metadata.
                            </p>

                            <div className="relative flex-1 min-h-[300px] bg-slate-900 rounded-xl border border-slate-800 shadow-inner group overflow-hidden">
                                {/* Code Header */}
                                <div className="absolute top-0 inset-x-0 h-6 bg-slate-800/50 backdrop-blur-sm border-b border-white/5 flex items-center px-3 justify-between z-10">
                                    <div className="flex gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-red-500/50" />
                                        <div className="w-2 h-2 rounded-full bg-amber-500/50" />
                                        <div className="w-2 h-2 rounded-full bg-emerald-500/50" />
                                    </div>
                                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">schema.json</span>
                                </div>

                                <div className="absolute inset-x-0 top-6 bottom-0 p-4 font-mono text-[10px] sm:text-[11px] overflow-y-auto custom-scrollbar-dark leading-normal">
                                    <pre className="text-slate-300">
                                        {`{
  "database": "my_db",
  "description": "Source metadata",
  "tables": [
    {
      "name": "products",
      "description": "Catalog of items...",
      "columns": [
        {
          "name": "id",
          "description": "Main identifier",
          "properties": {
            "type": "integer",
            "is_primary_key": true
          }
        },
        {
          "name": "name",
          "description": "Item name",
          "properties": {
            "type": "varchar"
          }
        }
      ]
    }
  ]
}`}
                                    </pre>
                                </div>

                                <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none" />
                            </div>

                            <div className="mt-4 space-y-2">
                                <div className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                                    <p className="text-[11px] text-slate-600 font-medium leading-tight">
                                        <span className="text-slate-900 font-bold uppercase text-[9px]">Properties:</span> Define data types, primary keys, and foreign keys.
                                    </p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                                    <p className="text-[11px] text-slate-600 font-medium leading-tight">
                                        <span className="text-slate-900 font-bold uppercase text-[9px]">Meta:</span> Accurate descriptions improve AI model performance.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};
