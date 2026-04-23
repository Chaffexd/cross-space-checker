import React from 'react';
import { render, screen } from '@testing-library/react';
import ErrorState from './ErrorState';

describe('ErrorState', () => {
  it('renders missing token message when errorType is missing_token', () => {
    render(<ErrorState errorType="missing_token" />);
    expect(
      screen.getByText(/no cma token configured/i)
    ).toBeInTheDocument();
  });

  it('renders API failure message when errorType is api_failure', () => {
    render(<ErrorState errorType="api_failure" />);
    expect(
      screen.getByText(/could not complete the check/i)
    ).toBeInTheDocument();
  });
});
