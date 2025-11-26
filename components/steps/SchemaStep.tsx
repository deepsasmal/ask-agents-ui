import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, ArrowLeft, ChevronRight, Wand2, Database, KeyRound, Link as LinkIcon, Table2, Info, ChevronDown, Loader2, RefreshCw, Sparkles, Bot, CheckSquare, Square } from 'lucide-react';
import { Button, Card } from '../ui/Common';
import { WizardState, Column, Table } from '../../types';
import { postgresApi, llmApi, graphApi } from '../../services/api';

interface SchemaStepProps {
  data: WizardState;
  updateData: (data: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

// Cache structure for AI generated metadata
interface AiMetadata {
  tableDescription?: string;
  columns: Record<string, string>;
}

export const SchemaStep: React.FC<SchemaStepProps> = ({ data, updateData, onNext, onBack }) => {
  const [expandedTableId, setExpandedTableId] = useState<string | null>(null);
  const [autofilling, setAutofilling] = useState<string | null>(null);
  const [isBatchTableLoading, setIsBatchTableLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // State for API data
  const [schemas, setSchemas] = useState<string[]>([]);
  // Use schema from global state if available, otherwise default to public
  const [selectedSchema, setSelectedSchema] = useState(data.schemaName || 'public');
  const [isLoadingSchemas, setIsLoadingSchemas] = useState(false);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [loadingColumns, setLoadingColumns] = useState<Set<string>>(new Set());
  
  // Cache for AI generated descriptions to persist across column loads
  const aiMetadataRef = useRef<Record<string, AiMetadata>>({});

  const connectionId = data.connectionId;

  // Fetch Schemas on Mount
  useEffect(() => {
    const fetchSchemas = async () => {
      if (!connectionId) return;
      try {
        setIsLoadingSchemas(true);
        const result = await postgresApi.getSchemas(connectionId);
        setSchemas(result.schemas);
        
        let nextSchema = 'public';
        
        // If we already have a selected schema in global state and it exists in the fetched list, keep it.
        if (data.schemaName && result.schemas.includes(data.schemaName)) {
            nextSchema = data.schemaName;
        } else {
            // Otherwise, apply default logic: use 'public' if available, else first item
            if (!result.schemas.includes('public') && result.schemas.length > 0) {
                nextSchema = result.schemas[0];
            }
        }

        setSelectedSchema(nextSchema);
        // Ensure global state matches
        if (data.schemaName !== nextSchema) {
            updateData({ schemaName: nextSchema });
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
        aiMetadataRef.current = {}; // Reset AI cache
      } catch (err) {
        console.error('Failed to load tables', err);
      } finally {
        setIsLoadingTables(false);
      }
    };

    fetchTables();
  }, [connectionId, selectedSchema]);

  const handleSchemaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newSchema = e.target.value;
      setSelectedSchema(newSchema);
      updateData({ schemaName: newSchema });
  };

  const fetchColumnsForTable = async (tableId: string) => {
    if (!connectionId) return;
    
    // Check if already loaded
    const table = data.tables.find(t => t.id === tableId);
    if (table?.loaded) return;

    try {
      setLoadingColumns(prev => new Set(prev).add(tableId));
      
      const [columnsRaw, foreignKeysRes] = await Promise.all([
        postgresApi.getColumns(connectionId, tableId, selectedSchema),
        postgresApi.getForeignKeys(connectionId, tableId, selectedSchema)
      ]);
      
      const fkMap = new Map<string, string>();
      if (foreignKeysRes?.foreign_keys) {
          foreignKeysRes.foreign_keys.forEach(fk => {
              fkMap.set(fk.column_name, `${fk.foreign_table_name}.${fk.foreign_column_name}`);
          });
      }

      // Merge with AI metadata if available in cache
      const aiData = aiMetadataRef.current[tableId];
      
      // Apply cached table description if current is empty
      let tableDescription = table?.description;
      if (!tableDescription && aiData?.tableDescription) {
          tableDescription = aiData.tableDescription;
      }

      const columns = columnsRaw.map(col => {
          const fkRef = fkMap.get(col.name);
          const columnWithFk = {
              ...col,
              isForeignKey: col.isForeignKey || !!fkRef,
              foreignKeyReference: fkRef
          };

          if (aiData?.columns[col.name]) {
              return { ...columnWithFk, description: aiData.columns[col.name] };
          }
          return columnWithFk;
      });
      
      const updatedTables = data.tables.map(t => 
        t.id === tableId ? { ...t, columns, loaded: true, description: tableDescription } : t
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

  const areAllSelected = data.tables.length > 0 && data.tables.every(t => t.selected);

  const toggleSelectAll = () => {
    const newState = !areAllSelected;
    const updatedTables = data.tables.map(t => ({ ...t, selected: newState }));
    updateData({ tables: updatedTables });
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

  const updateTableDescription = (tableId: string, desc: string) => {
    const updatedTables = data.tables.map(t =>
      t.id === tableId ? { ...t, description: desc } : t
    );
    updateData({ tables: updatedTables });
  };

  const generateMockDescription = (name: string, type: 'table' | 'column') => {
    const formattedName = name.replace(/_/g, ' ').toLowerCase();
    if (type === 'table') {
        return `Stores records for ${formattedName}, including unique identifiers and associated metadata.`;
    }
    return `Represents the ${formattedName} of the entity.`;
  };

  const handleTableAiAutofill = (tableId: string) => {
    setAutofilling(`TABLE-${tableId}`);
    setTimeout(() => {
        const table = data.tables.find(t => t.id === tableId);
        const name = table?.name || '';

        // Check cache first
        const cachedDesc = aiMetadataRef.current[tableId]?.tableDescription;
        if (cachedDesc) {
             updateTableDescription(tableId, cachedDesc);
             setAutofilling(null);
             return;
        }

        const aiText = generateMockDescription(name, 'table');
        updateTableDescription(tableId, aiText);
        setAutofilling(null);
    }, 1200);
  };

  const handleAiAutofill = (tableId: string, column: Column) => {
    setAutofilling(`${tableId}-${column.name}`);
    setTimeout(() => {
        // Check cache first
        const cached = aiMetadataRef.current[tableId]?.columns[column.name];
        if (cached) {
            updateColumnDescription(tableId, column.name, cached);
            setAutofilling(null);
            return;
        }

        let aiText = `Automatically inferred: This represents the ${column.name.replace(/_/g, ' ')} of the ${data.tables.find(t => t.id === tableId)?.name}.`;
        if (column.isPrimaryKey) aiText = "Unique primary identifier.";
        if (column.isForeignKey) aiText = "Reference to external entity.";
        
        updateColumnDescription(tableId, column.name, aiText);
        setAutofilling(null);
    }, 800);
  };

  const handleBatchTableAutofill = async () => {
    if (!connectionId || !selectedSchema) return;

    // Get selected tables
    const selectedTableNames = data.tables.filter(t => t.selected).map(t => t.name);
    
    if (selectedTableNames.length === 0) {
        return;
    }

    setIsBatchTableLoading(true);
    try {
        const response = await llmApi.generateSchemaDescriptions(connectionId, selectedSchema, selectedTableNames);
        
        // 1. Populate Cache
        response.tables.forEach((t) => {
            const colMap: Record<string, string> = {};
            t.columns.forEach((c) => {
                colMap[c.name] = c.description;
            });
            aiMetadataRef.current[t.name] = {
                tableDescription: t.description,
                columns: colMap
            };
        });

        // 2. Update State
        const updatedTables = data.tables.map(t => {
            const aiTable = response.tables.find(ait => ait.name === t.name);
            if (!aiTable) return t;

            let newDesc = t.description;
            // Only autofill if empty
            if (!newDesc && aiTable.description) {
                newDesc = aiTable.description;
            }

            // If table is loaded, update columns too
            let newColumns = t.columns;
            if (t.loaded) {
                newColumns = t.columns.map(c => {
                    const aiColDesc = aiMetadataRef.current[t.name]?.columns[c.name];
                    // Only autofill if empty
                    if (aiColDesc && !c.description) {
                         return { ...c, description: aiColDesc };
                    }
                    return c;
                });
            }

            return {
                ...t,
                description: newDesc,
                columns: newColumns
            };
        });

        updateData({ tables: updatedTables });
    } catch (err) {
        console.error('Failed to batch generate descriptions', err);
    } finally {
        setIsBatchTableLoading(false);
    }
  };

  const handleBatchColumnAutofill = (tableId: string) => {
    setAutofilling(`BATCH-COL-${tableId}`);
    setTimeout(() => {
        const table = data.tables.find(t => t.id === tableId);
        if(table) {
             const updatedColumns = table.columns.map(col => {
                if (col.description) return col;
                
                // Check cache first
                const cached = aiMetadataRef.current[tableId]?.columns[col.name];
                if (cached) return { ...col, description: cached };

                let aiText = `Automatically inferred: This represents the ${col.name.replace(/_/g, ' ')} of the ${table.name}.`;
                if (col.isPrimaryKey) aiText = "Unique primary identifier.";
                if (col.isForeignKey) aiText = "Reference to external entity.";
                return { ...col, description: aiText };
             });
             
             const updatedTables = data.tables.map(t => 
                t.id === tableId ? { ...t, columns: updatedColumns } : t
             );
             updateData({ tables: updatedTables });
        }
        setAutofilling(null);
    }, 1500);
  };

  const handleNext = async () => {
    setIsSaving(true);
    try {
        const selectedTables = data.tables.filter(t => t.selected);
        const payload = {
            org_id: data.orgName,
            schema_name: selectedSchema,
            metadata: {
                database: data.dbName,
                description: data.description || `Metadata snapshot for ${data.projectName}`,
                tables: selectedTables.map(t => ({
                    name: t.name,
                    description: t.description || '',
                    columns: t.columns.map(col => ({
                        name: col.name,
                        description: col.description || '',
                        properties: {
                            type: col.type,
                            ...(col.isPrimaryKey ? { is_primary_key: true } : {}),
                            ...(col.foreignKeyReference ? { foreign_key_to: col.foreignKeyReference } : {})
                        }
                    }))
                }))
            }
        };

        await graphApi.updateGraphSchema(payload);
        onNext();
    } catch (error) {
        console.error("Failed to update graph schema", error);
        alert('Failed to update graph schema. Please try again.');
    } finally {
        setIsSaving(false);
    }
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

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Sidebar: Table List */}
        <div className="lg:w-1/3 flex-shrink-0 sticky top-6">
          <Card className="shadow-supreme border-0" noPadding>
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 space-y-4">
                <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Schema Source</label>
                    <div className="relative group">
                        <select
                            className="w-full appearance-none pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-sm cursor-pointer transition-all hover:border-brand-300 disabled:opacity-50"
                            value={selectedSchema}
                            onChange={handleSchemaChange}
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

                {data.tables.length > 0 && (
                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={toggleSelectAll}
                            className="w-full py-2.5 px-4 bg-white border border-slate-200 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all"
                        >
                            {areAllSelected ? (
                                <>
                                    <Square className="w-4 h-4" />
                                    Deselect All Tables
                                </>
                            ) : (
                                <>
                                    <CheckSquare className="w-4 h-4" />
                                    Select All Tables
                                </>
                            )}
                        </button>
                        
                        <button 
                            onClick={handleBatchTableAutofill}
                            disabled={isBatchTableLoading || selectedCount === 0}
                            className="w-full py-2.5 px-4 bg-white border border-brand-200 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-brand-600 hover:bg-brand-50 hover:shadow-sm transition-all disabled:opacity-50"
                        >
                            {isBatchTableLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Bot className="w-4 h-4" />
                            )}
                            {isBatchTableLoading ? 'Generating Descriptions...' : 'Smart Fill Selected'}
                        </button>
                    </div>
                )}
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
        <div className="flex-1 sticky top-6 min-w-0">
            <Card className="h-[calc(100vh-6rem)] shadow-supreme border-0" noPadding>
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
                            <div className="flex flex-col h-full animate-fade-in">
                                {/* Fixed Header with Table Details */}
                                <div className="flex-none p-6 border-b border-slate-100 bg-white z-10">
                                    <div className="flex items-center gap-5 mb-5">
                                        <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center ring-1 ring-brand-100 shadow-sm shrink-0">
                                            <Table2 className="w-7 h-7 text-brand-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-slate-900 leading-none mb-2">{table.name}</h3>
                                            <div className="flex items-center gap-3">
                                                <p className="text-sm text-slate-500 font-medium">Table Configuration</p>
                                                {!table.selected && (
                                                    <span className="px-2.5 py-0.5 text-[10px] uppercase font-bold tracking-wide text-amber-700 bg-amber-50 rounded-full border border-amber-200">
                                                        Ignored
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Table Description Input */}
                                    <div className="flex gap-3 group/input relative">
                                        <input
                                            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm hover:bg-white hover:border-brand-300"
                                            placeholder={`Add a description for the ${table.name} table...`}
                                            value={table.description || ''}
                                            onChange={(e) => updateTableDescription(table.id, e.target.value)}
                                        />
                                        <button 
                                            onClick={() => handleTableAiAutofill(table.id)}
                                            disabled={!!autofilling}
                                            className={`px-4 py-2.5 rounded-xl border transition-all flex items-center gap-2 font-bold text-xs uppercase tracking-wide
                                                ${table.description 
                                                    ? 'opacity-0 group-hover/input:opacity-100 bg-white text-brand-600 border-brand-200 shadow-md absolute right-0 top-0 bottom-0 z-10' 
                                                    : 'border-slate-200 bg-white text-slate-500 hover:bg-brand-50 hover:border-brand-200 hover:text-brand-600 hover:shadow-sm'
                                                }
                                                ${autofilling === `TABLE-${table.id}` ? 'bg-brand-50 text-brand-600 border-brand-200 opacity-100' : ''}
                                            `}
                                            title={table.description ? "Regenerate description" : "Auto-generate description"}
                                        >
                                            {autofilling === `TABLE-${table.id}` ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : table.description ? (
                                                <RefreshCw className="w-4 h-4" />
                                            ) : (
                                                <Wand2 className="w-4 h-4" />
                                            )}
                                            {table.description ? (autofilling === `TABLE-${table.id}` ? 'Regen...' : 'Regen') : (autofilling === `TABLE-${table.id}` ? 'Gen...' : 'AI Gen')}
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="flex-none px-6 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Column Details</span>
                                    
                                    {table.columns.length > 0 && (
                                        <button 
                                            onClick={() => handleBatchColumnAutofill(table.id)}
                                            disabled={!!autofilling && autofilling.startsWith('BATCH')}
                                            className="flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors disabled:opacity-50"
                                        >
                                            {autofilling === `BATCH-COL-${table.id}` ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <Sparkles className="w-3 h-3" />
                                            )}
                                            Smart Fill All
                                        </button>
                                    )}
                                </div>

                                {/* Scrollable Columns List */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                                    {table.columns.length === 0 ? (
                                         <div className="text-center py-10 text-slate-400 italic">No columns found</div>
                                    ) : (
                                        table.columns.map(col => (
                                            <div key={col.name} className="flex flex-col xl:flex-row xl:items-start gap-4 p-5 rounded-2xl border border-slate-100 bg-slate-50/30 hover:shadow-md hover:border-brand-200 hover:bg-white transition-all duration-300 group">
                                                <div className="w-full xl:w-1/3 space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-sm text-slate-800 break-all">{col.name}</span>
                                                        <div className="flex gap-1.5 shrink-0">
                                                            {col.isPrimaryKey && (
                                                                <span className="flex items-center justify-center w-6 h-6 rounded-md bg-amber-100 text-amber-600 cursor-help" title="Primary Key">
                                                                    <KeyRound className="w-3.5 h-3.5" />
                                                                </span>
                                                            )}
                                                            {col.isForeignKey && (
                                                                <span className="flex items-center justify-center w-6 h-6 rounded-md bg-blue-100 text-blue-600 cursor-help" title={`Foreign Key${col.foreignKeyReference ? ': ' + col.foreignKeyReference : ''}`}>
                                                                    <LinkIcon className="w-3.5 h-3.5" />
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-slate-200/50 text-slate-600 border border-slate-200">
                                                        {col.type}
                                                    </div>
                                                </div>
                                                
                                                <div className="flex-1 flex gap-3 group/input relative">
                                                    <input
                                                        className="flex-1 px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all group-hover:border-slate-300"
                                                        placeholder={`Description for ${col.name}...`}
                                                        value={col.description}
                                                        onChange={(e) => updateColumnDescription(table.id, col.name, e.target.value)}
                                                    />
                                                    <button 
                                                        onClick={() => handleAiAutofill(table.id, col)}
                                                        className={`p-3 rounded-xl border transition-all flex-shrink-0 flex items-center justify-center
                                                            ${col.description 
                                                                ? 'opacity-0 group-hover/input:opacity-100 bg-white text-brand-600 border-brand-200 shadow-md absolute right-0 top-0 bottom-0 z-10 w-12' 
                                                                : 'border-slate-200 bg-white text-slate-400 hover:bg-brand-50 hover:border-brand-200 hover:text-brand-600 hover:shadow-sm'
                                                            }
                                                            ${autofilling === `${table.id}-${col.name}` ? 'bg-brand-50 text-brand-600 border-brand-200 opacity-100' : ''}
                                                        `}
                                                        title={col.description ? "Regenerate" : "Auto-generate"}
                                                    >
                                                         {autofilling === `${table.id}-${col.name}` ? (
                                                            <Loader2 className="w-4.5 h-4.5 animate-spin" />
                                                         ) : col.description ? (
                                                            <RefreshCw className="w-4.5 h-4.5" />
                                                         ) : (
                                                            <Wand2 className="w-4.5 h-4.5" />
                                                         )}
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
        <Button onClick={handleNext} isLoading={isSaving} rightIcon={<ArrowRight className="w-4 h-4" />} size="lg" className="px-8 shadow-brand-600/30">
          {isSaving ? 'Saving...' : 'Next Step'}
        </Button>
      </div>
    </div>
  );
};