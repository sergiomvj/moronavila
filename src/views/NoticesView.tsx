import React from 'react';
import { Megaphone, Pin } from 'lucide-react';
import { Notice, Resident } from '../types';

interface NoticesViewProps {
    notices: Notice[];
    residents: Resident[];
    isAdmin: boolean;
}

export function NoticesView({ notices, residents, isAdmin }: NoticesViewProps) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Mural de Avisos</h2>
                    <p className="text-slate-500 text-sm">Comunicados importantes da administração</p>
                </div>
                {isAdmin && (
                    <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium hover:bg-indigo-700 transition-colors">
                        Novo Aviso
                    </button>
                )}
            </div>

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
