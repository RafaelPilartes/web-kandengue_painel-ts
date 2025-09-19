import type { AdminInterface } from '@/interfaces/IAdmin'
import type { DocumentInterface } from '@/interfaces/IDocument'
import type { DriverInterface } from '@/interfaces/IDriver'
import type { NotificationInterface } from '@/interfaces/INotification'
import type { RideInterface } from '@/interfaces/IRide'
import type { RideRatesInterface } from '@/interfaces/IRideRates'
import type { RideTrackingsInterface } from '@/interfaces/IRideTracking'
import type { TransactionInterface } from '@/interfaces/ITransaction'
import type { UserInterface } from '@/interfaces/IUser'
import type { VehicleInterface } from '@/interfaces/IVehicle'
import type { WalletInterface } from '@/interfaces/IWallet'
import type { WalletTopupRequestInterface } from '@/interfaces/IWalletTopupRequest'

// ====================== USERS ======================
export const users: UserInterface[] = [
  {
    id: 'u1',
    entity_code: 'use29383',
    name: 'Carlos Mendes',
    email: 'carlos@admin.com',
    phone: '+244900111111',
    status: 'active',
    created_at: new Date()
  },
  {
    id: 'u2',
    entity_code: 'use29384',
    name: 'Ana Silva',
    email: 'ana@admin.com',
    phone: '+244900222222',
    status: 'active',
    created_at: new Date()
  },
  {
    id: 'u3',
    entity_code: 'use29385',
    name: 'Marcos Paulo',
    email: 'marcos@user.com',
    phone: '+244900333333',
    status: 'active',
    created_at: new Date()
  },
  {
    id: 'u4',
    entity_code: 'use29386',
    name: 'Beatriz Santos',
    email: 'bia@user.com',
    phone: '+244900444444',
    status: 'pending',
    created_at: new Date()
  },
  {
    id: 'u5',
    entity_code: 'use29387',
    name: 'João Pedro',
    email: 'joao@driver.com',
    phone: '+244900555555',
    status: 'active',
    created_at: new Date()
  },
  {
    id: 'u6',
    entity_code: 'use29388',
    name: 'Maria Oliveira',
    email: 'maria@driver.com',
    phone: '+244900666666',
    status: 'active',
    created_at: new Date()
  }
]

// ====================== VEHICLES ======================
export const vehicles: VehicleInterface[] = [
  {
    id: 'v1',
    user_id: 'u5',
    type: 'car',
    brand: 'Toyota',
    model: 'Corolla',
    color: 'Preto',
    plate: 'LD-34-AB',
    status: 'under_analysis',
    image: 'https://placehold.co/200x100',
    created_at: new Date()
  },
  {
    id: 'v2',
    user_id: 'u6',
    type: 'motorcycle',
    brand: 'Honda',
    model: 'Wave 125',
    color: 'Vermelha',
    plate: 'LD-11-CD',
    status: 'validated',
    created_at: new Date()
  },
  {
    id: 'v3',
    user_id: 'u5',
    type: 'truck',
    brand: 'Volvo',
    model: 'FH',
    color: 'Branco',
    status: 'validated',
    plate: 'LD-55-EF'
  },
  {
    id: 'v4',
    user_id: 'u6',
    type: 'bicycle',
    brand: 'Caloi',
    model: 'Elite',
    color: 'Azul',
    status: 'rejected',
    plate: 'LD-99-GH'
  }
]

// ====================== ADMIN ======================
export const admin: AdminInterface[] = [
  {
    ...users[2],
    role: 'superadmin',
    permissions: [{ value: 'manage_all', label: 'Gerenciar Tudo' }]
  },
  {
    ...users[3],
    role: 'manager',
    permissions: [
      { value: 'manage_users', label: 'Gerenciar Usuários' },
      {
        value: 'assign_roles_permissions',
        label: 'Atribuir Funções e Permissões'
      }
    ]
  }
]

// ====================== DRIVERS ======================
export const drivers: DriverInterface[] = [
  {
    ...users[4],
    vehicle: vehicles[0],
    is_online: true,
    rating: 4.7
  },
  {
    ...users[5],
    vehicle: vehicles[1],
    is_online: false,
    rating: 4.9
  }
]

