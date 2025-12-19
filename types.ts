

export interface Column {
  name: string;
  type: string;
  description: string;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  foreignKeyReference?: string;
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
  
  // Step 3.5: Graph Creation ID
  graphId?: string; // Store the ID returned from updating schema
}

export enum Step {
  Welcome = 0,
  Organization = 1,
  Database = 2,
  Schema = 3,
  Review = 4,
  Success = 5,
}

export const INITIAL_TABLES: Table[] = [];

// --- Graph Editor Types ---

export type EditorNodeType = 'TECHNICAL' | 'BUSINESS';
export type TechnicalType = 'TABLE' | 'COLUMN';
export type BusinessType = 'ENTITY' | 'METRIC' | 'CONCEPT' | 'RULE';

export interface EditorNode {
  id: string;
  type: EditorNodeType;
  subType: TechnicalType | BusinessType;
  label: string;
  x: number;
  y: number;
  data: {
    description?: string;
    dataType?: string; // for columns
    keyType?: 'PK' | 'FK' | 'NONE'; // for columns
    category?: string; // for business
    properties?: Record<string, string>;
  };
}

export interface EditorEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  type?: 'default' | 'dashed';
  // Optional user-adjustable control point (world coords) to bend the relationship arrow.
  control?: { x: number; y: number };
}

export interface EditorState {
  nodes: EditorNode[];
  edges: EditorEdge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  pan: { x: number; y: number };
  zoom: number;
}