import { useState, useEffect } from 'react';
import { createClient } from 'contentful-management';

function getPublishStatus(sys) {
  if (!sys.publishedAt) return 'draft';
  if (sys.version > (sys.publishedVersion ?? 0) + 1) return 'changed';
  return 'published';
}

function buildCrn(spaceId, environmentId, entryId) {
  return `crn:contentful:::content:spaces/${spaceId}/environments/${environmentId}/entries/${entryId}`;
}

function buildDeepLink(spaceId, entryId) {
  return `https://app.contentful.com/spaces/${spaceId}/environments/master/entries/${entryId}`;
}

function resolveTitle(fields, entryId) {
  if (!fields) return entryId;
  const field = fields.title || fields.name || fields.internalName;
  if (!field) return entryId;
  if (typeof field === 'object' && !Array.isArray(field)) {
    return field['en-US'] || Object.values(field)[0] || entryId;
  }
  return String(field);
}

function hasResourceLinkFields(contentType) {
  return contentType.fields.some(
    (f) => f.type === 'ResourceLink' || (f.type === 'Array' && f.items?.type === 'ResourceLink')
  );
}

// fieldValue is locale-keyed: { 'en-US': <ResourceLink or Array<ResourceLink>> }
function fieldMatchesCrn(fieldValue, targetCrn) {
  if (!fieldValue || typeof fieldValue !== 'object') return false;
  return Object.values(fieldValue).some((localeValue) => {
    if (!localeValue) return false;
    if (localeValue.sys?.type === 'ResourceLink') return localeValue.sys.urn === targetCrn;
    if (Array.isArray(localeValue)) {
      return localeValue.some((item) => item?.sys?.type === 'ResourceLink' && item.sys.urn === targetCrn);
    }
    return false;
  });
}

function entryReferencesCrn(entry, resourceLinkFieldIds, targetCrn) {
  return resourceLinkFieldIds.some((fieldId) => fieldMatchesCrn(entry.fields?.[fieldId], targetCrn));
}

async function findEntriesReferencingCrn(env, targetCrn) {
  const ctCollection = await env.getContentTypes({ limit: 200 });
  const relevantTypes = ctCollection.items.filter(hasResourceLinkFields);

  if (relevantTypes.length === 0) return [];

  const matched = [];

  for (const ct of relevantTypes) {
    const resourceLinkFieldIds = ct.fields
      .filter((f) => f.type === 'ResourceLink' || (f.type === 'Array' && f.items?.type === 'ResourceLink'))
      .map((f) => f.id);

    let skip = 0;
    let hasMore = true;

    while (hasMore) {
      const collection = await env.getEntries({ content_type: ct.sys.id, limit: 200, skip });
      for (const entry of collection.items) {
        if (entryReferencesCrn(entry, resourceLinkFieldIds, targetCrn)) {
          matched.push(entry);
        }
      }
      skip += collection.items.length;
      hasMore = skip < collection.total;
    }
  }

  return matched;
}

export function useCrossSpaceReferences({ cmaToken, spaceId, environmentId, entryId, organizationId }) {
  const [status, setStatus] = useState('loading');
  const [references, setReferences] = useState([]);
  const [checkedSpaces, setCheckedSpaces] = useState(0);
  const [totalSpaces, setTotalSpaces] = useState(0);
  const [errorType, setErrorType] = useState(null);

  useEffect(() => {
    if (!cmaToken) {
      setStatus('error');
      setErrorType('missing_token');
      return;
    }

    let cancelled = false;

    async function run() {
      try {
        console.log(`[CrossSpaceChecker] Starting check for entry "${entryId}" in space "${spaceId}" env "${environmentId}"`);
        const client = createClient({ accessToken: cmaToken });
        const spacesCollection = await client.getSpaces({
          organization_id: organizationId,
          limit: 200,
        });
        const spaces = spacesCollection.items;

        if (cancelled) return;
        console.log(`[CrossSpaceChecker] Found ${spaces.length} spaces to check:`, spaces.map((s) => s.name));
        setTotalSpaces(spaces.length);

        const crn = buildCrn(spaceId, environmentId, entryId);
        console.log(`[CrossSpaceChecker] Target CRN: ${crn}`);

        const spacePromises = spaces.map(async (space) => {
          console.log(`[CrossSpaceChecker] Checking space "${space.name}" (${space.sys.id})...`);
          try {
            const spaceObj = await client.getSpace(space.sys.id);
            const env = await spaceObj.getEnvironment('master');
            const matchedEntries = await findEntriesReferencingCrn(env, crn);

            if (matchedEntries.length === 0) {
              console.log(`[CrossSpaceChecker] "${space.name}" — no references found`);
            } else {
              console.log(
                `[CrossSpaceChecker] "${space.name}" — found ${matchedEntries.length} reference(s):`,
                matchedEntries.map((e) => e.sys.id)
              );
            }

            const refs = await Promise.all(
              matchedEntries.map(async (entry) => {
                const title = resolveTitle(entry.fields, entry.sys.id);
                let contentTypeName = entry.sys.contentType.sys.id;
                try {
                  const ct = await env.getContentType(entry.sys.contentType.sys.id);
                  contentTypeName = ct.name;
                } catch {
                  // keep content type ID as fallback
                }
                return {
                  entryId: entry.sys.id,
                  spaceId: space.sys.id,
                  spaceName: space.name,
                  title,
                  contentTypeName,
                  publishStatus: getPublishStatus(entry.sys),
                  deepLink: buildDeepLink(space.sys.id, entry.sys.id),
                };
              })
            );

            if (!cancelled) {
              setReferences((prev) => [...prev, ...refs]);
              setCheckedSpaces((prev) => prev + 1);
            }
          } catch (err) {
            console.warn(`[CrossSpaceChecker] "${space.name}" — skipped (${err.message})`);
            if (!cancelled) {
              setCheckedSpaces((prev) => prev + 1);
            }
          }
        });

        await Promise.allSettled(spacePromises);

        if (!cancelled) {
          console.log(`[CrossSpaceChecker] Check complete.`);
          setStatus('done');
        }
      } catch (err) {
        console.error(`[CrossSpaceChecker] Fatal error:`, err.message);
        if (!cancelled) {
          setStatus('error');
          setErrorType('api_failure');
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [cmaToken, spaceId, environmentId, entryId, organizationId]);

  return { status, references, checkedSpaces, totalSpaces, errorType };
}
