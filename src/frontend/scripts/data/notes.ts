import { ILocale } from "../types/lib.types"

interface INote {
  name: ILocale
  text: ILocale[]
}

interface INotes {
  [key: string]: INote
}

const notelist: INotes = {}

export function paperAdd(paperId: string, paperPage: ILocale[], paperName: ILocale): void {
  notelist[paperId] = {
    name: { ...paperName },
    text: [...paperPage]
  }
}

export function paperGet(paperId: string): INote | undefined {
  return notelist[paperId] || undefined
}

export function paperRemove(paperId: string): void {
  delete notelist[paperId]
}

export function paperClear(): void {
  Object.keys(notelist).forEach((k) => {
    delete notelist[k]
  })
}
