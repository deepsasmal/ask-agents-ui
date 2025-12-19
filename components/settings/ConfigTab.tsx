import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Check, Copy, Eye, EyeOff, Loader2, RefreshCw, Save, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { appConfigApi, type AppConfigMetrics, type AppConfigRefreshResponse } from '../../services/api';
import { KeyValueListSkeleton } from '../ui/ModuleSkeletons';

type ValueKind = 'string' | 'number' | 'boolean' | 'null' | 'array' | 'object' | 'unknown';

function kindOfValue(v: any): ValueKind {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  switch (typeof v) {
    case 'string':
      return 'string';
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'object':
      return 'object';
    default:
      return 'unknown';
  }
}

function safeJsonStringify(value: any): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function tryParseJson(text: string): { ok: true; value: any } | { ok: false; error: string } {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Invalid JSON' };
  }
}

function parseScalar(text: string, kind: ValueKind): any {
  const raw = String(text ?? '');
  if (kind === 'number') {
    const n = Number(raw);
    if (Number.isFinite(n)) return n;
    return raw;
  }
  if (kind === 'boolean') {
    const s = raw.trim().toLowerCase();
    if (s === 'true') return true;
    if (s === 'false') return false;
    return raw;
  }
  if (kind === 'null') {
    const s = raw.trim().toLowerCase();
    if (s === 'null' || s === '') return null;
    return raw;
  }
  return raw;
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Copied');
  } catch {
    toast.error('Failed to copy');
  }
}

type EditingState = {
  key: string;
  originalValue: any;
  draftText: string;
  kind: ValueKind;
  error?: string | null;
};

