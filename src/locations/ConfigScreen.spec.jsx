import React from 'react';
import ConfigScreen from './ConfigScreen';
import { render, screen, act } from '@testing-library/react';
import { mockSdk } from '../../test/mocks';
import { vi } from 'vitest';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

describe('ConfigScreen', () => {
  it('renders CMA token input with label', async () => {
    await act(async () => { render(<ConfigScreen />); });
    expect(screen.getByLabelText('CMA Token')).toBeInTheDocument();
  });

  it('renders helper text explaining required scope', async () => {
    await act(async () => { render(<ConfigScreen />); });
    expect(
      screen.getByText(/org.level read access/i)
    ).toBeInTheDocument();
  });
});
