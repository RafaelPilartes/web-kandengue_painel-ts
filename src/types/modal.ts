export type modalCreateType<T> = {
  baseInfo?: T
  handleUpdateListing?: () => void
  modalCreateRowIsOpen: boolean
  setModalCreateRowIsOpen: (e: boolean) => void
}

export type modalEditType<T> = {
  baseInfo: T
  modalEditRowIsOpen: boolean
  handleUpdateListing?: () => void
  setModalEditRowIsOpen: (e: boolean) => void
}

export type modalSeeType<T> = {
  baseInfo: T | any
  modalSeeRowIsOpen: boolean
  setModalSeeRowIsOpen: (e: boolean) => void
}

export type modalViewType<T> = {
  baseInfo: T | any
  modalViewRowIsOpen: boolean
  setModalViewRowIsOpen: (e: boolean) => void
}
