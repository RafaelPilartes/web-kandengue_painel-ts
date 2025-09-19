// src/infra/firebase/file.dao.ts
import {
  getDownloadURL,
  ref,
  uploadBytesResumable,
  uploadBytes,
  deleteObject
} from 'firebase/storage'
import type { IFileRepository } from '@/core/interfaces/IFileRepository'
import { storage } from '@/config/firebase.config'

export class FirebaseFileDAO implements IFileRepository {
  async uploadFile(file: File, path: string): Promise<string> {
    const storageRef = ref(storage, path)
    const uploadTask = uploadBytesResumable(storageRef, file)

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        undefined, // se quiser, dá pra expor progresso aqui
        error => reject(error),
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref)
          resolve(url)
        }
      )
    })
  }

  async uploadBlob(blob: Blob, path: string): Promise<string> {
    const storageRef = ref(storage, path)
    await uploadBytes(storageRef, blob)
    return await getDownloadURL(storageRef)
  }

  async deleteFile(path: string): Promise<void> {
    const storageRef = ref(storage, path)
    await deleteObject(storageRef)
  }

  async getFileURL(path: string): Promise<string> {
    const storageRef = ref(storage, path)
    return await getDownloadURL(storageRef)
  }
}
