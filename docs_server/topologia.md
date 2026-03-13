# Topologia da Rede

## Visão geral

A infraestrutura utiliza um servidor central virtualizado responsável por:

- roteamento
- controle de rede
- telefonia interna

Todos os dispositivos da propriedade conectam-se a um switch central.

---

# Topologia Física

Internet
│
Modem / ONU
│
USB-RJ45 (WAN)
│
Servidor Proxmox
│
RJ45 Nativa (LAN)
│
Switch Gigabit TP-Link LS108G
│
├── Access Point 1
├── Access Point 2
├── Access Point 3
├── Access Point 4
├── Access Point 5
├── Dispositivos cabeados
└── Expansão futura

---

# Topologia Virtual

Dentro do Proxmox:

Servidor Proxmox
│
├── VM pfSense
│   ├ WAN Interface
│   └ LAN Interface
│
└── VM FreePBX
    └ Rede interna

---

# Endereçamento de rede

Rede LAN:

192.168.10.0/24

Gateway:

192.168.10.1

---

## Distribuição de IP

| Faixa | Uso |
|------|-----|
| 192.168.10.1 | pfSense |
| 192.168.10.2-20 | infraestrutura |
| 192.168.10.21-50 | servidores |
| 192.168.10.51-99 | dispositivos administrativos |
| 192.168.10.100-199 | moradores |
| 192.168.10.200-230 | dispositivos IoT |
| 192.168.10.231-254 | reserva |

---

# Topologia Wi-Fi

Todos os Access Points operam em modo bridge.

Switch
├─ AP1
├─ AP2
├─ AP3
├─ AP4
└─ AP5

SSID principal:

ResidenciaNet

SSID opcional futuro:

ResidenciaGuest