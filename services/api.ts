
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
}

export interface Session {
  session_id: string;
  session_name?: string;
  session_state?: any;
  created_at: string | number;
  updated_at: string | number;
}

export interface SessionMessage {
  role: string;
  content: string;
  created_at?: number;
  tool_calls?: any[];
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
  metadata: GraphMetadata;
}

interface GraphUpdateResponse {
  id: string;
  status: string;
  message?: string;
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
interface LoginResponse {
  access_token: string;
  token_type: string;
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
      // Store user ID (email) for session tracking
      localStorage.setItem('user_id', username);
    }
    return data;
  },
  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_id');
    // Clear API caches on logout
    cachedConfig = null;
    cachedAgents = null;
  },
  isAuthenticated: () => {
    return !!localStorage.getItem('auth_token');
  },
  getCurrentUser: () => {
    return localStorage.getItem('user_id');
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
    const params = new URLSearchParams({
      type: 'agent',
      user_id: userId,
      db_id: dbId,
      table: table
    });

    // Add component_id if provided
    if (componentId) {
      params.append('component_id', componentId);
    }

    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}?${params.toString()}`, {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse<SessionData>(response);
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
      console.warn("API Search failed, falling back to mock data for demonstration.", error);
      // Fallback for demo purposes if backend is not running
      return new Promise<SearchResponse>((resolve) => {
        setTimeout(() => resolve(MOCK_SEARCH_RESULTS), 300);
      });
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
    return handleResponse<{ message: string; status: string }>(response);
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
    return handleResponse<{ message: string; graph_id?: string }>(response);
  }
};
