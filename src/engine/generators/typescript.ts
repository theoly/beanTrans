import type { ASTNode, ObjectNode, GeneratedFile, ConvertConfig } from '../types';
import { toCamelCase } from '../parser';

/**
 * TypeScript interface / type generator.
 */
export function generateTypeScript(ast: ObjectNode, config: ConvertConfig): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  collectTsInterfaces(ast, config, files);
  return files;
}

function collectTsInterfaces(
  node: ObjectNode,
  config: ConvertConfig,
  files: GeneratedFile[],
): void {
  const indent = ' '.repeat(config.indentSize);
  const lines: string[] = [];

  lines.push(`export interface ${node.name} {`);

  for (const field of node.fields) {
    const tsType = resolveTsType(field.node, config);
    const fieldName = toCamelCase(field.name);
    const nullable = config.nullableFields && field.nullable;
    const opt = nullable ? '?' : '';
    lines.push(`${indent}${fieldName}${opt}: ${tsType};`);
  }

  lines.push('}');

  files.push({
    fileName: `${node.name}.ts`,
    content: lines.join('\n'),
    language: 'typescript',
  });

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
    collectTsInterfaces(node, config, files);
  } else if (node.kind === 'array' && node.elementType.kind === 'object') {
    collectTsInterfaces(node.elementType, config, files);
  }
}

function resolveTsType(node: ASTNode, config: ConvertConfig): string {
  switch (node.kind) {
    case 'string':
      return 'string';
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'null':
      return 'unknown';
    case 'object':
      return node.name;
    case 'array': {
      const inner = resolveTsType(node.elementType, config);
      return `${inner}[]`;
    }
  }
}
