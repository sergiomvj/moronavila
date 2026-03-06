import React, { useState } from 'react';
import {
    Save, Image as ImageIcon, Video, MapPin,
    Home, Info, CheckCircle2, ChevronRight,
    Plus, X, Layout, Sparkles, Shield, Play, Trash2
} from 'lucide-react';
import { PropertyDescription, Room } from '../types';
import { updatePropertyDescription, toggleRoomMediaMarketing } from '../lib/database';

interface PropertyDescriptionViewProps {
    data: PropertyDescription;
    onUpdate: () => void;
    rooms: Room[];
}

export function PropertyDescView({ data, onUpdate, rooms }: PropertyDescriptionViewProps) {
    const [formData, setFormData] = useState<PropertyDescription>(data);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'general' | 'rooms' | 'location' | 'amenities' | 'rules'>('general');

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updatePropertyDescription(formData);
            alert('Descrição da propriedade atualizada com sucesso!');
            onUpdate();
        } catch (error) {
            console.error(error);
            alert('Erro ao atualizar descrição.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddField = (field: keyof PropertyDescription, value: string) => {
        const current = formData[field] as string[];
        setFormData({ ...formData, [field]: [...current, value] });
    };

    const handleRemoveField = (field: keyof PropertyDescription, index: number) => {
        const current = formData[field] as string[];
        const updated = current.filter((_, i) => i !== index);
        setFormData({ ...formData, [field]: updated });
    };

    const handleToggleRoomMediaMarketing = async (mediaId: string, isMarketing: boolean) => {
        try {
            await toggleRoomMediaMarketing(mediaId, isMarketing);
            onUpdate();
        } catch (error) {
            console.error('Erro ao atualizar marketing:', error);
            alert('Erro ao atualizar marketing.');
        }
    };

    const MediaList = ({ title, field, placeholder }: { title: string, field: keyof PropertyDescription, placeholder: string }) => (
        <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{title}</label>
            <div className="flex gap-2">
                <input
                    type="text"
                    id={`new-${field}`}
                    placeholder={placeholder}
                    className="flex-1 bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-slate-200 text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 transition-all"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            const input = e.currentTarget;
                            if (input.value) {
                                handleAddField(field, input.value);
                                input.value = '';
                            }
                        }
                    }}
                />
                <button
                    onClick={() => {
                        const input = document.getElementById(`new-${field}`) as HTMLInputElement;
                        if (input.value) {
                            handleAddField(field, input.value);
                            input.value = '';
                        }
                    }}
                    className="p-4 bg-slate-800 hover:bg-slate-700 rounded-2xl text-slate-300 transition-all shadow-lg"
                >
                    <Plus size={20} />
                </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {(formData[field] as string[]).map((url, i) => (
                    <div key={i} className="relative group rounded-xl overflow-hidden aspect-video border border-slate-800 bg-slate-950/50 transition-all hover:border-rose-500/30">
                        <img
                            src={url}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/300x200?text=Mídia')}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <button
                            onClick={() => handleRemoveField(field, i)}
                            className="absolute top-2 right-2 p-2 bg-rose-600 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-700 shadow-xl"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-gradient-to-br from-rose-500 to-rose-700 rounded-2xl shadow-lg shadow-rose-900/20">
                            <Layout className="text-white" size={24} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-white tracking-tight">Descrição da Propriedade</h2>
                            <p className="text-slate-400 text-sm font-medium mt-1">
                                Configure todo o conteúdo visual e textual para marketing e Landing Page.
                            </p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white px-10 py-5 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-rose-900/40 group active:scale-95"
                >
                    {isSaving ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Save size={18} className="group-hover:rotate-12 transition-transform" />
                    )}
                    {isSaving ? 'Salvando...' : 'Publicar Alterações'}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-2 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-[30px] w-fit overflow-x-auto no-scrollbar shadow-2xl">
                {[
                    { id: 'general', label: 'Geral', icon: Info },
                    { id: 'rooms', label: 'Cômodos', icon: Home },
                    { id: 'location', label: 'Localização', icon: MapPin },
                    { id: 'amenities', label: 'Comodidades', icon: Sparkles },
                    { id: 'rules', label: 'Conduta', icon: Shield },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2.5 px-8 py-3.5 rounded-[22px] font-black text-[11px] uppercase tracking-[0.15em] transition-all whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-rose-600 text-white shadow-xl shadow-rose-900/60 scale-105 z-10'
                                : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800'
                            }`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3 space-y-8">
                    {/* Aba Geral */}
                    {activeTab === 'general' && (
                        <div className="bg-slate-900/40 border border-slate-800/60 rounded-[40px] p-10 space-y-10 shadow-inner">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">Texto de Boas-vindas (Hero Section)</label>
                                <textarea
                                    value={formData.main_text}
                                    onChange={(e) => setFormData({ ...formData, main_text: e.target.value })}
                                    placeholder="Ex: Descubra o conforto de morar bem em Joinville..."
                                    className="w-full bg-slate-950/50 border border-slate-800 rounded-[24px] p-6 text-slate-200 text-base leading-relaxed focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500/50 transition-all min-h-[180px]"
                                />
                            </div>

                            <MediaList
                                title="Mídias Principais (Hero & Destaque)"
                                field="main_media"
                                placeholder="URL de imagem ou vídeo de destaque"
                            />

                            <div className="h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />

                            <MediaList
                                title="Galeria Geral de Fotos e Vídeos"
                                field="gallery_media"
                                placeholder="URL de foto para a galeria do site"
                            />
                        </div>
                    )}

                    {/* Aba Cômodos */}
                    {activeTab === 'rooms' && (
                        <div className="space-y-8">
                            <div className="bg-slate-900/40 border border-slate-800/60 rounded-[40px] p-10 space-y-6">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Introdução sobre os Cômodos e Mobília</label>
                                <textarea
                                    value={formData.rooms_text}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, rooms_text: e.target.value })}
                                    placeholder="Descreva a qualidade e o que está incluso nos ambientes..."
                                    className="w-full bg-slate-950/50 border border-slate-800 rounded-[24px] p-6 text-slate-200 text-sm focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500/50 transition-all min-h-[150px]"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                {rooms.map((room) => (
                                    <div key={room.id} className="bg-slate-900/40 border border-slate-800/60 rounded-[40px] p-10 space-y-8 transition-all hover:bg-slate-900/60">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-2xl font-black text-white tracking-tighter uppercase">{room.name}</h3>
                                                <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mt-1">{room.type}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="text-[10px] font-black text-slate-500 uppercase">Status de Marketing</span>
                                                <div className="flex items-center gap-2 p-1.5 bg-slate-950/50 rounded-xl border border-slate-800">
                                                    <CheckCircle2 size={14} className="text-amber-500" />
                                                    <span className="text-[10px] font-bold text-slate-300 uppercase">{room.media?.filter(m => m.is_marketing).length || 0} Ativas</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                            {room.media?.map((media) => (
                                                <div key={media.id} className="relative group rounded-2xl overflow-hidden aspect-square border border-slate-800 bg-slate-950 shadow-lg">
                                                    {media.type === 'video' ? (
                                                        <div className="w-full h-full flex flex-col items-center justify-center text-rose-500 gap-2">
                                                            <Play size={32} />
                                                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Vídeo</span>
                                                        </div>
                                                    ) : (
                                                        <img src={media.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
                                                    )}

                                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                                    <div className="absolute top-3 left-3 z-10">
                                                        <button
                                                            onClick={() => handleToggleRoomMediaMarketing(media.id, !media.is_marketing)}
                                                            className={`p-2.5 rounded-xl backdrop-blur-md border shadow-2xl transition-all duration-300 active:scale-90 ${media.is_marketing
                                                                    ? 'bg-amber-500 text-white border-white/20 opacity-100'
                                                                    : 'bg-slate-900/70 text-slate-400 border-slate-700 opacity-0 group-hover:opacity-100 hover:text-amber-400 hover:border-amber-400/30'
                                                                }`}
                                                            title={media.is_marketing ? "Remover do site de vendas" : "Adicionar ao site de vendas"}
                                                        >
                                                            <CheckCircle2 size={16} fill={media.is_marketing ? "currentColor" : "none"} />
                                                        </button>
                                                    </div>

                                                    <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <span className="text-[9px] font-black text-white/50 uppercase tracking-tighter">
                                                            {media.is_marketing ? 'Em destaque' : 'Privada'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!room.media || room.media.length === 0) && (
                                                <div className="col-span-full py-8 text-center bg-slate-950/20 border border-dashed border-slate-800 rounded-3xl">
                                                    <p className="text-slate-600 font-bold text-xs italic">Nenhuma mídia vinculada a este cômodo.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Aba Localização */}
                    {activeTab === 'location' && (
                        <div className="bg-slate-900/40 border border-slate-800/60 rounded-[40px] p-10 space-y-10 shadow-inner">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">Onde Estamos (Vantagens da Localização)</label>
                                <textarea
                                    value={formData.location_text}
                                    onChange={(e) => setFormData({ ...formData, location_text: e.target.value })}
                                    placeholder="Ex: Próximo à Univille, centro gastronômico..."
                                    className="w-full bg-slate-950/50 border border-slate-800 rounded-[24px] p-6 text-slate-200 text-base leading-relaxed focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500/50 transition-all min-h-[180px]"
                                />
                            </div>

                            <MediaList
                                title="Mídias da Localização (Mapas e arredores)"
                                field="location_media"
                                placeholder="URL de foto da fachada ou localização"
                            />
                        </div>
                    )}

                    {/* Aba Comodidades */}
                    {activeTab === 'amenities' && (
                        <div className="bg-slate-900/40 border border-slate-800/60 rounded-[40px] p-10 space-y-10 shadow-inner">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">Comodidades Próximas</label>
                                <textarea
                                    value={formData.amenities_text}
                                    onChange={(e) => setFormData({ ...formData, amenities_text: e.target.value })}
                                    placeholder="Ex: Farmácia 24h a 2 quadras, Mercado AngelONI..."
                                    className="w-full bg-slate-950/50 border border-slate-800 rounded-[24px] p-6 text-slate-200 text-base leading-relaxed focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500/50 transition-all min-h-[180px]"
                                />
                            </div>

                            <MediaList
                                title="Fotos das Comodidades Locais"
                                field="amenities_media"
                                placeholder="URL de foto das redondezas"
                            />
                        </div>
                    )}

                    {/* Aba Regras */}
                    {activeTab === 'rules' && (
                        <div className="bg-slate-900/40 border border-slate-800/60 rounded-[40px] p-10 space-y-6">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">Código de Conduta / Regras da Moradias</label>
                                <textarea
                                    value={formData.rules_text}
                                    onChange={(e) => setFormData({ ...formData, rules_text: e.target.value })}
                                    placeholder="Especifique as regras de convivência, horários e deveres..."
                                    className="w-full bg-slate-950/50 border border-slate-800 rounded-[24px] p-8 text-slate-200 text-sm leading-[1.8] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all min-h-[400px]"
                                />
                                <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex gap-3 items-center">
                                    <Shield className="text-indigo-400" size={20} />
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Este texto será usado como base para o contrato e guia do morador.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Contextual */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-rose-600 to-rose-800 rounded-[40px] p-8 text-white shadow-2xl shadow-rose-950/50 border border-rose-500/30 overflow-hidden relative">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
                        <h3 className="text-2xl font-black mb-4 uppercase tracking-tighter">Sales Page</h3>
                        <p className="text-sm font-medium text-rose-100 leading-relaxed mb-8">
                            Tudo o que você preencher aqui alimenta diretamente a sua ferramenta de vendas. Use fotos nítidas e textos envolventes!
                        </p>

                        <div className="space-y-4">
                            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/10">
                                <div className="p-2 bg-amber-500 rounded-xl shadow-lg">
                                    <ImageIcon size={20} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-amber-200">Dica de Ouro</p>
                                    <p className="text-[11px] font-bold leading-tight">Marque fotos de cada cômodo para criar desejo no prospect.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-[40px] p-8 space-y-6 shadow-xl">
                        <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">Painel de Controle</h3>
                        <div className="space-y-3">
                            <button className="w-full flex items-center justify-between p-5 bg-slate-950/60 hover:bg-slate-800 border border-slate-800 hover:border-rose-500/50 rounded-3xl transition-all group shadow-inner">
                                <div className="flex items-center gap-3 text-slate-300 group-hover:text-white transition-colors">
                                    <Layout size={20} />
                                    <span className="text-xs font-black uppercase tracking-widest">Preview Landing Page</span>
                                </div>
                                <ChevronRight size={18} className="text-slate-600 group-hover:translate-x-1 transition-all" />
                            </button>
                            <p className="text-[9px] text-slate-500 font-bold px-3 uppercase tracking-wider text-center">
                                * As mídias são carregadas do CDN Supabase para performance máxima.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
