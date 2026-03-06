import React, { useState } from 'react';
import { Wrench, CheckCircle2, Clock } from 'lucide-react';
import { MaintenanceRequest, Room, Resident, MaintenanceStatus } from '../types';
import { updateMaintenanceStatus, createMaintenanceRequest } from '../lib/database';

interface MaintenanceViewProps {
    maintenance: MaintenanceRequest[];
    rooms: Room[];
    residents: Resident[];
    isAdmin: boolean;
    currentUser: Resident;
    onRefresh: () => void;
}

export function MaintenanceView({ maintenance, rooms, residents, isAdmin, currentUser, onRefresh }: MaintenanceViewProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [newRequest, setNewRequest] = useState({ title: '', description: '' });

    const visibleMaintenance = isAdmin ? maintenance : maintenance.filter(m => {
        return m.room_id === currentUser.room_id || m.requested_by === currentUser.id;
    });

    const handleStatusChange = async (maintenanceId: string, newStatus: MaintenanceStatus) => {
        if (!isAdmin) return;
        setIsProcessing(true);
        try {
            await updateMaintenanceStatus(maintenanceId, newStatus);
            onRefresh();
        } catch (e) {
            alert('Erro ao atualizar status do reparo.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCreateRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser.room_id) {
            alert('Você precisa estar vinculado a um quarto para solicitar reparos.');
            return;
        }
        setIsProcessing(true);
        try {
            await createMaintenanceRequest({
                ...newRequest,
                room_id: currentUser.room_id,
                requested_by: currentUser.id,
                status: MaintenanceStatus.OPEN
            });
            setShowModal(false);
            setNewRequest({ title: '', description: '' });
            onRefresh();
        } catch (e) {
            alert('Erro ao criar solicitação de reparo.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tighter uppercase">{isAdmin ? "Central de Manutenções" : "Meus Chamados"}</h2>
                    <p className="text-slate-500 font-bold text-sm uppercase tracking-widest mt-1">
                        {isAdmin ? "Gerenciamento de infraestrutura e reparos" : "Acompanhe suas solicitações em tempo real"}
                    </p>
                </div>
                {!isAdmin && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-rose-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:bg-rose-700 transition-all hover:scale-105 shadow-lg shadow-rose-900/20"
                    >
                        <Wrench size={16} /> Nova Solicitação
                    </button>
                )}
            </div>

            {/* Modal de Solicitação (Residente) */}
            {showModal && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 w-full max-w-md shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-600 to-transparent"></div>
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-black text-white tracking-tighter">Solicitar Reparo</h3>
                            <button onClick={() => setShowModal(false)} className="bg-slate-800 p-2 rounded-xl text-slate-400 hover:text-white transition-colors">
                                <span className="text-xl">&times;</span>
                            </button>
                        </div>
                        <form onSubmit={handleCreateRequest} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">O que precisa ser consertado?</label>
                                <input
                                    type="text"
                                    required
                                    value={newRequest.title}
                                    onChange={e => setNewRequest({ ...newRequest, title: e.target.value })}
                                    placeholder="Ex: Lâmpada do banheiro queimada"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Descrição detalhada do defeito</label>
                                <textarea
                                    required
                                    rows={4}
                                    value={newRequest.description}
                                    onChange={e => setNewRequest({ ...newRequest, description: e.target.value })}
                                    placeholder="Explique melhor o problema para agilizarmos o reparo..."
                                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all outline-none h-32 resize-none"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isProcessing}
                                className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-rose-700 transition-all active:scale-95 shadow-xl shadow-rose-900/30 disabled:opacity-50"
                            >
                                {isProcessing ? 'Processando...' : 'Enviar Chamado'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {!isAdmin ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {visibleMaintenance.length > 0 ? (
                        visibleMaintenance.map(m => (
                            <div key={m.id} className="bento-card group">
                                <div className="flex justify-between items-start mb-6">
                                    <h4 className="font-black text-slate-100 uppercase tracking-tight group-hover:text-rose-500 transition-colors">{m.title}</h4>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${m.status === MaintenanceStatus.OPEN ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                                        m.status === MaintenanceStatus.IN_PROGRESS ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                            'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                        }`}>
                                        {m.status}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-400 mb-6 leading-relaxed">{m.description}</p>
                                <div className="flex items-center justify-between pt-6 border-t border-slate-800">
                                    <div className="flex items-center gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                        <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div> {rooms.find(r => r.id === m.room_id)?.name || 'N/A'}</span>
                                        <span className="flex items-center gap-1.5 bg-slate-800/50 px-2 py-1 rounded-lg">CAL {new Date(m.created_at || '').toLocaleDateString('pt-BR')}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center bento-card">
                            <div className="w-16 h-16 bg-slate-800/50 rounded-3xl mx-auto flex items-center justify-center text-slate-600 mb-6">
                                <Wrench size={32} />
                            </div>
                            <p className="text-slate-500 font-black uppercase tracking-widest">Nenhuma solicitação encontrada</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* OPEN */}
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center justify-between px-4">
                            <h3 className="font-black text-white flex items-center gap-3 uppercase tracking-tighter text-xl">
                                <div className="w-3 h-3 rounded-full bg-rose-600 shadow-[0_0_10px_rgba(225,29,72,0.5)]"></div> Pendentes
                            </h3>
                            <span className="text-slate-500 font-black text-sm bg-slate-900 border border-slate-800 w-8 h-8 rounded-xl flex items-center justify-center">
                                {visibleMaintenance.filter(m => m.status === MaintenanceStatus.OPEN).length}
                            </span>
                        </div>
                        <div className="space-y-4">
                            {visibleMaintenance.filter(m => m.status === MaintenanceStatus.OPEN).map(m => (
                                <MaintenanceCard key={m.id} m={m} rooms={rooms} residents={residents} isAdmin={isAdmin} onStatusChange={(s: MaintenanceStatus) => handleStatusChange(m.id, s)} disabled={isProcessing} />
                            ))}
                        </div>
                    </div>

                    {/* IN_PROGRESS */}
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center justify-between px-4">
                            <h3 className="font-black text-white flex items-center gap-3 uppercase tracking-tighter text-xl">
                                <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div> Em Execução
                            </h3>
                            <span className="text-slate-500 font-black text-sm bg-slate-900 border border-slate-800 w-8 h-8 rounded-xl flex items-center justify-center">
                                {visibleMaintenance.filter(m => m.status === MaintenanceStatus.IN_PROGRESS).length}
                            </span>
                        </div>
                        <div className="space-y-4">
                            {visibleMaintenance.filter(m => m.status === MaintenanceStatus.IN_PROGRESS).map(m => (
                                <MaintenanceCard key={m.id} m={m} rooms={rooms} residents={residents} isAdmin={isAdmin} onStatusChange={(s: MaintenanceStatus) => handleStatusChange(m.id, s)} disabled={isProcessing} />
                            ))}
                        </div>
                    </div>

                    {/* RESOLVED */}
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center justify-between px-4">
                            <h3 className="font-black text-white flex items-center gap-3 uppercase tracking-tighter text-xl">
                                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div> Finalizadas
                            </h3>
                            <span className="text-slate-500 font-black text-sm bg-slate-900 border border-slate-800 w-8 h-8 rounded-xl flex items-center justify-center">
                                {visibleMaintenance.filter(m => m.status === MaintenanceStatus.RESOLVED).length}
                            </span>
                        </div>
                        <div className="space-y-4">
                            {visibleMaintenance.filter(m => m.status === MaintenanceStatus.RESOLVED).map(m => (
                                <MaintenanceCard key={m.id} m={m} rooms={rooms} residents={residents} isAdmin={isAdmin} onStatusChange={(s: MaintenanceStatus) => handleStatusChange(m.id, s)} disabled={isProcessing} disabledActions />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function MaintenanceCard({ m, rooms, residents, isAdmin, onStatusChange, disabled, disabledActions = false }: any) {
    const room = rooms.find((r: Room) => r.id === m.room_id);
    const resident = residents.find((r: Resident) => r.id === m.requested_by);

    return (
        <div className="bento-card !p-5 group hover:!border-rose-500/50">
            <div className="flex justify-between items-start mb-4">
                <h4 className="font-black text-slate-100 text-sm uppercase tracking-tight group-hover:text-rose-500 transition-colors leading-tight">{m.title}</h4>
            </div>
            <p className="text-xs text-slate-500 mb-6 line-clamp-2 leading-relaxed">{m.description}</p>

            <div className="grid grid-cols-2 gap-2 mb-6">
                <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 text-[9px] font-black uppercase tracking-widest text-slate-500 flex flex-col">
                    <span className="text-slate-700 mb-1">Local</span>
                    <span className="text-slate-300 truncate">{room?.name || 'Área Comum'}</span>
                </div>
                <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 text-[9px] font-black uppercase tracking-widest text-slate-500 flex flex-col">
                    <span className="text-slate-700 mb-1">Autor</span>
                    <span className="text-slate-300 truncate">{resident?.name || '?'}</span>
                </div>
            </div>

            {isAdmin && !disabledActions && (
                <div className="flex gap-2 pt-2">
                    {m.status !== MaintenanceStatus.IN_PROGRESS && (
                        <button
                            onClick={() => onStatusChange(MaintenanceStatus.IN_PROGRESS)}
                            disabled={disabled}
                            className="flex-1 py-3 rounded-xl bg-amber-500/10 text-amber-500 font-black text-[10px] uppercase tracking-widest hover:bg-amber-500 hover:text-white transition-all flex items-center justify-center gap-2 border border-amber-500/20"
                        >
                            <Clock size={14} /> Iniciar
                        </button>
                    )}
                    {m.status !== MaintenanceStatus.RESOLVED && (
                        <button
                            onClick={() => onStatusChange(MaintenanceStatus.RESOLVED)}
                            disabled={disabled}
                            className="flex-1 py-3 rounded-xl bg-emerald-500/10 text-emerald-500 font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center gap-2 border border-emerald-500/20"
                        >
                            <CheckCircle2 size={14} /> Concluir
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
