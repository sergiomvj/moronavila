import React, { useState } from 'react';
import { Bed, ArrowLeft, Plus, ImageIcon, Film, AlertCircle, ChevronRight, X, Edit2, Trash2, ArrowRightLeft } from 'lucide-react';
import { Room, Resident, MaintenanceRequest, MaintenanceStatus, Furniture, RoomMedia } from '../types';
import { uploadRoomMedia, createMaintenanceRequest, deleteFurniture, updateFurniture, addFurniture } from '../lib/database';

interface RoomsViewProps {
    rooms: Room[];
    residents: Resident[];
    maintenance: MaintenanceRequest[];
    isAdmin: boolean;
    currentUser: Resident;
    onRefresh: () => void;
}

export function RoomsView({ rooms, residents, maintenance, isAdmin, currentUser, onRefresh }: RoomsViewProps) {
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(!isAdmin && currentUser.room_id ? currentUser.room_id : null);

    // Modals state
    const [showAddRoomModal, setShowAddRoomModal] = useState(false);
    const [newRoomName, setNewRoomName] = useState('');
    const [newRoomType, setNewRoomType] = useState('Quarto');
    const [newRoomCapacity, setNewRoomCapacity] = useState(1);
    const [newRoomDesc, setNewRoomDesc] = useState('');
    const [showRepairModal, setShowRepairModal] = useState(false);
    const [repairTitle, setRepairTitle] = useState('');
    const [repairDesc, setRepairDesc] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [selectedFurniture, setSelectedFurniture] = useState<Furniture | null>(null);
    const [editingFurniture, setEditingFurniture] = useState<Furniture | null>(null);
    const [transferringFurniture, setTransferringFurniture] = useState<Furniture | null>(null);
    const [transferTargetRoomId, setTransferTargetRoomId] = useState<string>('');
    const [isUploadingMedia, setIsUploadingMedia] = useState(false);
    const [showAddFurnitureModal, setShowAddFurnitureModal] = useState(false);
    const [newFurnitureName, setNewFurnitureName] = useState('');
    const [newFurnitureCond, setNewFurnitureCond] = useState<'Novo' | 'Bom' | 'Regular' | 'Ruim'>('Bom');
    const [newFurnitureDesc, setNewFurnitureDesc] = useState('');

    const handleAddRoomSubmi = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const { createRoom } = await import('../lib/database');
            await createRoom({
                name: newRoomName,
                type: newRoomType,
                capacity: newRoomCapacity,
                description: newRoomDesc
            });
            setShowAddRoomModal(false);
            setNewRoomName('');
            setNewRoomType('Quarto');
            setNewRoomCapacity(1);
            setNewRoomDesc('');
            onRefresh();
        } catch (err) {
            alert('Erro ao criar cômodo.');
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
            <div className="space-y-6 relative">
                <button
                    onClick={() => setSelectedRoomId(null)}
                    className={`${!isAdmin ? 'hidden' : 'flex'} items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors mb-4`}
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
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Mobília & Detalhes</h3>
                                        {isAdmin && (
                                            <button
                                                onClick={() => setShowAddFurnitureModal(true)}
                                                className="flex items-center gap-1 text-[10px] font-bold uppercase text-indigo-600 hover:text-indigo-700 transition-colors"
                                            >
                                                <Plus size={14} /> Adicionar Móvel
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {room.furniture.map(f => (
                                            <div
                                                key={f.id}
                                                onClick={() => setSelectedFurniture(f)}
                                                className="p-4 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer hover:border-indigo-300 transition-colors relative group"
                                            >
                                                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {isAdmin && (
                                                        <>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setEditingFurniture(f); }}
                                                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200"
                                                                title="Editar"
                                                            >
                                                                <Edit2 size={14} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setTransferringFurniture(f); setTransferTargetRoomId(''); }}
                                                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200"
                                                                title="Transferir"
                                                            >
                                                                <ArrowRightLeft size={14} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => handleDeleteFurniture(e, f)}
                                                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-rose-200"
                                                                title="Excluir"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between mb-2 pr-24">
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
                {/* Editing Furniture Modal */}
                {editingFurniture && (
                    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl p-6 w-full max-w-md">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold">Editar Móvel</h3>
                                <button onClick={() => setEditingFurniture(null)} className="text-slate-400 hover:text-slate-700">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleEditFurnitureSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Nome</label>
                                    <input type="text" required value={editingFurniture.name} onChange={e => setEditingFurniture({ ...editingFurniture, name: e.target.value })} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500/20" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Descrição</label>
                                    <input type="text" value={editingFurniture.description || ''} onChange={e => setEditingFurniture({ ...editingFurniture, description: e.target.value })} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500/20" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Condição</label>
                                    <select value={editingFurniture.condition} onChange={e => setEditingFurniture({ ...editingFurniture, condition: e.target.value })} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500/20 bg-white">
                                        <option value="Novo">Novo</option>
                                        <option value="Bom">Bom</option>
                                        <option value="Regular">Regular</option>
                                        <option value="Péssimo">Péssimo</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Data de Compra</label>
                                    <input type="date" value={editingFurniture.purchase_date || ''} onChange={e => setEditingFurniture({ ...editingFurniture, purchase_date: e.target.value })} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500/20" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Nº Série / NF</label>
                                    <input type="text" value={editingFurniture.serial_number || ''} onChange={e => setEditingFurniture({ ...editingFurniture, serial_number: e.target.value })} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500/20" />
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <button type="button" onClick={() => setEditingFurniture(null)} className="px-6 py-3 font-bold text-slate-600 hover:bg-slate-100 rounded-xl">Cancelar</button>
                                    <button type="submit" disabled={isSubmitting} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700">
                                        {isSubmitting ? 'Salvando...' : 'Salvar Móvel'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Transferring Furniture Modal */}
                {transferringFurniture && (
                    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl p-6 w-full max-w-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold">Transferir Móvel</h3>
                                <button onClick={() => setTransferringFurniture(null)} className="text-slate-400 hover:text-slate-700">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleTransferFurnitureSubmit} className="space-y-4">
                                <p className="text-sm text-slate-600">
                                    Mover <span className="font-bold text-slate-900">{transferringFurniture.name}</span> para outro cômodo:
                                </p>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Cômodo de Destino</label>
                                    <select
                                        required
                                        value={transferTargetRoomId}
                                        onChange={e => setTransferTargetRoomId(e.target.value)}
                                        className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500/20 bg-white"
                                    >
                                        <option value="" disabled>Selecione um cômodo</option>
                                        {rooms.filter(r => r.id !== room.id).map(r => (
                                            <option key={r.id} value={r.id}>{r.name} ({r.type})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <button type="button" onClick={() => setTransferringFurniture(null)} className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl">Cancelar</button>
                                    <button type="submit" disabled={isSubmitting || !transferTargetRoomId} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50">
                                        {isSubmitting ? 'Movendo...' : 'Transferir'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Add Furniture Modal */}
                {showAddFurnitureModal && (
                    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl p-6 w-full max-w-md">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold">Adicionar Móvel</h3>
                                <button onClick={() => setShowAddFurnitureModal(false)} className="text-slate-400 hover:text-slate-700">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="mb-8">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Adição Rápida</p>
                                <div className="flex flex-wrap gap-2">
                                    {['Cama', 'Guarda-roupa', 'Escrivaninha', 'Cadeira', 'Ar Condicionado', 'Frigobar', 'Smart TV'].map(item => (
                                        <button
                                            key={item}
                                            onClick={() => handleAddFurnitureSubmit(undefined, item)}
                                            disabled={isSubmitting}
                                            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:border-indigo-600 hover:text-indigo-600 transition-all flex items-center gap-1"
                                        >
                                            <Plus size={12} /> {item}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="relative mb-8">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-bold">Ou formulário detalhado</span></div>
                            </div>

                            <form onSubmit={(e) => handleAddFurnitureSubmit(e)} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Nome do Item</label>
                                    <input
                                        type="text" required
                                        value={newFurnitureName}
                                        onChange={e => setNewFurnitureName(e.target.value)}
                                        placeholder="Ex: Armário de Aço"
                                        className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Condição</label>
                                    <select
                                        value={newFurnitureCond}
                                        onChange={e => setNewFurnitureCond(e.target.value as any)}
                                        className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500/20 bg-white font-medium"
                                    >
                                        <option value="Novo">Novo</option>
                                        <option value="Bom">Bom</option>
                                        <option value="Regular">Regular</option>
                                        <option value="Ruim">Ruim (Necessita manutenção)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Descrição / Detalhes</label>
                                    <textarea
                                        value={newFurnitureDesc}
                                        onChange={e => setNewFurnitureDesc(e.target.value)}
                                        placeholder="Opcional..."
                                        className="w-full border border-slate-200 rounded-xl p-3 h-20 focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddFurnitureModal(false)}
                                        className="flex-1 py-3 font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !newFurnitureName}
                                        className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all disabled:opacity-50"
                                    >
                                        {isSubmitting ? 'Salvando...' : 'Adicionar Móvel'}
                                    </button>
                                </div>
                            </form>
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
                    <button
                        onClick={() => setShowAddRoomModal(true)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium hover:bg-indigo-700 transition-colors"
                    >
                        <Plus size={18} /> Adicionar Cômodo
                    </button>
                )}
            </div>

            {/* Add Room Modal */}
            {showAddRoomModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">Novo Cômodo</h3>
                            <button onClick={() => setShowAddRoomModal(false)} className="text-slate-400 hover:text-slate-700">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleAddRoomSubmi} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Nome / Número</label>
                                <input type="text" required value={newRoomName} onChange={e => setNewRoomName(e.target.value)} placeholder="Ex: Suíte 101" className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500/20" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Tipo</label>
                                    <select value={newRoomType} onChange={e => setNewRoomType(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500/20 bg-white">
                                        <option value="Quarto">Quarto</option>
                                        <option value="Área Comum">Área Comum</option>
                                        <option value="Lavanderia">Lavanderia</option>
                                        <option value="Cozinha">Cozinha</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Capacidade</label>
                                    <input type="number" min="1" value={newRoomCapacity} onChange={e => setNewRoomCapacity(parseInt(e.target.value))} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500/20" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Descrição</label>
                                <textarea value={newRoomDesc} onChange={e => setNewRoomDesc(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 h-24 focus:ring-2 focus:ring-indigo-500/20" placeholder="Opcional..." />
                            </div>
                            <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors">
                                {isSubmitting ? 'Criando...' : 'Criar Cômodo'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
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
