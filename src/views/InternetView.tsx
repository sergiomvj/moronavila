import React, { useEffect, useState } from 'react';
import { Wifi, Router, AlertTriangle, ShieldCheck, Laptop, Smartphone, Plus, Trash2, Edit, PhoneCall, RefreshCw } from 'lucide-react';
import { Resident, Device, UserRole } from '../types';
import { createDevice, updateDevice, deleteDevice } from '../lib/database';
import { getLocalApiBase } from '../lib/localApi';

interface InternetViewProps {
    residents: Resident[];
    devices: Device[];
    currentUser: Resident;
    onUpdate: () => void;
}

export function InternetView({ residents, devices, currentUser, onUpdate }: InternetViewProps) {
    const isAdmin = currentUser.role === UserRole.ADMIN;
    const [softphoneHealth, setSoftphoneHealth] = useState<{
        ok: boolean;
        transport: string;
        enabled: boolean;
        configured: boolean;
        missing: string[];
        recommendations: string[];
    } | null>(null);
    const [loadingSoftphoneHealth, setLoadingSoftphoneHealth] = useState(false);

    // View state
    const [isAdding, setIsAdding] = useState(false);
    const [newDevice, setNewDevice] = useState<Partial<Device>>({
        device_type: 'Celular',
        mac_address: '',
        status: isAdmin ? 'Ativo' : 'Pendente' // Admins auto aprovam
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Para edição admin
    const [editingDevice, setEditingDevice] = useState<string | null>(null);

    const activeUsers = residents.filter(r => r.internet_active);
    const inactiveUsers = residents.filter(r => !r.internet_active && r.mac_address);
    const noMacUsers = residents.filter(r => !r.mac_address);

    const activeDevices = devices.filter(d => d.status === 'Ativo');
    const pendingDevices = devices.filter(d => d.status === 'Pendente');

    useEffect(() => {
        if (!isAdmin) return;
        loadSoftphoneHealth();
    }, [isAdmin]);

    const loadSoftphoneHealth = async () => {
        setLoadingSoftphoneHealth(true);
        try {
            const response = await fetch(`${getLocalApiBase()}/api/softphone/health`);
            if (!response.ok) throw new Error('Falha ao consultar saúde do softphone');
            const data = await response.json();
            setSoftphoneHealth(data);
        } catch (error) {
            console.error(error);
            setSoftphoneHealth(null);
        } finally {
            setLoadingSoftphoneHealth(false);
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
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Acesso à Internet</h2>
                    <p className="text-slate-600 mb-6 max-w-lg mx-auto">
                        Seu acesso à internet é renovado automaticamente a cada pagamento mensal confirmado.
                        Você pode cadastrar até 2 dispositivos na rede interna.
                    </p>

                    {/* Área de Dispositivos */}
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
                        <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <ShieldCheck size={18} className="text-indigo-600" />
                            Como encontrar seu MAC Address?
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <div className="p-3 bg-white rounded-xl border border-slate-100">
                                    <p className="text-xs font-bold text-indigo-600 mb-1">📱 Android</p>
                                    <p className="text-[11px] text-slate-600 leading-relaxed">
                                        1. Abra as <strong>Configurações</strong>.<br />
                                        2. Vá em <strong>Sobre o telefone</strong> ou <strong>Rede e Internet</strong>.<br />
                                        3. Toque em <strong>Status</strong> ou <strong>Ver mais</strong>.<br />
                                        4. Procure por <strong>Endereço MAC Wi-Fi</strong>.
                                    </p>
                                </div>
                                <div className="p-3 bg-white rounded-xl border border-slate-100">
                                    <p className="text-xs font-bold text-indigo-600 mb-1">🍎 iOS (iPhone/iPad)</p>
                                    <p className="text-[11px] text-slate-600 leading-relaxed">
                                        1. Vá em <strong>Ajustes</strong>.<br />
                                        2. Toque em <strong>Geral</strong> e depois em <strong>Sobre</strong>.<br />
                                        3. O código está em <strong>Endereço Wi-Fi</strong>.
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="p-3 bg-white rounded-xl border border-slate-100">
                                    <p className="text-xs font-bold text-indigo-600 mb-1">🖥️ Windows</p>
                                    <p className="text-[11px] text-slate-600 leading-relaxed">
                                        1. Clique em <strong>Iniciar</strong> e digite <strong>cmd</strong>.<br />
                                        2. Digite <code>getmac</code> ou <code>ipconfig /all</code>.<br />
                                        3. O <strong>Endereço Físico</strong> é o seu MAC.
                                    </p>
                                </div>
                                <div className="p-3 bg-white rounded-xl border border-slate-100">
                                    <p className="text-xs font-bold text-indigo-600 mb-1">🐧 Linux</p>
                                    <p className="text-[11px] text-slate-600 leading-relaxed">
                                        1. Abra o <strong>Terminal</strong>.<br />
                                        2. Digite <code>ip link show</code> ou <code>ifconfig</code>.<br />
                                        3. Procure por <strong>link/ether</strong> no adaptador Wi-Fi.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <p className="mt-4 text-[10px] text-slate-400 italic">
                            * O MAC Address é um código único composto por 12 caracteres hexadecimais (ex: 00:1A:2B:3C:4D:5E).
                        </p>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100">
                        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-2xl text-white shadow-lg shadow-indigo-200 text-left relative overflow-hidden">
                            <div className="relative z-10">
                                <h4 className="font-bold text-lg mb-1">Quer facilitar?</h4>
                                <p className="text-white/80 text-sm mb-4">Use nosso detector automático para descobrir o seu MAC Address agora mesmo.</p>
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
                    <p className="text-xs text-slate-500">Conectados à rede interna</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                            <AlertTriangle size={20} />
                        </div>
                        <h3 className="font-bold text-slate-900">Dispositivos Pendentes</h3>
                    </div>
                    <h4 className="text-3xl font-bold text-slate-900 mb-2">{pendingDevices.length}</h4>
                    <p className="text-xs text-slate-500">Aguardando aprovação</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                            <Wifi size={20} />
                        </div>
                        <h3 className="font-bold text-slate-900">Moradores Ativos</h3>
                    </div>
                    <h4 className="text-3xl font-bold text-slate-900 mb-2">{activeUsers.length}</h4>
                    <p className="text-xs text-slate-500">Com plano de internet válido</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-4">
                    <div>
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                            <PhoneCall size={18} className="text-indigo-600" />
                            Prontidão do Softphone
                        </h3>
                        <p className="text-xs text-slate-500">Diagnóstico local do ambiente antes da ativação do PBX.</p>
                    </div>
                    <button
                        onClick={loadSoftphoneHealth}
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
                                    {softphoneHealth.ok ? 'Pronto para teste' : 'Pendente de configuração'}
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
                        </div>

                        {softphoneHealth.missing.length > 0 && (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                                <div className="mb-2 text-xs font-bold uppercase tracking-widest text-amber-700">Variáveis ausentes</div>
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
                            <div className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">Recomendações</div>
                            <div className="space-y-2">
                                {softphoneHealth.recommendations.map((item, index) => (
                                    <div key={`${item}-${index}`} className="text-sm text-slate-600">
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                        Não foi possível carregar o diagnóstico do softphone local.
                    </div>
                )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900">Lista de Autorização MAC (Dispositivos)</h3>
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
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tráfego Ocupado</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ação</th>
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
