// src/components/ui/tabs.tsx
import { cn } from '@/lib/tailwind-merge'
import * as React from 'react'

interface TabsProps {
  defaultValue: string
  children: React.ReactNode
}

interface TabsContextType {
  value: string
  setValue: (val: string) => void
}

const TabsContext = React.createContext<TabsContextType | null>(null)

export function Tabs({ defaultValue, children }: TabsProps) {
  const [value, setValue] = React.useState(defaultValue)

  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div className="w-full">{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex border-b border-gray-200 dark:border-gray-700 gap-2 flex-row ">
      {children}
    </div>
  )
}

export function TabsTrigger({
  value,
  children
}: {
  value: string
  children: React.ReactNode
}) {
  const ctx = React.useContext(TabsContext)
  if (!ctx) throw new Error('TabsTrigger must be used inside Tabs')

  const isActive = ctx.value === value

  return (
    <button
      onClick={() => ctx.setValue(value)}
      className={cn(
        'px-4 py-2 -mb-px font-medium text-sm border-b-2 transition-colors',
        isActive
          ? 'border-primary-300 text-primary-300 dark:border-primary-200 dark:text-primary-200'
          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
      )}
    >
      {children}
    </button>
  )
}

export function TabsContent({
  value,
  children
}: {
  value: string
  children: React.ReactNode
}) {
  const ctx = React.useContext(TabsContext)
  if (!ctx) throw new Error('TabsContent must be used inside Tabs')

  if (ctx.value !== value) return null

  return <div className="mt-4">{children}</div>
}