export const ConfigTab: React.FC = () => {
  const [metrics, setMetrics] = useState<AppConfigMetrics>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [includeSensitive, setIncludeSensitive] = useState(false);
  const [rebindRuntime, setRebindRuntime] = useState(true);
  const [query, setQuery] = useState('');
  const [onlyChanged, setOnlyChanged] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<{ at: number; result: AppConfigRefreshResponse } | null>(null);

  const [editing, setEditing] = useState<EditingState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [changedKeys, setChangedKeys] = useState<Record<string, true>>({});

  const load = async (opts?: { includeSensitive?: boolean }) => {
    const inc = opts?.includeSensitive ?? includeSensitive;
    setIsLoading(true);
    setError(null);
    try {
      const data = await appConfigApi.getAllMetrics(inc);
      setMetrics(data || {});
    } catch (e: any) {
      setError(e?.message || 'Failed to load config');
      setMetrics({});
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load({ includeSensitive });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeSensitive]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const entries = Object.entries(metrics || {});
    const filtered = entries.filter(([k, v]) => {
      if (onlyChanged && !changedKeys[k]) return false;
      if (!q) return true;
      const ks = k.toLowerCase();
      const vs = typeof v === 'string' ? v.toLowerCase() : safeJsonStringify(v).toLowerCase();
      return ks.includes(q) || vs.includes(q);
    });
    filtered.sort((a, b) => a[0].localeCompare(b[0]));
    return filtered.map(([k, v]) => ({
      key: k,
      value: v,
      kind: kindOfValue(v),
      isChanged: !!changedKeys[k],
    }));
  }, [metrics, query, onlyChanged, changedKeys]);

  const openEdit = (key: string, value: any) => {
    const kind = kindOfValue(value);
    const draftText = (kind === 'object' || kind === 'array') ? safeJsonStringify(value) : String(value ?? '');
    setEditing({ key, originalValue: value, draftText, kind, error: null });
  };

  const closeEdit = () => setEditing(null);

  const saveEdit = async () => {
    if (!editing) return;
    setIsSaving(true);
    try {
      let nextValue: any = editing.draftText;

      if (editing.kind === 'object' || editing.kind === 'array') {
        const parsed = tryParseJson(editing.draftText);
        if (!parsed.ok) {
          setEditing(prev => (prev ? { ...prev, error: parsed.error } : prev));
          setIsSaving(false);
          return;
        }
        nextValue = parsed.value;
      } else {
        nextValue = parseScalar(editing.draftText, editing.kind);
      }

      await appConfigApi.updateMetric(editing.key, nextValue);

      setMetrics(prev => ({ ...(prev || {}), [editing.key]: nextValue }));
      setChangedKeys(prev => ({ ...prev, [editing.key]: true }));
      toast.success('Config updated');
      closeEdit();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update config');
    } finally {
      setIsSaving(false);
    }
  };

  const refreshFromSource = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await appConfigApi.refreshConfig(rebindRuntime);
      setLastRefresh({ at: Date.now(), result: result || {} });

      const updated = (result as any)?.runtime_rebind?.updated;
      if (typeof updated === 'number') {
        toast.success(`Config refreshed • ${updated} runtime object(s) updated`);
      } else {
        toast.success('Config refreshed');
      }
      await load({ includeSensitive });
    } catch (e: any) {
      toast.error(e?.message || 'Failed to refresh config');
      setError(e?.message || 'Failed to refresh config');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSensitive = async (next: boolean) => {
    if (next) {
      const ok = window.confirm(
        'Show sensitive config values?\n\nThis may reveal secrets (API keys, tokens) on screen. Only proceed if you are in a secure environment.'
      );
      if (!ok) return;
    }
    setIncludeSensitive(next);
  };

  return (
    <div className="max-w-5xl">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="text-sm font-semibold text-slate-900 dark:text-white">Runtime Config</div>
          <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            View and update backend configuration at runtime. Sensitive keys are masked by default.
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleToggleSensitive(!includeSensitive)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border transition-colors text-sm font-semibold
              ${includeSensitive
                ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/15 dark:text-amber-200 dark:border-amber-500/20'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:bg-slate-950/30 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900/40'
              }`}
            title={includeSensitive ? 'Sensitive values are visible' : 'Sensitive values are masked'}
          >
            {includeSensitive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {includeSensitive ? 'Hide secrets' : 'Show secrets'}
          </button>

          <button
            type="button"
            onClick={refreshFromSource}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-brand-50 hover:border-brand-200 transition-colors dark:bg-slate-950/30 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-brand-500/10 dark:hover:border-brand-500/30"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <label className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 select-none">
          <input
            type="checkbox"
            checked={rebindRuntime}
            onChange={(e) => setRebindRuntime(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500/40"
          />
          Rebind runtime objects on refresh
          <span className="text-xs text-slate-500 dark:text-slate-400">
            (recommended)
          </span>
        </label>

        {lastRefresh && (
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Last refresh: {new Date(lastRefresh.at).toLocaleString()}
          </div>
        )}
      </div>

      {lastRefresh && (
        <div className="mb-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/30 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-slate-900 dark:text-white">Refresh result</div>
            <button
              type="button"
              onClick={() => copyToClipboard(safeJsonStringify(lastRefresh.result))}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors dark:bg-slate-950/30 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900/40 text-sm font-semibold"
              title="Copy refresh response JSON"
            >
              <Copy className="w-4 h-4" />
              Copy JSON
            </button>
          </div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/30 p-4">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">runtime_rebind.updated</div>
              <div className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                {typeof (lastRefresh.result as any)?.runtime_rebind?.updated === 'number'
                  ? String((lastRefresh.result as any).runtime_rebind.updated)
                  : '—'}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/30 p-4">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">FALKOR_HOST</div>
              <div className="mt-1 text-sm font-mono text-slate-900 dark:text-white truncate">
                {String((lastRefresh.result as any)?.FALKOR_HOST ?? '—')}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/30 p-4">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">FALKOR_GRAPH_NAME</div>
              <div className="mt-1 text-sm font-mono text-slate-900 dark:text-white truncate">
                {String((lastRefresh.result as any)?.FALKOR_GRAPH_NAME ?? '—')}
              </div>
            </div>
          </div>

          <details className="mt-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/30 p-4">
            <summary className="cursor-pointer list-none flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">Full response</div>
              <span className="text-xs text-slate-500 dark:text-slate-400">Expand</span>
            </summary>
            <pre className="mt-3 text-xs font-mono text-slate-700 dark:text-slate-200 whitespace-pre-wrap break-words">
              {safeJsonStringify(lastRefresh.result)}
            </pre>
          </details>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/30 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200/70 dark:border-slate-800/70 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search key or value…"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white shadow-inner focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500"
            />
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 select-none">
            <input
              type="checkbox"
              checked={onlyChanged}
              onChange={(e) => setOnlyChanged(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500/40"
            />
            Show changed only
          </label>

          <div className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
            {rows.length} / {Object.keys(metrics || {}).length} keys
          </div>
        </div>

        {error && (
          <div className="p-4 border-b border-red-200 bg-red-50 text-sm text-red-700 dark:bg-red-950/30 dark:border-red-900/40 dark:text-red-200">
            {error}
          </div>
        )}

        {isLoading && rows.length === 0 ? (
          <KeyValueListSkeleton rows={10} />
        ) : rows.length === 0 ? (
          <div className="p-10 text-sm text-slate-600 dark:text-slate-300">
            No config keys found.
          </div>
        ) : (
          <div className="divide-y divide-slate-200/70 dark:divide-slate-800/70">
            {rows.map((r) => (
              <div key={r.key} className="px-4 py-3 flex items-start gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="font-mono text-[13px] font-semibold text-slate-900 dark:text-white truncate">
                      {r.key}
                    </div>

                    <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded-full">
                      {r.kind}
                    </span>

                    {r.isChanged && (
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-800 dark:text-brand-200 bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-500/20 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Updated
                      </span>
                    )}
                  </div>

                  <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    <div className="font-mono text-[12px] whitespace-pre-wrap break-words line-clamp-3">
                      {typeof r.value === 'string' ? r.value : safeJsonStringify(r.value)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(r.key)}
                    className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors dark:bg-slate-950/30 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900/40"
                    title="Copy key"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(typeof r.value === 'string' ? r.value : safeJsonStringify(r.value))}
                    className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors dark:bg-slate-950/30 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900/40"
                    title="Copy value"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(r.key, r.value)}
                    className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-brand-50 hover:border-brand-200 transition-colors dark:bg-slate-950/30 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-brand-500/10 dark:hover:border-brand-500/30 text-sm font-semibold"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl ring-1 ring-black/5 overflow-hidden">
            <div className="p-5 border-b border-slate-200/70 dark:border-slate-800/70 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Edit Config</div>
                <div className="mt-1 font-mono text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {editing.key}
                </div>
              </div>
              <button
                type="button"
                onClick={closeEdit}
                className="p-2 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              {includeSensitive && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-900/15 dark:text-amber-200 dark:border-amber-500/20 flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    You’re viewing sensitive values. Avoid screen-sharing and be careful when copying.
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  Value
                  <span className="ml-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded-full">
                    {editing.kind}
                  </span>
                </div>

                {(editing.kind === 'object' || editing.kind === 'array') && (
                  <button
                    type="button"
                    onClick={() => {
                      const parsed = tryParseJson(editing.draftText);
                      if (!parsed.ok) {
                        setEditing(prev => (prev ? { ...prev, error: parsed.error } : prev));
                        return;
                      }
                      setEditing(prev => (prev ? { ...prev, draftText: safeJsonStringify(parsed.value), error: null } : prev));
                      toast.success('Formatted JSON');
                    }}
                    className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors dark:bg-slate-950/30 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900/40 text-sm font-semibold"
                  >
                    Format JSON
                  </button>
                )}
              </div>

              {editing.kind === 'boolean' ? (
                <select
                  value={String(editing.draftText)}
                  onChange={(e) => setEditing(prev => (prev ? { ...prev, draftText: e.target.value, error: null } : prev))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white shadow-inner focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500"
                >
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>
              ) : (editing.kind === 'object' || editing.kind === 'array') ? (
                <textarea
                  value={editing.draftText}
                  onChange={(e) => setEditing(prev => (prev ? { ...prev, draftText: e.target.value, error: null } : prev))}
                  rows={12}
                  spellCheck={false}
                  className="w-full px-3.5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-mono text-slate-900 dark:text-white shadow-inner focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500"
                />
              ) : (
                <input
                  value={editing.draftText}
                  onChange={(e) => setEditing(prev => (prev ? { ...prev, draftText: e.target.value, error: null } : prev))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white shadow-inner focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500"
                />
              )}

              {editing.error && (
                <div className="text-sm text-red-700 dark:text-red-200">
                  {editing.error}
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors dark:bg-slate-950/30 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900/40 text-sm font-semibold"
                  disabled={isSaving}
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveEdit}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white hover:bg-brand-700 transition-colors text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfigTab;


