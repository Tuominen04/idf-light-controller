import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { HomeScreen } from '../../src/screens/HomeScreen';

describe('HomeScreen', () => {
  test('renders empty state message', async () => {
    render(
      <NavigationContainer>
        <HomeScreen />
      </NavigationContainer>
    );
    await waitFor(() => {
      expect(screen.getByText(/No devices added yet/)).toBeTruthy();
    });
  });
});
