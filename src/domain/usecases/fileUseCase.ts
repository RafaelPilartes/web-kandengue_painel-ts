import { ApiRepository } from '@/modules/Api/factory'
import { BaseUseCase } from './BaseUseCase'

/**
 * Resultado padrão do upload
 */
export type UploadResult = {
  url: string
  path: string
}

export class FileUseCase extends BaseUseCase {
  protected readonly context = 'FileUseCase'

  private get repository() {
    return ApiRepository.files
  }

  /**
   * Faz upload de um File (browser) para o storage no caminho especificado.
   * Retorna a url pública (download URL) e o path usado.
   */
  executeUploadFile(
    file: File,
    folder: string,
    fileName: string = `${file.name}`
  ): Promise<UploadResult> {
    return this.run('uploadFile', async () => {
      const path: string = `${folder}/${Date.now()}_${fileName}`
      const url = await this.repository.uploadFile(file, path)
      return { url, path }
    })
  }

  /**
   * Faz upload de um Blob/Uint8Array (útil em React Native) para o storage.
   */
  executeUploadBlob(
    blob: Blob | Uint8Array,
    path: string
  ): Promise<UploadResult> {
    return this.run('uploadBlob', async () => {
      const url = await this.repository.uploadBlob(blob as Blob, path)
      return { url, path }
    })
  }

  /**
   * Deleta um ficheiro dado o path (ex: "drivers/documents/abc.jpg")
   */
  executeDeleteFile(path: string): Promise<void> {
    return this.run('deleteFile', () => this.repository.deleteFile(path))
  }

  /**
   * Retorna URL pública de um ficheiro já guardado.
   */
  executeGetDownloadUrl(path: string): Promise<string> {
    return this.run('getDownloadUrl', () => this.repository.getFileURL(path))
  }
}

export const fileUseCase = new FileUseCase()
