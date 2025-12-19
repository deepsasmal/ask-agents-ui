import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BarChart2, Database, Loader2, Plus, ChevronDown, ChevronRight, Wand2, RefreshCw, Sparkles, Table2, Info, Square, CheckSquare, KeyRound, Link as LinkIcon } from 'lucide-react';
import { Button, Card } from '../ui/Common';
import { llmApi, mindsdbApi } from '../../services/api';
import type { MindsDbDatabase, MindsDbSchemaTable, SchemaDescriptionsV2Request, SchemaDescriptionsV2Response } from '../../services/api';
import { normalizeMindsDbSchemaTables } from '../../utils/mindsdbSchema';
import { CenteredPanelSkeleton } from '../ui/ModuleSkeletons';

type View = 'EMPTY' | 'BUILDER';

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

const LS_SELECTED_DB = 'data_insights_selected_db';

export const DataInsightsModule: React.FC = () => {
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

  const initializedRef = useRef(false);

  const selectedCount = useMemo(() => tables.filter(t => t.selected).length, [tables]);
  const areAllSelected = tables.length > 0 && tables.every(t => t.selected);

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
    setView('EMPTY');
    setSchemaState('idle');
    setSchemaError('');
    setTables([]);
    setExpandedTable(null);
    setAutofilling(null);
    setBatchFilling(false);
    setIsTablesPanelCollapsed(false);
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
      setTables(mapped);
      setSchemaState('success');
      setExpandedTable(mapped[0]?.name || null);
    } catch (e: any) {
      setTables([]);
      setSchemaState('error');
      setSchemaError(e?.message || 'Failed to load schema.');
    }
  };

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

  const header = (
    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-900/15 border border-brand-100 dark:border-brand-900/40 flex items-center justify-center">
          <BarChart2 className="w-5 h-5 text-brand-700 dark:text-brand-300" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white leading-tight">Data Insights</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Pick a database to start building insights</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative group">
          <select
            value={selectedDb}
            onChange={(e) => setSelectedDb(e.target.value)}
            disabled={dbsState !== 'success' || dbs.length === 0}
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
        ) : (
          <Button
            onClick={() => setView('EMPTY')}
            variant="secondary"
          >
            Back
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
      ) : (
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
                onClick={() => { /* no-op for now */ }}
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
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/15 flex items-center justify-center ring-1 ring-brand-100 dark:ring-brand-900/40 shadow-sm shrink-0">
                              <Table2 className="w-5 h-5 text-brand-600" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-none mb-1.5 truncate">{table.name}</h3>
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Table description</p>
                            </div>
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
      )}
    </div>
  );
};
