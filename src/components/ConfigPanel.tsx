import type { ConvertConfig, NumberMapping, SqlDialect, JavaORM } from '../engine/types';

interface ConfigPanelProps {
  config: ConvertConfig;
  onChange: (config: ConvertConfig) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function ConfigPanel({ config, onChange, isOpen, onToggle }: ConfigPanelProps) {
  const update = (patch: Partial<ConvertConfig>) => {
    onChange({ ...config, ...patch });
  };

  return (
    <div className={`config-panel ${isOpen ? 'open' : ''}`}>
      <button className="config-toggle" onClick={onToggle} id="config-toggle">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
        <span>Config</span>
        <svg className={`chevron ${isOpen ? 'up' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div className="config-body">
          {/* General */}
          <div className="config-section">
            <h3>General</h3>
            <div className="config-row">
              <label htmlFor="root-class-name">Root Class Name</label>
              <input
                id="root-class-name"
                type="text"
                value={config.rootClassName}
                onChange={e => update({ rootClassName: e.target.value || 'Root' })}
                placeholder="Root"
              />
            </div>
            <div className="config-row">
              <label htmlFor="number-mapping">Number Type</label>
              <select
                id="number-mapping"
                value={config.numberMapping}
                onChange={e => update({ numberMapping: e.target.value as NumberMapping })}
              >
                <option value="int">int</option>
                <option value="long">long</option>
                <option value="float">float</option>
                <option value="double">double</option>
                <option value="BigDecimal">BigDecimal</option>
              </select>
            </div>
            <div className="config-row">
              <label htmlFor="indent-size">Indent</label>
              <select
                id="indent-size"
                value={config.indentSize}
                onChange={e => update({ indentSize: Number(e.target.value) as 2 | 4 })}
              >
                <option value="2">2 spaces</option>
                <option value="4">4 spaces</option>
              </select>
            </div>
            <div className="config-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={config.nullableFields}
                  onChange={e => update({ nullableFields: e.target.checked })}
                />
                Nullable fields
              </label>
            </div>
          </div>

          {/* Java-specific */}
          {config.targetLanguage === 'java' && (
            <div className="config-section">
              <h3>Java</h3>
              <div className="config-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={config.useLombok}
                    onChange={e => update({ useLombok: e.target.checked })}
                  />
                  Use Lombok @Data
                </label>
              </div>
              <div className="config-row">
                <label htmlFor="access-modifier">Access Modifier</label>
                <select
                  id="access-modifier"
                  value={config.accessModifier}
                  onChange={e => update({ accessModifier: e.target.value as 'private' | 'public' })}
                >
                  <option value="private">private + getters/setters</option>
                  <option value="public">public</option>
                </select>
              </div>
              <div className="config-row">
                <label htmlFor="java-orm">ORM Annotations</label>
                <select
                  id="java-orm"
                  value={config.javaOrm}
                  onChange={e => update({ javaOrm: e.target.value as JavaORM })}
                >
                  <option value="none">None / Plain</option>
                  <option value="jpa">JPA / Hibernate</option>
                  <option value="mybatis-plus">MyBatis-Plus</option>
                </select>
              </div>
            </div>
          )}

          {/* Kotlin-specific */}
          {config.targetLanguage === 'kotlin' && (
            <div className="config-section">
              <h3>Kotlin</h3>
              <div className="config-row">
                <label htmlFor="kt-access">Access Modifier</label>
                <select
                  id="kt-access"
                  value={config.accessModifier}
                  onChange={e => update({ accessModifier: e.target.value as 'private' | 'public' })}
                >
                  <option value="private">private</option>
                  <option value="public">public (default)</option>
                </select>
              </div>
            </div>
          )}

          {/* Go-specific */}
          {config.targetLanguage === 'go' && (
            <div className="config-section">
              <h3>Go</h3>
              <div className="config-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={config.generateJsonTags}
                    onChange={e => update({ generateJsonTags: e.target.checked })}
                  />
                  Generate json tags
                </label>
              </div>
            </div>
          )}

          {/* Python-specific */}
          {config.targetLanguage === 'python' && (
            <div className="config-section">
              <h3>Python</h3>
              <div className="config-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={config.useDataclass}
                    onChange={e => update({ useDataclass: e.target.checked })}
                  />
                  Use @dataclass
                </label>
              </div>
            </div>
          )}

          {/* Rust-specific */}
          {config.targetLanguage === 'rust' && (
            <div className="config-section">
              <h3>Rust</h3>
              <div className="config-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={config.deriveSerde}
                    onChange={e => update({ deriveSerde: e.target.checked })}
                  />
                  Derive Serialize/Deserialize
                </label>
              </div>
            </div>
          )}

          {/* SQL-specific */}
          {config.targetLanguage === 'sql' && (
            <div className="config-section">
              <h3>SQL DDL</h3>
              <div className="config-row">
                <label htmlFor="sql-dialect">Dialect</label>
                <select
                  id="sql-dialect"
                  value={config.sqlDialect}
                  onChange={e => update({ sqlDialect: e.target.value as SqlDialect })}
                >
                  <option value="mysql">MySQL</option>
                  <option value="postgresql">PostgreSQL</option>
                  <option value="sqlite">SQLite</option>
                </select>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
