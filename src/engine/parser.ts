import JSON5 from 'json5';
import type { ASTNode, ObjectNode, ObjectField, ArrayNode } from './types';

/**
 * Parse a JSON string into a BeanTrans AST tree.
 * Each nested object becomes its own ObjectNode (→ separate class/struct).
 * 
 * Uses JSON5 to support unquoted keys and comments
 */
export function parseJsonToAST(json: string, rootName: string): ObjectNode {
  const parsed = JSON5.parse(json);
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Top-level value must be a JSON object (not array or primitive).');
  }
  return buildObjectNode(parsed, rootName);
}

function buildObjectNode(obj: Record<string, unknown>, name: string): ObjectNode {
  const fields: ObjectField[] = Object.entries(obj).map(([key, value]) => ({
    name: key,
    node: buildNode(value, toPascalCase(key)),
    nullable: value === null,
  }));
  return { kind: 'object', name, fields };
}

function buildNode(value: unknown, suggestedName: string): ASTNode {
  if (value === null) {
    return { kind: 'null' };
  }
  switch (typeof value) {
    case 'string':
      return { kind: 'string' };
    case 'number':
      return { kind: 'number', isFloat: !Number.isInteger(value) };
    case 'boolean':
      return { kind: 'boolean' };
    case 'object': {
      if (Array.isArray(value)) {
        return buildArrayNode(value, suggestedName);
      }
      return buildObjectNode(value as Record<string, unknown>, suggestedName);
    }
    default:
      return { kind: 'string' }; // fallback
  }
}

function buildArrayNode(arr: unknown[], suggestedName: string): ArrayNode {
  if (arr.length === 0) {
    return { kind: 'array', elementType: { kind: 'string' }, empty: true };
  }
  // Use the first element to determine the array's element type.
  // For object arrays, singularise the suggested name.
  const singularName = singularise(suggestedName);
  const elementType = buildNode(arr[0], singularName);
  return { kind: 'array', elementType, empty: false };
}

// ─── Helpers ───────────────────────────────────────────────────

export function toPascalCase(str: string): string {
  return str
    .replace(/([_\-\s]+)(.)/g, (_, __, c: string) => c.toUpperCase())
    .replace(/^(.)/, (_, c: string) => c.toUpperCase());
}

export function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

export function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '')
    .replace(/__+/g, '_');
}

function singularise(name: string): string {
  if (name.endsWith('ies')) return name.slice(0, -3) + 'y';
  if (name.endsWith('ses')) return name.slice(0, -2);
  if (name.endsWith('s') && !name.endsWith('ss')) return name.slice(0, -1);
  return name;
}
