/**
 * @file LightControl.test.tsx
 * @description
 * Unit tests for the LightControl component helper: renderLightControl.
 * 
 * @remarks
 * - Verifies correct rendering of light control UI, status, colors, button states, and interactions.
 * - Includes style, and interaction tests for comprehensive coverage.
 */

import { render, screen, waitFor } from "@testing-library/react-native";
import { renderLightControl } from '../../../src/device/components/LightControl';
import { ActivityIndicator } from "react-native";

/**
 * Helper to render the LightControl component with various states.
 */
function renderLightControlHandler(
  lightState: boolean, 
  isLoading?: boolean, 
  refresh?: boolean, 
  isConnected?: boolean, 
  otaLoading?: boolean,
  toggleState?: () => void
) {
  render(
    renderLightControl(
      lightState ? 'on' : 'off',
      isLoading ?? false,
      refresh ?? false,
      isConnected ?? true,
      otaLoading ?? false,
      toggleState ?? (() => {})
    )
  );
}

// Tests for the renderLightControl helper
describe('LightControl renderLightControl', () => {
  /**
   * Should show "Light Control" header when rendered.
   */
  test('renderLightControl', async () => {
    renderLightControlHandler(true);

    await waitFor(() => {
      // Check for header text
      expect(screen.getByText(/Light Control/i)).toBeTruthy();
    });
  });

  /**
   * Should confirm that light is on and button says "Turn OFF".
   */
  test('confirm that light is on when light is on', async () => {
    renderLightControlHandler(true);

    await waitFor(() => {
      expect(screen.getByText(/light is on/i)).toBeTruthy();
      expect(screen.getByText(/turn off/i)).toBeTruthy(); // Button
    });
  });

  /**
   * Should confirm that light is off and button says "Turn ON".
   */
  test('confirm that light is off when light is off', async () => {
    renderLightControlHandler(false);

    await waitFor(() => {
      expect(screen.getByText(/light is off/i)).toBeTruthy();
      expect(screen.getByText(/turn on/i)).toBeTruthy(); // Button
    });
  });
});

describe('LightControl renderLightControl colors', () => {
  /**
   * Should render correct color for "on" light status.
   */
  test('renders correct color for on light status', () => {
    renderLightControlHandler(true);

    // Check indicator color for "on"
    const lightText = screen.getByTestId('light-indicator');
    expect(lightText.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: '#FFC107' })
      ])
    );
  });

  /**
   * Should render correct color for "off" light status.
   */
  test('renders correct color for off light status', () => {
    renderLightControlHandler(false);

    // Check indicator color for "off"
    const lightText = screen.getByTestId('light-indicator');
    expect(lightText.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: '#666' })
      ])
    );
  });
});

describe('LightControl disable button', () => {
  /**
   * Should disable button when loading.
   */
  test('confirm that button is disabled when isLoading is true', async () => {
    renderLightControlHandler(false, true, false, false, false); // isLoading true

    await waitFor(() => {
      const button = screen.getByTestId("light-control-button");
      // Button should be disabled
      expect(button.parent?.props.accessibilityState.disabled).toBe(true);
    });
  });

  /**
   * Should disable button when refreshing.
   */
  test('confirm that button is disabled when refresh is true', async () => {
    renderLightControlHandler(false, false, true, false, false); // refresh true

    await waitFor(() => {
      const button = screen.getByTestId("light-control-button");
      expect(button.parent?.props.accessibilityState.disabled).toBe(true);
    });
  });

  /**
   * Should disable button when not connected.
   */
  test('confirm that button is disabled when isConnected is false', async () => {
    renderLightControlHandler(false, false, false, false, false); // isConnected false

    await waitFor(() => {
      const button = screen.getByTestId("light-control-button");
      expect(button.parent?.props.accessibilityState.disabled).toBe(true);
    });
  });

  /**
   * Should disable button when OTA loading.
   */
  test('confirm that button is disabled when otaLoading is true', async () => {
    renderLightControlHandler(false, false, false, false, true); // otaLoading true

    await waitFor(() => {
      const button = screen.getByTestId("light-control-button");
      expect(button.parent?.props.accessibilityState.disabled).toBe(true);
    });
  });
});

describe('LightControl toggle', () => {
  /**
   * Should call toggleLight when button is pressed and enabled.
   */
  test('calls toggleLight when button is pressed and enabled', async () => {
    const mockToggle = jest.fn();
    renderLightControlHandler(false, false, false, true, false, mockToggle);
    
    const button = screen.getByTestId('light-control-button');

    // Simulate press
    button.parent?.props.onClick();
    expect(mockToggle).toHaveBeenCalled();
  });
});

describe('render ActivityIndicator', () => {
  /**
   * Should show ActivityIndicator when loading.
   */
  test('shows ActivityIndicator when loading', async () => {
    renderLightControlHandler(false, true);
    // ActivityIndicator should be present in button
    expect(screen.getByTestId('light-control-button').findByType(ActivityIndicator)).toBeTruthy();
  });

  /**
   * Should show ActivityIndicator when refreshing.
   */
  test('shows ActivityIndicator when refreshing', async () => {
    renderLightControlHandler(false, false, true);
    expect(screen.getByTestId('light-control-button').findByType(ActivityIndicator)).toBeTruthy();
  });
});

describe('LightControl button layout', () => { 
  /**
   * Should set button opacity to 0.5 when disabled.
   */
  test('button opacity is 0.5 when disabled', () => {
    renderLightControlHandler(false, false, false, false, false); // isConnected false
    const button = screen.getByTestId('light-control-button');
    expect(button.props.style).toEqual(
      expect.objectContaining({ opacity: 0.5 })
    );
  });

  /**
   * Should show "Turn OFF" when light is on.
   */
  test('shows "Turn OFF" when light is on', () => {
    renderLightControlHandler(true);
    expect(screen.getByText(/turn off/i)).toBeTruthy();
  });

  /**
   * Should show "Turn ON" when light is off.
   */
  test('shows "Turn ON" when light is off', () => {
    renderLightControlHandler(false);
    expect(screen.getByText(/turn on/i)).toBeTruthy();
  });
});