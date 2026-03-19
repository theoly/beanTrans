import type { ASTNode, ObjectNode, GeneratedFile, ConvertConfig } from '../types';
import { toSnakeCase } from '../parser';

/**
 * Python class generator.
 * Supports `@dataclass` mode or plain classes.
 */
export function generatePython(ast: ObjectNode, config: ConvertConfig): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  collectPythonClasses(ast, config, files);
  return files;
}

function collectPythonClasses(
  node: ObjectNode,
  config: ConvertConfig,
  files: GeneratedFile[],
): void {
  const indent = ' '.repeat(config.indentSize);
  const lines: string[] = [];

  if (config.useDataclass) {
    lines.push('from dataclasses import dataclass');
    lines.push('from typing import List, Optional');
    lines.push('');
    lines.push('');
    lines.push('@dataclass');
  }

  lines.push(`class ${node.name}:`);

  if (node.fields.length === 0) {
    lines.push(`${indent}pass`);
  }

  for (const field of node.fields) {
    const pyType = resolvePythonType(field.node, config);
    const fieldName = toSnakeCase(field.name);

    if (config.useDataclass) {
      if (config.nullableFields && field.nullable) {
        lines.push(`${indent}${fieldName}: Optional[${pyType}] = None`);
      } else {
        lines.push(`${indent}${fieldName}: ${pyType}`);
      }
    } else {
      // Plain class with __init__
      if (field === node.fields[0]) {
        const params = node.fields
          .map(f => toSnakeCase(f.name))
          .join(', ');
        lines.push(`${indent}def __init__(self, ${params}):`);
      }
    }
  }

  // Plain class __init__ body
  if (!config.useDataclass && node.fields.length > 0) {
    const innerIndent = indent + ' '.repeat(config.indentSize);
    for (const field of node.fields) {
      const fieldName = toSnakeCase(field.name);
      lines.push(`${innerIndent}self.${fieldName} = ${fieldName}`);
    }
  }

  files.push({
    fileName: `${toSnakeCase(node.name)}.py`,
    content: lines.join('\n'),
    language: 'python',
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
    collectPythonClasses(node, config, files);
  } else if (node.kind === 'array' && node.elementType.kind === 'object') {
    collectPythonClasses(node.elementType, config, files);
  }
}

function resolvePythonType(node: ASTNode, _config: ConvertConfig): string {
  switch (node.kind) {
    case 'string':
      return 'str';
    case 'number':
      return node.isFloat ? 'float' : 'int';
    case 'boolean':
      return 'bool';
    case 'null':
      return 'None';
    case 'object':
      return node.name;
    case 'array': {
      const inner = resolvePythonType(node.elementType, _config);
      return `List[${inner}]`;
    }
  }
}
