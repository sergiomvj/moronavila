import React from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, Plus, X } from 'lucide-react';
import { CalendarEvent } from '../types';

interface CalendarViewProps {
    events: CalendarEvent[];
    isAdmin: boolean;
    onRefresh: () => void;
    initialModal?: 'add-event' | null;
}

export function CalendarView({ events, isAdmin, onRefresh, initialModal }: CalendarViewProps) {
    const [showAddModal, setShowAddModal] = React.useState(false);

    React.useEffect(() => {
        if (initialModal === 'add-event') {
            setShowAddModal(true);
        }
    }, [initialModal]);
    const [newTitle, setNewTitle] = React.useState('');
    const [newDesc, setNewDesc] = React.useState('');
    const [newDate, setNewDate] = React.useState('');
    const [newLocation, setNewLocation] = React.useState('');
    const [newType, setNewType] = React.useState<'Limpeza' | 'Reunião' | 'Festa' | 'Manutenção' | 'Outro'>('Outro');
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const { createCalendarEvent } = await import('../lib/database');
            await createCalendarEvent({
                title: newTitle,
                description: newDesc,
                date: newDate,
                location: newLocation,
                type: newType
            });
            setShowAddModal(false);
            setNewTitle(''); setNewDesc(''); setNewDate(''); setNewLocation('');
            onRefresh();
        } catch (err) {
            alert('Erro ao criar evento.');
        } finally {
            setIsSubmitting(false);
        }
    };
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Calendário</h2>
                    <p className="text-slate-500 text-sm">Eventos e agendamentos comunitários</p>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium hover:bg-indigo-700 transition-colors"
                    >
                        <Plus size={18} /> Novo Evento
                    </button>
                )}
            </div>

            {/* Add Event Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-lg">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">Novo Evento</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCreateEvent} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Título do Evento</label>
                                <input type="text" required value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Descrição</label>
                                <textarea required value={newDesc} onChange={e => setNewDesc(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 h-24" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Data e Hora</label>
                                    <input type="datetime-local" required value={newDate} onChange={e => setNewDate(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Local</label>
                                    <input type="text" value={newLocation} onChange={e => setNewLocation(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Tipo</label>
                                <select value={newType} onChange={e => setNewType(e.target.value as any)} className="w-full border border-slate-200 rounded-xl p-3 bg-white">
                                    <option value="Manutenção">Manutenção</option>
                                    <option value="Limpeza">Limpeza</option>
                                    <option value="Reunião">Reunião</option>
                                    <option value="Festa">Festa</option>
                                    <option value="Outro">Outro</option>
                                </select>
                            </div>
                            <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors">
                                {isSubmitting ? 'Salvando...' : 'Criar Evento'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-slate-900 text-lg">Março 2026</h3>
                        <div className="flex gap-2">
                            <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400">&lt;</button>
                            <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400">&gt;</button>
                        </div>
                    </div>
                    <div className="grid grid-cols-7 gap-px bg-slate-100 rounded-xl overflow-hidden border border-slate-100">
                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                            <div key={day} className="bg-slate-50 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {day}
                            </div>
                        ))}
                        {Array.from({ length: 31 }).map((_, i) => {
                            const day = i + 1;
                            const hasEvent = events.some(e => new Date(e.date).getDate() === day);
                            return (
                                <div key={i} className="bg-white min-h-[80px] p-2 hover:bg-slate-50 transition-colors group relative">
                                    <span className={`text-xs font-bold ${hasEvent ? 'text-indigo-600' : 'text-slate-400'}`}>
                                        {day}
                                    </span>
                                    {hasEvent && (
                                        <div className="mt-1 space-y-1">
                                            {events.filter(e => new Date(e.date).getDate() === day).map(e => (
                                                <div key={e.id} className="text-[9px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100 truncate font-semibold" title={e.title}>
                                                    {e.title}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="font-bold text-slate-900">Próximos Eventos</h3>
                    {events.map(event => (
                        <div key={event.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:border-indigo-300 transition-colors">
                            <div className="flex items-start gap-4">
                                <div className="bg-indigo-50 p-3 rounded-xl min-w-[60px] text-center">
                                    <span className="block text-indigo-600 text-xs font-bold uppercase">{new Date(event.date).toLocaleDateString('pt-BR', { month: 'short' })}</span>
                                    <span className="block text-indigo-700 text-xl font-black">{new Date(event.date).getDate()}</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-sm mb-1">{event.title}</h4>
                                    <p className="text-xs text-slate-500 mb-2 line-clamp-2">{event.description}</p>

                                    <div className="flex flex-wrap items-center gap-3 text-[10px] font-medium text-slate-400">
                                        <div className="flex items-center gap-1">
                                            <Clock size={12} />
                                            {new Date(event.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        {event.location && (
                                            <div className="flex items-center gap-1">
                                                <MapPin size={12} />
                                                {event.location}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {events.length === 0 && (
                        <div className="text-center py-12 bg-white rounded-xl border border-slate-100 border-dashed">
                            <CalendarIcon size={32} className="mx-auto text-slate-300 mb-2" />
                            <p className="text-slate-500 text-sm">Não há eventos próximos.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
