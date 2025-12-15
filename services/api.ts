
import { API_BASE_URL } from '../config';
import { WizardState, Column } from '../types';

export class ApiError extends Error {
  constructor(public message: string, public status?: number) {
    super(message);
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail || errorData.message || 'An error occurred';
    throw new ApiError(errorMessage, response.status);
  }
  return response.json();
}

// Interfaces for API Responses
interface ConnectResponse {
  connection_id: string;
  message: string;
}

interface SchemasResponse {
  schemas: string[];
}

interface TablesResponse {
  schema: string;
  tables: string[];
}

interface ColumnData {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  constraints: string | null;
}

interface ColumnsResponse {
  table: string;
  columns: ColumnData[];
}

interface ForeignKeyInfo {
  column_name: string;
  foreign_table_name: string;
  foreign_column_name: string;
  foreign_table_schema: string;
}

interface ForeignKeysResponse {
  table: string;
  foreign_keys: ForeignKeyInfo[];
}

interface AiColumnDesc {
  name: string;
  description: string;
  columns: AiColumnDesc[];
}

interface AiTableDesc {
  name: string;
  description: string;
  columns: AiColumnDesc[];
}

interface AiGenerateResponse {
  tables: AiTableDesc[];
}

// Agent Interface
export interface Agent {
  id: string; // Corresponds to agent_id
  name: string;
  description?: string;
  model?: {
    name: string;
    model: string;
    provider: string;
  };
}

export interface RunMetrics {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  time_to_first_token?: number;
  duration?: number;
}

// Config & Session Interfaces
export interface ConfigResponse {
  session: {
    dbs: Array<{
      db_id: string;
      tables: string[];
      component_id?: string; // agent_id/team_id/workflow_id
    }>;
    component_id?: string; // fallback if not in dbs array
  };
  knowledge?: {
    dbs: Array<{
      db_id: string;
      domain_config: {
        display_name: string;
      };
    }>;
  };
}

export interface Session {
  session_id: string;
  session_name?: string;
  session_state?: any;
  created_at: string | number;
  updated_at: string | number;
}

export interface ToolCallFunction {
  name: string;
  arguments: string | Record<string, any>;
}

export interface ToolCallItem {
  id: string;
  type: string;
  function: ToolCallFunction;
}

export interface SessionMessage {
  id?: string;
  role: string;
  content?: string;
  created_at?: number;
  tool_calls?: ToolCallItem[];
  metrics?: any;
  from_history?: boolean;
  stop_after_tool_call?: boolean;
}

export interface SessionData {
  user_id?: string;
  agent_session_id?: string;
  session_id: string;
  session_name?: string;
  session_summary?: {
    summary: string;
    updated_at: string;
  };
  session_state?: any;
  agent_id?: string;
  total_tokens?: number;
  agent_data?: {
    name: string;
    agent_id: string;
    model: any;
  };
  metrics?: any;
  chat_history?: SessionMessage[];
  messages?: SessionMessage[]; // fallback
  created_at: string | number;
  updated_at: string | number;
}

// --- Session Runs (new history endpoint) ---
interface SessionRunToolEntry {
  result?: any;
  metrics?: any;
  tool_args?: any;
  tool_name?: string;
  tool_call_id?: string;
  tool_call_error?: boolean;
}

interface SessionRunMessage {
  id?: string;
  role: string;
  content?: string;
  created_at?: number;
  from_history?: boolean;
  metrics?: any;
  tool_calls?: Array<{
    id?: string;
    tool_call_id?: string;
    type?: string;
    function?: {
      name?: string;
      arguments?: any;
    };
  }>;
  // Some backends may emit tool message metadata here instead of in `tools`
  tool_name?: string;
  tool_args?: any;
  tool_call_id?: string;
  tool_call_error?: boolean;
}

interface SessionRun {
  run_id: string;
  parent_run_id?: string;
  agent_id?: string;
  user_id?: string;
  run_input?: string;
  content?: string;
  run_response_format?: string;
  metrics?: any;
  messages?: SessionRunMessage[];
  tools?: SessionRunToolEntry[];
  created_at?: string | number;
}

