import React from 'react';
import { render, screen } from '@testing-library/react';
import EmptyState from './EmptyState';

describe('EmptyState', () => {
  it('renders the no-references message', () => {
    render(<EmptyState />);
    expect(
      screen.getByText('This entry is not referenced from any other space.')
    ).toBeInTheDocument();
  });
});
