import type { ASTNode, ObjectNode, ObjectField } from '../types';

// ─── Protobuf Parser ───────────────────────────────────────────

export function parseProtobufToAST(source: string): ObjectNode {
  const messages = splitProtobufMessages(source);
  if (messages.length === 0) {
    throw new Error('No protobuf message found in input.');
  }
  const nodeMap = new Map<string, ObjectNode>();
  for (const msg of messages) {
    const node = parseProtobufMessage(msg);
    nodeMap.set(node.name, node);
  }
  return nodeMap.values().next().value!;
}

function splitProtobufMessages(source: string): string[] {
  const results: string[] = [];
  const regex = /message\s+\w+\s*\{[^}]*\}/g;
  let match;
  while ((match = regex.exec(source)) !== null) {
    results.push(match[0]);
  }
  if (results.length === 0 && source.trim()) results.push(source);
  return results;
}

function parseProtobufMessage(msg: string): ObjectNode {
  const nameMatch = msg.match(/message\s+(\w+)/);
  const name = nameMatch ? nameMatch[1] : 'Root';

  const fields: ObjectField[] = [];
  // Match: optional/repeated type name = number;
  const fieldRegex = /^\s*(?:(repeated|optional)\s+)?(\w+)\s+(\w+)\s*=\s*\d+\s*;/gm;
  let m;
  while ((m = fieldRegex.exec(msg)) !== null) {
    const modifier = m[1] || '';
    const pbType = m[2];
    const fieldName = m[3];
    const node = protobufTypeToNode(pbType);
    if (modifier === 'repeated') {
      fields.push({
        name: fieldName,
        node: { kind: 'array', elementType: node, empty: false },
        nullable: false,
      });
    } else {
      fields.push({
        name: fieldName,
        node,
        nullable: modifier === 'optional',
      });
    }
  }
  return { kind: 'object', name, fields };
}

function protobufTypeToNode(type: string): ASTNode {
  switch (type) {
    case 'string': return { kind: 'string' };
    case 'int32': case 'int64': case 'uint32': case 'uint64':
    case 'sint32': case 'sint64': case 'fixed32': case 'fixed64':
    case 'sfixed32': case 'sfixed64':
      return { kind: 'number', isFloat: false };
    case 'float': case 'double':
      return { kind: 'number', isFloat: true };
    case 'bool':
      return { kind: 'boolean' };
    case 'bytes':
      return { kind: 'string' };
    default:
      // Could be another message type — treat as string for now
      return { kind: 'string' };
  }
}

// ─── SQL DDL Parser ────────────────────────────────────────────

export function parseSqlToAST(source: string): ObjectNode {
  const tables = splitSqlTables(source);
  if (tables.length === 0) {
    throw new Error('No CREATE TABLE statement found in input.');
  }
  const nodeMap = new Map<string, ObjectNode>();
  for (const tbl of tables) {
    const node = parseSqlTable(tbl);
    nodeMap.set(node.name, node);
  }
  return nodeMap.values().next().value!;
}

function splitSqlTables(source: string): string[] {
  // Split the string by "CREATE TABLE " to handle one or multiple tables,
  // without failing on internal parentheses.
  const parts = source.split(/(?=CREATE\s+TABLE\s)/i);
  const results = parts
    .map(p => p.trim())
    .filter(p => /^CREATE\s+TABLE\s/i.test(p));
    
  if (results.length === 0 && source.trim()) {
    // Fallback if they didn't include CREATE TABLE
    return [source];
  }
  return results;
}

function parseSqlTable(ddl: string): ObjectNode {
  const nameMatch = ddl.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"']?(\w+)[`"']?/i);
  const rawName = nameMatch ? nameMatch[1] : 'root';
  const name = toPascalCase(rawName);

  const fields: ObjectField[] = [];
  
  const firstParen = ddl.indexOf('(');
  const lastParen = ddl.lastIndexOf(')');
  if (firstParen === -1 || lastParen === -1 || lastParen <= firstParen) {
    return { kind: 'object', name, fields };
  }

  const body = ddl.substring(firstParen + 1, lastParen);
  const lines = splitSqlColumns(body);

  for (const line of lines) {
    const trimmed = line.trim();
    // Skip constraints
    if (/^(PRIMARY|UNIQUE|INDEX|KEY|FOREIGN|CONSTRAINT|CHECK)\s/i.test(trimmed)) continue;
    if (!trimmed) continue;

    // Match: column_name TYPE [NOT NULL] [DEFAULT ...] ...
    // Note: [\w(),]+ allows matching DECIMAL(10,2) or VARCHAR(100)
    const colMatch = trimmed.match(/^[`"']?(\w+)[`"']?\s+([\w(),]+)/i);
    if (!colMatch) continue;

    const colName = colMatch[1];
    const sqlType = colMatch[2].toUpperCase();
    const nullable = !/NOT\s+NULL/i.test(trimmed);

    fields.push({
      name: colName,
      node: sqlTypeToNode(sqlType),
      nullable,
    });
  }

  return { kind: 'object', name, fields };
}

function splitSqlColumns(body: string): string[] {
  const result: string[] = [];
  let current = '';
  let parenDepth = 0;
  for (let i = 0; i < body.length; i++) {
    const char = body[i];
    if (char === '(') parenDepth++;
    else if (char === ')') parenDepth--;
    else if (char === ',' && parenDepth === 0) {
      result.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  if (current.trim()) result.push(current);
  return result;
}

function sqlTypeToNode(type: string): ASTNode {
  const t = type.toUpperCase().replace(/\(.+\)/, '');
  // String types
  if (['VARCHAR', 'CHAR', 'TEXT', 'TINYTEXT', 'MEDIUMTEXT', 'LONGTEXT',
       'ENUM', 'SET', 'UUID', 'CHARACTER', 'VARYING'].includes(t)) {
    return { kind: 'string' };
  }
  // Integer types
  if (['INT', 'INTEGER', 'TINYINT', 'SMALLINT', 'MEDIUMINT', 'BIGINT',
       'SERIAL', 'BIGSERIAL', 'SMALLSERIAL'].includes(t)) {
    return { kind: 'number', isFloat: false };
  }
  // Float types
  if (['FLOAT', 'DOUBLE', 'DECIMAL', 'NUMERIC', 'REAL',
       'DOUBLE PRECISION', 'MONEY'].includes(t)) {
    return { kind: 'number', isFloat: true };
  }
  // Boolean
  if (['BOOLEAN', 'BOOL', 'BIT'].includes(t)) {
    return { kind: 'boolean' };
  }
  // Date / time → string
  if (['DATE', 'DATETIME', 'TIMESTAMP', 'TIME', 'YEAR',
       'TIMESTAMPTZ', 'TIMETZ', 'INTERVAL'].includes(t)) {
    return { kind: 'string' };
  }
  // JSON/JSONB → string
  if (['JSON', 'JSONB'].includes(t)) {
    return { kind: 'string' };
  }
  // Blob → string
  if (['BLOB', 'TINYBLOB', 'MEDIUMBLOB', 'LONGBLOB', 'BYTEA'].includes(t)) {
    return { kind: 'string' };
  }
  return { kind: 'string' };
}

function toPascalCase(str: string): string {
  return str
    .replace(/([_\-\s]+)(.)/g, (_, __, c: string) => c.toUpperCase())
    .replace(/^(.)/, (_, c: string) => c.toUpperCase());
}
