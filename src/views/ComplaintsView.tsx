import React from 'react';
import { MessageSquare, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { Complaint, Resident } from '../types';

interface ComplaintsViewProps {
    complaints: Complaint[];
    residents: Resident[];
    isAdmin: boolean;
    currentUser: Resident;
    // onRefresh: () => void;
}

export function ComplaintsView({ complaints, residents, isAdmin, currentUser }: ComplaintsViewProps) {
    const visibleComplaints = isAdmin ? complaints : complaints.filter(c => c.resident_id === currentUser.id);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Reclamações e Sugestões</h2>
                    <p className="text-slate-500 text-sm">Canal de comunicação direta com a administração</p>
                </div>
                {!isAdmin && (
                    <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium hover:bg-indigo-700 transition-colors">
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
        </div>
    );
}
