import type { IVehicleRepository } from '@/core/interfaces/IVehicleRepository'
import { FirebaseVehicleDAO } from './firebase/vehicle.dao'
import type { IMissionProgressRepository } from '@/core/interfaces/IMissionProgressRepository'
import { FirebaseMissionProgressDAO } from './firebase/missionProgress.dao'
import type { IAdminRepository } from '@/core/interfaces/IAdminRepository'
import { FirebaseAdminDAO } from './firebase/admins.dao'
import type { IAppConfigRepository } from '@/core/interfaces/IAppConfigRepository'
import { FirebaseAppConfigDAO } from './firebase/appConfig.dao'
import type { IApplicationRepository } from '@/core/interfaces/IApplicationRepository'
import { FirebaseApplicationDAO } from './firebase/application.dao'
import type { IDocumentRepository } from '@/core/interfaces/IDocumentRepository'
import { FirebaseDocumentDAO } from './firebase/document.dao'
import type { IDriverRepository } from '@/core/interfaces/IDriverRepository'
import { FirebaseDriverDAO } from './firebase/driver.dao'
import type { IFileRepository } from '@/core/interfaces/IFileRepository'
import { FirebaseFileDAO } from './firebase/file.dao'
import type { IMissionRepository } from '@/core/interfaces/IMissionRepository'
import { FirebaseMissionDAO } from './firebase/mission.dao'
import type { INotificationRepository } from '@/core/interfaces/INotificationRepository'
import { FirebaseNotificationDAO } from './firebase/notification.dao'
import type { IPromotionRepository } from '@/core/interfaces/IPromotionRepository'
import { FirebasePromotionDAO } from './firebase/promotion.dao'
import type { IRideRepository } from '@/core/interfaces/IRideRepository'
import { FirebaseRideDAO } from './firebase/ride.dao'
import type { IRideRateRepository } from '@/core/interfaces/IRideRateRepository'
import { FirebaseRideRateDAO } from './firebase/rideRate.dao'
import type { IRideTrackingRepository } from '@/core/interfaces/IRideTrackingRepository'
import { FirebaseRideTrackingDAO } from './firebase/rideTracking.dao'
import type { ITransactionRepository } from '@/core/interfaces/ITransactionRepository'
import { FirebaseTransactionDAO } from './firebase/transaction.dao'
import type { IUserRepository } from '@/core/interfaces/IUserRepository'
import { FirebaseUserDAO } from './firebase/users.dao'
import type { IWalletRepository } from '@/core/interfaces/IWalletRepository'
import { FirebaseWalletDAO } from './firebase/wallet.dao'
import type { IWalletTopupRequestRepository } from '@/core/interfaces/IWalletTopupRequestRepository'
import { FirebaseWalletTopupRequestDAO } from './firebase/walletTopupRequest.dao'
import type { IWithdrawalRepository } from '@/core/interfaces/IWithdrawalRepository'
import { FirebaseWithdrawalDAO } from './firebase/withdrawal.dao'
import type { IPushNotificationRepository } from '@/core/interfaces/IPushNotificationRepository'
import { PushNotificationDAO } from './rest/pushNotification.dao'
import type { IAdminConfigRepository } from '@/core/interfaces/IAdminConfigRepository'
import type { IAdminMoneyRepository } from '@/core/interfaces/IAdminMoneyRepository'
import type { IAdminDriverRepository } from '@/core/interfaces/IAdminDriverRepository'
import type { IAdminRideRepository } from '@/core/interfaces/IAdminRideRepository'
import type { IAdminVehicleRepository } from '@/core/interfaces/IAdminVehicleRepository'
import type { IAdminMissionRepository } from '@/core/interfaces/IAdminMissionRepository'
import type { IAdminNotificationRepository } from '@/core/interfaces/IAdminNotificationRepository'
import type { IAdminPromotionRepository } from '@/core/interfaces/IAdminPromotionRepository'
import { AdminConfigDAO } from './rest/adminConfig.dao'
import { AdminMissionDAO } from './rest/adminMission.dao'
import { AdminNotificationDAO } from './rest/adminNotification.dao'
import { AdminPromotionDAO } from './rest/adminPromotion.dao'
import { AdminMoneyDAO } from './rest/adminMoney.dao'
import { AdminDriverDAO } from './rest/adminDriver.dao'
import { AdminRideDAO } from './rest/adminRide.dao'
import { AdminVehicleDAO } from './rest/adminVehicle.dao'
import type { IPricingRepository } from '@/core/interfaces/IPricingRepository'
import { PricingDAO } from './rest/pricing.dao'

/**
 * Getters lazy e memoizados. Vive fora de `index.ts` de propósito: aquele
 * módulo instancia ~20 DAOs no import, e importá-lo anularia a preguiça.
 * Cada DAO migrado acrescenta aqui o seu campo e desaparece de `index.ts`.
 *
 * O `auditLog.dao.ts` fica fora: é consumido apenas por
 * `src/observability/audit.ts`, que é transversal e não entra nesta
 * migração.
 */
