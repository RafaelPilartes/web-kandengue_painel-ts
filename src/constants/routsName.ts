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
      view: '/users/passengers/:clientId',
      viewStr: '/users/passengers/view/',
      create: '/users/passengers/create',
      edit: '/users/passengers/edit/:clientId'
    },

    drivers: {
      index: '/users/drivers',
      view: '/users/drivers/:driverId',
      viewStr: '/users/drivers/view/',
      create: '/users/drivers/create',
      edit: '/users/drivers/edit/:driverId'
    },

    admins: {
      index: '/users/admins',
      view: '/users/admins/:adminId',
      viewStr: '/users/admins/view/',
      create: '/users/admins/create',
      edit: '/users/admins/edit/:adminId'
    }
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
    reports: '/rides/reports'
  },

  // ============================================
  // FINANCEIRO
  finance: {
    index: '/finance',
    wallet: '/wallet',

    reports: {
      index: '/finance/reports'
    }
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
  }
}
