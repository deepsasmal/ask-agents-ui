import React, { useState } from 'react';
import { Network, LayoutDashboard, MessageSquareText, Settings, UserCircle, LogOut, PanelLeftClose, PanelLeft } from 'lucide-react';
import { GraphBuilderModule } from './components/modules/GraphBuilderModule';
import { ChatModule } from './components/modules/ChatModule';

type Module = 'GRAPH_BUILDER' | 'CHAT' | 'SETTINGS';

const App: React.FC = () => {
  const [activeModule, setActiveModule] = useState<Module>('GRAPH_BUILDER');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans selection:bg-brand-200 selection:text-brand-900 overflow-hidden">
      
      {/* Sidebar */}
      <aside 
        className={`bg-slate-900 text-white flex flex-col transition-all duration-300 ease-in-out z-50 shrink-0
          ${isSidebarCollapsed ? 'w-20' : 'w-64'}
        `}
      >
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
           <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveModule('GRAPH_BUILDER')}>
               <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/20 ring-1 ring-white/10 shrink-0">
                 <Network className="w-5 h-5" />
               </div>
               <div className={`font-bold text-lg tracking-tight whitespace-nowrap overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                 Graph<span className="text-brand-400">Builder</span>
               </div>
           </div>
        </div>

        {/* Nav Items */}
        <div className="flex-1 py-6 px-3 space-y-2 overflow-y-auto custom-scrollbar-dark">
            <SidebarItem 
              icon={<LayoutDashboard className="w-5 h-5" />} 
              label="Graph Builder" 
              isActive={activeModule === 'GRAPH_BUILDER'} 
              collapsed={isSidebarCollapsed}
              onClick={() => setActiveModule('GRAPH_BUILDER')}
            />
            <SidebarItem 
              icon={<MessageSquareText className="w-5 h-5" />} 
              label="AI Assistant" 
              isActive={activeModule === 'CHAT'} 
              collapsed={isSidebarCollapsed}
              onClick={() => setActiveModule('CHAT')}
            />
             {/* Divider */}
            <div className="my-4 border-t border-slate-800/50 mx-3"></div>
            <SidebarItem 
              icon={<Settings className="w-5 h-5" />} 
              label="Settings" 
              isActive={activeModule === 'SETTINGS'} 
              collapsed={isSidebarCollapsed}
              onClick={() => setActiveModule('SETTINGS')}
            />
        </div>

        {/* User / Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
            <button 
                onClick={toggleSidebar}
                className="w-full flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 mb-4 transition-colors"
                title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
                {isSidebarCollapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
            </button>
            
            <div className={`flex items-center gap-3 px-2 transition-all duration-300 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs shadow-inner shrink-0 ring-2 ring-slate-800">
                    JD
                </div>
                <div className={`overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
                    <div className="text-sm font-bold text-slate-200 truncate">John Doe</div>
                    <div className="text-xs text-slate-500 truncate">Admin Workspace</div>
                </div>
                {!isSidebarCollapsed && (
                    <button className="ml-auto text-slate-500 hover:text-red-400 transition-colors">
                        <LogOut className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 relative">
         {activeModule === 'GRAPH_BUILDER' && <GraphBuilderModule />}
         {activeModule === 'CHAT' && <ChatModule />}
         {activeModule === 'SETTINGS' && (
             <div className="flex items-center justify-center h-full text-slate-400 flex-col gap-4">
                 <Settings className="w-16 h-16 opacity-20" />
                 <p className="font-medium">Settings module coming soon</p>
             </div>
         )}
      </main>
      
    </div>
  );
};

// Sidebar Item Component
const SidebarItem = ({ icon, label, isActive, collapsed, onClick }: { icon: React.ReactNode, label: string, isActive: boolean, collapsed: boolean, onClick: () => void }) => {
    return (
        <button 
            onClick={onClick}
            className={`
                group flex items-center w-full p-3 rounded-xl transition-all duration-200 relative
                ${isActive 
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/20' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }
                ${collapsed ? 'justify-center' : 'gap-3'}
            `}
            title={collapsed ? label : undefined}
        >
            <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                {icon}
            </div>
            
            {!collapsed && (
                <span className="font-medium text-sm whitespace-nowrap">{label}</span>
            )}
            
            {/* Active Indicator Strip (Left) */}
            {isActive && !collapsed && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white/20 rounded-r-full"></div>
            )}
        </button>
    )
}

export default App;