import { getLocalApiBase, localApiFetch } from '../../lib/localApi';
import type {
  SoftphoneDirectoryEntry,
  SoftphoneEnvConfig,
  SoftphoneInboxItem,
  SoftphoneInboxSummary,
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
  door: {
    mode: 'none' | 'dtmf' | 'http-relay' | 'extension';
    label: string;
    dtmf: string;
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

export interface SoftphoneHealthResponse {
  ok: boolean;
  transport: string;
  enabled: boolean;
  configured: boolean;
  door: {
    mode: string;
    label: string;
    configured: boolean;
    dtmf?: string | null;
  };
  missing: string[];
  recommendations: string[];
}

export interface SoftphoneRolloutItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  extension: string | null;
  displayName: string | null;
  internetActive: boolean;
  softphoneEnabled: boolean;
  macAddress: string | null;
  ready: boolean;
  blockers: string[];
}

export interface SoftphoneRolloutResponse {
  generatedAt: string;
  requireInternetActive: boolean;
  summary: {
    totalResidents: number;
    ready: number;
    enabled: number;
    missingExtension: number;
    internetInactive: number;
    disabled: number;
    missingMac: number;
  };
  items: SoftphoneRolloutItem[];
}

export interface SoftphoneDoorResponse {
  ok: boolean;
  supported: boolean;
  mode: string;
  label: string;
  message: string;
  dtmf?: string | null;
  relayUrlConfigured?: boolean | null;
}

export interface SoftphoneInboxResponse {
  generatedAt: string;
  resident: {
    id: string;
    name: string;
    internetActive: boolean;
    softphoneEnabled: boolean;
  };
  summary: SoftphoneInboxSummary;
  items: SoftphoneInboxItem[];
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
      door: data.door,
    };
  } catch {
    return null;
  }
}

export async function fetchSoftphoneDirectory(authId?: string) {
  try {
    const response = await localApiFetch('/api/softphone/directory');
    if (!response.ok) throw new Error(`Softphone directory failed: ${response.status}`);
    return (await response.json()) as SoftphoneDirectoryResponse;
  } catch {
    return null;
  }
}

export async function fetchSoftphoneConfig(authId?: string) {
  if (!authId) return null;

  try {
    const response = await localApiFetch('/api/softphone/config');
    if (!response.ok) throw new Error(`Softphone config failed: ${response.status}`);
    return (await response.json()) as SoftphoneConfigResponse;
  } catch {
    return null;
  }
}

export async function fetchSoftphoneHealth(): Promise<SoftphoneHealthResponse | null> {
  try {
    const response = await localApiFetch('/api/softphone/health');
    if (!response.ok) throw new Error(`Softphone health failed: ${response.status}`);
    return (await response.json()) as SoftphoneHealthResponse;
  } catch {
    return null;
  }
}

export async function fetchSoftphoneRollout(): Promise<SoftphoneRolloutResponse | null> {
  try {
    const response = await localApiFetch('/api/softphone/rollout');
    if (!response.ok) throw new Error(`Softphone rollout failed: ${response.status}`);
    return (await response.json()) as SoftphoneRolloutResponse;
  } catch {
    return null;
  }
}

export async function triggerSoftphoneDoorOpen(): Promise<SoftphoneDoorResponse | null> {
  try {
    const response = await localApiFetch('/api/softphone/door/open', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error(`Softphone door failed: ${response.status}`);
    return (await response.json()) as SoftphoneDoorResponse;
  } catch {
    return null;
  }
}

export async function fetchSoftphoneInbox(authId?: string): Promise<SoftphoneInboxResponse | null> {
  if (!authId) return null;

  try {
    const response = await localApiFetch('/api/softphone/inbox');
    if (!response.ok) throw new Error(`Softphone inbox failed: ${response.status}`);
    return (await response.json()) as SoftphoneInboxResponse;
  } catch {
    return null;
  }
}

export async function markSoftphoneInboxItemAsRead(messageId: string): Promise<boolean> {
  try {
    const response = await localApiFetch(`/api/softphone/inbox/${messageId}/read`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.ok;
  } catch {
    return false;
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
