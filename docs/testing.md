# Testing

## Run Tests

```bash
npm test
```

## Test Structure

Tests live in `__tests__/` and mirror the `src/` layout:

```txt
__tests__/
  screens/          # Screen-level tests
  services/         # Service unit tests
  device/
    components/     # Component render tests
    hooks/          # Hook tests
  utils/            # Utility function tests
```

## What Is Tested

- **Services**: HTTP requests, device storage CRUD, device connection logic
- **Components**: Render output and user interactions
- **Hooks**: OTA polling behavior
- **Utils**: Date formatting helpers

## Tools

- [Jest](https://jestjs.io/) as test runner
- [@testing-library/react-native](https://callstack.github.io/react-native-testing-library/)
  for component tests
- `timezone-mock` for deterministic date tests
