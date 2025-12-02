
import React, { useState, useRef, useEffect } from 'react';
import { Plus, Bot, MoreHorizontal, Loader2, Sparkles, Copy, BarChart2, Hammer, X, Terminal, Code, ChevronRight, Paperclip, ArrowUp, FileText, Check, MessageSquareText, Network } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '../ui/Common';
import { agentApi, Agent, RunMetrics } from '../../services/api';
import { ExploredGraphModal } from '../modals/ExploredGraphModal';

interface ToolCall {
  id: string;
  name: string;
  args: Record<string, any>;
  status: 'running' | 'completed' | 'error';
  result?: any;
  duration?: number;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  error?: boolean;
  metrics?: RunMetrics;
  toolCalls?: ToolCall[];
}

const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

interface ChatModuleProps {
  isHistoryOpen: boolean;
  onToggleHistory: () => void;
}

export const ChatModule: React.FC<ChatModuleProps> = ({ isHistoryOpen, onToggleHistory }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>(() => generateUUID());
  const [isLoadingAgents, setIsLoadingAgents] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [expandedMetricsId, setExpandedMetricsId] = useState<string | null>(null);
  const [selectedToolCall, setSelectedToolCall] = useState<ToolCall | null>(null);
  
  // Graph Modal State
  const [isGraphModalOpen, setIsGraphModalOpen] = useState(false);
  const [graphModalData, setGraphModalData] = useState<any>(null);

  // File Attachment State
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // UI States
  const [showAgentMenu, setShowAgentMenu] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const metricsRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const agentMenuRef = useRef<HTMLDivElement>(null);

  // Fetch agents on mount
  useEffect(() => {
    const fetchAgents = async () => {
        try {
            setIsLoadingAgents(true);
            const fetchedAgents = await agentApi.getAgents();
            setAgents(fetchedAgents);
            
            if (fetchedAgents.length > 0) {
                setSelectedAgentId(fetchedAgents[0].id);
                setMessages([
                    {
                        id: 'welcome',
                        role: 'assistant',
                        content: `Hello! I am ${fetchedAgents[0].name}. How can I assist you today?`,
                        timestamp: new Date()
                    }
                ]);
            } else {
                setFetchError('No agents available.');
            }
        } catch (err) {
            console.error('Failed to fetch agents:', err);
            setFetchError('Failed to load agents.');
        } finally {
            setIsLoadingAgents(false);
        }
    };

    fetchAgents();
  }, []);

  // Handle click outside metrics card and agent menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (metricsRef.current && !metricsRef.current.contains(event.target as Node)) {
        setExpandedMetricsId(null);
      }
      if (agentMenuRef.current && !agentMenuRef.current.contains(event.target as Node)) {
        setShowAgentMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [inputValue]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  // Scroll behavior logic
  useEffect(() => {
    if (messages.length === 0) return;

    const lastMsg = messages[messages.length - 1];

    // Detect if this is a new conversation turn (User asked, Bot started answering)
    // We check if the last message is an assistant message that is currently streaming.
    if (lastMsg.role === 'assistant' && lastMsg.isStreaming) {
        const prevMsg = messages[messages.length - 2];
        // If the previous message was from the user, scroll that user message to the top
        if (prevMsg?.role === 'user') {
            const el = document.getElementById(`message-${prevMsg.id}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                return;
            }
        }
    }

    // Default: Scroll to bottom for other events (initial load, agent switch, etc.)
    // We rely on messages.length changing to trigger this, so it won't fire during streaming content updates
    scrollToBottom();
  }, [messages.length, selectedAgentId]);

  const handleSend = async () => {
    if ((!inputValue.trim() && files.length === 0) || !selectedAgentId) return;

    const userText = inputValue;
    const currentFiles = files;
    
    setInputValue('');
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    
    if (textareaRef.current) textareaRef.current.style.height = 'auto'; // Reset height
    
    setExpandedMetricsId(null); // Close any open metrics
    setSelectedToolCall(null);
    
    // 1. Add User Message
    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userText + (currentFiles.length > 0 ? `\n[Attached ${currentFiles.length} file(s)]` : ''),
      timestamp: new Date()
    };

    // 2. Add Assistant Message Placeholder
    const botMsgId = (Date.now() + 1).toString();
    const newBotMsg: Message = {
        id: botMsgId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
        toolCalls: []
    };

    setMessages(prev => [...prev, newUserMsg, newBotMsg]);
    setIsTyping(true);

    try {
        await agentApi.runAgent(selectedAgentId, userText, sessionId, currentFiles, (event, data) => {
            if (event === 'RunContent') {
                if (data.content) {
                    setMessages(prev => prev.map(msg => {
                        if (msg.id === botMsgId) {
                            return { ...msg, content: msg.content + data.content };
                        }
                        return msg;
                    }));
                }
            } else if (event === 'ToolCallStarted') {
                const tool = data.tool;
                setMessages(prev => prev.map(msg => {
                    if (msg.id === botMsgId) {
                        const newToolCall: ToolCall = {
                            id: tool.tool_call_id,
                            name: tool.tool_name,
                            args: tool.tool_args,
                            status: 'running'
                        };
                        return { ...msg, toolCalls: [...(msg.toolCalls || []), newToolCall] };
                    }
                    return msg;
                }));
            } else if (event === 'ToolCallCompleted') {
                const tool = data.tool;
                setMessages(prev => prev.map(msg => {
                    if (msg.id === botMsgId) {
                        const updatedToolCalls = (msg.toolCalls || []).map(tc => {
                            if (tc.id === tool.tool_call_id) {
                                return {
                                    ...tc,
                                    status: 'completed',
                                    result: tool.result,
                                    duration: tool.metrics?.duration
                                } as ToolCall;
                            }
                            return tc;
                        });
                        return { ...msg, toolCalls: updatedToolCalls };
                    }
                    return msg;
                }));
            } else if (event === 'RunCompleted') {
                setMessages(prev => prev.map(msg => {
                    if (msg.id === botMsgId) {
                        return { 
                            ...msg, 
                            isStreaming: false,
                            metrics: data.metrics 
                        };
                    }
                    return msg;
                }));
            } else if (event === 'RunError') {
                setMessages(prev => prev.map(msg => {
                    if (msg.id === botMsgId) {
                        const errorMsg = data.content || "An error occurred during execution.";
                        return { 
                            ...msg, 
                            content: msg.content ? `${msg.content}\n\n${errorMsg}` : errorMsg,
                            isStreaming: false,
                            error: true 
                        };
                    }
                    return msg;
                }));
            }
        });
        
    } catch (error) {
        console.error('Chat error:', error);
        setMessages(prev => prev.map(msg => 
            msg.id === botMsgId ? { 
                ...msg, 
                content: msg.content + "\n\nI'm sorry, I encountered an error while processing your request.", 
                isStreaming: false,
                error: true
            } : msg
        ));
    } finally {
        setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAgentSelect = (agentId: string) => {
      setSelectedAgentId(agentId);
      setShowAgentMenu(false);
      setExpandedMetricsId(null);
      setSessionId(generateUUID());
      
      const agent = agents.find(a => a.id === agentId);
      setMessages([
        {
            id: Date.now().toString(),
            role: 'assistant',
            content: `Hello! I am ${agent?.name || 'your assistant'}. How can I assist you today?`,
            timestamp: new Date()
        }
      ]);
  };

  const handleNewChat = () => {
      if (!selectedAgentId) return;
      const agent = agents.find(a => a.id === selectedAgentId);
      setExpandedMetricsId(null);
      setSelectedToolCall(null);
      setSessionId(generateUUID());
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      setMessages([
        {
            id: Date.now().toString(),
            role: 'assistant',
            content: `Hello! I am ${agent?.name || 'your assistant'}. Starting a new conversation.`,
            timestamp: new Date()
        }
      ]);
  };

  const toggleMetrics = (id: string) => {
      setExpandedMetricsId(prev => prev === id ? null : id);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
    // Reset value so same file can be selected again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleOpenGraph = (toolResult: string) => {
      try {
          // Parse the outer JSON if needed, or if it's already an object
          const parsed = typeof toolResult === 'string' ? JSON.parse(toolResult) : toolResult;
          // The result itself might be a JSON string inside the result field, 
          // but based on the provided sample, tool.result is a stringified JSON.
          
          if (parsed && parsed.nodes && parsed.relationships) {
              setGraphModalData(parsed);
              setIsGraphModalOpen(true);
          } else {
              alert("Invalid graph data format.");
          }
      } catch (e) {
          console.error("Failed to parse graph data", e);
          alert("Failed to parse graph data.");
      }
  };

  const selectedAgent = agents.find(a => a.id === selectedAgentId);

  return (
    <div className="flex h-full bg-slate-50 overflow-hidden relative">
      
      <ExploredGraphModal 
        isOpen={isGraphModalOpen} 
        onClose={() => setIsGraphModalOpen(false)} 
        data={graphModalData} 
      />

      {/* Hidden File Input */}
      <input 
        type="file" 
        multiple 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileSelect} 
      />

      {/* Chat Sidebar / History */}
      <div 
        className={`bg-white border-slate-200 flex flex-col shrink-0 z-20 transition-all duration-300 ease-in-out overflow-hidden
            ${isHistoryOpen ? 'w-72 border-r' : 'w-0'}
        `}
      >
        <div className="w-72 h-full flex flex-col"> {/* Fixed width container to prevent squishing */}
            <div className="p-4 border-b border-slate-100">
            <Button 
                className="w-full justify-start gap-3 shadow-brand-600/10 hover:shadow-brand-600/20" 
                onClick={handleNewChat}
                disabled={!selectedAgentId}
                leftIcon={<Plus className="w-4 h-4" />}
            >
                New Chat
            </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
            <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Previous Chats</div>
            <div className="p-4 text-center text-xs text-slate-400 italic">
                History not available in this session
            </div>
            </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 relative">
        {/* Simplified Header */}
        <div className="h-14 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-50 to-white border border-brand-100 flex items-center justify-center shadow-sm text-brand-600">
                 <MessageSquareText className="w-5 h-5" />
              </div>
              <span className="font-bold text-slate-900">AI Assistant</span>
           </div>
           
           <button className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <MoreHorizontal className="w-5 h-5" />
           </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth pb-6">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              id={`message-${msg.id}`}
              className="w-full max-w-3xl mx-auto scroll-mt-20"
            >
               {msg.role === 'user' ? (
                   // User Message
                   <div className="flex gap-4 flex-row-reverse animate-fade-in group">
                       <div className="max-w-[80%]">
                           <div className="px-5 py-3.5 bg-brand-50 text-slate-900 rounded-2xl rounded-tr-sm border border-brand-100 text-sm leading-relaxed whitespace-pre-wrap">
                               {msg.content}
                           </div>
                       </div>
                   </div>
               ) : (
                   // Assistant Message
                   <div className="flex flex-col gap-2">
                       <div className="flex gap-4 animate-fade-in items-start group">
                           {/* Avatar removed as per request for cleaner look, integrated into message block implied */}
                           <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm mt-1">
                               <Sparkles className="w-4 h-4 text-brand-600" />
                           </div>
                           
                           <div className="flex-1 min-w-0 flex flex-col items-start space-y-2">
                              
                              {/* Tool Call Pills */}
                              {msg.toolCalls && msg.toolCalls.length > 0 && (
                                  <div className="flex flex-col gap-2 mb-1">
                                      {msg.toolCalls.map((toolCall, idx) => {
                                          const isDfsExplore = toolCall.name === 'dfs_explore' && toolCall.status === 'completed';
                                          
                                          return (
                                              <div key={idx} className="flex flex-wrap items-center gap-2">
                                                <button 
                                                    onClick={() => setSelectedToolCall(toolCall)}
                                                    className="flex items-center gap-2 pl-3 pr-4 py-2 bg-white text-slate-600 rounded-xl text-xs font-mono hover:border-brand-200 hover:shadow-md transition-all shadow-sm border border-slate-200 group/tool w-fit"
                                                >
                                                    <div className="w-5 h-5 rounded bg-brand-50 flex items-center justify-center shrink-0 border border-brand-100">
                                                        <Hammer className="w-3 h-3 text-brand-600" />
                                                    </div>
                                                    <span className="font-bold text-slate-700">{toolCall.status === 'running' ? 'Running Tool' : 'Tool Called'}</span>
                                                    <span className="text-slate-300">|</span>
                                                    <span className="text-brand-600 font-medium">{toolCall.name}</span>
                                                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover/tool:text-brand-600 transition-colors ml-1" />
                                                </button>

                                                {/* DFS Explore Graph Visualization Button */}
                                                {isDfsExplore && (
                                                    <button
                                                        onClick={() => handleOpenGraph(toolCall.result)}
                                                        className="flex items-center gap-2 px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-slate-800 hover:scale-105 transition-all animate-fade-in"
                                                    >
                                                        <Network className="w-3.5 h-3.5" />
                                                        Visualize Graph
                                                    </button>
                                                )}
                                              </div>
                                          );
                                      })}
                                  </div>
                              )}

                              {/* Thinking Indicator */}
                              {msg.isStreaming && (
                                  <div className="flex items-center gap-3 animate-fade-in pl-1">
                                      <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-full shadow-sm">
                                          <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-600" />
                                          <span className="text-xs font-bold text-slate-700">Thinking...</span>
                                      </div>
                                  </div>
                              )}

                              {/* Content - Clean Markdown */}
                              {(msg.content || (!msg.isStreaming && (!msg.toolCalls || msg.toolCalls.length === 0))) && (
                                  <div className={`text-sm leading-relaxed w-full ${msg.error ? 'text-red-600' : 'text-slate-800'} prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:text-slate-50 prose-pre:rounded-xl prose-code:text-brand-700 prose-code:bg-brand-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-headings:text-slate-900 prose-headings:font-bold prose-a:text-brand-600 prose-strong:text-slate-900 prose-table:w-full prose-table:border-collapse prose-th:text-left prose-th:p-2 prose-th:bg-brand-50 prose-th:text-brand-700 prose-th:border prose-th:border-brand-100 prose-td:p-2 prose-td:border prose-td:border-slate-200 prose-td:bg-white`}>
                                    <ReactMarkdown 
                                        remarkPlugins={[remarkGfm]}
                                    >
                                        {msg.content}
                                    </ReactMarkdown>
                                    
                                    {msg.isStreaming && (
                                        <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-brand-400 animate-pulse" />
                                    )}
                                  </div>
                              )}
                              
                              {/* Actions Bar (Copy & Metrics) */}
                              {!msg.isStreaming && !msg.error && (
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button 
                                          onClick={() => navigator.clipboard.writeText(msg.content)}
                                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                          title="Copy to clipboard"
                                      >
                                          <Copy className="w-3.5 h-3.5" />
                                      </button>
                                      
                                      {msg.metrics && (
                                          <button 
                                              onClick={() => toggleMetrics(msg.id)}
                                              className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 ${expandedMetricsId === msg.id ? 'text-brand-600 bg-brand-50 ring-1 ring-brand-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                                              title="View Run Metrics"
                                          >
                                              <BarChart2 className="w-3.5 h-3.5" />
                                          </button>
                                      )}
                                  </div>
                              )}

                              {/* Detailed Metrics Card */}
                              {expandedMetricsId === msg.id && msg.metrics && (
                                  <div ref={metricsRef} className="mt-2 bg-white text-slate-600 rounded-xl p-4 shadow-xl border border-slate-200 w-64 text-xs animate-fade-in relative z-10 ring-1 ring-slate-100">
                                      <h4 className="font-bold text-slate-900 text-sm mb-3 border-b border-slate-100 pb-2">Run Metrics</h4>
                                      <div className="space-y-2">
                                          <div className="flex justify-between items-center">
                                              <span className="text-slate-500">Input Tokens</span>
                                              <span className="font-mono font-medium text-slate-900">{msg.metrics.input_tokens.toLocaleString()}</span>
                                          </div>
                                          <div className="flex justify-between items-center">
                                              <span className="text-slate-500">Output Tokens</span>
                                              <span className="font-mono font-medium text-slate-900">{msg.metrics.output_tokens.toLocaleString()}</span>
                                          </div>
                                          <div className="flex justify-between items-center border-t border-slate-100 pt-2 mt-2">
                                              <span className="text-slate-700 font-bold">Total Tokens</span>
                                              <span className="font-mono font-bold text-brand-600">{msg.metrics.total_tokens.toLocaleString()}</span>
                                          </div>
                                          <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100">
                                              <span className="text-slate-500">Time To First Token</span>
                                              <span className="font-mono text-slate-900">{msg.metrics.time_to_first_token?.toFixed(3)} s</span>
                                          </div>
                                          <div className="flex justify-between items-center">
                                              <span className="text-slate-500">Run Duration</span>
                                              <span className="font-mono text-slate-900">{msg.metrics.duration.toFixed(3)} s</span>
                                          </div>
                                      </div>
                                  </div>
                              )}
                           </div>
                       </div>
                   </div>
               )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area - Flex Item */}
        <div className="w-full px-4 md:px-8 pb-6 pt-2 shrink-0 z-20">
            <div className="max-w-3xl mx-auto">
                <div 
                    className={`
                        relative bg-white rounded-2xl border border-slate-200 transition-all duration-200 shadow-lg
                        ${isTyping ? 'opacity-80' : ''}
                    `}
                >
                    <div className="flex flex-col">
                        {/* File Previews */}
                        {files.length > 0 && (
                            <div className="flex flex-wrap gap-2 px-4 pt-4">
                                {files.map((file, idx) => (
                                    <div key={idx} className="flex items-center gap-2 pl-3 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg group transition-all hover:bg-slate-100 hover:border-slate-300">
                                        <div className="flex flex-col max-w-[150px]">
                                            <span className="text-xs font-semibold text-slate-700 truncate" title={file.name}>{file.name}</span>
                                            <span className="text-[10px] text-slate-400 font-mono">{(file.size / 1024).toFixed(0)}KB</span>
                                        </div>
                                        <button 
                                            onClick={() => removeFile(idx)}
                                            className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <textarea
                            ref={textareaRef}
                            className="w-full bg-transparent border-none focus:ring-0 focus:outline-none resize-none text-sm text-slate-900 placeholder:text-slate-400 min-h-[52px] max-h-[200px] overflow-y-auto custom-scrollbar px-4 py-4"
                            placeholder={isLoadingAgents ? "Loading agents..." : "Ask anything about your data..."}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            disabled={isTyping || isLoadingAgents || !selectedAgentId}
                            rows={1}
                        />
                        
                        <div className="flex items-center justify-between px-3 pb-3">
                            {/* Left: Attachment */}
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="text-slate-400 hover:text-brand-600 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                                title="Attach files"
                            >
                                <Paperclip className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-2">
                                {/* Agent Pill */}
                                <div className="relative" ref={agentMenuRef}>
                                    <button 
                                        onClick={() => setShowAgentMenu(!showAgentMenu)}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-brand-50 text-brand-700 rounded-full text-[11px] font-bold uppercase tracking-wider hover:bg-brand-100 transition-colors border border-brand-100"
                                    >
                                        {selectedAgent?.name || 'Agent'}
                                        <Sparkles className="w-3 h-3" />
                                    </button>
                                    
                                    {/* Agent Dropdown */}
                                    {showAgentMenu && (
                                        <div className="absolute bottom-full right-0 mb-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1 overflow-hidden animate-fade-in-up z-50">
                                            <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-100">
                                                Switch Agent
                                            </div>
                                            {agents.map(agent => (
                                                <button
                                                    key={agent.id}
                                                    onClick={() => handleAgentSelect(agent.id)}
                                                    className={`w-full text-left px-4 py-2.5 text-xs font-medium hover:bg-slate-50 transition-colors flex items-center justify-between ${selectedAgentId === agent.id ? 'text-brand-600 bg-brand-50/50' : 'text-slate-700'}`}
                                                >
                                                    {agent.name}
                                                    {selectedAgentId === agent.id && <Check className="w-3 h-3" />}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Send Button */}
                                <button
                                    className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200 ${
                                    (inputValue.trim() || files.length > 0) && !isTyping && selectedAgentId
                                        ? 'bg-slate-100 text-slate-900 hover:bg-brand-600 hover:text-white shadow-sm' 
                                        : 'bg-slate-50 text-slate-300 cursor-not-allowed'
                                    }`}
                                    disabled={(!inputValue.trim() && files.length === 0) || isTyping || !selectedAgentId}
                                    onClick={handleSend}
                                >
                                    {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="text-center mt-3">
                     <span className="text-[10px] text-slate-400 font-medium">AI can make mistakes. Check important info.</span>
                </div>
            </div>
        </div>
      </div>

      {/* Tool Details Sidebar */}
      {selectedToolCall && (
        <div className="absolute top-0 right-0 h-full w-[400px] bg-white text-slate-600 shadow-2xl z-50 animate-fade-in-left border-l border-slate-200 flex flex-col">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-white">
                <h3 className="font-bold text-slate-900 text-lg tracking-tight">{selectedToolCall.name}</h3>
                <button onClick={() => setSelectedToolCall(null)} className="text-slate-400 hover:text-slate-700 transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
                {/* Tool Name */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <Hammer className="w-3.5 h-3.5" /> Tool Name
                    </div>
                    <div className="p-3 rounded-lg bg-brand-50 border border-brand-200 font-mono text-sm text-brand-700 font-bold">
                        {selectedToolCall.name}
                    </div>
                </div>

                {/* Tool Args */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <Terminal className="w-3.5 h-3.5" /> Tool Args
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs text-slate-700 overflow-x-auto">
                        <pre>{JSON.stringify(selectedToolCall.args, null, 2)}</pre>
                    </div>
                </div>

                {/* Metrics */}
                {selectedToolCall.duration !== undefined && (
                    <div className="space-y-2">
                         <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                            <BarChart2 className="w-3.5 h-3.5" /> Tool Metrics
                        </div>
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                             <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500">Duration</span>
                                <span className="font-mono font-bold text-slate-900">{selectedToolCall.duration.toFixed(4)} ms</span>
                             </div>
                        </div>
                    </div>
                )}

                {/* Tool Result */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <Code className="w-3.5 h-3.5" /> Tool Result
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs text-slate-700 overflow-x-auto min-h-[100px]">
                        {selectedToolCall.result ? (
                             typeof selectedToolCall.result === 'string' ? (
                                <pre className="whitespace-pre-wrap">{selectedToolCall.result}</pre>
                             ) : (
                                <pre>{JSON.stringify(selectedToolCall.result, null, 2)}</pre>
                             )
                        ) : (
                            <span className="text-slate-400 italic">No result available or tool running...</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