interface SessionsApiResponse {
  data: Session[];
  meta: {
    page: number;
    limit: number;
    total_pages: number;
    total_count: number;
    search_time_ms: number;
  };
}

// Graph API Interfaces
interface GraphColumnProperties {
  type: string;
  is_primary_key?: boolean;
  is_foreign_key?: boolean;
  foreign_key_to?: string;
}

interface GraphColumn {
  name: string;
  description: string;
  properties: GraphColumnProperties;
}

interface GraphTable {
  name: string;
  description: string;
  columns: GraphColumn[];
}

interface GraphMetadata {
  database: string;
  description: string;
  tables: GraphTable[];
}

interface GraphUpdatePayload {
  org_id: string;
  schema_name: string;
  email: string;
  metadata: GraphMetadata;
}

interface GraphUpdateResponse {
  id: string;
  status: string;
  message?: string;
}

export interface GraphMetadataSummary {
  id: string;
  org_id: string;
  schema_name: string;
  created_at?: string;
  updated_at?: string;
}

interface GraphMetadataByEmailResponse {
  records: GraphMetadataSummary[];
}

// Search Interfaces
export interface SearchNodeResult {
  id: number | string;
  labels: string[];
  properties: {
    name: string;
    description?: string;
    datatype?: string;
    [key: string]: any;
  };
  score: number;
}

interface SearchResponse {
  nodes: SearchNodeResult[];
}

// Save Draft Interfaces
interface GraphEditPayload {
  graph_id: string;
  graph_data: {
    nodes: any[];
    relationships: any[];
  };
}

// Auth Interfaces
interface LoginUser {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: string;
  metadata?: Record<string, any>;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
  message?: string;
  user: LoginUser;
}

// Helper to get Auth Headers
export const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Mock Data for Fallback
const MOCK_SEARCH_RESULTS: SearchResponse = {
  "nodes": [
    {
      "id": 1,
      "labels": ["Table"],
      "properties": {
        "name": "customers",
        "description": "Stores information about customers, including contact details, billing, and shipping addresses."
      },
      "score": 4
    },
    {
      "id": 18,
      "labels": ["Column"],
      "properties": {
        "name": "customer_id",
        "datatype": "integer",
        "description": "Foreign key referencing the customers table, identifying the customer who placed the order."
      },
      "score": 3
    },
    {
      "id": 19,
      "labels": ["Column"],
      "properties": {
        "name": "customer_name",
        "datatype": "text",
        "description": "Name of the customer. Redundant data from customer table."
      },
      "score": 2
    },
    {
      "id": 23,
      "labels": ["Column"],
      "properties": {
        "name": "billing_address",
        "datatype": "text",
        "description": "Billing address of the customer."
      },
      "score": 2
    },
    {
      "id": 24,
      "labels": ["Column"],
      "properties": {
        "name": "shipping_address",
        "datatype": "text",
        "description": "Shipping address of the customer."
      },
      "score": 2
    },
    {
      "id": 33,
      "labels": ["Column"],
      "properties": {
        "name": "customer_email",
        "datatype": "text",
        "description": "Email address of the customer. Redundant data from customer table."
      },
      "score": 2
    },
    {
      "id": 34,
      "labels": ["Column"],
      "properties": {
        "name": "customer_company",
        "datatype": "text",
        "description": "Company of the customer. Redundant data from customer table."
      },
      "score": 2
    },
    {
      "id": 20,
      "labels": ["Column"],
      "properties": {
        "name": "contact_person",
        "datatype": "character varying",
        "description": "Name of the contact person for the customer."
      },
      "score": 1
    },
    {
      "id": 21,
      "labels": ["Column"],
      "properties": {
        "name": "email",
        "datatype": "character varying",
        "description": "Email address of the customer."
      },
      "score": 1
    },
    {
      "id": 22,
      "labels": ["Column"],
      "properties": {
        "name": "phone",
        "datatype": "character varying",
        "description": "Phone number of the customer."
      },
      "score": 1
    },
    {
      "id": 35,
      "labels": ["Column"],
      "properties": {
        "name": "customer_intent",
        "datatype": "text",
        "description": "Intent of the customer regarding the quote."
      },
      "score": 1
    },
    {
      "id": 39,
      "labels": ["Column"],
      "properties": {
        "name": "customer_email_subject",
        "datatype": "text",
        "description": "Subject of an email sent to the customer regarding the quote."
      },
      "score": 1
    },
    {
      "id": 40,
      "labels": ["Column"],
      "properties": {
        "name": "customer_email_body",
        "datatype": "text",
        "description": "Body of an email sent to the customer regarding the quote."
      },
      "score": 1
    },
    {
      "id": 3,
      "labels": ["Table"],
      "properties": {
        "name": "quotes",
        "description": "Stores information about quotes, including customer details, dates, totals, and sales representative information."
      },
      "score": 0.5
    },
    {
      "id": 4,
      "labels": ["Table"],
      "properties": {
        "name": "sales_orders",
        "description": "Stores information about sales orders, including customer details, order dates, status, totals, and related quote information."
      },
      "score": 0.5
    }
  ]
};

