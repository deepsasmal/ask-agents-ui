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
    return handleResponse<{ message: string; success: boolean }>(response);
  },

  createGraphFromMetadata: async (graphId: string) => {
    const response = await fetch(`${API_BASE_URL}/graph/create_graph_from_metadata`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        graph_id: graphId,
      }),
    });
    return handleResponse<{ message: string; graph_id: string }>(response);
  },
};