# Roadmap de Evolução da Infraestrutura

Este documento descreve a evolução planejada da infraestrutura digital da propriedade.

O objetivo é garantir que o sistema implantado hoje possa crescer de forma organizada,
sem necessidade de reconstrução completa da rede.

A evolução está dividida em três fases:

Fase 1 — MVP Operacional  
Fase 2 — Rede Profissional  
Fase 3 — Infraestrutura Avançada

---

# FASE 1 — MVP OPERACIONAL

Esta é a fase inicial de implantação.

Objetivo: colocar toda a infraestrutura funcional com baixo custo e simplicidade operacional.

## Componentes

Servidor central:

Laptop i7  
16 GB RAM  
SSD 512 GB  

Virtualização:

Proxmox VE

Máquinas virtuais:

VM 1 — pfSense  
VM 2 — FreePBX / Asterisk

Equipamentos de rede:

Switch TP-Link LS108G  
5 Access Points Wi-Fi  

---

## Funções da rede

- internet compartilhada
- DHCP automático
- DNS local
- reservas DHCP por MAC
- firewall básico
- telefonia interna
- Wi-Fi distribuído

---

## Integração com sistema Next.js

O sistema de gestão será responsável por:

Cadastro de moradores  
Cadastro de dispositivos (MAC)  
Cadastro de ramais  
Painel administrativo da rede  

Funções iniciais:

- registro de dispositivos
- identificação de usuários
- status da rede
- integração com telefonia

---

## Limitações desta fase

- switch não gerenciável
- sem VLAN
- QoS limitado
- controle de banda simplificado
- sem monitoramento avançado

Essas limitações são aceitáveis nesta fase.

---

# FASE 2 — REDE PROFISSIONAL

Esta fase começa quando:

- número de moradores aumenta
- número de dispositivos cresce
- tráfego de rede aumenta
- necessidade de controle de rede mais refinado surge

---

## Upgrade de equipamentos

Substituição do switch por modelo gerenciável.

Exemplos:

TP-Link TL-SG108E  
TP-Link TL-SG2008  

Isso permitirá:

VLAN  
QoS  
monitoramento de portas  
controle de broadcast  

---

## Segmentação de rede

A rede passa a utilizar VLANs.

### VLAN 10 — Administração

Sistema interno  
Servidores  
Infraestrutura

### VLAN 20 — Moradores

Dispositivos pessoais  
Wi-Fi principal

### VLAN 30 — Telefonia

FreePBX  
ramais VoIP  
porteiro SIP

### VLAN 40 — IoT

porteiro eletrônico  
câmeras  
sensores

### VLAN 50 — Visitantes

Wi-Fi temporário

---

## Melhorias na telefonia

- integração completa com interfone
- abertura remota de portão
- filas de atendimento
- gravação seletiva de chamadas
- integração com sistema interno

---

## Wi-Fi gerenciado

Access points passam a operar com controller centralizado.

Possíveis soluções:

TP-Link Omada  
Ubiquiti UniFi  
Mikrotik CAPsMAN  

Benefícios:

- roaming automático
- controle central
- distribuição inteligente de canais

---

# FASE 3 — INFRAESTRUTURA AVANÇADA

Esta fase transforma a infraestrutura em um pequeno datacenter da propriedade.

Objetivo:

alta disponibilidade  
monitoramento  
automação completa

---

## Upgrade de hardware

Servidor dedicado de rede:

mini server ou appliance dedicado

Possíveis melhorias:

2.5Gb ou 10Gb uplinks  
storage maior  
redundância

---

## Redundância

Implementar:

segundo servidor pfSense em HA

Benefícios:

failover automático  
alta disponibilidade

---

## Monitoramento profissional

Instalação de ferramentas de monitoramento.

Exemplos:

Zabbix  
LibreNMS  
Prometheus  

Monitoramento de:

rede  
servidores  
telefonia  
Wi-Fi  
consumo de banda

---

## Automação administrativa

Integração completa com o sistema Next.js.

Possibilidades:

liberação automática de internet por pagamento  
bloqueio automático por inadimplência  
portal do morador  
painel de consumo de banda  
painel de chamadas telefônicas  

---

## Portal do morador

Funcionalidades futuras:

painel pessoal  
consumo de internet  
histórico de chamadas  
solicitação de manutenção  
agendamento de serviços  

---

# Estratégia de Crescimento

A arquitetura foi planejada para permitir crescimento gradual.

Importante:

Nunca alterar a topologia básica da rede.

A evolução ocorre através de:

melhoria de equipamentos  
ativação de recursos  
segmentação de rede  

Sem necessidade de reconstrução completa.

---

# Conclusão

A infraestrutura proposta oferece:

base sólida  
baixo custo inicial  
alta escalabilidade  

O modelo permite que a propriedade evolua de uma rede simples para uma infraestrutura
profissional ao longo do tempo.

Cada fase adiciona novas capacidades sem comprometer a operação existente.