import { useEffect } from 'react'
import useLocalStorage from './useLocalStorage'

const useColorMode = () => {
  const [colorMode, setColorMode] = useLocalStorage('color-theme', 'light')

  useEffect(() => {
    const className = 'dark'
    const bodyClass = window.document.body.classList

    colorMode === 'dark'
      ? bodyClass.add(className)
      : bodyClass.remove(className)

    document.body.classList.toggle('bg-baseBgDark', colorMode === 'dark')
    document.body.classList.toggle('bg-baseBgLight', colorMode !== 'dark')
  }, [colorMode])

  return [colorMode, setColorMode]
}

export default useColorMode
