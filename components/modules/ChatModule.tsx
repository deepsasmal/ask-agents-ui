

import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, MessageSquare, Bot, User, MoreHorizontal, History, ChevronDown, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Common';
import { agentApi, Agent } from '../../services/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  error?: boolean;
}

export const ChatModule: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [isLoadingAgents, setIsLoadingAgents] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
        isStreaming: true
    };

    setMessages(prev => [...prev, newUserMsg, newBotMsg]);
    setIsTyping(true);

    try {
        await agentApi.runAgent(selectedAgentId, userText, (chunk) => {
            setMessages(prev => prev.map(msg => {
                if (msg.id === botMsgId) {
                    return { ...msg, content: msg.content + chunk };
                }
                return msg;
            }));
        });
        
        // Mark as finished streaming
        setMessages(prev => prev.map(msg => 
            msg.id === botMsgId ? { ...msg, isStreaming: false } : msg
        ));

    } catch (error) {
        console.error('Chat error:', error);
        setMessages(prev => prev.map(msg => 
            msg.id === botMsgId ? { 
                ...msg, 
                content: "I'm sorry, I encountered an error while processing your request.", 
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
      setMessages([
        {
            id: Date.now().toString(),
            role: 'assistant',
            content: `Hello! I am ${agent?.name || 'your assistant'}. Starting a new conversation.`,
            timestamp: new Date()
        }
      ]);
  };

  return (
    <div className="flex h-full bg-slate-50 overflow-hidden">
      
      {/* Chat Sidebar / History */}
      <div className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0 z-20">
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
              <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center border border-brand-100">
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
                 <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${isLoadingAgents ? 'bg-slate-300' : 'bg-green-500 animate-pulse'}`}></span>
                    <p className="text-xs text-slate-500">{isLoadingAgents ? 'Connecting...' : 'Online'}</p>
                 </div>
              </div>
           </div>
           
           <button className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <MoreHorizontal className="w-5 h-5" />
           </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex gap-4 max-w-3xl mx-auto ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
               <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border 
                  ${msg.role === 'user' ? 'bg-white border-slate-200' : 'bg-brand-50 border-brand-100 text-brand-600'}`}>
                  {msg.role === 'user' ? <User className="w-4 h-4 text-slate-600" /> : <Bot className="w-4 h-4" />}
               </div>
               
               <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[80%]`}>
                  <div className={`px-5 py-3.5 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap
                    ${msg.role === 'user' 
                      ? 'bg-brand-600 text-white rounded-tr-sm' 
                      : msg.error 
                        ? 'bg-red-50 border border-red-200 text-red-800 rounded-tl-sm'
                        : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm'
                    }`}
                  >
                    {msg.content}
                    {msg.isStreaming && (
                        <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-brand-400 animate-pulse" />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1.5 px-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
               </div>
            </div>
          ))}
          
          {/* Typing Indicator (Only if sending but before stream starts or purely visual) */}
          {isTyping && messages[messages.length - 1]?.role === 'user' && (
             <div className="flex gap-4 max-w-3xl mx-auto">
                <div className="w-8 h-8 rounded-full bg-brand-50 border border-brand-100 text-brand-600 flex items-center justify-center shrink-0">
                   <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1">
                   <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                   <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                   <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-200">
           <div className="max-w-3xl mx-auto relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-200 to-indigo-200 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
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
              <div className="text-center mt-2">
                 <span className="text-[10px] text-slate-400">AI can make mistakes. Verify important information.</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
