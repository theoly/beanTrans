import type { ASTNode, ObjectNode, GeneratedFile, ConvertConfig } from '../types';
import { toPascalCase } from '../parser';

/**
 * Go struct generator.
 * One GeneratedFile per ObjectNode. Adds `json:"..."` tags when enabled.
 */
export function generateGo(ast: ObjectNode, config: ConvertConfig): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  collectGoStructs(ast, config, files);
  return files;
}

function collectGoStructs(
  node: ObjectNode,
  config: ConvertConfig,
  files: GeneratedFile[],
): void {
  const indent = '\t'; // Go convention
  const lines: string[] = [];

  lines.push(`type ${node.name} struct {`);

  for (const field of node.fields) {
    const goType = resolveGoType(field.node, config);
    const exportedName = toPascalCase(field.name);
    const tag = config.generateJsonTags ? ` \`json:"${field.name}"\`` : '';
    lines.push(`${indent}${exportedName} ${goType}${tag}`);
  }

  lines.push('}');

  files.push({
    fileName: `${node.name.toLowerCase()}.go`,
    content: lines.join('\n'),
    language: 'go',
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
    collectGoStructs(node, config, files);
  } else if (node.kind === 'array' && node.elementType.kind === 'object') {
    collectGoStructs(node.elementType, config, files);
  }
}

function resolveGoType(node: ASTNode, config: ConvertConfig): string {
  switch (node.kind) {
    case 'string':
      return 'string';
    case 'number':
      return node.isFloat ? 'float64' : goIntType(config);
    case 'boolean':
      return 'bool';
    case 'null':
      return 'interface{}';
    case 'object':
      return node.name;
    case 'array': {
      const inner = resolveGoType(node.elementType, config);
      return `[]${inner}`;
    }
  }
}

function goIntType(config: ConvertConfig): string {
  switch (config.numberMapping) {
    case 'long': return 'int64';
    case 'float': return 'float32';
    case 'double': return 'float64';
    default: return 'int';
  }
}
