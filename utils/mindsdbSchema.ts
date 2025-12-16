export type MindsDbRawSchemaTable = {
  table_name?: unknown;
  columns?: unknown;
  constraints?: unknown;
};

export type NormalizedSchemaColumn = {
  name: string;
  type: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  foreignKeyReference?: string; // e.g. "products.product_id"
};

export type NormalizedSchemaConstraint = {
  name: string;
  type: string;
  affectedColumns: string[];
  references?: Array<{
    fromColumn: string;
    toTable?: string;
    toColumn?: string;
  }>;
};

export type NormalizedSchemaTable = {
  tableName: string;
  columns: NormalizedSchemaColumn[];
  constraints: NormalizedSchemaConstraint[];
};

const safeString = (v: unknown) => (v === null || v === undefined ? '' : String(v));

const uniq = <T,>(arr: T[]) => Array.from(new Set(arr));

const normalizeConstraintType = (t: string) => t.trim().toUpperCase();

const tryMatchTableName = (allTablesLower: Map<string, string>, candidate: string) => {
  const c = candidate.trim().toLowerCase();
  if (!c) return undefined;
  const exact = allTablesLower.get(c);
  if (exact) return exact;
  // very small pluralization/singularization heuristics
  if (c.endsWith('s')) {
    const singular = allTablesLower.get(c.slice(0, -1));
    if (singular) return singular;
  } else {
    const plural = allTablesLower.get(`${c}s`);
    if (plural) return plural;
  }
  return undefined;
};

const inferReferencedTableFromConstraintName = (constraintName: string, allTablesLower: Map<string, string>) => {
  const raw = safeString(constraintName);
  const name = raw.trim();
  if (!name) return undefined;

  // Typical pattern: fk_<from_table>_<to_table> (to_table may contain underscores)
  const tokens = name.split('_').filter(Boolean);
  if (tokens.length === 0) return undefined;

  const withoutPrefix =
    tokens[0].toLowerCase() === 'fk'
      ? tokens.slice(1)
      : (name.toLowerCase().startsWith('fk') ? name.replace(/^fk/i, '').split('_').filter(Boolean) : tokens);

  // Try longest suffix match against known tables.
  for (let k = Math.min(5, withoutPrefix.length); k >= 1; k--) {
    const suffix = withoutPrefix.slice(-k).join('_');
    const match = tryMatchTableName(allTablesLower, suffix);
    if (match) return match;
  }

  // As a fallback, try last token only (with pluralization).
  return tryMatchTableName(allTablesLower, withoutPrefix[withoutPrefix.length - 1] || '');
};

const coerceAffectedPairs = (affected: string[]) => {
  // If it looks like [from1,to1,from2,to2,...], return pairs; else treat as from-only.
  const pairs: Array<{ from: string; to?: string }> = [];
  if (affected.length >= 2 && affected.length % 2 === 0) {
    for (let i = 0; i < affected.length; i += 2) {
      pairs.push({ from: affected[i], to: affected[i + 1] });
    }
    return pairs;
  }
  return affected.map((c) => ({ from: c }));
};

export const normalizeMindsDbSchemaTables = (rawTables: unknown): NormalizedSchemaTable[] => {
  const tablesArr = Array.isArray(rawTables) ? (rawTables as any[]) : [];

  const tableNames = tablesArr
    .map((t) => safeString((t as any)?.table_name).trim())
    .filter(Boolean);

  const allTablesLower = new Map<string, string>();
  tableNames.forEach((tn) => allTablesLower.set(tn.toLowerCase(), tn));

  return tablesArr
    .map((t) => {
      const tableName = safeString((t as any)?.table_name).trim();
      if (!tableName) return null;

      const rawCols = Array.isArray((t as any)?.columns) ? (t as any).columns : [];
      const rawConstraints = Array.isArray((t as any)?.constraints) ? (t as any).constraints : [];

      const columnsByName = new Map<string, NormalizedSchemaColumn>();

      // 1) Start with column list (supports both old+new payload shapes)
      rawCols.forEach((c: any) => {
        const name = safeString(c?.name ?? c?.column_name).trim();
        if (!name) return;
        const type = safeString(c?.type ?? c?.data_type).trim() || 'unknown';
        const isPrimaryKey = !!(c?.is_primary_key ?? c?.isPrimaryKey);
        const isForeignKey = !!(c?.is_foreign_key ?? c?.isForeignKey);
        columnsByName.set(name, {
          name,
          type,
          isPrimaryKey,
          isForeignKey,
          foreignKeyReference: safeString((c as any)?.foreignKeyReference).trim() || undefined
        });
      });

      // 2) Apply constraints (fill PK/FK flags + infer references)
      const constraints: NormalizedSchemaConstraint[] = rawConstraints
        .map((rc: any) => {
          const name = safeString(rc?.name).trim();
          const type = normalizeConstraintType(safeString(rc?.type));
          const affectedColumns = uniq(
            (Array.isArray(rc?.affected_columns) ? rc.affected_columns : [])
              .map((x: any) => safeString(x).trim())
              .filter(Boolean)
          );

          if (!name || !type) return null;

          const constraint: NormalizedSchemaConstraint = { name, type, affectedColumns };

          if (type.includes('PRIMARY KEY')) {
            affectedColumns.forEach((colName) => {
              const existing = columnsByName.get(colName);
              if (existing) columnsByName.set(colName, { ...existing, isPrimaryKey: true });
            });
          }

          if (type.includes('FOREIGN KEY')) {
            const inferredTable = inferReferencedTableFromConstraintName(name, allTablesLower);
            const pairs = coerceAffectedPairs(affectedColumns);
            const refs = pairs
              .map((p) => ({
                fromColumn: p.from,
                toTable: inferredTable,
                toColumn: p.to
              }))
              .filter((r) => !!r.fromColumn);
            if (refs.length) constraint.references = refs;

            pairs.forEach((p) => {
              const existing = columnsByName.get(p.from);
              if (!existing) return;
              const refStr =
                inferredTable && p.to
                  ? `${inferredTable}.${p.to}`
                  : inferredTable
                    ? `${inferredTable}`
                    : undefined;
              columnsByName.set(p.from, {
                ...existing,
                isForeignKey: true,
                foreignKeyReference: existing.foreignKeyReference || refStr
              });
            });
          }

          return constraint;
        })
        .filter(Boolean) as NormalizedSchemaConstraint[];

      // Deduplicate constraints by (name,type,affectedColumns)
      const constraintKey = (c: NormalizedSchemaConstraint) =>
        `${c.name}::${c.type}::${c.affectedColumns.join(',')}`;
      const dedupedConstraints = Array.from(
        new Map(constraints.map((c) => [constraintKey(c), c])).values()
      );

      return {
        tableName,
        columns: Array.from(columnsByName.values()),
        constraints: dedupedConstraints
      } satisfies NormalizedSchemaTable;
    })
    .filter(Boolean) as NormalizedSchemaTable[];
};


