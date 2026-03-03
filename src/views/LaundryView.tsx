import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, Plus, Trash2, X } from 'lucide-react';
import { Resident, LaundrySchedule } from '../types';
import { createLaundrySchedule, deleteLaundrySchedule } from '../lib/database';

interface LaundryViewProps {
    schedules: LaundrySchedule[];
    residents: Resident[];
    currentUser: Resident;
    isAdmin: boolean;
    onRefresh: () => void;
}

export function LaundryView({ schedules, residents, currentUser, isAdmin, onRefresh }: LaundryViewProps) {
    const [showModal, setShowModal] = useState(false);
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [filterDate, setFilterDate] = useState<string>(new Date().toISOString().split('T')[0]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await createLaundrySchedule({
                resident_id: currentUser.id,
                date,
                start_time: startTime + ':00',
                end_time: endTime + ':00',
                status: 'Agendado'
            });
            setShowModal(false);
            setDate('');
            setStartTime('');
            setEndTime('');
            onRefresh();
        } catch (err: any) {
            alert('Erro ao agendar lavanderia: ' + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja cancelar este agendamento?')) return;
        try {
            await deleteLaundrySchedule(id);
            onRefresh();
        } catch (err) {
            alert('Erro ao cancelar agendamento.');
        }
    };

    const filteredSchedules = schedules.filter(s => s.date === filterDate);

    // Get resident name
    const getResidentName = (id: string) => {
        return residents.find(r => r.id === id)?.name || 'Desconhecido';
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">Lavanderia</h2>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                    <Plus size={18} /> Agendar Horário
                </button>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-xs">
                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>
                </div>

                {filteredSchedules.length > 0 ? (
                    <div className="space-y-4">
                        {filteredSchedules.map(schedule => {
                            const isOwner = schedule.resident_id === currentUser.id;
                            return (
                                <div key={schedule.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-indigo-200 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                            <Clock size={20} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">
                                                {schedule.start_time.substring(0, 5)} - {schedule.end_time.substring(0, 5)}
                                            </p>
                                            <p className="text-sm text-slate-500">Reservado por {getResidentName(schedule.resident_id)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold uppercase">{schedule.status}</span>
                                        {(isAdmin || isOwner) && (
                                            <button
                                                onClick={() => handleDelete(schedule.id)}
                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-slate-900">Nenhum agendamento</h3>
                        <p className="text-slate-500">Não há reservas de lavanderia para esta data.</p>
                    </div>
                )}
            </div>

            {/* Modal de Agendamento */}
            {showModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">Agendar Lavanderia</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Data</label>
                                <input
                                    type="date"
                                    required
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500/20"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Início</label>
                                    <input
                                        type="time"
                                        required
                                        value={startTime}
                                        onChange={e => setStartTime(e.target.value)}
                                        className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Término</label>
                                    <input
                                        type="time"
                                        required
                                        value={endTime}
                                        onChange={e => setEndTime(e.target.value)}
                                        className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
                            >
                                {isSubmitting ? 'Salvando...' : 'Confirmar Agendamento'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