// Cache for API responses
let cachedConfig: ConfigResponse | null = null;
let cachedAgents: Agent[] | null = null;

export const authApi = {
  login: async (username: string, password: string) => {
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'accept': 'application/json'
      },
      body: params
    });

    const data = await handleResponse<LoginResponse>(response);
    if (data.access_token) {
      localStorage.setItem('auth_token', data.access_token);
      // Store user data for session tracking and profile display
      localStorage.setItem('user_id', username);
      if (data.user) {
        localStorage.setItem('user_first_name', data.user.first_name || '');
        localStorage.setItem('user_last_name', data.user.last_name || '');
        localStorage.setItem('user_email', data.user.email || '');
        localStorage.setItem('user_username', data.user.username || username);
      }
    }
    return data;
  },
  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_first_name');
    localStorage.removeItem('user_last_name');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_username');
    // Clear API caches on logout
    cachedConfig = null;
    cachedAgents = null;
  },
  isAuthenticated: () => {
    return !!localStorage.getItem('auth_token');
  },
  getCurrentUser: () => {
    return localStorage.getItem('user_id');
  },
  getUserDisplayName: () => {
    const firstName = localStorage.getItem('user_first_name');
    const lastName = localStorage.getItem('user_last_name');
    if (firstName || lastName) {
      return `${firstName || ''} ${lastName || ''}`.trim();
    }
    return localStorage.getItem('user_username') || localStorage.getItem('user_id') || 'User';
  },
  getUserInitials: () => {
    const firstName = localStorage.getItem('user_first_name');
    const lastName = localStorage.getItem('user_last_name');
    if (firstName || lastName) {
      const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
      const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
      return `${firstInitial}${lastInitial}` || 'U';
    }
    const username = localStorage.getItem('user_username') || localStorage.getItem('user_id');
    if (username) {
      return username.substring(0, 2).toUpperCase();
    }
    return 'U';
  },
  getUserEmail: () => {
    return localStorage.getItem('user_email') || localStorage.getItem('user_id') || '';
  }
};


export const configApi = {
  getConfig: async () => {
    // Return cached config if available
    if (cachedConfig) {
      return cachedConfig;
    }
    const response = await fetch(`${API_BASE_URL}/config`, {
      headers: { ...getAuthHeaders() }
    });
    const data = await handleResponse<ConfigResponse>(response);
    cachedConfig = data;
    return data;
  },
  clearCache: () => {
    cachedConfig = null;
  }
};

