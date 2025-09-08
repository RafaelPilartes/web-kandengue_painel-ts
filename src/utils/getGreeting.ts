export const getGreeting = () => {
  const currentHour = new Date().getHours() // Pega a hora atual (0-23)

  if (currentHour >= 5 && currentHour < 12) {
    return 'Bom dia'
  } else if (currentHour >= 12 && currentHour < 18) {
    return 'Boa tarde'
  } else {
    return 'Boa noite'
  }
}

export const getGreetingMsg = () => {
  const currentHour = new Date().getHours() // Pega a hora atual (0-23)

  if (currentHour >= 5 && currentHour < 12) {
    return 'Tenha um bom dia de trabalho'
  } else if (currentHour >= 12 && currentHour < 18) {
    return 'Tenha uma otima tarde de trabalho'
  } else {
    return 'Não está muito tarde para trabalhar? 😅'
  }
}
