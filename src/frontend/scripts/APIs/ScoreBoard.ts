import asset from "../data/assets"
import db from "../data/db"
import peers from "../data/Peers"
import { kel } from "../lib/kel"
import waittime from "../lib/waittime"

interface IScoreBoardUserConfig {
  id: string
  name: string
  map: string
  skin: { [key: string]: string }
}

const regex = /^(?:_|kulon)+/

class ScoreBoardUser {
  readonly id: string
  private el: HTMLDivElement
  private map: HTMLParagraphElement
  constructor({ name, skin, map, id }: IScoreBoardUserConfig) {
    this.id = id
    this.el = kel("div", "usr")

    const avatar = kel("div", "avatar")
    const eskin = kel("div", "hero")
    Object.values(skin).forEach((sk) => {
      const img = new Image()
      img.alt = name
      img.src = asset[sk].src
      eskin.append(img)
    })
    avatar.append(eskin)

    const metadata = kel("div", "metadata")
    const username = kel("p", "name", { e: name })
    this.map = kel("p", "map", { e: map.replace(regex, "") })
    metadata.append(username, this.map)

    this.el.append(avatar, metadata)
  }
  get html(): HTMLDivElement {
    return this.el
  }
  update(newMap: string): void {
    this.map.innerHTML = newMap.replace(regex, "")
  }
  remove(): void {
    this.el.remove()
  }
}

export default class ScoreBoard {
  private data: ScoreBoardUser[] = []
  private el: HTMLDivElement
  constructor(mapId: string) {
    this.el = kel("div", "Pos")

    this.init(mapId)
  }
  private init(mapId: string): void {
    const hero = new ScoreBoardUser({
      name: db.me.username,
      skin: db.me.skin,
      map: mapId,
      id: db.me.id
    })
    this.data.push(hero)
    this.el.append(hero.html)

    peers.arr.forEach((usr) => {
      const user = new ScoreBoardUser({
        name: usr.user.username,
        skin: usr.user.skin,
        map: usr.mapId,
        id: usr.user.id
      })
      this.data.push(user)
      this.el.append(user.html)
    })
  }
  update(userId: string, mapId: string): void {
    const user = this.data.find((usr) => usr.id === userId)
    if (!user) return
    user.update(mapId)
  }
  async destroy(): Promise<void> {
    this.el.classList.add("out")
    await waittime()
    this.el.remove()
    this.data.forEach((usr) => usr.remove())
    this.data.splice(0, this.data.length)
  }
  get html(): HTMLDivElement {
    return this.el
  }
}
