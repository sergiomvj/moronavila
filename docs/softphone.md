1. Arquitetura técnica do softphone
Visão em camadas

Camada 1 — Frontend do sistema interno

Next.js + TypeScript

módulo softphone

React components para teclado, lista de ramais, painel de chamada e status

estado local/global do telefone

Camada 2 — Serviço SIP/WebRTC

abstração TypeScript em torno do SIP.js

registro do usuário SIP

controle de sessão: iniciar, atender, encerrar, mutar, hold, transferir, DTMF

eventos para UI: registered, ringing, connected, held, failed, ended

Camada 3 — Backend de apoio do seu app

API do sistema interno para:

buscar ramal do usuário logado

listar ramais internos

mapear apartamentos / moradores / setores / porteiro

permissões de chamada

logs de uso, se desejarem

esse backend não transporta áudio

ele apenas entrega configuração, diretório e integrações de negócio

Camada 4 — Telefonia

FreePBX/Asterisk com PJSIP

transporte WSS para navegador

TLS/HTTPS habilitado

endpoints WebRTC

dialplan para chamadas internas, transferência e integração com porteiro

Fluxo lógico

usuário entra no sistema interno

módulo softphone carrega as credenciais ou token de sessão SIP

browser abre conexão WSS com Asterisk

SIP REGISTER autentica o ramal

usuário disca um número interno

SIP INVITE abre a sessão

WebRTC negocia áudio

Asterisk roteia para outro ramal, grupo ou porteiro

UI acompanha os estados da chamada

Modelo recomendado de integração

Eu recomendo não expor a senha SIP fixa no frontend se vocês puderem evitar. O ideal é:

usuário autentica no app

backend valida o usuário

backend entrega configuração SIP daquele usuário

em fase inicial, pode entregar usuário/senha SIP

em fase madura, pode evoluir para:

credenciais rotativas

provisioning por sessão

endpoint WebRTC dedicado por morador/colaborador

Para começar rápido, dá para usar credenciais SIP por usuário com escopo bem controlado na LAN/VPN e firewall fechado.

2. Fluxo SIP/WebRTC
Registro do ramal

Browser
→ abre wss://pbx.seudominio.local:8089/ws
→ envia REGISTER

Asterisk
→ desafia com autenticação SIP digest
→ browser responde
→ ramal fica registrado

O Asterisk documenta que, para WebRTC, você normalmente precisa do servidor HTTPS/TLS e de um transporte PJSIP em WebSocket.

Chamada de saída

usuário digita 203

softphone cria INVITE sip:203@pbx

Asterisk consulta o dialplan

Asterisk toca no ramal 203

quando o destino atende, a sessão passa para established

fluxo de áudio segue por WebRTC

Chamada de entrada

Asterisk recebe chamada para o ramal do usuário

envia INVITE via WSS ao navegador registrado

UI mostra chamada recebida

usuário atende

navegador envia 200 OK

mídia é estabelecida

Hold

Normalmente é feito por reinvite/update de sessão SDP com mídia em hold. Bibliotecas como SIP.js suportam hold.

Transfer

Há dois cenários:

blind transfer: transfere direto

attended transfer: consulta antes e transfere depois

SIP.js declara suporte a transferências, o que ajuda bastante para esse módulo.

DTMF

Pode ser enviado como:

RFC 2833 / RTP events

SIP INFO

O SIP.js suporta DTMF, então a UI pode ter keypad em chamada.

3. Estrutura Next.js sugerida

Eu organizaria assim:

src/
  app/
    dashboard/
      phone/
        page.tsx
        loading.tsx
  modules/
    softphone/
      components/
        SoftphonePanel.tsx
        DialPad.tsx
        CallControls.tsx
        IncomingCallModal.tsx
        ExtensionList.tsx
        CallStatus.tsx
      hooks/
        useSoftphone.ts
        useExtensions.ts
      services/
        sip/
          SipClient.ts
          types.ts
          events.ts
          config.ts
      store/
        softphoneStore.ts
      utils/
        formatExtension.ts
        normalizeNumber.ts
      types/
        index.ts
  lib/
    api/
      softphone.ts
  server/
    softphone/
      getSoftphoneConfig.ts
      getExtensions.ts
Separação de responsabilidades

components/: UI pura

hooks/: lógica de orquestração da tela

services/sip/: integração real com SIP.js

store/: estado do telefone

server/: busca config e lista de ramais

lib/api/: chamadas HTTP do frontend para o backend do seu sistema

4. Código base funcional

Abaixo vai um esqueleto funcional para começar.

services/sip/types.ts
export type SoftphoneConnectionStatus =
  | "idle"
  | "connecting"
  | "registered"
  | "disconnected"
  | "error";

