import { supabase } from './supabase';
import {
    Resident, Room, Payment, MaintenanceRequest,
    Complaint, Notice, NoticeComment, CalendarEvent,
    Furniture, RoomMedia, PaymentStatus, UserRole, LaundrySchedule, Device, MaintenanceStatus,
    InternetConfig, PropertyDescription
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
    const rawPayload = toSnake(updates);

    // Whitelist de colunas permitidas no banco de dados (Baseado no schema real)
    const allowedColumns = [
        'name', 'phone', 'photo_url', 'instagram', 'role', 'status',
        'entry_date', 'birth_date', 'cpf', 'document_number',
        'origin_address', 'work_address', 'room_id', 'mac_address',
        'mac_address_pc', 'internet_active', 'internet_renewal_date', 'auth_id', 'email',
        'rent_value', 'cleaning_fee', 'extras_value', 'bed_identifier',
        'softphone_extension', 'softphone_enabled', 'softphone_display_name'
    ];

    const payload: Record<string, any> = {};
    allowedColumns.forEach(col => {
        if (col in rawPayload) {
            payload[col] = rawPayload[col];
        }
    });

    // Certifique-se de que room_id seja null se for string vazia
    if (payload.room_id === '') {
        payload.room_id = null;
    }

    // Se o banco ainda não tiver as colunas novas, o Supabase retornará erro.
    // O try/catch no frontend lidará com o fallback para o 'mínimo necessário'.
    console.log('Enviando persistência para resident:', id, payload);

    // Tenta primeiro um UPDATE convencional por ID
    let { data, error } = await supabase.from('residents').update(payload).eq('id', id).select().maybeSingle();

    // Se falhou (não encontrou) e o ID parece um UUID de auth, tentamos um UPSERT usando auth_id como chave
    if (!data && !error && (payload.auth_id || (id && id.length > 30))) {
        const targetAuthId = payload.auth_id || id;
        console.log('Tentando UPSERT por auth_id para:', targetAuthId);

        // Remove 'id' do payload para evitar conflitos se for o UUID do auth
        const { id: _, ...upsertPayload } = payload;
        if (!upsertPayload.auth_id) upsertPayload.auth_id = targetAuthId;

        // Se o email estiver faltando no payload mas o ID for o AuthID, 
        // tentamos recuperar o email do usuário logado se possível ou usar o contexto
        if (!upsertPayload.email) {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser?.email) upsertPayload.email = authUser.email;
        }

        const { data: upsertData, error: upsertError } = await supabase.from('residents')
            .upsert(upsertPayload, { onConflict: 'auth_id' })
            .select()
            .maybeSingle();

        data = upsertData;
        error = upsertError;
    }

    if (error) {
        console.error('Erro na resposta do Supabase:', error);
        throw error;
    }
    if (!data) throw new Error('Nenhum registro encontrado para atualizar ou permissão negada. (ID: ' + id + ')');
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

export async function deleteResident(id: string): Promise<void> {
    const { error } = await supabase.from('residents').delete().eq('id', id);
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
    const payload = toSnake({
        ...item,
        room_id: roomId
    });
    const { data, error } = await supabase
        .from('furniture')
        .insert(payload)
        .select().single();
    if (error) throw error;
    return data as Furniture;
}

export async function updateFurniture(id: string, updates: Partial<Furniture>): Promise<Furniture> {
    const { data, error } = await supabase.from('furniture').update(updates).eq('id', id).select().maybeSingle();
    if (error) throw error;
    return data as Furniture;
}

export async function createRoom(room: Partial<Room>): Promise<Room> {
    const payload = toSnake(room);
    // Garantir que os campos numéricos sejam tratados corretamente
    if ('rent_value' in room) payload.rent_value = Number(room.rent_value) || 0;
    if ('cleaning_fee' in room) payload.cleaning_fee = Number(room.cleaning_fee) || 0;
    if ('extras_value' in room) payload.extras_value = Number(room.extras_value) || 0;

    const { data, error } = await supabase.from('rooms').insert(payload).select().single();
    if (error) throw error;
    return data as Room;
}

