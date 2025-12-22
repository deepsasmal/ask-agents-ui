import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BarChart2, Database, Loader2, Plus, ChevronDown, ChevronRight, Wand2, RefreshCw, Sparkles, Table2, Info, Square, CheckSquare, Check, KeyRound, Link as LinkIcon, ChartLine, ChartNoAxesColumn, ChartScatter, ChartArea, ChartPie, Grid3X3, Columns3, Lightbulb, PenLine, ArrowRight, Table, X, AlertTriangle, FlaskConical } from 'lucide-react';
import { Button, Card } from '../ui/Common';
import { llmApi, mindsdbApi } from '../../services/api';
import type { MindsDbDatabase, MindsDbSchemaTable, SchemaDescriptionsV2Request, SchemaDescriptionsV2Response, MindsDbShowTableResponse } from '../../services/api';
import { normalizeMindsDbSchemaTables } from '../../utils/mindsdbSchema';
import { CenteredPanelSkeleton } from '../ui/ModuleSkeletons';

type View = 'EMPTY' | 'BUILDER' | 'CONFIG' | 'SUMMARY';

interface DataInsightsModuleProps {
  onUnsavedChangesChange?: (hasChanges: boolean) => void;
}

// Chart type options with lucide-react icons
const CHART_TYPES = [
  { id: 'bar', label: 'Bar Chart', Icon: ChartNoAxesColumn },
  { id: 'line', label: 'Line Chart', Icon: ChartLine },
  { id: 'pie', label: 'Pie Chart', Icon: ChartPie },
  { id: 'area', label: 'Area Chart', Icon: ChartArea },
  { id: 'scatter', label: 'Scatter Plot', Icon: ChartScatter },
  { id: 'heatmap', label: 'Heatmap', Icon: Grid3X3 },
] as const;

interface InsightColumn {
  name: string;
  type: string;
  description: string;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  foreignKeyReference?: string;
}

interface InsightTable {
  name: string;
  selected: boolean;
  description: string;
  columns: InsightColumn[];
  constraints?: any[];
}

type SampleState = { state: 'idle' | 'loading' | 'success' | 'error'; error?: string; data?: MindsDbShowTableResponse };

const formatCell = (v: any) => {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
};

