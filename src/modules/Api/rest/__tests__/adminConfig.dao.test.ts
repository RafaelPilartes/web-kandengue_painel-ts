import { describe, it, expect, vi, beforeEach } from 'vitest'

const put = vi.fn()
vi.mock('@/modules/Api/rest/Api.dao', () => ({
  default: { put }
}))

const { AdminConfigDAO } = await import('@/modules/Api/rest/adminConfig.dao')

const VERSOES = {
  min_version_driver_android: '1.2.0',
  min_version_driver_ios: '1.2.0',
  latest_version_driver_android: '1.2.0',
  latest_version_driver_ios: '1.2.0',
  min_version_passenger_android: '1.3.0',
  min_version_passenger_ios: '1.3.0',
  latest_version_passenger_android: '1.3.0',
  latest_version_passenger_ios: '1.3.0'
}

describe('AdminConfigDAO', () => {
  const dao = new AdminConfigDAO()

  beforeEach(() => {
    put.mockReset()
  })

  it('as versões vão inteiras para a rota certa', async () => {
    put.mockResolvedValue({ changed: true, changed_fields: ['min_version_driver_ios'] })

    const result = await dao.saveAppVersions(VERSOES)

    expect(put).toHaveBeenCalledWith(
      '/api/v1/admin/config/app-versions',
      VERSOES
    )
    expect(result.changed_fields).toEqual(['min_version_driver_ios'])
  })

  it('os dados bancários vão aparados e sem opcionais vazios', async () => {
    put.mockResolvedValue({ changed: true, changed_fields: ['iban'] })

    await dao.saveWalletTopupConfig({
      iban: 'AO06.1',
      account_holder: 'Titular',
      holder_note: '   ',
      transfer_reference_hint: '  o teu telefone  ',
      min_amount: 500
    })

    // Um opcional vazio não deve chegar à API: o schema apara e o documento
    // ficaria com um campo sem conteúdo.
    expect(put).toHaveBeenCalledWith('/api/v1/admin/config/wallet-topup', {
      iban: 'AO06.1',
      account_holder: 'Titular',
      min_amount: 500,
      transfer_reference_hint: 'o teu telefone'
    })
  })

  it('nunca envia adminId — a API tira-o do token', async () => {
    put.mockResolvedValue({ changed: true, changed_fields: [] })

    await dao.saveAppVersions(VERSOES)

    expect(JSON.stringify(put.mock.calls[0])).not.toContain('adminId')
  })

  it('propaga o erro da API tal como vem', async () => {
    put.mockRejectedValue(
      new Error('O mínimo de driver_android (1.4.0) está acima da versão mais recente (1.2.0)')
    )

    await expect(dao.saveAppVersions(VERSOES)).rejects.toThrow(
      /acima da versão mais recente/
    )
  })
})
