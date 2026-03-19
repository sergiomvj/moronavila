import React, { useEffect, useState } from 'react';
import { Wifi, Router, AlertTriangle, ShieldCheck, Laptop, Smartphone, Plus, Trash2, Edit, PhoneCall, RefreshCw } from 'lucide-react';
import { Resident, Device, UserRole } from '../types';
import { createDevice, updateDevice, deleteDevice } from '../lib/database';
import {
    fetchSoftphoneHealth,
    fetchSoftphoneRollout,
    triggerSoftphoneDoorOpen,
    type SoftphoneDoorResponse,
    type SoftphoneHealthResponse,
    type SoftphoneRolloutResponse
} from '../modules/softphone/api';

interface InternetViewProps {
    residents: Resident[];
    devices: Device[];
    currentUser: Resident;
    onUpdate: () => void;
}

export function InternetView({ residents, devices, currentUser, onUpdate }: InternetViewProps) {
    const isAdmin = currentUser.role === UserRole.ADMIN;
    const [softphoneHealth, setSoftphoneHealth] = useState<SoftphoneHealthResponse | null>(null);
    const [loadingSoftphoneHealth, setLoadingSoftphoneHealth] = useState(false);
    const [testingDoor, setTestingDoor] = useState(false);
    const [doorTestResult, setDoorTestResult] = useState<SoftphoneDoorResponse | null>(null);
    const [softphoneRollout, setSoftphoneRollout] = useState<SoftphoneRolloutResponse | null>(null);
    const [softphoneRolloutSearch, setSoftphoneRolloutSearch] = useState('');
    const [softphoneRolloutFilter, setSoftphoneRolloutFilter] = useState<
        'all' | 'ready' | 'missing-extension' | 'internet-inactive' | 'disabled' | 'resident-disabled' | 'blocked-with-reason' | 'eligibility-review' | 'missing-mac'
    >('all');

    // View state
    const [isAdding, setIsAdding] = useState(false);
    const [newDevice, setNewDevice] = useState<Partial<Device>>({
        device_type: 'Celular',
        mac_address: '',
        status: isAdmin ? 'Ativo' : 'Pendente' // Admins auto aprovam
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Para ediÃ§Ã£o admin
    const [editingDevice, setEditingDevice] = useState<string | null>(null);

    const eligibleResidents = residents.filter(r => r.role === UserRole.RESIDENT && r.habilitado !== false);
    const activeUsers = residents.filter(r => r.habilitado !== false && r.internet_active);
    const inactiveUsers = residents.filter(r => r.habilitado !== false && !r.internet_active && r.mac_address);
    const noMacUsers = residents.filter(r => r.habilitado !== false && !r.mac_address);
    const softphoneEnabledResidents = eligibleResidents.filter(r => r.softphone_enabled !== false);
    const softphoneReadyResidents = softphoneEnabledResidents.filter(r => r.internet_active && Boolean(r.softphone_extension));
    const softphoneMissingExtension = softphoneEnabledResidents.filter(r => !r.softphone_extension);
    const softphoneBlockedByInternet = softphoneEnabledResidents.filter(r => !r.internet_active);
    const softphoneDisabledResidents = residents.filter(r => r.role === UserRole.RESIDENT && (r.habilitado === false || r.softphone_enabled === false));
    const softphoneRolloutQueue = residents
        .filter(r => r.role === UserRole.RESIDENT)
        .map(resident => {
            const blockers: string[] = [];
            if (resident.habilitado === false) blockers.push('Residente desabilitado');
            if (resident.softphone_enabled === false) blockers.push('Softphone desativado');
            if (!resident.softphone_extension) blockers.push('Sem ramal definido');
            if (!resident.internet_active) blockers.push('Internet inativa');
            if (!resident.mac_address) blockers.push('Sem MAC principal');

            return {
                resident,
                ready: blockers.length === 0,
                policyWarnings: [],
                blockers,
            };
        })
        .sort((a, b) => {
            if (a.ready === b.ready) return a.blockers.length - b.blockers.length;
            return a.ready ? 1 : -1;
        });
    const rolloutSummary = softphoneRollout?.summary ?? {
        totalResidents: softphoneRolloutQueue.length,
        ready: softphoneReadyResidents.length,
        enabled: softphoneEnabledResidents.filter((resident) => resident.role === UserRole.RESIDENT).length,
        missingExtension: softphoneMissingExtension.length,
        internetInactive: softphoneBlockedByInternet.length,
        disabled: softphoneDisabledResidents.length,
        residentDisabled: softphoneRolloutQueue.filter(({ blockers }) => blockers.includes('Residente desabilitado')).length,
        blockedWithReason: softphoneRolloutQueue.filter(({ resident, blockers }) => blockers.includes('Residente desabilitado') && Boolean(resident.motivo_bloqueio?.trim())).length,
        blockedWithoutReason: softphoneRolloutQueue.filter(({ resident, blockers }) => blockers.includes('Residente desabilitado') && !resident.motivo_bloqueio?.trim()).length,
        missingMac: softphoneRolloutQueue.filter(({ blockers }) => blockers.includes('Sem MAC principal')).length,
        eligibilityReview: 0,
        topBlockedReasons: [],
        topPolicyWarnings: [],
    };
    const rolloutItems = softphoneRollout?.items
        ? softphoneRollout.items.map((item) => ({
            resident: {
                id: item.id,
                name: item.name,
                email: item.email,
                phone: item.phone,
                role: UserRole.RESIDENT,
                entry_date: '',
                status: 'Ativo',
                habilitado: (item as any).habilitado ?? true,
                motivo_bloqueio: (item as any).motivoBloqueio || undefined,
                internet_active: item.internetActive,
                softphone_extension: item.extension || undefined,
                softphone_enabled: item.softphoneEnabled,
                softphone_display_name: item.displayName || undefined,
                mac_address: item.macAddress || undefined,
            } as Resident,
            ready: item.ready,
            policyWarnings: item.policyWarnings || [],
            blockers: item.blockers,
        }))
        : softphoneRolloutQueue;
    const filteredSoftphoneRolloutQueue = rolloutItems.filter(({ resident, ready, blockers, policyWarnings }) => {
        const matchesSearch =
            resident.name.toLowerCase().includes(softphoneRolloutSearch.toLowerCase()) ||
            resident.email.toLowerCase().includes(softphoneRolloutSearch.toLowerCase());

        if (!matchesSearch) return false;

        switch (softphoneRolloutFilter) {
            case 'ready':
                return ready;
            case 'missing-extension':
                return blockers.includes('Sem ramal definido');
            case 'internet-inactive':
                return blockers.includes('Internet inativa');
            case 'disabled':
                return blockers.includes('Softphone desativado');
            case 'resident-disabled':
                return blockers.includes('Residente desabilitado');
            case 'blocked-with-reason':
                return blockers.includes('Residente desabilitado') && Boolean(resident.motivo_bloqueio?.trim());
            case 'eligibility-review':
                return (policyWarnings?.length || 0) > 0;
            case 'missing-mac':
                return blockers.includes('Sem MAC principal');
            default:
                return true;
        }
    });
    const rolloutBlockedReasons = rolloutSummary.topBlockedReasons?.length
        ? rolloutSummary.topBlockedReasons.map((item) => [item.reason, item.count] as const)
        : Object.entries(
            rolloutItems.reduce<Record<string, number>>((accumulator, { resident }) => {
                const reason = resident.motivo_bloqueio?.trim();
                if (!reason) return accumulator;
                accumulator[reason] = (accumulator[reason] || 0) + 1;
                return accumulator;
            }, {})
        )
            .sort((left, right) => right[1] - left[1])
            .slice(0, 4);
    const rolloutPolicyWarnings = rolloutSummary.topPolicyWarnings?.length
        ? rolloutSummary.topPolicyWarnings.map((item) => [item.warning, item.count] as const)
        : Object.entries(
            rolloutItems.reduce<Record<string, number>>((accumulator, item) => {
                item.policyWarnings?.forEach((warning) => {
                    accumulator[warning] = (accumulator[warning] || 0) + 1;
                });
                return accumulator;
            }, {})
        )
            .sort((left, right) => right[1] - left[1])
            .slice(0, 4);
    const rolloutSourceLabel = softphoneRollout?.generatedAt
        ? `Backend consolidado em ${new Date(softphoneRollout.generatedAt).toLocaleString('pt-BR')}`
        : 'Fallback local';
    const rolloutReadyPercentage = rolloutSummary.totalResidents > 0
        ? Math.round((rolloutSummary.ready / rolloutSummary.totalResidents) * 100)
        : 0;

    const activeDevices = devices.filter(d => d.status === 'Ativo');
    const pendingDevices = devices.filter(d => d.status === 'Pendente');
    const residentSoftphoneChecklist = [
        {
            label: 'Acesso habilitado no sistema',
            ok: currentUser.habilitado !== false,
            action: 'Procure a administracao para regularizar seu acesso ao app e ao softphone.',
        },
        {
            label: 'Softphone habilitado no perfil',
            ok: currentUser.softphone_enabled !== false,
            action: 'Abra seu perfil e mantenha a opcao de softphone habilitada.',
        },
        {
            label: 'Ramal configurado',
            ok: Boolean(currentUser.softphone_extension),
            action: 'PeÃ§a para a administracao definir seu ramal do softphone.',
        },
        {
            label: 'Internet ativa',
            ok: currentUser.internet_active,
            action: 'Regularize sua internet para liberar a ativacao automatica do softphone.',
        },
        {
            label: 'MAC principal cadastrado',
            ok: Boolean(currentUser.mac_address),
            action: 'Cadastre seu dispositivo principal na aba de Internet para evitar bloqueios na rede autenticada.',
        },
    ];
    const residentSoftphonePending = residentSoftphoneChecklist.filter(item => !item.ok).length;
    const residentSoftphoneActions = residentSoftphoneChecklist.filter(item => !item.ok);

    const handleExportSoftphoneRollout = () => {
        const rows = [
            ['nome', 'email', 'telefone', 'ramal', 'nome_exibicao', 'morador_habilitado', 'motivo_bloqueio', 'internet_ativa', 'softphone_habilitado', 'mac_principal', 'status_mac', 'alertas_elegibilidade', 'bloqueios'].join(','),
            ...rolloutItems.map(({ resident, blockers, policyWarnings }) => [
                resident.name,
                resident.email,
                resident.phone,
                resident.softphone_extension || '',
                resident.softphone_display_name || '',
                resident.habilitado === false ? 'nao' : 'sim',
                resident.motivo_bloqueio || '',
                resident.internet_active ? 'sim' : 'nao',
                resident.softphone_enabled === false ? 'nao' : 'sim',
                resident.mac_address || '',
                resident.mac_address ? 'ok' : 'pendente',
                (policyWarnings || []).join(' | '),
                blockers.join(' | ') || 'pronto para rollout',
            ].map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')),
        ];

        const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const dateStamp = new Date().toISOString().slice(0, 10);

        link.href = url;
        link.download = `softphone-rollout-${dateStamp}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    useEffect(() => {
        if (!isAdmin) return;
        loadSoftphoneHealth();
        loadSoftphoneRollout();
    }, [isAdmin]);

    const loadSoftphoneHealth = async () => {
        setLoadingSoftphoneHealth(true);
        try {
            const data = await fetchSoftphoneHealth();
            if (!data) throw new Error('Falha ao consultar saude do softphone');
            setSoftphoneHealth(data);
        } catch (error) {
            console.error(error);
            setSoftphoneHealth(null);
        } finally {
            setLoadingSoftphoneHealth(false);
        }
    };

    const loadSoftphoneRollout = async () => {
        try {
            const data = await fetchSoftphoneRollout();
            if (!data) throw new Error('Falha ao consultar rollout do softphone');
            setSoftphoneRollout(data);
        } catch (error) {
            console.error(error);
            setSoftphoneRollout(null);
        }
    };

    const handleRefreshSoftphoneAdmin = () => {
        loadSoftphoneHealth();
        loadSoftphoneRollout();
    };

    const handleTestDoor = async () => {
        setTestingDoor(true);
        try {
            const response = await triggerSoftphoneDoorOpen();
            setDoorTestResult(response);
        } finally {
            setTestingDoor(false);
        }
    };

    const handleSaveDevice = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDevice.mac_address) return;
        setIsSubmitting(true);
        try {
            await createDevice({
                resident_id: currentUser.id,
                device_type: newDevice.device_type as any,
                mac_address: newDevice.mac_address!,
                status: isAdmin ? 'Ativo' : 'Pendente'
            });
            onUpdate();
            setIsAdding(false);
            setNewDevice({ device_type: 'Celular', mac_address: '', status: isAdmin ? 'Ativo' : 'Pendente' });
        } catch (err) {
            alert('Erro ao salvar o dispositivo');
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteDevice = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Tem certeza que deseja remover este dispositivo?')) return;
        try {
            await deleteDevice(id);
            onUpdate();
        } catch (err) {
            console.error(err);
        }
    }

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            await updateDevice(id, { status: newStatus as any });
            onUpdate();
            setEditingDevice(null);
        } catch (err) {
            console.error(err);
        }
    };

    const myDevices = devices.filter(d => d.resident_id === currentUser.id);

    // View for MORADOR
    if (!isAdmin) {
        return (
            <div className="space-y-6 max-w-4xl mx-auto mt-6">
                <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm text-center">
                    <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Wifi size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Acesso Ã  Internet</h2>
                    <p className="text-slate-600 mb-6 max-w-lg mx-auto">
                        Seu acesso Ã  internet Ã© renovado automaticamente a cada pagamento mensal confirmado.
                        VocÃª pode cadastrar atÃ© 2 dispositivos na rede interna.
                    </p>

                    {currentUser.habilitado === false && (
                        <div className="mx-auto mb-6 max-w-2xl rounded-2xl border border-rose-200 bg-rose-50 p-4 text-left text-rose-800">
                            <div className="text-sm font-bold">Acesso desabilitado</div>
                            <div className="mt-1 text-sm">
                                Seu cadastro esta com habilitado = false. Nesse estado, o app do morador, o softphone e os fluxos operacionais ficam bloqueados.
                            </div>
                            {currentUser.motivo_bloqueio?.trim() && (
                                <div className="mt-2 text-sm font-medium">
                                    Motivo: {currentUser.motivo_bloqueio}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Ãrea de Dispositivos */}
                    <div className="text-left bg-slate-50 p-6 rounded-2xl border border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-900 text-lg">Meus Dispositivos ({myDevices.length}/2)</h3>
                            {myDevices.length < 2 && !isAdding && (
                                <button onClick={() => {
                                    const hasMobile = myDevices.some(d => d.device_type === 'Celular');
                                    setNewDevice({
                                        ...newDevice,
                                        device_type: hasMobile ? 'Computador' : 'Celular'
                                    });
                                    setIsAdding(true);
                                }} className="flex items-center gap-1 text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition">
                                    <Plus size={16} /> <span className="hidden sm:inline">Adicionar Dispositivo</span>
                                </button>
                            )}
                        </div>

                        {isAdding && (
                            <form onSubmit={handleSaveDevice} className="bg-white p-4 rounded-xl border border-slate-200 mb-4 flex flex-col md:flex-row gap-3">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Tipo</label>
                                    <select
                                        value={newDevice.device_type}
                                        onChange={(e) => setNewDevice({ ...newDevice, device_type: e.target.value as any })}
                                        className="w-full text-sm border-slate-200 rounded-lg p-2 bg-slate-50"
                                        required
                                    >
                                        {!myDevices.some(d => d.device_type === 'Celular') && <option value="Celular">Celular (1 un.)</option>}
                                        {!myDevices.some(d => d.device_type === 'Computador') && <option value="Computador">Computador (1 un.)</option>}
                                        <option value="Outro">Outro</option>
                                    </select>
                                </div>
                                <div className="flex-2">
                                    <label className="block text-xs font-bold text-slate-500 mb-1">MAC Address (Formato: 00:1A:2B:3C:4D:5E)</label>
                                    <input type="text" placeholder="00:1A:2B:3C:4D:5E" value={newDevice.mac_address} onChange={(e) => setNewDevice({ ...newDevice, mac_address: e.target.value })} className="w-full text-sm border-slate-200 rounded-lg p-2" required />
                                </div>
                                <div className="flex items-end gap-2 mt-2 md:mt-0">
                                    <button type="button" onClick={() => setIsAdding(false)} className="px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancelar</button>
                                    <button type="submit" disabled={isSubmitting} className="px-3 py-2 text-sm bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition disabled:opacity-50">Salvar</button>
                                </div>
                            </form>
                        )}

                        {myDevices.length === 0 && !isAdding ? (
                            <p className="text-sm text-slate-500 italic">Nenhum dispositivo cadastrado ainda.</p>
                        ) : (
                            <div className="space-y-3">
                                {myDevices.map(device => (
                                    <div key={device.id} className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center group">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                                                {device.device_type === 'Celular' ? <Smartphone size={18} /> : <Laptop size={18} />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 text-sm">{device.device_type}</p>
                                                <p className="text-xs text-slate-500 font-mono">{device.mac_address}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {device.status === 'Ativo' && <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Ativo</span>}
                                            {device.status === 'Pendente' && <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Pendente</span>}
                                            {device.status === 'Bloqueado' && <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Bloqueado</span>}
                                            <button onClick={(e) => handleDeleteDevice(device.id, e)} className="text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-left mt-6">
                        <div className="mb-6 rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                                    <PhoneCall size={18} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-indigo-900">Meu status do softphone</h4>
                                    <p className="text-xs text-indigo-700">
                                        {residentSoftphonePending === 0
                                            ? 'Seu cadastro esta pronto para a ativacao do softphone quando o PBX estiver disponivel.'
                                            : `Ainda faltam ${residentSoftphonePending} ajuste(s) para sua ativacao completa.`}
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                {residentSoftphoneChecklist.map((item) => (
                                    <div
                                        key={item.label}
                                        className="flex items-center justify-between rounded-xl border border-indigo-100 bg-white px-4 py-3"
                                    >
                                        <span className="text-sm text-slate-700">{item.label}</span>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${item.ok ? 'text-emerald-600' : 'text-amber-600'}`}>
                                            {item.ok ? 'ok' : 'pendente'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 text-xs text-indigo-800">
                                Ramal atual: <span className="font-bold">{currentUser.softphone_extension || 'Nao definido'}</span>
                            </div>
                            {residentSoftphoneActions.length > 0 && (
                                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                                    <div className="text-xs font-bold uppercase tracking-wider text-amber-700">
                                        Proximos passos
                                    </div>
                                    <div className="mt-2 space-y-2 text-sm text-amber-900">
                                        {residentSoftphoneActions.map((item) => (
                                            <div key={`${item.label}-action`}>{item.action}</div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <ShieldCheck size={18} className="text-indigo-600" />
                            Como encontrar seu MAC Address?
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <div className="p-3 bg-white rounded-xl border border-slate-100">
                                    <p className="text-xs font-bold text-indigo-600 mb-1">ðŸ“± Android</p>
                                    <p className="text-[11px] text-slate-600 leading-relaxed">
                                        1. Abra as <strong>ConfiguraÃ§Ãµes</strong>.<br />
                                        2. VÃ¡ em <strong>Sobre o telefone</strong> ou <strong>Rede e Internet</strong>.<br />
                                        3. Toque em <strong>Status</strong> ou <strong>Ver mais</strong>.<br />
                                        4. Procure por <strong>EndereÃ§o MAC Wi-Fi</strong>.
                                    </p>
                                </div>
                                <div className="p-3 bg-white rounded-xl border border-slate-100">
                                    <p className="text-xs font-bold text-indigo-600 mb-1">ðŸŽ iOS (iPhone/iPad)</p>
                                    <p className="text-[11px] text-slate-600 leading-relaxed">
                                        1. VÃ¡ em <strong>Ajustes</strong>.<br />
                                        2. Toque em <strong>Geral</strong> e depois em <strong>Sobre</strong>.<br />
                                        3. O cÃ³digo estÃ¡ em <strong>EndereÃ§o Wi-Fi</strong>.
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="p-3 bg-white rounded-xl border border-slate-100">
                                    <p className="text-xs font-bold text-indigo-600 mb-1">ðŸ–¥ï¸ Windows</p>
                                    <p className="text-[11px] text-slate-600 leading-relaxed">
                                        1. Clique em <strong>Iniciar</strong> e digite <strong>cmd</strong>.<br />
                                        2. Digite <code>getmac</code> ou <code>ipconfig /all</code>.<br />
                                        3. O <strong>EndereÃ§o FÃ­sico</strong> Ã© o seu MAC.
                                    </p>
                                </div>
                                <div className="p-3 bg-white rounded-xl border border-slate-100">
                                    <p className="text-xs font-bold text-indigo-600 mb-1">ðŸ§ Linux</p>
                                    <p className="text-[11px] text-slate-600 leading-relaxed">
                                        1. Abra o <strong>Terminal</strong>.<br />
                                        2. Digite <code>ip link show</code> ou <code>ifconfig</code>.<br />
                                        3. Procure por <strong>link/ether</strong> no adaptador Wi-Fi.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <p className="mt-4 text-[10px] text-slate-400 italic">
                            * O MAC Address Ã© um cÃ³digo Ãºnico composto por 12 caracteres hexadecimais (ex: 00:1A:2B:3C:4D:5E).
                        </p>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100">
                        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-2xl text-white shadow-lg shadow-indigo-200 text-left relative overflow-hidden">
                            <div className="relative z-10">
                                <h4 className="font-bold text-lg mb-1">Quer facilitar?</h4>
                                <p className="text-white/80 text-sm mb-4">Use nosso detector automÃ¡tico para descobrir o seu MAC Address agora mesmo.</p>
                                <button
                                    onClick={() => window.open(`http://${window.location.hostname}:4000`, '_blank')}
                                    className="bg-white text-indigo-700 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-opacity-90 transition shadow-sm"
                                >
                                    Abrir Detector de MAC
                                </button>
                            </div>
                            <div className="absolute -right-6 -bottom-6 opacity-20 transform rotate-12">
                                <Wifi size={120} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // View for ADMIN
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Controle de Internet</h2>
                    <p className="text-slate-500 text-sm">Gerenciamento de acesso via MAC Address para todos os moradores</p>
                </div>
                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-100">
                    <Router size={20} />
                    <span className="font-bold text-sm">Sistema Online</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                            <ShieldCheck size={20} />
                        </div>
                        <h3 className="font-bold text-slate-900">Dispositivos Ativos</h3>
                    </div>
                    <h4 className="text-3xl font-bold text-slate-900 mb-2">{activeDevices.length}</h4>
                    <p className="text-xs text-slate-500">Conectados Ã  rede interna</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                            <AlertTriangle size={20} />
                        </div>
                        <h3 className="font-bold text-slate-900">Dispositivos Pendentes</h3>
                    </div>
                    <h4 className="text-3xl font-bold text-slate-900 mb-2">{pendingDevices.length}</h4>
                    <p className="text-xs text-slate-500">Aguardando aprovaÃ§Ã£o</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                            <Wifi size={20} />
                        </div>
                        <h3 className="font-bold text-slate-900">Moradores Ativos</h3>
                    </div>
                    <h4 className="text-3xl font-bold text-slate-900 mb-2">{activeUsers.length}</h4>
                    <p className="text-xs text-slate-500">Com plano de internet vÃ¡lido</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-4">
                    <div>
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                            <PhoneCall size={18} className="text-indigo-600" />
                            ProntidÃ£o do Softphone
                        </h3>
                        <p className="text-xs text-slate-500">DiagnÃ³stico local do ambiente antes da ativaÃ§Ã£o do PBX.</p>
                    </div>
                    <button
                        onClick={handleRefreshSoftphoneAdmin}
                        className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                    >
                        <RefreshCw size={14} className={loadingSoftphoneHealth ? 'animate-spin' : ''} />
                        Atualizar
                    </button>
                </div>

                {softphoneHealth ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</div>
                                <div className={`mt-2 text-lg font-bold ${softphoneHealth.ok ? 'text-emerald-600' : 'text-amber-600'}`}>
                                    {softphoneHealth.ok ? 'Pronto para teste' : 'Pendente de configuraÃ§Ã£o'}
                                </div>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Transporte</div>
                                <div className="mt-2 text-lg font-bold text-slate-900">{softphoneHealth.transport}</div>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Shell</div>
                                <div className={`mt-2 text-lg font-bold ${softphoneHealth.enabled ? 'text-emerald-600' : 'text-slate-400'}`}>
                                    {softphoneHealth.enabled ? 'Habilitado' : 'Desabilitado'}
                                </div>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Porta</div>
                                <div className={`mt-2 text-lg font-bold ${softphoneHealth.door.configured ? 'text-emerald-600' : 'text-amber-600'}`}>
                                    {softphoneHealth.door.mode}
                                </div>
                                <div className="mt-1 text-xs text-slate-500">
                                    {softphoneHealth.door.configured
                                        ? softphoneHealth.door.dtmf
                                            ? `DTMF ${softphoneHealth.door.dtmf}`
                                            : softphoneHealth.door.label
                                        : 'Aguardando configuracao'}
                                </div>
                                <div className="mt-3 text-xs text-slate-500">
                                    {softphoneHealth.door.mode === 'none'
                                        ? 'Placeholder ativo: o fluxo existe no app, mas ainda nao executa abertura real.'
                                        : softphoneHealth.door.mode === 'dtmf'
                                            ? 'Modo DTMF: o transporte SIP devera enviar os tons para o PBX/interfone.'
                                            : softphoneHealth.door.mode === 'http-relay'
                                                ? 'Modo HTTP relay: o backend local devera chamar o controlador de acesso.'
                                                : 'Modo extension: a abertura ficara ligada a um ramal ou fluxo dedicado no PBX.'}
                                </div>
                            </div>
                        </div>

                        {softphoneHealth.missing.length > 0 && (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                                <div className="mb-2 text-xs font-bold uppercase tracking-widest text-amber-700">VariÃ¡veis ausentes</div>
                                <div className="flex flex-wrap gap-2">
                                    {softphoneHealth.missing.map(item => (
                                        <span key={item} className="rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase text-amber-700 border border-amber-200">
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <div className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">RecomendaÃ§Ãµes</div>
                            <div className="space-y-2">
                                {softphoneHealth.recommendations.map((item, index) => (
                                    <div key={`${item}-${index}`} className="text-sm text-slate-600">
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
                                    Teste de porta
                                </div>
                                <button
                                    onClick={handleTestDoor}
                                    disabled={testingDoor}
                                    className="rounded-xl border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
                                >
                                    {testingDoor ? 'Consultando...' : 'Testar porta'}
                                </button>
                            </div>
                            <div className="text-sm text-slate-600">
                                {doorTestResult?.message || 'Use este teste para validar o modo configurado de abertura de porta no backend local.'}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                        NÃ£o foi possÃ­vel carregar o diagnÃ³stico do softphone local.
                    </div>
                )}
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="mb-5 flex items-start justify-between gap-4">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        <PhoneCall size={18} className="text-emerald-600" />
                        Rollout do Softphone por Morador
                    </h3>
                    <button
                        onClick={handleExportSoftphoneRollout}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                    >
                        Exportar CSV
                    </button>
                </div>
                <p className="text-xs text-slate-500 mt-1 mb-5">
                    Status operacional dos moradores para acelerar a ativacao quando o PBX estiver pronto.
                </p>
                <div className="mb-5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span>
                        Resumo gerado em{' '}
                        <span className="font-bold text-slate-700">
                            {softphoneRollout?.generatedAt
                                ? new Date(softphoneRollout.generatedAt).toLocaleString('pt-BR')
                                : 'fallback local'}
                        </span>
                    </span>
                    <span className={`rounded-full px-3 py-1 font-bold ${
                        softphoneRollout?.generatedAt
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                    }`}>
                        {rolloutSourceLabel}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 font-bold text-slate-600">
                        Sem MAC principal: {rolloutSummary.missingMac}
                    </span>
                    <span className="rounded-full bg-rose-50 px-3 py-1 font-bold text-rose-700">
                        Morador bloqueado: {rolloutSummary.residentDisabled ?? 0}
                    </span>
                    <span className="rounded-full bg-fuchsia-50 px-3 py-1 font-bold text-fuchsia-700">
                        Com motivo: {rolloutSummary.blockedWithReason ?? 0}
                    </span>
                    <span className="rounded-full bg-orange-50 px-3 py-1 font-bold text-orange-700">
                        Sem motivo: {rolloutSummary.blockedWithoutReason ?? 0}
                    </span>
                    <span className="rounded-full bg-cyan-50 px-3 py-1 font-bold text-cyan-700">
                        Em revisao: {rolloutSummary.eligibilityReview ?? 0}
                    </span>
                    <span className="rounded-full bg-indigo-50 px-3 py-1 font-bold text-indigo-700">
                        Mostrando {Math.min(filteredSoftphoneRolloutQueue.length, 12)} de {rolloutItems.length}
                    </span>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 font-bold text-emerald-700">
                        Prontidao geral: {rolloutReadyPercentage}%
                    </span>
                </div>
                {!softphoneRollout?.generatedAt && (
                    <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                        O resumo abaixo esta em fallback local. Para consolidar os dados pelo backend do `mac-server`, confira o endpoint `/api/softphone/rollout`.
                    </div>
                )}

                <div className="mb-5 grid grid-cols-1 md:grid-cols-[minmax(0,1.4fr)_220px] gap-3">
                    <input
                        type="text"
                        value={softphoneRolloutSearch}
                        onChange={(event) => setSoftphoneRolloutSearch(event.target.value)}
                        placeholder="Buscar por nome ou email"
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                    />
                    <select
                        value={softphoneRolloutFilter}
                        onChange={(event) => setSoftphoneRolloutFilter(event.target.value as typeof softphoneRolloutFilter)}
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                    >
                        <option value="all">Todos</option>
                        <option value="ready">Prontos</option>
                        <option value="missing-extension">Sem ramal</option>
                        <option value="internet-inactive">Internet inativa</option>
                        <option value="disabled">Desativados</option>
                        <option value="resident-disabled">Morador bloqueado</option>
                        <option value="blocked-with-reason">Bloqueado com motivo</option>
                        <option value="eligibility-review">Em revisao</option>
                        <option value="missing-mac">Sem MAC</option>
                    </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-9 gap-4 mb-6">
                    <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-700">Moradores</div>
                        <div className="mt-2 text-3xl font-bold text-indigo-900">{rolloutSummary.totalResidents}</div>
                        <div className="mt-1 text-xs text-indigo-700">Base total considerada no rollout</div>
                    </div>
                    <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-violet-700">Habilitados</div>
                        <div className="mt-2 text-3xl font-bold text-violet-900">{rolloutSummary.enabled}</div>
                        <div className="mt-1 text-xs text-violet-700">Moradores com softphone ligado</div>
                    </div>
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Prontos</div>
                        <div className="mt-2 text-3xl font-bold text-emerald-900">{rolloutSummary.ready}</div>
                        <div className="mt-1 text-xs text-emerald-700">Internet ativa e ramal definido</div>
                    </div>
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Sem Ramal</div>
                        <div className="mt-2 text-3xl font-bold text-amber-900">{rolloutSummary.missingExtension}</div>
                        <div className="mt-1 text-xs text-amber-700">Precisam de ramal para provisionamento</div>
                    </div>
                    <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-sky-700">Internet Inativa</div>
                        <div className="mt-2 text-3xl font-bold text-sky-900">{rolloutSummary.internetInactive}</div>
                        <div className="mt-1 text-xs text-sky-700">Softphone automatico ainda bloqueado</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Desativados</div>
                        <div className="mt-2 text-3xl font-bold text-slate-900">{rolloutSummary.disabled}</div>
                        <div className="mt-1 text-xs text-slate-600">Moradores com softphone desligado</div>
                    </div>
                    <div className="rounded-xl border border-fuchsia-200 bg-fuchsia-50 p-4">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-fuchsia-700">Com Motivo</div>
                        <div className="mt-2 text-3xl font-bold text-fuchsia-900">{rolloutSummary.blockedWithReason ?? 0}</div>
                        <div className="mt-1 text-xs text-fuchsia-700">Bloqueios com justificativa registrada</div>
                    </div>
                    <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-orange-700">Sem Motivo</div>
                        <div className="mt-2 text-3xl font-bold text-orange-900">{rolloutSummary.blockedWithoutReason ?? 0}</div>
                        <div className="mt-1 text-xs text-orange-700">Bloqueios que ainda precisam de justificativa</div>
                    </div>
                    <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-cyan-700">Em Revisao</div>
                        <div className="mt-2 text-3xl font-bold text-cyan-900">{rolloutSummary.eligibilityReview ?? 0}</div>
                        <div className="mt-1 text-xs text-cyan-700">Moradores habilitados que merecem auditoria</div>
                    </div>
                </div>

                {rolloutBlockedReasons.length > 0 && (
                    <div className="mb-6 rounded-2xl border border-rose-100 bg-rose-50 p-4">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-rose-700">
                            Motivos de bloqueio mais comuns
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {rolloutBlockedReasons.map(([reason, count]) => (
                                <span
                                    key={reason}
                                    className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-3 py-1 text-xs font-bold text-rose-700"
                                >
                                    <span>{reason}</span>
                                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] uppercase">
                                        {count}
                                    </span>
                                </span>
                            ))}
                        </div>
                    </div>
                )}
                {rolloutPolicyWarnings.length > 0 && (
                    <div className="mb-6 rounded-2xl border border-cyan-100 bg-cyan-50 p-4">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-cyan-700">
                            Alertas de elegibilidade mais comuns
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {rolloutPolicyWarnings.map(([warning, count]) => (
                                <span
                                    key={warning}
                                    className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white px-3 py-1 text-xs font-bold text-cyan-700"
                                >
                                    <span>{warning}</span>
                                    <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] uppercase">
                                        {count}
                                    </span>
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                <div className="overflow-hidden rounded-2xl border border-slate-100">
                    <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] border-b border-slate-100 bg-slate-50">
                        <div className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Morador</div>
                        <div className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Bloqueios</div>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {filteredSoftphoneRolloutQueue.slice(0, 12).map(({ resident, ready, blockers, policyWarnings }) => (
                            <div key={resident.id} className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                                <div className="px-4 py-4">
                                    <div className="font-bold text-slate-900">{resident.name}</div>
                                    <div className="mt-1 text-xs text-slate-500">
                                        {resident.softphone_extension || 'Sem ramal'} â€¢ {resident.internet_active ? 'Internet ativa' : 'Internet inativa'}
                                    </div>
                                    <div className="mt-1 flex flex-wrap gap-2 text-[11px]">
                                        <span
                                            className={`rounded-full px-2 py-1 font-medium ${
                                                resident.habilitado === false
                                                    ? 'bg-rose-100 text-rose-700'
                                                    : 'bg-emerald-100 text-emerald-700'
                                            }`}
                                        >
                                            {resident.habilitado === false ? 'Morador bloqueado' : 'Morador habilitado'}
                                        </span>
                                        <span className="rounded-full bg-slate-100 px-2 py-1 font-medium text-slate-600">
                                            {resident.softphone_display_name || 'Sem nome de exibicao'}
                                        </span>
                                        {resident.habilitado === false && resident.motivo_bloqueio?.trim() && (
                                            <span className="rounded-full bg-rose-50 px-2 py-1 font-medium text-rose-700">
                                                {resident.motivo_bloqueio}
                                            </span>
                                        )}
                                        <span
                                            className={`rounded-full px-2 py-1 font-medium ${
                                                resident.mac_address
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-violet-100 text-violet-700'
                                            }`}
                                        >
                                            {resident.mac_address ? 'MAC ok' : 'Sem MAC principal'}
                                        </span>
                                        {(policyWarnings || []).map((warning) => (
                                            <span
                                                key={`${resident.id}-${warning}`}
                                                className="rounded-full bg-cyan-50 px-2 py-1 font-medium text-cyan-700"
                                            >
                                                {warning}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="px-4 py-4">
                                    {ready ? (
                                        <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                                            Pronto para rollout
                                        </span>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {blockers.map((blocker) => (
                                                <span
                                                    key={`${resident.id}-${blocker}`}
                                                    className="inline-flex rounded-full border border-amber-200 bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700"
                                                >
                                                    {blocker}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {filteredSoftphoneRolloutQueue.length === 0 && (
                            <div className="px-4 py-6 text-sm text-slate-500">
                                Nenhum morador encontrado para o filtro atual.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900">Lista de AutorizaÃ§Ã£o MAC (Dispositivos)</h3>
                    <button className="text-sm font-bold text-indigo-600 hover:underline">Exportar Lista (.csv)</button>
                </div>
                <div className="p-0 overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-white border-b border-slate-100">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Morador</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Dispositivo</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">MAC Address</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Conectado (Tempo)</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">TrÃ¡fego Ocupado</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">AÃ§Ã£o</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {devices.map(device => {
                                const resident = residents.find(r => r.id === device.resident_id);
                                return (
                                    <tr key={device.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-900 text-sm">
                                            {resident ? resident.name : 'Desconhecido'}
                                            {resident && !resident.internet_active && <span className="ml-2 bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold" title="Mensalidade PENDENTE / Planto Cancelado">Sem Plano</span>}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 flex items-center gap-2">
                                            {device.device_type === 'Celular' ? <Smartphone size={14} /> : <Laptop size={14} />} {device.device_type}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-sm text-slate-600">
                                            {device.mac_address || <span className="text-slate-400 italic">N/A</span>}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {device.connected_time || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {device.bandwidth_usage ? `${device.bandwidth_usage} MB` : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {editingDevice === device.id ? (
                                                <select
                                                    className="text-xs p-1 border border-slate-300 rounded"
                                                    value={device.status}
                                                    onChange={(e) => handleStatusUpdate(device.id, e.target.value)}
                                                    autoFocus
                                                    onBlur={() => setEditingDevice(null)}
                                                >
                                                    <option value="Pendente">Pendente</option>
                                                    <option value="Ativo">Ativo</option>
                                                    <option value="Bloqueado">Bloqueado</option>
                                                </select>
                                            ) : (
                                                <span
                                                    className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 w-max cursor-pointer hover:bg-slate-200 transition ${device.status === 'Ativo' ? 'bg-emerald-100 text-emerald-700' : device.status === 'Pendente' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}
                                                    onClick={() => setEditingDevice(device.id)}
                                                >
                                                    <div className={`w-1.5 h-1.5 rounded-full ${device.status === 'Ativo' ? 'bg-emerald-500' : device.status === 'Pendente' ? 'bg-amber-500' : 'bg-rose-500'}`}></div> {device.status}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={(e) => handleDeleteDevice(device.id, e)} className="text-slate-400 hover:text-rose-600 p-1 transition rounded hover:bg-rose-50"><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                )
                            })}
                            {devices.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-sm text-slate-500 italic">
                                        Nenhum dispositivo encontrado na rede.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

