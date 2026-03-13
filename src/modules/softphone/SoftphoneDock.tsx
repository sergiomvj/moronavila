import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  DoorOpen,
  Loader2,
  Mic,
  Phone,
  PhoneCall,
  PhoneForwarded,
  ShieldCheck,
  Wifi,
  X,
} from 'lucide-react';
import type { Resident } from '../../types';
import {
  fetchSoftphoneConfig,
  fetchSoftphoneDirectory,
  fetchSoftphoneEnv,
  toSipCredentials,
} from './api';
import {
  buildSoftphoneDirectory,
  canResidentAutoStartSoftphone,
  getInitialSoftphoneState,
  getSoftphoneEnvConfig,
  isSoftphoneProvisioned,
} from './config';
import { createSoftphoneTransport } from './transport';
import type { SoftphoneRuntimeState, SoftphoneSipCredentials, SoftphoneTransport } from './types';

interface SoftphoneDockProps {
  currentUser: Resident;
}

const statusTone: Record<SoftphoneRuntimeState['connectionStatus'], string> = {
  disabled: 'bg-slate-800 text-slate-300 border-slate-700',
  'awaiting-provisioning': 'bg-amber-500/10 text-amber-200 border-amber-500/20',
  ready: 'bg-sky-500/10 text-sky-200 border-sky-500/20',
  connecting: 'bg-indigo-500/10 text-indigo-200 border-indigo-500/20',
  active: 'bg-emerald-500/10 text-emerald-200 border-emerald-500/20',
  error: 'bg-rose-500/10 text-rose-200 border-rose-500/20',
};

function formatStatusLabel(status: SoftphoneRuntimeState['connectionStatus']) {
  switch (status) {
    case 'awaiting-provisioning':
      return 'Aguardando PBX';
    case 'ready':
      return 'Pronto';
    case 'connecting':
      return 'Conectando';
    case 'active':
      return 'Ativo';
    case 'error':
      return 'Erro';
    default:
      return 'Desativado';
  }
}

