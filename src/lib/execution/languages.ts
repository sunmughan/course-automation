export interface LanguageDefinition {
  id: string;
  name: string;
  extension: string;
  monacoLanguage: string;
  compiler?: string;
  compilerArgs?: string[];
  interpreter?: string;
  interpreterArgs?: string[];
  isCompiled: boolean;
  compileCommand?: (sourceFile: string, outputFile: string) => string;
  executeCommand?: (sourceOrOutputFile: string) => string;
  defaultCode: string;
  aliases: string[];
}

/**
 * Language registry for all supported execution languages.
 * Languages that can be executed in the sandbox must have a runtime
 * (compiler + interpreter) defined.
 */
export const LANGUAGE_REGISTRY: Record<string, LanguageDefinition> = {
  javascript: {
    id: "javascript",
    name: "JavaScript",
    extension: ".js",
    monacoLanguage: "javascript",
    interpreter: "node",
    interpreterArgs: ["--no-warnings"],
    isCompiled: false,
    executeCommand: (sourceFile) => `node --no-warnings "${sourceFile}"`,
    defaultCode: `// JavaScript\nconsole.log("Hello, world!");\n`,
    aliases: ["js", "javascript", "node"],
  },
  typescript: {
    id: "typescript",
    name: "TypeScript",
    extension: ".ts",
    monacoLanguage: "typescript",
    compiler: "tsc",
    isCompiled: true,
    compileCommand: (sourceFile, outputFile) => `tsc "${sourceFile}" --outFile "${outputFile}" --target ES2020 --module commonjs --skipLibCheck`,
    executeCommand: (outputFile) => `node "${outputFile}"`,
    defaultCode: `// TypeScript\nconst message: string = "Hello, world!";\nconsole.log(message);\n`,
    aliases: ["ts", "typescript"],
  },
  python: {
    id: "python",
    name: "Python",
    extension: ".py",
    monacoLanguage: "python",
    interpreter: process.platform === "win32" ? "python" : "python3",
    interpreterArgs: ["-u"],
    isCompiled: false,
    executeCommand: (sourceFile) => (process.platform === "win32" ? `python -u "${sourceFile}"` : `python3 -u "${sourceFile}"`),
    defaultCode: `# Python\nprint("Hello, world!")\n`,
    aliases: ["py", "python", "python3"],
  },
  java: {
    id: "java",
    name: "Java",
    extension: ".java",
    monacoLanguage: "java",
    compiler: "javac",
    isCompiled: true,
    compileCommand: (sourceFile, outputDir) => `javac "${sourceFile}" -d "${outputDir}"`,
    executeCommand: (className) => `java -cp "${className}" Main`,
    defaultCode: `// Java\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, world!");\n    }\n}\n`,
    aliases: ["java", "jvm"],
  },
  c: {
    id: "c",
    name: "C",
    extension: ".c",
    monacoLanguage: "c",
    compiler: "gcc",
    isCompiled: true,
    compileCommand: (sourceFile, outputFile) => `gcc "${sourceFile}" -o "${outputFile}" -Wall -O0`,
    executeCommand: (outputFile) => `"${outputFile}"`,
    defaultCode: `// C\n#include <stdio.h>\n\nint main() {\n    printf("Hello, world!\\n");\n    return 0;\n}\n`,
    aliases: ["c", "gcc"],
  },
  cpp: {
    id: "cpp",
    name: "C++",
    extension: ".cpp",
    monacoLanguage: "cpp",
    compiler: "g++",
    isCompiled: true,
    compileCommand: (sourceFile, outputFile) => `g++ "${sourceFile}" -o "${outputFile}" -Wall -O0 -std=c++17`,
    executeCommand: (outputFile) => `"${outputFile}"`,
    defaultCode: `// C++\n#include <iostream>\n\nint main() {\n    std::cout << "Hello, world!" << std::endl;\n    return 0;\n}\n`,
    aliases: ["cpp", "c++", "cplusplus"],
  },
  kotlin: {
    id: "kotlin",
    name: "Kotlin",
    extension: ".kt",
    monacoLanguage: "kotlin",
    compiler: "kotlinc",
    isCompiled: true,
    compileCommand: (sourceFile, outputJar) => `kotlinc "${sourceFile}" -include-runtime -d "${outputJar}"`,
    executeCommand: (outputJar) => `java -jar "${outputJar}"`,
    defaultCode: `// Kotlin\nfun main() {\n    println("Hello, world!")\n}\n`,
    aliases: ["kt", "kotlin"],
  },
  html: {
    id: "html",
    name: "HTML",
    extension: ".html",
    monacoLanguage: "html",
    isCompiled: false,
    defaultCode: `<!-- HTML -->\n<!DOCTYPE html>\n<html>\n<body>\n  <h1>Hello, world!</h1>\n</body>\n</html>\n`,
    aliases: ["html"],
  },
  css: {
    id: "css",
    name: "CSS",
    extension: ".css",
    monacoLanguage: "css",
    isCompiled: false,
    defaultCode: `/* CSS */\nbody {\n  font-family: sans-serif;\n  color: #333;\n}\n`,
    aliases: ["css"],
  },
  json: {
    id: "json",
    name: "JSON",
    extension: ".json",
    monacoLanguage: "json",
    isCompiled: false,
    defaultCode: `{\n  "message": "Hello, world!"\n}\n`,
    aliases: ["json"],
  },
  sql: {
    id: "sql",
    name: "SQL",
    extension: ".sql",
    monacoLanguage: "sql",
    isCompiled: false,
    defaultCode: `-- SQL\nSELECT 'Hello, world!' AS message;\n`,
    aliases: ["sql"],
  },
  markdown: {
    id: "markdown",
    name: "Markdown",
    extension: ".md",
    monacoLanguage: "markdown",
    isCompiled: false,
    defaultCode: `# Markdown\n\nHello, **world**!\n`,
    aliases: ["md", "markdown"],
  },
  php: {
    id: "php",
    name: "PHP",
    extension: ".php",
    monacoLanguage: "php",
    interpreter: "php",
    interpreterArgs: [],
    isCompiled: false,
    executeCommand: (sourceFile) => `php "${sourceFile}"`,
    defaultCode: `<?php\n// PHP 8+ Modern Execution\necho "Hello, world!\\n";\n`,
    aliases: ["php", "php8", "php-cli"],
  },
};

