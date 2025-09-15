import type { IUserRepository } from '@/core/interfaces/IUserRepository'
import { FirebaseUserDAO } from './firebase/users.dao'
import type { IAdminRepository } from '@/core/interfaces/IAdminRepository'
import { FirebaseAdminDAO } from './firebase/admins.dao'
import type { IDocumentRepository } from '@/core/interfaces/IDocumentRepository'
import { FirebaseDocumentDAO } from './firebase/document.dao'
import type { IDriverRepository } from '@/core/interfaces/IDriverRepository'
import { FirebaseDriverDAO } from './firebase/driver.dao'
import type { INotificationRepository } from '@/core/interfaces/INotificationRepository'
import { FirebaseNotificationDAO } from './firebase/notification.dao'
import type { IRideRateRepository } from '@/core/interfaces/IRideRateRepository'
import { FirebaseRideDAO } from './firebase/ride.dao'
import type { IRideRepository } from '@/core/interfaces/IRideRepository'
import { FirebaseRideRateDAO } from './firebase/rideRate.dao'
import type { IRideTrackingRepository } from '@/core/interfaces/IRideTrackingRepository'
import { FirebaseRideTrackingDAO } from './firebase/rideTracking.dao'
import type { ITransactionRepository } from '@/core/interfaces/ITransactionRepository'
import { FirebaseTransactionDAO } from './firebase/transaction.dao'
import type { IVehicleRepository } from '@/core/interfaces/IVehicleRepository'
import { FirebaseVehicleDAO } from './firebase/vehicle.dao'
import type { IWalletRepository } from '@/core/interfaces/IWalletRepository'
import { FirebaseWalletDAO } from './firebase/wallet.dao'
import type { IWalletTopupRequestRepository } from '@/core/interfaces/IWalletTopupRequestRepository'
import { FirebaseWalletTopupRequestDAO } from './firebase/walletTopupRequest.dao'
// import { RestUserDAO } from "./rest/users.dao"; // Futuro

// Factory para escolher implementação
export const userRepository: IUserRepository = new FirebaseUserDAO()
export const adminRepository: IAdminRepository = new FirebaseAdminDAO()
export const documentRepository: IDocumentRepository = new FirebaseDocumentDAO()
export const driverRepository: IDriverRepository = new FirebaseDriverDAO()
export const notificationRepository: INotificationRepository =
  new FirebaseNotificationDAO()
export const rideRepository: IRideRepository = new FirebaseRideDAO()
export const rideRateRepository: IRideRateRepository = new FirebaseRideRateDAO()
export const rideTrackingRepository: IRideTrackingRepository =
  new FirebaseRideTrackingDAO()
export const transactionRepository: ITransactionRepository =
  new FirebaseTransactionDAO()
export const vehicleRepository: IVehicleRepository = new FirebaseVehicleDAO()
export const walletRepository: IWalletRepository = new FirebaseWalletDAO()
export const walletTopupRequestRepository: IWalletTopupRequestRepository =
  new FirebaseWalletTopupRequestDAO()
