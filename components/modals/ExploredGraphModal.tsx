
import React, { useEffect, useRef, useState } from 'react';
import { X, Network, Info, Layers, Database, Calculator } from 'lucide-react';

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

export const ExploredGraphModal: React.FC<ExploredGraphModalProps> = ({ isOpen, onClose, data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNode, setDraggedNode] = useState<GraphNode | null>(null);

  // Initialize Simulation
  useEffect(() => {
    if (!isOpen || !data) return;

    // 1. Process Nodes
    const width = window.innerWidth * 0.8;
    const height = window.innerHeight * 0.8;

    const processedNodes: GraphNode[] = data.nodes.map((n) => ({
      ...n,
      x: width / 2 + (Math.random() - 0.5) * 200,
      y: height / 2 + (Math.random() - 0.5) * 200,
      vx: 0,
      vy: 0,
      // Larger radius for Tables/Metrics, smaller for Columns
      radius: n.labels.includes('Table') || n.labels.includes('BusinessMetric') ? 25 : 15,
    }));

    setNodes(processedNodes);
    setEdges(data.relationships);
    setSelectedNode(null);

  }, [isOpen, data]);

  // Physics Loop
  useEffect(() => {
    if (!isOpen || nodes.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      if (!canvas) return;
      const width = canvas.width;
      const height = canvas.height;

      // --- Physics Update ---
      const k = 0.05; // Spring constant
      const repulsion = 5000; // Repulsion force
      const damping = 0.85; // Velocity damping
      const centerForce = 0.02; // Pull to center

      // 1. Apply Repulsion (Node vs Node)
      for (let i = 0; i < nodes.length; i++) {
        const nodeA = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const nodeB = nodes[j];
          const dx = nodeA.x - nodeB.x;
          const dy = nodeA.y - nodeB.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          
          if (dist < 300) {
            const force = repulsion / (dist * dist);
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
          
          // Target distance based on combined radii + padding
          const targetDist = 100; 
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

        // Pull to center
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
      ctx.clearRect(0, 0, width, height);

      // Draw Edges
      edges.forEach(edge => {
        const source = nodes.find(n => n.id === edge.from);
        const target = nodes.find(n => n.id === edge.to);
        if (!source || !target) return;

        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.strokeStyle = '#64748b'; // slate-500
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.6;
        ctx.stroke();

        // Edge Label (Simplified)
        if (nodes.length < 50) { // Only show labels if graph isn't too busy
            const midX = (source.x + target.x) / 2;
            const midY = (source.y + target.y) / 2;
            ctx.fillStyle = '#94a3b8';
            ctx.font = '10px Inter';
            ctx.fillText(edge.type, midX, midY);
        }
        ctx.globalAlpha = 1;
      });

      // Draw Nodes
      nodes.forEach(node => {
        const primaryLabel = node.labels[0] || 'Default';
        const color = COLORS[primaryLabel] || COLORS['Default'];

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#1e293b'; // slate-900 background for contrast
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius - 2, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // Selected Halo
        if (selectedNode?.id === node.id) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 4, 0, Math.PI * 2);
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Label
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const labelName = node.properties.name || node.id.toString();
        // Truncate
        const displayText = labelName.length > 10 ? labelName.substring(0, 8) + '..' : labelName;
        ctx.fillText(displayText, node.x, node.y);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isOpen, nodes, edges, draggedNode, selectedNode]);

  // Event Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find clicked node (reverse to click top-most)
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      const dist = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
      if (dist <= node.radius) {
        setDraggedNode(node);
        setSelectedNode(node);
        setIsDragging(true);
        return;
      }
    }
    // Clicked background
    setSelectedNode(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !draggedNode) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    draggedNode.x = e.clientX - rect.left;
    draggedNode.y = e.clientY - rect.top;
    draggedNode.vx = 0;
    draggedNode.vy = 0;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedNode(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-6xl h-[85vh] bg-[#0f172a] rounded-2xl shadow-2xl flex border border-slate-700 overflow-hidden">
        
        {/* Header */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
            <div className="bg-slate-800/80 backdrop-blur rounded-lg p-2 border border-slate-700 shadow-lg">
                <div className="flex items-center gap-2 text-white font-bold px-2">
                    <Network className="w-5 h-5 text-brand-400" />
                    <span>Explored Subgraph</span>
                </div>
            </div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2 pointer-events-none">
             <div className="bg-slate-800/80 backdrop-blur rounded-lg p-3 border border-slate-700 shadow-lg space-y-2">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                    <span className="text-xs text-slate-300 font-medium">Table</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-pink-500"></span>
                    <span className="text-xs text-slate-300 font-medium">Column</span>
                </div>
                 <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <span className="text-xs text-slate-300 font-medium">Metric</span>
                </div>
             </div>
        </div>

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors border border-slate-700"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Canvas Area */}
        <div className="flex-1 relative cursor-move bg-[radial-gradient(#1e293b_1px,transparent_1px)] bg-[length:20px_20px]">
          <canvas
            ref={canvasRef}
            width={window.innerWidth * 0.8} // Approx responsive
            height={window.innerHeight * 0.85}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="block w-full h-full"
          />
        </div>

        {/* Info Panel (Slide over) */}
        {selectedNode && (
            <div className="w-80 bg-slate-900 border-l border-slate-800 p-6 overflow-y-auto animate-fade-in-right shrink-0 shadow-2xl z-20">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg
                        ${selectedNode.labels.includes('Table') ? 'bg-blue-600' : 
                          selectedNode.labels.includes('BusinessMetric') ? 'bg-emerald-600' : 'bg-pink-600'
                        }`}
                    >
                         {selectedNode.labels.includes('Table') ? <Database className="w-5 h-5" /> : 
                          selectedNode.labels.includes('BusinessMetric') ? <Calculator className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
                    </div>
                    <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                            {selectedNode.labels.join(', ')}
                        </div>
                        <h3 className="text-lg font-bold text-white leading-tight break-all">
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
                            <p className="text-sm text-slate-300 leading-relaxed bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
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
                                    <div key={key} className="flex flex-col bg-slate-800/30 p-2 rounded border border-slate-800">
                                        <span className="text-[10px] text-slate-500 font-mono mb-0.5">{key}</span>
                                        <span className="text-sm text-slate-200 font-medium break-all">
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
