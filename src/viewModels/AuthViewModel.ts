import { useMutation } from '@tanstack/react-query'
import { AuthService } from '@/routes/services/auth.service'

export const useAuthViewModel = () => {
  const authService = new AuthService()

  /** Login */
  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authService.login(email, password)
  })

  /** Logout */
  const logoutMutation = useMutation({
    mutationFn: () => authService.logout()
  })

  /** Registrar novo usuário */
  const registerMutation = useMutation({
    mutationFn: ({
      email,
      password,
      displayName
    }: {
      email: string
      password: string
      displayName?: string
    }) => authService.register(email, password, displayName)
  })

  /** Reset de senha */
  const resetPasswordMutation = useMutation({
    mutationFn: (email: string) => authService.resetPassword(email)
  })

  /** Alterar senha */
  const changePasswordMutation = useMutation({
    mutationFn: (newPassword: string) => authService.changePassword(newPassword)
  })

  return {
    // Login
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,

    // Logout
    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,
    logoutError: logoutMutation.error,

    // Register
    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error,

    // Reset Password
    resetPassword: resetPasswordMutation.mutateAsync,
    isResettingPassword: resetPasswordMutation.isPending,
    resetPasswordError: resetPasswordMutation.error,

    // Change Password
    changePassword: changePasswordMutation.mutateAsync,
    isChangingPassword: changePasswordMutation.isPending,
    changePasswordError: changePasswordMutation.error,

    // Métodos diretos (sem mutation)
    currentUser: authService.getCurrentUser(),
    onAuthChanged: authService.onAuthChanged
  }
}