export const EXECUTABLE_LANGUAGES: string[] = [
  "javascript",
  "typescript",
  "python",
  "java",
  "c",
  "cpp",
  "kotlin",
  "php",
];

export const DISPLAY_ONLY_LANGUAGES: string[] = [
  "html",
  "css",
  "json",
  "sql",
  "markdown",
];

export function getLanguageDefinition(language: string): LanguageDefinition | undefined {
  const direct = LANGUAGE_REGISTRY[language.toLowerCase()];
  if (direct) return direct;

  for (const def of Object.values(LANGUAGE_REGISTRY)) {
    if (def.aliases.some((a) => a.toLowerCase() === language.toLowerCase())) {
      return def;
    }
  }

  return undefined;
}

export function isExecutableLanguage(language: string): boolean {
  return EXECUTABLE_LANGUAGES.includes(language.toLowerCase());
}

export function isDisplayOnlyLanguage(language: string): boolean {
  return DISPLAY_ONLY_LANGUAGES.includes(language.toLowerCase());
}

export function detectLanguageFromCode(code: string): string {
  const trimmed = code.trim();

  if (trimmed.startsWith("//") || trimmed.startsWith("function") || trimmed.startsWith("const") || trimmed.startsWith("let") || trimmed.startsWith("var")) {
    return "javascript";
  }

  if (trimmed.startsWith("import ") || trimmed.startsWith("export ") || trimmed.includes(": string") || trimmed.includes(": number")) {
    if (trimmed.includes("React") || trimmed.includes("JSX")) return "typescript";
    if (trimmed.includes("interface") || trimmed.includes("type ")) return "typescript";
  }

  if (trimmed.startsWith("#") && !trimmed.startsWith("#include") && !trimmed.startsWith("##")) {
    return "python";
  }
  if (trimmed.startsWith("import ") && !trimmed.includes(";") && !trimmed.includes("from")) {
    return "python";
  }
  if (trimmed.startsWith("print(") || trimmed.startsWith("def ") || trimmed.startsWith("class ")) {
    return "python";
  }

  if (trimmed.startsWith("public class ") || trimmed.startsWith("class ") && trimmed.includes("public static")) {
    return "java";
  }

  if (trimmed.startsWith("#include <")) {
    if (trimmed.includes("iostream") || trimmed.includes("std::")) return "cpp";
    return "c";
  }

  if (trimmed.startsWith("fun main(") || trimmed.startsWith("package ")) {
    return "kotlin";
  }

  if (trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html")) {
    return "html";
  }

  if (trimmed.includes("{") && trimmed.includes("}") && trimmed.includes(":")) {
    return "css";
  }

  if (trimmed.startsWith("SELECT ") || trimmed.startsWith("CREATE ") || trimmed.startsWith("INSERT ")) {
    return "sql";
  }

  return "javascript";
}