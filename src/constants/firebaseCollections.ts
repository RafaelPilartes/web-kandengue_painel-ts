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
  }
}
