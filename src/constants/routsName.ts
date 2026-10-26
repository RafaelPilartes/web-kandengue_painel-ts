// constants/routsName.ts
export const routsNameMain = {
  home: `/`,
  admin: `/admin`,
  login: `/login`,

  // ============================================
  // DASHBOARD
  dashboard: `/`,

  // ============================================
  // USUÁRIOS
  users: {
    passengers: {
      index: '/users/passengers',
      view: '/users/passengers/view/:clientId',
      viewStr: '/users/passengers/view/',
      create: '/users/passengers/create',
      edit: '/users/passengers/edit/:clientId'
    },

    drivers: {
      index: '/users/drivers',
      view: '/users/drivers/view/:driverId',
      viewStr: '/users/drivers/view/',
      create: '/users/drivers/create',
      edit: '/users/drivers/edit/:driverId'
    },

    admins: {
      index: '/users/admins',
      view: '/users/admins/view/:adminId',
      viewStr: '/users/admins/view/',
      create: '/users/admins/create',
      edit: '/users/admins/edit/:adminId'
    },
    applications: {
      index: '/applications',
      view: '/applications/view/:applicationId',
      viewStr: '/applications/view/'
    }
  },

  // ============================================
  // DEPARTMENTS
  departments: {
    index: '/departments'
  },

  // ============================================
  // VIATURAS — fila de validação
  vehicles: {
    index: '/vehicles'
  },

  // ============================================
  // CORRIDAS
  rides: {
    index: '/rides',
    create: '/rides/create',
    edit: '/rides/edit/:deliveryId',
    editStr: '/rides/edit/',
    view: '/rides/view/:deliveryId',
    viewStr: '/rides/view/',

    realtime: '/rides/realtime',
    // Corridas em que o servidor marcou o fecho da tarifa para confirmação.
    fareReview: '/rides/fare-review'
  },

  // ============================================
  // FINANCEIRO
  finance: {
    index: '/finance',
    wallet: '/wallet',
    walletTopupRequest: '/wallet/topup/request',
    // Motoristas abaixo do mínimo de dispatch.
    balances: '/finance/balances',

    reports: {
      index: '/finance/reports'
    }
  },

  // ============================================
  // PREÇOS — perfis por corrida × veículo e regras de acréscimo
  pricing: {
    profiles: '/pricing/profiles',
    profileCreate: '/pricing/profiles/new',
    profileEdit: '/pricing/profiles/edit/:profileId',
    profileEditStr: '/pricing/profiles/edit/',
    rules: '/pricing/rules',
    // Estado do clima e a chuva manual.
    weather: '/pricing/weather',
    // Simulador de tarifas: só leitura, não grava nada.
    simulator: '/pricing/simulator',
    ruleCreate: '/pricing/rules/new',
    ruleEdit: '/pricing/rules/edit/:ruleId',
    ruleEditStr: '/pricing/rules/edit/'
  },

  // ============================================
  // CONFIGURAÇÕES
  settings: {
    index: '/settings/general',
    appearance: '/settings/appearance',
    api: '/settings/api-keys',
    emails: '/settings/email-templates'
  },

  // ============================================
  // NOTIFICAÇÕES
  notifications: {
    index: '/notifications',
    view: '/notifications/:notificationId'
  },

  // ============================================
  // METRICS
  metrics: {
    index: '/metrics'
  },

  // ============================================
  // CHAT
  chat: {
    index: '/chat'
  },

  // ============================================
  // LOGS
  logs: {
    index: '/logs'
  },

  // ============================================
  // MISSIONS
  missions: {
    index: '/missions'
  },

  // ============================================
  // PROMOTIONS
  promotions: {
    index: '/promotions',
    create: '/promotions/create',
    view: '/promotions/view/:code',
    viewStr: '/promotions/view/',
    edit: '/promotions/edit/:code',
    editStr: '/promotions/edit/'
  },

  // ============================================
  // REFERRAL — saques de ganhos de referência
  referral: {
    withdrawals: {
      index: '/referral/withdrawals',
      view: '/referral/withdrawals/view/:withdrawalId',
      viewStr: '/referral/withdrawals/view/'
    }
  }
}
