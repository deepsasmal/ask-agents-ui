

import React, { useEffect, useState } from 'react';
import { TopBar } from './TopBar';
import { LeftPanel } from './LeftPanel';
import { RightPanel } from './RightPanel';
import { Canvas } from './Canvas';
import { EditorState, EditorNode, EditorEdge, EditorNodeType } from '../../types';
import { getConstraint } from './editorConfig';
import { SearchNodeResult, graphApi, authApi } from '../../services/api';
import { toast } from 'react-toastify';
import { GraphSelector } from './GraphSelector';

interface GraphEditorProps {
    projectName?: string;
    initialGraphId?: string;
    initialGraphName?: string;
}

// Initial Mock Data - Empty for production use
const INITIAL_NODES: EditorNode[] = [];

const INITIAL_EDGES: EditorEdge[] = [];

export const GraphEditor: React.FC<GraphEditorProps> = ({ projectName, initialGraphId, initialGraphName }) => {
    const [graphId, setGraphId] = useState(initialGraphId || '');
    const [graphName, setGraphName] = useState(initialGraphName || '');
    const [orgId, setOrgId] = useState('');
    const [isGraphSelectorOpen, setIsGraphSelectorOpen] = useState(false);
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [localProjectName, setLocalProjectName] = useState(projectName || 'Untitled Graph');

    const [isDesktop, setIsDesktop] = useState<boolean>(() => {
        if (typeof window === 'undefined') return true;
        return window.matchMedia('(min-width: 1024px)').matches;
    });
    const [isLeftPanelOpen, setIsLeftPanelOpen] = useState<boolean>(() => {
        if (typeof window === 'undefined') return true;
        return window.matchMedia('(min-width: 1024px)').matches;
    });
    const [isRightPanelOpen, setIsRightPanelOpen] = useState<boolean>(() => {
        if (typeof window === 'undefined') return true;
        return window.matchMedia('(min-width: 1024px)').matches;
    });

    const [state, setState] = useState<EditorState>({
        nodes: INITIAL_NODES,
        edges: INITIAL_EDGES,
        selectedNodeId: null,
        selectedEdgeId: null,
        pan: { x: 0, y: 0 },
        zoom: 1
    });

    useEffect(() => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

        const mq = window.matchMedia('(min-width: 1024px)');

        const handle = (e?: MediaQueryListEvent) => {
            // Some browsers call the listener with no args (older APIs), so fall back to mq.matches
            const matches = typeof e?.matches === 'boolean' ? e.matches : mq.matches;
            setIsDesktop(matches);
        };

        handle();

        // Support both modern and legacy MediaQueryList APIs
        if (typeof mq.addEventListener === 'function') {
            mq.addEventListener('change', handle);
            return () => mq.removeEventListener('change', handle);
        }

        // eslint-disable-next-line deprecation/deprecation
        mq.addListener(handle);
        // eslint-disable-next-line deprecation/deprecation
        return () => mq.removeListener(handle);
    }, []);

    useEffect(() => {
        // On desktop, panels are always visible (classic three-column editor).
        if (isDesktop) {
            setIsLeftPanelOpen(true);
            setIsRightPanelOpen(true);
        }
    }, [isDesktop]);

    useEffect(() => {
        // Fetch graph details if we have an ID but no name
        const fetchMetadata = async () => {
            if (graphId && !graphName) {
                try {
                    const email = authApi.getUserEmail();
                    if (!email) return;
                    const response = await graphApi.fetchGraphsByEmail(email);
                    const currentGraph = response.records?.find((g: any) => g.id === graphId);
                    if (currentGraph) {
                        setGraphName(currentGraph.schema_name);
                        setOrgId(currentGraph.org_id);
                    }
                } catch (error) {
                    console.error("Failed to fetch graph metadata", error);
                }
            }
        };
        fetchMetadata();
    }, [graphId]);

    useEffect(() => {
        // On smaller screens, open the properties panel automatically when something is selected.
        if (!isDesktop && (state.selectedNodeId || state.selectedEdgeId)) {
            setIsRightPanelOpen(true);
        }
    }, [isDesktop, state.selectedNodeId, state.selectedEdgeId]);

    const toggleLeftPanel = () => {
        setIsLeftPanelOpen(prev => {
            const next = !prev;
            if (!isDesktop && next) setIsRightPanelOpen(false);
            return next;
        });
    };

    const toggleRightPanel = () => {
        setIsRightPanelOpen(prev => {
            const next = !prev;
            if (!isDesktop && next) setIsLeftPanelOpen(false);
            return next;
        });
    };

    const handleSelectGraph = (id: string, name: string, oid: string) => {
        setGraphId(id);
        setGraphName(name);
        setOrgId(oid);
        setIsGraphSelectorOpen(false);

        // Reset canvas state when switching graphs
        setState({
            nodes: INITIAL_NODES,
            edges: INITIAL_EDGES,
            selectedNodeId: null,
            selectedEdgeId: null,
            pan: { x: 0, y: 0 },
            zoom: 1
        });
        setHasUnsavedChanges(false);

        // If the user clears the graph id (switch graph), open the selector so they aren't "stuck".
        if (!id) setIsGraphSelectorOpen(true);
    };

    const getViewportAnchor = () => {
        // Place new nodes within the current visible area, regardless of pan/zoom.
        // Screen = world * zoom + pan  =>  world = (screen - pan) / zoom
        // Use a safe top-left-ish anchor to guarantee visibility without needing viewport size.
        const zoom = state.zoom || 1;
        return {
            x: (-state.pan.x) / zoom + 80,
            y: (-state.pan.y) / zoom + 80
        };
    };

    const handleCreateNode = (newNodeData: Partial<EditorNode>) => {
        const anchor = getViewportAnchor();
        const newNode: EditorNode = {
            id: `node-${Date.now()}`,
            x: anchor.x,
            y: anchor.y,
            data: {},
            type: 'TECHNICAL',
            subType: 'TABLE',
            label: 'New Node',
            ...newNodeData,
        } as EditorNode;

        setState(prev => ({ ...prev, nodes: [...prev.nodes, newNode], selectedNodeId: newNode.id, selectedEdgeId: null }));
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
        const anchor = getViewportAnchor();

        const newNode: EditorNode = {
            id: id,
            type: type,
            subType: subType,
            label: name,
            x: anchor.x + Math.random() * 30, // small jitter to avoid exact stacking
            y: anchor.y + Math.random() * 30,
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

    const handleProjectNameChange = (newName: string) => {
        setLocalProjectName(newName);
        setHasUnsavedChanges(true);
    };

    const selectedNode = state.nodes.find(n => n.id === state.selectedNodeId) || null;
    const selectedEdge = state.edges.find(e => e.id === state.selectedEdgeId) || null;

    return (
        <div className="flex flex-col h-full min-h-0 bg-slate-100">
            <TopBar
                projectName={localProjectName}
                graphId={graphId}
                graphName={graphName}
                orgId={orgId}
                setGraphId={(id) => handleSelectGraph(id, '', '')}
                onSaveDraft={handleSaveDraft}
                onPublish={handlePublish}
                isSavingDraft={isSavingDraft}
                isPublishing={isPublishing}
                hasUnsavedChanges={hasUnsavedChanges}
                onImportNode={handleImportNode}
                isLeftPanelOpen={isLeftPanelOpen}
                isRightPanelOpen={isRightPanelOpen}
                onToggleLeftPanel={toggleLeftPanel}
                onToggleRightPanel={toggleRightPanel}
                onProjectNameChange={handleProjectNameChange}
                hasNodes={state.nodes.length > 0}
                onOpenSelector={() => setIsGraphSelectorOpen(true)}
            />

            <div className="relative flex flex-1 min-h-0 min-w-0 overflow-hidden">
                {/* Non-blocking Graph ID callout */}
                {!graphId && (
                    <div className="absolute top-3 left-3 right-3 z-20 pointer-events-none">
                        <div className="max-w-3xl mx-auto bg-amber-50 border border-amber-200 text-amber-900 rounded-xl px-4 py-3 shadow-sm flex items-center justify-between gap-3 pointer-events-auto">
                            <div className="text-xs sm:text-sm">
                                <span className="font-bold">No Graph selected.</span>{' '}
                                You can still add nodes and relationships. Set a Graph ID (Top bar) to enable search/save/publish.
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsGraphSelectorOpen(true)}
                                className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg bg-white border border-amber-200 hover:bg-amber-100 transition-colors"
                            >
                                Pick Graph
                            </button>
                        </div>
                    </div>
                )}

                {/* Desktop layout: fixed side panels + canvas */}
                {isDesktop && (
                    <div className="w-72 shrink-0 h-full">
                        <LeftPanel onCreateNode={handleCreateNode} />
                    </div>
                )}

                {/* Center: Canvas must have an explicit height via a flex container (otherwise it can collapse to 0) */}
                <div className="flex-1 min-w-0 min-h-0 flex">
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
                        onEdgeUpdate={handleUpdateEdge}
                        onEdgeCreate={handleCreateEdge}
                        pan={state.pan}
                        zoom={state.zoom}
                        onPanZoomChange={({ pan, zoom }) => {
                            setState(prev => ({ ...prev, pan, zoom }));
                        }}
                    />
                </div>

                {isDesktop && (
                    <div className="w-72 shrink-0 h-full">
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
                )}

                {/* Mobile/Tablet layout: side panels become drawers */}
                {!isDesktop && isLeftPanelOpen && (
                    <div className="absolute inset-0 z-40">
                        <div
                            className="absolute inset-0 bg-slate-900/20 backdrop-blur-[1px]"
                            onClick={() => setIsLeftPanelOpen(false)}
                        />
                        <div className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] shadow-2xl">
                            <LeftPanel onCreateNode={handleCreateNode} />
                        </div>
                    </div>
                )}

                {!isDesktop && isRightPanelOpen && (
                    <div className="absolute inset-0 z-40">
                        <div
                            className="absolute inset-0 bg-slate-900/20 backdrop-blur-[1px]"
                            onClick={() => setIsRightPanelOpen(false)}
                        />
                        <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] shadow-2xl">
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
                )}

                {/* Graph selector overlay (optional, does not block the editor permanently) */}
                {isGraphSelectorOpen && (
                    <div className="absolute inset-0 z-50">
                        <div
                            className="absolute inset-0 bg-slate-900/30 backdrop-blur-[1px]"
                            onClick={() => setIsGraphSelectorOpen(false)}
                        />
                        <div className="absolute inset-0">
                            <GraphSelector
                                onSelect={handleSelectGraph}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
