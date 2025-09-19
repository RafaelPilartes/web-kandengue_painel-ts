// src/services/files.service.ts
import { fileRepository } from '@/modules/Api'

/**
 * Resultado padrão do upload
 */
export type UploadResult = {
  url: string
  path: string
}

export class FileService {
  /**
   * Faz upload de um File (browser) para o storage no caminho especificado.
   * Retorna a url pública (download URL) e o path usado.
   */
  async uploadFile(
    file: File,
    folder: string,
    fileName: string = `${file.name}`
  ): Promise<UploadResult> {
    try {
      const path: string = `${folder}/${Date.now()}_${fileName}`
      const url = await fileRepository.uploadFile(file, path)
      return { url, path }
    } catch (err: any) {
      console.error('FileService.uploadFile error:', err)
      throw new Error(err?.message ?? 'Erro ao enviar ficheiro')
    }
  }

  /**
   * Faz upload de um Blob/Uint8Array (útil em React Native) para o storage.
   */
  async uploadBlob(
    blob: Blob | Uint8Array,
    path: string
  ): Promise<UploadResult> {
    try {
      // Alguns DAOs usam uploadBlob; adaptá-lo conforme implementado
      const url = await fileRepository.uploadBlob(blob as any, path)
      return { url, path }
    } catch (err: any) {
      console.error('FileService.uploadBlob error:', err)
      throw new Error(err?.message ?? 'Erro ao enviar blob')
    }
  }

  /**
   * Deleta um ficheiro dado o path (ex: "drivers/documents/abc.jpg")
   */
  async deleteFile(path: string): Promise<void> {
    try {
      await fileRepository.deleteFile(path)
    } catch (err: any) {
      console.error('FileService.deleteFile error:', err)
      throw new Error(err?.message ?? 'Erro ao eliminar ficheiro')
    }
  }

  /**
   * Retorna URL pública de um ficheiro já guardado.
   */
  async getDownloadUrl(path: string): Promise<string> {
    try {
      return await fileRepository.getFileURL(path)
    } catch (err: any) {
      console.error('FileService.getDownloadUrl error:', err)
      throw new Error(err?.message ?? 'Erro ao obter URL do ficheiro')
    }
  }
}