// ====================== DOCUMENTS ======================
export const documents: DocumentInterface[] = [
  {
    id: 'd1',
    user: users[4],
    type: 'driver_license',
    url: 'https://placehold.co/300x200',
    status: 'approved',
    created_at: new Date()
  },
  {
    id: 'd2',
    user: users[4],
    type: 'id_front',
    url: 'https://placehold.co/300x200',
    status: 'pending',
    created_at: new Date()
  },
  {
    id: 'd3',
    user: users[4],
    type: 'id_back',
    url: 'https://placehold.co/300x200',
    status: 'rejected',
    feedback: 'Documento ilegível',
    created_at: new Date()
  },
  {
    id: 'd4',
    user: users[5],
    type: 'vehicle_booklet',
    url: 'https://placehold.co/300x200',
    vehicle_id: 'v1',
    status: 'approved',
    created_at: new Date()
  }
]

// ====================== TRANSACTIONS ======================
export const transactions: TransactionInterface[] = [
  {
    id: 't1',
    wallet_id: 'w1',
    type: 'credit',
    category: 'wallet_topup',
    amount: 5000,
    description: 'Carregamento aprovado via referência bancária',
    reference_id: 'req1', // relaciona com WalletTopupRequest
    created_at: new Date()
  },
  {
    id: 't2',
    wallet_id: 'w2',
    type: 'debit',
    category: 'ride_fee',
    amount: 1000,
    description: 'Taxa de corrida (25% + 2% pensão)',
    reference_id: 'ride123',
    created_at: new Date()
  },
  {
    id: 't3',
    wallet_id: 'w2',
    type: 'credit',
    category: 'bonus',
    amount: 200,
    description: 'Bónus semanal por desempenho',
    created_at: new Date()
  },
  {
    id: 't4',
    wallet_id: 'w1',
    type: 'refund',
    category: 'refund',
    amount: 1500,
    description: 'Estorno por corrida cancelada',
    reference_id: 'ride456',
    created_at: new Date()
  }
]

// ====================== NOTIFICATIONS ======================
export const notifications: NotificationInterface[] = [
  {
    id: 'n1',
    title: 'Nova corrida disponível',
    message: 'Tem uma nova solicitação de entrega próxima.',
    type: 'ride',
    category: 'driver',
    specific_user: true,
    user: users[4],
    created_at: new Date()
  },
  {
    id: 'n2',
    title: 'Documento aprovado',
    message: 'Sua carta de condução foi aprovada.',
    type: 'document',
    category: 'driver',
    specific_user: true,
    user: users[5],
    created_at: new Date()
  },
  {
    id: 'n3',
    title: 'Carregamento pendente',
    message: 'Seu carregamento de 5000 Kz está em análise.',
    type: 'wallet',
    category: 'driver',
    specific_user: true,
    user: users[5],
    created_at: new Date()
  },
  {
    id: 'n4',
    title: 'Nova atualização',
    message: 'Aplicativo atualizado para versão 1.0.5',
    type: 'system',
    category: 'all',
    created_at: new Date()
  }
]

// ====================== RIDES ======================
export const rides: RideInterface[] = [
  {
    id: 'r1',
    user: users[2],
    driver: drivers[0],
    pickup: {
      name: 'Bengo, Luanda',
      description: 'Kinaxixi',
      place_id: 'loc123',
      latitude: -8.836,
      longitude: 13.234
    },
    dropoff: {
      name: 'Angola, Luanda',
      description: 'Kilamba',
      place_id: 'loc124',
      latitude: -8.95,
      longitude: 13.315
    },
    status: 'completed',
    fare: {
      total: 3000,
      breakdown: {
        base_fare: 1000,
        distance_cost: 1500,
        wait_cost: 200,
        insurance_fee: 300
      },
      payouts: {
        driver_earnings: 2100,
        company_earnings: 600,
        pension_fund: 300
      }
    },
    distance: 15,
    duration: 30,
    type: 'car'
  },
  {
    id: 'r2',
    user: users[3],
    driver: drivers[1],
    pickup: {
      name: 'Luanda, Maianga',
      description: 'Maianga',
      place_id: 'loc125',
      latitude: -8.813,
      longitude: 13.25
    },
    dropoff: {
      name: 'Cazenga, Luanda',
      description: 'Cazenga',
      place_id: 'loc126',
      latitude: -8.8,
      longitude: 13.35
    },
    status: 'pending',
    fare: {
      total: 2000,
      breakdown: {
        base_fare: 800,
        distance_cost: 900,
        wait_cost: 100,
        insurance_fee: 200
      },
      payouts: {
        driver_earnings: 1400,
        company_earnings: 400,
        pension_fund: 200
      }
    },
    distance: 10,
    duration: 20,
    type: 'motorcycle'
  },
  {
    id: 'r3',
    user: users[3],
    driver: drivers[0],
    pickup: {
      name: 'Rua Samba, Luanda',
      description: 'Samba',
      place_id: 'loc127',
      latitude: -8.85,
      longitude: 13.29
    },
    dropoff: {
      name: 'Benfica, Talatona',
      description: 'Talatona',
      place_id: 'loc128',
      latitude: -8.9,
      longitude: 13.34
    },
    status: 'canceled',
    fare: {
      total: 0,
      breakdown: {
        base_fare: 0,
        distance_cost: 0,
        wait_cost: 0,
        insurance_fee: 0
      },
      payouts: {
        driver_earnings: 0,
        company_earnings: 0,
        pension_fund: 0
      }
    },
    distance: 8,
    duration: 15,
    type: 'car',
    created_at: new Date()
  },
  {
    id: 'r4',
    user: users[2],
    driver: drivers[1],
    pickup: {
      name: 'Rua Mutamba, Luanda',
      description: 'Mutamba',
      place_id: 'loc129',
      latitude: -8.81,
      longitude: 13.24
    },
    dropoff: {
      name: 'Primeiro de Maio, Luanda',
      description: 'Aeroporto',
      place_id: 'loc130',
      latitude: -8.85,
      longitude: 13.3
    },
    status: 'driver_on_the_way',
    fare: {
      total: 2500,
      breakdown: {
        base_fare: 900,
        distance_cost: 1100,
        wait_cost: 200,
        insurance_fee: 300
      },
      payouts: {
        driver_earnings: 1750,
        company_earnings: 500,
        pension_fund: 250
      }
    },
    distance: 12,
    duration: 25,
    type: 'motorcycle',
    created_at: new Date()
  }
]

