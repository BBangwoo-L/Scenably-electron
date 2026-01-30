import { create } from 'zustand'
import { getRandomId } from '@/lib/utils'

interface ToastProps {
  id: string
  title?: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

interface ToastStore {
  toasts: ToastProps[]
  showToast: (options: {
    title?: string
    message: string
    type?: 'success' | 'error' | 'warning' | 'info'
    duration?: number
  }) => void
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  showToast: ({ title, message, type = 'info', duration = 3000 }) => {
    const id = getRandomId('Toast')
    set(state => ({
      toasts: [...state.toasts, { id, title, message, type, duration }]
    }))

    // 자동으로 제거
    if (duration > 0) {
      setTimeout(() => {
        set(state => ({
          toasts: state.toasts.filter(toast => toast.id !== id)
        }))
      }, duration)
    }
  },
  removeToast: (id) => set(state => ({
    toasts: state.toasts.filter(toast => toast.id !== id)
  })),
}))