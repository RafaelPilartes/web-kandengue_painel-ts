import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

type ToastType = 'error' | 'success' | 'info'

export function showToast(typo: ToastType, description: string) {
  toast[typo](description, {
    position: 'top-right' // Define a posição diretamente como string
  })
}

export function showToastBottom(typo: ToastType, description: string) {
  toast[typo](description, {
    position: 'bottom-right' // Define a posição diretamente como string
  })
}
