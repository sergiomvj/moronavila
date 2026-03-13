# Network Policy
Políticas de Rede e Segurança

Este documento define as regras operacionais da rede da propriedade.

Objetivos principais:

- garantir segurança
- garantir estabilidade da rede
- evitar abuso de banda
- priorizar serviços essenciais
- proteger infraestrutura interna

---

# Princípios Gerais

A rede da propriedade segue os seguintes princípios:

1. Segurança primeiro
2. Serviços essenciais têm prioridade
3. Moradores possuem acesso justo à internet
4. Dispositivos devem ser identificáveis
5. Infraestrutura deve permanecer protegida

---

# Identificação de Dispositivos

Todo dispositivo conectado à rede deve estar registrado.

Cada dispositivo terá:

MAC Address  
IP reservado via DHCP  
Identificação do morador  
Tipo de dispositivo

Tipos possíveis:

- smartphone
- notebook
- tablet
- smart tv
- console
- IoT

Dispositivos não registrados podem ter acesso limitado ou bloqueado.

---

# Controle de Acesso

O acesso à rede será controlado por:

- reservas DHCP
- firewall do pfSense
- políticas administrativas

Situações possíveis:

| Status | Acesso |
|------|------|
| Ativo | Internet liberada |
| Suspenso | Internet bloqueada |
| Restrito | Acesso limitado |
| Visitante | Internet temporária |

---

# Política de Internet

O acesso à internet é compartilhado entre todos os moradores.

Regras gerais:

- uso pessoal permitido
- atividades ilegais proibidas
- ataques ou scans de rede proibidos
- servidores públicos não autorizados
- mineração de criptomoedas proibida

---

# Controle de Banda

Para evitar saturação da rede:

- limite de banda por dispositivo pode ser aplicado
- tráfego pesado pode ser limitado
- downloads massivos podem ser reduzidos

Exemplo de política futura:

morador padrão:

100 Mbps download  
30 Mbps upload

Visitantes:

20 Mbps download  
10 Mbps upload

---

# Prioridade de Tráfego (QoS)

Alguns serviços terão prioridade na rede.

Alta prioridade:

VoIP  
porteiro eletrônico  
sistema administrativo

Prioridade média:

navegação web  
streaming moderado

Prioridade baixa:

downloads massivos  
torrents

---

# Telefonia

O tráfego de telefonia deve ter prioridade para evitar falhas de chamada.

Regras:

VoIP sempre priorizado  
latência mínima  
jitter controlado

Chamadas internas devem funcionar mesmo sob carga de rede.

---

# Segurança da Infraestrutura

Servidores críticos:

pfSense  
FreePBX  
Proxmox  

Regras:

acesso administrativo restrito  
acesso apenas da rede administrativa  
portas externas bloqueadas

---

# Wi-Fi

Regras de rede Wi-Fi:

SSID principal: moradores  
SSID futuro: visitantes  

Segurança:

WPA2/WPA3  
senhas fortes  
troca periódica recomendada

---

# Dispositivos Proibidos

Não são permitidos:

- roteadores pessoais conectados na rede
- repetidores Wi-Fi não autorizados
- servidores de rede públicos
- dispositivos que causem interferência

---

# Monitoramento

A rede poderá ser monitorada para:

- detectar abuso de banda
- detectar dispositivos não autorizados
- identificar problemas técnicos
- analisar desempenho da rede

Logs podem ser mantidos para auditoria.

---

# Manutenção

Manutenções poderão ocorrer periodicamente para:

- atualização de sistemas
- melhoria da rede
- correção de falhas

Durante manutenção alguns serviços podem ficar temporariamente indisponíveis.

---

# Política de Expansão

Novos dispositivos e serviços devem ser avaliados antes de integração.

Mudanças estruturais devem seguir:

planejamento técnico  
documentação  
testes controlados

---

# Conclusão

Estas políticas garantem que a rede da propriedade permaneça:

segura  
estável  
organizada  
escalável  

Todos os usuários da rede devem respeitar estas diretrizes.