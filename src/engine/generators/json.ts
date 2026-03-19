import type { ASTNode, ObjectNode, GeneratedFile, ConvertConfig } from '../types';

/**
 * JSON sample generator.
 * Converts an AST back into a JSON example object.
 */
export function generateJson(ast: ObjectNode, config: ConvertConfig): GeneratedFile[] {
  const jsonObj = astToJsonObject(ast);
  const content = JSON.stringify(jsonObj, null, config.indentSize);
  return [{
    fileName: `${ast.name}.json`,
    content,
    language: 'json',
  }];
}

function astToJsonObject(node: ObjectNode): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const field of node.fields) {
    obj[field.name] = astToJsonValue(field.node);
  }
  return obj;
}

function astToJsonValue(node: ASTNode): unknown {
  switch (node.kind) {
    case 'string':
      return 'string';
    case 'number':
      return node.isFloat ? 0.0 : 0;
    case 'boolean':
      return false;
    case 'null':
      return null;
    case 'object':
      return astToJsonObject(node);
    case 'array': {
      const elem = astToJsonValue(node.elementType);
      return [elem];
    }
  }
}
