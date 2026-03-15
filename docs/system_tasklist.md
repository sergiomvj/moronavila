# Tasklist Geral do Sistema

Atualizado em: 2026-03-13

## Objetivo

Esta tasklist consolida o trabalho do sistema inteiro do hostel, tratando o softphone como um modulo operacional dentro da plataforma principal.

## Escopo geral do sistema

- gestao de moradores
- gestao de quartos e ocupacao
- pagamentos e cobranca
- manutencao e limpeza
- internet e controle por MAC
- mural de avisos e agenda
- lavanderia
- landing page e apresentacao da propriedade
- softphone interno para operacao da casa

## Premissas de produto

- o app principal continua sendo o centro da operacao
- o acesso do morador ao app e ao softphone depende de um unico campo mestre `habilitado`
- residente com `habilitado = false` perde acesso ao app do morador e ao softphone
- `habilitado` deve ser desligado automaticamente quando o residente sair da casa ou ficar inadimplente
- o softphone e um modulo interno do sistema
- o softphone e focado no uso dentro da area da casa
- o softphone deve cobrir ligacoes internas, interfone, abertura de portas, recados, voz e alertas operacionais
- recados podem ser integrados aos avisos do sistema quando fizer sentido, mas nao devem ser acoplados de forma artificial

## Status macro atual

- base principal do app: funcional
- views administrativas principais: implementadas
- integracao Supabase: funcional
- backend local `mac-server`: funcional
- softphone pre-PBX: avancado
- rollout operacional do softphone: avancado
- PBX real e automacao real de porta: pendentes
- central integrada de recados do morador: em estruturacao
- principal risco atual: autorizacao e seguranca entre frontend, `mac-server` e Supabase

## Prioridades gerais

### P0 - Operacao essencial

- manter autenticacao e carregamento inicial estaveis
- transformar `habilitado` na chave mestra de elegibilidade do residente
- garantir consistencia dos dados entre Supabase, frontend e `mac-server`
- revisar falhas silenciosas nas cargas parciais do `refreshData`
- garantir que os modulos criticos tenham mensagens de erro claras para admin
- validar migrations pendentes no Supabase em ambiente real

### P0 - Hardening e seguranca

- proteger rotas sensiveis do `mac-server`
- remover dependencia de `authId` arbitrario como prova de identidade
- revisar uso de `SUPABASE_SERVICE_ROLE_KEY` no backend local
- impedir vazamento de credenciais SIP por endpoint
- impedir alteracao de recados de outro morador por `messageId`
- revisar e remover escalacao de privilegio por heuristica no frontend

### P0 - Cadastro e operacao do hostel

- consolidar fluxo de moradores
- consolidar fluxo de quartos e leitos
- consolidar fluxo de pagamentos
- consolidar fluxo de internet por MAC
- consolidar fluxo de manutencao

### P0 - Softphone interno da casa

- manter o dock persistente para moradores habilitados
- concluir a integracao da inbox do softphone com `voz`, `recados` e `encomendas`
- manter o escopo restrito a uso interno da casa
- preparar a conexao SIP real apenas quando o PBX existir

### P1 - Consolidacao estrutural

- revisar regras de negocio espalhadas entre frontend e backend local
- revisar encoding e textos corrompidos em arquivos legados
- reduzir heuristicas emergenciais e substituir por regras explicitas
- melhorar rastreabilidade dos fluxos criticos

## Modulos do sistema

### 1. Autenticacao e sessao

- bloquear o login funcional do morador quando `habilitado = false`
- garantir autobloqueio do app quando o residente perder elegibilidade durante a sessao
- revisar fallback de perfil quando o `resident` nao e encontrado
- revisar heuristica emergencial de admin no frontend
- definir estrategia definitiva de permissao por `role`
- garantir logout e refresh consistentes em todos os modulos
- validar recuperacao de senha e atualizacao de senha
- remover promocao automatica para admin por email ou ausencia de cadastro
- alinhar autenticacao do frontend com autorizacao real no backend local

### 2. Dashboard