export const sessionApi = {
  getSessions: async (userId: string, dbId: string, table: string, componentId?: string) => {
    const params = new URLSearchParams({
      type: 'agent',
      user_id: userId,
      limit: '20',
      page: '1',
      sort_by: 'created_at',
      sort_order: 'desc',
      db_id: dbId,
      table: table
    });

    // Add component_id if provided
    if (componentId) {
      params.append('component_id', componentId);
    }

    const response = await fetch(`${API_BASE_URL}/sessions?${params.toString()}`, {
      headers: { ...getAuthHeaders() }
    });

    // The API returns a wrapped object { data: [], meta: {} }
    const result = await handleResponse<SessionsApiResponse>(response);
    return result.data;
  },
  getSession: async (sessionId: string, userId: string, dbId: string, table: string, componentId?: string) => {
    // NOTE: Backend now serves history via:
    //   GET /sessions/{sessionId}/runs?session_id={sessionId}&type=agent&db_id=...&table=...
    // `userId` is kept in the signature because callers still pass it, but it's not required by the new endpoint.
    const params = new URLSearchParams({
      session_id: sessionId,
      type: 'agent',
      db_id: dbId,
      table: table
    });

    if (componentId) params.append('component_id', componentId);

    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/runs?${params.toString()}`, {
      headers: { ...getAuthHeaders() }
    });

    const runs = await handleResponse<SessionRun[]>(response);

    // Convert runs -> SessionData (the UI expects chat_history-like messages)
    const chat_history: SessionMessage[] = [];

    const toEpochSeconds = (value: any): number | undefined => {
      if (value === null || value === undefined) return undefined;
      if (typeof value === 'number') {
        // Heuristic: treat large numbers as milliseconds
        return value > 1e12 ? Math.floor(value / 1000) : Math.floor(value);
      }
      if (typeof value === 'string') {
        const d = new Date(value);
        const ms = d.getTime();
        return Number.isFinite(ms) ? Math.floor(ms / 1000) : undefined;
      }
      return undefined;
    };

    const safeJsonParse = (maybeJson: any) => {
      if (typeof maybeJson !== 'string') return maybeJson;
      const s = maybeJson.trim();
      if (!s) return maybeJson;
      // only attempt parse for likely JSON values
      if (!(s.startsWith('{') || s.startsWith('['))) return maybeJson;
      try {
        return JSON.parse(s);
      } catch {
        return maybeJson;
      }
    };

    const sortedRuns = [...(runs || [])].sort((a, b) => {
      const ta =
        toEpochSeconds(a?.created_at) ??
        toEpochSeconds((a?.messages || []).find(m => (m as any).from_history === false)?.created_at) ??
        0;
      const tb =
        toEpochSeconds(b?.created_at) ??
        toEpochSeconds((b?.messages || []).find(m => (m as any).from_history === false)?.created_at) ??
        0;
      return ta - tb;
    });

    for (const run of sortedRuns) {
      const runMessages = Array.isArray(run.messages) ? run.messages : [];
      const runTools = Array.isArray(run.tools) ? run.tools : [];

      const runCreatedAtSec =
        toEpochSeconds(run.created_at) ??
        toEpochSeconds(runMessages.find(m => (m as any).from_history === false)?.created_at) ??
        toEpochSeconds(runMessages[runMessages.length - 1]?.created_at) ??
        undefined;

      // The backend often includes previous conversation in `messages` (from_history=true).
      // For correct ordering, prefer the *current* (from_history=false) user/assistant messages.
      const userCandidates = runMessages.filter(m => m.role === 'user');
      const assistantCandidates = runMessages.filter(m => m.role === 'assistant');
      const userMsg =
        userCandidates.filter(m => (m as any).from_history === false).slice(-1)[0] ??
        userCandidates.slice(-1)[0];
      const assistantMsg =
        assistantCandidates.filter(m => (m as any).from_history === false).slice(-1)[0] ??
        assistantCandidates.slice(-1)[0];

      // Build a tool result lookup by tool_call_id
      const toolResultById = new Map<string, SessionRunToolEntry>();
      for (const t of runTools) {
        const id = t.tool_call_id;
        if (id) toolResultById.set(id, t);
      }
      // Some backends emit tool results as messages with role 'tool'
      for (const m of runMessages) {
        if (m.role !== 'tool') continue;
        const id = m.tool_call_id;
        if (!id) continue;
        if (!toolResultById.has(id)) {
          toolResultById.set(id, {
            result: m.content,
            tool_args: m.tool_args,
            tool_name: m.tool_name,
            tool_call_id: id,
            tool_call_error: m.tool_call_error
          });
        }
      }

      // 1) User message
      if (run.run_input || userMsg?.content) {
        chat_history.push({
          id: userMsg?.id || `run-${run.run_id}-user`,
          role: 'user',
          content: run.run_input || userMsg?.content || '',
          created_at: userMsg?.created_at ?? runCreatedAtSec
        });
      }

      // 2) Assistant message
      if (run.content || assistantMsg?.content) {
        // Tool calls may appear on a different assistant message than the final assistant "content".
        // Collect tool calls from all assistant messages in this run (prefer from_history=false).
        const assistantMsgsWithToolCalls = runMessages.filter(
          m => m.role === 'assistant' && Array.isArray((m as any).tool_calls) && (m as any).tool_calls.length > 0
        ) as SessionRunMessage[];
        const preferredToolCallMsgs = assistantMsgsWithToolCalls.filter(m => (m as any).from_history === false);
        const toolCallMsgs = preferredToolCallMsgs.length ? preferredToolCallMsgs : assistantMsgsWithToolCalls;
        const rawToolCalls = toolCallMsgs.flatMap(m => (Array.isArray(m.tool_calls) ? m.tool_calls : []));

        const enrichedToolCalls = rawToolCalls.map((tc: any) => {
          const callId = tc?.id || tc?.tool_call_id;
          const toolResult = callId ? toolResultById.get(callId) : undefined;
          const parsedResult = safeJsonParse(toolResult?.result);
          return {
            ...tc,
            id: callId,
            result: parsedResult,
            tool_args: toolResult?.tool_args,
            tool_name: toolResult?.tool_name,
            tool_call_error: toolResult?.tool_call_error,
            metrics: toolResult?.metrics
          };
        });

        chat_history.push({
          id: assistantMsg?.id || `run-${run.run_id}-assistant`,
          role: 'assistant',
          content: run.content || assistantMsg?.content || '',
          created_at: assistantMsg?.created_at ?? runCreatedAtSec,
          metrics: run.metrics || assistantMsg?.metrics,
          tool_calls: enrichedToolCalls.length ? (enrichedToolCalls as any) : undefined
        });
      }
    }

    const firstRun = Array.isArray(runs) && runs.length > 0 ? runs[0] : undefined;
    // Ensure message ordering strictly follows timestamps (user sees "responses" in time order)
    const sortedHistory = [...chat_history]
      .map((m, idx) => ({ m, idx }))
      .sort((a, b) => {
        const ta = typeof a.m.created_at === 'number' ? a.m.created_at : 0;
        const tb = typeof b.m.created_at === 'number' ? b.m.created_at : 0;
        if (ta !== tb) return ta - tb;
        // If timestamps tie, show user before assistant
        if (a.m.role !== b.m.role) return a.m.role === 'user' ? -1 : 1;
        return a.idx - b.idx;
      })
      .map(x => x.m);

    chat_history.length = 0;
    chat_history.push(...sortedHistory);

    const createdAt =
      typeof chat_history[0]?.created_at === 'number'
        ? new Date((chat_history[0]!.created_at as number) * 1000).toISOString()
        : Date.now();
    const updatedAt =
      typeof chat_history[chat_history.length - 1]?.created_at === 'number'
        ? new Date((chat_history[chat_history.length - 1]!.created_at as number) * 1000).toISOString()
        : Date.now();

    return {
      session_id: sessionId,
      user_id: firstRun?.user_id || userId,
      agent_id: firstRun?.agent_id,
      chat_history,
      created_at: createdAt,
      updated_at: updatedAt
    };
  },
  deleteSession: async (sessionId: string, dbId: string) => {
    const params = new URLSearchParams({
      db_id: dbId,
      table: 'agno_sessions'
    });

    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}?${params.toString()}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() }
    });

    // Handle 204 No Content response
    if (response.status === 204) {
      return { message: 'Session deleted successfully' };
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || errorData.message || 'Failed to delete session';
      throw new ApiError(errorMessage, response.status);
    }

    return response.json();
  }
};

export const postgresApi = {
  connect: async (details: Pick<WizardState, 'dbHost' | 'dbPort' | 'dbUser' | 'dbPass' | 'dbName'>) => {
    const response = await fetch(`${API_BASE_URL}/postgres/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({
        host: details.dbHost,
        port: parseInt(details.dbPort, 10),
        user: details.dbUser,
        password: details.dbPass,
        db_name: details.dbName,
      }),
    });
    return handleResponse<ConnectResponse>(response);
  },

  getSchemas: async (connectionId: string) => {
    const response = await fetch(`${API_BASE_URL}/postgres/schemas`, {
      headers: {
        'X-Connection-ID': connectionId,
        ...getAuthHeaders()
      },
    });
    return handleResponse<SchemasResponse>(response);
  },

  getTables: async (connectionId: string, schema: string) => {
    const response = await fetch(`${API_BASE_URL}/postgres/schemas/${schema}/tables`, {
      headers: {
        'X-Connection-ID': connectionId,
        ...getAuthHeaders()
      },
    });
    return handleResponse<TablesResponse>(response);
  },

  getColumns: async (connectionId: string, table: string, schema: string) => {
    const response = await fetch(
      `${API_BASE_URL}/postgres/tables/${table}/columns?schema_name=${schema}`,
      {
        headers: {
          'X-Connection-ID': connectionId,
          ...getAuthHeaders()
        },
      }
    );
    const data = await handleResponse<ColumnsResponse>(response);

    // Map API response to our Column type
    return data.columns.map((col): Column => ({
      name: col.column_name,
      type: col.data_type,
      description: '', // Initially empty
      isPrimaryKey: col.constraints?.includes('PRIMARY KEY'),
      isForeignKey: col.constraints?.includes('FOREIGN KEY'),
    }));
  },

  getForeignKeys: async (connectionId: string, table: string, schema: string) => {
    const response = await fetch(
      `${API_BASE_URL}/postgres/tables/${table}/foreign_keys?schema_name=${schema}`,
      {
        headers: {
          'X-Connection-ID': connectionId,
          ...getAuthHeaders()
        },
      }
    );
    return handleResponse<ForeignKeysResponse>(response);
  },
};

