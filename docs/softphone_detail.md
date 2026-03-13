Perfeito. Vamos para a **fase 2** com um desenho mais próximo de implementação real.

A base continua muito boa: o navegador fala SIP por WebSocket com o PBX, e o SIP.js cobre registro, chamadas, hold/resume, transfer e DTMF. Do lado do PBX, o caminho padrão para clientes WebRTC continua sendo HTTPS/TLS + transporte PJSIP WebSocket + objetos PJSIP próprios para o cliente WebRTC. Em FreePBX/Sangoma, a porta 8089 é a usada para a parte WebRTC criptografada do PBX, enquanto 8088 é a variante não criptografada. ([sipjs.com][1])

## Fase 2 — escopo

Agora eu vou te entregar:

* componentes React do módulo
* estados da chamada e da conexão
* serviço SIP mais robusto
* diretório de ramais
* integração lógica com porteiro eletrônico
* estrutura Next.js refinada
* código base mais funcional e já organizado para crescer

---

# 1. Arquitetura refinada do módulo

Eu dividiria o módulo em 6 blocos:

1. **UI**

   * painel do telefone
   * dialpad
   * lista de ramais
   * popup de chamada recebida
   * controles de chamada
   * badge de status

2. **Store**

   * estado global do softphone
   * status SIP
   * chamada atual
   * áudio local/remoto
   * flags de mute/hold
   * histórico simples

3. **Hook de orquestração**

   * conecta UI ao serviço SIP
   * consome diretório interno
   * expõe ações prontas

4. **Serviço SIP**

   * encapsula SIP.js
   * registra no PBX
   * cria/aceita sessões
   * eventos de sessão
   * DTMF, hold, transfer

5. **Backend do app**

   * entrega configuração do ramal do usuário logado
   * entrega lista de ramais
   * define labels do porteiro, lavanderia, administração, etc.

6. **PBX**

   * PJSIP + WSS
   * dialplan
   * ramal do porteiro
   * grupos de toque, se necessário

---

# 2. Estados que o sistema precisa controlar

## Estado da conexão SIP

```ts
type SipConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "registering"
  | "registered"
  | "unregistered"
  | "disconnected"
  | "error";
```

## Estado da chamada

```ts
type PhoneCallStatus =
  | "idle"
  | "incoming"
  | "calling"
  | "ringing"
  | "answering"
  | "connected"
  | "held"
  | "transferring"
  | "ended"
  | "failed";
```

## Tipo de chamada

```ts
type CallDirection = "inbound" | "outbound";
```

## Origem da chamada

```ts
type CallSourceType =
  | "extension"
  | "doorphone"
  | "admin"
  | "laundry"
  | "delivery"
  | "unknown";
```

Isso é importante porque o porteiro não deve aparecer só como “101”. Ele deve aparecer como algo tipo:

* Porteiro principal
* Recebimento de encomendas
* Administração
* Lavanderia

---

# 3. Estrutura de pastas refinada

```text
src/
  app/
    dashboard/
      phone/
        page.tsx
        loading.tsx
        error.tsx

    api/
      softphone/
        config/route.ts
        extensions/route.ts
        presence/route.ts

  modules/
    softphone/
      components/
        SoftphoneShell.tsx
        PhoneDisplay.tsx
        DialPad.tsx
        CallControls.tsx
        IncomingCallDialog.tsx
        ExtensionDirectory.tsx
        QuickActions.tsx
        StatusBadge.tsx
        ActiveCallCard.tsx

      hooks/
        useSoftphone.ts
        useSoftphoneDirectory.ts
        useSoftphoneAudio.ts

      services/
        sip/
          SipClient.ts
          SipSessionManager.ts
          sipEvents.ts
          sipConfig.ts
          sipMappers.ts
        api/
          softphoneApi.ts

      store/
        softphoneStore.ts

      types/
        softphone.ts
        directory.ts

      utils/
        phoneFormat.ts
        parseCaller.ts
        normalizeExtension.ts
        audio.ts
```

---

# 4. Componentes React do módulo

## `SoftphoneShell`

Componente raiz. Junta tudo.

Responsável por:

