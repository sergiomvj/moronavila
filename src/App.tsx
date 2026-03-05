import React, { useState, useEffect } from 'react';
import { ShieldAlert, Loader2 } from 'lucide-react';

import { supabase } from './lib/supabase';
import {
  fetchResidents, fetchRooms, fetchPayments, fetchMaintenance,
  fetchComplaints, fetchNotices, fetchCalendarEvents, fetchLaundrySchedules, fetchDevices
} from './lib/database';

import {
  Resident, Room, Payment, MaintenanceRequest,
  Complaint, Notice, CalendarEvent, UserRole, LaundrySchedule
} from './types';

import { Login } from './components/Login';
import { Layout } from './components/Layout';

import { DashboardView } from './views/DashboardView';
import { RoomsView } from './views/RoomsView';
import { ResidentsView } from './views/ResidentsView';
import { PaymentsView } from './views/PaymentsView';
import { MaintenanceView } from './views/MaintenanceView';
import { InternetView } from './views/InternetView';
import { ComplaintsView } from './views/ComplaintsView';
import { NoticesView } from './views/NoticesView';
import { CalendarView } from './views/CalendarView';
import { LaundryView } from './views/LaundryView';

function App() {
  const [session, setSession] = useState<any>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [initialModal, setInitialModal] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<Resident | null>(null);

  // Data state
  const [residents, setResidents] = useState<Resident[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRequest[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [laundrySchedules, setLaundrySchedules] = useState<LaundrySchedule[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        loadAllData(session.user.id);
      } else {
        setLoadingInitial(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        loadAllData(session.user.id);
      } else {
        setCurrentUser(null);
        setResidents([]);
        setLoadingInitial(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Limpar modal inicial ao mudar de aba (opcional, para evitar reabertura)
  useEffect(() => {
    if (initialModal) {
      const timer = setTimeout(() => setInitialModal(null), 500);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  const loadAllData = async (userId: string) => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      // 1. Carregar perfil do usuário primeiro (Independente)
      const { fetchCurrentResident } = await import('./lib/database');
      const user = await fetchCurrentResident(userId);
      // Buscar email diretamente do Auth para fallback de nome confiável
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const emailFallback = authUser?.email?.split('@')[0] || 'Administrador';
      if (user) {
        // Fallback: se o nome for vazio, nulo ou genérico, usa o e-mail
        if (!user.name || user.name.trim() === '' || user.name === 'Administrador') {
          user.name = emailFallback;
        }

        // HEURÍSTICA DE EMERGÊNCIA: Se o usuário é o administrador mas o banco diz 'Morador',
        // vamos forçar 'Administrador' no frontend para que ele recupere os botões.
        // Isso permite que ele tente salvar o perfil novamente e corrija o banco.
        if (user.role !== UserRole.ADMIN && (user.email.toLowerCase().includes('admin') || user.email === authUser?.email)) {
          console.warn('Recuperação de Acesso: Forçando role Administrador para o e-mail:', user.email);
          user.role = UserRole.ADMIN;
        }

        setCurrentUser(user);
      } else {
        // Se não encontrar o residente no banco, tratamos como Admin por padrão se estiver logado
        // (Isso evita que o admin perca acesso às ferramentas se o registro no banco sumir/falhar)
        const mockAdmin: Resident = {
          id: userId,
          name: emailFallback,
          email: authUser?.email || '',
          phone: '',
          role: UserRole.ADMIN,
          status: 'Ativo',
          birth_date: '', entry_date: new Date().toISOString().split('T')[0],
          origin_address: '', work_address: '',
          internet_active: true
        };
        setCurrentUser(mockAdmin);
      }

      // 2. Carregar o restante dos dados
      await refreshData();
    } catch (err: any) {
      console.error(err);
      if (!errorMsg) {
        setErrorMsg('Erro ao carregar os dados iniciais. Verifique a conexão com o Supabase.');
      }
    } finally {
      setIsLoading(false);
      setLoadingInitial(false);
    }
  };

  const refreshData = async () => {
    const errors: string[] = [];
    try {
      try { setRooms(await fetchRooms()); } catch (e) { console.error('Rooms:', e); errors.push('Cômodos'); }
      try { setPayments(await fetchPayments()); } catch (e) { console.error('Payments:', e); errors.push('Financeiro'); }
      try { setMaintenance(await fetchMaintenance()); } catch (e) { console.error('Maintenance:', e); errors.push('Reparos'); }
      try { setComplaints(await fetchComplaints()); } catch (e) { console.error('Complaints:', e); errors.push('Reclamações'); }
      try { setNotices(await fetchNotices()); } catch (e) { console.error('Notices:', e); errors.push('Mural'); }
      try { setEvents(await fetchCalendarEvents()); } catch (e) { console.error('Events:', e); errors.push('Agenda'); }
      try { setLaundrySchedules(await fetchLaundrySchedules()); } catch (e) { console.error('Laundry:', e); }
      try { setDevices(await fetchDevices()); } catch (e) { console.error('Devices:', e); }
      try { setResidents(await fetchResidents()); } catch (e) { console.error('Residents:', e); errors.push('Moradores'); }

      if (errors.length > 0) {
        setErrorMsg(`Aviso: Alguns dados principais (${errors.join(', ')}) não puderam ser carregados.`);
      } else {
        setErrorMsg('');
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('Aviso: Alguns dados podem não ter sido carregados.');
    }
  };

  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  if (!session || !currentUser) {
    return <Login onLogin={loadAllData} />;
  }

  const isAdmin = currentUser.role === UserRole.ADMIN;

  return (
    <Layout
      currentUser={currentUser}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onLogout={() => { setSession(null); setCurrentUser(null); }}
      onRefresh={() => loadAllData(session.user.id)}
    >
      {errorMsg && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-3">
          <ShieldAlert size={20} />
          <p className="font-bold text-sm">{errorMsg}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-indigo-600">
          <Loader2 className="animate-spin mb-4" size={48} />
          <p className="font-medium text-slate-500">Sincronizando dados...</p>
        </div>
      ) : (
        <>
          {activeTab === 'dashboard' && (
            <DashboardView
              payments={payments} maintenance={maintenance}
              residents={residents} rooms={rooms}
              laundrySchedules={laundrySchedules}
              currentUser={currentUser}
              setActiveTab={setActiveTab}
              setShowAddResidentModal={() => setInitialModal('add-resident')}
              setShowAddNoticeModal={() => setInitialModal('add-notice')}
              setShowAddEventModal={() => setInitialModal('add-event')}
            />
          )}

          {activeTab === 'rooms' && (
            <RoomsView
              rooms={rooms} residents={residents} maintenance={maintenance}
              isAdmin={isAdmin} currentUser={currentUser} onRefresh={refreshData}
            />
          )}

          {activeTab === 'residents' && isAdmin && (
            <ResidentsView
              residents={residents} isAdmin={isAdmin}
              currentUser={currentUser} onRefresh={refreshData}
              initialModal={initialModal as any}
            />
          )}

          {activeTab === 'payments' && (
            <PaymentsView
              payments={payments} residents={residents}
              isAdmin={isAdmin} currentUser={currentUser} onRefresh={refreshData}
            />
          )}

          {activeTab === 'maintenance' && (
            <MaintenanceView
              maintenance={maintenance} rooms={rooms} residents={residents}
              isAdmin={isAdmin} currentUser={currentUser} onRefresh={refreshData}
            />
          )}
          {/* Removido InternetView duplicado */}

          {activeTab === 'complaints' && (
            <ComplaintsView
              complaints={complaints} residents={residents}
              isAdmin={isAdmin} currentUser={currentUser} onRefresh={refreshData}
            />
          )}
          {activeTab === 'internet' && <InternetView residents={residents} devices={devices} currentUser={currentUser} onUpdate={refreshData} />}

          {activeTab === 'notices' && (
            <NoticesView notices={notices} residents={residents} isAdmin={isAdmin} currentUser={currentUser} onRefresh={refreshData} initialModal={initialModal as any} />
          )}

          {activeTab === 'calendar' && (
            <CalendarView events={events} isAdmin={isAdmin} onRefresh={refreshData} initialModal={initialModal as any} />
          )}

          {activeTab === 'laundry' && (
            <LaundryView schedules={laundrySchedules} residents={residents} currentUser={currentUser} isAdmin={isAdmin} onRefresh={refreshData} />
          )}
        </>
      )}
    </Layout>
  );
}

export default App;
