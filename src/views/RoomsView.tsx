import React, { useState } from 'react';
import { Bed, ArrowLeft, Plus, ImageIcon, Film, AlertCircle, ChevronRight, X } from 'lucide-react';
import { Room, Resident, MaintenanceRequest, MaintenanceStatus, Furniture, RoomMedia } from '../types';
import { uploadRoomMedia, createMaintenanceRequest } from '../lib/database';

interface RoomsViewProps {
    rooms: Room[];
    residents: Resident[];
    maintenance: MaintenanceRequest[];
    isAdmin: boolean;
    currentUser: Resident;
    onRefresh: () => void;
}

export function RoomsView({ rooms, residents, maintenance, isAdmin, currentUser, onRefresh }: RoomsViewProps) {
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

    // Modals state
    const [showRepairModal, setShowRepairModal] = useState(false);
    const [repairTitle, setRepairTitle] = useState('');
    const [repairDesc, setRepairDesc] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [selectedFurniture, setSelectedFurniture] = useState<Furniture | null>(null);
    const [isUploadingMedia, setIsUploadingMedia] = useState(false);

    const handleMaintenanceSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRoomId) return;
        setIsSubmitting(true);
        try {
            await createMaintenanceRequest({
                title: repairTitle,
                description: repairDesc,
                room_id: selectedRoomId,
                requested_by: currentUser.id
            });
            setShowRepairModal(false);
            setRepairTitle('');
            setRepairDesc('');
            onRefresh();
        } catch (e) {
            alert('Erro ao solicitar reparo.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>, roomId: string) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploadingMedia(true);
        try {
            await uploadRoomMedia(roomId, file);
            onRefresh();
        } catch (err: any) {
            alert('Erro ao enviar mídia: ' + err.message);
        } finally {
            setIsUploadingMedia(false);
        }
    };

    if (selectedRoomId) {
        const room = rooms.find(r => r.id === selectedRoomId);
        if (!room) return null;

        return (
            <div className="space-y-6 relative">
                <button
                    onClick={() => setSelectedRoomId(null)}
                    className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors mb-4"
                >
                    <ArrowLeft size={20} /> Voltar para lista
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-3xl font-bold text-slate-900">{room.name}</h2>
                                <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase">
                                    {room.type}
                                </span>
                            </div>
                            <p className="text-slate-600 mb-8">{room.description || 'Nenhuma descrição fornecida.'}</p>

                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Mobília & Detalhes</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {room.furniture.map(f => (
                                            <div
                                                key={f.id}
                                                onClick={() => setSelectedFurniture(f)}
                                                className="p-4 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer hover:border-indigo-300 transition-colors"
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-bold text-slate-900">{f.name}</span>
                                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${f.condition === 'Novo' ? 'bg-emerald-100 text-emerald-700' :
                                                            f.condition === 'Bom' ? 'bg-blue-100 text-blue-700' :
                                                                f.condition === 'Regular' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                                                        }`}>
                                                        {f.condition}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 line-clamp-1">{f.description || 'Sem detalhes.'}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Galeria de Mídia</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {room.media.map(m => (
                                            <div key={m.id} className="relative aspect-video rounded-xl overflow-hidden group">
                                                {m.type === 'video' ? (
                                                    <video src={m.url} className="w-full h-full object-cover bg-black" controls />
                                                ) : (
                                                    <img src={m.url} alt="Room" className="w-full h-full object-cover" />
                                                )}
                                            </div>
                                        ))}

                                        <label className="cursor-pointer aspect-video rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition-all relative overflow-hidden">
                                            {isUploadingMedia ? (
                                                <span className="text-sm font-bold">Enviando...</span>
                                            ) : (
                                                <>
                                                    <Plus size={24} />
                                                    <span className="text-[10px] font-bold uppercase mt-2">Adicionar Mídia</span>
                                                    <input
                                                        type="file"
                                                        accept="image/*,video/*"
                                                        capture="environment"
                                                        className="hidden"
                                                        onChange={(e) => handleMediaUpload(e, room.id)}
                                                        disabled={isUploadingMedia}
                                                    />
                                                </>
                                            )}
                                        </label>

                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                            <h3 className="font-bold text-slate-900 mb-4">Moradores Atuais</h3>
                            <div className="space-y-3">
                                {room.residents && room.residents.length > 0 ? room.residents.map(res => (
                                    <div key={res.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold uppercase">
                                            {res.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">{res.name}</p>
                                            <p className="text-[10px] text-slate-500">Desde {res.entry_date}</p>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-xs text-slate-400 italic">Nenhum morador vinculado.</p>
                                )}
                            </div>
                        </div>

                        <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100">
                            <h3 className="font-bold text-rose-900 mb-4 flex items-center gap-2">
                                <AlertCircle size={18} /> Reparos Necessários
                            </h3>
                            <div className="space-y-4">
                                {maintenance.filter(m => m.room_id === room.id && m.status !== MaintenanceStatus.RESOLVED).map(m => (
                                    <div key={m.id} className="bg-white p-3 rounded-xl border border-rose-100 shadow-sm">
                                        <p className="text-xs font-bold text-slate-900 mb-1">{m.title}</p>
                                        <p className="text-[10px] text-slate-500">{m.description}</p>
                                    </div>
                                ))}
                                {(isAdmin || currentUser.room_id === room.id) && (
                                    <button
                                        onClick={() => setShowRepairModal(true)}
                                        className="w-full py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-colors"
                                    >
                                        Solicitar Reparo
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Repair Modal */}
                {showRepairModal && (
                    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl p-6 w-full max-w-md">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold">Solicitar Reparo</h3>
                                <button onClick={() => setShowRepairModal(false)} className="text-slate-400 hover:text-slate-700">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleMaintenanceSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Título do Problema</label>
                                    <input type="text" required value={repairTitle} onChange={e => setRepairTitle(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500/20" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Descrição Detalhada</label>
                                    <textarea required value={repairDesc} onChange={e => setRepairDesc(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 h-24 focus:ring-2 focus:ring-indigo-500/20" />
                                </div>
                                <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors">
                                    {isSubmitting ? 'Enviando...' : 'Confirmar Solicitação'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Furniture Details Modal */}
                {selectedFurniture && (
                    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl p-6 w-full max-w-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold">Detalhes do Móvel</h3>
                                <button onClick={() => setSelectedFurniture(null)} className="text-slate-400 hover:text-slate-700">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-bold">Nome</p>
                                    <p className="font-medium text-slate-900">{selectedFurniture.name}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-bold">Condição</p>
                                    <p className="font-medium text-slate-900">{selectedFurniture.condition}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-bold">Descrição</p>
                                    <p className="font-medium text-slate-900">{selectedFurniture.description || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-bold">Data de Compra</p>
                                    <p className="font-medium text-slate-900">{selectedFurniture.purchase_date || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-bold">Nº Série / NF</p>
                                    <p className="font-medium text-slate-900">{selectedFurniture.serial_number || '-'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">Gestão de Cômodos</h2>
                {isAdmin && (
                    <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium hover:bg-indigo-700 transition-colors">
                        <Plus size={18} /> Adicionar Cômodo
                    </button>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {rooms.map(room => (
                    <div
                        key={room.id}
                        onClick={() => setSelectedRoomId(room.id)}
                        className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all cursor-pointer group"
                    >
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-slate-100 rounded-xl text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                    <Bed size={24} />
                                </div>
                                <span className="text-[10px] font-bold uppercase bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full">
                                    {room.type}
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">{room.name}</h3>
                            <p className="text-slate-500 text-sm mb-4">Capacidade: {room.residents?.length || 0}/{room.capacity}</p>

                            <div className="space-y-3">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mobília & Itens</p>
                                <div className="flex flex-wrap gap-2">
                                    {room.furniture.slice(0, 3).map(f => (
                                        <span key={f.id} className="text-[11px] bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg text-slate-600">
                                            {f.name}
                                        </span>
                                    ))}
                                    {room.furniture.length > 3 && <span className="text-[11px] text-slate-400">+{room.furniture.length - 3} mais</span>}
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex -space-x-2">
                                {room.residents?.map(res => (
                                    <div key={res.id} className="w-8 h-8 rounded-full bg-indigo-600 border-2 border-white flex items-center justify-center text-white text-[10px] font-bold uppercase" title={res.name}>
                                        {res.name.charAt(0)}
                                    </div>
                                ))}
                            </div>
                            <button className="text-slate-400 group-hover:text-indigo-600 transition-colors">
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
