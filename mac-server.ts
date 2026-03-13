import express from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config({ path: '.env.local' });

const execPromise = promisify(exec);
const app = express();
const port = process.env.PORT || 4000;

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || ''
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase Admin Client
const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const ASAAS_API_URL = 'https://sandbox.asaas.com/api/v3';
const ASAAS_API_KEY = process.env.VITE_ASAAS_API_KEY || '';
const SOFTPHONE_ENABLED = (process.env.VITE_SOFTPHONE_ENABLED || 'false').toLowerCase() === 'true';
const SOFTPHONE_AUTO_CONNECT = (process.env.VITE_SOFTPHONE_AUTO_CONNECT || 'true').toLowerCase() === 'true';
const SOFTPHONE_REQUIRE_INTERNET_ACTIVE = (process.env.VITE_SOFTPHONE_REQUIRE_INTERNET_ACTIVE || 'true').toLowerCase() === 'true';
const SOFTPHONE_PBX_HOST = process.env.VITE_SOFTPHONE_PBX_HOST || '';
const SOFTPHONE_PBX_DOMAIN = process.env.VITE_SOFTPHONE_PBX_DOMAIN || '';
const SOFTPHONE_PBX_WSS_URL = process.env.VITE_SOFTPHONE_PBX_WSS_URL || '';
const SOFTPHONE_DEFAULT_DISPLAY_NAME = process.env.VITE_SOFTPHONE_DEFAULT_DISPLAY_NAME || 'MoronaVila Softphone';
const SOFTPHONE_TRANSPORT = process.env.VITE_SOFTPHONE_TRANSPORT === 'sipjs' ? 'sipjs' : 'mock';
const SOFTPHONE_PBX_DEFAULT_SECRET = process.env.SOFTPHONE_PBX_DEFAULT_SECRET || '';
const SOFTPHONE_PORTARIA_EXTENSION = process.env.VITE_SOFTPHONE_PORTARIA_EXTENSION || '100';
const SOFTPHONE_ADMIN_EXTENSION = process.env.VITE_SOFTPHONE_ADMIN_EXTENSION || '101';
const SOFTPHONE_LAUNDRY_EXTENSION = process.env.VITE_SOFTPHONE_LAUNDRY_EXTENSION || '102';
const SOFTPHONE_DELIVERY_EXTENSION = process.env.VITE_SOFTPHONE_DELIVERY_EXTENSION || '103';

app.use(express.json());

function buildSuggestedResidentExtension(resident: any): string | null {
    if (resident?.softphone_extension) return String(resident.softphone_extension);
    if (resident?.bed_identifier) {
        const digits = String(resident.bed_identifier).replace(/\D/g, '');
        if (digits) return `2${digits.padStart(2, '0').slice(-2)}`;
    }
    if (resident?.phone) {
        const digits = String(resident.phone).replace(/\D/g, '').slice(-3);
        if (digits) return `2${digits.padStart(3, '0').slice(-3)}`;
    }
    return null;
}

app.get('/api/softphone/env', async (_req, res) => {
    res.json({
        enabled: SOFTPHONE_ENABLED,
        autoConnect: SOFTPHONE_AUTO_CONNECT,
        requireInternetActive: SOFTPHONE_REQUIRE_INTERNET_ACTIVE,
        configured: Boolean(SOFTPHONE_PBX_HOST && SOFTPHONE_PBX_DOMAIN && SOFTPHONE_PBX_WSS_URL),
        pbxHost: SOFTPHONE_PBX_HOST || null,
        pbxDomain: SOFTPHONE_PBX_DOMAIN || null,
        pbxWssUrl: SOFTPHONE_PBX_WSS_URL || null,
        defaultDisplayName: SOFTPHONE_DEFAULT_DISPLAY_NAME,
        transport: SOFTPHONE_TRANSPORT,
        quickExtensions: {
            portaria: SOFTPHONE_PORTARIA_EXTENSION,
            administracao: SOFTPHONE_ADMIN_EXTENSION,
            lavanderia: SOFTPHONE_LAUNDRY_EXTENSION,
            encomendas: SOFTPHONE_DELIVERY_EXTENSION
        }
    });
});

