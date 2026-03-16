import React, { useEffect, useMemo, useState } from 'react';
import { 
    Edit2, Plus, Search, Shield, Trash2, User as UserIcon, Wifi, X,
    Users, Ban, CheckCircle2, XCircle, Phone, Mail, Calendar, MapPin, Briefcase, 
    GraduationCap, Instagram, Info, ChevronRight, Wrench, ImageIcon, 
    Lock, ExternalLink, ArrowRight
} from 'lucide-react';
import { Resident, UserRole } from '../types';
import { deleteResident, fetchCurrentResident, signUpAdmin, signUpResident, updateResident } from '../lib/database';

interface ResidentsViewProps {
    residents: Resident[];
    isAdmin: boolean;
    currentUser: Resident;
    onRefresh: () => void;
    initialModal?: 'add-resident' | null;
}

type SoftphoneFilter =
    | 'all'
    | 'ready'
    | 'missing-extension'
    | 'disabled'
    | 'resident-disabled'
    | 'missing-mac';

function getSoftphoneBadge(resident: Resident) {
    if (resident.role !== UserRole.RESIDENT) return { label: 'Administrativo', className: 'bg-indigo-100 text-indigo-700' };
    if (resident.habilitado === false) return { label: resident.status === 'Pendente' ? 'Pendente' : 'Bloqueado', className: 'bg-rose-100 text-rose-700' };
    if (resident.softphone_enabled === false) return { label: 'Desativado', className: 'bg-slate-100 text-slate-600' };
    if (!resident.softphone_extension) return { label: 'Sem ramal', className: 'bg-amber-100 text-amber-700' };
    if (!resident.internet_active) return { label: 'Internet inativa', className: 'bg-sky-100 text-sky-700' };
    if (!resident.mac_address) return { label: 'Sem MAC', className: 'bg-violet-100 text-violet-700' };
    return { label: 'Pronto', className: 'bg-emerald-100 text-emerald-700' };
}

