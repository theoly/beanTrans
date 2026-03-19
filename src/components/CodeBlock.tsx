import { useEffect, useRef } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-kotlin';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-protobuf';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-rust';

interface CodeBlockProps {
  code: string;
  language: string;
}

const languageMap: Record<string, string> = {
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

export default function CodeBlock({ code, language }: CodeBlockProps) {
  const codeRef = useRef<HTMLElement>(null);
  const prismLang = languageMap[language] || 'plaintext';

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [code, language]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  };

  return (
    <div className="code-block">
      <button className="copy-btn" onClick={handleCopy} title="Copy to clipboard">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      </button>
      <pre>
        <code ref={codeRef} className={`language-${prismLang}`}>
          {code}
        </code>
      </pre>
    </div>
  );
}
