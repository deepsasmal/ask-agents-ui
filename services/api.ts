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
    return handleResponse<{ connection_id: string; message: string }>(response);
  },

  getSchemas: async (connectionId: string) => {
    const response = await fetch(`${API_BASE_URL}/postgres/schemas`, {
      headers: { 'X-Connection-ID': connectionId },
    });
    return handleResponse<{ schemas: string[] }>(response);
  },

  getTables: async (connectionId: string, schema: string) => {
    const response = await fetch(`${API_BASE_URL}/postgres/schemas/${schema}/tables`, {
      headers: { 'X-Connection-ID': connectionId },
    });
    return handleResponse<{ schema: string; tables: string[] }>(response);
  },

  getColumns: async (connectionId: string, table: string, schema: string) => {
    const response = await fetch(
      `${API_BASE_URL}/postgres/tables/${table}/columns?schema_name=${schema}`,
      {
        headers: { 'X-Connection-ID': connectionId },
      }
    );
    const data = await handleResponse<{
      table: string;
      columns: Array<{
        column_name: string;
        data_type: string;
        is_nullable: string;
        column_default: string | null;
        constraints: string | null;
      }>;
    }>(response);

    // Map API response to our Column type
    return data.columns.map((col): Column => ({
      name: col.column_name,
      type: col.data_type,
      description: '', // Initially empty
      isPrimaryKey: col.constraints?.includes('PRIMARY KEY'),
      isForeignKey: col.constraints?.includes('FOREIGN KEY'),
    }));
  },
};
