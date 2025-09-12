import type { AdminInterface } from '@/interfaces/IAdmin'
import type { DocumentInterface } from '@/interfaces/IDocument'
import type { DriverInterface } from '@/interfaces/IDriver'
import type { NotificationInterface } from '@/interfaces/INotification'
import type { RideInterface } from '@/interfaces/IRide'
import type { RideRatesInterface } from '@/interfaces/IRideRates'
import type { RideTrackingInterface } from '@/interfaces/IRideTracking'
import type { TransactionInterface } from '@/interfaces/ITransaction'
import type { UserInterface } from '@/interfaces/IUser'
import type { VehicleInterface } from '@/interfaces/IVehicle'
import type { WalletInterface } from '@/interfaces/IWallet'

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
    type: 'car',
    brand: 'Toyota',
    model: 'Corolla',
    color: 'Preto',
    plate: 'LD-34-AB',
    image: 'https://placehold.co/200x100',
    created_at: new Date()
  },
  {
    id: 'v2',
    type: 'motorcycle',
    brand: 'Honda',
    model: 'Wave 125',
    color: 'Vermelha',
    plate: 'LD-11-CD',
    created_at: new Date()
  },
  {
    id: 'v3',
    type: 'truck',
    brand: 'Volvo',
    model: 'FH',
    color: 'Branco',
    plate: 'LD-55-EF'
  },
  {
    id: 'v4',
    type: 'bicycle',
    brand: 'Caloi',
    model: 'Elite',
    color: 'Azul',
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
    uploaded_at: new Date(),
    created_at: new Date()
  },
  {
    id: 'd2',
    user: users[4],
    type: 'id_front',
    url: 'https://placehold.co/300x200',
    status: 'pending',
    uploaded_at: new Date(),
    created_at: new Date()
  },
  {
    id: 'd3',
    user: users[4],
    type: 'id_back',
    url: 'https://placehold.co/300x200',
    status: 'rejected',
    feedback: 'Documento ilegível',
    uploaded_at: new Date(),
    created_at: new Date()
  },
  {
    id: 'd4',
    user: users[5],
    type: 'vehicle_booklet',
    url: 'https://placehold.co/300x200',
    status: 'approved',
    uploaded_at: new Date(),
    created_at: new Date()
  }
]

// ====================== TRANSACTIONS ======================
export const transactions: TransactionInterface[] = [
  {
    id: 't1',
    driver: drivers[0],
    type: 'credit',
    category: 'loading_wallet',
    amount: 5000,
    description: 'Carregamento via referência',
    created_at: new Date()
  },
  {
    id: 't2',
    driver: drivers[1],
    type: 'debit',
    category: 'service_fee',
    amount: 1000,
    description: 'Taxa de corrida',
    created_at: new Date()
  },
  {
    id: 't3',
    driver: drivers[1],
    type: 'credit',
    category: 'bonus',
    amount: 200,
    description: 'Bónus semanal',
    created_at: new Date()
  },
  {
    id: 't4',
    driver: drivers[0],
    type: 'debit',
    category: 'bonus',
    amount: 1500,
    description: 'Bónus semanal',
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
      description: 'Kinaxixi',
      place_id: 'loc123',
      latitude: -8.836,
      longitude: 13.234
    },
    dropoff: {
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
      description: 'Maianga',
      place_id: 'loc125',
      latitude: -8.813,
      longitude: 13.25
    },
    dropoff: {
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
      description: 'Samba',
      place_id: 'loc127',
      latitude: -8.85,
      longitude: 13.29
    },
    dropoff: {
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
      description: 'Mutamba',
      place_id: 'loc129',
      latitude: -8.81,
      longitude: 13.24
    },
    dropoff: {
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
      price_per_Km: 150,
      wait_time_free_minutes: 5,
      price_per_minute: 50
    },
    night_rates: {
      start_time: '18:00',
      end_time: '06:00',
      base_fare: 700,
      price_per_Km: 200,
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
export const rideTracking: RideTrackingInterface[] = [
  {
    id: 'track1',
    rideId: 'ride1',
    path: [
      { latitude: -8.8383, longitude: 13.2344 },
      { latitude: -8.839, longitude: 13.235 },
      { latitude: -8.84, longitude: 13.236 }
    ]
  },
  {
    id: 'track2',
    rideId: 'ride2',
    path: [
      { latitude: -8.8422, longitude: 13.2456 },
      { latitude: -8.843, longitude: 13.2465 },
      { latitude: -8.8445, longitude: 13.2478 }
    ]
  }
]

// ====================== WALLET ======================
export const wallets: WalletInterface[] = [
  {
    id: 'wallet1',
    user: drivers[0],
    balance: 120500,
    status: 'active',
    currency: 'AOA',
    created_at: new Date()
  },
  {
    id: 'wallet2',
    user: drivers[1],
    balance: 80500,
    status: 'active',
    currency: 'AOA',
    created_at: new Date()
  }
]
