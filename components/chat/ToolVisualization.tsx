import React from 'react';
import { Network, ChevronRight, Hammer } from 'lucide-react';
import { Chart } from '../ui/Chart';

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
}

export const ToolVisualization: React.FC<ToolVisualizationProps> = ({
  toolCall,
  onOpenGraph,
  onSelectToolCall
}) => {
  const isDfsExplore = toolCall.name === 'dfs_explore' && toolCall.status === 'completed';
  const isChart = toolCall.name === 'create_bar_chart' && toolCall.status === 'completed' && toolCall.result;

  let chartOptions = null;
  if (isChart) {
    try {
      const parsed = typeof toolCall.result === 'string' ? JSON.parse(toolCall.result) : toolCall.result;
      if (parsed && parsed.option) {
        chartOptions = parsed.option;
      }
    } catch (e) { console.error("Failed to parse chart options", e); }
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => onSelectToolCall(toolCall)}
          className="flex items-center gap-2 pl-3 pr-4 py-1.5 bg-white text-slate-600 rounded-xl text-[11px] font-mono hover:border-brand-200 hover:shadow-md transition-all shadow-sm border border-slate-200 group/tool w-fit"
        >
          <div className="w-4 h-4 rounded bg-brand-50 flex items-center justify-center shrink-0 border border-brand-100">
            <Hammer className="w-2.5 h-2.5 text-brand-600" />
          </div>
          <span className="font-bold text-slate-700">{toolCall.status === 'running' ? 'Running Tool' : 'Tool Called'}</span>
          <span className="text-slate-300">|</span>
          <span className="text-brand-600 font-medium">{toolCall.name}</span>
          <ChevronRight className="w-3 h-3 text-slate-400 group-hover/tool:text-brand-600 transition-colors ml-1" />
        </button>

        {/* DFS Explore Graph Visualization Button */}
        {isDfsExplore && (
          <button
            onClick={() => onOpenGraph(toolCall.result)}
            className="flex items-center gap-2 px-3 py-1.5 bg-brand-600 text-white rounded-xl text-[11px] font-bold shadow-md hover:bg-brand-700 hover:shadow-lg hover:scale-105 transition-all animate-fade-in"
          >
            <Network className="w-3 h-3" />
            Visualize Graph
          </button>
        )}
      </div>

      {/* Chart Rendering */}
      {chartOptions && (
        <div className="w-full max-w-2xl bg-white rounded-xl border border-slate-200 shadow-sm p-4 animate-fade-in">
          <Chart options={chartOptions} className="w-full" />
        </div>
      )}
    </div>
  );
};