export type CallStatus =
  | "idle"
  | "calling"
  | "ringing"
  | "incoming"
  | "connected"
  | "held"
  | "ended"
  | "failed";

export interface SipCredentials {
  uri: string;              // ex: sip:201@pbx.local
  authorizationUsername: string;
  authorizationPassword: string;
  displayName?: string;
  websocketServer: string;  // ex: wss://pbx.local:8089/ws
}

export interface MakeCallOptions {
  destination: string; // ex: 202
}

export interface TransferOptions {
  target: string; // ex: 203
}
services/sip/SipClient.ts
"use client";

import {
  Inviter,
  Registerer,
  SessionState,
  UserAgent,
  UserAgentOptions
} from "sip.js";
import type {
  CallStatus,
  MakeCallOptions,
  SipCredentials,
  SoftphoneConnectionStatus,
  TransferOptions
} from "./types";

type Listener = (payload?: unknown) => void;

export class SipClient {
  private userAgent: UserAgent | null = null;
  private registerer: Registerer | null = null;
  private currentSession: Inviter | any = null;
  private listeners = new Map<string, Listener[]>();

  public connectionStatus: SoftphoneConnectionStatus = "idle";
  public callStatus: CallStatus = "idle";

  on(event: string, listener: Listener) {
    const arr = this.listeners.get(event) || [];
    arr.push(listener);
    this.listeners.set(event, arr);
  }

  off(event: string, listener: Listener) {
    const arr = this.listeners.get(event) || [];
    this.listeners.set(
      event,
      arr.filter((l) => l !== listener)
    );
  }

  private emit(event: string, payload?: unknown) {
    const arr = this.listeners.get(event) || [];
    arr.forEach((listener) => listener(payload));
  }

  async connect(credentials: SipCredentials) {
    this.connectionStatus = "connecting";
    this.emit("connectionStatus", this.connectionStatus);

    const options: UserAgentOptions = {
      uri: UserAgent.makeURI(credentials.uri),
      transportOptions: {
        server: credentials.websocketServer
      },
      authorizationUsername: credentials.authorizationUsername,
      authorizationPassword: credentials.authorizationPassword,
      displayName: credentials.displayName,
      delegate: {
        onInvite: async (invitation) => {
          this.currentSession = invitation;
          this.callStatus = "incoming";
          this.emit("callStatus", this.callStatus);
          this.emit("incomingCall", invitation);

          invitation.stateChange.addListener((state) => {
            switch (state) {
              case SessionState.Establishing:
                this.callStatus = "ringing";
                break;
              case SessionState.Established:
                this.callStatus = "connected";
                break;
              case SessionState.Terminated:
                this.callStatus = "ended";
                this.currentSession = null;
                break;
              default:
                break;
            }
            this.emit("callStatus", this.callStatus);
          });
        }
      }
    };

    this.userAgent = new UserAgent(options);
    await this.userAgent.start();

    this.registerer = new Registerer(this.userAgent);
    await this.registerer.register();

    this.connectionStatus = "registered";
    this.emit("connectionStatus", this.connectionStatus);
  }

  async disconnect() {
    try {
      await this.registerer?.unregister();
      await this.userAgent?.stop();
    } finally {
      this.connectionStatus = "disconnected";
      this.callStatus = "idle";
      this.currentSession = null;
      this.emit("connectionStatus", this.connectionStatus);
      this.emit("callStatus", this.callStatus);
    }
  }

  async makeCall({ destination }: MakeCallOptions) {
    if (!this.userAgent) throw new Error("SIP user agent not connected");

    const target = UserAgent.makeURI(`sip:${destination}`);
    if (!target) throw new Error("Invalid SIP destination");

    const inviter = new Inviter(this.userAgent, target, {
      sessionDescriptionHandlerOptions: {
        constraints: {
          audio: true,
          video: false
        }
      }
    });

    this.currentSession = inviter;
    this.callStatus = "calling";
    this.emit("callStatus", this.callStatus);

    inviter.stateChange.addListener((state) => {
      switch (state) {
        case SessionState.Initial:
          break;
        case SessionState.Establishing:
          this.callStatus = "ringing";
          break;
        case SessionState.Established:
          this.callStatus = "connected";
          break;
        case SessionState.Terminated:
          this.callStatus = "ended";
          this.currentSession = null;
          break;
        default:
          break;
      }
      this.emit("callStatus", this.callStatus);
    });

    await inviter.invite();
  }

  async answer() {
    if (!this.currentSession) return;
    await this.currentSession.accept({
      sessionDescriptionHandlerOptions: {
        constraints: {
          audio: true,
          video: false
        }
      }
    });
  }

