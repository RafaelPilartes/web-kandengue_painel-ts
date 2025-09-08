export function validationFileImage(file: File, maxSizeMB: number) {
  const MAX_FILE_SIZE = maxSizeMB * 1024 * 1024
  const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/jpg']

  if (file == null) {
    return {
      error: true,
      message: `Não foi selecionado nenhuma imagem.`
    }
  } else if (file && file.size >= MAX_FILE_SIZE) {
    return {
      error: true,
      message: `O arquivo excede o tamanho máximo de ${maxSizeMB}Mb permitido.`
    }
  } else if (file && !ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      error: true,
      message: 'Permitido penas arquivos: .jpeg, .png, .jpg.'
    }
  } else {
    return {
      error: false,
      file,
      message: 'O arquivo selecionado atende aos critérios de validação.'
    }
  }
}
