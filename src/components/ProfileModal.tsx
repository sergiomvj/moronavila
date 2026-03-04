import React, { useState } from 'react';
import { X, Lock, Save, Camera, Instagram } from 'lucide-react';
import { Resident } from '../types';
import { updateResident, updatePassword, uploadProfilePhoto } from '../lib/database';

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
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingPhoto(true);
        setMessage({ text: '', type: '' });
        try {
            const photoUrl = await uploadProfilePhoto(currentUser.id, file);
            setEditingResident({ ...editingResident, photo_url: photoUrl });
            setMessage({ text: 'Foto atualizada com sucesso! Não esqueça de Salvar Alterações.', type: 'success' });
        } catch (err: any) {
            setMessage({ text: err.message || 'Erro ao enviar foto.', type: 'error' });
        } finally {
            setIsUploadingPhoto(false);
        }
    };

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

                <div className="flex flex-col items-center mb-6">
                    <div className="relative group">
                        <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg overflow-hidden">
                            {editingResident.photo_url ? (
                                <img src={editingResident.photo_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-3xl font-bold text-slate-400 capitalize">{editingResident.name.charAt(0)}</div>
                            )}
                        </div>
                        <label className="absolute bottom-0 right-0 p-2 bg-indigo-600 text-white rounded-full cursor-pointer hover:bg-indigo-700 transition shadow-sm" title="Alterar foto">
                            {isUploadingPhoto ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Camera size={16} />}
                            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={isUploadingPhoto} />
                        </label>
                    </div>
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
                            <label className="block text-sm font-bold text-slate-700 mb-1">Perfil do Instagram (Opcional)</label>
                            <div className="relative">
                                <Instagram size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="@seu_usuario"
                                    value={editingResident.instagram || ''}
                                    onChange={e => setEditingResident({ ...editingResident, instagram: e.target.value })}
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

                    {/* Guia de Acesso à Internet */}
                    <div className="bg-indigo-50 rounded-2xl p-5 border border-indigo-100 mt-6">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                                <Lock size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-indigo-900 mb-1">Como liberar seu acesso à Internet (Wi-Fi)</h4>
                                <div className="text-sm text-indigo-800 space-y-2">
                                    <p>Para se conectar de forma segura na rede da República, utilizamos autenticação por dispositivo (MAC Address). Cada usuário pode registrar até 2 dispositivos (ex: Celular e Computador).</p>
                                    <ol className="list-decimal list-inside space-y-1 ml-1 font-medium">
                                        <li>Descubra o <strong>Endereço MAC (Wi-Fi)</strong> do seu dispositivo.</li>
                                        <li>No <strong>Android</strong>: Configurações &gt; Rede e internet &gt; Wi-Fi &gt; Preferências de Wi-Fi &gt; Avançado.</li>
                                        <li>No <strong>iOS (iPhone)</strong>: Ajustes &gt; Geral &gt; Sobre &gt; Endereço Wi-Fi.</li>
                                        <li>No <strong>Windows</strong>: Configurações &gt; Rede e Internet &gt; Wi-Fi &gt; Propriedades do Hardware.</li>
                                        <li>Copie esse endereço (formato 00:1A:2B:3C:4D:5E).</li>
                                        <li>Vá para a página "Internet" no menu lateral e adicione seu dispositivo.</li>
                                        <li>Aguarde o Administrador aprovar ou sua mensalidade ser confirmada.</li>
                                    </ol>
                                </div>
                            </div>
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
