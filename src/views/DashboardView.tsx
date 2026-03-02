import React, { useMemo } from 'react';
import { Users, CreditCard, Wrench, LayoutDashboard, CheckCircle2, AlertCircle } from 'lucide-react';
import { Payment, MaintenanceRequest, Resident, Room, PaymentStatus, MaintenanceStatus } from '../types';

interface DashboardViewProps {
    payments: Payment[];
    maintenance: MaintenanceRequest[];
    residents: Resident[];
    rooms: Room[];
    setActiveTab: (tab: string) => void;
}

const StatCard = ({ label, value, icon: Icon, colorClass }: { label: string, value: string | number, icon: any, colorClass: string }) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">{label}</p>
            <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${colorClass}`}>
            <Icon size={24} />
        </div>
    </div>
);

export function DashboardView({ payments, maintenance, residents, rooms, setActiveTab }: DashboardViewProps) {
    const stats = useMemo(() => {
        const totalPayments = payments.reduce((acc, p) => acc + Number(p.amount), 0);
        const pendingPayments = payments.filter(p => p.status !== PaymentStatus.PAID).length;
        const openMaintenance = maintenance.filter(m => m.status === MaintenanceStatus.OPEN).length;
        return {
            totalPayments,
            pendingPayments,
            openMaintenance,
            totalResidents: residents.length
        };
    }, [payments, maintenance, residents]);

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Moradores" value={stats.totalResidents} icon={Users} colorClass="bg-blue-50 text-blue-600" />
                <StatCard label="Pagamentos Pendentes" value={stats.pendingPayments} icon={CreditCard} colorClass="bg-amber-50 text-amber-600" />
                <StatCard label="Manutenções Abertas" value={stats.openMaintenance} icon={Wrench} colorClass="bg-rose-50 text-rose-600" />
                <StatCard label="Receita Mensal" value={`R$ ${stats.totalPayments}`} icon={LayoutDashboard} colorClass="bg-emerald-50 text-emerald-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Maintenance */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-slate-900">Manutenções Recentes</h3>
                        <button onClick={() => setActiveTab('maintenance')} className="text-indigo-600 text-sm font-medium hover:underline">Ver tudo</button>
                    </div>
                    <div className="space-y-4">
                        {maintenance.slice(0, 3).map(m => (
                            <div key={m.id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                                <div className={`p-2 rounded-lg ${m.status === MaintenanceStatus.RESOLVED ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                    {m.status === MaintenanceStatus.RESOLVED ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-slate-900 text-sm">{m.title}</p>
                                    <p className="text-slate-500 text-xs">{rooms.find(r => r.id === m.room_id)?.name || 'Cômodo não encontrado'}</p>
                                </div>
                                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${m.status === MaintenanceStatus.RESOLVED ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                    }`}>
                                    {m.status}
                                </span>
                            </div>
                        ))}
                        {maintenance.length === 0 && <p className="text-sm text-slate-500 text-center py-4">Nenhuma manutenção recente.</p>}
                    </div>
                </div>

                {/* Recent Payments */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-slate-900">Pagamentos Pendentes</h3>
                        <button onClick={() => setActiveTab('payments')} className="text-indigo-600 text-sm font-medium hover:underline">Ver tudo</button>
                    </div>
                    <div className="space-y-4">
                        {payments.filter(p => p.status !== PaymentStatus.PAID).slice(0, 3).map(p => {
                            const resident = residents.find(res => res.id === p.resident_id);
                            return (
                                <div key={p.id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs uppercase">
                                        {resident?.name.charAt(0) || '?'}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-slate-900 text-sm">{resident?.name || 'Desconhecido'}</p>
                                        <p className="text-slate-500 text-xs">Vencimento: {p.due_date}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-slate-900 text-sm">R$ {p.amount}</p>
                                        <span className={`text-[10px] font-bold uppercase ${p.status === PaymentStatus.OVERDUE ? 'text-rose-600' : 'text-amber-600'}`}>
                                            {p.status}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                        {payments.filter(p => p.status !== PaymentStatus.PAID).length === 0 && (
                            <p className="text-sm text-slate-500 text-center py-4">Nenhum pagamento pendente.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
