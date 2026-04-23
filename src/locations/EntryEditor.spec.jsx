import React from 'react';
import { render, screen } from '@testing-library/react';
import { mockCma, mockSdk } from '../../test/mocks';
import { vi } from 'vitest';
import EntryEditor from './EntryEditor';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

vi.mock('../hooks/useCrossSpaceReferences', () => ({
  useCrossSpaceReferences: vi.fn(),
}));

import { useCrossSpaceReferences } from '../hooks/useCrossSpaceReferences';

describe('EntryEditor', () => {
  it('renders LoadingProgress while status is loading', () => {
    useCrossSpaceReferences.mockReturnValue({
      status: 'loading',
      references: [],
      checkedSpaces: 2,
      totalSpaces: 10,
      errorType: null,
    });

    render(<EntryEditor />);
    expect(screen.getByText('Checking spaces: 2 of 10...')).toBeInTheDocument();
  });

  it('renders EmptyState when done with no references', () => {
    useCrossSpaceReferences.mockReturnValue({
      status: 'done',
      references: [],
      checkedSpaces: 5,
      totalSpaces: 5,
      errorType: null,
    });

    render(<EntryEditor />);
    expect(
      screen.getByText('This entry is not referenced from any other space.')
    ).toBeInTheDocument();
  });

  it('renders ReferenceList when done with references', () => {
    useCrossSpaceReferences.mockReturnValue({
      status: 'done',
      references: [
        {
          entryId: 'e1',
          spaceId: 's1',
          spaceName: 'Chime Web',
          title: 'Annual Disclosure',
          contentTypeName: 'Legal Page',
          publishStatus: 'published',
          deepLink: 'https://app.contentful.com/spaces/s1/environments/master/entries/e1',
        },
      ],
      checkedSpaces: 5,
      totalSpaces: 5,
      errorType: null,
    });

    render(<EntryEditor />);
    expect(screen.getByText('Found in 1 entry across 1 space')).toBeInTheDocument();
    expect(screen.getByText('Chime Web')).toBeInTheDocument();
  });

  it('renders ErrorState when status is error', () => {
    useCrossSpaceReferences.mockReturnValue({
      status: 'error',
      references: [],
      checkedSpaces: 0,
      totalSpaces: 0,
      errorType: 'missing_token',
    });

    render(<EntryEditor />);
    expect(screen.getByText(/no cma token configured/i)).toBeInTheDocument();
  });
});
