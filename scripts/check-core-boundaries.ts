# Run from repo root: D:\last\pramanasystems-core

$ErrorActionPreference = "Stop"

# 1) Create scripts/check-core-boundaries.ts
$checker = @'
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const CORE_SRC_DIR = join(process.cwd(), "packages/core/src");

const FORBIDDEN_PATTERNS = [
  /^fastify$/,
  /^@fastify\//,
  /^redis$/,
  /^@aws-sdk\//,
  /^express$/,
  /^swagger-ui-express$/,
  /^openapi-types$/,
];

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".mts", ".cts", ".js", ".mjs", ".cjs"]);

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...walk(full));
      continue;
    }
    if ([...SOURCE_EXTENSIONS].some((ext) => full.endsWith(ext))) {
      out.push(full);
    }
  }
  return out;
}

function extractSpecifiers(content: string): string[] {
  const specs: string[] = [];

  const importRegex = /import\s+(?:type\s+)?(?:[^'"`;]+?\s+from\s+)?['"]([^'"\n]+)['"]/g;
  const exportFromRegex = /export\s+(?:type\s+)?(?:\*|\{[^}]*\})\s+from\s+['"]([^'"\n]+)['"]/g;
  const dynamicImportRegex = /import\(\s*['"]([^'"\n]+)['"]\s*\)/g;

  for (const regex of [importRegex, exportFromRegex, dynamicImportRegex]) {
    let match: RegExpExecArray | null;
    while ((match = regex.exec(content)) !== null) {
      specs.push(match[1]);
    }
  }

  return specs;
}

const violations: Array<{ file: string; specifier: string }> = [];

for (const file of walk(CORE_SRC_DIR)) {
  const content = readFileSync(file, "utf8");
  for (const specifier of extractSpecifiers(content)) {
    if (FORBIDDEN_PATTERNS.some((pattern) => pattern.test(specifier))) {
      violations.push({ file: relative(process.cwd(), file), specifier });
    }
  }
}

if (violations.length > 0) {
  console.error("Core boundary violation(s) detected in packages/core/src:");
  for (const violation of violations) {
    console.error(`- ${violation.file}: forbidden import "${violation.specifier}"`);
  }
  process.exit(1);
}

console.log("Core boundary check passed: no forbidden infrastructure imports found in packages/core/src.");
'@

New-Item -ItemType Directory -Path ".\scripts" -Force | Out-Null
Set-Content -Path ".\scripts\check-core-boundaries.ts" -Value $checker -Encoding UTF8

# 2) Patch package.json scripts
$pkgPath = ".\package.json"
$pkg = Get-Content $pkgPath -Raw | ConvertFrom-Json

$pkg.scripts."check:boundaries:core" = "tsx ./scripts/check-core-boundaries.ts"
$pkg.scripts.check = "npm run typecheck && npm run check:boundaries:core && npm run test && npm run export:openapi"

# Preserve readable JSON formatting
$pkg | ConvertTo-Json -Depth 100 | Set-Content -Path $pkgPath -Encoding UTF8

# 3) Validate
npm run check:boundaries:core
npm run check

# 4) Commit
git add package.json scripts/check-core-boundaries.ts
git commit -m "Enforce core import boundaries in check pipeline"

Write-Host "Done. Next: git push"