import { useMutation } from '@tanstack/react-query'
import { authUseCase } from '@/domain/usecases/authUseCase'

export const useAuthViewModel = () => {
  /** Login */
  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authUseCase.executeLogin(email, password)
  })

  /** Logout */
  const logoutMutation = useMutation({
    mutationFn: () => authUseCase.executeLogout()
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
    }) => authUseCase.executeRegister(email, password, displayName)
  })

  /** Reset de senha */
  const resetPasswordMutation = useMutation({
    mutationFn: (email: string) => authUseCase.executeResetPassword(email)
  })

  /** Alterar senha */
  const changePasswordMutation = useMutation({
    mutationFn: (newPassword: string) =>
      authUseCase.executeChangePassword(newPassword)
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
    currentUser: authUseCase.executeGetCurrentUser(),
    onAuthChanged: authUseCase.executeOnAuthChanged
  }
}
