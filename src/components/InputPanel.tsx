import { useState } from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-kotlin';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-protobuf';
import 'prismjs/components/prism-sql';
import JSON5 from 'json5';
import type { SourceLanguage } from '../engine/types';

interface InputPanelProps {
  value: string;
  onChange: (value: string) => void;
  error: string | null;
  sourceLanguage: SourceLanguage;
  onSourceLanguageChange: (lang: SourceLanguage) => void;
}

const sourceLanguages: { value: SourceLanguage; label: string }[] = [
  { value: 'json', label: 'JSON' },
  { value: 'java', label: 'Java' },
  { value: 'go', label: 'Go' },
  { value: 'python', label: 'Python' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'rust', label: 'Rust' },
  { value: 'protobuf', label: 'Protobuf' },
  { value: 'sql', label: 'SQL DDL' },
];

const placeholders: Record<SourceLanguage, string> = {
  json: '{\n  "name": "Alice",\n  "age": 30\n}',
  java: 'public class User {\n    private String name;\n    private int age;\n}',
  go: 'type User struct {\n\tName string `json:"name"`\n\tAge  int    `json:"age"`\n}',
  python: '@dataclass\nclass User:\n    name: str\n    age: int',
  typescript: 'export interface User {\n    name: string;\n    age: number;\n}',
  kotlin: 'data class User(\n    val name: String,\n    val age: Int\n)',
  rust: '#[derive(Serialize, Deserialize)]\npub struct User {\n    pub name: String,\n    pub age: i32,\n}',
  protobuf: 'message User {\n  string name = 1;\n  int32 age = 2;\n}',
  sql: 'CREATE TABLE users (\n  id BIGINT NOT NULL AUTO_INCREMENT,\n  name VARCHAR(255) NOT NULL,\n  age INT NOT NULL,\n  PRIMARY KEY (id)\n);',
};

const languageMap: Record<SourceLanguage, string> = {
  java: 'java',
  go: 'go',
  python: 'python',
  typescript: 'typescript',
  kotlin: 'kotlin',
  json: 'json',
  protobuf: 'protobuf',
  sql: 'sql',
  rust: 'rust',
};

function formatInput(value: string, lang: SourceLanguage): string | null {
  if (!value.trim()) return null;
  if (lang === 'json') {
    try {
      const parsed = JSON5.parse(value);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return null; // can't format invalid JSON
    }
  }
  return formatLanguageClass(value, lang);
}

function formatLanguageClass(value: string, lang: SourceLanguage): string {
  // Step 1: Normalize — collapse to single string, then re-split intelligently
  let normalized = value
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, '    ');

  // Step 2: For single-line pasted code, split on statement boundaries
  if (!normalized.includes('\n') || normalized.split('\n').filter(l => l.trim()).length <= 2) {
    normalized = expandSingleLine(normalized, lang);
  }

  // Step 3: Tokenize into logical lines
  const rawLines = normalized.split('\n');
  const logical = splitLogicalLines(rawLines, lang);

  // Step 4: Apply indentation
  const indentStr = lang === 'go' ? '\t' : '    ';
  const indented = applyIndentation(logical, indentStr, lang);

  // Step 5: Insert blank lines for readability
  const spaced = insertBlankLines(indented, lang);

  // Step 6: Trim trailing whitespace and collapse multiple blank lines
  return spaced
    .map(l => l.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim() + '\n';
}

