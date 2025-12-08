import React, { useState } from 'react';
import { Network, Hammer, Loader2, ChevronDown, Check, AlertCircle } from 'lucide-react';

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, any>;
  status: 'running' | 'completed' | 'error';
  result?: any;
  duration?: number;
}

interface ToolVisualizationProps {
  toolCall: ToolCall;
  onOpenGraph: (data: any) => void;
  onSelectToolCall: (toolCall: ToolCall) => void;
  isCollapsed: boolean;
}

export const ToolVisualization: React.FC<ToolVisualizationProps> = ({
  toolCall,
  onOpenGraph,
  onSelectToolCall,
  isCollapsed
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isDfsExplore = toolCall.name === 'dfs_explore' && toolCall.status === 'completed';

  // Status icon and color
  const getStatusIndicator = () => {
    switch (toolCall.status) {
      case 'running':
        return <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />;
      case 'completed':
        return <Check className="w-3 h-3 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (toolCall.status) {
      case 'running':
        return 'border-blue-200 bg-blue-50/50 hover:border-blue-300';
      case 'completed':
        return 'border-green-200 bg-green-50/50 hover:border-green-300';
      case 'error':
        return 'border-red-200 bg-red-50/50 hover:border-red-300';
      default:
        return 'border-slate-200 bg-slate-50 hover:border-slate-300';
    }
  };

  // Collapsed capsule view
  if (isCollapsed && !isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className={`flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-full text-[10px] font-medium border transition-all shadow-sm hover:shadow-md ${getStatusColor()}`}
        title={`${toolCall.name} - Click to expand`}
      >
        {getStatusIndicator()}
        <span className="text-slate-700 font-semibold max-w-[120px] truncate">{toolCall.name}</span>
      </button>
    );
  }

  // Expanded view
  return (
    <div className="flex flex-col gap-2 w-full animate-fade-in">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => {
            if (isCollapsed) {
              setIsExpanded(false);
            } else {
              onSelectToolCall(toolCall);
            }
          }}
          className={`flex items-center gap-2 pl-2.5 pr-3 py-1.5 text-slate-600 rounded-xl text-[10px] font-mono hover:shadow-md transition-all shadow-sm border ${getStatusColor()}`}
        >
          {getStatusIndicator()}
          <span className="text-slate-700 font-bold">{toolCall.name}</span>
          {isCollapsed && (
            <ChevronDown className="w-3 h-3 text-slate-400 rotate-180" />
          )}
        </button>

        {/* DFS Explore Graph Visualization Button */}
        {isDfsExplore && (
          <button
            onClick={() => onOpenGraph(toolCall.result)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-brand-600 text-white rounded-xl text-[10px] font-bold shadow-md hover:bg-brand-700 hover:shadow-lg hover:scale-105 transition-all"
          >
            <Network className="w-3 h-3" />
            Visualize
          </button>
        )}

        {/* View Details Button (when collapsed) */}
        {isCollapsed && (
          <button
            onClick={() => onSelectToolCall(toolCall)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-white text-slate-600 rounded-xl text-[10px] font-medium hover:bg-slate-50 transition-all shadow-sm border border-slate-200"
          >
            View Details
          </button>
        )}
      </div>
    </div>
  );
};
