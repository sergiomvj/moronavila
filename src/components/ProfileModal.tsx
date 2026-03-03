import React, { useState } from 'react';
import { X, Lock, Save } from 'lucide-react';
import { Resident } from '../types';
import { updateResident, updatePassword } from '../lib/database';

interface ProfileModalProps {
    currentUser: Resident;
    onClose: () => void;
    onUpdate: () => void;
}

export function ProfileModal({ currentUser, onClose, onUpdate }: ProfileModalProps) {
    const [editingResident, setEditingResident] = useState<Resident>({ ...currentUser });
    const [newPassword, setNewPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage({ text: '', type: '' });
        try {
            // Atualizar os dados do morador
            await updateResident(editingResident.id, editingResident);

            // Atualizar senha se fornecida
            if (newPassword) {
                if (newPassword.length < 6) {
                    setMessage({ text: 'A senha deve ter pelo menos 6 caracteres.', type: 'error' });
                    setIsSubmitting(false);
                    return;
                }
                await updatePassword(newPassword);
            }

            setMessage({ text: 'Perfil atualizado com sucesso!', type: 'success' });
            setTimeout(() => {
                onUpdate();
                onClose();
            }, 1000);
        } catch (err: any) {
            setMessage({ text: err.message || 'Erro ao atualizar perfil.', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">Meu Perfil</h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {message.text && (
                    <div className={`mb-6 p-4 rounded-xl border ${message.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSave} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Nome</label>
                            <input type="text" value={editingResident.name} onChange={e => setEditingResident({ ...editingResident, name: e.target.value })} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500/20" required />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Telefone</label>
                            <input type="text" value={editingResident.phone} onChange={e => setEditingResident({ ...editingResident, phone: e.target.value })} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500/20" required />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">E-mail</label>
                            <input type="email" value={editingResident.email} disabled className="w-full bg-slate-50 text-slate-500 border border-slate-200 rounded-xl p-3" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Nova Senha <span className="text-slate-400 font-normal">(Opcional)</span></label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="password"
                                    placeholder="Mínimo de 6 caracteres"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    className="w-full border border-slate-200 rounded-xl p-3 pl-10 focus:ring-2 focus:ring-indigo-500/20"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Data de Nascimento</label>
                            <input type="date" value={editingResident.birth_date} onChange={e => setEditingResident({ ...editingResident, birth_date: e.target.value })} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500/20" required />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Data de Entrada</label>
                            <input type="date" value={editingResident.entry_date} disabled className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 text-slate-500" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-slate-700 mb-1">Endereço de Origem</label>
                            <input type="text" value={editingResident.origin_address} onChange={e => setEditingResident({ ...editingResident, origin_address: e.target.value })} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500/20" required />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-slate-700 mb-1">Endereço de Trabalho</label>
                            <input type="text" value={editingResident.work_address} onChange={e => setEditingResident({ ...editingResident, work_address: e.target.value })} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500/20" required />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                        <button type="button" onClick={onClose} className="px-6 py-3 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors">
                            <Save size={18} />
                            {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
