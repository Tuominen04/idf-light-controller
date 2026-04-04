---
description: "Use when writing, updating, or reviewing tests. Covers Jest and @testing-library/react-native conventions, mock setup, and what to test in this project."
applyTo: "**/__tests__/**,**/*.test.ts,**/*.test.tsx"
---

# Testing Conventions

## Stack

- **Jest** + **@testing-library/react-native** — use `render`, `waitFor`, `getByTestId`, `getByText`.
- Test files mirror the source tree under `__tests__/` with `.test.tsx` extension.

## Structure

- Group related tests with `describe()`. Use `test()` or `it()` consistently — prefer `test()`:
  ```ts
  describe('LightControl', () => {
    test('renders toggle button', async () => { ... });
    test('disables button when loading', async () => { ... });
  });
  ```
- Follow **Arrange – Act – Assert**: render the component, interact or wait, then assert.

## Querying

- Prefer `getByTestId` for structural elements; use `getByText` for human-readable labels.
- Use `waitFor()` whenever rendering triggers async state updates:
  ```ts
  await waitFor(() => expect(getByTestId('light-toggle')).toBeTruthy());
  ```
- Access component props directly for style assertions:
  ```ts
  expect(getByTestId('light-indicator').props.style).toMatchObject({ backgroundColor: '#FFC107' });
  ```

## Mocking

### Navigation
```ts
jest.mock('@react-navigation/native', () => ({
  useRoute: () => ({ params: { device: mockDevice } }),
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
  useFocusEffect: jest.fn(),
}));
```

### Services
Mock service functions to invoke state setters synchronously when testing components:
```ts
jest.mock('../../src/device/services/DeviceService', () => ({
  getFirmwareInfo: jest.fn((_device, setLoading, setInfo) => {
    setLoading(false);
    setInfo({ version: '1.0.0' });
  }),
}));
```

### AsyncStorage
Import the pre-built mock in `jest.setup.js`:
```ts
import '@react-native-async-storage/async-storage/jest/async-storage-mock';
```

## What to Test

- **Renders correctly**: Key UI sections and text are present.
- **Disabled states**: Buttons disabled during loading, offline, or OTA-in-progress.
- **Visual states**: Color/style changes reflecting app state (e.g., light on/off indicator color).
- **User interactions**: Simulate clicks and verify that the correct service function was called.
- **Loading indicators**: `ActivityIndicator` appears during async operations.

## What Not to Test (for a personal project)

- Avoid snapshot tests — they break on trivial UI changes and don't verify behavior.
- Don't test internal implementation details (state values, private vars).
- Skip exhaustive edge-case coverage; focus on the happy path and the most common failure modes.
