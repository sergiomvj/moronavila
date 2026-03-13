# Softphone: variaveis de ambiente

Estas variaveis foram adicionadas para permitir que o softphone fique preparado antes da instalacao do PBX.

## Variaveis

`VITE_SOFTPHONE_ENABLED`
- Liga ou desliga o shell do softphone no app.

`VITE_SOFTPHONE_AUTO_CONNECT`
- Quando `true`, o shell abre automaticamente apos o login do morador.

`VITE_SOFTPHONE_REQUIRE_INTERNET_ACTIVE`
- Quando `true`, o softphone automatico so fica ativo para moradores com `internet_active = true`.

`VITE_SOFTPHONE_PBX_HOST`
- Host do PBX que sera exibido no shell e usado na futura integracao.

`VITE_SOFTPHONE_PBX_DOMAIN`
- Dominio SIP/WSS do PBX.

`VITE_SOFTPHONE_PBX_WSS_URL`
- URL WSS do transporte WebRTC/SIP.

`VITE_SOFTPHONE_DEFAULT_DISPLAY_NAME`
- Nome padrao exibido no shell do softphone.

`VITE_SOFTPHONE_TRANSPORT`
- Define o transporte usado pelo shell.
- `mock`: fluxo local para desenvolvimento e preparo do produto.
- `sipjs`: reservado para a fase em que o PBX estiver pronto e a dependencia for instalada.

`SOFTPHONE_PBX_DEFAULT_SECRET`
- Variavel apenas do backend local.
- Usada para entregar a senha SIP inicial ao navegador durante a fase de provisionamento simples.
- Troque esse valor quando o PBX estiver pronto.

`VITE_SOFTPHONE_PORTARIA_EXTENSION`
- Ramal da portaria/interfone principal.

`VITE_SOFTPHONE_ADMIN_EXTENSION`
- Ramal da administracao.

`VITE_SOFTPHONE_LAUNDRY_EXTENSION`
- Ramal da lavanderia.

`VITE_SOFTPHONE_DELIVERY_EXTENSION`
- Ramal de encomendas/recebimento.

## Comportamento atual

- O shell do softphone agora aparece para moradores autenticados no app.
- Se o PBX ainda nao estiver provisionado, a interface entra em modo `Aguardando PBX`.
- Quando as variaveis do PBX forem preenchidas, a aplicacao ja passa a refletir o estado `Pronto` e `Ativo` no fluxo local.
- A proxima fase e conectar esse shell a uma implementacao SIP/WebRTC real.
