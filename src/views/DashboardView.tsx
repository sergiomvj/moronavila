import React, { useEffect, useMemo, useState } from 'react';
import { Users, CreditCard, Wrench, LayoutDashboard, CheckCircle2, AlertCircle, Wifi, Droplets, Plus, MessageSquare, X, Trello, Bed, PhoneCall } from 'lucide-react';
import { Payment, MaintenanceRequest, Resident, Room, PaymentStatus, MaintenanceStatus, LaundrySchedule, UserRole, RoomType } from '../types';
import { createMaintenanceRequest, createComplaint } from '../lib/database';
import {
    fetchSoftphoneHealth,
    fetchSoftphoneRollout,
    type SoftphoneHealthResponse,
    type SoftphoneRolloutResponse
} from '../modules/softphone/api';

interface DashboardViewProps {
    payments: Payment[];
    maintenance: MaintenanceRequest[];
    residents: Resident[];
    rooms: Room[];
    laundrySchedules: LaundrySchedule[];
    currentUser: Resident;
    setActiveTab: (tab: string) => void;
    setShowAddResidentModal?: (show: boolean) => void;
    setShowAddNoticeModal?: (show: boolean) => void;
    setShowAddEventModal?: (show: boolean) => void;
}

const StatCard = ({ label, value, icon: Icon, colorClass, onClick, span = "col-span-1" }: { label: string, value: string | number | React.ReactNode, icon: any, colorClass: string, onClick?: () => void, span?: string }) => (
    <div
        onClick={onClick}
        className={`bento-card flex flex-col justify-between group cursor-pointer ${span}`}
    >
        <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-2xl ${colorClass} group-hover:scale-110 transition-transform duration-500`}>
                <Icon size={24} />
            </div>
            <div className="text-right">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{label}</p>
                <h3 className="text-3xl font-black text-white tracking-tighter">{value}</h3>
            </div>
        </div>
        <div className="flex items-center justify-between mt-2">
            <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                    <div key={i} className="w-6 h-6 rounded-full border-2 border-slate-900 bg-slate-800" />
                ))}
            </div>
            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Detalhes →</span>
        </div>
    </div>
);

export function DashboardView({
    payments, maintenance, residents, rooms, laundrySchedules, currentUser, setActiveTab,
    setShowAddResidentModal, setShowAddNoticeModal, setShowAddEventModal
}: DashboardViewProps) {
    const isAdmin = currentUser.role === UserRole.ADMIN;

    const [showComplaintModal, setShowComplaintModal] = useState(false);
    const [showRepairModal, setShowRepairModal] = useState(false);
    const [softphoneRollout, setSoftphoneRollout] = useState<SoftphoneRolloutResponse | null>(null);
    const [softphoneHealth, setSoftphoneHealth] = useState<SoftphoneHealthResponse | null>(null);

    // Form states
    const [repairTitle, setRepairTitle] = useState('');
    const [repairDesc, setRepairDesc] = useState('');
    const [repairRoom, setRepairRoom] = useState(currentUser.room_id || '');
    const [complaintTitle, setComplaintTitle] = useState('');
    const [complaintDesc, setComplaintDesc] = useState('');
    const [complaintAnon, setComplaintAnon] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!isAdmin) return;

        fetchSoftphoneRollout()
            .then((data) => setSoftphoneRollout(data))
            .catch(() => setSoftphoneRollout(null));
        fetchSoftphoneHealth()
            .then((data) => setSoftphoneHealth(data))
            .catch(() => setSoftphoneHealth(null));
    }, [isAdmin]);

    const stats = useMemo(() => {
        const myPayments = payments.filter(p => isAdmin || p.resident_id === currentUser.id);
        const myMaintenance = maintenance.filter(m => isAdmin || m.room_id === currentUser.room_id);
        const totalPayments = myPayments.reduce((acc, p) => acc + Number(p.amount), 0);
        const pendingPayments = myPayments.filter(p => p.status !== PaymentStatus.PAID).length;
        const openMaintenance = myMaintenance.filter(m => m.status === MaintenanceStatus.OPEN).length;
        const eligibleResidents = residents.filter(r => r.role === UserRole.RESIDENT && r.habilitado !== false);
        const internetEnabled = residents.filter(r => r.habilitado !== false && r.internet_active).length;
        const internetBlocked = residents.filter(r => r.habilitado !== false && !r.internet_active).length;
        const softphoneEnabled = eligibleResidents.filter(r => r.softphone_enabled !== false).length;
        const softphoneProvisioned = eligibleResidents.filter(r => r.softphone_enabled !== false && Boolean(r.softphone_extension)).length;
        const softphoneReadyOnNetwork = eligibleResidents.filter(r => r.softphone_enabled !== false && Boolean(r.softphone_extension) && r.internet_active).length;
        const softphoneMissingExtension = eligibleResidents.filter(r => r.softphone_enabled !== false && !r.softphone_extension).length;
        const softphoneBlockedByInternet = eligibleResidents.filter(r => r.softphone_enabled !== false && !r.internet_active).length;
        const softphoneDisabled = residents.filter(r => r.role === UserRole.RESIDENT && (r.habilitado === false || r.softphone_enabled === false)).length;
        const residentBlocked = residents.filter(r => r.role === UserRole.RESIDENT && r.habilitado === false).length;
        const today = new Date().toISOString().split('T')[0];
        const todaysLaundry = laundrySchedules.filter(l => l.date === today).length;
        const myTodaysLaundry = laundrySchedules.filter(l => l.date === today && (isAdmin || l.resident_id === currentUser.id)).length;
        const totalAvailableBeds = rooms.reduce((acc, room) => acc + Math.max(0, room.capacity - (room.residents?.length || 0)), 0);

        return {
            totalPayments,
            pendingPayments,
            openMaintenance,
            totalResidents: residents.length,
            internetEnabled,
            internetBlocked,
            softphoneEnabled,
            softphoneProvisioned,
            softphoneReadyOnNetwork,
            softphoneMissingExtension,
            softphoneBlockedByInternet,
            softphoneDisabled,
            residentBlocked,
            todaysLaundry,
            myTodaysLaundry,
            totalAvailableBeds
        };
    }, [payments, maintenance, residents, laundrySchedules, currentUser, isAdmin, rooms]);

    const softphoneStats = {
        enabled: softphoneRollout?.summary.enabled ?? stats.softphoneEnabled,
        provisioned: softphoneRollout
            ? softphoneRollout.items.filter((item) => Boolean(item.extension)).length
            : stats.softphoneProvisioned,
        ready: softphoneRollout?.summary.ready ?? stats.softphoneReadyOnNetwork,
        missingExtension: softphoneRollout?.summary.missingExtension ?? stats.softphoneMissingExtension,
        blockedByInternet: softphoneRollout?.summary.internetInactive ?? stats.softphoneBlockedByInternet,
        disabled: softphoneRollout?.summary.disabled ?? stats.softphoneDisabled,
        residentBlocked: softphoneRollout?.summary.residentDisabled ?? stats.residentBlocked,
        blockedWithReason: softphoneRollout?.summary.blockedWithReason ?? 0,
        blockedWithoutReason: softphoneRollout?.summary.blockedWithoutReason ?? 0,
        missingMac: softphoneRollout?.summary.missingMac ?? residents.filter(
            (resident) => resident.role === UserRole.RESIDENT && resident.habilitado !== false && !resident.mac_address
        ).length,
    };
    const softphoneStatsSourceLabel = softphoneRollout?.generatedAt
        ? `Resumo consolidado em ${new Date(softphoneRollout.generatedAt).toLocaleString('pt-BR')}`
        : 'Resumo em fallback local';
    const topBlockedReasons = softphoneRollout?.summary.topBlockedReasons?.length
        ? softphoneRollout.summary.topBlockedReasons.slice(0, 3).map((item) => [item.reason, item.count] as const)
        : softphoneRollout?.items
            ? Object.entries(
                softphoneRollout.items.reduce<Record<string, number>>((accumulator, item) => {
                    if (!item.motivoBloqueio) return accumulator;
                    accumulator[item.motivoBloqueio] = (accumulator[item.motivoBloqueio] || 0) + 1;
                    return accumulator;
                }, {})
            )
                .sort((left, right) => right[1] - left[1])
                .slice(0, 3)
            : [];

    const handleCreateRepair = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await createMaintenanceRequest({
                room_id: repairRoom,
                title: repairTitle,
                description: repairDesc,
                requested_by: currentUser.id
            });
            setShowRepairModal(false);
            setRepairTitle('');
            setRepairDesc('');
            alert('Reparo solicitado com sucesso!');
            setActiveTab('maintenance');
        } catch (err) {
            alert('Erro ao solicitar reparo.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateComplaint = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await createComplaint({
                resident_id: currentUser.id,
                title: complaintTitle,
                description: complaintDesc,
                is_anonymous: complaintAnon
            });
            setShowComplaintModal(false);
            setComplaintTitle('');
            setComplaintDesc('');
            setComplaintAnon(false);
            alert('Reclamação enviada com sucesso!');
            setActiveTab('complaints');
        } catch (err) {
            alert('Erro ao enviar reclamação.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Bento Grid Header */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Welcome Banner - Big Bento Block */}
                <div className="xl:col-span-2 relative overflow-hidden bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 flex flex-col justify-end min-h-[280px] md:min-h-[320px] border border-slate-800 group">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent z-10"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-rose-600/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>

                    {/* Abstract Shapes */}
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-rose-600/10 rounded-full blur-[100px] animate-pulse"></div>
                    <div className="absolute top-10 left-10 w-2 h-2 bg-rose-500 rounded-full shadow-[0_0_15px_rgba(225,29,72,0.8)]"></div>

                    <div className="relative z-20">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="px-3 py-1 bg-rose-600/20 border border-rose-500/30 text-rose-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-full">
                                Painel de Controle v3.0
                            </span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-4 leading-tight md:leading-none">
                            Olá, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500">{currentUser.name.split(' ')[0]}</span>!
                        </h2>
                        <p className="text-slate-400 max-w-lg text-lg font-medium leading-relaxed">
                            {isAdmin
                                ? 'Gerencie a infraestrutura da República com precisão. Monitore pagamentos, moradores e manutenções em tempo real.'
                                : 'Sua experiência na Moronavila centralizada. Confira seus boletos, solicite reparos e agende sua lavanderia.'}
                        </p>
                    </div>
                </div>

                {/* Quick Actions - Tall Bento Block */}
                <div className="bento-card flex flex-col">
                    <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2">
                        <Plus size={20} className="text-rose-500" /> Ações Rápidas
                    </h3>
                    <div className="grid grid-cols-1 gap-3 flex-1">
                        <button onClick={() => setShowRepairModal(true)} className="flex items-center gap-4 p-4 bg-slate-800/50 hover:bg-rose-600 rounded-2xl border border-slate-700 hover:border-rose-500 transition-all duration-300 group/btn">
                            <div className="p-2.5 bg-slate-950 rounded-xl text-slate-400 group-hover/btn:text-white group-hover/btn:bg-rose-700 transition-colors">
                                <Wrench size={18} />
                            </div>
                            <span className="text-sm font-bold group-hover/btn:text-white">Solicitar Reparo</span>
                        </button>
                        <button onClick={() => setShowComplaintModal(true)} className="flex items-center gap-4 p-4 bg-slate-800/50 hover:bg-rose-600 rounded-2xl border border-slate-700 hover:border-rose-500 transition-all duration-300 group/btn">
                            <div className="p-2.5 bg-slate-950 rounded-xl text-slate-400 group-hover/btn:text-white group-hover/btn:bg-rose-700 transition-colors">
                                <MessageSquare size={18} />
                            </div>
                            <span className="text-sm font-bold group-hover/btn:text-white">Nova Reclamação</span>
                        </button>
                        {isAdmin && (
                            <button onClick={() => { setActiveTab('residents'); setShowAddResidentModal?.(true); }} className="flex items-center gap-4 p-4 bg-slate-800/50 hover:bg-rose-600 rounded-2xl border border-slate-700 hover:border-rose-500 transition-all duration-300 group/btn">
                                <div className="p-2.5 bg-slate-950 rounded-xl text-slate-400 group-hover/btn:text-white group-hover/btn:bg-rose-700 transition-colors">
                                    <Users size={18} />
                                </div>
                                <span className="text-sm font-bold group-hover/btn:text-white">Novo Morador</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6">
                {isAdmin ? (
                    <>
                        <StatCard
                            label="Vagas Livres"
                            value={stats.totalAvailableBeds}
                            icon={Bed}
                            colorClass="bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                            onClick={() => setActiveTab('rooms')}
                        />
                        <StatCard
                            label="Internet Ativa"
                            value={`${stats.internetEnabled}`}
                            icon={Wifi}
                            colorClass="bg-rose-600/20 text-rose-500"
                            onClick={() => setActiveTab('internet')}
                        />
                        <StatCard
                            label="Lavanderia Hoje"
                            value={stats.todaysLaundry}
                            icon={Droplets}
                            colorClass="bg-slate-800 text-white"
                            onClick={() => setActiveTab('laundry')}
                        />
                        <StatCard
                            label="Reparos Pendentes"
                            value={stats.openMaintenance}
                            icon={Wrench}
                            colorClass="bg-rose-600/20 text-rose-500"
                            onClick={() => setActiveTab('maintenance')}
                        />
                        <StatCard
                            label="Faturas em Aberto"
                            value={stats.pendingPayments}
                            icon={CreditCard}
                            colorClass="bg-rose-600 text-white"
                            onClick={() => setActiveTab('payments')}
                        />
                    </>
                ) : (
                    <>
                        <StatCard
                            label="Status Conexão"
                            value={currentUser.internet_active ? 'Ativa' : 'Off'}
                            icon={Wifi}
                            colorClass={currentUser.internet_active ? "bg-rose-600/20 text-rose-500" : "bg-slate-800 text-slate-500"}
                            onClick={() => setActiveTab('internet')}
                        />
                        <StatCard
                            label="Meus Agendamentos"
                            value={stats.myTodaysLaundry}
                            icon={Droplets}
                            colorClass="bg-slate-800 text-white"
                            onClick={() => setActiveTab('laundry')}
                        />
                        <StatCard
                            label="Pagamentos"
                            value={stats.pendingPayments}
                            icon={CreditCard}
                            colorClass="bg-rose-600 text-white"
                            onClick={() => setActiveTab('payments')}
                        />
                        <StatCard
                            label="Solicitações"
                            value={stats.openMaintenance}
                            icon={Wrench}
                            colorClass="bg-rose-600/20 text-rose-500"
                            onClick={() => setActiveTab('maintenance')}
                        />
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Maintenance - Bento Style */}
                <div className="bento-card">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-white uppercase tracking-tight">Manutenções Críticas</h3>
                        <button onClick={() => setActiveTab('maintenance')} className="text-rose-500 text-xs font-black uppercase tracking-widest hover:underline">Histórico Geral</button>
                    </div>
                    <div className="space-y-4">
                        {maintenance
                            .filter(m => isAdmin || m.room_id === currentUser.room_id)
                            .slice(0, 4)
                            .map(m => (
                                <div key={m.id} className="flex items-center gap-4 p-5 rounded-[1.5rem] bg-slate-950/50 border border-slate-800 hover:border-rose-500/30 transition-all group">
                                    <div className={`p-3 rounded-xl ${m.status === MaintenanceStatus.RESOLVED ? 'bg-slate-800 text-slate-400' : 'bg-rose-600/10 text-rose-500 shadow-[0_0_15px_rgba(225,29,72,0.1)]'}`}>
                                        {m.status === MaintenanceStatus.RESOLVED ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-slate-100 text-sm group-hover:text-rose-500 transition-colors uppercase tracking-tight">{m.title}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
                                            <p className="text-slate-500 text-[10px] font-bold uppercase">{rooms.find(r => r.id === m.room_id)?.name || 'Área Comum'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{m.status === MaintenanceStatus.RESOLVED ? 'Concluído' : 'Pendente'}</p>
                                    </div>
                                </div>
                            ))}
                        {maintenance.length === 0 && (
                            <div className="py-10 text-center">
                                <div className="w-12 h-12 bg-slate-800/50 rounded-2xl mx-auto flex items-center justify-center text-slate-600 mb-4">
                                    <Trello size={24} />
                                </div>
                                <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Tudo em ordem por aqui</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Additional Content / Summary */}
                <div className="grid grid-cols-1 gap-6">
                    <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-[2.5rem] p-8 border border-slate-800 flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-rose-600/5 blur-[60px]"></div>
                        <div>
                            <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] mb-4">Sistema de Gestão</p>
                            <h4 className="text-2xl font-black text-white leading-tight mb-4">
                                VPR <span className="text-slate-500">Inteligente</span>
                            </h4>
                            <p className="text-slate-400 text-sm leading-relaxed mb-6">
                                Versão 3.5 focada em performance e experiência do usuário. Todos os módulos agora utilizam criptografia de ponta e sincronização otimizada.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="w-8 h-8 rounded-xl border-2 border-slate-900 bg-slate-800" />
                                ))}
                                <div className="w-8 h-8 rounded-xl border-2 border-slate-900 bg-rose-600 flex items-center justify-center text-[10px] font-black text-white">
                                    +5
                                </div>
                            </div>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-2">Moradores Online</span>
                        </div>
                    </div>

                    {isAdmin && (
                        <div className="bento-card border-indigo-500/20 bg-indigo-500/5">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-2">Rollout Softphone</p>
                                    <h4 className="text-2xl font-black text-white tracking-tight">Prontidão dos moradores</h4>
                                </div>
                                <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                    <PhoneCall size={22} />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3 mb-6">
                                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">Habilitados</div>
                                    <div className="mt-2 text-2xl font-black text-white">{softphoneStats.enabled}</div>
                                </div>
                                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">Com Ramal</div>
                                    <div className="mt-2 text-2xl font-black text-white">{softphoneStats.provisioned}</div>
                                </div>
                                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">Prontos</div>
                                    <div className="mt-2 text-2xl font-black text-white">{softphoneStats.ready}</div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
                                            Prontos = morador habilitado, softphone habilitado, ramal definido e internet ativa.
                                </div>
                                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-400">
                                    {softphoneStatsSourceLabel}
                                </div>
                                {!softphoneRollout?.generatedAt && (
                                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
                                        O card esta em fallback local. Confira a aba de Internet e o endpoint `/api/softphone/rollout` para validar o resumo consolidado.
                                    </div>
                                )}
                                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
                                    Porta: <span className="font-black text-white">{softphoneHealth?.door.mode || 'none'}</span>
                                    {' '}|{' '}
                                    {softphoneHealth?.door.configured
                                        ? softphoneHealth.door.dtmf
                                            ? `DTMF ${softphoneHealth.door.dtmf}`
                                            : softphoneHealth.door.label
                                        : 'Aguardando configuracao'}
                                </div>
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-7">
                                    <div className="rounded-2xl border border-amber-500/10 bg-amber-500/5 p-3">
                                        <div className="text-[9px] font-black uppercase tracking-widest text-amber-300">Sem Ramal</div>
                                        <div className="mt-2 text-xl font-black text-white">{softphoneStats.missingExtension}</div>
                                    </div>
                                    <div className="rounded-2xl border border-sky-500/10 bg-sky-500/5 p-3">
                                        <div className="text-[9px] font-black uppercase tracking-widest text-sky-300">Internet</div>
                                        <div className="mt-2 text-xl font-black text-white">{softphoneStats.blockedByInternet}</div>
                                    </div>
                                    <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-3">
                                        <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">Desativados</div>
                                        <div className="mt-2 text-xl font-black text-white">{softphoneStats.disabled}</div>
                                    </div>
                                    <div className="rounded-2xl border border-rose-500/10 bg-rose-500/5 p-3">
                                        <div className="text-[9px] font-black uppercase tracking-widest text-rose-300">Bloqueados</div>
                                        <div className="mt-2 text-xl font-black text-white">{softphoneStats.residentBlocked}</div>
                                    </div>
                                    <div className="rounded-2xl border border-fuchsia-500/10 bg-fuchsia-500/5 p-3">
                                        <div className="text-[9px] font-black uppercase tracking-widest text-fuchsia-300">Com Motivo</div>
                                        <div className="mt-2 text-xl font-black text-white">{softphoneStats.blockedWithReason}</div>
                                    </div>
                                    <div className="rounded-2xl border border-orange-500/10 bg-orange-500/5 p-3">
                                        <div className="text-[9px] font-black uppercase tracking-widest text-orange-300">Sem Motivo</div>
                                        <div className="mt-2 text-xl font-black text-white">{softphoneStats.blockedWithoutReason}</div>
                                    </div>
                                    <div className="rounded-2xl border border-violet-500/10 bg-violet-500/5 p-3">
                                        <div className="text-[9px] font-black uppercase tracking-widest text-violet-300">Sem MAC</div>
                                        <div className="mt-2 text-xl font-black text-white">{softphoneStats.missingMac}</div>
                                    </div>
                                </div>
                                {topBlockedReasons.length > 0 && (
                                    <div className="rounded-2xl border border-rose-500/10 bg-rose-500/5 p-4 text-sm text-rose-100">
                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-300">
                                            Motivos de bloqueio
                                        </div>
                                        <div className="mt-3 space-y-2">
                                            {topBlockedReasons.map(([reason, count]) => (
                                                <div key={reason} className="flex items-center justify-between gap-3">
                                                    <span className="truncate text-rose-50">{reason}</span>
                                                    <span className="rounded-full bg-rose-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-rose-200">
                                                        {count}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setActiveTab('internet')}
                                        className="w-full rounded-2xl border border-indigo-500/20 bg-indigo-500/10 px-4 py-3 text-xs font-black uppercase tracking-widest text-indigo-300 transition hover:bg-indigo-500/20"
                                    >
                                        Abrir painel tecnico
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('residents')}
                                        className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-200 transition hover:border-slate-500"
                                    >
                                        Abrir moradores
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bento-card border-rose-500/20 bg-rose-600/5 flex items-center justify-between">
                        <div>
                            <h4 className="font-black text-white uppercase tracking-tighter text-lg">Suporte Técnico</h4>
                            <p className="text-slate-500 text-xs font-bold mt-1">Dúvidas sobre o novo layout?</p>
                        </div>
                        <button className="p-4 bg-rose-600 text-white rounded-2xl shadow-lg shadow-rose-900/30 hover:scale-110 transition-transform">
                            <MessageSquare size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Modals for Quick Actions - Styled for Dark Theme */}
            {showRepairModal && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl shadow-black relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-600 to-transparent"></div>
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-black text-white tracking-tighter">Solicitar Reparo</h3>
                            <button onClick={() => setShowRepairModal(false)} className="bg-slate-800 p-2 rounded-xl text-slate-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateRepair} className="space-y-6">
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Título do Problema</label>
                                <input type="text" required value={repairTitle} onChange={e => setRepairTitle(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all outline-none" placeholder="Ex: Chuveiro não esquenta" />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Local do Incidente</label>
                                <select required value={repairRoom} onChange={e => setRepairRoom(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all outline-none appearance-none">
                                    <option value="">Selecione um cômodo</option>
                                    {isAdmin ? rooms.map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    )) : rooms.filter(r => r.id === currentUser.room_id || r.type === RoomType.KITCHEN || r.type === RoomType.BATHROOM || r.type === RoomType.LAUNDRY || r.type === RoomType.LIVING_ROOM).map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Descrição Detalhada</label>
                                <textarea required value={repairDesc} onChange={e => setRepairDesc(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all outline-none h-32 resize-none" placeholder="Conte-nos o que aconteceu..."></textarea>
                            </div>
                            <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-rose-700 transition-all active:scale-95 shadow-xl shadow-rose-900/30">
                                {isSubmitting ? 'Processando...' : 'Abrir Chamado'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {showComplaintModal && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl shadow-black relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-600 to-transparent"></div>
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-black text-white tracking-tighter">Nova Reclamação</h3>
                            <button onClick={() => setShowComplaintModal(false)} className="bg-slate-800 p-2 rounded-xl text-slate-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateComplaint} className="space-y-6">
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Assunto</label>
                                <input type="text" required value={complaintTitle} onChange={e => setComplaintTitle(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all outline-none" placeholder="Ex: Barulho após às 22h" />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Mensagem</label>
                                <textarea required value={complaintDesc} onChange={e => setComplaintDesc(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all outline-none h-32 resize-none" placeholder="Descreva sua reclamação..."></textarea>
                            </div>
                            <label className="flex items-center gap-4 p-5 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition-all">
                                <input type="checkbox" checked={complaintAnon} onChange={e => setComplaintAnon(e.target.checked)} className="w-5 h-5 rounded border-slate-800 bg-slate-900 text-rose-600 focus:ring-rose-500/20" />
                                <span className="text-sm font-bold text-slate-400">Denúncia Anônima</span>
                            </label>
                            <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-rose-700 transition-all active:scale-95 shadow-xl shadow-rose-900/30">
                                {isSubmitting ? 'Enviando...' : 'Registrar Ocorrência'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
