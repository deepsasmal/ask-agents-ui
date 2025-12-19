import React, { useEffect, useState } from 'react';
import { ArrowLeft, Bot, ChevronRight, Database, Loader2, RefreshCw, Settings2, User, X } from 'lucide-react';
import { agentApi, authApi, mindsdbApi } from '../../services/api';
import type { Agent, AgentDetails, MindsDbDatabase } from '../../services/api';
import { consumeNextSettingsTab } from '../../utils/settingsDeeplink';
import { ConfigTab } from '../settings/ConfigTab';

interface SettingsModuleProps {
    isDarkMode: boolean;
    onToggleDarkMode: () => void;
    onLogout: () => void;
    onClose: () => void;
    agents?: Agent[];
}

const navItems: Array<{ key: 'Profile' | 'Agents' | 'Data' | 'Config'; label: string; icon: React.ReactNode }> = [
    { key: 'Profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
    { key: 'Agents', label: 'Agents', icon: <Bot className="w-4 h-4" /> },
    { key: 'Data', label: 'Data', icon: <Database className="w-4 h-4" /> },
    { key: 'Config', label: 'Config', icon: <Settings2 className="w-4 h-4" /> },
];

export const SettingsModule: React.FC<SettingsModuleProps> = ({ isDarkMode, onToggleDarkMode, onLogout, onClose, agents = [] }) => {
    const [activeItem, setActiveItem] = useState<'Profile' | 'Agents' | 'Data' | 'Config'>(() => {
        // Allow other screens to deep-link into a specific Settings tab (one-time, non-persistent).
        const v = consumeNextSettingsTab();
        if (v === 'Profile' || v === 'Agents' || v === 'Data' || v === 'Config') return v;
        return 'Profile';
    });
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');

    const [isAnimatingIn, setIsAnimatingIn] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    const [agentsScreen, setAgentsScreen] = useState<'LIST' | 'DETAILS'>('LIST');
    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
    const [agentDetails, setAgentDetails] = useState<AgentDetails | null>(null);
    const [isLoadingAgentDetails, setIsLoadingAgentDetails] = useState(false);
    const [agentDetailsError, setAgentDetailsError] = useState<string | null>(null);

    const [mindsDbDatabases, setMindsDbDatabases] = useState<MindsDbDatabase[]>([]);
    const [isLoadingMindsDb, setIsLoadingMindsDb] = useState(false);
    const [mindsDbError, setMindsDbError] = useState<string | null>(null);
    const [expandedDbName, setExpandedDbName] = useState<string | null>(null);

    useEffect(() => {
        // Trigger enter transition on mount.
        const t = setTimeout(() => setIsAnimatingIn(true), 10);
        return () => clearTimeout(t);
    }, []);

    // No persistent deep-link marker to clear (we use an in-memory one-time hint).

    useEffect(() => {
        const first = localStorage.getItem('user_first_name') || '';
        const last = localStorage.getItem('user_last_name') || '';
        const displayName = `${first} ${last}`.trim() || authApi.getUserDisplayName();
        const storedUsername = localStorage.getItem('user_username') || authApi.getCurrentUser() || '';
        const storedEmail = localStorage.getItem('user_email') || '';

        setName(displayName);
        setUsername(storedUsername);
        setEmail(storedEmail);
    }, []);

    const sidebarDisplayName = name?.trim() || authApi.getUserDisplayName();
    const sidebarInitials = (() => {
        const n = sidebarDisplayName.trim();
        if (!n) return authApi.getUserInitials();
        const parts = n.split(/\s+/).filter(Boolean);
        const first = parts[0]?.[0] || '';
        const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] || '') : (parts[0]?.[1] || '');
        const initials = `${first}${last}`.toUpperCase();
        return initials || authApi.getUserInitials();
    })();

    // Reset Agents sub-screen when switching primary nav
    useEffect(() => {
        if (activeItem !== 'Agents') return;
        setAgentsScreen('LIST');
        setSelectedAgentId(null);
        setAgentDetails(null);
        setAgentDetailsError(null);
        setIsLoadingAgentDetails(false);
    }, [activeItem]);

    const safeParseParams = (params?: string) => {
        if (!params) return null;
        const s = String(params).trim();
        if (!s || s === '{}' || s === 'null') return null;
        try {
            return JSON.parse(s);
        } catch {
            return null;
        }
    };

    const loadMindsDbDatabases = async (forceRefresh = false) => {
        setIsLoadingMindsDb(true);
        setMindsDbError(null);
        try {
            if (forceRefresh) mindsdbApi.clearCache();
            const dbs = await mindsdbApi.getDatabases();
            setMindsDbDatabases(dbs);
        } catch (e: any) {
            setMindsDbError(e?.message || 'Failed to load databases');
            setMindsDbDatabases([]);
        } finally {
            setIsLoadingMindsDb(false);
        }
    };

    // Fetch DB list when opening Data tab
    useEffect(() => {
        if (activeItem !== 'Data') return;
        if (mindsDbDatabases.length > 0 || isLoadingMindsDb) return;
        loadMindsDbDatabases(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeItem]);

    const openAgentDetails = async (agent: Agent) => {
        setAgentsScreen('DETAILS');
        setSelectedAgentId(agent.id);
        setAgentDetails(null);
        setAgentDetailsError(null);
        setIsLoadingAgentDetails(true);

        try {
            const details = await agentApi.getAgent(agent.id);
            setAgentDetails(details);
        } catch (e: any) {
            setAgentDetailsError(e?.message || 'Failed to load agent details');
        } finally {
            setIsLoadingAgentDetails(false);
        }
    };

    const backToAgentList = () => {
        setAgentsScreen('LIST');
        setSelectedAgentId(null);
        setAgentDetails(null);
        setAgentDetailsError(null);
        setIsLoadingAgentDetails(false);
    };

    const handleClose = () => {
        if (isClosing) return;
        setIsClosing(true);
        setIsAnimatingIn(false);
        // Allow exit animation to play before unmounting.
        window.setTimeout(() => onClose(), 220);
    };

    return (
        <div
            className={`fixed inset-0 z-40 flex items-center justify-center px-3 sm:px-4 lg:px-8 py-3 sm:py-5 lg:py-8 transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]
                ${isAnimatingIn ? 'bg-black/35 backdrop-blur-sm opacity-100' : 'bg-black/0 backdrop-blur-0 opacity-0'}
            `}
        >
            <div
                className={`relative w-full max-w-screen-2xl h-[92vh] bg-white dark:bg-slate-950 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden ring-1 ring-black/5 flex flex-col
                    transition-opacity duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]
                    ${isAnimatingIn ? 'opacity-100' : 'opacity-0'}
                `}
            >
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 p-2 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="grid grid-cols-12 flex-1 min-h-0">
                    {/* Sidebar */}
                    <div className="col-span-3 border-r border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 overflow-y-auto">
                        <div className="px-5 pt-6 pb-4 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-2xl bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-200 flex items-center justify-center font-bold">
                                {sidebarInitials}
                            </div>
                            <div className="flex flex-col">
                                <span className="font-semibold text-slate-900 dark:text-white">{sidebarDisplayName}</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">Owner</span>
                            </div>
                        </div>

                        <div className="space-y-1 px-2 pb-4">
                            {navItems.map((item) => (
                                <button
                                    key={item.key}
                                    onClick={() => setActiveItem(item.key)}
                                    className={`w-full text-left px-4 py-3 rounded-2xl transition-all duration-150 flex items-center gap-3 relative ${
                                        activeItem === item.key
                                            ? 'bg-white shadow-sm text-slate-900 dark:bg-slate-800 dark:text-white'
                                            : 'text-slate-600 hover:bg-white/80 dark:text-slate-400 dark:hover:bg-slate-800/70'
                                    }`}
                                >
                                    <span className={`shrink-0 ${activeItem === item.key ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                        {item.icon}
                                    </span>
                                    <span className="text-sm font-semibold">{item.label}</span>
                                    {activeItem === item.key && (
                                        <span className="absolute right-0 top-1 bottom-1 w-[3px] rounded-full bg-brand-600 shadow-[0_0_0_1px_rgba(20,184,166,0.18)]" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="col-span-9 p-12 overflow-y-auto">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{activeItem}</p>
                                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{activeItem}</h2>
                            </div>
                        </div>

                        {activeItem === 'Profile' && (
                            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm p-10 max-w-3xl">
                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Name</label>
                                        <input
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white shadow-inner focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">User Name</label>
                                        <input
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white shadow-inner focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Email</label>
                                        <input
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white shadow-inner focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500"
                                        />
                                    </div>
                                    <div className="pt-2">
                                        <button className="px-5 py-2.5 rounded-lg bg-slate-100 text-slate-500 text-sm font-semibold cursor-not-allowed">
                                            Save
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeItem === 'Agents' && (
                            <div className="max-w-3xl">
                                <div className="space-y-6">
                                    {agentsScreen === 'LIST' && (
                                        <div className="text-sm text-slate-500 dark:text-slate-400">
                                            Click an agent to view details.
                                        </div>
                                    )}

                                    {agentsScreen === 'DETAILS' && (
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="min-w-0">
                                                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                                    Agent Details
                                                </div>
                                                <div className="text-lg font-bold text-slate-900 dark:text-white truncate mt-1">
                                                    {agentDetails?.name || selectedAgentId || 'Agent'}
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={backToAgentList}
                                                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-brand-50 hover:border-brand-200 transition-colors dark:bg-slate-950/30 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-brand-500/10 dark:hover:border-brand-500/30 shrink-0"
                                            >
                                                <ArrowLeft className="w-4 h-4" />
                                                <span className="text-sm font-semibold">Back</span>
                                            </button>
                                        </div>
                                    )}

                                    {agents.length === 0 ? (
                                        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-6 bg-slate-50/60 dark:bg-slate-950/30">
                                            <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">No agents found</div>
                                            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                                Your config response didn’t include any activated agents.
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {agentsScreen === 'LIST' && (
                                                <div className="divide-y divide-slate-200/70 dark:divide-slate-800/70">
                                                    {agents.map((agent) => (
                                                        <button
                                                            key={agent.id}
                                                            type="button"
                                                            onClick={() => openAgentDetails(agent)}
                                                            className="w-full flex items-center justify-between gap-4 py-4 text-left hover:bg-brand-50/70 dark:hover:bg-brand-500/10 transition-colors rounded-xl px-3"
                                                        >
                                                            <div className="min-w-0">
                                                                <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                                                    {agent.name}
                                                                </div>
                                                            </div>
                                                            <ChevronRight className="w-4 h-4 text-brand-600/70 dark:text-brand-400 shrink-0" />
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {agentsScreen === 'DETAILS' && (
                                                <div className="space-y-4">
                                                    {isLoadingAgentDetails && (
                                                        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/30 p-6 flex items-center gap-3">
                                                            <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                                                            <div className="text-sm text-slate-600 dark:text-slate-300">
                                                                Loading agent details…
                                                            </div>
                                                        </div>
                                                    )}

                                                    {agentDetailsError && (
                                                        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:bg-red-950/30 dark:border-red-900/40 dark:text-red-200">
                                                            {agentDetailsError}
                                                        </div>
                                                    )}

                                                    {!isLoadingAgentDetails && !agentDetailsError && agentDetails && (
                                                        <div className="space-y-3">
                                                            <details className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/30 p-5" open>
                                                                <summary className="cursor-pointer list-none flex items-center justify-between">
                                                                    <div className="text-sm font-semibold text-slate-900 dark:text-white">Agent</div>
                                                                    <ChevronRight className="w-4 h-4 text-brand-600/70 dark:text-brand-400 transition-transform group-open:rotate-90" />
                                                                </summary>
                                                                <div className="mt-4 text-sm text-slate-600 dark:text-slate-300 space-y-2">
                                                                    <div><span className="font-semibold">ID:</span> {agentDetails.id}</div>
                                                                    <div><span className="font-semibold">Name:</span> {agentDetails.name}</div>
                                                                    {agentDetails.db_id && <div><span className="font-semibold">DB:</span> {agentDetails.db_id}</div>}
                                                                </div>
                                                            </details>

                                                            <details className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/30 p-5">
                                                                <summary className="cursor-pointer list-none flex items-center justify-between">
                                                                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                                                                        Model
                                                                        {agentDetails.model?.model ? (
                                                                            <span className="ml-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded-full">
                                                                                {agentDetails.model.model}
                                                                            </span>
                                                                        ) : null}
                                                                    </div>
                                                                    <ChevronRight className="w-4 h-4 text-brand-600/70 dark:text-brand-400 transition-transform group-open:rotate-90" />
                                                                </summary>
                                                                <div className="mt-4 text-sm text-slate-600 dark:text-slate-300 space-y-2">
                                                                    {agentDetails.model?.model && <div><span className="font-semibold">model:</span> {agentDetails.model.model}</div>}
                                                                    {agentDetails.model?.name && <div><span className="font-semibold">name:</span> {agentDetails.model.name}</div>}
                                                                    {agentDetails.model?.provider && <div><span className="font-semibold">provider:</span> {agentDetails.model.provider}</div>}
                                                                </div>
                                                            </details>

                                                            <details className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/30 p-5">
                                                                <summary className="cursor-pointer list-none flex items-center justify-between">
                                                                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                                                                        Tools
                                                                        <span className="ml-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded-full">
                                                                            {(agentDetails.tools?.tools || []).length}
                                                                        </span>
                                                                    </div>
                                                                    <ChevronRight className="w-4 h-4 text-brand-600/70 dark:text-brand-400 transition-transform group-open:rotate-90" />
                                                                </summary>
                                                                <div className="mt-4 flex flex-wrap gap-2">
                                                                    {(agentDetails.tools?.tools || []).map((t) => (
                                                                        <span
                                                                            key={t.name}
                                                                            className="text-[11px] font-semibold text-brand-800 dark:text-brand-200 bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-500/20 px-2.5 py-1 rounded-full"
                                                                        >
                                                                            {t.name}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </details>

                                                            <details className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/30 p-5">
                                                                <summary className="cursor-pointer list-none flex items-center justify-between">
                                                                    <div className="text-sm font-semibold text-slate-900 dark:text-white">Sessions</div>
                                                                    <ChevronRight className="w-4 h-4 text-brand-600/70 dark:text-brand-400 transition-transform group-open:rotate-90" />
                                                                </summary>
                                                                <div className="mt-4 text-sm text-slate-600 dark:text-slate-300 space-y-2">
                                                                    {agentDetails.sessions?.add_history_to_context !== undefined && (
                                                                        <div><span className="font-semibold">add_history_to_context:</span> {String(agentDetails.sessions.add_history_to_context)}</div>
                                                                    )}
                                                                    {agentDetails.sessions?.num_history_runs !== undefined && (
                                                                        <div><span className="font-semibold">num_history_runs:</span> {String(agentDetails.sessions.num_history_runs)}</div>
                                                                    )}
                                                                    {agentDetails.sessions?.session_table && (
                                                                        <div><span className="font-semibold">session_table:</span> {agentDetails.sessions.session_table}</div>
                                                                    )}
                                                                </div>
                                                            </details>

                                                            <details className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/30 p-5">
                                                                <summary className="cursor-pointer list-none flex items-center justify-between">
                                                                    <div className="text-sm font-semibold text-slate-900 dark:text-white">System Message</div>
                                                                    <ChevronRight className="w-4 h-4 text-brand-600/70 dark:text-brand-400 transition-transform group-open:rotate-90" />
                                                                </summary>
                                                                <div className="mt-4 text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                                                                    {agentDetails.system_message?.description || ''}
                                                                </div>
                                                            </details>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeItem === 'Data' && (
                            <div className="max-w-3xl">
                                <div className="space-y-6">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <div className="text-sm font-semibold text-slate-900 dark:text-white">Databases</div>
                                            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                                Connected databases from MindsDB.
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => loadMindsDbDatabases(true)}
                                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-brand-50 hover:border-brand-200 transition-colors dark:bg-slate-950/30 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-brand-500/10 dark:hover:border-brand-500/30 shrink-0"
                                            disabled={isLoadingMindsDb}
                                        >
                                            <RefreshCw className={`w-4 h-4 ${isLoadingMindsDb ? 'animate-spin' : ''}`} />
                                            <span className="text-sm font-semibold">Refresh</span>
                                        </button>
                                    </div>

                                    {mindsDbError && (
                                        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:bg-red-950/30 dark:border-red-900/40 dark:text-red-200">
                                            {mindsDbError}
                                        </div>
                                    )}

                                    {isLoadingMindsDb && mindsDbDatabases.length === 0 && (
                                        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/30 p-6 flex items-center gap-3">
                                            <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                                            <div className="text-sm text-slate-600 dark:text-slate-300">Loading databases…</div>
                                        </div>
                                    )}

                                    {!isLoadingMindsDb && !mindsDbError && mindsDbDatabases.length === 0 && (
                                        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 bg-slate-50/60 dark:bg-slate-950/30">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-brand-50 border border-brand-100 text-brand-700 dark:bg-brand-900/20 dark:border-brand-500/20 dark:text-brand-200 flex items-center justify-center">
                                                    <Database className="w-5 h-5" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <div className="text-sm font-semibold text-slate-900 dark:text-white">No databases found</div>
                                                    <div className="text-sm text-slate-500 dark:text-slate-400">In progress</div>
                                                </div>
                                            </div>
                                            <div className="mt-5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                                This section will contain data-related settings. Databases haven’t been configured yet.
                                            </div>
                                        </div>
                                    )}

                                    {mindsDbDatabases.length > 0 && (
                                        <div className="divide-y divide-slate-200/70 dark:divide-slate-800/70">
                                            {mindsDbDatabases.map((db) => {
                                                const parsed = safeParseParams(db.params);
                                                const isExpanded = expandedDbName === db.name;
                                                return (
                                                    <div key={db.name} className="rounded-2xl">
                                                        <button
                                                            type="button"
                                                            onClick={() => setExpandedDbName(prev => (prev === db.name ? null : db.name))}
                                                            className="w-full flex items-center justify-between gap-4 py-4 text-left hover:bg-brand-50/70 dark:hover:bg-brand-500/10 transition-colors rounded-xl px-3"
                                                        >
                                                            <div className="min-w-0">
                                                                <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                                                    {db.name}
                                                                </div>
                                                                <div className="mt-1 flex items-center gap-2 flex-wrap">
                                                                    {db.engine && (
                                                                        <span className="text-[11px] font-semibold text-brand-800 dark:text-brand-200 bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-500/20 px-2.5 py-1 rounded-full uppercase tracking-wide">
                                                                            {db.engine}
                                                                        </span>
                                                                    )}
                                                                    {db.repr && (
                                                                        <span className="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-full">
                                                                            {db.repr}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <ChevronRight className={`w-4 h-4 text-brand-600/70 dark:text-brand-400 shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                                        </button>

                                                        {isExpanded && (
                                                            <div className="px-3 pb-4">
                                                                {parsed ? (
                                                                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/30 p-5 text-sm text-slate-700 dark:text-slate-200">
                                                                        <div className="grid grid-cols-2 gap-3">
                                                                            {Object.entries(parsed).map(([k, v]) => (
                                                                                <div key={k} className="min-w-0">
                                                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                                                        {k}
                                                                                    </div>
                                                                                    <div className="text-sm text-slate-700 dark:text-slate-200 truncate">
                                                                                        {String(v)}
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/30 p-5 text-sm text-slate-600 dark:text-slate-300">
                                                                        No connection details available.
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeItem === 'Config' && (
                            <ConfigTab />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsModule;

