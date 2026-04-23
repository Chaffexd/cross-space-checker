import React from 'react';
import { Note } from '@contentful/f36-components';

const MESSAGES = {
  missing_token: {
    variant: 'warning',
    text: 'No CMA token configured. Go to App Settings to add one.',
  },
  api_failure: {
    variant: 'negative',
    text: 'Could not complete the check. Verify your CMA token has read access to all spaces.',
  },
};

const ErrorState = ({ errorType }) => {
  const { variant, text } = MESSAGES[errorType] ?? MESSAGES.api_failure;
  return <Note variant={variant}>{text}</Note>;
};

export default ErrorState;