class ApiFactory {
  private _vehicles?: IVehicleRepository
  private _missionProgress?: IMissionProgressRepository
  private _admins?: IAdminRepository
  private _appConfig?: IAppConfigRepository
  private _applications?: IApplicationRepository
  private _documents?: IDocumentRepository
  private _drivers?: IDriverRepository
  private _files?: IFileRepository
  private _missions?: IMissionRepository
  private _notifications?: INotificationRepository
  private _promotions?: IPromotionRepository
  private _rides?: IRideRepository
  private _rideRates?: IRideRateRepository
  private _rideTrackings?: IRideTrackingRepository
  private _transactions?: ITransactionRepository
  private _users?: IUserRepository
  private _wallets?: IWalletRepository
  private _walletTopupRequests?: IWalletTopupRequestRepository
  private _withdrawals?: IWithdrawalRepository
  private _pushNotifications?: IPushNotificationRepository
  private _adminMoney?: IAdminMoneyRepository
  private _adminVehicle?: IAdminVehicleRepository
  private _adminDriver?: IAdminDriverRepository
  private _adminRide?: IAdminRideRepository
  private _adminConfig?: IAdminConfigRepository
  private _adminPromotions?: IAdminPromotionRepository
  private _adminMissions?: IAdminMissionRepository
  private _adminNotifications?: IAdminNotificationRepository
  private _pricing?: IPricingRepository

  get vehicles(): IVehicleRepository {
    return (this._vehicles ??= new FirebaseVehicleDAO())
  }

  get missionProgress(): IMissionProgressRepository {
    return (this._missionProgress ??= new FirebaseMissionProgressDAO())
  }

  get admins(): IAdminRepository {
    return (this._admins ??= new FirebaseAdminDAO())
  }

  get appConfig(): IAppConfigRepository {
    return (this._appConfig ??= new FirebaseAppConfigDAO())
  }

  get applications(): IApplicationRepository {
    return (this._applications ??= new FirebaseApplicationDAO())
  }

  get documents(): IDocumentRepository {
    return (this._documents ??= new FirebaseDocumentDAO())
  }

  get drivers(): IDriverRepository {
    return (this._drivers ??= new FirebaseDriverDAO())
  }

  get files(): IFileRepository {
    return (this._files ??= new FirebaseFileDAO())
  }

  get missions(): IMissionRepository {
    return (this._missions ??= new FirebaseMissionDAO())
  }

  get notifications(): INotificationRepository {
    return (this._notifications ??= new FirebaseNotificationDAO())
  }

  get promotions(): IPromotionRepository {
    return (this._promotions ??= new FirebasePromotionDAO())
  }

  get rides(): IRideRepository {
    return (this._rides ??= new FirebaseRideDAO())
  }

  get rideRates(): IRideRateRepository {
    return (this._rideRates ??= new FirebaseRideRateDAO())
  }

  get rideTrackings(): IRideTrackingRepository {
    return (this._rideTrackings ??= new FirebaseRideTrackingDAO())
  }

  get transactions(): ITransactionRepository {
    return (this._transactions ??= new FirebaseTransactionDAO())
  }

  get users(): IUserRepository {
    return (this._users ??= new FirebaseUserDAO())
  }

  get wallets(): IWalletRepository {
    return (this._wallets ??= new FirebaseWalletDAO())
  }

  get walletTopupRequests(): IWalletTopupRequestRepository {
    return (this._walletTopupRequests ??= new FirebaseWalletTopupRequestDAO())
  }

  get withdrawals(): IWithdrawalRepository {
    return (this._withdrawals ??= new FirebaseWithdrawalDAO())
  }

  get pushNotifications(): IPushNotificationRepository {
    return (this._pushNotifications ??= new PushNotificationDAO())
  }

  get adminMoney(): IAdminMoneyRepository {
    return (this._adminMoney ??= new AdminMoneyDAO())
  }

  get adminVehicle(): IAdminVehicleRepository {
    return (this._adminVehicle ??= new AdminVehicleDAO())
  }

  get adminRide(): IAdminRideRepository {
    return (this._adminRide ??= new AdminRideDAO())
  }

  /**
   * Aprovar serviços e decidir documentos (3.7).
   *
   * A leitura de `drivers` e de `documents` continua a ser Firestore directo
   * — as regras só vão fechar a **escrita**, na Fase 7.
   */
  get adminDriver(): IAdminDriverRepository {
    return (this._adminDriver ??= new AdminDriverDAO())
  }

  get adminConfig(): IAdminConfigRepository {
    return (this._adminConfig ??= new AdminConfigDAO())
  }

  /**
   * A escrita de promoções. A leitura é o `promotions` acima, que continua a
   * ser Firestore directo — as regras só fecharam a escrita.
   */
  get adminPromotions(): IAdminPromotionRepository {
    return (this._adminPromotions ??= new AdminPromotionDAO())
  }

  /**
   * O recálculo do progresso das missões. A leitura é o `missionProgress`
   * acima, que continua a ser Firestore directo.
   */
  get adminMissions(): IAdminMissionRepository {
    return (this._adminMissions ??= new AdminMissionDAO())
  }

  /** Apagar notificações. Criar continua no `notifications` acima. */
  get adminNotifications(): IAdminNotificationRepository {
    return (this._adminNotifications ??= new AdminNotificationDAO())
  }

  get pricing(): IPricingRepository {
    return (this._pricing ??= new PricingDAO())
  }
}

export const ApiRepository = new ApiFactory()