* conectar ao serviço SIP
* carregar dados do usuário
* renderizar status, display, diretório e controles

## `PhoneDisplay`

Mostra:

* número digitado
* nome do contato/ramal
* status da chamada
* duração da chamada
* origem: porteiro, administração, morador etc.

## `DialPad`

Funções:

* digitação manual
* clique para chamar
* DTMF durante chamada

## `CallControls`

Botões:

* ligar
* atender
* desligar
* mute/unmute
* hold/resume
* transferir

## `IncomingCallDialog`

Popup de chamada recebida com:

* nome
* origem
* número/ramal
* atender
* rejeitar

## `ExtensionDirectory`

Lista pesquisável de ramais:

* moradores
* setores
* serviços
* porteiro
* favoritos

## `QuickActions`

Botões rápidos:

* Portaria
* Administração
* Lavanderia
* Recebimento
* Emergência interna

## `StatusBadge`

Mostra:

* desconectado
* registrando
* registrado
* em chamada
* chamada em espera

## `ActiveCallCard`

Card da chamada ativa:

* destino/origem
* duração
* mute
* hold
* transfer
* DTMF

---

# 5. Tipos centrais do módulo

## `types/softphone.ts`

```ts
export type SipConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "registering"
  | "registered"
  | "unregistered"
  | "disconnected"
  | "error";

export type PhoneCallStatus =
  | "idle"
  | "incoming"
  | "calling"
  | "ringing"
  | "answering"
  | "connected"
  | "held"
  | "transferring"
  | "ended"
  | "failed";

export type CallDirection = "inbound" | "outbound";

export type CallSourceType =
  | "extension"
  | "doorphone"
  | "admin"
  | "laundry"
  | "delivery"
  | "unknown";

export interface SipCredentials {
  uri: string;
  authorizationUsername: string;
  authorizationPassword: string;
  displayName: string;
  websocketServer: string;
}

export interface SoftphoneDirectoryEntry {
  id: string;
  extension: string;
  name: string;
  type: CallSourceType;
  apartment?: string;
  online?: boolean;
  canReceiveCalls?: boolean;
}

export interface ActiveCall {
  id: string;
  direction: CallDirection;
  remoteNumber: string;
  remoteName?: string;
  sourceType: CallSourceType;
  status: PhoneCallStatus;
  startedAt?: number;
  isMuted: boolean;
  isHeld: boolean;
}
```

---

# 6. Store do softphone

Eu usaria Zustand pela simplicidade.

## `store/softphoneStore.ts`

```ts
"use client";

import { create } from "zustand";
import type {
  ActiveCall,
  SipConnectionStatus,
  SoftphoneDirectoryEntry
} from "../types/softphone";

interface SoftphoneState {
  connectionStatus: SipConnectionStatus;
  currentCall: ActiveCall | null;
  dialedNumber: string;
  directory: SoftphoneDirectoryEntry[];
  setConnectionStatus: (status: SipConnectionStatus) => void;
  setCurrentCall: (call: ActiveCall | null) => void;
  setDialedNumber: (value: string) => void;
  appendDigit: (digit: string) => void;
  clearDialedNumber: () => void;
  setDirectory: (items: SoftphoneDirectoryEntry[]) => void;
}

export const useSoftphoneStore = create<SoftphoneState>((set) => ({
  connectionStatus: "idle",
  currentCall: null,
  dialedNumber: "",
  directory: [],
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setCurrentCall: (call) => set({ currentCall: call }),
  setDialedNumber: (value) => set({ dialedNumber: value }),
  appendDigit: (digit) =>
    set((state) => ({ dialedNumber: `${state.dialedNumber}${digit}` })),
  clearDialedNumber: () => set({ dialedNumber: "" }),
  setDirectory: (items) => set({ directory: items })
}));
```

---

# 7. API interna do seu app

## `services/api/softphoneApi.ts`

