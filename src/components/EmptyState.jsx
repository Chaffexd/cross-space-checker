import React from 'react';
import { Note } from '@contentful/f36-components';

const EmptyState = () => (
  <Note variant="primary">
    This entry is not referenced from any other space.
  </Note>
);

export default EmptyState;
