import React, { useState, useEffect } from 'react';
import { Users, Search, Edit2, Shield, User as UserIcon, X, Wifi, Plus, ImageIcon, Trash2 } from 'lucide-react';
import { Resident, UserRole } from '../types';
import { updateResident, signUpAdmin, signUpResident, uploadProfilePhoto, deleteResident } from '../lib/database';

interface ResidentsViewProps {
    residents: Resident[];
    isAdmin: boolean;
    currentUser: Resident;
    onRefresh: () => void;
    initialModal?: 'add-resident' | null;
}

export function ResidentsView({ residents, isAdmin, currentUser, onRefresh, initialModal }: ResidentsViewProps) {
    useEffect(() => {
        if (initialModal === 'add-resident') {
            setShowAddModal(true);
        }
    }, [initialModal]);
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

    // Create Resident States
    const [showAddModal, setShowAddModal] = useState(false);
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [newBirthDate, setNewBirthDate] = useState('');
    const [newEntryDate, setNewEntryDate] = useState(new Date().toISOString().split('T')[0]);
    const [newInstagram, setNewInstagram] = useState('');
    const [newMacAddress, setNewMacAddress] = useState('');
    const [newMacAddressPC, setNewMacAddressPC] = useState('');
    const [newPhoto, setNewPhoto] = useState<File | null>(null);
    const [isCreating, setIsCreating] = useState(false);

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
            // Upload photo if selected
            let photoUrl = editingResident.photo_url;
            if (newPhoto) {
                photoUrl = await uploadProfilePhoto(editingResident.id, newPhoto);
            }

            try {
                await updateResident(editingResident.id, {
                    ...editingResident,
                    photo_url: photoUrl
                });
            } catch (updateErr) {
                console.warn('Erro ao salvar campos estendidos, tentando básicos...', updateErr);
                // Fallback: Tenta salvar EXCLUSIVAMENTE os campos que existem desde a V1 e sem UUIDs inválidos
                const safePayload: any = {
                    name: editingResident.name,
                    phone: editingResident.phone,
                    birth_date: editingResident.birth_date,
                    entry_date: editingResident.entry_date,
                    status: editingResident.status,
                    internet_active: editingResident.internet_active,
                };
                if (editingResident.room_id && editingResident.room_id.trim() !== '') {
                    safePayload.room_id = editingResident.room_id;
                }
                await updateResident(editingResident.id, safePayload);
                alert('Aviso: Algumas informações novas (Foto/Instagram/MAC/Endereço) não puderam ser salvas, mas o cadastro principal foi atualizado.');
            }

            setEditingResident(null);
            setNewPhoto(null);
            onRefresh();
        } catch (err: any) {
            console.error("Erro fatal ao salvar morador:", err);
            alert('Erro ao atualizar morador: ' + (err?.message || JSON.stringify(err)));
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

    const handleCreateResident = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            const { signUpResident, uploadProfilePhoto, updateResident } = await import('../lib/database');
            // 1. Criar usuário no Auth e Resident no DB
            const authData = await signUpResident(newEmail, newPassword, newName, newPhone);

            if (!authData.user) throw new Error('Erro ao criar usuário.');

            // Buscar o residente criado automaticamente pelo trigger/signUpResident
            const { fetchCurrentResident } = await import('../lib/database');
            const resident = await fetchCurrentResident(authData.user.id);
            if (!resident) throw new Error('Perfil de morador não encontrado.');

            // 2. Upload da foto se houver
            let photoUrl = '';
            if (newPhoto) {
                photoUrl = await uploadProfilePhoto(resident.id, newPhoto);
            }

            // 3. Atualizar com Instagram, MACs e PhotoUrl
            try {
                await updateResident(resident.id, {
                    instagram: newInstagram,
                    mac_address: newMacAddress,
                    mac_address_pc: newMacAddressPC,
                    photo_url: photoUrl,
                    birth_date: newBirthDate,
                    entry_date: newEntryDate
                } as any);
            } catch (updateErr) {
                console.warn('Falha ao atualizar campos estendidos, tentando campos básicos...', updateErr);
                // Fallback: Tenta atualizar apenas campos que garantidamente existem
                await updateResident(resident.id, {
                    birth_date: newBirthDate,
                    entry_date: newEntryDate
                } as any);
                alert('Aviso: Cadastro realizado, mas Instagram/MACs não puderam ser salvos (Banco de Dados desatualizado).');
            }

            setShowAddModal(false);
            setNewName(''); setNewEmail(''); setNewPassword(''); setNewPhone('');
            setNewBirthDate(''); setNewInstagram(''); setNewMacAddress(''); setNewMacAddressPC(''); setNewPhoto(null);
            alert('Morador cadastrado com sucesso!');
            onRefresh();
        } catch (err: any) {
            console.error("Erro ao criar residente:", err);
            alert('Erro ao cadastrar morador: ' + (err?.message || JSON.stringify(err)));
        } finally {
            setIsCreating(false);
        }
    };

    const handleDelete = async (resident: Resident) => {
        if (!isAdmin) return;

        // Impede que o usuário exclua a si mesmo
        if (resident.id === currentUser.id || resident.auth_id === currentUser.auth_id) {
            alert('Você não pode excluir o seu próprio usuário logado.');
            return;
        }

        if (window.confirm(`Tem certeza que deseja excluir ${resident.role}: ${resident.name}? Esta ação não pode ser desfeita.`)) {
            try {
                await deleteResident(resident.id);
                alert('Morador excluído com sucesso!');
                onRefresh();
            } catch (err: any) {
                console.error("Erro ao excluir residente:", err);
                alert('Erro ao excluir morador: ' + (err?.message || JSON.stringify(err)));
            }
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
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-emerald-700 transition"
                        >
                            <Plus size={18} />
                            <span className="hidden sm:inline">Novo Morador</span>
                        </button>
                        <button
                            onClick={() => setShowAdminModal(true)}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-700 transition"
                        >
                            <Shield size={18} />
                            <span className="hidden sm:inline">Adicionar Admin</span>
                        </button>
                    </div>
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
                                            <div className="text-xs">
                                                <div className="text-slate-500">{resident.mac_address || 'Sem MAC'}</div>
                                                {resident.instagram && <div className="text-indigo-600 font-medium">@{resident.instagram}</div>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {(isAdmin || currentUser.id === resident.id) && (
                                            <div className="flex justify-end gap-1">
                                                <button
                                                    onClick={() => handleEditClick(resident)}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors inline-block"
                                                    title="Editar"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                {isAdmin && resident.id !== currentUser.id && (
                                                    <button
                                                        onClick={() => handleDelete(resident)}
                                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors inline-block"
                                                        title="Excluir"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
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
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Instagram (@usuario)</label>
                                    <input type="text" value={editingResident.instagram || ''} onChange={e => setEditingResident({ ...editingResident, instagram: e.target.value })} placeholder="@exemplo" className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500/20" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">MAC Address (Celular)</label>
                                    <input type="text" value={editingResident.mac_address || ''} onChange={e => setEditingResident({ ...editingResident, mac_address: e.target.value })} placeholder="Ex: 00:1B:..." className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500/20 font-mono" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">MAC Address (Computador)</label>
                                    <input type="text" value={(editingResident as any).mac_address_pc || ''} onChange={e => setEditingResident({ ...editingResident, ['mac_address_pc' as any]: e.target.value })} placeholder="Ex: 00:1B:..." className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500/20 font-mono" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Foto do Perfil</label>
                                    <div className="flex items-center gap-4">
                                        {editingResident.photo_url && (
                                            <img src={editingResident.photo_url} alt="Preview" className="w-16 h-16 rounded-full object-cover border-2 border-slate-200" />
                                        )}
                                        <label className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-xl p-4 cursor-pointer hover:bg-slate-50 transition-colors">
                                            <ImageIcon className="text-slate-400" size={24} />
                                            <span className="text-sm font-medium text-slate-500">Alterar Foto</span>
                                            <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const { uploadProfilePhoto } = await import('../lib/database');
                                                    setIsSubmitting(true);
                                                    try {
                                                        const url = await uploadProfilePhoto(editingResident.id, file);
                                                        setEditingResident({ ...editingResident, photo_url: url });
                                                    } catch (err) {
                                                        alert('Erro ao carregar foto.');
                                                    } finally {
                                                        setIsSubmitting(false);
                                                    }
                                                }
                                            }} />
                                        </label>
                                    </div>
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

            {/* Create Resident Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold flex items-center gap-2 text-emerald-900"><Plus className="text-emerald-600" /> Cadastrar Novo Morador</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleCreateResident} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Nome Completo</label>
                                    <input type="text" value={newName} onChange={e => setNewName(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500/20" required placeholder="Ex: João da Silva" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">E-mail de Acesso</label>
                                    <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500/20" required placeholder="joao@email.com" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Telefone / WhatsApp</label>
                                    <input type="text" value={newPhone} onChange={e => setNewPhone(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500/20" required placeholder="(11) 99999-9999" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Senha Inicial</label>
                                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500/20" required minLength={6} placeholder="Mínimo 6 caracteres" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Data de Nascimento</label>
                                    <input type="date" value={newBirthDate} onChange={e => setNewBirthDate(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500/20" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Instagram (@usuario)</label>
                                    <input type="text" value={newInstagram} onChange={e => setNewInstagram(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500/20" placeholder="Ex: joao_silva" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Data de Entrada</label>
                                    <input type="date" value={newEntryDate} onChange={e => setNewEntryDate(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500/20" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">MAC Address (Celular)</label>
                                    <input type="text" value={newMacAddress} onChange={e => setNewMacAddress(e.target.value)} placeholder="Ex: 00:1B:..." className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500/20 font-mono" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">MAC Address (Computador)</label>
                                    <input type="text" value={newMacAddressPC} onChange={e => setNewMacAddressPC(e.target.value)} placeholder="Ex: 00:1B:..." className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500/20 font-mono" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Foto de Perfil</label>
                                    <div className="flex items-center gap-4 p-4 border-2 border-dashed border-slate-200 rounded-2xl hover:border-emerald-500 transition-colors">
                                        <div className="p-3 bg-slate-50 rounded-full text-slate-400">
                                            <ImageIcon size={24} />
                                        </div>
                                        <div className="flex-1">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={e => setNewPhoto(e.target.files ? e.target.files[0] : null)}
                                                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                                            />
                                            <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">JPG, PNG ou WEBP até 2MB</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-4">
                                <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-3 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
                                <button type="submit" disabled={isCreating} className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50">
                                    {isCreating ? 'Cadastrando...' : 'Finalizar Cadastro'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
