import type { ASTNode, ObjectNode, GeneratedFile, ConvertConfig } from '../types';
import { toCamelCase, toPascalCase, toSnakeCase } from '../parser';

/**
 * Java class generator.
 * Produces one GeneratedFile per ObjectNode (nested objects → separate classes).
 */
export function generateJava(ast: ObjectNode, config: ConvertConfig): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  collectJavaClasses(ast, config, files);
  return files;
}

function collectJavaClasses(
  node: ObjectNode,
  config: ConvertConfig,
  files: GeneratedFile[],
): void {
  const indent = ' '.repeat(config.indentSize);
  const lines: string[] = [];
  const tableName = config.javaOrm !== 'none' ? toSnakeCase(node.name) : '';

  // Imports
  if (config.useLombok) {
    lines.push('import lombok.Data;');
  }
  if (config.javaOrm === 'jpa') {
    lines.push('import jakarta.persistence.*;');
  } else if (config.javaOrm === 'mybatis-plus') {
    lines.push('import com.baomidou.mybatisplus.annotation.*;');
  }
  
  if (config.useLombok || config.javaOrm !== 'none') {
    lines.push('');
  }

  // Class Annotations
  if (config.useLombok) {
    lines.push('@Data');
  }
  if (config.javaOrm === 'jpa') {
    lines.push('@Entity');
    lines.push(`@Table(name = "${tableName}")`);
  } else if (config.javaOrm === 'mybatis-plus') {
    lines.push(`@TableName("${tableName}")`);
  }

  lines.push(`public class ${node.name} {`);
  lines.push('');

  // Fields
  for (const field of node.fields) {
    const javaType = resolveJavaType(field.node, config);
    const fieldName = toCamelCase(field.name);
    const columnName = toSnakeCase(field.name);
    const isId = fieldName.toLowerCase() === 'id';

    if (config.nullableFields && field.nullable) {
      lines.push(`${indent}// nullable`);
    }

    if (config.javaOrm === 'jpa') {
      if (isId) {
        lines.push(`${indent}@Id`);
        lines.push(`${indent}@GeneratedValue(strategy = GenerationType.IDENTITY)`);
      } else {
        lines.push(`${indent}@Column(name = "${columnName}")`);
      }
    } else if (config.javaOrm === 'mybatis-plus') {
      if (isId) {
        lines.push(`${indent}@TableId(type = IdType.AUTO)`);
      } else {
        lines.push(`${indent}@TableField("${columnName}")`);
      }
    }

    if (config.accessModifier === 'private') {
      lines.push(`${indent}private ${javaType} ${fieldName};`);
    } else {
      lines.push(`${indent}public ${javaType} ${fieldName};`);
    }
  }

  // Getters / Setters (only if private + no Lombok)
  if (config.accessModifier === 'private' && !config.useLombok) {
    lines.push('');
    for (const field of node.fields) {
      const javaType = resolveJavaType(field.node, config);
      const fieldName = toCamelCase(field.name);
      const pascal = toPascalCase(field.name);

      lines.push(`${indent}public ${javaType} get${pascal}() {`);
      lines.push(`${indent}${indent}return this.${fieldName};`);
      lines.push(`${indent}}`);
      lines.push('');
      lines.push(`${indent}public void set${pascal}(${javaType} ${fieldName}) {`);
      lines.push(`${indent}${indent}this.${fieldName} = ${fieldName};`);
      lines.push(`${indent}}`);
      lines.push('');
    }
  }

  lines.push('}');

  files.push({
    fileName: `${node.name}.java`,
    content: lines.join('\n'),
    language: 'java',
  });

  // Recurse into nested objects
  for (const field of node.fields) {
    visitNestedObjects(field.node, config, files);
  }
}

function visitNestedObjects(
  node: ASTNode,
  config: ConvertConfig,
  files: GeneratedFile[],
): void {
  if (node.kind === 'object') {
    collectJavaClasses(node, config, files);
  } else if (node.kind === 'array' && node.elementType.kind === 'object') {
    collectJavaClasses(node.elementType, config, files);
  }
}

function resolveJavaType(node: ASTNode, config: ConvertConfig): string {
  switch (node.kind) {
    case 'string':
      return 'String';
    case 'number': {
      if (node.isFloat) {
        return config.numberMapping === 'BigDecimal' ? 'BigDecimal' : 'double';
      }
      const map: Record<string, string> = {
        int: 'int', long: 'long', float: 'float',
        double: 'double', BigDecimal: 'BigDecimal',
      };
      return map[config.numberMapping] || 'int';
    }
    case 'boolean':
      return 'boolean';
    case 'null':
      return 'Object';
    case 'object':
      return node.name;
    case 'array': {
      const inner = resolveJavaType(node.elementType, config);
      return `List<${boxJavaType(inner)}>`;
    }
  }
}

function boxJavaType(t: string): string {
  const boxed: Record<string, string> = {
    int: 'Integer', long: 'Long', float: 'Float',
    double: 'Double', boolean: 'Boolean',
  };
  return boxed[t] || t;
}