- manter resumo executivo confiavel para admin
- manter atalhos operacionais para moradores
- revisar indicadores de negocio e operacao
- consolidar origem dos dados exibidos em cards criticos
- expandir indicadores de risco operacional quando necessario

### 3. Moradores

- revisar CRUD completo de moradores
- adicionar e consolidar o campo mestre `habilitado`
- definir e exibir motivo operacional de bloqueio quando `habilitado = false`
- validar consistencia de `auth_id`, `email` e `role`
- revisar cadastro de telefone, cama, quarto e valores financeiros
- padronizar estados operacionais do morador
- concluir visao de prontidao do softphone por morador
- incluir central de recados no futuro cadastro operacional do morador

### 4. Quartos e leitos

- revisar integridade de capacidade versus ocupacao
- revisar alocacao de moradores por quarto/leito
- revisar cadastro de moveis e midia
- revisar consistencia entre quarto, manutencao e residente
- validar custo por quarto, limpeza e extras

### 5. Pagamentos

- revisar fluxo administrativo de cobranca
- revisar fluxo do morador para visualizacao e pagamento
- revisar status `Pago`, `Pendente` e `Atrasado`
- definir quando inadimplencia deve desligar `habilitado`
- automatizar desligamento de `habilitado` por inadimplencia conforme regra operacional
- revisar ligacao entre pagamento confirmado e internet ativa
- criar trilha de recados automativos para lembretes de pagamento
- avaliar eventos financeiros que devem alimentar avisos do morador

### 6. Manutencao

- revisar abertura de chamado pelo morador
- revisar acompanhamento administrativo
- revisar estados `Aberto`, `Em Andamento` e `Resolvido`
- integrar atualizacoes de manutencao com recados do morador
- avaliar anexos e fotos em ambiente real

### 7. Reclamoes

- revisar envio anonimo e identificado
- revisar visibilidade para admin
- definir se reclamacoes devem ou nao gerar recados para retorno ao morador
- revisar estados e historico

### 8. Avisos e agenda

- revisar modulo de notices
- revisar comentarios em avisos
- revisar agenda compartilhada
- definir o que pode ser reaproveitado como recado individual do morador
- evitar misturar aviso geral com recado individual sem regra clara

### 9. Lavanderia

- revisar agendamento
- revisar conflitos de horario
- revisar experiencia do morador
- avaliar se lembretes de horario devem virar recados automativos

### 10. Internet e rede

- manter gestao de dispositivos por MAC
- revisar aprovacao e bloqueio de dispositivos
- revisar experiencia do morador para cadastro de MAC
- consolidar estado de internet ativa por morador
- validar acoplamento entre internet ativa e autoativacao do softphone
- definir claramente o que depende da rede interna da casa
- garantir que internet operacional do morador respeite `habilitado`

### 11. Landing page e descricao da propriedade

- revisar consistencia entre landing page e dados reais da propriedade
- revisar modulo de descricao da propriedade
- revisar midias, textos e disponibilidade publica
- avaliar padrao de manutencao de conteudo

## Softphone como modulo do sistema

### Escopo funcional aceito

- ligacoes internas
- atendimento do interfone
- abertura de portas
- indicadores operacionais do morador
- voz
- recados
- encomendas

### Limites aceitos

- nao tratar o softphone como telefonia externa
- nao depender de uso fora da area da casa
- nao expandir para fluxos de custo extra sem necessidade
- nao obrigar integracao com avisos globais se isso piorar o modelo de dados
- permitir uso do softphone apenas para moradores com `habilitado = true`

### Softphone - base ja pronta

- shell persistente do morador
- feature flags por `.env`
- rollout administrativo
- healthcheck tecnico
- transporte `mock` e `sipjs`
- `sip.js` instalado
- readiness de navegador, microfone e rollout
- endpoint de porta placeholder
- endpoint de rollout consolidado
- inbox inicial em estruturacao

### Softphone - backlog imediato

