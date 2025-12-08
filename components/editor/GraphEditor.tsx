

import React, { useState } from 'react';
import { TopBar } from './TopBar';
import { LeftPanel } from './LeftPanel';
import { RightPanel } from './RightPanel';
import { Canvas } from './Canvas';
import { EditorState, EditorNode, EditorEdge, EditorNodeType } from '../../types';
import { getConstraint } from './editorConfig';
import { SearchNodeResult, graphApi } from '../../services/api';
import { toast } from 'react-toastify';

interface GraphEditorProps {
  projectName?: string;
  initialGraphId?: string;
}

// Initial Mock Data - Empty for production use
const INITIAL_NODES: EditorNode[] = [];

const INITIAL_EDGES: EditorEdge[] = [];

export const GraphEditor: React.FC<GraphEditorProps> = ({ projectName, initialGraphId }) => {
  const [graphId, setGraphId] = useState(initialGraphId || '');
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
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
      setHasUnsavedChanges(true);
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
      setHasUnsavedChanges(true);
  };

  const handleUpdateNode = (id: string, data: Partial<EditorNode>) => {
      setState(prev => ({
          ...prev,
          nodes: prev.nodes.map(n => n.id === id ? { ...n, ...data } : n)
      }));
      setHasUnsavedChanges(true);
  };

  const handleDeleteNode = (id: string) => {
      setState(prev => ({
          ...prev,
          nodes: prev.nodes.filter(n => n.id !== id),
          edges: prev.edges.filter(e => e.source !== id && e.target !== id),
          selectedNodeId: null,
          selectedEdgeId: null
      }));
      setHasUnsavedChanges(true);
  };

  const handleCreateEdge = (sourceId: string, targetId: string) => {
      const sourceNode = state.nodes.find(n => n.id === sourceId);
      const targetNode = state.nodes.find(n => n.id === targetId);
      
      if (!sourceNode || !targetNode) return;

      // Check Constraints for Default Label
      const constraint = getConstraint(sourceNode, targetNode);
      const defaultLabel = constraint ? constraint.allowed[0] : 'RELATES_TO';

      const newEdge: EditorEdge = {
          id: `edge-${Date.now()}`,
          source: sourceId,
          target: targetId,
          label: defaultLabel
      };
      setState(prev => ({ ...prev, edges: [...prev.edges, newEdge] }));
      setHasUnsavedChanges(true);
  };

  const handleUpdateEdge = (id: string, data: Partial<EditorEdge>) => {
      setState(prev => ({
          ...prev,
          edges: prev.edges.map(e => e.id === id ? { ...e, ...data } : e)
      }));
      setHasUnsavedChanges(true);
  };

  const handleDeleteEdge = (id: string) => {
      setState(prev => ({
          ...prev,
          edges: prev.edges.filter(e => e.id !== id),
          selectedEdgeId: null
      }));
      setHasUnsavedChanges(true);
  };

  // Selection Logic
  const handleNodeSelect = (id: string) => {
      setState(prev => ({ ...prev, selectedNodeId: id || null, selectedEdgeId: null }));
  };

  const handleEdgeSelect = (id: string) => {
      setState(prev => ({ ...prev, selectedEdgeId: id || null, selectedNodeId: null }));
  };

  // Helper to identify temp IDs
  const isTempId = (id: string) => {
      if (id.startsWith('node-')) return true;
      if (isNaN(Number(id))) return true; 
      return false; 
  };

  // Payload Generation Helper
  const generatePayload = () => {
    const payloadNodes = state.nodes.map(node => {
        let labels: string[] = [];
        if (node.type === 'TECHNICAL') {
             labels = [node.subType.charAt(0) + node.subType.slice(1).toLowerCase()];
        } else {
             const sub = node.subType.charAt(0) + node.subType.slice(1).toLowerCase();
             labels = [`Business${sub}`];
        }

        const properties = {
            name: node.label,
            description: node.data.description || '',
            ...(node.data.dataType ? { datatype: node.data.dataType } : {}),
            ...(node.data.properties || {})
        };

        if (isTempId(node.id)) {
            return {
                temp_id: node.id,
                labels,
                properties
            };
        } else {
            return {
                id: Number(node.id),
                labels,
                properties
            };
        }
    });

    const payloadRelationships = state.edges.map(edge => {
        const rel: any = { type: edge.label };
        
        // Handle Source
        if (isTempId(edge.source)) {
            rel.from_temp_id = edge.source;
        } else {
            rel.from_id = Number(edge.source);
        }

        // Handle Target
        if (isTempId(edge.target)) {
            rel.to_temp_id = edge.target;
        } else {
            rel.to_id = Number(edge.target);
        }

        return rel;
    });

    return {
        nodes: payloadNodes,
        relationships: payloadRelationships
    };
  };

  // Save Draft Action
  const handleSaveDraft = async () => {
    if (!graphId) return;
    setIsSavingDraft(true);

    try {
        const graphData = generatePayload();
        await graphApi.saveGraphDraft({
            graph_id: graphId,
            graph_data: graphData
        });
        
        // On success, mark as saved
        setHasUnsavedChanges(false);
        toast.success("Draft saved successfully!");
    } catch (error) {
        console.error("Failed to save draft", error);
        toast.error("Failed to save draft.");
    } finally {
        setIsSavingDraft(false);
    }
  };

  // Publish Action
  const handlePublish = async () => {
    if (!graphId) return;
    setIsPublishing(true);

    try {
        const graphData = generatePayload();
        await graphApi.publishEditedGraph({
            graph_id: graphId,
            graph_data: graphData
        });
        
        toast.success("Graph published successfully!");
        setHasUnsavedChanges(false);
    } catch (error) {
        console.error("Failed to publish graph", error);
        toast.error("Failed to publish graph.");
    } finally {
        setIsPublishing(false);
    }
  };

  const selectedNode = state.nodes.find(n => n.id === state.selectedNodeId) || null;
  const selectedEdge = state.edges.find(e => e.id === state.selectedEdgeId) || null;

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] bg-slate-100">
      <TopBar 
         projectName={projectName || ''} 
         graphId={graphId}
         setGraphId={setGraphId}
         onSaveDraft={handleSaveDraft}
         onPublish={handlePublish}
         isSavingDraft={isSavingDraft}
         isPublishing={isPublishing}
         hasUnsavedChanges={hasUnsavedChanges}
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
            onNodesChange={(newNodes) => {
                setState(prev => ({ ...prev, nodes: newNodes }));
                setHasUnsavedChanges(true); // Dragging changes position, consider unsaved
            }}
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
