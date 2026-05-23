export interface IModalAlertConfig {
  ic: string
  msg: string
  okx: string
  ok?(): void
}

export interface IModalConfirmConfig extends IModalAlertConfig {
  cancelx: string
  cancel?(): void
}

export interface IModalPromptConfig extends IModalConfirmConfig {
  max?: number
  tarea: boolean
  val?: string
  pholder?: string
  iregex?: RegExp
}

interface ISelectionItem {
  id: string
  label: string
  activated?: boolean
}

export interface IModalSelectConfig extends IModalConfirmConfig {
  items: ISelectionItem[]
}
