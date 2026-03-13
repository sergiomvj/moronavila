export type SoftphoneConnectionStatus =
  | 'disabled'
  | 'awaiting-provisioning'
  | 'ready'
  | 'connecting'
  | 'active'
  | 'error';

export type SoftphoneCallStatus =
  | 'idle'
  | 'dialing'
  | 'ringing'
  | 'in-call';

export interface SoftphoneDirectoryEntry {
  id: string;
  extension: string;
  name: string;
  kind: 'doorphone' | 'admin' | 'laundry' | 'delivery' | 'resident' | 'service';
  description: string;
}

export interface SoftphoneEnvConfig {
  enabled: boolean;
  autoConnect: boolean;
  requireInternetActive: boolean;
  pbxHost: string;
  pbxDomain: string;
  pbxWssUrl: string;
  defaultDisplayName: string;
  transport: 'mock' | 'sipjs';
  quickExtensions: {
    portaria: string;
    administracao: string;
    lavanderia: string;
    encomendas: string;
  };
}

export interface SoftphoneRuntimeState {
  connectionStatus: SoftphoneConnectionStatus;
  callStatus: SoftphoneCallStatus;
  activeExtension?: string;
  lastDialed?: string;
  message: string;
}

export interface SoftphoneSipCredentials {
  uri: string;
  domain: string;
  websocketServer: string;
  authorizationUsername: string;
  authorizationPassword: string;
}

export interface SoftphoneSession {
  extension?: string;
  displayName: string;
  sip?: SoftphoneSipCredentials | null;
}

export interface SoftphoneTransport {
  connect(session: SoftphoneSession): Promise<Partial<SoftphoneRuntimeState>>;
  disconnect(): Promise<void>;
  dial(extension: string): Promise<Partial<SoftphoneRuntimeState>>;
}
