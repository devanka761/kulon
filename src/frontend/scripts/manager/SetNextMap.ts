import { CharacterAPI } from "../APIs/CharacterAPI"
import db from "../data/db"
import MapList from "../data/MapList"
import peers from "../data/Peers"
import { IGameObjectData, IGameObjectPerson, IMapList, ISpawnRule } from "../types/MapsTypes"

export default function SetNextMap(nextMap: IMapList, spawnRule: ISpawnRule | null = null): void {
  const userIds = db.job.players?.map((usr) => usr.id) || null
  const userMe = db.me.id

  Object.keys(MapList).forEach((previousMap) => {
    delete MapList[previousMap]
  })
  Object.keys(nextMap).forEach((key) => {
    const clonedMap = JSON.parse(JSON.stringify(nextMap[key]))

    MapList[key] = {
      id: clonedMap.id,
      lowerSrc: clonedMap.lowerSrc,
      upperSrc: clonedMap.upperSrc,
      sound: clonedMap.sound,
      configObjects: clonedMap.configObjects,
      walls: clonedMap.walls || {},
      cutscenes: clonedMap.cutscenes || {},
      safeZone: clonedMap.safeZone,
      footstep: clonedMap.footstep,
      useWeather: clonedMap.useWeather
    }

    Object.values(MapList[key].configObjects).forEach((obj: IGameObjectData) => {
      obj.talk?.forEach((tlk) => {
        const reqs = tlk.required ? "required" : tlk.local_req ? "local_req" : null
        if (reqs && userIds) {
          const hasTemplate = tlk[reqs]?.filter((fg) => fg.includes("{UID}"))
          const convertedTemplates: string[] = []
          hasTemplate?.forEach((fg) => {
            const txt = fg.replace("{UID}", "")
            userIds.forEach((uid) => convertedTemplates.push(`${txt}${uid}`))
            tlk[reqs] = tlk[reqs]?.filter((old_fg) => old_fg !== fg)
          })
          convertedTemplates.forEach((fg) => tlk[reqs]?.push(fg))
        }
        tlk.events.forEach((evt) => {
          if (userMe && (evt.type === "addStates" || evt.type === "removeStates")) {
            const hasTemplate = evt.states?.filter((fg) => fg.includes("{ME}"))
            const convertedTemplates: string[] = []
            hasTemplate?.forEach((fg) => {
              const txt = fg.replace("{ME}", "")
              convertedTemplates.push(`${txt}${userMe}`)
              evt.states = evt.states?.filter((old_fg) => old_fg !== fg)
            })
            convertedTemplates.forEach((fg) => evt.states?.push(fg))
          }
        })
      })
      obj.drops?.forEach((drops) => {
        const reqs = drops.required ? "required" : drops.local_req ? "local_req" : null
        if (reqs && userIds) {
          const hasTemplate = drops[reqs]?.filter((fg) => fg.includes("{UID}"))
          const convertedTemplates: string[] = []
          hasTemplate?.forEach((fg) => {
            const txt = fg.replace("{UID}", "")
            userIds.forEach((uid) => convertedTemplates.push(`${txt}${uid}`))
            drops[reqs] = drops[reqs]?.filter((old_fg) => old_fg !== fg)
          })
          convertedTemplates.forEach((fg) => drops[reqs]?.push(fg))
        }
        drops.events.forEach((evt) => {
          if (userMe && (evt.type === "addStates" || evt.type === "removeStates")) {
            const hasTemplate = evt.states?.filter((fg) => fg.includes("{ME}"))
            const convertedTemplates: string[] = []
            hasTemplate?.forEach((fg) => {
              const txt = fg.replace("{ME}", "")
              convertedTemplates.push(`${txt}${userMe}`)
              evt.states = evt.states?.filter((old_fg) => old_fg !== fg)
            })
            convertedTemplates.forEach((fg) => evt.states?.push(fg))
          }
        })
      })
    })

    Object.values(MapList[key].cutscenes).forEach((obj) => {
      obj.forEach((tlk) => {
        const reqs = tlk.required ? "required" : tlk.local_req ? "local_req" : null
        if (reqs && userIds) {
          const hasTemplate = tlk[reqs]?.filter((fg) => fg.includes("{UID}"))
          const convertedTemplates: string[] = []
          hasTemplate?.forEach((fg) => {
            const txt = fg.replace("{UID}", "")
            userIds.forEach((uid) => convertedTemplates.push(`${txt}${uid}`))
            tlk[reqs] = tlk[reqs]?.filter((old_fg) => old_fg !== fg)
          })
          convertedTemplates.forEach((fg) => tlk[reqs]?.push(fg))
        }
        tlk.events.forEach((evt) => {
          if (userMe && (evt.type === "addStates" || evt.type === "removeStates")) {
            const hasTemplate = evt.states?.filter((fg) => fg.includes("{ME}"))
            const convertedTemplates: string[] = []
            hasTemplate?.forEach((fg) => {
              const txt = fg.replace("{ME}", "")
              convertedTemplates.push(`${txt}${userMe}`)
              evt.states = evt.states?.filter((old_fg) => old_fg !== fg)
            })
            convertedTemplates.forEach((fg) => evt.states?.push(fg))
          }
        })
      })
    })
  })

  if (!spawnRule) {
    Object.keys(MapList).forEach((k) => {
      MapList[k].configObjects.hero.src = Object.values(db.me.skin)
      MapList[k].configObjects.hero.canControlled = true
    })
    return
  }

  db.job.users
    ?.sort((a, b) => {
      const player_a = db.job.players!.find((pl) => a.id === pl.id)
      const player_b = db.job.players!.find((pl) => b.id === pl.id)

      if (player_a!.ts < player_b!.ts) return -1
      if (player_a!.ts > player_b!.ts) return 1
      return 0
    })
    .forEach((user, i) => {
      if (user.id !== userMe) {
        const peer = peers.get(user.id) as CharacterAPI
        peer.setMapId(spawnRule.area)
        peer.setX(spawnRule.x * 16)
        peer.setY(spawnRule.y * 16)
        peer.setCustomCoor(spawnRule.inc, (spawnRule[spawnRule.inc] + (i + 1 + i)) * 16)
        return
      }

      const heroConfig: IGameObjectPerson = {
        type: "Person",
        x: spawnRule.x,
        y: spawnRule.y,
        direction: spawnRule.direction,
        src: Object.values(db.me.skin),
        canControlled: true
      }
      heroConfig[spawnRule.inc] = spawnRule[spawnRule.inc] + (i + 1 + i)

      Object.keys(MapList).forEach((k) => (MapList[k].configObjects.hero = heroConfig))
    })
}
