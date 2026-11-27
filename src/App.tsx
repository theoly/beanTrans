import { useState, useCallback, useMemo, useEffect } from 'react';
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
import { detectInitialLocale, messages, persistLocale, type Locale } from './i18n';
import './App.css';

function App() {
  const [locale, setLocale] = useState<Locale>(detectInitialLocale);
  const [input, setInput] = useState<string>('');
  const [config, setConfig] = useState<ConvertConfig>(defaultConfig);
  const [activeTab, setActiveTab] = useState(0);
  const [configOpen, setConfigOpen] = useState(false);

  const t = messages[locale];

  useEffect(() => {
    document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en';
    document.title = t.docTitle;
  }, [locale, t.docTitle]);

  const handleToggleLocale = useCallback(() => {
    setLocale((prev) => {
      const next: Locale = prev === 'en' ? 'zh' : 'en';
      persistLocale(next);
      return next;
    });
  }, []);

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
          throw new Error(`${t.unsupportedSourcePrefix}${config.sourceLanguage}`);
      }
      // Step 2: Generate output from AST
      const generated = generate(ast, config);
      return { files: generated, error: null };
    } catch (e) {
      return {
        files: [] as GeneratedFile[],
        error: e instanceof Error ? e.message : t.invalidInputFallback,
      };
    }
  }, [input, config, t.invalidInputFallback, t.unsupportedSourcePrefix]);

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

  const handleSwapLanguages = useCallback(() => {
    const activeFile = files[activeTab] ?? files[0];
    if (activeFile && activeFile.content.trim()) {
      setInput(activeFile.content);
    }
    setConfig(prev => ({
      ...prev,
      sourceLanguage: prev.targetLanguage,
      targetLanguage: prev.sourceLanguage,
    }));
    setActiveTab(0);
  }, [files, activeTab]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="logo">
          <a href={t.ukmmsHomeUrl} className="home-link">
            {t.ukmmsBackLabel}
          </a>
          <span className="logo-icon">⚗️</span>
          <h1>BeanTrans</h1>
        </div>
        <div className="header-right">
          <p className="tagline">{t.tagline}</p>
          <button
            id="lang-toggle-btn"
            type="button"
            className="lang-toggle-btn"
            onClick={handleToggleLocale}
            aria-label={t.langSwitchAria}
          >
            {t.langSwitchLabel}
          </button>
        </div>
      </header>

      <main className="workspace">
        <InputPanel
          value={input}
          onChange={handleInputChange}
          error={error}
          sourceLanguage={config.sourceLanguage}
          onSourceLanguageChange={handleSourceLanguageChange}
          t={t}
        />
        <div className="divider">
          <button
            id="swap-languages-btn"
            type="button"
            className="swap-btn"
            onClick={handleSwapLanguages}
            title={t.swapTitle}
            aria-label={t.swapAria}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="17 2 21 6 17 10" />
              <path d="M3 6h18" />
              <polyline points="7 22 3 18 7 14" />
              <path d="M21 18H3" />
            </svg>
          </button>
        </div>
        <OutputPanel
          files={files}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          language={config.targetLanguage}
          onLanguageChange={handleLanguageChange}
          t={t}
        />
      </main>

      <ConfigPanel
        config={config}
        onChange={setConfig}
        isOpen={configOpen}
        onToggle={() => setConfigOpen(o => !o)}
        t={t}
      />
    </div>
  );
}

export default App;
