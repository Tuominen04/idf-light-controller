---
description: "Upgrade a specific npm package to its latest major version, fix any breaking changes in the codebase, and verify tests pass. Invoke with /upgrade-major-package."
---

# Upgrade a Major npm Package

You are upgrading a single package (or a small set) to its latest major version and fixing any resulting breaking changes. The target package(s) must be specified by the user.

**Do not upgrade all major packages at once.** One at a time keeps regressions isolated.

## Step 1 — Identify the target

Ask the user which package to upgrade if not already stated. Check its current version in `package.json` and look up the latest version:

```
npm view <package> version
```

Also fetch the changelog/migration guide URL from the npm registry:
```
npm view <package> repository.url
```

Read the official migration guide (if available) before making any changes.

## Step 2 — Install the new major version

```
npm install <package>@latest
```

For `@types/*` companion packages, update them in the same step:
```
npm install --save-dev @types/<package>@latest
```

## Step 3 — Identify breaking changes

Run TypeScript compilation to surface type errors immediately:
```
npx tsc --noEmit
```

List every error. Group them by file and error category (type mismatch, removed API, renamed export, etc.).

## Step 4 — Fix breaking changes

Work through each error file by file. Follow these constraints:
- Fix only what the major upgrade broke — do not refactor unrelated code.
- Preserve existing patterns and conventions from the codebase.
- If an API was removed, prefer the official replacement from the migration guide over workarounds.
- If a fix is non-obvious, add a brief inline comment explaining the migration reason.

After each file is fixed, re-run `npx tsc --noEmit` to confirm the error count is decreasing.

## Step 5 — Run tests

```
npm test -- --passWithNoTests
```

If tests fail:
1. Identify which test files are affected.
2. Update mocks and assertions to match the new API — do not delete tests.
3. Re-run until all tests pass.

## Step 6 — Sanity check

Run the full TypeScript check one final time:
```
npx tsc --noEmit
```

Confirm zero errors before reporting done.

## Step 7 — Report

Summarise what changed in a concise list:
- Package upgraded: name, old version → new version
- Files modified and why (one line each)
- Any API that was removed and what replaced it
- Test changes made (if any)

Do not create any documentation files.
