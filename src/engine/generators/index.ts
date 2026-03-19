import type { ObjectNode, GeneratedFile, ConvertConfig, TargetLanguage } from '../types';
import { generateJava } from './java';
import { generateGo } from './go';
import { generatePython } from './python';
import { generateTypeScript } from './typescript';
import { generateKotlin } from './kotlin';
import { generateJson } from './json';
import { generateProtobuf } from './protobuf';
import { generateSql } from './sql';
import { generateRust } from './rust';

type Generator = (ast: ObjectNode, config: ConvertConfig) => GeneratedFile[];

const generators: Record<TargetLanguage, Generator> = {
  json: generateJson,
  java: generateJava,
  go: generateGo,
  python: generatePython,
  typescript: generateTypeScript,
  kotlin: generateKotlin,
  protobuf: generateProtobuf,
  sql: generateSql,
  rust: generateRust,
};

/**
 * Single entry point: convert an AST into generated files for the configured language.
 */
export function generate(ast: ObjectNode, config: ConvertConfig): GeneratedFile[] {
  const gen = generators[config.targetLanguage];
  if (!gen) {
    throw new Error(`Unsupported language: ${config.targetLanguage}`);
  }
  return gen(ast, config);
}

export { generateJava, generateGo, generatePython, generateTypeScript, generateKotlin, generateJson, generateProtobuf, generateSql, generateRust };