app.get('/api/softphone/directory', async (req, res) => {
    const authId = typeof req.query.authId === 'string' ? req.query.authId : '';
    let resident: any = null;

    if (authId) {
        const result = await supabase
            .from('residents')
            .select('id, name, phone, bed_identifier, softphone_extension, softphone_display_name, softphone_enabled, internet_active')
            .eq('auth_id', authId)
            .maybeSingle();

        if (!result.error) {
            resident = result.data;
        }
    }

    const residentExtension = buildSuggestedResidentExtension(resident);
    const directory = [
        residentExtension ? {
            id: 'meu-ramal',
            extension: residentExtension,
            name: resident?.softphone_display_name || resident?.name || 'Meu Ramal',
            kind: 'resident',
            description: 'Ramal sugerido para este morador'
        } : null,
        {
            id: 'portaria',
            extension: SOFTPHONE_PORTARIA_EXTENSION,
            name: 'Portaria',
            kind: 'doorphone',
            description: 'Interfone e atendimento principal'
        },
        {
            id: 'administracao',
            extension: SOFTPHONE_ADMIN_EXTENSION,
            name: 'Administracao',
            kind: 'admin',
            description: 'Equipe administrativa'
        },
        {
            id: 'lavanderia',
            extension: SOFTPHONE_LAUNDRY_EXTENSION,
            name: 'Lavanderia',
            kind: 'laundry',
            description: 'Suporte da lavanderia'
        },
        {
            id: 'encomendas',
            extension: SOFTPHONE_DELIVERY_EXTENSION,
            name: 'Encomendas',
            kind: 'delivery',
            description: 'Recebimento e entregas'
        }
    ].filter(Boolean);

    res.json({
        resident: resident ? {
            id: resident.id,
            softphoneEnabled: resident.softphone_enabled !== false,
            internetActive: resident.internet_active === true
        } : null,
        directory
    });
});

app.get('/api/softphone/config', async (req, res) => {
    const authId = typeof req.query.authId === 'string' ? req.query.authId : '';

    if (!authId) {
        return res.status(400).json({ error: 'authId é obrigatório' });
    }

    const result = await supabase
        .from('residents')
        .select('id, name, phone, bed_identifier, softphone_extension, softphone_display_name, softphone_enabled, internet_active')
        .eq('auth_id', authId)
        .maybeSingle();

    if (result.error || !result.data) {
        return res.status(404).json({ error: 'Morador não encontrado' });
    }

    const resident = result.data;
    const extension = buildSuggestedResidentExtension(resident);
    const canIssueSipConfig = Boolean(
        extension &&
        SOFTPHONE_PBX_DOMAIN &&
        SOFTPHONE_PBX_WSS_URL &&
        SOFTPHONE_PBX_DEFAULT_SECRET
    );

    return res.json({
        enabled: SOFTPHONE_ENABLED && resident.softphone_enabled !== false,
        autoConnect: SOFTPHONE_AUTO_CONNECT,
        requireInternetActive: SOFTPHONE_REQUIRE_INTERNET_ACTIVE,
        transport: SOFTPHONE_TRANSPORT,
        configured: Boolean(SOFTPHONE_PBX_HOST && SOFTPHONE_PBX_DOMAIN && SOFTPHONE_PBX_WSS_URL),
        resident: {
            id: resident.id,
            name: resident.name,
            displayName: resident.softphone_display_name || resident.name || SOFTPHONE_DEFAULT_DISPLAY_NAME,
            extension,
            internetActive: resident.internet_active === true
        },
        sip: {
            host: SOFTPHONE_PBX_HOST || null,
            domain: SOFTPHONE_PBX_DOMAIN || null,
            websocketServer: SOFTPHONE_PBX_WSS_URL || null,
            uri: canIssueSipConfig ? `sip:${extension}@${SOFTPHONE_PBX_DOMAIN}` : null,
            authorizationUsername: canIssueSipConfig ? extension : null,
            authorizationPassword: canIssueSipConfig ? SOFTPHONE_PBX_DEFAULT_SECRET : null
        }
    });
});

