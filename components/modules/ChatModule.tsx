
import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, Bot, User, MoreHorizontal, ChevronDown, Loader2, AlertCircle, Clock, Zap, Sparkles, StopCircle, RefreshCw, Copy, Check, BarChart2, Hammer, X, Terminal, Code, ChevronRight } from 'lucide-react';
import { Button } from '../ui/Common';
import { agentApi, Agent, RunMetrics } from '../../services/api';

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

export const ChatModule: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [isLoadingAgents, setIsLoadingAgents] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [expandedMetricsId, setExpandedMetricsId] = useState<string | null>(null);
  const [selectedToolCall, setSelectedToolCall] = useState<ToolCall | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const metricsRef = useRef<HTMLDivElement>(null);

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

  // Handle click outside metrics card
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (metricsRef.current && !metricsRef.current.contains(event.target as Node)) {
        setExpandedMetricsId(null);
      }
    };

    if (expandedMetricsId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [expandedMetricsId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || !selectedAgentId) return;

    const userText = inputValue;
    setInputValue('');
    setExpandedMetricsId(null); // Close any open metrics
    setSelectedToolCall(null);
    
    // 1. Add User Message
    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
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
        await agentApi.runAgent(selectedAgentId, userText, (event, data) => {
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

  const handleAgentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newAgentId = e.target.value;
      setSelectedAgentId(newAgentId);
      setExpandedMetricsId(null);
      
      const agent = agents.find(a => a.id === newAgentId);
      // Reset chat when switching agents
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

  return (
    <div className="flex h-full bg-slate-50 overflow-hidden relative">
      
      {/* Chat Sidebar / History */}
      <div className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0 z-20 hidden md:flex">
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

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Header */}
        <div className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-50 to-white border border-brand-100 flex items-center justify-center shadow-sm text-brand-600">
                 <Bot className="w-5 h-5" />
              </div>
              
              <div className="flex flex-col">
                 <div className="flex items-center gap-2">
                     {isLoadingAgents ? (
                         <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
                     ) : fetchError ? (
                         <span className="text-sm font-bold text-red-500 flex items-center gap-1">
                             <AlertCircle className="w-3 h-3" /> Error
                         </span>
                     ) : (
                         <div className="relative group">
                             <select 
                                value={selectedAgentId} 
                                onChange={handleAgentChange}
                                className="appearance-none bg-transparent text-sm font-bold text-slate-900 pr-6 py-0.5 cursor-pointer focus:outline-none"
                             >
                                {agents.map(agent => (
                                    <option key={agent.id} value={agent.id}>{agent.name}</option>
                                ))}
                             </select>
                             <ChevronDown className="w-3 h-3 text-slate-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
                         </div>
                     )}
                 </div>
              </div>
           </div>
           
           <button className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <MoreHorizontal className="w-5 h-5" />
           </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-2 scroll-smooth">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className="w-full max-w-3xl mx-auto mb-6"
            >
               {msg.role === 'user' ? (
                   // User Message
                   <div className="flex gap-4 flex-row-reverse animate-fade-in">
                       <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                           <User className="w-4 h-4 text-slate-600" />
                       </div>
                       <div className="max-w-[80%]">
                           <div className="px-5 py-3.5 bg-brand-600 text-white rounded-2xl rounded-tr-sm shadow-sm text-sm leading-relaxed whitespace-pre-wrap">
                               {msg.content}
                           </div>
                           <div className="text-[10px] text-slate-400 mt-1.5 text-right px-1">
                               {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </div>
                       </div>
                   </div>
               ) : (
                   // Assistant Message
                   <div className="flex flex-col gap-2">
                       <div className="flex gap-4 animate-fade-in items-start">
                           <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-100 to-white border border-brand-200 flex items-center justify-center shrink-0 shadow-sm mt-1 ring-1 ring-brand-50">
                               <Bot className="w-5 h-5 text-brand-600" />
                           </div>
                           
                           <div className="max-w-[90%] flex flex-col items-start space-y-2">
                              
                              {/* Tool Call Pills */}
                              {msg.toolCalls && msg.toolCalls.length > 0 && (
                                  <div className="flex flex-col gap-2 mb-1">
                                      {msg.toolCalls.map((toolCall, idx) => (
                                          <button 
                                            key={idx}
                                            onClick={() => setSelectedToolCall(toolCall)}
                                            className="flex items-center gap-2 pl-3 pr-4 py-2 bg-slate-900 text-slate-300 rounded-xl text-xs font-mono hover:bg-slate-800 transition-colors shadow-sm border border-slate-800 group w-fit"
                                          >
                                              <Hammer className="w-3.5 h-3.5 text-brand-400" />
                                              <span className="font-bold text-white">{toolCall.status === 'running' ? 'RUNNING TOOL' : 'TOOL CALLED'}</span>
                                              <span className="text-slate-500">|</span>
                                              <span className="text-slate-400">{toolCall.name}</span>
                                              <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors ml-1" />
                                          </button>
                                      ))}
                                  </div>
                              )}

                              {/* Thinking Indicator */}
                              {msg.isStreaming && (
                                  <div className="flex items-center gap-3 animate-fade-in pl-1">
                                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-md shadow-brand-500/20 shrink-0 ring-1 ring-white">
                                          <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
                                      </div>
                                      <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm">
                                          <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-600" />
                                          <span className="text-xs font-bold text-slate-700">Thinking...</span>
                                      </div>
                                  </div>
                              )}

                              {/* Content Bubble */}
                              {(msg.content || (!msg.isStreaming && (!msg.toolCalls || msg.toolCalls.length === 0))) && (
                                  <div className={`px-5 py-3.5 rounded-2xl rounded-tl-sm shadow-sm text-sm leading-relaxed whitespace-pre-wrap
                                    ${msg.error 
                                        ? 'bg-red-50 border border-red-200 text-red-800' 
                                        : 'bg-white border border-slate-200 text-slate-700'
                                    }`}
                                  >
                                    {msg.content}
                                    {msg.isStreaming && (
                                        <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-brand-400 animate-pulse" />
                                    )}
                                  </div>
                              )}
                              
                              {/* Actions Bar (Copy & Metrics) */}
                              {!msg.isStreaming && !msg.error && (
                                  <div className="flex items-center gap-1 px-1">
                                      <button 
                                          onClick={() => navigator.clipboard.writeText(msg.content)}
                                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                          title="Copy to clipboard"
                                      >
                                          <Copy className="w-4 h-4" />
                                      </button>
                                      
                                      {msg.metrics && (
                                          <button 
                                              onClick={() => toggleMetrics(msg.id)}
                                              className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 ${expandedMetricsId === msg.id ? 'text-brand-600 bg-brand-50 ring-1 ring-brand-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                                              title="View Run Metrics"
                                          >
                                              <BarChart2 className="w-4 h-4" />
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

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-200">
           <div className="max-w-3xl mx-auto">
              <div className="relative flex items-center gap-3 bg-white rounded-xl border border-slate-200 p-2 pl-4 shadow-sm focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-500 transition-all">
                  <input
                    className="flex-1 py-2 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:cursor-not-allowed"
                    placeholder={isLoadingAgents ? "Loading agents..." : "Ask anything about your data..."}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    disabled={isTyping || isLoadingAgents || !selectedAgentId}
                  />
                  <div className="absolute inset-x-0 bottom-0 top-0 pointer-events-none rounded-xl bg-gradient-to-r from-transparent via-transparent to-white/10" />
                  <div className="flex items-center gap-2">
                      <button
                        className={`h-9 w-9 flex items-center justify-center rounded-lg transition-all duration-200 ${
                          inputValue.trim() && !isTyping && selectedAgentId
                            ? 'bg-brand-600 text-white shadow-md hover:bg-brand-500 transform hover:scale-105' 
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                        disabled={!inputValue.trim() || isTyping || !selectedAgentId}
                        onClick={handleSend}
                      >
                        {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </button>
                  </div>
              </div>
              <div className="text-center mt-2 flex items-center justify-center gap-1.5">
                 <span className="text-[10px] text-slate-400">AI can make mistakes. Verify important information.</span>
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
