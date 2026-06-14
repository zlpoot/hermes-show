#!/usr/bin/env bash
set -euo pipefail

failures=0

say() {
  printf '%s\n' "$*"
}

fail() {
  failures=$((failures + 1))
  say "FAIL: $*"
}

warn() {
  say "WARN: $*"
}

ok() {
  say "OK: $*"
}

if ! git rev-parse --show-toplevel >/dev/null 2>&1; then
  say "Run this script from inside a git worktree."
  exit 2
fi

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"
base_ref="${BASE_REF:-origin/main}"
merge_base=""

if git rev-parse --verify "$base_ref" >/dev/null 2>&1; then
  merge_base="$(git merge-base "$base_ref" HEAD)"
fi

say "== PM preflight =="
say "Repository: $repo_root"
say "Branch: $(git branch --show-current)"
if [ -n "$merge_base" ]; then
  say "Base ref: $base_ref"
else
  warn "Base ref '$base_ref' is unavailable; committed branch diff checks will be skipped."
fi

changed_files="$(
  {
    if [ -n "$merge_base" ]; then
      git diff --name-only "$merge_base"...HEAD
    fi
    git diff --name-only
    git diff --cached --name-only
    git ls-files --others --exclude-standard
  } | sort -u
)"

say ""
say "== Git status =="
git status --short --untracked-files=all

say ""
say "== Sensitive file names =="
sensitive_files="$(
  printf '%s\n' "$changed_files" \
    | grep -E '(^|/)(\.env(\..*)?|.*\.(db|db-journal|pem|key|p12|pfx)|.*(secret|token|credential).*)$' || true
)"
if [ -n "$sensitive_files" ]; then
  fail "Sensitive-looking files are changed or untracked:"
  printf '%s\n' "$sensitive_files"
else
  ok "No sensitive-looking changed/untracked file names."
fi

say ""
say "== Generated artifacts =="
generated_files="$(
  printf '%s\n' "$changed_files" \
    | grep -E '(^|/)(node_modules|\.nuxt|\.output|coverage|playwright-report|test-results|logs)(/|$)' || true
)"
if [ -n "$generated_files" ]; then
  fail "Generated artifacts are present in git status:"
  printf '%s\n' "$generated_files"
else
  ok "No generated artifacts in git status."
fi

say ""
say "== Diff secret scan =="
secret_hits="$(
  {
    if [ -n "$merge_base" ]; then
      git diff "$merge_base"...HEAD -- . ':!pnpm-lock.yaml'
    fi
    git diff -- . ':!pnpm-lock.yaml'
    git diff --cached -- . ':!pnpm-lock.yaml'
  } | grep -E 'sk-[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9_]{20,}|BEGIN (RSA |OPENSSH |EC |DSA )?PRIVATE KEY|AKIA[0-9A-Z]{16}|xox[baprs]-[A-Za-z0-9-]{20,}|AIza[0-9A-Za-z_-]{35}|[A-Za-z0-9_]*TOKEN[A-Za-z0-9_]*[[:space:]]*=[[:space:]]*['"'"'"][^'"'"'"]{12,}|[A-Za-z0-9_]*SECRET[A-Za-z0-9_]*[[:space:]]*=[[:space:]]*['"'"'"][^'"'"'"]{12,}' || true
)"
if [ -n "$secret_hits" ]; then
  fail "Potential secrets found in diff:"
  printf '%s\n' "$secret_hits"
else
  ok "No common secret patterns found in diff."
fi

say ""
say "== Long-running worktree processes =="
process_hits="$(
  pgrep -fl "$repo_root.*(nuxt|vite|playwright|vitest|node|pnpm)" || true
)"
if [ -n "$process_hits" ]; then
  warn "Possible worktree processes still running:"
  printf '%s\n' "$process_hits"
else
  ok "No obvious long-running worktree processes found."
fi

say ""
if [ "$failures" -gt 0 ]; then
  say "PM preflight failed with $failures issue(s)."
  exit 1
fi

say "PM preflight passed."
