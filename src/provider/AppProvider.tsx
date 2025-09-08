import React, { createContext, useState, type JSX } from 'react'
import type { IChildren } from '../interfaces/children'

interface AppContextInterface {
  menuIsVisible: boolean
  setMenuIsVisible: (value: any) => void
  isDarkMode: boolean
  setIsDarkMode: (value: any) => void
}

const AppContext = createContext<AppContextInterface>({} as AppContextInterface)

const AppProvider: React.FC<IChildren> = ({ children }): JSX.Element => {
  const [menuIsVisible, setMenuIsVisible] = useState<boolean>(false)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false)

  return (
    <AppContext.Provider
      value={{
        menuIsVisible,
        setMenuIsVisible,
        isDarkMode,
        setIsDarkMode
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export { AppContext, AppProvider }
