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

export interface IUser {
  id: string
  username: string
  joined: number
  trophies: string[]
  skin: Partial<ISkin>
  access: number[]
}

export interface ICreateUser {
  username: string
  skin: Partial<ISkin>
}
