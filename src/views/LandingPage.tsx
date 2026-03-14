import React, { useEffect, useState } from 'react';
import { Home, MapPin, Sparkles, Shield, ChevronRight, Play, ArrowRight, MessageCircle, Send } from 'lucide-react';
import { fetchPublicPropertyDescription, fetchPublicRooms } from '../lib/database';
import { getLocalApiBase } from '../lib/localApi';
import { PropertyDescription, Room } from '../types';

export function LandingPage({ onLoginClick }: { onLoginClick: () => void }) {
    const [propertyDesc, setPropertyDesc] = useState<PropertyDescription | null>(null);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [leadForm, setLeadForm] = useState({ name: '', phone: '', email: '' });
    const [leadSubmitted, setLeadSubmitted] = useState(false);

    // Chat state - Moved to top to follow Rules of Hooks
    const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => {
        const loadPublicData = async () => {
            try {
                const desc = await fetchPublicPropertyDescription();
                const publicRooms = await fetchPublicRooms();
                setPropertyDesc(desc);
                // Exibe todos os quartos para evitar que quartos recém-cadastrados sumam
                // Se houver mídias marketing, elas serão prioridade no componente
                setRooms(publicRooms);
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
                    MORONA<span className="text-rose-600">VILA</span>
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

    // Lógica dinâmica para Título e Subtítulo baseada no main_text
    // Primeira linha = Título, demais linhas = Subtítulo
    const textLines = main_text ? main_text.split('\n').filter(line => line.trim() !== '') : [];
    const heroTitle = textLines[0] || "Para morar, viver e estudar próximo das principais universidades e do trabalho";
    const heroSubtitle = textLines.slice(1).join('\n') || null;

    const handleLeadSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLeadSubmitted(true);

        // Início automático do chat
        const welcomeMessage = `Olá ${leadForm.name}! Sou o Agente Virtual da MoronaVila. Como posso te ajudar hoje? Além de tirar dúvidas comigo, você pode clicar no botão verde abaixo para falar direto com um consultor no nosso WhatsApp e agendar sua visita!`;
        setChatMessages([{ role: 'assistant', content: welcomeMessage }]);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentMessage.trim()) return;

        const newUserMessage = { role: 'user' as const, content: currentMessage };
        setChatMessages(prev => [...prev, newUserMessage]);
        setCurrentMessage('');
        setIsTyping(true);

        try {
            const response = await fetch(`${getLocalApiBase()}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: currentMessage,
                    name: leadForm.name,
                    phone: leadForm.phone,
                    history: chatMessages
                })
            });

            const data = await response.json();
            if (data.response) {
                setChatMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
            } else {
                setChatMessages(prev => [...prev, { role: 'assistant', content: 'Desculpe, tive um probleminha para processar sua mensagem. Pode repetir?' }]);
            }
        } catch (error) {
            console.error('Chat error:', error);
            setChatMessages(prev => [...prev, { role: 'assistant', content: 'Estou com dificuldades de conexão agora. Que tal nos chamar no WhatsApp?' }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-rose-500/30">
            {/* Topbar */}
            <header className="fixed top-0 inset-x-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Home size={28} className="text-rose-600 drop-shadow-lg" />
                        <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic">MORONA<span className="text-rose-600">VILA</span></h1>
                    </div>

                    <nav className="hidden lg:flex items-center gap-8">
                        <a href="#a-casa" className="text-sm font-bold text-slate-300 hover:text-white uppercase tracking-wider transition-colors">A Casa</a>
                        <a href="#onde-estamos" className="text-sm font-bold text-slate-300 hover:text-white uppercase tracking-wider transition-colors">Onde Estamos</a>
                        <a href="#amenidades" className="text-sm font-bold text-slate-300 hover:text-white uppercase tracking-wider transition-colors">Amenidades</a>
                        <a href="#contato" className="text-sm font-bold text-rose-500 hover:text-rose-400 uppercase tracking-wider transition-colors">Quero saber mais</a>
                    </nav>

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
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight uppercase italic mb-6 drop-shadow-xl">
                            {heroTitle}
                        </h2>
                        {heroSubtitle && (
                            <p className="text-base md:text-lg text-slate-300 leading-relaxed mb-10 drop-shadow-md max-w-2xl">
                                {heroSubtitle}
                            </p>
                        )}
                        <a href="#quartos" className="inline-flex items-center gap-3 bg-rose-600 hover:bg-rose-700 text-white px-8 py-5 rounded-full font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-rose-900/40 hover:scale-105 active:scale-95">
                            Conhecer as Vagas <ArrowRight size={18} />
                        </a>
                    </div>
                </div>
            </section>

            {/* A Casa */}
            <section id="a-casa" className="py-32 relative">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
                    <div className="order-2 lg:order-1 space-y-8">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-500">
                                <Home size={24} />
                            </div>
                            <h3 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic drop-shadow-lg">A Casa</h3>
                        </div>
                        <p className="text-slate-300 text-lg md:text-xl leading-relaxed whitespace-pre-line font-medium">{rooms_text}</p>
                    </div>
                    <div className="order-1 lg:order-2 relative aspect-[4/3] rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl">
                        <img
                            src="https://images.unsplash.com/photo-1556228308-f6e92d757b1c?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                            alt="A Casa"
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000"
                        />
                        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/80 via-transparent to-transparent pointer-events-none" />
                    </div>
                </div>
            </section>

            {/* Onde Estamos */}
            <section id="onde-estamos" className="py-32 bg-slate-900/20 border-y border-white/5 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl h-full max-h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center relative z-10">
                    <div className="order-1 relative aspect-[4/3] rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl">
                        <img
                            src="https://ogimg.infoglobo.com.br/in/24235475-bd5-3f6/FT1086A/thumbnail_IMG_8718.jpg"
                            alt="Localização"
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000"
                        />
                        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/80 via-transparent to-indigo-900/20 pointer-events-none" />
                    </div>

                    <div className="order-2 space-y-8">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400">
                                <MapPin size={24} />
                            </div>
                            <h3 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic drop-shadow-lg">Onde Estamos</h3>
                        </div>
                        <p className="text-slate-300 text-lg md:text-xl leading-relaxed whitespace-pre-line font-medium">{location_text}</p>
                    </div>
                </div>
            </section>

            {/* Amenidades */}
            <section id="amenidades" className="py-32 relative">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
                    <div className="order-2 lg:order-1 space-y-8">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400">
                                <Sparkles size={24} />
                            </div>
                            <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tighter uppercase italic mb-6">Conforto & Facilidade</h2>
                        </div>
                        <p className="text-slate-400 text-sm md:text-base leading-relaxed whitespace-pre-line">{amenities_text}</p>
                    </div>
                    <div className="order-1 lg:order-2 relative aspect-[4/3] rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl">
                        <img
                            src="https://auroracultural.com/wp-content/uploads/2026/03/A97A8175-scaled.webp"
                            alt="Amenidades"
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000"
                        />
                        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/80 via-transparent to-emerald-900/20 pointer-events-none" />
                    </div>
                </div>
            </section>

            {/* Quartos e Acomodações Grid */}
            {rooms.length > 0 && (
                <section id="quartos" className="py-32 bg-slate-900/20 border-t border-white/5 relative">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="mb-16 max-w-3xl mx-auto text-center">
                            <h3 className="text-sm font-black text-rose-500 uppercase tracking-[0.3em] mb-4">Escolha a sua</h3>
                            <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tighter uppercase italic mb-6">Acomodação Ideal</h2>
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

            {/* Rules */}
            <section className="py-32">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <div className="inline-flex items-center justify-center p-5 rounded-[2rem] bg-gradient-to-br from-amber-500/20 to-amber-700/10 text-amber-500 shadow-xl border border-amber-500/20 mb-8">
                        <Shield size={40} />
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic mb-8">Nossa Filosofia</h2>
                    <p className="text-slate-300 text-lg leading-relaxed whitespace-pre-line text-left md:text-center p-8 md:p-12 bg-slate-900/40 backdrop-blur-sm shadow-xl rounded-[2.5rem] border border-slate-800">
                        {rules_text || "Valorizamos o respect, o silêncio após as 22h e a colaboração para manter o ambiente sempre agradável para todos."}
                    </p>
                </div>
            </section>

            {/* Quer saber mais? (Lead Capture / AI Agent) */}
            <section id="contato" className="py-32 bg-gradient-to-b from-slate-950 to-slate-900 border-t border-white/5 relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-rose-500/50 to-transparent" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-full max-h-96 bg-rose-600/10 rounded-full blur-[120px] pointer-events-none" />

                <div className="max-w-4xl mx-auto px-6 relative z-10">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-rose-500/10 text-rose-500 mb-6">
                            <MessageCircle size={32} />
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic mb-6">Quer saber mais?</h2>
                        <p className="text-xl text-slate-300 font-medium">Fale com nosso Agente Virtual! Ele é bem humorado, tira todas as suas dúvidas e até te mostra um tour de fotos inédito da casa.</p>
                    </div>

                    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
                        {!leadSubmitted ? (
                            <form onSubmit={handleLeadSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Como quer ser chamado?</label>
                                        <input
                                            required
                                            type="text"
                                            value={leadForm.name}
                                            onChange={e => setLeadForm({ ...leadForm, name: e.target.value })}
                                            placeholder="Seu nome"
                                            className="w-full bg-slate-950/50 border border-slate-800 rounded-full px-6 py-4 text-white focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Telefone (WhatsApp)</label>
                                        <input
                                            required
                                            type="tel"
                                            value={leadForm.phone}
                                            onChange={e => setLeadForm({ ...leadForm, phone: e.target.value })}
                                            placeholder="(21) 99999-9999"
                                            className="w-full bg-slate-950/50 border border-slate-800 rounded-full px-6 py-4 text-white focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Melhor E-mail</label>
                                    <input
                                        required
                                        type="email"
                                        value={leadForm.email}
                                        onChange={e => setLeadForm({ ...leadForm, email: e.target.value })}
                                        placeholder="seu@email.com"
                                        className="w-full bg-slate-950/50 border border-slate-800 rounded-full px-6 py-4 text-white focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 outline-none transition-all"
                                    />
                                </div>
                                <button type="submit" className="w-full flex items-center justify-center gap-3 bg-rose-600 hover:bg-rose-700 text-white px-8 py-5 rounded-full font-black text-sm uppercase tracking-[0.2em] transition-all shadow-xl shadow-rose-900/40 hover:scale-105 active:scale-95 mt-8">
                                    Chamar o Agente <Send size={18} />
                                </button>
                            </form>
                        ) : (
                            <div className="flex flex-col h-[600px] animate-in fade-in zoom-in duration-500">
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                    {chatMessages.map((msg, idx) => (
                                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] p-4 rounded-[2rem] text-sm font-medium leading-relaxed shadow-lg ${msg.role === 'user'
                                                ? 'bg-rose-600 text-white rounded-tr-none'
                                                : 'bg-slate-950/80 border border-slate-800 text-slate-200 rounded-tl-none'
                                                }`}>
                                                {msg.content}
                                            </div>
                                        </div>
                                    ))}
                                    {isTyping && (
                                        <div className="flex justify-start">
                                            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-[2rem] rounded-tl-none shadow-lg">
                                                <div className="flex gap-1">
                                                    <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                    <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                    <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 bg-slate-950/20 border-t border-white/5 flex justify-center">
                                    <a
                                        href={`https://wa.me/5521983245000?text=${encodeURIComponent(`Olá, meu nome é ${leadForm.name} e acabei de conhecer a MoronaVila! Gostaria de mais informações.`)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-widest transition-all shadow-lg hover:scale-105 active:scale-95"
                                    >
                                        <MessageCircle size={16} /> Falar no WhatsApp
                                    </a>
                                </div>
                                <form onSubmit={handleSendMessage} className="p-4 bg-slate-950/40 border-t border-white/5 flex gap-3">
                                    <input
                                        type="text"
                                        value={currentMessage}
                                        onChange={e => setCurrentMessage(e.target.value)}
                                        placeholder="Tire suas dúvidas aqui..."
                                        className="flex-1 bg-slate-950/50 border border-slate-800 rounded-full px-6 py-3 text-white focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 outline-none transition-all text-sm"
                                    />
                                    <button
                                        type="submit"
                                        disabled={isTyping}
                                        className="bg-rose-600 hover:bg-rose-700 text-white p-3 rounded-full transition-all disabled:opacity-50 disabled:scale-95"
                                    >
                                        <Send size={20} />
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-950 border-t border-white/5 py-12">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 opacity-60 hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-2">
                        <Home size={24} className="text-rose-600" />
                        <span className="font-black text-white uppercase italic tracking-tighter">MORONA<span className="text-rose-600">VILA</span></span>
                    </div>
                    <p className="text-slate-600 font-bold text-[10px] uppercase tracking-widest">
                        © {new Date().getFullYear()} MoronaVila. Todos os direitos reservados.
                    </p>
                </div>
            </footer>
        </div>
    );
}