export async function deleteFurniture(id: string): Promise<void> {
    const { error } = await supabase.from('furniture').delete().eq('id', id);
    if (error) throw error;
}

export async function updateRoom(id: string, updates: Partial<Room>): Promise<Room> {
    const payload = toSnake(updates);
    if ('rent_value' in updates) payload.rent_value = Number(updates.rent_value) || 0;
    if ('cleaning_fee' in updates) payload.cleaning_fee = Number(updates.cleaning_fee) || 0;
    if ('extras_value' in updates) payload.extras_value = Number(updates.extras_value) || 0;
    if ('capacity' in updates) payload.capacity = Number(updates.capacity) || 0;

    const { data, error } = await supabase.from('rooms').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data as Room;
}


// ── DEVICES ────────────────────────────────────────────────────────────────
export async function fetchDevices(): Promise<Device[]> {
    try {
        const { data: devices, error } = await supabase.from('devices').select('*').order('created_at', { ascending: false });
        if (error) return [];
        return devices as Device[];
    } catch (e) {
        return [];
    }
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
    const path = `rooms/${roomId}/${Date.now()}.${ext}`;
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

export async function toggleRoomMediaMarketing(id: string, isMarketing: boolean): Promise<void> {
    const { error } = await supabase.from('room_media').update({ is_marketing: isMarketing }).eq('id', id);
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
    const { data, error } = await supabase.from('payments').update(updates).eq('id', id).select().maybeSingle();
    if (error) throw error;
    if (status === PaymentStatus.PAID) {
        await renewInternetAccess(residentId);
    }
    return data as Payment;
}

export async function createPayment(payment: Partial<Payment>): Promise<Payment> {
    const payload = toSnake(payment);
    if ('amount' in payment) payload.amount = Number(payment.amount) || 0;

    const { data, error } = await supabase.from('payments').insert(payload).select().single();
    if (error) throw error;
    return data as Payment;
}

// ── PROPERTY DESCRIPTION ──────────────────────────────────────────────────
export async function fetchPropertyDescription(): Promise<PropertyDescription> {
    const { data, error } = await supabase.from('property_description').select('*').maybeSingle();
    if (error) throw error;
    return data as PropertyDescription;
}

export async function updatePropertyDescription(updates: Partial<PropertyDescription>): Promise<PropertyDescription> {
    const { data, error } = await supabase.from('property_description').upsert({ id: 'default', ...updates }).select().single();
    if (error) throw error;
    return data as PropertyDescription;
}

// ── PUBLIC ENDPOINTS FOR LANDING PAGE ──────────────────────────────────────────

export async function fetchPublicPropertyDescription(): Promise<PropertyDescription> {
    const { data, error } = await supabase.from('property_description').select('*').single();
    if (error && error.code !== 'PGRST116') throw error;
    return data as PropertyDescription;
}

export async function fetchPublicRooms(): Promise<Room[]> {
    const [roomsRes, mediaRes] = await Promise.all([
        supabase.from('rooms').select('*').order('name'),
        supabase.from('room_media').select('*').order('created_at'),
    ]);
    if (roomsRes.error) throw roomsRes.error;

    const rooms = (roomsRes.data || []) as any[];
    const media = (mediaRes.data || []) as any[];

    return rooms.map(r => ({
        ...r,
        media: media.filter(m => m.room_id === r.id),
        furniture: [], // não exibir móveis publicamente
        residentIds: [], // não exibir moradores publicamente
    })) as Room[];
}

// ── MAINTENANCE ────────────────────────────────────────────────────────────────
export async function fetchMaintenance(): Promise<MaintenanceRequest[]> {
    const { data, error } = await supabase.from('maintenance_requests').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as MaintenanceRequest[];
}

export async function createMaintenanceRequest(req: Partial<MaintenanceRequest>): Promise<MaintenanceRequest> {
    const payload = toSnake(req);
    const { data, error } = await supabase.from('maintenance_requests').insert(payload).select().single();
    if (error) throw error;
    return data as MaintenanceRequest;
}

export async function updateMaintenanceStatus(id: string, status: MaintenanceStatus): Promise<MaintenanceRequest> {
    const { data, error } = await supabase.from('maintenance_requests').update({ status }).eq('id', id).select().maybeSingle();
    if (error) throw error;
    return data as MaintenanceRequest;
}

// ── COMPLAINTS ─────────────────────────────────────────────────────────────────
export async function fetchComplaints(): Promise<Complaint[]> {
    const { data, error } = await supabase.from('complaints').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as Complaint[];
}

export async function createComplaint(complaint: Partial<Complaint>): Promise<Complaint> {
    const payload = toSnake(complaint);
    const { data, error } = await supabase.from('complaints').insert(payload).select().single();
    if (error) throw error;
    return data as Complaint;
}

export async function updateComplaintStatus(id: string, status: string): Promise<Complaint> {
    const { data, error } = await supabase.from('complaints').update({ status }).eq('id', id).select().maybeSingle();
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

export async function createNotice(notice: Partial<Notice>): Promise<Notice> {
    const { data, error } = await supabase.from('notices').insert({
        title: notice.title,
        content: notice.content,
        category: notice.category,
        author_id: notice.author_id,
        is_pinned: notice.is_pinned || false,
        is_general: notice.is_general || true
    }).select().single();
    if (error) throw error;
    return data as Notice;
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

export async function createCalendarEvent(event: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const { data, error } = await supabase.from('calendar_events').insert({
        title: event.title,
        description: event.description,
        date: event.date,
        location: event.location,
        type: event.type
    }).select().single();

    if (error) throw error;

    // Se houver moradores vinculados (opcional na criação simples)
    if (event.residentIds && event.residentIds.length > 0) {
        const links = event.residentIds.map(rid => ({
            event_id: data.id,
            resident_id: rid
        }));
        await supabase.from('calendar_event_residents').insert(links);
    }

    return { ...data, residentIds: event.residentIds || [] } as CalendarEvent;
}

// ── AUTH ───────────────────────────────────────────────────────────────────────
export async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
}

export async function signUpResident(email: string, password: string, name: string, phone: string) {
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
    const { data, error } = await supabase.from('residents').select('*').eq('auth_id', authId).maybeSingle();

    if (!data || error) {
        // Tenta buscar pelo e-mail como fallback
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
            const { data: emailData } = await supabase.from('residents')
                .select('*')
                .eq('email', user.email)
                .maybeSingle();

            if (emailData) {
                // Se encontrou por e-mail mas não tinha auth_id, vamos vincular agora
                if (!emailData.auth_id) {
                    await supabase.from('residents').update({ auth_id: authId }).eq('id', emailData.id);
                }
                return emailData as Resident;
            }
        }
        return null;
    }
    return data as Resident;
}

export async function uploadProfilePhoto(residentId: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();

    // Garante que o path sempre use um identificador seguro (UUID do auth ou timestamp aleatório)
    // O residentId da tabela residents pode ser um inteiro, não um UUID válido.
    let safeId = residentId;
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
            safeId = user.id; // Sempre um UUID válido do Supabase Auth
        }
    } catch {
        // fallback: usa timestamp para garantir unicidade
        safeId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }

    const fileName = `${safeId}-${Date.now()}.${fileExt}`;
    const filePath = `profiles/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('room-media') // Usando o bucket existente para simplificar
        .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('room-media').getPublicUrl(filePath);
    return data.publicUrl;
}

// ── UTILS ──────────────────────────────────────────────────────────────────────
function toSnake(obj: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    for (const key in obj) {
        const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        let val = obj[key];
        // Prevents empty strings from crashing Postgres 'uuid' and 'date' types
        if (val === '' && (snakeKey.includes('date') || snakeKey.includes('id'))) {
            val = null;
        }
        result[snakeKey] = val;
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
    const { data, error } = await supabase.from('laundry_schedules').update(payload).eq('id', id).select().maybeSingle();
    if (error) throw error;
    return data as LaundrySchedule;
}

export async function deleteLaundrySchedule(id: string): Promise<void> {
    const { error } = await supabase.from('laundry_schedules').delete().eq('id', id);
    if (error) throw error;
}
