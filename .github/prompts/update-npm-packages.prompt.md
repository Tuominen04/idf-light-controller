---
description: "Check for npm package updates, apply safe updates, and report what changed. Invoke with /update-npm-packages."
---

# Update npm Packages

You are updating the npm dependencies for this React Native project. Work through these steps in order.

## Step 1 — Check for outdated packages

Run:
```
npm outdated
```

Parse the output and note every package with a version gap. Group them into:
- **Patch/minor** (safe to update — semver-compatible)
- **Major** (potentially breaking — list separately, do NOT auto-update these)

## Step 2 — Apply safe updates

Run:
```
npm update
```

This updates all deps within their declared semver range (patch + minor). Do NOT run `npm audit fix --force` — that can silently install major versions and break the app.

## Step 3 — Verify nothing broke

Run the test suite:
```
npm test -- --passWithNoTests
```

If tests fail, revert the update by restoring `package-lock.json` from git and explain which package likely caused the failure.

## Step 4 — Check for security issues

Run:
```
npm audit --omit=dev
```

Report any production vulnerabilities (skip dev-only advisories). Only suggest `npm audit fix` (without `--force`) to address them.

## Step 5 — Report

Summarise the results in a table:

| Package | Old version | New version | Type |
|---------|------------|------------|------|
| example | 1.2.0      | 1.5.0      | minor |

Then list any **major version upgrades available** that were skipped, with a short note on what breaking changes to watch for. Keep the report concise — this is a personal project.
