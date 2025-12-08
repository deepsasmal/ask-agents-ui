import React, { useState, useEffect, useRef } from 'react';
import { Network, LayoutDashboard, MessageSquareText, Settings, LogOut, PanelLeftClose, PanelLeft, ChevronRight, Home, ChevronDown, PenLine, Loader2, MessageSquare } from 'lucide-react';
import { GraphBuilderModule } from './components/modules/GraphBuilderModule';
import { ChatModule } from './components/modules/ChatModule';
import { LandingPageModule } from './components/modules/LandingPageModule';
import { LoginPage } from './components/auth/LoginPage';
import { authApi, sessionApi, configApi, Session } from './services/api';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

type Module = 'LANDING' | 'GRAPH_BUILDER' | 'CHAT' | 'SETTINGS';

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
  
  // Chat sessions state
  const [sessions, setSessions] = useState<Session[]>([]);
  const [dbConfig, setDbConfig] = useState<DbConfig | null>(null);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isChatsCollapsed, setIsChatsCollapsed] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => generateUUID());
  const initializedRef = useRef(false);

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

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

  const handleLogout = () => {
      authApi.logout();
      setIsAuthenticated(false);
      setActiveModule('LANDING');
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
        className={`bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out z-50 shrink-0
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
                 <span className="font-bold text-xl tracking-tight text-slate-900 leading-snug whitespace-nowrap">Ask<span className="text-brand-600">Agents</span></span>
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
            
            <div className={`my-3 border-t border-slate-100 mx-2 ${isSidebarCollapsed ? 'opacity-0' : 'opacity-100'}`}></div>

            <SidebarItem 
              icon={<LayoutDashboard className="w-4 h-4" />} 
              label="Graph Builder" 
              isActive={activeModule === 'GRAPH_BUILDER'} 
              collapsed={isSidebarCollapsed}
              onClick={() => setActiveModule('GRAPH_BUILDER')}
            />
            <SidebarItem 
              icon={<MessageSquareText className="w-4 h-4" />} 
              label="Chat" 
              isActive={activeModule === 'CHAT'} 
              collapsed={isSidebarCollapsed}
              onClick={() => setActiveModule('CHAT')}
            />
            
            <SidebarItem 
              icon={<Settings className="w-4 h-4" />} 
              label="Settings" 
              isActive={activeModule === 'SETTINGS'} 
              collapsed={isSidebarCollapsed}
              onClick={() => setActiveModule('SETTINGS')}
            />

            <div className={`my-3 border-t border-slate-100 mx-2 ${isSidebarCollapsed ? 'opacity-0' : 'opacity-100'}`}></div>

            {/* Your Chats Section - Collapsible */}
            {!isSidebarCollapsed && (
                <div className="mb-4">
                    <button
                        onClick={() => setIsChatsCollapsed(!isChatsCollapsed)}
                        className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors group"
                    >
                        <span className="uppercase tracking-wider">Your chats</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isChatsCollapsed ? '-rotate-90' : ''}`} />
                    </button>
                    
                    {!isChatsCollapsed && (
                        <div className="mt-2 space-y-1">
                            {/* New Chat Button */}
                            <button
                                onClick={handleNewChat}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors group"
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
                                                ${currentSessionId === session.session_id ? 'bg-brand-50 text-brand-700 font-medium' : 'text-slate-700 hover:bg-slate-50'}
                                            `}
                                        >
                                            <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${currentSessionId === session.session_id ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                                            <div className="flex-1 truncate">
                                                {session.session_name || 'Untitled Conversation'}
                                            </div>
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
        <div className="p-3 border-t border-slate-100 mb-1">
            <div 
                className={`flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group ${isSidebarCollapsed ? 'justify-center' : ''}`}
                onClick={handleLogout}
                title="Sign Out"
            >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-100 to-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs ring-2 ring-white shadow-sm shrink-0">
                    JD
                </div>
                <div className={`overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
                    <div className="text-xs font-bold text-slate-900 truncate group-hover:text-brand-600 transition-colors">John Doe</div>
                    <div className="text-[10px] text-slate-500 truncate">Free Plan</div>
                </div>
                {!isSidebarCollapsed && (
                    <LogOut className="w-3.5 h-3.5 text-slate-300 group-hover:text-red-400 ml-auto transition-colors" />
                )}
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#f8fafc] relative">
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
         {activeModule === 'SETTINGS' && (
             <div className="flex items-center justify-center h-full text-slate-400 flex-col gap-4 animate-fade-in">
                 <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
                    <Settings className="w-10 h-10 text-slate-300" />
                 </div>
                 <p className="font-medium text-slate-500">Settings module coming soon</p>
                 <button onClick={handleLogout} className="text-brand-600 hover:text-brand-700 font-bold text-sm">Sign Out</button>
             </div>
         )}
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
                group flex items-center w-full p-2.5 rounded-xl transition-all duration-200 ease-out
                ${isActive 
                    ? 'bg-slate-100 text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
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
            
            {/* Active Indicator (Chevron) */}
            {isActive && !collapsed && (
                <ChevronRight className="w-3.5 h-3.5 ml-auto text-slate-400" />
            )}
        </button>
    )
}

export default App;