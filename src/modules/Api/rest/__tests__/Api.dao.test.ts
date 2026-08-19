import { describe, it, expect, vi, beforeEach } from 'vitest'

const getIdToken = vi.fn()

vi.mock('@/config/firebase.config', () => ({
  auth: {
    get currentUser() {
      return { getIdToken }
    }
  }
}))

const axiosRequest = vi.fn()
vi.mock('axios', () => ({
  default: Object.assign(
    (config: unknown) => axiosRequest(config),
    { create: vi.fn() }
  )
}))

const ApiDAO = (await import('@/modules/Api/rest/Api.dao')).default

describe('ApiDAO — injecção do ID token', () => {
  beforeEach(() => {
    axiosRequest.mockReset()
    axiosRequest.mockResolvedValue({ data: { ok: true } })
    getIdToken.mockReset()
    getIdToken.mockResolvedValue('token-abc')
  })

  it('anexa Authorization em POST sem headers explícitos', async () => {
    await ApiDAO.post('/api/v1/x', { a: 1 })

    expect(axiosRequest).toHaveBeenCalledTimes(1)
    const config = axiosRequest.mock.calls[0][0]
    expect(config.headers.Authorization).toBe('Bearer token-abc')
  })

  it('anexa Authorization em GET', async () => {
    await ApiDAO.get('/api/v1/x')

    expect(axiosRequest.mock.calls[0][0].headers.Authorization).toBe(
      'Bearer token-abc'
    )
  })

  it('preserva os headers que o chamador passou', async () => {
    await ApiDAO.post('/api/v1/x', { a: 1 }, { 'X-Custom': 'v' })

    const headers = axiosRequest.mock.calls[0][0].headers
    expect(headers['X-Custom']).toBe('v')
    expect(headers.Authorization).toBe('Bearer token-abc')
  })

  it('um Authorization explícito ganha ao injectado', async () => {
    await ApiDAO.post('/api/v1/x', {}, { Authorization: 'Bearer manual' })

    expect(axiosRequest.mock.calls[0][0].headers.Authorization).toBe(
      'Bearer manual'
    )
  })

  it('não anexa nada quando não há sessão', async () => {
    getIdToken.mockRejectedValue(new Error('sem sessão'))

    await ApiDAO.get('/api/v1/x')

    expect(axiosRequest.mock.calls[0][0].headers.Authorization).toBeUndefined()
  })
})
