import { Room, Resident, Payment, MaintenanceRequest, Complaint, RoomType, PaymentStatus, MaintenanceStatus, Notice, CalendarEvent, UserRole } from './types';

export const INITIAL_RESIDENTS: Resident[] = [
  { id: '1', name: 'João Silva', email: 'joao@email.com', phone: '(11) 98888-7777', entryDate: '2023-01-15', roomId: 'r1', role: UserRole.RESIDENT },
  { id: '2', name: 'Maria Oliveira', email: 'maria@email.com', phone: '(11) 97777-6666', entryDate: '2023-02-10', roomId: 'r2', role: UserRole.RESIDENT },
  { id: '3', name: 'Pedro Santos', email: 'pedro@email.com', phone: '(11) 96666-5555', entryDate: '2023-03-05', roomId: 'r1', role: UserRole.RESIDENT },
  { id: 'admin', name: 'Sergio V.', email: 'sergiomvj@gmail.com', phone: '(11) 99999-9999', entryDate: '2022-01-01', role: UserRole.ADMIN },
];

export const INITIAL_ROOMS: Room[] = [
  {
    id: 'r1',
    name: 'Quarto 01 - Suíte',
    type: RoomType.BEDROOM,
    capacity: 2,
    residentIds: ['1', '3'],
    description: 'Quarto amplo com banheiro privativo e ótima iluminação natural.',
    furniture: [
      { id: 'f1', name: 'Cama Beliche', condition: 'Bom', description: 'Estrutura de madeira maciça, colchões novos.' },
      { id: 'f2', name: 'Guarda-roupa', condition: 'Novo', description: '3 portas, com espelho interno.' },
      { id: 'f3', name: 'Escrivaninha', condition: 'Regular', description: 'Mesa de estudos com gaveteiro.' },
    ],
    media: [
      { id: 'm1', url: 'https://picsum.photos/seed/room1/800/600', type: 'image' },
      { id: 'm2', url: 'https://picsum.photos/seed/room1-2/800/600', type: 'image' },
    ]
  },
  {
    id: 'r2',
    name: 'Quarto 02 - Individual',
    type: RoomType.BEDROOM,
    capacity: 1,
    residentIds: ['2'],
    description: 'Quarto compacto ideal para quem busca privacidade.',
    furniture: [
      { id: 'f4', name: 'Cama Solteiro', condition: 'Bom', description: 'Cama box com baú.' },
      { id: 'f5', name: 'Cômoda', condition: 'Bom', description: '4 gavetas amplas.' },
    ],
    media: [
      { id: 'm3', url: 'https://picsum.photos/seed/room2/800/600', type: 'image' },
    ]
  },
  {
    id: 'r3',
    name: 'Cozinha Comunitária',
    type: RoomType.KITCHEN,
    capacity: 0,
    residentIds: [],
    description: 'Área comum equipada para preparo de refeições.',
    furniture: [
      { id: 'f6', name: 'Geladeira Frost Free', condition: 'Novo', description: 'Capacidade 400L, Inox.' },
      { id: 'f7', name: 'Fogão 4 Bocas', condition: 'Bom', description: 'Acendimento automático.' },
      { id: 'f8', name: 'Micro-ondas', condition: 'Bom', description: '20 litros, digital.' },
    ],
    media: [
      { id: 'm4', url: 'https://picsum.photos/seed/kitchen/800/600', type: 'image' },
    ]
  }
];

export const INITIAL_PAYMENTS: Payment[] = [
  { id: 'p1', residentId: '1', amount: 850, dueDate: '2024-03-10', status: PaymentStatus.PAID, description: 'Mensalidade Março' },
  { id: 'p2', residentId: '2', amount: 950, dueDate: '2024-03-10', status: PaymentStatus.PENDING, description: 'Mensalidade Março' },
  { id: 'p3', residentId: '3', amount: 850, dueDate: '2024-03-10', status: PaymentStatus.OVERDUE, description: 'Mensalidade Março' },
];

export const INITIAL_MAINTENANCE: MaintenanceRequest[] = [
  { id: 'm1', title: 'Vazamento na pia', description: 'A torneira da cozinha está pingando constantemente.', roomId: 'r3', status: MaintenanceStatus.OPEN, createdAt: '2024-03-01' },
  { id: 'm2', title: 'Lâmpada queimada', description: 'Trocar lâmpada do quarto 01.', roomId: 'r1', status: MaintenanceStatus.RESOLVED, createdAt: '2024-02-25', cost: 15 },
];

export const INITIAL_COMPLAINTS: Complaint[] = [
  { id: 'c1', residentId: '2', title: 'Barulho excessivo', description: 'Música alta após as 22h no corredor.', createdAt: '2024-03-02', isAnonymous: false },
];

export const INITIAL_NOTICES: Notice[] = [
  {
    id: 'n1',
    title: 'Nova Regra: Silêncio após as 22h',
    content: 'A partir de hoje, pedimos a colaboração de todos para manter o silêncio nas áreas comuns após as 22h, visando o bem-estar de quem estuda cedo.',
    category: 'Regra',
    authorId: 'admin',
    createdAt: '2024-03-01',
    comments: [
      { id: 'nc1', residentId: '1', text: 'Concordo plenamente!', createdAt: '2024-03-01' }
    ]
  },
  {
    id: 'n2',
    title: 'Manutenção da Caixa d\'Água',
    content: 'Nesta quarta-feira teremos a limpeza da caixa d\'água. O abastecimento será interrompido das 08h às 12h.',
    category: 'Importante',
    authorId: 'admin',
    createdAt: '2024-03-02',
    comments: []
  }
];

export const INITIAL_EVENTS: CalendarEvent[] = [
  {
    id: 'e1',
    title: 'Faxina Geral - Cozinha',
    description: 'Limpeza pesada da geladeira e armários.',
    date: '2024-03-05',
    startTime: '09:00',
    type: 'Limpeza',
    residentIds: ['1', '2']
  },
  {
    id: 'e2',
    title: 'Reunião Mensal',
    description: 'Discussão sobre as contas do mês e novas regras.',
    date: '2024-03-10',
    startTime: '19:00',
    type: 'Reunião',
    residentIds: ['1', '2', '3']
  }
];

