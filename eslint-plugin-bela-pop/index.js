const BRAND_PATTERN = /[bB][eE][lL][aA][pP][oO][pP]/g;
const EXPECTED = "BelaPop";
const IGNORED_JSX_ATTRS = new Set(["className", "class", "href", "src"]);
const TECH_PATTERN = /^[a-z0-9-_/.:@]+$/;

function hasTechnicalShape(text) {
  return TECH_PATTERN.test(text) && /[-_/.:@]/.test(text);
}

function getJsxAttributeName(nameNode) {
  if (!nameNode) return "";
  if (nameNode.type === "JSXIdentifier") return nameNode.name;
  if (nameNode.type === "JSXNamespacedName") return `${nameNode.namespace.name}:${nameNode.name.name}`;
  return "";
}

function shouldSkipText(node, value, sourceCode) {
  if (!value) return true;
  const trimmed = value.trim();
  if (!trimmed) return true;

  if (trimmed.includes("mailto:") || trimmed.includes("@") || trimmed.startsWith("http")) {
    return true;
  }

  const parent = node.parent;
  if (parent) {
    if (
      parent.type === "ImportDeclaration" ||
      parent.type === "ExportNamedDeclaration" ||
      parent.type === "ExportAllDeclaration"
    ) {
      return true;
    }

    if (parent.type === "CallExpression") {
      const calleeText = sourceCode.getText(parent.callee);
      if (calleeText === "require" || calleeText === "import") {
        return true;
      }
    }

    if (parent.type === "ImportExpression") {
      return true;
    }

    if (parent.type === "JSXAttribute") {
      const attrName = getJsxAttributeName(parent.name);
      if (attrName && (IGNORED_JSX_ATTRS.has(attrName) || attrName.startsWith("data-"))) {
        return true;
      }
    }
  }

  return hasTechnicalShape(trimmed);
}

function scanText(context, sourceCode, node, rawText) {
  if (!rawText) return;
  BRAND_PATTERN.lastIndex = 0;
  let match;
  const baseIndex = Array.isArray(node.range) ? node.range[0] : node.start ?? 0;
  while ((match = BRAND_PATTERN.exec(rawText)) !== null) {
    if (match[0] === EXPECTED) {
      continue;
    }
    const startIndex = baseIndex + match.index;
    const endIndex = startIndex + match[0].length;
    context.report({
      loc: {
        start: sourceCode.getLocFromIndex(startIndex),
        end: sourceCode.getLocFromIndex(endIndex)
      },
      message: "Use 'BelaPop' (case-sensitive) whenever you mention the brand."
    });
  }
}

function processLiteral(context, sourceCode, node, value) {
  if (typeof value !== "string") return;
  if (shouldSkipText(node, value, sourceCode)) return;
  const rawText = sourceCode.getText(node);
  scanText(context, sourceCode, node, rawText);
}

module.exports = {
  rules: {
    "prefer-bela-pop": {
      meta: {
        type: "suggestion",
        docs: {
          description: "Enforce the stylized spelling of BelaPop inside strings.",
          recommended: "warn"
        },
        schema: []
      },
      create(context) {
        const sourceCode = context.getSourceCode();
        return {
          Literal(node) {
            processLiteral(context, sourceCode, node, node.value);
          },
          TemplateLiteral(node) {
            node.quasis.forEach((quasi) => {
              processLiteral(context, sourceCode, quasi, quasi.value.cooked);
            });
          },
          JSXText(node) {
            processLiteral(context, sourceCode, node, node.value);
          }
        };
      }
    }
  }
};
