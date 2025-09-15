import React, { createContext, useState, type JSX } from 'react'
import type { IChildren } from '../interfaces/children'

interface AppContextInterface {
  menuIsVisible: boolean
  setMenuIsVisible: (value: any) => void
}

const AppContext = createContext<AppContextInterface>({} as AppContextInterface)

const AppProvider: React.FC<IChildren> = ({ children }): JSX.Element => {
  const [menuIsVisible, setMenuIsVisible] = useState<boolean>(false)

  return (
    <AppContext.Provider
      value={{
        menuIsVisible,
        setMenuIsVisible
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export { AppContext, AppProvider }
