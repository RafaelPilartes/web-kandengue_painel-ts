import { useState } from 'react'
import UserViewModel from '../services/ViewModel/UserViewModel'
import { type UserInterface } from '../interfaces/IUser'

interface UseUserReturn {
  loading: boolean
  error: boolean
  response: string
  resData: UserInterface | null
  signInWithEmail: (email: string, password: string) => Promise<void>
  createUser: (data: any) => Promise<void>
  getUser: (id: number) => Promise<void>
  updateUser: (id: number, data: any) => Promise<void>
  deleteUser: (id: number) => Promise<void>
}

export const useUser = (): UseUserReturn => {
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<boolean>(false)
  const [resData, setResData] = useState<UserInterface | null>(null)
  const [response, setResponse] = useState<string>('')

  const createUser = async (data: any) => {
    setLoading(true)
    try {
      const result = await UserViewModel.create(data)

      if (result.error) {
        setError(result.error)
      } else {
        setError(result.error)
        setResData(result.data as UserInterface) // Se for sucesso, salvar os dados da resposta
      }
      setResponse(result.msg)
    } catch (err: any) {
      setError(true)
      setResponse('An unexpected error occurred')
    } finally {
      setLoading(false) // Quando a operação for concluída, remover o estado de carregamento
    }
  }

  const signInWithEmail = async (email: string, password: string) => {
    setLoading(true)

    try {
      const result = await UserViewModel.signInWithEmail(email, password)

      if (result.error) {
        setError(result.error) // Se houver erro, definir a mensagem de erro
        setResData(null)
      } else {
        setError(result.error) // Se houver erro, definir a mensagem de erro
        setResData(result.data as UserInterface) // Se for sucesso, salvar os dados da resposta
      }
      setResponse(result.msg) // Se houver erro, definir a mensagem de erro
    } catch (err: any) {
      setError(true)
      setResponse('An unexpected error occurred')
    } finally {
      setLoading(false) // Quando a operação for concluída, remover o estado de carregamento
    }
  }

  const getUser = async (id: number) => {
    setLoading(true)
    try {
      const result = await UserViewModel.getOne(id)
      if (result.error) {
        setError(result.error)
        setResData(null)
      } else {
        setError(result.error)
        setResData(result.data as UserInterface)
      }
      setResponse(result.msg)
    } catch (err: any) {
      setResponse('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const updateUser = async (id: number, data: any) => {
    setLoading(true)
    try {
      const result = await UserViewModel.update(id, data)
      if (result.error) {
        setError(result.error)
        setResData(null)
      } else {
        setError(result.error)
        setResData(result.data as UserInterface)
      }
      setResponse(result.msg)
    } catch (err: any) {
      setResponse('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const deleteUser = async (id: number) => {
    setLoading(true)
    try {
      const result = await UserViewModel.delete(id)
      if (result.error) {
        setError(result.error)
        setResData(null)
      } else {
        setError(result.error)
        setResData(null) // User deletado, então resposta é null
      }
      setResponse(result.msg)
    } catch (err: any) {
      setResponse('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    response,
    resData,
    signInWithEmail,
    createUser,
    getUser,
    updateUser,
    deleteUser
  }
}
