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
const ASAAS_WEBHOOK_SECRET = process.env.ASAAS_WEBHOOK_SECRET || '';
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
const SOFTPHONE_DOOR_MODE = process.env.VITE_SOFTPHONE_DOOR_MODE || 'none';
const SOFTPHONE_DOOR_LABEL = process.env.VITE_SOFTPHONE_DOOR_LABEL || 'Abrir porta';
const SOFTPHONE_DOOR_DTMF = process.env.VITE_SOFTPHONE_DOOR_DTMF || '9';
const SOFTPHONE_DOOR_RELAY_URL = process.env.SOFTPHONE_DOOR_RELAY_URL || '';

app.use(express.json({ limit: '1mb' }));

type AuthenticatedRequest = express.Request & {
    authUser?: {
        id: string;
        email?: string | null;
    };
    authResident?: any;
};

const requestBuckets = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: express.Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.trim()) {
        return forwarded.split(',')[0].trim();
    }
    return req.ip || req.socket.remoteAddress || 'unknown';
}

function consumeRateLimit(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const bucket = requestBuckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
        requestBuckets.set(key, {
            count: 1,
            resetAt: now + windowMs
        });
        return true;
    }

    if (bucket.count >= limit) {
        return false;
    }

    bucket.count += 1;
    return true;
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

async function requireAuthenticatedResident(
    req: AuthenticatedRequest,
    res: express.Response,
    next: express.NextFunction
) {
    const authorizationHeader = req.headers.authorization || '';
    const token = authorizationHeader.startsWith('Bearer ')
        ? authorizationHeader.slice('Bearer '.length).trim()
        : '';

    if (!token) {
        return res.status(401).json({ error: 'Autenticacao obrigatoria.' });
    }

    const authResult = await supabase.auth.getUser(token);
    const authUser = authResult.data.user;

    if (authResult.error || !authUser) {
        return res.status(401).json({ error: 'Sessao invalida ou expirada.' });
    }

    const residentResult = await supabase
        .from('residents')
        .select('id, auth_id, name, email, role, room_id, mac_address, internet_active, softphone_enabled, softphone_extension, softphone_display_name, bed_identifier, phone, habilitado')
        .eq('auth_id', authUser.id)
        .maybeSingle();

    if (residentResult.error || !residentResult.data) {
        return res.status(403).json({ error: 'Cadastro do morador nao encontrado.' });
    }

    if (residentResult.data.role === 'Morador' && residentResult.data.habilitado === false) {
        return res.status(403).json({ error: 'Acesso desabilitado para este morador.' });
    }

    req.authUser = {
        id: authUser.id,
        email: authUser.email
    };
    req.authResident = residentResult.data;

    next();
}

function requireAdminRole(
    req: AuthenticatedRequest,
    res: express.Response,
    next: express.NextFunction
) {
    if (req.authResident?.role !== 'Administrador') {
        return res.status(403).json({ error: 'Acesso restrito a administradores.' });
    }

    next();
}

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

function getResidentSoftphoneBlockers(resident: any): string[] {
    const blockers: string[] = [];

    if (resident?.role !== 'Morador') return blockers;
    if (resident?.habilitado === false) blockers.push('Residente desabilitado');
    if (resident?.softphone_enabled === false) blockers.push('Softphone desativado');
    if (!buildSuggestedResidentExtension(resident)) blockers.push('Sem ramal definido');
    if (SOFTPHONE_REQUIRE_INTERNET_ACTIVE && resident?.internet_active !== true) {
        blockers.push('Internet inativa');
    }
    if (!resident?.mac_address) blockers.push('Sem MAC principal');

    return blockers;
}

function isResidentMessageUnread(item: any): boolean {
    return !item?.read_at;
}

function isResidentMessagePending(item: any): boolean {
    return !item?.resolved_at;
}

function buildPaymentReminderMessage(payment: any) {
    const isOverdue = payment?.status === 'Atrasado';
    const dueDate = payment?.due_date
        ? new Date(payment.due_date).toLocaleDateString('pt-BR')
        : 'sem vencimento';

    return {
        id: `payment-${payment.id}`,
        source: 'system',
        channel: 'note',
        category: 'payment',
        title: isOverdue ? 'Pagamento atrasado' : 'Lembrete de pagamento',
        body: isOverdue
            ? `${payment.description || 'Cobranca em aberto'} venceu em ${dueDate}.`
            : `${payment.description || 'Pagamento pendente'} com vencimento em ${dueDate}.`,
        createdAt: payment?.due_date || new Date().toISOString(),
        unread: true,
        pending: true
    };
}

