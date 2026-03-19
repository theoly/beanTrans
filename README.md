# BeanTrans ⚗️

**JSON ↔ Java · Go · Python · TS · Kotlin · Rust · Protobuf · SQL**

BeanTrans is a fast, robust, and bi-directional AST conversion engine embedded in a modern React web application. Built for developers, it translates raw JSON payloads or existing object/struct definitions from 8 distinct programming languages into 8 distinct targets — a true **9x9 conversion matrix**.

## 🚀 Features

- **Bi-Directional 9x9 Pipeline:** Not just JSON-to-code; you can paste a Java class, Python dataclass, or Rust struct, and BeanTrans will parse it into a normalized Abstract Syntax Tree (AST), allowing generation into any other supported format natively.
- **Nested Object Support:** Deeply nested JSON objects are intelligently split into multiple companion tables, structs, classes, or models arranged in easy-to-copy tabs.
- **Real-time Syntax Highlighting:** Integrated with `PrismJS` and `react-simple-code-editor`, source code in **both** the Input Editor and the Output Viewer is vividly colored according to language syntax.
- **Fine-Tuned Config Engine:** The application provides a configuration drawer offering precise output control, including:
  - **SQL Dialects:** Switch generated DDL between MySQL, PostgreSQL, and SQLite mapping structures.
  - **Rust Serde Derives:** Append auto-derives and `rename` macros.
  - **Python Dataclass:** Use modern Python 3.7+ `@dataclass` structures.
  - **Java Lombok:** Toggle automatic generation of `@Data`, `@NoArgsConstructor`, etc.
  - **Go JSON Tags:** Generate standard Go `json:"field_name"` mappings.
- **Formatter:** An integrated auto-formatter fixes indentation for inputs and deeply nested JSON.
- **Dark Mode native:** A sleek, fully customized dark interface designed for readability.

## 🛠 Supported Languages (Any to Any)

Any component on the left can convert directly to any component on the right.

| Source Input       | Output Generation  |
|--------------------|--------------------|
| ✅ JSON             | ✅ JSON            |
| ✅ Java Class       | ✅ Java Class      |
| ✅ Go Struct        | ✅ Go Struct       |
| ✅ Python Class     | ✅ Python Class    |
| ✅ TypeScript       | ✅ TypeScript I/F  |
| ✅ Kotlin DataClass | ✅ Kotlin DataClass|
| ✅ Rust Struct      | ✅ Rust Struct     |
| ✅ Protobuf Message | ✅ Protobuf Message|
| ✅ SQL DDL          | ✅ SQL DDL         |

## 🏗 How it Works

Unlike direct regex replacements, BeanTrans is powered by a robust **AST layer**:
1. **Parser:** Uses regex and lexical extraction bounds to convert incoming formatted code into a clean JSON-AST (`engine/parsers`).
2. **Intermediate AST:** Standardizes types (`string`, `number` (float vs int), `boolean`, `array`, `object`, `null`) and nullability.
3. **Generators:** Translates the standardized AST back into typed language schemas with complex handling for language-specific idioms (`engine/generators`).

## 💻 Running Locally

This project is built using React, Vite, and TypeScript.
You'll need `Node.js` and `pnpm` installed.

```bash
# Install dependencies
pnpm install

# Run the development server
pnpm dev
```

Visit the console URL provided (typically `http://localhost:5174/`) to use the application!