export function ResidentsView({ residents, isAdmin, currentUser, onRefresh, initialModal }: ResidentsViewProps) {
    const [activeTab, setActiveTab] = useState<'residents' | 'candidates'>('residents');
    const [searchTerm, setSearchTerm] = useState('');
    const [softphoneFilter, setSoftphoneFilter] = useState<SoftphoneFilter>('all');
    const [editingResident, setEditingResident] = useState<Resident | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [newEntryDate, setNewEntryDate] = useState(new Date().toISOString().split('T')[0]);
    const [newSoftphoneExtension, setNewSoftphoneExtension] = useState('');
    const [newSoftphoneDisplayName, setNewSoftphoneDisplayName] = useState('');
    const [newSoftphoneEnabled, setNewSoftphoneEnabled] = useState(true);
    const [newHabilitado, setNewHabilitado] = useState(true);
    const [newMotivoBloqueio, setNewMotivoBloqueio] = useState('');
    const [newCpf, setNewCpf] = useState('');
    const [newRg, setNewRg] = useState('');
    const [newBirthDate, setNewBirthDate] = useState('');
    const [newOriginAddress, setNewOriginAddress] = useState('');
    const [newFamilyAddress, setNewFamilyAddress] = useState('');
    const [newEmergencyName, setNewEmergencyName] = useState('');
    const [newEmergencyPhone, setNewEmergencyPhone] = useState('');
    const [newOccupation, setNewOccupation] = useState('');
    const [newWorkAddress, setNewWorkAddress] = useState('');
    const [newCompany, setNewCompany] = useState('');
    const [newUniversity, setNewUniversity] = useState('');
    const [newCourse, setNewCourse] = useState('');
    const [newInstagram, setNewInstagram] = useState('');

    const [adminName, setAdminName] = useState('');
    const [adminPhone, setAdminPhone] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [adminError, setAdminError] = useState('');

    useEffect(() => {
        if (initialModal === 'add-resident') setShowAddModal(true);
    }, [initialModal]);

    const residentsList = useMemo(() => residents.filter((item) => item.status !== 'Candidato'), [residents]);
    const candidatesList = useMemo(() => residents.filter((item) => item.status === 'Candidato'), [residents]);

    const currentRows = useMemo(() => {
        const source = activeTab === 'residents' ? residentsList : candidatesList;
        return source.filter((resident) => {
            const matchesSearch =
                resident.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                resident.email.toLowerCase().includes(searchTerm.toLowerCase());
            if (!matchesSearch) return false;
            if (activeTab !== 'residents') return true;
            switch (softphoneFilter) {
                case 'ready':
                    return resident.role === UserRole.RESIDENT && resident.habilitado !== false && resident.softphone_enabled !== false && Boolean(resident.softphone_extension) && resident.internet_active && Boolean(resident.mac_address);
                case 'missing-extension':
                    return resident.role === UserRole.RESIDENT && resident.habilitado !== false && resident.softphone_enabled !== false && !resident.softphone_extension;
                case 'disabled':
                    return resident.role === UserRole.RESIDENT && (resident.habilitado === false || resident.softphone_enabled === false);
                case 'resident-disabled':
                    return resident.role === UserRole.RESIDENT && resident.habilitado === false;
                case 'missing-mac':
                    return resident.role === UserRole.RESIDENT && resident.habilitado !== false && !resident.mac_address;
                default:
                    return true;
            }
        });
    }, [activeTab, candidatesList, residentsList, searchTerm, softphoneFilter]);

    const readyCount = residentsList.filter((resident) => getSoftphoneBadge(resident).label === 'Pronto').length;
    const missingExtensionCount = residentsList.filter((resident) => getSoftphoneBadge(resident).label === 'Sem ramal').length;
    const disabledCount = residentsList.filter((resident) => resident.role === UserRole.RESIDENT && (resident.habilitado === false || resident.softphone_enabled === false)).length;
    const blockedCount = residentsList.filter((resident) => resident.role === UserRole.RESIDENT && resident.habilitado === false).length;
    const missingMacCount = residentsList.filter((resident) => resident.role === UserRole.RESIDENT && resident.habilitado !== false && !resident.mac_address).length;

    async function handleSave(event: React.FormEvent) {
        event.preventDefault();
        if (!editingResident) return;
        if (editingResident.habilitado === false && !editingResident.motivo_bloqueio?.trim()) {
            alert('Informe o motivo do bloqueio antes de salvar o morador desabilitado.');
            return;
        }
        setIsSubmitting(true);
        try {
            await updateResident(editingResident.id, {
                ...editingResident,
                motivo_bloqueio: editingResident.habilitado === false ? editingResident.motivo_bloqueio?.trim() || null : null,
            });
            setEditingResident(null);
            onRefresh();
        } catch (error: any) {
            alert(`Erro ao atualizar morador: ${error?.message || 'Erro desconhecido'}`);
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleCreateResident(event: React.FormEvent) {
        event.preventDefault();
        if (!newHabilitado && !newMotivoBloqueio.trim()) {
            alert('Informe o motivo do bloqueio antes de cadastrar um morador desabilitado.');
            return;
        }
        setIsSubmitting(true);
        try {
            const authData = await signUpResident(newEmail, newPassword, newName, newPhone, { habilitado: newHabilitado });
            if (!authData.user) throw new Error('Erro ao criar usuario.');
            const resident = await fetchCurrentResident(authData.user.id);
            if (!resident) throw new Error('Perfil de morador nao encontrado.');
            await updateResident(resident.id, {
                entry_date: newEntryDate,
                habilitado: newHabilitado,
                motivo_bloqueio: newHabilitado ? null : newMotivoBloqueio.trim() || null,
                softphone_extension: newSoftphoneExtension,
                softphone_display_name: newSoftphoneDisplayName,
                softphone_enabled: newSoftphoneEnabled,
                cpf: newCpf,
                rg: newRg,
                birth_date: newBirthDate || null,
                origin_address: newOriginAddress,
                family_address: newFamilyAddress,
                emergency_contact_name: newEmergencyName,
                emergency_contact_phone: newEmergencyPhone,
                occupation: newOccupation,
                work_address: newWorkAddress,
                company: newCompany,
                university: newUniversity,
                course: newCourse,
                instagram: newInstagram,
            });
            setShowAddModal(false);
            setNewName('');
            setNewEmail('');
            setNewPassword('');
            setNewPhone('');
            setNewEntryDate(new Date().toISOString().split('T')[0]);
            setNewSoftphoneExtension('');
            setNewSoftphoneDisplayName('');
            setNewSoftphoneEnabled(true);
            setNewHabilitado(true);
            setNewMotivoBloqueio('');
            setNewCpf('');
            setNewRg('');
            setNewBirthDate('');
            setNewOriginAddress('');
            setNewFamilyAddress('');
            setNewEmergencyName('');
            setNewEmergencyPhone('');
            setNewOccupation('');
            setNewWorkAddress('');
            setNewCompany('');
            setNewUniversity('');
            setNewCourse('');
            setNewInstagram('');
            onRefresh();
        } catch (error: any) {
            alert(`Erro ao cadastrar morador: ${error?.message || 'Erro desconhecido'}`);
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleCreateAdmin(event: React.FormEvent) {
        event.preventDefault();
        setIsSubmitting(true);
        setAdminError('');
        try {
            await signUpAdmin(adminEmail, adminPassword, adminName, adminPhone);
            setShowAdminModal(false);
            setAdminName('');
            setAdminPhone('');
            setAdminEmail('');
            setAdminPassword('');
            onRefresh();
        } catch (error: any) {
            setAdminError(error?.message || 'Erro ao cadastrar administrador.');
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleDelete(resident: Resident) {
        if (!isAdmin) return;
        if (resident.id === currentUser.id || resident.auth_id === currentUser.auth_id) {
            alert('Voce nao pode excluir o proprio usuario logado.');
            return;
        }
        if (!window.confirm(`Tem certeza que deseja excluir ${resident.name}?`)) return;
        await deleteResident(resident.id);
        onRefresh();
    }

    async function handleApproveCandidate(resident: Resident) {
        if (!isAdmin) return;
        if (!window.confirm(`Aprovar ${resident.name} como morador ativo?`)) return;
        try {
            await updateResident(resident.id, { 
                status: 'Ativo', 
                habilitado: true, 
                motivo_bloqueio: null,
                entry_date: new Date().toISOString().split('T')[0] 
            });
            onRefresh();
            alert('Candidato aprovado com sucesso!');
        } catch (error: any) {
            alert(`Erro ao aprovar candidato: ${error.message}`);
        }
    }

    async function handleRejectCandidate(resident: Resident) {
        if (!isAdmin) return;
        if (!window.confirm(`Tem certeza que deseja recusar a candidatura de ${resident.name}? O registro será excluído.`)) return;
        try {
            await deleteResident(resident.id);
            onRefresh();
            alert('Candidatura recusada e excluída.');
        } catch (error: any) {
            alert(`Erro ao recusar candidato: ${error.message}`);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Gestao de Pessoas</h2>
                    <div className="mt-2 flex gap-4">
                        <button onClick={() => setActiveTab('residents')} className={`border-b-2 pb-1 text-xs font-black uppercase tracking-widest ${activeTab === 'residents' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}>Moradores ({residentsList.length})</button>
                        <button onClick={() => setActiveTab('candidates')} className={`border-b-2 pb-1 text-xs font-black uppercase tracking-widest ${activeTab === 'candidates' ? 'border-rose-600 text-rose-600' : 'border-transparent text-slate-400'}`}>Candidatos ({candidatesList.length})</button>
                    </div>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input type="text" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Buscar por nome ou email" className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm sm:w-72" />
                    </div>
                    {activeTab === 'residents' && (
                        <select value={softphoneFilter} onChange={(event) => setSoftphoneFilter(event.target.value as SoftphoneFilter)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm">
                            <option value="all">Todos os perfis</option>
                            <option value="ready">Softphone pronto</option>
                            <option value="missing-extension">Sem ramal</option>
                            <option value="disabled">Softphone desativado</option>
                            <option value="resident-disabled">Morador bloqueado</option>
                            <option value="missing-mac">Sem MAC principal</option>
                        </select>
                    )}
                    {isAdmin && <button onClick={() => setShowAddModal(true)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white"><Plus size={18} />Novo Morador</button>}
                    {isAdmin && <button onClick={() => setShowAdminModal(true)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 font-bold text-white"><Shield size={18} />Adicionar Admin</button>}
                </div>
            </div>

            {isAdmin && activeTab === 'residents' && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4"><div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Prontos</div><div className="mt-2 text-3xl font-bold text-emerald-900">{readyCount}</div></div>
                    <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4"><div className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Sem Ramal</div><div className="mt-2 text-3xl font-bold text-amber-900">{missingExtensionCount}</div></div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Desativados</div><div className="mt-2 text-3xl font-bold text-slate-900">{disabledCount}</div></div>
                    <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4"><div className="text-[10px] font-bold uppercase tracking-wider text-violet-700">Sem MAC</div><div className="mt-2 text-3xl font-bold text-violet-900">{missingMacCount}</div></div>
                    <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4"><div className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Bloqueados</div><div className="mt-2 text-3xl font-bold text-rose-900">{blockedCount}</div></div>
                </div>
            )}

            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-[920px] w-full border-collapse text-left">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50">
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Pessoa</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Contato</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">{activeTab === 'residents' ? 'Softphone' : 'Interesse'}</th>
                                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Acoes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {currentRows.map((resident) => {
                                const badge = getSoftphoneBadge(resident);
                                return (
                                    <tr key={resident.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4"><div className="flex items-center gap-3"><div className={`flex h-10 w-10 items-center justify-center rounded-full font-bold uppercase ${activeTab === 'residents' ? 'bg-indigo-100 text-indigo-700' : 'bg-rose-100 text-rose-700'}`}>{resident.name.charAt(0)}</div><div><div className="flex items-center gap-2 font-bold text-slate-900">{resident.name}{resident.role === UserRole.ADMIN && <Shield size={14} className="text-indigo-600" />}</div><div className="text-xs text-slate-500">{activeTab === 'residents' ? `Entrada: ${resident.entry_date}` : `Inscricao: ${resident.entry_date}`}</div></div></div></td>
                                        <td className="px-6 py-4"><div className="text-sm font-medium text-slate-900">{resident.phone}</div><div className="text-xs text-slate-500">{resident.email}</div></td>
                                        <td className="px-6 py-4">
                                            {activeTab === 'residents' ? (
                                                <div className="flex flex-wrap gap-2">
                                                    <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${resident.status === 'Ativo' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{resident.status}</span>
                                                    <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${resident.habilitado === false ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'}`}>{resident.habilitado === false ? resident.status === 'Pendente' ? 'Pendente de liberacao' : 'Bloqueado' : 'Habilitado'}</span>
                                                    {resident.habilitado === false && resident.motivo_bloqueio?.trim() && <span className="text-[10px] font-medium text-rose-700">Motivo: {resident.motivo_bloqueio}</span>}
                                                </div>
                                            ) : (
                                                <div className="space-y-1 text-xs"><div className="font-bold text-slate-700">{resident.occupation || 'Nao informado'}</div><div className="text-slate-500">{resident.company || resident.university || 'Sem empresa ou universidade informada'}</div></div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {activeTab === 'residents' ? (
                                                <div className="text-xs"><div className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold uppercase ${badge.className}`}>{badge.label}</div><div className="mt-2 flex items-center gap-2 text-slate-500"><Wifi size={14} className={resident.internet_active ? 'text-emerald-500' : 'text-slate-300'} /><span>{resident.softphone_extension || 'Sem ramal definido'}</span></div>{resident.softphone_display_name && <div className="mt-1 font-medium text-indigo-600">{resident.softphone_display_name}</div>}{!resident.mac_address && resident.role === UserRole.RESIDENT && <div className="mt-1 font-medium text-violet-600">Sem MAC principal</div>}</div>
                                            ) : (
                                                <div className="space-y-1 text-xs"><div className="font-bold text-slate-700">Previsao: {resident.entry_date}</div><div className="text-slate-500">{resident.cpf || 'CPF nao informado'}</div></div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end gap-2">
                                                {activeTab === 'candidates' && isAdmin && (
                                                    <>
                                                        <button
                                                            onClick={() => setEditingResident(resident)}
                                                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                            title="Ver Detalhes / Editar"
                                                        >
                                                            <Info size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleApproveCandidate(resident)}
                                                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                            title="Aprovar Morador"
                                                        >
                                                            <CheckCircle2 size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleRejectCandidate(resident)}
                                                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                            title="Recusar"
                                                        >
                                                            <XCircle size={18} />
                                                        </button>
                                                    </>
                                                )}
                                                {activeTab === 'residents' && (
                                                    <>
                                                        <button
                                                            onClick={() => setEditingResident(resident)}
                                                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                            title="Editar"
                                                        >
                                                            <Edit2 size={18} />
                                                        </button>
                                                        {isAdmin && resident.id !== currentUser.id && (
                                                            <button
                                                                onClick={() => handleDelete(resident)}
                                                                className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                                title="Excluir"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {currentRows.length === 0 && <div className="py-12 text-center"><UserIcon size={48} className="mx-auto mb-4 text-slate-300" /><p className="font-medium text-slate-500">{activeTab === 'residents' ? 'Nenhum morador encontrado.' : 'Nenhum candidato encontrado.'}</p></div>}
            </div>

            {editingResident && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-2xl rounded-[2rem] bg-white p-6">
                        <div className="mb-6 flex items-center justify-between"><h3 className="text-xl font-bold">Editar Morador</h3><button onClick={() => setEditingResident(null)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button></div>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <input value={editingResident.name} onChange={(event) => setEditingResident({ ...editingResident, name: event.target.value })} className="rounded-xl border border-slate-200 p-3" placeholder="Nome" />
                                <input value={editingResident.email} onChange={(event) => setEditingResident({ ...editingResident, email: event.target.value })} className="rounded-xl border border-slate-200 p-3" placeholder="E-mail" />
                                <input value={editingResident.phone} onChange={(event) => setEditingResident({ ...editingResident, phone: event.target.value })} className="rounded-xl border border-slate-200 p-3" placeholder="Telefone" />
                                <input value={editingResident.mac_address || ''} onChange={(event) => setEditingResident({ ...editingResident, mac_address: event.target.value })} className="rounded-xl border border-slate-200 p-3" placeholder="MAC principal" />
                                <input value={editingResident.softphone_extension || ''} onChange={(event) => setEditingResident({ ...editingResident, softphone_extension: event.target.value })} className="rounded-xl border border-slate-200 p-3" placeholder="Ramal do softphone" />
                                <input value={editingResident.softphone_display_name || ''} onChange={(event) => setEditingResident({ ...editingResident, softphone_display_name: event.target.value })} className="rounded-xl border border-slate-200 p-3" placeholder="Nome de exibicao no softphone" />
                                <div className="md:col-span-2 grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3"><input type="checkbox" checked={editingResident.habilitado !== false} onChange={(event) => setEditingResident({ ...editingResident, habilitado: event.target.checked, motivo_bloqueio: event.target.checked ? '' : editingResident.motivo_bloqueio })} className="h-4 w-4" /><span className="text-sm font-medium">Morador habilitado</span></label>
                                    <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3"><input type="checkbox" checked={editingResident.internet_active || false} onChange={(event) => setEditingResident({ ...editingResident, internet_active: event.target.checked })} className="h-4 w-4" /><span className="text-sm font-medium">Internet ativa</span></label>
                                </div>
                                <textarea value={editingResident.motivo_bloqueio || ''} onChange={(event) => setEditingResident({ ...editingResident, motivo_bloqueio: event.target.value })} disabled={editingResident.habilitado !== false} rows={1} className="md:col-span-2 rounded-xl border border-slate-200 p-3 disabled:bg-slate-50" placeholder="Motivo do bloqueio" />
                                
                                <div className="md:col-span-2 bg-slate-50 p-4 rounded-2xl space-y-4">
                                    <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Documentação e Pessoal</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <input value={editingResident.cpf || ''} onChange={(event) => setEditingResident({ ...editingResident, cpf: event.target.value })} className="rounded-xl border border-slate-200 p-3 bg-white" placeholder="CPF" />
                                        <input value={editingResident.rg || ''} onChange={(event) => setEditingResident({ ...editingResident, rg: event.target.value })} className="rounded-xl border border-slate-200 p-3 bg-white" placeholder="RG" />
                                        <input type="date" value={editingResident.birth_date || ''} onChange={(event) => setEditingResident({ ...editingResident, birth_date: event.target.value })} className="rounded-xl border border-slate-200 p-3 bg-white" placeholder="Data de Nascimento" />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <input value={editingResident.origin_address || ''} onChange={(event) => setEditingResident({ ...editingResident, origin_address: event.target.value })} className="rounded-xl border border-slate-200 p-3 bg-white" placeholder="Endereço de Origem" />
                                        <input value={editingResident.family_address || ''} onChange={(event) => setEditingResident({ ...editingResident, family_address: event.target.value })} className="rounded-xl border border-slate-200 p-3 bg-white" placeholder="Endereço Familiar" />
                                    </div>
                                </div>

                                <div className="md:col-span-2 bg-slate-50 p-4 rounded-2xl space-y-4">
                                    <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Emergência e Profissional</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <input value={editingResident.emergency_contact_name || ''} onChange={(event) => setEditingResident({ ...editingResident, emergency_contact_name: event.target.value })} className="rounded-xl border border-slate-200 p-3 bg-white" placeholder="Contato de Emergência (Nome)" />
                                        <input value={editingResident.emergency_contact_phone || ''} onChange={(event) => setEditingResident({ ...editingResident, emergency_contact_phone: event.target.value })} className="rounded-xl border border-slate-200 p-3 bg-white" placeholder="Contato de Emergência (Telefone)" />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <input value={editingResident.occupation || ''} onChange={(event) => setEditingResident({ ...editingResident, occupation: event.target.value })} className="rounded-xl border border-slate-200 p-3 bg-white" placeholder="Ocupação" />
                                        <input value={editingResident.company || ''} onChange={(event) => setEditingResident({ ...editingResident, company: event.target.value })} className="rounded-xl border border-slate-200 p-3 bg-white" placeholder="Empresa" />
                                        <input value={editingResident.work_address || ''} onChange={(event) => setEditingResident({ ...editingResident, work_address: event.target.value })} className="rounded-xl border border-slate-200 p-3 bg-white" placeholder="Endereço Comercial" />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <input value={editingResident.university || ''} onChange={(event) => setEditingResident({ ...editingResident, university: event.target.value })} className="rounded-xl border border-slate-200 p-3 bg-white" placeholder="Universidade" />
                                        <input value={editingResident.course || ''} onChange={(event) => setEditingResident({ ...editingResident, course: event.target.value })} className="rounded-xl border border-slate-200 p-3 bg-white" placeholder="Curso" />
                                        <input value={editingResident.instagram || ''} onChange={(event) => setEditingResident({ ...editingResident, instagram: event.target.value })} className="rounded-xl border border-slate-200 p-3 bg-white" placeholder="Perfil Instagram" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setEditingResident(null)} className="rounded-xl px-6 py-3 font-bold text-slate-600 hover:bg-slate-100">Cancelar</button><button type="submit" disabled={isSubmitting} className="rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white disabled:opacity-50">{isSubmitting ? 'Salvando...' : 'Salvar Alteracoes'}</button></div>
                        </form>
                    </div>
                </div>
            )}

            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-2xl rounded-[2rem] bg-white p-6">
                        <div className="mb-6 flex items-center justify-between"><h3 className="text-xl font-bold">Novo Morador</h3><button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button></div>
                        <form onSubmit={handleCreateResident} className="space-y-4">
                            <div className="max-h-[60vh] overflow-y-auto px-1 space-y-4">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <input value={newName} onChange={(event) => setNewName(event.target.value)} className="rounded-xl border border-slate-200 p-3" placeholder="Nome" required />
                                    <input value={newEmail} onChange={(event) => setNewEmail(event.target.value)} className="rounded-xl border border-slate-200 p-3" placeholder="E-mail" required />
                                    <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="rounded-xl border border-slate-200 p-3" placeholder="Senha" required />
                                    <input value={newPhone} onChange={(event) => setNewPhone(event.target.value)} className="rounded-xl border border-slate-200 p-3" placeholder="Telefone" required />
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase ml-2">Data de Entrada</span>
                                        <input type="date" value={newEntryDate} onChange={(event) => setNewEntryDate(event.target.value)} className="rounded-xl border border-slate-200 p-3" />
                                    </div>
                                    <input value={newSoftphoneExtension} onChange={(event) => setNewSoftphoneExtension(event.target.value)} className="mt-5 rounded-xl border border-slate-200 p-3" placeholder="Ramal do softphone" />
                                    <input value={newSoftphoneDisplayName} onChange={(event) => setNewSoftphoneDisplayName(event.target.value)} className="md:col-span-2 rounded-xl border border-slate-200 p-3" placeholder="Nome de exibicao no softphone" />
                                    
                                    <div className="md:col-span-2 space-y-4 pt-2">
                                        <div className="bg-slate-50 p-4 rounded-2xl space-y-4">
                                            <h4 className="text-sm font-bold text-slate-700 uppercase">Documentação e Pessoal</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                <input value={newCpf} onChange={(event) => setNewCpf(event.target.value)} className="rounded-xl border border-slate-200 p-3 bg-white" placeholder="CPF" />
                                                <input value={newRg} onChange={(event) => setNewRg(event.target.value)} className="rounded-xl border border-slate-200 p-3 bg-white" placeholder="RG" />
                                                <input type="date" value={newBirthDate} onChange={(event) => setNewBirthDate(event.target.value)} className="rounded-xl border border-slate-200 p-3 bg-white" placeholder="Nascimento" />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <input value={newOriginAddress} onChange={(event) => setNewOriginAddress(event.target.value)} className="rounded-xl border border-slate-200 p-3 bg-white" placeholder="Endereço de Origem" />
                                                <input value={newFamilyAddress} onChange={(event) => setNewFamilyAddress(event.target.value)} className="rounded-xl border border-slate-200 p-3 bg-white" placeholder="Endereço Familiar" />
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 p-4 rounded-2xl space-y-4">
                                            <h4 className="text-sm font-bold text-slate-700 uppercase">Emergência e Profissional</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <input value={newEmergencyName} onChange={(event) => setNewEmergencyName(event.target.value)} className="rounded-xl border border-slate-200 p-3 bg-white" placeholder="Contato de Emergência (Nome)" />
                                                <input value={newEmergencyPhone} onChange={(event) => setNewEmergencyPhone(event.target.value)} className="rounded-xl border border-slate-200 p-3 bg-white" placeholder="Contato de Emergência (Telefone)" />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                <input value={newOccupation} onChange={(event) => setNewOccupation(event.target.value)} className="rounded-xl border border-slate-200 p-3 bg-white" placeholder="Ocupação" />
                                                <input value={newCompany} onChange={(event) => setNewCompany(event.target.value)} className="rounded-xl border border-slate-200 p-3 bg-white" placeholder="Empresa" />
                                                <input value={newWorkAddress} onChange={(event) => setNewWorkAddress(event.target.value)} className="rounded-xl border border-slate-200 p-3 bg-white" placeholder="Endereço Comercial" />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                <input value={newUniversity} onChange={(event) => setNewUniversity(event.target.value)} className="rounded-xl border border-slate-200 p-3 bg-white" placeholder="Universidade" />
                                                <input value={newCourse} onChange={(event) => setNewCourse(event.target.value)} className="rounded-xl border border-slate-200 p-3 bg-white" placeholder="Curso" />
                                                <input value={newInstagram} onChange={(event) => setNewInstagram(event.target.value)} className="rounded-xl border border-slate-200 p-3 bg-white" placeholder="Perfil Instagram" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="md:col-span-2 grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3"><input type="checkbox" checked={newHabilitado} onChange={(event) => { setNewHabilitado(event.target.checked); if (event.target.checked) setNewMotivoBloqueio(''); }} className="h-4 w-4" /><span className="text-sm font-medium">Morador habilitado</span></label>
                                        <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3"><input type="checkbox" checked={newSoftphoneEnabled} onChange={(event) => setNewSoftphoneEnabled(event.target.checked)} className="h-4 w-4" /><span className="text-sm font-medium">Habilitar softphone</span></label>
                                    </div>
                                    <textarea value={newMotivoBloqueio} onChange={(event) => setNewMotivoBloqueio(event.target.value)} disabled={newHabilitado} rows={2} className="md:col-span-2 rounded-xl border border-slate-200 p-3 disabled:bg-slate-50" placeholder="Motivo do bloqueio" />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setShowAddModal(false)} className="rounded-xl px-6 py-3 font-bold text-slate-600 hover:bg-slate-100">Cancelar</button><button type="submit" disabled={isSubmitting} className="rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white disabled:opacity-50">{isSubmitting ? 'Cadastrando...' : 'Finalizar Cadastro'}</button></div>
                        </form>
                    </div>
                </div>
            )}

            {showAdminModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-[2rem] bg-white p-6">
                        <div className="mb-6 flex items-center justify-between"><h3 className="text-xl font-bold">Novo Administrador</h3><button onClick={() => setShowAdminModal(false)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button></div>
                        <form onSubmit={handleCreateAdmin} className="space-y-4">
                            <input value={adminName} onChange={(event) => setAdminName(event.target.value)} className="w-full rounded-xl border border-slate-200 p-3" placeholder="Nome" required />
                            <input value={adminPhone} onChange={(event) => setAdminPhone(event.target.value)} className="w-full rounded-xl border border-slate-200 p-3" placeholder="Telefone" required />
                            <input type="email" value={adminEmail} onChange={(event) => setAdminEmail(event.target.value)} className="w-full rounded-xl border border-slate-200 p-3" placeholder="E-mail" required />
                            <input type="password" value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} className="w-full rounded-xl border border-slate-200 p-3" placeholder="Senha" required />
                            {adminError && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{adminError}</div>}
                            <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setShowAdminModal(false)} className="rounded-xl px-6 py-3 font-bold text-slate-600 hover:bg-slate-100">Cancelar</button><button type="submit" disabled={isSubmitting} className="rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white disabled:opacity-50">{isSubmitting ? 'Salvando...' : 'Criar Administrador'}</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
