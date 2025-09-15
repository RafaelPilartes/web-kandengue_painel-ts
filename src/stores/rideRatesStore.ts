import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { RideRatesInterface } from '../interfaces/IRideRates'

interface RideRatesState {
  currentRideRatesData: RideRatesInterface | null
  addRideRatesData: (rideRatesData: RideRatesInterface) => void
  removeRideRatesData: () => void
}

export const useRideRatesStore = create<RideRatesState>()(
  devtools(
    persist(
      set => ({
        currentRideRatesData: null,

        addRideRatesData: rideRatesData => {
          set({ currentRideRatesData: rideRatesData })
        },
        removeRideRatesData: () => {
          set(() => ({ currentRideRatesData: null }))
        }
      }),
      {
        name: 'kandengue-adm-ride_rates-storage'
      }
    )
  )
)