  async hangup() {
    if (!this.currentSession) return;

    const state = this.currentSession.state;
    if (state === SessionState.Initial || state === SessionState.Establishing) {
      await this.currentSession.cancel?.();
    } else if (state === SessionState.Established) {
      await this.currentSession.bye?.();
    } else {
      await this.currentSession.dispose?.();
    }

    this.callStatus = "ended";
    this.currentSession = null;
    this.emit("callStatus", this.callStatus);
  }

  async mute() {
    const pc = this.getPeerConnection();
    pc?.getSenders().forEach((sender) => {
      if (sender.track?.kind === "audio") {
        sender.track.enabled = false;
      }
    });
  }

  async unmute() {
    const pc = this.getPeerConnection();
    pc?.getSenders().forEach((sender) => {
      if (sender.track?.kind === "audio") {
        sender.track.enabled = true;
      }
    });
  }

  async sendDTMF(tone: string) {
    const pc = this.getPeerConnection();
    const sender = pc?.getSenders().find((s) => s.track?.kind === "audio");
    if (sender?.dtmf) {
      sender.dtmf.insertDTMF(tone);
    }
  }

  async hold() {
    if (!this.currentSession?.invite) return;
    await this.currentSession.invite({
      requestDelegate: {},
      sessionDescriptionHandlerModifiers: []
    });
    this.callStatus = "held";
    this.emit("callStatus", this.callStatus);
  }

  async transfer({ target }: TransferOptions) {
    if (!this.currentSession?.refer) {
      throw new Error("Current session does not support transfer");
    }
    await this.currentSession.refer(`sip:${target}`);
  }

  private getPeerConnection(): RTCPeerConnection | null {
    const sdh = this.currentSession?.sessionDescriptionHandler;
    return sdh?.peerConnection || null;
  }
}
hooks/useSoftphone.ts
"use client";

import { useEffect, useMemo, useState } from "react";
import { SipClient } from "../services/sip/SipClient";
import type { CallStatus, SoftphoneConnectionStatus, SipCredentials } from "../services/sip/types";

export function useSoftphone(credentials?: SipCredentials) {
  const client = useMemo(() => new SipClient(), []);
  const [connectionStatus, setConnectionStatus] =
    useState<SoftphoneConnectionStatus>("idle");
  const [callStatus, setCallStatus] = useState<CallStatus>("idle");

  useEffect(() => {
    const onConn = (value?: unknown) => setConnectionStatus(value as SoftphoneConnectionStatus);
    const onCall = (value?: unknown) => setCallStatus(value as CallStatus);

    client.on("connectionStatus", onConn);
    client.on("callStatus", onCall);

    return () => {
      client.off("connectionStatus", onConn);
      client.off("callStatus", onCall);
      client.disconnect().catch(() => undefined);
    };
  }, [client]);

  const connect = async () => {
    if (!credentials) throw new Error("Missing SIP credentials");
    await client.connect(credentials);
  };

  return {
    client,
    connectionStatus,
    callStatus,
    connect,
    disconnect: () => client.disconnect(),
    makeCall: (destination: string) => client.makeCall({ destination }),
    answer: () => client.answer(),
    hangup: () => client.hangup(),
    mute: () => client.mute(),
    unmute: () => client.unmute(),
    hold: () => client.hold(),
    transfer: (target: string) => client.transfer({ target }),
    sendDTMF: (tone: string) => client.sendDTMF(tone)
  };
}
components/SoftphonePanel.tsx
"use client";

import { useEffect, useState } from "react";
import { useSoftphone } from "../hooks/useSoftphone";
import type { SipCredentials } from "../services/sip/types";

interface Props {
  credentials: SipCredentials;
}

export function SoftphonePanel({ credentials }: Props) {
  const {
    connectionStatus,
    callStatus,
    connect,
    makeCall,
    answer,
    hangup,
    mute,
    unmute,
    hold,
    transfer,
    sendDTMF
  } = useSoftphone(credentials);

  const [number, setNumber] = useState("");
  const [transferTo, setTransferTo] = useState("");

  useEffect(() => {
    connect().catch(console.error);
  }, [connect]);

  return (
    <div className="rounded-2xl border p-4 space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Softphone</h2>
        <p>Status SIP: {connectionStatus}</p>
        <p>Status Chamada: {callStatus}</p>
      </div>

      <div className="space-y-2">
        <input
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder="Digite o ramal"
          className="w-full rounded border px-3 py-2"
        />
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => makeCall(number)} className="rounded border px-3 py-2">
            Ligar
          </button>
          <button onClick={answer} className="rounded border px-3 py-2">
            Atender
          </button>
          <button onClick={hangup} className="rounded border px-3 py-2">
            Desligar
          </button>
          <button onClick={mute} className="rounded border px-3 py-2">
            Mute
          </button>
          <button onClick={unmute} className="rounded border px-3 py-2">
            Unmute
          </button>
          <button onClick={hold} className="rounded border px-3 py-2">
            Hold
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <input
          value={transferTo}
          onChange={(e) => setTransferTo(e.target.value)}
          placeholder="Transferir para ramal"
          className="w-full rounded border px-3 py-2"
        />
        <button onClick={() => transfer(transferTo)} className="rounded border px-3 py-2">
          Transferir
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["1","2","3","4","5","6","7","8","9","*","0","#"].map((tone) => (
          <button
            key={tone}
            onClick={() => sendDTMF(tone)}
            className="rounded border px-3 py-2 min-w-12"
          >
            {tone}
          </button>
        ))}
      </div>
    </div>
  );
}
app/dashboard/phone/page.tsx
import { SoftphonePanel } from "@/modules/softphone/components/SoftphonePanel";

