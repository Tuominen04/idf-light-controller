import { render, screen, waitFor } from "@testing-library/react-native";
import { renderOTAControl, renderOTAModal } from '../../../src/device/components/OTAControl';
import { OTAProgress } from "../../../src/types";

function renderOTAControlHelper(
  loading: boolean,
  isConnected: boolean,
  otaProgress?: OTAProgress | null, 
  setShowOTAModal?: (show: boolean) => void
) {
  render(
    renderOTAControl(
      loading, 
      isConnected, 
      otaProgress ?? null, 
      setShowOTAModal ?? (() => {})
    )
  );
};

describe('OTAControl render OTAControl', () => {
  test('renders correctly when not updating', () => {
    renderOTAControlHelper(false, true);
    waitFor(() => {
        expect(screen.getByText(/ota updates/i)).toBeTruthy();
        expect(screen.getByText(/upload new firmware to your device over wifi/i)).toBeTruthy();
      }
    );
  });
});

describe('OTAControl render progress bar', () => {
  test('renders correctly when not updating', () => {
    const OTAProgress = { in_progress: true, progress: 45, status: "Updating..." };
    renderOTAControlHelper(false, true, OTAProgress);
    waitFor(() => {
        expect(screen.getByText(/updating.../i)).toBeTruthy();
        expect(screen.getByText(/45%/i)).toBeTruthy();
      }
    );
  });
});

describe('OTAControl start OTA button', () => {
  test('button opacity is 0.5 when loading', () => {
    renderOTAControlHelper(true, true);
    screen.debug();
    waitFor(() => {
        const button = screen.getByTestId('start-ota-update-button');
        expect(button.props.style).toEqual(
          expect.objectContaining({ opacity: 0.5 })
        );
      }
    );
  });
  test('button opacity is 0.5 when is not connected', () => {
    renderOTAControlHelper(false, false);
    waitFor(() => {
        const button = screen.getByTestId('start-ota-update-button');
        expect(button.props.style).toEqual(
          expect.objectContaining({ opacity: 0.5 })
        );
      }
    );
  });
});
