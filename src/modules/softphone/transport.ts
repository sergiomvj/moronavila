import type { SoftphoneEnvConfig, SoftphoneTransport } from './types';
import { MockSoftphoneTransport } from './transports/mockTransport';
import { SipJsSoftphoneTransport } from './transports/sipJsTransport';

export function createSoftphoneTransport(config: SoftphoneEnvConfig): SoftphoneTransport {
  if (config.transport === 'sipjs') {
    return new SipJsSoftphoneTransport();
  }

  return new MockSoftphoneTransport();
}
