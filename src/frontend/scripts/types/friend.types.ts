export type IRoomType = "isFriend" | "theirReq" | "myReq"
export interface IFriend {
  id: string
  username: string
  joined: number
  trophies: string[]
  skin: Partial<ISkin>
  access: number[]
  isFriend?: boolean
  theirReq?: boolean
  myReq?: boolean
}

export interface IRoom {
  users: string[]
  user: IFriend
  req?: string | null
  isFriend: boolean
}

export interface ISkin {
  Bodies: string
  Eyes: string
  Outfits: string
  Backpacks: string
  Beards: string
  Glasses: string
  Hairstyles: string
  Hats: string
}