export const llmApi = {
  generateSchemaDescriptions: async (connectionId: string, schemaName: string, tableNames: string[]) => {
    const response = await fetch(`${API_BASE_URL}/llm/generate_schema_descriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Connection-ID': connectionId,
        ...getAuthHeaders()
      },
      body: JSON.stringify({
        schema_name: schemaName,
        table_names: tableNames,
      }),
    });
    return handleResponse<AiGenerateResponse>(response);
  },
};

export const agentApi = {
  getAgents: async () => {
    // Return cached agents if available
    if (cachedAgents) {
      return cachedAgents;
    }
    const response = await fetch(`${API_BASE_URL}/agents`, {
      headers: { ...getAuthHeaders() }
    });
    const data = await handleResponse<Agent[]>(response);
    cachedAgents = data;
    return data;
  },
  clearCache: () => {
    cachedAgents = null;
  },

  runAgent: async (agentId: string, message: string, sessionId: string, userId: string, files: File[] | null | undefined, onEvent: (event: string, data: any) => void) => {
    const formData = new FormData();
    formData.append('message', message);
    formData.append('stream', 'true');
    formData.append('session_id', sessionId);
    formData.append('user_id', userId);

    if (files && files.length > 0) {
      files.forEach((file) => {
        formData.append('files', file);
      });
    }

    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};

    const response = await fetch(`${API_BASE_URL}/agents/${agentId}/runs`, {
      method: 'POST',
      headers: headers,
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to run agent');
    }

    if (!response.body) return;

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Split by double newline which typically separates SSE messages
      const messages = buffer.split('\n\n');

      // Keep the last potentially incomplete chunk in the buffer
      buffer = messages.pop() || '';

      for (const msg of messages) {
        const lines = msg.split('\n');
        let eventType = '';
        let eventData = null;

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]') continue;

            try {
              eventData = JSON.parse(dataStr);
            } catch (e) {
              console.warn('Failed to parse SSE data:', dataStr);
            }
          }
        }

        if (eventType && eventData) {
          onEvent(eventType, eventData);
        }
      }
    }
  }
};

export const graphApi = {
  updateGraphSchema: async (payload: GraphUpdatePayload) => {
    const response = await fetch(`${API_BASE_URL}/graph/update_graph_schema_in_db`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<GraphUpdateResponse>(response);
  },

  createGraphFromMetadata: async (graphId: string, options?: { enableTextIndexing?: boolean; enableVectorSearch?: boolean }) => {
    const response = await fetch(`${API_BASE_URL}/graph/create_graph_from_metadata`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({
        graph_id: graphId,
        enable_text_indexing: options?.enableTextIndexing ?? false,
        enable_vector_search: options?.enableVectorSearch ?? false,
      }),
    });
    return handleResponse<{ message: string; graph_id: string }>(response);
  },

  searchNodes: async (graphId: string, searchTerm: string): Promise<SearchResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/graph/search_nodes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          graph_id: graphId,
          search_term: searchTerm
        }),
      });
      return await handleResponse<SearchResponse>(response);
    } catch (error) {
      console.error("Search API Error", error);
      return MOCK_SEARCH_RESULTS;
    }
  },

  saveGraphDraft: async (payload: GraphEditPayload) => {
    const response = await fetch(`${API_BASE_URL}/graph/save_graph_draft`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<{ message: string; graph_id: string }>(response);
  },

  publishEditedGraph: async (payload: GraphEditPayload) => {
    const response = await fetch(`${API_BASE_URL}/graph/publish_edited_graph`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<{ message: string; graph_id: string }>(response);
  },

  fetchGraphsByEmail: async (email: string) => {
    const response = await fetch(`${API_BASE_URL}/graph/fetch_graphs_by_email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ email }),
    });
    return handleResponse<GraphMetadataByEmailResponse>(response);
  }
};