const SampleTableModal: React.FC<{
  isOpen: boolean;
  dbName: string;
  tableName: string;
  sample: SampleState;
  onClose: () => void;
  onReload: () => void;
}> = ({ isOpen, dbName, tableName, sample, onClose, onReload }) => {
  const MAX_ROWS = 50;
  if (!isOpen) return null;

  const columns = sample.data?.columns || [];
  const rows = sample.data?.rows || [];
  const shownRows = rows.slice(0, MAX_ROWS);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-[95vw] max-w-6xl h-[90vh] max-h-[900px] border border-slate-200 dark:border-slate-800 flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-900/15 border border-brand-100 dark:border-brand-900/40 flex items-center justify-center shrink-0">
                <Table className="w-4 h-4 text-brand-700 dark:text-brand-300" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white truncate">Sample table</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {dbName} • {tableName}
                  {sample.state === 'success' ? (
                    <span className="ml-2 text-slate-400">({rows.length} rows)</span>
                  ) : null}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onReload}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-[0.98]"
              title="Reload sample"
            >
              {sample.state === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              <span className="text-xs font-semibold uppercase tracking-wider">Reload</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden bg-slate-50/50 dark:bg-slate-950">
          {sample.state === 'loading' ? (
            <div className="h-full flex items-center justify-center">
              <div className="flex items-center gap-3 text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
                <span className="text-sm font-medium">Loading sample…</span>
              </div>
            </div>
          ) : sample.state === 'error' ? (
            <div className="h-full flex items-center justify-center p-6">
              <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 max-w-lg w-full animate-fade-in">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/40 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-300" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-slate-900 dark:text-white">Couldn't load sample</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{sample.error || 'Please try again.'}</p>
                    <div className="mt-5 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={onReload}
                        className="px-4 py-2 bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
                      >
                        Retry
                      </button>
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : columns.length === 0 ? (
            <div className="h-full flex items-center justify-center p-6">
              <div className="bg-white dark:bg-slate-900 p-10 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 max-w-lg w-full text-center animate-fade-in">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mb-6">
                  <Table className="w-6 h-6 text-slate-700 dark:text-slate-300" />
                </div>
                <h4 className="text-lg font-semibold text-slate-900 dark:text-white">No data returned</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                  The endpoint returned an empty sample.
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col overflow-hidden">
              <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 backdrop-blur flex items-center justify-between">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Showing <span className="font-semibold text-slate-900 dark:text-slate-100">{shownRows.length}</span> of{' '}
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{rows.length}</span> rows
                  {rows.length > MAX_ROWS ? <span className="ml-2 text-slate-400">(truncated)</span> : null}
                </div>
                <div className="text-xs text-slate-400">{columns.length} columns</div>
              </div>

              <div className="flex-1 overflow-auto custom-scrollbar p-6">
                <div className="min-w-max rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
                  <table className="min-w-max w-full border-collapse">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-white/95 dark:bg-slate-900/90 backdrop-blur">
                        {columns.map((c) => (
                          <th
                            key={c}
                            className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 whitespace-nowrap border-b border-slate-200 dark:border-slate-800 border-r border-slate-200 dark:border-slate-800 last:border-r-0"
                          >
                            {c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {shownRows.map((r, idx) => (
                        <tr
                          key={idx}
                          className={`bg-white dark:bg-slate-900 ${idx % 2 === 1 ? 'bg-slate-50/40 dark:bg-slate-950/10' : ''}`}
                        >
                          {columns.map((c) => (
                            <td
                              key={c}
                              className="px-3 py-2 text-xs text-slate-700 dark:text-slate-200 whitespace-nowrap border-b border-slate-200 dark:border-slate-800 border-r border-slate-200 dark:border-slate-800 last:border-r-0"
                            >
                              {formatCell((r as any)?.[c])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const LS_SELECTED_DB = 'data_insights_selected_db';
const LS_DRAFT_PREFIX = 'data_insights_draft_v1:';

export const DataInsightsModule: React.FC<DataInsightsModuleProps> = ({ onUnsavedChangesChange }) => {
  const [dbsState, setDbsState] = useState<'loading' | 'success' | 'error'>('loading');
  const [dbsError, setDbsError] = useState<string>('');
  const [dbs, setDbs] = useState<MindsDbDatabase[]>([]);
  const [selectedDb, setSelectedDb] = useState<string>(() => {
    try {
      return localStorage.getItem(LS_SELECTED_DB) || '';
    } catch {
      return '';
    }
  });

  const [view, setView] = useState<View>('EMPTY');

  // Builder state
  const [schemaState, setSchemaState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [schemaError, setSchemaError] = useState<string>('');
  const [aiError, setAiError] = useState<string>('');
  const [tables, setTables] = useState<InsightTable[]>([]);
  const [expandedTable, setExpandedTable] = useState<string | null>(null);
  const [isTablesPanelCollapsed, setIsTablesPanelCollapsed] = useState(false);

  // "AI" loading markers
  const [autofilling, setAutofilling] = useState<string | null>(null);
  const [batchFilling, setBatchFilling] = useState(false);

  // Config step state
  const [insightName, setInsightName] = useState('');
  const [insightContext, setInsightContext] = useState('');
  const [selectedChartTypes, setSelectedChartTypes] = useState<string[]>([]);

  // Sample modal state
  const [sampleTableName, setSampleTableName] = useState<string | null>(null);
  const [sample, setSample] = useState<SampleState>({ state: 'idle' });

  const initializedRef = useRef(false);
  const draftSaveTimerRef = useRef<number | null>(null);

  type DraftTable = {
    name: string;
    selected?: boolean;
    description?: string;
    columns?: Array<{ name: string; description?: string }>;
  };

  type DataInsightsDraftV1 = {
    version: 1;
    db: string;
    updatedAt: number;
    view: View;
    insightName: string;
    insightContext: string;
    selectedChartTypes: string[];
    expandedTable: string | null;
    isTablesPanelCollapsed: boolean;
    tables: DraftTable[];
  };

  const draftKeyForDb = (dbName: string) => `${LS_DRAFT_PREFIX}${dbName}`;

  const readDraft = (dbName: string): DataInsightsDraftV1 | null => {
    if (!dbName) return null;
    try {
      const raw = localStorage.getItem(draftKeyForDb(dbName));
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<DataInsightsDraftV1>;
      if (parsed.version !== 1 || parsed.db !== dbName) return null;
      return parsed as DataInsightsDraftV1;
    } catch {
      return null;
    }
  };

  const mergeDraftIntoTables = (fresh: InsightTable[], draftTables: DraftTable[] | undefined) => {
    const draftByTable = new Map<string, DraftTable>();
    (draftTables || []).forEach((t) => {
      if (t?.name) draftByTable.set(t.name, t);
    });

    return fresh.map((t) => {
      const dt = draftByTable.get(t.name);
      if (!dt) return t;
      const draftCols = new Map<string, string>();
      (dt.columns || []).forEach((c) => {
        if (c?.name) draftCols.set(c.name, String(c.description || ''));
      });

      return {
        ...t,
        selected: typeof dt.selected === 'boolean' ? dt.selected : t.selected,
        description: typeof dt.description === 'string' ? dt.description : t.description,
        columns: (t.columns || []).map((c) => ({
          ...c,
          description: draftCols.has(c.name) ? (draftCols.get(c.name) || '') : c.description,
        }))
      };
    });
  };

  const selectedCount = useMemo(() => tables.filter(t => t.selected).length, [tables]);
  const areAllSelected = tables.length > 0 && tables.every(t => t.selected);

  const hasChanges = useMemo(() => {
    if (insightName.trim()) return true;
    if (insightContext.trim()) return true;
    if (selectedChartTypes.length > 0) return true;
    if (tables.some(t =>
      !!t.selected ||
      !!t.description?.trim() ||
      (t.columns || []).some(c => !!c.description?.trim())
    )) return true;
    return false;
  }, [insightName, insightContext, selectedChartTypes, tables]);

  useEffect(() => {
    onUnsavedChangesChange?.(hasChanges);
  }, [hasChanges, onUnsavedChangesChange]);

  const validation = useMemo(() => {
    const selected = tables.filter(t => t.selected);
    const missingTableDescriptions = selected.filter(t => !t.description?.trim()).length;
    const missingColumnDescriptions = selected.reduce((acc, t) => {
      const missingCols = (t.columns || []).filter(c => !c.description?.trim()).length;
      return acc + missingCols;
    }, 0);

    const canProceed =
      selected.length > 0 &&
      missingTableDescriptions === 0 &&
      missingColumnDescriptions === 0 &&
      schemaState === 'success' &&
      !batchFilling &&
      !autofilling;

    return { canProceed, missingTableDescriptions, missingColumnDescriptions };
  }, [tables, schemaState, batchFilling, autofilling]);

  const loadDatabases = async () => {
    setDbsState('loading');
    setDbsError('');
    try {
      const list = await mindsdbApi.getDatabases();
      setDbs(Array.isArray(list) ? list : []);
      setDbsState('success');
    } catch (e: any) {
      setDbs([]);
      setDbsState('error');
      setDbsError(e?.message || 'Failed to load databases.');
    }
  };

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    loadDatabases();
  }, []);

  // Ensure selectedDb is valid when db list arrives
  useEffect(() => {
    if (dbsState !== 'success') return;
    if (dbs.length === 0) return;
    if (selectedDb && dbs.some(d => d.name === selectedDb)) return;
    // Default to first DB
    setSelectedDb(dbs[0].name);
  }, [dbsState, dbs, selectedDb]);

  // Persist selection
  useEffect(() => {
    try {
      if (selectedDb) localStorage.setItem(LS_SELECTED_DB, selectedDb);
    } catch {
      // ignore
    }
  }, [selectedDb]);

  // Reset view when DB changes
  useEffect(() => {
    setSchemaState('idle');
    setSchemaError('');
    setTables([]);
    setExpandedTable(null);
    setAutofilling(null);
    setBatchFilling(false);
    setIsTablesPanelCollapsed(false);
    setInsightName('');
    setInsightContext('');
    setSelectedChartTypes([]);

    const draft = readDraft(selectedDb);
    if (draft) {
      setView(draft.view || 'BUILDER');
      setInsightName(draft.insightName || '');
      setInsightContext(draft.insightContext || '');
      setSelectedChartTypes(Array.isArray(draft.selectedChartTypes) ? draft.selectedChartTypes : []);
      setExpandedTable(draft.expandedTable ?? null);
      setIsTablesPanelCollapsed(!!draft.isTablesPanelCollapsed);
    } else {
      setView('EMPTY');
    }
  }, [selectedDb]);

  const toInsightTables = (schemaTables: MindsDbSchemaTable[]): InsightTable[] => {
    const safeTrim = (v: unknown) => String(v ?? '').trim();
    const rawConstraintsByName = new Map<string, any[]>();
    (Array.isArray(schemaTables) ? schemaTables : []).forEach((t: any) => {
      const name = safeTrim(t?.table_name);
      if (!name) return;
      const constraints = Array.isArray(t?.constraints) ? t.constraints : [];
      rawConstraintsByName.set(name, constraints);
    });

    const normalized = normalizeMindsDbSchemaTables(schemaTables);
    return normalized.map((t) => ({
      name: t.tableName,
      selected: false,
      description: '',
      constraints: rawConstraintsByName.get(t.tableName) || [],
      columns: t.columns.map((c) => ({
        name: c.name,
        type: c.type,
        description: '',
        isPrimaryKey: c.isPrimaryKey,
        isForeignKey: c.isForeignKey,
        foreignKeyReference: c.foreignKeyReference
      }))
    }));
  };

  const loadSchema = async (options?: { force?: boolean }) => {
    if (!selectedDb) return;
    setSchemaState('loading');
    setSchemaError('');
    try {
      const schemaTables = await mindsdbApi.getDbSchema(selectedDb, options);
      const mapped = toInsightTables(schemaTables);
      const draft = readDraft(selectedDb);
      const merged = draft ? mergeDraftIntoTables(mapped, draft.tables) : mapped;
      setTables(merged);
      setSchemaState('success');
      const nextExpanded =
        draft?.expandedTable && merged.some(t => t.name === draft.expandedTable)
          ? draft.expandedTable
          : (merged[0]?.name || null);
      setExpandedTable(nextExpanded);
    } catch (e: any) {
      setTables([]);
      setSchemaState('error');
      setSchemaError(e?.message || 'Failed to load schema.');
    }
  };

  // If we have a draft that was in-progress, ensure schema is loaded when returning
  useEffect(() => {
    if (!selectedDb) return;
    if (schemaState !== 'idle') return;
    const draft = readDraft(selectedDb);
    if (!draft) return;
    if (draft.view === 'EMPTY') return;
    void loadSchema();
  }, [selectedDb, schemaState]);

  // Persist draft (per DB) so manual/AI-filled descriptions survive module switches
  useEffect(() => {
    if (!selectedDb) return;

    if (draftSaveTimerRef.current) {
      window.clearTimeout(draftSaveTimerRef.current);
      draftSaveTimerRef.current = null;
    }

    // Save only if there's meaningful progress
    if (!hasChanges) return;

    draftSaveTimerRef.current = window.setTimeout(() => {
      const draft: DataInsightsDraftV1 = {
        version: 1,
        db: selectedDb,
        updatedAt: Date.now(),
        view,
        insightName,
        insightContext,
        selectedChartTypes,
        expandedTable,
        isTablesPanelCollapsed,
        tables: (tables || []).map((t) => ({
          name: t.name,
          selected: t.selected,
          description: t.description,
          columns: (t.columns || []).map((c) => ({ name: c.name, description: c.description }))
        }))
      };

      try {
        localStorage.setItem(draftKeyForDb(selectedDb), JSON.stringify(draft));
      } catch {
        // ignore
      }
    }, 250);

    return () => {
      if (draftSaveTimerRef.current) {
        window.clearTimeout(draftSaveTimerRef.current);
        draftSaveTimerRef.current = null;
      }
    };
  }, [selectedDb, view, insightName, insightContext, selectedChartTypes, expandedTable, isTablesPanelCollapsed, tables, hasChanges]);

  const reloadSchema = () => {
    void loadSchema({ force: true });
  };

  const handleCreateInsights = async () => {
    // For now: "builder" is the creation flow. No persistence endpoint yet.
    setView('BUILDER');
    await loadSchema();
  };

  const toggleTableSelection = (tableName: string) => {
    setTables(prev => prev.map(t => t.name === tableName ? { ...t, selected: !t.selected } : t));
  };

  const toggleSelectAll = () => {
    const next = !areAllSelected;
    setTables(prev => prev.map(t => ({ ...t, selected: next })));
  };

  const updateTableDescription = (tableName: string, desc: string) => {
    setTables(prev => prev.map(t => t.name === tableName ? { ...t, description: desc } : t));
  };

  const updateColumnDescription = (tableName: string, columnName: string, desc: string) => {
    setTables(prev => prev.map(t => {
      if (t.name !== tableName) return t;
      return { ...t, columns: t.columns.map(c => c.name === columnName ? { ...c, description: desc } : c) };
    }));
  };

  type V2FillRequest = {
    tableName: string;
    fillTableDescription: boolean;
    columnNames: string[]; // columns to fill/overwrite
    onlyIfEmpty: boolean; // if true, do not overwrite existing descriptions
  };

  const callSchemaDescriptionsV2 = async (requests: V2FillRequest[]) => {
    if (!selectedDb) throw new Error('No database selected');
    const byTable = new Map<string, V2FillRequest>();
    requests.forEach((r) => byTable.set(r.tableName, r));

    const payloadTables: SchemaDescriptionsV2Request['tables'] = tables
      .filter((t) => byTable.has(t.name))
      .map((t) => {
        const req = byTable.get(t.name)!;
        const names = req.columnNames;
        const wantedCols = names.length
          ? t.columns.filter((c) => names.includes(c.name))
          : t.columns.slice(0, Math.min(5, t.columns.length)); // provide minimal context if only table desc is requested

        return {
          table_name: t.name,
          columns: wantedCols.map((c) => ({
            name: c.name,
            type: c.type,
            is_primary_key: !!c.isPrimaryKey,
            is_foreign_key: !!c.isForeignKey
          })),
          constraints: Array.isArray(t.constraints) ? t.constraints : []
        };
      });

    const payload: SchemaDescriptionsV2Request = {
      db: selectedDb,
      tables: payloadTables
    };

    const resp = await llmApi.generateSchemaDescriptionsV2(payload);
    applyV2Response(resp, requests);
  };

  const applyV2Response = (resp: SchemaDescriptionsV2Response, requests: V2FillRequest[]) => {
    const reqByTable = new Map<string, V2FillRequest>();
    requests.forEach((r) => reqByTable.set(r.tableName, r));

    const respByTable = new Map<string, { description?: string; columns?: Array<{ name: string; description?: string }> }>();
    (resp?.tables || []).forEach((t) => {
      if (!t?.name) return;
      respByTable.set(t.name, { description: t.description, columns: t.columns });
    });

    setTables((prev) =>
      prev.map((t) => {
        const req = reqByTable.get(t.name);
        const rt = respByTable.get(t.name);
        if (!req || !rt) return t;

        const next: InsightTable = { ...t };

        if (req.fillTableDescription && rt.description) {
          if (!req.onlyIfEmpty || !next.description?.trim()) next.description = rt.description;
        }

        if (Array.isArray(req.columnNames) && req.columnNames.length > 0 && Array.isArray(rt.columns)) {
          const colDescByName = new Map<string, string>();
          rt.columns.forEach((c) => {
            if (c?.name && c?.description) colDescByName.set(c.name, c.description);
          });

          next.columns = next.columns.map((c) => {
            if (!req.columnNames.includes(c.name)) return c;
            const newDesc = colDescByName.get(c.name);
            if (!newDesc) return c;
            if (req.onlyIfEmpty && c.description?.trim()) return c;
            return { ...c, description: newDesc };
          });
        }

        return next;
      })
    );
  };

  const aiFillTable = async (tableName: string) => {
    if (batchFilling) return;
    setAiError('');
    setAutofilling(`TABLE:${tableName}`);
    try {
      const t = tables.find((x) => x.name === tableName);
      if (!t) return;
      const missingCols = t.columns.filter((c) => !c.description?.trim()).map((c) => c.name);
      await callSchemaDescriptionsV2([
        { tableName, fillTableDescription: true, columnNames: missingCols, onlyIfEmpty: false }
      ]);
    } catch (e: any) {
      console.error('AI fill table failed', e);
      setAiError(e?.message || 'Smart fill failed. Please try again.');
    } finally {
      setAutofilling(null);
    }
  };

  const aiFillColumn = async (tableName: string, colName: string) => {
    if (batchFilling) return;
    setAiError('');
    setAutofilling(`COL:${tableName}:${colName}`);
    try {
      await callSchemaDescriptionsV2([
        { tableName, fillTableDescription: false, columnNames: [colName], onlyIfEmpty: false }
      ]);
    } catch (e: any) {
      console.error('AI fill column failed', e);
      setAiError(e?.message || 'Smart fill failed. Please try again.');
    } finally {
      setAutofilling(null);
    }
  };

  const aiFillAllSelected = async () => {
    if (batchFilling || !!autofilling) return;
    const selected = tables.filter(t => t.selected);
    if (selected.length === 0) return;

    const requests: V2FillRequest[] = selected
      .map((t) => {
        const fillTableDescription = !t.description?.trim();
        const missingCols = t.columns.filter((c) => !c.description?.trim()).map((c) => c.name);
        return { tableName: t.name, fillTableDescription, columnNames: missingCols, onlyIfEmpty: true };
      })
      .filter((r) => r.fillTableDescription || r.columnNames.length > 0);

    if (requests.length === 0) return;

    setAiError('');
    setBatchFilling(true);
    try {
      await callSchemaDescriptionsV2(requests);
    } catch (e: any) {
      console.error('AI batch fill failed', e);
      setAiError(e?.message || 'Smart fill failed. Please try again.');
    } finally {
      setBatchFilling(false);
    }
  };

  // Sample modal handlers
  const openSample = async (tableName: string) => {
    const t = String(tableName || '').trim();
    if (!t || !selectedDb) return;
    setSampleTableName(t);
    setSample({ state: 'loading' });
    try {
      const data = await mindsdbApi.getShowTable(selectedDb, t);
      setSample({ state: 'success', data });
    } catch (e: any) {
      setSample({ state: 'error', error: e?.message || 'Failed to load sample.' });
    }
  };

  const reloadSample = async () => {
    if (!sampleTableName) return;
    mindsdbApi.clearCache();
    await openSample(sampleTableName);
  };

  const isInWizard = view === 'CONFIG' || view === 'SUMMARY';

  type WizardStep = 1 | 2 | 3;

  const WizardStepper: React.FC<{ current: WizardStep }> = ({ current }) => {
    const StepDot: React.FC<{
      step: WizardStep;
      label: string;
      canClick?: boolean;
      onClick?: () => void;
    }> = ({ step, label, canClick = false, onClick }) => {
      const isCompleted = step < current;
      const isCurrent = step === current;
      const baseDot = "w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-extrabold transition-all duration-300 motion-reduce:transition-none";
      const dotClass = isCurrent
        ? "bg-brand-600 text-white shadow-sm ring-4 ring-brand-100 dark:ring-brand-900/40"
        : isCompleted
          ? "bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-900/40"
          : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700";

      const labelClass = isCurrent
        ? "text-slate-900 dark:text-white"
        : isCompleted
          ? "text-slate-700 dark:text-slate-200"
          : "text-slate-400 dark:text-slate-600";

      return (
        <button
          type="button"
          onClick={canClick ? onClick : undefined}
          disabled={!canClick}
          className={`group flex items-center gap-2 ${canClick ? 'cursor-pointer hover:-translate-y-0.5 motion-reduce:hover:translate-y-0' : 'cursor-default'} focus:outline-none`}
          title={canClick ? `Go to ${label}` : label}
        >
          <span
            className={`${baseDot} ${dotClass} ${canClick ? 'group-hover:shadow-md' : ''}`}
          >
            {isCompleted ? <Check className="w-4 h-4" /> : step}
          </span>
          <span className={`hidden sm:block text-[11px] font-bold uppercase tracking-wide transition-colors ${labelClass}`}>
            {label}
          </span>
        </button>
      );
    };

    const Connector: React.FC<{ active: boolean }> = ({ active }) => (
      <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800 mx-3 rounded-full overflow-hidden">
        <div
          className={`h-full bg-brand-500 transition-all duration-500 motion-reduce:transition-none ${active ? 'w-full' : 'w-0'}`}
        />
      </div>
    );

    return (
      <div className="flex items-center w-fit">
        <StepDot step={1} label="Schema" canClick={true} onClick={() => setView('BUILDER')} />
        <Connector active={current > 1} />
        <StepDot step={2} label="Configure" canClick={current > 2} onClick={() => setView('CONFIG')} />
        <Connector active={current > 2} />
        <StepDot step={3} label="Summary" />
      </div>
    );
  };

  const header = (
    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-900/15 border border-brand-100 dark:border-brand-900/40 flex items-center justify-center">
          <BarChart2 className="w-5 h-5 text-brand-700 dark:text-brand-300" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white leading-tight">Data Insights</h1>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-300">
              <FlaskConical className="w-3 h-3" />
              <span className="text-[10px] font-bold uppercase tracking-wide">Experimental</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isInWizard ? 'Creating new insight' : 'Pick a database to start building insights'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* DB Selector - disabled when in wizard */}
        <div className={`relative group ${isInWizard ? 'opacity-50 pointer-events-none' : ''}`}>
          <select
            value={selectedDb}
            onChange={(e) => setSelectedDb(e.target.value)}
            disabled={dbsState !== 'success' || dbs.length === 0 || isInWizard}
            className="appearance-none pl-10 pr-9 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/15 min-w-[220px]"
          >
            {dbs.length === 0 ? (
              <option value="">{dbsState === 'loading' ? 'Loading…' : 'No databases'}</option>
            ) : (
              dbs.map((d) => (
                <option key={d.name} value={d.name}>
                  {d.name}{d.engine ? ` (${d.engine})` : ''}
                </option>
              ))
            )}
          </select>
          <Database className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-600 pointer-events-none" />
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-hover:text-brand-500 transition-colors" />
        </div>

        {view === 'EMPTY' ? (
          <Button
            onClick={handleCreateInsights}
            disabled={!selectedDb || dbsState !== 'success'}
            leftIcon={<Plus className="w-4 h-4" />}
            className="shadow-brand-600/20"
          >
            Create insights
          </Button>
        ) : view === 'BUILDER' ? (
          <Button
            onClick={() => setView('EMPTY')}
            variant="secondary"
          >
            Back
          </Button>
        ) : (
          /* In CONFIG or SUMMARY - show Cancel button */
          <Button
            onClick={() => setView('BUILDER')}
            variant="secondary"
            disabled={true}
            className="opacity-50 cursor-not-allowed"
          >
            Back to Schema
          </Button>
        )}
      </div>
    </div>
  );

  if (dbsState === 'loading') {
    return (
      <div className="flex-1 h-full flex flex-col bg-white dark:bg-slate-950">
        {header}
        <CenteredPanelSkeleton titleLines={1} bodyLines={3} />
      </div>
    );
  }

  if (dbsState === 'error') {
    return (
      <div className="flex-1 h-full flex flex-col bg-white dark:bg-slate-950">
        {header}
        <div className="flex-1 flex items-center justify-center p-6 bg-slate-50/50 dark:bg-slate-900/20">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 max-w-lg w-full animate-fade-in">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Couldn’t load databases</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{dbsError || 'Please try again.'}</p>
            <div className="mt-5">
              <Button onClick={loadDatabases} leftIcon={<RefreshCw className="w-4 h-4" />}>
                Retry
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full flex flex-col bg-white dark:bg-slate-950 relative">
      {/* Sample Table Modal */}
      <SampleTableModal
        isOpen={!!sampleTableName}
        dbName={selectedDb}
        tableName={sampleTableName || ''}
        sample={sample}
        onClose={() => setSampleTableName(null)}
        onReload={reloadSample}
      />
      {header}

      {view === 'EMPTY' ? (
        <div className="flex-1 flex items-center justify-center p-6 bg-slate-50/50 dark:bg-slate-900/20">
          <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 text-center max-w-lg w-full flex flex-col items-center animate-fade-in">
            <div className="relative mb-8">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center -rotate-12 absolute -left-8 -top-4 shadow-sm border border-slate-200 dark:border-slate-700">
                <BarChart2 className="w-8 h-8 text-slate-700 dark:text-slate-300" />
              </div>
              <div className="w-16 h-16 bg-brand-50 dark:bg-brand-900/20 rounded-xl flex items-center justify-center rotate-12 relative z-10 shadow-sm border border-brand-100 dark:border-brand-900/40">
                <div className="w-8 h-8 rounded border-2 border-brand-500 flex items-center justify-center">
                  <div className="w-4 h-0.5 bg-brand-500"></div>
                </div>
              </div>
            </div>

            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No insights available</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm mx-auto text-sm leading-relaxed">
              Create your first insights definition by selecting tables and adding lightweight descriptions.
            </p>

            <Button onClick={handleCreateInsights} leftIcon={<Plus className="w-4 h-4" />} className="shadow-brand-600/20">
              Create insights
            </Button>
          </div>
        </div>
      ) : view === 'BUILDER' ? (
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col animate-fade-in">
          {/* Builder header strip */}
          <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-start md:items-center justify-between gap-3">
            <div className="flex flex-col md:flex-row md:items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => setIsTablesPanelCollapsed(v => !v)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[11px] font-bold text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all w-fit"
                title={isTablesPanelCollapsed ? 'Show tables panel' : 'Hide tables panel'}
              >
                <Table2 className="w-4 h-4" />
                {isTablesPanelCollapsed ? 'Show tables' : 'Hide tables'}
              </button>

              <div className="flex items-center gap-2 text-[11px] font-bold text-brand-700 bg-brand-50 dark:bg-brand-900/20 px-2.5 py-1.5 rounded-lg border border-brand-200 dark:border-brand-900/40 shadow-sm w-fit">
                <Table2 className="w-3.5 h-3.5" />
                {selectedCount} selected
              </div>

              <div className="min-w-0 text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                <span className="font-semibold text-slate-700 dark:text-slate-200">Describe selected</span> tables/columns.
                {selectedCount > 0 ? (
                  <span className="ml-1">
                    Remaining: <span className="font-semibold">{validation.missingTableDescriptions}</span> table,{' '}
                    <span className="font-semibold">{validation.missingColumnDescriptions}</span> column.
                  </span>
                ) : (
                  <span className="ml-1">Select one or more tables to begin.</span>
                )}
                {aiError ? (
                  <span className="block mt-0.5 text-[11px] text-red-600 dark:text-red-400 font-medium">
                    {aiError}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[11px] font-bold text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                {areAllSelected ? <Square className="w-4 h-4" /> : <CheckSquare className="w-4 h-4" />}
                {areAllSelected ? 'Deselect all' : 'Select all'}
              </button>
              <button
                type="button"
                onClick={aiFillAllSelected}
                disabled={batchFilling || selectedCount === 0}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-brand-200 dark:border-brand-900/40 bg-white dark:bg-slate-900 text-[11px] font-bold text-brand-700 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-all disabled:opacity-50"
                title="AI fill descriptions for selected tables/columns"
              >
                {batchFilling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {batchFilling ? 'Filling…' : 'Smart fill'}
              </button>
              <button
                type="button"
                onClick={reloadSchema}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[11px] font-bold text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                title="Reload schema"
              >
                {schemaState === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Reload schema
              </button>

              <Button
                disabled={!validation.canProceed}
                onClick={() => setView('CONFIG')}
                rightIcon={<ChevronRight className="w-4 h-4" />}
                className="shadow-brand-600/20"
                title={
                  validation.canProceed
                    ? 'Proceed'
                    : selectedCount === 0
                      ? 'Select at least one table'
                      : `Add descriptions to continue (${validation.missingTableDescriptions} table(s), ${validation.missingColumnDescriptions} column(s) missing)`
                }
              >
                Next
              </Button>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden flex flex-col lg:flex-row gap-2 p-2 bg-slate-50/40 dark:bg-slate-950">
            {/* Left panel */}
            {!isTablesPanelCollapsed ? (
              <div className="lg:w-[260px] flex-shrink-0 min-h-0 flex flex-col">
                <Card className="shadow-supreme border-0 flex flex-col flex-1 min-h-0" noPadding>
                  <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 shrink-0">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tables</div>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-100 dark:divide-slate-800 relative">
                    {schemaState === 'loading' && (
                      <div className="absolute inset-0 bg-white/80 dark:bg-slate-950/70 flex items-center justify-center z-10 backdrop-blur-sm">
                        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
                      </div>
                    )}

                    {schemaState === 'error' && (
                      <div className="p-6 text-center">
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">Failed to load schema</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{schemaError}</div>
                        <div className="mt-4">
                          <Button onClick={reloadSchema} size="sm" leftIcon={<RefreshCw className="w-4 h-4" />}>
                            Retry
                          </Button>
                        </div>
                      </div>
                    )}

                    {schemaState === 'success' && tables.length === 0 && (
                      <div className="p-8 text-center text-slate-400 text-sm">
                        No tables found in this database.
                      </div>
                    )}

                    {schemaState === 'success' && tables.map((t) => (
                      <div
                        key={t.name}
                        className={`group flex items-center justify-between p-2.5 cursor-pointer transition-all border-l-[3px] ${expandedTable === t.name ? 'bg-brand-50/30 dark:bg-brand-900/10 border-brand-600' : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-900/40'}`}
                      >
                        <div className="flex items-center gap-3 flex-1 overflow-hidden" onClick={() => setExpandedTable(t.name)}>
                          <div className="relative flex items-center justify-center shrink-0" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={t.selected}
                              onChange={() => toggleTableSelection(t.name)}
                              className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-slate-300 dark:border-slate-600 transition-all checked:border-brand-600 checked:bg-brand-600 hover:border-brand-400 focus:ring-2 focus:ring-brand-500/20"
                            />
                            <svg
                              className="pointer-events-none absolute h-3 w-3 text-white opacity-0 transition-opacity peer-checked:opacity-100"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth="3"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>

                          <div className="flex flex-col min-w-0">
                            <span className={`text-xs truncate ${t.selected ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>{t.name}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{t.columns.length} cols</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setExpandedTable(t.name)}
                          className={`text-slate-400 hover:text-brand-600 p-1 rounded hover:bg-brand-50 dark:hover:bg-brand-900/15 transition-colors shrink-0 ${expandedTable === t.name ? 'text-brand-600 bg-brand-50 dark:bg-brand-900/15' : ''}`}
                          title="View details"
                        >
                          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${expandedTable === t.name ? 'rotate-90' : ''}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            ) : null}

            {/* Right panel */}
            <div className="flex-1 min-w-0 min-h-0 flex flex-col">
              <Card className="flex-1 min-h-0 flex flex-col shadow-supreme border-0" noPadding>
                {!expandedTable ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20">
                    <div className="w-24 h-24 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-6 ring-1 ring-slate-100 dark:ring-slate-800 shadow-inner">
                      <Info className="w-10 h-10 opacity-30" />
                    </div>
                    <p className="font-bold text-lg text-slate-600 dark:text-slate-200">No table selected</p>
                    <p className="text-sm">Select a table from the left to configure</p>
                  </div>
                ) : (
                  (() => {
                    const table = tables.find(t => t.name === expandedTable);
                    if (!table) return null;
                    return (
                      <div className="flex flex-col h-full animate-fade-in">
                        {/* Table header */}
                        <div className="flex-none p-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 z-10">
                          <div className="flex items-center justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/15 flex items-center justify-center ring-1 ring-brand-100 dark:ring-brand-900/40 shadow-sm shrink-0">
                                <Table2 className="w-5 h-5 text-brand-600" />
                              </div>
                              <div className="min-w-0">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-none mb-1.5 truncate">{table.name}</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Table description</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => openSample(table.name)}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wide bg-brand-50 text-brand-700 border border-brand-100 hover:bg-brand-100 transition-colors dark:bg-brand-900/20 dark:text-brand-300 dark:border-brand-900/40 dark:hover:bg-brand-900/30 shrink-0"
                              title="View sample rows"
                            >
                              <Table className="w-4 h-4" />
                              Sample
                            </button>
                          </div>

                          <div className="flex gap-2 group/input relative">
                            <input
                              className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm hover:bg-white dark:hover:bg-slate-900/60 hover:border-brand-300"
                              placeholder={`Add a description for ${table.name}…`}
                              value={table.description}
                              onChange={(e) => updateTableDescription(table.name, e.target.value)}
                            />
                            <button
                              type="button"
                              onClick={() => aiFillTable(table.name)}
                              disabled={!!autofilling}
                              className={`px-3 py-2 rounded-lg border transition-all flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-wide
                                ${table.description
                                  ? 'opacity-0 group-hover/input:opacity-100 bg-white dark:bg-slate-950 text-brand-600 border-brand-200 shadow-md absolute right-0 top-0 bottom-0 z-10'
                                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-300 hover:bg-brand-50 dark:hover:bg-brand-900/15 hover:border-brand-200 hover:text-brand-600 hover:shadow-sm'}
                                ${autofilling === `TABLE:${table.name}` ? 'bg-brand-50 text-brand-600 border-brand-200 opacity-100' : ''}
                              `}
                              title={table.description ? 'Regenerate description' : 'AI generate description'}
                            >
                              {autofilling === `TABLE:${table.name}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (table.description ? <RefreshCw className="w-3.5 h-3.5" /> : <Wand2 className="w-3.5 h-3.5" />)}
                              {table.description ? 'Regen' : 'AI Gen'}
                            </button>
                          </div>
                        </div>

                        <div className="flex-none px-3 py-2 bg-slate-50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Columns</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{table.columns.length}</span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar bg-white dark:bg-slate-950">
                          {table.columns.map((c) => (
                            <div
                              key={c.name}
                              className="flex flex-col xl:flex-row xl:items-start gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/20 hover:shadow-md hover:border-brand-200 dark:hover:border-brand-900/40 hover:bg-white dark:hover:bg-slate-900/30 transition-all duration-300 group"
                            >
                              <div className="w-full xl:w-1/3 space-y-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-xs text-slate-800 dark:text-slate-100 break-all">{c.name}</span>
                                  <div className="flex items-center gap-1 shrink-0">
                                    {c.isPrimaryKey ? (
                                      <span className="flex items-center justify-center w-5 h-5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-200" title="Primary key">
                                        <KeyRound className="w-3 h-3" />
                                      </span>
                                    ) : null}
                                    {c.isForeignKey ? (
                                      <span
                                        className="flex items-center justify-center w-5 h-5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-200"
                                        title={c.foreignKeyReference ? `Foreign key → ${c.foreignKeyReference}` : 'Foreign key'}
                                      >
                                        <LinkIcon className="w-3 h-3" />
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                                <div className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                                  {c.type || 'unknown'}
                                </div>
                                {c.isForeignKey && c.foreignKeyReference ? (
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400 break-all">
                                    <span className="font-semibold">→</span> {c.foreignKeyReference}
                                  </div>
                                ) : null}
                              </div>

                              <div className="flex-1 flex gap-2 group/input relative">
                                <input
                                  className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all group-hover:border-slate-300 dark:group-hover:border-slate-700 text-slate-900 dark:text-slate-100"
                                  placeholder={`Description for ${c.name}…`}
                                  value={c.description}
                                  onChange={(e) => updateColumnDescription(table.name, c.name, e.target.value)}
                                />
                                <button
                                  type="button"
                                  onClick={() => aiFillColumn(table.name, c.name)}
                                  className={`p-2 rounded-lg border transition-all flex-shrink-0 flex items-center justify-center
                                    ${c.description
                                      ? 'opacity-0 group-hover/input:opacity-100 bg-white dark:bg-slate-950 text-brand-600 border-brand-200 shadow-md absolute right-0 top-0 bottom-0 z-10 w-10'
                                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-400 hover:bg-brand-50 dark:hover:bg-brand-900/15 hover:border-brand-200 hover:text-brand-600 hover:shadow-sm'}
                                    ${autofilling === `COL:${table.name}:${c.name}` ? 'bg-brand-50 text-brand-600 border-brand-200 opacity-100' : ''}
                                  `}
                                  title={c.description ? 'Regenerate' : 'AI generate'}
                                >
                                  {autofilling === `COL:${table.name}:${c.name}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (c.description ? <RefreshCw className="w-3.5 h-3.5" /> : <Wand2 className="w-3.5 h-3.5" />)}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()
                )}
              </Card>
            </div>
          </div>
        </div>
      ) : view === 'CONFIG' ? (
        /* CONFIG STEP - Name, Context & Chart Preferences */
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-[#f8fafc] dark:bg-slate-950 relative">
          {/* Background Visuals (match Graph Builder vibe, subtle) */}
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
            <div
              className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
              style={{
                backgroundImage: 'radial-gradient(#0f172a 1px, transparent 1px)',
                backgroundSize: '24px 24px'
              }}
            />
            <div className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] bg-brand-200/20 rounded-full blur-[100px] animate-pulse-slow motion-reduce:animate-none" />
            <div className="absolute bottom-0 right-0 w-[40vw] h-[40vw] bg-blue-100/30 dark:bg-slate-800/30 rounded-full blur-[90px]" />
          </div>

          <div className="relative z-10 p-4 sm:p-6 animate-fade-in motion-reduce:animate-none" style={{ animationDuration: '0.35s' }}>
            <div className="max-w-5xl mx-auto w-full">
              {/* Title + Step Pills */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Configure Insight</h1>
                  <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
                    Add a name, context, and visualization preferences.
                  </p>
                </div>

                <WizardStepper current={2} />
              </div>

              <Card
                noPadding
                className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 motion-reduce:transition-none motion-reduce:hover:translate-y-0 overflow-hidden focus-within:ring-2 focus-within:ring-brand-500/20"
              >
                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-white/70 dark:bg-slate-950/40 backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-900/15 border border-brand-100 dark:border-brand-900/40 flex items-center justify-center text-brand-700 dark:text-brand-300">
                      <Lightbulb className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-base font-extrabold text-slate-900 dark:text-white">Insight details</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        These fields help generate better insights and charts.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">
                  <div className="group">
                    <label className="flex items-center gap-2 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2">
                      <span className="w-5 h-5 rounded-md bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-900/40 flex items-center justify-center">
                        <PenLine className="w-3 h-3 text-brand-600 dark:text-brand-300" />
                      </span>
                      Insight Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={insightName}
                      onChange={(e) => setInsightName(e.target.value)}
                      placeholder="e.g. Monthly Sales Performance"
                      className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm hover:border-brand-300"
                    />
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      Use a short, descriptive name that will appear in your insights list.
                    </p>
                  </div>

                  <div className="group">
                    <label className="flex items-center gap-2 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2">
                      <span className="w-5 h-5 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                        <Info className="w-3 h-3 text-slate-500" />
                      </span>
                      Context & Instructions
                    </label>
                    <textarea
                      value={insightContext}
                      onChange={(e) => setInsightContext(e.target.value)}
                      placeholder="Describe what you want to learn. Examples:
- Focus on monthly revenue trends
- Compare performance across regions
- Highlight top products"
                      rows={5}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm hover:border-brand-300 resize-none"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2">
                      <span className="w-5 h-5 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                        <BarChart2 className="w-3 h-3 text-slate-500" />
                      </span>
                      Preferred Visualizations
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {CHART_TYPES.map((chart) => {
                        const isSelected = selectedChartTypes.includes(chart.id);
                        return (
                          <button
                            key={chart.id}
                            type="button"
                            onClick={() => {
                              setSelectedChartTypes(prev =>
                                isSelected ? prev.filter(id => id !== chart.id) : [...prev, chart.id]
                              );
                            }}
                            className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-bold transition-all duration-300 motion-reduce:transition-none border hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 ${isSelected
                              ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 border-brand-200 dark:border-brand-900/40 shadow-sm'
                              : 'bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm'
                              }`}
                          >
                            <chart.Icon className={`w-4 h-4 ${isSelected ? 'text-brand-600 dark:text-brand-300' : 'text-slate-500 dark:text-slate-400'}`} />
                            {chart.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex items-center justify-between gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => setView('BUILDER')}
                    className="text-slate-700 dark:text-slate-200"
                  >
                    Back to Schema
                  </Button>
                  <Button
                    onClick={() => setView('SUMMARY')}
                    disabled={!insightName.trim()}
                    rightIcon={<ChevronRight className="w-4 h-4" />}
                    className="shadow-brand-600/20"
                  >
                    Continue
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      ) : view === 'SUMMARY' ? (
        /* SUMMARY STEP - Review before creation */
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-[#f8fafc] dark:bg-slate-950 relative">
          {/* Background Visuals (match Graph Builder vibe, subtle) */}
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
            <div
              className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
              style={{
                backgroundImage: 'radial-gradient(#0f172a 1px, transparent 1px)',
                backgroundSize: '24px 24px'
              }}
            />
            <div className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] bg-brand-200/20 rounded-full blur-[100px] animate-pulse-slow motion-reduce:animate-none" />
            <div className="absolute bottom-0 right-0 w-[40vw] h-[40vw] bg-blue-100/30 dark:bg-slate-800/30 rounded-full blur-[90px]" />
          </div>

          <div className="relative z-10 p-4 sm:p-6 animate-fade-in motion-reduce:animate-none" style={{ animationDuration: '0.35s' }}>
            <div className="max-w-5xl mx-auto w-full">
              {/* Title + Step Pills */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Review & Create</h1>
                  <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
                    Confirm your configuration before creating the insight.
                  </p>
                </div>

                <WizardStepper current={3} />
              </div>

              <Card
                noPadding
                className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 motion-reduce:transition-none motion-reduce:hover:translate-y-0 overflow-hidden focus-within:ring-2 focus-within:ring-brand-500/20"
              >
                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-white/70 dark:bg-slate-950/40 backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-900/15 border border-brand-100 dark:border-brand-900/40 flex items-center justify-center text-brand-700 dark:text-brand-300">
                      <BarChart2 className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-base font-extrabold text-slate-900 dark:text-white">Summary</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        Review your inputs and selected schema scope.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  {/* Insight Name */}
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/30 p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-sm">
                        <Lightbulb className="w-6 h-6 text-brand-600 dark:text-brand-300" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Insight Name</div>
                        <div className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5 truncate" title={insightName}>
                          {insightName}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 motion-reduce:transition-none motion-reduce:hover:translate-y-0 p-5 text-center">
                      <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-900/40 flex items-center justify-center mx-auto mb-3">
                        <Table2 className="w-5 h-5 text-brand-700 dark:text-brand-300" />
                      </div>
                      <div className="text-3xl font-extrabold text-slate-900 dark:text-white">{selectedCount}</div>
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">Tables</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 motion-reduce:transition-none motion-reduce:hover:translate-y-0 p-5 text-center">
                      <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-900/40 flex items-center justify-center mx-auto mb-3">
                        <Columns3 className="w-5 h-5 text-brand-700 dark:text-brand-300" />
                      </div>
                      <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
                        {tables.filter(t => t.selected).reduce((acc, t) => acc + t.columns.length, 0)}
                      </div>
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">Columns</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 motion-reduce:transition-none motion-reduce:hover:translate-y-0 p-5 text-center">
                      <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-900/40 flex items-center justify-center mx-auto mb-3">
                        <BarChart2 className="w-5 h-5 text-brand-700 dark:text-brand-300" />
                      </div>
                      <div className="text-3xl font-extrabold text-slate-900 dark:text-white">{selectedChartTypes.length}</div>
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">Chart Types</div>
                    </div>
                  </div>

                  {/* Context */}
                  {insightContext.trim() && (
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5">
                      <div className="flex items-center gap-2 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2">
                        <Info className="w-4 h-4 text-slate-500" />
                        Context
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-4">
                        {insightContext}
                      </p>
                    </div>
                  )}

                  {/* Selected charts */}
                  {selectedChartTypes.length > 0 && (
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5">
                      <div className="flex items-center gap-2 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-3">
                        <BarChart2 className="w-4 h-4 text-slate-500" />
                        Visualizations
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedChartTypes.map(chartId => {
                          const chart = CHART_TYPES.find(c => c.id === chartId);
                          if (!chart) return null;
                          return (
                            <span
                              key={chartId}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-200"
                            >
                              <chart.Icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                              {chart.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex items-center justify-between gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => setView('CONFIG')}
                    className="text-slate-700 dark:text-slate-200"
                  >
                    Back
                  </Button>
                  <Button
                    disabled={true}
                    variant="secondary"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                    className="px-6 bg-slate-900 hover:bg-slate-800 text-white border border-transparent shadow-sm opacity-60 cursor-not-allowed disabled:bg-slate-900 disabled:hover:bg-slate-900"
                    title="Create Insight is coming soon"
                  >
                    Create Insight
                  </Button>
                </div>
              </Card>

              <div className="mt-3 text-center">
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Create Insight is coming soon.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
