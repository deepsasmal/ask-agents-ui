
import React, { useEffect, useRef, useState } from 'react';
import { X, Network, Info, Layers, Database, Calculator, ZoomIn, ZoomOut, Move } from 'lucide-react';

interface GraphNode {
  id: number | string;
  labels: string[];
  properties: Record<string, any>;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface GraphEdge {
  from: number | string;
  to: number | string;
  type: string;
}

interface GraphData {
  nodes: any[];
  relationships: any[];
}

interface ExploredGraphModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: GraphData;
}

// Colors based on labels
const COLORS: Record<string, string> = {
  Table: '#3b82f6', // blue-500
  Column: '#ec4899', // pink-500
  BusinessMetric: '#10b981', // emerald-500
  Default: '#64748b' // slate-500
};

// Constants
const NODE_RADIUS = 30; // Uniform radius
const HEADER_HEIGHT = 0; // Header overlay height if needed

export const ExploredGraphModal: React.FC<ExploredGraphModalProps> = ({ isOpen, onClose, data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Use refs for mutable state to ensure smooth 60fps animation without re-renders
  const nodesRef = useRef<GraphNode[]>([]);
  const edgesRef = useRef<GraphEdge[]>([]);
  const transformRef = useRef({ x: 0, y: 0, k: 1 }); // View transform (pan/zoom)
  
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  
  // Interaction State
  const isDraggingNode = useRef(false);
  const isPanning = useRef(false);
  const draggedNodeRef = useRef<GraphNode | null>(null);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Initialize Simulation
  useEffect(() => {
    if (!isOpen || !data) return;

    // Reset transform
    transformRef.current = { x: 0, y: 0, k: 1 };

    const width = window.innerWidth * 0.8;
    const height = window.innerHeight * 0.85;

    // Center initial nodes
    const processedNodes: GraphNode[] = data.nodes.map((n) => ({
      ...n,
      x: width / 2 + (Math.random() - 0.5) * 100,
      y: height / 2 + (Math.random() - 0.5) * 100,
      vx: 0,
      vy: 0,
      radius: NODE_RADIUS, 
    }));

    nodesRef.current = processedNodes;
    edgesRef.current = data.relationships;
    setSelectedNode(null);

  }, [isOpen, data]);

  // Physics & Rendering Loop
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      if (!canvas) return;
      
      const width = canvas.width;
      const height = canvas.height;
      
      const nodes = nodesRef.current;
      const edges = edgesRef.current;
      const draggedNode = draggedNodeRef.current;

      // --- Physics Update ---
      // Tuned for "bouncy" but stable feel
      const k = 0.08; // Stiffer spring
      const repulsion = 8000; // Stronger repulsion for spacing
      const damping = 0.8; // Standard damping
      const centerForce = 0.005; // Gentle pull to center

      // 1. Apply Repulsion (Node vs Node)
      for (let i = 0; i < nodes.length; i++) {
        const nodeA = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const nodeB = nodes[j];
          const dx = nodeA.x - nodeB.x;
          const dy = nodeA.y - nodeB.y;
          const distSq = dx * dx + dy * dy || 1;
          const dist = Math.sqrt(distSq);
          
          // Min distance to prevent extreme forces
          if (dist < 500) {
            const force = repulsion / (distSq);
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            if (nodeA !== draggedNode) {
              nodeA.vx += fx;
              nodeA.vy += fy;
            }
            if (nodeB !== draggedNode) {
              nodeB.vx -= fx;
              nodeB.vy -= fy;
            }
          }
        }
      }

      // 2. Apply Spring (Edges)
      edges.forEach(edge => {
        const source = nodes.find(n => n.id === edge.from);
        const target = nodes.find(n => n.id === edge.to);
        if (source && target) {
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          
          const targetDist = 120; // Ideal length
          const force = (dist - targetDist) * k;
          
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          if (source !== draggedNode) {
            source.vx += fx;
            source.vy += fy;
          }
          if (target !== draggedNode) {
            target.vx -= fx;
            target.vy -= fy;
          }
        }
      });

      // 3. Center Gravity & Update Position
      nodes.forEach(node => {
        if (node === draggedNode) return;

        // Pull to center of canvas world space (approx)
        // We assume world center is at width/2, height/2 roughly
        node.vx += (width / 2 - node.x) * centerForce;
        node.vy += (height / 2 - node.y) * centerForce;

        // Apply Damping
        node.vx *= damping;
        node.vy *= damping;

        // Update
        node.x += node.vx;
        node.y += node.vy;
      });

      // --- Drawing ---
      // Reset transform to clear screen
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, width, height);
      
      // Apply Pan/Zoom Transform
      const { x: tx, y: ty, k: tk } = transformRef.current;
      ctx.setTransform(tk, 0, 0, tk, tx, ty);

      // Draw Edges
      ctx.lineWidth = 1.5;
      edges.forEach(edge => {
        const source = nodes.find(n => n.id === edge.from);
        const target = nodes.find(n => n.id === edge.to);
        if (!source || !target) return;

        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        
        // Gradient edge? Or simple solid
        const grad = ctx.createLinearGradient(source.x, source.y, target.x, target.y);
        grad.addColorStop(0, '#475569'); // slate-600
        grad.addColorStop(1, '#475569');
        ctx.strokeStyle = grad;
        ctx.globalAlpha = 0.5;
        ctx.stroke();
        ctx.globalAlpha = 1;
      });

      // Draw Nodes
      nodes.forEach(node => {
        const primaryLabel = node.labels[0] || 'Default';
        const baseColor = COLORS[primaryLabel] || COLORS['Default'];
        const isSelected = selectedNode?.id === node.id;

        // Node Shadow/Glow
        if (isSelected) {
            ctx.shadowColor = baseColor;
            ctx.shadowBlur = 20;
        } else {
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 6;
        }
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;

        // Circle Body
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        
        // Gradient Fill
        const grad = ctx.createRadialGradient(node.x - 10, node.y - 10, 5, node.x, node.y, node.radius);
        grad.addColorStop(0, lightenColor(baseColor, 40));
        grad.addColorStop(1, baseColor);
        ctx.fillStyle = grad;
        ctx.fill();

        // Border
        ctx.lineWidth = isSelected ? 3 : 1.5;
        ctx.strokeStyle = '#fff'; // White border
        ctx.stroke();

        // Reset Shadow for text
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        // Text
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const labelName = node.properties.name || node.id.toString();
        // Simple fitting: if too long, split or truncate
        if (labelName.length > 8 && labelName.includes('_')) {
             const parts = labelName.split('_');
             ctx.fillText(parts[0], node.x, node.y - 6);
             ctx.fillText(parts.slice(1).join('_'), node.x, node.y + 6);
        } else {
             const displayText = labelName.length > 10 ? labelName.substring(0, 9) + '..' : labelName;
             ctx.fillText(displayText, node.x, node.y);
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isOpen, selectedNode]);

  // --- Interaction Handlers ---

  const getEventPos = (e: React.MouseEvent | React.WheelEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const getWorldPos = (screenX: number, screenY: number) => {
      const { x, y, k } = transformRef.current;
      return {
          x: (screenX - x) / k,
          y: (screenY - y) / k
      };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const { x: sx, y: sy } = getEventPos(e);
    const { x: wx, y: wy } = getWorldPos(sx, sy);
    lastMousePos.current = { x: sx, y: sy };

    // Check node collision
    // Reverse iteration to check top-most nodes first
    const nodes = nodesRef.current;
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      const dist = Math.sqrt((wx - node.x) ** 2 + (wy - node.y) ** 2);
      if (dist <= node.radius) {
        draggedNodeRef.current = node;
        setSelectedNode(node);
        isDraggingNode.current = true;
        isPanning.current = false;
        return;
      }
    }

    // If no node clicked, start panning
    isPanning.current = true;
    isDraggingNode.current = false;
    draggedNodeRef.current = null;
    setSelectedNode(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const { x: sx, y: sy } = getEventPos(e);
    
    if (isDraggingNode.current && draggedNodeRef.current) {
        const { x: wx, y: wy } = getWorldPos(sx, sy);
        draggedNodeRef.current.x = wx;
        draggedNodeRef.current.y = wy;
        draggedNodeRef.current.vx = 0;
        draggedNodeRef.current.vy = 0;
    } else if (isPanning.current) {
        const dx = sx - lastMousePos.current.x;
        const dy = sy - lastMousePos.current.y;
        transformRef.current.x += dx;
        transformRef.current.y += dy;
    }

    lastMousePos.current = { x: sx, y: sy };
  };

  const handleMouseUp = () => {
    isDraggingNode.current = false;
    isPanning.current = false;
    draggedNodeRef.current = null;
  };

  const handleWheel = (e: React.WheelEvent) => {
      e.stopPropagation();
      e.preventDefault();

      const { x: sx, y: sy } = getEventPos(e);
      const { x, y, k } = transformRef.current;
      
      const zoomSensitivity = 0.001;
      const delta = -e.deltaY * zoomSensitivity;
      const newK = Math.min(Math.max(k + delta, 0.1), 5); // Limit zoom 0.1x to 5x

      // Zoom towards mouse pointer logic:
      // world_mouse = (screen_mouse - old_pan) / old_k
      // new_pan = screen_mouse - world_mouse * new_k
      
      const wx = (sx - x) / k;
      const wy = (sy - y) / k;

      transformRef.current = {
          x: sx - wx * newK,
          y: sy - wy * newK,
          k: newK
      };
  };

  // Helper to adjust color brightness
  const lightenColor = (color: string, percent: number) => {
    // Simple hex to rgb adjustment
    let num = parseInt(color.replace("#",""),16),
    amt = Math.round(2.55 * percent),
    R = (num >> 16) + amt,
    B = (num >> 8 & 0x00FF) + amt,
    G = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (B<255?B<1?0:B:255)*0x100 + (G<255?G<1?0:G:255)).toString(16).slice(1);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-7xl h-[90vh] bg-[#0f172a] rounded-2xl shadow-2xl flex border border-slate-700 overflow-hidden ring-1 ring-slate-700">
        
        {/* Top Controls Overlay */}
        <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
             {/* Title */}
            <div className="bg-slate-800/90 backdrop-blur-md rounded-xl p-2 border border-slate-700 shadow-xl pointer-events-auto flex items-center gap-3">
                <div className="p-2 bg-brand-500/20 rounded-lg">
                     <Network className="w-5 h-5 text-brand-400" />
                </div>
                <div className="pr-4">
                     <h2 className="text-sm font-bold text-slate-200 leading-none">Explored Graph</h2>
                     <span className="text-[10px] text-slate-400 font-mono">
                        {nodesRef.current.length} Nodes • {edgesRef.current.length} Edges
                     </span>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pointer-events-auto">
                 <button 
                    onClick={() => {
                        transformRef.current = { x: 0, y: 0, k: 1 };
                    }}
                    className="p-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700 transition-colors shadow-lg"
                    title="Reset View"
                 >
                    <Move className="w-4 h-4" />
                </button>
                <button 
                  onClick={onClose}
                  className="p-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors border border-red-500/20 shadow-lg"
                >
                  <X className="w-4 h-4" />
                </button>
            </div>
        </div>

        {/* Legend Overlay */}
        <div className="absolute bottom-6 left-6 z-10 pointer-events-none">
             <div className="bg-slate-800/90 backdrop-blur-md rounded-xl p-4 border border-slate-700 shadow-xl space-y-3 pointer-events-auto">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Node Types</span>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
                        <span className="text-xs text-slate-300 font-medium">Table</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.5)]"></span>
                        <span className="text-xs text-slate-300 font-medium">Column</span>
                    </div>
                     <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                        <span className="text-xs text-slate-300 font-medium">Metric</span>
                    </div>
                </div>
             </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 relative cursor-grab active:cursor-grabbing bg-slate-900 overflow-hidden">
           {/* Grid Background */}
           <div 
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{ 
                    backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', 
                    backgroundSize: '24px 24px' 
                }} 
           />
           
          <canvas
            ref={canvasRef}
            width={window.innerWidth} 
            height={window.innerHeight}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            className="block w-full h-full"
          />
        </div>

        {/* Info Panel (Slide over) */}
        {selectedNode && (
            <div className="w-80 bg-slate-900 border-l border-slate-800 p-6 overflow-y-auto animate-fade-in-right shrink-0 shadow-2xl z-20 relative">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ring-1 ring-white/10
                        ${selectedNode.labels.includes('Table') ? 'bg-blue-600 shadow-blue-900/20' : 
                          selectedNode.labels.includes('BusinessMetric') ? 'bg-emerald-600 shadow-emerald-900/20' : 'bg-pink-600 shadow-pink-900/20'
                        }`}
                    >
                         {selectedNode.labels.includes('Table') ? <Database className="w-6 h-6" /> : 
                          selectedNode.labels.includes('BusinessMetric') ? <Calculator className="w-6 h-6" /> : <Layers className="w-6 h-6" />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex flex-wrap gap-1">
                            {selectedNode.labels.map(l => (
                                <span key={l} className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">{l}</span>
                            ))}
                        </div>
                        <h3 className="text-lg font-bold text-white leading-tight truncate" title={selectedNode.properties.name}>
                            {selectedNode.properties.name}
                        </h3>
                    </div>
                </div>

                <div className="space-y-6">
                    {selectedNode.properties.description && (
                        <div className="space-y-2">
                             <div className="flex items-center gap-2 text-xs font-bold text-brand-400 uppercase tracking-wider">
                                <Info className="w-3.5 h-3.5" /> Description
                            </div>
                            <p className="text-sm text-slate-300 leading-relaxed bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                                {selectedNode.properties.description}
                            </p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Properties</div>
                        <div className="space-y-2">
                            {Object.entries(selectedNode.properties).map(([key, value]) => {
                                if (key === 'name' || key === 'description') return null;
                                return (
                                    <div key={key} className="flex flex-col bg-slate-800/30 p-2.5 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
                                        <span className="text-[10px] text-slate-500 font-mono mb-1 uppercase tracking-tight">{key}</span>
                                        <span className="text-sm text-slate-200 font-medium break-all font-mono">
                                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
