import { ISival } from "../types/lib.types"
import lang from "../data/language"
import LocalList from "../data/LocalList"
import xhr from "./xhr"

const validLangs = ["en", "id"]

export async function localeChanger(): Promise<void> {
  const curlang = validLangs.find((l) => l === LocalList.lang) || "id"

  const newLang = (await xhr.get(`/locales/${curlang}.json`)) as ISival
  Object.keys(newLang).forEach((k) => (lang[k] = newLang[k]))
  document.documentElement.setAttribute("lang", curlang)
  document.documentElement.lang = curlang
}
