import {
  Inviter,
  Registerer,
  SessionState,
  UserAgent,
  type Session,
} from 'sip.js';
import type { SoftphoneRuntimeState, SoftphoneSession, SoftphoneTransport } from '../types';

export class SipJsSoftphoneTransport implements SoftphoneTransport {
  private userAgent: UserAgent | null = null;
  private registerer: Registerer | null = null;
  private currentSession: Session | null = null;
  private domain = '';

  async connect(session: SoftphoneSession): Promise<Partial<SoftphoneRuntimeState>> {
    if (!session.sip) {
      throw new Error(
        'Credenciais SIP indisponiveis. Preencha SOFTPHONE_PBX_DEFAULT_SECRET e os dados do PBX no backend local.'
      );
    }

    const { sip } = session;
    const uri = UserAgent.makeURI(sip.uri);
    if (!uri) {
      throw new Error('URI SIP invalida para o softphone.');
    }

    this.domain = sip.domain;
    this.userAgent = new UserAgent({
      uri,
      transportOptions: {
        server: sip.websocketServer,
      },
      authorizationUsername: sip.authorizationUsername,
      authorizationPassword: sip.authorizationPassword,
      displayName: session.displayName,
      delegate: {
        onInvite: (incomingSession) => {
          this.currentSession = incomingSession;
        },
      },
    });

    await this.userAgent.start();

    this.registerer = new Registerer(this.userAgent);
    await this.registerer.register();

    return {
      connectionStatus: 'active',
      callStatus: 'idle',
      activeExtension: session.extension,
      message: `Registrado no PBX ${sip.domain} com o ramal ${session.extension || sip.authorizationUsername}.`,
    };
  }

  async disconnect(): Promise<void> {
    try {
      await this.registerer?.unregister();
      await this.userAgent?.stop();
    } finally {
      this.currentSession = null;
      this.registerer = null;
      this.userAgent = null;
    }
  }

  async dial(extension: string): Promise<Partial<SoftphoneRuntimeState>> {
    if (!this.userAgent || !this.domain) {
      throw new Error('Softphone SIP ainda nao conectado.');
    }

    const target = UserAgent.makeURI(`sip:${extension}@${this.domain}`);
    if (!target) {
      throw new Error(`Destino SIP invalido: ${extension}`);
    }

    const inviter = new Inviter(this.userAgent, target, {
      sessionDescriptionHandlerOptions: {
        constraints: {
          audio: true,
          video: false,
        },
      },
    });

    this.currentSession = inviter;

    inviter.stateChange.addListener((state) => {
      if (state === SessionState.Terminated) {
        this.currentSession = null;
      }
    });

    await inviter.invite();

    return {
      callStatus: 'dialing',
      lastDialed: extension,
      message: `INVITE enviado para o ramal ${extension}.`,
    };
  }
}
