import React, { useState } from 'react';
import { MessageSquare, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { Complaint, Resident } from '../types';
import { createComplaint } from '../lib/database';

interface ComplaintsViewProps {
    complaints: Complaint[];
    residents: Resident[];
    isAdmin: boolean;
    currentUser: Resident;
    onRefresh: () => void;
}

export function ComplaintsView({ complaints, residents, isAdmin, currentUser, onRefresh }: ComplaintsViewProps) {
    const [showComplaintModal, setShowComplaintModal] = useState(false);
    const [complaintTitle, setComplaintTitle] = useState('');
    const [complaintDesc, setComplaintDesc] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const visibleComplaints = isAdmin ? complaints : complaints.filter(c => c.resident_id === currentUser.id);

    const handleCreateComplaint = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await createComplaint({
                resident_id: currentUser.id,
                title: complaintTitle,
                description: complaintDesc,
                is_anonymous: isAnonymous
            });
            setShowComplaintModal(false);
            setComplaintTitle('');
            setComplaintDesc('');
            setIsAnonymous(false);
            onRefresh();
        } catch (err) {
            alert('Erro ao registrar reclamação.');
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Reclamações e Sugestões</h2>
                    <p className="text-slate-500 text-sm">Canal de comunicação direta com a administração</p>
                </div>
                {!isAdmin && (
                    <button
                        onClick={() => setShowComplaintModal(true)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium hover:bg-indigo-700 transition-colors"
                    >
                        Nova Reclamação
                    </button>
                )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-0">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Assunto / Morador</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Descrição</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Data</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {visibleComplaints.map(c => {
                                const resident = residents.find(r => r.id === c.resident_id);
                                return (
                                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900 text-sm mb-1">{c.title}</div>
                                            <div className="text-xs text-slate-500">{resident?.name || 'Desconhecido'}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 max-w-md truncate">
                                            {c.description}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {new Date(c.created_at).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {c.status === 'resolvido' ? (
                                                <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-[10px] font-bold uppercase inline-flex items-center gap-1">
                                                    <CheckCircle2 size={12} /> Resolvido
                                                </span>
                                            ) : c.status === 'em_analise' ? (
                                                <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-[10px] font-bold uppercase inline-flex items-center gap-1">
                                                    <Clock size={12} /> Em Análise
                                                </span>
                                            ) : (
                                                <span className="bg-rose-100 text-rose-700 px-2 py-1 rounded-full text-[10px] font-bold uppercase inline-flex items-center gap-1">
                                                    <AlertCircle size={12} /> Nova
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {visibleComplaints.length === 0 && (
                        <div className="text-center py-12">
                            <MessageSquare size={48} className="mx-auto text-slate-300 mb-4" />
                            <p className="text-slate-500 font-medium">Nenhuma reclamação registrada.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Nova Reclamação Modal */}
            {showComplaintModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-lg">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">Nova Reclamação / Sugestão</h3>
                            <button onClick={() => setShowComplaintModal(false)} className="text-slate-400 hover:text-slate-700">
                                {/* Pode usar X aqui importado ou só texto */}
                                <span className="text-xl leading-none">&times;</span>
                            </button>
                        </div>
                        <form onSubmit={handleCreateComplaint} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Assunto</label>
                                <input
                                    type="text"
                                    required
                                    value={complaintTitle}
                                    onChange={e => setComplaintTitle(e.target.value)}
                                    placeholder="Ex: Barulho no corredor, lâmpada queimada..."
                                    className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500/20"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Descrição</label>
                                <textarea
                                    required
                                    rows={4}
                                    value={complaintDesc}
                                    onChange={e => setComplaintDesc(e.target.value)}
                                    placeholder="Descreva o problema ou sugestão em detalhes..."
                                    className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500/20 resize-none"
                                />
                            </div>
                            <div className="flex items-center gap-2 mt-4">
                                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isAnonymous}
                                        onChange={(e) => setIsAnonymous(e.target.checked)}
                                        className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                                    />
                                    Enviar de forma anônima?
                                </label>
                            </div>
                            <div className="flex justify-end gap-3 pt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowComplaintModal(false)}
                                    className="px-6 py-3 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2"
                                >
                                    {isSubmitting ? 'Enviando...' : 'Enviar Reclamação'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