export interface KnowledgeItem {
  id: string;
  name: string;
  description: string;
  type: string;
  size: string;
  linked_to: any;
  metadata: any;
  access_count: any;
  status: string;
  status_message: string;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeContentResponse {
  data: KnowledgeItem[];
  meta: {
    page: number;
    limit: number;
    total_pages: number;
    total_count: number;
    search_time_ms: number;
  }
}

export const knowledgeApi = {
  getContent: async (dbId: string, page: number = 1, limit: number = 25) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sort_by: 'updated_at',
      sort_order: 'desc',
      db_id: dbId
    });
    const response = await fetch(`${API_BASE_URL}/knowledge/content?${params.toString()}`, {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse<KnowledgeContentResponse>(response);
  },

  deleteContent: async (dbId: string, contentId: string) => {
    const response = await fetch(`${API_BASE_URL}/knowledge/content/${encodeURIComponent(contentId)}?db_id=${encodeURIComponent(dbId)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({})
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || errorData.message || 'Failed to delete content';
      throw new ApiError(errorMessage, response.status);
    }
    return true;
  },

  uploadContent: async (dbId: string, payload: { name: string; description?: string; url?: string; metadata?: Record<string, string>; file?: File | null; reader?: string; textContent?: string }) => {
    const formData = new FormData();
    formData.append('name', payload.name);
    formData.append('description', payload.description || '');
    formData.append('url', payload.url || '');
    formData.append('metadata', JSON.stringify(payload.metadata || {}));
    formData.append('reader_id', payload.textContent ? 'text' : '');
    if (payload.textContent) {
      formData.append('text_content', payload.textContent);
    }

    if (payload.file) {
      formData.append('file', payload.file);
    }

    const response = await fetch(`${API_BASE_URL}/knowledge/content?db_id=${encodeURIComponent(dbId)}`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders()
      },
      body: formData
    });

    return handleResponse<any>(response);
  },

  getContentStatus: async (dbId: string, contentId: string) => {
    const response = await fetch(`${API_BASE_URL}/knowledge/content/${encodeURIComponent(contentId)}/status?db_id=${encodeURIComponent(dbId)}`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      }
    });
    return handleResponse<{ status: string; status_message?: string }>(response);
  }
};
