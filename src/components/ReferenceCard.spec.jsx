import React from 'react';
import { render, screen } from '@testing-library/react';
import ReferenceCard from './ReferenceCard';

const baseReference = {
  entryId: 'abc123',
  spaceId: 'spaceXyz',
  spaceName: 'Chime Web',
  title: 'Annual Disclosure 2024',
  contentTypeName: 'Legal Page',
  publishStatus: 'published',
  deepLink: 'https://app.contentful.com/spaces/spaceXyz/environments/master/entries/abc123',
};

describe('ReferenceCard', () => {
  it('renders the space name', () => {
    render(<ReferenceCard reference={baseReference} />);
    expect(screen.getByText('Chime Web')).toBeInTheDocument();
  });

  it('renders the entry title and content type', () => {
    render(<ReferenceCard reference={baseReference} />);
    expect(screen.getByText('Annual Disclosure 2024 — Legal Page')).toBeInTheDocument();
  });

  it('renders Published badge for published status', () => {
    render(<ReferenceCard reference={baseReference} />);
    expect(screen.getByText('Published')).toBeInTheDocument();
  });

  it('renders Changed badge for changed status', () => {
    render(<ReferenceCard reference={{ ...baseReference, publishStatus: 'changed' }} />);
    expect(screen.getByText('Changed')).toBeInTheDocument();
  });

  it('renders Draft badge for draft status', () => {
    render(<ReferenceCard reference={{ ...baseReference, publishStatus: 'draft' }} />);
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('renders a link to the entry', () => {
    render(<ReferenceCard reference={baseReference} />);
    const link = screen.getByRole('link', { name: /open entry/i });
    expect(link).toHaveAttribute(
      'href',
      'https://app.contentful.com/spaces/spaceXyz/environments/master/entries/abc123'
    );
  });
});
