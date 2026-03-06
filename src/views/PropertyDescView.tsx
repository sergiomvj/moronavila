import React, { useState } from 'react';
import {
    Save, Image as ImageIcon, Video, MapPin,
    Home, Info, CheckCircle2, ChevronRight,
    Plus, X, Layout, Sparkles, Shield, Play
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
                                    onChange={(e) => setFormData({ ...formData, main_text: e.target.value })}
                                    className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-slate-200 text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 transition-all min-h-[150px]"
                                />
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Mídias Principais</label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {formData.main_media.map((url, i) => (
                                        <div key={i} className="relative group rounded-xl overflow-hidden aspect-video border border-slate-800">
                                            <img src={url} alt="" className="w-full h-full object-cover" />
                                            <button onClick={() => handleRemoveField('main_media', i)} className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'rooms' && (
                        <div className="space-y-8">
                            {rooms.map((room) => (
                                <div key={room.id} className="bg-slate-900/40 border border-slate-800/60 rounded-[32px] p-8 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xl font-black text-white uppercase tracking-tighter">{room.name}</h3>
                                        <span className="text-[10px] font-black text-rose-500 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20 uppercase tracking-widest">{room.type}</span>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {room.media?.map((media) => (
                                            <div key={media.id} className="relative group rounded-xl overflow-hidden aspect-square border border-slate-800 bg-slate-950">
                                                {media.type === 'video' ? (
                                                    <div className="w-full h-full flex items-center justify-center text-indigo-500">
                                                        <Play size={32} />
                                                    </div>
                                                ) : (
                                                    <img src={media.url} className="w-full h-full object-cover" alt="" />
                                                )}
                                                <div className="absolute top-2 left-2 z-10 flex gap-2">
                                                    <button
                                                        onClick={() => handleToggleRoomMediaMarketing(media.id, !media.is_marketing)}
                                                        className={`p-2 rounded-xl backdrop-blur-md border transition-all ${media.is_marketing
                                                                ? 'bg-amber-500 text-white border-amber-400 opacity-100 shadow-lg shadow-amber-900/20'
                                                                : 'bg-slate-900/60 text-slate-400 border-slate-700 opacity-0 group-hover:opacity-100 hover:text-amber-500'
                                                            }`}
                                                        title={media.is_marketing ? "Remover do Marketing" : "Usar no Marketing"}
                                                    >
                                                        <CheckCircle2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'location' && (
                        <div className="bg-slate-900/40 border border-slate-800/60 rounded-[32px] p-8 space-y-6">
                            <textarea
                                value={formData.location_text}
                                onChange={(e) => setFormData({ ...formData, location_text: e.target.value })}
                                className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-slate-200 text-sm min-h-[150px]"
                            />
                        </div>
                    )}

                    {activeTab === 'amenities' && (
                        <div className="bg-slate-900/40 border border-slate-800/60 rounded-[32px] p-8 space-y-6">
                            <textarea
                                value={formData.amenities_text}
                                onChange={(e) => setFormData({ ...formData, amenities_text: e.target.value })}
                                className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-slate-200 text-sm min-h-[150px]"
                            />
                        </div>
                    )}

                    {activeTab === 'rules' && (
                        <div className="bg-slate-900/40 border border-slate-800/60 rounded-[32px] p-8 space-y-6">
                            <textarea
                                value={formData.rules_text}
                                onChange={(e) => setFormData({ ...formData, rules_text: e.target.value })}
                                className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-slate-200 text-sm min-h-[300px]"
                            />
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="bg-rose-600 rounded-[32px] p-8 text-white shadow-xl shadow-rose-950/20">
                        <h3 className="text-xl font-black mb-4 uppercase tracking-tighter">Dica de Marketing</h3>
                        <p className="text-sm font-medium text-rose-100 leading-relaxed mb-6">Selecione as melhores fotos dos cômodos para sua landing page!</p>
                        <div className="flex items-center gap-3 bg-rose-500/20 p-4 rounded-2xl border border-rose-400/20">
                            <CheckCircle2 size={24} className="text-rose-200" />
                            <p className="text-xs font-bold text-rose-100">Fotos marcadas com o selo dourado serão destaque no site.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
