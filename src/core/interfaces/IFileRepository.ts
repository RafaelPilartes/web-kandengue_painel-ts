// src/core/interfaces/IFileRepository.ts
export interface IFileRepository {
  uploadFile(file: File, path: string): Promise<string>
  uploadBlob(blob: Blob, path: string): Promise<string> // útil no React Native
  deleteFile(path: string): Promise<void>
  getFileURL(path: string): Promise<string>
}
