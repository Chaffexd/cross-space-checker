import React, { useCallback, useState, useEffect } from 'react';
import { Heading, Form, FormControl, TextInput, Flex } from '@contentful/f36-components';
import { css } from 'emotion';
import { useSDK } from '@contentful/react-apps-toolkit';

const ConfigScreen = () => {
  const [parameters, setParameters] = useState({});
  const sdk = useSDK();

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();
    return { parameters, targetState: currentState };
  }, [parameters, sdk]);

  useEffect(() => {
    sdk.app.onConfigure(onConfigure);
  }, [sdk, onConfigure]);

  useEffect(() => {
    (async () => {
      const currentParameters = await sdk.app.getParameters();
      if (currentParameters) {
        setParameters(currentParameters);
      }
      sdk.app.setReady();
    })();
  }, [sdk]);

  return (
    <Flex flexDirection="column" className={css({ margin: '80px', maxWidth: '800px' })}>
      <Form>
        <Heading>Cross-Space Checker — Configuration</Heading>
        <FormControl>
          <FormControl.Label>CMA Token</FormControl.Label>
          <TextInput
            type="password"
            value={parameters.cmaToken || ''}
            onChange={(e) =>
              setParameters((prev) => ({ ...prev, cmaToken: e.target.value }))
            }
            placeholder="Enter a CMA token with org-level read access"
          />
          <FormControl.HelpText>
            This token requires org-level read access to all spaces so the app can check
            cross-space references.
          </FormControl.HelpText>
        </FormControl>
      </Form>
    </Flex>
  );
};

export default ConfigScreen;
