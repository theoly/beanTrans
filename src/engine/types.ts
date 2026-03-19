// ─── AST Node Types ────────────────────────────────────────────

export interface ObjectNode {
  kind: 'object';
  name: string;
  fields: ObjectField[];
}

export interface ObjectField {
  name: string;
  node: ASTNode;
  nullable: boolean;
}

export interface ArrayNode {
  kind: 'array';
  elementType: ASTNode;
  empty: boolean;
}

export interface StringNode {
  kind: 'string';
}

export interface NumberNode {
  kind: 'number';
  isFloat: boolean;
}

export interface BooleanNode {
  kind: 'boolean';
}

export interface NullNode {
  kind: 'null';
}

export type ASTNode =
  | ObjectNode
  | ArrayNode
  | StringNode
  | NumberNode
  | BooleanNode
  | NullNode;

// ─── Generated Output ──────────────────────────────────────────

export interface GeneratedFile {
  fileName: string;
  content: string;
  language: string; // prism language key
}

// ─── Config ────────────────────────────────────────────────────

export type TargetLanguage = 'json' | 'java' | 'go' | 'python' | 'typescript' | 'kotlin' | 'protobuf' | 'sql' | 'rust';

export type SourceLanguage = 'json' | 'java' | 'go' | 'python' | 'typescript' | 'kotlin' | 'protobuf' | 'sql' | 'rust';

export type SqlDialect = 'mysql' | 'postgresql' | 'sqlite';

export type JavaORM = 'none' | 'jpa' | 'mybatis-plus';

export type NumberMapping = 'int' | 'long' | 'float' | 'double' | 'BigDecimal';

export interface ConvertConfig {
  sourceLanguage: SourceLanguage;
  targetLanguage: TargetLanguage;
  rootClassName: string;
  numberMapping: NumberMapping;
  useLombok: boolean;        // Java
  useDataclass: boolean;     // Python
  generateJsonTags: boolean; // Go
  accessModifier: 'private' | 'public'; // Java / Kotlin
  nullableFields: boolean;
  indentSize: 2 | 4;
  sqlDialect: SqlDialect;
  deriveSerde: boolean; // Rust
  javaOrm: JavaORM;
}

export const defaultConfig: ConvertConfig = {
  sourceLanguage: 'json',
  targetLanguage: 'java',
  rootClassName: 'Root',
  numberMapping: 'int',
  useLombok: true,
  useDataclass: true,
  generateJsonTags: true,
  accessModifier: 'private',
  nullableFields: false,
  indentSize: 4,
  sqlDialect: 'mysql',
  deriveSerde: true,
  javaOrm: 'none',
};
