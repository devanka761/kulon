import { IRepTempB } from "../types/validate.types"
import User from "../models/UserModel"
import zender from "../lib/zender"
import { ILobbies } from "../types/peer.types"
import { rNumber } from "../lib/generators"

function generateLobbyCode(existingCode: number[] = []): string {
  let newCode = rNumber(3)
  while (existingCode.includes(newCode)) {
    newCode = rNumber(3)
  }
  return newCode.toString()
}

const lobbies: ILobbies = {}

export function findRandomLobby(uid: string): string {
  const codes = Object.keys(lobbies)

  const lobbyExists = codes.find((k) => lobbies[k].find((usr) => usr === uid))
  if (lobbyExists) return lobbyExists

  const lobbyKey = codes.find((k) => lobbies[k].length < 10) || generateLobbyCode(codes.map(Number))
  if (!lobbies[lobbyKey]) lobbies[lobbyKey] = []
  lobbies[lobbyKey].push(uid)

  return lobbyKey
}

export async function joinRandomLobby(uid: string): Promise<IRepTempB> {
  const lobbyKey = findRandomLobby(uid)

  const users = await User.find({ id: { $in: lobbies[lobbyKey] } }).lean()

  lobbies[lobbyKey]
    .filter((usr) => usr !== uid)
    .forEach((usr) => {
      zender(uid, usr, "lobbyJoin", { user: users.find((p) => p.id === uid) })
    })

  const data = {
    users: users.filter((usr) => usr.id !== uid),
    key: lobbyKey
  }

  return { code: 200, data }
}

export function getCurrentLobby(uid: string): string[] | null {
  const codes = Object.keys(lobbies)
  const lobbyKey = codes.find((k) => lobbies[k].find((usr) => usr === uid))

  if (lobbyKey) return lobbies[lobbyKey]

  return null
}

export function exitCurrentLobby(uid: string): void {
  const codes = Object.keys(lobbies)

  const lobbyKey = codes.find((k) => lobbies[k].find((usr) => usr === uid))
  if (!lobbyKey) return

  const userIdx = lobbies[lobbyKey].findIndex((usr) => usr === uid)
  if (userIdx < 0) return

  lobbies[lobbyKey].splice(userIdx, 1)

  if (lobbies[lobbyKey].length < 1) {
    delete lobbies[lobbyKey]
    return
  }

  const users = lobbies[lobbyKey]
  users.forEach((usr) => zender(uid, usr, "lobbyLeft"))
}
