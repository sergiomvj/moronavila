import React, { useState } from 'react';
import { CreditCard, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { Payment, Resident, PaymentStatus } from '../types';
import { updatePaymentStatus, renewInternetAccess } from '../lib/database';

interface PaymentsViewProps {
    payments: Payment[];
    residents: Resident[];
    isAdmin: boolean;
    currentUser: Resident;
    onRefresh: () => void;
}

export function PaymentsView({ payments, residents, isAdmin, currentUser, onRefresh }: PaymentsViewProps) {
    const [isProcessing, setIsProcessing] = useState(false);

    // Filtra pagamentos para mostrar apenas os do usuário, a não ser que seja admin
    const visiblePayments = isAdmin ? payments : payments.filter(p => p.resident_id === currentUser.id);

    const handleConfirmPayment = async (paymentId: string, residentId: string) => {
        if (!isAdmin) return;
        setIsProcessing(true);
        try {
            // 1. Atualizar status do pagamento
            await updatePaymentStatus(paymentId, PaymentStatus.PAID, residentId);
            // 2. Renovar acesso à internet (Lógica de renovação a cada pagamento mensal confirmado)
            await renewInternetAccess(residentId);

            onRefresh();
        } catch (e) {
            alert('Erro ao confirmar pagamento.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Financeiro</h2>
                    <p className="text-slate-500 text-sm">Gestão de mensalidades e status da internet</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Morador</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Valor</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Vencimento</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Competência</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                            {isAdmin && <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {visiblePayments.map(p => {
                            const resident = residents.find(r => r.id === p.resident_id);
                            return (
                                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-900 text-sm">{resident?.name || 'Desconhecido'}</td>
                                    <td className="px-6 py-4 font-bold text-slate-900 text-sm">R$ {p.amount}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{p.due_date}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{p.month}</td>
                                    <td className="px-6 py-4">
                                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${p.status === PaymentStatus.PAID ? 'bg-emerald-100 text-emerald-700' :
                                            p.status === PaymentStatus.PENDING ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                                            }`}>
                                            {p.status}
                                        </span>
                                    </td>
                                    {isAdmin && (
                                        <td className="px-6 py-4 text-right">
                                            {p.status !== PaymentStatus.PAID && (
                                                <button
                                                    onClick={() => handleConfirmPayment(p.id, p.resident_id)}
                                                    disabled={isProcessing}
                                                    className="px-3 py-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 flex flex-row items-center justify-end w-full gap-2"
                                                >
                                                    <CheckCircle2 size={16} /> Receber
                                                </button>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
                {visiblePayments.length === 0 && (
                    <div className="text-center py-12">
                        <CreditCard size={48} className="mx-auto text-slate-300 mb-4" />
                        <p className="text-slate-500 font-medium">Nenhum pagamento registrado.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
