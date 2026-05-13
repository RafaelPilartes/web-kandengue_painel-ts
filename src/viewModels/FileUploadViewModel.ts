// src/viewModels/FileUploadViewModel.ts
import { useCallback, useRef, useState } from 'react'
import { FileService, type UploadResult } from '@/services/files.service'
import {
  getDownloadURL,
  ref,
  uploadBytesResumable,
  type UploadMetadata,
  type UploadTask,
  type UploadTaskSnapshot
} from 'firebase/storage'
import { storage } from '@/config/firebase.config'

const fileService = new FileService()

export function useFileUploadViewModel() {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState<number>(0) // 0 - 100
  const [fileURL, setFileURL] = useState<string | null>(null)
  const [uploadedPath, setUploadedPath] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isCancelled, setIsCancelled] = useState(false)

  // Guarda a tarefa para poder cancelar
  const taskRef = useRef<UploadTask | null>(null)

  // Util: gerar um path unique
  const generatePath = (folder = 'uploads', filename?: string) => {
    const name = filename || `file-${Date.now()}`
    return `${folder}/${Date.now()}_${name}`
  }

  // Upload com progresso e cancelamento
  const uploadWithProgress = useCallback(
    async (
      file: File | Blob,
      opts?: {
        folder?: string
        fileName?: string
        metadata?: UploadMetadata
      }
    ): Promise<UploadResult> => {
      setIsUploading(true)
      setProgress(0)
      setError(null)
      setIsCancelled(false)
      setFileURL(null)
      setUploadedPath(null)

      const folder = opts?.folder ?? 'uploads'
      const path = generatePath(folder, opts?.fileName)
      const storageRef = ref(storage, path)

      try {
        const task = uploadBytesResumable(storageRef, file, opts?.metadata)
        taskRef.current = task

        // Promise que resolve quando terminar
        const url = await new Promise<string>((resolve, reject) => {
          task.on(
            'state_changed',
            (snapshot: UploadTaskSnapshot) => {
              const percent =
                snapshot.totalBytes > 0
                  ? Math.round(
                      (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                    )
                  : 0
              setProgress(percent)
            },
            (err: any) => {
              setError(err?.message ?? 'Erro no upload')
              setIsUploading(false)
              reject(err)
            },
            async () => {
              try {
                const downloadUrl = await getDownloadURL(task.snapshot.ref)
                setFileURL(downloadUrl)
                setUploadedPath(path)
                setProgress(100)
                setIsUploading(false)
                resolve(downloadUrl)
              } catch (err) {
                setError((err as any)?.message ?? 'Erro ao obter URL')
                setIsUploading(false)
                reject(err)
              }
            }
          )
        })

        return { url, path }
      } catch (err: any) {
        // se cancelado, task.on já terá setado isUploading false, mas tratamos aqui
        if (isCancelled) {
          setError('Upload cancelado')
        } else {
          setError(err?.message ?? 'Erro no upload')
        }
        setIsUploading(false)
        throw err
      } finally {
        taskRef.current = null
      }
    },
    [isCancelled]
  )

  // Cancelar upload corrente
  const cancelUpload = useCallback(() => {
    if (taskRef.current) {
      try {
        // upload task tem método cancel() em algumas versões; usamos as duas opções
        // @ts-ignore
        if (typeof taskRef.current.cancel === 'function') {
          // @ts-ignore
          taskRef.current.cancel()
        } else if (typeof taskRef.current.pause === 'function') {
          // pausar como fallback (não remove parcialmente enviado)
          // @ts-ignore
          taskRef.current.pause()
        }
        setIsCancelled(true)
        setIsUploading(false)
        setProgress(0)
      } catch (err: any) {
        console.warn('Erro ao cancelar upload:', err)
        setError('Erro ao cancelar upload')
      } finally {
        taskRef.current = null
      }
    }
  }, [])

  // Deletar ficheiro por path
  const deleteFile = useCallback(
    async (path: string) => {
      try {
        await fileService.deleteFile(path)
        // limpa estados se for o ficheiro actual
        if (uploadedPath === path) {
          setFileURL(null)
          setUploadedPath(null)
        }
        return true
      } catch (err: any) {
        setError(err?.message ?? 'Erro ao apagar ficheiro')
        return false
      }
    },
    [uploadedPath]
  )

  // Pegar URL de um path (se já tiveres path)
  const getFileURL = useCallback(async (path: string) => {
    try {
      const url = await fileService.getDownloadUrl(path)
      return url
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao obter URL')
      throw err
    }
  }, [])

  async function uploadSimple(
    file: File,
    folder: string = 'files',
    fileName?: string
  ) {
    setIsUploading(true)
    setError(null)

    try {
      const res = await fileService.uploadFile(file, folder, fileName)
      setFileURL(res.url)
      return res
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setIsUploading(false)
    }
  }

  return {
    // states
    isUploading,
    progress,
    fileURL,
    uploadedPath,
    uploadError: error,
    isCancelled,

    // actions
    uploadWithProgress,
    uploadSimple,
    cancelUpload,
    deleteFile,
    getFileURL
  }
}
