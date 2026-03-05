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
        // Moradores veem manutenções do próprio quarto
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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">{isAdmin ? "Manutenções e Reparos" : "Meus Reparos"}</h2>
                    <p className="text-slate-500 text-sm">
                        {isAdmin ? "Kanban / Lista de solicitações de reparo" : "Acompanhe o status das suas solicitações de reparo"}
                    </p>
                </div>
                {!isAdmin && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium hover:bg-indigo-700 transition-colors"
                    >
                        Nova Solicitação
                    </button>
                )}
            </div>

            {/* Modal de Solicitação (Residente) */}
            {showModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">Solicitar Reparo</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">
                                <span className="text-xl">&times;</span>
                            </button>
                        </div>
                        <form onSubmit={handleCreateRequest} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Assunto</label>
                                <input
                                    type="text"
                                    required
                                    value={newRequest.title}
                                    onChange={e => setNewRequest({ ...newRequest, title: e.target.value })}
                                    placeholder="Ex: Lâmpada queimada, vazamento..."
                                    className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500/20"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Descrição</label>
                                <textarea
                                    required
                                    rows={4}
                                    value={newRequest.description}
                                    onChange={e => setNewRequest({ ...newRequest, description: e.target.value })}
                                    placeholder="Descreva o problema em detalhes..."
                                    className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500/20 resize-none"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isProcessing}
                                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                            >
                                {isProcessing ? 'Enviando...' : 'Enviar Solicitação'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {!isAdmin ? (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="divide-y divide-slate-100">
                        {visibleMaintenance.length > 0 ? (
                            visibleMaintenance.map(m => (
                                <div key={m.id} className="p-6 hover:bg-slate-50 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-slate-900">{m.title}</h4>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${m.status === MaintenanceStatus.OPEN ? 'bg-rose-100 text-rose-700' :
                                            m.status === MaintenanceStatus.IN_PROGRESS ? 'bg-amber-100 text-amber-700' :
                                                'bg-emerald-100 text-emerald-700'
                                            }`}>
                                            {m.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 mb-4">{m.description}</p>
                                    <div className="flex items-center gap-4 text-xs text-slate-400">
                                        <span>📍 {rooms.find(r => r.id === m.room_id)?.name || 'N/A'}</span>
                                        <span>📅 {new Date(m.created_at || '').toLocaleDateString('pt-BR')}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-12 text-center text-slate-500 italic">
                                Nenhuma solicitação de reparo encontrada.
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* OPEN */}
                    <div className="bg-slate-50 rounded-2xl p-4 min-h-[500px] border border-slate-100">
                        <div className="flex items-center justify-between mb-4 px-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-rose-500"></div> Abertas
                            </h3>
                            <span className="text-slate-400 font-bold text-sm bg-slate-200 px-2 rounded-lg">
                                {visibleMaintenance.filter(m => m.status === MaintenanceStatus.OPEN).length}
                            </span>
                        </div>
                        <div className="space-y-4">
                            {visibleMaintenance.filter(m => m.status === MaintenanceStatus.OPEN).map(m => (
                                <MaintenanceCard key={m.id} m={m} rooms={rooms} residents={residents} isAdmin={isAdmin} onStatusChange={(s) => handleStatusChange(m.id, s)} disabled={isProcessing} />
                            ))}
                        </div>
                    </div>

                    {/* IN_PROGRESS */}
                    <div className="bg-slate-50 rounded-2xl p-4 min-h-[500px] border border-slate-100">
                        <div className="flex items-center justify-between mb-4 px-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-amber-500"></div> Em Andamento
                            </h3>
                            <span className="text-slate-400 font-bold text-sm bg-slate-200 px-2 rounded-lg">
                                {visibleMaintenance.filter(m => m.status === MaintenanceStatus.IN_PROGRESS).length}
                            </span>
                        </div>
                        <div className="space-y-4">
                            {visibleMaintenance.filter(m => m.status === MaintenanceStatus.IN_PROGRESS).map(m => (
                                <MaintenanceCard key={m.id} m={m} rooms={rooms} residents={residents} isAdmin={isAdmin} onStatusChange={(s) => handleStatusChange(m.id, s)} disabled={isProcessing} />
                            ))}
                        </div>
                    </div>

                    {/* RESOLVED */}
                    <div className="bg-slate-50 rounded-2xl p-4 min-h-[500px] border border-slate-100">
                        <div className="flex items-center justify-between mb-4 px-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Resolvidas
                            </h3>
                            <span className="text-slate-400 font-bold text-sm bg-slate-200 px-2 rounded-lg">
                                {visibleMaintenance.filter(m => m.status === MaintenanceStatus.RESOLVED).length}
                            </span>
                        </div>
                        <div className="space-y-4">
                            {visibleMaintenance.filter(m => m.status === MaintenanceStatus.RESOLVED).map(m => (
                                <MaintenanceCard key={m.id} m={m} rooms={rooms} residents={residents} isAdmin={isAdmin} onStatusChange={(s) => handleStatusChange(m.id, s)} disabled={isProcessing} disabledActions />
                            ))}
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
}

function MaintenanceCard({ m, rooms, residents, isAdmin, onStatusChange, disabled, disabledActions = false }: any) {
    const room = rooms.find(r => r.id === m.room_id);
    const resident = residents.find(r => r.id === m.requested_by);

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-slate-900 text-sm">{m.title}</h4>
            </div>
            <p className="text-xs text-slate-600 mb-4">{m.description}</p>

            <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                <span>📍 {room?.name || 'Cômodo indefinido'}</span>
                <span>👤 {resident?.name.split(' ')[0] || '?'}</span>
            </div>

            {isAdmin && !disabledActions && (
                <div className="flex gap-2 border-t border-slate-100 pt-3">
                    {m.status !== MaintenanceStatus.IN_PROGRESS && (
                        <button
                            onClick={() => onStatusChange(MaintenanceStatus.IN_PROGRESS)}
                            disabled={disabled}
                            className="flex-1 text-center py-1.5 rounded-lg bg-amber-50 text-amber-700 font-bold text-xs hover:bg-amber-100 transition-colors flex items-center justify-center gap-1"
                        >
                            <Clock size={14} /> Andamento
                        </button>
                    )}
                    {m.status !== MaintenanceStatus.RESOLVED && (
                        <button
                            onClick={() => onStatusChange(MaintenanceStatus.RESOLVED)}
                            disabled={disabled}
                            className="flex-1 text-center py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1"
                        >
                            <CheckCircle2 size={14} /> Resolvido
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
