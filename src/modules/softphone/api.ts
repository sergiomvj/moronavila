import { getLocalApiBase } from '../../lib/localApi';
import type {
  SoftphoneDirectoryEntry,
  SoftphoneEnvConfig,
  SoftphoneSipCredentials,
} from './types';

interface SoftphoneEnvResponse {
  enabled: boolean;
  autoConnect: boolean;
  requireInternetActive: boolean;
  configured: boolean;
  pbxHost: string | null;
  pbxDomain: string | null;
  pbxWssUrl: string | null;
  defaultDisplayName: string;
  transport?: 'mock' | 'sipjs';
  quickExtensions: {
    portaria: string;
    administracao: string;
    lavanderia: string;
    encomendas: string;
  };
}

interface SoftphoneDirectoryResponse {
  resident: {
    id: string;
    softphoneEnabled: boolean;
    internetActive: boolean;
  } | null;
  directory: SoftphoneDirectoryEntry[];
}

interface SoftphoneConfigResponse {
  enabled: boolean;
  autoConnect: boolean;
  requireInternetActive: boolean;
  transport: 'mock' | 'sipjs';
  configured: boolean;
  resident: {
    id: string;
    name: string;
    displayName: string;
    extension: string | null;
    internetActive: boolean;
  };
  sip: {
    host: string | null;
    domain: string | null;
    websocketServer: string | null;
    uri: string | null;
    authorizationUsername: string | null;
    authorizationPassword: string | null;
  };
}

export async function fetchSoftphoneEnv(): Promise<SoftphoneEnvConfig | null> {
  try {
    const response = await fetch(`${getLocalApiBase()}/api/softphone/env`);
    if (!response.ok) throw new Error(`Softphone env failed: ${response.status}`);

    const data = (await response.json()) as SoftphoneEnvResponse;
    return {
      enabled: data.enabled,
      autoConnect: data.autoConnect,
      requireInternetActive: data.requireInternetActive,
      pbxHost: data.pbxHost || '',
      pbxDomain: data.pbxDomain || '',
      pbxWssUrl: data.pbxWssUrl || '',
      defaultDisplayName: data.defaultDisplayName,
      transport: data.transport === 'sipjs' ? 'sipjs' : 'mock',
      quickExtensions: data.quickExtensions,
    };
  } catch {
    return null;
  }
}

export async function fetchSoftphoneDirectory(authId?: string) {
  try {
    const query = authId ? `?authId=${encodeURIComponent(authId)}` : '';
    const response = await fetch(`${getLocalApiBase()}/api/softphone/directory${query}`);
    if (!response.ok) throw new Error(`Softphone directory failed: ${response.status}`);
    return (await response.json()) as SoftphoneDirectoryResponse;
  } catch {
    return null;
  }
}

export async function fetchSoftphoneConfig(authId?: string) {
  if (!authId) return null;

  try {
    const response = await fetch(
      `${getLocalApiBase()}/api/softphone/config?authId=${encodeURIComponent(authId)}`
    );
    if (!response.ok) throw new Error(`Softphone config failed: ${response.status}`);
    return (await response.json()) as SoftphoneConfigResponse;
  } catch {
    return null;
  }
}

export function toSipCredentials(
  config: SoftphoneConfigResponse | null
): SoftphoneSipCredentials | null {
  if (!config?.sip.uri) return null;
  if (!config.sip.domain) return null;
  if (!config.sip.websocketServer) return null;
  if (!config.sip.authorizationUsername) return null;
  if (!config.sip.authorizationPassword) return null;

  return {
    uri: config.sip.uri,
    domain: config.sip.domain,
    websocketServer: config.sip.websocketServer,
    authorizationUsername: config.sip.authorizationUsername,
    authorizationPassword: config.sip.authorizationPassword,
  };
}
