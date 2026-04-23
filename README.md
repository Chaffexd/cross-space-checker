# Cross Space Checker

A Contentful app that detects cross-space references to the currently viewed entry. When installed in the Entry Editor, it scans every space in the organization and shows which entries in other spaces reference the current one via a ResourceLink field.

## What it does

When you open an entry, the Cross Space Checker tab automatically runs a scan across all spaces in the organization. For each match it found it displays:

- **Space name** — which space the referencing entry lives in
- **Entry title** — resolved from `title`, `name`, or `internalName` fields
- **Content type** — the human-readable content type name
- **Publish status** — Published, Changed (published with unpublished edits), or Draft
- **Deep link** — direct link to open the referencing entry in Contentful

If no references are found, the tab says so. If the CMA token is missing or the API call fails, a descriptive error is shown instead.

## How the scan works

Contentful does not provide an API to query cross-space references directly. The app works around this by scanning:

1. **Fetch all spaces** in the organization via `client.getSpaces({ organization_id })`.
2. **For each space**, get its `master` environment and fetch all content types.
3. **Filter content types** to those that have at least one field with `type: "ResourceLink"` (or an Array of ResourceLinks). These are the only content types that can hold cross-space references.
4. **Paginate through entries** for each relevant content type, checking every ResourceLink field value against the target CRN.
5. **Match by CRN** — the target entry's canonical resource name has the format:
   ```
   crn:contentful:::content:spaces/{spaceId}/environments/{environmentId}/entries/{entryId}
   ```
   This is compared against the `sys.urn` of each ResourceLink value found in entries.
6. **Resolve metadata** (content type name, publish status) and build a deep link for each match.

Spaces that cannot be accessed (e.g. the token lacks permission) are silently skipped so the rest of the scan still completes.

## Setup

### Prerequisites

- A Contentful Personal Access Token (CMA token) with **read access across all spaces** in the organization. A token scoped to a single space will only find references within that space.

### Configuration

1. Install the app in your Contentful organization.
2. Open the app's **Config Screen** and paste your CMA token into the field provided.
3. Save. The token is stored as an installation parameter and is available to the app at runtime.
4. Add the app to the **Entry Editor** location for the content types you want to audit.

## Development

```bash
npm start      # run locally against your Contentful app definition
npm test       # run the test suite (Vitest)
npm run build  # production build
```

### Project structure

```
src/
  hooks/
    useCrossSpaceReferences.js   # core scanning logic
  components/
    ReferenceCard.jsx            # single reference row (space, title, status, link)
    ReferenceList.jsx            # list header + cards
    EmptyState.jsx               # "no references found" message
    ErrorState.jsx               # missing token / API failure messages
    LoadingProgress.jsx          # "Checking spaces: N of M..." indicator
  locations/
    ConfigScreen.jsx             # CMA token input, saved as installation parameter
    EntryEditor.jsx              # tab that drives the scan and renders results
```

### Deployment

```bash
npm run upload     # interactive upload + bundle activation
npm run upload-ci  # CI upload via environment variables:
                   #   CONTENTFUL_ORG_ID
                   #   CONTENTFUL_APP_DEF_ID
                   #   CONTENTFUL_ACCESS_TOKEN
```