```ts
import type { SipCredentials, SoftphoneDirectoryEntry } from "../../types/softphone";

export async function getSoftphoneConfig(): Promise<SipCredentials> {
  const res = await fetch("/api/softphone/config", {
    method: "GET",
    cache: "no-store"
  });

  if (!res.ok) {
    throw new Error("Failed to load softphone config");
  }

  return res.json();
}

export async function getExtensions(): Promise<SoftphoneDirectoryEntry[]> {
  const res = await fetch("/api/softphone/extensions", {
    method: "GET",
    cache: "no-store"
  });

  if (!res.ok) {
    throw new Error("Failed to load extension directory");
  }

  return res.json();
}
```

---

# 8. Exemplo de rotas Next.js

## `app/api/softphone/config/route.ts`

Aqui o backend entrega o ramal do usuário logado.

```ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    uri: "sip:201@pbx.sua-rede.local",
    authorizationUsername: "201",
    authorizationPassword: "SENHA_FORTE_AQUI",
    displayName: "Apartamento 201",
    websocketServer: "wss://pbx.sua-rede.local:8089/ws"
  });
}
```

## `app/api/softphone/extensions/route.ts`

```ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json([
    {
      id: "1",
      extension: "100",
      name: "Portaria",
      type: "doorphone",
      online: true,
      canReceiveCalls: true
    },
    {
      id: "2",
      extension: "101",
      name: "Administração",
      type: "admin",
      online: true,
      canReceiveCalls: true
    },
    {
      id: "3",
      extension: "102",
      name: "Lavanderia",
      type: "laundry",
      online: true,
      canReceiveCalls: true
    },
    {
      id: "4",
      extension: "201",
      name: "Apartamento 201",
      type: "extension",
      apartment: "201",
      online: true,
      canReceiveCalls: true
    }
  ]);
}
```

---

# 9. Serviço SIP mais robusto

O SIP.js oferece registro via SIP over WebSocket, além de hold/resume, transfer e DTMF, então ele encaixa muito bem aqui. ([sipjs.com][1])

## `services/sip/SipClient.ts`

