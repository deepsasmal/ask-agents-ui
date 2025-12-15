import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Bot, MoreHorizontal, Loader2, Sparkles, Copy, BarChart2, Hammer, X, Terminal, Code, Paperclip, ArrowUp, Check, User, Square } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ToolVisualization, ToolCall } from '../chat/ToolVisualization';
import { ChartRenderer } from '../chat/ChartRenderer';
import { agentApi, configApi, sessionApi, authApi, Agent, RunMetrics } from '../../services/api';
import { ExploredGraphModal } from '../modals/ExploredGraphModal';
import { ChartModal } from '../modals/ChartModal';
// NOTE: `assets/` is configured as Vite `publicDir`, so assets are served from the root path.
const chatbotLogo = '/chatbot_logo.png';
import { toast } from 'react-toastify';

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
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

interface ChatModuleProps {
    sessionId: string;
    onSessionUpdate: () => void;
}

interface DbConfig {
    dbId: string;
    table: string;
    componentId?: string; // agent_id/team_id/workflow_id
}

export const ChatModule: React.FC<ChatModuleProps> = ({ sessionId, onSessionUpdate }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [selectedAgentId, setSelectedAgentId] = useState<string>('');
    const [isLoadingAgents, setIsLoadingAgents] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [expandedMetricsId, setExpandedMetricsId] = useState<string | null>(null);
    const [selectedToolCall, setSelectedToolCall] = useState<ToolCall | null>(null);
    const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

    // DB Config for loading session history
    const [dbConfig, setDbConfig] = useState<DbConfig | null>(null);

    // Graph Modal State
    const [isGraphModalOpen, setIsGraphModalOpen] = useState(false);
    const [graphModalData, setGraphModalData] = useState<any>(null);

    // Chart Modal State
    const [isChartModalOpen, setIsChartModalOpen] = useState(false);
    const [chartModalData, setChartModalData] = useState<any>(null);

    // File Attachment State
    const [files, setFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // UI States
    const [showAgentMenu, setShowAgentMenu] = useState(false);
    const [isInputFocused, setIsInputFocused] = useState(false);

    // Streaming status (rotates every ~3s while assistant is streaming)
    const STREAMING_VERBS = useMemo(
        () => [
            'Generating',
            'Analyzing',
            'Computing',
            'Working',
            'Evaluating',
            'Processing',
            'Reasoning',
            'Inferring',
            'Synthesizing',
            'Structuring',
            'Scanning',
            'Drafting',
            'Parsing',
            'Interpreting',
            'Assessing',
            'Calculating',
            'Planning',
        ],
        []
    );
    const [streamVerb, setStreamVerb] = useState<string>('Generating');

    // Mention / Agent Switch States
    const [showMentionPopup, setShowMentionPopup] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');
    const [mentionSelectedIndex, setMentionSelectedIndex] = useState(0);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const metricsRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const agentMenuRef = useRef<HTMLDivElement>(null);

    // Guard against double initialization in Strict Mode
    const initializedRef = useRef(false);
    const currentRunRef = useRef<{ abort: AbortController; botMsgId: string; agentId: string; runId?: string } | null>(null);

    const getFirstName = useCallback(() => {
        const display = (authApi.getUserDisplayName?.() || authApi.getCurrentUser?.() || '').trim();
        if (!display) return 'there';
        // If it's an email, take part before '@'
        const base = display.includes('@') ? display.split('@')[0] : display;
        const cleaned = base.replace(/[._-]+/g, ' ').trim();
        const first = cleaned.split(/\s+/)[0];
        return first ? first[0].toUpperCase() + first.slice(1) : 'there';
    }, []);

    const getGreeting = useCallback((name: string) => {
        const hour = new Date().getHours();
        const period: 'morning' | 'afternoon' | 'evening' =
            hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';

        const options: Record<typeof period, string[]> = {
            morning: [
                `Good morning, ${name}`,
                `Morning, ${name}`,
                `Hope your morning’s going well, ${name}`
            ],
            afternoon: [
                `Good afternoon, ${name}`,
                `Hope your day’s going well, ${name}`,
                `Hi ${name} — ready when you are`
            ],
            evening: [
                `Good evening, ${name}`,
                `Hope you’re having a good evening, ${name}`,
                `Hi ${name} — let’s pick up where you left off`
            ]
        };

        // Deterministic pick (avoid flicker between renders)
        const seed = `${period}|${name}|${new Date().toDateString()}`;
        let h = 0;
        for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
        const arr = options[period];
        return arr[h % arr.length];
    }, []);

    const heroGreeting = useMemo(() => {
        const name = getFirstName();
        return getGreeting(name);
    }, [getFirstName, getGreeting, sessionId]);

    const hasStreamingAssistant = useMemo(
        () => messages.some(m => m.role === 'assistant' && m.isStreaming),
        [messages]
    );

    useEffect(() => {
        if (!hasStreamingAssistant) return;

        const pickNext = (prev?: string) => {
            if (STREAMING_VERBS.length === 0) return 'Working';
            if (STREAMING_VERBS.length === 1) return STREAMING_VERBS[0];
            let next = prev;
            while (next === prev) {
                next = STREAMING_VERBS[Math.floor(Math.random() * STREAMING_VERBS.length)];
            }
            return next || STREAMING_VERBS[0];
        };

        setStreamVerb(prev => pickNext(prev));
        const interval = window.setInterval(() => {
            setStreamVerb(prev => pickNext(prev));
        }, 3000);

        return () => window.clearInterval(interval);
    }, [hasStreamingAssistant, STREAMING_VERBS]);

    // Initialize: Fetch Agents and Config
    useEffect(() => {
        if (initializedRef.current) return;
        initializedRef.current = true;

        const initialize = async () => {
            try {
                setIsLoadingAgents(true);

                // 1. Fetch Agents
                const fetchedAgents = await agentApi.getAgents();
                setAgents(fetchedAgents);
                if (fetchedAgents.length > 0) {
                    setSelectedAgentId(fetchedAgents[0].id);
                    // New session hero is rendered when there are no messages
                    setMessages([]);
                } else {
                    setFetchError('No agents available.');
                }

                // 2. Fetch Config
                const configData = await configApi.getConfig();
                if (configData.session?.dbs?.length > 0 && configData.session.dbs[0].tables.length > 0) {
                    // Extract component_id from config (prioritize db-level, fallback to session-level)
                    const componentId = configData.session.dbs[0].component_id || configData.session.component_id;
                    
                    const config = {
                        dbId: configData.session.dbs[0].db_id,
                        table: configData.session.dbs[0].tables[0],
                        componentId: componentId
                    };
                    setDbConfig(config);
                }

            } catch (err) {
                console.error('Failed to initialize chat:', err);
                setFetchError('Failed to load chat resources.');
            } finally {
                setIsLoadingAgents(false);
            }
        };

        initialize();
    }, []);

    // Load session when sessionId changes
    useEffect(() => {
        const loadSession = async () => {
            const userId = authApi.getCurrentUser();
            if (!userId || !dbConfig) return;

            try {
                const sessionData = await sessionApi.getSession(sessionId, userId, dbConfig.dbId, dbConfig.table, dbConfig.componentId);

                if (sessionData && sessionData.chat_history && sessionData.chat_history.length > 0) {
                    // Set the active session ID for future requests
                    // If agent_id is present, switch to that agent
                    if (sessionData.agent_id) {
                        setSelectedAgentId(sessionData.agent_id);
                    }

                    // Map history
                    const history = sessionData.chat_history || sessionData.messages || [];
                    const mappedMessages: Message[] = history
                        // New history responses may contain extra roles (e.g., "tool"). The UI only renders user/assistant bubbles.
                        .filter((m: any) => m.role === 'user' || m.role === 'assistant')
                        .map((m: any, idx: number) => {
                            // Parse tool calls from the new API format
                            let toolCalls: ToolCall[] | undefined;
                            if (m.tool_calls && Array.isArray(m.tool_calls)) {
                                toolCalls = m.tool_calls.map((tc: any) => {
                                    // Parse arguments if they're a JSON string
                                    let args = tc.function?.arguments;
                                    if (typeof args === 'string') {
                                        try {
                                            args = JSON.parse(args);
                                        } catch (e) {
                                            console.warn('Failed to parse tool arguments:', args);
                                        }
                                    }

                                    return {
                                        id: tc.id || tc.tool_call_id || 'unknown',
                                        name: tc.function?.name || tc.tool_name || 'unknown',
                                        args: args || tc.tool_args || {},
                                        status: 'completed',
                                        result: tc.result,
                                        duration: tc.metrics?.duration
                                    };
                                });
                            }

                            return {
                                id: m.id || `hist-${idx}-${m.created_at || Date.now()}`,
                                role: m.role,
                                content: m.content || '',
                                timestamp: new Date(m.created_at ? m.created_at * 1000 : Date.now()),
                                metrics: m.metrics,
                                toolCalls: toolCalls
                            };
                        });

                    // Ensure display order always follows timestamps (API runs can contain merged history).
                    mappedMessages.sort((a, b) => {
                        const ta = a.timestamp?.getTime?.() || 0;
                        const tb = b.timestamp?.getTime?.() || 0;
                        if (ta !== tb) return ta - tb;
                        if (a.role !== b.role) return a.role === 'user' ? -1 : 1;
                        return 0;
                    });

                    setMessages(mappedMessages);
                } else {
                    // New session - show welcome message
                    // New session - show hero (no messages)
                    setMessages([]);
                }
            } catch (err) {
                console.error("Failed to load session", err);
                // New session - show welcome message
                setMessages([]);
            }
        };

        if (dbConfig && agents.length > 0) {
            loadSession();
        }
    }, [sessionId, dbConfig, agents.length]);

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

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, []);

    // Scroll behavior logic - scroll user question to top when sent
    useEffect(() => {
        if (messages.length === 0) return;
        const lastMsg = messages[messages.length - 1];

        // When user sends a message, immediately scroll that question to the top
        if (lastMsg.role === 'user') {
            setTimeout(() => {
                const el = document.getElementById(`message-${lastMsg.id}`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 30);
            return;
        }

        // If the last message is the bot's streaming response, scroll user question to top
        if (lastMsg.role === 'assistant' && lastMsg.isStreaming) {
            const prevMsg = messages[messages.length - 2];
            if (prevMsg?.role === 'user') {
                // Use setTimeout to ensure DOM is updated
                setTimeout(() => {
                    const el = document.getElementById(`message-${prevMsg.id}`);
                    if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }, 50);
                return;
            }
        }

        // For completed messages, scroll to bottom
        if (!lastMsg.isStreaming) {
            scrollToBottom();
        }
    }, [messages.length, selectedAgentId]);

    // Handle Input Change for Mentions
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setInputValue(val);

        const cursor = e.target.selectionStart;
        const textBeforeCursor = val.slice(0, cursor);

        // Regex to detect @word at the end of the string (or cursor position)
        const match = textBeforeCursor.match(/@(\w*)$/);

        if (match) {
            setMentionQuery(match[1].toLowerCase());
            setShowMentionPopup(true);
            setMentionSelectedIndex(0);
        } else {
            setShowMentionPopup(false);
        }
    };

    // Memoized filtered agents list - only recalculates when agents or query changes
    const filteredAgents = useMemo(() =>
        agents.filter(a => a.name.toLowerCase().includes(mentionQuery)),
        [agents, mentionQuery]
    );

    const handleMentionSelect = (agent: Agent) => {
        // Switch active agent (preserve session)
        setSelectedAgentId(agent.id);

        // Remove the @query part from input
        const cursor = textareaRef.current?.selectionStart || 0;
        const textBefore = inputValue.slice(0, cursor);
        const textAfter = inputValue.slice(cursor);

        const lastAt = textBefore.lastIndexOf('@');
        if (lastAt !== -1) {
            const newValue = textBefore.slice(0, lastAt) + textAfter; // Clean remove
            setInputValue(newValue);

            // Reset cursor
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.selectionStart = lastAt;
                    textareaRef.current.selectionEnd = lastAt;
                    textareaRef.current.focus();
                }
            }, 0);
        }
        setShowMentionPopup(false);
    };

    const handleStop = () => {
        if (!currentRunRef.current) return;
        const { abort, agentId, runId, botMsgId } = currentRunRef.current;

        // Best-effort server-side cancel (graceful stop)
        if (runId) {
            agentApi.cancelRun(agentId, runId).catch((e) => {
                // Don't surface cancel errors to the user; local abort still stops UI stream.
                console.warn('Failed to cancel run:', e);
            });
        }

        // Always abort local stream so UI stops immediately
        abort.abort();

        // Mark the current streaming message as stopped
        setMessages(prev => prev.map(msg => {
            if (msg.id === botMsgId) {
                const hasAnyContent = Boolean(msg.content && msg.content.trim());
                return {
                    ...msg,
                    isStreaming: false,
                    content: hasAnyContent ? msg.content : 'Stopped.'
                };
            }
            return msg;
        }));
        setIsTyping(false);
        currentRunRef.current = null;
    };

    const handleSend = async (overrideText?: string) => {
        const userId = authApi.getCurrentUser();
        const effectiveInput = (overrideText ?? inputValue).trim();
        // Allow typing while generating, but do not allow sending a new message until current run stops/completes.
        if (isTyping) return;
        if ((!effectiveInput && files.length === 0) || !selectedAgentId || !userId) return;

        const userText = effectiveInput;
        const currentFiles = files;

        setInputValue('');
        setFiles([]);
        setShowMentionPopup(false);

        if (fileInputRef.current) fileInputRef.current.value = '';
        if (textareaRef.current) textareaRef.current.style.height = 'auto';

        setExpandedMetricsId(null);
        setSelectedToolCall(null);

        const newUserMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: userText + (currentFiles.length > 0 ? `\n[Attached ${currentFiles.length} file(s)]` : ''),
            timestamp: new Date()
        };

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
            const abort = new AbortController();
            currentRunRef.current = { abort, botMsgId, agentId: selectedAgentId };

            await agentApi.runAgent(selectedAgentId, userText, sessionId, userId, currentFiles, (event, data) => {
                if (event === 'RunStarted') {
                    // Capture run_id so Stop can call /cancel
                    const runId = data?.run_id || data?.runId || data?.id;
                    if (currentRunRef.current && currentRunRef.current.botMsgId === botMsgId && runId) {
                        currentRunRef.current.runId = String(runId);
                    }
                    return;
                }
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
                    // Notify parent to refresh sessions
                    onSessionUpdate();
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
            // If user stopped the stream, don't show as an error.
            const maybeErr = error as any;
            if (maybeErr?.name === 'AbortError') {
                // handled by handleStop() UI update
                return;
            }
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
            currentRunRef.current = null;
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (showMentionPopup && filteredAgents.length > 0) {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setMentionSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredAgents.length - 1));
                return;
            }
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setMentionSelectedIndex(prev => (prev < filteredAgents.length - 1 ? prev + 1 : 0));
                return;
            }
            if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                handleMentionSelect(filteredAgents[mentionSelectedIndex]);
                return;
            }
            if (e.key === 'Escape') {
                setShowMentionPopup(false);
                return;
            }
        }

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!isTyping) handleSend();
        }
    };

    const handleAgentSelect = (agentId: string) => {
        setSelectedAgentId(agentId);
        setShowAgentMenu(false);
        setExpandedMetricsId(null);
        const agent = agents.find(a => a.id === agentId);
    };


    const toggleMetrics = (id: string) => {
        setExpandedMetricsId(prev => prev === id ? null : id);
    };

    const handleCopyMessage = async (messageId: string, text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedMessageId(messageId);
            window.setTimeout(() => {
                setCopiedMessageId(prev => (prev === messageId ? null : prev));
            }, 1000);
        } catch (e) {
            console.error('Failed to copy:', e);
            toast.error('Failed to copy');
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleOpenGraph = (toolResult: string) => {
        try {
            const parsed = typeof toolResult === 'string' ? JSON.parse(toolResult) : toolResult;
            if (parsed && parsed.nodes && parsed.relationships) {
                setGraphModalData(parsed);
                setIsGraphModalOpen(true);
            } else {
                toast.error("Invalid graph data format.");
            }
        } catch (e) {
            console.error("Failed to parse graph data", e);
            toast.error("Failed to parse graph data.");
        }
    };

    const handleOpenChart = (chartOptions: any) => {
        setChartModalData(chartOptions);
        setIsChartModalOpen(true);
    };

    // Memoized selected agent
    const selectedAgent = useMemo(() =>
        agents.find(a => a.id === selectedAgentId),
        [agents, selectedAgentId]
    );

    return (
        <div className="flex h-full bg-slate-50 overflow-hidden relative">
            <style>
                {`
                  @keyframes stream-verb-fade {
                    0% { opacity: 0; transform: translateY(-6px); }
                    20% { opacity: 1; transform: translateY(0); }
                    80% { opacity: 1; transform: translateY(0); }
                    100% { opacity: 0; transform: translateY(6px); }
                  }
                  .animate-stream-verb {
                    animation: stream-verb-fade 3s ease-in-out infinite;
                    will-change: opacity, transform;
                  }
                `}
            </style>

            <ExploredGraphModal
                isOpen={isGraphModalOpen}
                onClose={() => setIsGraphModalOpen(false)}
                data={graphModalData}
            />

            <ChartModal
                isOpen={isChartModalOpen}
                onClose={() => setIsChartModalOpen(false)}
                chartOptions={chartModalData}
                title="Bar Chart - Expanded View"
            />

            {/* Hidden File Input */}
            <input
                type="file"
                multiple
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileSelect}
            />

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-slate-50 relative w-full">
                {/* Simplified Header */}
                <div className="h-12 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-center px-4 sticky top-0 z-30 relative">
                    <div className="flex items-center gap-2.5">
                        <img src={chatbotLogo} alt="Chat" className="w-7 h-7 rounded-lg object-cover shadow-sm" />
                        <span className="font-bold text-slate-900 text-sm">Chat</span>
                    </div>

                    <button className="absolute right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth pb-6">
                    {/* New Session Hero */}
                    {messages.length === 0 && !isLoadingAgents && !fetchError && (
                        <div className="h-full w-full flex items-center justify-center">
                            <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center py-16">
                                <div className="w-full max-w-2xl mx-auto text-center mb-8">
                                    <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                                        {heroGreeting}
                                    </div>
                                </div>

                                {/* Only show suggested questions for a new session */}
                                <div className="flex flex-wrap items-center justify-center gap-3">
                                    {[
                                        'Which tools do you have access to?',
                                        'Tell me about yourself',
                                        "What's your special skill?"
                                    ].map((preset) => (
                                        <button
                                            key={preset}
                                            onClick={() => handleSend(preset)}
                                            className="px-4 py-2 rounded-2xl bg-white border border-slate-200/60 shadow-sm text-sm text-slate-900 transition-all
                                                hover:bg-slate-50 hover:border-emerald-500 hover:ring-2 hover:ring-emerald-100
                                                focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:border-emerald-500
                                            "
                                        >
                                            {preset}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            id={`message-${msg.id}`}
                            className="w-full max-w-4xl mx-auto scroll-mt-20"
                        >
                            {msg.role === 'user' ? (
                                // User Message
                                <div className="flex gap-4 flex-row-reverse animate-fade-in group">
                                    <div className="max-w-[85%]">
                                        <div className="px-4 py-3 bg-brand-50 text-slate-900 rounded-2xl rounded-tr-sm border border-brand-100 text-sm leading-relaxed whitespace-pre-wrap shadow-sm">
                                            {msg.content}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                // Assistant Message
                                <div className="flex flex-col gap-2">
                                    <div className="flex gap-3 animate-fade-in items-start group">
                                        <img src={chatbotLogo} alt="Chat" className="w-7 h-7 rounded-full object-cover shrink-0 shadow-sm" />

                                        <div className="flex-1 min-w-0 flex flex-col items-start space-y-2">

                                            {/* Tool Call Pills and Visualizations */}
                                            {msg.toolCalls && msg.toolCalls.length > 0 && (
                                                <div className="flex flex-wrap items-center gap-2 mb-1 w-full">
                                                    {msg.toolCalls.map((toolCall, idx) => (
                                                        <ToolVisualization
                                                            key={idx}
                                                            toolCall={toolCall}
                                                            onOpenGraph={handleOpenGraph}
                                                            onSelectToolCall={setSelectedToolCall}
                                                            isCollapsed={!msg.isStreaming && msg.toolCalls?.every(tc => tc.status !== 'running')}
                                                        />
                                                    ))}
                                                </div>
                                            )}

                                            {/* Bar Chart Rendering - Rendered in Chat UI */}
                                            {msg.toolCalls && msg.toolCalls.some(tc => tc.name === 'create_bar_chart' && tc.status === 'completed' && tc.result) && (
                                                (() => {
                                                    const chartToolCall = msg.toolCalls.find(tc => tc.name === 'create_bar_chart' && tc.status === 'completed' && tc.result);
                                                    return chartToolCall ? (
                                                        <ChartRenderer
                                                            toolResult={chartToolCall.result}
                                                            chartType="bar"
                                                            onExpand={handleOpenChart}
                                                        />
                                                    ) : null;
                                                })()
                                            )}

                                            {/* Line Chart Rendering - Rendered in Chat UI */}
                                            {msg.toolCalls && msg.toolCalls.some(tc => tc.name === 'create_basic_line_chart' && tc.status === 'completed' && tc.result) && (
                                                (() => {
                                                    const chartToolCall = msg.toolCalls.find(tc => tc.name === 'create_basic_line_chart' && tc.status === 'completed' && tc.result);
                                                    return chartToolCall ? (
                                                        <ChartRenderer
                                                            toolResult={chartToolCall.result}
                                                            chartType="line"
                                                            onExpand={handleOpenChart}
                                                        />
                                                    ) : null;
                                                })()
                                            )}

                                            {/* Grouped Bar Chart Rendering - Rendered in Chat UI */}
                                            {msg.toolCalls && msg.toolCalls.some(tc => tc.name === 'create_grouped_bar_chart' && tc.status === 'completed' && tc.result) && (
                                                (() => {
                                                    const chartToolCall = msg.toolCalls.find(tc => tc.name === 'create_grouped_bar_chart' && tc.status === 'completed' && tc.result);
                                                    return chartToolCall ? (
                                                        <ChartRenderer
                                                            toolResult={chartToolCall.result}
                                                            chartType="bar"
                                                            onExpand={handleOpenChart}
                                                        />
                                                    ) : null;
                                                })()
                                            )}

                                            {/* Pie Chart Rendering - Rendered in Chat UI */}
                                            {(() => {
                                                console.log('🥧 Checking for pie chart in message:', msg.id);
                                                console.log('🥧 msg.toolCalls:', msg.toolCalls);
                                                const hasPieChart = msg.toolCalls && msg.toolCalls.some(tc => tc.name === 'create_pie_chart' && tc.status === 'completed' && tc.result);
                                                console.log('🥧 Has pie chart?', hasPieChart);
                                                
                                                if (hasPieChart) {
                                                    const chartToolCall = msg.toolCalls.find(tc => tc.name === 'create_pie_chart' && tc.status === 'completed' && tc.result);
                                                    console.log('🥧 Chart tool call:', chartToolCall);
                                                    return chartToolCall ? (
                                                        <ChartRenderer
                                                            toolResult={chartToolCall.result}
                                                            chartType="pie"
                                                            onExpand={handleOpenChart}
                                                        />
                                                    ) : null;
                                                }
                                                return null;
                                            })()}

                                            {/* Streaming Indicator */}
                                            {msg.isStreaming && !msg.content && (
                                                <div className="flex items-center gap-2 text-slate-500 animate-fade-in h-7 select-none">
                                                    {/* Top-to-down fading "signal" bars */}
                                                    <div className="flex flex-col gap-1">
                                                        <span className="block w-6 h-[2px] rounded-full bg-gradient-to-r from-emerald-500/0 via-emerald-500/60 to-emerald-500/0 animate-stream-verb" />
                                                        <span className="block w-6 h-[2px] rounded-full bg-gradient-to-r from-emerald-500/0 via-emerald-500/40 to-emerald-500/0 animate-stream-verb" style={{ animationDelay: '300ms' }} />
                                                        <span className="block w-6 h-[2px] rounded-full bg-gradient-to-r from-emerald-500/0 via-emerald-500/30 to-emerald-500/0 animate-stream-verb" style={{ animationDelay: '600ms' }} />
                                                    </div>

                                                    <span className="text-[11px] font-semibold tracking-wide">
                                                        <span className="inline-block animate-stream-verb">{streamVerb}</span>
                                                    </span>
                                                </div>
                                            )}

                                            {/* Content - Clean Markdown */}
                                            {(msg.content || (!msg.isStreaming && (!msg.toolCalls || msg.toolCalls.length === 0))) && (
                                                <div className={`text-sm leading-relaxed w-full ${msg.error ? 'text-red-600' : 'text-slate-800'} prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:text-slate-50 prose-pre:rounded-xl prose-code:text-brand-700 prose-code:bg-brand-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-headings:text-slate-900 prose-headings:font-bold prose-a:text-brand-600 prose-strong:text-slate-900 prose-table:w-full prose-table:border-collapse prose-th:text-left prose-th:p-2 prose-th:bg-brand-50 prose-th:text-brand-700 prose-th:border prose-th:border-brand-100 prose-td:p-2 prose-td:border prose-td:border-slate-200 prose-td:bg-white`}>
                                                    <ReactMarkdown
                                                        remarkPlugins={[remarkGfm]}
                                                        components={{
                                                            table: ({ node, ...props }: any) => (
                                                                <div className="overflow-x-auto w-full my-2 rounded-lg border border-slate-200 shadow-sm">
                                                                    <table {...props} />
                                                                </div>
                                                            )
                                                        }}
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
                                                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                                                        className={`p-1.5 rounded-lg transition-colors flex items-center gap-1.5
                                                            ${copiedMessageId === msg.id ? 'text-emerald-700 bg-emerald-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}
                                                        `}
                                                        title={copiedMessageId === msg.id ? 'Copied' : 'Copy to clipboard'}
                                                    >
                                                        {copiedMessageId === msg.id ? (
                                                            <>
                                                                <Check className="w-3.5 h-3.5" />
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Copy className="w-3.5 h-3.5" />
                                                            </>
                                                        )}
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
                                                            <span className="font-mono text-slate-900">{msg.metrics.time_to_first_token !== undefined ? msg.metrics.time_to_first_token.toFixed(3) + ' s' : 'N/A'}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-slate-500">Run Duration</span>
                                                            <span className="font-mono text-slate-900">{msg.metrics.duration !== undefined ? msg.metrics.duration.toFixed(3) + ' s' : 'N/A'}</span>
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
                {/* Input Area - Collapsible Minimal Design */}
                <div className="w-full px-4 pb-4 pt-2 shrink-0 z-20 flex justify-center">
                    <div className={`transition-all duration-300 ease-out ${isInputFocused ? 'w-full max-w-4xl' : 'w-full max-w-md'}`}>
                        <div
                            className={`
                                relative bg-white rounded-2xl transition-all duration-300 ease-out
                                ${isInputFocused ? 'shadow-lg shadow-brand-100/50 ring-2 ring-brand-200 border border-transparent' : 'shadow-md border border-slate-200/60'}
                                ${isTyping ? 'opacity-80' : ''}
                            `}
                        >
                            {/* Mention Popup - Only when focused */}
                            {isInputFocused && showMentionPopup && filteredAgents.length > 0 && (
                                <div className="absolute bottom-full left-0 mb-3 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-fade-in-up z-50 ring-1 ring-black/5">
                                    <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                                        <Bot className="w-3 h-3" />
                                        Switch Agent
                                    </div>
                                    <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                                        {filteredAgents.map((agent, idx) => (
                                            <button
                                                key={agent.id}
                                                onClick={() => handleMentionSelect(agent)}
                                                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs flex items-center gap-3 transition-colors
                                                    ${idx === mentionSelectedIndex ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-50'}
                                                `}
                                            >
                                                <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 border
                                                    ${idx === mentionSelectedIndex ? 'bg-brand-100 border-brand-200 text-brand-600' : 'bg-white border-slate-200 text-slate-400'}
                                                `}>
                                                    <User className="w-3.5 h-3.5" />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="font-bold truncate">{agent.name}</span>
                                                </div>
                                                {selectedAgentId === agent.id && <Check className="w-3.5 h-3.5 ml-auto text-brand-600" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col">
                                {/* File Previews - Only when focused and has files */}
                                <div className={`overflow-hidden transition-all duration-300 ease-out ${isInputFocused && files.length > 0 ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <div className="flex flex-wrap gap-2 px-3 pt-3">
                                        {files.map((file, idx) => (
                                            <div key={idx} className="flex items-center gap-2 pl-3 pr-2 py-1 bg-slate-50 border border-slate-200 rounded-lg group transition-all hover:bg-slate-100 hover:border-slate-300">
                                                <div className="flex flex-col max-w-[150px]">
                                                    <span className="text-[10px] font-semibold text-slate-700 truncate" title={file.name}>{file.name}</span>
                                                    <span className="text-[9px] text-slate-400 font-mono">{(file.size / 1024).toFixed(0)}KB</span>
                                                </div>
                                                <button
                                                    onClick={() => removeFile(idx)}
                                                    className="p-0.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Main Input Row - Always visible */}
                                <div className={`relative ${isInputFocused ? 'flex items-center gap-2 px-3 py-2' : 'flex items-center justify-center px-3 py-2'}`}>
                                    <textarea
                                        ref={textareaRef}
                                        className={`bg-transparent border-none ring-0 focus:ring-0 focus:outline-none outline-none shadow-none focus:shadow-none resize-none text-sm text-slate-900 placeholder:text-slate-400 overflow-y-auto custom-scrollbar transition-all duration-300 leading-[36px] ${isInputFocused ? 'flex-1 min-h-[40px] max-h-[120px] text-left placeholder:text-left pr-0 leading-normal' : 'w-full min-h-[36px] max-h-[36px] text-center placeholder:text-center pr-12'}`}
                                        placeholder={isLoadingAgents ? "Loading..." : "Ask anything..."}
                                        value={inputValue}
                                        onChange={handleInputChange}
                                        onKeyDown={handleKeyDown}
                                        onFocus={() => setIsInputFocused(true)}
                                        onBlur={(e) => {
                                            // Don't collapse if clicking inside the input container
                                            if (!e.currentTarget.closest('.relative')?.contains(e.relatedTarget as Node)) {
                                                setTimeout(() => setIsInputFocused(false), 150);
                                            }
                                        }}
                                        disabled={isLoadingAgents || !selectedAgentId}
                                        rows={1}
                                    />

                                    {/* Send Button */}
                                    <button
                                        className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200 shrink-0 ${isInputFocused ? '' : 'absolute right-2 top-1/2 -translate-y-1/2'}`}
                                        onClick={isTyping ? handleStop : handleSend}
                                        disabled={
                                            isTyping
                                                ? false
                                                : (!inputValue.trim() && files.length === 0) || !selectedAgentId
                                        }
                                        title={isTyping ? 'Stop generating' : 'Send'}
                                    >
                                        {isTyping ? (
                                            <div className="w-full h-full rounded-xl bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 transition-colors">
                                                <Square className="w-4 h-4 fill-white" />
                                            </div>
                                        ) : (
                                            <div
                                                className={`w-full h-full rounded-xl flex items-center justify-center transition-colors ${(inputValue.trim() || files.length > 0) && selectedAgentId
                                                    ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-md hover:shadow-lg hover:scale-105'
                                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                    }`}
                                            >
                                                <ArrowUp className="w-4 h-4" />
                                            </div>
                                        )}
                                    </button>
                                </div>

                                {/* Bottom Bar - Only when focused */}
                                <div className={`overflow-hidden transition-all duration-300 ease-out ${isInputFocused ? 'max-h-12 opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <div className="flex items-center justify-between px-2.5 pb-2.5 pt-0">
                                        {/* Left: Attachment */}
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="text-slate-400 hover:text-brand-600 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                                            title="Attach files"
                                        >
                                            <Paperclip className="w-4 h-4" />
                                        </button>

                                        {/* Right: Agent Pill */}
                                        <div className="relative" ref={agentMenuRef}>
                                            <button
                                                onClick={() => setShowAgentMenu(!showAgentMenu)}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-brand-50 text-brand-700 rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-brand-100 transition-colors border border-brand-100"
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
                                                            className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-slate-50 transition-colors flex items-center justify-between ${selectedAgentId === agent.id ? 'text-brand-600 bg-brand-50/50' : 'text-slate-700'}`}
                                                        >
                                                            {agent.name}
                                                            {selectedAgentId === agent.id && <Check className="w-3 h-3" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tool Details Sidebar */}
            {selectedToolCall && (
                <div className="absolute top-0 right-0 h-full w-80 lg:w-96 bg-white text-slate-600 shadow-2xl z-50 animate-fade-in-left border-l border-slate-200 flex flex-col">
                    <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
                        <h3 className="font-bold text-slate-900 text-base tracking-tight truncate pr-2">{selectedToolCall.name}</h3>
                        <button onClick={() => setSelectedToolCall(null)} className="text-slate-400 hover:text-slate-700 transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-5">
                        {/* Tool Name */}
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                <Hammer className="w-3 h-3" /> Tool Name
                            </div>
                            <div className="p-2.5 rounded-lg bg-brand-50 border border-brand-200 font-mono text-xs text-brand-700 font-bold break-all">
                                {selectedToolCall.name}
                            </div>
                        </div>

                        {/* Tool Args */}
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                <Terminal className="w-3 h-3" /> Tool Args
                            </div>
                            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[10px] text-slate-700 overflow-x-auto">
                                <pre>{JSON.stringify(selectedToolCall.args, null, 2)}</pre>
                            </div>
                        </div>

                        {/* Metrics */}
                        {selectedToolCall.duration !== undefined && (
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    <BarChart2 className="w-3 h-3" /> Tool Metrics
                                </div>
                                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-slate-500">Duration</span>
                                        <span className="font-mono font-bold text-slate-900">{selectedToolCall.duration.toFixed(4)} ms</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tool Result */}
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                <Code className="w-3 h-3" /> Tool Result
                            </div>
                            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[10px] text-slate-700 overflow-x-auto min-h-[100px]">
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
