import { useState } from 'react';
import type { GeneratedFile, TargetLanguage } from '../engine/types';
import CodeBlock from './CodeBlock';

interface OutputPanelProps {
  files: GeneratedFile[];
  activeTab: number;
  onTabChange: (index: number) => void;
  language: TargetLanguage;
  onLanguageChange: (lang: TargetLanguage) => void;
}

const languages: { value: TargetLanguage; label: string }[] = [
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

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    return true;
  }
}

export default function OutputPanel({
  files,
  activeTab,
  onTabChange,
  language,
  onLanguageChange,
}: OutputPanelProps) {
  const currentFile = files[activeTab] || null;
  const [copyFeedback, setCopyFeedback] = useState('');

  const handleCopyAll = async () => {
    const allContent = files.map(f => `// === ${f.fileName} ===\n${f.content}`).join('\n\n');
    const ok = await copyToClipboard(allContent);
    setCopyFeedback(ok ? '✓ Copied!' : '✗ Failed');
    setTimeout(() => setCopyFeedback(''), 2000);
  };

  const handleCopyCurrent = async () => {
    if (!currentFile) return;
    const ok = await copyToClipboard(currentFile.content);
    setCopyFeedback(ok ? '✓ Copied!' : '✗ Failed');
    setTimeout(() => setCopyFeedback(''), 2000);
  };

  return (
    <div className="panel output-panel">
      <div className="panel-header">
        <h2>Output</h2>
        {files.length > 0 && (
          <>
            <button
              className="action-btn"
              onClick={handleCopyCurrent}
              title="Copy current tab"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </button>
            {files.length > 1 && (
              <button
                className="action-btn copy-all-btn"
                onClick={handleCopyAll}
                title="Copy all tabs"
              >
                All
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
            )}
            {copyFeedback && <span className="copy-feedback">{copyFeedback}</span>}
          </>
        )}
        <select
          id="language-selector"
          className="lang-select"
          value={language}
          onChange={e => onLanguageChange(e.target.value as TargetLanguage)}
        >
          {languages.map(l => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
      </div>

      {files.length > 0 && (
        <>
          <div className="tab-bar" role="tablist">
            {files.map((file, i) => (
              <button
                key={file.fileName}
                role="tab"
                aria-selected={i === activeTab}
                className={`tab ${i === activeTab ? 'active' : ''}`}
                onClick={() => onTabChange(i)}
              >
                {file.fileName}
              </button>
            ))}
          </div>
          {currentFile && (
            <div className="tab-content">
              <CodeBlock code={currentFile.content} language={currentFile.language} />
            </div>
          )}
        </>
      )}

      {files.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">⚡</div>
          <p>Enter valid input to see generated code</p>
        </div>
      )}
    </div>
  );
}
