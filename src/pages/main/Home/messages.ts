/**
 * A short line at the top of the home page, one per admin per day.
 *
 * ── What these are, and what they are not ──
 * They are about the day's work at a ride-hailing company in Luanda: the
 * drivers out there, the rides that close, the money that has to add up. They
 * are NOT motivational posters — no "vamos lá", no "o céu é o limite", nothing
 * an admin would read twice and start skipping. Something concrete, or nothing.
 */
export const DAILY_MESSAGES: string[] = [
  'As corridas de hoje começam a entrar por volta das seis. O painel acompanha.',
  'Um motorista que não aparece no mapa há uma hora é uma pergunta, não um erro.',
  'O dinheiro da plataforma fecha-se corrida a corrida. Aqui vê-se o total.',
  'Quem carrega a carteira de manhã roda o dia inteiro.',
  'Luanda ao fim da tarde é outra cidade: as tarifas sabem disso.',
  'Uma candidatura parada há três dias é um motorista que foi para outro lado.',
  'Os números desta página são de agora, não de ontem à noite.',
  'A chuva muda o preço e muda o trânsito. As duas coisas aparecem aqui.',
  'Um documento por validar trava um motorista inteiro.',
  'Vale a pena olhar para as corridas que ficaram a meio antes de olhar para as que correram bem.',
  'O saldo abaixo do mínimo tira o motorista da fila sem avisar ninguém.',
  'Uma reclamação lida no próprio dia costuma resolver-se no próprio dia.',
  'As promoções são dinheiro. Qualquer alteração fica registada.',
  'O mapa mostra onde estão os motoristas; a lista mostra onde estão os passageiros à espera.',
  'Carregamentos por aprovar são motoristas sem combustível para o dia.',
  'Quem conduz à noite não tem o mesmo trânsito nem o mesmo preço.',
  'Um perfil de preços mal guardado só se nota na primeira corrida depois.',
  'A foto de prova da entrega é o que fecha a discussão antes de ela começar.',
  'Há sempre uma corrida em curso quando se mexe nas regras. Convém verificar.',
  'As tarefas do departamento aparecem aqui em cima, antes dos gráficos.',
  'Um prazo que passou ontem continua a passar hoje.',
  'O código de recolha existe para o motorista não levar a pessoa errada.',
  'Os relatórios do mês fazem-se melhor no dia 1 do que no dia 30.',
  'Um motorista novo aprovado hoje faz a primeira corrida amanhã.',
  'A carteira do motorista e a conta da empresa são o mesmo dinheiro visto de dois lados.',
  'Uma viatura por validar é uma viatura que não trabalha.',
  'Os saques de indicações acumulam-se em silêncio até alguém os ver.',
  'Quando o painel e a app discordam sobre uma corrida, ganha a corrida.'
]

/**
 * The message of the day for one admin.
 *
 * ⚠️ Deterministic on purpose: `Math.random()` on every render would change
 * the line whenever React re-renders — on a click, on a query settling — and a
 * sentence that moves while being read is worse than no sentence. One line per
 * admin per day, and the next admin gets a different one on the same day.
 */
export function messageOfTheDay(
  adminId: string | null | undefined,
  now: Date = new Date(),
  messages: string[] = DAILY_MESSAGES
): string {
  if (messages.length === 0) return ''
  const day = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`
  const seed = `${adminId ?? ''}|${day}`
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return messages[hash % messages.length]
}
