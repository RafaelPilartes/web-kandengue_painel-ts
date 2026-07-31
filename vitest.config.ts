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
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 20000,
    include: ['src/**/__tests__/**/*.test.ts']
  }
})
