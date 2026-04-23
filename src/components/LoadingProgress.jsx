import React from 'react';
import { Flex, Spinner, Text } from '@contentful/f36-components';

const LoadingProgress = ({ checkedSpaces, totalSpaces }) => (
  <Flex alignItems="center" gap="spacingS">
    <Spinner />
    <Text>{`Checking spaces: ${checkedSpaces} of ${totalSpaces}...`}</Text>
  </Flex>
);

export default LoadingProgress;
