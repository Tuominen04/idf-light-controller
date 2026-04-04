---
description: "Use when building React Native screens, components, hooks, styles, or navigation. Covers component patterns, styling, state management, hooks, and service architecture used in this project."
applyTo: "**/*.tsx,src/**/*.ts"
---

# React Native Conventions

## Components

- **Functional components only** — no class components.
- This project uses **render helper functions** instead of traditional exported components:
  ```tsx
  // Preferred: exported render function
  export function renderLightControl(
    lightState: 'on' | 'off',
    isLoading: boolean,
    onToggle: () => void
  ): JSX.Element { ... }

  // Avoid standalone component export unless reused across screens
  export const LightControl: React.FC<Props> = ({ ... }) => { ... }
  ```
  Use render functions when the UI is specific to one screen and driven by state/callbacks from the parent.

## State Management

- Use multiple `useState` hooks. No Context API or Redux — the app is small enough that this is fine.
- When services need to update UI state, pass **state setter callbacks** as parameters:
  ```ts
  async function toggleLight(
    isConnected: boolean,
    device: SavedDevice,
    setLoading: (v: boolean) => void,
    setLightState: (v: 'on' | 'off') => void
  ): Promise<void> { ... }
  ```
- Avoid large `useReducer` unless state has ≥3 tightly coupled fields.

## Hooks

- Use `useFocusEffect` (from `@react-navigation/native`) for data fetching that should re-run when a screen comes back into focus:
  ```ts
  useFocusEffect(useCallback(() => {
    fetchData();
    return () => cleanup();
  }, []));
  ```
- Use `useRef<NodeJS.Timeout>` for interval handles; always clear on unmount.
- Keep custom hooks in `src/<feature>/hooks/use<Name>.ts`.

## Styling

- Use `StyleSheet.create()` in a dedicated `*.styles.ts` file — never inline styles.
- Styles live in `src/styles/<ScreenName>.styles.ts`, imported into the screen/component.
- Conditional styles via array spread:
  ```tsx
  style={[styles.button, isDisabled && { opacity: 0.5 }]}
  ```
- Hardcoded hex color values are fine for a personal project; extract to constants only if reused in 3+ places.

## Navigation

- Use `@react-navigation/stack` with a typed `RootStackParamList`.
- Type screen props with `StackNavigationProp` and `RouteProp`:
  ```ts
  type RoutePropType = RouteProp<RootStackParamList, 'DeviceControl'>;
  const { device } = useRoute<RoutePropType>().params;
  ```

## Services

- Services are **modules of standalone async functions** — not classes:
  ```ts
  export async function getFirmwareInfo(device: SavedDevice, setLoading: ...) { ... }
  ```
- Singletons (HTTPService, DeviceStorageService) are exported as a single instance.
- Wrap all async calls in `try/catch/finally`; use `finally` to reset loading state.
- Use `Alert.alert()` for user-facing errors. Use `console.error()` / `console.warn()` for developer-level logs.

## Networking

- Limit concurrent requests — batch in groups of 5 with `Promise.all` to avoid saturating the network.
- Use `AbortController` with a 10-second timeout for all fetch calls.
