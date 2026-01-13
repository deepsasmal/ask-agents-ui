import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { ToolVisualization, ToolCall } from './ToolVisualization';

interface ToolCallListProps {
    toolCalls: ToolCall[];
    isStreaming: boolean;
    onOpenGraph: (data: any) => void;
    onSelectToolCall: (toolCall: ToolCall) => void;
}

export const ToolCallList: React.FC<ToolCallListProps> = ({
    toolCalls,
    isStreaming,
    onOpenGraph,
    onSelectToolCall
}) => {
    // Default collapsed if not streaming
    const [isExpanded, setIsExpanded] = useState(false);

    // If streaming, force visible. If not, respect manual toggle.
    const showTools = isStreaming || isExpanded;

    if (!toolCalls || toolCalls.length === 0) return null;

    return (
        <div className="w-full flex flex-col gap-2 mb-1">
            {/* Toggle Header - Only show if NOT streaming (i.e. finished) */}
            {!isStreaming && (
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors w-fit select-none group"
                >
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5 group-hover:text-slate-900" /> : <ChevronRight className="w-3.5 h-3.5 group-hover:text-slate-900" />}
                    <span className="flex items-center gap-2 group-hover:text-slate-900">
                        {isExpanded ? 'Hide' : 'Show'} tool calls
                        <span className="px-1.5 py-0.5 bg-slate-100 rounded-full text-[10px] text-slate-600 border border-slate-200 group-hover:border-slate-300">
                            {toolCalls.length}
                        </span>
                    </span>
                </button>
            )}

            {/* Tool List */}
            {showTools && (
                <div className="flex flex-wrap items-center gap-2 animate-fade-in">
                    {toolCalls.map((toolCall, idx) => (
                        <ToolVisualization
                            key={toolCall.id || idx}
                            toolCall={toolCall}
                            onOpenGraph={onOpenGraph}
                            onSelectToolCall={onSelectToolCall}
                            isCollapsed={false}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
