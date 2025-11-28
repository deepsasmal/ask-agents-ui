import React, { useState } from 'react';
import { Plus, Table, Columns, Briefcase, Calculator, Lightbulb, Gavel } from 'lucide-react';
import { Button, Input } from '../ui/Common';
import { EditorNodeType } from '../../types';
import { EDITOR_CONFIG } from './editorConfig';

interface LeftPanelProps {
  onCreateNode: (data: any) => void;
}

// Icon Mapping helper
const ICON_MAP: Record<string, React.ReactNode> = {
  Table: <Table className="w-4 h-4" />,
  Columns: <Columns className="w-4 h-4" />,
  Briefcase: <Briefcase className="w-4 h-4" />,
  Calculator: <Calculator className="w-4 h-4" />,
  Lightbulb: <Lightbulb className="w-4 h-4" />,
  Gavel: <Gavel className="w-4 h-4" />
};

export const LeftPanel: React.FC<LeftPanelProps> = ({ onCreateNode }) => {
  const [activeTab, setActiveTab] = useState<EditorNodeType>('TECHNICAL');
  
  // Form State
  const [nodeName, setNodeName] = useState('');
  const [selectedSubType, setSelectedSubType] = useState<string>('');
  const [description, setDescription] = useState('');

  // Set default subtype when tab changes
  React.useEffect(() => {
    const defaultSub = EDITOR_CONFIG.nodeTypes[activeTab].subTypes[0].id;
    setSelectedSubType(defaultSub);
  }, [activeTab]);

  const handleCreate = () => {
    if (!nodeName) return;
    
    onCreateNode({
      type: activeTab,
      subType: selectedSubType,
      label: nodeName,
      data: {
        description: description
      }
    });
    
    // Reset form
    setNodeName('');
    setDescription('');
  };

  return (
    <div className="w-80 flex flex-col border-r border-slate-200 bg-white h-[calc(100vh-8rem)] z-10 shrink-0 select-none">
      
      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {(Object.keys(EDITOR_CONFIG.nodeTypes) as EditorNodeType[]).map((type) => (
           <button
            key={type}
            className={`flex-1 py-4 text-sm font-bold text-center border-b-2 transition-colors ${activeTab === type ? 'border-brand-600 text-brand-600 bg-brand-50/30' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
            onClick={() => setActiveTab(type)}
          >
            {EDITOR_CONFIG.nodeTypes[type].label}
          </button>
        ))}
      </div>

      <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
        <div className="space-y-6">
          
          {/* Node Type Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Node Type</label>
            <div className="grid grid-cols-2 gap-2">
               {EDITOR_CONFIG.nodeTypes[activeTab].subTypes.map((sub) => (
                 <TypeButton 
                    key={sub.id}
                    icon={ICON_MAP[sub.icon] || <Table className="w-4 h-4" />} 
                    label={sub.label} 
                    active={selectedSubType === sub.id} 
                    onClick={() => setSelectedSubType(sub.id)} 
                  />
               ))}
            </div>
          </div>

          {/* Fields */}
          <div className="space-y-4">
             <Input 
               label="Name" 
               placeholder={activeTab === 'TECHNICAL' ? "e.g. users_table" : "e.g. Customer Lifetime Value"}
               value={nodeName}
               onChange={(e) => setNodeName(e.target.value)}
             />
             
             <div className="space-y-1.5">
               <label className="text-sm font-semibold text-slate-700 ml-1">Description</label>
               <textarea 
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm resize-none h-24"
                  placeholder="Describe the purpose..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
               />
             </div>

             {/* Dynamic Fields specific to Column Type - Hardcoded for specific logic logic, 
                 could be externalized to 'fields' array in config if needed later */}
             {activeTab === 'TECHNICAL' && selectedSubType === 'COLUMN' && (
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Key Type</label>
                  <select className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-sm cursor-pointer">
                    <option value="NONE">None</option>
                    <option value="PK">Primary Key</option>
                    <option value="FK">Foreign Key</option>
                  </select>
                </div>
             )}
          </div>

          {/* Relationships Preview Hint */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
             <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Editor Hint</span>
             <p className="text-xs text-slate-500 leading-relaxed">
               Drag from the output handle (right) of this node to another node to create a relationship. Allowed connections depend on node types.
             </p>
          </div>
        </div>
      </div>

      <div className="p-5 border-t border-slate-200 bg-slate-50">
        <Button 
          className="w-full shadow-brand-600/20" 
          onClick={handleCreate}
          disabled={!nodeName}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Create Node
        </Button>
      </div>
    </div>
  );
};

interface TypeButtonProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

const TypeButton: React.FC<TypeButtonProps> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 p-2.5 rounded-xl border text-sm font-medium transition-all ${
      active 
        ? 'bg-brand-50 border-brand-200 text-brand-700 shadow-sm ring-1 ring-brand-200' 
        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
    }`}
  >
    {icon}
    {label}
  </button>
);