```ts
"use client";

import {
  Inviter,
  Invitation,
  Registerer,
  Session,
  SessionState,
  UserAgent,
  UserAgentOptions
} from "sip.js";
import type {
  ActiveCall,
  CallSourceType,
  SipCredentials
} from "../../types/softphone";

type Listener<T = unknown> = (payload: T) => void;

interface SipClientEvents {
  connectionStatus: string;
  incomingCall: ActiveCall;
  callUpdated: ActiveCall | null;
  callEnded: void;
  error: Error;
}

export class SipClient {
  private userAgent: UserAgent | null = null;
  private registerer: Registerer | null = null;
  private session: Session | null = null;
  private listeners: Record<string, Listener[]> = {};
  private remoteAudioEl: HTMLAudioElement | null = null;

  on<K extends keyof SipClientEvents>(event: K, listener: Listener<SipClientEvents[K]>) {
    if (!this.listeners[event as string]) this.listeners[event as string] = [];
    this.listeners[event as string].push(listener as Listener);
  }

  off<K extends keyof SipClientEvents>(event: K, listener: Listener<SipClientEvents[K]>) {
    this.listeners[event as string] =
      (this.listeners[event as string] || []).filter((l) => l !== listener);
  }

  private emit<K extends keyof SipClientEvents>(event: K, payload: SipClientEvents[K]) {
    (this.listeners[event as string] || []).forEach((listener) => listener(payload));
  }

  attachRemoteAudio(element: HTMLAudioElement) {
    this.remoteAudioEl = element;
  }

  async connect(credentials: SipCredentials) {
    this.emit("connectionStatus", "connecting");

    const options: UserAgentOptions = {
      uri: UserAgent.makeURI(credentials.uri),
      transportOptions: {
        server: credentials.websocketServer
      },
      authorizationUsername: credentials.authorizationUsername,
      authorizationPassword: credentials.authorizationPassword,
      displayName: credentials.displayName,
      delegate: {
        onInvite: async (invitation: Invitation) => {
          this.session = invitation;

          const incomingCall: ActiveCall = {
            id: crypto.randomUUID(),
            direction: "inbound",
            remoteNumber: this.extractRemoteNumber(invitation),
            remoteName: this.extractRemoteName(invitation),
            sourceType: this.detectSourceType(this.extractRemoteNumber(invitation)),
            status: "incoming",
            isMuted: false,
            isHeld: false
          };

          this.emit("incomingCall", incomingCall);
          this.bindSession(invitation, incomingCall);
        }
      }
    };

    this.userAgent = new UserAgent(options);
    await this.userAgent.start();

    this.emit("connectionStatus", "connected");
    this.emit("connectionStatus", "registering");

    this.registerer = new Registerer(this.userAgent);
    await this.registerer.register();

    this.emit("connectionStatus", "registered");
  }

  async disconnect() {
    await this.registerer?.unregister();
    await this.userAgent?.stop();
    this.session = null;
    this.emit("connectionStatus", "disconnected");
  }

  async call(destination: string) {
    if (!this.userAgent) throw new Error("UserAgent not connected");

    const target = UserAgent.makeURI(`sip:${destination}`);
    if (!target) throw new Error("Invalid destination");

    const inviter = new Inviter(this.userAgent, target, {
      sessionDescriptionHandlerOptions: {
        constraints: {
          audio: true,
          video: false
        }
      }
    });

    this.session = inviter;

    const outboundCall: ActiveCall = {
      id: crypto.randomUUID(),
      direction: "outbound",
      remoteNumber: destination,
      remoteName: undefined,
      sourceType: this.detectSourceType(destination),
      status: "calling",
      startedAt: Date.now(),
      isMuted: false,
      isHeld: false
    };

    this.bindSession(inviter, outboundCall);
    await inviter.invite();
  }

  async answer() {
    const invitation = this.session as Invitation | null;
    if (!invitation) return;

    await invitation.accept({
      sessionDescriptionHandlerOptions: {
        constraints: {
          audio: true,
          video: false
        }
      }
    });
  }

  async reject() {
    const invitation = this.session as Invitation | null;
    if (!invitation) return;
    await invitation.reject();
    this.session = null;
    this.emit("callEnded", undefined);
  }

  async hangup() {
    if (!this.session) return;

    const state = this.session.state;

    if (state === SessionState.Initial || state === SessionState.Establishing) {
      if ("cancel" in this.session) {
        await (this.session as any).cancel();
      } else if ("reject" in this.session) {
        await (this.session as any).reject();
      }
    } else if (state === SessionState.Established) {
      if ("bye" in this.session) {
        await (this.session as any).bye();
      }
    }

    this.session = null;
    this.emit("callEnded", undefined);
  }

  async mute() {
    const pc = this.getPeerConnection();
    pc?.getSenders().forEach((sender) => {
      if (sender.track?.kind === "audio") sender.track.enabled = false;
    });

    const current = this.buildCurrentCall("connected", true, false);
    this.emit("callUpdated", current);
  }

  async unmute() {
    const pc = this.getPeerConnection();
    pc?.getSenders().forEach((sender) => {
      if (sender.track?.kind === "audio") sender.track.enabled = true;
    });

    const current = this.buildCurrentCall("connected", false, false);
    this.emit("callUpdated", current);
  }

  async hold() {
    if (!this.session) return;
    const current = this.buildCurrentCall("held", false, true);
    this.emit("callUpdated", current);
  }

  async resume() {
    if (!this.session) return;
    const current = this.buildCurrentCall("connected", false, false);
    this.emit("callUpdated", current);
  }

  async transfer(target: string) {
    if (!this.session || !("refer" in this.session)) {
      throw new Error("Transfer not available on current session");
    }

    const current = this.buildCurrentCall("transferring", false, false);
    this.emit("callUpdated", current);
    await (this.session as any).refer(`sip:${target}`);
  }

  async sendDTMF(tone: string) {
    const pc = this.getPeerConnection();
    const audioSender = pc?.getSenders().find((sender) => sender.track?.kind === "audio");

    if (audioSender?.dtmf) {
      audioSender.dtmf.insertDTMF(tone);
    }
  }

  private bindSession(session: Session, baseCall: ActiveCall) {
    session.stateChange.addListener((state) => {
      switch (state) {
        case SessionState.Initial:
          this.emit("callUpdated", { ...baseCall, status: "calling" });
          break;

        case SessionState.Establishing:
          this.emit("callUpdated", {
            ...baseCall,
            status: baseCall.direction === "inbound" ? "ringing" : "ringing"
          });
          break;

        case SessionState.Established:
          this.attachRemoteStream();
          this.emit("callUpdated", {
            ...baseCall,
            status: "connected",
            startedAt: baseCall.startedAt ?? Date.now()
          });
          break;

        case SessionState.Terminated:
          this.session = null;
          this.emit("callEnded", undefined);
          break;
      }
    });
  }

  private attachRemoteStream() {
    const pc = this.getPeerConnection();
    if (!pc || !this.remoteAudioEl) return;

    const mediaStream = new MediaStream();

    pc.getReceivers().forEach((receiver) => {
      if (receiver.track) mediaStream.addTrack(receiver.track);
    });

    this.remoteAudioEl.srcObject = mediaStream;
    this.remoteAudioEl.play().catch(() => undefined);
  }

  private getPeerConnection(): RTCPeerConnection | null {
    const sdh = (this.session as any)?.sessionDescriptionHandler;
    return sdh?.peerConnection || null;
  }

  private extractRemoteNumber(session: Session): string {
    const identity = (session.remoteIdentity as any)?.uri?.user;
    return identity || "unknown";
  }

  private extractRemoteName(session: Session): string | undefined {
    return (session.remoteIdentity as any)?.displayName || undefined;
  }

  private detectSourceType(number: string): CallSourceType {
    if (number === "100") return "doorphone";
    if (number === "101") return "admin";
    if (number === "102") return "laundry";
    return "extension";
  }

  private buildCurrentCall(
    status: ActiveCall["status"],
    isMuted: boolean,
    isHeld: boolean
  ): ActiveCall | null {
    if (!this.session) return null;

    return {
      id: crypto.randomUUID(),
      direction: "outbound",
      remoteNumber: this.extractRemoteNumber(this.session),
      remoteName: this.extractRemoteName(this.session),
      sourceType: this.detectSourceType(this.extractRemoteNumber(this.session)),
      status,
      startedAt: Date.now(),
      isMuted,
      isHeld
    };
  }
}
```