function buildMaintenanceReminderMessage(item: any) {
    return {
        id: `maintenance-${item.id}`,
        source: 'system',
        channel: 'note',
        category: 'maintenance',
        title:
            item?.status === 'Em Andamento'
                ? 'Reparo em andamento'
                : 'Reparo aberto',
        body: item?.title
            ? `${item.title}: ${item.description || 'Sua solicitacao segue em acompanhamento.'}`
            : 'Existe uma manutencao vinculada ao seu ambiente.',
        createdAt: item?.created_at || new Date().toISOString(),
        unread: true,
        pending: true
    };
}

async function loadSoftphoneInboxData(resident: any) {
    const [messagesResult, paymentsResult, maintenanceResult] = await Promise.all([
        supabase
            .from('resident_messages')
            .select('*')
            .eq('resident_id', resident.id)
            .order('created_at', { ascending: false })
            .limit(20),
        supabase
            .from('payments')
            .select('id, due_date, status, description')
            .eq('resident_id', resident.id)
            .in('status', ['Pendente', 'Atrasado'])
            .order('due_date', { ascending: true })
            .limit(6),
        resident.room_id
            ? supabase
                .from('maintenance_requests')
                .select('id, title, description, status, created_at, room_id, requested_by')
                .eq('room_id', resident.room_id)
                .in('status', ['Aberto', 'Em Andamento'])
                .order('created_at', { ascending: false })
                .limit(6)
            : Promise.resolve({ data: [], error: null } as any)
    ]);

    const persistedMessages = messagesResult.error ? [] : (messagesResult.data || []);
    const syntheticPaymentMessages = paymentsResult.error
        ? []
        : (paymentsResult.data || []).map(buildPaymentReminderMessage);
    const syntheticMaintenanceMessages = maintenanceResult.error
        ? []
        : (maintenanceResult.data || []).map(buildMaintenanceReminderMessage);

    const persistedItems = persistedMessages.map((item: any) => ({
        id: item.id,
        source: 'manual',
        channel: item.channel,
        category: item.category,
        title: item.title,
        body: item.body,
        createdAt: item.created_at,
        unread: isResidentMessageUnread(item),
        pending: item.channel === 'package' ? isResidentMessagePending(item) : isResidentMessageUnread(item)
    }));

    const items = [...persistedItems, ...syntheticPaymentMessages, ...syntheticMaintenanceMessages]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const summary = {
        voiceUnreadCount: persistedItems.filter((item) => item.channel === 'voice' && item.unread).length,
        notesUnreadCount: items.filter((item) => item.channel === 'note' && item.unread).length,
        pendingPackagesCount: persistedItems.filter((item) => item.channel === 'package' && item.pending).length
    };

    return {
        resident,
        summary: {
            ...summary,
            totalAttentionItems:
                summary.voiceUnreadCount + summary.notesUnreadCount + summary.pendingPackagesCount
        },
        items: items.slice(0, 10)
    };
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
        },
        door: {
            mode: ['dtmf', 'http-relay', 'extension'].includes(SOFTPHONE_DOOR_MODE) ? SOFTPHONE_DOOR_MODE : 'none',
            label: SOFTPHONE_DOOR_LABEL,
            dtmf: SOFTPHONE_DOOR_DTMF
        }
    });
});

app.get('/api/softphone/directory', async (req, res) => {
    return requireAuthenticatedResident(req as AuthenticatedRequest, res, async () => {
        const resident = (req as AuthenticatedRequest).authResident;
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

        return res.json({
            resident: {
                id: resident.id,
                habilitado: resident.habilitado !== false,
                softphoneEnabled: resident.softphone_enabled !== false,
                internetActive: resident.internet_active === true
            },
            directory
        });
    });
});

