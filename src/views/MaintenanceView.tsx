import React, { useState } from 'react';
import { Wrench, CheckCircle2, Clock } from 'lucide-react';
import { MaintenanceRequest, Room, Resident, MaintenanceStatus } from '../types';
import { updateMaintenanceStatus } from '../lib/database';

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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Manutenções e Reparos</h2>
                    <p className="text-slate-500 text-sm">Kanban / Lista de solicitações de reparo {isAdmin ? '' : 'do seu quarto'}</p>
                </div>
            </div>

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