/** Expands a single-line or compressed class into multi-line */
function expandSingleLine(input: string, lang: SourceLanguage): string {
  let s = input;

  if (lang === 'kotlin') {
    // Kotlin data class: split params onto separate lines
    s = s.replace(/,\s*/g, ',\n');
    s = s.replace(/\(\s*/g, '(\n');
    s = s.replace(/\s*\)/g, '\n)');
    return s;
  }

  if (lang === 'python') {
    // Python: split before class, def, decorators, and field definitions
    s = s.replace(/(class\s)/g, '\n$1');
    s = s.replace(/(@\w+)/g, '\n$1');
    // Split after colons followed by field defs
    s = s.replace(/:\s+(\w+\s*:)/g, ':\n    $1');
    s = s.replace(/(\w+:\s*\w+)\s+(\w+:\s*\w+)/g, '$1\n    $2');
    return s;
  }

  // Java / Go / TypeScript — curly-brace languages
  // Put opening brace on same line, each statement on new line
  s = s.replace(/\{/g, ' {\n');
  s = s.replace(/\}/g, '\n}\n');
  s = s.replace(/;\s*/g, ';\n');

  // Go: split struct fields
  if (lang === 'go') {
    s = s.replace(/`/g, (m, offset, str) => {
      // Preserve backtick-quoted tags on same line
      const before = str.substring(0, offset);
      const isTag = before.match(/\w+\s+[\w\[\].*]+\s*$/);
      return isTag ? m : m;
    });
  }

  return s;
}

/** Split raw lines further if they contain multiple statements */
function splitLogicalLines(lines: string[], lang: SourceLanguage): string[] {
  const result: string[] = [];
  for (const raw of lines) {
    const trimmed = raw.trim();
    if (!trimmed) {
      result.push('');
      continue;
    }

    if (lang === 'python') {
      result.push(trimmed);
      continue;
    }

    // For brace languages: split if a line has multiple semicolons  
    if (trimmed.includes(';') && !trimmed.match(/^(for|if|while)\s*\(/)) {
      const parts = trimmed.split(';').filter(p => p.trim());
      for (const part of parts) {
        const p = part.trim();
        if (p) result.push(p + (p.endsWith('{') || p.endsWith('}') ? '' : ';'));
      }
    } else {
      // Split if line has } followed by more content
      const braceChunks = splitAroundBraces(trimmed);
      result.push(...braceChunks);
    }
  }
  return result;
}

function splitAroundBraces(line: string): string[] {
  const results: string[] = [];
  let current = '';
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '{') {
      current += ch;
      results.push(current.trim());
      current = '';
    } else if (ch === '}') {
      if (current.trim()) results.push(current.trim());
      current = '';
      // Collect the closing brace and anything after it
      let rest = '}';
      const after = line.substring(i + 1).trim();
      if (after) {
        rest += ' ' + after;
      }
      results.push(rest);
      return results; // rest of line handled
    } else {
      current += ch;
    }
  }
  if (current.trim()) results.push(current.trim());
  return results;
}

/** Apply proper indentation based on brace/paren/colon depth */
function applyIndentation(lines: string[], indentStr: string, lang: SourceLanguage): string[] {
  const result: string[] = [];
  let depth = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      result.push('');
      continue;
    }

    // Decrease depth before lines starting with closing tokens
    if (line.startsWith('}') || line.startsWith(')')) {
      depth = Math.max(0, depth - 1);
    }

    result.push(indentStr.repeat(depth) + line);

    // Increase depth after opening tokens
    const opensBlock =
      line.endsWith('{') ||
      line.endsWith('(') ||
      (lang === 'python' && line.endsWith(':') && (line.startsWith('class ') || line.startsWith('def ') || line.startsWith('@')));

    if (lang === 'python' && line.endsWith(':')) {
      depth++;
    } else if (opensBlock) {
      depth++;
    }
  }
  return result;
}

/** Insert blank lines between logical regions for readability */
function insertBlankLines(lines: string[], lang: SourceLanguage): string[] {
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const prevLine = i > 0 ? lines[i - 1].trim() : '';

    // Blank line before annotations / decorators (if not first line or already blank)
    if (i > 0 && prevLine !== '' && (
      line.startsWith('@') && !prevLine.startsWith('@') ||
      // Blank line before access modifier blocks (Java/Kotlin)
      ((lang === 'java' || lang === 'kotlin') && (
        line.startsWith('public ') || line.startsWith('private ') || line.startsWith('protected ')
      ) && prevLine !== '' && !prevLine.endsWith('{') && !prevLine.startsWith('@'))
    )) {
      // Only add blank line if previous wasn't already blank and not right after opening brace
      if (result.length > 0 && result[result.length - 1].trim() !== '' && !prevLine.endsWith('{')) {
        result.push('');
      }
    }

    // Go: blank line between struct fields is NOT typical, but blank before type is
    if (lang === 'go' && line.startsWith('type ') && i > 0 && prevLine !== '' && !prevLine.endsWith('{')) {
      result.push('');
    }

    // Python: blank line before def / class
    if (lang === 'python' && (line.startsWith('def ') || line.startsWith('class ')) &&
        i > 0 && prevLine !== '' && !prevLine.startsWith('@') && !prevLine.startsWith('#')) {
      result.push('');
    }

    result.push(lines[i]);

    // Blank line after imports
    if ((line.startsWith('import ') || line.startsWith('from ')) &&
        i + 1 < lines.length && !lines[i + 1].trim().startsWith('import') && !lines[i + 1].trim().startsWith('from')) {
      result.push('');
    }
  }
  return result;
}
// Workaround for Vite CJS interop issue with react-simple-code-editor
const CodeEditor = (Editor as any).default || Editor;

export default function InputPanel({
  value,
  onChange,
  error,
  sourceLanguage,
  onSourceLanguageChange,
}: InputPanelProps) {
  const [formatFeedback, setFormatFeedback] = useState<string | null>(null);

  const handleFormat = () => {
    const formatted = formatInput(value, sourceLanguage);
    if (formatted && formatted !== value) {
      onChange(formatted);
      setFormatFeedback('✓');
      setTimeout(() => setFormatFeedback(null), 1500);
    } else if (!formatted) {
      setFormatFeedback('✗');
      setTimeout(() => setFormatFeedback(null), 1500);
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">Input</h2>
        <span className={`status-dot ${error ? 'error' : value.trim() ? 'valid' : ''}`} />
        {error && <span className="error-hint">{error}</span>}
        <button
          className="action-btn"
          onClick={handleFormat}
          title="Format / Pretty Print"
          disabled={!value.trim()}
        >
          {formatFeedback || (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="21" y1="10" x2="7" y2="10" />
              <line x1="21" y1="6" x2="3" y2="6" />
              <line x1="21" y1="14" x2="3" y2="14" />
              <line x1="21" y1="18" x2="7" y2="18" />
            </svg>
          )}
        </button>
        <select
          id="source-language-selector"
          className="lang-select"
          value={sourceLanguage}
          onChange={e => onSourceLanguageChange(e.target.value as SourceLanguage)}
        >
          {sourceLanguages.map(l => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
      </div>
      <div className="editor-area">
        <div className="input-editor-wrapper">
          <CodeEditor
            value={value}
            onValueChange={onChange}
            highlight={(code: string) => {
              const langKey = languageMap[sourceLanguage] || 'plaintext';
              const grammar = Prism.languages[langKey];
              if (!grammar) {
                return code; // Fallback: no highlight if grammar is missing
              }
              try {
                return Prism.highlight(code, grammar, langKey);
              } catch (e) {
                console.error("Highlighting error:", e);
                return code;
              }
            }}
            padding={16}
            className="code-input-editor"
            placeholder={placeholders[sourceLanguage]}
            textareaId="json-input"
            textareaClassName="code-input-textarea"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              minHeight: '100%',
            }}
          />
        </div>
      </div>
    </div>
  );
}
