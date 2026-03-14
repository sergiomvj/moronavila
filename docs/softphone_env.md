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

`VITE_SOFTPHONE_DOOR_MODE`
- Define como a abertura de porta sera integrada.
- `none`: apenas placeholder no app.
- `dtmf`: prepara o fluxo para enviar tons DTMF.
- `http-relay`: prepara o fluxo para chamar um controlador HTTP.
- `extension`: reserva o uso de um ramal dedicado do PBX.

`VITE_SOFTPHONE_DOOR_LABEL`
- Rotulo exibido no botao de porta do softphone.

`VITE_SOFTPHONE_DOOR_DTMF`
- Digito DTMF esperado quando o modo de porta for `dtmf`.

`SOFTPHONE_DOOR_RELAY_URL`
- URL do relay/controlador de acesso quando o modo for `http-relay`.

## Comportamento atual

- O shell do softphone agora aparece para moradores autenticados no app.
- Se o PBX ainda nao estiver provisionado, a interface entra em modo `Aguardando PBX`.
- Quando as variaveis do PBX forem preenchidas, a aplicacao ja passa a refletir o estado `Pronto` e `Ativo` no fluxo local.
- O dock tenta se reidratar automaticamente quando a aba volta a ficar visivel ou quando a conexao do navegador retorna.
- A proxima fase e conectar esse shell a uma implementacao SIP/WebRTC real.

## Diagnostico rapido

`npm run softphone:doctor`
- Faz uma checagem local das variaveis do softphone.

`GET /api/softphone/health`
- Endpoint do `mac-server` para verificar se o backend local esta pronto para tentar o registro SIP.

`GET /api/softphone/rollout`
- Endpoint do `mac-server` com resumo consolidado dos moradores prontos, bloqueados e pendentes para o softphone.

`POST /api/softphone/door/open`
- Endpoint placeholder para abertura de porta. Ja responde o modo configurado e a mensagem operacional antes da integracao real.

## Onde acompanhar no produto

O projeto ja tem uma trilha operacional visivel para residentes e administradores, mesmo antes do PBX existir:

- Dashboard: card de rollout com totais, bloqueios, modo de porta e indicacao se os numeros vieram do backend consolidado ou de fallback local
- Internet (admin): painel tecnico com `health`, diagnostico da porta, botao de teste administrativo da porta, fila consolidada de rollout, filtros e exportacao CSV
- Internet (morador): checklist individual do softphone com proximos passos quando houver pendencias
- Moradores: filtros operacionais por status do softphone e badges como `Pronto`, `Sem ramal`, `Internet inativa`, `Sem MAC principal` e `Desativado`
- Perfil do morador: checklist de prontidao e orientacoes de ajuste no proprio modal

## Checklist de rollout dos moradores

Antes de ativar o PBX em producao, vale deixar cada morador com o cadastro minimamente pronto:

1. `softphone_enabled = true`
2. `softphone_extension` preenchido
3. `internet_active = true`
4. `mac_address` principal cadastrado, se a rede continuar exigindo autorizacao por MAC
5. `softphone_display_name` com um nome facil para a portaria reconhecer

No produto, isso ja pode ser acompanhado por tres pontos:

- Dashboard: card de rollout do softphone com totais e bloqueios principais
- Internet: painel tecnico do softphone + fila de rollout com filtros e exportacao CSV
- Moradores: filtro por status de softphone e badge operacional por residente
- Perfil do morador: checklist de prontidao e proximos passos dentro do modal de perfil

Um morador e considerado pronto para rollout quando:

- o softphone estiver habilitado
- existir ramal definido
- a internet estiver ativa
- o MAC principal estiver cadastrado, quando a rede depender de autenticacao por MAC

## Porta / interfone

O fluxo de abertura de porta ja esta preparado no app e no backend local, mesmo antes da integracao real:

- Dock do morador: botao configuravel de porta e exibicao do modo atual
- Internet (admin): diagnostico do modo de porta e botao de teste administrativo
- Backend local: `POST /api/softphone/door/open` responde o modo configurado e a mensagem operacional

O teste administrativo de porta e util para validar rapidamente se o ambiente esta parametrizado do jeito esperado, antes de existir um relay ou uma acao SIP real. Hoje ele serve como cheque operacional do modo configurado e da mensagem devolvida pelo backend local.

Modos previstos:

- `none`: placeholder, sem abertura real
- `dtmf`: preparo para envio de tons DTMF pelo transporte SIP
- `http-relay`: preparo para acionar um controlador HTTP
- `extension`: preparo para usar um fluxo ou ramal dedicado no PBX

## Fluxo recomendado quando o PBX estiver instalado

1. Preencher no `.env.local`:
   `VITE_SOFTPHONE_ENABLED=true`
   `VITE_SOFTPHONE_TRANSPORT=sipjs`
   `VITE_SOFTPHONE_PBX_HOST=...`
   `VITE_SOFTPHONE_PBX_DOMAIN=...`
   `VITE_SOFTPHONE_PBX_WSS_URL=...`
   `SOFTPHONE_PBX_DEFAULT_SECRET=...`
2. Rodar `npm run softphone:doctor`
3. Reiniciar `npm run mac-app`
4. Conferir `http://localhost:4000/api/softphone/health`
5. Entrar no app como morador e validar o shell do softphone
6. No shell do softphone, usar `Testar microfone` antes da primeira chamada real
7. Confirmar no shell que `Contexto seguro`, `MediaDevices` e `WebRTC` aparecem como compativeis
8. Se a aba perder foco ou o navegador ficar offline, confirmar que o dock retoma a sincronizacao automaticamente quando a sessao volta a ficar visivel e online
9. Na aba Internet, conferir se o painel tecnico mostra a porta como configurada e executar o teste administrativo
10. No Dashboard, validar se o card de rollout esta lendo o resumo consolidado do backend local em vez de fallback
