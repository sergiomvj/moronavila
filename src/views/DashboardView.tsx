import React, { useMemo, useState } from 'react';
import { Users, CreditCard, Wrench, LayoutDashboard, CheckCircle2, AlertCircle, Wifi, Droplets, Plus, MessageSquare, X } from 'lucide-react';
import { Payment, MaintenanceRequest, Resident, Room, PaymentStatus, MaintenanceStatus, LaundrySchedule, UserRole, RoomType } from '../types';
import { createMaintenanceRequest, createComplaint } from '../lib/database';

interface DashboardViewProps {
    payments: Payment[];
    maintenance: MaintenanceRequest[];
    residents: Resident[];
    rooms: Room[];
    laundrySchedules: LaundrySchedule[];
    currentUser: Resident;
    setActiveTab: (tab: string) => void;
}

const StatCard = ({ label, value, icon: Icon, colorClass, onClick }: { label: string, value: string | number | React.ReactNode, icon: any, colorClass: string, onClick?: () => void }) => (
    <div onClick={onClick} className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between ${onClick ? 'cursor-pointer hover:border-indigo-200 hover:shadow-md transition-all' : ''}`}>
        <div>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">{label}</p>
            <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${colorClass}`}>
            <Icon size={24} />
        </div>
    </div>
);

