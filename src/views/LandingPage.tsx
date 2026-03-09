import React, { useEffect, useState } from 'react';
import { Home, MapPin, Sparkles, Shield, ChevronRight, Play, ArrowRight } from 'lucide-react';
import { fetchPublicPropertyDescription, fetchPublicRooms } from '../lib/database';
import { PropertyDescription, Room } from '../types';

export function LandingPage({ onLoginClick }: { onLoginClick: () => void }) {
    const [propertyDesc, setPropertyDesc] = useState<PropertyDescription | null>(null);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadPublicData = async () => {
            try {
                const desc = await fetchPublicPropertyDescription();
                const publicRooms = await fetchPublicRooms();
                setPropertyDesc(desc);
                // Exibe apenas quartos que possuem mídias marcadas como marketing
                setRooms(publicRooms.filter(r => r.media && r.media.length > 0));
            } catch (error) {
                console.error('Failed to load public data:', error);
            } finally {
                setLoading(false);
            }
        };
        loadPublicData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (!propertyDesc) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
                <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-2">
                    Morona<span className="text-rose-600">Vila</span>
                </h1>
                <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Aguardando configuração de página...</p>
                <button
                    onClick={onLoginClick}
                    className="mt-8 px-8 py-4 bg-rose-600 text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-[20px] hover:bg-rose-700 hover:scale-105 transition-all shadow-xl shadow-rose-900/30"
                >
                    Acessar o Painel
                </button>
            </div>
        );
    }

    const {
        main_text, main_media, rooms_text,
        location_text, location_media,
        amenities_text, rules_text
    } = propertyDesc;

    const heroMedia = main_media?.[0] || 'https://images.pexels.com/photos/5935228/pexels-photo-5935228.jpeg';

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-rose-500/30">
            {/* Topbar */}
            <header className="fixed top-0 inset-x-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-rose-500 to-rose-700 p-2.5 rounded-xl text-white shadow-lg shadow-rose-900/20">
                            <Home size={24} />
                        </div>
                        <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic">Morona<span className="text-rose-600">Vila</span></h1>
                    </div>
                    <button
                        onClick={onLoginClick}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white font-black text-[10px] uppercase tracking-widest transition-all border border-white/10 hover:border-white/20"
                    >
                        <span className="hidden sm:inline">Área do Morador</span>
                        <ChevronRight size={14} className="sm:hidden" />
                    </button>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img src={heroMedia} alt="Propriedade" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-6 w-full mt-10">
                    <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tighter uppercase italic mb-8 drop-shadow-2xl">
                            {main_text || "Descubra o conforto de morar bem!"}
                        </h2>
                        <a href="#rooms" className="inline-flex items-center gap-3 bg-rose-600 hover:bg-rose-700 text-white px-8 py-5 rounded-full font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-rose-900/40 hover:scale-105 active:scale-95">
                            Conhecer as Vagas <ArrowRight size={18} />
                        </a>
                    </div>
                </div>
            </section>

            {/* Rooms Section */}
            {rooms.length > 0 && (
                <section id="rooms" className="py-32 relative">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="mb-16 max-w-3xl">
                            <h3 className="text-sm font-black text-rose-500 uppercase tracking-[0.3em] mb-4">Acomodações</h3>
                            <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tighter uppercase italic mb-6">Seu novo espaço</h2>
                            {rooms_text && (
                                <p className="text-slate-400 text-lg leading-relaxed">{rooms_text}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {rooms.map(room => (
                                <div key={room.id} className="group bg-slate-900/40 border border-slate-800 rounded-[32px] overflow-hidden hover:border-rose-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-rose-900/20">
                                    <div className="relative aspect-[4/3] overflow-hidden">
                                        {room.media[0] ? (
                                            room.media[0].type === 'video' ? (
                                                <div className="w-full h-full bg-slate-900 flex items-center justify-center relative">
                                                    <video src={room.media[0].url} className="w-full h-full object-cover opacity-70" autoPlay loop muted playsInline />
                                                    <Play size={48} className="text-white/30 absolute" />
                                                </div>
                                            ) : (
                                                <img src={room.media[0].url} alt={room.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                            )
                                        ) : (
                                            <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                                                <Home className="text-slate-600" size={48} />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                                        <div className="absolute top-4 right-4 bg-slate-950/80 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                                            <span className="text-white font-black text-lg">R$ {room.rent_value}</span>
                                            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-widest ml-1">/mês</span>
                                        </div>
                                    </div>
                                    <div className="p-8">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="text-2xl font-black text-white uppercase tracking-tight">{room.name}</h4>
                                        </div>
                                        <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest mb-6">{room.type}</p>
                                        <button
                                            onClick={() => window.open(`https://wa.me/?text=Olá! Tenho interesse na vaga do ${room.name}.`, '_blank')}
                                            className="w-full py-4 rounded-2xl bg-white/5 hover:bg-rose-600 border border-white/10 hover:border-rose-500 text-white font-black text-[11px] uppercase tracking-widest transition-all"
                                        >
                                            Tenho Interesse
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Location & Amenities */}
            <section className="py-32 bg-slate-900/20 border-y border-white/5 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl h-full max-h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
                    <div className="order-2 lg:order-1 relative aspect-square md:aspect-video lg:aspect-square rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl">
                        <img
                            src={location_media?.[0] || 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg'}
                            alt="Localização"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/80 via-transparent to-rose-900/20" />
                    </div>

                    <div className="order-1 lg:order-2 space-y-16">
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400">
                                    <MapPin size={24} />
                                </div>
                                <h3 className="text-3xl font-black text-white tracking-tighter uppercase italic">Onde Estamos</h3>
                            </div>
                            <p className="text-slate-300 text-lg leading-relaxed">{location_text || "Excelente localização com mobilidade impecável."}</p>
                        </div>

                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400">
                                    <Sparkles size={24} />
                                </div>
                                <h3 className="text-3xl font-black text-white tracking-tighter uppercase italic">Comodidades</h3>
                            </div>
                            <p className="text-slate-300 text-lg leading-relaxed">{amenities_text || "Tudo que você precisa a poucos passos de casa."}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Rules */}
            <section className="py-32">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <div className="inline-flex items-center justify-center p-5 rounded-[2rem] bg-gradient-to-br from-amber-500/20 to-amber-700/10 text-amber-500 shadow-xl border border-amber-500/20 mb-8">
                        <Shield size={40} />
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic mb-8">Nossa Filosofia</h2>
                    <p className="text-slate-300 text-lg leading-relaxed whitespace-pre-line text-left md:text-center p-8 md:p-12 bg-slate-900/40 backdrop-blur-sm shadow-xl rounded-[2.5rem] border border-slate-800">
                        {rules_text || "Valorizamos o respeito, o silêncio após as 22h e a colaboração para manter o ambiente sempre agradável para todos."}
                    </p>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-950 border-t border-white/5 py-12">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 opacity-60 hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-2">
                        <Home size={20} className="text-rose-600" />
                        <span className="font-black text-white uppercase italic tracking-tighter">Morona<span className="text-rose-600">Vila</span></span>
                    </div>
                    <p className="text-slate-600 font-bold text-[10px] uppercase tracking-widest">
                        © {new Date().getFullYear()} MoronaVila. Todos os direitos reservados.
                    </p>
                </div>
            </footer>
        </div>
    );
}
