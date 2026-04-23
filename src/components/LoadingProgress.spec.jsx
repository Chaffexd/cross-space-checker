import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingProgress from './LoadingProgress';

describe('LoadingProgress', () => {
  it('renders progress text with checked and total space counts', () => {
    render(<LoadingProgress checkedSpaces={3} totalSpaces={12} />);
    expect(screen.getByText('Checking spaces: 3 of 12...')).toBeInTheDocument();
  });

  it('renders progress text when no spaces have been checked yet', () => {
    render(<LoadingProgress checkedSpaces={0} totalSpaces={0} />);
    expect(screen.getByText('Checking spaces: 0 of 0...')).toBeInTheDocument();
  });
});
