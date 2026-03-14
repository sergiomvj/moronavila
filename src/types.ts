export enum RoomType {
  BEDROOM = 'Quarto',
  KITCHEN = 'Cozinha',
  LIVING_ROOM = 'Sala de Estar',
  BATHROOM = 'Banheiro',
  LAUNDRY = 'Lavanderia',
  OTHER = 'Outro'
}

export enum PaymentStatus {
  PAID = 'Pago',
  PENDING = 'Pendente',
  OVERDUE = 'Atrasado'
}

export enum MaintenanceStatus {
  OPEN = 'Aberto',
  IN_PROGRESS = 'Em Andamento',
  RESOLVED = 'Resolvido'
}

export enum UserRole {
  ADMIN = 'Administrador',
  RESIDENT = 'Morador'
}

export interface Furniture {
  id: string;
  room_id?: string;
  name: string;
  description?: string;
  condition: 'Novo' | 'Bom' | 'Regular' | 'Ruim';
  purchase_date?: string;
  serial_number?: string;
}

export interface Resident {
  id: string;
  auth_id?: string;
  name: string;
  email: string;
  phone: string;
  birth_date?: string;
  entry_date: string;
  origin_address?: string;
  work_address?: string;
  photo_url?: string;
  instagram?: string;
  mac_address?: string;
  mac_address_pc?: string;
  room_id?: string;
  role: UserRole;
  status: string;
  internet_active: boolean;
  internet_renewal_date?: string;
  rent_value?: number;
  cleaning_fee?: number;
  extras_value?: number;
  bed_identifier?: string;
  softphone_extension?: string;
  softphone_enabled?: boolean;
  softphone_display_name?: string;
}

export type ResidentMessageChannel = 'note' | 'voice' | 'package';

export type ResidentMessageCategory =
  | 'payment'
  | 'maintenance'
  | 'cleaning'
  | 'admin'
  | 'internet'
  | 'softphone'
  | 'package'
  | 'voice'
  | 'general';

export interface ResidentMessage {
  id: string;
  resident_id: string;
  channel: ResidentMessageChannel;
  category: ResidentMessageCategory;
  title: string;
  body: string;
  created_at: string;
  read_at?: string | null;
  resolved_at?: string | null;
  related_entity_type?: string | null;
  related_entity_id?: string | null;
  metadata?: Record<string, any> | null;
}

export interface Device {
  id: string;
  resident_id: string;
  device_type: 'Celular' | 'Computador' | 'Outro';
  mac_address: string;
  ip_address?: string;
  connected_time?: string;
  bandwidth_usage?: number;
  status: 'Pendente' | 'Ativo' | 'Bloqueado';
  created_at: string;
}

export interface RoomMedia {
  id: string;
  room_id?: string;
  url: string;
  type: 'image' | 'video';
  storage_path?: string;
  is_marketing?: boolean;
}

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  capacity: number;
  furniture: Furniture[];
  residents?: Resident[];
  media: RoomMedia[];
  description?: string;
  rent_value: number;
  cleaning_fee?: number;
  extras_value?: number;
}

export interface Payment {
  id: string;
  resident_id: string;
  amount: number;
  due_date: string;
  payment_date?: string;
  status: PaymentStatus;
  description: string;
  month: string;
  type?: string;
  external_id?: string;
  pix_qr_code?: string;
  pix_copy_paste?: string;
  billing_type?: string;
  expiration_date?: string;
}

export interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  room_id: string;
  requested_by?: string;
  status: MaintenanceStatus;
  created_at: string;
  cost?: number;
  photo_url?: string;
}

export interface Complaint {
  id: string;
  resident_id: string;
  title: string;
  description: string;
  created_at: string;
  is_anonymous: boolean;
  status: string;
}

export interface LaundrySchedule {
  id: string;
  resident_id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: 'Agendado' | 'Concluído' | 'Cancelado';
  created_at?: string;
}

export interface NoticeComment {
  id: string;
  notice_id: string;
  resident_id: string;
  text: string;
  created_at: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  category: 'Importante' | 'Regra' | 'Evento' | 'Geral';
  author_id: string;
  created_at: string;
  is_pinned: boolean;
  is_general: boolean;
  notice_comments?: NoticeComment[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  type: 'Limpeza' | 'Reunião' | 'Festa' | 'Manutenção' | 'Outro';
  residentIds: string[];
}

export interface InternetConfig {
  provider: string;
  plan: string;
  password?: string;
  monthlyCost: number;
  dueDate: number;
}

export interface PropertyDescription {
  id: string;
  main_text: string;
  main_media: string[]; // URLs de imagem/vídeo principal
  gallery_media: string[]; // URLs da galeria geral
  rooms_text: string;
  location_text: string;
  location_media: string[];
  amenities_text: string;
  amenities_media: string[];
  rules_text: string; // Código de conduta
  updated_at?: string;
}