---

# 10. Hook principal do módulo

## `hooks/useSoftphone.ts`

```ts
"use client";

import { useEffect, useMemo, useRef } from "react";
import { SipClient } from "../services/sip/SipClient";
import { getExtensions, getSoftphoneConfig } from "../services/api/softphoneApi";
import { useSoftphoneStore } from "../store/softphoneStore";
import type { ActiveCall } from "../types/softphone";

export function useSoftphone() {
  const clientRef = useRef<SipClient | null>(null);

  const {
    connectionStatus,
    currentCall,
    dialedNumber,
    directory,
    setConnectionStatus,
    setCurrentCall,
    setDirectory,
    setDialedNumber,
    appendDigit,
    clearDialedNumber
  } = useSoftphoneStore();

  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  if (!clientRef.current) {
    clientRef.current = new SipClient();
  }

  const client = useMemo(() => clientRef.current!, []);

  useEffect(() => {
    const handleConnection = (status: string) => {
      setConnectionStatus(status as any);
    };

    const handleIncomingCall = (call: ActiveCall) => {
      setCurrentCall(call);
    };

    const handleCallUpdated = (call: ActiveCall | null) => {
      setCurrentCall(call);
    };

    const handleCallEnded = () => {
      setCurrentCall(null);
      clearDialedNumber();
    };

    client.on("connectionStatus", handleConnection);
    client.on("incomingCall", handleIncomingCall);
    client.on("callUpdated", handleCallUpdated);
    client.on("callEnded", handleCallEnded);

    return () => {
      client.off("connectionStatus", handleConnection);
      client.off("incomingCall", handleIncomingCall);
      client.off("callUpdated", handleCallUpdated);
      client.off("callEnded", handleCallEnded);
    };
  }, [client, setConnectionStatus, setCurrentCall, clearDialedNumber]);

  async function init() {
    const [config, extensions] = await Promise.all([
      getSoftphoneConfig(),
      getExtensions()
    ]);

    setDirectory(extensions);

    if (remoteAudioRef.current) {
      client.attachRemoteAudio(remoteAudioRef.current);
    }

    await client.connect(config);
  }

  return {
    connectionStatus,
    currentCall,
    dialedNumber,
    directory,
    remoteAudioRef,
    init,
    setDialedNumber,
    appendDigit,
    clearDialedNumber,
    call: async (destination?: string) => {
      const number = destination || dialedNumber;
      if (!number) return;
      await client.call(number);
    },
    answer: () => client.answer(),
    reject: () => client.reject(),
    hangup: () => client.hangup(),
    mute: () => client.mute(),
    unmute: () => client.unmute(),
    hold: () => client.hold(),
    resume: () => client.resume(),
    transfer: (target: string) => client.transfer(target),
    sendDTMF: (tone: string) => client.sendDTMF(tone)
  };
}
```

