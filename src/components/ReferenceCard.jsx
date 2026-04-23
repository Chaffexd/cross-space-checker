import React from 'react';
import { Card, Badge, Text, TextLink, Flex, Box } from '@contentful/f36-components';

const STATUS_BADGE = {
  published: { variant: 'positive', label: 'Published' },
  changed: { variant: 'warning', label: 'Changed' },
  draft: { variant: 'secondary', label: 'Draft' },
};

const ReferenceCard = ({ reference }) => {
  const { spaceName, title, contentTypeName, publishStatus, deepLink } = reference;
  const { variant, label } = STATUS_BADGE[publishStatus] ?? STATUS_BADGE.draft;

  return (
    <Card>
      <Flex justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Flex alignItems="center" gap="spacingXs" marginBottom="spacingXs">
            <Text fontWeight="fontWeightDemiBold">{spaceName}</Text>
            <Badge variant={variant}>{label}</Badge>
          </Flex>
          <Text>{`${title} — ${contentTypeName}`}</Text>
        </Box>
        <TextLink href={deepLink} target="_blank" rel="noopener noreferrer">
          Open entry →
        </TextLink>
      </Flex>
    </Card>
  );
};

export default ReferenceCard;
