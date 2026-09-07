#!/usr/bin/env bash
# Phase 0 inventory for the auditor agent.
# Usage: bash inventory.sh [target-dir]   (default: .)
# Writes .audit/inventory.md and .audit/tools/*.txt under the target.
# Never fails the whole run because one tool is missing or errors.

set -u
TARGET="${1:-.}"
cd "$TARGET" || { echo "cannot cd to $TARGET" >&2; exit 1; }
ROOT="$(pwd)"
OUT="$ROOT/.audit"
TOOLS="$OUT/tools"
mkdir -p "$TOOLS"
INV="$OUT/inventory.md"

have() { command -v "$1" >/dev/null 2>&1; }
# run "<label>" cmd args...  -> capture stdout+stderr to tools/<label>.txt
run() {
  local label="$1"; shift
  local f="$TOOLS/$label.txt"
  if ! have "$1"; then echo "[skipped: $1 not installed]" > "$f"; return; fi
  echo "\$ $*" > "$f"
  "$@" >> "$f" 2>&1
  echo "[exit $?]" >> "$f"
}

is_git=0
git rev-parse --git-dir >/dev/null 2>&1 && is_git=1

{
  echo "# Inventory"
  echo
  echo "- generated: $(date -u +%FT%TZ)"
  echo "- root: \`$ROOT\`"
  if [ "$is_git" = 1 ]; then
    echo "- git commit: \`$(git rev-parse HEAD 2>/dev/null)\`"
    echo "- git branch: \`$(git rev-parse --abbrev-ref HEAD 2>/dev/null)\`"
    dirty=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
    echo "- uncommitted changes: $dirty file(s)"
  else
    echo "- git: not a repository"
  fi
  echo
} > "$INV"

# ---- file list -------------------------------------------------------------
FILELIST="$OUT/filelist.txt"
if [ "$is_git" = 1 ]; then
  git ls-files 2>/dev/null > "$FILELIST"
  git ls-files --others --exclude-standard 2>/dev/null >> "$FILELIST"
else
  find . -type f \
    -not -path '*/.git/*' -not -path '*/node_modules/*' -not -path '*/.venv/*' \
    -not -path '*/venv/*' -not -path '*/target/*' -not -path '*/dist/*' \
    -not -path '*/build/*' -not -path '*/.audit/*' -not -path '*/__pycache__/*' \
    2>/dev/null | sed 's|^\./||' > "$FILELIST"
fi
total=$(wc -l < "$FILELIST" | tr -d ' ')

{
  echo "## Files"
  echo
  echo "- tracked/relevant files: $total"
  echo
  echo "### By extension"
  echo
  echo '```'
  sed -n 's/.*\.\([A-Za-z0-9_]\+\)$/\1/p' "$FILELIST" | sort | uniq -c | sort -rn | head -40
  echo '```'
  echo
  echo "### Top-level entries"
  echo
  echo '```'
  ls -1 "$ROOT"
  echo '```'
  echo
} >> "$INV"

# ---- language / size -----------------------------------------------------
if have tokei; then
  run tokei tokei "$ROOT"
elif have cloc; then
  run cloc cloc --quiet "$ROOT"
fi

# ---- symbol index ------------------------------------------------------------
if have ctags; then
  ( cd "$ROOT" && ctags -R --fields=+n -f "$OUT/tags" . ) 2>>"$TOOLS/ctags.txt"
  if [ -f "$OUT/tags" ]; then
    grep -vc '^!' "$OUT/tags" > "$TOOLS/ctags-count.txt" 2>/dev/null
    echo "ctags: $(cat "$TOOLS/ctags-count.txt" 2>/dev/null) symbols -> .audit/tags" >> "$INV"
  fi
else
  echo "[skipped: ctags not installed]" > "$TOOLS/ctags.txt"
fi

# ---- static analysis / type check / lint ---------------------------------
# Python
if ls "$ROOT"/*.py >/dev/null 2>&1 || grep -q '\.py$' "$FILELIST"; then
  run ruff        ruff check --output-format=concise "$ROOT"
  run mypy        mypy --no-error-summary "$ROOT"
  run bandit      bandit -r -q "$ROOT"
  run pip-audit   pip-audit
fi
# JS / TS
if [ -f "$ROOT/package.json" ]; then
  run npm-audit   npm audit --omit=dev
  run eslint      npx --no-install eslint .
  if [ -f "$ROOT/tsconfig.json" ]; then
    run tsc       npx --no-install tsc --noEmit
  fi
fi
# Rust
if [ -f "$ROOT/Cargo.toml" ]; then
  run clippy      cargo clippy --quiet --all-targets
  run cargo-audit cargo audit
fi
# Go
if [ -f "$ROOT/go.mod" ]; then
  run go-vet      go vet ./...
  run staticcheck staticcheck ./...
  run govulncheck govulncheck ./...
fi
# Shell
if grep -q '\.sh$' "$FILELIST"; then
  # shellcheck every tracked .sh
  if have shellcheck; then
    : > "$TOOLS/shellcheck.txt"
    while IFS= read -r f; do
      [ -f "$ROOT/$f" ] && { echo "### $f" >> "$TOOLS/shellcheck.txt"; shellcheck "$ROOT/$f" >> "$TOOLS/shellcheck.txt" 2>&1; }
    done < <(grep '\.sh$' "$FILELIST")
  else
    echo "[skipped: shellcheck not installed]" > "$TOOLS/shellcheck.txt"
  fi
fi

# ---- cross-language security scanners -----------------------------------
run semgrep   semgrep --error --quiet --config auto "$ROOT"
run gitleaks  gitleaks detect --no-banner --redact -s "$ROOT"
run trivy-fs  trivy fs --quiet --scanners vuln,secret,misconfig "$ROOT"

# ---- tests + coverage --------------------------------------------------------
if grep -qE '(test_|_test\.|\.test\.|/tests?/)' "$FILELIST"; then
  if have pytest;  then run pytest  pytest -q --no-header; fi
  if [ -f "$ROOT/package.json" ] && grep -q '"test"' "$ROOT/package.json"; then
    run npm-test npm test --silent
  fi
  if [ -f "$ROOT/Cargo.toml" ]; then run cargo-test cargo test --quiet; fi
  if [ -f "$ROOT/go.mod" ];      then run go-test    go test ./...;      fi
fi

# ---- dependency manifests ---------------------------------------------------
{
  echo "## Dependency manifests present"
  echo
  echo '```'
  for m in package.json package-lock.json pnpm-lock.yaml yarn.lock \
           requirements.txt pyproject.toml poetry.lock Pipfile.lock \
           Cargo.toml Cargo.lock go.mod go.sum Gemfile.lock composer.lock; do
    [ -f "$ROOT/$m" ] && echo "$m"
  done
  echo '```'
  echo
  echo "## Tool outputs captured"
  echo
  echo '```'
  ls -1 "$TOOLS"
  echo '```'
} >> "$INV"

echo "inventory written to $INV"
echo "tool outputs in $TOOLS"
