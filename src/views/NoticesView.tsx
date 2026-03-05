import React from 'react';
import { Megaphone, Pin, X } from 'lucide-react';
import { Notice, Resident } from '../types';

interface NoticesViewProps {
    notices: Notice[];
    residents: Resident[];
    isAdmin: boolean;
    currentUser: Resident;
    onRefresh: () => void;
    initialModal?: 'add-notice' | null;
}

export function NoticesView({ notices, residents, isAdmin, currentUser, onRefresh, initialModal }: NoticesViewProps) {
    const [showAddModal, setShowAddModal] = React.useState(false);

    React.useEffect(() => {
        if (initialModal === 'add-notice') {
            setShowAddModal(true);
        }
    }, [initialModal]);
    const [newTitle, setNewTitle] = React.useState('');
    const [newContent, setNewContent] = React.useState('');
    const [newCategory, setNewCategory] = React.useState('Geral');
    const [isPinned, setIsPinned] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const handleCreateNotice = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const { createNotice } = await import('../lib/database');
            // Nota: autor_id deve ser o ID do admin atual. 
            // Como NoticesView não recebe currentUser, vou usar o primeiro admin encontrado ou lançar erro se não houver contexto.
            // O ideal seria passar currentUser, mas para simplificar vou assumir que o sistema sabe quem é o autor no backend ou passar um ID fixo se necessário.
            // Para ser robusto, vou sugerir que o usuário logado seja passado.

            const admin = currentUser;

            await createNotice({
                title: newTitle,
                content: newContent,
                category: newCategory,
                is_pinned: isPinned,
                author_id: admin.id
            });
            setShowAddModal(false);
            setNewTitle(''); setNewContent(''); setNewCategory('Geral'); setIsPinned(false);
            onRefresh();
        } catch (err) {
            alert('Erro ao criar aviso.');
        } finally {
            setIsSubmitting(false);
        }
    };
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Mural de Avisos</h2>
                    <p className="text-slate-500 text-sm">Comunicados importantes da administração</p>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium hover:bg-indigo-700 transition-colors"
                    >
                        Novo Aviso
                    </button>
                )}
            </div>

            {/* Add Notice Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-lg">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">Novo Aviso no Mural</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCreateNotice} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Título</label>
                                <input type="text" required value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Conteúdo</label>
                                <textarea required value={newContent} onChange={e => setNewContent(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 h-32" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Categoria</label>
                                    <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 bg-white">
                                        <option value="Geral">Geral</option>
                                        <option value="Importante">Importante</option>
                                        <option value="Evento">Evento</option>
                                        <option value="Regras">Regras</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-2 pt-6">
                                    <input type="checkbox" checked={isPinned} onChange={e => setIsPinned(e.target.checked)} className="w-5 h-5 text-indigo-600 rounded" />
                                    <span className="text-sm font-bold text-slate-700">Fixar no topo</span>
                                </div>
                            </div>
                            <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors">
                                {isSubmitting ? 'Publicando...' : 'Publicar Aviso'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {notices.map(notice => {
                    const author = residents.find(r => r.id === notice.author_id);
                    return (
                        <div key={notice.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-indigo-300 transition-colors">
                            {notice.category === 'Importante' && (
                                <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                                    <div className="absolute top-2 -right-5 transform rotate-45 bg-rose-500 text-white text-[10px] font-bold py-1 px-6 shadow-md shadow-rose-500/20">
                                        IMPORTANTE
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold uppercase">
                                    {author?.name.charAt(0) || 'A'}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                        {author?.name || 'Administração'}
                                        {notice.is_pinned && <Pin size={12} className="text-indigo-600" />}
                                    </p>
                                    <p className="text-[10px] text-slate-500">{new Date(notice.created_at).toLocaleDateString('pt-BR')}</p>
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-slate-900 mb-2">{notice.title}</h3>
                            <p className="text-slate-600 text-sm mb-6 whitespace-pre-wrap">{notice.content}</p>

                            {notice.is_general ? (
                                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase">
                                    Para Todos
                                </span>
                            ) : (
                                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase">
                                    Aviso Específico
                                </span>
                            )}
                        </div>
                    );
                })}
                {notices.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-slate-100 border-dashed">
                        <Megaphone size={48} className="mx-auto text-slate-300 mb-4" />
                        <p className="text-slate-500 font-medium">Nenhum aviso no momento.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
