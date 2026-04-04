---
description: "Use when writing TypeScript code, defining types, creating interfaces, or working with generics. Covers type conventions, import style, and TypeScript patterns for this project."
applyTo: "**/*.ts,**/*.tsx"
---

# TypeScript Conventions

## Types vs Interfaces

- Prefer **interfaces** for object shapes (data structures, API responses, component params):
  ```ts
  interface DeviceStatus {
    ip: string;
    lightState: 'on' | 'off';
    firmware?: string;
  }
  ```
- Use **type aliases** for unions, intersections, and function signatures:
  ```ts
  type LightState = 'on' | 'off';
  type StateCallback<T> = (value: T) => void;
  ```
- Prefer **union types over enums** — keep literals inline:
  ```ts
  // Prefer this
  lightState: 'on' | 'off'
  // Avoid this
  enum LightState { On = 'on', Off = 'off' }
  ```

## Nullability & Optional Fields

- Mark optional fields with `?` rather than `| undefined`:
  ```ts
  interface FirmwareInfo {
    version: string;
    buildDate?: string;
    otaStatus?: string;
  }
  ```
- Avoid `null` — use `undefined` or optional chaining (`?.`, `??`) instead.
- Avoid `any`. Use `unknown` and narrow if the shape is not known.

## Generics

- Use generics for service methods that vary only in response shape:
  ```ts
  async makeRequest<T>(url: string, options?: RequestInit): Promise<T>
  ```
- Keep constraints minimal; trust inferred types where possible.

## Imports

- Use relative path imports. No barrel exports (no `index.ts` re-exports):
  ```ts
  import { DeviceStorageService } from '../../device/services/DeviceStorageService';
  ```
- Import order: React → React Native → third-party → local (by depth).
- Export types alongside implementations using `export type { ... }` when the consumer may want types without the runtime value.

## General

- `async/await` everywhere — no `.then()` chains.
- Extend `@react-native/typescript-config` in `tsconfig.json`; avoid overriding settings without reason.
- Keep feature-scoped types in `<feature>/deviceTypes.ts`; app-wide types in `src/types.ts`.