---

# 11. Componentes principais

## `components/StatusBadge.tsx`

```tsx
interface Props {
  status: string;
}

export function StatusBadge({ status }: Props) {
  return (
    <span className="inline-flex rounded-full border px-3 py-1 text-sm">
      SIP: {status}
    </span>
  );
}
```

## `components/PhoneDisplay.tsx`

```tsx
import type { ActiveCall } from "../types/softphone";

interface Props {
  dialedNumber: string;
  currentCall: ActiveCall | null;
}

export function PhoneDisplay({ dialedNumber, currentCall }: Props) {
  const title = currentCall?.remoteName || currentCall?.remoteNumber || dialedNumber || "Softphone";
  const subtitle = currentCall
    ? `${currentCall.status} • ${currentCall.sourceType}`
    : "Pronto para discar";

  return (
    <div className="rounded-2xl border p-4">
      <div className="text-2xl font-semibold">{title}</div>
      <div className="text-sm opacity-70">{subtitle}</div>
    </div>
  );
}
```

## `components/DialPad.tsx`

```tsx
interface Props {
  onDigit: (digit: string) => void;
  onCall: () => void;
}

const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"];

export function DialPad({ onDigit, onCall }: Props) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {DIGITS.map((digit) => (
          <button
            key={digit}
            onClick={() => onDigit(digit)}
            className="rounded-xl border p-4 text-lg"
          >
            {digit}
          </button>
        ))}
      </div>

      <button onClick={onCall} className="w-full rounded-xl border p-3">
        Ligar
      </button>
    </div>
  );
}
```

## `components/CallControls.tsx`

```tsx
import { useState } from "react";
import type { ActiveCall } from "../types/softphone";

interface Props {
  call: ActiveCall | null;
  onAnswer: () => void;
  onReject: () => void;
  onHangup: () => void;
  onMute: () => void;
  onUnmute: () => void;
  onHold: () => void;
  onResume: () => void;
  onTransfer: (target: string) => void;
}

export function CallControls({
  call,
  onAnswer,
  onReject,
  onHangup,
  onMute,
  onUnmute,
  onHold,
  onResume,
  onTransfer
}: Props) {
  const [target, setTarget] = useState("");

  if (!call) return null;

  return (
    <div className="space-y-3 rounded-2xl border p-4">
      {call.status === "incoming" && (
        <div className="flex gap-2">
          <button onClick={onAnswer} className="rounded-xl border px-4 py-2">
            Atender
          </button>
          <button onClick={onReject} className="rounded-xl border px-4 py-2">
            Rejeitar
          </button>
        </div>
      )}

      {(call.status === "connected" || call.status === "held" || call.status === "ringing") && (
        <>
          <div className="flex flex-wrap gap-2">
            <button onClick={onHangup} className="rounded-xl border px-4 py-2">
              Desligar
            </button>

            {!call.isMuted ? (
              <button onClick={onMute} className="rounded-xl border px-4 py-2">
                Mute
              </button>
            ) : (
              <button onClick={onUnmute} className="rounded-xl border px-4 py-2">
                Unmute
              </button>
            )}

            {!call.isHeld ? (
              <button onClick={onHold} className="rounded-xl border px-4 py-2">
                Hold
              </button>
            ) : (
              <button onClick={onResume} className="rounded-xl border px-4 py-2">
                Resume
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <input
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="Ramal para transferir"
              className="flex-1 rounded-xl border px-3 py-2"
            />
            <button
              onClick={() => onTransfer(target)}
              className="rounded-xl border px-4 py-2"
            >
              Transferir
            </button>
          </div>
        </>
      )}
    </div>
  );
}
```

