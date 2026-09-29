// constants/firebaseCollections.ts
export const firebaseCollections = {
  // ============================================
  // USERS
  users: {
    root: 'users',
    single: (userId: string) => `users/${userId}`,
    documents: (userId: string) => `users/${userId}/documents`,
    transactions: (userId: string) => `users/${userId}/transactions`,
    notifications: (userId: string) => `users/${userId}/notifications`
  },

  // ============================================
  // ADMIN
  admins: {
    root: 'admins',
    single: (adminId: string) => `admins/${adminId}`
  },

  // ============================================
  // DRIVERS
  drivers: {
    root: 'drivers',
    single: (driverId: string) => `drivers/${driverId}`
  },

  // ============================================
  // VEHICLES
  vehicles: {
    root: 'vehicles',
    single: (vehicleId: string) => `vehicles/${vehicleId}`,
    documents: (vehicleId: string) => `vehicles/${vehicleId}/documents`
  },

  // ============================================
  // RIDES
  rides: {
    root: 'rides',
    single: (rideId: string) => `rides/${rideId}`
  },

  // =============================================
  // RIDERATES
  rideRates: {
    root: 'rideRates',
    single: (rideRateId: string) => `rideRates/${rideRateId}`
  },

  // =============================================
  // RIDETRACKINGS
  rideTrackings: {
    root: 'rideTrackings',
    single: (rideTrackingId: string) => `rideTrackings/${rideTrackingId}`
  },

  // ============================================
  // TRANSACTIONS
  transactions: {
    root: 'transactions',
    single: (transactionId: string) => `transactions/${transactionId}`
  },

  // ============================================
  // WALLET
  wallets: {
    root: 'wallets',
    single: (walletId: string) => `wallets/${walletId}`
  },

  // =============================================
  // WALLET TOPUP REQUESTS
  requests: {
    root: 'topupRequests',
    single: (requestId: string) => `topupRequests/${requestId}`
  },

  // ============================================
  // DOCUMENTS
  documents: {
    root: 'documents',
    single: (documentId: string) => `documents/${documentId}`
  },

  // ============================================
  // NOTIFICATIONS
  notifications: {
    root: 'notifications',
    single: (notificationId: string) => `notifications/${notificationId}`
  },

  // ============================================
  // RATES
  rates: {
    root: 'rates',
    current: 'rates/current'
  },

  // ============================================
  // APPLICATIONS
  applications: {
    root: 'applications',
    single: (applicationId: string) => `applications/${applicationId}`
  },

  // ============================================
  // SYSTEM LOGS
  logs: {
    root: 'logs',
    single: (logId: string) => `logs/${logId}`
  },

  // ============================================
  // MISSIONS
  missions: {
    root: 'missions',
    single: (missionId: string) => `missions/${missionId}`
  },

  missionProgress: {
    root: 'missionProgress',
    single: (progressId: string) => `missionProgress/${progressId}`
  },

  // ============================================
  // AUDIT LOGS
  auditLogs: {
    root: 'auditLogs',
    single: (logId: string) => `auditLogs/${logId}`
  },

  // ============================================
  // PROMOTIONS
  promotions: {
    root: 'promotions',
    single: (code: string) => `promotions/${code}`,
    counters: (code: string) => `promotions/${code}/counters`,
    counterShard: (code: string, shard: string) =>
      `promotions/${code}/counters/${shard}`,
    allowedUsers: (code: string) => `promotions/${code}/allowed_users`,
    allowedUser: (code: string, userId: string) =>
      `promotions/${code}/allowed_users/${userId}`
  },

  // ============================================
  // PROMOTION USAGES
  promotionUsages: {
    root: 'promotion_usages',
    single: (id: string) => `promotion_usages/${id}`
  },

  // ============================================
  // REFERRAL EARNINGS
  referralEarnings: {
    root: 'referral_earnings',
    single: (id: string) => `referral_earnings/${id}`
  },

  // ============================================
  // WITHDRAWAL REQUESTS
  withdrawalRequests: {
    root: 'withdrawal_requests',
    single: (id: string) => `withdrawal_requests/${id}`
  },

  // ============================================
  // APP CONFIG
  appConfig: {
    root: 'app_config',
    single: (id: string) => `app_config/${id}`,
    referralSettings: 'app_config/referral_settings'
  },

  // ============================================
  // MOTOR DE PREÇOS — escritos pela API (Admin SDK), aqui só leitura.
  pricingProfiles: {
    root: 'pricingProfiles',
    single: (profileId: string) => `pricingProfiles/${profileId}`
  },
  pricingRules: {
    root: 'pricingRules',
    single: (ruleId: string) => `pricingRules/${ruleId}`
  },
  weatherStates: {
    root: 'weatherStates',
    single: (region: string) => `weatherStates/${region}`
  },
  fareQuotes: {
    root: 'fareQuotes',
    single: (quoteId: string) => `fareQuotes/${quoteId}`
  },
  pricingAuditLogs: {
    root: 'pricingAuditLogs',
    single: (logId: string) => `pricingAuditLogs/${logId}`
  }
}
