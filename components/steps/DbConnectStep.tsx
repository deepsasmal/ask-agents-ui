import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, Database, ChevronDown, ChevronRight, Loader2, Table, RefreshCw, X, KeyRound, Link as LinkIcon, Brain } from 'lucide-react';
import { Button, Input, Card } from '../ui/Common';
import { WizardState, Table as TableType, Column } from '../../types';
import { postgresApi, mindsdbApi, ApiError } from '../../services/api';
import type { MindsDbDatabase, MindsDbSchemaTable, MindsDbShowTableResponse } from '../../services/api';
import { normalizeMindsDbSchemaTables } from '../../utils/mindsdbSchema';

const POSTGRES_LOGO = "https://upload.wikimedia.org/wikipedia/commons/2/29/Postgresql_elephant.svg";
const MINDSDB_LOGO = "https://docs.mindsdb.com/assets/mindsdb-logo.svg";

interface DbConnectStepProps {
  data: WizardState;
  updateData: (data: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

const DATA_SOURCES = [
  { id: 'postgres', label: 'PostgreSQL Database', group: 'Databases', disabled: false },
  { id: 'mindsdb', label: 'MindsDB', group: 'Databases', disabled: false },
  { id: 'mysql', label: 'MySQL (Coming Soon)', group: 'Databases', disabled: true },
  { id: 'mssql', label: 'Microsoft SQL Server (Coming Soon)', group: 'Databases', disabled: true },
  { id: 'oracle', label: 'Oracle DB (Coming Soon)', group: 'Databases', disabled: true },
  { id: 'mongo', label: 'MongoDB (Coming Soon)', group: 'NoSQL', disabled: true },
  { id: 'snowflake', label: 'Snowflake (Coming Soon)', group: 'Warehouses', disabled: true },
  { id: 'csv', label: 'Upload CSV File (Coming Soon)', group: 'Files', disabled: true },
  { id: 'json', label: 'Upload JSON File (Coming Soon)', group: 'Files', disabled: true },
  { id: 'excel', label: 'Upload Excel File (Coming Soon)', group: 'Files', disabled: true },
];

type SampleState = { state: 'idle' | 'loading' | 'success' | 'error'; error?: string; data?: MindsDbShowTableResponse };

interface MindsDbTable {
  name: string;
  selected: boolean;
  description: string;
  columns: Column[];
  constraints?: any[];
}

const formatCell = (v: any) => {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
};

// Sample Table Modal Component
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

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
      <div className="bg-white rounded-2xl shadow-2xl w-[95vw] max-w-6xl h-[90vh] max-h-[900px] border border-slate-200 flex flex-col animate-in fade-in zoom-in-95 duration-300 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-200">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
                <Table className="w-4 h-4 text-brand-700" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-slate-900 truncate">Sample Data</h3>
                <p className="text-xs text-slate-500 truncate">
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
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 transition-all active:scale-[0.98]"
              title="Reload sample"
            >
              {sample.state === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              <span className="text-xs font-semibold uppercase tracking-wider">Reload</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-700"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden bg-slate-50/50">
          {sample.state === 'loading' ? (
            <div className="h-full flex items-center justify-center">
              <div className="flex items-center gap-3 text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
                <span className="text-sm font-medium">Loading sample…</span>
              </div>
            </div>
          ) : sample.state === 'error' ? (
            <div className="h-full flex items-center justify-center p-6">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-lg w-full animate-fade-in">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-5 h-5 text-rose-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-slate-900">Couldn't load sample</h4>
                    <p className="text-sm text-slate-500 mt-1">{sample.error || 'Please try again.'}</p>
                    <div className="mt-5 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={onReload}
                        className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
                      >
                        Retry
                      </button>
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-colors"
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
              <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-200 max-w-lg w-full text-center animate-fade-in">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mb-6">
                  <Table className="w-6 h-6 text-slate-700" />
                </div>
                <h4 className="text-lg font-semibold text-slate-900">No data returned</h4>
                <p className="text-sm text-slate-500 mt-2">
                  The endpoint returned an empty sample.
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col overflow-hidden">
              <div className="px-6 py-3 border-b border-slate-200 bg-white/80 backdrop-blur flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  Showing <span className="font-semibold text-slate-900">{shownRows.length}</span> of{' '}
                  <span className="font-semibold text-slate-900">{rows.length}</span> rows
                  {rows.length > MAX_ROWS ? <span className="ml-2 text-slate-400">(truncated)</span> : null}
                </div>
                <div className="text-xs text-slate-400">{columns.length} columns</div>
              </div>

              <div className="flex-1 overflow-auto custom-scrollbar p-6">
                <div className="min-w-max rounded-xl border border-slate-200 overflow-hidden bg-white">
                  <table className="min-w-max w-full border-collapse">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-white/95 backdrop-blur">
                        {columns.map((c) => (
                          <th
                            key={c}
                            className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 whitespace-nowrap border-b border-slate-200 border-r border-slate-200 last:border-r-0"
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
                          className={`bg-white ${idx % 2 === 1 ? 'bg-slate-50/40' : ''}`}
                        >
                          {columns.map((c) => (
                            <td
                              key={c}
                              className="px-3 py-2 text-xs text-slate-700 whitespace-nowrap border-b border-slate-200 border-r border-slate-200 last:border-r-0"
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
    </div>,
    document.body
  );
};

export const DbConnectStep: React.FC<DbConnectStepProps> = ({ data, updateData, onNext, onBack }) => {
  // PostgreSQL state
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState('postgres');

  // MindsDB state
  const [mindsDbDatabases, setMindsDbDatabases] = useState<MindsDbDatabase[]>([]);
  const [mindsDbDbsState, setMindsDbDbsState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [mindsDbDbsError, setMindsDbDbsError] = useState<string | null>(null);
  const [selectedMindsDbSource, setSelectedMindsDbSource] = useState<string>('');
  const [mindsDbTables, setMindsDbTables] = useState<MindsDbTable[]>([]);
  const [mindsDbTablesState, setMindsDbTablesState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [mindsDbTablesError, setMindsDbTablesError] = useState<string | null>(null);
  const [expandedTableName, setExpandedTableName] = useState<string | null>(null);

  // Sample modal state
  const [sampleModalTable, setSampleModalTable] = useState<string | null>(null);
  const [sampleState, setSampleState] = useState<SampleState>({ state: 'idle' });

  // Load MindsDB databases when source is selected
  useEffect(() => {
    if (selectedSource === 'mindsdb' && mindsDbDbsState === 'idle') {
      loadMindsDbDatabases();
    }
  }, [selectedSource, mindsDbDbsState]);

  // Load schema when MindsDB datasource is selected
  useEffect(() => {
    if (selectedMindsDbSource && selectedSource === 'mindsdb') {
      loadMindsDbSchema(selectedMindsDbSource);
    }
  }, [selectedMindsDbSource]);

  const loadMindsDbDatabases = async () => {
    setMindsDbDbsState('loading');
    setMindsDbDbsError(null);
    try {
      const dbs = await mindsdbApi.getDatabases();
      setMindsDbDatabases(Array.isArray(dbs) ? dbs : []);
      setMindsDbDbsState('success');
      // Auto-select first if available
      if (dbs.length > 0 && !selectedMindsDbSource) {
        setSelectedMindsDbSource(dbs[0].name);
      }
    } catch (e: any) {
      setMindsDbDbsState('error');
      setMindsDbDbsError(e?.message || 'Failed to load datasources');
    }
  };

  const loadMindsDbSchema = async (dbName: string, force?: boolean) => {
    if (!dbName) return;
    setMindsDbTablesState('loading');
    setMindsDbTablesError(null);
    try {
      const schemaTables = await mindsdbApi.getDbSchema(dbName, { force });
      const normalized = normalizeMindsDbSchemaTables(schemaTables);
      const tables: MindsDbTable[] = normalized.map((t) => ({
        name: t.tableName,
        selected: true, // Selected by default for graph building
        description: '',
        columns: t.columns.map((c) => ({
          name: c.name,
          type: c.type,
          description: '',
          isPrimaryKey: c.isPrimaryKey,
          isForeignKey: c.isForeignKey,
          foreignKeyReference: c.foreignKeyReference
        }))
      }));
      setMindsDbTables(tables);
      setMindsDbTablesState('success');
      // Expand first table
      if (tables.length > 0) {
        setExpandedTableName(tables[0].name);
      }
    } catch (e: any) {
      setMindsDbTablesState('error');
      setMindsDbTablesError(e?.message || 'Failed to load schema');
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setConnectionStatus('idle');
    setErrorMessage(null);

    try {
      const response = await postgresApi.connect({
        dbHost: data.dbHost,
        dbPort: data.dbPort,
        dbUser: data.dbUser,
        dbPass: data.dbPass,
        dbName: data.dbName,
      });

      updateData({ connectionId: response.connection_id });
      setConnectionStatus('success');
    } catch (error) {
      setConnectionStatus('error');
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Failed to connect to server');
      }
    } finally {
      setIsTesting(false);
    }
  };

  const openSampleModal = async (tableName: string) => {
    if (!tableName || !selectedMindsDbSource) return;
    setSampleModalTable(tableName);
    setSampleState({ state: 'loading' });
    try {
      const data = await mindsdbApi.getShowTable(selectedMindsDbSource, tableName);
      setSampleState({ state: 'success', data });
    } catch (e: any) {
      setSampleState({ state: 'error', error: e?.message || 'Failed to load sample.' });
    }
  };

  const reloadSample = async () => {
    if (!sampleModalTable || !selectedMindsDbSource) return;
    mindsdbApi.clearCache();
    await openSampleModal(sampleModalTable);
  };

  const closeSampleModal = () => {
    setSampleModalTable(null);
    setSampleState({ state: 'idle' });
  };

  const toggleTableExpand = (tableName: string) => {
    setExpandedTableName(prev => prev === tableName ? null : tableName);
  };

  const toggleTableSelection = (tableName: string) => {
    setMindsDbTables(prev => prev.map(t =>
      t.name === tableName ? { ...t, selected: !t.selected } : t
    ));
  };

  const handleMindsDbContinue = () => {
    // Convert MindsDB tables to WizardState tables format
    const wizardTables: TableType[] = mindsDbTables.map(t => ({
      id: t.name,
      name: t.name,
      selected: t.selected,
      columns: t.columns,
      loaded: true,
      description: t.description
    }));

    updateData({
      tables: wizardTables,
      schemaName: selectedMindsDbSource,
      // Mark this as MindsDB connection
      dbName: selectedMindsDbSource,
      connectionId: `mindsdb:${selectedMindsDbSource}`
    });
    onNext();
  };

  const canProceed = selectedSource === 'postgres'
    ? connectionStatus === 'success'
    : selectedSource === 'mindsdb'
      ? mindsDbTablesState === 'success' && mindsDbTables.some(t => t.selected)
      : false;

  const selectedTablesCount = mindsDbTables.filter(t => t.selected).length;

  return (
    <div className="w-full flex flex-col animate-fade-in">
      <div className="mb-4 shrink-0 text-center lg:text-left">
        <h2 className="text-xl font-bold text-slate-900 mb-1">Connect Your Data</h2>
        <p className="text-slate-500 text-sm">Select your data source and configure the connection details.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Connection Form */}
        <div className="lg:col-span-7 flex flex-col">
          <Card className="shadow-supreme border-0 flex flex-col" noPadding>
            {/* Source Selection Dropdown */}
            <div className="p-4 border-b border-slate-100">
              <label className="text-xs font-semibold text-slate-700 ml-1 mb-1.5 block">Data Source Type</label>
              <div className="relative group">
                <select
                  className="w-full appearance-none pl-10 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-sm cursor-pointer transition-all hover:border-brand-300 disabled:bg-slate-50"
                  value={selectedSource}
                  onChange={(e) => {
                    setSelectedSource(e.target.value);
                    // Reset states when switching sources
                    if (e.target.value === 'mindsdb') {
                      setConnectionStatus('idle');
                    } else if (e.target.value === 'postgres') {
                      setMindsDbTablesState('idle');
                    }
                  }}
                >
                  {DATA_SOURCES.map((source) => (
                    <option key={source.id} value={source.id} disabled={source.disabled}>
                      {source.label}
                    </option>
                  ))}
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 p-1 bg-brand-50 rounded-md">
                  <Database className="w-3.5 h-3.5 text-brand-600" />
                </div>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none group-hover:text-brand-500 transition-colors" />
              </div>
            </div>

            {/* PostgreSQL Form */}
            {selectedSource === 'postgres' && (
              <>
                <div className="p-4 border-b border-slate-100 flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-900/10 ring-1 ring-slate-100 overflow-hidden relative group p-1">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <img
                      src={POSTGRES_LOGO}
                      alt="PostgreSQL Logo"
                      className="w-full h-full object-contain drop-shadow-sm"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">PostgreSQL Connection</h3>
                    <p className="text-xs text-slate-500">Supports Postgres 12+</p>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <Input
                        label="Host"
                        placeholder="db.example.com"
                        value={data.dbHost}
                        onChange={(e) => updateData({ dbHost: e.target.value })}
                      />
                    </div>
                    <div className="col-span-1">
                      <Input
                        label="Port"
                        placeholder="5432"
                        value={data.dbPort}
                        onChange={(e) => updateData({ dbPort: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Username"
                      placeholder="postgres"
                      value={data.dbUser}
                      onChange={(e) => updateData({ dbUser: e.target.value })}
                    />
                    <Input
                      label="Password"
                      type="password"
                      placeholder="••••••••"
                      value={data.dbPass}
                      onChange={(e) => updateData({ dbPass: e.target.value })}
                    />
                  </div>

                  <Input
                    label="Database Name"
                    placeholder="my_production_db"
                    value={data.dbName}
                    onChange={(e) => updateData({ dbName: e.target.value })}
                  />
                </div>

                <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleTestConnection}
                    isLoading={isTesting}
                    size="sm"
                    className="bg-slate-50 hover:bg-slate-100 border-slate-200 text-xs px-3"
                  >
                    Test Connection
                  </Button>

                  {connectionStatus === 'success' && (
                    <div className="flex items-center gap-1.5 text-brand-600 text-xs font-bold animate-in fade-in slide-in-from-right-4 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-100">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verified
                    </div>
                  )}
                  {connectionStatus === 'error' && (
                    <div className="flex flex-col items-end animate-in fade-in slide-in-from-right-4">
                      <div className="flex items-center gap-1.5 text-red-600 text-xs font-bold bg-red-50 px-2.5 py-1 rounded-lg border border-red-100">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Connection Failed
                      </div>
                      {errorMessage && (
                        <span className="text-[11px] text-red-500 mt-1 max-w-[220px] text-right truncate" title={errorMessage}>
                          {errorMessage}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* MindsDB Form */}
            {selectedSource === 'mindsdb' && (
              <>
                <div className="p-4 border-b border-slate-100 flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-brand-50 to-brand-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-brand-900/10 ring-1 ring-brand-100 overflow-hidden relative group p-1.5">
                    <Brain className="w-6 h-6 text-brand-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">MindsDB Connection</h3>
                    <p className="text-xs text-slate-500">Connect to your MindsDB datasources</p>
                  </div>
                </div>

                {/* Datasource Selection */}
                <div className="p-4 border-b border-slate-100">
                  <label className="text-xs font-semibold text-slate-700 ml-1 mb-1.5 block">Select Datasource</label>
                  {mindsDbDbsState === 'loading' ? (
                    <div className="flex items-center gap-2 py-3 text-slate-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Loading datasources...</span>
                    </div>
                  ) : mindsDbDbsState === 'error' ? (
                    <div className="flex items-center gap-2 py-3 text-red-600">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">{mindsDbDbsError}</span>
                      <button
                        onClick={loadMindsDbDatabases}
                        className="ml-2 text-xs font-bold text-brand-600 hover:underline"
                      >
                        Retry
                      </button>
                    </div>
                  ) : (
                    <div className="relative group">
                      <select
                        className="w-full appearance-none pl-10 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-sm cursor-pointer transition-all hover:border-brand-300"
                        value={selectedMindsDbSource}
                        onChange={(e) => setSelectedMindsDbSource(e.target.value)}
                      >
                        <option value="" disabled>Select a datasource...</option>
                        {mindsDbDatabases.map((db) => (
                          <option key={db.name} value={db.name}>
                            {db.name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 p-1 bg-brand-50 rounded-md">
                        <Database className="w-3.5 h-3.5 text-brand-600" />
                      </div>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none group-hover:text-brand-500 transition-colors" />
                    </div>
                  )}
                </div>

                {/* Tables List */}
                {selectedMindsDbSource && (
                  <div className="flex-1 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">Tables</h4>
                        <p className="text-xs text-slate-500">
                          {mindsDbTablesState === 'success' && (
                            <>{mindsDbTables.length} tables found • {selectedTablesCount} selected</>
                          )}
                        </p>
                      </div>
                      {mindsDbTablesState === 'success' && (
                        <button
                          onClick={() => loadMindsDbSchema(selectedMindsDbSource, true)}
                          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-brand-600 transition-colors"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Refresh
                        </button>
                      )}
                    </div>

                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                      {mindsDbTablesState === 'loading' ? (
                        <div className="flex items-center justify-center py-10 text-slate-500">
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          <span className="text-sm">Loading schema...</span>
                        </div>
                      ) : mindsDbTablesState === 'error' ? (
                        <div className="p-4 text-center text-red-600">
                          <AlertCircle className="w-5 h-5 mx-auto mb-2" />
                          <p className="text-sm">{mindsDbTablesError}</p>
                          <button
                            onClick={() => loadMindsDbSchema(selectedMindsDbSource, true)}
                            className="mt-2 text-xs font-bold text-brand-600 hover:underline"
                          >
                            Retry
                          </button>
                        </div>
                      ) : mindsDbTables.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                          <Database className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                          <p className="text-sm">No tables found in this datasource</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {mindsDbTables.map((table) => (
                            <div key={table.name} className="group">
                              {/* Table Row */}
                              <div className="flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors">
                                <button
                                  onClick={() => toggleTableSelection(table.name)}
                                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${table.selected
                                    ? 'bg-brand-600 border-brand-600 text-white'
                                    : 'border-slate-300 hover:border-brand-400'
                                    }`}
                                >
                                  {table.selected && <CheckCircle2 className="w-3.5 h-3.5" />}
                                </button>

                                <button
                                  onClick={() => toggleTableExpand(table.name)}
                                  className="flex-1 flex items-center gap-2 text-left min-w-0"
                                >
                                  {expandedTableName === table.name ? (
                                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                                  )}
                                  <Table className="w-4 h-4 text-slate-500 shrink-0" />
                                  <span className="text-sm font-medium text-slate-900 truncate">{table.name}</span>
                                  <span className="text-xs text-slate-400 ml-auto shrink-0">{table.columns.length} cols</span>
                                </button>

                                <button
                                  onClick={() => openSampleModal(table.name)}
                                  className="p-1.5 rounded-lg hover:bg-brand-50 text-slate-400 hover:text-brand-600 transition-colors opacity-0 group-hover:opacity-100"
                                  title="View sample data"
                                >
                                  <Table className="w-4 h-4" />
                                </button>
                              </div>

                              {/* Expanded Columns */}
                              {expandedTableName === table.name && (
                                <div className="bg-slate-50 border-t border-slate-100 px-4 py-2">
                                  <div className="grid gap-1">
                                    {table.columns.map((col) => (
                                      <div key={col.name} className="flex items-center gap-2 py-1 px-2 text-xs">
                                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                          {col.isPrimaryKey && (
                                            <span title="Primary Key">
                                              <KeyRound className="w-3 h-3 text-amber-500 shrink-0" />
                                            </span>
                                          )}
                                          {col.isForeignKey && (
                                            <span title="Foreign Key">
                                              <LinkIcon className="w-3 h-3 text-blue-500 shrink-0" />
                                            </span>
                                          )}
                                          <span className="font-medium text-slate-700 truncate">{col.name}</span>
                                        </div>
                                        <span className="text-slate-400 font-mono text-[10px] shrink-0">{col.type}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>
        </div>

        {/* Right: Preview / Status */}
        <div className="lg:col-span-5 flex flex-col">
          <Card className="shadow-supreme border-0 flex flex-col bg-white/70" noPadding>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Connection Preview</h3>
                <p className="text-xs text-slate-500">Double-check settings before continuing.</p>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-sm
                bg-slate-50 text-slate-600 border-slate-200">
                {selectedSource === 'postgres' ? (
                  connectionStatus === 'success' ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" />
                      Verified
                    </>
                  ) : connectionStatus === 'error' ? (
                    <>
                      <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                      Failed
                    </>
                  ) : (
                    <>
                      <Database className="w-3.5 h-3.5 text-slate-500" />
                      Not Tested
                    </>
                  )
                ) : selectedSource === 'mindsdb' ? (
                  mindsDbTablesState === 'success' ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" />
                      Ready
                    </>
                  ) : mindsDbTablesState === 'loading' ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 text-brand-500 animate-spin" />
                      Loading
                    </>
                  ) : mindsDbTablesState === 'error' ? (
                    <>
                      <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                      Error
                    </>
                  ) : (
                    <>
                      <Database className="w-3.5 h-3.5 text-slate-500" />
                      Pending
                    </>
                  )
                ) : (
                  <>
                    <Database className="w-3.5 h-3.5 text-slate-500" />
                    Not Tested
                  </>
                )}
              </div>
            </div>

            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Source</p>
                  <p className="text-sm font-semibold text-slate-900 mt-1 truncate">
                    {DATA_SOURCES.find(s => s.id === selectedSource)?.label ?? 'Data Source'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    {selectedSource === 'mindsdb' ? 'Datasource' : 'Database'}
                  </p>
                  <p className="text-sm font-semibold text-slate-900 mt-1 truncate">
                    {selectedSource === 'mindsdb' ? (selectedMindsDbSource || '—') : (data.dbName || '—')}
                  </p>
                </div>
              </div>

              {selectedSource === 'postgres' && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Endpoint</p>
                  <p className="text-sm font-semibold text-slate-900 mt-1 break-words">
                    {data.dbHost || '—'}{data.dbPort ? `:${data.dbPort}` : ''}
                  </p>
                </div>
              )}

              {selectedSource === 'mindsdb' && mindsDbTablesState === 'success' && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Tables Selected</p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">
                    {selectedTablesCount} of {mindsDbTables.length} tables
                  </p>
                </div>
              )}

              {(selectedSource === 'postgres' && connectionStatus === 'error' && errorMessage) && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-xs">
                  {errorMessage}
                </div>
              )}

              {(selectedSource === 'mindsdb' && mindsDbTablesState === 'error' && mindsDbTablesError) && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-xs">
                  {mindsDbTablesError}
                </div>
              )}

              <div className="p-3 rounded-xl bg-white border border-slate-200">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-2">
                  {selectedSource === 'mindsdb' ? 'MindsDB Tips' : 'Best Practices'}
                </p>
                <ul className="text-xs text-slate-600 space-y-1">
                  {selectedSource === 'mindsdb' ? (
                    <>
                      <li>Select the datasource containing your tables.</li>
                      <li>Click on a table to view its columns.</li>
                      <li>Use the sample icon to preview table data.</li>
                    </>
                  ) : (
                    <>
                      <li>Use a least-privilege database user.</li>
                      <li>Ensure your network allows outbound access to the DB host.</li>
                      <li>Test the connection before continuing.</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="flex justify-between pt-6 shrink-0">
        <Button variant="ghost" onClick={onBack} leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
          Back
        </Button>
        <Button
          onClick={selectedSource === 'mindsdb' ? handleMindsDbContinue : onNext}
          disabled={!canProceed}
          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          size="md"
          className="px-6 shadow-brand-600/30"
        >
          Continue
        </Button>
      </div>

      {/* Sample Modal */}
      <SampleTableModal
        isOpen={!!sampleModalTable}
        dbName={selectedMindsDbSource}
        tableName={sampleModalTable || ''}
        sample={sampleState}
        onClose={closeSampleModal}
        onReload={reloadSample}
      />
    </div>
  );
};