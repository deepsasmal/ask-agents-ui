import React, { useEffect, useState, useRef, useCallback } from 'react';
import { BookOpen, Plus, ExternalLink, X, FileText, Globe, Type, Info, ChevronDown, ChevronUp, Trash2, Settings, Save, Check, AlertTriangle } from 'lucide-react';
import { configApi, ConfigResponse, knowledgeApi, KnowledgeItem } from '../../services/api';
import { KnowledgeTableSkeleton } from '../ui/ModuleSkeletons';

interface FileSettings {
    id: string;
    file?: File;
    url?: string;
    textContent?: string;
    name: string;
    description: string;
    reader: string;
    chunkerEnabled: boolean;
    chunkerType: string;
    chunkSize: number;
    chunkOverlap: number;
    metadata: { key: string; value: string }[];
    isExpanded: boolean;
    isSelected: boolean;
}

const FileItem: React.FC<{
    settings: FileSettings;
    onUpdate: (updates: Partial<FileSettings>) => void;
    onToggleSelect: () => void;
    onToggleExpand: () => void;
    onRemove: () => void;
    onAddMetadata: (key: string, value: string) => void;
    onRemoveMetadata: (index: number) => void;
}> = ({ settings, onUpdate, onToggleSelect, onToggleExpand, onRemove, onAddMetadata, onRemoveMetadata }) => {
    const [metaKey, setMetaKey] = useState('');
    const [metaValue, setMetaValue] = useState('');

    const handleAddMeta = () => {
        if (metaKey && metaValue) {
            onAddMetadata(metaKey, metaValue);
            setMetaKey('');
            setMetaValue('');
        }
    };

    return (
        <div className={`bg-white dark:bg-slate-900 rounded-lg border overflow-hidden text-left transition-colors ${settings.isSelected ? 'border-emerald-500/50 shadow-sm' : 'border-slate-200 dark:border-slate-700'}`}>
            <div
                className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                onClick={onToggleExpand}
            >
                <div onClick={(e) => e.stopPropagation()} className="flex items-center">
                    <input
                        type="checkbox"
                        checked={settings.isSelected}
                        onChange={onToggleSelect}
                        className="rounded border-slate-300 dark:border-slate-600 w-3.5 h-3.5 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                    />
                </div>
                <span
                    className="flex-1 font-medium text-slate-700 dark:text-slate-200 text-xs truncate cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-500 transition-colors"
                    onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}
                >
                    {settings.name}
                </span>
                <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="text-slate-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                </button>
                {settings.isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </div>

            {settings.isExpanded && (
                <div className="p-3 space-y-3 border-t border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-top-1">
                    <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <Type className="w-3 h-3" /> Name
                        </label>
                        <input
                            type="text"
                            value={settings.name}
                            onChange={(e) => onUpdate({ name: e.target.value })}
                            className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <FileText className="w-3 h-3" /> Description
                        </label>
                        <textarea
                            value={settings.description}
                            onChange={(e) => onUpdate({ description: e.target.value })}
                            placeholder="Enter description"
                            rows={2}
                            className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <Settings className="w-3 h-3" /> Reader
                        </label>
                        <select
                            value={settings.reader}
                            onChange={(e) => onUpdate({ reader: e.target.value })}
                            className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="TextReader">TextReader</option>
                            <option value="JsonReader">JsonReader</option>
                            <option value="MarkdownReader">MarkdownReader</option>
                        </select>
                    </div>

                    <div className="space-y-2 pt-1">
                        <div className="flex items-center gap-2">
                            <div
                                onClick={() => onUpdate({ chunkerEnabled: !settings.chunkerEnabled })}
                                className={`w-8 h-4 rounded-full flex items-center px-0.5 cursor-pointer transition-colors ${settings.chunkerEnabled ? 'bg-slate-900 dark:bg-white' : 'bg-slate-300 dark:bg-slate-600'}`}
                            >
                                <div className={`w-3 h-3 rounded-full bg-white dark:bg-slate-900 transform transition-transform ${settings.chunkerEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                            </div>
                            <span className="text-xs font-medium border-b border-dashed border-slate-400 dark:border-slate-500">Select Chunker Settings</span>
                        </div>

                        {settings.chunkerEnabled && (
                            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Chunker</label>
                                    <select
                                        value={settings.chunkerType}
                                        onChange={(e) => onUpdate({ chunkerType: e.target.value })}
                                        className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none"
                                    >
                                        <option value="FixedSizeChunker">FixedSizeChunker</option>
                                        <option value="AgenticChunker">AgenticChunker</option>
                                        <option value="DocumentChunker">DocumentChunker</option>
                                        <option value="RecursiveChunker">RecursiveChunker</option>
                                        <option value="SemanticChunker">SemanticChunker</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Chunk Size</label>
                                        <input
                                            type="number"
                                            value={settings.chunkSize}
                                            onChange={(e) => onUpdate({ chunkSize: parseInt(e.target.value) })}
                                            className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Chunk Overlap</label>
                                        <input
                                            type="number"
                                            value={settings.chunkOverlap}
                                            onChange={(e) => onUpdate({ chunkOverlap: parseInt(e.target.value) })}
                                            className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Info className="w-3 h-3" /> Metadata Optional
                        </label>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Key"
                                value={metaKey}
                                onChange={(e) => setMetaKey(e.target.value)}
                                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none"
                            />
                            <span className="self-center">=</span>
                            <input
                                type="text"
                                placeholder="Value"
                                value={metaValue}
                                onChange={(e) => setMetaValue(e.target.value)}
                                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none"
                            />
                            <button onClick={handleAddMeta} className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg">
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        {settings.metadata.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {settings.metadata.map((meta, idx) => (
                                    <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs">
                                        {meta.key} = {meta.value}
                                        <button onClick={() => onRemoveMetadata(idx)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

interface AddContentModalProps {
    isOpen: boolean;
    onClose: () => void;
    dbId: string;
    onUploaded: () => Promise<void> | void;
}

const AddContentModal: React.FC<AddContentModalProps> = ({ isOpen, onClose, dbId, onUploaded }) => {
    const [view, setView] = useState<'selection' | 'file' | 'web' | 'text'>('selection');
    const [files, setFiles] = useState<FileSettings[]>([]);
    const [urlInput, setUrlInput] = useState('');
    const [urlError, setUrlError] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    // Text View State
    const [textName, setTextName] = useState('');
    const [textDescription, setTextDescription] = useState('');
    const [textBody, setTextBody] = useState('');
    const [textChunkerEnabled, setTextChunkerEnabled] = useState(false);
    const [textChunkerType, setTextChunkerType] = useState('FixedSizeChunker');
    const [textChunkSize, setTextChunkSize] = useState(5000);
    const [textChunkOverlap, setTextChunkOverlap] = useState(0);
    const [textMetaKey, setTextMetaKey] = useState('');
    const [textMetaValue, setTextMetaValue] = useState('');
    const [textMetadata, setTextMetadata] = useState<{ key: string, value: string }[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset view when modal closes
    useEffect(() => {
        if (!isOpen) {
            setView('selection');
            setFiles([]);
            setUrlInput('');
            setUrlError('');
            resetTextForm();
            setIsSaving(false);
            setSaveError(null);
        }
    }, [isOpen]);

    const resetTextForm = () => {
        setTextName('');
        setTextDescription('');
        setTextBody('');
        setTextChunkerEnabled(false);
        setTextChunkerType('FixedSizeChunker');
        setTextChunkSize(5000);
        setTextChunkOverlap(0);
        setTextMetaKey('');
        setTextMetaValue('');
        setTextMetadata([]);
    };

    const handleTextAddMetadata = () => {
        if (textMetaKey && textMetaValue) {
            setTextMetadata([...textMetadata, { key: textMetaKey, value: textMetaValue }]);
            setTextMetaKey('');
            setTextMetaValue('');
        }
    };

    const handleTextRemoveMetadata = (index: number) => {
        const newMeta = [...textMetadata];
        newMeta.splice(index, 1);
        setTextMetadata(newMeta);
    };

    const handleTextAdd = () => {
        if (!textName || !textBody) return; // Basic validation

        const newFile: FileSettings = {
            id: crypto.randomUUID(),
            name: textName,
            description: textDescription,
            reader: 'TextReader',
            textContent: textBody,
            chunkerEnabled: textChunkerEnabled,
            chunkerType: textChunkerType,
            chunkSize: textChunkSize,
            chunkOverlap: textChunkOverlap,
            metadata: textMetadata,
            isExpanded: false,
            isSelected: false,
            // Assuming we treat this as a file entry without a file/url for now, 
            // or we might need a specific handling for 'text content' type later.
        };

        setFiles(prev => [...prev, newFile]);
        resetTextForm();
        setView('file'); // Go to list view to see added content
    };

    // ... (rest of handlers) ...

    // ... inside render ...

    if (view === 'text') {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-[95vw] max-w-2xl border border-slate-200 dark:border-slate-800 flex flex-col h-[90vh] max-h-[800px] animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                            Add text content to the knowledge base
                        </h3>
                        <button
                            onClick={() => onClose()}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Scrollable Content Form */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                <Type className="w-4 h-4" /> Name
                            </label>
                            <input
                                type="text"
                                value={textName}
                                onChange={(e) => setTextName(e.target.value)}
                                placeholder="Enter content name"
                                className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                <FileText className="w-4 h-4" /> Description
                            </label>
                            <textarea
                                value={textDescription}
                                onChange={(e) => setTextDescription(e.target.value)}
                                placeholder="Enter description"
                                rows={4}
                                className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                <Settings className="w-4 h-4" /> Reader
                            </label>
                            <div className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-300 flex items-center justify-between opacity-70 cursor-not-allowed">
                                <span>TextReader</span>
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                    <FileText className="w-4 h-4" /> Text Content
                                </label>
                                <textarea
                                    value={textBody}
                                    onChange={(e) => setTextBody(e.target.value)}
                                    placeholder="Paste or type the text content to ingest"
                                    rows={6}
                                    className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <div
                                    onClick={() => setTextChunkerEnabled(!textChunkerEnabled)}
                                    className={`w-11 h-6 rounded-full flex items-center px-1 cursor-pointer transition-colors ${textChunkerEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                                >
                                    <div className={`w-4 h-4 rounded-full bg-white transform transition-transform ${textChunkerEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                                </div>
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 border-b border-dashed border-slate-400 dark:border-slate-500 pb-0.5">Select Chunker Settings</span>
                            </div>

                            {textChunkerEnabled && (
                                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4 animate-in fade-in slide-in-from-top-2">
                                    <div className="space-y-1">
                                        <label className="text-xs text-slate-500">Chunker</label>
                                        <select
                                            value={textChunkerType}
                                            onChange={(e) => setTextChunkerType(e.target.value)}
                                            className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none"
                                        >
                                            <option value="FixedSizeChunker">FixedSizeChunker</option>
                                            <option value="AgenticChunker">AgenticChunker</option>
                                            <option value="DocumentChunker">DocumentChunker</option>
                                            <option value="RecursiveChunker">RecursiveChunker</option>
                                            <option value="SemanticChunker">SemanticChunker</option>
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs text-slate-500">Chunk Size</label>
                                            <input
                                                type="number"
                                                value={textChunkSize}
                                                onChange={(e) => setTextChunkSize(parseInt(e.target.value))}
                                                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs text-slate-500">Chunk Overlap</label>
                                            <input
                                                type="number"
                                                value={textChunkOverlap}
                                                onChange={(e) => setTextChunkOverlap(parseInt(e.target.value))}
                                                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                <Info className="w-4 h-4" /> Metadata <span className="text-xs font-normal text-slate-400">Optional</span>
                            </label>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Key"
                                    value={textMetaKey}
                                    onChange={(e) => setTextMetaKey(e.target.value)}
                                    className="flex-1 px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                />
                                <span className="self-center text-slate-400">=</span>
                                <input
                                    type="text"
                                    placeholder="Value"
                                    value={textMetaValue}
                                    onChange={(e) => setTextMetaValue(e.target.value)}
                                    className="flex-1 px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                />
                                <button
                                    onClick={handleTextAddMetadata}
                                    className="px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-600 dark:text-slate-400"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>

                            {textMetadata.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {textMetadata.map((meta, idx) => (
                                        <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300">
                                            {meta.key} = {meta.value}
                                            <button onClick={() => handleTextRemoveMetadata(idx)} className="hover:text-red-500 ml-1"><X className="w-3 h-3" /></button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-b-2xl">
                        <button
                            onClick={() => setView('selection')}
                            className="px-8 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors"
                        >
                            BACK
                        </button>
                        <button
                            onClick={handleTextAdd}
                            className={`px-8 py-3 rounded-lg text-xs font-bold uppercase tracking-widest shadow-lg transition-all ${textName ? 'bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 shadow-slate-900/20' : 'bg-slate-300 cursor-not-allowed text-white'}`}
                            disabled={!textName}
                        >
                            ADD CONTENT
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files).map(file => ({
                id: crypto.randomUUID(),
                file,
                name: file.name,
                description: '',
                reader: 'TextReader',
                chunkerEnabled: false,
                chunkerType: 'FixedSizeChunker',
                chunkSize: 5000,
                chunkOverlap: 0,
                metadata: [],
                isExpanded: false,
                isSelected: false
            }));
            setFiles(prev => [...prev, ...newFiles]);
        }
    };

    const handleUrlAdd = () => {
        setUrlError('');
        if (!urlInput) return;

        try {
            const urlObj = new URL(urlInput);
            const fileName = urlObj.pathname.split('/').pop() || urlInput;

            const newFile: FileSettings = {
                id: crypto.randomUUID(),
                url: urlInput,
                name: fileName,
                description: '',
                reader: 'TextReader', // Default to TextReader for now
                chunkerEnabled: false,
                chunkerType: 'FixedSizeChunker',
                chunkSize: 5000,
                chunkOverlap: 0,
                metadata: [],
                isExpanded: false,
                isSelected: false
            };

            setFiles(prev => [...prev, newFile]);
            setUrlInput('');
        } catch (e) {
            setUrlError('Please enter a valid URL');
        }
    };

    const removeFile = (id: string) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    };

    const updateFile = (id: string, updates: Partial<FileSettings>) => {
        setFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    };

    const toggleExpand = (id: string) => {
        setFiles(prev => prev.map(f => f.id === id ? { ...f, isExpanded: !f.isExpanded } : f));
    };

    const toggleSelect = (id: string) => {
        setFiles(prev => prev.map(f => f.id === id ? { ...f, isSelected: !f.isSelected } : f));
    };

    const addMetadata = (id: string, key: string, value: string) => {
        if (!key || !value) return;
        setFiles(prev => prev.map(f => {
            if (f.id === id) {
                return { ...f, metadata: [...f.metadata, { key, value }] };
            }
            return f;
        }));
    };

    const removeMetadata = (id: string, index: number) => {
        setFiles(prev => prev.map(f => {
            if (f.id === id) {
                const newMeta = [...f.metadata];
                newMeta.splice(index, 1);
                return { ...f, metadata: newMeta };
            }
            return f;
        }));
    };

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const pollContentStatus = async (contentId: string) => {
        if (!dbId) return;
        const maxAttempts = 12; // ~60s
        for (let i = 0; i < maxAttempts; i++) {
            try {
                const res = await knowledgeApi.getContentStatus(dbId, contentId);
                if (res?.status && res.status !== 'processing') {
                    return res.status;
                }
            } catch (e) {
                // ignore and keep polling
            }
            await sleep(5000);
        }
    };

    const handleSaveSelectedFiles = async () => {
        if (!dbId) {
            setSaveError('No knowledge database selected.');
            return;
        }

        const selected = files.filter(f => f.isSelected);
        if (selected.length === 0) return;

        setIsSaving(true);
        setSaveError(null);

        try {
            const createdIds: string[] = [];

            for (const file of selected) {
                const metadataObj = file.metadata.reduce<Record<string, string>>((acc, curr) => {
                    acc[curr.key] = curr.value;
                    return acc;
                }, {});

                const resp = await knowledgeApi.uploadContent(dbId, {
                    name: file.name,
                    description: file.description || '',
                    url: file.url || '',
                    metadata: metadataObj,
                    file: file.file || null,
                    reader: file.reader,
                    textContent: file.textContent
                });

                const newId = resp?.data?.id || resp?.id || resp?.content_id || '';
                if (newId) createdIds.push(newId);
            }

            if (createdIds.length > 0) {
                await Promise.all(createdIds.map(id => pollContentStatus(id)));
            }

            await onUploaded?.();
            onClose();
        } catch (error: any) {
            setSaveError(error?.message || 'Failed to upload content.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    if (view === 'file') {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-[95vw] max-w-6xl h-[90vh] max-h-[900px] border border-slate-200 dark:border-slate-800 flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                        <div>
                            <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                                Add file content to the knowledge base
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                You can add multiple files
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex overflow-hidden">
                        {/* Left Column: Upload */}
                        <div className="w-5/12 p-6 border-r border-slate-200 dark:border-slate-800 flex flex-col overflow-y-auto">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                multiple
                                onChange={handleFileSelect}
                            />
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="min-h-[16rem] border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer shrink-0"
                            >
                                <div className="w-12 h-12 mb-4 text-slate-400">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                                    </svg>
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium">
                                    Drag & drop files to upload
                                </p>
                                <button className="px-6 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-colors">
                                    Select File
                                </button>
                            </div>

                            <div className="relative py-6 shrink-0">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-slate-200 dark:border-slate-800" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white dark:bg-slate-900 px-2 text-slate-500">Or</span>
                                </div>
                            </div>

                            <div className="space-y-3 mb-8">
                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                    Enter File URL
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={urlInput}
                                        onChange={(e) => {
                                            setUrlInput(e.target.value);
                                            if (urlError) setUrlError('');
                                        }}
                                        placeholder="https://example.com/file.pdf"
                                        className={`flex-1 px-4 py-3 bg-white dark:bg-slate-950 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400 ${urlError ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-slate-700 focus:border-blue-500'}`}
                                    />
                                    <button
                                        onClick={handleUrlAdd}
                                        className="px-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                                {urlError && (
                                    <p className="text-xs text-red-500 mt-1">{urlError}</p>
                                )}
                            </div>
                        </div>

                        {/* Right Column: Files List */}
                        <div className="w-7/12 p-4 flex flex-col bg-slate-50/30 dark:bg-slate-900/10 overflow-hidden">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-medium text-slate-900 dark:text-white">
                                    {files.filter(f => f.isSelected).length} of {files.length} items selected
                                </span>
                                <span className="text-xs text-slate-500">Content names must be unique</span>
                            </div>

                            {files.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center">
                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                        No files added yet
                                    </p>
                                </div>
                            ) : (
                                <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                                    {files.map((file, index) => (
                                        <FileItem
                                            key={file.id}
                                            settings={file}
                                            onUpdate={(updates) => updateFile(file.id, updates)}
                                            onToggleSelect={() => toggleSelect(file.id)}
                                            onToggleExpand={() => toggleExpand(file.id)}
                                            onRemove={() => removeFile(file.id)}
                                            onAddMetadata={(k, v) => addMetadata(file.id, k, v)}
                                            onRemoveMetadata={(i) => removeMetadata(file.id, i)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-b-2xl">
                        <button
                            onClick={() => setView('selection')}
                            className="px-6 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors"
                        >
                            Back
                        </button>
                        <button
                            onClick={handleSaveSelectedFiles}
                            className={`px-6 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider shadow-sm transition-colors ${files.some(f => f.isSelected) && dbId && !isSaving ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-slate-400 cursor-not-allowed text-white'}`}
                            disabled={!files.some(f => f.isSelected) || !dbId || isSaving}
                        >
                            {isSaving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                    {saveError && <p className="px-6 pb-4 text-xs text-red-500">{saveError}</p>}
                </div>
            </div>
        );
    }

    if (view === 'web') {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-[95vw] max-w-6xl h-[90vh] max-h-[900px] border border-slate-200 dark:border-slate-800 flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                        <div>
                            <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                                Add web content to the knowledge base
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                You can add multiple urls
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex overflow-hidden">
                        {/* Left Column: Input */}
                        <div className="w-5/12 p-6 border-r border-slate-200 dark:border-slate-800 flex flex-col overflow-y-auto">
                            <div className="space-y-3">
                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                    Enter Website URL
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={urlInput}
                                        onChange={(e) => {
                                            setUrlInput(e.target.value);
                                            if (urlError) setUrlError('');
                                        }}
                                        placeholder="https://example.com"
                                        className={`flex-1 px-4 py-3 bg-white dark:bg-slate-950 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400 ${urlError ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-slate-700 focus:border-blue-500'}`}
                                    />
                                    <button
                                        onClick={handleUrlAdd}
                                        className="px-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                                {urlError && (
                                    <p className="text-xs text-red-500 mt-1">{urlError}</p>
                                )}
                            </div>
                        </div>

                        {/* Right Column: Files List */}
                        <div className="w-7/12 p-4 flex flex-col bg-slate-50/30 dark:bg-slate-900/10 overflow-hidden">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-medium text-slate-900 dark:text-white">
                                    {files.filter(f => f.isSelected).length} of {files.length} items selected
                                </span>
                                <span className="text-xs text-slate-500">Content names must be unique</span>
                            </div>

                            {files.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center">
                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                        No urls added yet
                                    </p>
                                </div>
                            ) : (
                                <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                                    {files.map((file, index) => (
                                        <FileItem
                                            key={file.id}
                                            settings={file}
                                            onUpdate={(updates) => updateFile(file.id, updates)}
                                            onToggleSelect={() => toggleSelect(file.id)}
                                            onToggleExpand={() => toggleExpand(file.id)}
                                            onRemove={() => removeFile(file.id)}
                                            onAddMetadata={(k, v) => addMetadata(file.id, k, v)}
                                            onRemoveMetadata={(i) => removeMetadata(file.id, i)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-b-2xl">
                        <button
                            onClick={() => setView('selection')}
                            className="px-6 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors"
                        >
                            Back
                        </button>
                        <button
                            className={`px-6 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider shadow-sm transition-colors ${files.some(f => f.isSelected) ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-slate-400 cursor-not-allowed text-white'}`}
                            disabled={!files.some(f => f.isSelected)}
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg border border-slate-200 dark:border-slate-800 p-6 relative animate-in fade-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="mb-6">
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1 pr-8">
                        Select content type to add to the knowledge base
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        You can add different types of content
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setView('file')}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm transition-all group relative"
                    >
                        <FileText className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wide">FILE</span>
                        <div className="relative group/info">
                            <Info className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1 cursor-help" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all z-10 text-center pointer-events-none">
                                Upload document, images and other files to the knowledge base
                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => setView('web')}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm transition-all group relative"
                    >
                        <Globe className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wide">WEB</span>
                        <div className="relative group/info">
                            <Info className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1 cursor-help" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all z-10 text-center pointer-events-none">
                                Add the web pages to the knowledge base by entering their URLs
                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => setView('text')}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm transition-all group relative"
                    >
                        <Type className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wide">TEXT</span>
                        <div className="relative group/info">
                            <Info className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1 cursor-help" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all z-10 text-center pointer-events-none">
                                Add text content to the knowledge base
                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export const KnowledgeModule: React.FC = () => {
    const [config, setConfig] = useState<ConfigResponse | null>(null);
    const [selectedDb, setSelectedDb] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [isAddContentOpen, setIsAddContentOpen] = useState(false);

    // Knowledge Content State
    const [knowledgeContent, setKnowledgeContent] = useState<KnowledgeItem[]>([]);
    const [isContentLoading, setIsContentLoading] = useState(false);

    // Selection & Side Panel State
    const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
    const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Side Panel Form State
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editMetadata, setEditMetadata] = useState<{ key: string, value: string }[]>([]);
    const [editMetaKey, setEditMetaKey] = useState('');
    const [editMetaValue, setEditMetaValue] = useState('');

    const toggleCheck = (id: string) => {
        const newChecked = new Set(checkedItems);
        if (newChecked.has(id)) {
            newChecked.delete(id);
        } else {
            newChecked.add(id);
        }
        setCheckedItems(newChecked);
    };

    const toggleAllChecks = () => {
        if (checkedItems.size === knowledgeContent.length) {
            setCheckedItems(new Set());
        } else {
            setCheckedItems(new Set(knowledgeContent.map(item => item.id)));
        }
    };

    const clearSelection = () => {
        setCheckedItems(new Set());
    };

    const handleDeleteSelected = () => {
        if (checkedItems.size === 0) return;
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = () => {
        if (!selectedDbId || checkedItems.size === 0) return;

        setIsDeleting(true);
        const idsToDelete = Array.from(checkedItems);

        Promise.all(idsToDelete.map(id => knowledgeApi.deleteContent(selectedDbId, id)))
            .then(() => {
                setCheckedItems(new Set());
                setShowDeleteConfirm(false);
                loadContent();
            })
            .catch((error) => {
                console.error('Failed to delete content:', error);
            })
            .finally(() => {
                setIsDeleting(false);
            });
    };

    const handleCancelDelete = () => {
        setShowDeleteConfirm(false);
    };

    const handleRowClick = (item: KnowledgeItem) => {
        if (selectedContentId === item.id) {
            setSelectedContentId(null); // Deselect if clicking same row
        } else {
            setSelectedContentId(item.id);
            // Initialize form with item data
            setEditName(item.name);
            setEditDescription(item.description || '');
            // Parse metadata if it exists
            const metaArray = item.metadata ? Object.entries(item.metadata).map(([key, value]) => ({ key, value: String(value) })) : [];
            setEditMetadata(metaArray);
        }
    };

    const handleEditAddMeta = () => {
        if (editMetaKey && editMetaValue) {
            setEditMetadata([...editMetadata, { key: editMetaKey, value: editMetaValue }]);
            setEditMetaKey('');
            setEditMetaValue('');
        }
    };

    const handleEditRemoveMeta = (index: number) => {
        const newMeta = [...editMetadata];
        newMeta.splice(index, 1);
        setEditMetadata(newMeta);
    };
    
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const data = await configApi.getConfig();
                setConfig(data);
                if (data.knowledge?.dbs && data.knowledge.dbs.length > 0) {
                    setSelectedDb(data.knowledge.dbs[0].domain_config.display_name);
                }
            } catch (error) {
                console.error('Failed to load config:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchConfig();
    }, []);

    const knowledgeDbs = config?.knowledge?.dbs || [];
    const selectedDbConfig = knowledgeDbs.find(db => db.domain_config.display_name === selectedDb);
    const selectedDbId = selectedDbConfig?.db_id || '';

    const loadContent = useCallback(async () => {
        if (!selectedDbId) return;
        setIsContentLoading(true);
        try {
            const response = await knowledgeApi.getContent(selectedDbId);
            setKnowledgeContent(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Failed to fetch knowledge content:', error);
            setKnowledgeContent([]);
        } finally {
            setIsContentLoading(false);
        }
    }, [selectedDbId]);

    // Fetch Knowledge Content when DB changes
    useEffect(() => {
        loadContent();
    }, [loadContent]);

    if (loading) {
        return (
            <div className="flex-1 h-full flex flex-col bg-white dark:bg-slate-950 relative">
                <div className="flex items-center justify-between px-8 py-6 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex flex-col gap-2 w-full max-w-xl">
                        <div className="aa-skeleton bg-slate-200/80 dark:bg-slate-700/40 rounded-md h-3 w-24" aria-hidden="true" />
                        <div className="aa-skeleton bg-slate-200/80 dark:bg-slate-700/40 rounded-md h-5 w-56" aria-hidden="true" />
                    </div>
                </div>
                <KnowledgeTableSkeleton rows={8} />
            </div>
        );
    }

    return (
        <div className="flex-1 h-full flex flex-col bg-white dark:bg-slate-950 relative">
            <AddContentModal
                isOpen={isAddContentOpen}
                onClose={() => setIsAddContentOpen(false)}
                dbId={selectedDbId}
                onUploaded={loadContent}
            />
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                {`Are you sure you want to delete these ${checkedItems.size} item${checkedItems.size > 1 ? 's' : ''}?`}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">This action is irreversible.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleCancelDelete}
                                className="flex-1 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors ${isDeleting ? 'opacity-80 cursor-not-allowed' : ''}`}
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-200 dark:border-slate-800">
                <div className="flex flex-col">
                    <span className="text-sm text-slate-500 mb-1">Database</span>
                    {knowledgeDbs.length > 1 ? (
                        <select
                            value={selectedDb}
                            onChange={(e) => setSelectedDb(e.target.value)}
                            className="bg-transparent text-lg font-medium text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                        >
                            {knowledgeDbs.map((db, index) => (
                                <option key={index} value={db.domain_config.display_name}>
                                    {db.domain_config.display_name}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <h1 className="text-lg font-medium text-slate-900 dark:text-white">
                            {knowledgeDbs.length > 0 ? knowledgeDbs[0].domain_config.display_name : 'No Database Found'}
                        </h1>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-900 dark:border-slate-700">
                        <span className="text-sm text-slate-500">Sort by:</span>
                        <select className="bg-transparent text-sm font-medium text-slate-900 dark:text-white focus:outline-none cursor-pointer">
                            <option>Date ascending</option>
                            <option>Date descending</option>
                            <option>Name ascending</option>
                            <option>Name descending</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            {isContentLoading ? (
                <KnowledgeTableSkeleton rows={8} />
            ) : knowledgeContent.length > 0 ? (
                <div className="flex-1 overflow-hidden flex bg-white dark:bg-slate-950">
                    {/* Main Table Area */}
                    <div className={`flex-1 flex flex-col overflow-hidden ${selectedContentId ? 'w-2/3' : 'w-full'} relative`}>

                        {/* Table Header Controls */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 z-10">
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                {knowledgeContent.length} items in table
                            </span>
                            <button
                                onClick={() => setIsAddContentOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-all shadow-sm hover:ring-2 hover:ring-emerald-500 hover:ring-offset-2 dark:hover:ring-offset-slate-950"
                            >
                                <Plus className="w-3 h-3" /> Add Content
                            </button>
                        </div>

                        <div className="flex-1 overflow-auto px-6 pb-6 bg-slate-50/50 dark:bg-slate-950">
                            <table className="w-full text-left border-separate border-spacing-y-3 border-spacing-x-0">
                                <thead className="sticky top-0 z-10 backdrop-blur">
                                    <tr className="bg-white/95 dark:bg-slate-950/95 shadow-[0_10px_30px_-22px_rgba(15,23,42,0.35)] border border-slate-200 dark:border-slate-800 rounded-2xl">
                                        <th className="py-3 pl-5 pr-3 w-10 align-middle first:rounded-l-2xl last:rounded-r-2xl">
                                            <input
                                                type="checkbox"
                                                checked={knowledgeContent.length > 0 && checkedItems.size === knowledgeContent.length}
                                                onChange={toggleAllChecks}
                                                className="rounded-full border-slate-300 dark:border-slate-600 w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                                            />
                                        </th>
                                        <th className="py-3 px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em] first:rounded-l-2xl last:rounded-r-2xl">Name</th>
                                        <th className="py-3 px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em] whitespace-nowrap first:rounded-l-2xl last:rounded-r-2xl">Content Type</th>
                                        <th className="py-3 px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em] first:rounded-l-2xl last:rounded-r-2xl">Metadata</th>
                                        <th className="py-3 px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em] first:rounded-l-2xl last:rounded-r-2xl">Status</th>
                                        <th className="py-3 px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em] whitespace-nowrap first:rounded-l-2xl last:rounded-r-2xl">Updated At</th>
                                    </tr>
                                </thead>
                                <tbody className="align-middle">
                                    {knowledgeContent.map((item) => (
                                        <tr
                                            key={item.id}
                                            onClick={() => handleRowClick(item)}
                                            className={`group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-[0_10px_30px_-18px_rgba(15,23,42,0.35)] hover:shadow-[0_16px_40px_-18px_rgba(16,185,129,0.35)] transition-all duration-200 ${
                                                selectedContentId === item.id ? 'ring-2 ring-emerald-500/50' : ''
                                            }`}
                                        >
                                            <td className="p-4 pl-5 pr-3 first:rounded-l-2xl last:rounded-r-2xl align-middle" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={checkedItems.has(item.id)}
                                                    onChange={() => toggleCheck(item.id)}
                                                    className="rounded-full border-slate-300 dark:border-slate-600 w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                                                />
                                            </td>
                                            <td className="p-4 px-3 first:rounded-l-2xl last:rounded-r-2xl">
                                                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate block max-w-[220px] leading-tight">{item.name}</span>
                                                {item.description && (
                                                    <span className="text-xs text-slate-500 dark:text-slate-400 truncate block max-w-[220px] mt-1">{item.description}</span>
                                                )}
                                            </td>
                                            <td className="p-4 px-3 first:rounded-l-2xl last:rounded-r-2xl">
                                                <div className="inline-flex items-center gap-2 px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded-full text-xs font-medium text-slate-600 dark:text-slate-300">
                                                    {item.type.toLowerCase().includes('text') ? <Type className="w-4 h-4 text-orange-500" /> : <FileText className="w-4 h-4 text-blue-500" />}
                                                    <span className="capitalize">{item.type}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 px-3 first:rounded-l-2xl last:rounded-r-2xl">
                                                <div className="flex flex-wrap gap-1 max-w-[240px]">
                                                    {item.metadata && Object.keys(item.metadata).length > 0 ? (
                                                        Object.entries(item.metadata).slice(0, 2).map(([k, v], i) => (
                                                            <span key={i} className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium bg-slate-50 dark:bg-slate-800 text-slate-600 border border-slate-200 dark:border-slate-700">
                                                                {k} = {String(v)}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-xs text-slate-400">-</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 px-3 first:rounded-l-2xl last:rounded-r-2xl">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${
                                                        item.status === 'completed'
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-900/40'
                                                            : item.status === 'failed'
                                                            ? 'bg-rose-200 text-rose-900 border border-rose-300 dark:bg-rose-900/30 dark:text-rose-100 dark:border-rose-900/50'
                                                            : 'bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-900/40'
                                                    }`}
                                                >
                                                    {item.status === 'completed' && <Check className="w-3.5 h-3.5" />}
                                                    {item.status === 'failed' && <AlertTriangle className="w-3.5 h-3.5" />}
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="p-4 px-3 first:rounded-l-2xl last:rounded-r-2xl">
                                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                                    {new Date(item.updated_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {checkedItems.size > 0 && (
                            <div className="absolute left-1/2 -translate-x-1/2 bottom-4 flex items-center gap-3 bg-white/90 dark:bg-slate-900/90 border border-emerald-100 dark:border-emerald-900/40 shadow-lg rounded-full px-4 py-2 text-sm text-slate-700 dark:text-slate-200 backdrop-blur">
                                <span className="font-semibold">{checkedItems.size} of {knowledgeContent.length} items selected</span>
                                <button
                                    onClick={clearSelection}
                                    className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Clear Selection
                                </button>
                                <button
                                    onClick={handleDeleteSelected}
                                    className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
                                >
                                    Delete Selected
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Side Panel */}
                    {/* Side Panel */}
                    {selectedContentId && (
                        <div className="w-[400px] border-l border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-slate-950 shadow-xl z-20 h-full overflow-hidden">
                            {/* Panel Header */}
                            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between shrink-0">
                                <div className="space-y-1 overflow-hidden">
                                    <h3 className="font-semibold text-slate-900 dark:text-white text-base truncate">{editName || 'Content Details'}</h3>
                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${knowledgeContent.find(i => i.id === selectedContentId)?.status === 'completed' ? 'bg-slate-100 text-slate-600' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                        {knowledgeContent.find(i => i.id === selectedContentId)?.status}
                                    </span>
                                </div>
                                <button onClick={() => setSelectedContentId(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors text-slate-400 hover:text-slate-600 shrink-0">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Panel Content */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 overflow-x-hidden">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <Type className="w-3 h-3" /> Name
                                    </label>
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <div className="scale-75"><FileText className="w-4 h-4" /></div> Description <span className="text-slate-300 font-normal">Optional</span>
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={editDescription}
                                        onChange={(e) => setEditDescription(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <Settings className="w-3 h-3" /> Metadata
                                    </label>

                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Key"
                                            value={editMetaKey}
                                            onChange={(e) => setEditMetaKey(e.target.value)}
                                            className="flex-1 min-w-0 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                        />
                                        <span className="self-center text-slate-400 shrink-0">=</span>
                                        <input
                                            type="text"
                                            placeholder="Value"
                                            value={editMetaValue}
                                            onChange={(e) => setEditMetaValue(e.target.value)}
                                            className="flex-1 min-w-0 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                        />
                                        <button onClick={handleEditAddMeta} className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-slate-500 shrink-0">
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {editMetadata.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {editMetadata.map((meta, idx) => (
                                                <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-600 dark:text-slate-400 max-w-full truncate">
                                                    <span className="truncate">{meta.key} = {meta.value}</span>
                                                    <button onClick={() => handleEditRemoveMeta(idx)} className="hover:text-red-500 ml-1 shrink-0"><X className="w-3 h-3" /></button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <FileText className="w-3 h-3" /> Content Type
                                    </label>
                                    <div className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm text-slate-700 dark:text-slate-300 border border-transparent">
                                        {knowledgeContent.find(i => i.id === selectedContentId)?.type}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <BookOpen className="w-3 h-3" /> Updated at
                                    </label>
                                    <div className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm text-slate-700 dark:text-slate-300 border border-transparent font-mono">
                                        {knowledgeContent.find(i => i.id === selectedContentId)?.updated_at &&
                                            new Date(knowledgeContent.find(i => i.id === selectedContentId)!.updated_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                        }
                                    </div>
                                </div>
                            </div>

                            {/* Panel Footer */}
                            <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-950 shrink-0">
                                <button className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-red-600 hover:border-red-200 transition-colors">
                                    Delete
                                </button>
                                <div className="flex gap-3">
                                    <button onClick={() => setSelectedContentId(null)} className="px-4 py-2 text-slate-500 hover:text-slate-700 text-xs font-bold uppercase tracking-wider transition-colors">
                                        Cancel
                                    </button>
                                    <button className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-sm hover:ring-2 hover:ring-emerald-500 hover:ring-offset-2 dark:hover:ring-offset-slate-950">
                                        Save
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* Empty State Content */
                <div className="flex-1 flex items-center justify-center p-6 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl shadow-sm text-center max-w-lg w-full flex flex-col items-center">
                        <div className="relative mb-8">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center -rotate-12 absolute -left-8 -top-4 shadow-sm border border-slate-200 dark:border-slate-700">
                                <BookOpen className="w-8 h-8 text-slate-700 dark:text-slate-300" />
                            </div>
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center rotate-12 relative z-10 shadow-sm border border-green-200 dark:border-green-800">
                                <div className="w-8 h-8 rounded border-2 border-green-500 flex items-center justify-center">
                                    <div className="w-4 h-0.5 bg-green-500"></div>
                                </div>
                            </div>
                        </div>

                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                            No content in knowledge base
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-xs mx-auto text-sm leading-relaxed">
                            Add and view knowledge base content.
                        </p>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsAddContentOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-all shadow-sm hover:ring-2 hover:ring-emerald-500 hover:ring-offset-2 dark:hover:ring-offset-slate-950"
                            >
                                <Plus className="w-3 h-3" /> Add Content
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
