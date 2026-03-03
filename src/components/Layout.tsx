import React, { useState } from 'react';
import {
    LayoutDashboard, Bed, Users, CreditCard,
    Wrench, MessageSquare, Wifi, Megaphone,
    Calendar as CalendarIcon, LogOut, Home,
    Search, AlertCircle, Menu, X, Trello
} from 'lucide-react';
import { UserRole, Resident } from '../types';
import { signOut } from '../lib/database';
import { ProfileModal } from './ProfileModal';

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${active
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
            }`}
    >
        <Icon size={20} />
        <span className="font-medium text-sm">{label}</span>
    </button>
);

interface LayoutProps {
    currentUser: Resident;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    onLogout: () => void;
    onRefresh: () => void;
    children: React.ReactNode;
}

export function Layout({ currentUser, activeTab, setActiveTab, onLogout, onRefresh, children }: LayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const isAdmin = currentUser.role === UserRole.ADMIN;

    const handleLogout = async () => {
        await signOut();
        onLogout();
    };

    return (
        <div className="min-h-screen flex bg-slate-50">
            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-100 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="p-6 flex items-center gap-3 mb-8">
                    <div className="bg-indigo-600 p-2 rounded-xl text-white">
                        <Home size={24} />
                    </div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">VPR-<span className="text-indigo-600">Manager</span></h1>
                </div>

                <nav className="px-4 space-y-1">
                    <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                    <SidebarItem icon={Megaphone} label="Mural" active={activeTab === 'notices'} onClick={() => setActiveTab('notices')} />
                    <SidebarItem icon={CalendarIcon} label="Calendário" active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} />
                    <SidebarItem icon={Bed} label="Cômodos" active={activeTab === 'rooms'} onClick={() => setActiveTab('rooms')} />
                    {isAdmin && (
                        <>
                            <SidebarItem icon={Users} label="Moradores" active={activeTab === 'residents'} onClick={() => setActiveTab('residents')} />
                            <SidebarItem icon={CreditCard} label="Financeiro" active={activeTab === 'payments'} onClick={() => setActiveTab('payments')} />
                        </>
                    )}
                    <SidebarItem icon={Trello} label="Kanban Reparos" active={activeTab === 'maintenance'} onClick={() => setActiveTab('maintenance')} />
                    <SidebarItem icon={Wifi} label="Internet" active={activeTab === 'internet'} onClick={() => setActiveTab('internet')} />
                    <SidebarItem icon={MessageSquare} label="Reclamações" active={activeTab === 'complaints'} onClick={() => setActiveTab('complaints')} />
                </nav>

                <div className="absolute bottom-8 left-0 w-full px-6 space-y-4">
                    <button
                        onClick={() => setIsProfileModalOpen(true)}
                        className="w-full bg-slate-50 hover:bg-slate-100 p-4 rounded-2xl border border-slate-100 transition-colors text-left group"
                    >
                        <p className="text-xs text-slate-400 group-hover:text-indigo-600 transition-colors font-bold uppercase tracking-widest mb-2 flex items-center justify-between">
                            Meu Perfil
                        </p>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs uppercase">
                                {currentUser.name.charAt(0)}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-bold text-slate-900 truncate">{currentUser.name}</p>
                                <p className="text-[10px] text-slate-500 truncate">{currentUser.role === UserRole.ADMIN ? 'Administrador' : 'Morador'}</p>
                            </div>
                        </div>
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-sm font-bold"
                    >
                        <LogOut size={18} /> Sair
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0">
                <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 z-40">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                    >
                        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>

                    <div className="flex-1 max-w-md mx-8 hidden md:block">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar moradores, quartos..."
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
                            <AlertCircle size={20} />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
                        </button>
                        <div className="h-8 w-[1px] bg-slate-100 mx-2"></div>
                        <button onClick={() => setIsProfileModalOpen(true)} className="flex items-center gap-3 hover:opacity-80 transition-opacity text-left">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-slate-900">{currentUser.name}</p>
                                <p className="text-[10px] text-slate-500 font-medium">{currentUser.role === UserRole.ADMIN ? 'Admin' : 'Morador'}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg uppercase border border-indigo-200">
                                {currentUser.name.charAt(0)}
                            </div>
                        </button>
                    </div>
                </header>

                <div className="p-8 max-w-7xl mx-auto w-full">
                    {children}
                </div>
            </main>

            {isProfileModalOpen && (
                <ProfileModal
                    currentUser={currentUser}
                    onClose={() => setIsProfileModalOpen(false)}
                    onUpdate={onRefresh}
                />
            )}
        </div>
    );
}
