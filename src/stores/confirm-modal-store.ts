import { create } from 'zustand'
import { getRandomId } from '@/lib/utils'

interface ConfirmModalProps {
  id: string
  title: string
  message: string
  isAlert: boolean
  handleCancel: () => void
  handleCheck: () => void
}

interface ConfirmModalStore {
  confirmModalPropsList: ConfirmModalProps[]
  openConfirmModal: (options: {
    title?: string
    message: string
    isAlert?: boolean
  }) => Promise<boolean>
  closeConfirmModal: (id: string) => void
}

export const useConfirmModalStore = create<ConfirmModalStore>((set, get) => ({
  confirmModalPropsList: [],
  openConfirmModal: ({ title = "알림", message = "", isAlert = true }) =>
    new Promise(resolve =>
      set(state => ({
        confirmModalPropsList: [
          ...state.confirmModalPropsList,
          {
            id: getRandomId('ConfirmModal'),
            title,
            message,
            isAlert,
            handleCancel: () => resolve(false),
            handleCheck: () => resolve(true),
          }
        ]
      }))
    ),
  closeConfirmModal: (id) => set(state => ({
    confirmModalPropsList: state.confirmModalPropsList.filter(confirmModalProps => confirmModalProps.id !== id)
  })),
}))