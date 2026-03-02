/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Bed, 
  Users, 
  CreditCard, 
  Wrench, 
  MessageSquare, 
  Wifi, 
  Plus,
  Search,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  Menu,
  X,
  Home,
  Megaphone,
  Calendar as CalendarIcon,
  Bell,
  Tag,
  ArrowLeft,
  Image as ImageIcon,
  Film,
  MoreVertical,
  LogIn,
  LogOut,
  Trello
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Room, 
  Resident, 
  Payment, 
  MaintenanceRequest, 
  Complaint, 
  PaymentStatus, 
  MaintenanceStatus,
  RoomType,
  Notice,
  CalendarEvent,
  UserRole
} from './types';
import { 
  INITIAL_ROOMS, 
  INITIAL_RESIDENTS, 
  INITIAL_PAYMENTS, 
  INITIAL_MAINTENANCE, 
  INITIAL_COMPLAINTS,
  INITIAL_NOTICES,
  INITIAL_EVENTS
} from './mockData';

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      active 
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium text-sm">{label}</span>
  </button>
);

const StatCard = ({ label, value, icon: Icon, colorClass }: { label: string, value: string | number, icon: any, colorClass: string }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
    <div>
      <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">{label}</p>
      <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
    </div>
    <div className={`p-3 rounded-xl ${colorClass}`}>
      <Icon size={24} />
    </div>
  </div>
);

// --- Main App ---

