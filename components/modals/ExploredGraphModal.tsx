
import React, { useEffect, useRef, useState } from 'react';
import { X, Network, Info, Layers, Database, Calculator, Move } from 'lucide-react';

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

// Enhanced color palette with maximum distinction
const COLORS: Record<string, { fill: string; glow: string; border: string }> = {
  Table: { fill: '#06b6d4', glow: 'rgba(6, 182, 212, 0.4)', border: '#22d3ee' }, // Cyan
  Column: { fill: '#f59e0b', glow: 'rgba(245, 158, 11, 0.4)', border: '#fbbf24' }, // Amber
  BusinessMetric: { fill: '#ec4899', glow: 'rgba(236, 72, 153, 0.4)', border: '#f472b6' }, // Pink
  Default: { fill: '#64748b', glow: 'rgba(100, 116, 139, 0.4)', border: '#94a3b8' } // Slate
};

// Enhanced node size for better visibility
const NODE_RADIUS = 28;

export const ExploredGraphModal: React.FC<ExploredGraphModalProps> = ({ isOpen, onClose, data }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const nodesRef = useRef<GraphNode[]>([]);
  const edgesRef = useRef<GraphEdge[]>([]);
  const transformRef = useRef({ x: 0, y: 0, k: 1 });

  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  const isDraggingNode = useRef(false);
  const isPanning = useRef(false);
  const draggedNodeRef = useRef<GraphNode | null>(null);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Handle backdrop click to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  // Handle Resize
  useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setCanvasSize({ width: clientWidth, height: clientHeight });
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [isOpen]);

  // Initialize Simulation Data
  useEffect(() => {
    if (!isOpen || !data || canvasSize.width === 0) return;

    if (nodesRef.current.length === 0 || nodesRef.current.length !== data.nodes.length) {
      transformRef.current = { x: 0, y: 0, k: 1 };

      const width = canvasSize.width;
      const height = canvasSize.height;

      // Better initial distribution in a circle pattern
      const angleStep = (2 * Math.PI) / data.nodes.length;
      const radius = Math.min(width, height) * 0.25;

      const processedNodes: GraphNode[] = data.nodes.map((n, i) => ({
        ...n,
        x: width / 2 + Math.cos(angleStep * i) * radius + (Math.random() - 0.5) * 50,
        y: height / 2 + Math.sin(angleStep * i) * radius + (Math.random() - 0.5) * 50,
        vx: 0,
        vy: 0,
        radius: NODE_RADIUS,
      }));

      nodesRef.current = processedNodes;
      edgesRef.current = data.relationships;
      setSelectedNode(null);
    }

  }, [isOpen, data, canvasSize.width]);

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

      // --- Enhanced Physics ---
      const springStrength = 0.06;
      const repulsion = 12000;
      const damping = 0.85;
      const centerForce = 0.008;
      const minVelocity = 0.01;

      // 1. Apply Repulsion (Node vs Node)
      for (let i = 0; i < nodes.length; i++) {
        const nodeA = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const nodeB = nodes[j];
          const dx = nodeA.x - nodeB.x;
          const dy = nodeA.y - nodeB.y;
          const distSq = dx * dx + dy * dy || 1;
          const dist = Math.sqrt(distSq);

          if (dist < 400) {
            const force = repulsion / distSq;
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

          const targetDist = 140;
          const force = (dist - targetDist) * springStrength;

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

        node.vx += (width / 2 - node.x) * centerForce;
        node.vy += (height / 2 - node.y) * centerForce;

        node.vx *= damping;
        node.vy *= damping;

        // Stop very small movements
        if (Math.abs(node.vx) < minVelocity) node.vx = 0;
        if (Math.abs(node.vy) < minVelocity) node.vy = 0;

        node.x += node.vx;
        node.y += node.vy;
      });

      // --- Drawing ---
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const { x: tx, y: ty, k: tk } = transformRef.current;
      ctx.setTransform(tk, 0, 0, tk, tx, ty);

      // 1. Draw Edges with subtle gradient
      ctx.lineWidth = 1.5;
      edges.forEach(edge => {
        const source = nodes.find(n => n.id === edge.from);
        const target = nodes.find(n => n.id === edge.to);
        if (!source || !target) return;

        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);

        ctx.strokeStyle = 'rgba(100, 116, 139, 0.35)';
        ctx.stroke();
      });

      // 2. Draw Edge Labels
      if (tk > 0.5) {
        ctx.font = '500 9px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        edges.forEach(edge => {
          const source = nodes.find(n => n.id === edge.from);
          const target = nodes.find(n => n.id === edge.to);
          if (!source || !target) return;

          const midX = (source.x + target.x) / 2;
          const midY = (source.y + target.y) / 2;
          const label = edge.type;

          const metrics = ctx.measureText(label);
          const paddingX = 6;
          const boxWidth = metrics.width + paddingX * 2;
          const boxHeight = 14;

          ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
          ctx.beginPath();

          const x = midX - boxWidth / 2;
          const y = midY - boxHeight / 2;
          const r = 4;
          ctx.moveTo(x + r, y);
          ctx.arcTo(x + boxWidth, y, x + boxWidth, y + boxHeight, r);
          ctx.arcTo(x + boxWidth, y + boxHeight, x, y + boxHeight, r);
          ctx.arcTo(x, y + boxHeight, x, y, r);
          ctx.arcTo(x, y, x + boxWidth, y, r);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#94a3b8';
          ctx.fillText(label, midX, midY);
        });
      }

      // 3. Draw Nodes with enhanced visuals
      nodes.forEach(node => {
        const primaryLabel = node.labels[0] || 'Default';
        const colorSet = COLORS[primaryLabel] || COLORS['Default'];
        const isSelected = selectedNode?.id === node.id;

        // Glow effect
        ctx.shadowColor = isSelected ? colorSet.fill : colorSet.glow;
        ctx.shadowBlur = isSelected ? 24 : 12;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Circle body
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);

        // Gradient fill
        const grad = ctx.createRadialGradient(
          node.x - node.radius * 0.3,
          node.y - node.radius * 0.3,
          node.radius * 0.1,
          node.x,
          node.y,
          node.radius
        );
        grad.addColorStop(0, lightenColor(colorSet.fill, 30));
        grad.addColorStop(0.7, colorSet.fill);
        grad.addColorStop(1, darkenColor(colorSet.fill, 15));
        ctx.fillStyle = grad;
        ctx.fill();

        // Border
        ctx.lineWidth = isSelected ? 2.5 : 1.5;
        ctx.strokeStyle = isSelected ? '#fff' : colorSet.border;
        ctx.stroke();

        // Reset Shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        // Label text
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const labelName = node.properties.name || node.id.toString();
        if (labelName.length > 8 && labelName.includes('_')) {
          const parts = labelName.split('_');
          ctx.fillText(parts[0], node.x, node.y - 5);
          ctx.font = '500 9px Inter, system-ui, sans-serif';
          ctx.fillText(parts.slice(1).join('_').substring(0, 8), node.x, node.y + 6);
        } else {
          const displayText = labelName.length > 9 ? labelName.substring(0, 8) + '..' : labelName;
          ctx.fillText(displayText, node.x, node.y);
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isOpen, selectedNode, canvasSize]);

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

    const nodes = nodesRef.current;
    let hitNode = false;

    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      const dist = Math.sqrt((wx - node.x) ** 2 + (wy - node.y) ** 2);
      if (dist <= node.radius) {
        draggedNodeRef.current = node;
        setSelectedNode(node);
        isDraggingNode.current = true;
        isPanning.current = false;
        hitNode = true;
        return;
      }
    }

    if (!hitNode) {
      isPanning.current = true;
      isDraggingNode.current = false;
      draggedNodeRef.current = null;
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const { x: sx, y: sy } = getEventPos(e);

    if (!isDraggingNode.current && !isPanning.current) {
      const { x: wx, y: wy } = getWorldPos(sx, sy);
      let hittingNode = false;
      const nodes = nodesRef.current;
      for (let i = nodes.length - 1; i >= 0; i--) {
        const node = nodes[i];
        const dist = Math.sqrt((wx - node.x) ** 2 + (wy - node.y) ** 2);
        if (dist <= node.radius) {
          hittingNode = true;
          break;
        }
      }
      if (canvasRef.current) {
        canvasRef.current.style.cursor = hittingNode ? 'pointer' : 'grab';
      }
    } else if (canvasRef.current) {
      canvasRef.current.style.cursor = 'grabbing';
    }

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
    const newK = Math.min(Math.max(k + delta, 0.2), 4);

    const wx = (sx - x) / k;
    const wy = (sy - y) / k;

    transformRef.current = {
      x: sx - wx * newK,
      y: sy - wy * newK,
      k: newK
    };
  };

  const lightenColor = (color: string, percent: number) => {
    let num = parseInt(color.replace("#", ""), 16),
      amt = Math.round(2.55 * percent),
      R = (num >> 16) + amt,
      B = (num >> 8 & 0x00FF) + amt,
      G = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (B < 255 ? B < 1 ? 0 : B : 255) * 0x100 + (G < 255 ? G < 1 ? 0 : G : 255)).toString(16).slice(1);
  };

  const darkenColor = (color: string, percent: number) => {
    let num = parseInt(color.replace("#", ""), 16),
      amt = Math.round(2.55 * percent),
      R = (num >> 16) - amt,
      B = (num >> 8 & 0x00FF) - amt,
      G = (num & 0x0000FF) - amt;
    return "#" + (0x1000000 + (R > 0 ? R : 0) * 0x10000 + (B > 0 ? B : 0) * 0x100 + (G > 0 ? G : 0)).toString(16).slice(1);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-7xl h-[90vh] bg-[#0f172a] rounded-2xl shadow-2xl flex border border-slate-700 overflow-hidden ring-1 ring-slate-700"
      >

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
                <span className="w-3 h-3 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]"></span>
                <span className="text-xs text-slate-300 font-medium">Table</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span>
                <span className="text-xs text-slate-300 font-medium">Column</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.5)]"></span>
                <span className="text-xs text-slate-300 font-medium">Metric</span>
              </div>
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 relative cursor-grab active:cursor-grabbing bg-slate-900 overflow-hidden" ref={containerRef}>
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
            width={canvasSize.width}
            height={canvasSize.height}
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
          <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col animate-fade-in-right shrink-0 shadow-2xl z-20 relative">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Node Details</span>
              <button
                onClick={() => setSelectedNode(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ring-1 ring-white/10 shrink-0
                            ${selectedNode.labels.includes('Table') ? 'bg-cyan-600 shadow-cyan-900/20' :
                    selectedNode.labels.includes('BusinessMetric') ? 'bg-pink-600 shadow-pink-900/20' : 'bg-amber-600 shadow-amber-900/20'
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
                  <h3 className="text-lg font-bold text-white leading-tight break-words" title={selectedNode.properties.name}>
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
          </div>
        )}
      </div>
    </div>
  );
};