// Função para obter o MAC a partir do IP (Windows)obter o MAC a partir do IP (Windows)
async function getMacFromIp(ip: string): Promise<string | null> {
    try {
        // Para localhost em Windows, o ARP não funciona da mesma forma, mas na rede sim.
        if (ip === '::1' || ip === '127.0.0.1') return 'Dispositivo Local (Servidor)';

        const { stdout } = await execPromise(`arp -a ${ip}`);
        const lines = stdout.split('\n');
        for (const line of lines) {
            if (line.includes(ip)) {
                const parts = line.trim().split(/\s+/);
                // O MAC costuma ser a segunda ou terceira coluna dependendo do SO/Versão
                const macMatch = parts.find(p => /([0-9a-fA-F]{2}[:-]){5}([0-9a-fA-F]{2})/.test(p));
                return macMatch || 'Não encontrado';
            }
        }
        return 'Não mapeado no ARP';
    } catch (error) {
        console.error('Erro ao buscar MAC:', error);
        return 'Erro na detecção';
    }
}

app.get('/mac', async (req, res) => {
    const ip = req.ip?.replace('::ffff:', '') || '0.0.0.0';
    const mac = await getMacFromIp(ip);

    const html = `
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MoronaVila - Detector de MAC</title>
    <style>
        :root {
            --primary: #c084fc;
            --secondary: #22c55e;
            --bg: #0f172a;
        }
        body {
            margin: 0;
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            background: radial-gradient(circle at top right, #1e293b, #0f172a);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            overflow: hidden;
        }
        .container {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 2.5rem;
            border-radius: 2rem;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            max-width: 400px;
            width: 90%;
            text-align: center;
            position: relative;
        }
        .logo {
            font-size: 1.5rem;
            font-weight: 800;
            background: linear-gradient(to right, #22c55e, #c084fc);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 2rem;
            letter-spacing: -1px;
        }
        .mac-box {
            background: rgba(0, 0, 0, 0.3);
            padding: 1.5rem;
            border-radius: 1.25rem;
            margin: 1.5rem 0;
            border: 2px solid rgba(192, 132, 252, 0.3);
            font-family: 'JetBrains Mono', monospace;
            font-size: 1.25rem;
            color: #c084fc;
            text-transform: uppercase;
            box-shadow: 0 0 20px rgba(192, 132, 252, 0.1);
        }
        .label {
            color: #94a3b8;
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .btn {
            background: #22c55e;
            color: white;
            border: none;
            padding: 1rem 2rem;
            border-radius: 1rem;
            font-weight: 600;
            cursor: pointer;
            width: 100%;
            margin-top: 1rem;
            transition: all 0.3s ease;
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 15px -3px rgba(34, 197, 94, 0.3);
        }
        .info {
            font-size: 0.75rem;
            color: #64748b;
            margin-top: 1.5rem;
            line-height: 1.5;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">MoronaVila</div>
        <div class="label">Identificamos seu dispositivo</div>
        <div class="mac-box">${mac}</div>
        <div class="label">Seu IP na rede: ${ip}</div>
        <button class="btn" onclick="copyMac()">Copiar MAC Address</button>
        <p class="info">
            Este código é necessário para liberar o acesso à internet na MoronaVila. 
            Copie e cole no seu perfil no aplicativo principal.
        </p>
    </div>

    <script>
        function copyMac() {
            const mac = "${mac}";
            navigator.clipboard.writeText(mac);
            alert("MAC Address copiado!");
        }
    </script>
</body>
</html>
  `;
    res.send(html);
});

// --- ENDPOINTS DE PAGAMENTO PIX ---

