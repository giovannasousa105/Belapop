const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const ROOT = process.cwd();
const TARGET_DIRS = ["app", "components", "data"];
const ALLOWED_EXT = new Set([".tsx", ".ts", ".jsx", ".js", ".md", ".txt"]);
const IGNORED_PATHS = ["app/belapop", "app/orders"];
const IGNORED_JSX_ATTRS = new Set(["className", "class", "href", "src"]);
const BRAND_REGEX = /[bB][eE][lL][aA][pP][oO][pP]/g;
const TECH_PATTERN = /^[a-z0-9-_/.:@]+$/;

const SCRIPT_KIND_BY_EXT = {
  ".ts": ts.ScriptKind.TS,
  ".tsx": ts.ScriptKind.TSX,
  ".js": ts.ScriptKind.JS,
  ".jsx": ts.ScriptKind.JSX
};

const violations = [];

function shouldExplore(dir) {
  const relativePath = path.relative(ROOT, dir);
  if (!relativePath || relativePath === "") return true;
  return TARGET_DIRS.some((target) => relativePath.startsWith(target));
}

function isAllowedFile(fullPath) {
  return ALLOWED_EXT.has(path.extname(fullPath).toLowerCase());
}

function isIgnoredPath(relativePath) {
  return IGNORED_PATHS.some((ignored) => relativePath.startsWith(ignored));
}

function recordViolation(file, line, value) {
  violations.push({ file, line, value });
}

function scanTextFile(fullPath, text) {
  const relativePath = path.relative(ROOT, fullPath).replace(/\\/g, "/");
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    BRAND_REGEX.lastIndex = 0;
    let match;
    while ((match = BRAND_REGEX.exec(line)) !== null) {
      if (match[0] === "BelaPop") continue;
      recordViolation(relativePath, index + 1, match[0]);
    }
  });
}

function scanSegment(rawText, absoluteStart, sourceFile, relativePath) {
  BRAND_REGEX.lastIndex = 0;
  let match;
  while ((match = BRAND_REGEX.exec(rawText)) !== null) {
    if (match[0] === "BelaPop") continue;
    const position = sourceFile.getLineAndCharacterOfPosition(absoluteStart + match.index);
    recordViolation(relativePath, position.line + 1, match[0]);
  }
}

function isTechnicalString(value) {
  if (!value) return false;
  return TECH_PATTERN.test(value) && /[-_/.:@]/.test(value);
}

function getJsxAttributeAncestor(node) {
  let current = node.parent;
  while (current) {
    if (ts.isJsxAttribute(current)) {
      return current;
    }
    current = current.parent;
  }
  return null;
}

function shouldSkipSegment(node, valueText, sourceFile) {
  const trimmed = valueText.trim();
  if (!trimmed) return true;

  if (trimmed.includes("mailto:") || trimmed.includes("@") || trimmed.startsWith("http")) {
    return true;
  }

  const attribute = getJsxAttributeAncestor(node);
  if (attribute) {
    const attrName = attribute.name?.getText(sourceFile);
    if (attrName) {
      if (IGNORED_JSX_ATTRS.has(attrName) || attrName.startsWith("data-")) {
        return true;
      }
    }
  }

  const parent = node.parent;
  if (parent) {
    if (ts.isImportDeclaration(parent) || ts.isExportDeclaration(parent)) {
      return true;
    }

    if (ts.isCallExpression(parent)) {
      const callee = parent.expression.getText(sourceFile);
      if (callee === "require" || callee === "import") {
        return true;
      }
    }

    if (ts.isJsxAttribute(parent)) {
      const attrName = parent.name?.getText(sourceFile);
      if (attrName) {
        if (IGNORED_JSX_ATTRS.has(attrName) || attrName.startsWith("data-")) {
          return true;
        }
      }
    }
  }

  return isTechnicalString(trimmed);
}

function handleLiteralNode(node, sourceFile, relativePath) {
  const start = node.getStart(sourceFile);
  const rawText = node.getText(sourceFile);
  if (shouldSkipSegment(node, node.text, sourceFile)) {
    return;
  }
  scanSegment(rawText, start, sourceFile, relativePath);
}

function handleNode(node, sourceFile, relativePath) {
  const start = node.getStart(sourceFile);
  const rawText = node.getText(sourceFile);

  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    handleLiteralNode(node, sourceFile, relativePath);
  } else if (
    node.kind === ts.SyntaxKind.TemplateHead ||
    node.kind === ts.SyntaxKind.TemplateMiddle ||
    node.kind === ts.SyntaxKind.TemplateTail
  ) {
    const text = node.text;
    if (!shouldSkipSegment(node, text, sourceFile)) {
      scanSegment(rawText, start, sourceFile, relativePath);
    }
  } else if (ts.isJsxText(node)) {
    if (!shouldSkipSegment(node, rawText, sourceFile)) {
      scanSegment(rawText, start, sourceFile, relativePath);
    }
  }
}

function scanCodeFile(fullPath, text) {
  const relativePath = path.relative(ROOT, fullPath).replace(/\\/g, "/");
  const ext = path.extname(fullPath).toLowerCase();
  const scriptKind = SCRIPT_KIND_BY_EXT[ext] ?? ts.ScriptKind.TSX;
  const sourceFile = ts.createSourceFile(fullPath, text, ts.ScriptTarget.Latest, true, scriptKind);

  function visit(node) {
    handleNode(node, sourceFile, relativePath);
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
}

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      if (!shouldExplore(fullPath)) continue;
      scanDir(fullPath);
      continue;
    }

    if (!isAllowedFile(fullPath)) continue;

    const relativePath = path.relative(ROOT, fullPath).replace(/\\/g, "/");
    if (isIgnoredPath(relativePath)) continue;

    let text;
    try {
      text = fs.readFileSync(fullPath, "utf8");
    } catch (error) {
      continue;
    }

    const ext = path.extname(fullPath).toLowerCase();
    if (ext === ".md" || ext === ".txt") {
      scanTextFile(fullPath, text);
    } else {
      scanCodeFile(fullPath, text);
    }
  }
}

for (const target of TARGET_DIRS) {
  const baseDir = path.join(ROOT, target);
  if (fs.existsSync(baseDir)) {
    scanDir(baseDir);
  }
}

if (violations.length) {
  console.log("📛 Branding violations (use BelaPop):");
  violations.forEach((violation) => {
    console.log(`${violation.file}:${violation.line} → ${violation.value}`);
  });
  process.exit(1);
}

console.log("✅ Todas as ocorrências escritas como BelaPop.");
