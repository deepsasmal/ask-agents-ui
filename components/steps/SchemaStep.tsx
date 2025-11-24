import React, { useState, useEffect, useCallback } from 'react';
import { ArrowRight, ArrowLeft, ChevronRight, Wand2, Database, KeyRound, Link as LinkIcon, Table2, Info, ChevronDown, Loader2 } from 'lucide-react';
import { Button, Card } from '../ui/Common';
import { WizardState, Column, Table } from '../../types';
import { postgresApi } from '../../services/api';

interface SchemaStepProps {
  data: WizardState;
  updateData: (data: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const SchemaStep: React.FC<SchemaStepProps> = ({ data, updateData, onNext, onBack }) => {
  const [expandedTableId, setExpandedTableId] = useState<string | null>(null);
  const [autofilling, setAutofilling] = useState<string | null>(null);
  
  // State for API data
  const [schemas, setSchemas] = useState<string[]>([]);
  const [selectedSchema, setSelectedSchema] = useState('public');
  const [isLoadingSchemas, setIsLoadingSchemas] = useState(false);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [loadingColumns, setLoadingColumns] = useState<Set<string>>(new Set());

  const connectionId = data.connectionId;

  // Fetch Schemas on Mount
  useEffect(() => {
    const fetchSchemas = async () => {
      if (!connectionId) return;
      try {
        setIsLoadingSchemas(true);
        const result = await postgresApi.getSchemas(connectionId);
        setSchemas(result.schemas);
        if (result.schemas.includes('public')) {
          setSelectedSchema('public');
        } else if (result.schemas.length > 0) {
          setSelectedSchema(result.schemas[0]);
        }
      } catch (err) {
        console.error('Failed to load schemas', err);
      } finally {
        setIsLoadingSchemas(false);
      }
    };

    fetchSchemas();
  }, [connectionId]);

  // Fetch Tables when Schema changes
  useEffect(() => {
    const fetchTables = async () => {
      if (!connectionId || !selectedSchema) return;
      try {
        setIsLoadingTables(true);
        const result = await postgresApi.getTables(connectionId, selectedSchema);
        
        // Transform string[] to Table[]
        const newTables: Table[] = result.tables.map(tableName => ({
          id: tableName, // Using name as ID for simplicity in this context
          name: tableName,
          selected: false,
          columns: [],
          loaded: false
        }));

        updateData({ tables: newTables });
        setExpandedTableId(null); // Reset selection
      } catch (err) {
        console.error('Failed to load tables', err);
      } finally {
        setIsLoadingTables(false);
      }
    };

    fetchTables();
  }, [connectionId, selectedSchema]); // Removed updateData from deps to avoid loop if not handled carefully, typically updateData is stable

  const fetchColumnsForTable = async (tableId: string) => {
    if (!connectionId) return;
    
    // Check if already loaded
    const table = data.tables.find(t => t.id === tableId);
    if (table?.loaded) return;

    try {
      setLoadingColumns(prev => new Set(prev).add(tableId));
      const columns = await postgresApi.getColumns(connectionId, tableId, selectedSchema);
      
      const updatedTables = data.tables.map(t => 
        t.id === tableId ? { ...t, columns, loaded: true } : t
      );
      updateData({ tables: updatedTables });
    } catch (err) {
      console.error(`Failed to load columns for ${tableId}`, err);
    } finally {
      setLoadingColumns(prev => {
        const next = new Set(prev);
        next.delete(tableId);
        return next;
      });
    }
  };

  const toggleTableSelection = (tableId: string) => {
    const updatedTables = data.tables.map(t => 
      t.id === tableId ? { ...t, selected: !t.selected } : t
    );
    updateData({ tables: updatedTables });
  };

  const toggleExpand = (tableId: string) => {
    if (expandedTableId !== tableId) {
        setExpandedTableId(tableId);
        fetchColumnsForTable(tableId);
    } else {
        setExpandedTableId(null);
    }
  };

  const updateColumnDescription = (tableId: string, colName: string, desc: string) => {
    const updatedTables = data.tables.map(t => {
      if (t.id !== tableId) return t;
      return {
        ...t,
        columns: t.columns.map(c => c.name === colName ? { ...c, description: desc } : c)
      };
    });
    updateData({ tables: updatedTables });
  };

  const handleAiAutofill = (tableId: string, column: Column) => {
    setAutofilling(`${tableId}-${column.name}`);
    // Mock AI delay for now as there isn't an explicit endpoint for this yet
    setTimeout(() => {
        let aiText = `Automatically inferred: This represents the ${column.name.replace(/_/g, ' ')} of the ${data.tables.find(t => t.id === tableId)?.name}.`;
        if (column.isPrimaryKey) aiText = "Unique primary identifier.";
        if (column.isForeignKey) aiText = "Reference to external entity.";
        
        updateColumnDescription(tableId, column.name, aiText);
        setAutofilling(null);
    }, 800);
  };

  const selectedCount = data.tables.filter(t => t.selected).length;
  const isTableLoading = (id: string) => loadingColumns.has(id);

  return (
    <div className="h-full flex flex-col animate-fade-in">
      <div className="mb-8 flex items-center justify-between">
        <div>
            <h2 className="text-3xl font-bold text-slate-900">Schema Selection</h2>
            <p className="text-slate-500 mt-1">Select tables and enrich metadata for the graph.</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-bold text-brand-700 bg-brand-50 px-4 py-2 rounded-xl border border-brand-200 shadow-sm">
            <Table2 className="w-4 h-4" />
            {selectedCount} Tables Selected
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 h-full">
        {/* Left Sidebar: Table List */}
        <div className="lg:w-1/3 flex-shrink-0">
          <Card className="sticky top-6 shadow-supreme border-0" noPadding>
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Schema Source</label>
                <div className="relative group">
                    <select
                        className="w-full appearance-none pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-sm cursor-pointer transition-all hover:border-brand-300 disabled:opacity-50"
                        value={selectedSchema}
                        onChange={(e) => setSelectedSchema(e.target.value)}
                        disabled={isLoadingSchemas}
                    >
                        {schemas.length > 0 ? (
                            schemas.map(s => <option key={s} value={s}>{s}</option>)
                        ) : (
                             <option>Loading schemas...</option>
                        )}
                    </select>
                    <Database className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-600 pointer-events-none group-hover:scale-110 transition-transform" />
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
            </div>
            
            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto custom-scrollbar relative min-h-[200px]">
                {isLoadingTables && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 backdrop-blur-sm">
                        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
                    </div>
                )}
                
                {data.tables.length === 0 && !isLoadingTables ? (
                    <div className="p-8 text-center text-slate-400 text-sm">No tables found in this schema.</div>
                ) : (
                    data.tables.map(table => (
                        <div 
                            key={table.id}
                            className={`group flex items-center justify-between p-4 hover:bg-slate-50 cursor-pointer transition-all border-l-[4px] ${expandedTableId === table.id ? 'bg-brand-50/30 border-brand-600' : 'border-transparent'}`}
                        >
                            <div className="flex items-center gap-4 flex-1" onClick={() => toggleExpand(table.id)}>
                                <div className="relative flex items-center justify-center">
                                    <input 
                                        type="checkbox" 
                                        checked={table.selected}
                                        onChange={(e) => { e.stopPropagation(); toggleTableSelection(table.id); }}
                                        className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 transition-all checked:border-brand-600 checked:bg-brand-600 hover:border-brand-400 focus:ring-2 focus:ring-brand-500/20"
                                    />
                                    <svg
                                        className="pointer-events-none absolute h-3.5 w-3.5 text-white opacity-0 transition-opacity peer-checked:opacity-100"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                
                                <div className="flex flex-col">
                                    <span className={`text-sm ${table.selected ? 'font-bold text-slate-900' : 'text-slate-500'}`}>{table.name}</span>
                                    {table.loaded && (
                                        <span className="text-[11px] text-slate-400 font-medium">{table.columns.length} columns</span>
                                    )}
                                </div>
                            </div>
                            <button onClick={() => toggleExpand(table.id)} className={`text-slate-400 hover:text-brand-600 p-2 rounded-lg hover:bg-brand-50 transition-colors ${expandedTableId === table.id ? 'text-brand-600 bg-brand-50' : ''}`}>
                                <ChevronRight className={`w-4 h-4 transition-transform ${expandedTableId === table.id ? 'rotate-90' : ''}`} />
                            </button>
                        </div>
                    ))
                )}
            </div>
          </Card>
        </div>

        {/* Main Area: Column Details */}
        <div className="flex-1">
            <Card className="min-h-[600px] shadow-supreme border-0">
                {expandedTableId ? (
                    (() => {
                        const table = data.tables.find(t => t.id === expandedTableId)!;
                        const loading = isTableLoading(table.id);

                        if (loading) {
                            return (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20">
                                    <Loader2 className="w-10 h-10 text-brand-600 animate-spin mb-4" />
                                    <p className="text-sm font-medium">Fetching columns...</p>
                                </div>
                            );
                        }

                        return (
                            <div className="space-y-6 animate-fade-in">
                                <div className="flex items-center gap-5 pb-6 border-b border-slate-100">
                                    <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center ring-1 ring-brand-100 shadow-sm">
                                        <Table2 className="w-8 h-8 text-brand-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-slate-900">{table.name}</h3>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <p className="text-sm text-slate-500 font-medium">Table Configuration</p>
                                            {!table.selected && (
                                                <span className="px-3 py-0.5 text-[10px] uppercase font-bold tracking-wide text-amber-700 bg-amber-50 rounded-full border border-amber-200">
                                                    Ignored
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 px-2">
                                        <span>Column Details</span>
                                        <span>Description</span>
                                    </div>
                                    {table.columns.length === 0 ? (
                                         <div className="text-center py-10 text-slate-400 italic">No columns found</div>
                                    ) : (
                                        table.columns.map(col => (
                                            <div key={col.name} className="flex flex-col xl:flex-row xl:items-start gap-4 p-5 rounded-2xl border border-slate-100 bg-slate-50/30 hover:shadow-md hover:border-brand-200 hover:bg-white transition-all duration-300 group">
                                                <div className="w-full xl:w-1/3 space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-sm text-slate-800">{col.name}</span>
                                                        <div className="flex gap-1.5">
                                                            {col.isPrimaryKey && (
                                                                <span className="flex items-center justify-center w-6 h-6 rounded-md bg-amber-100 text-amber-600 cursor-help" title="Primary Key">
                                                                    <KeyRound className="w-3.5 h-3.5" />
                                                                </span>
                                                            )}
                                                            {col.isForeignKey && (
                                                                <span className="flex items-center justify-center w-6 h-6 rounded-md bg-blue-100 text-blue-600 cursor-help" title="Foreign Key">
                                                                    <LinkIcon className="w-3.5 h-3.5" />
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-slate-200/50 text-slate-600 border border-slate-200">
                                                        {col.type}
                                                    </div>
                                                </div>
                                                
                                                <div className="flex-1 flex gap-3">
                                                    <input
                                                        className="flex-1 px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all group-hover:border-slate-300"
                                                        placeholder={`Description for ${col.name}...`}
                                                        value={col.description}
                                                        onChange={(e) => updateColumnDescription(table.id, col.name, e.target.value)}
                                                    />
                                                    <button 
                                                        onClick={() => handleAiAutofill(table.id, col)}
                                                        className={`p-3 rounded-xl border transition-all relative overflow-hidden ${
                                                            autofilling === `${table.id}-${col.name}` 
                                                            ? 'bg-brand-50 text-brand-600 border-brand-200' 
                                                            : 'border-slate-200 bg-white text-slate-400 hover:bg-brand-50 hover:border-brand-200 hover:text-brand-600 hover:shadow-sm'
                                                        }`}
                                                        title="Auto-generate with AI"
                                                    >
                                                        <Wand2 className={`w-4.5 h-4.5 ${autofilling === `${table.id}-${col.name}` ? 'animate-spin' : ''}`} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })()
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 ring-1 ring-slate-100 shadow-inner">
                             <Info className="w-10 h-10 opacity-30" />
                        </div>
                        <p className="font-bold text-lg text-slate-600">No Table Selected</p>
                        <p className="text-sm">Select a table from the sidebar to configure</p>
                    </div>
                )}
            </Card>
        </div>
      </div>

      <div className="flex justify-between pt-10 pb-4">
        <Button variant="ghost" onClick={onBack} leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Back
        </Button>
        <Button onClick={onNext} rightIcon={<ArrowRight className="w-4 h-4" />} size="lg" className="px-8 shadow-brand-600/30">
          Next Step
        </Button>
      </div>
    </div>
  );
};
