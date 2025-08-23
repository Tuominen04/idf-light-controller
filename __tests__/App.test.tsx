import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import App from './../App';

jest.mock('./../src/ble/BLEService', () => ({
  initialize: jest.fn(() => Promise.resolve()),
  destroy: jest.fn(),
}));
jest.mock('react-native-gesture-handler', () => ({}));

test('debug App render', async () => {
  render(<App />);
  await waitFor(() => {
    screen.debug();  // See what is rendered
  });
});