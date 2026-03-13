# Arquitetura do Sistema de Infraestrutura Digital

## Objetivo

Implementar uma infraestrutura centralizada capaz de integrar:

- controle de internet
- rede Wi-Fi distribuída
- controle de dispositivos por MAC
- DNS local
- telefonia interna
- integração com porteiro eletrônico
- integração com sistema administrativo em Next.js

O sistema deverá ser modular, escalável e resiliente.

---

# Camadas da Arquitetura

A arquitetura é organizada em quatro camadas principais.

## 1. Infraestrutura Física

Hardware principal:

Servidor central:

Laptop i7  
16GB RAM  
SSD 512GB  

Interfaces de rede:

RJ45 nativa → LAN  
USB-RJ45 → WAN  

Equipamentos adicionais:

Switch Gigabit TP-Link LS108G  
5 Access Points Wi-Fi  
Nobreak para proteção elétrica  

---

## 2. Virtualização

O servidor executará **Proxmox VE** como hypervisor.

Funções:

- isolamento de serviços
- snapshots
- backups
- manutenção simplificada

Máquinas Virtuais principais:

### VM 1 – pfSense

Responsável por:

- roteamento
- NAT
- firewall
- DHCP
- DNS local
- controle de acesso
- monitoramento de rede

### VM 2 – FreePBX / Asterisk

Responsável por:

- central telefônica
- ramais SIP
- grupos de chamada
- correio de voz
- integração com porteiro
- suporte a WebRTC

---

## 3. Camada de Serviços

### Rede

Serviços de rede providos pelo pfSense:

- DHCP
- DNS Resolver
- NAT
- firewall stateful
- reservas DHCP por MAC
- aliases de rede
- controle de acesso

### Telefonia

Serviços providos pelo FreePBX:

- ramais internos
- chamadas internas
- ring groups
- integração com interfone
- suporte a softphone

---

## 4. Camada de Gestão

Sistema desenvolvido em **Next.js** responsável por:

- cadastro de moradores
- cadastro de dispositivos
- associação MAC ↔ morador
- cadastro de ramais
- controle administrativo
- painel de rede
- módulo softphone WebRTC
- integração futura com cobrança

---

# Fluxo Operacional

Morador entra no sistema  
↓  
Dispositivo é cadastrado (MAC address)  
↓  
pfSense entrega IP reservado via DHCP  
↓  
Regras de firewall permitem ou bloqueiam acesso  
↓  
Morador pode usar:

- internet
- telefonia interna
- serviços da propriedade

---

# Expansão futura

- VLANs para segmentação de rede
- Captive Portal
- Wi-Fi para visitantes
- QoS avançado
- monitoramento centralizado
- integração financeira automática