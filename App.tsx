import React, { useState, useEffect, useRef } from 'react';
import { Network, LayoutDashboard, MessageSquareText, Settings, LogOut, PanelLeftClose, PanelLeft, ChevronRight, Home, ChevronDown, PenLine, Loader2, MessageSquare, Trash2, PieChart, BookOpen, MoreVertical, Moon, Sun, User, ChartNetwork } from 'lucide-react';
import { GraphBuilderModule } from './components/modules/GraphBuilderModule';
import { ChatModule } from './components/modules/ChatModule';
import { LandingPageModule } from './components/modules/LandingPageModule';
import { DataInsightsModule } from './components/modules/DataInsightsModule';
import { KnowledgeModule } from './components/modules/KnowledgeModule';
import { SettingsModule } from './components/modules/SettingsModule';
import { LoginPage } from './components/auth/LoginPage';
import { authApi, sessionApi, configApi, Session } from './services/api';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

type Module = 'LANDING' | 'GRAPH_BUILDER' | 'CHAT' | 'DATA_INSIGHTS' | 'KNOWLEDGE' | 'SETTINGS';

const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

interface DbConfig {
    dbId: string;
    table: string;
    componentId?: string; // agent_id/team_id/workflow_id
}

const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(authApi.isAuthenticated());
    const [activeModule, setActiveModule] = useState<Module>('LANDING');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') === 'dark' ||
                (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
        }
        return false;
    });

    // Dark Mode Effect
    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    // Chat sessions state
    const [sessions, setSessions] = useState<Session[]>([]);
    const [dbConfig, setDbConfig] = useState<DbConfig | null>(null);
    const [isLoadingSessions, setIsLoadingSessions] = useState(false);
    const [isChatsCollapsed, setIsChatsCollapsed] = useState(false);
    const [currentSessionId, setCurrentSessionId] = useState<string>(() => generateUUID());
    const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const initializedRef = useRef(false);
    const profileMenuRef = useRef<HTMLDivElement>(null);

    const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

    // Handle click outside profile menu
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setIsProfileMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Initialize: Fetch Config and Sessions (only when authenticated)
    useEffect(() => {
        if (!isAuthenticated) return;
        if (initializedRef.current) return;
        initializedRef.current = true;

        const initialize = async () => {
            try {
                const configData = await configApi.getConfig();
                if (configData.session?.dbs?.length > 0 && configData.session.dbs[0].tables.length > 0) {
                    // Extract component_id from config (prioritize db-level, fallback to session-level)
                    const componentId = configData.session.dbs[0].component_id || configData.session.component_id;

                    const config = {
                        dbId: configData.session.dbs[0].db_id,
                        table: configData.session.dbs[0].tables[0],
                        componentId: componentId
                    };
                    setDbConfig(config);

                    const userId = authApi.getCurrentUser();
                    if (userId) {
                        setIsLoadingSessions(true);
                        try {
                            const sessionsList = await sessionApi.getSessions(userId, config.dbId, config.table, config.componentId);
                            setSessions(Array.isArray(sessionsList) ? sessionsList : []);
                        } catch (err) {
                            console.error("Failed to fetch sessions", err);
                            setSessions([]);
                        } finally {
                            setIsLoadingSessions(false);
                        }
                    }
                }
            } catch (err) {
                console.error('Failed to initialize:', err);
            }
        };

        initialize();
    }, [isAuthenticated]);

    const refreshSessions = async () => {
        const userId = authApi.getCurrentUser();
        if (userId && dbConfig) {
            try {
                const sessionsList = await sessionApi.getSessions(userId, dbConfig.dbId, dbConfig.table, dbConfig.componentId);
                setSessions(Array.isArray(sessionsList) ? sessionsList : []);
            } catch (err) {
                console.error("Failed to refresh sessions", err);
            }
        }
    };

    const handleNewChat = () => {
        setCurrentSessionId(generateUUID());
        setActiveModule('CHAT');
    };

    const handleSessionClick = (sessionId: string) => {
        setCurrentSessionId(sessionId);
        setActiveModule('CHAT');
    };

    const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent triggering the session click

        if (!dbConfig || deletingSessionId) return;

        setDeletingSessionId(sessionId);

        try {
            await sessionApi.deleteSession(sessionId, dbConfig.dbId);

            // Remove the session from the list immediately
            setSessions(prevSessions => prevSessions.filter(s => s.session_id !== sessionId));

            // If the deleted session is the current one, create a new session
            if (currentSessionId === sessionId) {
                setCurrentSessionId(generateUUID());
            }
        } catch (err) {
            console.error('Failed to delete session:', err);
            alert('Failed to delete session. Please try again.');
        } finally {
            setDeletingSessionId(null);
        }
    };

    const handleLogout = () => {
        authApi.logout();
        setIsAuthenticated(false);
        setActiveModule('LANDING');
        // Reset initialization flag so sessions are fetched on next login
        initializedRef.current = false;
        // Clear sessions and config
        setSessions([]);
        setDbConfig(null);
    };

    // Render login page if not authenticated
    if (!isAuthenticated) {
        return <LoginPage onLogin={() => setIsAuthenticated(true)} />;
    }

    return (
        <>
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={true}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
                style={{ zIndex: 9999 }}
            />
            <div className="flex h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-brand-200 selection:text-brand-900 overflow-hidden">

                {/* Sidebar - Minimal Light Theme */}
                <aside
                    className={`bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out z-50 shrink-0 dark:bg-slate-900 dark:border-slate-800
          ${isSidebarCollapsed ? 'w-16' : 'w-64'} 
        `}
                >
                    {/* Logo Area - Reduced Height */}
                    <div className="h-16 flex items-center px-4 mt-1 border-b border-transparent">
                        <div
                            className="flex items-center gap-3 cursor-pointer group w-full justify-center lg:justify-start"
                            onClick={() => {
                                if (isSidebarCollapsed) {
                                    toggleSidebar();
                                    setActiveModule('LANDING');
                                } else {
                                    setActiveModule('LANDING');
                                }
                            }}
                            title="Back to Home"
                        >
                            <div className="relative w-8 h-8 shrink-0">
                                <div className="absolute inset-0 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-md shadow-slate-200 transition-transform group-hover:scale-105">
                                    {isSidebarCollapsed ? (
                                        <>
                                            <Network className="w-4 h-4 absolute transition-opacity duration-300 opacity-100 group-hover:opacity-0" />
                                            <PanelLeft className="w-4 h-4 absolute transition-opacity duration-300 opacity-0 group-hover:opacity-100" />
                                        </>
                                    ) : (
                                        <Network className="w-4 h-4" />
                                    )}
                                </div>
                            </div>

                            <div className={`flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
                                <span className="font-bold text-xl tracking-tight text-slate-900 leading-snug whitespace-nowrap dark:text-white">Ask<span className="text-brand-600">Agents</span></span>
                            </div>

                            {/* Collapse Toggle integrated in header when open */}
                            {!isSidebarCollapsed && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleSidebar(); }}
                                    className="ml-auto text-slate-300 hover:text-slate-600 transition-colors p-1"
                                >
                                    <PanelLeftClose className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Nav Items */}
                    <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
                        <SidebarItem
                            icon={<Home className="w-4 h-4" />}
                            label="Home"
                            isActive={activeModule === 'LANDING'}
                            collapsed={isSidebarCollapsed}
                            onClick={() => setActiveModule('LANDING')}
                        />

                        <div className={`my-3 border-t border-slate-100 mx-2 dark:border-slate-700/50 ${isSidebarCollapsed ? 'opacity-0' : 'opacity-100'}`}></div>

                        <SidebarItem
                            icon={<MessageSquareText className="w-4 h-4" />}
                            label="Chat"
                            isActive={activeModule === 'CHAT'}
                            collapsed={isSidebarCollapsed}
                            onClick={() => setActiveModule('CHAT')}
                        />
                        <SidebarItem
                            icon={<ChartNetwork className="w-4 h-4" />}
                            label="Graph Builder"
                            isActive={activeModule === 'GRAPH_BUILDER'}
                            collapsed={isSidebarCollapsed}
                            onClick={() => setActiveModule('GRAPH_BUILDER')}
                        />
                        <SidebarItem
                            icon={<PieChart className="w-4 h-4" />}
                            label="Data Insights"
                            isActive={activeModule === 'DATA_INSIGHTS'}
                            collapsed={isSidebarCollapsed}
                            onClick={() => setActiveModule('DATA_INSIGHTS')}
                        />
                        <SidebarItem
                            icon={<BookOpen className="w-4 h-4" />}
                            label="Knowledge"
                            isActive={activeModule === 'KNOWLEDGE'}
                            collapsed={isSidebarCollapsed}
                            onClick={() => setActiveModule('KNOWLEDGE')}
                        />

                        <SidebarItem
                            icon={<Settings className="w-4 h-4" />}
                            label="Settings"
                            isActive={activeModule === 'SETTINGS'}
                            collapsed={isSidebarCollapsed}
                            onClick={() => setActiveModule('SETTINGS')}
                        />

                        <div className={`my-3 border-t border-slate-100 mx-2 dark:border-slate-700/50 ${isSidebarCollapsed ? 'opacity-0' : 'opacity-100'}`}></div>

                        {/* Your Chats Section - Collapsible */}
                        {!isSidebarCollapsed && (
                            <div className="mb-4">
                                <button
                                    onClick={() => setIsChatsCollapsed(!isChatsCollapsed)}
                                    className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors group dark:text-slate-400 dark:hover:text-slate-200"
                                >
                                    <span className="tracking-wider">Your Chats</span>
                                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isChatsCollapsed ? '-rotate-90' : ''}`} />
                                </button>

                                {!isChatsCollapsed && (
                                    <div className="mt-2 space-y-1">
                                        {/* New Chat Button */}
                                        <button
                                            onClick={handleNewChat}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors group dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
                                        >
                                            <PenLine className="w-3.5 h-3.5 shrink-0" />
                                            <span className="font-medium">New Chat</span>
                                        </button>

                                        {/* Chat List */}
                                        {isLoadingSessions ? (
                                            <div className="p-4 flex justify-center">
                                                <Loader2 className="w-4 h-4 text-brand-600 animate-spin" />
                                            </div>
                                        ) : !Array.isArray(sessions) || sessions.length === 0 ? (
                                            <div className="px-3 py-2 text-xs text-slate-400 italic">
                                                No previous chats
                                            </div>
                                        ) : (
                                            <div className="space-y-0.5">
                                                {sessions.map((session) => (
                                                    <button
                                                        key={session.session_id}
                                                        onClick={() => handleSessionClick(session.session_id)}
                                                        className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2 transition-colors group relative overflow-hidden
                                                ${currentSessionId === session.session_id ? 'bg-brand-50 text-brand-700 font-medium dark:bg-brand-900/20 dark:text-brand-400' : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'}
                                            `}
                                                    >

                                                        <div className="flex-1 truncate">
                                                            {session.session_name || 'Untitled Conversation'}
                                                        </div>
                                                        {deletingSessionId === session.session_id ? (
                                                            <div className="p-1">
                                                                <Loader2 className="w-3.5 h-3.5 text-red-500 animate-spin" />
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={(e) => handleDeleteSession(session.session_id, e)}
                                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded"
                                                                title="Delete session"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-600" />
                                                            </button>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* User / Footer */}
                    <div className="p-3 border-t border-slate-100 mb-1 dark:border-slate-800">
                        <div
                            className={`flex items-center gap-2.5 p-2 rounded-lg transition-colors group ${isSidebarCollapsed ? 'flex-col justify-center' : ''}`}
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-100 to-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs ring-2 ring-white shadow-sm shrink-0">
                                {authApi.getUserInitials()}
                            </div>
                            <div className={`overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
                                <div className="text-xs font-bold text-slate-900 truncate transition-colors dark:text-slate-200">{authApi.getUserDisplayName()}</div>
                                <div className="text-[10px] text-slate-500 truncate">{authApi.getUserEmail()}</div>
                            </div>
                            <div className={`relative ${isSidebarCollapsed ? 'hidden' : 'ml-auto'}`} ref={profileMenuRef}>
                                <button
                                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                    className="p-1.5 rounded-md hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
                                    title="Options"
                                >
                                    <MoreVertical className="w-3.5 h-3.5" />
                                </button>

                                {/* Profile Menu Popup */}
                                {isProfileMenuOpen && (
                                    <div className={`absolute bottom-full mb-2 bg-white rounded-xl shadow-xl border border-slate-200 w-56 overflow-hidden z-[60] animate-fade-in
                                        ${isSidebarCollapsed ? 'left-1/2 -translate-x-1/2' : 'right-0'}
                                    `}>
                                        <div className="p-2 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                            <button
                                                onClick={() => setIsDarkMode(false)}
                                                className={`flex-1 flex items-center justify-center gap-2 p-1.5 rounded-lg transition-colors ${!isDarkMode ? 'bg-white shadow-sm text-brand-600 font-medium' : 'text-slate-500 hover:bg-slate-100'}`}
                                            >
                                                <Sun className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setIsDarkMode(true)}
                                                className={`flex-1 flex items-center justify-center gap-2 p-1.5 rounded-lg transition-colors ${isDarkMode ? 'bg-white shadow-sm text-brand-600 font-medium' : 'text-slate-500 hover:bg-slate-100'}`}
                                            >
                                                <Moon className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="p-1">
                                            <button
                                                onClick={() => {
                                                    setActiveModule('SETTINGS');
                                                    setIsProfileMenuOpen(false);
                                                }}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
                                            >
                                                <User className="w-4 h-4" />
                                                <span>Profile Settings</span>
                                            </button>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                <span>Logout</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#f8fafc] relative dark:bg-[#0f172a]">
                    {/* Global Page Transition Styles */}
                    <style>
                        {`
                          @keyframes page-enter {
                            0% {
                              opacity: 0;
                              transform: translateY(10px) scale(0.99);
                              filter: blur(4px);
                            }
                            100% {
                              opacity: 1;
                              transform: translateY(0) scale(1);
                              filter: blur(0);
                            }
                          }
                          .animate-page-enter {
                            animation: page-enter 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
                            will-change: transform, opacity, filter;
                          }
                        `}
                    </style>

                    <div key={activeModule} className="flex-1 h-full w-full animate-page-enter">
                        {activeModule === 'LANDING' && (
                            <LandingPageModule onNavigate={(module) => setActiveModule(module)} />
                        )}
                        {activeModule === 'GRAPH_BUILDER' && <GraphBuilderModule />}
                        {activeModule === 'CHAT' && (
                            <ChatModule
                                sessionId={currentSessionId}
                                onSessionUpdate={refreshSessions}
                            />
                        )}
                        {activeModule === 'DATA_INSIGHTS' && <DataInsightsModule />}
                        {activeModule === 'KNOWLEDGE' && <KnowledgeModule />}
                        {activeModule === 'SETTINGS' && (
                            <SettingsModule
                                isDarkMode={isDarkMode}
                                onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
                                onLogout={handleLogout}
                                onClose={() => setActiveModule('LANDING')}
                            />
                        )}
                    </div>
                </main>

            </div>
        </>
    );
};

// Sidebar Item Component
const SidebarItem = ({ icon, label, isActive, collapsed, onClick }: { icon: React.ReactNode, label: string, isActive: boolean, collapsed: boolean, onClick: () => void }) => {
    return (
        <button
            onClick={onClick}
            className={`
                group flex items-center w-full p-2.5 rounded-xl transition-all duration-200 ease-out relative
                ${isActive
                    ? 'bg-slate-100 text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800'
                }
                ${collapsed ? 'justify-center' : 'gap-3'}
            `}
            title={collapsed ? label : undefined}
        >
            <div className={`transition-transform duration-300 ${isActive ? 'text-slate-900 scale-105' : 'group-hover:text-slate-700'}`}>
                {icon}
            </div>

            {!collapsed && (
                <span className={`text-sm whitespace-nowrap transition-all duration-300 ${isActive ? 'font-bold' : 'font-medium'}`}>{label}</span>
            )}

            {/* Active Vertical Line Indicator */}
            {isActive && (
                <div className="absolute top-1 bottom-1 right-0 w-[2px] rounded-full bg-emerald-500 shadow-[0_0_0_1px_rgba(16,185,129,0.18)]" />
            )}
        </button>
    )
}

export default App;