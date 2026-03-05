import React, { useState } from 'react';
import { CreditCard, CheckCircle2, AlertCircle, QrCode, ArrowRight, Wallet, Calendar, User, Info, DollarSign } from 'lucide-react';
import { Payment, Resident, PaymentStatus } from '../types';
import { updatePaymentStatus, renewInternetAccess } from '../lib/database';
import { PixPaymentModal } from '../components/PixPaymentModal';

interface PaymentsViewProps {
    payments: Payment[];
    residents: Resident[];
    isAdmin: boolean;
    currentUser: Resident;
    onRefresh: () => void;
}

export function PaymentsView({ payments, residents, isAdmin, currentUser, onRefresh }: PaymentsViewProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedPixPayment, setSelectedPixPayment] = useState<Payment | null>(null);

    // Filtra pagamentos para mostrar apenas os do usuário, a não ser que seja admin
    const visiblePayments = isAdmin ? payments : payments.filter(p => p.resident_id === currentUser.id);

    const handleConfirmPayment = async (paymentId: string, residentId: string) => {
        if (!isAdmin) return;
        setIsProcessing(true);
        try {
            await updatePaymentStatus(paymentId, PaymentStatus.PAID, residentId);
            await renewInternetAccess(residentId);
            onRefresh();
        } catch (e) {
            alert('Erro ao confirmar pagamento.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header section with Stats */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Painel Financeiro</h2>
                    <p className="text-slate-500 font-bold text-sm uppercase tracking-widest mt-1">Gestão de mensalidades e fluxos de recebimento</p>
                </div>
                {!isAdmin && (
                    <div className="flex gap-4">
                        <div className="bg-slate-900 px-6 py-4 rounded-2xl border border-slate-800 flex flex-col items-end">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total Pendente</span>
                            <span className="text-xl font-black text-rose-500">
                                R$ {visiblePayments.filter(p => p.status !== PaymentStatus.PAID).reduce((acc, p) => acc + p.amount, 0).toFixed(2)}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Payments List (Bento-style Grid) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {visiblePayments.length > 0 ? visiblePayments.map(p => {
                    const resident = residents.find(r => r.id === p.resident_id);
                    const isPaid = p.status === PaymentStatus.PAID;
                    const isPending = p.status === PaymentStatus.PENDING;

                    return (
                        <div key={p.id} className={`bento-card group hover:!border-rose-600/50 transition-all overflow-hidden flex flex-col
                            ${isPaid ? 'border-emerald-900/20' : isPending ? 'border-amber-900/20' : 'border-rose-900/30 shadow-xl shadow-rose-950/10'}`}>

                            {/* Status Stripe */}
                            <div className={`h-1.5 w-full mb-6 rounded-full opacity-50
                                ${isPaid ? 'bg-emerald-500' : isPending ? 'bg-amber-500' : 'bg-rose-600'}`}></div>

                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Wallet size={12} className="text-slate-500" />
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">{p.month}</span>
                                    </div>
                                    <h3 className="text-xl font-black text-white uppercase tracking-tight truncate max-w-[180px]">
                                        {isAdmin ? resident?.name || 'Sistema' : 'Mensalidade'}
                                    </h3>
                                </div>
                                <div className="text-right">
                                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg border
                                        ${isPaid ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                            isPending ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                                        {p.status}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-3 mb-8 flex-grow">
                                <div className="flex justify-between items-center text-slate-400">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} />
                                        <span className="text-[10px] uppercase font-black tracking-widest">Vencimento</span>
                                    </div>
                                    <span className="text-xs font-bold text-white">{p.due_date}</span>
                                </div>
                                <div className="flex justify-between items-center text-slate-400">
                                    <div className="flex items-center gap-2">
                                        <Info size={14} />
                                        <span className="text-[10px] uppercase font-black tracking-widest">Serviços</span>
                                    </div>
                                    <span className="text-xs font-medium">Aluguel + Internet</span>
                                </div>
                            </div>

                            <div className="bg-slate-950 -mx-8 -mb-8 p-6 flex items-center justify-between border-t border-slate-800/50">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total</span>
                                    <span className="text-2xl font-black text-white tracking-tighter">R$ {p.amount.toFixed(2)}</span>
                                </div>

                                {isPaid ? (
                                    <div className="flex items-center gap-2 text-emerald-500 font-black text-[10px] uppercase tracking-widest">
                                        <CheckCircle2 size={16} /> Pago
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        {isAdmin ? (
                                            <button
                                                onClick={() => handleConfirmPayment(p.id, p.resident_id)}
                                                disabled={isProcessing}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-emerald-900/20"
                                                title="Confirmar Recebimento"
                                            >
                                                <CheckCircle2 size={20} />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => setSelectedPixPayment(p)}
                                                className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-3 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-rose-900/30"
                                            >
                                                <QrCode size={18} /> Pagar PIX
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                }) : (
                    <div className="lg:col-span-12 py-24 text-center border-2 border-dashed border-slate-800 rounded-[3rem]">
                        <CreditCard size={64} className="mx-auto text-slate-800 mb-6" />
                        <h3 className="text-2xl font-black text-slate-700 uppercase tracking-tighter">Sem registros financeiros</h3>
                        <p className="text-slate-600 font-bold text-xs uppercase tracking-widest mt-2">Nenhum título gerado para este período</p>
                    </div>
                )}
            </div>

            {/* Empty State / Tips when not admin */}
            {!isAdmin && visiblePayments.length > 0 && (
                <div className="bento-card bg-slate-900/30 border-dashed">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-rose-600/10 rounded-2xl text-rose-500">
                            <Info size={24} />
                        </div>
                        <div>
                            <h4 className="font-black text-white uppercase text-sm tracking-tight">Dica de Pagamento</h4>
                            <p className="text-[11px] text-slate-500 font-medium leading-relaxed max-w-xl">
                                Utilize a opção **PIX** para liberação imediata do seu acesso à internet. Pagamentos confirmados via PIX são processados em tempo real pela nossa rede.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* PIX Modal UI */}
            {selectedPixPayment && (
                <PixPaymentModal
                    payment={selectedPixPayment}
                    residentId={currentUser.id}
                    onClose={() => setSelectedPixPayment(null)}
                    onSuccess={() => {
                        setSelectedPixPayment(null);
                        onRefresh();
                    }}
                />
            )}
        </div>
    );
}
