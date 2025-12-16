import React, { useEffect, useMemo, useState } from 'react';
import { Database, Loader2, RefreshCw, Search, ChevronDown, ChevronUp, AlertTriangle, Plus, Columns, X, Table } from 'lucide-react';
import { mindsdbApi, MindsDbDatabase, MindsDbSchemaTable, MindsDbShowTableResponse } from '../../services/api';

type LoadState = 'idle' | 'loading' | 'success' | 'error';

const safeString = (v: unknown) => (v === null || v === undefined ? '' : String(v));

const tryParseJsonString = (value: string): unknown => {
  const s = value.trim();
  if (!s) return value;
  // Only attempt JSON parse when it looks like JSON.
  if (!(s.startsWith('{') || s.startsWith('['))) return value;
  try {
    return JSON.parse(s);
  } catch {
    return value;
  }
};

const parseParams = (db: MindsDbDatabase): unknown => {
  const p = (db as any)?.params;
  if (p === null || p === undefined || p === '') return null;
  if (typeof p === 'string') return tryParseJsonString(p);
  return p;
};

const formatJson = (v: unknown) => {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return safeString(v);
  }
};

const isPlainObject = (v: unknown): v is Record<string, any> =>
  !!v && typeof v === 'object' && !Array.isArray(v);

const ParamsView: React.FC<{ value: unknown }> = ({ value }) => {
  if (value === null || value === undefined || value === '') {
    return (
      <div className="text-xs text-slate-400">—</div>
    );
  }

  if (isPlainObject(value)) {
    const entries = Object.entries(value);
    if (entries.length === 0) return <div className="text-xs text-slate-400">—</div>;
    return (
      <div className="space-y-2">
        {entries.map(([k, v]) => (
          <div key={k} className="flex items-start gap-2">
            <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide bg-brand-50 text-brand-700 border border-brand-100 dark:bg-brand-900/20 dark:text-brand-300 dark:border-brand-900/40">
              {k}
            </span>
            <div className="flex-1 min-w-0 text-xs text-slate-700 dark:text-slate-200 break-words">
              {typeof v === 'string' ? v : formatJson(v) || '—'}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Arrays or primitives: fall back to pretty JSON / string.
  const text = formatJson(value);
  return (
    <pre className="text-xs leading-relaxed bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 overflow-auto max-h-64">
      <code className="text-slate-700 dark:text-slate-200">{text || '—'}</code>
    </pre>
  );
};

type SchemaState = { state: 'idle' | 'loading' | 'success' | 'error'; error?: string; tables: MindsDbSchemaTable[] };

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
                    <h4 className="text-base font-semibold text-slate-900 dark:text-white">Couldn’t load sample</h4>
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

const SchemaModal: React.FC<{
  isOpen: boolean;
  dbName: string;
  schema: SchemaState;
  onClose: () => void;
  onReload: () => void;
}> = ({ isOpen, dbName, schema, onClose, onReload }) => {
  const [tableQuery, setTableQuery] = useState('');
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [sampleTableName, setSampleTableName] = useState<string | null>(null);
  const [sample, setSample] = useState<SampleState>({ state: 'idle' });

  useEffect(() => {
    if (!isOpen) return;
    setTableQuery('');
    setExpandedTables(new Set());
    setSampleTableName(null);
    setSample({ state: 'idle' });
  }, [isOpen, dbName]);

  const filteredTables = useMemo(() => {
    const q = tableQuery.trim().toLowerCase();
    if (!q) return schema.tables;
    return schema.tables.filter((t) => {
      const tn = safeString(t?.table_name).toLowerCase();
      if (tn.includes(q)) return true;
      const cols = Array.isArray(t?.columns) ? t.columns : [];
      return cols.some((c) => safeString(c?.column_name).toLowerCase().includes(q));
    });
  }, [schema.tables, tableQuery]);

  const toggleTable = (tableName: string) => {
    setExpandedTables((prev) => {
      const next = new Set(prev);
      if (next.has(tableName)) next.delete(tableName);
      else next.add(tableName);
      return next;
    });
  };

  const openSample = async (tableName: string) => {
    const t = String(tableName || '').trim();
    if (!t) return;
    setSampleTableName(t);
    setSample({ state: 'loading' });
    try {
      const data = await mindsdbApi.getShowTable(dbName, t);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <SampleTableModal
        isOpen={!!sampleTableName}
        dbName={dbName}
        tableName={sampleTableName || ''}
        sample={sample}
        onClose={() => setSampleTableName(null)}
        onReload={reloadSample}
      />
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-[95vw] max-w-4xl h-[90vh] max-h-[900px] border border-slate-200 dark:border-slate-800 flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-900/15 border border-brand-100 dark:border-brand-900/40 flex items-center justify-center shrink-0">
                <Columns className="w-4 h-4 text-brand-700 dark:text-brand-300" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white truncate">Explore schema</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {dbName} • {schema.state === 'success' ? `${schema.tables.length} tables` : 'Loading…'}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all focus-within:ring-2 focus-within:ring-brand-500/15">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                value={tableQuery}
                onChange={(e) => setTableQuery(e.target.value)}
                placeholder="Search tables or columns…"
                className="w-full bg-transparent outline-none text-sm text-slate-900 dark:text-slate-200 placeholder:text-slate-400"
              />
            </div>
            <button
              type="button"
              onClick={onReload}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-[0.98]"
              title="Reload schema"
            >
              {schema.state === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              <span className="text-xs font-semibold uppercase tracking-wider">Reload</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-50/50 dark:bg-slate-950">
          {schema.state === 'loading' ? (
            <div className="h-full flex items-center justify-center">
              <div className="flex items-center gap-3 text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
                <span className="text-sm font-medium">Loading schema…</span>
              </div>
            </div>
          ) : schema.state === 'error' ? (
            <div className="h-full flex items-center justify-center">
              <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 max-w-lg w-full animate-fade-in">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/40 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-300" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-slate-900 dark:text-white">Couldn’t load schema</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{schema.error || 'Please try again.'}</p>
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
          ) : filteredTables.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="bg-white dark:bg-slate-900 p-10 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 max-w-lg w-full text-center animate-fade-in">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mb-6">
                  <Columns className="w-6 h-6 text-slate-700 dark:text-slate-300" />
                </div>
                <h4 className="text-lg font-semibold text-slate-900 dark:text-white">No matches</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                  Try a different search (table name or column name).
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTables.map((t) => {
                const tableName = safeString(t?.table_name) || '(unnamed_table)';
                const isOpen = expandedTables.has(tableName);
                const cols = Array.isArray(t?.columns) ? t.columns : [];
                return (
                  <div
                    key={tableName}
                    className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-[0_10px_30px_-22px_rgba(15,23,42,0.35)] overflow-hidden transition-all duration-200 ${isOpen ? 'ring-2 ring-brand-500/20 border-brand-200 dark:border-brand-900/50' : ''}`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleTable(tableName)}
                      className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors relative"
                    >
                      {isOpen && (
                        <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-brand-600/80 dark:bg-brand-400/70" />
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{tableName}</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {cols.length} cols
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 text-slate-400">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openSample(tableName);
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide bg-brand-50 text-brand-700 border border-brand-100 hover:bg-brand-100 transition-colors dark:bg-brand-900/20 dark:text-brand-300 dark:border-brand-900/40 dark:hover:bg-brand-900/30"
                            title="View sample rows"
                          >
                            <Table className="w-3.5 h-3.5" />
                            Sample
                          </button>
                          {isOpen ? <ChevronUp className="w-4 h-4 text-brand-700 dark:text-brand-300" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-fade-in-down">
                        <div className="pt-4">
                          {cols.length === 0 ? (
                            <div className="text-xs text-slate-400">No columns returned.</div>
                          ) : (
                            <div className="space-y-2">
                              {cols.map((c) => {
                                const cn = safeString((c as any)?.column_name) || '—';
                                const dt = safeString((c as any)?.data_type) || '—';
                                return (
                                  <div key={cn} className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
                                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{cn}</span>
                                    <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide bg-brand-50 text-brand-700 border border-brand-100 dark:bg-brand-900/20 dark:text-brand-300 dark:border-brand-900/40">
                                      {dt}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const DataModule: React.FC = () => {
  const [state, setState] = useState<LoadState>('idle');
  const [error, setError] = useState<string>('');
  const [databases, setDatabases] = useState<MindsDbDatabase[]>([]);
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showNewConnHint, setShowNewConnHint] = useState(false);
  const [exploreDbName, setExploreDbName] = useState<string | null>(null);
  const [schema, setSchema] = useState<SchemaState>({ state: 'idle', tables: [] });

  const load = async (opts?: { force?: boolean }) => {
    const force = !!opts?.force;
    setError('');
    setState((prev) => (prev === 'idle' ? 'loading' : prev));
    try {
      if (force) mindsdbApi.clearCache();
      const list = await mindsdbApi.getDatabases();
      setDatabases(Array.isArray(list) ? list : []);
      setState('success');
    } catch (e: any) {
      setDatabases([]);
      setState('error');
      setError(e?.message || 'Failed to load databases.');
    }
  };

  useEffect(() => {
    setState('loading');
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return databases;
    return databases.filter((db) => {
      const name = safeString(db?.name).toLowerCase();
      const engine = safeString(db?.engine).toLowerCase();
      return name.includes(q) || engine.includes(q);
    });
  }, [databases, query]);

  const toggleExpanded = (name: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const onRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await load({ force: true });
    } finally {
      setIsRefreshing(false);
    }
  };

  const onNewConnection = () => {
    // Best-effort: route user to Settings -> Data tab (no create-connection API yet).
    try {
      localStorage.setItem('settings_active_tab', 'Data');
    } catch {
      // ignore
    }
    setShowNewConnHint(true);
  };

  const openExplore = async (dbName: string) => {
    const name = String(dbName || '').trim();
    if (!name) return;
    setExploreDbName(name);
    setSchema({ state: 'loading', tables: [] });
    try {
      const tables = await mindsdbApi.getDbSchema(name);
      setSchema({ state: 'success', tables: Array.isArray(tables) ? tables : [] });
    } catch (e: any) {
      setSchema({ state: 'error', error: e?.message || 'Failed to load schema.', tables: [] });
    }
  };

  const reloadExplore = async () => {
    if (!exploreDbName) return;
    // Force refresh only for schema.
    mindsdbApi.clearCache();
    await openExplore(exploreDbName);
  };

  const hasData = state === 'success' && databases.length > 0;
  const showingCount = filtered.length;

  return (
    <div className="flex-1 h-full flex flex-col bg-white dark:bg-slate-950 relative">
      <SchemaModal
        isOpen={!!exploreDbName}
        dbName={exploreDbName || ''}
        schema={schema}
        onClose={() => setExploreDbName(null)}
        onReload={reloadExplore}
      />
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/15 border border-brand-100 dark:border-brand-900/40 flex items-center justify-center">
            <Database className="w-5 h-5 text-brand-700 dark:text-brand-300" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white leading-tight">Data</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              MindsDB configured databases
              {state === 'success' ? (
                <span className="ml-2 text-slate-400">({databases.length})</span>
              ) : null}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all focus-within:ring-2 focus-within:ring-brand-500/15">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search databases…"
              className="w-60 bg-transparent outline-none text-sm text-slate-900 dark:text-slate-200 placeholder:text-slate-400"
            />
          </div>

          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-[0.98]"
            title="Refresh"
          >
            {isRefreshing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span className="text-xs font-semibold uppercase tracking-wider">Refresh</span>
          </button>

          <button
            type="button"
            onClick={onNewConnection}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition-all active:scale-[0.98] hover:shadow-brand-600/30"
            title="New connection"
          >
            <Plus className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">New connection</span>
          </button>
        </div>
      </div>

      {/* Mobile search */}
      <div className="md:hidden px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all focus-within:ring-2 focus-within:ring-brand-500/15">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search databases…"
            className="w-full bg-transparent outline-none text-sm text-slate-900 dark:text-slate-200 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Content */}
      {state === 'loading' ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3 text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
            <span className="text-sm font-medium">Loading databases…</span>
          </div>
        </div>
      ) : state === 'error' ? (
        <div className="flex-1 flex items-center justify-center p-6 bg-slate-50/50 dark:bg-slate-900/20">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 max-w-lg w-full animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/40 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-300" />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">Couldn’t load databases</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{error || 'Please try again.'}</p>
                <div className="mt-5 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => load({ force: true })}
                    className="px-4 py-2 bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
                  >
                    Retry
                  </button>
                  <button
                    type="button"
                    onClick={() => setError('')}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : !hasData ? (
        <div className="flex-1 flex items-center justify-center p-6 bg-slate-50/50 dark:bg-slate-900/20">
          <div className="bg-white dark:bg-slate-900 p-10 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 max-w-lg w-full text-center animate-fade-in">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mb-6">
              <Database className="w-7 h-7 text-slate-700 dark:text-slate-300" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">No databases configured</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              The endpoint returned an empty list.
            </p>
            <div className="mt-6 flex items-center justify-center">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onRefresh}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={onNewConnection}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold uppercase tracking-widest transition-all shadow-sm hover:shadow-brand-600/30"
                >
                  <Plus className="w-4 h-4" />
                  New connection
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden flex flex-col bg-white dark:bg-slate-950">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                {showingCount} database{showingCount === 1 ? '' : 's'}
                {query.trim() ? <span className="text-slate-400 font-medium"> (filtered)</span> : null}
              </span>
              {query.trim() ? (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="text-xs font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200 transition-colors"
                >
                  Clear search
                </button>
              ) : (
                <span className="text-xs text-slate-400">Source: `/mindsdb/databases`</span>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-50/50 dark:bg-slate-950">
            <div className="space-y-3">
              {filtered.map((db) => {
                const name = safeString(db?.name) || '(unnamed)';
                const engine = safeString(db?.engine) || '—';
                const isOpen = expanded.has(name);
                const paramsValue = parseParams(db);
                const repr = safeString((db as any)?.repr);

                return (
                  <div
                    key={name}
                    className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-[0_10px_30px_-22px_rgba(15,23,42,0.35)] hover:shadow-[0_16px_40px_-24px_rgba(29,173,143,0.35)] transition-all duration-200 overflow-hidden ${isOpen ? 'ring-2 ring-brand-500/20 border-brand-200 dark:border-brand-900/50' : ''}`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleExpanded(name)}
                      className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors relative"
                    >
                      {isOpen && (
                        <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-brand-600/80 dark:bg-brand-400/70" />
                      )}
                      <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                        <Database className={`w-4 h-4 ${isOpen ? 'text-brand-700 dark:text-brand-300' : 'text-slate-700 dark:text-slate-300'}`} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{name}</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide border ${isOpen ? 'bg-brand-50 text-brand-700 border-brand-100 dark:bg-brand-900/20 dark:text-brand-300 dark:border-brand-900/40' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>
                            {engine}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                          {paramsValue ? 'Has configuration params' : 'No params provided'}
                        </div>
                      </div>

                      <div className="shrink-0 text-slate-400">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openExplore(name);
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide bg-brand-50 text-brand-700 border border-brand-100 hover:bg-brand-100 transition-colors dark:bg-brand-900/20 dark:text-brand-300 dark:border-brand-900/40 dark:hover:bg-brand-900/30"
                            title="Explore schema"
                          >
                            <Columns className="w-3.5 h-3.5" />
                            Explore
                          </button>
                          {isOpen ? <ChevronUp className="w-4 h-4 text-brand-700 dark:text-brand-300" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-fade-in-down">
                        <div className="pt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Params</div>
                            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                              <ParamsView value={paramsValue} />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Repr</div>
                            <div className="text-xs leading-relaxed bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-700 dark:text-slate-200 max-h-48 overflow-auto">
                              {repr || '—'}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tiny hint overlay (until create-connection flow exists) */}
      {showNewConnHint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-800 p-6 animate-fade-in">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">New connection</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Connection creation is coming next. For now, manage connections from <span className="font-semibold text-brand-700 dark:text-brand-300">Settings → Data</span>.
            </p>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowNewConnHint(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


