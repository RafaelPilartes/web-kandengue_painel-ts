import { useMutation } from '@tanstack/react-query'
import { AuthService } from '@/services/auth.service'

export const useAuthViewModel = () => {
  const authService = new AuthService()

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authService.login(email, password)
  })

  const logoutMutation = useMutation({
    mutationFn: () => authService.logout()
  })

  return {
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,

    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,
    logoutError: logoutMutation.error
  }
}
