import type { ASTNode, ObjectNode, GeneratedFile, ConvertConfig } from '../types';
import { toCamelCase } from '../parser';

/**
 * Protobuf message generator.
 */
export function generateProtobuf(ast: ObjectNode, config: ConvertConfig): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  collectProtoMessages(ast, config, files);
  return files;
}

function collectProtoMessages(
  node: ObjectNode,
  config: ConvertConfig,
  files: GeneratedFile[],
): void {
  const indent = ' '.repeat(config.indentSize);
  const lines: string[] = [];

  lines.push('syntax = "proto3";');
  lines.push('');
  lines.push(`message ${node.name} {`);

  let fieldNum = 1;
  for (const field of node.fields) {
    const pbType = resolveProtoType(field.node);
    const fieldName = toSnakeCase(field.name);

    if (field.node.kind === 'array') {
      lines.push(`${indent}repeated ${resolveProtoType((field.node).elementType)} ${fieldName} = ${fieldNum};`);
    } else {
      const prefix = field.nullable ? 'optional ' : '';
      lines.push(`${indent}${prefix}${pbType} ${fieldName} = ${fieldNum};`);
    }
    fieldNum++;
  }

  lines.push('}');

  files.push({
    fileName: `${toCamelCase(node.name)}.proto`,
    content: lines.join('\n'),
    language: 'protobuf',
  });

  // Recurse for nested objects
  for (const field of node.fields) {
    visitNested(field.node, config, files);
  }
}

function visitNested(
  node: ASTNode,
  config: ConvertConfig,
  files: GeneratedFile[],
): void {
  if (node.kind === 'object') {
    collectProtoMessages(node, config, files);
  } else if (node.kind === 'array' && node.elementType.kind === 'object') {
    collectProtoMessages(node.elementType, config, files);
  }
}

function resolveProtoType(node: ASTNode): string {
  switch (node.kind) {
    case 'string': return 'string';
    case 'number': return node.isFloat ? 'double' : 'int32';
    case 'boolean': return 'bool';
    case 'null': return 'string';
    case 'object': return node.name;
    case 'array': return resolveProtoType(node.elementType);
  }
}

function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '')
    .replace(/__+/g, '_');
}
