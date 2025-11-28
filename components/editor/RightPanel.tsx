import React, { useState, useEffect } from 'react';
import { Trash2, Network, Clock, Hash, Tag, Info, X, ArrowRightLeft, Plus } from 'lucide-react';
import { Button, Input } from '../ui/Common';
import { EditorNode, EditorEdge } from '../../types';
import { EDITOR_CONFIG, getConstraint } from './editorConfig';

interface RightPanelProps {
  nodes: EditorNode[]; // Added to support looking up source/target types
  selectedNode?: EditorNode | null;
  selectedEdge?: EditorEdge | null;
  onClose: () => void;
  onUpdateNode: (id: string, data: Partial<EditorNode>) => void;
  onDeleteNode: (id: string) => void;
  onUpdateEdge: (id: string, data: Partial<EditorEdge>) => void;
  onDeleteEdge: (id: string) => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({ 
    nodes,
    selectedNode, 
    selectedEdge,
    onClose, 
    onUpdateNode, 
    onDeleteNode,
    onUpdateEdge,
    onDeleteEdge
}) => {
  
  // -- EDGE EDITOR VIEW --
  if (selectedEdge) {
      const sourceNode = nodes.find(n => n.id === selectedEdge.source);
      const targetNode = nodes.find(n => n.id === selectedEdge.target);
      
      // Determine allowed relationship types
      let allowedTypes = EDITOR_CONFIG.relationshipTypes;
      const constraint = getConstraint(sourceNode, targetNode);
      if (constraint) {
          allowedTypes = constraint.allowed;
      }

      return (
        <div className="w-80 flex flex-col border-l border-slate-200 bg-white h-[calc(100vh-8rem)] z-10 animate-fade-in-right shrink-0">
             <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <Network className="w-4 h-4" />
                    </span>
                    <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Connection</span>
                        <span className="text-sm font-bold text-slate-900">Relationship</span>
                    </div>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="flex-1 p-5 space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 ml-1">Relationship Type</label>
                    <div className="relative">
                        <select 
                            className="w-full appearance-none px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm cursor-pointer hover:border-brand-300"
                            value={selectedEdge.label}
                            onChange={(e) => onUpdateEdge(selectedEdge.id, { label: e.target.value })}
                        >
                            {allowedTypes.map(rel => (
                                <option key={rel} value={rel}>{rel}</option>
                            ))}
                        </select>
                        <ArrowRightLeft className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                    {constraint && (
                         <p className="text-[10px] text-amber-600 font-medium px-2">
                           * Limited to specific types by schema rules
                         </p>
                    )}
                </div>
                
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-3">
                    <div className="flex justify-between items-center">
                         <span className="text-slate-500">Source:</span>
                         <span className="font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">{sourceNode?.label}</span>
                    </div>
                    <div className="flex justify-between items-center">
                         <span className="text-slate-500">Target:</span>
                         <span className="font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">{targetNode?.label}</span>
                    </div>
                </div>
            </div>

            <div className="p-5 border-t border-slate-200 bg-slate-50">
                <Button 
                    variant="ghost" 
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                    leftIcon={<Trash2 className="w-4 h-4" />}
                    onClick={() => onDeleteEdge(selectedEdge.id)}
                >
                    Delete Connection
                </Button>
            </div>
        </div>
      );
  }

  // -- NODE EDITOR VIEW --
  if (selectedNode) {
    const properties: Record<string, string> = selectedNode.data.properties || {};

    const handleAddProperty = () => {
        let counter = 1;
        while (properties[`property_${counter}`]) {
            counter++;
        }
        const newKey = `property_${counter}`;
        const newProperties = { ...properties, [newKey]: '' };
        onUpdateNode(selectedNode.id, { data: { ...selectedNode.data, properties: newProperties } });
    };

    const handleUpdatePropertyKey = (oldKey: string, newKey: string) => {
        if (!newKey || oldKey === newKey) return;
        // Simple check to prevent overwriting existing keys
        if (properties[newKey] !== undefined) {
             // In a real app we might show an error, but here we just ignore to prevent data loss
             return;
        }

        const value = properties[oldKey];
        const newProperties = { ...properties };
        delete newProperties[oldKey];
        newProperties[newKey] = value;
        
        onUpdateNode(selectedNode.id, { data: { ...selectedNode.data, properties: newProperties } });
    };

    const handleUpdatePropertyValue = (key: string, value: string) => {
        const newProperties = { ...properties, [key]: value };
        onUpdateNode(selectedNode.id, { data: { ...selectedNode.data, properties: newProperties } });
    };

    const handleDeleteProperty = (key: string) => {
        const newProperties = { ...properties };
        delete newProperties[key];
        onUpdateNode(selectedNode.id, { data: { ...selectedNode.data, properties: newProperties } });
    };

    return (
        <div className="w-80 flex flex-col border-l border-slate-200 bg-white h-[calc(100vh-8rem)] z-10 animate-fade-in-right shrink-0">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${selectedNode.type === 'TECHNICAL' ? 'bg-blue-500' : 'bg-green-500'}`} />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{selectedNode.subType}</span>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
                <X className="w-4 h-4" />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
            
            {/* Main Info */}
            <div className="space-y-4">
                <Input 
                  label="Node Name" 
                  value={selectedNode.label} 
                  onChange={(e) => onUpdateNode(selectedNode.id, { label: e.target.value })}
                />
                
                {/* Specific field for Columns */}
                {selectedNode.type === 'TECHNICAL' && selectedNode.subType === 'COLUMN' && (
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Data Type</label>
                        <input
                            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm hover:border-brand-300"
                            value={selectedNode.data.dataType || ''}
                            onChange={(e) => onUpdateNode(selectedNode.id, { data: { ...selectedNode.data, dataType: e.target.value } })}
                            placeholder="e.g. varchar, integer"
                        />
                    </div>
                )}

                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 ml-1">Description</label>
                    <textarea 
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm resize-none h-24"
                        value={selectedNode.data.description || ''}
                        onChange={(e) => onUpdateNode(selectedNode.id, { data: { ...selectedNode.data, description: e.target.value } })}
                        placeholder="Describe this node..."
                    />
                </div>
            </div>

            {/* Properties Grid */}
            <div>
                <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Hash className="w-3 h-3" /> Properties
                    </span>
                    <button 
                        onClick={handleAddProperty}
                        className="text-[10px] font-bold text-brand-600 hover:text-brand-700 hover:bg-brand-50 px-2 py-1 rounded transition-colors flex items-center gap-1"
                    >
                        <Plus className="w-3 h-3" /> Add
                    </button>
                </div>
                
                <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                    {Object.keys(properties).length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400 italic">
                            No custom properties
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {Object.entries(properties).map(([key, value]) => (
                                <PropertyRow 
                                    key={key} 
                                    originalKey={key} 
                                    originalValue={value} 
                                    onUpdateKey={handleUpdatePropertyKey}
                                    onUpdateValue={handleUpdatePropertyValue}
                                    onDelete={() => handleDeleteProperty(key)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Audit Info */}
            <div className="pt-4 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">Audit Information</span>
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Created: Oct 24, 2024</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Info className="w-3.5 h-3.5" />
                        <span>ID: {selectedNode.id.substring(0, 8)}...</span>
                    </div>
                </div>
            </div>
        </div>

        <div className="p-5 border-t border-slate-200 bg-slate-50">
            <Button 
                variant="ghost" 
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                leftIcon={<Trash2 className="w-4 h-4" />}
                onClick={() => onDeleteNode(selectedNode.id)}
            >
                Delete Node
            </Button>
        </div>
        </div>
    );
  }

  // -- EMPTY STATE --
  return (
    <div className="w-80 border-l border-slate-200 bg-white h-[calc(100vh-8rem)] flex items-center justify-center p-8 text-center shrink-0">
        <div className="space-y-3 opacity-50">
           <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
             <Tag className="w-8 h-8 text-slate-400" />
           </div>
           <p className="text-sm font-medium text-slate-500">Select a node or connection to edit properties</p>
        </div>
    </div>
  );
};

// -- SUB COMPONENT --
interface PropertyRowProps {
    originalKey: string;
    originalValue: string;
    onUpdateKey: (oldKey: string, newKey: string) => void;
    onUpdateValue: (key: string, value: string) => void;
    onDelete: () => void;
}

const PropertyRow: React.FC<PropertyRowProps> = ({ 
    originalKey, 
    originalValue, 
    onUpdateKey, 
    onUpdateValue, 
    onDelete 
}) => {
    const [key, setKey] = useState(originalKey);
    const [value, setValue] = useState(originalValue);

    // If props change from parent (e.g. undo/redo or other external update), sync state
    useEffect(() => {
        setKey(originalKey);
    }, [originalKey]);

    useEffect(() => {
        setValue(originalValue);
    }, [originalValue]);

    const submitKey = () => {
        if (key !== originalKey) {
            onUpdateKey(originalKey, key);
        }
    };

    const submitValue = () => {
        if (value !== originalValue) {
            onUpdateValue(originalKey, value);
        }
    };

    return (
        <div className="flex items-start gap-2 p-2 group hover:bg-white transition-colors">
            <div className="flex-1 space-y-1">
                <input 
                    className="w-full text-xs font-bold text-slate-700 bg-transparent border-none p-0 focus:ring-0 placeholder:text-slate-400 focus:outline-none"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    onBlur={submitKey}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.currentTarget.blur();
                        }
                    }}
                    placeholder="Key"
                />
                <input 
                    className="w-full text-xs text-slate-600 bg-slate-200/50 rounded px-1.5 py-1 border-none focus:ring-1 focus:ring-brand-500 focus:bg-white transition-all placeholder:text-slate-400"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={submitValue}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.currentTarget.blur();
                        }
                    }}
                    placeholder="Value"
                />
            </div>
            <button 
                onClick={onDelete}
                className="text-slate-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-all"
                title="Delete Property"
            >
                <Trash2 className="w-3 h-3" />
            </button>
        </div>
    );
};