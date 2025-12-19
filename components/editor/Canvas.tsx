
import React, { useRef, useState, useMemo } from 'react';
import { EditorNode, EditorEdge } from '../../types';
import { Move, Minus, Plus, Maximize, Focus } from 'lucide-react';

interface CanvasProps {
  nodes: EditorNode[];
  edges: EditorEdge[];
  onNodeSelect: (id: string) => void;
  selectedNodeId: string | null;
  onEdgeSelect: (id: string) => void;
  selectedEdgeId: string | null;
  onNodesChange: (nodes: EditorNode[]) => void;
  onEdgeUpdate: (id: string, data: Partial<EditorEdge>) => void;
  onEdgeCreate: (source: string, target: string) => void;
  pan: { x: number; y: number };
  zoom: number;
  onPanZoomChange: (next: { pan: { x: number; y: number }; zoom: number }) => void;
}

export const Canvas: React.FC<CanvasProps> = ({ 
  nodes, 
  edges, 
  onNodeSelect, 
  selectedNodeId, 
  onEdgeSelect,
  selectedEdgeId,
  onNodesChange, 
  onEdgeUpdate,
  onEdgeCreate,
  pan,
  zoom,
  onPanZoomChange
}) => {
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Node Dragging State
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);

  // Edge control dragging state (relationship arrow bending)
  const [draggingEdgeId, setDraggingEdgeId] = useState<string | null>(null);
  const edgeDragOffsetRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

  // Connection State
  const [connectingNodeId, setConnectingNodeId] = useState<string | null>(null);
  const [connectingHandle, setConnectingHandle] = useState<'left' | 'right' | null>(null);
  const [tempEdgeEnd, setTempEdgeEnd] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLDivElement>(null);

  const cancelInteraction = () => {
    setIsDraggingCanvas(false);
    setDraggingNodeId(null);
    setDraggingEdgeId(null);
    setConnectingNodeId(null);
    setConnectingHandle(null);
  };

  const getNodeIdAtPoint = (clientX: number, clientY: number): string | null => {
    if (typeof document === 'undefined') return null;
    const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
    if (!el) return null;
    const nodeEl = el.closest?.('[data-node-id]') as HTMLElement | null;
    const id = nodeEl?.dataset?.nodeId;
    return id ? String(id) : null;
  };

  const fitToContent = () => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || nodes.length === 0) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const n of nodes) {
      // Node size is fixed at 200x~80 in our UI.
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + 200);
      maxY = Math.max(maxY, n.y + 80);
    }

    const padding = 80;
    const width = Math.max(1, (maxX - minX) + padding * 2);
    const height = Math.max(1, (maxY - minY) + padding * 2);

    const nextZoom = Math.min(2, Math.max(0.5, Math.min(rect.width / width, rect.height / height)));
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    const nextPan = {
      x: rect.width / 2 - cx * nextZoom,
      y: rect.height / 2 - cy * nextZoom
    };

    onPanZoomChange({ pan: nextPan, zoom: nextZoom });
  };

  // Pre-process edges to group parallel connections
  const edgeGroups = useMemo(() => {
    const groups: Record<string, number> = {};
    edges.forEach(edge => {
      const key = `${edge.source}-${edge.target}`;
      groups[key] = (groups[key] || 0) + 1;
    });
    return groups;
  }, [edges]);

  const getEdgeIndex = (edge: EditorEdge, allEdges: EditorEdge[]) => {
    // Find all edges with same source/target
    const sameEdges = allEdges.filter(e => e.source === edge.source && e.target === edge.target);
    return {
      index: sameEdges.findIndex(e => e.id === edge.id),
      total: sameEdges.length
    };
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      const newZoom = Math.min(Math.max(zoom - e.deltaY * 0.001, 0.5), 2);
      onPanZoomChange({ pan, zoom: newZoom });
    } else {
        onPanZoomChange({ pan: { x: pan.x - e.deltaX, y: pan.y - e.deltaY }, zoom });
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
     // If clicked on a node or control, ignore
     if ((e.target as HTMLElement).closest('.node-interactive')) return;
     if ((e.target as HTMLElement).closest('.edge-interactive')) return;

     // Keep receiving move/up even if pointer leaves the canvas (touch/pen/mouse).
     (e.currentTarget as HTMLDivElement).setPointerCapture?.(e.pointerId);

     setIsDraggingCanvas(true);
     setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
     
     // Deselect everything if clicking on empty canvas
     onNodeSelect(''); 
     onEdgeSelect('');
  };

  const handlePointerMove = (e: React.PointerEvent) => {
     const rect = canvasRef.current?.getBoundingClientRect();
     if (!rect) return;

     const mouseX = (e.clientX - rect.left - pan.x) / zoom;
     const mouseY = (e.clientY - rect.top - pan.y) / zoom;

     if (isDraggingCanvas) {
         onPanZoomChange({ pan: { x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }, zoom });
     } else if (draggingNodeId) {
         const newNodes = nodes.map(n => {
             if (n.id === draggingNodeId) {
                 return {
                     ...n,
                     x: mouseX - 100, // Center on mouse (node width 200 / 2)
                     y: mouseY - 20 // Center vertically approx
                 };
             }
             return n;
         });
         onNodesChange(newNodes);
     } else if (draggingEdgeId) {
         // Update the edge control point in world coordinates.
         onEdgeUpdate(draggingEdgeId, { control: { x: mouseX + edgeDragOffsetRef.current.dx, y: mouseY + edgeDragOffsetRef.current.dy } });
     } else if (connectingNodeId) {
         setTempEdgeEnd({ x: mouseX, y: mouseY });
     }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    // If we are currently connecting, resolve the drop target via hit-testing.
    if (connectingNodeId) {
      const targetId = getNodeIdAtPoint(e.clientX, e.clientY);
      if (targetId) {
        onEdgeCreate(connectingNodeId, targetId);
      }
    }
    cancelInteraction();
  };

  const handlePointerCancelOrLeave = () => {
    // Don't create edges on cancel/leave.
    cancelInteraction();
  };

  // Connection Start
  const handleConnectStart = (e: React.PointerEvent, nodeId: string, handle: 'left' | 'right') => {
      e.stopPropagation();
      e.preventDefault();

      // Ensure we keep receiving pointer move/up events while connecting.
      // Capture on the canvas so pointerup can be handled even when released over another node.
      canvasRef.current?.setPointerCapture?.(e.pointerId);

      setConnectingNodeId(nodeId);
      setConnectingHandle(handle);
      
      const rect = canvasRef.current?.getBoundingClientRect();
      if(rect) {
          const mouseX = (e.clientX - rect.left - pan.x) / zoom;
          const mouseY = (e.clientY - rect.top - pan.y) / zoom;
          setTempEdgeEnd({ x: mouseX, y: mouseY });
      }
  };

  // Connection End (Drop on Node)
  const handleNodePointerUp = (e: React.PointerEvent, targetId: string) => {
      if (connectingNodeId) {
          e.stopPropagation();
          onEdgeCreate(connectingNodeId, targetId);
          setConnectingNodeId(null);
          setConnectingHandle(null);
      }
  };

  const bezierPoint = (
    t: number,
    p0: { x: number; y: number },
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    p3: { x: number; y: number }
  ) => {
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;
    const uuu = uu * u;
    const ttt = tt * t;
    return {
      x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
      y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y
    };
  };

  // Build svg path for edge + expose curve points for label positioning.
  const getCurve = (
    sourceX: number,
    sourceY: number,
    targetX: number,
    targetY: number,
    index: number,
    total: number,
    control?: { x: number; y: number }
  ): {
    d: string;
    start: { x: number; y: number };
    end: { x: number; y: number };
    cp1: { x: number; y: number };
    cp2: { x: number; y: number };
    isSelfLoop: boolean;
  } => {
      const sourceCenter = { x: sourceX + 200, y: sourceY + 40 }; // Exit right
      const targetCenter = { x: targetX, y: targetY + 40 }; // Enter left
      
      // Calculate offset for parallel edges
      // Spread them out vertically at the control points
      const gap = 30;
      const offset = (index - (total - 1) / 2) * gap;

      // Self Loop Logic
      if (sourceX === targetX && sourceY === targetY) {
           const loopHeight = 80 + (index * 25);
           // Loop path: Start Right -> Arc Up -> Arc Left -> End Left
           const start = { x: sourceCenter.x, y: sourceCenter.y };
           const cp1 = { x: sourceCenter.x + 50, y: sourceCenter.y };
           const cp2 = { x: sourceCenter.x + 50, y: sourceCenter.y - loopHeight };
           const end = { x: sourceCenter.x - 100, y: sourceCenter.y - loopHeight };
           // Note: self-loop uses a shorthand 'S' in the original; for label we still return a reasonable cubic segment.
           const d = `M ${sourceCenter.x} ${sourceCenter.y} 
                   C ${sourceCenter.x + 50} ${sourceCenter.y}, ${sourceCenter.x + 50} ${sourceCenter.y - loopHeight}, ${sourceCenter.x - 100} ${sourceCenter.y - loopHeight}
                   S ${targetCenter.x - 50} ${targetCenter.y}, ${targetCenter.x} ${targetCenter.y}`;
           return { d, start, cp1, cp2, end, isSelfLoop: true };
      }

      // If a user control point exists, bend the curve toward it (2D).
      if (control) {
        const pull = 0.7;
        const cp1 = {
          x: sourceCenter.x + (control.x - sourceCenter.x) * pull,
          y: sourceCenter.y + (control.y - sourceCenter.y) * pull
        };
        const cp2 = {
          x: targetCenter.x + (control.x - targetCenter.x) * pull,
          y: targetCenter.y + (control.y - targetCenter.y) * pull
        };
        const d = `M ${sourceCenter.x} ${sourceCenter.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${targetCenter.x} ${targetCenter.y}`;
        return { d, start: sourceCenter, end: targetCenter, cp1, cp2, isSelfLoop: false };
      }

      // Dynamic curve based on position
      const dx = targetCenter.x - sourceCenter.x;
      const controlDist = Math.max(Math.abs(dx) * 0.5, 80);

      // Apply offset to Control Points Y coordinate to separate parallel lines
      const cp1 = { x: sourceCenter.x + controlDist, y: sourceCenter.y + offset };
      const cp2 = { x: targetCenter.x - controlDist, y: targetCenter.y + offset };

      const d = `M ${sourceCenter.x} ${sourceCenter.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${targetCenter.x} ${targetCenter.y}`;
      return { d, start: sourceCenter, end: targetCenter, cp1, cp2, isSelfLoop: false };
  };

  return (
    <div 
      ref={canvasRef}
      // Use explicit sizing so the canvas doesn't collapse when wrapped by non-flex containers.
      className="w-full h-full bg-slate-50 overflow-hidden relative cursor-grab active:cursor-grabbing select-none touch-none"
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancelOrLeave}
      onPointerLeave={handlePointerCancelOrLeave}
    >
      {/* Empty state: makes the canvas obvious even before any nodes exist */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none">
          <div className="max-w-md text-center px-6 py-5 rounded-2xl bg-white/80 backdrop-blur border border-slate-200 shadow-sm">
            <div className="text-sm font-bold text-slate-800">Canvas</div>
            <div className="mt-1 text-xs text-slate-500">
              Create a node from the left panel, then drag a node handle onto another node to create a relationship.
            </div>
          </div>
        </div>
      )}

      {/* Background Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
            backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
            backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`
        }}
      />

      {/* Controls (production-ish): zoom %, fit, reset */}
      <div className="absolute bottom-5 left-5 z-10 node-interactive">
        <div className="bg-white/90 backdrop-blur rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="flex items-center gap-1 p-1">
            <button
              type="button"
              onClick={() => onPanZoomChange({ pan, zoom: Math.min(zoom + 0.1, 2) })}
              className="p-2 rounded-lg hover:bg-slate-50 text-slate-600"
              title="Zoom in"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onPanZoomChange({ pan, zoom: Math.max(zoom - 0.1, 0.5) })}
              className="p-2 rounded-lg hover:bg-slate-50 text-slate-600"
              title="Zoom out"
            >
              <Minus className="w-4 h-4" />
            </button>
            <div className="px-2 text-[11px] font-bold text-slate-600 tabular-nums select-none min-w-[56px] text-center">
              {Math.round(zoom * 100)}%
            </div>
            <div className="w-px h-7 bg-slate-200" />
            <button
              type="button"
              onClick={fitToContent}
              className="p-2 rounded-lg hover:bg-slate-50 text-slate-600"
              title="Fit to content"
              disabled={nodes.length === 0}
            >
              <Focus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onPanZoomChange({ pan: { x: 0, y: 0 }, zoom: 1 })}
              className="p-2 rounded-lg hover:bg-slate-50 text-slate-600"
              title="Reset view"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content Container with Transform */}
      <div 
        style={{ 
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            width: '100%',
            height: '100%'
        }}
      >
         {/* Edges Layer */}
         <svg className="absolute top-0 left-0 overflow-visible w-full h-full" style={{ width: '10000px', height: '10000px' }}>
            <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                </marker>
                <marker id="arrowhead-selected" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" />
                </marker>
                 <marker id="arrowhead-active" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" />
                </marker>
            </defs>
            {edges.map(edge => {
                const source = nodes.find(n => n.id === edge.source);
                const target = nodes.find(n => n.id === edge.target);
                if (!source || !target) return null;
                
                const isSelected = edge.id === selectedEdgeId;
                const { index, total } = getEdgeIndex(edge, edges);
                const curve = getCurve(source.x, source.y, target.x, target.y, index, total, edge.control);
                
                // Default control/drag anchor (what user drags). If no user control yet, start at curve midpoint.
                const mid = bezierPoint(0.5, curve.start, curve.cp1, curve.cp2, curve.end);
                const handleX = edge.control?.x ?? mid.x;
                const handleY = edge.control?.y ?? mid.y;

                // Label should stay "on the arrow": use the curve midpoint, not the control point.
                const labelX = mid.x;
                const labelY = mid.y;

                return (
                    <g
                      key={edge.id}
                      className={`edge-interactive group ${draggingEdgeId === edge.id ? 'cursor-grabbing' : 'cursor-pointer'}`}
                      onClick={(e) => { e.stopPropagation(); onEdgeSelect(edge.id); }}
                      onPointerDown={(e) => {
                        // Click + drag the arrow itself to reposition after connection.
                        // Only for non-self-loop edges.
                        if (curve.isSelfLoop) return;
                        e.stopPropagation();
                        e.preventDefault();

                        const rect = canvasRef.current?.getBoundingClientRect();
                        if (!rect) return;

                        // Select edge on grab
                        onEdgeSelect(edge.id);

                        // Capture pointer so dragging continues smoothly
                        canvasRef.current?.setPointerCapture?.(e.pointerId);

                        // Compute world coords and store offset so the handle doesn't "jump" to cursor
                        const mx = (e.clientX - rect.left - pan.x) / zoom;
                        const my = (e.clientY - rect.top - pan.y) / zoom;
                        edgeDragOffsetRef.current = { dx: handleX - mx, dy: handleY - my };

                        // Ensure we have a control point persisted as soon as the user starts dragging
                        onEdgeUpdate(edge.id, { control: { x: handleX, y: handleY } });
                        setDraggingEdgeId(edge.id);
                      }}
                    >
                        {/* Invisible thicker path for easier clicking */}
                        <path 
                            d={curve.d} 
                            stroke="transparent" 
                            strokeWidth="20" 
                            fill="none" 
                        />
                        {/* Visible Path */}
                        <path 
                            d={curve.d} 
                            stroke={isSelected ? "#6366f1" : "#cbd5e1"} 
                            strokeWidth={isSelected ? "3" : "2"}
                            fill="none" 
                            markerEnd={isSelected ? "url(#arrowhead-selected)" : "url(#arrowhead)"}
                            className="transition-colors duration-200"
                        />
                        {/* Drag handle (selected relationship only). Lets users bend the arrow path. */}
                        {isSelected && !curve.isSelfLoop && (
                          <>
                            <circle
                              cx={handleX}
                              cy={handleY}
                              r={10}
                              fill="transparent"
                              className="cursor-move"
                              onPointerDown={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                canvasRef.current?.setPointerCapture?.(e.pointerId);
                                // offset relative to where the user grabbed (so no jump)
                                const rect = canvasRef.current?.getBoundingClientRect();
                                if (rect) {
                                  const mx = (e.clientX - rect.left - pan.x) / zoom;
                                  const my = (e.clientY - rect.top - pan.y) / zoom;
                                  edgeDragOffsetRef.current = { dx: handleX - mx, dy: handleY - my };
                                }
                                setDraggingEdgeId(edge.id);
                              }}
                            />
                            <circle
                              cx={handleX}
                              cy={handleY}
                              r={4}
                              fill="#ffffff"
                              stroke="#6366f1"
                              strokeWidth={2}
                              className="pointer-events-none"
                            />
                          </>
                        )}
                        {/* Label */}
                        {edge.label && (
                            <foreignObject
                              x={labelX - 50}
                              y={labelY - 12}
                              width="100"
                              height="24"
                              className="pointer-events-auto"
                              onPointerDown={(e) => {
                                // Ensure dragging the label always drags the relationship too.
                                if (curve.isSelfLoop) return;
                                e.stopPropagation();
                                e.preventDefault();

                                const rect = canvasRef.current?.getBoundingClientRect();
                                if (!rect) return;
                                onEdgeSelect(edge.id);
                                canvasRef.current?.setPointerCapture?.(e.pointerId);

                                const mx = (e.clientX - rect.left - pan.x) / zoom;
                                const my = (e.clientY - rect.top - pan.y) / zoom;
                                edgeDragOffsetRef.current = { dx: handleX - mx, dy: handleY - my };

                                onEdgeUpdate(edge.id, { control: { x: handleX, y: handleY } });
                                setDraggingEdgeId(edge.id);
                              }}
                            >
                                <div className={`flex justify-center transition-all ${isSelected ? 'scale-110' : ''}`}>
                                    <div className={`text-[10px] px-2 py-0.5 rounded border font-mono truncate shadow-sm transition-colors
                                        ${isSelected 
                                            ? 'bg-brand-50 border-brand-200 text-brand-700 font-bold' 
                                            : 'bg-white border-slate-200 text-slate-500 group-hover:border-brand-200 group-hover:text-brand-600'
                                        }`}
                                    >
                                        {edge.label}
                                    </div>
                                </div>
                            </foreignObject>
                        )}
                    </g>
                );
            })}
            
            {/* Temp Connection Line */}
            {connectingNodeId && (
                (() => {
                    const sourceNode = nodes.find(n => n.id === connectingNodeId);
                    if (!sourceNode) return null;

                    const startX = connectingHandle === 'left' ? sourceNode.x : sourceNode.x + 200;
                    const startY = sourceNode.y + 40;
                    const cp1X = connectingHandle === 'left' ? startX - 50 : startX + 50;

                    return (
                        <path 
                            d={`M ${startX} ${startY} C ${cp1X} ${startY}, ${tempEdgeEnd.x - 50} ${tempEdgeEnd.y}, ${tempEdgeEnd.x} ${tempEdgeEnd.y}`}
                            stroke="#6366f1" 
                            strokeWidth="2" 
                            fill="none" 
                            strokeDasharray="5,5"
                            markerEnd="url(#arrowhead-active)"
                        />
                    );
                })()
            )}
         </svg>

         {/* Nodes Layer */}
         {nodes.map(node => (
             <div
                key={node.id}
                data-node-id={node.id}
                className={`node-interactive absolute group w-[200px] bg-white rounded-xl shadow-sm border-2 transition-shadow hover:shadow-lg cursor-grab active:cursor-grabbing
                    ${selectedNodeId === node.id ? 'ring-4 ring-brand-500/20 shadow-xl' : ''}
                    ${node.type === 'TECHNICAL' ? 'border-blue-100' : 'border-purple-100'}
                `}
                style={{ 
                    left: node.x, 
                    top: node.y 
                }}
                onPointerDown={(e) => {
                    e.stopPropagation();
                    (e.currentTarget as HTMLDivElement).setPointerCapture?.(e.pointerId);
                    setDraggingNodeId(node.id);
                    onNodeSelect(node.id);
                }}
                onPointerUp={(e) => handleNodePointerUp(e, node.id)}
             >
                <div className={`h-2 rounded-t-[10px] ${node.type === 'TECHNICAL' ? 'bg-blue-500' : 'bg-purple-500'}`} />
                <div className="p-3 select-none pointer-events-none">
                    <div className="flex items-center justify-between mb-1">
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded text-white ${node.type === 'TECHNICAL' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                            {node.subType}
                        </span>
                        <Move className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100" />
                    </div>
                    <p className="font-bold text-slate-800 truncate" title={node.label}>{node.label}</p>
                    <p className="text-xs text-slate-500 truncate mt-1">{node.data.description || 'No description'}</p>
                </div>
                
                {/* Input Handle (Left) */}
                <div 
                    className="absolute top-1/2 -left-3 w-6 h-6 rounded-full flex items-center justify-center cursor-crosshair opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 z-10"
                    onPointerDown={(e) => handleConnectStart(e, node.id, 'left')}
                    title="Drag to Connect"
                >
                    <div className="w-3 h-3 rounded-full bg-slate-400 border-2 border-white shadow-sm hover:bg-brand-500 transition-colors"></div>
                </div>

                {/* Output Handle (Right) */}
                <div 
                    className="absolute top-1/2 -right-3 w-6 h-6 rounded-full flex items-center justify-center cursor-crosshair opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 z-10"
                    onPointerDown={(e) => handleConnectStart(e, node.id, 'right')}
                    title="Drag to Connect"
                >
                    <div className="w-3 h-3 rounded-full bg-slate-400 border-2 border-white shadow-sm hover:bg-brand-500 transition-colors"></div>
                </div>
             </div>
         ))}

      </div>
    </div>
  );
};
