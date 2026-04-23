import { vi } from 'vitest';

const mockSdk = {
  app: {
    onConfigure: vi.fn(),
    getParameters: vi.fn().mockReturnValueOnce({}),
    setReady: vi.fn(),
    getCurrentState: vi.fn(),
  },
  ids: {
    app: 'test-app',
    space: 'test-space',
    entry: 'test-entry',
    organization: 'test-org',
  },
  parameters: {
    installation: {
      cmaToken: 'test-cma-token',
    },
  },
};

export { mockSdk };