## `components/ExtensionDirectory.tsx`

```tsx
"use client";

import { useMemo, useState } from "react";
import type { SoftphoneDirectoryEntry } from "../types/softphone";

interface Props {
  items: SoftphoneDirectoryEntry[];
  onCall: (extension: string) => void;
}

export function ExtensionDirectory({ items, onCall }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return items.filter((item) =>
      [item.name, item.extension, item.apartment || ""].join(" ").toLowerCase().includes(q)
    );
  }, [items, query]);

  return (
    <div className="rounded-2xl border p-4 space-y-3">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar ramal"
        className="w-full rounded-xl border px-3 py-2"
      />

      <div className="space-y-2">
        {filtered.map((item) => (
          <button
            key={item.id}
            onClick={() => onCall(item.extension)}
            className="flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left"
          >
            <div>
              <div className="font-medium">{item.name}</div>
              <div className="text-sm opacity-70">
                Ramal {item.extension} {item.apartment ? `• Apto ${item.apartment}` : ""}
              </div>
            </div>
            <span className="text-sm">{item.online ? "online" : "offline"}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
```

## `components/QuickActions.tsx`

```tsx
interface Props {
  onCall: (extension: string) => void;
}

export function QuickActions({ onCall }: Props) {
  return (
    <div className="rounded-2xl border p-4">
      <div className="mb-3 font-semibold">Ações rápidas</div>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => onCall("100")} className="rounded-xl border p-3">
          Portaria
        </button>
        <button onClick={() => onCall("101")} className="rounded-xl border p-3">
          Administração
        </button>
        <button onClick={() => onCall("102")} className="rounded-xl border p-3">
          Lavanderia
        </button>
        <button onClick={() => onCall("103")} className="rounded-xl border p-3">
          Encomendas
        </button>
      </div>
    </div>
  );
}
```

---

# 12. Shell principal

## `components/SoftphoneShell.tsx`

```tsx
"use client";

import { useEffect } from "react";
import { CallControls } from "./CallControls";
import { DialPad } from "./DialPad";
import { ExtensionDirectory } from "./ExtensionDirectory";
import { PhoneDisplay } from "./PhoneDisplay";
import { QuickActions } from "./QuickActions";
import { StatusBadge } from "./StatusBadge";
import { useSoftphone } from "../hooks/useSoftphone";

export function SoftphoneShell() {
  const {
    connectionStatus,
    currentCall,
    dialedNumber,
    directory,
    remoteAudioRef,
    init,
    appendDigit,
    call,
    answer,
    reject,
    hangup,
    mute,
    unmute,
    hold,
    resume,
    transfer
  } = useSoftphone();

  useEffect(() => {
    init().catch(console.error);
  }, [init]);

  return (
    <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
      <audio ref={remoteAudioRef} autoPlay playsInline />

      <div className="space-y-4">
        <StatusBadge status={connectionStatus} />
        <PhoneDisplay dialedNumber={dialedNumber} currentCall={currentCall} />
        <DialPad onDigit={appendDigit} onCall={() => call()} />
        <CallControls
          call={currentCall}
          onAnswer={answer}
          onReject={reject}
          onHangup={hangup}
          onMute={mute}
          onUnmute={unmute}
          onHold={hold}
          onResume={resume}
          onTransfer={transfer}
        />
      </div>

      <div className="space-y-4">
        <QuickActions onCall={call} />
        <ExtensionDirectory items={directory} onCall={call} />
      </div>
    </div>
  );
}
```

## `app/dashboard/phone/page.tsx`

```tsx
import { SoftphoneShell } from "@/modules/softphone/components/SoftphoneShell";

export default function PhonePage() {
  return (
    <main className="p-6">
      <SoftphoneShell />
    </main>
  );
}
```

---