export function SoftphoneDock({ currentUser }: SoftphoneDockProps) {
  const fallbackConfig = useMemo(() => getSoftphoneEnvConfig(), []);
  const [config, setConfig] = useState(fallbackConfig);
  const [directory, setDirectory] = useState(() =>
    buildSoftphoneDirectory(currentUser, fallbackConfig)
  );
  const [isOpen, setIsOpen] = useState(false);
  const [dialedNumber, setDialedNumber] = useState('');
  const [state, setState] = useState<SoftphoneRuntimeState>(() =>
    getInitialSoftphoneState(currentUser, fallbackConfig)
  );
  const [resolvedResident, setResolvedResident] = useState<Resident>(currentUser);
  const [sipCredentials, setSipCredentials] = useState<SoftphoneSipCredentials | null>(null);
  const transportRef = useRef<SoftphoneTransport>(createSoftphoneTransport(fallbackConfig));

  useEffect(() => {
    let active = true;

    async function hydrateFromServer() {
      const [envConfig, configResponse, directoryResponse] = await Promise.all([
        fetchSoftphoneEnv(),
        fetchSoftphoneConfig(currentUser.auth_id),
        fetchSoftphoneDirectory(currentUser.auth_id),
      ]);

      if (!active) return;

      const resolvedConfig = envConfig || fallbackConfig;
      setConfig(resolvedConfig);

      if (configResponse?.resident) {
        setResolvedResident((previous) => ({
          ...previous,
          softphone_enabled: configResponse.enabled,
          softphone_extension: configResponse.resident.extension || previous.softphone_extension,
          softphone_display_name:
            configResponse.resident.displayName || previous.softphone_display_name,
          internet_active: configResponse.resident.internetActive,
        }));
        setSipCredentials(toSipCredentials(configResponse));
      } else {
        setResolvedResident(currentUser);
        setSipCredentials(null);
      }

      if (directoryResponse?.directory?.length) {
        setDirectory(directoryResponse.directory);
      } else {
        setDirectory(buildSoftphoneDirectory(currentUser, resolvedConfig));
      }
    }

    hydrateFromServer().catch(() => undefined);

    return () => {
      active = false;
    };
  }, [currentUser, fallbackConfig]);

  useEffect(() => {
    const nextTransport = createSoftphoneTransport(config);
    const previousTransport = transportRef.current;
    transportRef.current = nextTransport;

    return () => {
      previousTransport.disconnect().catch(() => undefined);
    };
  }, [config]);

  useEffect(() => {
    const next = getInitialSoftphoneState(resolvedResident, config);
    setState(next);
    setDirectory((previous) =>
      previous.length > 0 ? previous : buildSoftphoneDirectory(resolvedResident, config)
    );

    if (canResidentAutoStartSoftphone(resolvedResident, config)) {
      setIsOpen(true);
    }
  }, [config, resolvedResident]);

  useEffect(() => {
    if (!canResidentAutoStartSoftphone(resolvedResident, config)) return;
    if (!isSoftphoneProvisioned(config)) return;

    setState((previous) => ({
      ...previous,
      connectionStatus: 'connecting',
      message: `Sessao do softphone iniciada no app com transporte ${config.transport}.`,
    }));

    let active = true;

    transportRef.current
      .connect({
        extension: getInitialSoftphoneState(resolvedResident, config).activeExtension,
        displayName:
          resolvedResident.softphone_display_name ||
          resolvedResident.name ||
          config.defaultDisplayName,
        sip: sipCredentials,
      })
      .then((nextState) => {
        if (!active) return;
        setState((previous) => ({ ...previous, ...nextState }));
      })
      .catch((error: Error) => {
        if (!active) return;
        setState((previous) => ({
          ...previous,
          connectionStatus: 'error',
          message: error.message,
        }));
      });

    return () => {
      active = false;
    };
  }, [config, resolvedResident, sipCredentials]);

  const canPlaceCalls = state.connectionStatus === 'active';

  const handleDial = (extension: string) => {
    setDialedNumber(extension);
    if (!canPlaceCalls) {
      setState((previous) => ({
        ...previous,
        lastDialed: extension,
        callStatus: 'idle',
        message: 'Preencha as variaveis do PBX para habilitar chamadas reais.',
      }));
      return;
    }

    transportRef.current
      .dial(extension)
      .then((nextState) => {
        setState((previous) => ({ ...previous, ...nextState }));
      })
      .catch((error: Error) => {
        setState((previous) => ({
          ...previous,
          connectionStatus: 'error',
          message: error.message,
        }));
      });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen((value) => !value)}
        className="fixed bottom-5 right-5 z-[80] flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/95 px-4 py-3 text-left text-white shadow-2xl shadow-slate-950/50 backdrop-blur-xl transition hover:border-rose-500/30"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-lg shadow-rose-950/30">
          <PhoneCall size={20} />
        </div>
        <div className="hidden sm:block">
          <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
            Softphone
          </div>
          <div className="text-sm font-bold">{formatStatusLabel(state.connectionStatus)}</div>
        </div>
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-5 z-[80] w-[min(420px,calc(100vw-2rem))] overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/95 text-slate-100 shadow-2xl shadow-slate-950/60 backdrop-blur-2xl">
          <div className="border-b border-white/5 bg-gradient-to-br from-slate-900 via-slate-950 to-rose-950/40 p-5">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
                  Interfone e portas
                </div>
                <h3 className="mt-2 text-xl font-black tracking-tight">Softphone do morador</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Mantido visivel durante a sessao para acelerar atendimento do interfone.
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-2xl border border-white/10 p-2 text-slate-400 transition hover:text-white"
                aria-label="Fechar softphone"
              >
                <X size={18} />
              </button>
            </div>

            <div
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] ${statusTone[state.connectionStatus]}`}
            >
              {state.connectionStatus === 'connecting' ? (
                <Loader2 size={14} className="animate-spin" />
              ) : state.connectionStatus === 'active' ? (
                <ShieldCheck size={14} />
              ) : (
                <Wifi size={14} />
              )}
              {formatStatusLabel(state.connectionStatus)}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                  Ramal sugerido
                </div>
                <div className="mt-2 text-2xl font-black">
                  {state.activeExtension || 'Pendente'}
                </div>
                <div className="mt-1 text-xs text-slate-400">{resolvedResident.name}</div>
              </div>
              <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                  PBX
                </div>
                <div className="mt-2 truncate text-sm font-bold">
                  {config.pbxHost || 'Nao configurado'}
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  {config.pbxWssUrl || 'Preencher VITE_SOFTPHONE_PBX_*'}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5 p-5">
            <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-bold">
                <Phone size={16} />
                Discagem rapida
              </div>
              <div className="mb-3 flex items-center gap-2 rounded-2xl border border-white/5 bg-slate-900/70 px-4 py-3">
                <PhoneForwarded size={16} className="text-slate-500" />
                <input
                  value={dialedNumber}
                  onChange={(event) => setDialedNumber(event.target.value)}
                  placeholder="Digite o ramal"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-slate-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {directory.slice(0, 4).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleDial(item.extension)}
                    className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-left transition hover:border-rose-500/30"
                  >
                    <div className="text-sm font-bold">{item.name}</div>
                    <div className="text-xs text-slate-400">Ramal {item.extension}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-bold">
                <DoorOpen size={16} />
                Fluxo de atendimento previsto
              </div>
              <div className="space-y-2 text-sm text-slate-300">
                <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-3">
                  1. Morador entra no app e o shell do softphone permanece disponivel.
                </div>
                <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-3">
                  2. Interfone ou portaria chamam o ramal interno configurado no PBX.
                </div>
                <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-3">
                  3. Depois da instalacao do PBX, a abertura de porta pode ser ligada por DTMF ou relay HTTP.
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-slate-900/70 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-bold">
                <Mic size={16} />
                Estado atual
              </div>
              <p className="text-sm leading-relaxed text-slate-300">{state.message}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