- concluir integracao visual do novo layout ao `SoftphoneDock`
- concluir contadores de `voz`, `recados` e `encomendas`
- concluir endpoint e consumo da inbox do softphone
- bloquear autoativacao e uso do softphone quando `habilitado = false`
- revisar marcacao de leitura de recados manuais
- definir quais eventos do sistema geram recados automaticos
- manter placeholders seguros onde ainda nao houver infraestrutura real

### Softphone - backlog de infraestrutura

- instalar e configurar PBX
- preencher `.env.local` com dados reais
- validar `WSS` e registro SIP no navegador
- testar chamada interna real
- testar interfone real
- testar abertura de porta real
- homologar uso dentro da operacao da casa

## Central de recados do morador

### Objetivo

- criar uma inbox operacional unica para o morador dentro do ecossistema do app

### Tipos iniciais

- `voice`
- `note`
- `package`

### Fontes previstas

- recados manuais da gestao
- lembretes de pagamento
- atualizacoes de manutencao
- alertas de internet
- avisos especificos do softphone
- eventos de encomenda

### Pendencias

- concluir tabela `resident_messages`
- concluir consumo no frontend
- definir quais eventos sao sinteticos e quais sao persistidos
- definir estrategia de leitura, resolucao e arquivamento

## Backend local `mac-server`

- manter endpoints atuais de softphone
- revisar tratamento de erro e resposta padrao
- revisar endpoints que dependem do Supabase
- revisar logs operacionais
- documentar endpoints internos de suporte ao app
- preparar endpoints da inbox do morador
- exigir autenticacao confiavel nas rotas de configuracao, inbox e operacao
- revisar a superficie exposta por endpoints administrativos e de morador
- revisar o uso do service role em consultas e mutacoes
- separar melhor utilitarios locais de endpoints de negocio

## Banco e migrations

- aplicar e validar migrations do softphone
- aplicar e validar migration da inbox
- revisar schema legado versus schema real do Supabase
- mapear tabelas que ainda dependem de ajustes de producao
- documentar ordem recomendada de migrations

## Qualidade e operacao

### Testes e verificacao

- manter `npm run lint` limpo
- manter `npm run build` limpo
- ampliar testes manuais por modulo
- criar checklist de homologacao por perfil admin e morador
- criar checklist de homologacao do softphone em ambiente real
- criar checklist de seguranca e permissao para rotas sensiveis

### Observabilidade

- padronizar logs relevantes do `mac-server`
- revisar erros silenciosos no frontend
- identificar pontos criticos para telemetria futura

### Documentacao

- manter PRD do softphone alinhado com o escopo real
- manter `softphone_env.md` alinhado ao estado do produto
- documentar a tasklist geral do sistema
- criar checklists de rollout e homologacao quando a infraestrutura existir
- documentar o modelo de autenticacao esperado para o modulo softphone
- documentar os limites de seguranca do `mac-server`

## Sequencia sugerida de execucao

### Fase 1 - Consolidacao do sistema atual

- revisar autenticacao e permissao
- endurecer seguranca do `mac-server`
- remover escalacoes de privilegio por heuristica
- revisar integridade dos dados dos modulos principais
- revisar mensagens de erro e estados vazios
- fechar pendencias visiveis de operacao do hostel

### Fase 2 - Central de recados

- concluir inbox do morador
- ligar recados aos modulos de pagamento, manutencao e internet
- expor indicadores no softphone
- garantir isolamento por morador e leitura segura dos recados

### Fase 3 - Softphone visual e operacional

- adaptar o layout novo do softphone ao app
- integrar indicadores de voz, recados e encomendas
- manter diagnostico e prontidao acessiveis

### Fase 4 - Infraestrutura real

- subir PBX
- configurar variaveis reais
- testar SIP, interfone e porta
- homologar uso interno da casa

## Itens que precisam de decisao futura

- quais eventos do sistema viram recados automaticos por padrao
- se encomendas devem ser contador ou apenas indicador
- como a portaria vai registrar recados de voz
- como o admin vai cadastrar/gerenciar recados manuais
- se havera inbox dedicada fora do softphone no futuro