export default async function PhonePage() {
  const credentials = {
    uri: "sip:201@pbx.seudominio.local",
    authorizationUsername: "201",
    authorizationPassword: "SUA_SENHA_AQUI",
    displayName: "Ramal 201",
    websocketServer: "wss://pbx.seudominio.local:8089/ws"
  };

  return (
    <main className="p-6">
      <SoftphonePanel credentials={credentials} />
    </main>
  );
}
5. Como eu desenharia o fluxo do sistema
Fluxo A — usuário comum

login no sistema

backend retorna:

número do ramal

senha SIP

websocket server

nome de exibição

softphone conecta automaticamente

lista de ramais carregada do cadastro interno

usuário clica em “Lavanderia”, “Administração”, “Portaria” ou ramal direto

chamada é iniciada

Fluxo B — chamada do porteiro eletrônico

porteiro SIP chama um grupo ou ramal virtual

Asterisk toca no navegador do responsável

UI mostra:

“Porteiro eletrônico”

bloco/casa/quarto

ações rápidas

usuário atende

DTMF pode acionar abertura, menu ou confirmação, dependendo do porteiro

Fluxo C — transferência

chamada entra pela administração

atendente fala com residente

transfere para ramal do quarto/casa

ou transfere para porteiro/recebimento/encomendas

6. Requisitos no Asterisk / FreePBX

Para WebRTC com navegador, o Asterisk precisa de alguns elementos fundamentais:

servidor HTTPS/TLS

WebSocket seguro

transporte PJSIP WSS

endpoint configurado como WebRTC

codecs compatíveis

certificados válidos

A documentação oficial do Asterisk para WebRTC deixa claro que a configuração passa por HTTPS/TLS e transporte PJSIP WebSocket.

Itens principais

No Asterisk/FreePBX:

res_http_websocket carregado

PJSIP habilitado

transporte WSS criado

ramais PJSIP compatíveis com WebRTC

ICE, AVPF, RTCP mux e DTLS-SRTP ajustados conforme o perfil WebRTC

porta HTTPS/WSS acessível internamente

certificado confiável pelo navegador

Observação importante

Navegador moderno costuma exigir contexto seguro para mídia e identidade de dispositivo. Em prática, isso empurra vocês para HTTPS/WSS com certificado correto, não uma gambiarra em HTTP. Isso aparece tanto na abordagem oficial do Asterisk quanto no comportamento atual dos browsers.

7. Checklist inicial de configuração
Next.js

 criar módulo softphone

 instalar sip.js

 criar serviço SipClient

 criar UI mínima

 criar endpoint backend para carregar config SIP do usuário

 criar endpoint backend para diretório de ramais

FreePBX / Asterisk

 habilitar HTTPS no Asterisk

 configurar certificado válido

 habilitar WebSocket seguro

 criar transporte PJSIP WSS

 criar ramais WebRTC

 validar codec de áudio

 testar REGISTER

 testar chamada entre dois navegadores

 testar hold, transfer e DTMF

 testar chamada do porteiro

Rede

 DNS interno resolvendo o host da PBX

 firewall liberando HTTPS/WSS e RTP conforme necessidade

 NAT e roteamento consistentes entre VMs

 QoS opcional para voz

8. Recomendação prática de arquitetura para o seu caso

Para a sua propriedade, eu seguiria assim:

Proxmox

VM 1: pfSense

VM 2: FreePBX/Asterisk

VPS pública estável

sistema Next.js dos residentes

Integração

o sistema Next.js chama APIs próprias

o navegador do residente registra diretamente no Asterisk por WSS

Diretório interno

mantido no seu app

Porteiro

integrado como ramal SIP ou tronco/dispositivo SIP interno

Isso separa bem:

app de negócios na VPS pública

telefonia local na infraestrutura da propriedade

frontend consumindo ambos de forma organizada