app.post('/api/payments/pix', async (req, res) => {
    const { residentId, amount, description, paymentId } = req.body;

    try {
        // 1. Buscar dados do residente no Supabase
        const { data: resident, error: resError } = await supabase
            .from('residents')
            .select('name, email')
            .eq('id', residentId)
            .single();

        if (resError || !resident) throw new Error('Residente não encontrado');

        // 2. Criar cobrança no Asaas
        const response = await fetch(`${ASAAS_API_URL}/payments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'access_token': ASAAS_API_KEY
            },
            body: JSON.stringify({
                billingType: 'PIX',
                customer: residentId, // No Asaas real, precisaríamos criar o client antes ou usar dados avulsos
                name: resident.name,
                email: resident.email,
                value: amount,
                description: description,
                externalReference: paymentId,
                dueDate: new Date().toISOString().split('T')[0]
            })
        });

        const paymentData = await response.json();
        if (!response.ok) throw new Error(paymentData.errors?.[0]?.description || 'Erro no Asaas');

        // 3. Buscar QR Code
        const qrResponse = await fetch(`${ASAAS_API_URL}/payments/${paymentData.id}/pixQrCode`, {
            headers: { 'access_token': ASAAS_API_KEY }
        });
        const qrData = await qrResponse.json();

        // 4. Atualizar o Supabase com os dados do PIX (Usando service_role)
        await supabase
            .from('payments')
            .update({
                external_id: paymentData.id,
                pix_qr_code: qrData.encodedImage,
                pix_copy_paste: qrData.payload,
                expiration_date: qrData.expirationDate
            })
            .eq('id', paymentId);

        res.json({
            success: true,
            qrCode: qrData.encodedImage,
            copyPaste: qrData.payload,
            expirationDate: qrData.expirationDate
        });

    } catch (err: any) {
        console.error('Erro PIX:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/payments/webhook', async (req, res) => {
    const event = req.body;
    console.log('Webhook Asaas recebido:', event.event);

    if (event.event === 'PAYMENT_RECEIVED' || event.event === 'PAYMENT_CONFIRMED') {
        const asaasId = event.payment.id;
        const externalRef = event.payment.externalReference;

        try {
            await supabase
                .from('payments')
                .update({
                    status: 'Pago',
                    payment_date: new Date().toISOString().split('T')[0]
                })
                .eq('id', externalRef);

            console.log(`Pagamento ${externalRef} confirmado via Webhook.`);
        } catch (err) {
            console.error('Erro ao atualizar status via Webhook:', err);
        }
    }

    res.status(200).send('OK');
});

// --- UTILITÁRIOS ---

async function sendWhatsAppNotification(name: string, phone: string) {
    const AISENSY_KEY = process.env.AISENSY_API_KEY;
    if (!AISENSY_KEY) {
        console.warn('AISENSY_API_KEY não configurada no .env.local');
        return;
    }

    try {
        const response = await fetch('https://backend.aisensy.com/campaign/t1/api/v2', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                apiKey: AISENSY_KEY,
                campaignName: 'lead_capture', // Placeholder: Alterar para o nome real da campanha no AiSensy
                destination: phone,
                userName: name,
                templateParams: [name], // Exemplo: ["Olá {{1}}, recebemos seu interesse..."]
                source: 'LandingPage'
            })
        });
        const data = await response.json();
        console.log('AiSensy Response:', data);
    } catch (error) {
        console.error('Erro ao enviar WhatsApp via AiSensy:', error);
    }
}

// --- ENDPOINT DO AGENTE VIRTUAL (OPENAI) ---

app.post('/api/chat', async (req, res) => {
    const { message, name, phone, history = [] } = req.body;

    // Se for a primeira mensagem, envia notificação de WhatsApp (Lead)
    if (history.length === 0 && name && phone) {
        // Notificação via WhatsApp desativada devido às limitações do plano gratuito da AiSensy (API Outbound bloqueada).
        // O contato agora é iniciado pelo usuário via botão no frontend.
        console.log(`Novo lead capturado no chat: ${name} (${phone})`);
    }

    try {
        const systemPrompt = `
            Você é o "Morona", o Agente Virtual acolhedor e elucidativo da MoronaVila. Sua missão é guiar interessados pela experiência de morar na Vila Isabel com silêncio, ordem e privacidade.

            SOBRE A MORONAVILA:
            - CONCEITO: Solução ideal para quem busca foco total em estudos e trabalho, com infraestrutura simples, funcional e muito tranquila.
            - LOCALIZAÇÃO: Rua Torres Homem 886, no coração de Vila Isabel, Rio de Janeiro. 
                - Referências: A 100 metros da quadra da Unidos de Vila Isabel, pertinho da Praça Sete e a apenas 200 metros do Shopping Boulevard.
            - VIZINHANÇA ESTRATÉGICA: Vila Isabel é o reduto boêmio mais charmoso do Rio. Comércio farto 24h na porta: Food Trucks, Restaurantes, Academias, Supermercados, Farmácias 24h e Padarias a 2 minutos de distância.
            - ACESSIBILIDADE E PROXIMIDADE:
                - Estudo/Saúde: Localização privilegiada para quem estuda ou trabalha na UERJ (Campus Maracanã), Hospital Universitário Pedro Ernesto (HUPE), UVA (Tijuca), IFF e outras unidades na região do Maracanã/Tijuca.
                - Mobilidade: Centenas de opções de transporte para todo o Rio. Estamos a 20 minutos do Centro e 30 minutos da Zona Sul.

            INFRAESTRUTURA E ACOMODAÇÕES:
            - Quartos: Simples, funcionais e focados no descanso e estudo. Mobiliário completo: cama, armários, mesa de estudo e instalação para antena de TV.
            - Tipos e Valores:
                - Individuais: R$ 850 + taxas (com banheiro privativo).
                - Compartilhados: R$ 500 + taxas (até 3 pessoas, EXCLUSIVO para homens).
            - Tecnologia e Conforto: Interfone com ramal exclusivo em cada quarto (privacidade total), internet de alta velocidade em toda a propriedade, controle de água e energia individualizados e sistema de climatização para o calor do Rio.
            - Áreas Comuns: Copa-Cozinha equipada com armários individuais com chave (para mantimentos), geladeiras (uma para cada 4 pessoas), microondas e forno elétrico. Lavanderia, Sala de TV, Sala de Estudo e uma ampla área externa arborizada para relaxar.

            REGRAS DE CONVIVÊNCIA (SÍNTESE: "Mantenha o ambiente tão bom para os outros quanto você gostaria para você"):
            - Proibições: NÃO é permitido visitas, NÃO é permitido fumar, NÃO é permitido animais.
            - Ordem: Manter quarto, cozinha e lavanderia sempre limpos e arrumados após o uso.
            - Silêncio: O barulho deve ser evitado a TODO momento (não apenas após as 22h) para não incomodar outros residentes. Som e TV apenas em limites razoáveis.

            PROCESSO DE ENTRADA:
            1. Preenchimento de formulário completo para análise.
            2. Se aprovado: Pagamento do aluguel do mês + 1 mês de depósito (caução) + Depósito das chaves (R$ 65).

            DIRETRIZES DE COMUNICAÇÃO:
            - PERSONA: Seja acolhedor, empático e elucidativo. Use o nome (${name || 'Interessado'}).
            - ESTILO: Explique as regras de forma positiva (foco no benefício do silêncio e ordem para quem estuda/trabalha).
            - ENCERRAMENTO: Se o interesse for alto, peça para finalizarem os dados aqui no formulário ou sugerir o contato via WhatsApp para agendar visita.
        `;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                ...history,
                { role: "user", content: message }
            ],
            max_tokens: 800,
            temperature: 0.7
        });

        const response = completion.choices[0].message.content;
        res.json({ response });

    } catch (error: any) {
        console.error('Erro no Chat OpenAI:', error);
        res.status(500).json({ error: 'Erro ao processar mensagem do chat' });
    }
});

// --- SERVIR FRONTEND ESTÁTICO EM PRODUÇÃO ---

// Servir arquivos da pasta dist
app.use(express.static(path.join(__dirname, 'dist')));

// Catch-all: qualquer rota que não seja API ou arquivo estático volta para o index.html
// Isso permite que o React Router funcione corretamente ao dar refresh
app.get('*', (req, res) => {
    // Se não for uma rota de API, serve o index.html do frontend
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    } else {
        res.status(404).json({ error: 'Endpoint de API não encontrado' });
    }
});

app.listen(port, () => {
    console.log(`--------------------------------------------------`);
    console.log(`MoronaVila (v1.5) rodando na porta: ${port}`);
    console.log(`Ambiente: ${process.env.NODE_ENV || 'production'}`);
    console.log(`--------------------------------------------------`);
});
