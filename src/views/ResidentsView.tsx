import React, { useState } from 'react';
import { Users, Search, Edit2, Shield, User as UserIcon, X, Wifi } from 'lucide-react';
import { Resident, UserRole } from '../types';
import { updateResident, signUpAdmin } from '../lib/database';

interface ResidentsViewProps {
    residents: Resident[];
    isAdmin: boolean;
    currentUser: Resident;
    onRefresh: () => void;
}

export function ResidentsView({ residents, isAdmin, currentUser, onRefresh }: ResidentsViewProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [editingResident, setEditingResident] = useState<Resident | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Create Admin States
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [adminName, setAdminName] = useState('');
    const [adminPhone, setAdminPhone] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [adminError, setAdminError] = useState('');

    const filteredResidents = residents.filter(r =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleEditClick = (resident: Resident) => {
        // Apenas admin ou o próprio usuário pode editar
        if (isAdmin || currentUser.id === resident.id) {
            setEditingResident(resident);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingResident) return;
        setIsSubmitting(true);
        try {
            await updateResident(editingResident.id, editingResident);
            setEditingResident(null);
            onRefresh();
        } catch (err) {
            alert('Erro ao atualizar morador.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setAdminError('');
        try {
            await signUpAdmin(adminEmail, adminPassword, adminName, adminPhone);
            setShowAdminModal(false);
            setAdminName(''); setAdminPhone(''); setAdminEmail(''); setAdminPassword('');
            alert('Novo administrador cadastrado com sucesso!');
            onRefresh();
        } catch (err: any) {
            setAdminError(err.message || 'Erro ao cadastrar administrador.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-slate-900">Moradores</h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar moradores..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full sm:w-64 bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-500/20"
                    />
                </div>
                {isAdmin && (
                    <button
                        onClick={() => setShowAdminModal(true)}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-700 transition"
                    >
                        <Shield size={18} />
                        <span className="hidden sm:inline">Adicionar Admin</span>
                    </button>
                )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Morador</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contato</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Internet</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredResidents.map(resident => (
                                <tr key={resident.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold uppercase">
                                                {resident.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900 flex items-center gap-2">
                                                    {resident.name}
                                                    {resident.role === UserRole.ADMIN && <Shield size={14} className="text-indigo-600" />}
                                                </div>
                                                <div className="text-xs text-slate-500">Entrada: {resident.entry_date}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-slate-900">{resident.phone}</div>
                                        <div className="text-xs text-slate-500">{resident.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${resident.status === 'Ativo' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                            }`}>
                                            {resident.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Wifi size={16} className={resident.internet_active ? 'text-emerald-500' : 'text-slate-300'} />
                                            <div className="text-xs text-slate-500">
                                                {resident.mac_address || 'Sem MAC cadastrado'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {(isAdmin || currentUser.id === resident.id) && (
                                            <button
                                                onClick={() => handleEditClick(resident)}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors inline-block"
                                                title="Editar"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredResidents.length === 0 && (
                        <div className="text-center py-12">
                            <UserIcon size={48} className="mx-auto text-slate-300 mb-4" />
                            <p className="text-slate-500 font-medium">Nenhum morador encontrado.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Resident Modal */}
            {editingResident && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">Editar Morador</h3>
                            <button
                                onClick={() => setEditingResident(null)}
                                className="text-slate-400 hover:text-slate-700"
                            >
                                <X size={20} />
                            </button>
                        </div>

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
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Data de Nascimento</label>
                                    <input type="date" value={editingResident.birth_date} onChange={e => setEditingResident({ ...editingResident, birth_date: e.target.value })} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500/20" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Data de Entrada</label>
                                    <input type="date" value={editingResident.entry_date} onChange={e => setEditingResident({ ...editingResident, entry_date: e.target.value })} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500/20" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Endereço de Origem</label>
                                    <input type="text" value={editingResident.origin_address} onChange={e => setEditingResident({ ...editingResident, origin_address: e.target.value })} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500/20" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Endereço de Trabalho</label>
                                    <input type="text" value={editingResident.work_address} onChange={e => setEditingResident({ ...editingResident, work_address: e.target.value })} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500/20" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">MAC Address (WiFi)</label>
                                    <input type="text" value={editingResident.mac_address || ''} onChange={e => setEditingResident({ ...editingResident, mac_address: e.target.value })} placeholder="Ex: 00:1B:44:11:3A:B7" className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500/20 font-mono" />
                                </div>
                                {isAdmin && (
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Status de Internet</label>
                                        <div className="flex items-center gap-2 h-12">
                                            <input type="checkbox" checked={editingResident.internet_active || false} onChange={e => setEditingResident({ ...editingResident, internet_active: e.target.checked })} className="w-5 h-5 text-indigo-600 rounded" />
                                            <span className="text-sm font-medium">Acesso Ativo</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => setEditingResident(null)} className="px-6 py-3 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={isSubmitting} className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors">
                                    {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Admin Modal */}
            {showAdminModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold flex items-center gap-2 text-indigo-900"><Shield className="text-indigo-600" /> Cadastrar Administrador</h3>
                            <button onClick={() => setShowAdminModal(false)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
                        </div>

                        {adminError && <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm mb-4">{adminError}</div>}

                        <form onSubmit={handleCreateAdmin} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Nome Completo</label>
                                <input type="text" value={adminName} onChange={e => setAdminName(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500/20" required />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Telefone</label>
                                <input type="text" value={adminPhone} onChange={e => setAdminPhone(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500/20" required />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">E-mail</label>
                                <input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500/20" required />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Senha (Temporária)</label>
                                <input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500/20" required minLength={6} />
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-4">
                                <button type="button" onClick={() => setShowAdminModal(false)} className="px-6 py-3 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
                                <button type="submit" disabled={isSubmitting} className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50">
                                    {isSubmitting ? 'Gerando Acesso...' : 'Criar Acesso Admin'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
