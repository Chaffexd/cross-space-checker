import React from 'react';
import { Box, Text } from '@contentful/f36-components';
import ReferenceCard from './ReferenceCard';

function buildSummary(references) {
  const entryCount = references.length;
  const spaceCount = new Set(references.map((r) => r.spaceId)).size;
  const entryWord = entryCount === 1 ? 'entry' : 'entries';
  const spaceWord = spaceCount === 1 ? 'space' : 'spaces';
  return `Found in ${entryCount} ${entryWord} across ${spaceCount} ${spaceWord}`;
}

const ReferenceList = ({ references }) => (
  <Box>
    <Text marginBottom="spacingM" fontWeight="fontWeightDemiBold">
      {buildSummary(references)}
    </Text>
    {references.map((ref, index) => (
      <Box key={ref.entryId}>
        {index > 0 && <Box as="hr" style={{ margin: '0.5rem 0', border: 'none', borderTop: '1px solid #ccc' }} />}
        <ReferenceCard reference={ref} />
      </Box>
    ))}
  </Box>
);

export default ReferenceList;
