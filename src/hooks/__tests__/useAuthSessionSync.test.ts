// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

const onAuthChanged = vi.fn()
const removeAdmin = vi.fn()
const clear = vi.fn()

let currentAdminData: { id: string } | null = { id: 'adm-1' }

vi.mock('@/services/auth.service', () => ({
  AuthService: class {
    onAuthChanged = onAuthChanged
  }
}))

vi.mock('@/stores/userStore', () => ({
  useAdminStore: () => ({ currentAdminData, removeAdmin })
}))

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ clear })
}))

const { useAuthSessionSync } = await import('@/hooks/useAuthSessionSync')

describe('useAuthSessionSync', () => {
  beforeEach(() => {
    onAuthChanged.mockReset()
    removeAdmin.mockReset()
    clear.mockReset()
    currentAdminData = { id: 'adm-1' }
    onAuthChanged.mockReturnValue(() => {})
  })

  it('subscreve o Firebase uma vez ao montar', () => {
    renderHook(() => useAuthSessionSync())

    expect(onAuthChanged).toHaveBeenCalledTimes(1)
  })

  it('limpa o store e a cache quando a sessão morre', () => {
    renderHook(() => useAuthSessionSync())
    const callback = onAuthChanged.mock.calls[0][0]

    callback(null)

    expect(removeAdmin).toHaveBeenCalledTimes(1)
    expect(clear).toHaveBeenCalledTimes(1)
  })

  it('não faz nada quando o Firebase reporta um utilizador', () => {
    renderHook(() => useAuthSessionSync())
    const callback = onAuthChanged.mock.calls[0][0]

    callback({ uid: 'uid-1' })

    expect(removeAdmin).not.toHaveBeenCalled()
    expect(clear).not.toHaveBeenCalled()
  })

  it('não limpa quando já não havia admin no store', () => {
    // Sem esta guarda, o hook dispararia em cada montagem da página de login.
    currentAdminData = null
    renderHook(() => useAuthSessionSync())
    const callback = onAuthChanged.mock.calls[0][0]

    callback(null)

    expect(removeAdmin).not.toHaveBeenCalled()
    expect(clear).not.toHaveBeenCalled()
  })

  it('cancela a subscrição ao desmontar', () => {
    const unsubscribe = vi.fn()
    onAuthChanged.mockReturnValue(unsubscribe)

    const { unmount } = renderHook(() => useAuthSessionSync())
    unmount()

    expect(unsubscribe).toHaveBeenCalledTimes(1)
  })
})
