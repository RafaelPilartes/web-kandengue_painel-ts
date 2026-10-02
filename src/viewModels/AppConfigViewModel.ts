import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/config/firebase.config'
import { firebaseCollections } from '@/constants/firebaseCollections'
import { ApiRepository } from '@/modules/Api/factory'
import type {
  AppVersionsPayload,
  WalletTopupConfigPayload
} from '@/core/interfaces/IAdminConfigRepository'
import type {
  AppVersionsConfigInterface,
  WalletTopupConfigInterface
} from '@rafaelpilartes/kandengue-shared/interfaces'

/**
 * Os dois documentos de `app_config` que o painel edita.
 *
 * **Lê do Firestore, escreve pela API.** A leitura é directa porque as regras
 * a permitem e não há nada a decidir; a escrita é da API porque os dois são
 * perigosos de maneiras diferentes — um bloqueia a base instalada, o outro é
 * um IBAN — e nenhum pode mudar sem ficar registado quem o mudou.
 *
 * Não há DAO de Firestore para isto: são dois documentos de id fixo, e um
 * `BaseFirebaseDAO` com paginação e converters para dois documentos que não
 * são uma colecção era mais código do que o problema.
 */
const APP_CONFIG = firebaseCollections.appConfig.root

export const APP_CONFIG_KEYS = {
  appVersions: [APP_CONFIG, 'app_versions'] as const,
  walletTopup: [APP_CONFIG, 'wallet_topup'] as const
}

export function useAppConfigViewModel() {
  const queryClient = useQueryClient()

  const appVersions = useQuery({
    queryKey: APP_CONFIG_KEYS.appVersions,
    queryFn: async () => {
      const snap = await getDoc(doc(db, APP_CONFIG, 'app_versions'))
      return snap.exists()
        ? (snap.data() as AppVersionsConfigInterface)
        : null
    }
  })

  const walletTopup = useQuery({
    queryKey: APP_CONFIG_KEYS.walletTopup,
    queryFn: async () => {
      const snap = await getDoc(doc(db, APP_CONFIG, 'wallet_topup'))
      return snap.exists()
        ? (snap.data() as WalletTopupConfigInterface)
        : null
    }
  })

  /**
   * Sem `withAudit`: a API escreve em `auditLogs` dentro da própria
   * transacção, com o antes e o depois de cada campo. Auditar também do
   * cliente duplicava o registo e o do cliente não saberia o que mudou.
   */
  const saveAppVersions = useMutation({
    mutationFn: (payload: AppVersionsPayload) =>
      ApiRepository.adminConfig.saveAppVersions(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APP_CONFIG_KEYS.appVersions })
    }
  })

  const saveWalletTopup = useMutation({
    mutationFn: (payload: WalletTopupConfigPayload) =>
      ApiRepository.adminConfig.saveWalletTopupConfig(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APP_CONFIG_KEYS.walletTopup })
    }
  })

  return {
    appVersions: appVersions.data ?? null,
    isLoadingAppVersions: appVersions.isLoading,
    walletTopup: walletTopup.data ?? null,
    isLoadingWalletTopup: walletTopup.isLoading,
    saveAppVersions,
    saveWalletTopup
  }
}
