import type { ASTNode, ObjectNode, GeneratedFile, ConvertConfig } from '../types';

/**
 * SQL DDL generator.
 * Generates CREATE TABLE statements compatible with MySQL/PostgreSQL.
 */
export function generateSql(ast: ObjectNode, config: ConvertConfig): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  collectSqlTables(ast, config, files);
  return files;
}

function collectSqlTables(
  node: ObjectNode,
  config: ConvertConfig,
  files: GeneratedFile[],
): void {
  const indent = ' '.repeat(config.indentSize);
  const tableName = toSnakeCase(node.name);
  const lines: string[] = [];

  const isPg = config.sqlDialect === 'postgresql';
  const isSqlite = config.sqlDialect === 'sqlite';

  lines.push(`CREATE TABLE ${tableName} (`);

  if (isPg) {
    lines.push(`${indent}id BIGSERIAL PRIMARY KEY,`);
  } else if (isSqlite) {
    lines.push(`${indent}id INTEGER PRIMARY KEY AUTOINCREMENT,`);
  } else {
    // MySQL
    lines.push(`${indent}id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,`);
  }

  const columnDefs: string[] = [];
  for (const field of node.fields) {
    // Skip 'id' since it's hardcoded as the primary key at the top
    if (field.name.toLowerCase() === 'id') {
      continue;
    }

    // Skip nested objects — they become foreign keys or separate tables
    if (field.node.kind === 'object') {
      const fieldIdType = isSqlite ? 'INTEGER' : 'BIGINT';
      columnDefs.push(
        `${indent}${toSnakeCase(field.name)}_id ${fieldIdType}${field.nullable ? '' : ' NOT NULL'}`
      );
      continue;
    }
    if (field.node.kind === 'array') {
      // Arrays become separate join tables — skip inline
      continue;
    }
    const sqlType = resolveSqlType(field.node, config);
    const nullable = field.nullable ? '' : ' NOT NULL';
    columnDefs.push(`${indent}${toSnakeCase(field.name)} ${sqlType}${nullable}`);
  }

  if (columnDefs.length > 0) {
    lines.push(columnDefs.join(',\n'));
  } else {
    // If no fields, strip the trailing comma from the id line
    lines[lines.length - 1] = lines[lines.length - 1].replace(',', '');
  }

  lines.push(');');

  files.push({
    fileName: `${tableName}.sql`,
    content: lines.join('\n'),
    language: 'sql',
  });

  // Generate tables for nested objects
  for (const field of node.fields) {
    if (field.node.kind === 'object') {
      collectSqlTables(field.node, config, files);
    } else if (field.node.kind === 'array' && field.node.elementType.kind === 'object') {
      collectSqlTables(field.node.elementType, config, files);
    }
  }
}

function resolveSqlType(node: ASTNode, config: ConvertConfig): string {
  const isPg = config.sqlDialect === 'postgresql';
  const isSqlite = config.sqlDialect === 'sqlite';

  switch (node.kind) {
    case 'string':
      return isPg ? 'TEXT' : 'VARCHAR(255)';
    case 'number':
      if (node.isFloat) {
        return isPg ? 'DOUBLE PRECISION' : (isSqlite ? 'REAL' : 'DECIMAL(10,2)');
      }
      const intType = config.numberMapping === 'long' ? 'BIGINT' : 'INT';
      return isSqlite ? 'INTEGER' : intType;
    case 'boolean':
      return isSqlite ? 'INTEGER' : 'BOOLEAN';
    case 'null':
      return isPg ? 'TEXT' : 'VARCHAR(255)';
    case 'array':
    case 'object':
      if (isPg) return 'JSONB';
      if (isSqlite) return 'TEXT';
      return 'JSON'; 
  }
}

function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '')
    .replace(/__+/g, '_');
}
