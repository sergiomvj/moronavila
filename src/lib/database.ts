import { supabase } from './supabase';
import {
    Resident, Room, Payment, MaintenanceRequest,
    Complaint, Notice, NoticeComment, CalendarEvent,
    Furniture, RoomMedia, PaymentStatus, UserRole, LaundrySchedule, Device
} from '../types';

// ── RESIDENTS ──────────────────────────────────────────────────────────────────
export async function fetchResidents(): Promise<Resident[]> {
    const { data, error } = await supabase.from('residents').select('*').order('name');
    if (error) throw error;
    return (data || []) as Resident[];
}

export async function createResident(resident: Partial<Resident>): Promise<Resident> {
    const payload = toSnake(resident);
    const { data, error } = await supabase.from('residents').insert(payload).select().single();
    if (error) throw error;
    return data as Resident;
}

export async function updateResident(id: string, updates: Partial<Resident>): Promise<Resident> {
    const payload = toSnake(updates);
    const { data, error } = await supabase.from('residents').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data as Resident;
}

export async function renewInternetAccess(residentId: string): Promise<void> {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const renewalDate = nextMonth.toISOString().split('T')[0];
    const { error } = await supabase
        .from('residents')
        .update({ internet_active: true, internet_renewal_date: renewalDate })
        .eq('id', residentId);
    if (error) throw error;
}

export async function revokeInternetAccess(residentId: string): Promise<void> {
    const { error } = await supabase
        .from('residents')
        .update({ internet_active: false })
        .eq('id', residentId);
    if (error) throw error;
}

// ── ROOMS ───────────────────────────────────────────────────────────────────────
export async function fetchRooms(): Promise<Room[]> {
    const [roomsRes, furnitureRes, mediaRes, residentsRes] = await Promise.all([
        supabase.from('rooms').select('*').order('name'),
        supabase.from('furniture').select('*').order('name'),
        supabase.from('room_media').select('*').order('created_at'),
        supabase.from('residents').select('id, room_id'),
    ]);
    if (roomsRes.error) throw roomsRes.error;
    const rooms = (roomsRes.data || []) as any[];
    const furniture = (furnitureRes.data || []) as any[];
    const media = (mediaRes.data || []) as any[];
    const residents = (residentsRes.data || []) as any[];
    return rooms.map(r => ({
        ...r,
        furniture: furniture.filter(f => f.room_id === r.id),
        media: media.filter(m => m.room_id === r.id),
        residentIds: residents.filter(res => res.room_id === r.id).map((res: any) => res.id),
    })) as Room[];
}

export async function addFurniture(roomId: string, item: Partial<Furniture>): Promise<Furniture> {
    const { data, error } = await supabase
        .from('furniture')
        .insert({ room_id: roomId, name: item.name, description: item.description, condition: item.condition, purchase_date: item.purchase_date, serial_number: item.serial_number })
        .select().single();
    if (error) throw error;
    return data as Furniture;
}

export async function updateFurniture(id: string, updates: Partial<Furniture>): Promise<Furniture> {
    const { data, error } = await supabase.from('furniture').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as Furniture;
}

export async function deleteFurniture(id: string): Promise<void> {
    const { error } = await supabase.from('furniture').delete().eq('id', id);
    if (error) throw error;
}


// ── DEVICES ────────────────────────────────────────────────────────────────
export async function fetchDevices(): Promise<Device[]> {
    const { data: devices, error } = await supabase.from('devices').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return devices as Device[];
}

export async function createDevice(device: Omit<Device, 'id' | 'created_at'>): Promise<Device> {
    const { data, error } = await supabase.from('devices').insert([toSnake(device)]).select().single();
    if (error) throw error;
    return data as Device;
}

export async function updateDevice(id: string, updates: Partial<Device>) {
    const { error } = await supabase.from('devices').update(toSnake(updates)).eq('id', id);
    if (error) throw error;
}

export async function deleteDevice(id: string) {
    const { error } = await supabase.from('devices').delete().eq('id', id);
    if (error) throw error;
}

