import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { UserInterface } from '../interfaces/IUser'
import type { AdminInterface } from '../interfaces/IAdmin'

interface UserState {
  currentUserData: UserInterface | null
  addUser: (user: UserInterface) => void
  removeUser: () => void
}
interface AdminState {
  currentAdminData: AdminInterface | null
  addAdmin: (admin: AdminInterface) => void
  removeAdmin: () => void
}

export const useUserStore = create<UserState>()(
  devtools(
    persist(
      set => ({
        currentUserData: null,

        addUser: user => {
          set({ currentUserData: user })
        },
        removeUser: () => {
          set(() => ({ currentUserData: null }))
        }
      }),
      {
        name: 'kandengue-adm-data-storage'
        // name: 'user-data-storage'
      }
    )
  )
)

export const useAdminStore = create<AdminState>()(
  devtools(
    persist(
      set => ({
        currentAdminData: null,

        addAdmin: admin => {
          set({ currentAdminData: admin })
        },
        removeAdmin: () => {
          set(() => ({ currentAdminData: null }))
        }
      }),
      {
        name: 'kandengue-adm-data-storage'
        // name: 'user-data-storage'
      }
    )
  )
)