// ====================== RIDE RATES ======================
export const rideRates: RideRatesInterface[] = [
  {
    id: 'rate1',
    day_rates: {
      start_time: '06:00',
      end_time: '18:00',
      base_fare: 500,
      price_per_km: 150,
      wait_time_free_minutes: 5,
      price_per_minute: 50
    },
    night_rates: {
      start_time: '18:00',
      end_time: '06:00',
      base_fare: 700,
      price_per_km: 200,
      wait_time_free_minutes: 3,
      price_per_minute: 70
    },
    insurance_percent: 5,
    payouts: {
      driver_percent: 80,
      company_percent: 15,
      pension_fund_percent: 5
    },
    updated_at: new Date()
  }
]

// ====================== RIDE TRACKING ======================
export const rideTrackings: RideTrackingsInterface[] = [
  {
    id: 'rt1',
    ride_id: 'r1',
    path: [
      {
        latitude: -8.836,
        longitude: 13.234,
        timestamp: new Date('2025-09-12T10:00:00Z')
      },
      {
        latitude: -8.87,
        longitude: 13.26,
        timestamp: new Date('2025-09-12T10:10:00Z')
      },
      {
        latitude: -8.9,
        longitude: 13.3,
        timestamp: new Date('2025-09-12T10:20:00Z')
      },
      {
        latitude: -8.95,
        longitude: 13.315,
        timestamp: new Date('2025-09-12T10:30:00Z')
      }
    ],
    created_at: new Date()
  },
  {
    id: 'rt2',
    ride_id: 'r2',
    path: [
      {
        latitude: -8.813,
        longitude: 13.25,
        timestamp: new Date('2025-09-12T11:00:00Z')
      },
      {
        latitude: -8.805,
        longitude: 13.3,
        timestamp: new Date('2025-09-12T11:08:00Z')
      },
      {
        latitude: -8.8,
        longitude: 13.35,
        timestamp: new Date('2025-09-12T11:15:00Z')
      }
    ],
    created_at: new Date()
  },
  {
    id: 'rt3',
    ride_id: 'r4',
    path: [
      {
        latitude: -8.81,
        longitude: 13.24,
        timestamp: new Date('2025-09-12T12:00:00Z')
      },
      {
        latitude: -8.825,
        longitude: 13.265,
        timestamp: new Date('2025-09-12T12:07:00Z')
      },
      {
        latitude: -8.84,
        longitude: 13.285,
        timestamp: new Date('2025-09-12T12:14:00Z')
      },
      {
        latitude: -8.85,
        longitude: 13.3,
        timestamp: new Date('2025-09-12T12:20:00Z')
      }
    ],
    created_at: new Date()
  }
]

// ====================== WALLET ======================
export const wallets: WalletInterface[] = [
  {
    id: 'w1',
    user: drivers[0],
    balance: 120500,
    status: 'active',
    currency: 'AOA',
    created_at: new Date()
  },
  {
    id: 'w2',
    user: drivers[1],
    balance: 80500,
    status: 'active',
    currency: 'AOA',
    created_at: new Date()
  }
]

