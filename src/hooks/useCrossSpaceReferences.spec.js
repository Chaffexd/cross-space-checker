import { vi, describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCrossSpaceReferences } from './useCrossSpaceReferences';

const mockGetEntries = vi.fn();
const mockGetContentType = vi.fn();
const mockGetContentTypes = vi.fn();
const mockGetEnvironment = vi.fn();
const mockGetSpace = vi.fn();
const mockGetSpaces = vi.fn();

vi.mock('contentful-management', () => ({
  createClient: vi.fn(() => ({
    getSpaces: mockGetSpaces,
    getSpace: mockGetSpace,
  })),
}));

const defaultArgs = {
  cmaToken: 'test-token',
  spaceId: 'current-space',
  environmentId: 'master',
  entryId: 'current-entry',
  organizationId: 'org-123',
};

const mockContentTypeWithResourceLink = {
  sys: { id: 'article' },
  fields: [{ id: 'ref', type: 'ResourceLink' }],
};

const mockContentTypeWithoutResourceLink = {
  sys: { id: 'tag' },
  fields: [{ id: 'label', type: 'Symbol' }],
};

const targetCrn = 'crn:contentful:::content:spaces/current-space/environments/master/entries/current-entry';

function makeEntry(id, overrides = {}) {
  return {
    sys: {
      id,
      contentType: { sys: { id: 'article' } },
      publishedAt: '2024-01-01T00:00:00Z',
      version: 2,
      publishedVersion: 1,
      ...(overrides.sys || {}),
    },
    fields: {
      title: { 'en-US': 'Annual Disclosure' },
      ref: { 'en-US': { sys: { type: 'ResourceLink', linkType: 'Contentful:Entry', urn: targetCrn } } },
      ...(overrides.fields || {}),
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetEnvironment.mockResolvedValue({
    getEntries: mockGetEntries,
    getContentType: mockGetContentType,
    getContentTypes: mockGetContentTypes,
  });
  mockGetSpace.mockResolvedValue({ getEnvironment: mockGetEnvironment });
  mockGetContentType.mockResolvedValue({ name: 'Legal Page' });
  mockGetContentTypes.mockResolvedValue({ items: [mockContentTypeWithResourceLink] });
});

describe('useCrossSpaceReferences', () => {
  it('returns error status with missing_token when cmaToken is absent', () => {
    const { result } = renderHook(() =>
      useCrossSpaceReferences({ ...defaultArgs, cmaToken: '' })
    );
    expect(result.current.status).toBe('error');
    expect(result.current.errorType).toBe('missing_token');
  });

  it('returns loading status initially when token is present', () => {
    mockGetSpaces.mockResolvedValue({ items: [] });
    const { result } = renderHook(() => useCrossSpaceReferences(defaultArgs));
    expect(result.current.status).toBe('loading');
  });

  it('returns done status with no references when no spaces contain a match', async () => {
    mockGetSpaces.mockResolvedValue({
      items: [{ sys: { id: 'space-a' }, name: 'Space A' }],
    });
    mockGetEntries.mockResolvedValue({ items: [], total: 0 });

    const { result } = renderHook(() => useCrossSpaceReferences(defaultArgs));

    await waitFor(() => expect(result.current.status).toBe('done'));
    expect(result.current.references).toHaveLength(0);
  });

  it('returns done with no references when space has no ResourceLink content types', async () => {
    mockGetSpaces.mockResolvedValue({
      items: [{ sys: { id: 'space-a' }, name: 'Space A' }],
    });
    mockGetContentTypes.mockResolvedValue({ items: [mockContentTypeWithoutResourceLink] });

    const { result } = renderHook(() => useCrossSpaceReferences(defaultArgs));

    await waitFor(() => expect(result.current.status).toBe('done'));
    expect(result.current.references).toHaveLength(0);
    expect(mockGetEntries).not.toHaveBeenCalled();
  });

  it('returns references when an entry in another space has a matching ResourceLink', async () => {
    mockGetSpaces.mockResolvedValue({
      items: [{ sys: { id: 'space-a' }, name: 'Space A' }],
    });
    mockGetEntries.mockResolvedValue({ items: [makeEntry('ref-entry-1')], total: 1 });

    const { result } = renderHook(() => useCrossSpaceReferences(defaultArgs));

    await waitFor(() => expect(result.current.status).toBe('done'));
    expect(result.current.references).toHaveLength(1);
    expect(result.current.references[0]).toMatchObject({
      entryId: 'ref-entry-1',
      spaceId: 'space-a',
      spaceName: 'Space A',
      title: 'Annual Disclosure',
      contentTypeName: 'Legal Page',
      publishStatus: 'published',
      deepLink: 'https://app.contentful.com/spaces/space-a/environments/master/entries/ref-entry-1',
    });
  });

  it('does not include entries whose ResourceLink points to a different entry', async () => {
    mockGetSpaces.mockResolvedValue({
      items: [{ sys: { id: 'space-a' }, name: 'Space A' }],
    });
    const entryWithDifferentCrn = makeEntry('unrelated', {
      fields: {
        ref: { 'en-US': { sys: { type: 'ResourceLink', linkType: 'Contentful:Entry', urn: 'crn:contentful:::content:spaces/other/entries/other-entry' } } },
      },
    });
    mockGetEntries.mockResolvedValue({ items: [entryWithDifferentCrn], total: 1 });

    const { result } = renderHook(() => useCrossSpaceReferences(defaultArgs));

    await waitFor(() => expect(result.current.status).toBe('done'));
    expect(result.current.references).toHaveLength(0);
  });

  it('correctly identifies draft publish status', async () => {
    mockGetSpaces.mockResolvedValue({
      items: [{ sys: { id: 'space-a' }, name: 'Space A' }],
    });
    mockGetEntries.mockResolvedValue({
      items: [makeEntry('draft-entry', { sys: { publishedAt: null, version: 1, publishedVersion: null } })],
      total: 1,
    });

    const { result } = renderHook(() => useCrossSpaceReferences(defaultArgs));

    await waitFor(() => expect(result.current.status).toBe('done'));
    expect(result.current.references[0].publishStatus).toBe('draft');
  });

  it('correctly identifies changed publish status', async () => {
    mockGetSpaces.mockResolvedValue({
      items: [{ sys: { id: 'space-a' }, name: 'Space A' }],
    });
    mockGetEntries.mockResolvedValue({
      items: [makeEntry('changed-entry', { sys: { publishedAt: '2024-01-01T00:00:00Z', version: 5, publishedVersion: 2 } })],
      total: 1,
    });

    const { result } = renderHook(() => useCrossSpaceReferences(defaultArgs));

    await waitFor(() => expect(result.current.status).toBe('done'));
    expect(result.current.references[0].publishStatus).toBe('changed');
  });

  it('falls back to entry ID when no title or name field is present', async () => {
    mockGetSpaces.mockResolvedValue({
      items: [{ sys: { id: 'space-a' }, name: 'Space A' }],
    });
    mockGetEntries.mockResolvedValue({
      items: [makeEntry('notitle-entry', {
        fields: {
          title: undefined,
          ref: { 'en-US': { sys: { type: 'ResourceLink', linkType: 'Contentful:Entry', urn: targetCrn } } },
        },
      })],
      total: 1,
    });

    const { result } = renderHook(() => useCrossSpaceReferences(defaultArgs));

    await waitFor(() => expect(result.current.status).toBe('done'));
    expect(result.current.references[0].title).toBe('notitle-entry');
  });

  it('returns api_failure error when getSpaces throws', async () => {
    mockGetSpaces.mockRejectedValue(new Error('Unauthorized'));

    const { result } = renderHook(() => useCrossSpaceReferences(defaultArgs));

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.errorType).toBe('api_failure');
  });

  it('skips a space and continues when getEnvironment throws for that space', async () => {
    mockGetSpaces.mockResolvedValue({
      items: [
        { sys: { id: 'bad-space' }, name: 'Bad Space' },
        { sys: { id: 'good-space' }, name: 'Good Space' },
      ],
    });
    mockGetSpace
      .mockResolvedValueOnce({ getEnvironment: vi.fn().mockRejectedValue(new Error('404')) })
      .mockResolvedValueOnce({ getEnvironment: mockGetEnvironment });
    mockGetEntries.mockResolvedValue({ items: [makeEntry('found-entry')], total: 1 });

    const { result } = renderHook(() => useCrossSpaceReferences(defaultArgs));

    await waitFor(() => expect(result.current.status).toBe('done'));
    expect(result.current.references).toHaveLength(1);
    expect(result.current.references[0].spaceId).toBe('good-space');
  });

  it('updates checkedSpaces count as spaces resolve', async () => {
    mockGetSpaces.mockResolvedValue({
      items: [
        { sys: { id: 'space-a' }, name: 'Space A' },
        { sys: { id: 'space-b' }, name: 'Space B' },
      ],
    });
    mockGetEntries.mockResolvedValue({ items: [], total: 0 });

    const { result } = renderHook(() => useCrossSpaceReferences(defaultArgs));

    expect(result.current.checkedSpaces).toBe(0);
    await waitFor(() => expect(result.current.status).toBe('done'));
    expect(result.current.checkedSpaces).toBe(2);
    expect(result.current.totalSpaces).toBe(2);
  });
});
