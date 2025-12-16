
import React, { useState, useEffect, useRef } from 'react';
import { Save, Share2, Undo2, Redo2, Search, Info, Loader2, X, Check, PanelLeft, PanelRight } from 'lucide-react';
import { Button } from '../ui/Common';
import { graphApi, SearchNodeResult } from '../../services/api';

interface TopBarProps {
  projectName: string;
  graphId: string;
  setGraphId: (id: string) => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  isSavingDraft?: boolean;
  isPublishing?: boolean;
  hasUnsavedChanges?: boolean;
  onImportNode: (node: SearchNodeResult) => void;
  isLeftPanelOpen?: boolean;
  isRightPanelOpen?: boolean;
  onToggleLeftPanel?: () => void;
  onToggleRightPanel?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  projectName,
  graphId,
  setGraphId,
  onSaveDraft,
  onPublish,
  isSavingDraft = false,
  isPublishing = false,
  hasUnsavedChanges = false,
  onImportNode,
  isLeftPanelOpen = false,
  isRightPanelOpen = false,
  onToggleLeftPanel,
  onToggleRightPanel
}) => {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchNodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounce search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm && graphId) {
        setIsSearching(true);
        setShowResults(true);
        try {
          const response = await graphApi.searchNodes(graphId, searchTerm);
          setSearchResults(response.nodes);
        } catch (error) {
          console.error('Search failed', error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, graphId]);

  const handleNodeSelect = (node: SearchNodeResult) => {
    onImportNode(node);
    setShowResults(false);
    setSearchTerm('');
  };

  return (
    <div className="bg-white border-b border-slate-200 shadow-sm z-30 shrink-0">
      <div className="min-h-16 px-3 sm:px-4 lg:px-6 py-3 lg:py-0 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">

        {/* Left: Project Info + Mobile Panel Toggles */}
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className="lg:hidden flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onToggleLeftPanel}
              className={`p-2 rounded-lg border transition-colors ${isLeftPanelOpen ? 'bg-brand-50 border-brand-200 text-brand-700' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
              title="Toggle node creator panel"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onToggleRightPanel}
              className={`p-2 rounded-lg border transition-colors ${isRightPanelOpen ? 'bg-brand-50 border-brand-200 text-brand-700' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
              title="Toggle properties panel"
            >
              <PanelRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-slate-800 leading-none truncate">{projectName || 'Untitled Project'}</h1>
            <span className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${hasUnsavedChanges ? 'bg-amber-500' : 'bg-green-500'}`}></span>
              {hasUnsavedChanges ? 'Unsaved Changes' : 'All Saved'}
            </span>
          </div>
        </div>

        {/* Center: Search */}
        <div className="w-full lg:flex-1 lg:max-w-lg lg:mx-6 flex items-center gap-2 min-w-0" ref={searchRef}>
          <div className="relative group flex-1 min-w-0">
          {isSearching ? (
            <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-500 animate-spin" />
          ) : (
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-brand-500 transition-colors" />
          )}
          <input
            type="text"
            placeholder={graphId ? "Search nodes..." : "Enter Graph ID to enable search"}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => {
              if (searchResults.length > 0) setShowResults(true);
            }}
            disabled={!graphId}
          />

          {/* Results Dropdown */}
          {showResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 max-h-96 overflow-y-auto z-50 custom-scrollbar animate-fade-in-up">
              {searchResults.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-sm italic">
                  {isSearching ? 'Searching...' : 'No nodes found'}
                </div>
              ) : (
                <div className="py-2">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Search Results</div>
                  {searchResults.map((node) => (
                    <button
                      key={node.id}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-center justify-between group/item border-b border-slate-50 last:border-0"
                      onClick={() => handleNodeSelect(node)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-bold text-sm text-slate-800 truncate">{node.properties.name}</span>
                          {node.labels.map(label => (
                            <span key={label} className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-brand-50 text-brand-600 border border-brand-100">
                              {label}
                            </span>
                          ))}
                        </div>
                        {node.properties.description && (
                          <p className="text-xs text-slate-500 truncate">{node.properties.description}</p>
                        )}
                      </div>
                      <div className="opacity-0 group-hover/item:opacity-100 transition-opacity">
                        <div className="w-6 h-6 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

          {/* Graph ID Info/Config Button */}
          <div className="relative shrink-0">
            <button
              onClick={() => setIsConfigOpen(!isConfigOpen)}
              className={`p-2 rounded-lg border transition-all ${graphId ? 'bg-green-50 border-green-200 text-green-600' : 'bg-white border-slate-200 text-slate-400 hover:text-brand-600 hover:border-brand-200'}`}
              title="Configure Graph ID"
            >
              <Info className="w-4 h-4" />
            </button>

            {/* Switch Graph Button */}
            {graphId && (
              <button
                onClick={() => setGraphId('')}
                className="p-2 ml-2 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-brand-600 hover:border-brand-200 transition-all"
                title="Switch Graph"
              >
                <Search className="w-4 h-4" />
              </button>
            )}

            {isConfigOpen && (
              <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-50 animate-fade-in-up">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Graph Configuration</span>
                  <button onClick={() => setIsConfigOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Graph ID (UUID)</label>
                    <input
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      placeholder="e.g. cbef3a53..."
                      value={graphId}
                      onChange={(e) => setGraphId(e.target.value)}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Enter the unique Graph ID returned from the build step to enable node search functionality.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="w-full lg:w-auto flex items-center justify-between lg:justify-end gap-2 flex-wrap">
          <div className="flex items-center border-r border-slate-200 pr-3 mr-1 gap-1">
            <Button variant="ghost" size="sm" className="px-2" title="Undo">
              <Undo2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="px-2" title="Redo">
              <Redo2 className="w-4 h-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            leftIcon={<Save className="w-4 h-4" />}
            onClick={onSaveDraft}
            disabled={!graphId || isSavingDraft || isPublishing}
            isLoading={isSavingDraft}
            className="shadow-sm"
          >
            <span className="hidden sm:inline">Save Draft</span>
            <span className="sm:hidden">Save</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Share2 className="w-4 h-4" />}
            onClick={onPublish}
            disabled={!graphId || hasUnsavedChanges || isPublishing || isSavingDraft}
            isLoading={isPublishing}
            title={hasUnsavedChanges ? "You must save changes before publishing" : "Publish to Graph"}
            className={`shadow-brand-600/20 ${hasUnsavedChanges ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Publish
          </Button>
      </div>
      </div>
    </div>
  );
};