export function DashboardView({ payments, maintenance, residents, rooms, laundrySchedules, currentUser, setActiveTab }: DashboardViewProps) {
    const isAdmin = currentUser.role === UserRole.ADMIN;

    const [showComplaintModal, setShowComplaintModal] = useState(false);
    const [showRepairModal, setShowRepairModal] = useState(false);

    // Form states
    const [repairTitle, setRepairTitle] = useState('');
    const [repairDesc, setRepairDesc] = useState('');
    const [repairRoom, setRepairRoom] = useState(currentUser.room_id || '');
    const [complaintTitle, setComplaintTitle] = useState('');
    const [complaintDesc, setComplaintDesc] = useState('');
    const [complaintAnon, setComplaintAnon] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const stats = useMemo(() => {
        const myPayments = payments.filter(p => isAdmin || p.resident_id === currentUser.id);

        const myMaintenance = maintenance.filter(m => isAdmin || m.room_id === currentUser.room_id);

        const totalPayments = myPayments.reduce((acc, p) => acc + Number(p.amount), 0);
        const pendingPayments = myPayments.filter(p => p.status !== PaymentStatus.PAID).length;
        const openMaintenance = myMaintenance.filter(m => m.status === MaintenanceStatus.OPEN).length;

        const internetEnabled = residents.filter(r => r.internet_active).length;
        const internetBlocked = residents.filter(r => !r.internet_active).length;

        const today = new Date().toISOString().split('T')[0];
        const todaysLaundry = laundrySchedules.filter(l => l.date === today);
        const myTodaysLaundry = todaysLaundry.filter(l => isAdmin || l.resident_id === currentUser.id).length;

        return {
            totalPayments,
            pendingPayments,
            openMaintenance,
            totalResidents: residents.length,
            internetEnabled,
            internetBlocked,
            todaysLaundry: todaysLaundry.length,
            myTodaysLaundry
        };
    }, [payments, maintenance, residents, laundrySchedules, currentUser, isAdmin]);

    const handleCreateRepair = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await createMaintenanceRequest({
                room_id: repairRoom,
                title: repairTitle,
                description: repairDesc
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
        <div className="space-y-8">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-3xl font-bold mb-2">Bem-vindo(a), {currentUser.name.split(' ')[0]}! 👋</h2>
                    <p className="text-indigo-100 max-w-2xl text-sm sm:text-base">
                        {isAdmin
                            ? 'Aqui você tem o controle total da sua República. Acompanhe os pagamentos, aprove ou cadastre novos moradores e controle a infraestrutura do VPR.'
                            : 'Fique por dentro das novidades da casa, confira seus boletos do mês e acompanhe o andamento das suas solicitações de reparo.'}
                    </p>
                </div>
                {/* Decorative background circle */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            </div>

            <h2 className="text-2xl font-bold text-slate-800 -mb-2">Visão Geral</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {isAdmin ? (
                    <>
                        <StatCard
                            label="Internet (Hab/Bloq)"
                            value={`${stats.internetEnabled} / ${stats.internetBlocked}`}
                            icon={Wifi}
                            colorClass="bg-indigo-50 text-indigo-600"
                            onClick={() => setActiveTab('internet')}
                        />
                        <StatCard
                            label="Lavanderia (Hoje)"
                            value={stats.todaysLaundry}
                            icon={Droplets}
                            colorClass="bg-emerald-50 text-emerald-600"
                            onClick={() => setActiveTab('laundry')}
                        />
                        <StatCard
                            label="Manutenções Abertas"
                            value={stats.openMaintenance}
                            icon={Wrench}
                            colorClass="bg-rose-50 text-rose-600"
                            onClick={() => setActiveTab('maintenance')}
                        />
                        <StatCard
                            label="Pagamentos Pendentes"
                            value={stats.pendingPayments}
                            icon={CreditCard}
                            colorClass="bg-amber-50 text-amber-600"
                            onClick={() => setActiveTab('payments')}
                        />
                    </>
                ) : (
                    <>
                        <StatCard
                            label="Status da Internet"
                            value={currentUser.internet_active ? 'Habilitada' : 'Bloqueada'}
                            icon={Wifi}
                            colorClass={currentUser.internet_active ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}
                            onClick={() => setActiveTab('internet')}
                        />
                        <StatCard
                            label="Meus Agendamentos de Hoje"
                            value={stats.myTodaysLaundry}
                            icon={Droplets}
                            colorClass="bg-blue-50 text-blue-600"
                            onClick={() => setActiveTab('laundry')}
                        />
                        <StatCard
                            label="Meus Pagamentos Pendentes"
                            value={stats.pendingPayments}
                            icon={CreditCard}
                            colorClass="bg-amber-50 text-amber-600"
                            onClick={() => setActiveTab('payments')}
                        />
                        <StatCard
                            label="Meus Reparos Abertos"
                            value={stats.openMaintenance}
                            icon={Wrench}
                            colorClass="bg-rose-50 text-rose-600"
                            onClick={() => setActiveTab('maintenance')}
                        />
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Quick Actions */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center space-y-4">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Ações Rápidas</h3>
                    <div className="flex gap-4 w-full">
                        <button onClick={() => setShowRepairModal(true)} className="flex-1 flex flex-col items-center justify-center py-6 px-4 bg-rose-50 rounded-2xl border border-rose-100 hover:bg-rose-100 transition-colors text-rose-700 font-medium">
                            <Wrench size={32} className="mb-2" />
                            <span>Solicitar Reparo</span>
                        </button>
                        <button onClick={() => setShowComplaintModal(true)} className="flex-1 flex flex-col items-center justify-center py-6 px-4 bg-indigo-50 rounded-2xl border border-indigo-100 hover:bg-indigo-100 transition-colors text-indigo-700 font-medium">
                            <MessageSquare size={32} className="mb-2" />
                            <span>Nova Reclamação</span>
                        </button>
                    </div>
                </div>

                {/* Recent Maintenance restricted by role */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-slate-900">Manutenções Recentes</h3>
                        <button onClick={() => setActiveTab('maintenance')} className="text-indigo-600 text-sm font-medium hover:underline">Ver tudo</button>
                    </div>
                    <div className="space-y-4">
                        {maintenance
                            .filter(m => isAdmin || m.room_id === currentUser.room_id)
                            .slice(0, 3)
                            .map(m => (
                                <div key={m.id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                                    <div className={`p-2 rounded-lg ${m.status === MaintenanceStatus.RESOLVED ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                        {m.status === MaintenanceStatus.RESOLVED ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-slate-900 text-sm">{m.title}</p>
                                        <p className="text-slate-500 text-xs">{rooms.find(r => r.id === m.room_id)?.name || 'Cômodo partilhado / desconhecido'}</p>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            </div>

            {/* Modals for Quick Actions */}
            {showRepairModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">Solicitar Reparo</h3>
                            <button onClick={() => setShowRepairModal(false)} className="text-slate-400 hover:text-slate-700">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateRepair} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Título</label>
                                <input type="text" required value={repairTitle} onChange={e => setRepairTitle(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-rose-500/20" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Local (Cômodo)</label>
                                <select required value={repairRoom} onChange={e => setRepairRoom(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-rose-500/20">
                                    <option value="">Selecione um cômodo</option>
                                    {isAdmin ? rooms.map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    )) : rooms.filter(r => r.id === currentUser.room_id || r.type === RoomType.KITCHEN || r.type === RoomType.BATHROOM || r.type === RoomType.LAUNDRY || r.type === RoomType.LIVING_ROOM).map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Descrição</label>
                                <textarea required value={repairDesc} onChange={e => setRepairDesc(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-rose-500/20 h-24 resize-none"></textarea>
                            </div>
                            <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-colors">
                                {isSubmitting ? 'Salvando...' : 'Abrir Solicitação'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {showComplaintModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">Nova Reclamação</h3>
                            <button onClick={() => setShowComplaintModal(false)} className="text-slate-400 hover:text-slate-700">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateComplaint} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Título</label>
                                <input type="text" required value={complaintTitle} onChange={e => setComplaintTitle(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500/20" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Descrição</label>
                                <textarea required value={complaintDesc} onChange={e => setComplaintDesc(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500/20 h-24 resize-none"></textarea>
                            </div>
                            <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                                <input type="checkbox" checked={complaintAnon} onChange={e => setComplaintAnon(e.target.checked)} className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500" />
                                <span className="text-sm font-medium text-slate-700">Enviar anonimamente</span>
                            </label>
                            <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors">
                                {isSubmitting ? 'Enviando...' : 'Registrar Reclamação'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
