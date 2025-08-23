import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { HomeScreen } from './../src/home/HomeScreen';

test('renders HomeScreen', async () => {
  render(
    <NavigationContainer>
      <HomeScreen />
    </NavigationContainer>
  );
  // You can add assertions here, e.g.:
  await waitFor(() => {
    expect(screen.getByText(/No devices added yet/)).toBeTruthy();
  });
});