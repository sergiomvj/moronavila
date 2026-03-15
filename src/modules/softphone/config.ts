import type { Resident } from '../../types';
import type {
  SoftphoneDirectoryEntry,
  SoftphoneEnvConfig,
  SoftphoneRuntimeState,
} from './types';

function readBool(value: string | undefined, fallback: boolean) {
  if (value == null || value === '') return fallback;
  return value.toLowerCase() === 'true';
}

export function getSoftphoneEnvConfig(): SoftphoneEnvConfig {
  return {
    enabled: readBool(import.meta.env.VITE_SOFTPHONE_ENABLED, false),
    autoConnect: readBool(import.meta.env.VITE_SOFTPHONE_AUTO_CONNECT, true),
    requireInternetActive: readBool(
      import.meta.env.VITE_SOFTPHONE_REQUIRE_INTERNET_ACTIVE,
      true
    ),
    pbxHost: import.meta.env.VITE_SOFTPHONE_PBX_HOST || '',
    pbxDomain: import.meta.env.VITE_SOFTPHONE_PBX_DOMAIN || '',
    pbxWssUrl: import.meta.env.VITE_SOFTPHONE_PBX_WSS_URL || '',
    defaultDisplayName:
      import.meta.env.VITE_SOFTPHONE_DEFAULT_DISPLAY_NAME || 'MoronaVila Softphone',
    transport:
      import.meta.env.VITE_SOFTPHONE_TRANSPORT === 'sipjs' ? 'sipjs' : 'mock',
    quickExtensions: {
      portaria: import.meta.env.VITE_SOFTPHONE_PORTARIA_EXTENSION || '100',
      administracao: import.meta.env.VITE_SOFTPHONE_ADMIN_EXTENSION || '101',
      lavanderia: import.meta.env.VITE_SOFTPHONE_LAUNDRY_EXTENSION || '102',
      encomendas: import.meta.env.VITE_SOFTPHONE_DELIVERY_EXTENSION || '103',
    },
    door: {
      mode:
        import.meta.env.VITE_SOFTPHONE_DOOR_MODE === 'dtmf' ||
        import.meta.env.VITE_SOFTPHONE_DOOR_MODE === 'http-relay' ||
        import.meta.env.VITE_SOFTPHONE_DOOR_MODE === 'extension'
          ? import.meta.env.VITE_SOFTPHONE_DOOR_MODE
          : 'none',
      label: import.meta.env.VITE_SOFTPHONE_DOOR_LABEL || 'Abrir porta',
      dtmf: import.meta.env.VITE_SOFTPHONE_DOOR_DTMF || '9',
    },
  };
}

export function isSoftphoneProvisioned(config: SoftphoneEnvConfig) {
  return Boolean(config.pbxHost && config.pbxDomain && config.pbxWssUrl);
}

export function canResidentAutoStartSoftphone(
  resident: Resident,
  config: SoftphoneEnvConfig
) {
  if (resident.habilitado === false) return false;
  if (resident.softphone_enabled === false) return false;
  if (!config.enabled) return false;
  if (!config.autoConnect) return false;
  if (!config.requireInternetActive) return true;
  return resident.internet_active;
}

export function buildResidentExtension(resident: Resident) {
  if (resident.softphone_extension?.trim()) {
    return resident.softphone_extension.trim();
  }
  const preferred = resident.bed_identifier?.replace(/\D/g, '');
  if (preferred) return `2${preferred.padStart(2, '0').slice(-2)}`;
  const digitsFromPhone = resident.phone?.replace(/\D/g, '').slice(-3);
  if (digitsFromPhone) return `2${digitsFromPhone.padStart(3, '0').slice(-3)}`;
  return undefined;
}

export function buildSoftphoneDirectory(
  resident: Resident,
  config: SoftphoneEnvConfig
): SoftphoneDirectoryEntry[] {
  const residentExtension = buildResidentExtension(resident);
  const items: SoftphoneDirectoryEntry[] = [
    {
      id: 'portaria',
      extension: config.quickExtensions.portaria,
      name: 'Portaria',
      kind: 'doorphone',
      description: 'Atendimento principal e chamadas do interfone',
    },
    {
      id: 'administracao',
      extension: config.quickExtensions.administracao,
      name: 'Administracao',
      kind: 'admin',
      description: 'Equipe administrativa e suporte interno',
    },
    {
      id: 'lavanderia',
      extension: config.quickExtensions.lavanderia,
      name: 'Lavanderia',
      kind: 'laundry',
      description: 'Contato rapido para operacao da lavanderia',
    },
    {
      id: 'encomendas',
      extension: config.quickExtensions.encomendas,
      name: 'Encomendas',
      kind: 'delivery',
      description: 'Recebimento e triagem de entregas',
    },
  ];

  if (residentExtension) {
    items.unshift({
      id: 'meu-ramal',
      extension: residentExtension,
      name: resident.name,
      kind: 'resident',
      description: 'Ramal sugerido para este morador',
    });
  }

  return items;
}

export function getInitialSoftphoneState(
  resident: Resident,
  config: SoftphoneEnvConfig
): SoftphoneRuntimeState {
  if (!config.enabled) {
    return {
      connectionStatus: 'disabled',
      callStatus: 'idle',
      message: 'Softphone desativado no ambiente atual.',
    };
  }

  if (resident.habilitado === false) {
    return {
      connectionStatus: 'disabled',
      callStatus: 'idle',
      activeExtension: buildResidentExtension(resident),
      message: resident.motivo_bloqueio?.trim()
        ? `Acesso do morador desabilitado. Motivo: ${resident.motivo_bloqueio.trim()}`
        : 'Acesso do morador desabilitado. O softphone permanece bloqueado neste login.',
    };
  }

  if (resident.softphone_enabled === false) {
    return {
      connectionStatus: 'disabled',
      callStatus: 'idle',
      activeExtension: buildResidentExtension(resident),
      message: 'Softphone desativado no perfil deste morador.',
    };
  }

  if (!resident.internet_active && config.requireInternetActive) {
    return {
      connectionStatus: 'disabled',
      callStatus: 'idle',
      message: 'O softphone automatico depende do acesso de internet do morador estar ativo.',
    };
  }

  if (!isSoftphoneProvisioned(config)) {
    return {
      connectionStatus: 'awaiting-provisioning',
      callStatus: 'idle',
      activeExtension: buildResidentExtension(resident),
      message: 'PBX ainda nao provisionado. Preencha as variaveis VITE_SOFTPHONE_* apos a instalacao.',
    };
  }

  return {
    connectionStatus: 'ready',
    callStatus: 'idle',
    activeExtension: buildResidentExtension(resident),
    message: 'Softphone pronto para conectar ao PBX assim que a integracao SIP for habilitada.',
  };
}
