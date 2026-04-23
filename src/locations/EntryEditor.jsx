import React from 'react';
import { Box } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useCrossSpaceReferences } from '../hooks/useCrossSpaceReferences';
import LoadingProgress from '../components/LoadingProgress';
import ReferenceList from '../components/ReferenceList';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';

const EntryEditor = () => {
  const sdk = useSDK();
  const cmaToken = sdk.parameters?.installation?.cmaToken;

  const { status, references, checkedSpaces, totalSpaces, errorType } =
    useCrossSpaceReferences({
      cmaToken,
      spaceId: sdk.ids.space,
      environmentId: sdk.ids.environment,
      entryId: sdk.ids.entry,
      organizationId: sdk.ids.organization,
    });

  return (
    <Box padding="spacingL">
      {status === 'loading' && (
        <LoadingProgress checkedSpaces={checkedSpaces} totalSpaces={totalSpaces} />
      )}
      {status === 'error' && <ErrorState errorType={errorType} />}
      {status === 'done' && references.length === 0 && <EmptyState />}
      {status === 'done' && references.length > 0 && (
        <ReferenceList references={references} />
      )}
    </Box>
  );
};

export default EntryEditor;