export const walletTopupRequests: WalletTopupRequestInterface[] = [
  {
    id: 'req1',
    wallet_id: 'w1',
    amount: 5000,
    method: 'bank_transfer',
    proof_url: 'https://cdn.app.com/proofs/proof1.png',
    status: 'approved',
    created_at: new Date('2025-09-01T10:00:00Z'),
    updated_at: new Date('2025-09-01T12:00:00Z'),
    reviewed_by: admin[0]
  },
  {
    id: 'req2',
    wallet_id: 'w2',
    amount: 3000,
    method: 'bank_transfer',
    proof_url: 'https://cdn.app.com/proofs/proof2.png',
    status: 'pending',
    created_at: new Date('2025-09-12T15:30:00Z')
  },
  {
    id: 'req3',
    wallet_id: 'w1',
    amount: 2000,
    method: 'bank_transfer',
    status: 'rejected',
    created_at: new Date('2025-09-10T11:00:00Z'),
    updated_at: new Date('2025-09-10T13:00:00Z'),
    reviewed_by: admin[1]
  }
]

// src/mocks/driver.mock.ts

// src/mocks/driver.mock.ts
export const driverMock = {
  id: 'DRV123456',
  name: 'Esther Howard',
  avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
  email: 'e.howard@example.com',
  phone: '+27 603 555 0123',
  address: '775 Rolling Green Rd.',
  memberSince: '2024-04-15',
  status: 'Active',
  createdAt: '20/07/2025',
  isOnline: 'online',

  // Dados da carteira
  wallet: {
    balance: 1500.75,
    currency: 'EUR',
    lastUpdated: '2025-09-15'
  },

  // Transações
  transactions: [
    {
      id: 'TX001',
      type: 'Deposit',
      amount: 300,
      date: '2025-09-12',
      status: 'Completed'
    },
    {
      id: 'TX002',
      type: 'Withdrawal',
      amount: 100,
      date: '2025-09-10',
      status: 'Pending'
    },
    {
      id: 'TX003',
      type: 'Ride Payment',
      amount: 25.5,
      date: '2025-09-09',
      status: 'Completed'
    }
  ],

  // Solicitações de carregamento
  topUps: [
    {
      id: 'TOP001',
      amount: 200,
      method: 'Bank Transfer',
      requestedAt: '2025-09-05',
      status: 'Approved'
    },
    {
      id: 'TOP002',
      amount: 150,
      method: 'Mobile Money',
      requestedAt: '2025-08-30',
      status: 'Rejected'
    }
  ],

  // Corridas
  rides: [
    {
      id: 'RIDE001',
      passenger: 'John Doe',
      start: 'Cape Town - CBD',
      end: 'Claremont',
      fare: 12.5,
      date: '2025-09-12',
      status: 'Completed'
    },
    {
      id: 'RIDE002',
      passenger: 'Maria Lopez',
      start: 'Sea Point',
      end: 'Camps Bay',
      fare: 8.75,
      date: '2025-09-10',
      status: 'Cancelled'
    }
  ],

  // Veículos
  vehicles: [
    {
      id: 'VEH001',
      brand: 'Mini',
      model: 'Cooper S Clubman',
      year: 2023,
      fuel: 'Gas',
      engine: '2.0L',
      transmission: 'Automatic',
      color: 'Grey',
      plate: 'XYZ98765432109876',
      active: true,
      documents: [
        {
          id: 'DOC001',
          type: 'Insurance',
          issuedAt: '2025-01-10',
          expiresAt: '2026-01-10',
          status: 'Valid'
        },
        {
          id: 'DOC002',
          type: 'Registration',
          issuedAt: '2024-12-20',
          expiresAt: '2025-12-20',
          status: 'Valid'
        }
      ]
    },
    {
      id: 'VEH002',
      brand: 'Toyota',
      model: 'Corolla',
      year: 2021,
      fuel: 'Petrol',
      engine: '1.8L',
      transmission: 'Manual',
      color: 'White',
      plate: 'ABC1234567890',
      active: false,
      documents: [
        {
          id: 'DOC003',
          type: 'Insurance',
          issuedAt: '2024-03-15',
          expiresAt: '2025-03-15',
          status: 'Expired'
        }
      ]
    }
  ],

  // Documentos do motorista
  driverDocuments: [
    {
      id: 'DDOC001',
      type: 'Driver License',
      issuedAt: '2022-06-01',
      expiresAt: '2027-06-01',
      status: 'Valid'
    },
    {
      id: 'DDOC002',
      type: 'Background Check',
      issuedAt: '2024-01-15',
      expiresAt: '2026-01-15',
      status: 'Valid'
    }
  ]
}
