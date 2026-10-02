import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DRIVER_MIN_WALLET_BALANCE } from '@rafaelpilartes/kandengue-shared/constants'
import { walletUseCase } from '@/domain/usecases/walletUseCase'
import type { WalletEntity } from '@/core/entities/Wallet'
import { firebaseCollections } from '@/constants/firebaseCollections'

export type SaldoEmFalta = {
  wallet: WalletEntity
  /** Quanto falta para chegar ao mínimo. Zero se já está acima. */
  falta: number
  negativo: boolean
}

/**
 * As carteiras abaixo do mínimo de dispatch, e as negativas.
 *
 * ⚠️ **Filtra em memória, de propósito.** Um
 * `where('balance', '<', DRIVER_MIN_WALLET_BALANCE)` parecia o caminho
 * óbvio e **exclui silenciosamente as carteiras sem o campo `balance`** —
 * que são exactamente as que mais interessam a quem vê esta lista. É a mesma
 * armadilha que o `expireStalePresence` tem documentada com o `last_seen`.
 *
 * São dezenas de carteiras, não milhares: trazer todas e filtrar aqui custa
 * uma leitura por carteira e não esconde nada.
 */
export function useLowBalanceViewModel() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: [firebaseCollections.wallets.root, 'todas'],
    queryFn: () => walletUseCase.executeGetAll(500, 0),
    staleTime: 1000 * 30
  })

  const resultado = useMemo(() => {
    const todas = data?.data ?? []

    const emFalta: SaldoEmFalta[] = todas
      .map(wallet => {
        // Ausente conta como zero: é o que o dispatch faz, e é pior do que um
        // saldo baixo — não é "não sei", é "não recebe corridas".
        const saldo = typeof wallet.balance === 'number' ? wallet.balance : 0
        return {
          wallet,
          falta: Math.max(0, DRIVER_MIN_WALLET_BALANCE - saldo),
          negativo: saldo < 0
        }
      })
      .filter(item => item.falta > 0)
      // Pior primeiro: o saldo mais baixo é quem está parado há mais tempo.
      .sort((a, b) => b.falta - a.falta)

    return {
      emFalta,
      total: todas.length,
      negativas: emFalta.filter(i => i.negativo).length,
      somaEmFalta: emFalta.reduce((acc, i) => acc + i.falta, 0)
    }
  }, [data])

  return {
    ...resultado,
    minimo: DRIVER_MIN_WALLET_BALANCE,
    isLoading,
    refetch
  }
}
