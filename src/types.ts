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
  name: string;
  description?: string;
  condition: 'Novo' | 'Bom' | 'Regular' | 'Ruim';
  purchaseDate?: string;
}

export interface Resident {
  id: string;
  name: string;
  email: string;
  phone: string;
  entryDate: string;
  roomId?: string;
  role: UserRole;
}

export interface RoomMedia {
  id: string;
  url: string;
  type: 'image' | 'video';
}

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  capacity: number;
  furniture: Furniture[];
  residentIds: string[];
  media: RoomMedia[];
  description?: string;
}

export interface Payment {
  id: string;
  residentId: string;
  amount: number;
  dueDate: string;
  status: PaymentStatus;
  description: string;
}

export interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  roomId: string;
  status: MaintenanceStatus;
  createdAt: string;
  cost?: number;
}

export interface Complaint {
  id: string;
  residentId: string;
  title: string;
  description: string;
  createdAt: string;
  isAnonymous: boolean;
}

export interface Comment {
  id: string;
  residentId: string;
  text: string;
  createdAt: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  category: 'Importante' | 'Regra' | 'Evento' | 'Geral';
  authorId: string;
  createdAt: string;
  comments: Comment[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  startTime?: string;
  endTime?: string;
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
