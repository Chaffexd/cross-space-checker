import React from 'react';
import { render, screen } from '@testing-library/react';
import ReferenceList from './ReferenceList';

const makeRef = (n) => ({
  entryId: `entry-${n}`,
  spaceId: `space-${n}`,
  spaceName: `Space ${n}`,
  title: `Entry Title ${n}`,
  contentTypeName: 'Legal Page',
  publishStatus: 'published',
  deepLink: `https://app.contentful.com/spaces/space-${n}/environments/master/entries/entry-${n}`,
});

describe('ReferenceList', () => {
  it('renders summary count for a single reference in one space', () => {
    render(<ReferenceList references={[makeRef(1)]} />);
    expect(screen.getByText('Found in 1 entry across 1 space')).toBeInTheDocument();
  });

  it('renders summary count for multiple references across multiple spaces', () => {
    render(<ReferenceList references={[makeRef(1), makeRef(2), makeRef(3)]} />);
    expect(screen.getByText('Found in 3 entries across 3 spaces')).toBeInTheDocument();
  });

  it('renders one ReferenceCard per reference', () => {
    render(<ReferenceList references={[makeRef(1), makeRef(2)]} />);
    expect(screen.getByText('Space 1')).toBeInTheDocument();
    expect(screen.getByText('Space 2')).toBeInTheDocument();
  });
});
