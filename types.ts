export interface Column {
  name: string;
  type: string;
  description: string;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
}

export interface Table {
  id: string;
  name: string;
  selected: boolean;
  columns: Column[];
  loaded?: boolean; // Track if columns have been fetched
  description?: string;
}

export interface WizardState {
  // Step 1: Org Details
  orgName: string;
  projectName: string;
  description: string;
  domain?: string;

  // Step 2: DB Connection
  dbHost: string;
  dbPort: string;
  dbUser: string;
  dbPass: string;
  dbName: string;
  connectionId?: string; // Store the connection token

  // Step 3: Schema
  schemaName?: string;
  tables: Table[];
}

export enum Step {
  Welcome = 0,
  Organization = 1,
  Database = 2,
  Schema = 3,
  Review = 4,
}

export const INITIAL_TABLES: Table[] = [];