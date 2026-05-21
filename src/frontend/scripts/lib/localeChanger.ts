import { IAny } from "../types/LibTypes"
import lang from "../data/language"
import LocalList from "../data/LocalList"
import xhr from "./xhr"

const validLangs = ["en", "id"]

export async function localeChanger(): Promise<void> {
  const curlang = validLangs.find((l) => l === LocalList.lang) || "id"

  const newLang: IAny = await xhr.forceGet(`/locales/${curlang}.json?v=${Date.now()}`)
  Object.keys(newLang).forEach((k) => (lang[k] = newLang[k]))
  document.documentElement.setAttribute("lang", curlang)
  document.documentElement.lang = curlang
}
