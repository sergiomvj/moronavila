import React, { useState } from 'react';
import {
    Save, Image as ImageIcon, Video, MapPin,
    Home, Info, CheckCircle2, ChevronRight,
    Plus, X, Layout, Sparkles, Shield
} from 'lucide-react';
import { PropertyDescription, Room } from '../types';
import { updatePropertyDescription } from '../lib/database';

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

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-rose-500/10 rounded-lg">
                            <Layout className="text-rose-500" size={20} />
                        </div>
                        <h2 className="text-2xl font-black text-white tracking-tight">Descrição da Propriedade</h2>
                    </div>
                    <p className="text-slate-400 text-sm font-medium">
                        Gerencie as informações que serão exibidas na Landing Page e materiais de marketing.
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-rose-900/20 group"
                >
                    {isSaving ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Save size={18} className="group-hover:scale-110 transition-transform" />
                    )}
                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1.5 bg-slate-900/50 border border-slate-800 rounded-3xl w-fit overflow-x-auto no-scrollbar">
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
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] transition-all whitespace-nowrap ${activeTab === tab.id
                            ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/40'
                            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                            }`}
                    >
                        <tab.icon size={14} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {activeTab === 'general' && (
                        <div className="bg-slate-900/40 border border-slate-800/60 rounded-[32px] p-8 space-y-6">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Texto Principal de Boas-vindas</label>
                                <textarea
                                    value={formData.main_text}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, main_text: e.target.value })}
                                    placeholder="Ex: Localizado em Joinville, o MoronaVila oferece o melhor custo-benefício..."
                                    className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-slate-200 text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 transition-all min-h-[150px]"
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Mídias Principais (URLs de Vídeo/Imagens de destaque)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        id="new-main-media"
                                        placeholder="Cole a URL da imagem ou vídeo (YouTube/Drive)"
                                        className="flex-1 bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-slate-200 text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 transition-all"
                                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                            if (e.key === 'Enter') {
                                                const input = e.currentTarget;
                                                if (input.value) {
                                                    handleAddField('main_media', input.value);
                                                    input.value = '';
                                                }
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={() => {
                                            const input = document.getElementById('new-main-media') as HTMLInputElement;
                                            if (input.value) {
                                                handleAddField('main_media', input.value);
                                                input.value = '';
                                            }
                                        }}
                                        className="p-4 bg-slate-800 hover:bg-slate-700 rounded-2xl text-slate-300 transition-all"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {formData.main_media.map((url: string, i: number) => (
                                        <div key={i} className="relative group rounded-xl overflow-hidden aspect-video border border-slate-800">
                                            <img src={url} alt="" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/300x200?text=Vídeo/Mídia')} />
                                            <button
                                                onClick={() => handleRemoveField('main_media', i)}
                                                className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Galeria Geral de Fotos</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        id="new-gallery-media"
                                        placeholder="Cole a URL da foto"
                                        className="flex-1 bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-slate-200 text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 transition-all"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const input = e.currentTarget;
                                                if (input.value) {
                                                    handleAddField('gallery_media', input.value);
                                                    input.value = '';
                                                }
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={() => {
                                            const input = document.getElementById('new-gallery-media') as HTMLInputElement;
                                            if (input.value) {
                                                handleAddField('gallery_media', input.value);
                                                input.value = '';
                                            }
                                        }}
                                        className="p-4 bg-slate-800 hover:bg-slate-700 rounded-2xl text-slate-300 transition-all"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                                <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                                    {formData.gallery_media.map((url, i) => (
                                        <div key={i} className="relative group rounded-xl overflow-hidden aspect-square border border-slate-800">
                                            <img src={url} alt="" className="w-full h-full object-cover" />
                                            <button
                                                onClick={() => handleRemoveField('gallery_media', i)}
                                                className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'rooms' && (
                        <div className="bg-slate-900/40 border border-slate-800/60 rounded-[32px] p-8 space-y-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Sobre nossos Cômodos e Espaços</label>
                                <textarea
                                    value={formData.rooms_text}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, rooms_text: e.target.value })}
                                    placeholder="Descreva a qualidade dos móveis, ambientes comuns, etc..."
                                    className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-slate-200 text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 transition-all min-h-[150px]"
                                />
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                        <ImageIcon size={16} className="text-rose-500" />
                                        Fotos dos Cômodos Atuais
                                    </h3>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase p-2 bg-slate-800 rounded-lg">Puxado de Cômodos</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {rooms.map((room) => (
                                        <div key={room.id} className="bg-slate-950/30 border border-slate-800/40 rounded-2xl p-4 flex gap-4 items-center">
                                            <div className="w-20 h-20 rounded-xl bg-slate-800 overflow-hidden flex-shrink-0">
                                                {room.media?.find(m => m.type === 'image') ? (
                                                    <img src={room.media.find(m => m.type === 'image')?.url} className="w-full h-full object-cover" alt="" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                                                        <ImageIcon size={24} />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-black text-white text-sm">{room.name}</p>
                                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{room.type}</p>
                                                <p className="text-[10px] text-rose-500 mt-1 font-bold">{room.media?.length || 0} mídias no sistema</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'location' && (
                        <div className="bg-slate-900/40 border border-slate-800/60 rounded-[32px] p-8 space-y-6">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Onde Estamos / Localização</label>
                                <textarea
                                    value={formData.location_text}
                                    onChange={(e) => setFormData({ ...formData, location_text: e.target.value })}
                                    placeholder="Ex: Estamos no centro de Joinville, próximo à faculdade Univille..."
                                    className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-slate-200 text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 transition-all min-h-[150px]"
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Mídias da Localização (Google Maps/Fotos)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        id="new-location-media"
                                        placeholder="URL de foto ou link do Maps"
                                        className="flex-1 bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-slate-200 text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 transition-all"
                                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                            if (e.key === 'Enter') {
                                                const input = e.currentTarget;
                                                if (input.value) {
                                                    handleAddField('location_media', input.value);
                                                    input.value = '';
                                                }
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={() => {
                                            const input = document.getElementById('new-location-media') as HTMLInputElement;
                                            if (input.value) {
                                                handleAddField('location_media', input.value);
                                                input.value = '';
                                            }
                                        }}
                                        className="p-4 bg-slate-800 hover:bg-slate-700 rounded-2xl text-slate-300 transition-all"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {formData.location_media.map((url: string, i: number) => (
                                        <div key={i} className="relative group rounded-xl overflow-hidden aspect-video border border-slate-800">
                                            <img src={url} alt="" className="w-full h-full object-cover" />
                                            <button
                                                onClick={() => handleRemoveField('location_media', i)}
                                                className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'amenities' && (
                        <div className="bg-slate-900/40 border border-slate-800/60 rounded-[32px] p-8 space-y-6">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Comodidades Próximas</label>
                                <textarea
                                    value={formData.amenities_text}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, amenities_text: e.target.value })}
                                    placeholder="Ex: Farmácias, Mercados, Academias, Pontos de Ônibus..."
                                    className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-slate-200 text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 transition-all min-h-[150px]"
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Fotos das Comodidades</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        id="new-amenities-media"
                                        placeholder="URL da foto"
                                        className="flex-1 bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-slate-200 text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 transition-all"
                                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                            if (e.key === 'Enter') {
                                                const input = e.currentTarget;
                                                if (input.value) {
                                                    handleAddField('amenities_media', input.value);
                                                    input.value = '';
                                                }
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={() => {
                                            const input = document.getElementById('new-amenities-media') as HTMLInputElement;
                                            if (input.value) {
                                                handleAddField('amenities_media', input.value);
                                                input.value = '';
                                            }
                                        }}
                                        className="p-4 bg-slate-800 hover:bg-slate-700 rounded-2xl text-slate-300 transition-all"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {formData.amenities_media.map((url: string, i: number) => (
                                        <div key={i} className="relative group rounded-xl overflow-hidden aspect-video border border-slate-800">
                                            <img src={url} alt="" className="w-full h-full object-cover" />
                                            <button
                                                onClick={() => handleRemoveField('amenities_media', i)}
                                                className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'rules' && (
                        <div className="bg-slate-900/40 border border-slate-800/60 rounded-[32px] p-8 space-y-6">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Código de Conduta / Regras da Casa</label>
                                <textarea
                                    value={formData.rules_text}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, rules_text: e.target.value })}
                                    placeholder="Especifique as regras de convivência, horários de silêncio, etc..."
                                    className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-slate-200 text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 transition-all min-h-[300px]"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Preview / Instructions */}
                <div className="space-y-6">
                    <div className="bg-rose-600 rounded-[32px] p-8 text-white shadow-xl shadow-rose-950/20">
                        <h3 className="text-xl font-black mb-4 uppercase tracking-tighter">Dica de Marketing</h3>
                        <p className="text-sm font-medium text-rose-100 leading-relaxed mb-6">
                            As informações preenchidas aqui serão compiladas automaticamente para criar a sua Landing Page de vendas.
                        </p>
                        <ul className="space-y-3">
                            {[
                                'Use textos persuasivos',
                                'Destaque proximidade com faculdades',
                                'Mencione a qualidade da internet',
                                'Seja claro nas regras de conduta'
                            ].map((tip, i) => (
                                <li key={i} className="flex items-center gap-2 text-xs font-bold">
                                    <CheckCircle2 size={16} className="text-rose-200" />
                                    {tip}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="bg-slate-900/40 border border-slate-800 rounded-[32px] p-8 space-y-6">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Ações Rápidas</h3>
                        <div className="space-y-4">
                            <button className="w-full flex items-center justify-between p-4 bg-slate-950/50 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-2xl shadow-sm transition-all group">
                                <div className="flex items-center gap-3 text-slate-300 group-hover:text-white transition-colors">
                                    <Video size={18} />
                                    <span className="text-xs font-bold">Visualizar Landing Page</span>
                                </div>
                                <ChevronRight size={16} className="text-slate-600 group-hover:text-rose-500" />
                            </button>
                            <p className="text-[10px] text-slate-500 font-medium px-2">
                                * A landing page será publicada automaticamente após salvar as alterações.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
