import React, { useState } from 'react';
import { CreditCard, CheckCircle2, AlertCircle, QrCode, ArrowRight, Wallet, Calendar, User, Info, DollarSign, Plus, X } from 'lucide-react';
import { Payment, Resident, PaymentStatus } from '../types';
import { updatePaymentStatus, renewInternetAccess, createPayment } from '../lib/database';
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
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [showExtraModal, setShowExtraModal] = useState(false);
    const [bulkMonth, setBulkMonth] = useState(`${new Date().toLocaleString('pt-BR', { month: 'long' })} ${new Date().getFullYear()}`);
    const [bulkDueDate, setBulkDueDate] = useState(new Date().toISOString().split('T')[0]);

    // Extra charge states
    const [extraResidentId, setExtraResidentId] = useState('');
    const [extraAmount, setExtraAmount] = useState(0);
    const [extraDesc, setExtraDesc] = useState('');
    const [extraDueDate, setExtraDueDate] = useState(new Date().toISOString().split('T')[0]);

    // Filtra pagamentos para mostrar apenas os do usuário, a não ser que seja admin
    const visiblePayments = isAdmin ? payments : payments.filter(p => p.resident_id === currentUser.id);

    const handleGenerateBulk = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        try {
            const activeResidents = residents.filter(r => r.status === 'Ativo');

            for (const resident of activeResidents) {
                const amount = (resident.rent_value || 0) + (resident.cleaning_fee || 0) + (resident.extras_value || 0);
                if (amount <= 0) continue;

                await createPayment({
                    resident_id: resident.id,
                    amount,
                    due_date: bulkDueDate,
                    month: bulkMonth,
                    status: PaymentStatus.PENDING,
                    description: `Mensalidade - ${bulkMonth}`,
                    type: 'Mensalidade'
                });
            }

            setShowBulkModal(false);
            onRefresh();
            alert(`Mensalidades de ${bulkMonth} geradas com sucesso para ${activeResidents.length} moradores.`);
        } catch (e) {
            alert('Erro ao gerar mensalidades em massa.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCreateExtra = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!extraResidentId) return;
        setIsProcessing(true);
        try {
            await createPayment({
                resident_id: extraResidentId,
                amount: extraAmount,
                due_date: extraDueDate,
                month: new Date().toLocaleString('pt-BR', { month: 'long' }) + ' ' + new Date().getFullYear(),
                status: PaymentStatus.PENDING,
                description: extraDesc,
                type: 'Extra'
            });
            setShowExtraModal(false);
            setExtraAmount(0);
            setExtraDesc('');
            onRefresh();
            alert('Cobrança extra gerada com sucesso.');
        } catch (e) {
            alert('Erro ao gerar cobrança extra.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConfirmPayment = async (paymentId: string, residentId: string) => {
        if (!isAdmin) return;
        setIsProcessing(true);
        try {
            await updatePaymentStatus(paymentId, PaymentStatus.PAID, residentId);
            await renewInternetAccess(residentId);
            onRefresh();
            alert('Pagamento confirmado e internet renovada com sucesso.');
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
                {isAdmin ? (
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowBulkModal(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-indigo-900/30"
                        >
                            <Calendar size={18} /> Gerar Mensalidades
                        </button>
                        <button
                            onClick={() => setShowExtraModal(true)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-emerald-900/30"
                        >
                            <Plus size={18} /> Cobrança Extra
                        </button>
                    </div>
                ) : (
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

            {/* Bulk Generation Modal */}
            {showBulkModal && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 md:p-8 w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">Gerar Faturas do Período</h3>
                            <button onClick={() => setShowBulkModal(false)} className="bg-slate-800 p-2 rounded-xl text-slate-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleGenerateBulk} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Mês de Referência</label>
                                <input type="text" value={bulkMonth} onChange={e => setBulkMonth(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white focus:border-rose-500 outline-none transition-all" placeholder="Ex: Março 2024" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Vencimento Padrão</label>
                                <input type="date" value={bulkDueDate} onChange={e => setBulkDueDate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white focus:border-rose-500 outline-none transition-all" />
                            </div>
                            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
                                <p className="text-[10px] text-indigo-400 font-bold leading-relaxed">
                                    Esta ação gerará faturas para todos os **moradores ativos** com base nos valores definidos em seus cadastros individuais.
                                </p>
                            </div>
                            <button type="submit" disabled={isProcessing} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-900/30 transition-all">
                                {isProcessing ? 'Gerando...' : 'Confirmar Geração'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Extra Charge Modal */}
            {showExtraModal && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 md:p-8 w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">Cobrança Avulsa</h3>
                            <button onClick={() => setShowExtraModal(false)} className="bg-slate-800 p-2 rounded-xl text-slate-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateExtra} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Morador</label>
                                <select value={extraResidentId} onChange={e => setExtraResidentId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white focus:border-rose-500 outline-none transition-all appearance-none" required>
                                    <option value="">Selecione um morador</option>
                                    {residents.map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Valor (R$)</label>
                                    <input type="number" step="0.01" value={extraAmount} onChange={e => setExtraAmount(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white focus:border-rose-500 outline-none transition-all" required />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Vencimento</label>
                                    <input type="date" value={extraDueDate} onChange={e => setExtraDueDate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white focus:border-rose-500 outline-none transition-all" required />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Descrição</label>
                                <textarea value={extraDesc} onChange={e => setExtraDesc(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white focus:border-rose-500 outline-none transition-all min-h-[100px]" placeholder="Ex: Taxa de quebra de mobiliário, multa por barulho..." required />
                            </div>
                            <button type="submit" disabled={isProcessing} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-900/30 transition-all">
                                {isProcessing ? 'Gerando...' : 'Gerar Cobrança'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
