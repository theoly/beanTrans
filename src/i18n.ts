export type Locale = 'en' | 'zh';

export interface BeanTransMessages {
  docTitle: string;
  ukmmsHomeUrl: string;
  ukmmsBackLabel: string;
  langSwitchLabel: string;
  langSwitchAria: string;
  tagline: string;
  inputTitle: string;
  formatTitle: string;
  invalidInputFallback: string;
  unsupportedSourcePrefix: string;
  sourceLangAria: string;
  targetLangAria: string;
  swapTitle: string;
  swapAria: string;
  outputTitle: string;
  copyCurrentTitle: string;
  copyAllLabel: string;
  copyAllTitle: string;
  copySuccess: string;
  copyFail: string;
  copyBlockTitle: string;
  emptyStateHint: string;
  configToggleLabel: string;
  sectionGeneral: string;
  rootClassName: string;
  numberType: string;
  indent: string;
  spaces2: string;
  spaces4: string;
  nullableFields: string;
  sectionJava: string;
  useLombok: string;
  useJackson: string;
  accessModifier: string;
  accessPrivateWithGetters: string;
  accessPrivate: string;
  accessPublic: string;
  accessPublicDefault: string;
  ormAnnotations: string;
  ormNone: string;
  sectionGo: string;
  goJsonTags: string;
  sectionPython: string;
  pythonDataclass: string;
  sectionRust: string;
  rustDeriveSerde: string;
  sectionSql: string;
  sqlDialect: string;
}

export const messages: Record<Locale, BeanTransMessages> = {
  en: {
    docTitle: 'BeanTrans · 9×9 Bi-Directional AST Schema Converter | UKMMS',
    ukmmsHomeUrl: '/',
    ukmmsBackLabel: '← UKMMS',
    langSwitchLabel: '简体中文',
    langSwitchAria: 'Switch to Simplified Chinese',
    tagline: 'JSON ↔ Java · Go · Python · TS · Kotlin · Rust · Protobuf · SQL',
    inputTitle: 'Input',
    formatTitle: 'Format / Pretty Print',
    invalidInputFallback: 'Invalid input',
    unsupportedSourcePrefix: 'Unsupported source language: ',
    sourceLangAria: 'Source language',
    targetLangAria: 'Target language',
    swapTitle: 'Swap source & target (retains active output tab)',
    swapAria: 'Swap source and target languages',
    outputTitle: 'Output',
    copyCurrentTitle: 'Copy current tab',
    copyAllLabel: 'All',
    copyAllTitle: 'Copy all tabs',
    copySuccess: '✓ Copied!',
    copyFail: '✗ Failed',
    copyBlockTitle: 'Copy to clipboard',
    emptyStateHint: 'Enter valid input to see generated code',
    configToggleLabel: 'Config',
    sectionGeneral: 'General',
    rootClassName: 'Root Class Name',
    numberType: 'Number Type',
    indent: 'Indent',
    spaces2: '2 spaces',
    spaces4: '4 spaces',
    nullableFields: 'Nullable fields',
    sectionJava: 'Java',
    useLombok: 'Use Lombok @Data',
    useJackson: 'Generate Jackson @JsonProperty',
    accessModifier: 'Access Modifier',
    accessPrivateWithGetters: 'private + getters/setters',
    accessPrivate: 'private',
    accessPublic: 'public',
    accessPublicDefault: 'public (default)',
    ormAnnotations: 'ORM Annotations',
    ormNone: 'None / Plain',
    sectionGo: 'Go',
    goJsonTags: 'Generate json tags',
    sectionPython: 'Python',
    pythonDataclass: 'Use @dataclass',
    sectionRust: 'Rust',
    rustDeriveSerde: 'Derive Serialize/Deserialize',
    sectionSql: 'SQL DDL',
    sqlDialect: 'Dialect',
  },
  zh: {
    docTitle: 'BeanTrans · 9×9 双向 AST 多语言代码转换引擎 | UKMMS',
    ukmmsHomeUrl: '/zh/',
    ukmmsBackLabel: '← UKMMS',
    langSwitchLabel: 'English',
    langSwitchAria: '切换为英文',
    tagline: 'JSON ↔ Java · Go · Python · TS · Kotlin · Rust · Protobuf · SQL',
    inputTitle: '输入源码',
    formatTitle: '格式化 / 美化代码',
    invalidInputFallback: '输入语法无效',
    unsupportedSourcePrefix: '暂不支持的源语言：',
    sourceLangAria: '源语言',
    targetLangAria: '目标语言',
    swapTitle: '互换源与目标语言（保留当前目标标签页内容）',
    swapAria: '互换源语言与目标语言',
    outputTitle: '生成结果',
    copyCurrentTitle: '复制当前标签页',
    copyAllLabel: '全部',
    copyAllTitle: '复制全部标签页',
    copySuccess: '✓ 已复制！',
    copyFail: '✗ 复制失败',
    copyBlockTitle: '复制到剪贴板',
    emptyStateHint: '在左侧输入有效的结构或 JSON，即可实时生成代码',
    configToggleLabel: '生成配置',
    sectionGeneral: '通用设置',
    rootClassName: '根类名',
    numberType: '数值映射类型',
    indent: '缩进宽度',
    spaces2: '2 个空格',
    spaces4: '4 个空格',
    nullableFields: '允许字段可空',
    sectionJava: 'Java 选项',
    useLombok: '启用 Lombok @Data',
    useJackson: '生成 Jackson @JsonProperty',
    accessModifier: '访问修饰符',
    accessPrivateWithGetters: 'private + getter/setter',
    accessPrivate: 'private',
    accessPublic: 'public',
    accessPublicDefault: 'public（默认）',
    ormAnnotations: 'ORM 注解',
    ormNone: '无 / 纯 POJO',
    sectionGo: 'Go 选项',
    goJsonTags: '生成 json 标签',
    sectionPython: 'Python 选项',
    pythonDataclass: '使用 @dataclass',
    sectionRust: 'Rust 选项',
    rustDeriveSerde: '派生 Serialize/Deserialize',
    sectionSql: 'SQL DDL 选项',
    sqlDialect: '数据库方言',
  },
};

export function detectInitialLocale(): Locale {
  if (typeof window === 'undefined') {
    return 'en';
  }
  try {
    const pref = window.localStorage.getItem('ukmms_lang_pref');
    if (pref === 'zh' || pref === 'en') {
      return pref;
    }
  } catch {
    // ignore storage errors
  }
  const ua = navigator.userAgent || '';
  const isBot = /bot|crawl|spider|slurp|bingpreview|googlebot|gptbot|oai-searchbot|claudebot|perplexitybot|bytespider|applebot/i.test(ua);
  const navLang = (navigator.language || '').toLowerCase();
  if (!isBot && navLang.startsWith('zh')) {
    return 'zh';
  }
  return 'en';
}

export function persistLocale(locale: Locale): void {
  try {
    window.localStorage.setItem('ukmms_lang_pref', locale);
  } catch {
    // ignore storage errors
  }
}