export default function App() {
  const [currentUser, setCurrentUser] = useState<Resident | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [rooms, setRooms] = useState<Room[]>(INITIAL_ROOMS);
  const [residents, setResidents] = useState<Resident[]>(INITIAL_RESIDENTS);
  const [payments, setPayments] = useState<Payment[]>(INITIAL_PAYMENTS);
  const [maintenance, setMaintenance] = useState<MaintenanceRequest[]>(INITIAL_MAINTENANCE);
  const [complaints, setComplaints] = useState<Complaint[]>(INITIAL_COMPLAINTS);
  const [notices, setNotices] = useState<Notice[]>(INITIAL_NOTICES);
  const [events, setEvents] = useState<CalendarEvent[]>(INITIAL_EVENTS);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  const isAdmin = currentUser?.role === UserRole.ADMIN;

  const handleLogin = (role: UserRole) => {
    const user = residents.find(r => r.role === role) || residents[0];
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  const stats = useMemo(() => {
    const totalPayments = payments.reduce((acc, p) => acc + p.amount, 0);
    const pendingPayments = payments.filter(p => p.status !== PaymentStatus.PAID).length;
    const openMaintenance = maintenance.filter(m => m.status === MaintenanceStatus.OPEN).length;
    return {
      totalPayments,
      pendingPayments,
      openMaintenance,
      totalResidents: residents.length
    };
  }, [payments, maintenance, residents]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard label="Moradores" value={stats.totalResidents} icon={Users} colorClass="bg-blue-50 text-blue-600" />
              <StatCard label="Pagamentos Pendentes" value={stats.pendingPayments} icon={CreditCard} colorClass="bg-amber-50 text-amber-600" />
              <StatCard label="Manutenções Abertas" value={stats.openMaintenance} icon={Wrench} colorClass="bg-rose-50 text-rose-600" />
              <StatCard label="Receita Mensal" value={`R$ ${stats.totalPayments}`} icon={LayoutDashboard} colorClass="bg-emerald-50 text-emerald-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Maintenance */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-slate-900">Manutenções Recentes</h3>
                  <button onClick={() => setActiveTab('maintenance')} className="text-indigo-600 text-sm font-medium hover:underline">Ver tudo</button>
                </div>
                <div className="space-y-4">
                  {maintenance.slice(0, 3).map(m => (
                    <div key={m.id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <div className={`p-2 rounded-lg ${m.status === MaintenanceStatus.RESOLVED ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                        {m.status === MaintenanceStatus.RESOLVED ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900 text-sm">{m.title}</p>
                        <p className="text-slate-500 text-xs">{rooms.find(r => r.id === m.roomId)?.name}</p>
                      </div>
                      <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                        m.status === MaintenanceStatus.RESOLVED ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {m.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Payments */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-slate-900">Pagamentos Pendentes</h3>
                  <button onClick={() => setActiveTab('payments')} className="text-indigo-600 text-sm font-medium hover:underline">Ver tudo</button>
                </div>
                <div className="space-y-4">
                  {payments.filter(p => p.status !== PaymentStatus.PAID).slice(0, 3).map(p => (
                    <div key={p.id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                        {residents.find(res => res.id === p.residentId)?.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900 text-sm">{residents.find(res => res.id === p.residentId)?.name}</p>
                        <p className="text-slate-500 text-xs">Vencimento: {p.dueDate}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900 text-sm">R$ {p.amount}</p>
                        <span className={`text-[10px] font-bold uppercase ${p.status === PaymentStatus.OVERDUE ? 'text-rose-600' : 'text-amber-600'}`}>
                          {p.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case 'rooms':
        if (selectedRoomId) {
          const room = rooms.find(r => r.id === selectedRoomId);
          if (!room) return null;
          return (
            <div className="space-y-6">
              <button 
                onClick={() => setSelectedRoomId(null)}
                className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors mb-4"
              >
                <ArrowLeft size={20} /> Voltar para lista
              </button>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-3xl font-bold text-slate-900">{room.name}</h2>
                      <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase">
                        {room.type}
                      </span>
                    </div>
                    <p className="text-slate-600 mb-8">{room.description || 'Nenhuma descrição fornecida.'}</p>
                    
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Mobília & Detalhes</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {room.furniture.map(f => (
                            <div key={f.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-bold text-slate-900">{f.name}</span>
                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                  f.condition === 'Novo' ? 'bg-emerald-100 text-emerald-700' :
                                  f.condition === 'Bom' ? 'bg-blue-100 text-blue-700' :
                                  f.condition === 'Regular' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                                }`}>
                                  {f.condition}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500">{f.description || 'Sem detalhes adicionais.'}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Galeria de Mídia</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {room.media.map(m => (
                            <div key={m.id} className="relative aspect-video rounded-xl overflow-hidden group">
                              <img src={m.url} alt="Room" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                {m.type === 'image' ? <ImageIcon className="text-white" /> : <Film className="text-white" />}
                              </div>
                            </div>
                          ))}
                          {isAdmin && (
                            <button className="aspect-video rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition-all">
                              <Plus size={24} />
                              <span className="text-[10px] font-bold uppercase mt-2">Adicionar Mídia</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="font-bold text-slate-900 mb-4">Moradores Atuais</h3>
                    <div className="space-y-3">
                      {room.residentIds.length > 0 ? room.residentIds.map(id => {
                        const res = residents.find(r => r.id === id);
                        return (
                          <div key={id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                              {res?.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{res?.name}</p>
                              <p className="text-[10px] text-slate-500">Desde {res?.entryDate}</p>
                            </div>
                          </div>
                        );
                      }) : (
                        <p className="text-xs text-slate-400 italic">Nenhum morador vinculado.</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100">
                    <h3 className="font-bold text-rose-900 mb-4 flex items-center gap-2">
                      <AlertCircle size={18} /> Reparos Necessários
                    </h3>
                    <div className="space-y-4">
                      {maintenance.filter(m => m.roomId === room.id && m.status !== MaintenanceStatus.RESOLVED).map(m => (
                        <div key={m.id} className="bg-white p-3 rounded-xl border border-rose-100 shadow-sm">
                          <p className="text-xs font-bold text-slate-900 mb-1">{m.title}</p>
                          <p className="text-[10px] text-slate-500">{m.description}</p>
                        </div>
                      ))}
                      <button className="w-full py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-colors">
                        Solicitar Reparo
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        }
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Gestão de Cômodos</h2>
              {isAdmin && (
                <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium hover:bg-indigo-700 transition-colors">
                  <Plus size={18} /> Adicionar Cômodo
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {rooms.map(room => (
                <div 
                  key={room.id} 
                  onClick={() => setSelectedRoomId(room.id)}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-slate-100 rounded-xl text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                        <Bed size={24} />
                      </div>
                      <span className="text-[10px] font-bold uppercase bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full">
                        {room.type}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">{room.name}</h3>
                    <p className="text-slate-500 text-sm mb-4">Capacidade: {room.residentIds.length}/{room.capacity || 'N/A'}</p>
                    
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mobília & Itens</p>
                      <div className="flex flex-wrap gap-2">
                        {room.furniture.slice(0, 3).map(f => (
                          <span key={f.id} className="text-[11px] bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg text-slate-600">
                            {f.name}
                          </span>
                        ))}
                        {room.furniture.length > 3 && <span className="text-[11px] text-slate-400">+{room.furniture.length - 3} mais</span>}
                      </div>
                    </div>
                  </div>
                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {room.residentIds.map(id => (
                        <div key={id} className="w-8 h-8 rounded-full bg-indigo-600 border-2 border-white flex items-center justify-center text-white text-[10px] font-bold" title={residents.find(r => r.id === id)?.name}>
                          {residents.find(r => r.id === id)?.name.charAt(0)}
                        </div>
                      ))}
                    </div>
                    <button className="text-slate-400 group-hover:text-indigo-600 transition-colors">
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'residents':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Moradores</h2>
              <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium hover:bg-indigo-700 transition-colors">
                <Plus size={18} /> Novo Morador
              </button>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-bottom border-slate-100">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Nome</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Quarto</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Contato</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Entrada</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {residents.map(res => (
                    <tr key={res.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold">
                            {res.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{res.name}</p>
                            <p className="text-xs text-slate-500">{res.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">
                          {rooms.find(r => r.id === res.roomId)?.name || 'Sem quarto'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{res.phone}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{res.entryDate}</td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-slate-400 hover:text-indigo-600 transition-colors">
                          <ChevronRight size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'payments':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Financeiro</h2>
              <div className="flex gap-3">
                <button className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
                  Relatório PDF
                </button>
                <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium hover:bg-indigo-700 transition-colors">
                  <Plus size={18} /> Lançar Pagamento
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                <p className="text-emerald-600 text-xs font-bold uppercase mb-1">Recebido</p>
                <h3 className="text-2xl font-bold text-emerald-700">R$ {payments.filter(p => p.status === PaymentStatus.PAID).reduce((a, b) => a + b.amount, 0)}</h3>
              </div>
              <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
                <p className="text-amber-600 text-xs font-bold uppercase mb-1">Pendente</p>
                <h3 className="text-2xl font-bold text-amber-700">R$ {payments.filter(p => p.status === PaymentStatus.PENDING).reduce((a, b) => a + b.amount, 0)}</h3>
              </div>
              <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100">
                <p className="text-rose-600 text-xs font-bold uppercase mb-1">Atrasado</p>
                <h3 className="text-2xl font-bold text-rose-700">R$ {payments.filter(p => p.status === PaymentStatus.OVERDUE).reduce((a, b) => a + b.amount, 0)}</h3>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-bottom border-slate-100">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Morador</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Descrição</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Vencimento</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Valor</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{residents.find(r => r.id === p.residentId)?.name}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{p.description}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{p.dueDate}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">R$ {p.amount}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                          p.status === PaymentStatus.PAID ? 'bg-emerald-100 text-emerald-700' :
                          p.status === PaymentStatus.OVERDUE ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'maintenance':
        const columns = [
          { id: MaintenanceStatus.OPEN, label: 'Abertos', color: 'bg-rose-500' },
          { id: MaintenanceStatus.IN_PROGRESS, label: 'Em Execução', color: 'bg-amber-500' },
          { id: MaintenanceStatus.RESOLVED, label: 'Concluídos', color: 'bg-emerald-500' }
        ];
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Mural de Reparos (Kanban)</h2>
              <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium hover:bg-indigo-700 transition-colors">
                <Plus size={18} /> Novo Reparo
              </button>
            </div>
            
            <div className="flex gap-6 overflow-x-auto pb-4 min-h-[600px]">
              {columns.map(col => (
                <div key={col.id} className="flex-1 min-w-[300px] bg-slate-100/50 rounded-2xl p-4 border border-slate-200/50">
                  <div className="flex items-center justify-between mb-4 px-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${col.color}`}></div>
                      <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">{col.label}</h3>
                    </div>
                    <span className="text-xs font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full shadow-sm">
                      {maintenance.filter(m => m.status === col.id).length}
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    {maintenance.filter(m => m.status === col.id).map(m => (
                      <div key={m.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                            {rooms.find(r => r.id === m.roomId)?.name}
                          </span>
                          <button className="text-slate-300 group-hover:text-slate-600">
                            <MoreVertical size={14} />
                          </button>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm mb-1">{m.title}</h4>
                        <p className="text-xs text-slate-500 mb-4 line-clamp-2">{m.description}</p>
                        <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                          <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <Clock size={12} />
                            <span>{m.createdAt}</span>
                          </div>
                          {m.cost && <span className="text-[10px] font-bold text-emerald-600">R$ {m.cost}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'internet':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">Controle de Internet</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-indigo-600 p-8 rounded-3xl text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-white/20 rounded-2xl">
                      <Wifi size={32} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Fibra Óptica 500MB</h3>
                      <p className="text-indigo-100 text-sm opacity-80">Provedor: Vivo Fibra</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white/10 p-4 rounded-2xl">
                      <p className="text-xs text-indigo-100 uppercase font-bold tracking-widest mb-1">Senha do Wi-Fi</p>
                      <p className="text-lg font-mono font-bold tracking-wider">republica_2024_top</p>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1 bg-white/10 p-4 rounded-2xl">
                        <p className="text-xs text-indigo-100 uppercase font-bold tracking-widest mb-1">Custo Mensal</p>
                        <p className="text-lg font-bold">R$ 149,90</p>
                      </div>
                      <div className="flex-1 bg-white/10 p-4 rounded-2xl">
                        <p className="text-xs text-indigo-100 uppercase font-bold tracking-widest mb-1">Vencimento</p>
                        <p className="text-lg font-bold">Dia 15</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-6">Status da Rede</h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-sm font-medium text-slate-700">Conexão Principal</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 uppercase">Online</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                      <span>Uso de Banda</span>
                      <span>65%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-50">
                    <button className="w-full py-3 bg-slate-50 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors">
                      Reiniciar Roteador
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'complaints':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Reclamações & Sugestões</h2>
              <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium hover:bg-indigo-700 transition-colors">
                <Plus size={18} /> Nova Reclamação
              </button>
            </div>
            <div className="space-y-4">
              {complaints.map(c => (
                <div key={c.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                        <MessageSquare size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{c.title}</h3>
                        <p className="text-xs text-slate-400">{c.createdAt}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                      {c.isAnonymous ? 'Anônimo' : residents.find(r => r.id === c.residentId)?.name}
                    </span>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed">{c.description}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 'notices':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Mural de Avisos</h2>
              <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium hover:bg-indigo-700 transition-colors">
                <Plus size={18} /> Novo Comunicado
              </button>
            </div>
            <div className="grid grid-cols-1 gap-6">
              {notices.map(notice => (
                <div key={notice.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl ${
                          notice.category === 'Importante' ? 'bg-rose-50 text-rose-600' :
                          notice.category === 'Regra' ? 'bg-indigo-50 text-indigo-600' :
                          notice.category === 'Evento' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-600'
                        }`}>
                          <Megaphone size={24} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">{notice.title}</h3>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Clock size={14} />
                            <span>{notice.createdAt}</span>
                            <span>•</span>
                            <span className="font-medium text-indigo-600">{notice.category}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed mb-6">{notice.content}</p>
                    
                    <div className="pt-6 border-t border-slate-50">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <MessageSquare size={14} /> Comentários ({notice.comments.length})
                      </h4>
                      <div className="space-y-4">
                        {notice.comments.map(comment => (
                          <div key={comment.id} className="flex gap-3 bg-slate-50 p-3 rounded-xl">
                            <div className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center text-indigo-600 font-bold text-[10px]">
                              {residents.find(r => r.id === comment.residentId)?.name.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold text-slate-900">{residents.find(r => r.id === comment.residentId)?.name}</span>
                                <span className="text-[10px] text-slate-400">{comment.createdAt}</span>
                              </div>
                              <p className="text-xs text-slate-600">{comment.text}</p>
                            </div>
                          </div>
                        ))}
                        <div className="flex gap-3 mt-4">
                          <input 
                            type="text" 
                            placeholder="Escreva um comentário..." 
                            className="flex-1 bg-slate-50 border border-slate-100 rounded-xl py-2 px-4 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                          <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold">Enviar</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'calendar':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Calendário da República</h2>
              <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium hover:bg-indigo-700 transition-colors">
                <Plus size={18} /> Novo Evento
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Event List */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <CalendarIcon size={20} className="text-indigo-600" /> Próximos Eventos
                  </h3>
                  <div className="space-y-4">
                    {events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(event => (
                      <div key={event.id} className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-colors group">
                        <div className="flex flex-col items-center justify-center w-16 h-16 bg-white rounded-xl border border-slate-100 shadow-sm">
                          <span className="text-[10px] font-bold text-indigo-600 uppercase">{new Date(event.date).toLocaleString('pt-BR', { month: 'short' })}</span>
                          <span className="text-xl font-bold text-slate-900">{new Date(event.date).getDate() + 1}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-bold text-slate-900">{event.title}</h4>
                            <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                              event.type === 'Limpeza' ? 'bg-blue-100 text-blue-700' :
                              event.type === 'Reunião' ? 'bg-amber-100 text-amber-700' :
                              event.type === 'Festa' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {event.type}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mb-3">{event.description}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                              <Clock size={12} />
                              <span>{event.startTime || 'Dia todo'}</span>
                            </div>
                            <div className="flex -space-x-2">
                              {event.residentIds.map(id => (
                                <div key={id} className="w-6 h-6 rounded-full bg-indigo-600 border-2 border-white flex items-center justify-center text-white text-[8px] font-bold" title={residents.find(r => r.id === id)?.name}>
                                  {residents.find(r => r.id === id)?.name.charAt(0)}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Reminders/Info */}
              <div className="space-y-6">
                <div className="bg-indigo-600 p-6 rounded-2xl text-white shadow-lg shadow-indigo-100">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Bell size={18} /> Lembretes Rápidos
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3 text-sm bg-white/10 p-3 rounded-xl">
                      <div className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                      <span>Lixo orgânico: Terça e Quinta</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm bg-white/10 p-3 rounded-xl">
                      <div className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                      <span>Vencimento Aluguel: Dia 10</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <h3 className="font-bold text-slate-900 mb-4">Legenda</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-xs text-slate-600">Limpeza</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                      <span className="text-xs text-slate-600">Reunião</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                      <span className="text-xs text-slate-600">Festa / Social</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
          <div className="p-8 text-center bg-indigo-600 text-white">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Home size={32} />
            </div>
            <h1 className="text-2xl font-bold">VPR-Manager</h1>
            <p className="text-indigo-100 text-sm opacity-80 mt-1">Gestão Inteligente de Repúblicas</p>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-slate-900">Selecione seu acesso</h2>
              <p className="text-slate-500 text-sm">Para fins de demonstração, escolha um perfil:</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <button 
                onClick={() => handleLogin(UserRole.ADMIN)}
                className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-indigo-600 hover:bg-indigo-50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Users size={20} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-900">Administrador</p>
                    <p className="text-xs text-slate-500">Controle total do sistema</p>
                  </div>
                </div>
                <LogIn size={20} className="text-slate-300 group-hover:text-indigo-600" />
              </button>
              <button 
                onClick={() => handleLogin(UserRole.RESIDENT)}
                className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-indigo-600 hover:bg-indigo-50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 text-slate-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Bed size={20} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-900">Morador</p>
                    <p className="text-xs text-slate-500">Acesso às suas informações</p>
                  </div>
                </div>
                <LogIn size={20} className="text-slate-300 group-hover:text-indigo-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-100 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
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
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2">Usuário</p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                {currentUser.name.charAt(0)}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold text-slate-900 truncate">{currentUser.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{currentUser.role}</p>
              </div>
            </div>
          </div>
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
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900">{currentUser.name}</p>
                <p className="text-[10px] text-slate-500 font-medium">{currentUser.role}</p>
              </div>
              <img 
                src={`https://picsum.photos/seed/${currentUser.id}/100/100`} 
                alt="Profile" 
                className="w-10 h-10 rounded-full border border-slate-200"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
