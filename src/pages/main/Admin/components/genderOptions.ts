/**
 * The greeting on the home page, and nothing else: "Bem-vindo" or
 * "Bem-vinda".
 *
 * ⚠️ There is no "prefiro não dizer" option because there is no need for one:
 * leaving the field empty IS that answer, and it is what the account starts
 * with. The greeting is then neutral, and it is never guessed from the name.
 */
export const genderOptions = [
  { value: 'female', label: 'Bem-vinda (feminino)' },
  { value: 'male', label: 'Bem-vindo (masculino)' }
]
