import type {
  SoftphoneRuntimeState,
  SoftphoneSession,
  SoftphoneTransport,
} from '../types';

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export class MockSoftphoneTransport implements SoftphoneTransport {
  async connect(session: SoftphoneSession): Promise<Partial<SoftphoneRuntimeState>> {
    await wait(450);
    return {
      connectionStatus: 'active',
      callStatus: 'idle',
      activeExtension: session.extension,
      message: `Shell do softphone ativo para ${session.displayName}. Transporte em modo mock ate o PBX entrar.`,
    };
  }

  async disconnect(): Promise<void> {
    return;
  }

  async dial(extension: string): Promise<Partial<SoftphoneRuntimeState>> {
    await wait(200);
    return {
      callStatus: 'dialing',
      lastDialed: extension,
      message: `Discagem preparada para ${extension}. O fluxo real sera conectado ao SIP/WebRTC na proxima fase.`,
    };
  }
}
