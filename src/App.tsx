import { useState, useCallback, useMemo } from 'react';
import InputPanel from './components/InputPanel';
import OutputPanel from './components/OutputPanel';
import ConfigPanel from './components/ConfigPanel';
import { parseJsonToAST } from './engine/parser';
import { generate } from './engine/generators';
import {
  parseJavaToAST,
  parseGoToAST,
  parsePythonToAST,
  parseTypeScriptToAST,
  parseKotlinToAST,
  parseRustToAST,
} from './engine/parsers/languageParsers';
import {
  parseProtobufToAST,
  parseSqlToAST,
} from './engine/parsers/protobufSqlParsers';
import type { ConvertConfig, GeneratedFile, TargetLanguage, SourceLanguage } from './engine/types';
import { defaultConfig } from './engine/types';
import './App.css';

function App() {
  const [input, setInput] = useState<string>('');
  const [config, setConfig] = useState<ConvertConfig>(defaultConfig);
  const [activeTab, setActiveTab] = useState(0);
  const [configOpen, setConfigOpen] = useState(false);

  // Parse input based on source language, then generate output
  const { files, error } = useMemo(() => {
    if (!input.trim()) {
      return { files: [] as GeneratedFile[], error: null };
    }
    try {
      // Step 1: Parse input → AST
      let ast;
      switch (config.sourceLanguage) {
        case 'json':
          ast = parseJsonToAST(input, config.rootClassName);
          break;
        case 'java':
          ast = parseJavaToAST(input);
          break;
        case 'go':
          ast = parseGoToAST(input);
          break;
        case 'python':
          ast = parsePythonToAST(input);
          break;
        case 'typescript':
          ast = parseTypeScriptToAST(input);
          break;
        case 'kotlin':
          ast = parseKotlinToAST(input);
          break;
        case 'protobuf':
          ast = parseProtobufToAST(input);
          break;
        case 'rust':
          ast = parseRustToAST(input);
          break;
        case 'sql':
          ast = parseSqlToAST(input);
          break;
        default:
          throw new Error(`Unsupported source language: ${config.sourceLanguage}`);
      }
      // Step 2: Generate output from AST
      const generated = generate(ast, config);
      return { files: generated, error: null };
    } catch (e) {
      return {
        files: [] as GeneratedFile[],
        error: e instanceof Error ? e.message : 'Invalid input',
      };
    }
  }, [input, config]);

  const handleInputChange = useCallback((value: string) => {
    setInput(value);
    setActiveTab(0);
  }, []);

  const handleLanguageChange = useCallback(
    (lang: TargetLanguage) => {
      setConfig(prev => ({ ...prev, targetLanguage: lang }));
      setActiveTab(0);
    },
    [],
  );

  const handleSourceLanguageChange = useCallback(
    (lang: SourceLanguage) => {
      setConfig(prev => ({ ...prev, sourceLanguage: lang }));
      setActiveTab(0);
    },
    [],
  );

  return (
    <div className="app">
      <header className="app-header">
        <div className="logo">
          <span className="logo-icon">⚗️</span>
          <h1>BeanTrans</h1>
        </div>
        <p className="tagline">JSON ↔ Java · Go · Python · TS · Kotlin · Rust · Protobuf · SQL</p>
      </header>

      <main className="workspace">
        <InputPanel
          value={input}
          onChange={handleInputChange}
          error={error}
          sourceLanguage={config.sourceLanguage}
          onSourceLanguageChange={handleSourceLanguageChange}
        />
        <div className="divider" />
        <OutputPanel
          files={files}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          language={config.targetLanguage}
          onLanguageChange={handleLanguageChange}
        />
      </main>

      <ConfigPanel
        config={config}
        onChange={setConfig}
        isOpen={configOpen}
        onToggle={() => setConfigOpen(o => !o)}
      />
    </div>
  );
}

export default App;
