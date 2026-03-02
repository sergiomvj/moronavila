import React from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, Plus } from 'lucide-react';
import { CalendarEvent } from '../types';

interface CalendarViewProps {
    events: CalendarEvent[];
    isAdmin: boolean;
}

export function CalendarView({ events, isAdmin }: CalendarViewProps) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Calendário</h2>
                    <p className="text-slate-500 text-sm">Eventos e agendamentos comunitários</p>
                </div>
                <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium hover:bg-indigo-700 transition-colors">
                    <Plus size={18} /> Novo Evento
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="text-center py-20 text-slate-400">
                        [Componente de Calendário / FullCalendar aqui]
                        <br />
                        <span className="text-sm">Os eventos abaixo apareceriam aqui.</span>
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