# 13. Integração com porteiro eletrônico

Aqui vale separar em 3 possibilidades.

## Modelo A — porteiro como ramal SIP

É o melhor cenário.

* porteiro registra como um endpoint SIP
* ele chama um ramal ou grupo
* o softphone recebe como chamada normal
* no frontend você traduz o número para “Portaria”

Exemplo:

* ramal 100 = porteiro principal
* ramal 104 = portão de serviço

## Modelo B — porteiro chama fila ou ring group

Útil se vários responsáveis puderem atender.

* porteiro chama grupo 600
* Asterisk toca nos navegadores autorizados
* o primeiro que atende assume

## Modelo C — porteiro chama um IVR interno

Útil se você quiser automação:

* “pressione 1 para falar”
* “pressione 9 para abrir o portão”
* DTMF pode entrar aqui, e o SIP.js suporta envio de DTMF. ([sipjs.com][1])

### Recomendação prática

Para a sua propriedade, eu faria:

* `100` → portaria principal
* `101` → administração
* `102` → lavanderia
* `103` → recebimento/encomendas
* `2xx` → moradores
* `3xx` → staff interno
* `6xx` → grupos/filas

---

# 14. Requisitos do PBX para esta fase funcionar

No Asterisk, a própria documentação de WebRTC aponta a necessidade de:

* HTTPS/TLS no servidor embutido
* transporte PJSIP via WebSocket
* endpoint/AOR/auth para cliente WebRTC ([docs.asterisk.org][2])

No FreePBX/Sangoma, os ports mais relevantes para esse caso são:

* `8089/TCP` para WebRTC criptografado
* `8088/TCP` para WebRTC sem criptografia, menos indicado ([sangomakb.atlassian.net][3])

Então, para esta fase 2, o seu checklist técnico mínimo fica:

* certificado TLS válido no PBX
* WSS habilitado
* ramais PJSIP preparados para WebRTC
* DNS interno resolvendo o host do PBX
* navegador com permissão de microfone
* rede entre app e PBX estável
* regra de firewall para 8089/TCP e RTP conforme topologia

Se houver NAT entre cliente e PBX, a documentação do Asterisk também orienta cuidado específico em `res_pjsip` para NAT. ([docs.asterisk.org][4])

---

# 15. O que ainda está “bom o bastante para MVP” e o que precisa evoluir

## Bom para MVP

* um único call ativo por navegador
* diretório simples
* transferência básica
* DTMF simples
* mapeamento fixo do porteiro por ramal

## Evoluir depois

* múltiplas chamadas
* attended transfer completo
* presença real de ramais
* gravação de chamadas
* integração com ARI para eventos mais avançados
* fila de atendimento para portaria
* logs centralizados no sistema interno

---

# 16. Minha recomendação para o passo seguinte

Agora o melhor próximo bloco é fechar a **fase 3** com foco em PBX e implantação real:

* configuração objetiva no **FreePBX/Asterisk**
* desenho dos **ramais e numeração**
* checklist de **WSS/TLS/WebRTC**
* mapeamento do **porteiro**
* fluxo final de integração com o seu sistema Next.js

No próximo passo eu monto isso já como um pacote técnico:
**“Asterisk/FreePBX para WebRTC + plano de ramais + checklist completo de implantação do softphone”**.

[1]: https://sipjs.com/?utm_source=chatgpt.com "SIP.js: SIP Signaling JavaScript Library for WebRTC Developers"
[2]: https://docs.asterisk.org/Configuration/WebRTC/Configuring-Asterisk-for-WebRTC-Clients/?utm_source=chatgpt.com "Configuring Asterisk for WebRTC Clients"
[3]: https://sangomakb.atlassian.net/wiki/spaces/PP/pages/14057601/Ports%2Bused%2Bon%2Byour%2BPBX?utm_source=chatgpt.com "PBX Platforms - Sangoma Documentation"
[4]: https://docs.asterisk.org/Configuration/Channel-Drivers/SIP/Configuring-res_pjsip/Configuring-res_pjsip-to-work-through-NAT/?utm_source=chatgpt.com "Configuring res_pjsip to work through NAT"
