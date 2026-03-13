Perfeito. Abaixo está o **sétimo documento**, o **guia técnico completo de instalação**, com passos práticos para você montar toda a infraestrutura.

---

# 📄 infraestrutura-install-guide.md

```markdown
# Guia Técnico de Instalação da Infraestrutura

Este documento descreve o processo completo de instalação do ambiente:

- servidor Proxmox
- pfSense
- FreePBX
- rede interna

Hardware alvo:

Laptop i7  
16GB RAM  
SSD 512GB  

Interfaces:

RJ45 nativa → LAN  
USB-RJ45 → WAN  

Switch:

TP-Link LS108G

---

# 1. Preparação do Hardware

Antes de iniciar a instalação verifique:

✔ BIOS com virtualização habilitada (Intel VT-x / AMD-V)  
✔ Boot por USB habilitado  
✔ SSD reconhecido  
✔ Adaptador USB-RJ45 funcionando  

Conectar:

RJ45 nativa → switch  
USB-RJ45 → modem/ONU da internet

---

# 2. Instalação do Proxmox

Baixar:

https://www.proxmox.com/en/downloads

Criar pendrive bootável.

No boot selecionar:

Install Proxmox VE

Configurar:

Disco: SSD interno  
Filesystem: ext4 (ou ZFS se desejar)  

Definir:

Hostname  
Senha root  
Email administrador

---

# 3. Configuração Inicial do Proxmox

Após instalação acessar via navegador:

```

https://IP_DO_SERVIDOR:8006

```

Login:

```

user: root
password: senha definida

```

Atualizar sistema:

```

apt update
apt full-upgrade -y

```

---

# 4. Identificar Interfaces de Rede

Executar:

```

ip a

```

Exemplo de resultado:

```

enp3s0 → RJ45 nativa
enx00e04c680123 → USB-RJ45

```

---

# 5. Configurar Bridges

Editar arquivo:

```

/etc/network/interfaces

```

Exemplo de configuração:

```

auto lo
iface lo inet loopback

auto enp3s0
iface enp3s0 inet manual

auto enx00e04c680123
iface enx00e04c680123 inet manual

auto vmbr0
iface vmbr0 inet static
address 192.168.10.2/24
gateway 192.168.10.1
bridge_ports enp3s0
bridge_stp off
bridge_fd 0

auto vmbr1
iface vmbr1 inet manual
bridge_ports enx00e04c680123
bridge_stp off
bridge_fd 0

```

Reiniciar rede:

```

systemctl restart networking

```

---

# 6. Criar VM pfSense

No painel do Proxmox:

Create VM

Configuração recomendada:

```

CPU: 2 cores
RAM: 2 GB
Disk: 20 GB
ISO: pfSense installer

```

Interfaces:

```

net0 → vmbr1 (WAN)
net1 → vmbr0 (LAN)

```

---

# 7. Instalar pfSense

Durante instalação selecionar:

Auto Install

Após reinício configurar interfaces:

```

WAN → net0
LAN → net1

```

Configuração padrão:

LAN IP:

```

192.168.10.1

```

DHCP:

ativar

Range:

```

192.168.10.100
192.168.10.200

```

---

# 8. Acesso ao pfSense

Abrir navegador:

```

[http://192.168.10.1](http://192.168.10.1)

```

Login padrão:

```

user: admin
password: pfsense

```

Executar wizard inicial.

---

# 9. Criar VM FreePBX

No Proxmox:

Create VM

Configuração recomendada:

```

CPU: 2 cores
RAM: 2 GB
Disk: 40 GB
Network: vmbr0

```

Instalar ISO oficial do FreePBX.

---

# 10. Configuração Inicial FreePBX

Após instalação acessar:

```

http://IP_FREEPBX

```

Criar conta administrador.

---

# 11. Criar Ramais

No painel FreePBX:

Applications  
Extensions  

Criar extensões SIP.

Exemplo:

```

200
201
202
203

```

---

# 12. Testar Chamadas

Instalar softphone em dois dispositivos.

Exemplo:

Zoiper  
Linphone  

Configurar:

SIP server → IP FreePBX

Testar chamada entre ramais.

---

# 13. Configuração do Wi-Fi

Access points devem operar em modo bridge.

Configurar:

SSID:

ResidenciaNet

Segurança:

WPA2/WPA3

Senha forte.

---

# 14. Testes Finais

Testar:

✔ internet funcionando  
✔ DHCP entregando IP  
✔ Wi-Fi funcionando  
✔ chamadas internas funcionando  

---

# 15. Backup

No Proxmox:

Datacenter  
Backup  

Criar rotina semanal.

Também exportar:

configuração pfSense  
configuração FreePBX

---

# Conclusão

Com estes passos a propriedade terá:

- rede centralizada
- controle de dispositivos
- Wi-Fi distribuído
- telefonia interna
- base para automação administrativa
```

---

# 📦 Estrutura final de documentação do projeto

Agora seu projeto possui **7 documentos técnicos**:

| Documento                       | Conteúdo                   |
| ------------------------------- | -------------------------- |
| arquitetura.md                  | arquitetura do sistema     |
| topologia.md                    | topologia de rede          |
| plano-implantacao.md            | plano de implantação       |
| checklist-operacional.md        | checklist técnico          |
| infraestrutura-roadmap.md       | evolução futura            |
| network-policy.md               | políticas de rede          |
| infraestrutura-install-guide.md | guia técnico de instalação |

---

## 📁 Estrutura recomendada da pasta do projeto

```text
infraestrutura-rede/

├ arquitetura.md
├ topologia.md
├ plano-implantacao.md
├ checklist-operacional.md
├ infraestrutura-roadmap.md
├ network-policy.md
└ infraestrutura-install-guide.md
```

---

💡 Se quiser, posso também gerar **um diagrama visual profissional da rede (estilo arquitetura corporativa)** com:

* servidor
* pfSense
* FreePBX
* switch
* APs
* fluxo da internet
* integração com o sistema Next.js

Esse diagrama ajuda muito quando você precisar **explicar a infraestrutura para técnicos ou fornecedores**.
