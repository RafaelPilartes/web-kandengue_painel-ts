import { toast } from 'react-toastify'
import type { ToastOptions, Id } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

type ToastType = 'error' | 'success' | 'info' | 'warning'

// -----------------------------------------------
// CONFIG BASE
// -----------------------------------------------

const baseOptions: ToastOptions = {
  position: 'top-right',
  autoClose: 3000,
  pauseOnHover: true,
  closeOnClick: true
}

// -----------------------------------------------
// TOAST NORMAL
// -----------------------------------------------

export function showToast(type: ToastType, description: string) {
  toast[type](description, baseOptions)
}

export function showToastBottom(type: ToastType, description: string) {
  toast[type](description, { ...baseOptions, position: 'bottom-right' })
}

// -----------------------------------------------
// TOAST LOADING
// -----------------------------------------------

export function showToastLoading(message: string): Id {
  return toast.loading(message, {
    position: baseOptions.position,
    closeOnClick: false,
    closeButton: false,
    draggable: false
  })
}

// -----------------------------------------------
// UPDATE TOAST
// -----------------------------------------------

export function updateToast(
  toastId: Id,
  type: ToastType,
  message: string,
  autoClose = 2500
) {
  toast.update(toastId, {
    render: message,
    type,
    isLoading: false,
    autoClose,
    closeOnClick: true,
    draggable: true
  })
}

// -----------------------------------------------
// DISMISS
// -----------------------------------------------

export function dismissToast(toastId?: Id) {
  toast.dismiss(toastId)
}
