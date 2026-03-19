import type { ASTNode, ObjectNode, GeneratedFile, ConvertConfig } from '../types';

/**
 * Rust generator.
 * Produces Rust structs, optionally deriving Serialize/Deserialize from Serde.
 */
export function generateRust(ast: ObjectNode, config: ConvertConfig): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  collectRustStructs(ast, config, files);
  return files;
}

function collectRustStructs(
  node: ObjectNode,
  config: ConvertConfig,
  files: GeneratedFile[],
): void {
  const indent = ' '.repeat(config.indentSize);
  const structName = toPascalCase(node.name);
  const lines: string[] = [];

  if (config.deriveSerde) {
    lines.push('#[derive(Serialize, Deserialize, Debug, Clone)]');
  } else {
    lines.push('#[derive(Debug, Clone)]');
  }
  lines.push(`pub struct ${structName} {`);

  for (const field of node.fields) {
    const rawRustType = resolveRustType(field.node, config);
    let rustType = rawRustType;

    // Use Option<T> for nullable fields
    if (field.nullable) {
      rustType = `Option<${rustType}>`;
    }

    const fieldName = toSnakeCase(field.name);
    // Add serde renaming if the snake_case name differs from the original JSON name
    if (config.deriveSerde && fieldName !== field.name) {
      lines.push(`${indent}#[serde(rename = "${field.name}")]`);
    }
    
    // Check if the field name is a Rust keyword
    const safeFieldName = isRustKeyword(fieldName) ? `r#${fieldName}` : fieldName;
    lines.push(`${indent}pub ${safeFieldName}: ${rustType},`);
  }

  lines.push('}');

  files.push({
    fileName: `${toSnakeCase(structName)}.rs`,
    content: lines.join('\n'),
    language: 'rust',
  });

  // Generate structs for nested objects recursively
  for (const field of node.fields) {
    if (field.node.kind === 'object') {
      collectRustStructs(field.node, config, files);
    } else if (field.node.kind === 'array' && field.node.elementType.kind === 'object') {
      collectRustStructs(field.node.elementType, config, files);
    }
  }
}

function resolveRustType(node: ASTNode, config: ConvertConfig): string {
  switch (node.kind) {
    case 'string':
      return 'String';
    case 'number':
      if (node.isFloat) {
        return config.numberMapping === 'float' ? 'f32' : 'f64';
      }
      return config.numberMapping === 'long' ? 'i64' : 'i32';
    case 'boolean':
      return 'bool';
    case 'null':
      // Rust doesn't have a direct 'null/any' type like TS 'any' or Java 'Object' for raw JSON decoding easily
      // without serde_json::Value
      return 'serde_json::Value';
    case 'array':
      const elemType = resolveRustType(node.elementType, config);
      return `Vec<${elemType}>`;
    case 'object':
      return toPascalCase(node.name);
  }
}

function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '')
    .replace(/__+/g, '_');
}

function toPascalCase(str: string): string {
  return str
    .replace(/([_\-\s]+)(.)/g, (_, __, c: string) => c.toUpperCase())
    .replace(/^(.)/, (_, c: string) => c.toUpperCase());
}

const RUST_KEYWORDS = new Set([
  'as', 'break', 'const', 'continue', 'crate', 'else', 'enum', 'extern', 'false', 'fn',
  'for', 'if', 'impl', 'in', 'let', 'loop', 'match', 'mod', 'move', 'mut', 'pub', 'ref',
  'return', 'self', 'Self', 'static', 'struct', 'super', 'trait', 'true', 'type',
  'unsafe', 'use', 'where', 'while', 'async', 'await', 'dyn'
]);

function isRustKeyword(word: string): boolean {
  return RUST_KEYWORDS.has(word);
}
