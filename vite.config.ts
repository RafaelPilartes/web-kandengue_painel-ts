import { readFileSync } from 'fs'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const pkg = JSON.parse(
  readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf8')
) as { version: string }

/**
 * `<meta name="app-version">` no index.html gerado, com a versão do
 * package.json. O painel sobe para o cPanel à mão; sem isto não havia forma
 * de confirmar que o upload ficou senão comparar hashes de ficheiros.
 * Verifica-se com `curl -s <url> | grep app-version`.
 */
function appVersionMeta(version: string): Plugin {
  return {
    name: 'app-version-meta',
    transformIndexHtml() {
      return [{ tag: 'meta', attrs: { name: 'app-version', content: version }, injectTo: 'head' }]
    }
  }
}

export default defineConfig({
  plugins: [react(), appVersionMeta(pkg.version)],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
