
import React, { useState } from 'react';
import { TopBar } from './TopBar';
import { LeftPanel } from './LeftPanel';
import { RightPanel } from './RightPanel';
import { Canvas } from './Canvas';
import { EditorState, EditorNode, EditorEdge, EditorNodeType } from '../../types';
import { getConstraint } from './editorConfig';
import { SearchNodeResult } from '../../services/api';

interface GraphEditorProps {
  projectName?: string;
}

// Initial Mock Data
const INITIAL_NODES: EditorNode[] = [
    { id: '1', type: 'TECHNICAL', subType: 'TABLE', label: 'users', x: 100, y: 100, data: { description: 'Core user registry' } },
    { id: '2', type: 'TECHNICAL', subType: 'TABLE', label: 'orders', x: 400, y: 100, data: { description: 'Transaction history' } },
    { id: '3', type: 'BUSINESS', subType: 'ENTITY', label: 'Customer', x: 100, y: 300, data: { description: 'A person who purchases goods' } },
    { id: '4', type: 'BUSINESS', subType: 'METRIC', label: 'LTV', x: 400, y: 300, data: { description: 'Lifetime Value' } },
];

const INITIAL_EDGES: EditorEdge[] = [
    { id: 'e1', source: '1', target: '2', label: 'HAS_COLUMN' },
    { id: 'e2', source: '3', target: '1', label: 'MAPPED_TO' },
    { id: 'e3', source: '3', target: '4', label: 'HAS_METRIC' },
];

export const GraphEditor: React.FC<GraphEditorProps> = ({ projectName }) => {
  const [state, setState] = useState<EditorState>({
      nodes: INITIAL_NODES,
      edges: INITIAL_EDGES,
      selectedNodeId: null,
      selectedEdgeId: null,
      pan: { x: 0, y: 0 },
      zoom: 1
  });

  const handleCreateNode = (newNodeData: Partial<EditorNode>) => {
      const newNode: EditorNode = {
          id: `node-${Date.now()}`,
          x: 250, // Center-ish
          y: 200,
          data: {},
          type: 'TECHNICAL',
          subType: 'TABLE',
          label: 'New Node',
          ...newNodeData,
      } as EditorNode;

      setState(prev => ({ ...prev, nodes: [...prev.nodes, newNode] }));
  };

  const handleImportNode = (nodeResult: SearchNodeResult) => {
      const id = String(nodeResult.id);
      
      // Check if node already exists
      if (state.nodes.some(n => n.id === id)) {
          // Select it and center view (simplified here, just selecting)
          setState(prev => ({ ...prev, selectedNodeId: id }));
          return;
      }

      // Determine Type and SubType from labels
      let type: EditorNodeType = 'TECHNICAL';
      let subType: any = 'TABLE';

      const labels = nodeResult.labels || [];
      
      if (labels.some(l => ['Table', 'Column'].includes(l))) {
          type = 'TECHNICAL';
          if (labels.includes('Table')) subType = 'TABLE';
          else if (labels.includes('Column')) subType = 'COLUMN';
      } else {
          // Default others to Business Entity for now
          type = 'BUSINESS';
          subType = 'ENTITY';
      }

      // Prepare Properties
      const { name, description, datatype, ...otherProps } = nodeResult.properties;

      const newNode: EditorNode = {
          id: id,
          type: type,
          subType: subType,
          label: name,
          x: 300 + Math.random() * 50, // Random offset to avoid exact stacking
          y: 200 + Math.random() * 50,
          data: {
              description: description,
              dataType: datatype,
              properties: {
                  ...otherProps
              }
          }
      };

      setState(prev => ({
          ...prev,
          nodes: [...prev.nodes, newNode],
          selectedNodeId: newNode.id
      }));
  };

  const handleUpdateNode = (id: string, data: Partial<EditorNode>) => {
      setState(prev => ({
          ...prev,
          nodes: prev.nodes.map(n => n.id === id ? { ...n, ...data } : n)
      }));
  };

  const handleDeleteNode = (id: string) => {
      setState(prev => ({
          ...prev,
          nodes: prev.nodes.filter(n => n.id !== id),
          edges: prev.edges.filter(e => e.source !== id && e.target !== id),
          selectedNodeId: null,
          selectedEdgeId: null
      }));
  };

  const handleCreateEdge = (sourceId: string, targetId: string) => {
      // 1. Prevent exact duplicate edges (same source, target, and type is usually enough, but here just source/target pair check for simplicity in demo)
      // Actually, allowing multiple edges is supported by Canvas, so we won't block based on just ID existence unless it's exact duplicate data.
      // But for UX, let's allow creating a new edge always.
      
      const sourceNode = state.nodes.find(n => n.id === sourceId);
      const targetNode = state.nodes.find(n => n.id === targetId);
      
      if (!sourceNode || !targetNode) return;

      // 2. Check Constraints for Default Label
      const constraint = getConstraint(sourceNode, targetNode);
      const defaultLabel = constraint ? constraint.allowed[0] : 'RELATES_TO';

      const newEdge: EditorEdge = {
          id: `edge-${Date.now()}`,
          source: sourceId,
          target: targetId,
          label: defaultLabel
      };
      setState(prev => ({ ...prev, edges: [...prev.edges, newEdge] }));
  };

  const handleUpdateEdge = (id: string, data: Partial<EditorEdge>) => {
      setState(prev => ({
          ...prev,
          edges: prev.edges.map(e => e.id === id ? { ...e, ...data } : e)
      }));
  };

  const handleDeleteEdge = (id: string) => {
      setState(prev => ({
          ...prev,
          edges: prev.edges.filter(e => e.id !== id),
          selectedEdgeId: null
      }));
  };

  // Selection Logic
  const handleNodeSelect = (id: string) => {
      setState(prev => ({ ...prev, selectedNodeId: id || null, selectedEdgeId: null }));
  };

  const handleEdgeSelect = (id: string) => {
      setState(prev => ({ ...prev, selectedEdgeId: id || null, selectedNodeId: null }));
  };

  const selectedNode = state.nodes.find(n => n.id === state.selectedNodeId) || null;
  const selectedEdge = state.edges.find(e => e.id === state.selectedEdgeId) || null;

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] bg-slate-100">
      <TopBar 
         projectName={projectName || ''} 
         onSave={() => alert('Saved Draft!')} 
         onPublish={() => alert('Published!')}
         onImportNode={handleImportNode}
      />
      
      <div className="flex flex-1 overflow-hidden relative">
        <LeftPanel onCreateNode={handleCreateNode} />
        
        <Canvas 
            nodes={state.nodes} 
            edges={state.edges} 
            onNodeSelect={handleNodeSelect}
            selectedNodeId={state.selectedNodeId}
            onEdgeSelect={handleEdgeSelect}
            selectedEdgeId={state.selectedEdgeId}
            onNodesChange={(newNodes) => setState(prev => ({ ...prev, nodes: newNodes }))}
            onEdgeCreate={handleCreateEdge}
        />
        
        <RightPanel 
            nodes={state.nodes}
            selectedNode={selectedNode}
            selectedEdge={selectedEdge}
            onClose={() => setState(prev => ({ ...prev, selectedNodeId: null, selectedEdgeId: null }))}
            onUpdateNode={handleUpdateNode}
            onDeleteNode={handleDeleteNode}
            onUpdateEdge={handleUpdateEdge}
            onDeleteEdge={handleDeleteEdge}
        />
      </div>
    </div>
  );
};
