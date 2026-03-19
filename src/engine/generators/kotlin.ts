import type { ASTNode, ObjectNode, GeneratedFile, ConvertConfig } from '../types';
import { toCamelCase } from '../parser';

/**
 * Kotlin data class generator.
 */
export function generateKotlin(ast: ObjectNode, config: ConvertConfig): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  collectKotlinClasses(ast, config, files);
  return files;
}

function collectKotlinClasses(
  node: ObjectNode,
  config: ConvertConfig,
  files: GeneratedFile[],
): void {
  const indent = ' '.repeat(config.indentSize);
  const lines: string[] = [];

  const params = node.fields.map(field => {
    const ktType = resolveKotlinType(field.node, config);
    const fieldName = toCamelCase(field.name);
    const mod = config.accessModifier === 'private' ? 'private ' : '';
    const nullable = config.nullableFields && field.nullable ? '?' : '';
    return `${indent}${mod}val ${fieldName}: ${ktType}${nullable}`;
  });

  lines.push(`data class ${node.name}(`);
  lines.push(params.join(',\n'));
  lines.push(')');

  files.push({
    fileName: `${node.name}.kt`,
    content: lines.join('\n'),
    language: 'kotlin',
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
    collectKotlinClasses(node, config, files);
  } else if (node.kind === 'array' && node.elementType.kind === 'object') {
    collectKotlinClasses(node.elementType, config, files);
  }
}

function resolveKotlinType(node: ASTNode, config: ConvertConfig): string {
  switch (node.kind) {
    case 'string':
      return 'String';
    case 'number': {
      if (node.isFloat) return 'Double';
      return config.numberMapping === 'long' ? 'Long' : 'Int';
    }
    case 'boolean':
      return 'Boolean';
    case 'null':
      return 'Any?';
    case 'object':
      return node.name;
    case 'array': {
      const inner = resolveKotlinType(node.elementType, config);
      return `List<${inner}>`;
    }
  }
}
