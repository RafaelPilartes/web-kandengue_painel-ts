import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  test: {
    environment: 'node',
    // Os testes de emulador partilham uma base de dados: correr em série
    // evita que a limpeza de uma suite apague os dados de outra.
    // vehicle.dao.test.ts e vehicleUseCase.test.ts partilham a colecção
    // `vehicles` do emulador e limpam-na no beforeEach. Em paralelo,
    // interfeririam. Não activar sem os isolar primeiro.
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 20000,
    include: ['src/**/__tests__/**/*.test.ts']
  }
})
