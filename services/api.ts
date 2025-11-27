

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

export const postgresApi = {
  connect: async (details: Pick<WizardState, 'dbHost' | 'dbPort' | 'dbUser' | 'dbPass' | 'dbName'>) => {
    const response = await fetch(`${API_BASE_URL}/postgres/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'X-Connection-ID': connectionId },
    });
    return handleResponse<SchemasResponse>(response);
  },

  getTables: async (connectionId: string, schema: string) => {
    const response = await fetch(`${API_BASE_URL}/postgres/schemas/${schema}/tables`, {
      headers: { 'X-Connection-ID': connectionId },
    });
    return handleResponse<TablesResponse>(response);
  },

  getColumns: async (connectionId: string, table: string, schema: string) => {
    const response = await fetch(
      `${API_BASE_URL}/postgres/tables/${table}/columns?schema_name=${schema}`,
      {
        headers: { 'X-Connection-ID': connectionId },
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
        headers: { 'X-Connection-ID': connectionId },
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
        'X-Connection-ID': connectionId
      },
      body: JSON.stringify({
        schema_name: schemaName,
        table_names: tableNames,
      }),
    });
    return handleResponse<AiGenerateResponse>(response);
  },
};

export const graphApi = {
  updateGraphSchema: async (payload: GraphUpdatePayload) => {
    const response = await fetch(`${API_BASE_URL}/graph/update_graph_schema_in_db`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<GraphUpdateResponse>(response);
  },

  createGraphFromMetadata: async (graphId: string, options?: { enableTextIndexing?: boolean; enableVectorSearch?: boolean }) => {
    const response = await fetch(`${API_BASE_URL}/graph/create_graph_from_metadata`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
    const response = await fetch(`${API_BASE_URL}/save_graph_draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<{ message: string; status: string }>(response);
  }
};