app.get('/api/softphone/config', async (req, res) => {
    return requireAuthenticatedResident(req as AuthenticatedRequest, res, async () => {
        const resident = (req as AuthenticatedRequest).authResident;
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
                habilitado: resident.habilitado !== false,
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
});
app.get('/api/softphone/inbox', async (req, res) => {
    return requireAuthenticatedResident(req as AuthenticatedRequest, res, async () => {
        const resident = (req as AuthenticatedRequest).authResident;
        const payload = await loadSoftphoneInboxData(resident);
        return res.json({
            generatedAt: new Date().toISOString(),
            resident: {
                id: payload.resident.id,
                name: payload.resident.name,
                habilitado: payload.resident.habilitado !== false,
                internetActive: payload.resident.internet_active === true,
                softphoneEnabled: payload.resident.softphone_enabled !== false
            },
            summary: payload.summary,
            items: payload.items
        });
    });
});
app.post('/api/softphone/inbox/:messageId/read', async (req, res) => {
    return requireAuthenticatedResident(req as AuthenticatedRequest, res, async () => {
        const { messageId } = req.params;
        const resident = (req as AuthenticatedRequest).authResident;
        const result = await supabase
            .from('resident_messages')
            .update({ read_at: new Date().toISOString() })
            .eq('id', messageId)
            .eq('resident_id', resident.id)
            .select('*')
            .maybeSingle();
        if (result.error) {
            return res.status(500).json({ error: 'Nao foi possivel marcar o recado como lido.' });
        }
        if (!result.data) {
            return res.status(404).json({ error: 'Recado nao encontrado.' });
        }
        return res.json({
            ok: true,
            message: result.data
        });
    });
});
app.get('/api/softphone/health', async (req, res) => {
    return requireAuthenticatedResident(req as AuthenticatedRequest, res, async () => {
        return requireAdminRole(req as AuthenticatedRequest, res, async () => {
            const missing = [];
            const supportedDoorModes = ['dtmf', 'http-relay', 'extension'];
            const doorMode = supportedDoorModes.includes(SOFTPHONE_DOOR_MODE) ? SOFTPHONE_DOOR_MODE : 'none';
            if (!SOFTPHONE_ENABLED) missing.push('VITE_SOFTPHONE_ENABLED');
            if (!SOFTPHONE_PBX_HOST) missing.push('VITE_SOFTPHONE_PBX_HOST');
            if (!SOFTPHONE_PBX_DOMAIN) missing.push('VITE_SOFTPHONE_PBX_DOMAIN');
            if (!SOFTPHONE_PBX_WSS_URL) missing.push('VITE_SOFTPHONE_PBX_WSS_URL');
            if (SOFTPHONE_TRANSPORT === 'sipjs' && !SOFTPHONE_PBX_DEFAULT_SECRET) {
                missing.push('SOFTPHONE_PBX_DEFAULT_SECRET');
            }
            if (doorMode === 'http-relay' && !SOFTPHONE_DOOR_RELAY_URL) {
                missing.push('SOFTPHONE_DOOR_RELAY_URL');
            }
            return res.json({
                ok: missing.length === 0,
                transport: SOFTPHONE_TRANSPORT,
                enabled: SOFTPHONE_ENABLED,
                configured: Boolean(SOFTPHONE_PBX_HOST && SOFTPHONE_PBX_DOMAIN && SOFTPHONE_PBX_WSS_URL),
                door: {
                    mode: doorMode,
                    label: SOFTPHONE_DOOR_LABEL,
                    configured: doorMode === 'none'
                        ? false
                        : doorMode === 'http-relay'
                            ? Boolean(SOFTPHONE_DOOR_RELAY_URL)
                            : true,
                    dtmf: doorMode === 'dtmf' ? SOFTPHONE_DOOR_DTMF : null,
                },
                missing,
                recommendations: missing.length === 0
                    ? ['Softphone pronto para testes de registro SIP no navegador.']
                    : [
                        'Preencha as vari??veis ausentes no .env.local.',
                        'Reinicie o mac-server depois de alterar as vari??veis.',
                        'Use npm run softphone:doctor para conferir o ambiente local.'
                    ]
            });
        });
    });
});
app.get('/api/softphone/rollout', async (req, res) => {
    return requireAuthenticatedResident(req as AuthenticatedRequest, res, async () => {
        return requireAdminRole(req as AuthenticatedRequest, res, async () => {
            const result = await supabase
                .from('residents')
                .select('id, name, email, phone, role, mac_address, bed_identifier, softphone_extension, softphone_display_name, softphone_enabled, internet_active, habilitado')
                .order('name', { ascending: true });
            if (result.error) {
                return res.status(500).json({ error: 'Nao foi possivel carregar o rollout do softphone.' });
            }
            const residents = (result.data || []).filter((resident: any) => resident.role === 'Morador');
            const items = residents.map((resident: any) => {
                const suggestedExtension = buildSuggestedResidentExtension(resident);
                const blockers = getResidentSoftphoneBlockers(resident);
                return {
                    id: resident.id,
                    name: resident.name,
                    email: resident.email,
                    phone: resident.phone,
                    extension: suggestedExtension,
                    displayName: resident.softphone_display_name || resident.name || null,
                    habilitado: resident.habilitado !== false,
                    internetActive: resident.internet_active === true,
                    softphoneEnabled: resident.softphone_enabled !== false,
                    macAddress: resident.mac_address || null,
                    ready: blockers.length === 0,
                    blockers,
                };
            });
            const summary = {
                totalResidents: items.length,
                ready: items.filter((item) => item.ready).length,
                enabled: items.filter((item) => item.softphoneEnabled).length,
                missingExtension: items.filter((item) => item.blockers.includes('Sem ramal definido')).length,
                internetInactive: items.filter((item) => item.blockers.includes('Internet inativa')).length,
                disabled: items.filter((item) => item.blockers.includes('Softphone desativado')).length,
                residentDisabled: items.filter((item) => item.blockers.includes('Residente desabilitado')).length,
                missingMac: items.filter((item) => item.blockers.includes('Sem MAC principal')).length,
            };
            return res.json({
                generatedAt: new Date().toISOString(),
                requireInternetActive: SOFTPHONE_REQUIRE_INTERNET_ACTIVE,
                summary,
                items,
            });
        });
    });
});
app.post('/api/softphone/door/open', async (req, res) => {
    return requireAuthenticatedResident(req as AuthenticatedRequest, res, async () => {
        const supportedModes = ['dtmf', 'http-relay', 'extension'];
        const mode = supportedModes.includes(SOFTPHONE_DOOR_MODE) ? SOFTPHONE_DOOR_MODE : 'none';
        if (mode === 'none') {
            return res.json({
                ok: false,
                supported: false,
                mode,
                label: SOFTPHONE_DOOR_LABEL,
                message: 'Abertura de porta ainda nao configurada. Defina o modo no .env.local quando a infraestrutura estiver pronta.'
            });
        }
        if (mode === 'http-relay' && !SOFTPHONE_DOOR_RELAY_URL) {
            return res.json({
                ok: false,
                supported: false,
                mode,
                label: SOFTPHONE_DOOR_LABEL,
                message: 'Modo HTTP relay selecionado, mas SOFTPHONE_DOOR_RELAY_URL ainda nao foi preenchida.'
            });
        }
        return res.json({
            ok: false,
            supported: true,
            mode,
            label: SOFTPHONE_DOOR_LABEL,
            dtmf: mode === 'dtmf' ? SOFTPHONE_DOOR_DTMF : null,
            relayUrlConfigured: mode === 'http-relay' ? Boolean(SOFTPHONE_DOOR_RELAY_URL) : null,
            message: mode === 'dtmf'
                ? 'Fluxo de porta preparado para DTMF. Falta ligar o comando ao transporte SIP ativo.'
                : mode === 'http-relay'
                    ? 'Fluxo de porta preparado para relay HTTP. Falta executar a chamada real ao controlador de acesso.'
                    : 'Fluxo de porta preparado para extensao dedicada. Falta ligar a acao ao PBX real.'
        });
    });
});

// FunÃ§Ã£o para obter o MAC a partir do IP (Windows)obter o MAC a partir do IP (Windows)
async function getMacFromIp(ip: string): Promise<string | null> {
    try {
        // Para localhost em Windows, o ARP nÃ£o funciona da mesma forma, mas na rede sim.
        if (ip === '::1' || ip === '127.0.0.1') return 'Dispositivo Local (Servidor)';

        const { stdout } = await execPromise(`arp -a ${ip}`);
        const lines = stdout.split('\n');
        for (const line of lines) {
            if (line.includes(ip)) {
                const parts = line.trim().split(/\s+/);
                // O MAC costuma ser a segunda ou terceira coluna dependendo do SO/VersÃ£o
                const macMatch = parts.find(p => /([0-9a-fA-F]{2}[:-]){5}([0-9a-fA-F]{2})/.test(p));
                return macMatch || 'NÃ£o encontrado';
            }
        }
        return 'NÃ£o mapeado no ARP';
    } catch (error) {
        console.error('Erro ao buscar MAC:', error);
        return 'Erro na detecÃ§Ã£o';
    }
}

app.get('/mac', async (req, res) => {
    const ip = req.ip?.replace('::ffff:', '') || '0.0.0.0';
    const mac = await getMacFromIp(ip);
    const safeIp = escapeHtml(ip);
    const safeMac = escapeHtml(mac || 'Nao identificado');

    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');

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
        <div class="mac-box">${safeMac}</div>
        <div class="label">Seu IP na rede: ${safeIp}</div>
        <button class="btn" onclick="copyMac()">Copiar MAC Address</button>
        <p class="info">
            Este cÃ³digo Ã© necessÃ¡rio para liberar o acesso Ã  internet na MoronaVila. 
            Copie e cole no seu perfil no aplicativo principal.
        </p>
    </div>

    <script>
        function copyMac() {
            const mac = ${JSON.stringify(mac || 'Nao identificado')};
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
    return requireAuthenticatedResident(req as AuthenticatedRequest, res, async () => {
        const { residentId, paymentId } = req.body || {};
        const authReq = req as AuthenticatedRequest;
        const authResident = authReq.authResident;
        const isAdmin = authResident?.role === 'Administrador';
        const targetResidentId = isAdmin && residentId ? residentId : authResident.id;

        if (!paymentId) {
            return res.status(400).json({ success: false, error: 'paymentId obrigatorio.' });
        }

        try {
            const paymentResult = await supabase
                .from('payments')
                .select('id, resident_id, amount, due_date, description, month, external_id, pix_qr_code, pix_copy_paste, expiration_date')
                .eq('id', paymentId)
                .eq('resident_id', targetResidentId)
                .maybeSingle();

            if (paymentResult.error || !paymentResult.data) {
                return res.status(404).json({ success: false, error: 'Pagamento nao encontrado para o residente autenticado.' });
            }

            const payment = paymentResult.data;

            if (payment.pix_qr_code && payment.pix_copy_paste) {
                return res.json({
                    success: true,
                    qrCode: payment.pix_qr_code,
                    copyPaste: payment.pix_copy_paste,
                    expirationDate: payment.expiration_date || null
                });
            }

            const residentResult = await supabase
                .from('residents')
                .select('id, name, email')
                .eq('id', targetResidentId)
                .maybeSingle();

            if (residentResult.error || !residentResult.data) {
                return res.status(404).json({ success: false, error: 'Residente nao encontrado.' });
            }

            const resident = residentResult.data;
            const response = await fetch(`${ASAAS_API_URL}/payments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'access_token': ASAAS_API_KEY
                },
                body: JSON.stringify({
                    billingType: 'PIX',
                    customer: targetResidentId,
                    name: resident.name,
                    email: resident.email,
                    value: payment.amount,
                    description: payment.description || `VPR Manager - ${payment.month}`,
                    externalReference: payment.id,
                    dueDate: payment.due_date || new Date().toISOString().split('T')[0]
                })
            });

            const paymentData = await response.json();
            if (!response.ok) {
                throw new Error(paymentData.errors?.[0]?.description || 'Erro no Asaas');
            }

            const qrResponse = await fetch(`${ASAAS_API_URL}/payments/${paymentData.id}/pixQrCode`, {
                headers: { 'access_token': ASAAS_API_KEY }
            });
            const qrData = await qrResponse.json();

            await supabase
                .from('payments')
                .update({
                    external_id: paymentData.id,
                    pix_qr_code: qrData.encodedImage,
                    pix_copy_paste: qrData.payload,
                    expiration_date: qrData.expirationDate
                })
                .eq('id', payment.id)
                .eq('resident_id', targetResidentId);

            return res.json({
                success: true,
                qrCode: qrData.encodedImage,
                copyPaste: qrData.payload,
                expirationDate: qrData.expirationDate
            });
        } catch (err: any) {
            console.error('Erro PIX:', err);
            return res.status(500).json({ success: false, error: err.message });
        }
    });
});

app.post('/api/payments/webhook', async (req, res) => {
    if (!ASAAS_WEBHOOK_SECRET) {
        console.warn('ASAAS_WEBHOOK_SECRET nao configurada no .env.local');
        return res.status(503).json({ error: 'Webhook de pagamentos indisponivel.' });
    }

    const providedSecret =
        req.headers['x-asaas-webhook-secret'] ||
        req.headers['asaas-access-token'] ||
        req.headers['x-webhook-secret'];

    if (providedSecret !== ASAAS_WEBHOOK_SECRET) {
        return res.status(401).json({ error: 'Webhook nao autorizado.' });
    }

    const event = req.body;
    console.log('Webhook Asaas recebido:', event.event);

    if ((event.event === 'PAYMENT_RECEIVED' || event.event === 'PAYMENT_CONFIRMED') && event.payment?.externalReference) {
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

// --- UTILITÃRIOS ---

async function sendWhatsAppNotification(name: string, phone: string) {
    const AISENSY_KEY = process.env.AISENSY_API_KEY;
    if (!AISENSY_KEY) {
        console.warn('AISENSY_API_KEY nÃ£o configurada no .env.local');
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
                templateParams: [name], // Exemplo: ["OlÃ¡ {{1}}, recebemos seu interesse..."]
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
    const clientIp = getClientIp(req);
    if (!consumeRateLimit(`chat:${clientIp}`, 12, 5 * 60 * 1000)) {
        return res.status(429).json({ error: 'Muitas mensagens em pouco tempo. Tente novamente em alguns minutos.' });
    }

    const { message, name, phone, history = [] } = req.body || {};
    const safeMessage = typeof message === 'string' ? message.trim() : '';
    const safeName = typeof name === 'string' ? name.trim().slice(0, 80) : '';
    const safePhone = typeof phone === 'string' ? phone.trim().slice(0, 30) : '';
    const safeHistory = Array.isArray(history)
        ? history
            .filter((item: any) => item && (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string')
            .slice(-12)
            .map((item: any) => ({
                role: item.role,
                content: item.content.trim().slice(0, 1200)
            }))
        : [];

    if (!safeMessage) {
        return res.status(400).json({ error: 'Mensagem obrigatoria.' });
    }

    if (safeMessage.length > 1200) {
        return res.status(400).json({ error: 'Mensagem muito longa.' });
    }

    // Se for a primeira mensagem, envia notificaÃ§Ã£o de WhatsApp (Lead)
    if (safeHistory.length === 0 && safeName && safePhone) {
        // NotificaÃ§Ã£o via WhatsApp desativada devido Ã s limitaÃ§Ãµes do plano gratuito da AiSensy (API Outbound bloqueada).
        // O contato agora Ã© iniciado pelo usuÃ¡rio via botÃ£o no frontend.
        console.log(`Novo lead capturado no chat: ${safeName} (${safePhone})`);
    }

    try {
        const systemPrompt = `
            VocÃª Ã© o "Morona", o Agente Virtual acolhedor e elucidativo da MoronaVila. Sua missÃ£o Ã© guiar interessados pela experiÃªncia de morar na Vila Isabel com silÃªncio, ordem e privacidade.

            SOBRE A MORONAVILA:
            - CONCEITO: SoluÃ§Ã£o ideal para quem busca foco total em estudos e trabalho, com infraestrutura simples, funcional e muito tranquila.
            - LOCALIZAÃ‡ÃƒO: Rua Torres Homem 886, no coraÃ§Ã£o de Vila Isabel, Rio de Janeiro. 
                - ReferÃªncias: A 100 metros da quadra da Unidos de Vila Isabel, pertinho da PraÃ§a Sete e a apenas 200 metros do Shopping Boulevard.
            - VIZINHANÃ‡A ESTRATÃ‰GICA: Vila Isabel Ã© o reduto boÃªmio mais charmoso do Rio. ComÃ©rcio farto 24h na porta: Food Trucks, Restaurantes, Academias, Supermercados, FarmÃ¡cias 24h e Padarias a 2 minutos de distÃ¢ncia.
            - ACESSIBILIDADE E PROXIMIDADE:
                - Estudo/SaÃºde: LocalizaÃ§Ã£o privilegiada para quem estuda ou trabalha na UERJ (Campus MaracanÃ£), Hospital UniversitÃ¡rio Pedro Ernesto (HUPE), UVA (Tijuca), IFF e outras unidades na regiÃ£o do MaracanÃ£/Tijuca.
                - Mobilidade: Centenas de opÃ§Ãµes de transporte para todo o Rio. Estamos a 20 minutos do Centro e 30 minutos da Zona Sul.

            INFRAESTRUTURA E ACOMODAÃ‡Ã•ES:
            - Quartos: Simples, funcionais e focados no descanso e estudo. MobiliÃ¡rio completo: cama, armÃ¡rios, mesa de estudo e instalaÃ§Ã£o para antena de TV.
            - Tipos e Valores:
                - Individuais: R$ 850 + taxas (com banheiro privativo).
                - Compartilhados: R$ 500 + taxas (atÃ© 3 pessoas, EXCLUSIVO para homens).
            - Tecnologia e Conforto: Interfone com ramal exclusivo em cada quarto (privacidade total), internet de alta velocidade em toda a propriedade, controle de Ã¡gua e energia individualizados e sistema de climatizaÃ§Ã£o para o calor do Rio.
            - Ãreas Comuns: Copa-Cozinha equipada com armÃ¡rios individuais com chave (para mantimentos), geladeiras (uma para cada 4 pessoas), microondas e forno elÃ©trico. Lavanderia, Sala de TV, Sala de Estudo e uma ampla Ã¡rea externa arborizada para relaxar.

            REGRAS DE CONVIVÃŠNCIA (SÃNTESE: "Mantenha o ambiente tÃ£o bom para os outros quanto vocÃª gostaria para vocÃª"):
            - ProibiÃ§Ãµes: NÃƒO Ã© permitido visitas, NÃƒO Ã© permitido fumar, NÃƒO Ã© permitido animais.
            - Ordem: Manter quarto, cozinha e lavanderia sempre limpos e arrumados apÃ³s o uso.
            - SilÃªncio: O barulho deve ser evitado a TODO momento (nÃ£o apenas apÃ³s as 22h) para nÃ£o incomodar outros residentes. Som e TV apenas em limites razoÃ¡veis.

            PROCESSO DE ENTRADA:
            1. Preenchimento de formulÃ¡rio completo para anÃ¡lise.
            2. Se aprovado: Pagamento do aluguel do mÃªs + 1 mÃªs de depÃ³sito (cauÃ§Ã£o) + DepÃ³sito das chaves (R$ 65).

            DIRETRIZES DE COMUNICAÃ‡ÃƒO:
            - PERSONA: Seja acolhedor, empÃ¡tico e elucidativo. Use o nome (${safeName || 'Interessado'}).
            - ESTILO: Explique as regras de forma positiva (foco no benefÃ­cio do silÃªncio e ordem para quem estuda/trabalha).
            - ENCERRAMENTO: Se o interesse for alto, peÃ§a para finalizarem os dados aqui no formulÃ¡rio ou sugerir o contato via WhatsApp para agendar visita.
        `;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                ...safeHistory,
                { role: "user", content: safeMessage }
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

// --- SERVIR FRONTEND ESTÃTICO EM PRODUÃ‡ÃƒO ---

// Servir arquivos da pasta dist
app.use(express.static(path.join(__dirname, 'dist')));

// Catch-all: qualquer rota que nÃ£o seja API ou arquivo estÃ¡tico volta para o index.html
// Isso permite que o React Router funcione corretamente ao dar refresh
app.get('*', (req, res) => {
    // Se nÃ£o for uma rota de API, serve o index.html do frontend
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    } else {
        res.status(404).json({ error: 'Endpoint de API nÃ£o encontrado' });
    }
});

app.listen(port, () => {
    console.log(`--------------------------------------------------`);
    console.log(`MoronaVila (v1.5) rodando na porta: ${port}`);
    console.log(`Ambiente: ${process.env.NODE_ENV || 'production'}`);
    console.log(`--------------------------------------------------`);
});


