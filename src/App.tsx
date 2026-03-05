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

  const loadAllData = async (userId: string) => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const pResidents = await fetchResidents();
      setResidents(pResidents);

      const user = pResidents.find(r => r.auth_id === userId);
      if (user) {
        setCurrentUser(user);
      } else {
        // Se o usuário não existe na tabela residents, talvez seja o primeiro login ou erro na base.
        // Simulando Admin por padrão para não quebrar:
        const mockAdmin: Resident = {
          id: userId,
          name: 'Administrador (Fallback)',
          email: session?.user?.email || '',
          phone: '', role: UserRole.ADMIN, status: 'Ativo',
          birth_date: '', entry_date: '', origin_address: '', work_address: '',
          internet_active: false
        };
        setCurrentUser(mockAdmin);
      }

      await refreshData();
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Erro ao carregar os dados. Verifique a conexão com o Supabase.');
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
      try { setLaundrySchedules(await fetchLaundrySchedules()); } catch (e) { console.error('Laundry:', e); errors.push('Lavanderia'); }
      try { setDevices(await fetchDevices()); } catch (e) { console.error('Devices:', e); errors.push('Dispositivos'); }
      try { setResidents(await fetchResidents()); } catch (e) { console.error('Residents:', e); errors.push('Moradores'); }

      if (errors.length > 0) {
        setErrorMsg(`Aviso: Erro ao carregar: ${errors.join(', ')}.`);
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
            <NoticesView notices={notices} residents={residents} isAdmin={isAdmin} currentUser={currentUser} onRefresh={refreshData} />
          )}

          {activeTab === 'calendar' && (
            <CalendarView events={events} isAdmin={isAdmin} onRefresh={refreshData} />
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
