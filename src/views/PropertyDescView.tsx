import React, { useState } from 'react';
import { Save, Image as ImageIcon, Video, MapPin, Home, Info, CheckCircle2, ChevronRight, Plus, X, Layout, Sparkles, Shield, Play, Trash2, Sofa, Edit3, Type } from 'lucide-react';
import { PropertyDescription, Room, RoomType, Furniture, RoomMedia } from '../types';
import { updatePropertyDescription, toggleRoomMediaMarketing, updateRoom, addFurniture, deleteFurniture, updateFurniture, deleteRoomMedia } from '../lib/database';

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

    const RoomEditor = ({ room, onUpdate, onToggleMarketing }: {
        room: Room,
        onUpdate: () => void,
        onToggleMarketing: (id: string, val: boolean) => Promise<void>
    }) => {
        const [editingRoom, setEditingRoom] = useState<Partial<Room>>({
            name: room.name,
            type: room.type,
            description: room.description || '',
        });
        const [newFurniture, setNewFurniture] = useState({ name: '', condition: 'Bom' as any });
        const [newMediaUrl, setNewMediaUrl] = useState('');
        const [isUpdating, setIsUpdating] = useState(false);

        const handleSaveRoom = async () => {
            setIsUpdating(true);
            try {
                await updateRoom(room.id, editingRoom);
                alert('Cômodo atualizado!');
                onUpdate();
            } catch (err) {
                console.error(err);
                alert('Erro ao atualizar cômodo.');
            } finally {
                setIsUpdating(false);
            }
        };

        const handleAddFurniture = async () => {
            if (!newFurniture.name) return;
            try {
                await addFurniture(room.id, newFurniture);
                setNewFurniture({ name: '', condition: 'Bom' });
                onUpdate();
            } catch (err) {
                console.error(err);
            }
        };

        const handleRemoveFurniture = async (id: string) => {
            if (!confirm('Excluir este item de mobília?')) return;
            try {
                await deleteFurniture(id);
                onUpdate();
            } catch (err) {
                console.error(err);
            }
        };

        const handleAddMedia = async () => {
            if (!newMediaUrl) return;
            // Para simplicidade inicial, assume imagem se não for .mp4 ou tiver video no nome
            const type = (newMediaUrl.includes('.mp4') || newMediaUrl.toLowerCase().includes('video')) ? 'video' : 'image';
            try {
                // Aqui usaríamos uma função para inserir na tabela room_media se ela aceitasse URL direta
                // Como uploadRoomMedia faz upload de arquivo, faremos uma inserção direta no Supabase via lib/database ou aqui
                const { supabase } = await import('../lib/supabase');
                await supabase.from('room_media').insert({ room_id: room.id, url: newMediaUrl, type });
                setNewMediaUrl('');
                onUpdate();
            } catch (err) {
                console.error(err);
            }
        };

        const handleRemoveMedia = async (media: RoomMedia) => {
            if (!confirm('Remover esta mídia?')) return;
            try {
                await deleteRoomMedia(media.id, media.storage_path);
                onUpdate();
            } catch (err) {
                console.error(err);
            }
        };

        return (
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-[40px] p-8 md:p-10 space-y-8 transition-all hover:bg-slate-900/60 shadow-xl overflow-hidden group">
                {/* Header do Quarto */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800/50 pb-8">
                    <div className="flex-1 space-y-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome do Cômodo</label>
                                <div className="relative">
                                    <Edit3 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        type="text"
                                        value={editingRoom.name}
                                        onChange={(e) => setEditingRoom({ ...editingRoom, name: e.target.value })}
                                        className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-6 text-white text-sm font-bold focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 transition-all"
                                    />
                                </div>
                            </div>
                            <div className="md:w-1/3 space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tipo</label>
                                <div className="relative">
                                    <Type size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <select
                                        value={editingRoom.type}
                                        onChange={(e) => setEditingRoom({ ...editingRoom, type: e.target.value as RoomType })}
                                        className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-6 text-white text-sm font-bold focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 transition-all appearance-none"
                                    >
                                        {Object.values(RoomType).map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Descrição do Marketing (O que o cliente vê)</label>
                            <textarea
                                value={editingRoom.description}
                                onChange={(e) => setEditingRoom({ ...editingRoom, description: e.target.value })}
                                className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-slate-300 text-sm leading-relaxed focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 transition-all min-h-[100px]"
                                placeholder="Descreva os pontos positivos deste quarto..."
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-4">
                        <button
                            onClick={handleSaveRoom}
                            disabled={isUpdating}
                            className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-rose-900/20 disabled:opacity-50"
                        >
                            {isUpdating ? '...' : <Save size={16} />}
                            Salvar Cômodo
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {/* Coluna de Mídias */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h4 className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                                <ImageIcon size={16} className="text-rose-500" /> Mídias do Quarto
                            </h4>
                        </div>
                        
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Cole a URL da imagem ou vídeo..."
                                value={newMediaUrl}
                                onChange={(e) => setNewMediaUrl(e.target.value)}
                                className="flex-1 bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-300 focus:border-rose-500/50"
                            />
                            <button onClick={handleAddMedia} className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors">
                                <Plus size={18} />
                            </button>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            {room.media?.map((media) => (
                                <div key={media.id} className="relative group/media rounded-xl overflow-hidden aspect-square border border-slate-800 bg-slate-950">
                                    <img src={media.url} className="w-full h-full object-cover" alt="" />
                                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover/media:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => onToggleMarketing(media.id, !media.is_marketing)}
                                            className={`p-2 rounded-lg ${media.is_marketing ? 'bg-amber-500 text-white' : 'bg-slate-700 text-slate-300'}`}
                                            title="Marketing"
                                        >
                                            <CheckCircle2 size={14} fill={media.is_marketing ? "currentColor" : "none"} />
                                        </button>
                                        <button onClick={() => handleRemoveMedia(media)} className="p-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    {media.type === 'video' && (
                                        <div className="absolute bottom-1 right-1 p-1 bg-rose-600 rounded text-white"><Video size={10} /></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Coluna de Mobiliário */}
                    <div className="space-y-6">
                        <h4 className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                            <Sofa size={16} className="text-rose-500" /> Mobiliário do Quarto
                        </h4>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Nome do móvel (ex: Cama Casal)"
                                value={newFurniture.name}
                                onChange={(e) => setNewFurniture({ ...newFurniture, name: e.target.value })}
                                className="flex-1 bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-300 focus:border-rose-500/50"
                            />
                            <select
                                value={newFurniture.condition}
                                onChange={(e) => setNewFurniture({ ...newFurniture, condition: e.target.value as any })}
                                className="bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-3 text-[10px] font-bold text-slate-400 appearance-none"
                            >
                                <option value="Novo">Novo</option>
                                <option value="Bom">Bom</option>
                                <option value="Regular">Regular</option>
                                <option value="Ruim">Ruim</option>
                            </select>
                            <button onClick={handleAddFurniture} className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors">
                                <Plus size={18} />
                            </button>
                        </div>

                        <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 no-scrollbar">
                            {room.furniture?.map((f) => (
                                <div key={f.id} className="flex items-center justify-between p-4 bg-slate-950/40 border border-slate-800 rounded-2xl group/item hover:border-slate-700 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${f.condition === 'Novo' ? 'bg-emerald-500' : f.condition === 'Bom' ? 'bg-sky-500' : 'bg-amber-500'}`} />
                                        <div>
                                            <p className="text-xs font-bold text-slate-200">{f.name}</p>
                                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{f.condition}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleRemoveFurniture(f.id)} className="p-2 text-slate-600 hover:text-rose-500 opacity-0 group-item:opacity-100 transition-all">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                            {(!room.furniture || room.furniture.length === 0) && (
                                <p className="text-center text-[10px] text-slate-600 italic py-4">Nenhum móvel cadastrado.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

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
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">
                                    Texto de Boas-vindas (Hero Section) <span className="text-amber-500 ml-2 normal-case font-bold">*A primeira linha será o Título Gigante, o restante será o Subtítulo.</span>
                                </label>
                                <textarea
                                    value={formData.main_text}
                                    onChange={(e) => setFormData({ ...formData, main_text: e.target.value })}
                                    placeholder="Linha 1: Seu título de alto impacto aqui.&#10;Linha 2 em diante: Subtítulo descritivo com mais detalhes sobre a propriedade..."
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

                            <div className="grid grid-cols-1 gap-8">
                                {rooms.map((room) => (
                                    <RoomEditor
                                        key={room.id}
                                        room={room}
                                        onUpdate={onUpdate}
                                        onToggleMarketing={handleToggleRoomMediaMarketing}
                                    />
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
                            <button
                                onClick={() => window.open('/', '_blank')}
                                className="w-full flex items-center justify-between p-5 bg-slate-950/60 hover:bg-slate-800 border border-slate-800 hover:border-rose-500/50 rounded-3xl transition-all group shadow-inner"
                            >
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
