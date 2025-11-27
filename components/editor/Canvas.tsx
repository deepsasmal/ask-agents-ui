
import React, { useRef, useState, useMemo } from 'react';
import { EditorNode, EditorEdge } from '../../types';
import { Move, Minus, Plus, Maximize, ArrowRightFromLine, ArrowLeftToLine } from 'lucide-react';

interface CanvasProps {
  nodes: EditorNode[];
  edges: EditorEdge[];
  onNodeSelect: (id: string) => void;
  selectedNodeId: string | null;
  onEdgeSelect: (id: string) => void;
  selectedEdgeId: string | null;
  onNodesChange: (nodes: EditorNode[]) => void;
  onEdgeCreate: (source: string, target: string) => void;
}

export const Canvas: React.FC<CanvasProps> = ({ 
  nodes, 
  edges, 
  onNodeSelect, 
  selectedNodeId, 
  onEdgeSelect,
  selectedEdgeId,
  onNodesChange, 
  onEdgeCreate 
}) => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Node Dragging State
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);

  // Connection State
  const [connectingNodeId, setConnectingNodeId] = useState<string | null>(null);
  const [connectingHandle, setConnectingHandle] = useState<'left' | 'right' | null>(null);
  const [tempEdgeEnd, setTempEdgeEnd] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLDivElement>(null);

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
      setZoom(newZoom);
    } else {
        setOffset(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
     // If clicked on a node or control, ignore
     if ((e.target as HTMLElement).closest('.node-interactive')) return;
     if ((e.target as HTMLElement).closest('.edge-interactive')) return;

     setIsDraggingCanvas(true);
     setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
     
     // Deselect everything if clicking on empty canvas
     onNodeSelect(''); 
     onEdgeSelect('');
  };

  const handleMouseMove = (e: React.MouseEvent) => {
     const rect = canvasRef.current?.getBoundingClientRect();
     if (!rect) return;

     const mouseX = (e.clientX - rect.left - offset.x) / zoom;
     const mouseY = (e.clientY - rect.top - offset.y) / zoom;

     if (isDraggingCanvas) {
         setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
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
     } else if (connectingNodeId) {
         setTempEdgeEnd({ x: mouseX, y: mouseY });
     }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
      setIsDraggingCanvas(false);
      setDraggingNodeId(null);
      setConnectingNodeId(null); // Cancel connection if dropped on canvas
      setConnectingHandle(null);
  };

  // Connection Start
  const handleConnectStart = (e: React.MouseEvent, nodeId: string, handle: 'left' | 'right') => {
      e.stopPropagation();
      e.preventDefault();
      setConnectingNodeId(nodeId);
      setConnectingHandle(handle);
      
      const rect = canvasRef.current?.getBoundingClientRect();
      if(rect) {
          const mouseX = (e.clientX - rect.left - offset.x) / zoom;
          const mouseY = (e.clientY - rect.top - offset.y) / zoom;
          setTempEdgeEnd({ x: mouseX, y: mouseY });
      }
  };

  // Connection End (Drop on Node)
  const handleNodeMouseUp = (e: React.MouseEvent, targetId: string) => {
      if (connectingNodeId) {
          e.stopPropagation();
          onEdgeCreate(connectingNodeId, targetId);
          setConnectingNodeId(null);
          setConnectingHandle(null);
      }
  };

  // Calculate svg path for edge
  const getPath = (sourceX: number, sourceY: number, targetX: number, targetY: number, index: number, total: number) => {
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
           return `M ${sourceCenter.x} ${sourceCenter.y} 
                   C ${sourceCenter.x + 50} ${sourceCenter.y}, ${sourceCenter.x + 50} ${sourceCenter.y - loopHeight}, ${sourceCenter.x - 100} ${sourceCenter.y - loopHeight}
                   S ${targetCenter.x - 50} ${targetCenter.y}, ${targetCenter.x} ${targetCenter.y}`;
      }

      // Dynamic curve based on position
      const dx = targetCenter.x - sourceCenter.x;
      const controlDist = Math.max(Math.abs(dx) * 0.5, 80);

      // Apply offset to Control Points Y coordinate to separate parallel lines
      const cp1 = { x: sourceCenter.x + controlDist, y: sourceCenter.y + offset };
      const cp2 = { x: targetCenter.x - controlDist, y: targetCenter.y + offset };

      return `M ${sourceCenter.x} ${sourceCenter.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${targetCenter.x} ${targetCenter.y}`;
  };

  return (
    <div 
      ref={canvasRef}
      className="flex-1 bg-slate-50 overflow-hidden relative cursor-grab active:cursor-grabbing select-none"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Background Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
            backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
            backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
            backgroundPosition: `${offset.x}px ${offset.y}px`
        }}
      />

      {/* Controls - Lower z-index than TopBar dropdowns */}
      <div className="absolute bottom-6 left-6 flex flex-col gap-2 z-10 node-interactive">
         <div className="bg-white rounded-lg shadow-md border border-slate-200 flex flex-col overflow-hidden">
             <button onClick={() => setZoom(z => Math.min(z + 0.1, 2))} className="p-2 hover:bg-slate-50 text-slate-600"><Plus className="w-4 h-4" /></button>
             <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.5))} className="p-2 hover:bg-slate-50 text-slate-600 border-t border-slate-100"><Minus className="w-4 h-4" /></button>
         </div>
         <button onClick={() => { setOffset({x:0, y:0}); setZoom(1); }} className="bg-white p-2 rounded-lg shadow-md border border-slate-200 hover:bg-slate-50 text-slate-600">
             <Maximize className="w-4 h-4" />
         </button>
      </div>

      {/* Content Container with Transform */}
      <div 
        style={{ 
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
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
                const d = getPath(source.x, source.y, target.x, target.y, index, total);
                
                // Calculate midpoint approximation for label (Bezier midpoints are complex, simple avg is mostly fine for visual)
                const midX = (source.x + 200 + target.x) / 2;
                const midY = (source.y + 40 + target.y + 40) / 2 + (index - (total - 1) / 2) * 30;

                return (
                    <g key={edge.id} className="edge-interactive cursor-pointer group" onClick={(e) => { e.stopPropagation(); onEdgeSelect(edge.id); }}>
                        {/* Invisible thicker path for easier clicking */}
                        <path 
                            d={d} 
                            stroke="transparent" 
                            strokeWidth="20" 
                            fill="none" 
                        />
                        {/* Visible Path */}
                        <path 
                            d={d} 
                            stroke={isSelected ? "#6366f1" : "#cbd5e1"} 
                            strokeWidth={isSelected ? "3" : "2"}
                            fill="none" 
                            markerEnd={isSelected ? "url(#arrowhead-selected)" : "url(#arrowhead)"}
                            className="transition-colors duration-200"
                        />
                        {/* Label */}
                        {edge.label && (
                            <foreignObject x={midX - 50} y={midY - 12} width="100" height="24">
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
                className={`node-interactive absolute group w-[200px] bg-white rounded-xl shadow-sm border-2 transition-shadow hover:shadow-lg cursor-grab active:cursor-grabbing
                    ${selectedNodeId === node.id ? 'ring-4 ring-brand-500/20 shadow-xl' : ''}
                    ${node.type === 'TECHNICAL' ? 'border-blue-100' : 'border-purple-100'}
                `}
                style={{ 
                    left: node.x, 
                    top: node.y 
                }}
                onMouseDown={(e) => {
                    e.stopPropagation();
                    setDraggingNodeId(node.id);
                    onNodeSelect(node.id);
                }}
                onMouseUp={(e) => handleNodeMouseUp(e, node.id)}
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
                    onMouseDown={(e) => handleConnectStart(e, node.id, 'left')}
                    title="Drag to Connect"
                >
                    <div className="w-3 h-3 rounded-full bg-slate-400 border-2 border-white shadow-sm hover:bg-brand-500 transition-colors"></div>
                </div>

                {/* Output Handle (Right) */}
                <div 
                    className="absolute top-1/2 -right-3 w-6 h-6 rounded-full flex items-center justify-center cursor-crosshair opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 z-10"
                    onMouseDown={(e) => handleConnectStart(e, node.id, 'right')}
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
