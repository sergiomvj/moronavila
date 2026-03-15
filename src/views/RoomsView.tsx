import React, { useState } from 'react';
import { Bed, ArrowLeft, Plus, ImageIcon, Film, AlertCircle, ChevronRight, X, Edit2, Trash2, ArrowRightLeft, Wrench, Users, CreditCard, Lock } from 'lucide-react';
import { Room, Resident, MaintenanceRequest, MaintenanceStatus, Furniture, RoomMedia } from '../types';
import { uploadRoomMedia, createMaintenanceRequest, deleteFurniture, updateFurniture, addFurniture, createRoom, updateRoom } from '../lib/database';

interface RoomsViewProps {
    rooms: Room[];
    maintenance: MaintenanceRequest[];
    isAdmin: boolean;
    currentUser: Resident;
    onRefresh: () => void;
}

export function RoomsView({ rooms, maintenance, isAdmin, currentUser, onRefresh }: RoomsViewProps) {
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
    const [newRoomName, setNewRoomName] = useState('');
    const [newRoomType, setNewRoomType] = useState('Quarto');
    const [newRoomCapacity, setNewRoomCapacity] = useState(1);
    const [newRoomRent, setNewRoomRent] = useState(0);
    const [newRoomCleaning, setNewRoomCleaning] = useState(0);
    const [newRoomDesc, setNewRoomDesc] = useState('');
    const [newRoomIsCommonArea, setNewRoomIsCommonArea] = useState(false);
    const [newRoomIsBlocked, setNewRoomIsBlocked] = useState(false);
    const [newRoomAvailability, setNewRoomAvailability] = useState<'Disponível' | 'Ocupado' | 'Indisponível'>('Disponível');

    const [selectedFurniture, setSelectedFurniture] = useState<Furniture | null>(null);
    const [editingFurniture, setEditingFurniture] = useState<Furniture | null>(null);
    const [transferringFurniture, setTransferringFurniture] = useState<Furniture | null>(null);
    const [transferTargetRoomId, setTransferTargetRoomId] = useState<string>('');
    const [isUploadingMedia, setIsUploadingMedia] = useState(false);
    const [showAddFurnitureModal, setShowAddFurnitureModal] = useState(false);
    const [newFurnitureName, setNewFurnitureName] = useState('');
    const [newFurnitureCond, setNewFurnitureCond] = useState<'Novo' | 'Bom' | 'Regular' | 'Ruim'>('Bom');
    const [newFurnitureDesc, setNewFurnitureDesc] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showRepairModal, setShowRepairModal] = useState(false);
    const [repairTitle, setRepairTitle] = useState('');
    const [repairDesc, setRepairDesc] = useState('');

    // Edit Room Modal State
    const [isEditingRoom, setIsEditingRoom] = useState(false);
    const [editRoomData, setEditRoomData] = useState<Partial<Room> | null>(null);

    const handleAddRoomSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await createRoom({
                name: newRoomName,
                type: newRoomType as any,
                capacity: newRoomCapacity,
                description: newRoomDesc,
                rent_value: newRoomRent,
                cleaning_fee: newRoomCleaning,
                is_common_area: newRoomIsCommonArea,
                is_blocked_for_repairs: newRoomIsBlocked,
                availability_status: newRoomAvailability
            });
            setNewRoomName('');
            setNewRoomDesc('');
            setNewRoomRent(0);
            setNewRoomCleaning(0);
            setNewRoomIsCommonArea(false);
            setNewRoomIsBlocked(false);
            setNewRoomAvailability('Disponível');
            onRefresh();
        } catch (err: any) {
            alert('Erro ao criar cômodo: ' + (err?.message || 'Erro desconhecido'));
        } finally {
            setIsSubmitting(false);
        }
    };

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

    const handleDeleteFurniture = async (e: React.MouseEvent, f: Furniture) => {
        e.stopPropagation();
        if (window.confirm(`Tem certeza que deseja excluir o móvel "${f.name}"?`)) {
            try {
                await deleteFurniture(f.id);
                if (selectedFurniture?.id === f.id) setSelectedFurniture(null);
                onRefresh();
            } catch (err) {
                alert('Erro ao excluir móvel.');
            }
        }
    };

    const handleEditFurnitureSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingFurniture) return;
        setIsSubmitting(true);
        try {
            await updateFurniture(editingFurniture.id, {
                name: editingFurniture.name,
                description: editingFurniture.description,
                condition: editingFurniture.condition,
                purchase_date: editingFurniture.purchase_date,
                serial_number: editingFurniture.serial_number
            });
            setEditingFurniture(null);
            onRefresh();
        } catch (err) {
            alert('Erro ao editar móvel.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTransferFurnitureSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!transferringFurniture || !transferTargetRoomId) return;
        setIsSubmitting(true);
        try {
            await updateFurniture(transferringFurniture.id, {
                room_id: transferTargetRoomId
            });
            setTransferringFurniture(null);
            setTransferTargetRoomId('');
            onRefresh();
        } catch (err) {
            alert('Erro ao transferir móvel.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddFurnitureSubmit = async (e?: React.FormEvent, quickName?: string) => {
        if (e) e.preventDefault();
        if (!selectedRoomId) return;

        setIsSubmitting(true);
        try {
            await addFurniture(selectedRoomId, {
                name: quickName || newFurnitureName,
                condition: quickName ? 'Novo' : newFurnitureCond,
                description: quickName ? '' : newFurnitureDesc,
                purchase_date: new Date().toISOString().split('T')[0]
            });
            setShowAddFurnitureModal(false);
            setNewFurnitureName('');
            setNewFurnitureCond('Bom');
            setNewFurnitureDesc('');
            onRefresh();
        } catch (err) {
            alert('Erro ao adicionar móvel.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (selectedRoomId) {
        const room = rooms.find(r => r.id === selectedRoomId);
        if (!room) return null;

        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <button
                    onClick={() => setSelectedRoomId(null)}
                    className={`${!isAdmin ? 'hidden' : 'flex'} items-center gap-2 text-slate-500 hover:text-rose-500 transition-all mb-4 font-black uppercase text-[10px] tracking-widest`}
                >
                    <ArrowLeft size={16} /> Voltar para lista
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Header Bento Block */}
                    <div className="lg:col-span-12 bento-card border-l-4 border-l-rose-600 !p-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="bg-rose-500/10 text-rose-500 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-rose-500/20">
                                        {room.type}
                                    </span>
                                    {room.is_common_area && (
                                        <span className="bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-indigo-500/20">
                                            Área Comum
                                        </span>
                                    )}
                                    {room.is_blocked_for_repairs && (
                                        <span className="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-500/20 flex items-center gap-1">
                                            <Lock size={10} /> Em Reparo
                                        </span>
                                    )}
                                    <span className="text-slate-600 font-black text-[9px] uppercase tracking-widest">ID: {room.id.slice(0, 8)}</span>
                                </div>
                                <div className="flex items-center gap-4 group/title">
                                    <h2 className="text-4xl font-black text-white tracking-tighter uppercase">{room.name}</h2>
                                    {isAdmin && (
                                        <button
                                            onClick={() => {
                                                setEditRoomData(room);
                                                setIsEditingRoom(true);
                                            }}
                                            className="p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-rose-500 opacity-0 group-hover/title:opacity-100 transition-all"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                    )}
                                </div>
                                <p className="text-slate-400 mt-2 font-medium max-w-2xl leading-relaxed">{room.description || 'Este cômodo não possui uma descrição técnica detalhada ainda.'}</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col items-center justify-center min-w-[100px]">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Capacidade</span>
                                    <div className="flex flex-col items-center">
                                        <span className="text-xl font-black text-white">{room.residents?.length || 0} / {room.capacity}</span>
                                        {room.type === 'Quarto' && room.capacity > 0 && (
                                            <span className="text-[8px] font-black text-rose-500/50 uppercase tracking-tighter mt-0.5">
                                                Slots: {Array.from({ length: room.capacity }, (_, i) => String.fromCharCode(65 + i)).join(', ')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col items-center justify-center min-w-[100px]">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Mobiliário</span>
                                    <span className="text-xl font-black text-white">{room.furniture?.length || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Left Column: Media & Furniture */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Furniture Section */}
                        <div className="bento-card">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-600"></div> Mobiliário & Infraestrutura
                                </h3>
                                {isAdmin && (
                                    <button
                                        onClick={() => setShowAddFurnitureModal(true)}
                                        className="bg-rose-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all"
                                    >
                                        <Plus size={14} className="inline mr-1" /> Novo Item
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {room.furniture.length > 0 ? room.furniture.map(f => (
                                    <div
                                        key={f.id}
                                        onClick={() => setSelectedFurniture(f)}
                                        className="bg-slate-950/50 p-5 rounded-3xl border border-slate-800/50 cursor-pointer hover:border-rose-500/30 transition-all group relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-600/5 blur-[50px] -mr-12 -mt-12"></div>
                                        <div className="flex items-center justify-between mb-3 relative z-10">
                                            <span className="font-black text-slate-200 uppercase tracking-tight group-hover:text-rose-500 transition-colors">{f.name}</span>
                                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-lg border ${f.condition === 'Novo' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                f.condition === 'Bom' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                                    f.condition === 'Regular' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                                }`}>
                                                {f.condition}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 line-clamp-1 mb-4 relative z-10">{f.description || 'Sem descrição adicional.'}</p>

                                        {isAdmin && (
                                            <div className="flex items-center gap-2 pt-4 border-t border-slate-800/50 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                                                <button onClick={(e) => { e.stopPropagation(); setEditingFurniture(f); }} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all"><Edit2 size={12} /></button>
                                                <button onClick={(e) => { e.stopPropagation(); setTransferringFurniture(f); setTransferTargetRoomId(''); }} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all"><ArrowRightLeft size={12} /></button>
                                                <button onClick={(e) => handleDeleteFurniture(e, f)} className="p-2 bg-slate-800 hover:bg-rose-900/30 rounded-lg text-slate-400 hover:text-rose-500 transition-all ml-auto"><Trash2 size={12} /></button>
                                            </div>
                                        )}
                                    </div>
                                )) : (
                                    <div className="col-span-full py-12 text-center text-slate-600 font-black uppercase tracking-widest text-[10px] border border-dashed border-slate-800 rounded-3xl">
                                        Nenhum mobiliário registrado
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Media Section */}
                        <div className="bento-card">
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 mb-8">
                                <div className="w-1.5 h-1.5 rounded-full bg-rose-600"></div> Inspeção Visual
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {room.media.map(m => (
                                    <div key={m.id} className="relative aspect-square rounded-[2rem] overflow-hidden group border border-slate-800">
                                        {m.type === 'video' ? (
                                            <video src={m.url} className="w-full h-full object-cover bg-black" />
                                        ) : (
                                            <img src={m.url} alt="Room" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                        )}
                                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button className="p-3 bg-white/10 backdrop-blur-md rounded-2xl text-white hover:bg-white/20 transition-all"><Plus size={20} /></button>
                                        </div>
                                    </div>
                                ))}

                                <label className="cursor-pointer aspect-square rounded-[2rem] border-2 border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-600 hover:border-rose-500/50 hover:text-rose-500 transition-all bg-slate-900/30">
                                    {isUploadingMedia ? (
                                        <span className="text-[10px] font-black uppercase animate-pulse">Enviando...</span>
                                    ) : (
                                        <>
                                            <div className="p-4 bg-slate-800 rounded-2xl mb-3"><ImageIcon size={24} /></div>
                                            <span className="text-[9px] font-black uppercase tracking-widest">Adicionar Mídia</span>
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

                    {/* Right Column: Residents & Maintenance */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Residents Bento Block */}
                        <div className="bento-card border border-rose-500/10">
                            <h3 className="text-xs font-black text-rose-500 uppercase tracking-[0.2em] flex items-center gap-2 mb-8">
                                <Users size={16} /> Ocupantes Atuais
                            </h3>
                            <div className="space-y-4">
                                {room.residents && room.residents.length > 0 ? room.residents.map(res => (
                                    <div key={res.id} className="flex items-center gap-4 p-4 rounded-3xl bg-slate-950 border border-slate-800 group hover:border-rose-500/30 transition-all">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-600 to-rose-900 flex items-center justify-center text-white text-xl font-black uppercase shadow-lg shadow-rose-900/40">
                                            {res.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-black text-white uppercase tracking-tight group-hover:text-rose-500 transition-colors">
                                                {res.name}
                                                {res.bed_identifier && <span className="ml-2 text-[10px] bg-rose-600 text-white px-2 py-0.5 rounded-lg">Cama {res.bed_identifier}</span>}
                                            </p>
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Check-in: {res.entry_date}</p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="py-10 text-center bg-slate-950 rounded-[2rem] border border-dashed border-slate-800">
                                        <p className="text-slate-600 font-black uppercase text-[10px] tracking-widest">Cômodo em Aberto</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Maintenance Bento Block */}
                        <div className="bento-card border border-rose-500/20 shadow-xl shadow-rose-950/20">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xs font-black text-rose-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Wrench size={16} /> Reparos Pendentes
                                </h3>
                                <div className="bg-rose-500/20 text-rose-500 text-[10px] font-black w-6 h-6 rounded-lg flex items-center justify-center">
                                    {maintenance.filter(m => m.room_id === room.id && m.status !== MaintenanceStatus.RESOLVED).length}
                                </div>
                            </div>
                            <div className="space-y-4">
                                {maintenance.filter(m => m.room_id === room.id && m.status !== MaintenanceStatus.RESOLVED).map(m => (
                                    <div key={m.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                                            <p className="text-[10px] font-black text-white uppercase tracking-tight">{m.title}</p>
                                        </div>
                                        <p className="text-[10px] text-slate-500 leading-relaxed font-medium">{m.description}</p>
                                    </div>
                                ))}
                                {(isAdmin || currentUser.room_id === room.id) && (
                                    <button
                                        onClick={() => setShowRepairModal(true)}
                                        className="w-full py-4 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-rose-700 transition-all shadow-lg shadow-rose-900/30 mt-4 active:scale-95"
                                    >
                                        Solicitar Intervenção
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Financial Snapshot */}
                        <div className="bento-card bg-gradient-to-br from-slate-900 to-slate-950">
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 mb-6">
                                <CreditCard size={16} /> Dados Operacionais
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.1em]">Aluguel Base</span>
                                    <span className="text-sm font-black text-white">R$ {room.rent_value || '0,00'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.1em]">Taxa de Limpeza</span>
                                    <span className="text-sm font-black text-white">R$ {room.cleaning_fee || '0,00'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.1em]">Extras</span>
                                    <span className="text-sm font-black text-white">R$ {room.extras_value || '0,00'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.1em]">Total Estimado</span>
                                    <span className="text-lg font-black text-rose-500">R$ {((room.rent_value || 0) + (room.cleaning_fee || 0) + (room.extras_value || 0)).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Repair Modal */}
                {showRepairModal && (
                    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-600 to-transparent"></div>
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-2xl font-black text-white tracking-tighter">Solicitar Reparo</h3>
                                <button onClick={() => setShowRepairModal(false)} className="bg-slate-800 p-2 rounded-xl text-slate-400 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleMaintenanceSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Título do Problema</label>
                                    <input type="text" required value={repairTitle} onChange={e => setRepairTitle(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white focus:border-rose-500 outline-none" placeholder="Ex: Vazamento no chuveiro" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Descrição Detalhada</label>
                                    <textarea required value={repairDesc} onChange={e => setRepairDesc(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white h-32 focus:border-rose-500 outline-none resize-none" placeholder="Descreva os detalhes..." />
                                </div>
                                <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-rose-700">
                                    {isSubmitting ? 'Enviando...' : 'Confirmar Solicitação'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Furniture Modal */}
                {selectedFurniture && (
                    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 w-full max-w-sm shadow-2xl">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-xl font-black text-white uppercase tracking-tight">Ficha Técnica</h3>
                                <button onClick={() => setSelectedFurniture(null)} className="bg-slate-800 p-2 rounded-xl text-slate-400 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="space-y-6">
                                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Identificação</p>
                                    <p className="font-bold text-white text-lg">{selectedFurniture.name}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Estado</p>
                                        <p className="font-black text-rose-500">{selectedFurniture.condition}</p>
                                    </div>
                                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Série/NF</p>
                                        <p className="font-bold text-white truncate">{selectedFurniture.serial_number || '-'}</p>
                                    </div>
                                </div>
                                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Histórico/Notas</p>
                                    <p className="text-slate-400 text-xs font-medium leading-relaxed">{selectedFurniture.description || 'Nenhum comentário registrado.'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Furniture Modal */}
                {editingFurniture && (
                    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-xl font-black text-white uppercase tracking-tight">Editar Inventário</h3>
                                <button onClick={() => setEditingFurniture(null)} className="bg-slate-800 p-2 rounded-xl text-slate-400 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleEditFurnitureSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Item</label>
                                    <input type="text" required value={editingFurniture.name} onChange={e => setEditingFurniture({ ...editingFurniture, name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white focus:border-rose-500 outline-none" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Condição</label>
                                        <select value={editingFurniture.condition} onChange={e => setEditingFurniture({ ...editingFurniture, condition: e.target.value as any })} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white focus:border-rose-500 outline-none appearance-none">
                                            <option value="Novo">Novo</option>
                                            <option value="Bom">Bom</option>
                                            <option value="Regular">Regular</option>
                                            <option value="Péssimo">Péssimo</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Aquisição</label>
                                        <input type="date" value={editingFurniture.purchase_date || ''} onChange={e => setEditingFurniture({ ...editingFurniture, purchase_date: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white focus:border-rose-500 outline-none" />
                                    </div>
                                </div>
                                <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-rose-700 shadow-xl shadow-rose-900/30">
                                    {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Add Furniture Modal */}
                {showAddFurnitureModal && (
                    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-xl font-black text-white uppercase tracking-tight">Novo Equipamento</h3>
                                <button onClick={() => setShowAddFurnitureModal(false)} className="bg-slate-800 p-2 rounded-xl text-slate-400 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="mb-8">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Escolha Rápida</p>
                                <div className="flex flex-wrap gap-2">
                                    {['Cama', 'Roupeiro', 'Mesa', 'Cadeira', 'Ar Cond.', 'Frigobar', 'TV'].map(item => (
                                        <button
                                            key={item}
                                            onClick={() => handleAddFurnitureSubmit(undefined, item)}
                                            disabled={isSubmitting}
                                            className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-rose-600 hover:text-white"
                                        >
                                            {item}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <form onSubmit={(e) => handleAddFurnitureSubmit(e)} className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Item Personalizado</label>
                                    <input type="text" required value={newFurnitureName} onChange={e => setNewFurnitureName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white focus:border-rose-500 outline-none" placeholder="Nome do item..." />
                                </div>
                                <button type="submit" disabled={isSubmitting || !newFurnitureName} className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-rose-700 shadow-xl shadow-rose-900/30">
                                    Adicionar ao Inventário
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Transfer Furniture Modal */}
                {transferringFurniture && (
                    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl">
                            <h3 className="text-xl font-black text-white uppercase tracking-tight mb-8">Redirecionar Item</h3>
                            <form onSubmit={handleTransferFurnitureSubmit} className="space-y-6">
                                <p className="text-[11px] text-slate-400 font-medium uppercase tracking-widest mb-4">Mover <span className="text-rose-500">{transferringFurniture.name}</span> para:</p>
                                <select required value={transferTargetRoomId} onChange={e => setTransferTargetRoomId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white focus:border-rose-500 outline-none appearance-none">
                                    <option value="" disabled>Selecione o destino</option>
                                    {rooms.filter(r => r.id !== room.id).map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                                <div className="flex gap-4">
                                    <button type="button" onClick={() => setTransferringFurniture(null)} className="flex-1 py-4 bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-700">Cancelar</button>
                                    <button type="submit" disabled={isSubmitting || !transferTargetRoomId} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-rose-700 shadow-xl shadow-rose-900/30">Mover</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit Room Modal */}
                {isEditingRoom && editRoomData && (
                    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl relative overflow-hidden">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-2xl font-black text-white tracking-tighter uppercase">Editar Cômodo</h3>
                                <button onClick={() => setIsEditingRoom(false)} className="bg-slate-800 p-2 rounded-xl text-slate-400 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                setIsSubmitting(true);
                                try {
                                    await updateRoom(room.id, editRoomData);
                                    setIsEditingRoom(false);
                                    onRefresh();
                                } catch (err) {
                                    alert('Erro ao editar cômodo');
                                } finally {
                                    setIsSubmitting(false);
                                }
                            }} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Nome</label>
                                        <input type="text" value={editRoomData.name} onChange={e => setEditRoomData({ ...editRoomData, name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-rose-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Tipo</label>
                                        <select value={editRoomData.type} onChange={e => setEditRoomData({ ...editRoomData, type: e.target.value as any })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-rose-500 outline-none appearance-none">
                                            <option value="Quarto">Quarto</option>
                                            <option value="Suíte">Suíte</option>
                                            <option value="Sala">Sala</option>
                                            <option value="Cozinha">Cozinha</option>
                                            <option value="Banheiro">Banheiro</option>
                                            <option value="Varanda">Varanda</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Capacidade</label>
                                        <input type="number" value={editRoomData.capacity} onChange={e => setEditRoomData({ ...editRoomData, capacity: parseInt(e.target.value) })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-rose-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Aluguel (R$)</label>
                                        <input type="number" value={editRoomData.rent_value} onChange={e => setEditRoomData({ ...editRoomData, rent_value: parseFloat(e.target.value) })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-rose-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Limpeza (R$)</label>
                                        <input type="number" value={editRoomData.cleaning_fee} onChange={e => setEditRoomData({ ...editRoomData, cleaning_fee: parseFloat(e.target.value) })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-rose-500 outline-none" />
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-slate-800">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Disponibilidade</span>
                                        <select
                                            value={editRoomData.availability_status}
                                            onChange={e => setEditRoomData({ ...editRoomData, availability_status: e.target.value as any })}
                                            className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-[10px] font-black text-white outline-none"
                                        >
                                            <option value="Disponível">Disponível</option>
                                            <option value="Ocupado">Ocupado</option>
                                            <option value="Indisponível">Indisponível</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="editIsCommon"
                                            checked={editRoomData.is_common_area}
                                            onChange={e => setEditRoomData({ ...editRoomData, is_common_area: e.target.checked })}
                                            className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-rose-600"
                                        />
                                        <label htmlFor="editIsCommon" className="text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer">Definir como Área Comum</label>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="editIsBlocked"
                                            checked={editRoomData.is_blocked_for_repairs}
                                            onChange={e => setEditRoomData({ ...editRoomData, is_blocked_for_repairs: e.target.checked })}
                                            className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-rose-600"
                                        />
                                        <label htmlFor="editIsBlocked" className="text-[10px] font-black text-amber-500 uppercase tracking-widest cursor-pointer">Bloquear para Reparos</label>
                                    </div>
                                </div>

                                <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-rose-700 shadow-xl shadow-rose-900/30 transition-all">
                                    {isSubmitting ? 'Salvando...' : 'Atualizar Cômodo'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            {isAdmin && (
                <div className="bento-card border-l-4 border-l-rose-600">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-rose-600/10 rounded-2xl flex items-center justify-center text-rose-600">
                            <Plus size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Novo Ativo Imobiliário</h2>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Expanda sua infraestrutura</p>
                        </div>
                    </div>

                    <form onSubmit={handleAddRoomSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Identificação do Cômodo</label>
                            <input
                                type="text"
                                required
                                value={newRoomName}
                                onChange={e => setNewRoomName(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white focus:border-rose-500 outline-none transition-all placeholder:text-slate-700 font-medium"
                                placeholder="Ex: Suite Master 01"
                            />
                        </div>
                        <div>
                            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Tipo / Categoria</label>
                            <select
                                value={newRoomType}
                                onChange={e => setNewRoomType(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white focus:border-rose-500 outline-none transition-all appearance-none font-black uppercase text-[10px] tracking-widest"
                            >
                                <option value="Quarto">Quarto</option>
                                <option value="Suíte">Suíte</option>
                                <option value="Sala">Sala</option>
                                <option value="Cozinha">Cozinha</option>
                                <option value="Banheiro">Banheiro</option>
                                <option value="Varanda">Varanda</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Capacidade Máxima</label>
                            <input
                                type="number"
                                required
                                min="1"
                                value={newRoomCapacity}
                                onChange={e => setNewRoomCapacity(parseInt(e.target.value))}
                                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white focus:border-rose-500 outline-none transition-all font-black text-center"
                            />
                        </div>
                        
                        <div className="md:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-800/50">
                             <div className="flex items-center gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                                <input
                                    type="checkbox"
                                    id="isCommon"
                                    checked={newRoomIsCommonArea}
                                    onChange={e => setNewRoomIsCommonArea(e.target.checked)}
                                    className="w-5 h-5 rounded border-slate-800 bg-slate-900 text-rose-600 focus:ring-rose-500/20"
                                />
                                <label htmlFor="isCommon" className="text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer select-none">Marcar como Área Comum</label>
                            </div>
                            <div className="flex items-center gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                                <input
                                    type="checkbox"
                                    id="isBlocked"
                                    checked={newRoomIsBlocked}
                                    onChange={e => setNewRoomIsBlocked(e.target.checked)}
                                    className="w-5 h-5 rounded border-slate-800 bg-slate-900 text-rose-600 focus:ring-rose-500/20"
                                />
                                <label htmlFor="isBlocked" className="text-[10px] font-black text-amber-500 uppercase tracking-widest cursor-pointer select-none">Bloquear para Reparos Inicialmente</label>
                            </div>
                            <div className="flex items-center gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2">Status Inicial:</span>
                                <select
                                    value={newRoomAvailability}
                                    onChange={e => setNewRoomAvailability(e.target.value as any)}
                                    className="bg-transparent text-[10px] font-black text-white uppercase outline-none"
                                >
                                    <option value="Disponível">Disponível</option>
                                    <option value="Ocupado">Ocupado</option>
                                    <option value="Indisponível">Indisponível</option>
                                </select>
                            </div>
                        </div>

                        <div className="md:col-span-4 flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-rose-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] hover:bg-rose-700 transition-all shadow-xl shadow-rose-900/30 active:scale-95 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Iniciando Registro...' : 'Finalizar Registro de Cômodo'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {rooms.map(room => (
                    <div
                        key={room.id}
                        onClick={() => setSelectedRoomId(room.id)}
                        className="bento-card group cursor-pointer border border-slate-800/50 hover:border-rose-500/40 hover:shadow-2xl hover:shadow-rose-900/10 transition-all duration-500 relative overflow-hidden flex flex-col h-full"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-600/5 blur-[60px] -mr-16 -mt-16 group-hover:bg-rose-600/10 transition-all"></div>
                        
                        <div className="flex items-start justify-between mb-6 relative z-10">
                            <div className="flex flex-col gap-1.5">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{room.type}</span>
                                <h3 className="text-xl font-black text-white tracking-tighter uppercase group-hover:text-rose-500 transition-colors">{room.name}</h3>
                            </div>
                            <div className="text-right flex flex-col items-end gap-1.5">
                                <span className={`text-[8px] font-black uppercase px-2.5 py-1 rounded-full border ${
                                    room.availability_status === 'Disponível' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                    room.availability_status === 'Ocupado' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                    'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                }`}>
                                    {room.availability_status}
                                </span>
                                {room.is_blocked_for_repairs && (
                                    <span className="bg-rose-950/40 text-rose-500 text-[8px] font-black px-2 py-0.5 rounded-md border border-rose-500/20 flex items-center gap-1">
                                        <Lock size={8} /> REPARO
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex-grow space-y-4 relative z-10 mb-6">
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800/50">
                                <div className="flex -space-x-2">
                                    {room.residents?.map((r, i) => (
                                        <div key={r.id} className="w-8 h-8 rounded-full border-2 border-slate-950 bg-rose-600 flex items-center justify-center text-[10px] font-black text-white shadow-lg overflow-hidden" title={r.name}>
                                            {r.name.charAt(0)}
                                        </div>
                                    ))}
                                    {Array.from({ length: Math.max(0, room.capacity - (room.residents?.length || 0)) }).map((_, i) => (
                                        <div key={`empty-${i}`} className="w-8 h-8 rounded-full border-2 border-slate-950 bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-600 border-dashed">
                                            -
                                        </div>
                                    ))}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Ocupação</span>
                                    <span className="text-xs font-black text-white">{room.residents?.length || 0} de {room.capacity} vagas</span>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-2">
                                    <ImageIcon size={14} className="text-slate-500" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase">{room.media?.length || 0} Fotos</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Wrench size={14} className="text-slate-500" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase">{room.furniture?.length || 0} Itens</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-800/50 flex justify-between items-center relative z-10">
                            <span className="text-lg font-black text-white tracking-tighter">R$ {room.rent_value || '0,00'}</span>
                            <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 group-hover:bg-rose-600 group-hover:text-white transition-all">
                                <ChevronRight size={18} />
                            </div>
                        </div>
                        {room.is_common_area && (
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-600"></div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
