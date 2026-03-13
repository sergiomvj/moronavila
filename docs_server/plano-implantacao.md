# Plano de Implantação

Este documento descreve as etapas para implantação da infraestrutura.

---

# Fase 1 — Preparação do hardware

Verificar:

- funcionamento do laptop
- estado do SSD
- memória instalada
- adaptadores USB-RJ45

Instalar:

- nobreak
- switch
- cabeamento
- access points

---

# Fase 2 — Instalação do Proxmox

Instalar Proxmox VE.

Configurações iniciais:

- hostname
- IP fixo
- acesso administrativo
- atualização do sistema

Criar bridges de rede:

vmbr0 → LAN  
vmbr1 → WAN

---

# Fase 3 — Instalação do pfSense

Criar VM pfSense.

Configuração inicial:

- interface WAN
- interface LAN
- NAT
- firewall
- DHCP server
- DNS resolver

Testar:

- acesso à internet
- distribuição de IP

---

# Fase 4 — Instalação do FreePBX

Criar VM FreePBX.

Configurar:

- IP fixo
- acesso web
- ramais SIP
- codecs
- NAT settings

Testar chamadas internas.

---

# Fase 5 — Configuração da Rede Wi-Fi

Instalar Access Points.

Configurar:

- SSID
- senha WPA2/WPA3
- canais Wi-Fi
- potência de transmissão

Testar cobertura.

---

# Fase 6 — Integração com Sistema Next.js

Criar módulos:

- moradores
- dispositivos
- ramais
- status da internet

Implementar softphone WebRTC.

---

# Fase 7 — Testes gerais

Testar:

- acesso internet
- estabilidade Wi-Fi
- chamadas internas
- carga da rede
- reconexão automática