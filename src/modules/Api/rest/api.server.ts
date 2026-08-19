// Em dev o painel liga-se aos emuladores, portanto o ID token vem do Auth
// emulador — a API de produção rejeita-o. `VITE_API_URL` permite apontar
// ao Fastify local. Sem a variável, cai na produção (comportamento antigo).
export const ApiServer =
  import.meta.env.VITE_API_URL ??
  'https://node-fastify-kandengueatrevido-ts-production.up.railway.app'
