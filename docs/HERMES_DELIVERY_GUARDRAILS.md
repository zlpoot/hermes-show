# Hermes Delivery Guardrails

This document defines the PM handoff and review workflow for issues delegated to Hermes or another coding agent.

The goal is to keep every contribution reviewable, reproducible, and safe for eventual open-source use. Agents must not read, copy, print, commit, or upload private local data, secrets, real databases, or generated artifacts.

## Standard Handoff Prompt

Use this template when assigning one GitHub issue to Hermes.

```text
You are the development agent for GitHub issue #<issue-number>: <issue-title>.

Repository worktree:
<absolute-worktree-path>

Branch:
codex/issue-<issue-number>-<slug>

Scope:
- Implement only the behavior described in the issue.
- Prefer the existing project patterns and keep the diff narrow.
- Do not modify package manager, workspace, lockfile, CI, or tooling config unless the issue explicitly requires it.
- Do not push, create PRs, or change issue labels. The PM will do that after review.

Security and privacy rules:
- Do not read, print, copy, commit, upload, or summarize .env, .env.*, *.db, private keys, tokens, credentials, or real ~/.hermes/config.yaml secret values.
- Do not use real local Hermes data as fixtures.
- Test fixtures must be synthetic and non-sensitive.
- Do not include user-specific absolute paths in committed code or docs.

Generated artifact rules:
- Do not commit node_modules/, .nuxt/, .output/, coverage/, playwright-report/, test-results/, logs, caches, or local database files.
- If tests generate reports, leave them untracked and mention them only in the final summary.

Long-running process rules:
- Do not leave dev servers or watchers running.
- If a dev server is required for verification, record its PID and terminate it before finishing.

Required final response:
- Change summary
- Tests run and exact results
- Files intentionally changed
- Known risks or incomplete items
```

## PM Preflight Review

Before opening a PR from an agent branch:

1. Check the branch and issue scope.
2. Run `git status --short --untracked-files=all`.
3. Run `scripts/pm_preflight.sh` from the worktree. By default it compares the branch to `origin/main`; set `BASE_REF=<ref>` if the PR targets a different base.
4. Review the diff for unrelated changes.
5. Confirm tests are meaningful for the issue, not only smoke checks.
6. Confirm no long-running worktree processes remain.

The branch is not PR-ready if any of these are true:

- It changes package manager, workspace, CI, or lock files without explicit issue scope.
- It changes tracked generated artifacts such as Playwright reports or test result files.
- It includes `.env`, database files, private keys, tokens, credentials, or real local Hermes data.
- It leaves a dev server, watcher, or test server running.
- Its tests do not verify the issue's acceptance criteria.

## Worktree Dependency Setup

Use a deterministic toolchain before running tests in a fresh worktree.

```bash
command -v pnpm
pnpm install --frozen-lockfile
pnpm test:unit
pnpm test:e2e -- tests/e2e/<target>.spec.ts
```

If local `pnpm` is unavailable, add the approved local Node toolchain to `PATH` first, then rerun `command -v pnpm`. Do not solve dependency setup by changing `pnpm-workspace.yaml`, lockfiles, or package scripts unless the issue is specifically about dependency configuration.

## PR Requirements

Each issue should produce one draft PR.

The PR description must include:

- `Closes #<issue-number>`
- Change summary
- Tests run
- PM preflight result
- Known risks or follow-up work

Do not move the issue to `status:in-review` until the PR passes the preflight checks.
