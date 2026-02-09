import { create } from 'zustand'
import { getRandomId } from '@/lib/utils'

interface ConfirmModalProps {
  id: string
  title: string
  message: string
  isAlert: boolean
  isPrompt: boolean
  defaultValue: string
  handleCancel: () => void
  handleCheck: (value?: string) => void
}

interface ConfirmModalStore {
  confirmModalPropsList: ConfirmModalProps[]
  openConfirmModal: (options: {
    title?: string
    message: string
    isAlert?: boolean
  }) => Promise<boolean>
  openPromptModal: (options: {
    title?: string
    message: string
    defaultValue?: string
  }) => Promise<string | null>
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
            isPrompt: false,
            defaultValue: '',
            handleCancel: () => resolve(false),
            handleCheck: () => resolve(true),
          }
        ]
      }))
    ),
  openPromptModal: ({ title = "입력", message = "", defaultValue = "" }) =>
    new Promise(resolve =>
      set(state => ({
        confirmModalPropsList: [
          ...state.confirmModalPropsList,
          {
            id: getRandomId('PromptModal'),
            title,
            message,
            isAlert: false,
            isPrompt: true,
            defaultValue,
            handleCancel: () => resolve(null),
            handleCheck: (value?: string) => resolve(value ?? null),
          }
        ]
      }))
    ),
  closeConfirmModal: (id) => set(state => ({
    confirmModalPropsList: state.confirmModalPropsList.filter(confirmModalProps => confirmModalProps.id !== id)
  })),
}))