// ── ROOM MEDIA ─────────────────────────────────────────────────────────────────
export async function uploadRoomMedia(
    roomId: string, file: File
): Promise<RoomMedia> {
    const ext = file.name.split('.').pop();
    const path = `rooms / ${roomId}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('room-media').upload(path, file);
    if (uploadError) throw uploadError;
    const { data: urlData } = supabase.storage.from('room-media').getPublicUrl(path);
    const type = file.type.startsWith('video') ? 'video' : 'image';
    const { data, error } = await supabase.from('room_media')
        .insert({ room_id: roomId, url: urlData.publicUrl, type, storage_path: path })
        .select().single();
    if (error) throw error;
    return data as RoomMedia;
}

export async function deleteRoomMedia(id: string, storagePath?: string): Promise<void> {
    if (storagePath) {
        await supabase.storage.from('room-media').remove([storagePath]);
    }
    const { error } = await supabase.from('room_media').delete().eq('id', id);
    if (error) throw error;
}

// ── PAYMENTS ───────────────────────────────────────────────────────────────────
export async function fetchPayments(): Promise<Payment[]> {
    const { data, error } = await supabase.from('payments').select('*').order('due_date', { ascending: false });
    if (error) throw error;
    return (data || []) as Payment[];
}

export async function updatePaymentStatus(id: string, status: PaymentStatus, residentId: string): Promise<Payment> {
    const updates: any = { status };
    if (status === PaymentStatus.PAID) {
        updates.payment_date = new Date().toISOString().split('T')[0];
    }
    const { data, error } = await supabase.from('payments').update(updates).eq('id', id).select().single();
    if (error) throw error;
    if (status === PaymentStatus.PAID) {
        await renewInternetAccess(residentId);
    }
    return data as Payment;
}

export async function createPayment(payment: Partial<Payment>): Promise<Payment> {
    const payload = toSnake(payment);
    const { data, error } = await supabase.from('payments').insert(payload).select().single();
    if (error) throw error;
    return data as Payment;
}

// ── MAINTENANCE ────────────────────────────────────────────────────────────────
export async function fetchMaintenance(): Promise<MaintenanceRequest[]> {
    const { data, error } = await supabase.from('maintenance_requests').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as MaintenanceRequest[];
}

export async function createMaintenanceRequest(req: {
    title: string; description: string; room_id: string; requested_by?: string; photo_url?: string;
}): Promise<MaintenanceRequest> {
    const { data, error } = await supabase.from('maintenance_requests').insert(req).select().single();
    if (error) throw error;
    return data as MaintenanceRequest;
}

export async function updateMaintenanceStatus(id: string, status: string): Promise<MaintenanceRequest> {
    const { data, error } = await supabase.from('maintenance_requests').update({ status }).eq('id', id).select().single();
    if (error) throw error;
    return data as MaintenanceRequest;
}

// ── COMPLAINTS ─────────────────────────────────────────────────────────────────
export async function fetchComplaints(): Promise<Complaint[]> {
    const { data, error } = await supabase.from('complaints').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as Complaint[];
}

export async function createComplaint(complaint: { resident_id: string; title: string; description: string; is_anonymous: boolean }): Promise<Complaint> {
    const { data, error } = await supabase.from('complaints').insert(complaint).select().single();
    if (error) throw error;
    return data as Complaint;
}

// ── NOTICES ────────────────────────────────────────────────────────────────────
export async function fetchNotices(): Promise<Notice[]> {
    const { data, error } = await supabase
        .from('notices')
        .select('*, notice_comments(*)')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as Notice[];
}

export async function createNoticeComment(comment: { notice_id: string; resident_id: string; text: string }): Promise<NoticeComment> {
    const { data, error } = await supabase.from('notice_comments').insert(comment).select().single();
    if (error) throw error;
    return data as NoticeComment;
}

// ── CALENDAR EVENTS ────────────────────────────────────────────────────────────
export async function fetchCalendarEvents(): Promise<CalendarEvent[]> {
    const [eventsRes, linksRes] = await Promise.all([
        supabase.from('calendar_events').select('*').order('date'),
        supabase.from('calendar_event_residents').select('event_id, resident_id'),
    ]);
    if (eventsRes.error) throw eventsRes.error;
    const events = (eventsRes.data || []) as any[];
    const links = (linksRes.data || []) as any[];
    return events.map(e => ({
        ...e,
        residentIds: links.filter(l => l.event_id === e.id).map((l: any) => l.resident_id),
    })) as CalendarEvent[];
}

// ── AUTH ───────────────────────────────────────────────────────────────────────
export async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
}

export async function signUp(email: string, password: string, name: string, phone: string) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
    });
    if (authError) throw authError;

    if (authData.user) {
        // Create an initial resident record linked to the auth user.
        await createResident({
            auth_id: authData.user.id,
            name,
            email,
            phone,
            role: UserRole.RESIDENT,
            status: 'Ativo',
            entry_date: new Date().toISOString().split('T')[0],
            internet_active: false
        });
    }
    return authData;
}

export async function signUpAdmin(email: string, password: string, name: string, phone: string) {
    const { createClient } = await import('@supabase/supabase-js');
    const tempClient = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY,
        { auth: { persistSession: false, autoRefreshToken: false } }
    );
    const { data: authData, error: authError } = await tempClient.auth.signUp({
        email,
        password,
    });
    if (authError) throw authError;

    if (authData.user) {
        await createResident({
            auth_id: authData.user.id,
            name,
            email,
            phone,
            role: UserRole.ADMIN,
            status: 'Ativo',
            entry_date: new Date().toISOString().split('T')[0],
            internet_active: false
        });
    }
    return authData;
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

export async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
    });
    if (error) throw error;
}

export async function updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
}

export async function fetchCurrentResident(authId: string): Promise<Resident | null> {
    const { data, error } = await supabase.from('residents').select('*').eq('auth_id', authId).single();
    if (error) return null;
    return data as Resident;
}

export async function uploadProfilePhoto(residentId: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${residentId}-${Math.random()}.${fileExt}`;
    const filePath = `profiles/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('room_media') // Usando o bucket existente para simplificar
        .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('room_media').getPublicUrl(filePath);
    return data.publicUrl;
}

// ── UTILS ──────────────────────────────────────────────────────────────────────
function toSnake(obj: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    for (const key in obj) {
        const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        result[snakeKey] = obj[key];
    }
    return result;
}

// ── LAUNDRY SCHEDULES ──────────────────────────────────────────────────────────
export async function fetchLaundrySchedules(): Promise<LaundrySchedule[]> {
    const { data, error } = await supabase.from('laundry_schedules').select('*').order('date', { ascending: true });
    if (error) throw error;
    return (data || []) as LaundrySchedule[];
}

export async function createLaundrySchedule(item: Omit<LaundrySchedule, 'id' | 'created_at'>): Promise<LaundrySchedule> {
    const payload = toSnake(item);
    const { data, error } = await supabase.from('laundry_schedules').insert(payload).select().single();
    if (error) throw error;
    return data as LaundrySchedule;
}

export async function updateLaundrySchedule(id: string, updates: Partial<LaundrySchedule>): Promise<LaundrySchedule> {
    const payload = toSnake(updates);
    const { data, error } = await supabase.from('laundry_schedules').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data as LaundrySchedule;
}

export async function deleteLaundrySchedule(id: string): Promise<void> {
    const { error } = await supabase.from('laundry_schedules').delete().eq('id', id);
    if (error) throw error;
}
